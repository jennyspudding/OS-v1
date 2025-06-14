"use client";
import { useEffect, useRef, useState } from 'react';
import { googleMapsLoader } from '../lib/google-maps-loader';

interface SimpleGoogleMapProps {
  initialCenter?: { lat: number; lng: number };
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  height?: string;
  regionBounds?: {
    province?: string;
    city?: string;
    district?: string;
  };
}

declare global {
  interface Window {
    google: any;
    initGoogleMap: () => void;
  }
}

// Indonesia coordinate bounds for validation
const INDONESIA_BOUNDS = {
  north: 6.0,    // Northern tip of Sumatra
  south: -11.0,  // Southern tip of Java
  east: 141.0,   // Eastern tip of Papua
  west: 95.0     // Western tip of Sumatra
};

// Validate if coordinates are within Indonesia
function validateIndonesianCoordinates(lat: number, lng: number): boolean {
  return (
    lat >= INDONESIA_BOUNDS.south &&
    lat <= INDONESIA_BOUNDS.north &&
    lng >= INDONESIA_BOUNDS.west &&
    lng <= INDONESIA_BOUNDS.east
  );
}

export default function SimpleGoogleMap({ 
  initialCenter = { lat: -6.1751, lng: 106.8650 }, // Central Jakarta (Menteng area)
  onLocationSelect,
  height = "300px",
  regionBounds
}: SimpleGoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 🚀 ULTRA-FAST MAP INITIALIZATION - Load immediately with minimal delay
  useEffect(() => {
    // Reset state for fresh initialization
    setIsLoading(true);
    setError(null);
    setIsInitialized(false);
    
    // Immediate initialization - no delay
    loadGoogleMaps();
    
    return () => {
      // Cleanup any pending operations
    };
  }, []); // Only run once on mount

  // 🎯 OPTIMIZED CENTER UPDATES - Faster handling when initialCenter changes
  useEffect(() => {
    if (map && marker && initialCenter && isInitialized) {
      // Quick center update without animation for speed
      map.setCenter(initialCenter);
      
      // Direct marker position update
      if (marker.position) {
        marker.position = initialCenter;
      } else if (marker.setPosition) {
        marker.setPosition(initialCenter);
      }
    }
  }, [initialCenter, map, marker, isInitialized]);

  const loadGoogleMaps = async () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setError('Google Maps API key not found');
      setIsLoading(false);
      return;
    }

    try {
      // Use centralized loader to prevent multiple API loads
      await googleMapsLoader.loadGoogleMaps(apiKey);
      initializeMap();
    } catch (error) {
      setError('Gagal memuat Google Maps. Periksa koneksi internet Anda.');
      setIsLoading(false);
    }
  };

  const initializeMap = () => {
    try {
      if (!mapRef.current) {
        setError('Map container tidak ditemukan');
        setIsLoading(false);
        return;
      }

      if (!window.google || !window.google.maps) {
        setError('Google Maps API tidak tersedia');
        setIsLoading(false);
        return;
      }

      // Clear any existing map content
      mapRef.current.innerHTML = '';

      // 🚀 SIMPLIFIED MAP CONFIGURATION - Minimal options for faster loading
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: 13,
        mapId: 'DEMO_MAP_ID',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: 'cooperative',
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_CENTER
        },
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

      // Expose marker globally for coordinate access
      (window as any).currentMapMarker = markerInstance;
      console.log('🌐 Marker exposed globally for real-time coordinate access');

      // 🚀 OPTIMIZED CLICK LISTENER - Minimal processing
      mapInstance.addListener('click', (event: any) => {
        if (event.latLng) {
          const position = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
          
          // Quick validation
          if (!validateIndonesianCoordinates(position.lat, position.lng)) {
            alert('Lokasi yang dipilih berada di luar wilayah Indonesia. Silakan pilih lokasi di dalam wilayah Indonesia.');
            return;
          }
          
          // Fast marker update
          markerInstance.position = position;
          
          // Update global reference
          (window as any).currentMapMarker = markerInstance;
          console.log('🎯 Marker position updated globally:', position);
          
          // Lazy load reverse geocoding
          setTimeout(() => reverseGeocode(position), 0);
        }
      });

      // 🚀 OPTIMIZED DRAG LISTENER
      markerInstance.addListener('dragend', () => {
        const position = markerInstance.position;
        if (position) {
          const coords = {
            lat: typeof position.lat === 'function' ? position.lat() : position.lat,
            lng: typeof position.lng === 'function' ? position.lng() : position.lng
          };
          
          // Quick validation
          if (!validateIndonesianCoordinates(coords.lat, coords.lng)) {
            alert('Lokasi yang dipilih berada di luar wilayah Indonesia. Silakan pilih lokasi di dalam wilayah Indonesia.');
            markerInstance.position = initialCenter;
            return;
          }
          
          // Update global reference
          (window as any).currentMapMarker = markerInstance;
          console.log('🎯 Marker position updated globally via drag:', coords);
          
          // Lazy load reverse geocoding
          setTimeout(() => reverseGeocode(coords), 0);
        }
      });

      setMap(mapInstance);
      setMarker(markerInstance);
      setIsLoading(false);
      setError(null);
      setIsInitialized(true);
      
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
  const loadSearchFeatures = async (mapInstance: any, markerInstance: any) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) return;

      // Since we now load all libraries at once, just check if places is available
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log('Places library already available, setting up autocomplete...');
        setupAutocomplete(mapInstance, markerInstance);
        return;
      }

      // If not available, wait a bit and try again (libraries might still be initializing)
      let attempts = 0;
      const maxAttempts = 5;
      
      const checkPlaces = () => {
        attempts++;
        if (window.google && window.google.maps && window.google.maps.places) {
          console.log(`Places library became available after ${attempts} attempts`);
          setupAutocomplete(mapInstance, markerInstance);
        } else if (attempts < maxAttempts) {
          console.log(`Places library not ready, attempt ${attempts}/${maxAttempts}, retrying...`);
          setTimeout(checkPlaces, 1000);
        } else {
          console.warn('Places library failed to load after maximum attempts');
        }
      };
      
      checkPlaces();

    } catch (error) {
      // Search features failed to load, but map still works
      console.warn('Search features failed to load:', error);
    }
  };

  // Separate function to setup autocomplete
  const setupAutocomplete = (mapInstance: any, markerInstance: any) => {
    try {
      if (searchInputRef.current && window.google.maps.places) {
        const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
          componentRestrictions: { country: 'id' },
          fields: ['place_id', 'geometry', 'name', 'formatted_address'],
          types: ['establishment', 'geocode']
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          
          if (place.geometry?.location) {
            const position = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            };
            
            if (!validateIndonesianCoordinates(position.lat, position.lng)) {
              alert('Lokasi yang dipilih berada di luar wilayah Indonesia. Silakan pilih lokasi di dalam wilayah Indonesia.');
              return;
            }
            
            mapInstance.setCenter(position);
            mapInstance.setZoom(17);
            markerInstance.position = position;
            
            if (searchInputRef.current) {
              searchInputRef.current.value = '';
            }
            setSearchValue('');
            
            onLocationSelect({
              ...position,
              address: place.formatted_address || place.name || ''
            });
          }
        });
        
        console.log('Autocomplete setup completed successfully');
      }
    } catch (error) {
      console.warn('Error setting up autocomplete:', error);
    }
  };

  // 🚀 OPTIMIZED REVERSE GEOCODING - Lazy loaded with timeout
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

      // Since we now load all libraries at once, check if Geocoder is available
      if (window.google && window.google.maps && window.google.maps.Geocoder) {
        console.log('Geocoder already available, performing reverse geocoding...');
        performReverseGeocode(position);
        return;
      }

      // If not available, wait a bit and try again (libraries might still be initializing)
      let attempts = 0;
      const maxAttempts = 5;
      
      const checkGeocoder = () => {
        attempts++;
        if (window.google && window.google.maps && window.google.maps.Geocoder) {
          console.log(`Geocoder became available after ${attempts} attempts`);
          performReverseGeocode(position);
        } else if (attempts < maxAttempts) {
          console.log(`Geocoder not ready, attempt ${attempts}/${maxAttempts}, retrying...`);
          setTimeout(checkGeocoder, 1000);
        } else {
          console.warn('Geocoder failed to load after maximum attempts, using coordinates');
          onLocationSelect({
            ...position,
            address: `${position.lat}, ${position.lng}`
          });
        }
      };
      
      checkGeocoder();

    } catch (error) {
      // Fallback to coordinates if geocoding fails
      console.warn('Reverse geocoding error:', error);
      onLocationSelect({
        ...position,
        address: `${position.lat}, ${position.lng}`
      });
    }
  };

  // Separate function to perform reverse geocoding
  const performReverseGeocode = async (position: { lat: number; lng: number }) => {
    try {
      const geocoder = new window.google.maps.Geocoder();
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
      console.warn('Geocoding request failed:', error);
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
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        {
          address: searchValue,
          componentRestrictions: { country: 'id' }
        },
        (results: any, status: any) => {
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

  return (
    <div className="relative w-full" style={{ height }}>
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d63384] mx-auto mb-2"></div>
            <div className="text-sm text-gray-600">Memuat peta...</div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-20">
          <div className="text-center p-4">
            <div className="text-red-500 mb-2">⚠️</div>
            <div className="text-sm text-red-600">{error}</div>
            <button 
              onClick={loadGoogleMaps}
              className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full rounded-lg" />

      {/* Enhanced Map Controls Overlay */}
      {!isLoading && !error && (
        <div className="absolute top-3 left-3 right-3 z-10 pointer-events-none">
          <div className="flex justify-between items-start">
            {/* Instructions Card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-200 max-w-xs pointer-events-auto">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-[#d63384] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-800">Cara Menggunakan</span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>• Klik di peta untuk pin lokasi</div>
                <div>• Seret pin merah untuk pindah</div>
                <div>• Zoom in/out untuk detail</div>
              </div>
            </div>

            {/* Current Location Button */}
            <button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-200 hover:bg-white transition-colors pointer-events-auto disabled:opacity-50"
              title="Gunakan lokasi saya"
            >
              {isGettingLocation ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#d63384]"></div>
              ) : (
                <svg className="w-5 h-5 text-[#d63384]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {!isLoading && !error && (
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center">
              <div className="flex-1 flex items-center px-4 py-3">
                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Cari alamat atau tempat..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-3 bg-[#d63384] text-white hover:bg-[#b02a5b] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 