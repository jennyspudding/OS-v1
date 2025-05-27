"use client";
import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface InteractiveMapProps {
  initialCenter?: { lat: number; lng: number };
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  height?: string;
}

export default function InteractiveMap({ 
  initialCenter = { lat: -6.2088, lng: 106.8456 },
  onLocationSelect,
  height = "300px"
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [forceReload, setForceReload] = useState(0);

  // Auto-reload map when component mounts or when forced
  useEffect(() => {
    console.log('InteractiveMap: Component mounted or force reload triggered');
    initializeMap();
  }, [forceReload]);

  // Force reload when entering the page
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('InteractiveMap: Auto-reloading map after 500ms');
      setForceReload(prev => prev + 1);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (map && initialCenter) {
      map.setCenter(initialCenter);
      if (marker) {
        marker.position = initialCenter;
      }
    }
  }, [initialCenter, map, marker]);

  const initializeMap = async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      console.log('Initializing Google Maps...');
      console.log('API Key available:', apiKey ? 'Yes' : 'No');
      console.log('API Key length:', apiKey ? apiKey.length : 0);
      
      if (!apiKey) {
        console.error('Google Maps API key not found');
        setIsLoading(false);
        return;
      }

      console.log('Creating Google Maps loader...');
      const loader = new Loader({
        apiKey,
        version: 'weekly',
        libraries: ['places', 'geocoding', 'marker']
      });

      console.log('Loading Google Maps API...');
      const google = await Promise.race([
        loader.load(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Google Maps loading timeout after 15 seconds')), 15000)
        )
      ]) as typeof window.google;
      
      console.log('Google Maps API loaded successfully');
      
      if (!mapRef.current) {
        console.error('Map container ref not found');
        return;
      }

      console.log('Creating map instance...');
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: 13,
        mapId: 'DEMO_MAP_ID', // Required for AdvancedMarkerElement
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      console.log('Map instance created, adding listeners...');

      // Create marker using AdvancedMarkerElement (new recommended approach)
      const markerInstance = new google.maps.marker.AdvancedMarkerElement({
        position: initialCenter,
        map: mapInstance,
        gmpDraggable: true,
        title: 'Lokasi Pengiriman'
      });

      console.log('Marker created');

      // Add click listener to map
      mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const position = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
          markerInstance.position = position;
          reverseGeocode(position);
        }
      });

      // Add drag listener to marker for AdvancedMarkerElement
      markerInstance.addListener('dragend', (event: any) => {
        const position = markerInstance.position;
        if (position) {
          const coords = {
            lat: position.lat,
            lng: position.lng
          };
          reverseGeocode(coords);
        }
      });

      // Initialize Places Autocomplete
      if (searchInputRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
          componentRestrictions: { country: 'id' },
          fields: ['place_id', 'geometry', 'name', 'formatted_address']
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry?.location) {
            const position = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            };
            mapInstance.setCenter(position);
            mapInstance.setZoom(17);
            markerInstance.position = position;
            onLocationSelect({
              ...position,
              address: place.formatted_address || place.name || ''
            });
          }
        });
      }

      console.log('Setting up map state...');
      setMap(mapInstance);
      setMarker(markerInstance);
      
      console.log('Map initialization complete, setting loading to false');
      setIsLoading(false);

    } catch (error) {
      console.error('Error loading Google Maps:', error);
      console.error('Error details:', error);
      setIsLoading(false);
    }
  };

  const reverseGeocode = async (position: { lat: number; lng: number }) => {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({
        location: position
      });

      if (response.results[0]) {
        onLocationSelect({
          ...position,
          address: response.results[0].formatted_address
        });
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      onLocationSelect({
        ...position,
        address: `${position.lat}, ${position.lng}`
      });
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung oleh browser ini.');
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        if (map && marker) {
          map.setCenter(currentPos);
          map.setZoom(17);
          marker.position = currentPos;
          reverseGeocode(currentPos);
        }

        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Tidak dapat mengakses lokasi. Pastikan izin lokasi telah diberikan.');
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleSearch = () => {
    if (!searchValue.trim() || !map) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      {
        address: searchValue,
        componentRestrictions: { country: 'id' }
      },
      (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          const position = {
            lat: location.lat(),
            lng: location.lng()
          };

          map.setCenter(position);
          map.setZoom(17);
          if (marker) {
            marker.position = position;
          }
          onLocationSelect({
            ...position,
            address: results[0].formatted_address
          });
        } else {
          alert('Lokasi tidak ditemukan. Coba dengan alamat yang lebih spesifik.');
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="relative" style={{ height }}>
        <div className="absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center">
          <div className="flex flex-col items-center text-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mb-2"></div>
            <span className="text-gray-600 mb-2">Memuat peta...</span>
            <div className="text-xs text-gray-500">
              Jika peta tidak muncul dalam 15 detik, periksa koneksi internet atau API key
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!map) {
    return (
      <div className="relative" style={{ height }}>
        <div className="absolute inset-0 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
          <div className="text-center p-4">
            <div className="text-4xl mb-3">⚠️</div>
            <div className="text-gray-700 font-medium mb-2">Peta Tidak Dapat Dimuat</div>
            <div className="text-sm text-gray-600">
              Pastikan Google Maps API key sudah dikonfigurasi dengan benar
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height }}>
      {/* Search Bar and Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex gap-2">
        <div className="flex-1 flex bg-white rounded-lg shadow-md overflow-hidden">
          <input
            ref={searchInputRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Cari alamat lengkap Anda..."
            className="flex-1 px-3 py-2 text-sm focus:outline-none"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="px-3 py-2 bg-pink-500 text-white hover:bg-pink-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
        
        <button
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="px-3 py-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          title="Gunakan lokasi saya"
        >
          {isGettingLocation ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500"></div>
          ) : (
            <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
      </div>

      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full rounded-lg" />

      {/* Instructions */}
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <div className="bg-white bg-opacity-90 rounded-lg px-3 py-2 text-xs text-gray-600 text-center">
          Cari alamat lengkap Anda atau gunakan "Lokasi Saya" untuk mendapatkan koordinat yang tepat
        </div>
      </div>
    </div>
  );
} 