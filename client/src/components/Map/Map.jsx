import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { config } from '../../utils/config';

const Map = ({
  center = { lat: 23.0225, lng: 72.5714 }, // Default to Gujarat, India
  zoom = 12,
  markers = [],
  onMapClick,
  onMarkerClick,
  className = '',
  height = '400px',
  ...props
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

                 const loader = new Loader({
           apiKey: config.googleMapsApiKey,
           version: 'weekly',
           libraries: ['places', 'geometry', 'marker'],
           mapIds: [config.googleMapsMapId]
         });

        const google = await loader.load();
        
        if (mapRef.current) {
                     const map = new google.maps.Map(mapRef.current, {
             center,
             zoom,
             mapId: config.googleMapsMapId, // Required for Advanced Markers
             mapTypeId: google.maps.MapTypeId.ROADMAP,
             mapTypeControl: false,
             streetViewControl: false,
             fullscreenControl: false
             // Removed styles property as it conflicts with mapId
           });

          mapInstanceRef.current = map;

          // Add click listener
          if (onMapClick) {
            map.addListener('click', (event) => {
              onMapClick({
                lat: event.latLng.lat(),
                lng: event.latLng.lng()
              });
            });
          }

          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setError('Failed to load map');
        setIsLoading(false);
      }
    };

    if (config.googleMapsApiKey) {
      loadMap();
    } else {
      setError('Google Maps API key not configured');
      setIsLoading(false);
    }

    return () => {
      // Cleanup markers
      markersRef.current.forEach(marker => {
        if (marker) {
          marker.map = null;
        }
      });
      markersRef.current = [];
    };
  }, [center, zoom, onMapClick]);

  // Update markers when markers prop changes
  useEffect(() => {
    if (isLoading) {
      console.log('Map: Waiting for map to finish loading before adding markers');
      return;
    }
    if (!mapInstanceRef.current || !window.google) {
      console.log('Map: Map instance or Google API not ready');
      return;
    }

    console.log('Map: Map is ready, updating markers', markers);

    // Clear existing markers
    markersRef.current.forEach(marker => {
      if (marker) {
        marker.map = null;
      }
    });
    markersRef.current = [];

    // Add new markers with a small delay to ensure map is ready
    setTimeout(() => {
      markers.forEach((markerData, index) => {
        try {
          let markerContent;
          if (markerData.icon) {
            markerContent = document.createElement('img');
            markerContent.src = markerData.icon;
            markerContent.style.width = '32px';
            markerContent.style.height = '32px';
            markerContent.style.objectFit = 'contain';
          } else {
            markerContent = document.createElement('div');
            markerContent.className = 'marker-content';
            markerContent.style.cssText = `
              width: 24px;
              height: 24px;
              background: #3B82F6;
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            `;
            const innerDot = document.createElement('div');
            innerDot.style.cssText = `
              width: 8px;
              height: 8px;
              background: white;
              border-radius: 50%;
            `;
            markerContent.appendChild(innerDot);
          }

          const marker = new google.maps.marker.AdvancedMarkerElement({
            position: { lat: markerData.lat, lng: markerData.lng },
            map: mapInstanceRef.current,
            title: markerData.title || `Marker ${index + 1}`,
            content: markerContent
          });

          console.log('Map: Created marker', marker, 'for position', markerData);
          console.log('Map: Marker map property:', marker.map);
          console.log('Map: Marker position:', marker.position);

          if (onMarkerClick) {
            marker.addListener('click', () => {
              onMarkerClick(markerData, index);
            });
          }

          markersRef.current.push(marker);
          console.log('Map: Total markers in ref:', markersRef.current.length);
        } catch (error) {
          console.error('Error creating marker:', error, markerData);
        }
      });
    }, 100); // Small delay to ensure map is ready
  }, [markers, onMarkerClick, isLoading]);

  if (error) {
    return (
      <div className={`bg-secondary-100 dark:bg-secondary-800 rounded-lg flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center">
          <p className="text-secondary-600 dark:text-secondary-400 mb-2">{error}</p>
          <p className="text-sm text-secondary-500">Please check your API key configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className} {...props}>
      {isLoading && (
        <div className="bg-secondary-100 dark:bg-secondary-800 rounded-lg flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
            <p className="text-secondary-600 dark:text-secondary-400">Loading map...</p>
          </div>
        </div>
      )}
      
      <div
        ref={mapRef}
        key={JSON.stringify(markers)}
        className="w-full rounded-lg"
        style={{ height, display: isLoading ? 'none' : 'block' }}
      />
    </div>
  );
};

export default Map; 