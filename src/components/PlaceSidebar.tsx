import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  HeartPulse,
  Bus,
  Church,
  ShoppingBag,
  GraduationCap,
  Navigation,
  Car,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type CategoryKey = 'healthcare' | 'transport' | 'worship' | 'mall' | 'school';

export interface Place {
  name: string;
  type: CategoryKey;
  walkDistance: string;
  carDistance: string;
  coordinates: [number, number];
}

interface PlaceSidebarProps {
  onPlaceClick: (placeName: string, coordinates?: [number, number]) => void;
  selectedCategory: CategoryKey | null;
  onCategoryChange: (category: CategoryKey | null) => void;
  selectedPlace: string | null;
}

// Origin: Quantum Residences
export const QUANTUM_COORDS: [number, number] = [120.9980211, 14.5527891];

// Haversine in km
const distanceKm = (a: [number, number], b: [number, number]) => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
};

const fmtKm = (km: number) => `${km.toFixed(1)} km`;

const buildPlace = (
  name: string,
  type: CategoryKey,
  coordinates: [number, number]
): Place => {
  const d = distanceKm(QUANTUM_COORDS, coordinates);
  return {
    name,
    type,
    coordinates,
    walkDistance: fmtKm(d * 1.3),
    carDistance: fmtKm(Math.max(d * 1.2, 0.3)),
  };
};

// Places sourced from Quantum_Residences.kml
export const places: Place[] = [
  // Healthcare
  buildPlace('Makati Medical Center', 'healthcare', [121.014828, 14.5591862]),
  buildPlace('Adventist Medical Center', 'healthcare', [120.9952498, 14.5561155]),
  buildPlace('Pasay City General Hospital', 'healthcare', [121.0009273, 14.5492968]),

  // Transport Hub
  buildPlace('LRT Gil Puyat', 'transport', [120.9972465, 14.5535919]),
  buildPlace('Libertad Station South Entry', 'transport', [120.9986078, 14.5475506]),
  buildPlace('Jam Liner Buendia Bus Station', 'transport', [120.9967611, 14.5551027]),
  buildPlace('ALPS Buendia Terminal', 'transport', [120.9965939, 14.555617]),
  buildPlace('JAC Liner Terminal - Buendia', 'transport', [120.9965911, 14.5542468]),

  // Place of Worship
  buildPlace('Pasay Central Seventh-day Adventist Church', 'worship', [120.9960637, 14.5543876]),
  buildPlace('Pasay First United Methodist Church', 'worship', [120.9985833, 14.5504752]),
  buildPlace('Sta. Clara de Montefalco Parish', 'worship', [121.001057, 14.5489727]),

  // Mall
  buildPlace('Cash & Carry Mall', 'mall', [121.005787, 14.5586644]),
  buildPlace('Makati Square', 'mall', [121.0146088, 14.5523286]),
  buildPlace('WalterMart Makati', 'mall', [121.013095, 14.5513096]),

  // Schools
  buildPlace('Arellano University - Jose Abad Santos Campus', 'school', [120.9955571, 14.5595325]),
  buildPlace('Arellano University School of Law', 'school', [120.9951437, 14.5596691]),
  buildPlace('De La Salle University Manila', 'school', [120.9931652, 14.5647642]),
  buildPlace('De La Salle - College of Saint Benilde Taft Campus', 'school', [120.9947909, 14.5638473]),
  buildPlace('Asian Institute of Maritime Studies', 'school', [120.9922325, 14.5461269]),
];

export const categoryConfig: Record<
  CategoryKey,
  { icon: any; label: string; hex: string }
> = {
  healthcare: { icon: HeartPulse, label: 'Healthcare', hex: '#B2564A' },
  transport: { icon: Bus, label: 'Transport', hex: '#742C7B' },
  worship: { icon: Church, label: 'Worship', hex: '#E7A025' },
  mall: { icon: ShoppingBag, label: 'Malls', hex: '#C73E2F' },
  school: { icon: GraduationCap, label: 'Schools', hex: '#8B3F6B' },
};

const PlaceSidebar = ({
  onPlaceClick,
  selectedCategory,
  onCategoryChange,
  selectedPlace,
}: PlaceSidebarProps) => {
  const filtered = selectedCategory
    ? places.filter((p) => p.type === selectedCategory)
    : places;

  const grouped = filtered.reduce((acc, p) => {
    (acc[p.type] ||= []).push(p);
    return acc;
  }, {} as Record<CategoryKey, Place[]>);

  return (
    <div className="h-full flex flex-col bg-nav-background border-r border-white/15 shadow-lg">
      <div className="p-6 border-b border-white/15 space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-nav-foreground">Nearby Places</h2>
          <p className="text-sm text-nav-foreground/80 mt-1">from Quantum Residences</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className={cn(
              'cursor-pointer transition-all border-white/40 text-nav-foreground',
              selectedCategory === null
                ? 'bg-white/25 hover:bg-white/30'
                : 'bg-white/10 hover:bg-white/20'
            )}
            onClick={() => onCategoryChange(null)}
          >
            All
          </Badge>
          {(Object.entries(categoryConfig) as [CategoryKey, typeof categoryConfig[CategoryKey]][]).map(
            ([type, config]) => {
              const Icon = config.icon;
              const isActive = selectedCategory === type;
              return (
                <Badge
                  key={type}
                  variant="outline"
                  className={cn(
                    'cursor-pointer gap-1 transition-all border-white/40 text-nav-foreground',
                    isActive
                      ? 'bg-white/30 ring-2 ring-white border-white'
                      : 'bg-white/10 hover:bg-white/20'
                  )}
                  onClick={() => onCategoryChange(type)}
                >
                     <Icon className="w-3 h-3 flex-shrink-0" />
                  {config.label}
                </Badge>
              );
            }
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Quantum Residences (your location) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-2">
             <div className="p-1.5 rounded-lg bg-white/20 flex-shrink-0">
                <Home className="w-4 h-4 text-nav-foreground flex-shrink-0" />
              </div>
              <h3 className="font-semibold text-nav-foreground">Your Location</h3>
            </div>

            <Card
              className={cn(
                'p-4 cursor-pointer transition-all duration-300 border-2 bg-white/10 hover:bg-white/20',
                selectedPlace === 'Quantum Residences'
                  ? 'border-white bg-white/25 ring-2 ring-white/60'
                  : 'border-white/30'
              )}
              onClick={() => onPlaceClick('Quantum Residences', QUANTUM_COORDS)}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-nav-foreground" />
                  <h4 className="font-semibold text-nav-foreground">Quantum Residences</h4>
                </div>
                <p className="text-xs text-nav-foreground/80">
                  Intersection of Taft & Buendia, Pasay
                </p>
              </div>
            </Card>
          </div>

          {(Object.entries(grouped) as [CategoryKey, Place[]][]).map(([type, list]) => {
            const cfg = categoryConfig[type];
            const Icon = cfg.icon;
            return (
              <div key={`${type}-${selectedCategory}`} className="space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 px-2">
                  <div
                    className="p-1.5 rounded-lg flex items-center justify-center flex-shrink-0 w-7 h-7"
                    style={{ backgroundColor: `${cfg.hex}33` }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: '#fff' }} />
                  </div>
                  <h3 className="font-semibold text-nav-foreground">{cfg.label}</h3>
                  <Badge
                    variant="secondary"
                    className="ml-auto bg-white/15 text-nav-foreground border-white/30"
                  >
                    {list.length}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {list.map((place) => {
                    const isSelected = selectedPlace === place.name;
                    return (
                      <Card
                        key={place.name}
                        className={cn(
                          'p-4 cursor-pointer transition-all duration-300 border-2 bg-white/10 hover:bg-white/20',
                          isSelected
                            ? 'border-white bg-white/25 ring-2 ring-white/70 shadow-[0_8px_24px_-8px_rgba(231,160,37,0.7)]'
                            : 'border-white/25'
                        )}
                        onClick={() => onPlaceClick(place.name, place.coordinates)}
                      >
                        <div className="space-y-3">
                           <div className="flex items-start gap-2">
                            <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: cfg.hex }} />
                            <h4 className="font-medium text-nav-foreground leading-tight">
                              {place.name}
                            </h4>
                          </div>

                          <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-1.5 text-nav-foreground/85">
                              <Navigation className="w-3.5 h-3.5" />
                              <span>{place.walkDistance}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-nav-foreground/85">
                              <Car className="w-3.5 h-3.5" />
                              <span>{place.carDistance}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PlaceSidebar;
