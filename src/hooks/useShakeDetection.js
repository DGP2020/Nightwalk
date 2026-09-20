import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useShakeDetection
 *
 * Robust, false-alarm resistant, rhythmic 3-shake kinetic gesture detector.
 *
 * Requirements:
 * - 3 distinct, vigorous shake motions in rhythm within 2.5 seconds.
 * - Peak-valley hysteresis: each shake must reach peak acceleration (> 16.5 m/s²)
 *   and recover below valley threshold (< 7.0 m/s²) before the next peak counts.
 * - Minimum debounce: >= 220ms between peak registrations to prevent counting a single swing as multiple shakes.
 * - Maximum rhythm interval: <= 1200ms between consecutive shakes; otherwise resets.
 * - Pauses automatically when `enabled === false` (e.g. during countdown or active SOS).
 * - Applies a 2.5s grace cooldown after resuming to prevent re-triggering from cancellation taps.
 * - Provides haptic confirmation upon each registered shake (buzz 1 -> buzz 2 -> buzz-buzz 3 -> countdown).
 */
export const useShakeDetection = (onShake, options = {}) => {
  const config = typeof options === 'number' ? { threshold: options } : options;
  const {
    threshold = 16.5,
    valleyThreshold = 7.0,
    enabled = true,
  } = config;

  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState('');
  const [shakeCount, setShakeCount] = useState(0);

  const onShakeRef = useRef(onShake);
  useEffect(() => {
    onShakeRef.current = onShake;
  });

  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Request permission (iOS 13+)
  const requestPermission = useCallback(async () => {
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function'
    ) {
      try {
        const state = await DeviceMotionEvent.requestPermission();
        if (state === 'granted') {
          setHasPermission(true);
        } else {
          setError('Motion permission denied. Shake-to-SOS will not work.');
        }
      } catch (err) {
        setError('Error requesting motion permission. Make sure the app is served over HTTPS.');
        console.error(err);
      }
    } else {
      // Android & desktop: automatically ready
      setHasPermission(true);
    }
  }, []);

  useEffect(() => {
    if (!hasPermission) return;

    let peaks = [];
    let isWaitingForValley = false;
    let lastPeakTime = 0;
    let cooldownUntil = 0;
    let wasEnabled = enabledRef.current;

    // Previous sample for delta calculations
    let prevX = null;
    let prevY = null;
    let prevZ = null;

    const handleMotion = (event) => {
      const isCurrentlyEnabled = enabledRef.current;
      const now = Date.now();

      // If just re-enabled (e.g. user just cancelled a countdown), impose a 2.5s grace cooldown
      if (!wasEnabled && isCurrentlyEnabled) {
        cooldownUntil = now + 2500;
        peaks = [];
        isWaitingForValley = false;
        setShakeCount(0);
      }
      wasEnabled = isCurrentlyEnabled;

      if (!isCurrentlyEnabled || now < cooldownUntil) {
        return;
      }

      // Check cadence timeout: if more than 1200ms elapsed since last peak, reset rhythm
      if (peaks.length > 0 && now - lastPeakTime > 1200) {
        peaks = [];
        isWaitingForValley = false;
        setShakeCount(0);
      }

      // Measure acceleration
      let magnitude = 0;

      // 1. Prefer pure linear acceleration if available (excludes gravity)
      const lin = event.acceleration;
      if (
        lin &&
        lin.x !== null &&
        (lin.x !== 0 || lin.y !== 0 || lin.z !== 0)
      ) {
        magnitude = Math.sqrt(lin.x * lin.x + lin.y * lin.y + lin.z * lin.z);
      } else {
        // 2. Fallback: accelerationIncludingGravity with dynamic deviation from 1g
        const a = event.accelerationIncludingGravity;
        if (!a || a.x === null) return;

        const currentMag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
        const dynamicDeviation = Math.abs(currentMag - 9.80665);

        let deltaMag = 0;
        if (prevX !== null) {
          const dx = a.x - prevX;
          const dy = a.y - prevY;
          const dz = a.z - prevZ;
          deltaMag = Math.sqrt(dx * dx + dy * dy + dz * dz);
        }
        prevX = a.x;
        prevY = a.y;
        prevZ = a.z;

        magnitude = Math.max(dynamicDeviation, deltaMag);
      }

      // Peak-Valley State Machine
      if (isWaitingForValley) {
        // Must drop below valley threshold to complete the stroke
        if (magnitude < valleyThreshold) {
          isWaitingForValley = false;
        }
      } else {
        // Check for new vigorous peak
        if (magnitude >= threshold) {
          // Minimum debounce between peaks: at least 220ms
          if (now - lastPeakTime >= 220) {
            peaks.push(now);
            lastPeakTime = now;
            isWaitingForValley = true;

            const currentCount = peaks.length;
            setShakeCount(currentCount);

            // Progressive haptic feedback
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              if (currentCount === 1) navigator.vibrate(40);
              else if (currentCount === 2) navigator.vibrate(60);
              else if (currentCount >= 3) navigator.vibrate([100, 50, 150]);
            }

            // If 3 rhythmic peaks reached within 2.5s window
            if (currentCount >= 3) {
              cooldownUntil = now + 3500;
              peaks = [];
              isWaitingForValley = false;
              setShakeCount(0);
              if (typeof onShakeRef.current === 'function') {
                onShakeRef.current();
              }
            }
          }
        }
      }
    };

    window.addEventListener('devicemotion', handleMotion, { passive: true });
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [hasPermission, threshold, valleyThreshold]);

  return { requestPermission, hasPermission, error, shakeCount };
};
