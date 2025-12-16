import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapExportProps {
  apiKey: string;
}

const MapExport = ({ apiKey }: MapExportProps) => {
  const handleExport = () => {
    // Bounding box coordinates
    const topLeft = { lat: 14.386029455678152, lng: 120.89132239164793 };
    const bottomRight = { lat: 14.321451194841746, lng: 120.9154003313254 };

    // MapTiler static API bbox format: west, south, east, north
    const west = topLeft.lng;
    const south = bottomRight.lat;
    const east = bottomRight.lng;
    const north = topLeft.lat;

    // Generate static map URL with high resolution
    const width = 1920;
    const height = Math.round(width * ((north - south) / (east - west)));
    
    const staticMapUrl = `https://api.maptiler.com/maps/streets-v2/static/${west},${south},${east},${north}/${width}x${height}@2x.png?key=${apiKey}`;

    // Open in new tab for download
    window.open(staticMapUrl, '_blank');
  };

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      size="sm"
      className="gap-2"
      disabled={!apiKey}
    >
      <Download size={16} />
      Export Map
    </Button>
  );
};

export default MapExport;
