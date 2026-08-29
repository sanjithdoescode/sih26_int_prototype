import React from 'react';
import { Ticket, UserCheck, LogOut } from 'lucide-react';

export function LiveTicketTicker({ ticketEvents }) {
  if (!ticketEvents || ticketEvents.length === 0) return null;

  const items = ticketEvents.slice(0, 10);
  // Duplicate for seamless loop
  const doubled = [...items, ...items];

  return (
    <div style={{
      background: 'rgba(6,9,17,0.97)',
      borderTop: '1px solid var(--border-subtle)',
      height: 'var(--ticker-height)',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      zIndex: 10,
      flexShrink: 0,
    }}>
      {/* Label */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '0 14px',
        borderRight: '1px solid var(--border-subtle)',
        flexShrink: 0, height: '100%',
        background: 'rgba(59,130,246,0.06)',
      }}>
        <div className="live-dot" style={{ width: 6, height: 6 }} />
        <span style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--blue-light)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
          ETM Feed
        </span>
      </div>

      {/* Scrolling track */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Left fade */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 32,
          background: 'linear-gradient(to right, rgba(6,9,17,1), transparent)',
          zIndex: 2, pointerEvents: 'none',
        }} />
        {/* Right fade */}
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 40,
          background: 'linear-gradient(to left, rgba(6,9,17,1), transparent)',
          zIndex: 2, pointerEvents: 'none',
        }} />

        <div className="ticker-track" style={{ padding: '0 12px', alignItems: 'center' }}>
          {doubled.map((evt, idx) => {
            const isAlight = evt.is_stop_arrival;
            return (
              <div
                key={`${evt.ticket_id || idx}-${idx}`}
                className="ticker-pill"
                style={{
                  background: isAlight ? 'var(--amber-dim)' : 'var(--green-dim)',
                  border: `1px solid ${isAlight ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)'}`,
                }}
              >
                {isAlight ? (
                  <>
                    <LogOut size={11} color="var(--amber-light)" />
                    <span style={{ color: 'var(--amber-light)' }}>
                      {evt.bus_id} @ {evt.stop_name}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem' }}>
                      -{evt.alighted_count} alighted
                    </span>
                  </>
                ) : (
                  <>
                    <UserCheck size={11} color="var(--green-light)" />
                    <span style={{ color: 'var(--green-light)' }}>
                      {evt.bus_id}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem' }}>
                      {evt.boarding_stop_name?.split(' ')[0] || 'Stop'}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem' }}>→</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: '600' }}>
                      {evt.destination_stop_name?.split(' ')[0] || 'Dest'}
                      <span style={{ color: 'rgba(255,255,255,0.35)', marginLeft: 3 }}>·{evt.passenger_count || 1}p</span>
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
