import React, { useState } from 'react';
import { Bus, Users, Ticket, Gauge, Play, Pause, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

export function MetricsBar({ metrics, buses, controlSimulator }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [simExpanded, setSimExpanded] = useState(false);

  const togglePlay = async () => {
    const next = !isPlaying;
    setIsPlaying(next);
    await controlSimulator(next ? 'start' : 'pause');
  };

  const changeSpeed = async (s) => {
    setSpeed(s);
    await controlSimulator('speed', { multiplier: s });
  };

  const handleReset = async () => {
    setIsPlaying(true);
    await controlSimulator('reset');
  };

  const totalPassengers = buses.reduce((s, b) => s + (b.passenger_count || 0), 0);
  const totalCapacity   = buses.reduce((s, b) => s + (b.capacity || 50), 0);
  const avgOccupancy    = totalCapacity > 0 ? Math.round((totalPassengers / totalCapacity) * 100) : 0;

  const METRICS = [
    {
      icon: <Bus size={15} />,
      color: 'var(--blue-light)', bg: 'var(--blue-dim)',
      label: 'Active Fleet', value: `${buses.length} Buses`,
    },
    {
      icon: <Users size={15} />,
      color: 'var(--green-light)', bg: 'var(--green-dim)',
      label: 'On Board', value: `${totalPassengers} Pax`,
    },
    {
      icon: <Gauge size={15} />,
      color: 'var(--amber-light)', bg: 'var(--amber-dim)',
      label: 'Avg Load', value: `${avgOccupancy}% Full`,
    },
    {
      icon: <Ticket size={15} />,
      color: 'var(--purple-light)', bg: 'var(--purple-dim)',
      label: 'Tickets', value: metrics.total_tickets_issued || 0,
    },
  ];

  return (
    <div style={{
      background: 'rgba(11,15,26,0.97)',
      borderBottom: '1px solid var(--border-subtle)',
      flexShrink: 0,
      zIndex: 15,
    }}>
      {/* ── Scrollable Metrics Row ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {METRICS.map((m, i) => (
          <React.Fragment key={i}>
            <div className="metric-card" style={{ borderColor: `${m.color}20` }}>
              <div className="icon-badge" style={{ background: m.bg, color: m.color, width: 30, height: 30 }}>
                {m.icon}
              </div>
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                  {m.label}
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#fff', lineHeight: 1.1 }}>
                  {m.value}
                </div>
              </div>
            </div>
            {i < METRICS.length - 1 && (
              <div style={{ width: '1px', height: '28px', background: 'var(--border-subtle)', flexShrink: 0 }} />
            )}
          </React.Fragment>
        ))}

        {/* Sim controls inline on desktop */}
        <div className="desktop-only" style={{
          display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto',
          background: 'rgba(0,0,0,0.2)', padding: '5px 10px', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)', flexShrink: 0,
        }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', marginRight: '2px' }}>SIM:</span>
          <button
            onClick={togglePlay}
            style={{
              background: isPlaying ? 'rgba(220,38,38,0.2)' : 'rgba(22,163,74,0.2)',
              color: isPlaying ? 'var(--red-light)' : 'var(--green-light)',
              border: `1px solid ${isPlaying ? 'rgba(220,38,38,0.35)' : 'rgba(22,163,74,0.35)'}`,
              borderRadius: 'var(--radius-md)', padding: '5px 10px',
              fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px',
              transition: 'all 0.18s',
            }}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          {[1, 2, 5].map((s) => (
            <button
              key={s}
              onClick={() => changeSpeed(s)}
              style={{
                background: speed === s ? 'var(--blue-dim)' : 'rgba(255,255,255,0.04)',
                color: speed === s ? 'var(--blue-light)' : 'var(--text-muted)',
                border: `1px solid ${speed === s ? 'rgba(59,130,246,0.35)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-sm)', padding: '4px 8px',
                fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer',
                transition: 'all 0.18s',
              }}
            >
              {s}×
            </button>
          ))}

          <button
            onClick={handleReset}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)',
              padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
              transition: 'all 0.18s',
            }}
          >
            <RotateCcw size={12} />
          </button>
        </div>

        {/* Mobile simulator toggle button */}
        <button
          className="mobile-only"
          onClick={() => setSimExpanded(!simExpanded)}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '6px 12px', borderRadius: 'var(--radius-full)',
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer',
            flexShrink: 0, marginLeft: 'auto',
          }}
        >
          <span>SIM</span>
          {simExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* ── Mobile Sim Controls (collapsible) ── */}
      {simExpanded && (
        <div className="mobile-only animate-fade-up" style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '0 16px 10px', flexWrap: 'wrap',
        }}>
          <button
            onClick={togglePlay}
            style={{
              flex: '1', minWidth: 80,
              background: isPlaying ? 'rgba(220,38,38,0.15)' : 'rgba(22,163,74,0.15)',
              color: isPlaying ? 'var(--red-light)' : 'var(--green-light)',
              border: `1px solid ${isPlaying ? 'rgba(220,38,38,0.3)' : 'rgba(22,163,74,0.3)'}`,
              borderRadius: 'var(--radius-lg)', padding: '9px 14px',
              fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? 'Pause Simulation' : 'Resume'}
          </button>

          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => changeSpeed(s)}
                style={{
                  background: speed === s ? 'var(--blue-dim)' : 'rgba(255,255,255,0.05)',
                  color: speed === s ? 'var(--blue-light)' : 'var(--text-muted)',
                  border: `1px solid ${speed === s ? 'rgba(59,130,246,0.3)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-md)', padding: '8px 14px',
                  fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer',
                }}
              >
                {s}×
              </button>
            ))}
            <button
              onClick={handleReset}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)',
                padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center',
              }}
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
