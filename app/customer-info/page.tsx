"use client";
import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import SimpleGoogleMap from "@/components/SimpleGoogleMap";
import { useCart } from "@/components/CartContext";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function validateCoupon(code: string, cartTotal: number, coupons: any[]) {
  const now = new Date();
  const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
  if (!coupon) return { valid: false, reason: "Kode tidak ditemukan" };
  if (now < new Date(coupon.start_time) || now > new Date(coupon.end_time)) return { valid: false, reason: "Kode tidak berlaku" };
  if (cartTotal < (coupon.min_purchase || 0)) return { valid: false, reason: `Minimum pembelian Rp${(coupon.min_purchase || 0).toLocaleString('id-ID')}` };
  
  let discount = 0;
  if (coupon.type === "percent") {
    discount = Math.floor(cartTotal * (coupon.value / 100));
    if (coupon.capped) discount = Math.min(discount, coupon.capped);
  } else {
    discount = coupon.value;
  }
  return { valid: true, discount, coupon };
}

function CustomerInfoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, applyPromoCode, removePromoCode } = useCart();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    recipientName: '',
    recipientPhone: '',
    province: '',
    city: '',
    district: '',
    postalCode: '',
    street: '',
    detail: ''
  });
  const [useSamePhone, setUseSamePhone] = useState(false);
  const [useSameName, setUseSameName] = useState(false);
  const [deliveryQuotation, setDeliveryQuotation] = useState<any>(null);
  const [isLoadingQuotation, setIsLoadingQuotation] = useState(false);
  const [quotationError, setQuotationError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [isMockQuotation, setIsMockQuotation] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [vehicleType, setVehicleType] = useState<'MOTORCYCLE' | 'CAR'>('MOTORCYCLE');
  const [useTollRoad, setUseTollRoad] = useState(false);
  const [requestedDateTime, setRequestedDateTime] = useState('');
  const [alamatLengkap, setAlamatLengkap] = useState('');
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");
  const [coupons, setCoupons] = useState<any[]>([]);
  const [mapKey, setMapKey] = useState(0);

  // Custom date/time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [deliveryTimeWarning, setDeliveryTimeWarning] = useState('');
  
  // Delivery info modal state
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [modalWarningMessage, setModalWarningMessage] = useState('');

  // Refs to manage component state and prevent memory leaks
  const isMountedRef = useRef(true);
  const quotationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const urlParamsProcessedRef = useRef(false); // Track if URL params have been processed

  // Calculate cart total
  const cartTotal = cart.items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    const addOnsTotal = item.addOns ? item.addOns.reduce((addOnSum, addOn) => addOnSum + addOn.price, 0) * item.quantity : 0;
    return sum + itemTotal + addOnsTotal;
  }, 0);

  // 🗺️ IMPROVED MAP KEY MANAGEMENT - Only increment on initial load
  useEffect(() => {
    // Set map key once when component mounts to avoid unnecessary reloads
    setMapKey(1);
    console.log('Setting initial map key for first load');
  }, []); // Empty dependency array to run only once

  // Sync custom picker with requestedDateTime
  useEffect(() => {
    if (requestedDateTime) {
      const parts = requestedDateTime.split('T');
      if (parts.length === 2) {
        setSelectedDate(parts[0]);
        setSelectedTime(parts[1]);
      }
    }
  }, [requestedDateTime]);

  // Load stored data on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let hasStoredLocation = false;
    
    try {
      const storedFormData = localStorage.getItem('customerFormData');
      const storedMapCenter = localStorage.getItem('customerMapCenter');
      const storedSelectedLocation = localStorage.getItem('customerSelectedLocation');
      const storedAlamatLengkap = localStorage.getItem('customerAlamatLengkap');
      const storedDeliveryQuotation = localStorage.getItem('customerDeliveryQuotation');

      if (storedFormData) {
        const parsedFormData = JSON.parse(storedFormData);
        setFormData(parsedFormData);
        // Restore same phone and same name states
        setUseSamePhone(parsedFormData.phone === parsedFormData.recipientPhone);
        setUseSameName(parsedFormData.name === parsedFormData.recipientName);
      }

      if (storedMapCenter) {
        const parsedMapCenter = JSON.parse(storedMapCenter);
        setMapCenter(parsedMapCenter);
      } else {
        // Set default Jakarta center if no stored center
        const defaultCenter = { lat: -6.1751, lng: 106.8650 }; // Central Jakarta (Menteng area)
        setMapCenter(defaultCenter);
        console.log('No stored map center, using default Jakarta location:', defaultCenter);
      }

      if (storedSelectedLocation) {
        const parsedSelectedLocation = JSON.parse(storedSelectedLocation);
        setSelectedLocation(parsedSelectedLocation);
        hasStoredLocation = true;
      }

      if (storedAlamatLengkap) {
        setAlamatLengkap(storedAlamatLengkap);
      }

      if (storedDeliveryQuotation) {
        const parsedQuotation = JSON.parse(storedDeliveryQuotation);
        setDeliveryQuotation(parsedQuotation.quotation || parsedQuotation);
        setIsMockQuotation(parsedQuotation.isMock || false);
      }

      // If no stored location, immediately set default Jakarta location
      if (!hasStoredLocation) {
        console.log('No stored location found, immediately setting default Jakarta location');
        const defaultLocation = {
          lat: -6.1751,
          lng: 106.8650,
          address: 'Jl. Sultan Agung, RT.2/RW.10, Ps. Manggis, Kecamatan Setiabudi, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12970, Indonesia'
        };
        setSelectedLocation(defaultLocation);
        setAlamatLengkap(defaultLocation.address);
        
        // Set default form data for Jakarta
        setFormData(prev => ({
          ...prev,
          province: 'DKI Jakarta',
          city: 'Jakarta Selatan',
          district: 'Setiabudi',
          postalCode: '12970'
        }));
      }

      setIsDataLoaded(true);
      console.log('Loaded stored customer data');
    } catch (error) {
      console.error('Error loading stored data:', error);
      // Set default Jakarta center and location on error
      const defaultCenter = { lat: -6.1751, lng: 106.8650 }; // Central Jakarta (Menteng area)
      setMapCenter(defaultCenter);
      
      // Set default location immediately
      const defaultLocation = {
        lat: -6.1751,
        lng: 106.8650,
        address: 'Jl. Sultan Agung, RT.2/RW.10, Ps. Manggis, Kecamatan Setiabudi, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12970, Indonesia'
      };
      setSelectedLocation(defaultLocation);
      setAlamatLengkap(defaultLocation.address);
      
      setFormData(prev => ({
        ...prev,
        province: 'DKI Jakarta',
        city: 'Jakarta Selatan',
        district: 'Setiabudi',
        postalCode: '12970'
      }));
      
      setIsDataLoaded(true);
    }
  }, []);

  // Save form data to both localStorage and sessionStorage whenever it changes
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Don't save until data has been loaded from storage
    if (!isDataLoaded) return;
    
    // Don't save completely empty form data
    if (!formData.name && !formData.phone && !formData.recipientName && !formData.province) {
      return;
    }
    
    // Throttle saves to prevent excessive storage updates
    const timeoutId = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      try {
        // Save to localStorage (persistent across browser sessions)
        localStorage.setItem('customerFormData', JSON.stringify(formData));
        
        // Save to sessionStorage (temporary, cleared when tab closes)
        const sessionData = {
          formData,
          useSamePhone,
          useSameName,
          timestamp: new Date().toISOString()
        };
        sessionStorage.setItem('customerSessionData', JSON.stringify(sessionData));
        
        console.log('Form data saved to storage:', formData);
      } catch (error) {
        console.error('Error saving form data:', error);
      }
    }, 1000); // Throttle to 1 second
    
    return () => clearTimeout(timeoutId);
  }, [formData, useSamePhone, useSameName, isDataLoaded]);

  // Save map center to storage
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    if (mapCenter) {
      // Throttle saves to prevent excessive storage updates
      const timeoutId = setTimeout(() => {
        if (!isMountedRef.current) return;
        
        try {
          localStorage.setItem('customerMapCenter', JSON.stringify(mapCenter));
          console.log('Map center saved to storage:', mapCenter);
        } catch (error) {
          console.error('Error saving map center:', error);
        }
      }, 500); // Throttle to 500ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [mapCenter]);

  // Save selected location to storage
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    if (selectedLocation) {
      // Throttle saves to prevent excessive storage updates
      const timeoutId = setTimeout(() => {
        if (!isMountedRef.current) return;
        
        try {
          localStorage.setItem('customerSelectedLocation', JSON.stringify(selectedLocation));
          console.log('Selected location saved to storage:', selectedLocation);
        } catch (error) {
          console.error('Error saving selected location:', error);
        }
      }, 500); // Throttle to 500ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedLocation]);

  // Save alamat lengkap to storage
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    if (alamatLengkap) {
      try {
        localStorage.setItem('customerAlamatLengkap', alamatLengkap);
        console.log('Alamat lengkap saved to storage:', alamatLengkap);
      } catch (error) {
        console.error('Error saving alamat lengkap:', error);
      }
    }
  }, [alamatLengkap]);

  // Save delivery quotation to storage
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    if (deliveryQuotation) {
      try {
        const quotationData = {
          quotation: deliveryQuotation,
          isMock: isMockQuotation,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('customerDeliveryQuotation', JSON.stringify(quotationData));
        console.log('Delivery quotation saved to storage');
      } catch (error) {
        console.error('Error saving delivery quotation:', error);
      }
    }
  }, [deliveryQuotation, isMockQuotation]);

  // Auto-calculate delivery cost when location is loaded or changes
  useEffect(() => {
    // Auto-calculate if we have location, data is loaded, no existing quotation, not loading, and component is mounted
    if (selectedLocation && isDataLoaded && !deliveryQuotation && !isLoadingQuotation && isMountedRef.current) {
      console.log('Auto-calculating delivery cost for location with MOTORCYCLE (default no toll)');
      // setVehicleType('MOTORCYCLE'); // This might be redundant if vehicleType defaults correctly or is set by other flows
      
      if (quotationTimeoutRef.current) {
        clearTimeout(quotationTimeoutRef.current);
      }
      
      quotationTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current || isLoadingQuotation || deliveryQuotation) {
          console.log('Skipping auto-calculation: conditions changed');
          return;
        }
        // Assuming 'MOTORCYCLE' does not use toll, or rely on useTollRoad state which is false by default.
        // For clarity, pass 'false' as the toll status for this initial auto-calculation.
        getDeliveryQuotationWithVehicleType(vehicleType === 'CAR' ? 'CAR' : 'MOTORCYCLE', useTollRoad);
      }, 1500);
      
      return () => {
        if (quotationTimeoutRef.current) {
          clearTimeout(quotationTimeoutRef.current);
          quotationTimeoutRef.current = null;
        }
      };
    }
  }, [selectedLocation, isDataLoaded, deliveryQuotation, isLoadingQuotation, vehicleType, useTollRoad]); // Added vehicleType and useTollRoad to dependencies for correctness

  useEffect(() => {
    // Prevent repeated processing of URL params
    if (urlParamsProcessedRef.current) return;
    
    // Get location data from URL params if coming back from location selection
    const province = searchParams.get('province');
    const city = searchParams.get('city');
    const district = searchParams.get('district');
    const postalCode = searchParams.get('postalCode');

    if (province && city && district && postalCode) {
      console.log('URL params detected:', { province, city, district, postalCode });
      urlParamsProcessedRef.current = true; // Mark as processed
      
      // Merge URL params with existing form data (don't overwrite other fields)
      setFormData(prev => {
        const updatedData = {
          ...prev,
          province,
          city,
          district,
          postalCode
        };
        console.log('Merging URL params with existing form data:', updatedData);
        return updatedData;
      });
      
      // Update map center when location is selected
      updateMapCenter(province, city, district);
      
      // Clear URL params after processing to prevent re-processing
      const url = new URL(window.location.href);
      url.searchParams.delete('province');
      url.searchParams.delete('city');
      url.searchParams.delete('district');
      url.searchParams.delete('postalCode');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  // Function to set map center based on selected province/district
  const updateMapCenter = (province: string, city: string, district: string) => {
    // Default coordinates for different areas
    const areaCoordinates: { [key: string]: { lat: number; lng: number } } = {
      // DKI Jakarta areas
      'DKI JAKARTA_JAKARTA PUSAT': { lat: -6.1751, lng: 106.8650 },
      'DKI JAKARTA_JAKARTA UTARA': { lat: -6.1384, lng: 106.8634 },
      'DKI JAKARTA_JAKARTA BARAT': { lat: -6.1352, lng: 106.7606 },
      'DKI JAKARTA_JAKARTA SELATAN': { lat: -6.2615, lng: 106.8106 },
      'DKI JAKARTA_JAKARTA TIMUR': { lat: -6.2250, lng: 106.9004 },
      
      // Banten areas
      'BANTEN_KAB. TANGERANG': { lat: -6.1783, lng: 106.6319 },
      'BANTEN_KOTA TANGERANG': { lat: -6.1783, lng: 106.6319 },
      'BANTEN_KOTA TANGERANG SELATAN': { lat: -6.2875, lng: 106.7571 },
    };

    const key = `${province}_${city}`;
    const coords = areaCoordinates[key] || { lat: -6.2088, lng: 106.8456 };
    
    console.log('Setting map center for:', key, coords);
    setMapCenter(coords);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // If phone number changes and useSamePhone is true, update recipient phone
    if (field === 'phone' && useSamePhone) {
      setFormData(prev => ({
        ...prev,
        recipientPhone: value
      }));
    }
    
    // If name changes and useSameName is true, update recipient name
    if (field === 'name' && useSameName) {
      setFormData(prev => ({
        ...prev,
        recipientName: value
      }));
    }
  };

  const handleUseSamePhoneChange = (checked: boolean) => {
    setUseSamePhone(checked);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        recipientPhone: prev.phone
      }));
    }
    
    // Save the checkbox state immediately
    if (typeof window !== 'undefined') {
      try {
        const sessionData = {
          formData,
          useSamePhone: checked,
          useSameName,
          timestamp: new Date().toISOString()
        };
        sessionStorage.setItem('customerSessionData', JSON.stringify(sessionData));
      } catch (error) {
        console.error('Error saving useSamePhone state:', error);
      }
    }
  };

  const handleUseSameNameChange = (checked: boolean) => {
    setUseSameName(checked);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        recipientName: prev.name
      }));
    }
    
    // Save the checkbox state immediately
    if (typeof window !== 'undefined') {
      try {
        const sessionData = {
          formData,
          useSamePhone,
          useSameName: checked,
          timestamp: new Date().toISOString()
        };
        sessionStorage.setItem('customerSessionData', JSON.stringify(sessionData));
      } catch (error) {
        console.error('Error saving useSameName state:', error);
      }
    }
  };

  // Function to get delivery quotation using precise coordinates ONLY
  const getDeliveryQuotation = async () => {
    console.log('getDeliveryQuotation called - delegating to getDeliveryQuotationWithVehicleType with MOTORCYCLE default and current toll state');
    // Pass the current useTollRoad state. MOTORCYCLE type will likely ignore it or backend handles it.
    return getDeliveryQuotationWithVehicleType('MOTORCYCLE', useTollRoad);
  };

  // Handle vehicle type change and auto-recalculate
  const handleVehicleTypeChange = (newVehicleType: 'MOTORCYCLE' | 'CAR') => {
    console.log('Vehicle type changed from', vehicleType, 'to', newVehicleType);
    setVehicleType(newVehicleType);
    
    // Always reset toll road option to false when vehicle type changes.
    const newUseTollRoadState = false;
    setUseTollRoad(newUseTollRoadState);
    
    // Auto-recalculate delivery cost when vehicle type changes
    if (selectedLocation && !isLoadingQuotation && isMountedRef.current) {
      // Clear any existing timeout
      if (quotationTimeoutRef.current) {
        clearTimeout(quotationTimeoutRef.current);
      }
      
      quotationTimeoutRef.current = setTimeout(() => {
        // Double-check component is still mounted and conditions are valid
        if (!isMountedRef.current || isLoadingQuotation) {
          return;
        }
        console.log('Auto-calculating delivery cost for vehicle type:', newVehicleType);
        getDeliveryQuotationWithVehicleType(newVehicleType, newUseTollRoadState); // Pass the new toll state (false)
      }, 500);
    }
  };

  // Handle toll road option change and auto-recalculate
  const handleTollRoadChange = (useToll: boolean) => {
    console.log('Toll road option changed to:', useToll);
    setUseTollRoad(useToll);
    
    // Auto-recalculate delivery cost when toll option changes
    if (selectedLocation && !isLoadingQuotation && isMountedRef.current && vehicleType === 'CAR') {
      // Clear any existing timeout
      if (quotationTimeoutRef.current) {
        clearTimeout(quotationTimeoutRef.current);
      }
      
      quotationTimeoutRef.current = setTimeout(() => {
        // Double-check component is still mounted and conditions are valid
        if (!isMountedRef.current || isLoadingQuotation) {
          return;
        }
        console.log('Auto-calculating delivery cost with toll road option:', useToll);
        // Pass the 'useToll' status explicitly
        getDeliveryQuotationWithVehicleType(vehicleType, useToll);
      }, 500);
    }
  };

  // Function to get delivery quotation with specific vehicle type
  const getDeliveryQuotationWithVehicleType = async (specificVehicleType: 'MOTORCYCLE' | 'CAR', currentUseTollRoad: boolean) => {
    console.log('getDeliveryQuotationWithVehicleType called with:', specificVehicleType, 'and toll:', currentUseTollRoad);
    
    // Check if component is still mounted
    if (!isMountedRef.current) {
      console.log('Component unmounted, skipping quotation call');
      return;
    }
    
    // Prevent multiple simultaneous calls
    if (isLoadingQuotation) {
      console.log('Quotation already loading, skipping this call');
      return;
    }
    
    // Only work with precise coordinates
    if (!selectedLocation) {
      console.log('No coordinates available, cannot get quotation');
      setQuotationError('Pilih lokasi pengiriman terlebih dahulu menggunakan GPS atau peta');
      return;
    }

    const deliveryAddress = selectedLocation.address;
    const coordinates = { lat: selectedLocation.lat, lng: selectedLocation.lng };
    const currentVehicleType = specificVehicleType || vehicleType;
    console.log('Using coordinates for quotation:', { deliveryAddress, coordinates });

    setIsLoadingQuotation(true);
    setQuotationError(null);

    try {
      const requestBody: any = {
        deliveryAddress,
        recipientName: formData.recipientName || formData.name || 'Customer',
        recipientPhone: formData.recipientPhone || formData.phone || '+62123456789',
        serviceType: currentVehicleType,
        useTollRoad: currentUseTollRoad // Use the passed parameter
      };

      // Add precise coordinates if available
      if (coordinates) {
        requestBody.coordinates = coordinates;
      }

      // Add requested datetime if specified
      if (requestedDateTime) {
        // Convert to ISO 8601 format with timezone
        const dateTime = new Date(requestedDateTime);
        requestBody.isRequestedAt = dateTime.toISOString();
      }
      
      console.log('=== FRONTEND DEBUG WITH SPECIFIC TYPE ===');
      console.log('Specific vehicle type passed:', specificVehicleType);
      console.log('Current vehicle type state:', vehicleType);
      console.log('Using vehicle type:', currentVehicleType);
      console.log('Service type in request:', requestBody.serviceType);
      console.log('Full request body being sent:', requestBody);
      console.log('=== END FRONTEND DEBUG ===');
      
      const response = await fetch('/api/lalamove/quotation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Quotation response status:', response.status);
      const data = await response.json();
      console.log('Quotation response data:', data);

      if (data.success) {
        setDeliveryQuotation(data.quotation);
        setIsMockQuotation(data.isMock || false);
        setQuotationError(null); // Clear any previous errors
        
        // Show note if using mock data
        if (data.isMock) {
          console.log('Using mock delivery quotation:', data.note || 'API not configured');
        }
      } else {
        const errorMessage = data.error || 'Failed to get delivery quotation';
        setQuotationError(errorMessage);
        
        // Save error to storage for debugging
        try {
          const errorData = {
            error: errorMessage,
            timestamp: new Date().toISOString(),
            coordinates: coordinates
          };
          sessionStorage.setItem('lastQuotationError', JSON.stringify(errorData));
        } catch (storageError) {
          console.error('Error saving quotation error:', storageError);
        }
      }
    } catch (error) {
      console.error('Error getting quotation:', error);
      const errorMessage = 'Failed to get delivery quotation';
      setQuotationError(errorMessage);
      
      // Save error to storage for debugging
      try {
        const errorData = {
          error: errorMessage,
          originalError: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
          coordinates: coordinates
        };
        sessionStorage.setItem('lastQuotationError', JSON.stringify(errorData));
      } catch (storageError) {
        console.error('Error saving quotation error:', storageError);
      }
    } finally {
      setIsLoadingQuotation(false);
    }
  };

  // Function to extract location data from address
  const extractLocationFromAddress = (address: string) => {
    // This is a simple extraction - in a real app you'd use reverse geocoding API
    const parts = address.split(',').map(part => part.trim());
    
    // Try to extract postal code (usually 5 digits)
    const postalCodeMatch = address.match(/\b\d{5}\b/);
    const postalCode = postalCodeMatch ? postalCodeMatch[0] : '';
    
    // For now, we'll set basic values - this should be enhanced with proper geocoding
    return {
      province: parts.length > 3 ? parts[parts.length - 2] : 'DKI Jakarta',
      city: parts.length > 2 ? parts[parts.length - 3] : 'Jakarta Pusat',
      district: parts.length > 1 ? parts[parts.length - 4] || parts[0] : parts[0] || '',
      postalCode: postalCode
    };
  };

  // Handle location selection from map
  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    // Improved mount check - more lenient approach
    if (!isMountedRef.current) {
      // Try to restore mounted state if this is a valid update
      isMountedRef.current = true;
    }
    
    // Check if this is the same location as currently selected (with more precise comparison)
    if (selectedLocation && 
        Math.abs(selectedLocation.lat - location.lat) < 0.00001 && 
        Math.abs(selectedLocation.lng - location.lng) < 0.00001 &&
        selectedLocation.address === location.address) {
      return;
    }
    
    // Save to storage
    try {
      localStorage.setItem('customerSelectedLocation', JSON.stringify(location));
      localStorage.setItem('customerMapCenter', JSON.stringify({ lat: location.lat, lng: location.lng }));
      localStorage.setItem('customerAlamatLengkap', location.address);
    } catch (error) {
      console.error('Error saving location to storage:', error);
    }
    
    // Update selected location (populates "Lokasi Terpilih" section)
    setSelectedLocation(prevLocation => location);
    
    // Update map center smoothly (no reload/refresh)
    setMapCenter(prevCenter => ({ lat: location.lat, lng: location.lng }));
    
    // Auto-populate "Alamat Lengkap" textarea with the full address
    setAlamatLengkap(prevAddress => location.address);
    
    // Extract and update form location data (province, city, district, postal code)
    const locationData = extractLocationFromAddress(location.address);
    
    setFormData(prev => {
      const newFormData = {
        ...prev,
        ...locationData
      };
      
      // Save updated form data immediately to storage
      try {
        localStorage.setItem('customerFormData', JSON.stringify(newFormData));
      } catch (error) {
        console.error('Error saving form data:', error);
      }
      
      return newFormData;
    });
    
    // Clear existing quotation to trigger recalculation for new address
    setDeliveryQuotation(null);
    setQuotationError(null);
    
    // Reset vehicle type to motorcycle for new location
    setVehicleType('MOTORCYCLE');
    
    // Force a map key update to refresh the map component
    setMapKey(prev => prev + 1);
  };

  // Function to clear all stored data
  const clearStoredData = () => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem('customerFormData');
      localStorage.removeItem('customerMapCenter');
      localStorage.removeItem('customerSelectedLocation');
      localStorage.removeItem('customerAlamatLengkap');
      localStorage.removeItem('customerDeliveryQuotation');
      sessionStorage.removeItem('customerSessionData');
      console.log('All customer data cleared from storage');
    } catch (error) {
      console.error('Error clearing stored data:', error);
    }
  };

  // Function to save complete order data before submission
  const saveCompleteOrderData = () => {
    if (typeof window === 'undefined') return null;
    try {
      const completeOrderData = {
        formData,
        useSamePhone,
        mapCenter,
        selectedLocation,
        alamatLengkap,
        deliveryQuotation,
        isMockQuotation,
        quotationError,
        requestedDateTime,
        vehicleType,
        useTollRoad, // Add useTollRoad to the order data
        cart: cart,
        cartTotal: cartTotal,
        deliveryTotal: deliveryQuotation ? parseInt(deliveryQuotation.price.total) : 0,
        promoCode: cart.promoCode,
        discount: cart.discount,
        grandTotal: cartTotal - (cart.discount || 0) + (deliveryQuotation ? parseInt(deliveryQuotation.price.total) : 0),
        timestamp: new Date().toISOString(),
        status: 'ready_for_payment'
      };
      // Save to both localStorage and sessionStorage
      localStorage.setItem('completeOrderData', JSON.stringify(completeOrderData));
      sessionStorage.setItem('currentOrder', JSON.stringify(completeOrderData));
      console.log('Complete order data saved:', completeOrderData);
      return completeOrderData;
    } catch (error) {
      console.error('Error saving complete order data:', error);
      return null;
    }
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!requestedDateTime) {
      alert('Silakan pilih waktu pengiriman terlebih dahulu.');
      return;
    }

    if (!selectedLocation) {
      alert('Silakan pilih lokasi pengiriman terlebih dahulu.');
      return;
    }

    if (!alamatLengkap || alamatLengkap.trim() === '') {
      alert('Silakan isi alamat lengkap pengiriman terlebih dahulu.');
      return;
    }

    if (!deliveryQuotation) {
      alert('Silakan tunggu perhitungan biaya pengiriman selesai.');
      return;
    }

    // Save complete order data before navigation
    const orderData = saveCompleteOrderData();
    
    if (orderData) {
      console.log('Navigating to payment with order data:', orderData);
      // Navigate to payment page (to be created)
      router.push('/payment');
    } else {
      alert('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.');
    }
  };

  // Fetch coupons from Supabase
  useEffect(() => {
    async function fetchCoupons() {
      try {
        // Fetch all promos first for debugging
        const { data, error } = await supabase
          .from('promos')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        console.log('All promos from DB:', data);
        
        // Filter active promos in JavaScript
        const now = new Date();
        const activePromos = data?.filter(promo => {
          const startTime = new Date(promo.start_time);
          const endTime = new Date(promo.end_time);
          const isActive = startTime <= now && now <= endTime;
          console.log(`Promo ${promo.code}: start=${startTime}, end=${endTime}, now=${now}, active=${isActive}`);
          return isActive;
        }) || [];
        
        console.log('Active promos:', activePromos);
        setCoupons(activePromos);
      } catch (error) {
        console.error('Error fetching coupons:', error);
      }
    }
    fetchCoupons();
  }, []);

  const handleApplyPromo = () => {
    const result = validateCoupon(promoInput, cartTotal, coupons);
    if (!result.valid) {
      setPromoError(result.reason || "");
      setPromoSuccess("");
      removePromoCode();
      return;
    }
    if (result.coupon) {
      applyPromoCode(result.coupon.code, result.discount ?? 0);
      setPromoSuccess(`Kode ${result.coupon.code} berhasil diterapkan!`);
    }
    setPromoError("");
  };

  // 📅 DELIVERY TIME VALIDATION FUNCTIONS
  const validateDeliveryTime = (dateTimeString: string) => {
    if (!dateTimeString) return { valid: true, warning: '' };
    
    const selectedDate = new Date(dateTimeString);
    const now = new Date();
    
    // Normalize dates to compare only the date part
    const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const tomorrowOnly = new Date(todayOnly);
    tomorrowOnly.setDate(tomorrowOnly.getDate() + 1);
    
    const selectedHour = selectedDate.getHours();
    const currentHour = now.getHours();
    
    // Check if same day delivery (not allowed)
    if (selectedDateOnly.getTime() === todayOnly.getTime()) {
      return {
        valid: false,
        warning: '⚠️ Tidak ada pengiriman di hari yang sama (Kecuali Ready Stok Toko). Semua pesanan akan dikirim H+1 (besok).'
      };
    }
    
    // Check if selecting tomorrow but it's after 12:00 today (should be H+2)
    if (selectedDateOnly.getTime() === tomorrowOnly.getTime() && currentHour >= 12) {
      return {
        valid: false,
        warning: '⚠️ Pesanan setelah jam 12:00 hanya tersedia untuk pengiriman H+2. Silakan pilih tanggal lain.'
      };
    }
    
    // Check if delivery time is between 11:00-16:00
    if (selectedHour < 11 || selectedHour > 16) {
      return {
        valid: false,
        warning: '⚠️ Waktu pengiriman hanya tersedia antara jam 11:00 - 16:00. Silakan pilih waktu dalam rentang tersebut.'
      };
    }
    
    return { valid: true, warning: '' };
  };

  // Get minimum allowed delivery date (tomorrow)
  const getMinDeliveryDateTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(11, 0, 0, 0); // Default to 11:00 AM tomorrow
    // For auto-calculation, ensure vehicleType and the current useTollRoad state are passed.
    // As useTollRoad defaults to false, and vehicleType to MOTORCYCLE in some auto-calc paths.
    if (selectedLocation && isDataLoaded && !deliveryQuotation && !isLoadingQuotation && isMountedRef.current) {
      console.log('Auto-calculating delivery cost for location with MOTORCYCLE and no toll');
      // setVehicleType('MOTORCYCLE'); // Vehicle type is already set or will be 'MOTORCYCLE' by default path
      
      if (quotationTimeoutRef.current) {
        clearTimeout(quotationTimeoutRef.current);
      }
      
      quotationTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current || isLoadingQuotation || deliveryQuotation) {
          console.log('Skipping auto-calculation: conditions changed');
          return;
        }
        getDeliveryQuotationWithVehicleType('MOTORCYCLE', false); // Explicitly false for initial auto-calc
      }, 1500);
      
      return () => {
        if (quotationTimeoutRef.current) {
          clearTimeout(quotationTimeoutRef.current);
          quotationTimeoutRef.current = null;
        }
      };
    }
    return tomorrow.toISOString().slice(0, 16);
  };

  // Get maximum allowed delivery date (tomorrow at 16:00)
  const getMaxDeliveryDateTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7); // Allow booking up to 1 week ahead
    tomorrow.setHours(16, 0, 0, 0); // Max time is 16:00
    return tomorrow.toISOString().slice(0, 16);
  };

  // Handle delivery time change with validation
  const handleDeliveryTimeChange = (dateTimeString: string) => {
    setRequestedDateTime(dateTimeString);
    
    const validation = validateDeliveryTime(dateTimeString);
    if (!validation.valid) {
      setDeliveryTimeWarning(validation.warning);
    } else {
      setDeliveryTimeWarning('');
    }
  };

  // 🗓️ CUSTOM DATE/TIME PICKER FUNCTIONS
  const timeSlots = [
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', 
    '14:00', '14:30', '15:00', '15:30', '16:00'
  ];

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    if (selectedTime) {
      const dateTime = `${date}T${selectedTime}`;
      handleDeliveryTimeChange(dateTime);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) {
      const dateTime = `${selectedDate}T${time}`;
      handleDeliveryTimeChange(dateTime);
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isPast = date < tomorrow;
      const isToday = date.toDateString() === today.toDateString();
      
      // Fix timezone issue by using local date formatting instead of ISO string
      const dateYear = date.getFullYear();
      const dateMonth = String(date.getMonth() + 1).padStart(2, '0');
      const dateDay = String(date.getDate()).padStart(2, '0');
      const dateStr = `${dateYear}-${dateMonth}-${dateDay}`;
      
      days.push({
        date: date.getDate(),
        dateStr,
        isCurrentMonth,
        isPast,
        isToday,
        isSelected: selectedDate === dateStr
      });
    }
    
    return days;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-48">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white flex items-center px-4 py-3 border-b border-gray-200">
        <button className="mr-3" onClick={() => router.back()}>
          <svg width="28" height="28" fill="none" stroke="black" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-lg font-bold flex-1">Informasi Customer</h1>
        <button 
          onClick={() => setShowDeliveryInfo(true)}
          className="p-2 rounded-full bg-[#f5e1d8] hover:bg-[#e9cfc0] transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </header>

      {/* Form Content */}
      <div className="bg-white mx-4 mt-4 rounded-lg shadow-sm">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Informasi Customer</h2>
          
          {/* Name Field */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">Nama Lengkap</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d63384] focus:border-transparent bg-white text-gray-900"
              placeholder="Nama lengkap"
            />
          </div>

          {/* Phone Field */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">Nomor Telepon</label>
            <div className="flex">
              <div className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg">
                <span className="text-gray-600 text-sm">+62</span>
              </div>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#d63384] focus:border-transparent bg-white text-gray-900"
                placeholder="8123456789"
              />
            </div>
          </div>

          {/* Recipient Name Field */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">Nama Penerima</label>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useSameName"
                  checked={useSameName}
                  onChange={(e) => handleUseSameNameChange(e.target.checked)}
                  className="w-4 h-4 accent-white bg-white border-gray-300 rounded focus:ring-[#d63384] focus:ring-2"
                />
                <label htmlFor="useSameName" className="ml-2 text-sm text-gray-600">
                  Gunakan nama yang sama
                </label>
              </div>
              <input
                type="text"
                value={formData.recipientName}
                onChange={(e) => handleInputChange('recipientName', e.target.value)}
                disabled={useSameName}
                className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d63384] focus:border-transparent ${
                  useSameName ? 'bg-gray-100 text-gray-500' : 'bg-white text-gray-900'
                }`}
                placeholder="Nama penerima"
              />
            </div>
          </div>

          {/* Recipient Phone Field */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">Nomor Telepon Penerima</label>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useSamePhone"
                  checked={useSamePhone}
                  onChange={(e) => handleUseSamePhoneChange(e.target.checked)}
                  className="w-4 h-4 accent-white bg-white border-gray-300 rounded focus:ring-[#d63384] focus:ring-2"
                />
                <label htmlFor="useSamePhone" className="ml-2 text-sm text-gray-600">
                  Gunakan nomor telepon yang sama
                </label>
              </div>
              <div className="flex">
                <div className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg">
                  <span className="text-gray-600 text-sm">+62</span>
                </div>
                <input
                  type="tel"
                  value={formData.recipientPhone}
                  onChange={(e) => handleInputChange('recipientPhone', e.target.value)}
                  disabled={useSamePhone}
                  className={`flex-1 p-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#d63384] focus:border-transparent ${
                    useSamePhone ? 'bg-gray-100 text-gray-500' : 'bg-white text-gray-900'
                  }`}
                  placeholder="8123456789"
                />
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Pilih Lokasi Pengiriman yang Tepat</h3>
            <p className="text-xs text-gray-500 mb-3">Gunakan peta untuk menentukan lokasi pengiriman yang akurat</p>
            
            {selectedLocation && (
              <div className="text-xs text-gray-600 bg-[#f8d7da] border border-[#f5c2c7] rounded p-2 mb-3">
                <div className="font-medium text-[#d63384]">Lokasi Terpilih:</div>
                <div className="mt-1">{selectedLocation.address}</div>
                <div className="text-[#d63384] mt-1">
                  Koordinat: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </div>
              </div>
            )}

            {/* Alamat Lengkap Field */}
            {selectedLocation && (
              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-2">Alamat Lengkap <span className="text-red-500">*</span></label>
                <textarea
                  value={alamatLengkap}
                  onChange={(e) => setAlamatLengkap(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d63384] focus:border-transparent bg-white text-gray-900"
                  placeholder="Edit alamat lengkap jika diperlukan..."
                  rows={3}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alamat ini akan digunakan untuk pengiriman. Anda dapat mengedit jika diperlukan.
                </p>
              </div>
            )}
            
            <SimpleGoogleMap
              key={mapKey}
              initialCenter={mapCenter || { lat: -6.2088, lng: 106.8456 }}
              onLocationSelect={handleLocationSelect}
              height="350px"
              regionBounds={{
                province: formData.province,
                city: formData.city,
                district: formData.district
              }}
            />
          </div>

        </div>

        {/* Delivery Quotation Section */}
        {(isLoadingQuotation || deliveryQuotation || quotationError) && (
          <div className="px-4 pb-4 mb-8">
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#d63384]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Informasi Pengiriman
              </h3>
              
              {/* Delivery DateTime Selection */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">Waktu Pengiriman <span className="text-red-500">*</span></label>
                
                {/* Custom DateTime Display */}
                <div
                  onClick={() => setShowDatePicker(true)}
                  className="w-full p-4 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#d63384] focus:border-transparent bg-white hover:border-[#d63384] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-[#d63384] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div>
                        {selectedDate && selectedTime ? (
                          <div>
                            <div className="font-medium text-gray-900">{formatDateDisplay(selectedDate)}</div>
                            <div className="text-sm text-[#d63384]">Jam {selectedTime} WIB</div>
                          </div>
                        ) : (
                          <div className="text-gray-500">Pilih tanggal dan waktu pengiriman</div>
                        )}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mt-1">Pengiriman tersedia besok (H+1) jam 11:00 - 16:00 WIB untuk order sebelum jam 12.00 hari ini</p>
                
                {/* Validation Warning */}
                {deliveryTimeWarning && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-yellow-800 text-sm">{deliveryTimeWarning}</div>
                  </div>
                )}
              </div>

              {/* Custom Date/Time Picker Modal */}
              {showDatePicker && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#f5e1d8] to-[#e9cfc0] text-black px-6 py-4 rounded-t-2xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold">Pilih Waktu Pengiriman</h3>
                          <p className="text-black text-opacity-70 text-sm">Tentukan kapan pesanan dikirim</p>
                        </div>
                        <button 
                          onClick={() => setShowDatePicker(false)}
                          className="w-8 h-8 bg-black bg-opacity-10 rounded-full flex items-center justify-center hover:bg-opacity-20 transition-colors"
                        >
                          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Calendar */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <button
                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          
                          <h4 className="text-lg font-semibold text-gray-900">
                            {currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                          </h4>
                          
                          <button
                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>

                        {/* Day headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
                            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                              {day}
                            </div>
                          ))}
                        </div>

                        {/* Calendar days */}
                        <div className="grid grid-cols-7 gap-1">
                          {generateCalendarDays().map((day, index) => (
                            <button
                              key={index}
                              onClick={() => !day.isPast && day.isCurrentMonth && handleDateSelect(day.dateStr)}
                              disabled={day.isPast || !day.isCurrentMonth}
                              className={`
                                p-2 text-sm rounded-lg transition-colors h-10 flex items-center justify-center
                                ${day.isPast || !day.isCurrentMonth
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : day.isSelected
                                  ? 'bg-[#f5e1d8] text-black font-bold border-2 border-[#e9cfc0]'
                                  : day.isToday
                                  ? 'bg-[#f8d7da] text-[#d63384] font-medium'
                                  : 'text-gray-700 hover:bg-[#f5e1d8] hover:text-black'
                                }
                              `}
                            >
                              {day.date}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Time slots */}
                      {selectedDate && (
                        <div className="mb-6">
                          <h5 className="text-sm font-medium text-gray-700 mb-3">Pilih Jam Pengiriman</h5>
                          <div className="grid grid-cols-3 gap-2">
                            {timeSlots.map((time) => (
                              <button
                                key={time}
                                onClick={() => handleTimeSelect(time)}
                                className={`
                                  p-3 text-sm rounded-lg border-2 transition-colors font-medium
                                  ${selectedTime === time
                                    ? 'border-[#e9cfc0] bg-[#f5e1d8] text-black'
                                    : 'border-gray-200 text-gray-700 hover:border-[#e9cfc0] hover:bg-[#f5e1d8] hover:text-black'
                                  }
                                `}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowDatePicker(false)}
                          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => {
                            if (selectedDate && selectedTime) {
                              setShowDatePicker(false);
                            }
                          }}
                          disabled={!selectedDate || !selectedTime}
                          className={`
                            flex-1 px-4 py-3 rounded-xl font-medium transition-colors
                            ${selectedDate && selectedTime
                              ? 'bg-[#f5e1d8] text-black hover:bg-[#e9cfc0]'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }
                          `}
                        >
                          Konfirmasi
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vehicle Type Selection */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">Pilih Jenis Kendaraan <span className="text-xs text-gray-500">(Motor dipilih otomatis)</span></label>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleVehicleTypeChange('MOTORCYCLE')}
                    className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                      vehicleType === 'MOTORCYCLE'
                        ? 'border-[#d63384] bg-[#f8d7da] text-[#d63384]'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-[#d63384]'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="font-medium">Motor</span>
                    </div>
                    <div className="text-xs mt-1">lebih cepat & hemat, tidak ada garansi dalam pengiriman</div>
                  </button>
                  
                  <button
                    onClick={() => handleVehicleTypeChange('CAR')}
                    className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                      vehicleType === 'CAR'
                        ? 'border-[#d63384] bg-[#f8d7da] text-[#d63384]'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-[#d63384]'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      <span className="font-medium">Mobil</span>
                    </div>
                    <div className="text-xs mt-1">kapasitas besar, untuk pudding dekorasi, dijamin aman</div>
                  </button>
                </div>
                
                {/* Toll Road Option - Only show for Car */}
                {vehicleType === 'CAR' && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useTollRoad}
                        onChange={(e) => handleTollRoadChange(e.target.checked)}
                        className="w-4 h-4 accent-white bg-white border border-gray-300 rounded focus:ring-[#d63384] focus:ring-2"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-700">🚗 Pakai Tol</span>
                        <div className="text-xs text-gray-500 mt-1">
                          +Rp 25.000 - Pengiriman lebih cepat melalui jalan tol
                        </div>
                      </div>
                    </label>
                  </div>
                )}
              </div>
              
              {quotationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-700 text-sm">{quotationError}</span>
                  </div>
                  <button 
                    onClick={() => getDeliveryQuotation()}
                    className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Coba lagi
                  </button>
                </div>
              )}

              {(deliveryQuotation || isLoadingQuotation) && (
                <div className="bg-[#f8d7da] border border-[#f5c2c7] rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <svg className="w-5 h-5 text-[#d63384] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium text-[#d63384]">
                          {isLoadingQuotation ? 'Menghitung...' : 'Pengiriman Tersedia'}
                        </span>
                      </div>
                      
                      {isLoadingQuotation ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#d63384]"></div>
                          <span className="ml-3 text-gray-600">Menghitung biaya pengiriman...</span>
                        </div>
                      ) : deliveryQuotation ? (
                        <>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Biaya Pengiriman:</span>
                              <span className="font-bold text-[#d63384]">
                                Rp{parseInt(deliveryQuotation.price.total).toLocaleString('id-ID')}
                              </span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-600">Jarak:</span>
                              <span className="text-gray-800">
                                {(parseInt(deliveryQuotation.distance.value) / 1000).toFixed(1)} km
                              </span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-600">Jenis Kendaraan:</span>
                              <span className="text-gray-800">
                                {vehicleType === 'MOTORCYCLE' ? 'Motor' : 'Mobil'}
                                {deliveryQuotation.hasTollRoad && ' + Tol'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-3 text-xs text-gray-500">
                            Harga berlaku hingga: {new Date(deliveryQuotation.expiresAt).toLocaleTimeString('id-ID')}
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Promo Code Section */}
        <div className="px-4 pb-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-[#d63384]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Kode Promo
            </h3>
            
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={promoInput}
                onChange={e => setPromoInput(e.target.value)}
                className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#d63384] focus:border-transparent bg-white text-gray-900"
                placeholder="Masukkan kode promo"
              />
              <Button 
                type="button" 
                onClick={handleApplyPromo} 
                className="px-6 py-3 text-base rounded-full bg-[#f5e1d8] text-black font-bold hover:bg-[#e9cfc0] shadow-lg whitespace-nowrap"
              >
                Terapkan
              </Button>
            </div>
            
            {cart.promoCode && (
              <div className="text-green-600 text-sm mt-2 font-medium bg-green-50 border border-green-200 rounded-lg p-3">
                ✓ Kode {cart.promoCode} berhasil diterapkan! Diskon: Rp{cart.discount?.toLocaleString('id-ID')}
              </div>
            )}
            {promoError && (
              <div className="text-red-600 text-sm mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
                ❌ {promoError}
              </div>
            )}
            {promoSuccess && (
              <div className="text-green-600 text-sm mt-2 bg-green-50 border border-green-200 rounded-lg p-3">
                ✓ {promoSuccess}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 z-30">
        <div className="mb-3">
          <div className="text-sm text-gray-600 space-y-2">
            {/* Subtotal Items */}
            <div className="flex justify-between">
              <span>Subtotal Items:</span>
              <span className="text-gray-900">Rp{cartTotal.toLocaleString('id-ID')}</span>
            </div>
            
            {/* Delivery Cost */}
            {deliveryQuotation && (
              <div className="flex justify-between">
                <span>Biaya Pengiriman:</span>
                <span className="text-gray-900">Rp{parseInt(deliveryQuotation.price.total).toLocaleString('id-ID')}</span>
              </div>
            )}
            
            {/* Discount */}
            {cart.promoCode && cart.discount && (
              <div className="flex justify-between">
                <span>Diskon ({cart.promoCode}):</span>
                <span className="text-green-600">-Rp{cart.discount.toLocaleString('id-ID')}</span>
              </div>
            )}
            
            {/* Total */}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold text-lg">
                <span>Total Pembayaran:</span>
                <span className="text-[#d63384]">
                  Rp{(cartTotal - (cart.discount || 0) + (deliveryQuotation ? parseInt(deliveryQuotation.price.total) : 0)).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>
        <Button 
          onClick={handleSubmit}
          className="w-full py-4 text-base rounded-full bg-[#f5e1d8] text-black font-bold hover:bg-[#e9cfc0] shadow-lg"
        >
          {deliveryQuotation ? 'Lanjut ke Pembayaran' : 'Lanjut ke Pembayaran'}
        </Button>
      </div>

      {/* Delivery Info Modal */}
      {showDeliveryInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#f5e1d8] to-[#e9cfc0] text-black px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Aturan Pengiriman</h3>
                  <p className="text-black text-opacity-70 text-sm">Ketentuan waktu pengiriman</p>
                </div>
                <button 
                  onClick={() => setShowDeliveryInfo(false)}
                  className="w-8 h-8 bg-black bg-opacity-10 rounded-full flex items-center justify-center hover:bg-opacity-20 transition-colors"
                >
                  <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-[#d63384] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-gray-900">Waktu Pengiriman</div>
                    <div className="text-sm text-gray-600">Setiap hari jam 11:00 - 16:00 WIB</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-2 h-2 bg-[#d63384] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-gray-900">Pengiriman H+1</div>
                    <div className="text-sm text-gray-600">Semua pesanan dikirim besok (H+1), tidak ada pengiriman hari yang sama</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-2 h-2 bg-[#d63384] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-gray-900">Batas Waktu Pemesanan</div>
                    <div className="text-sm text-gray-600">Pesanan untuk pengiriman H+1 maksimal dibuat jam 12:00</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-2 h-2 bg-[#d63384] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-gray-900">Setelah Jam 12:00</div>
                    <div className="text-sm text-gray-600">Pesanan setelah jam 12:00 hanya tersedia untuk pengiriman H+2</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-2 h-2 bg-[#d63384] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-gray-900">Kendaraan</div>
                    <div className="text-sm text-gray-600">
                      <div>• Motor: lebih cepat & hemat, tidak ada garansi dalam pengiriman</div>
                      <div>• Mobil: kapasitas besar, untuk pudding dekorasi, dijamin aman</div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDeliveryInfo(false)}
                className="w-full mt-6 px-4 py-3 bg-[#f5e1d8] text-black rounded-xl font-medium hover:bg-[#e9cfc0] transition-colors"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerInfoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d63384]"></div>
          <span className="ml-3 text-gray-600">Memuat halaman...</span>
        </div>
      </div>
    }>
      <CustomerInfoContent />
    </Suspense>
  ); 
}