import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Bus,
  Church,
  ShoppingBag,
  GraduationCap,
  Navigation,
  Car,
  Home,
  Building,
  BedDouble,
  Landmark,
  ChevronRight,
  Hospital,
  Building2,
} from 'lucide-react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type CategoryKey = 'healthcare' | 'transport' | 'worship' | 'mall' | 'school' | 'hotel' | 'residential' | 'historical sites';

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
  buildPlace('Manila Doctors Hospital', 'healthcare', [120.98330901084243, 14.582225279623124]),

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
  buildPlace('MOA Complex', 'mall', [120.98667151359776, 14.540514219531026]),
  buildPlace('Cartimar Shopping Center', 'mall', [120.99602705651795, 14.551438724770588]),

  // Schools
  buildPlace('Arellano University - Jose Abad Santos Campus', 'school', [120.9955571, 14.5595325]),
  buildPlace('Arellano University - Jose Abad Santos High School', 'school', [120.99786053889241, 14.55360586220721]),
  buildPlace('Arellano University School of Law', 'school', [120.9951437, 14.5596691]),
  buildPlace('De La Salle University Manila', 'school', [120.9931652, 14.5647642]),
  buildPlace('De La Salle - College of Saint Benilde Taft Campus', 'school', [120.9947909, 14.5638473]),
  buildPlace('Asian Institute of Maritime Studies', 'school', [120.9922325, 14.5461269]),

 // Hotel & Resorts
  buildPlace('Solaire City of Dreams Manila', 'hotel', [120.98062020743764, 14.522953959404889]),

  // Residential Condominiums
 buildPlace('Met Park', 'residential', [120.9905081118793, 14.541033815168785]),

  // Historical Sites
  buildPlace('Rizal Park', 'historical sites', [120.97858140820217, 14.582862633243378]),
];

export const categoryConfig: Record<
  CategoryKey,
  { icon: any; label: string; hex: string }
> = {
  healthcare: { icon: Hospital, label: 'Healthcare', hex: '#D64545' },
  transport: { icon: Bus, label: 'Transport', hex: '#3B6FD4' },
  school: { icon: GraduationCap, label: 'Schools', hex: '#1F9AA8' },
  mall: { icon: ShoppingBag, label: 'Malls', hex: '#D14D8B' },
  hotel: { icon: BedDouble, label: 'Hotels', hex: '#C9A227' },
  worship: { icon: Church, label: 'Worship', hex: '#8A5CC7' },
  residential: { icon: Building2, label: 'Residential', hex: '#E0782F' },
  "historical sites": { icon: Landmark, label: 'Historical Sites', hex: '#9A6B3C' },
};

// Order of categories in the "All" view, by relevance to Quantum Residences'
// target residents (young professionals and students commuting to nearby CBDs)
const ALL_VIEW_ORDER: CategoryKey[] = [
  'transport',        // daily commute to work, school and CBDs
  'school',           // key for student residents
  'mall',             // groceries, dining, everyday services
  'healthcare',       // safety and essential services
  'hotel',            // visiting family, friends and business guests
  'worship',          // lifestyle / community amenity
  'residential',      // neighborhood context
  'historical sites', // tourism and area context
];

// Solid category-color circle with white icon — same look as the map markers
const CategoryIcon = ({ type, size = 'md' }: { type: CategoryKey; size?: 'sm' | 'md' }) => {
  const cfg = categoryConfig[type];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white shadow-sm',
        size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'
      )}
      style={{ backgroundColor: cfg.hex }}
    >
      <Icon className={cn('text-white', size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} strokeWidth={2.25} />
    </span>
  );
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

  // "All" view: one expanded category at a time
  const [expandedCategory, setExpandedCategory] = useState<string>('');

  // Reveal the category of a place picked from the map
  useEffect(() => {
    const place = places.find((p) => p.name === selectedPlace);
    if (place && selectedCategory === null) setExpandedCategory(place.type);
  }, [selectedPlace, selectedCategory]);

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
                      ? 'ring-2 ring-white border-white shadow-md'
                      : 'bg-white/10 hover:bg-white/20'
                  )}
                  style={isActive ? { backgroundColor: config.hex } : undefined}
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

          {selectedCategory === null && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 px-2">
                <div className="p-1.5 rounded-lg bg-white/20 flex-shrink-0">
                  <Navigation className="w-4 h-4 text-nav-foreground flex-shrink-0" />
                </div>
                <h3 className="font-semibold text-nav-foreground">Nearby Places</h3>
              </div>

              <AccordionPrimitive.Root
                type="single"
                collapsible
                value={expandedCategory}
                onValueChange={setExpandedCategory}
                className="space-y-2"
              >
                {ALL_VIEW_ORDER
                  .filter((type) => grouped[type]?.length)
                  .map((type) => {
                    const cfg = categoryConfig[type];
                    const list = grouped[type];
                    return (
                      <AccordionPrimitive.Item
                        key={type}
                        value={type}
                        className="group rounded-xl border-2 border-white/25 bg-white/10 transition-colors duration-300 data-[state=open]:border-white data-[state=open]:bg-white/20"
                      >
                        <AccordionPrimitive.Header className="flex">
                          <AccordionPrimitive.Trigger className="flex flex-1 items-center gap-3 px-3 py-2.5 min-h-[48px] rounded-xl text-left hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                            <CategoryIcon type={type} />
                            <span className="flex-1 font-semibold text-nav-foreground">{cfg.label}</span>
                            <Badge
                              variant="secondary"
                              className="bg-white/15 text-nav-foreground border-white/30"
                            >
                              {list.length}
                            </Badge>
                            <ChevronRight className="w-4 h-4 text-nav-foreground flex-shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                          </AccordionPrimitive.Trigger>
                        </AccordionPrimitive.Header>

                        <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                          <div className="px-2 pb-2 space-y-1">
                            {list.map((place) => {
                              const isSelected = selectedPlace === place.name;
                              return (
                                <button
                                  key={place.name}
                                  type="button"
                                  className={cn(
                                    'w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 min-h-[44px] text-left transition-colors duration-200',
                                    isSelected ? 'ring-2 ring-white shadow-md' : 'hover:bg-white/15'
                                  )}
                                  // Only the clicked landmark gets the full category color
                                  style={isSelected ? { backgroundColor: cfg.hex } : undefined}
                                  onClick={() => onPlaceClick(place.name, place.coordinates)}
                                >
                                  <span className="flex-1 text-sm font-medium text-nav-foreground leading-tight">
                                    {place.name}
                                  </span>
                                  <span className="flex items-center gap-1 text-xs text-nav-foreground/85 flex-shrink-0">
                                    <Navigation className="w-3 h-3" />
                                    {place.walkDistance}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </AccordionPrimitive.Content>
                      </AccordionPrimitive.Item>
                    );
                  })}
              </AccordionPrimitive.Root>
            </div>
          )}

          {selectedCategory !== null && (Object.entries(grouped) as [CategoryKey, Place[]][]).map(([type, list]) => {
            const cfg = categoryConfig[type];
            return (
              <div key={`${type}-${selectedCategory}`} className="space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 px-2">
                  <CategoryIcon type={type} />
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
                            ? 'border-white ring-2 ring-white/70 shadow-lg'
                            : 'border-white/25'
                        )}
                        style={isSelected ? { backgroundColor: cfg.hex } : undefined}
                        onClick={() => onPlaceClick(place.name, place.coordinates)}
                      >
                        <div className="space-y-3">
                           <div className="flex items-center gap-2.5">
                            <CategoryIcon type={type} size="sm" />
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
