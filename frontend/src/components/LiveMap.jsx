import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export function LiveMap({
  routes,
  buses,
  selectedRouteId,
  selectedBus,
  onSelectBus,
  onSelectStop,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylineLayerGroupRef = useRef(null);
  const stopsLayerGroupRef = useRef(null);
  const busMarkersMapRef = useRef(new Map()); // bus_id -> marker instance

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered on Amritsar, Punjab
    const map = L.map(mapContainerRef.current, {
      center: [31.6340, 74.8723],
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Clean OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
    }).addTo(map);

    polylineLayerGroupRef.current = L.layerGroup().addTo(map);
    stopsLayerGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Route Polylines and Stops when routes or selectedRouteId changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !polylineLayerGroupRef.current || !stopsLayerGroupRef.current) return;

    polylineLayerGroupRef.current.clearLayers();
    stopsLayerGroupRef.current.clearLayers();

    const activeRoutes = selectedRouteId
      ? routes.filter((r) => r.route_id === selectedRouteId)
      : routes;

    for (const route of activeRoutes) {
      // Draw background glow for route polyline
      L.polyline(route.polyline, {
        color: route.color,
        weight: 8,
        opacity: 0.25,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(polylineLayerGroupRef.current);

      // Draw primary polyline
      const poly = L.polyline(route.polyline, {
        color: route.color,
        weight: 4,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(polylineLayerGroupRef.current);

      // Draw stops along route
      for (const stop of route.stops) {
        const stopIcon = L.divIcon({
          className: 'stop-marker-wrapper',
          html: `<div class="stop-marker-circle" style="border-color: ${route.color};"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const stopMarker = L.marker([stop.lat, stop.lng], { icon: stopIcon })
          .addTo(stopsLayerGroupRef.current)
          .bindTooltip(`<b>${stop.name}</b><br/><span style="color:#64748b; font-size:10px;">Stage ${stop.sequence + 1} • Route ${route.route_number}</span>`, {
            direction: 'top',
            offset: [0, -8],
            className: 'custom-tooltip',
          });

        stopMarker.on('click', () => {
          if (onSelectStop) onSelectStop({ ...stop, route_id: route.route_id, route_name: route.name });
        });
      }
    }

    // Fit map bounds to selected route if specific route chosen
    if (selectedRouteId) {
      const chosen = routes.find((r) => r.route_id === selectedRouteId);
      if (chosen && chosen.polyline.length > 0) {
        map.fitBounds(L.polyline(chosen.polyline).getBounds(), { padding: [40, 40] });
      }
    }
  }, [routes, selectedRouteId, onSelectStop]);

  // Update Live Bus Markers on every stream tick
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const activeBusIds = new Set();

    for (const bus of buses) {
      // Filter if route filter applied
      if (selectedRouteId && bus.route_id !== selectedRouteId) continue;

      activeBusIds.add(bus.bus_id);

      const lat = bus.snapped_lat || bus.lat;
      const lng = bus.snapped_lng || bus.lng;
      const bearing = bus.bearing || 0;
      const occColor = bus.occupancy_color || '#10B981';
      const isSelected = selectedBus && selectedBus.bus_id === bus.bus_id;

      // Custom HTML Marker with bearing orientation & occupancy status ring
      const customHtml = `
        <div class="bus-marker-container">
          <div class="bus-marker-pulse" style="background: ${occColor};"></div>
          <div class="bus-marker-body" style="border-color: ${occColor}; background: ${isSelected ? '#2563eb' : '#0f172a'}; box-shadow: 0 0 16px ${occColor};">
            <div class="bus-marker-arrow" style="transform: rotate(${bearing}deg); border-bottom-color: ${occColor};"></div>
            <span>${bus.bus_number}</span>
          </div>
        </div>
      `;

      const busIcon = L.divIcon({
        className: 'bus-marker-custom',
        html: customHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      if (busMarkersMapRef.current.has(bus.bus_id)) {
        const marker = busMarkersMapRef.current.get(bus.bus_id);
        marker.setLatLng([lat, lng]);
        marker.setIcon(busIcon);
      } else {
        const marker = L.marker([lat, lng], { icon: busIcon, zIndexOffset: 1000 }).addTo(map);
        marker.on('click', () => {
          if (onSelectBus) onSelectBus(bus);
        });
        busMarkersMapRef.current.set(bus.bus_id, marker);
      }
    }

    // Remove markers that are filtered out or offline
    for (const [busId, marker] of busMarkersMapRef.current.entries()) {
      if (!activeBusIds.has(busId)) {
        map.removeLayer(marker);
        busMarkersMapRef.current.delete(busId);
      }
    }
  }, [buses, selectedRouteId, selectedBus, onSelectBus]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
