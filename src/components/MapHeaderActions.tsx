import { useEffect, useState } from 'react';
import { CheckCircle2, Download, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { places, QUANTUM_COORDS } from './PlaceSidebar';

// Must match the "map-tiles" cache name in vite.config.ts (service worker)
const TILE_CACHE = 'map-tiles';
const MIN_ZOOM = 12;
const MAX_ZOOM = 15; // highest zoom MapTiler v3 tiles provide
const PARALLEL_DOWNLOADS = 12;

const headerButtonClass =
  'bg-white/10 border-white/40 text-nav-foreground hover:bg-white/20 hover:text-nav-foreground';

// Slippy-map tile numbers for a longitude / latitude at a zoom level
const lngToTileX = (lng: number, zoom: number) =>
  Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
const latToTileY = (lat: number, zoom: number) => {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, zoom)
  );
};

// Area covering Quantum Residences and every landmark, plus a small margin
const getMapArea = () => {
  const coords = [QUANTUM_COORDS, ...places.map((p) => p.coordinates)];
  const lngs = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  const margin = 0.01;
  return {
    west: Math.min(...lngs) - margin,
    east: Math.max(...lngs) + margin,
    south: Math.min(...lats) - margin,
    north: Math.max(...lats) + margin,
  };
};

const getTileUrls = (apiKey: string) => {
  const area = getMapArea();
  const urls = [
    `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
    `https://api.maptiler.com/tiles/v3/tiles.json?key=${apiKey}`,
  ];
  for (let z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
    for (let x = lngToTileX(area.west, z); x <= lngToTileX(area.east, z); x++) {
      for (let y = latToTileY(area.north, z); y <= latToTileY(area.south, z); y++) {
        urls.push(`https://api.maptiler.com/tiles/v3/${z}/${x}/${y}.pbf?key=${apiKey}`);
      }
    }
  }
  return urls;
};

type DownloadStatus = 'idle' | 'running' | 'done' | 'error';

/** Saves the map tiles around the project so the map works without internet. */
export const OfflineMapButton = ({ apiKey }: { apiKey: string }) => {
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const downloadMap = async () => {
    if (!apiKey || !('caches' in window)) {
      setStatus('error');
      return;
    }

    const urls = getTileUrls(apiKey);
    setStatus('running');
    setProgress({ done: 0, total: urls.length });

    try {
      const cache = await caches.open(TILE_CACHE);
      for (let i = 0; i < urls.length; i += PARALLEL_DOWNLOADS) {
        const batch = urls.slice(i, i + PARALLEL_DOWNLOADS);
        await Promise.allSettled(
          batch.map(async (url) => {
            const response = await fetch(url, { mode: 'cors' });
            if (response.ok) await cache.put(url, response);
          })
        );
        setProgress({ done: Math.min(i + PARALLEL_DOWNLOADS, urls.length), total: urls.length });
      }
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  const percent = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button
        variant="outline"
        size="sm"
        onClick={downloadMap}
        disabled={status === 'running'}
        className={`gap-2 ${headerButtonClass}`}
      >
        {status === 'running' && (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Downloading map…
          </>
        )}
        {status === 'done' && (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Map saved offline
          </>
        )}
        {(status === 'idle' || status === 'error') && (
          <>
            <Download className="w-4 h-4" />
            {status === 'error' ? 'Retry offline download' : 'Download offline map'}
          </>
        )}
      </Button>

      {status === 'running' && (
        <div className="w-full min-w-[180px] space-y-1">
          <Progress value={percent} className="h-1.5 bg-white/25 [&>div]:bg-white" />
          <p className="text-[10px] text-nav-foreground text-right tabular-nums">
            {percent}% · {progress.done} / {progress.total} map tiles
          </p>
        </div>
      )}
    </div>
  );
};

// True when the map runs inside another page (e.g. a 3DVista web frame)
export const isEmbedded = () => {
  try {
    return window.self !== window.top;
  } catch {
    return true; // cross-origin parent blocks access, so we are embedded
  }
};

// Tells the page embedding this map (e.g. the 3DVista virtual tour) to close it
const notifyParentClose = () => {
  try {
    window.parent?.postMessage({ type: 'pbw-map-close' }, '*');
  } catch {
    // Parent page unavailable — nothing to close
  }
};

/** Exit button — hides the whole map screen and asks 3DVista to close its frame. */
export const ExitMapButton = ({ onExit }: { onExit: () => void }) => {
  const exit = () => {
    notifyParentClose();
    onExit();
  };

  useEffect(() => {
    if (!isEmbedded()) return;
    // Esc also exits when embedded in the tour
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exit();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={exit}
      aria-label="Exit map"
      title="Exit map"
      className={`h-9 w-9 shrink-0 ${headerButtonClass}`}
    >
      <X className="w-4 h-4" />
    </Button>
  );
};
