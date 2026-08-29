import React from 'react';
import { X, MapPin, Clock, Users, ArrowRight } from 'lucide-react';

export function StopInfoModal({ stop, buses, onClose, onSelectBus }) {
  if (!stop) return null;

  const approaching = [];
  for (const b of buses) {
    const match = b.upcoming_stops?.find((s) => s.stop_id === stop.stop_id);
    if (match) approaching.push({ ...b, eta_seconds: match.eta_seconds, eta_text: match.eta_text, distance_km: match.distance_km });
  }
  approaching.sort((a, b) => a.eta_seconds - b.eta_seconds);

  const inner = (
    <>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(255,255,255,0.02)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 'var(--radius-md)',
            background: 'var(--blue-dim)', color: 'var(--blue-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <MapPin size={17} />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#fff' }}>{stop.name}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Stop #{stop.sequence + 1}
              {stop.route_name && <span> · {stop.route_name.split(' - ')[0]}</span>}
            </div>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}><X size={15} /></button>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 18px', overflowY: 'auto' }}>
        <div className="section-label" style={{ marginBottom: '10px' }}>
          <Clock size={12} color="var(--amber-light)" />
          <span style={{ color: 'var(--amber-light)' }}>Live Bus Arrivals</span>
        </div>

        {approaching.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '24px 16px',
            color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.5,
          }}>
            <Users size={28} color="rgba(255,255,255,0.1)" style={{ margin: '0 auto 10px', display: 'block' }} />
            No buses actively en route to this stop.
            <br />Check back in a moment.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {approaching.map((b, i) => (
              <div
                key={b.bus_id}
                className="bus-list-item animate-fade-up"
                style={{ animationDelay: `${i * 0.04}s` }}
                onClick={() => { onSelectBus(b); onClose(); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    fontWeight: '800', fontSize: '0.82rem', color: '#fff',
                    background: b.route_color || 'var(--blue)', padding: '3px 8px',
                    borderRadius: '6px', boxShadow: `0 2px 8px ${b.route_color || 'var(--blue)'}44`,
                    flexShrink: 0,
                  }}>
                    {b.bus_number}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fff' }}>{b.bus_id}</div>
                    <div style={{ fontSize: '0.65rem', color: b.occupancy_color, fontWeight: '600' }}>
                      {b.occupancy_label} · {b.passenger_count}/50
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--green-light)', fontWeight: '800', fontSize: '0.88rem', justifyContent: 'flex-end' }}>
                    <Clock size={11} /> {b.eta_text}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{b.distance_km} km</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: compact floating card */}
      <div
        className="glass-strong animate-fade-up desktop-only"
        style={{
          position: 'absolute', top: 80, left: 24,
          width: '330px', maxWidth: 'calc(100vw - 48px)',
          borderRadius: 'var(--radius-xl)', zIndex: 1000, overflow: 'hidden',
        }}
      >
        {inner}
      </div>

      {/* Mobile: bottom sheet */}
      <div className="mobile-only">
        <div
          className="animate-fade-in"
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 850, backdropFilter: 'blur(2px)' }}
        />
        <div
          className="bottom-sheet"
          style={{ zIndex: 860, paddingBottom: 'calc(80px + env(safe-area-inset-bottom,0px))', maxHeight: '70vh' }}
        >
          <div className="bottom-sheet-handle" />
          {inner}
        </div>
      </div>
    </>
  );
}
