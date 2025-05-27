"use client";
import { useEffect, useRef, useState } from 'react';

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
  initialCenter = { lat: -6.2088, lng: 106.8456 },
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
  const [retryCount, setRetryCount] = useState(0);
  const [forceReload, setForceReload] = useState(0);

  // Auto-reload map when component mounts or when forced
  useEffect(() => {
    console.log('SimpleGoogleMap: Component mounted or force reload triggered');
    loadGoogleMaps();
  }, [forceReload]);

  // Force reload when entering the page (triggered by parent component key change)
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('SimpleGoogleMap: Auto-reloading map after 500ms');
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

  const loadGoogleMaps = () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    console.log('Loading Google Maps... (Attempt:', retryCount + 1, ')');
    console.log('API Key available:', apiKey ? 'Yes' : 'No');
    
    if (!apiKey) {
      setError('Google Maps API key not found');
      setIsLoading(false);
      return;
    }

    // Reset error state when retrying
    setError(null);

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      console.log('Google Maps already loaded');
      initializeMap();
      return;
    }

    // Create unique callback function name to avoid conflicts
    const callbackName = `initGoogleMap_${Date.now()}`;
    (window as any)[callbackName] = () => {
      console.log('Google Maps callback triggered');
      initializeMap();
      // Clean up callback
      delete (window as any)[callbackName];
    };

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geocoding,marker&loading=async&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    
    script.onerror = (error) => {
      console.error('Failed to load Google Maps script:', error);
      setError('Failed to load Google Maps. Please check your internet connection or API key.');
      setIsLoading(false);
      // Clean up callback on error
      delete (window as any)[callbackName];
    };
    
    // Check if script with same src already exists
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      console.log('Google Maps script already exists, removing old one');
      existingScript.remove();
    }
    
    document.head.appendChild(script);

    // Timeout after 45 seconds with retry logic
    setTimeout(() => {
      if (isLoading) {
        if (retryCount < 2) { // Allow up to 3 attempts
          console.log('Google Maps loading timeout, retrying...');
          setRetryCount(prev => prev + 1);
          loadGoogleMaps();
        } else {
          console.log('Google Maps failed to load after 3 attempts');
          setError('Google Maps gagal dimuat. Silakan refresh halaman.');
          setIsLoading(false);
        }
      }
    }, 45000);
  };

  const initializeMap = () => {
    try {
      console.log('Initializing map...');
      
      if (!mapRef.current) {
        console.error('Map container not found');
        setError('Map container not found');
        setIsLoading(false);
        return;
      }

      if (!window.google || !window.google.maps) {
        console.error('Google Maps API not available');
        setError('Google Maps API not available');
        setIsLoading(false);
        return;
      }

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: 13,
        mapId: 'DEMO_MAP_ID', // Required for AdvancedMarkerElement
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      // Create marker using AdvancedMarkerElement (new recommended approach)
      const markerInstance = new window.google.maps.marker.AdvancedMarkerElement({
        position: initialCenter,
        map: mapInstance,
        gmpDraggable: true,
        title: 'Lokasi Pengiriman'
      });

      // Add click listener
      mapInstance.addListener('click', (event: any) => {
        if (event.latLng) {
          const position = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
          
          // Validate coordinates are within Indonesia
          if (!validateIndonesianCoordinates(position.lat, position.lng)) {
            alert('Lokasi yang dipilih berada di luar wilayah Indonesia. Silakan pilih lokasi di dalam wilayah Indonesia.');
            return;
          }
          
          markerInstance.position = position;
          reverseGeocode(position);
        }
      });

      // Add drag listener for AdvancedMarkerElement
      markerInstance.addListener('dragend', (event: any) => {
        const position = markerInstance.position;
        if (position) {
          const coords = {
            lat: position.lat,
            lng: position.lng
          };
          
          // Validate coordinates are within Indonesia
          if (!validateIndonesianCoordinates(coords.lat, coords.lng)) {
            alert('Lokasi yang dipilih berada di luar wilayah Indonesia. Silakan pilih lokasi di dalam wilayah Indonesia.');
            // Reset marker to previous valid position
            markerInstance.position = initialCenter;
            return;
          }
          
          reverseGeocode(coords);
        }
      });

      // Initialize autocomplete with regional filtering
      if (searchInputRef.current) {
        // Create bounds for regional filtering if region data is available
        let bounds = undefined;
        if (regionBounds?.province && regionBounds?.city) {
          // Define bounds for major Indonesian regions
          const regionBoundsMap: { [key: string]: any } = {
            'DKI JAKARTA': {
              north: -6.0744,
              south: -6.3676,
              east: 107.0361,
              west: 106.6794
            },
            'BANTEN': {
              north: -5.7887,
              south: -7.1055,
              east: 106.9378,
              west: 105.0194
            },
            'JAWA BARAT': {
              north: -5.5000,
              south: -7.8000,
              east: 108.9500,
              west: 105.0000
            }
          };

          const regionKey = regionBounds.province.toUpperCase();
          if (regionBoundsMap[regionKey]) {
            const regionBound = regionBoundsMap[regionKey];
            bounds = new window.google.maps.LatLngBounds(
              new window.google.maps.LatLng(regionBound.south, regionBound.west),
              new window.google.maps.LatLng(regionBound.north, regionBound.east)
            );
          }
        }

        const autocompleteOptions: any = {
          componentRestrictions: { country: 'id' },
          fields: ['place_id', 'geometry', 'name', 'formatted_address', 'address_components'],
          types: ['establishment', 'geocode']
        };

        // Add bounds if available
        if (bounds) {
          autocompleteOptions.bounds = bounds;
          autocompleteOptions.strictBounds = false; // Allow results outside bounds but prioritize within
        }

        const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, autocompleteOptions);

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          console.log('Place selected:', place);
          
          if (place.geometry?.location) {
            const position = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            };
            
            console.log('Position from autocomplete:', position);
            
            // Validate coordinates are within Indonesia
            if (!validateIndonesianCoordinates(position.lat, position.lng)) {
              alert('Lokasi yang dipilih berada di luar wilayah Indonesia. Silakan pilih lokasi di dalam wilayah Indonesia.');
              return;
            }
            
            mapInstance.setCenter(position);
            mapInstance.setZoom(17);
            markerInstance.position = position;
            
            // Clear the search input after selection
            setSearchValue('');
            
            onLocationSelect({
              ...position,
              address: place.formatted_address || place.name || ''
            });
          }
        });

        // Prevent zoom on input focus (mobile devices)
        searchInputRef.current.addEventListener('focus', (e) => {
          e.preventDefault();
          // Prevent viewport zoom on mobile
          if (window.innerWidth < 768) {
            const viewport = document.querySelector('meta[name=viewport]');
            if (viewport) {
              const originalContent = viewport.getAttribute('content');
              viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
              
              // Restore original viewport after blur
              const restoreViewport = () => {
                if (originalContent) {
                  viewport.setAttribute('content', originalContent);
                }
                searchInputRef.current?.removeEventListener('blur', restoreViewport);
              };
              searchInputRef.current?.addEventListener('blur', restoreViewport);
            }
          }
        });
      }

      setMap(mapInstance);
      setMarker(markerInstance);
      setIsLoading(false);
      setError(null);
      
      console.log('Map initialized successfully');

    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Error initializing map');
      setIsLoading(false);
    }
  };

  const reverseGeocode = async (position: { lat: number; lng: number }) => {
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

        // Validate coordinates are within Indonesia
        if (!validateIndonesianCoordinates(currentPos.lat, currentPos.lng)) {
          alert('Lokasi Anda berada di luar wilayah Indonesia. Layanan pengiriman hanya tersedia di Indonesia.');
          setIsGettingLocation(false);
          return;
        }

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

          // Validate coordinates are within Indonesia
          if (!validateIndonesianCoordinates(position.lat, position.lng)) {
            alert('Lokasi yang ditemukan berada di luar wilayah Indonesia. Silakan cari alamat di dalam wilayah Indonesia.');
            return;
          }

          map.setCenter(position);
          // Don't auto-zoom to maintain current zoom level
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

  return (
    <div className="relative" style={{ height }}>
      {/* Map Container - Always present in DOM */}
      <div ref={mapRef} className="w-full h-full rounded-lg" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center z-20">
          <div className="flex flex-col items-center text-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mb-2"></div>
            <span className="text-gray-600 mb-2">Memuat Google Maps...</span>
            <div className="text-xs text-gray-500">
              Mohon tunggu, sedang memuat peta...
            </div>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 bg-red-50 rounded-lg border-2 border-red-200 flex items-center justify-center z-20">
          <div className="text-center p-4">
            <div className="text-4xl mb-3">⚠️</div>
            <div className="text-red-700 font-medium mb-2">Gagal Memuat Peta</div>
            <div className="text-sm text-red-600 mb-4">{error}</div>
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                loadGoogleMaps();
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      {/* Search Bar and Controls - Only show when map is ready */}
      {!isLoading && !error && (
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
              onFocus={(e) => {
                // Prevent mobile zoom on input focus
                e.target.style.fontSize = '16px';
              }}
              onBlur={(e) => {
                // Reset font size after blur
                e.target.style.fontSize = '';
              }}
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
      )}

      {/* Instructions - Only show when map is ready */}
      {!isLoading && !error && (
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="bg-white bg-opacity-90 rounded-lg px-3 py-2 text-xs text-gray-600 text-center">
            Cari alamat lengkap Anda atau gunakan "Lokasi Saya" untuk mendapatkan koordinat yang tepat
          </div>
        </div>
      )}
    </div>
  );
} 