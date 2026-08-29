import { useState, useEffect, useRef, useCallback } from 'react';

export function useLiveBusStream() {
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [ticketEvents, setTicketEvents] = useState([]);
  const [metrics, setMetrics] = useState({
    active_buses: 0,
    total_live_commuters: 0,
    total_tickets_issued: 0,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connectWs = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { type, data, timestamp } = message;

          setLastUpdated(timestamp || new Date().toISOString());

          if (type === 'INITIAL_STATE') {
            if (data.routes) setRoutes(data.routes);
            if (data.buses) setBuses(data.buses);
            if (data.recentTickets) setTicketEvents(data.recentTickets);
            if (data.metrics) setMetrics(data.metrics);
          } else if (type === 'BUSES_STREAM') {
            if (data.buses) {
              setBuses(data.buses);
              // Recalculate metrics
              let totalPassengers = 0;
              for (const b of data.buses) totalPassengers += b.passenger_count || 0;
              setMetrics((prev) => ({
                ...prev,
                active_buses: data.buses.length,
                total_live_commuters: totalPassengers,
              }));
            }
          } else if (type === 'TICKET_ISSUED') {
            setTicketEvents((prev) => [data.ticket, ...prev.slice(0, 24)]);
            setMetrics((prev) => ({
              ...prev,
              total_tickets_issued: prev.total_tickets_issued + 1,
            }));
          } else if (type === 'STOP_ARRIVAL') {
            // Log stop arrival in ticker
            setTicketEvents((prev) => [
              {
                ticket_id: `stop_${Date.now()}`,
                bus_id: data.bus_id,
                route_id: data.route_id,
                stop_name: data.stop_name,
                is_stop_arrival: true,
                alighted_count: data.alighted_count,
                issued_at: new Date().toISOString(),
              },
              ...prev.slice(0, 24),
            ]);
          }
        } catch (err) {
          console.error('Error processing WS message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        // Auto-reconnect after 2 seconds
        reconnectTimeoutRef.current = setTimeout(connectWs, 2000);
      };

      ws.onerror = (err) => {
        setIsConnected(false);
        ws.close();
      };
    } catch (e) {
      console.warn('WS creation failed, falling back to polling:', e);
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(connectWs, 3000);
    }
  }, []);

  // Initial fetch via REST for instant load
  useEffect(() => {
    async function loadInitial() {
      try {
        const [routesRes, busesRes, metricsRes] = await Promise.all([
          fetch('/api/routes').then((r) => r.json()),
          fetch('/api/buses/live').then((r) => r.json()),
          fetch('/api/metrics').then((r) => r.json()),
        ]);

        if (routesRes.success && routesRes.routes) setRoutes(routesRes.routes);
        if (busesRes.success && busesRes.buses) setBuses(busesRes.buses);
        if (metricsRes.success && metricsRes.metrics) setMetrics(metricsRes.metrics);
      } catch (err) {
        console.warn('REST initial fetch error:', err.message);
      }
    }

    loadInitial();
    connectWs();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWs]);

  // Issue ticket via API
  const issueTicket = async ({ bus_id, route_id, boarding_stop_id, destination_stop_id, passenger_count = 1, fare_inr = 10 }) => {
    const res = await fetch('/api/tickets/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bus_id, route_id, boarding_stop_id, destination_stop_id, passenger_count, fare_inr }),
    });
    return await res.json();
  };

  // Simulator control methods
  const controlSimulator = async (action, payload = {}) => {
    const res = await fetch(`/api/simulator/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  };

  return {
    routes,
    buses,
    ticketEvents,
    metrics,
    isConnected,
    lastUpdated,
    issueTicket,
    controlSimulator,
  };
}
