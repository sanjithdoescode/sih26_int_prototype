import React from 'react';

export function Legend() {
  const items = [
    { color: '#10B981', label: '< 50%', sub: 'Seats Free' },
    { color: '#F59E0B', label: '50–80%', sub: 'Standing' },
    { color: '#EF4444', label: '> 80%', sub: 'Crowded' },
  ];

  return (
    <div
      className="glass desktop-only"
      style={{
        position: 'absolute', bottom: 20, left: 16, zIndex: 500,
        borderRadius: 'var(--radius-lg)',
        padding: '9px 14px',
        display: 'flex', alignItems: 'center', gap: '14px',
        fontSize: '0.7rem',
      }}
    >
      <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
        Occupancy
      </span>
      {items.map((item) => (
        <div key={item.color} style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
          <span style={{
            width: 9, height: 9, borderRadius: '50%',
            background: item.color,
            boxShadow: `0 0 6px ${item.color}88`,
            display: 'inline-block', flexShrink: 0,
          }} />
          <span style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>{item.label}</span>
          <span style={{ color: 'var(--text-muted)' }}>{item.sub}</span>
        </div>
      ))}
    </div>
  );
}
