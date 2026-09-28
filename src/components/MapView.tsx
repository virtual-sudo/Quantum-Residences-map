import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { cn } from '@/lib/utils';
import { Place, CategoryKey, categoryConfig, QUANTUM_COORDS } from './PlaceSidebar';
import { createRoot } from 'react-dom/client';
import quantumLogo from '@/assets/quantum-logo.png';

interface MapViewProps {
  apiKey: string;
  onFeatureClick?: (feature: any) => void;
  highlightedFeature?: string | null;
  highlightedCoordinates?: [number, number] | null;
  places: Place[];
  selectedCategory: CategoryKey | null;
  selectedPlace?: string | null;
  onMarkerClick?: (placeName: string, coordinates: [number, number]) => void;
}

const ROUTE_SOURCE = 'selected-route';
const ROUTE_LAYER = 'selected-route-line';
const ROUTE_CASING = 'selected-route-casing';
const ROUTE_DASH = 'selected-route-dash';

// Marching-ants frames for the white dash overlay
const DASH_FRAMES: number[][] = [
  [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5], [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0],
  [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1], [0, 3.5, 3, 0.5],
];
const DRAW_IN_MS = 1000;

const lineFeature = (coordinates: [number, number][]) => ({
  type: 'Feature' as const,
  properties: {},
  geometry: { type: 'LineString' as const, coordinates },
});

const emptyRoute = {
  type: 'FeatureCollection' as const,
  features: [],
};

const buildPopupHTML = (
  name: string,
  walk?: string,
  drive?: string,
  isHome = false
) => {
  const subtitle = isHome ? 'Intersection of Taft & Buendia' : '';
  const distRow =
    walk && drive
      ? `<div class="row">
           <div><div class="label">Walk</div><div class="value">${walk}</div></div>
           <div><div class="label">Drive</div><div class="value">${drive}</div></div>
         </div>`
      : subtitle
      ? `<div style="font-size:12px;opacity:0.95;">${subtitle}</div>`
      : '';
  return `
    <div class="quantum-popup">
      <div class="popup-header">${name}</div>
      <div class="popup-body">${distRow}</div>
    </div>
  `;
};

const MapView = ({
  apiKey,
  highlightedFeature,
  highlightedCoordinates,
  places,
  selectedCategory,
  selectedPlace,
  onMarkerClick,
}: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const homeMarker = useRef<maplibregl.Marker | null>(null);
  const routeRequest = useRef(0);
  const routeAnim = useRef<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !apiKey) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
      center: QUANTUM_COORDS,
      zoom: 15.5,
      pitch: 45,
    });

    map.current.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    popup.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      offset: 18,
      className: 'quantum-popup-wrapper',
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Restrict pan a bit
      const bounds = new maplibregl.LngLatBounds();
      [QUANTUM_COORDS, ...places.map((p) => p.coordinates)].forEach((c) =>
        bounds.extend(c)
      );
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const pad = 0.02;
      map.current.setMaxBounds([
        [sw.lng - pad, sw.lat - pad],
        [ne.lng + pad, ne.lat + pad],
      ]);

      // Route from Quantum Residences to the selected landmark:
      // white casing + category-color line + animated white dashes
      map.current.addSource(ROUTE_SOURCE, { type: 'geojson', data: emptyRoute });
      map.current.addLayer({
        id: ROUTE_CASING,
        type: 'line',
        source: ROUTE_SOURCE,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#ffffff', 'line-width': 9, 'line-opacity': 0.9 },
      });
      map.current.addLayer({
        id: ROUTE_LAYER,
        type: 'line',
        source: ROUTE_SOURCE,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#E7A025', 'line-width': 5 },
      });
      map.current.addLayer({
        id: ROUTE_DASH,
        type: 'line',
        source: ROUTE_SOURCE,
        layout: { 'line-cap': 'butt', 'line-join': 'round' },
        paint: {
          'line-color': '#ffffff',
          'line-width': 3,
          'line-opacity': 0.85,
          'line-dasharray': DASH_FRAMES[0],
        },
      });

      // Home marker for Quantum Residences (logo in themed gradient)
      const homeEl = document.createElement('div');
      homeEl.style.width = '120px';
      homeEl.style.height = '120px';
      homeEl.style.borderRadius = '50%';
      homeEl.style.background =
        'linear-gradient(135deg, #E7A025 0%, #B2564A 55%, #742C7B 100%)';
      homeEl.style.border = '5px solid #ffffff';
      homeEl.style.boxShadow = '0 10px 28px rgba(0,0,0,0.45)';
      homeEl.style.cursor = 'pointer';
      homeEl.style.display = 'flex';
      homeEl.style.alignItems = 'center';
      homeEl.style.justifyContent = 'center';
      homeEl.style.padding = '14px';
      homeEl.style.zIndex = '1000';
      homeEl.style.position = 'relative';
      const logoImg = document.createElement('img');
      logoImg.src = quantumLogo;
      logoImg.alt = 'Quantum Residences';
      logoImg.style.width = '100%';
      logoImg.style.height = '100%';
      logoImg.style.objectFit = 'contain';
      logoImg.style.pointerEvents = 'none';
      homeEl.appendChild(logoImg);
      homeEl.addEventListener('click', (e) => {
        e.stopPropagation();
        // Pan only, no popup
        map.current?.flyTo({
          center: QUANTUM_COORDS,
          zoom: 16.5,
          pitch: 45,
          duration: 1600,
          essential: true,
        });
      });
      homeMarker.current = new maplibregl.Marker({ element: homeEl, anchor: 'center' })
        .setLngLat(QUANTUM_COORDS)
        .addTo(map.current);
      // Ensure home marker is always rendered on top of all category markers
      const homeMarkerWrapper = homeMarker.current.getElement().parentElement;
      if (homeMarkerWrapper) {
        homeMarkerWrapper.style.zIndex = '1000';
      }

      // Smoothly pan to Quantum Residences on initial load
      map.current.flyTo({
        center: QUANTUM_COORDS,
        zoom: 16.5,
        pitch: 45,
        duration: 2200,
        curve: 1.4,
        essential: true,
      });

      setIsLoaded(true);
    });

    return () => {
      routeRequest.current += 1;
      if (routeAnim.current !== null) cancelAnimationFrame(routeAnim.current);
      popup.current?.remove();
      markers.current.forEach((m) => m.remove());
      homeMarker.current?.remove();
      map.current?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  const setRoute = (to: [number, number] | null, color?: string) => {
    // Cancel any in-flight request / running animation
    routeRequest.current += 1;
    if (routeAnim.current !== null) {
      cancelAnimationFrame(routeAnim.current);
      routeAnim.current = null;
    }
    const source = map.current?.getSource(ROUTE_SOURCE) as maplibregl.GeoJSONSource | undefined;
    if (!source) return;
    source.setData(emptyRoute);
    if (!to) return;

    const requestId = routeRequest.current;
    if (color) map.current!.setPaintProperty(ROUTE_LAYER, 'line-color', color);

    const animate = (coords: [number, number][]) => {
      const start = performance.now();
      let frame = -1;
      let lastDash = 0;
      const step = (now: number) => {
        if (requestId !== routeRequest.current || !map.current?.getLayer(ROUTE_DASH)) return;
        const t = Math.min((now - start) / DRAW_IN_MS, 1);
        if (t < 1) {
          // Draw the route in progressively (ease-out cubic)
          const eased = 1 - Math.pow(1 - t, 3);
          source.setData(lineFeature(coords.slice(0, Math.max(2, Math.ceil(eased * coords.length)))));
        } else if (frame === -1) {
          source.setData(lineFeature(coords));
          frame = 0;
        } else if (now - lastDash > 60) {
          lastDash = now;
          frame = (frame + 1) % DASH_FRAMES.length;
          map.current.setPaintProperty(ROUTE_DASH, 'line-dasharray', DASH_FRAMES[frame]);
        }
        routeAnim.current = requestAnimationFrame(step);
      };
      routeAnim.current = requestAnimationFrame(step);
    };

    // Street-following route from OSRM; straight line if it fails
    fetch(
      `https://router.project-osrm.org/route/v1/driving/${QUANTUM_COORDS[0]},${QUANTUM_COORDS[1]};${to[0]},${to[1]}?overview=full&geometries=geojson`
    )
      .then((res) => res.json())
      .then((data) => {
        const coords = data?.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined;
        if (requestId !== routeRequest.current) return;
        animate(coords && coords.length >= 2 ? coords : [QUANTUM_COORDS, to]);
      })
      .catch(() => {
        if (requestId === routeRequest.current) animate([QUANTUM_COORDS, to]);
      });
  };

  // Place markers
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    markers.current.forEach((m) => m.remove());
    markers.current = [];

    const filtered = selectedCategory
      ? places.filter((p) => p.type === selectedCategory)
      : places;

    filtered.forEach((place) => {
      const cfg = categoryConfig[place.type];
      const Icon = cfg.icon;
      const el = document.createElement('div');
      el.className = 'quantum-marker-pulse';
      el.style.setProperty('--pulse-color', `${cfg.hex}99`);
      el.style.setProperty('--pulse-color-fade', `${cfg.hex}00`);
      el.style.width = '34px';
      el.style.height = '34px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = cfg.hex;
      el.style.border = '3px solid #ffffff';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';

      const iconHost = document.createElement('div');
      iconHost.style.display = 'flex';
      createRoot(iconHost).render(<Icon size={16} color="#ffffff" strokeWidth={2.25} />);
      el.appendChild(iconHost);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onMarkerClick?.(place.name, place.coordinates);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(place.coordinates)
        .addTo(map.current!);
      const wrapper = marker.getElement().parentElement;
      if (wrapper) wrapper.style.zIndex = '1';

      markers.current.push(marker);
    });
  }, [isLoaded, places, selectedCategory, onMarkerClick]);

  // Close popup when category changes
  useEffect(() => {
    popup.current?.remove();
    setRoute(null);
  }, [selectedCategory]);

  // Fly + popup on highlight change
  useEffect(() => {
    if (!map.current || !isLoaded) return;
    popup.current?.remove();
    setRoute(null);

    if (!highlightedFeature || !highlightedCoordinates) return;

    const isHome = highlightedFeature === 'Quantum Residences';

    // Quantum Residences: pan only, no popup
    if (isHome) {
      map.current.flyTo({
        center: highlightedCoordinates,
        zoom: 16.5,
        duration: 1600,
        pitch: 45,
        curve: 1.4,
        essential: true,
      });
      return;
    }

    // Frame both the building and the landmark so the route is visible
    const bounds = new maplibregl.LngLatBounds(QUANTUM_COORDS, QUANTUM_COORDS).extend(
      highlightedCoordinates
    );
    map.current.fitBounds(bounds, {
      padding: { top: 200, bottom: 140, left: 180, right: 180 },
      maxZoom: 16.5,
      pitch: 45,
      duration: 1600,
      essential: true,
    });

    const place = places.find((p) => p.name === highlightedFeature);
    setRoute(highlightedCoordinates, place ? categoryConfig[place.type].hex : undefined);
    const html = buildPopupHTML(
      highlightedFeature,
      place?.walkDistance,
      place?.carDistance,
      false
    );

    popup.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      offset: 18,
      className: 'quantum-popup-wrapper',
    })
      .setLngLat(highlightedCoordinates)
      .setHTML(html)
      .addTo(map.current);
    popup.current.on('close', () => setRoute(null));
  }, [highlightedFeature, highlightedCoordinates, isLoaded, places]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className={cn('absolute inset-0', !apiKey && 'blur-sm')} />
      {!isLoaded && apiKey && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-3 text-sm text-muted-foreground">Loading map…</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
