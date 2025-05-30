"use client";
import { useEffect, useRef, useState } from 'react';
import { googleMapsLoader } from '../lib/google-maps-loader';

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
  const [error, setError] = useState<string | null>(null);

  // 🚀 ULTRA-FAST MAP INITIALIZATION - Load immediately with minimal delay
  useEffect(() => {
    // Reset state for fresh initialization
    setIsLoading(true);
    setError(null);
    
    // Immediate initialization - no delay
    initializeMap();
    
    return () => {
      // Cleanup any pending operations
    };
  }, []); // Only run once on mount

  // 🎯 OPTIMIZED CENTER UPDATES - Faster handling when initialCenter changes
  useEffect(() => {
    if (map && initialCenter) {
      // Quick center update without animation for speed
      map.setCenter(initialCenter);
      
      // Direct marker position update
      if (marker) {
        marker.position = initialCenter;
      }
    }
  }, [initialCenter, map, marker]);

  const initializeMap = async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        setError('Google Maps API key not found');
        setIsLoading(false);
        return;
      }

      // Use centralized loader to prevent multiple API loads
      await googleMapsLoader.loadGoogleMaps(apiKey);
      
      if (!mapRef.current) {
        setError('Map container ref not found');
        setIsLoading(false);
        return;
      }

      // 🚀 SIMPLIFIED MAP CONFIGURATION - Minimal options for faster loading
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: 13,
        mapId: 'DEMO_MAP_ID',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        // 🚀 PERFORMANCE OPTIMIZATIONS
        disableDefaultUI: false,
        clickableIcons: false, // Disable POI clicks for better performance
        styles: [] // No custom styling for faster rendering
      });

      // 🚀 SIMPLIFIED MARKER CREATION
      const markerInstance = new window.google.maps.marker.AdvancedMarkerElement({
        position: initialCenter,
        map: mapInstance,
        gmpDraggable: true,
        title: 'Lokasi Pengiriman'
      });

      // 🚀 OPTIMIZED CLICK LISTENER - Minimal processing
      mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const position = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
          
          // Fast marker update
          markerInstance.position = position;
          
          // Lazy load reverse geocoding
          setTimeout(() => reverseGeocode(position), 0);
        }
      });

      // 🚀 OPTIMIZED DRAG LISTENER
      markerInstance.addListener('dragend', () => {
        const position = markerInstance.position;
        if (position) {
          const coords = {
            lat: position.lat,
            lng: position.lng
          };
          
          // Lazy load reverse geocoding
          setTimeout(() => reverseGeocode(coords), 0);
        }
      });

      setMap(mapInstance);
      setMarker(markerInstance);
      setIsLoading(false);
      setError(null);

      // 🚀 LAZY LOAD SEARCH FUNCTIONALITY - Load after map is ready
      setTimeout(() => {
        loadSearchFeatures(mapInstance, markerInstance);
      }, 100);

    } catch (error) {
      setError('Terjadi kesalahan saat menginisialisasi peta');
      setIsLoading(false);
    }
  };

  // 🚀 LAZY LOAD SEARCH FEATURES - Load search functionality after map is ready
  const loadSearchFeatures = async (mapInstance: google.maps.Map, markerInstance: google.maps.marker.AdvancedMarkerElement) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) return;

      // Load places library using centralized loader
      await googleMapsLoader.loadLibrary(apiKey, 'places');

      // Setup autocomplete after places library is loaded
      if (searchInputRef.current && window.google.maps.places) {
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
    } catch (error) {
      // Search features failed to load, but map still works
      console.warn('Search features failed to load:', error);
    }
  };

  // 🚀 OPTIMIZED REVERSE GEOCODING - Lazy loaded
  const reverseGeocode = async (position: { lat: number; lng: number }) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        onLocationSelect({
          ...position,
          address: `${position.lat}, ${position.lng}`
        });
        return;
      }

      // Load geocoding library using centralized loader
      await googleMapsLoader.loadLibrary(apiKey, 'geocoding');

      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({
        location: position
      });

      if (response.results[0]) {
        onLocationSelect({
          ...position,
          address: response.results[0].formatted_address
        });
      } else {
        onLocationSelect({
          ...position,
          address: `${position.lat}, ${position.lng}`
        });
      }
    } catch (error) {
      // Fallback to coordinates if geocoding fails
      onLocationSelect({
        ...position,
        address: `${position.lat}, ${position.lng}`
      });
    }
  };

  // 🚀 OPTIMIZED CURRENT LOCATION - Faster GPS access
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
          
          // Lazy load reverse geocoding
          setTimeout(() => reverseGeocode(currentPos), 0);
        }

        setIsGettingLocation(false);
      },
      (error) => {
        alert('Tidak dapat mengakses lokasi. Pastikan izin lokasi telah diberikan.');
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000, // Reduced timeout for faster response
        maximumAge: 30000 // Reduced cache time
      }
    );
  };

  // 🚀 SIMPLIFIED SEARCH HANDLER
  const handleSearch = () => {
    if (!searchValue.trim() || !map) return;

    // Use basic geocoding for manual search
    if (window.google && window.google.maps && window.google.maps.Geocoder) {
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
    }
  };

  if (isLoading) {
    return (
      <div className="relative" style={{ height }}>
        <div className="absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center">
          <div className="flex flex-col items-center text-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mb-2"></div>
            <span className="text-gray-600 mb-2">Memuat peta...</span>
            <div className="text-xs text-gray-500">
              Mohon tunggu, sedang memuat peta...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative" style={{ height }}>
        <div className="absolute inset-0 bg-red-50 rounded-lg border-2 border-red-200 flex items-center justify-center">
          <div className="text-center p-4">
            <div className="text-4xl mb-3">⚠️</div>
            <div className="text-red-700 font-medium mb-2">Gagal Memuat Peta</div>
            <div className="text-sm text-red-600 mb-4">{error}</div>
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                initializeMap();
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Coba Lagi
            </button>
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
            className="flex-1 px-3 py-2 text-sm focus:outline-none bg-white text-gray-900"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            autoComplete="off"
            spellCheck="false"
            autoCorrect="off"
            autoCapitalize="off"
            style={{ fontSize: '16px' }}
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
          Klik pada peta untuk memilih lokasi atau seret marker untuk menyesuaikan posisi
        </div>
      </div>
    </div>
  );
} 