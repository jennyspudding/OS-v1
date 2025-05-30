// 🌍 Global Google Maps Loader - Prevents multiple API loads (FIXED VERSION)
class GoogleMapsLoader {
  private static instance: GoogleMapsLoader;
  private loadPromise: Promise<typeof google> | null = null;
  private isLoaded = false;
  private loadedLibraries = new Set<string>();
  private libraryLoadPromises = new Map<string, Promise<void>>();

  private constructor() {}

  static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader();
    }
    return GoogleMapsLoader.instance;
  }

  // Check if Google Maps is already fully loaded
  isGoogleMapsReady(): boolean {
    return this.isLoaded && 
           typeof window !== 'undefined' && 
           window.google && 
           window.google.maps && 
           window.google.maps.Map;
  }

  // Check if a specific library is loaded
  isLibraryLoaded(library: string): boolean {
    if (!this.isGoogleMapsReady()) return false;
    
    switch (library) {
      case 'marker':
        return !!window.google.maps.marker;
      case 'places':
        return !!window.google.maps.places;
      case 'geocoding':
        return !!window.google.maps.Geocoder;
      default:
        return this.loadedLibraries.has(library);
    }
  }

  // Load Google Maps with ALL essential libraries at once to prevent conflicts
  async loadGoogleMaps(apiKey: string): Promise<typeof google> {
    // Return immediately if already loaded
    if (this.isGoogleMapsReady()) {
      return window.google;
    }

    // Return existing promise if already loading
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Create new load promise
    this.loadPromise = this.createLoadPromise(apiKey);
    
    try {
      const google = await this.loadPromise;
      this.isLoaded = true;
      // Mark all libraries as loaded since we load them all at once
      this.loadedLibraries.add('marker');
      this.loadedLibraries.add('places');
      this.loadedLibraries.add('geocoding');
      return google;
    } catch (error) {
      // Reset promise on error so we can try again
      this.loadPromise = null;
      throw error;
    }
  }

  // Load additional library - now just ensures main API is loaded since we load all libraries at once
  async loadLibrary(apiKey: string, library: string): Promise<void> {
    // Check if library is already loaded
    if (this.isLibraryLoaded(library)) {
      return;
    }

    // Check if we already have a loading promise for this library
    if (this.libraryLoadPromises.has(library)) {
      return this.libraryLoadPromises.get(library);
    }

    // Ensure core Google Maps is loaded first (which includes all libraries now)
    if (!this.isGoogleMapsReady()) {
      await this.loadGoogleMaps(apiKey);
    }

    // Mark library as loaded since we load all libraries with the main API
    this.loadedLibraries.add(library);
  }

  private createLoadPromise(apiKey: string): Promise<typeof google> {
    return new Promise((resolve, reject) => {
      // Clean up any existing scripts first
      this.cleanupExistingScripts();

      // Create unique callback name
      const callbackName = `__googleMapsCallback_${Date.now()}`;
      
      // Set up global callback
      (window as any)[callbackName] = () => {
        // Clean up callback
        delete (window as any)[callbackName];
        
        // Verify Google Maps loaded correctly
        if (window.google && window.google.maps) {
          resolve(window.google);
        } else {
          reject(new Error('Google Maps failed to load properly'));
        }
      };

      // Create and append script - LOAD ALL LIBRARIES AT ONCE to prevent conflicts
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker,places,geocoding&loading=async&callback=${callbackName}&v=weekly`;
      script.async = true;
      script.defer = true;
      script.id = 'google-maps-main-script';
      
      script.onerror = () => {
        delete (window as any)[callbackName];
        reject(new Error('Failed to load Google Maps script'));
      };
      
      document.head.appendChild(script);

      // Timeout after 10 seconds
      setTimeout(() => {
        if ((window as any)[callbackName]) {
          delete (window as any)[callbackName];
          reject(new Error('Google Maps loading timeout'));
        }
      }, 10000);
    });
  }

  private cleanupExistingScripts(): void {
    // Remove any existing Google Maps scripts
    const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
    existingScripts.forEach(script => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    });

    // Clean up any remaining callbacks
    Object.keys(window).forEach(key => {
      if (key.startsWith('__googleMapsCallback_') || key.startsWith('__googleMapsLibCallback_')) {
        delete (window as any)[key];
      }
    });
  }

  // Reset loader state (for development/testing)
  reset(): void {
    this.loadPromise = null;
    this.isLoaded = false;
    this.loadedLibraries.clear();
    this.libraryLoadPromises.clear();
    this.cleanupExistingScripts();
  }
}

// Export singleton instance
export const googleMapsLoader = GoogleMapsLoader.getInstance(); 