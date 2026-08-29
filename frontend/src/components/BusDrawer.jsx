import React from 'react';
import { X, Navigation, Users, Clock, Zap, MapPin, Ticket, ShieldCheck, ChevronRight } from 'lucide-react';

export function BusDrawer({ bus, onClose, onOpenConductorForBus }) {
  if (!bus) return null;

  const occColor = bus.occupancy_color || '#10B981';
  const occPct   = bus.occupancy_percentage || 0;

  const content = (
    <>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.02)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            fontWeight: '800', fontSize: '1rem', color: '#fff',
            background: bus.route_color || '#2563eb', padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            boxShadow: `0 4px 14px ${(bus.route_color || '#2563eb')}55`,
          }}>
            {bus.bus_number}
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#fff' }}>{bus.bus_id}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>{bus.route_name}</div>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}><X size={16} /></button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Telemetry row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={{
            background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.18)',
            borderRadius: 'var(--radius-lg)', padding: '12px',
          }}>
            <div className="section-label" style={{ marginBottom: '5px' }}>Live Speed</div>
            <div style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--cyan-light)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Zap size={14} /> {bus.speed_kmph} km/h
            </div>
          </div>
          <div style={{
            background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)',
            borderRadius: 'var(--radius-lg)', padding: '12px',
          }}>
            <div className="section-label" style={{ marginBottom: '5px' }}>GPS Snap</div>
            <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--green-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={13} /> ±{bus.gps_drift_meters || 4.2}m
            </div>
          </div>
        </div>

        {/* Occupancy card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)',
          border: `1px solid ${occColor}30`, padding: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
              <Users size={14} color={occColor} />
              Estimated Headcount
            </div>
            <span className="occ-badge" style={{ background: `${occColor}18`, color: occColor, border: `1px solid ${occColor}40` }}>
              {bus.occupancy_label}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em' }}>
              {bus.passenger_count}
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}> / {bus.capacity || 50}</span>
            </span>
            <span style={{ fontSize: '0.95rem', fontWeight: '800', color: occColor }}>{occPct}%</span>
          </div>

          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${occPct}%`, background: `linear-gradient(90deg, ${occColor}cc, ${occColor})` }} />
          </div>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '7px', lineHeight: 1.4 }}>
            Derived in real-time from ETM ticket issuance & destination alighting.
          </p>
        </div>

        {/* Next stop */}
        {bus.next_stop && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(59,130,246,0.05))',
            borderRadius: 'var(--radius-lg)', border: '1px solid rgba(59,130,246,0.28)', padding: '13px 16px',
          }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--blue-light)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Next Stop
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#fff' }}>{bus.next_stop.stop_name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--green-light)', fontWeight: '800', fontSize: '0.9rem' }}>
                <Clock size={13} /> {bus.next_stop.eta_text}
              </div>
            </div>
          </div>
        )}

        {/* Upcoming stops timeline */}
        <div>
          <div className="section-label" style={{ marginBottom: '10px' }}>
            <Navigation size={13} color="var(--blue)" />
            Upcoming Stops & ETAs
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {bus.upcoming_stops && bus.upcoming_stops.length > 0 ? (
              bus.upcoming_stops.map((stop, idx) => (
                <div key={stop.stop_id} className="stop-timeline-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 16, flexShrink: 0 }}>
                      <div style={{
                        width: idx === 0 ? 10 : 7, height: idx === 0 ? 10 : 7,
                        borderRadius: '50%', flexShrink: 0,
                        background: idx === 0 ? 'var(--blue)' : 'rgba(255,255,255,0.2)',
                        boxShadow: idx === 0 ? '0 0 8px var(--blue-glow)' : 'none',
                      }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: idx === 0 ? '800' : '600', color: idx === 0 ? '#fff' : 'var(--text-secondary)' }}>
                        {stop.stop_name}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{stop.distance_km} km away</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: idx === 0 ? 'var(--green-light)' : 'var(--text-muted)' }}>
                    {stop.eta_text}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingTop: '4px' }}>
                Reached end of route. Preparing return trip.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
        <button
          onClick={() => onOpenConductorForBus(bus)}
          style={{
            width: '100%', padding: '12px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#fff', border: 'none', fontSize: '0.88rem', fontWeight: '700',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: '0 4px 16px rgba(37,99,235,0.35)',
            transition: 'all 0.2s',
          }}
        >
          <Ticket size={16} />
          Open Conductor ETM for this Bus
          <ChevronRight size={15} />
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: right-side panel */}
      <div
        className="glass-strong animate-slide-right desktop-only"
        style={{
          position: 'absolute', top: 16, right: 16, bottom: 16,
          width: '360px', maxWidth: 'calc(100vw - 32px)',
          borderRadius: 'var(--radius-xl)',
          zIndex: 1000,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {content}
      </div>

      {/* Mobile: bottom sheet */}
      <div className="mobile-only">
        <div
          className="animate-fade-in"
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 850, backdropFilter: 'blur(2px)' }}
        />
        <div
          className="bottom-sheet"
          style={{ zIndex: 860, maxHeight: '88vh', display: 'flex', flexDirection: 'column', paddingBottom: 'calc(80px + env(safe-area-inset-bottom,0px))' }}
        >
          <div className="bottom-sheet-handle" />
          {content}
        </div>
      </div>
    </>
  );
}
