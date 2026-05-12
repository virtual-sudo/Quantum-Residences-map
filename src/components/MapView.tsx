import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { cn } from '@/lib/utils';
import { Place, CategoryKey, categoryConfig, QUANTUM_COORDS } from './PlaceSidebar';
import { HeartPulse, Bus, Church, ShoppingBag, GraduationCap } from 'lucide-react';
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

const categoryIcons: Record<CategoryKey, any> = {
  healthcare: HeartPulse,
  transport: Bus,
  worship: Church,
  mall: ShoppingBag,
  school: GraduationCap,
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

      // Home marker for Quantum Residences (logo in themed gradient)
      const homeEl = document.createElement('div');
      homeEl.style.width = '76px';
      homeEl.style.height = '76px';
      homeEl.style.borderRadius = '50%';
      homeEl.style.background =
        'linear-gradient(135deg, #E7A025 0%, #B2564A 55%, #742C7B 100%)';
      homeEl.style.border = '4px solid #ffffff';
      homeEl.style.boxShadow = '0 8px 22px rgba(0,0,0,0.4)';
      homeEl.style.cursor = 'pointer';
      homeEl.style.display = 'flex';
      homeEl.style.alignItems = 'center';
      homeEl.style.justifyContent = 'center';
      homeEl.style.padding = '8px';
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
        onMarkerClick?.('Quantum Residences', QUANTUM_COORDS);
      });
      homeMarker.current = new maplibregl.Marker({ element: homeEl, anchor: 'center' })
        .setLngLat(QUANTUM_COORDS)
        .addTo(map.current);

      // Ensure we are centered on Quantum Residences on load
      map.current.jumpTo({ center: QUANTUM_COORDS, zoom: 16, pitch: 45 });

      setIsLoaded(true);
    });

    return () => {
      popup.current?.remove();
      markers.current.forEach((m) => m.remove());
      homeMarker.current?.remove();
      map.current?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

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
      const Icon = categoryIcons[place.type];
      const el = document.createElement('div');
      el.style.width = '34px';
      el.style.height = '34px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#ffffff';
      el.style.border = `3px solid ${cfg.hex}`;
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';

      const iconHost = document.createElement('div');
      createRoot(iconHost).render(<Icon size={16} color={cfg.hex} strokeWidth={2.5} />);
      el.appendChild(iconHost);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onMarkerClick?.(place.name, place.coordinates);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(place.coordinates)
        .addTo(map.current!);

      markers.current.push(marker);
    });
  }, [isLoaded, places, selectedCategory, onMarkerClick]);

  // Close popup when category changes
  useEffect(() => {
    popup.current?.remove();
  }, [selectedCategory]);

  // Fly + popup on highlight change
  useEffect(() => {
    if (!map.current || !isLoaded) return;
    popup.current?.remove();

    if (!highlightedFeature || !highlightedCoordinates) return;

    const isHome = highlightedFeature === 'Quantum Residences';
    map.current.flyTo({
      center: highlightedCoordinates,
      zoom: isHome ? 16.5 : 16,
      duration: 1400,
      pitch: 45,
    });

    const place = places.find((p) => p.name === highlightedFeature);
    const html = buildPopupHTML(
      highlightedFeature,
      place?.walkDistance,
      place?.carDistance,
      isHome
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
