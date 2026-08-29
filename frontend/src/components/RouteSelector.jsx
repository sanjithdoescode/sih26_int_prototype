import React, { useState } from 'react';
import { Layers, Clock, Users, Compass, ChevronDown, X, MapPin } from 'lucide-react';

export function RouteSelector({
  routes,
  selectedRouteId,
  onSelectRoute,
  buses,
  onSelectBus,
  onSelectStop,
}) {
  const [selectedStopId, setSelectedStopId] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Collect unique stops
  const allStops = [];
  const seenStops = new Set();
  for (const r of routes) {
    if (selectedRouteId && r.route_id !== selectedRouteId) continue;
    for (const s of r.stops) {
      if (!seenStops.has(s.stop_id)) {
        seenStops.add(s.stop_id);
        allStops.push({ ...s, route_name: r.name, route_color: r.color, route_id: r.route_id });
      }
    }
  }

  // Find approaching buses for selected stop
  const approaching = [];
  if (selectedStopId) {
    for (const b of buses) {
      const match = b.upcoming_stops?.find((s) => s.stop_id === selectedStopId);
      if (match) approaching.push({ ...b, eta_seconds: match.eta_seconds, eta_text: match.eta_text, distance_km: match.distance_km });
    }
    approaching.sort((a, b) => a.eta_seconds - b.eta_seconds);
  }

  const inner = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Route Tabs */}
      <div>
        <div className="section-label" style={{ marginBottom: '9px' }}>
          <Layers size={13} color="var(--blue-light)" />
          <span>Active Corridors</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            className={`chip chip-blue${selectedRouteId === null ? ' active' : ''}`}
            onClick={() => onSelectRoute(null)}
          >
            All ({buses.length})
          </button>
          {routes.map((r) => {
            const isSel = selectedRouteId === r.route_id;
            const count = buses.filter((b) => b.route_id === r.route_id).length;
            return (
              <button
                key={r.route_id}
                onClick={() => onSelectRoute(isSel ? null : r.route_id)}
                style={{
                  padding: '5px 11px', borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer',
                  border: isSel ? `1px solid ${r.color}80` : '1px solid var(--border-subtle)',
                  background: isSel ? `${r.color}22` : 'rgba(255,255,255,0.04)',
                  color: isSel ? '#fff' : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.18s', whiteSpace: 'nowrap',
                }}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                {r.route_number}
                <span style={{
                  fontSize: '0.62rem', fontWeight: '800', padding: '1px 5px', borderRadius: '4px',
                  background: isSel ? `${r.color}33` : 'rgba(255,255,255,0.08)', opacity: 0.9,
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stop finder */}
      <div style={{
        background: 'rgba(0,0,0,0.22)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)', padding: '12px',
      }}>
        <label style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '0.72rem', fontWeight: '800', color: 'var(--cyan-light)', marginBottom: '8px',
        }}>
          <Compass size={13} />
          <span>Find Next Bus to My Stop</span>
        </label>
        <div style={{ position: 'relative' }}>
          <MapPin size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <select
            className="styled-select"
            value={selectedStopId}
            style={{ paddingLeft: 30 }}
            onChange={(e) => {
              setSelectedStopId(e.target.value);
              const stop = allStops.find((s) => s.stop_id === e.target.value);
              if (stop && onSelectStop) onSelectStop(stop);
            }}
          >
            <option value="">— Choose your bus stop —</option>
            {allStops.map((s) => (
              <option key={s.stop_id} value={s.stop_id}>
                {s.name} ({s.route_name.split(' - ')[0]})
              </option>
            ))}
          </select>
        </div>

        {selectedStopId && (
          <div style={{ marginTop: '10px' }} className="animate-fade-up">
            <div className="section-label" style={{ marginBottom: '8px' }}>
              {approaching.length > 0
                ? `${approaching.length} Bus${approaching.length > 1 ? 'es' : ''} Approaching`
                : 'No buses approaching this stop'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
              {approaching.map((b) => (
                <div
                  key={b.bus_id}
                  className="bus-list-item"
                  onClick={() => onSelectBus(b)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <div style={{
                      fontWeight: '800', fontSize: '0.82rem', color: '#fff',
                      background: b.route_color || 'var(--blue)', padding: '3px 8px',
                      borderRadius: '6px', boxShadow: `0 2px 8px ${b.route_color || 'var(--blue)'}44`,
                    }}>
                      {b.bus_number}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#fff' }}>{b.bus_id}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{b.distance_km} km away</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--green-light)', fontWeight: '800', fontSize: '0.85rem', justifyContent: 'flex-end' }}>
                      <Clock size={11} />
                      {b.eta_text}
                    </div>
                    <span style={{
                      fontSize: '0.62rem', fontWeight: '700', padding: '1px 6px', borderRadius: 'var(--radius-full)',
                      background: `${b.occupancy_color}22`, color: b.occupancy_color, border: `1px solid ${b.occupancy_color}44`,
                    }}>
                      {b.occupancy_label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: floating overlay top-left */}
      <div
        className="glass desktop-only animate-fade-up"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '16px',
          width: '310px',
        }}
      >
        {inner}
      </div>

      {/* Mobile: FAB + bottom sheet */}
      <div className="mobile-only">
        {/* Floating trigger button */}
        {!mobileOpen && (
          <button
            className="animate-pop"
            onClick={() => setMobileOpen(true)}
            style={{
              position: 'absolute', bottom: '88px', left: '16px',
              zIndex: 600,
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 16px', borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
              color: '#fff', border: 'none', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: '700',
              boxShadow: '0 4px 20px rgba(37,99,235,0.5), 0 2px 8px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Layers size={16} />
            <span>Routes & Stops</span>
          </button>
        )}

        {/* Bottom Sheet */}
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setMobileOpen(false)}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                zIndex: 850, backdropFilter: 'blur(2px)',
              }}
              className="animate-fade-in"
            />
            <div
              className="bottom-sheet animate-fade-up"
              style={{ zIndex: 860, padding: '0 16px' }}
            >
              <div className="bottom-sheet-handle" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 14px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#fff' }}>Routes & Stops</h3>
                <button className="close-btn" onClick={() => setMobileOpen(false)}>
                  <X size={16} />
                </button>
              </div>
              {inner}
            </div>
          </>
        )}
      </div>
    </>
  );
}
