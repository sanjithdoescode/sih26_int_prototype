import React, { useState } from 'react';
import { useLiveBusStream } from './hooks/useLiveBusStream.js';
import { Header } from './components/Header.jsx';
import { MetricsBar } from './components/MetricsBar.jsx';
import { RouteSelector } from './components/RouteSelector.jsx';
import { LiveMap } from './components/LiveMap.jsx';
import { BusDrawer } from './components/BusDrawer.jsx';
import { ConductorKiosk } from './components/ConductorKiosk.jsx';
import { LiveTicketTicker } from './components/LiveTicketTicker.jsx';
import { Legend } from './components/Legend.jsx';
import { StopInfoModal } from './components/StopInfoModal.jsx';
import {
  Cpu, ShieldAlert, CheckCircle2, Sparkles,
  Target, ArrowRight, Zap, Globe, Database, Server, Smartphone,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);

  const { routes, buses, ticketEvents, metrics, isConnected, lastUpdated, issueTicket, controlSimulator } =
    useLiveBusStream();

  const activeBus = buses.find((b) => b.bus_id === selectedBus?.bus_id) || selectedBus;

  const handleSelectBus  = (bus)  => setSelectedBus(bus);
  const handleSelectStop = (stop) => setSelectedStop(stop);
  const handleOpenConductorForBus = (bus) => { setSelectedBus(bus); setActiveTab('kiosk'); };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh', width: '100vw',
      overflow: 'hidden', background: 'var(--bg-base)',
    }}>
      {/* ── Header (desktop top bar + mobile top bar + mobile bottom nav) ── */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} isConnected={isConnected} lastUpdated={lastUpdated} />

      {/* ── Metrics Bar ── */}
      <MetricsBar metrics={metrics} buses={buses} controlSimulator={controlSimulator} />

      {/* ── Main Content Area ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* MAP TAB */}
        {activeTab === 'map' && (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <LiveMap
              routes={routes}
              buses={buses}
              selectedRouteId={selectedRouteId}
              selectedBus={activeBus}
              onSelectBus={handleSelectBus}
              onSelectStop={handleSelectStop}
            />

            {/* Route Selector (desktop: floating top-left, mobile: FAB + bottom sheet) */}
            <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 500 }}>
              <RouteSelector
                routes={routes}
                selectedRouteId={selectedRouteId}
                onSelectRoute={setSelectedRouteId}
                buses={buses}
                onSelectBus={handleSelectBus}
                onSelectStop={handleSelectStop}
              />
            </div>

            {/* Legend (desktop only) */}
            <Legend />

            {/* Stop Modal */}
            {selectedStop && (
              <StopInfoModal
                stop={selectedStop}
                buses={buses}
                onClose={() => setSelectedStop(null)}
                onSelectBus={handleSelectBus}
              />
            )}

            {/* Bus Drawer */}
            {activeBus && (
              <BusDrawer
                bus={activeBus}
                onClose={() => setSelectedBus(null)}
                onOpenConductorForBus={handleOpenConductorForBus}
              />
            )}
          </div>
        )}

        {/* KIOSK TAB */}
        {activeTab === 'kiosk' && (
          <div style={{ width: '100%', height: '100%', overflowY: 'auto', background: 'var(--bg-primary)', paddingBottom: 80 }}>
            <ConductorKiosk
              buses={buses}
              routes={routes}
              onIssueTicket={issueTicket}
              selectedBusId={selectedBus?.bus_id}
            />
          </div>
        )}

        {/* PITCH / ARCHITECTURE TAB */}
        {activeTab === 'pitch' && (
          <div style={{ width: '100%', height: '100%', overflowY: 'auto', background: 'var(--bg-primary)', paddingBottom: 80 }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Hero Banner */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(37,99,235,0.18) 0%, rgba(139,92,246,0.12) 100%)',
                border: '1px solid rgba(59,130,246,0.3)', borderRadius: 'var(--radius-xl)',
                padding: '28px 24px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Decorative glow */}
                <div style={{
                  position: 'absolute', top: -40, right: -40, width: 200, height: 200,
                  borderRadius: '50%', background: 'rgba(59,130,246,0.08)', filter: 'blur(40px)',
                  pointerEvents: 'none',
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--blue-light)', fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                  <Sparkles size={16} />
                  SIH 2026 — Innovation Prototype
                </div>
                <h2 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.9rem)', fontWeight: '800', color: '#fff', lineHeight: 1.2, marginBottom: '10px' }}>
                  Real-Time Small City Transport<br />Tracker & Headcount System
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: 760 }}>
                  Solving small-city commuter uncertainty in Punjab <b style={{ color: 'var(--text-primary)' }}>without installing new GPS hardware</b> —
                  leveraging the Android Electronic Ticketing Machines (ETMs) already carried by PUNBUS / Punjab Roadways conductors.
                </p>
              </div>

              {/* Problem vs Solution grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {[
                  {
                    icon: <ShieldAlert size={20} />, color: 'var(--red-light)', borderColor: 'rgba(239,68,68,0.25)',
                    bg: 'rgba(239,68,68,0.05)', title: 'The Small City Problem',
                    items: [
                      'Tier-2/3 city commuters have zero ETA or crowding visibility.',
                      'GPS hardware on thousands of state buses costs crores in procurement & upkeep.',
                      'Dedicated passenger-counter sensors have high failure rates on rural routes.',
                    ],
                  },
                  {
                    icon: <CheckCircle2 size={20} />, color: 'var(--green-light)', borderColor: 'rgba(16,185,129,0.25)',
                    bg: 'rgba(16,185,129,0.05)', title: 'The Hardware-Free Innovation',
                    items: [
                      'Zero New Hardware: Uses the conductor\'s existing Android ETM for GPS streaming via busAPI().',
                      'Algorithmic Headcount: ticket issuance increments count; GPS snap to destination stop decrements it.',
                      'Instant Deployment: Software-only integration into existing ETM application layer.',
                    ],
                  },
                ].map(({ icon, color, borderColor, bg, title, items }) => (
                  <div key={title} style={{ background: bg, border: `1px solid ${borderColor}`, borderRadius: 'var(--radius-xl)', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color, fontWeight: '800', fontSize: '0.95rem', marginBottom: '14px' }}>
                      {icon} {title}
                    </div>
                    <ul style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.65, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {items.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Pipeline Architecture */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                  <div style={{ padding: 8, borderRadius: 'var(--radius-md)', background: 'var(--blue-dim)', color: 'var(--blue-light)' }}>
                    <Cpu size={19} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#fff' }}>End-to-End Data Pipeline Architecture</h3>
                </div>

                {/* Pipeline flow */}
                <div style={{ display: 'flex', alignItems: 'stretch', gap: '0', overflowX: 'auto', paddingBottom: '4px' }}>
                  {[
                    { icon: <Smartphone size={18} />, title: 'Conductor ETM', desc: 'Android GPS + ticket events via WebSocket/MQTT', color: '#3b82f6' },
                    { icon: <Globe size={18} />,      title: 'Location Engine', desc: 'GPS → route polyline snap + distance along route', color: '#8b5cf6' },
                    { icon: <Zap size={18} />,        title: 'Pax Counter', desc: 'ticket.issue += 1; stop.arrival -= alighted', color: '#10b981' },
                    { icon: <Database size={18} />,   title: 'Redis Cache', desc: 'Sub-second bus states for concurrent queries', color: '#f59e0b' },
                    { icon: <Server size={18} />,     title: 'Commuter Map', desc: 'WebSocket pushes positions, ETAs & occupancy', color: '#ec4899' },
                  ].map((step, idx, arr) => (
                    <React.Fragment key={idx}>
                      <div style={{
                        background: `${step.color}0d`, border: `1px solid ${step.color}30`,
                        borderRadius: 'var(--radius-lg)', padding: '14px',
                        minWidth: '140px', flex: '1',
                        display: 'flex', flexDirection: 'column', gap: '8px',
                      }}>
                        <div style={{ color: step.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {step.icon}
                          <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Step {idx + 1}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#fff' }}>{step.title}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>{step.desc}</div>
                      </div>
                      {idx < arr.length - 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px', flexShrink: 0 }}>
                          <ArrowRight size={16} color="var(--text-muted)" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Judge Q&A */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                  <div style={{ padding: 8, borderRadius: 'var(--radius-md)', background: 'var(--amber-dim)', color: 'var(--amber-light)' }}>
                    <Target size={19} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#fff' }}>Judge Q&A — Engineering Defense</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    {
                      q: "What about bus pass holders who don't buy tickets?",
                      a: 'Commuters see our count as an occupancy category (Seats / Standing / Crowded) rather than exact head count. In production, pass taps on ETM are fed into the event stream.',
                    },
                    {
                      q: 'What if a passenger alights early before their ticketed stop?',
                      a: 'Statistical aggregation across hundreds of ticket events normalizes minor stop discrepancies. At each route terminal the bus headcount auto-resets to zero.',
                    },
                    {
                      q: 'What is the latency from ticket issue to commuter map update?',
                      a: 'Ticket to WebSocket to Redis to commuter WebSocket push is under 200ms on our backend. Map positions update on a 3-second polling cadence from the GPS device.',
                    },
                  ].map(({ q, a }, i) => (
                    <div key={i} style={{
                      background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-subtle)', padding: '15px 18px',
                    }}>
                      <div style={{ fontSize: '0.83rem', fontWeight: '800', color: 'var(--blue-light)', marginBottom: '6px' }}>
                        Q: {q}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        <b style={{ color: 'var(--text-primary)' }}>Defense: </b>{a}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* ── Live Ticket Ticker ── */}
      <LiveTicketTicker ticketEvents={ticketEvents} />
    </div>
  );
}
