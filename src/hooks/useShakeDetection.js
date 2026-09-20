import { useState, useEffect } from 'react';

export const useShakeDetection = (onShake, threshold = 15) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState('');

  // Required for iOS 13+ — must be called from a user gesture
  const requestPermission = async () => {
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
      // Android & desktop: no explicit permission needed
      setHasPermission(true);
    }
  };

  useEffect(() => {
    if (!hasPermission) return;

    let lastX = 0, lastY = 0, lastZ = 0;
    let lastUpdate = 0;
    let shakeTimes = [];
    let cooldownUntil = 0;

    const handleMotion = (event) => {
      const a = event.accelerationIncludingGravity;
      if (!a || a.x === null) return;

      const now = Date.now();
      if (now < cooldownUntil) return;

      if (now - lastUpdate > 100) {
        const speed = Math.abs(a.x + a.y + a.z - lastX - lastY - lastZ) / (now - lastUpdate) * 10000;
        lastUpdate = now;
        lastX = a.x; lastY = a.y; lastZ = a.z;

        if (speed > threshold) {
          shakeTimes = shakeTimes.filter(t => now - t < 2000);
          shakeTimes.push(now);

          if (shakeTimes.length >= 3) {
            onShake();
            shakeTimes = [];
            cooldownUntil = now + 3000;
          }
        }
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [hasPermission, onShake, threshold]);

  return { requestPermission, hasPermission, error };
};
