import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const GameMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (map.current) return; // stops map from initializing more than once

    if (mapContainer.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [2.3522, 48.8566], // Default Paris
        zoom: 14,
        attributionControl: false
      });

      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      
      // Add geolocation control
      map.current.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          // @ts-ignore
          showUserHeading: true
        }),
        'bottom-right'
      );
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950">
      <div ref={mapContainer} className="absolute inset-0" />
      {/* HUD elements could go here */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h1 className="text-2xl font-black text-white tracking-tighter uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
          Shadow <span className="text-red-600">Runner</span>
        </h1>
      </div>
    </div>
  );
};

export default GameMap;
