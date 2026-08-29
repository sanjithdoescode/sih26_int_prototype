import React from 'react';
import { Bus, Radio, Terminal, Info, MapPin, Zap } from 'lucide-react';

export function Header({ activeTab, setActiveTab, isConnected, lastUpdated }) {
  return (
    <>
      {/* ── Desktop Header ── */}
      <header
        className="desktop-only"
        style={{
          background: 'linear-gradient(180deg, rgba(6,9,17,0.98) 0%, rgba(11,15,26,0.95) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '0 24px',
          height: 'var(--nav-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          zIndex: 20,
          backdropFilter: 'blur(20px)',
          flexShrink: 0,
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '13px', flexShrink: 0 }}>
          <div style={{
            width: '40px', height: '40px',
            borderRadius: '11px',
            background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(37,99,235,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
            flexShrink: 0,
          }}>
            <Bus size={21} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <h1 style={{ fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.025em', color: '#ffffff', lineHeight: 1 }}>
                Punjab Transit Live
              </h1>
              <span style={{
                fontSize: '0.6rem', fontWeight: '800', textTransform: 'uppercase',
                letterSpacing: '0.07em', padding: '2px 7px', borderRadius: 'var(--radius-full)',
                background: 'rgba(59,130,246,0.15)', color: 'var(--blue-light)',
                border: '1px solid rgba(59,130,246,0.28)',
              }}>
                SIH 2026
              </span>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={11} color="var(--blue-light)" />
              <span>Amritsar, Punjab</span>
              <span style={{ opacity: 0.35 }}>•</span>
              <span style={{ color: 'var(--text-muted)' }}>PUNBUS / BRTS ETM Ingestion</span>
            </p>
          </div>
        </div>

        {/* Desktop Tab Switcher */}
        <nav style={{
          display: 'flex', alignItems: 'center', gap: '3px',
          background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
        }}>
          {[
            { id: 'map',   label: 'Commuter Map',   icon: <Bus size={14} /> },
            { id: 'kiosk', label: 'ETM Kiosk',      icon: <Terminal size={14} /> },
            { id: 'pitch', label: 'Architecture',    icon: <Info size={14} /> },
          ].map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 15px', borderRadius: '8px',
                fontSize: '0.78rem', fontWeight: '700',
                border: 'none', cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                background: activeTab === id
                  ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                  : 'transparent',
                color: activeTab === id ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: activeTab === id ? '0 2px 10px rgba(37,99,235,0.35)' : 'none',
              }}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Connection Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 14px', borderRadius: 'var(--radius-full)',
            background: isConnected ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${isConnected ? 'rgba(16,185,129,0.28)' : 'rgba(239,68,68,0.28)'}`,
          }}>
            <div className={`live-dot${isConnected ? '' : ' red'}`} />
            <span style={{
              fontSize: '0.72rem', fontWeight: '700',
              color: isConnected ? 'var(--green-light)' : 'var(--red-light)',
              letterSpacing: '0.03em',
            }}>
              {isConnected ? 'LIVE · WebSocket' : 'RECONNECTING…'}
            </span>
          </div>
        </div>
      </header>

      {/* ── Mobile Top Bar ── */}
      <header
        className="mobile-only"
        style={{
          background: 'rgba(6,9,17,0.97)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 12px rgba(37,99,235,0.4)',
            flexShrink: 0,
          }}>
            <Bus size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Punjab Transit Live
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <MapPin size={9} color="var(--blue-light)" />
              Amritsar, Punjab
            </div>
          </div>
        </div>

        {/* Mobile connection pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '5px 10px', borderRadius: 'var(--radius-full)',
          background: isConnected ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${isConnected ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
        }}>
          <div className={`live-dot${isConnected ? '' : ' red'}`} />
          <span style={{ fontSize: '0.65rem', fontWeight: '800', color: isConnected ? 'var(--green-light)' : 'var(--red-light)' }}>
            {isConnected ? 'LIVE' : 'OFF'}
          </span>
        </div>
      </header>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="bottom-nav mobile-only">
        {[
          { id: 'map',   label: 'Live Map',    icon: <Bus size={20} /> },
          { id: 'kiosk', label: 'ETM Kiosk',   icon: <Terminal size={20} /> },
          { id: 'pitch', label: 'Architecture', icon: <Info size={20} /> },
        ].map(({ id, label, icon }) => (
          <button
            key={id}
            className={`bottom-nav-item${activeTab === id ? ' active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <div className="nav-icon-wrap">
              {icon}
            </div>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
