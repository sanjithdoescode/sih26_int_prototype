

import React, { useState } from 'react';
import { Terminal, Ticket, CheckCircle2, QrCode, ArrowRight, Sparkles, MapPin, Users, Minus, Plus, Navigation } from 'lucide-react';

export function ConductorKiosk({ buses, routes, onIssueTicket, selectedBusId }) {
  const [activeBusId, setActiveBusId] = useState(selectedBusId || (buses[0] ? buses[0].bus_id : ''));
  const [boardingStopId, setBoardingStopId] = useState('');
  const [destinationStopId, setDestinationStopId] = useState('');
  const [passengerCount, setPassengerCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastIssuedTicket, setLastIssuedTicket] = useState(null);

  const bus = buses.find((b) => b.bus_id === activeBusId) || buses[0];
  const route = routes.find((r) => r.route_id === bus?.route_id);
  const stops = route ? route.stops : [];
  const currentStop = bus?.nearby_stop || (bus?.matched_stop_index !== undefined ? stops[bus.matched_stop_index] : stops[0]);

  React.useEffect(() => {
    if (currentStop && !boardingStopId) setBoardingStopId(currentStop.stop_id);
    if (stops.length > 1 && !destinationStopId) {
      const nextIdx = Math.min(stops.length - 1, (currentStop?.sequence || 0) + 1);
      setDestinationStopId(stops[nextIdx].stop_id);
    }
  }, [bus, currentStop, stops, boardingStopId, destinationStopId]);

  const boardStop = stops.find((s) => s.stop_id === (boardingStopId || currentStop?.stop_id));
  const destStop = stops.find((s) => s.stop_id === destinationStopId);
  const stagesPassed = boardStop && destStop ? Math.max(1, Math.abs(destStop.sequence - boardStop.sequence)) : 1;
  const farePerHead = 10 + (stagesPassed - 1) * 5;
  const totalFare = farePerHead * passengerCount;

  const handleIssue = async () => {
    if (!bus || !boardStop || !destStop) return;
    setIsSubmitting(true);
    try {
      const res = await onIssueTicket({
        bus_id: bus.bus_id, route_id: bus.route_id,
        boarding_stop_id: boardStop.stop_id, destination_stop_id: destStop.stop_id,
        passenger_count: passengerCount, fare_inr: totalFare,
      });
      if (res && res.ticket) setLastIssuedTicket(res.ticket);
    } catch (err) {
      console.error('Error issuing ticket:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const occColor = bus?.occupancy_color || '#10B981';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 16px 40px' }}>
      <div className="kiosk-grid">

        {/* ── ETM Device Mockup ── */}
        <div style={{
          background: 'linear-gradient(180deg, #0d1424 0%, #0a1120 100%)',
          borderRadius: '22px',
          border: '2.5px solid #2a3548',
          boxShadow: '0 30px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04), 0 0 40px rgba(37,99,235,0.12)',
          overflow: 'hidden',
        }}>
          {/* Hardware chrome bar */}
          <div style={{
            background: 'linear-gradient(180deg, #1a2540 0%, #141e30 100%)',
            padding: '13px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '8px',
                background: 'var(--blue-dim)', color: 'var(--blue-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Terminal size={17} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#e2e8f0', letterSpacing: '0.04em' }}>
                  PUNBUS · ANDROID ETM POS-400
                </div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Conductor Device · GPS Active</div>
              </div>
            </div>
            <div style={{
              background: 'var(--green-dim)', color: 'var(--green-light)',
              fontSize: '0.6rem', fontWeight: '800', padding: '3px 9px',
              borderRadius: 'var(--radius-full)', border: '1px solid rgba(16,185,129,0.3)',
              letterSpacing: '0.04em',
            }}>
              ONLINE · busAPI
            </div>
          </div>

          {/* ETM screen */}
          <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Bus selector */}
            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '7px', display: 'block' }}>
                Active Bus & Route
              </label>
              <select
                className="styled-select"
                value={activeBusId}
                onChange={(e) => { setActiveBusId(e.target.value); setBoardingStopId(''); setDestinationStopId(''); }}
              >
                {buses.map((b) => (
                  <option key={b.bus_id} value={b.bus_id}>
                    {b.bus_id} ({b.bus_number}) · {b.route_name.split(' - ')[0]} → {b.passenger_count}/50 pax
                  </option>
                ))}
              </select>
            </div>

            {/* Location snapshot */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(59,130,246,0.05))',
              border: '1px solid rgba(59,130,246,0.22)', borderRadius: 'var(--radius-lg)', padding: '13px 15px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: '0.62rem', color: 'var(--blue-light)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                  Current GPS (Snapped)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.95rem', fontWeight: '800', color: '#fff' }}>
                  <MapPin size={13} color="var(--blue-light)" />
                  {currentStop ? currentStop.name : 'En Route'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Headcount</div>
                <div style={{ fontSize: '1.15rem', fontWeight: '800', color: occColor }}>
                  {bus?.passenger_count || 0}
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>/50</span>
                </div>
              </div>
            </div>

            {/* Boarding stop */}
            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '7px', display: 'block' }}>
                Boarding Stop
              </label>
              <select
                className="styled-select"
                value={boardingStopId || currentStop?.stop_id || ''}
                onChange={(e) => setBoardingStopId(e.target.value)}
              >
                {stops.map((s) => (
                  <option key={s.stop_id} value={s.stop_id}>Stage {s.sequence + 1}: {s.name}</option>
                ))}
              </select>
            </div>

            {/* Journey arrow */}
            {boardStop && destStop && (
              <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 4px' }}>
                <div style={{ flex: 1, fontSize: '0.75rem', fontWeight: '700', color: 'var(--blue-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {boardStop.name}
                </div>
                <ArrowRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: '0.75rem', fontWeight: '700', color: 'var(--green-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>
                  {destStop.name}
                </div>
              </div>
            )}

            {/* Destination stop */}
            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '7px', display: 'block' }}>
                Destination Stop (Alighting)
              </label>
              <select
                className="styled-select"
                value={destinationStopId}
                onChange={(e) => setDestinationStopId(e.target.value)}
              >
                {stops.map((s) => (
                  <option key={s.stop_id} value={s.stop_id}>Stage {s.sequence + 1}: {s.name}</option>
                ))}
              </select>
            </div>

            {/* Passengers & Fare */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '7px', display: 'block' }}>
                  Passengers
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)', overflow: 'hidden',
                }}>
                  <button
                    type="button"
                    onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                    style={{
                      width: 42, height: 42, background: 'rgba(255,255,255,0.04)', border: 'none',
                      borderRight: '1px solid var(--border-subtle)', color: '#fff', fontSize: '1.1rem',
                      fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Minus size={14} />
                  </button>
                  <div style={{ flex: 1, textAlign: 'center', fontSize: '1rem', fontWeight: '800', color: '#fff' }}>
                    {passengerCount}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPassengerCount(Math.min(10, passengerCount + 1))}
                    style={{
                      width: 42, height: 42, background: 'rgba(255,255,255,0.04)', border: 'none',
                      borderLeft: '1px solid var(--border-subtle)', color: '#fff', fontSize: '1.1rem',
                      fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '7px', display: 'block' }}>
                  Total Fare
                </label>
                <div style={{
                  background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.25)',
                  borderRadius: 'var(--radius-md)', padding: '10px 14px',
                  fontSize: '1.2rem', fontWeight: '800', color: 'var(--green-light)', textAlign: 'center',
                  letterSpacing: '-0.01em',
                }}>
                  ₹{totalFare}
                </div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px' }}>
                  ₹{farePerHead}/head · {stagesPassed} stage{stagesPassed !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Issue Button */}
            <button
              onClick={handleIssue}
              disabled={isSubmitting || !boardStop || !destStop}
              style={{
                marginTop: '4px', padding: '14px', borderRadius: 'var(--radius-lg)', border: 'none',
                background: isSubmitting ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg, #059669, #10b981)',
                color: '#fff', fontSize: '0.95rem', fontWeight: '800', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
                boxShadow: '0 4px 20px rgba(16,185,129,0.35)', transition: 'all 0.2s',
                letterSpacing: '0.02em',
              }}
            >
              <Ticket size={18} />
              {isSubmitting ? 'Printing Ticket…' : 'PRINT & ISSUE TICKET'}
            </button>
          </div>
        </div>

        {/* ── Right Panel: Receipt + Info ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {lastIssuedTicket ? (
            <div className="animate-fade-up" style={{
              background: '#fffef8',
              color: '#1e293b',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)',
            }}>
              {/* Ticket top strip */}
              <div style={{
                background: `linear-gradient(135deg, ${route?.color || '#2563eb'}, ${route?.color ? route.color + 'bb' : '#1d4ed8'})`,
                padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <Ticket size={20} color="rgba(255,255,255,0.9)" />
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.08em' }}>
                    ELECTRONIC PASSENGER TICKET
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.65)' }}>PUNBUS — AMRITSAR REGION</div>
                </div>
              </div>

              {/* Ticket body */}
              <div style={{ padding: '18px', fontFamily: 'var(--font-mono)' }}>
                {/* Ticket ID */}
                <div style={{ textAlign: 'center', marginBottom: '14px', paddingBottom: '14px', borderBottom: '1.5px dashed #cbd5e1' }}>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.06em', marginBottom: '4px' }}>
                    TICKET ID
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', letterSpacing: '0.06em' }}>
                    {lastIssuedTicket.ticket_id}
                  </div>
                </div>

                {/* Journey route visual */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px' }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: '600', marginBottom: '3px' }}>FROM</div>
                    <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#1e293b' }}>{lastIssuedTicket.boarding_stop_name}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: route?.color || '#2563eb' }} />
                    <div style={{ width: 40, height: 2, background: `linear-gradient(90deg, ${route?.color || '#2563eb'}, #10b981)`, borderRadius: 999 }} />
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                  </div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: '600', marginBottom: '3px' }}>TO</div>
                    <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#059669' }}>{lastIssuedTicket.destination_stop_name}</div>
                  </div>
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '0.74rem' }}>
                  {[
                    { label: 'Bus & Route', value: `${lastIssuedTicket.bus_id} (${route?.route_number || '—'})` },
                    { label: 'Passengers', value: `${lastIssuedTicket.passenger_count} Passenger(s)` },
                    { label: 'Issued At', value: new Date(lastIssuedTicket.issued_at).toLocaleTimeString() },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b' }}>{label}:</span>
                      <span style={{ fontWeight: '700', color: '#1e293b' }}>{value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1.5px dashed #cbd5e1', paddingTop: '8px', marginTop: '3px' }}>
                    <span style={{ fontWeight: '800', fontSize: '0.82rem', color: '#0f172a' }}>FARE PAID</span>
                    <span style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0f172a' }}>₹{lastIssuedTicket.fare_inr}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', paddingTop: '12px', borderTop: '1.5px dashed #cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: '700', fontSize: '0.7rem' }}>
                    <CheckCircle2 size={16} />
                    ACTIVE ON BUS HEADCOUNT
                  </div>
                  <QrCode size={34} color="#1e293b" />
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-xl)',
              border: '2px dashed rgba(255,255,255,0.08)',
              padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)',
            }}>
              <Ticket size={38} color="rgba(96,165,250,0.4)" style={{ margin: '0 auto 12px', display: 'block' }} />
              <div style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                No Ticket Issued Yet
              </div>
              <p style={{ fontSize: '0.78rem', maxWidth: '300px', margin: '0 auto', lineHeight: 1.55 }}>
                Select a bus, boarding stop, and destination, then hit <b style={{ color: 'var(--text-primary)' }}>Print & Issue Ticket</b> to test real-time headcount.
              </p>
            </div>
          )}

          {/* How it works */}
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)', padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Sparkles size={16} color="var(--amber-light)" />
              <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: '#fff' }}>
                Zero-Hardware Passenger Counting
              </h3>
            </div>
            <ol style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { step: 'Ticket Issued on ETM', desc: <><code style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>passenger_count += 1</code>. Ticket marked <code style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>active</code> with destination in Redis.</> },
                { step: 'GPS Snapping at Stop', desc: 'Android GPS snaps to stop coordinates — triggers a stop arrival event.' },
                { step: 'Auto Alighting', desc: <><code style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>passenger_count -= alighted_count</code> for all tickets destined for that stop.</> },
                { step: 'Crowding Badge', desc: '🟢 Seats (<50%) · 🟡 Standing (50–80%) · 🔴 Crowded (>80%) pushed to commuter map.' },
              ].map(({ step, desc }, i) => (
                <li key={i} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  <b style={{ color: 'var(--text-primary)' }}>{step}: </b>{desc}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
