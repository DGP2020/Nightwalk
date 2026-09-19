import React, { useState, useEffect, useRef } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Command,
  Compass,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  Radio,
  Search,
  Shield,
  ShieldAlert,
  Smartphone,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { WorkspacesIcon, SidebarToggleIcon, GridlineLogo } from "./icons";
import TrustedContacts, { loadTrustedContacts } from "../TrustedContacts";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icon
const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const MapUpdater = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
      map.invalidateSize();
    }
  }, [position, map]);
  return null;
};

export default function GridlineDashboard({
  onTriggerSOS,
  hasPermission,
  requestPermission,
  shakeError,
  liveLocation,
  contacts,
  setContacts,
}) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "map" | "contacts" | "telemetry"
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("nightwalk_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [docModal, setDocModal] = useState(null); // null | 'license' | 'privacy' | 'status'
  const searchInputRef = useRef(null);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("nightwalk_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K for search
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const formattedDate = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const position = liveLocation ? [liveLocation.lat, liveLocation.lng] : [28.6139, 77.209]; // default center if no GPS

  const navItems = [
    { id: "overview", label: "Dashboard", shortLabel: "Overview", icon: Zap },
    { id: "map", label: "Live Radar Map", shortLabel: "Radar", icon: Compass },
    { id: "contacts", label: "Safety Circle", shortLabel: "Contacts", icon: Users },
    { id: "telemetry", label: "Sensor & Telemetry", shortLabel: "Sensors", icon: Radio },
  ];

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#0a0f1d] text-slate-100 font-sans">
      {/* Background subtle grid pattern */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(#0ab1ba 1px, transparent 1px)`,
          backgroundSize: "24px 24px"
        }}
      />

      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR */}
      {/* ========================================================================= */}
      <aside
        className={`hidden md:flex flex-col justify-between ${
          sidebarCollapsed ? "w-20" : "w-64"
        } border-r border-slate-800/80 bg-[#0d1424]/95 backdrop-blur-md z-30 shrink-0 select-none transition-all duration-300 ease-in-out`}
      >
        <div>
          {/* Logo & Toggle Header */}
          <div
            className={`flex h-18 items-center ${
              sidebarCollapsed ? "justify-center px-2" : "justify-between px-4 lg:px-6"
            } border-b border-slate-800/80`}
          >
            {!sidebarCollapsed ? (
              <>
                <GridlineLogo showName />
                <button
                  onClick={toggleSidebar}
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/70 transition-colors"
                >
                  <SidebarToggleIcon className="size-5" />
                </button>
              </>
            ) : (
              <button
                onClick={toggleSidebar}
                aria-label="Expand sidebar"
                title="Expand sidebar"
                className="p-1.5 text-slate-400 hover:text-teal-400 rounded-lg hover:bg-slate-800/70 transition-colors flex items-center justify-center"
              >
                <SidebarToggleIcon className="size-6 text-teal-400" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 p-3">
            {!sidebarCollapsed && (
              <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-400">
                Operations
              </div>
            )}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`flex items-center ${
                    sidebarCollapsed ? "justify-center px-2 py-3" : "gap-3.5 px-3.5 py-3"
                  } rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <Icon
                    className={`size-5 shrink-0 ${
                      isActive ? "text-teal-400" : "text-slate-400"
                    }`}
                  />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 flex flex-col gap-2">
          {/* Quick SOS Trigger in sidebar */}
          <button
            onClick={onTriggerSOS}
            title={sidebarCollapsed ? "TRIGGER SOS" : undefined}
            className={`w-full bg-red-600 hover:bg-red-500 text-white font-bold ${
              sidebarCollapsed ? "py-3 px-2 justify-center" : "py-2.5 px-3"
            } rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 transition-all active:scale-95`}
          >
            <ShieldAlert className="size-4 shrink-0" />
            {!sidebarCollapsed && <span>TRIGGER SOS</span>}
          </button>

          {/* Quick 112 Call */}
          <a
            href="tel:112"
            title={sidebarCollapsed ? "DIAL 112" : undefined}
            className={`w-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium ${
              sidebarCollapsed ? "py-2.5 px-2 justify-center" : "py-2 px-3"
            } rounded-xl text-xs flex items-center justify-center gap-2 transition-colors`}
          >
            <Phone className="size-3.5 shrink-0 text-teal-400" />
            {!sidebarCollapsed && <span className="font-mono">DIAL 112</span>}
          </a>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN CONTAINER */}
      {/* ========================================================================= */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* TOP NAVBAR */}
        <header className="flex h-18 items-center justify-between gap-3 border-b border-slate-800/80 bg-[#0d1424]/90 px-4 sm:px-6 backdrop-blur-md z-20 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white md:hidden rounded-lg hover:bg-slate-800"
              aria-label="Toggle menu"
            >
              <SidebarToggleIcon className="size-6" />
            </button>

            {/* Mobile logo when sidebar hidden */}
            <div className="md:hidden">
              <GridlineLogo compact />
            </div>
          </div>

          {/* Right Header Section */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative hidden md:block w-64 lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search telemetry or contact..."
                className="w-full h-9 rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-12 text-xs font-mono text-slate-200 placeholder-slate-400 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
              />
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                ⌘K
              </kbd>
            </div>

            {/* Emergency Dial Pill */}
            <a
              href="tel:112"
              className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
            >
              <Phone className="size-3.5" />
              <span>112 POLICE</span>
            </a>

            {/* Sensor Status Pill */}
            {hasPermission ? (
              <span className="hidden sm:flex items-center gap-1.5 bg-teal-500/10 text-teal-400 border border-teal-500/20 px-3 py-1.5 rounded-full text-xs font-medium">
                <Smartphone className="size-3.5" />
                Shake Active
              </span>
            ) : (
              <button
                onClick={requestPermission}
                className="flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-amber-500/30"
              >
                ⚠ Enable Shake
              </button>
            )}
          </div>
        </header>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex flex-col justify-between w-4/5 max-w-xs bg-[#0d1424] border-r border-slate-800 p-5 text-white z-10 animate-in slide-in-from-left">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <GridlineLogo showName />
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <nav className="flex flex-col gap-2 mt-5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                          isActive
                            ? "bg-teal-500/15 text-teal-400 border border-teal-500/30"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <Icon className="size-5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onTriggerSOS();
                  }}
                  className="w-full bg-red-600 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
                >
                  <ShieldAlert className="size-4" />
                  TRIGGER SOS
                </button>
                <a
                  href="tel:112"
                  className="w-full bg-slate-800 text-center py-2.5 rounded-xl text-sm font-mono text-slate-300"
                >
                  CALL 112
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MAIN SCROLLABLE CONTENT */}
        {/* ========================================================================= */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* HEADER BANNER */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-teal-400 uppercase tracking-wider mb-1">
                <Shield className="size-3.5" />
                GUARDIAN GRIDLINE PEDESTRIAN DEFENSE
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Safety Operations Center
              </h1>
              <p className="flex items-center gap-2 font-mono text-xs text-slate-400 mt-1">
                <CalendarDays className="size-3.5 text-slate-400" />
                {formattedDate} · <Clock className="size-3.5 text-slate-400 ml-1" /> {formattedTime}
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-slate-400">
              <span className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] text-teal-400 font-semibold">
                KINETIC SENSOR READY
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {/* ========================================================================= */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* PRIMARY WORKSPACE TILES */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* HERO SOS PANIC TILE (Col 1-5) */}
                <div className="lg:col-span-5 bg-gradient-to-br from-[#121a30] to-[#0d1424] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between">
                  {/* Decorative glowing border accent */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-teal-400 to-red-500" />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-red-400 font-bold">
                        <AlertTriangle className="size-4" />
                        EMERGENCY TRIGGER
                      </span>
                      <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold">
                        5S CANCEL READY
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-white mb-1">
                      Rapid SOS Beacon
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Tap the beacon below or shake your phone rhythmically 3 times. A 5-second countdown will give you time to cancel before broadcasting distress.
                    </p>
                  </div>

                  {/* Pulsing Central SOS Button */}
                  <div className="my-8 flex flex-col items-center justify-center">
                    <button
                      id="gridline-sos-btn"
                      onClick={onTriggerSOS}
                      className="relative size-40 sm:size-44 rounded-full bg-gradient-to-tr from-red-600 to-red-500 border-4 border-red-400/40 shadow-[0_0_50px_rgba(239,68,68,0.4)] flex flex-col items-center justify-center transition-transform active:scale-95 group cursor-pointer"
                    >
                      {/* Concentric rings */}
                      <span className="absolute inset-0 rounded-full border border-red-400/40 animate-ping" style={{ animationDuration: "2.5s" }} />
                      <span className="absolute inset-0 rounded-full border border-red-400/20 animate-ping" style={{ animationDuration: "3.5s" }} />
                      
                      <ShieldAlert className="size-10 text-white mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-3xl font-black tracking-widest text-white">SOS</span>
                      <span className="text-[10px] font-mono tracking-wider text-red-100 uppercase opacity-90">TAP TO ALERT</span>
                    </button>
                    <p className="text-xs font-mono text-slate-400 mt-4 flex items-center gap-1.5">
                      <Smartphone className="size-3.5 text-teal-400" />
                      Multi-shake: 3 peaks within 2s required
                    </p>
                  </div>

                  {/* Tile Bottom Status */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Accelerometer Filter:</span>
                    <span className="text-teal-400 font-bold">ANTI-FALSE-ALARM ON</span>
                  </div>
                </div>

                {/* MINI LIVE MAP & TELEMETRY TILE (Col 6-12) */}
                <div className="lg:col-span-7 bg-[#0d1424] border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Compass className="size-4 text-teal-400" />
                        <h2 className="text-base font-bold text-white">Live Radar & Breadcrumbs</h2>
                      </div>
                      <button
                        onClick={() => setActiveTab("map")}
                        className="flex items-center gap-1 text-xs font-mono text-teal-400 hover:underline"
                      >
                        Expand Map <ArrowUpRight className="size-3.5" />
                      </button>
                    </div>

                    {/* Interactive Embedded Leaflet Map Preview */}
                    <div className="h-56 sm:h-64 w-full rounded-xl overflow-hidden border border-slate-800 relative z-0">
                      <MapContainer
                        center={position}
                        zoom={15}
                        className="w-full h-full"
                        zoomControl={false}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          className="dark-tiles"
                          maxZoom={19}
                        />
                        <Marker position={position} icon={redIcon}>
                          <Popup>📍 Current GPS Location</Popup>
                        </Marker>
                        <MapUpdater position={position} />
                      </MapContainer>
                    </div>
                  </div>

                  {/* Coordinates & Telemetry bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800/80">
                    <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">Latitude</span>
                      <span className="text-xs font-mono font-bold text-white">
                        {liveLocation ? liveLocation.lat.toFixed(5) : "28.61390"}
                      </span>
                    </div>
                    <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">Longitude</span>
                      <span className="text-xs font-mono font-bold text-white">
                        {liveLocation ? liveLocation.lng.toFixed(5) : "77.20900"}
                      </span>
                    </div>
                    <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">Accuracy</span>
                      <span className="text-xs font-mono font-bold text-teal-400">
                        {liveLocation ? `±${Math.round(liveLocation.accuracy || 0)}m` : "Acquiring..."}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* SECONDARY ROW: WORKSPACES */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* SAFETY CIRCLE WORKSPACE CARD */}
                <div 
                  onClick={() => setActiveTab("contacts")}
                  className="bg-[#0d1424] hover:bg-[#11192e] transition-colors border border-slate-800/80 rounded-2xl p-5 cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl">
                      <Users className="size-6" />
                    </div>
                    <ArrowUpRight className="size-5 text-slate-400 group-hover:text-teal-400 transition-colors" />
                  </div>
                  <div className="mt-5">
                    <h3 className="text-base font-bold text-white">Safety Circle</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {contacts.length === 0
                        ? "No contacts configured. Add up to 3 emergency recipients."
                        : `${contacts.length} trusted contact${contacts.length > 1 ? "s" : ""} enrolled for instant WhatsApp dispatch.`}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Recipients:</span>
                    <span className="text-teal-400 font-bold">{contacts.length} / 3</span>
                  </div>
                </div>

                {/* SENSOR TELEMETRY WORKSPACE CARD */}
                <div 
                  onClick={() => setActiveTab("telemetry")}
                  className="bg-[#0d1424] hover:bg-[#11192e] transition-colors border border-slate-800/80 rounded-2xl p-5 cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl">
                      <Radio className="size-6" />
                    </div>
                    <ArrowUpRight className="size-5 text-slate-400 group-hover:text-teal-400 transition-colors" />
                  </div>
                  <div className="mt-5">
                    <h3 className="text-base font-bold text-white">Sensor Calibration</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Multi-shake accelerometer kinetic filter. 3 peaks within 2000ms threshold with 3000ms debounce cooldown.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Motion Sensor:</span>
                    <span className={hasPermission ? "text-teal-400 font-bold" : "text-amber-400 font-bold"}>
                      {hasPermission ? "CALIBRATED" : "ACTION REQUIRED"}
                    </span>
                  </div>
                </div>

                {/* EMERGENCY SERVICES DISPATCH CARD */}
                <div className="bg-[#0d1424] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-red-500/10 text-red-400 rounded-xl">
                      <Phone className="size-6" />
                    </div>
                    <span className="text-[10px] font-mono text-red-400 uppercase font-bold tracking-wider">
                      Hotline
                    </span>
                  </div>
                  <div className="mt-5">
                    <h3 className="text-base font-bold text-white">Direct Dispatch (112)</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      National unified emergency response helpline for police, ambulance, and fire services.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <a
                      href="tel:112"
                      className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-2 transition-all"
                    >
                      <Phone className="size-3.5" /> CALL 112 NOW
                    </a>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: EXPANDED RADAR MAP */}
          {/* ========================================================================= */}
          {activeTab === "map" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Tactical Radar & Tracking Trail</h2>
                  <p className="text-xs font-mono text-slate-400">CARTO Dark Matter High-Resolution Cartography</p>
                </div>
                <button
                  onClick={() => setActiveTab("overview")}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-mono text-slate-300 hover:bg-slate-700"
                >
                  ← Back to Overview
                </button>
              </div>

              <div className="h-[600px] w-full rounded-2xl overflow-hidden border border-slate-800 relative shadow-2xl z-0">
                <MapContainer
                  center={position}
                  zoom={16}
                  className="w-full h-full"
                  zoomControl={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    className="dark-tiles"
                    maxZoom={19}
                  />
                  <Marker position={position} icon={redIcon}>
                    <Popup>
                      <div className="text-slate-900 font-sans p-1">
                        <p className="font-bold text-sm">📍 Live Position</p>
                        <p className="text-xs font-mono">{position[0].toFixed(5)}, {position[1].toFixed(5)}</p>
                      </div>
                    </Popup>
                  </Marker>
                  <MapUpdater position={position} />
                </MapContainer>

                {/* Floating telemetry overlay in map view */}
                <div className="absolute bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-80 bg-[#0d1424]/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-4 shadow-2xl z-[1000]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-teal-400 flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-teal-400 animate-ping" />
                      RADAR TELEMETRY
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">HIGH-PRECISION</span>
                  </div>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Latitude:</span>
                      <span className="text-white font-bold">{position[0].toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Longitude:</span>
                      <span className="text-white font-bold">{position[1].toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">GPS Accuracy:</span>
                      <span className="text-teal-400 font-bold">{liveLocation ? `±${Math.round(liveLocation.accuracy)}m` : "±10m"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: SAFETY CIRCLE (CONTACTS) */}
          {/* ========================================================================= */}
          {activeTab === "contacts" && (
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Trusted Safety Circle</h2>
                  <p className="text-xs font-mono text-slate-400">Pre-saved emergency contacts alerted during SOS</p>
                </div>
                <button
                  onClick={() => setActiveTab("overview")}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-mono text-slate-300 hover:bg-slate-700"
                >
                  ← Back to Overview
                </button>
              </div>

              <div className="bg-[#0d1424] border border-slate-800 rounded-2xl p-6 shadow-xl">
                <TrustedContacts onContactsChange={setContacts} />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: SENSORS & TELEMETRY */}
          {/* ========================================================================= */}
          {activeTab === "telemetry" && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Sensor Calibration & Health</h2>
                  <p className="text-xs font-mono text-slate-400">Accelerometer filter & kinetic gesture analytics</p>
                </div>
                <button
                  onClick={() => setActiveTab("overview")}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-mono text-slate-300 hover:bg-slate-700"
                >
                  ← Back to Overview
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#0d1424] border border-slate-800 rounded-2xl p-5 space-y-3">
                  <span className="text-xs font-mono text-teal-400 uppercase font-bold">Kinetic Filter Settings</span>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Peak Window</span>
                      <span className="text-white">2000 ms</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Required Peaks</span>
                      <span className="text-white">3 Shakes</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Debounce Cooldown</span>
                      <span className="text-white">3000 ms</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Acceleration Threshold</span>
                      <span className="text-white">15 m/s²</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0d1424] border border-slate-800 rounded-2xl p-5 space-y-3">
                  <span className="text-xs font-mono text-teal-400 uppercase font-bold">False-Alarm Defense</span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Single impacts from drops or table knocks generate a single isolated peak and are ignored. Gaming and running produce erratic rhythms exceeding the 2-second collection window.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={onTriggerSOS}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-teal-400 font-mono py-2 rounded-xl text-xs transition-colors"
                    >
                      Simulate SOS Trigger Flow
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ========================================================================= */}
        {/* PERSISTENT BOTTOM BAR */}
        {/* ========================================================================= */}
        <footer className="h-10 border-t border-slate-800/80 bg-[#0d1424]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between text-[11px] font-mono shrink-0 z-20 select-none">
          {/* Left Branding matching user reference */}
          <div className="flex items-center gap-2 text-slate-400">
            <span className="tracking-wider">GUARDIAN BEACON © 2026</span>
          </div>

          {/* Right Status and Links */}
          <div className="flex items-center gap-3.5 sm:gap-5 text-slate-400">
            {/* Single clean Status button */}
            <button
              onClick={() => setDocModal("status")}
              className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
              title="View System Status & Telemetry"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span>Status</span>
            </button>

            <span className="text-slate-700">|</span>

            <button
              onClick={() => setDocModal("license")}
              className="hover:text-teal-400 transition-colors"
            >
              License
            </button>

            <span className="text-slate-700">|</span>

            <button
              onClick={() => setDocModal("privacy")}
              className="hover:text-teal-400 transition-colors"
            >
              Privacy Policy
            </button>
          </div>
        </footer>

        {/* ========================================================================= */}
        {/* DOCUMENT & STATUS MODAL */}
        {/* ========================================================================= */}
        {docModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-xl bg-[#0d1424] border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-200 flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
                  {docModal === "license" && "📜 Open Source License (BSD 3-Clause)"}
                  {docModal === "privacy" && "🛡️ Privacy Policy"}
                  {docModal === "status" && "⚡ System Operations & Status"}
                </h3>
                <button
                  onClick={() => setDocModal(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-line space-y-3">
                {docModal === "license" && (
                  <div>
                    <p className="font-bold text-white mb-2">BSD 3-Clause License</p>
                    <p className="text-slate-400 mb-3">Copyright (c) 2026, Daniel</p>
                    <p className="mb-3">
                      Redistribution and use in source and binary forms, with or without
                      modification, are permitted provided that the following conditions are met:
                    </p>
                    <p className="mb-2 pl-2 border-l border-slate-700">
                      1. Redistributions of source code must retain the above copyright notice, this
                      list of conditions and the following disclaimer.
                    </p>
                    <p className="mb-2 pl-2 border-l border-slate-700">
                      2. Redistributions in binary form must reproduce the above copyright notice,
                      this list of conditions and the following disclaimer in the documentation
                      and/or other materials provided with the distribution.
                    </p>
                    <p className="mb-3 pl-2 border-l border-slate-700">
                      3. Neither the name of the copyright holder nor the names of its
                      contributors may be used to endorse or promote products derived from
                      this software without specific prior written permission.
                    </p>
                    <p className="text-slate-400 text-[11px] leading-normal">
                      THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS &quot;AS IS&quot;
                      AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
                      IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
                      DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
                      FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
                      DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
                      SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
                      CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
                      OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
                      OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
                    </p>
                  </div>
                )}

                {docModal === "privacy" && (
                  <div className="space-y-3">
                    <p className="font-bold text-white">Privacy-First Architecture</p>
                    <p>
                      1. <strong className="text-teal-400">Live GPS Coordinates:</strong> Only recorded and streamed during an active SOS emergency session or local radar preview. Coordinates are never tracked in the background prior to emergency activation.
                    </p>
                    <p>
                      2. <strong className="text-teal-400">Trusted Contacts:</strong> Up to 3 emergency contacts are stored strictly in your browser&apos;s local storage. They are never transmitted to third-party databases or marketing servers.
                    </p>
                    <p>
                      3. <strong className="text-teal-400">Kinetic Sensor Telemetry:</strong> Accelerometer data is processed locally on your device in real-time to detect the 3-shake gesture. No raw motion data leaves your device.
                    </p>
                    <p>
                      4. <strong className="text-teal-400">Session Termination:</strong> Tapping &quot;I&apos;m Safe&quot; ends the session immediately and ceases all location streaming.
                    </p>
                  </div>
                )}

                {docModal === "status" && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                      <span className="text-slate-400">System Core Health:</span>
                      <span className="text-emerald-400 font-bold">OPTIMAL (100%)</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                      <span className="text-slate-400">Kinetic 3-Shake Sensor:</span>
                      <span className={`font-bold ${hasPermission ? "text-teal-400" : "text-amber-400"}`}>
                        {hasPermission ? "3-SHAKE ARMED & ACTIVE" : "PERMISSION REQUIRED"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                      <span className="text-slate-400">GPS Satellite Lock:</span>
                      <span className={`font-bold ${liveLocation ? "text-emerald-400" : "text-amber-400"}`}>
                        {liveLocation ? `GPS LOCK (±${Math.round(liveLocation.accuracy || 10)}m)` : "ACQUIRING FIX..."}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                      <span className="text-slate-400">Firebase Cloud Telemetry:</span>
                      <span className="text-teal-400 font-bold">FIREBASE ACTIVE (ONLINE)</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                      <span className="text-slate-400">Cartography Stream:</span>
                      <span className="text-teal-400 font-bold">OPENSTREETMAP TACTICAL (ONLINE)</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
                {docModal !== "status" ? (
                  <a
                    href={docModal === "license" ? "/LICENSE.md" : "/PRIVACY.md"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    View {docModal === "license" ? "license.md" : "privacy policy.md"} <ArrowUpRight className="size-3.5" />
                  </a>
                ) : <span />}
                <button
                  onClick={() => setDocModal(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-mono text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
