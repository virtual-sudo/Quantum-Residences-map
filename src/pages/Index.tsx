import { useEffect, useState } from 'react';
import MapView from '@/components/MapView';
import PlaceSidebar, { places, CategoryKey } from '@/components/PlaceSidebar';
import { OfflineMapButton, ExitMapButton } from '@/components/MapHeaderActions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { KeyRound } from 'lucide-react';
import quantumLogo from '@/assets/quantum-logo.png';

const Index = () => {
  const [apiKey, setApiKey] = useState('TzNncyeb8gVUMH68QKMX');
  const [tempApiKey, setTempApiKey] = useState('TzNncyeb8gVUMH68QKMX');
  const [highlightedFeature, setHighlightedFeature] = useState<string | null>(null);
  const [highlightedCoordinates, setHighlightedCoordinates] = useState<[number, number] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);

  const [isExited, setIsExited] = useState(false);

  // The tour can re-show the map by posting { type: 'pbw-map-open' }
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'pbw-map-open') setIsExited(false);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Let the tour show through the frame while the map is hidden
  useEffect(() => {
    document.documentElement.style.background = isExited ? 'transparent' : '';
    document.body.style.background = isExited ? 'transparent' : '';
  }, [isExited]);

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApiKey(tempApiKey);
  };

  if (isExited) return null;

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      <header className="h-16 border-b border-white/20 bg-nav-background flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <img src={quantumLogo} alt="Quantum Residences logo" className="h-14 w-auto" />
          <div>
            <h1 className="text-xl font-bold text-nav-foreground">Quantum Residences</h1>
            <p className="text-xs text-nav-foreground/85">Intersection of Taft & Buendia, Pasay</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <OfflineMapButton apiKey={apiKey} />
          <ExitMapButton onExit={() => setIsExited(true)} />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 flex-shrink-0">
          <PlaceSidebar
            onPlaceClick={(placeName, coordinates) => {
              setSelectedPlace(placeName);
              setHighlightedFeature(placeName);
              setHighlightedCoordinates(coordinates || null);
            }}
            selectedCategory={selectedCategory}
            onCategoryChange={(category) => {
              setSelectedCategory(category);
              setSelectedPlace(null);
            }}
            selectedPlace={selectedPlace}
          />
        </aside>

        <main className="flex-1 relative">
          {!apiKey ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/95 backdrop-blur-sm z-10">
              <div className="w-full max-w-md p-8 space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex p-3 bg-primary/10 rounded-full mb-2">
                    <KeyRound className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Enter MapTiler API Key</h2>
                  <p className="text-sm text-muted-foreground">
                    To view the interactive map, please enter your MapTiler API key
                  </p>
                </div>

                <Alert>
                  <AlertDescription className="text-xs">
                    Get your free API key at{' '}
                    <a
                      href="https://cloud.maptiler.com/maps/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      cloud.maptiler.com
                    </a>
                  </AlertDescription>
                </Alert>

                <form onSubmit={handleApiKeySubmit} className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Enter your MapTiler API key"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    className="h-12"
                  />
                  <Button type="submit" className="w-full h-12" disabled={!tempApiKey}>
                    Load Map
                  </Button>
                </form>
              </div>
            </div>
          ) : null}

          <MapView
            apiKey={apiKey}
            highlightedFeature={highlightedFeature}
            highlightedCoordinates={highlightedCoordinates}
            places={places}
            selectedCategory={selectedCategory}
            selectedPlace={selectedPlace}
            onMarkerClick={(placeName, coordinates) => {
              setSelectedPlace(placeName);
              setHighlightedFeature(placeName);
              setHighlightedCoordinates(coordinates);
            }}
          />
        </main>
      </div>
    </div>
  );
};

export default Index;

