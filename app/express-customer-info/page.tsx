"use client";

import { useState, useEffect, useRef, Suspense, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '../../components/CartContext';
import SimpleGoogleMap from '../../components/SimpleGoogleMap';
import { createClient } from '@supabase/supabase-js';
import DistanceExceededModal from '@/components/DistanceExceededModal'; // Import the new modal
import { Button } from "@/components/ui/button"; // Import the Button component

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

function ExpressCustomerInfoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, applyPromoCode, removePromoCode } = useCart();
  
  // Filter only express items
  const expressItems = cart.items.filter(item => 
    item.isExpress === true || item.source === 'express'
  );
  
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
  const [mapKey, setMapKey] = useState(Date.now()); // Use Date.now() for unique key
  const [isDistanceModalOpen, setIsDistanceModalOpen] = useState(false); // Renamed state
  const [hasExceededDistanceLimit, setHasExceededDistanceLimit] = useState(false); // New state

  // Custom date/time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [deliveryTimeWarning, setDeliveryTimeWarning] = useState('');
  const [timeSlotRefreshKey, setTimeSlotRefreshKey] = useState(0);
  
  // Delivery info modal state
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [modalWarningMessage, setModalWarningMessage] = useState('');

  // Refs to manage component state and prevent memory leaks
  const isMountedRef = useRef(true);
  const quotationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const urlParamsProcessedRef = useRef(false);

  // 🔧 IMPROVED COMPONENT MOUNT MANAGEMENT
  // Reset mounted state to true whenever component re-renders
  useEffect(() => {
    isMountedRef.current = true;
    console.log('🔄 EXPRESS: Component mounted/re-mounted, isMountedRef set to true');
    
    return () => {
      // Only set to false on actual component unmount
      console.log('🔄 EXPRESS: Component cleanup - setting isMountedRef to false');
      isMountedRef.current = false;
      if (quotationTimeoutRef.current) {
        clearTimeout(quotationTimeoutRef.current);
      }
    };
  }, []); // Empty dependency to run only on mount/unmount

  // Calculate cart total for express items only
  const cartTotal = expressItems.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    const addOnsTotal = item.addOns ? item.addOns.reduce((addOnSum, addOn) => addOnSum + addOn.price, 0) * item.quantity : 0;
    return sum + itemTotal + addOnsTotal;
  }, 0);

  // Redirect if no express items
  useEffect(() => {
    if (expressItems.length === 0) {
      router.push('/express-store');
    }
  }, [expressItems, router]);

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
      // Priority 1: Load express-specific session data first
      const expressLocationData = sessionStorage.getItem('expressLocationData');
      if (expressLocationData) {
        const parsedExpressData = JSON.parse(expressLocationData);
        console.log('🔄 EXPRESS: Loading express location data from session:', parsedExpressData);
        
        setSelectedLocation(parsedExpressData.selectedLocation);
        setMapCenter(parsedExpressData.mapCenter);
        setAlamatLengkap(parsedExpressData.alamatLengkap);
        hasStoredLocation = true;
        
        console.log('✅ EXPRESS: Express location data restored from session');
      }
      
      // Load express quotation data if available
      const expressQuotationData = sessionStorage.getItem('expressQuotationData');
      if (expressQuotationData) {
        const parsedQuotationData = JSON.parse(expressQuotationData);
        console.log('🔄 EXPRESS: Loading express quotation data from session:', parsedQuotationData);
        
        setDeliveryQuotation(parsedQuotationData.quotation);
        setIsMockQuotation(parsedQuotationData.isMock || false);
        
        console.log('✅ EXPRESS: Express quotation data restored from session');
      }
      
      // Load general form data
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

      // Only use general localStorage if express session data not available
      if (!hasStoredLocation) {
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
      }

      // Load delivery quotation only if express session data not available
      if (!expressQuotationData && storedDeliveryQuotation) {
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
      console.log('✅ EXPRESS: Loaded stored customer data with express priority');
    } catch (error) {
      console.error('❌ EXPRESS: Error loading stored data:', error);
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
    // Auto-calculate if we have location, data is loaded, no existing quotation, not loading, component is mounted, AND modal is not shown AND no distance limit exceeded
    if (selectedLocation && isDataLoaded && !deliveryQuotation && !isLoadingQuotation && isMountedRef.current && !isDistanceModalOpen && !hasExceededDistanceLimit) {
      console.log('EXPRESS: Auto-calculating delivery cost for location with current vehicle type and toll state');
      
      // Clear any existing timeout
      if (quotationTimeoutRef.current) {
        clearTimeout(quotationTimeoutRef.current);
      }
      
      quotationTimeoutRef.current = setTimeout(() => {
        // Triple-check all conditions before making the call
        if (!isMountedRef.current || isLoadingQuotation || deliveryQuotation) {
          console.log('Skipping auto-calculation: conditions changed');
          return;
        }
        getDeliveryQuotationWithVehicleType(vehicleType, useTollRoad); // Pass current vehicleType and useTollRoad state
      }, 1500);
      
      // Cleanup timeout on dependency change
      return () => {
        if (quotationTimeoutRef.current) {
          clearTimeout(quotationTimeoutRef.current);
          quotationTimeoutRef.current = null;
        }
      };
    }
  }, [selectedLocation, isDataLoaded, deliveryQuotation, isLoadingQuotation, vehicleType, useTollRoad, isDistanceModalOpen, hasExceededDistanceLimit]); // Added hasExceededDistanceLimit

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
    console.log('EXPRESS: getDeliveryQuotation called - delegating to getDeliveryQuotationWithVehicleType with MOTORCYCLE default and current toll state');
    return getDeliveryQuotationWithVehicleType('MOTORCYCLE', useTollRoad); // Pass current useTollRoad state
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
        getDeliveryQuotationWithVehicleType(newVehicleType, newUseTollRoadState); // Pass new toll state (false)
      }, 500);
    }
  };

  // Handle toll road option change and auto-recalculate
  const handleTollRoadChange = (useToll: boolean) => {
    console.log('🚀 EXPRESS: Toll road option changed to:', useToll);
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
        console.log('🚀 EXPRESS: Auto-calculating delivery cost with toll road option:', useToll);
        getDeliveryQuotationWithVehicleType(vehicleType, useToll); // Pass the 'useToll' status explicitly
      }, 500);
    }
  };

  // Function to get delivery quotation with specific vehicle type
  const getDeliveryQuotationWithVehicleType = async (specificVehicleType: 'MOTORCYCLE' | 'CAR', currentUseTollRoad: boolean) => {
    console.log('🚀 EXPRESS: getDeliveryQuotationWithVehicleType called with:', specificVehicleType, 'and toll:', currentUseTollRoad);
    
    if (!isMountedRef.current) {
      console.log('Component unmounted, skipping quotation call');
      return;
    }
    if (isLoadingQuotation) {
      console.log('Quotation already loading, skipping this call');
      return;
    }
    
    let coordinates = null;
    let deliveryAddress = '';
    
    try {
      const expressLocationData = sessionStorage.getItem('expressLocationData');
      if (expressLocationData) {
        const parsedData = JSON.parse(expressLocationData);
        coordinates = { lat: parsedData.selectedLocation.lat, lng: parsedData.selectedLocation.lng };
        deliveryAddress = parsedData.alamatLengkap;
        console.log('✅ EXPRESS: Using coordinates from express session storage:', coordinates);
      } 
      else if (selectedLocation) {
        coordinates = { lat: selectedLocation.lat, lng: selectedLocation.lng };
        deliveryAddress = selectedLocation.address;
        console.log('✅ EXPRESS: Using coordinates from state variables:', coordinates);
      }
      else {
        const storedLocation = localStorage.getItem('customerSelectedLocation');
        if (storedLocation) {
          const parsedLocation = JSON.parse(storedLocation);
          coordinates = { lat: parsedLocation.lat, lng: parsedLocation.lng };
          deliveryAddress = parsedLocation.address;
          console.log('✅ EXPRESS: Using coordinates from localStorage:', coordinates);
        }
      }
    } catch (error) {
      console.error('❌ EXPRESS: Error getting coordinates from storage:', error);
    }
    
    if (!coordinates || !deliveryAddress) {
      console.log('❌ EXPRESS: No coordinates available, cannot get quotation');
      setQuotationError('Pilih lokasi pengiriman terlebih dahulu menggunakan GPS atau peta');
      return;
    }

    const currentVehicleType = specificVehicleType || vehicleType;
    console.log('🎯 EXPRESS: Using coordinates for LaLaMove quotation:', { deliveryAddress, coordinates, vehicleType: currentVehicleType, useTollRoad: currentUseTollRoad });

    setIsLoadingQuotation(true);
    setQuotationError(null);
    // setIsDistanceModalOpen(false); // Keep modal closed initially

    try {
      const requestBody: any = {
        deliveryAddress,
        recipientName: formData.recipientName || formData.name || 'Express Customer',
        recipientPhone: formData.recipientPhone || formData.phone || '+62123456789',
        serviceType: currentVehicleType,
        useTollRoad: currentUseTollRoad,
        isExpress: true,
        orderType: 'express'
      };

      requestBody.coordinates = coordinates;

      console.log('CLIENT: requestedDateTime before API call:', requestedDateTime);

      if (requestedDateTime) {
        const dateTime = new Date(requestedDateTime);
        requestBody.isRequestedAt = dateTime.toISOString();
      }
      
      console.log('=== EXPRESS LALAMOVE API REQUEST ===');
      console.log('Full request body:', requestBody);
      console.log('=== END EXPRESS API REQUEST ===');
      
      const response = await fetch('/api/lalamove/quotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('🔄 EXPRESS: LaLaMove quotation response status:', response.status);
      const data = await response.json();
      console.log('📦 EXPRESS: LaLaMove quotation response data:', data);

      if (data.success) {
        setDeliveryQuotation(data.quotation);
        setIsMockQuotation(data.isMock || false);
        setQuotationError(null);
        setHasExceededDistanceLimit(false); // Reset flag on success
        setIsDistanceModalOpen(false); // Close modal on success
        
        try {
          const quotationData = {
            quotation: data.quotation,
            isMock: data.isMock || false,
            timestamp: new Date().toISOString(),
            coordinates: coordinates,
            isExpress: true
          };
          localStorage.setItem('customerDeliveryQuotation', JSON.stringify(quotationData));
          sessionStorage.setItem('expressQuotationData', JSON.stringify(quotationData));
          console.log('✅ EXPRESS: Quotation saved to storage');
        } catch (storageError) {
          console.error('❌ EXPRESS: Error saving quotation:', storageError);
        }
        
        if (data.isMock) {
          console.log('⚠️ EXPRESS: Using mock delivery quotation:', data.note || 'API not configured');
        }
      } else {
        let errorForSessionStorage: string;
        if (response.status === 400 && data.errorCode === 'DISTANCE_EXCEEDED') {
          setQuotationError(null);
          setDeliveryQuotation(null);
          setHasExceededDistanceLimit(true); // Set flag for distance error
          setIsDistanceModalOpen(true);      // Open modal for distance error
          errorForSessionStorage = data.error || 'Jarak pengiriman melebihi batas maksimal 70km.';
        } else {
          const generalErrorMessage = data.error || 'Failed to get express delivery quotation';
          setQuotationError(generalErrorMessage);
          setHasExceededDistanceLimit(false); // Reset flag for other errors
          setIsDistanceModalOpen(false);    // Ensure modal is closed for other errors
          errorForSessionStorage = generalErrorMessage;
        }
        
        try {
          const errorData = {
            error: errorForSessionStorage,
            timestamp: new Date().toISOString(),
            coordinates: coordinates,
            isExpress: true
          };
          sessionStorage.setItem('lastExpressQuotationError', JSON.stringify(errorData));
        } catch (storageError) {
          console.error('❌ EXPRESS: Error saving quotation error:', storageError);
        }
      }
    } catch (error) {
      console.error('❌ EXPRESS: Error getting quotation:', error);
      const errorMessage = 'Failed to get express delivery quotation';
      setQuotationError(errorMessage);
      setHasExceededDistanceLimit(false); // Reset flag for general catch error
      setIsDistanceModalOpen(false);    // Ensure modal is closed
      try {
        const errorData = {
          error: errorMessage,
          originalError: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
          coordinates: coordinates,
          isExpress: true
        };
        sessionStorage.setItem('lastExpressQuotationError', JSON.stringify(errorData));
      } catch (storageError) {
        console.error('❌ EXPRESS: Error saving quotation error:', storageError);
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
    if (!isMountedRef.current) {
      isMountedRef.current = true;
    }
    if (selectedLocation && 
        Math.abs(selectedLocation.lat - location.lat) < 0.00001 && 
        Math.abs(selectedLocation.lng - location.lng) < 0.00001 &&
        selectedLocation.address === location.address) {
      return;
    }
    
    try {
      const locationSessionData = {
        selectedLocation: location,
        mapCenter: { lat: location.lat, lng: location.lng },
        alamatLengkap: location.address,
        timestamp: new Date().toISOString(),
        isExpress: true
      };
      
      sessionStorage.setItem('expressLocationData', JSON.stringify(locationSessionData));
      localStorage.setItem('customerSelectedLocation', JSON.stringify(location));
      localStorage.setItem('customerMapCenter', JSON.stringify({ lat: location.lat, lng: location.lng }));
      localStorage.setItem('customerAlamatLengkap', location.address);
    } catch (error) {
      console.error('Error saving location to storage:', error);
    }
    
    setSelectedLocation(location);
    setMapCenter({ lat: location.lat, lng: location.lng });
    setAlamatLengkap(location.address);
    
    const locationData = extractLocationFromAddress(location.address);
    setFormData(prev => {
      const newFormData = { ...prev, ...locationData };
      try {
        localStorage.setItem('customerFormData', JSON.stringify(newFormData));
        const sessionData = {
          formData: newFormData,
          useSamePhone,
          useSameName,
          timestamp: new Date().toISOString(),
          isExpress: true
        };
        sessionStorage.setItem('customerSessionData', JSON.stringify(sessionData));
      } catch (error) {
        console.error('Error saving form data:', error);
      }
      return newFormData;
    });
    
    setDeliveryQuotation(null);
    setQuotationError(null);
    setVehicleType('MOTORCYCLE');
    setHasExceededDistanceLimit(false); // Reset distance error flag on new location
    setIsDistanceModalOpen(false);    // Close modal if it was open
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
        cart: {
          ...cart,
          items: expressItems // Only save express items
        },
        cartTotal: cartTotal,
        deliveryTotal: deliveryQuotation ? parseInt(deliveryQuotation.price.total) : 0,
        promoCode: cart.promoCode,
        discount: cart.discount,
        grandTotal: cartTotal - (cart.discount || 0) + (deliveryQuotation ? parseInt(deliveryQuotation.price.total) : 0),
        timestamp: new Date().toISOString(),
        status: 'ready_for_payment',
        // Express-specific flags
        isExpress: true,
        orderType: 'express',
        expressItems: expressItems
      };
      // Save to both localStorage and sessionStorage with express-specific keys
      localStorage.setItem('completeExpressOrderData', JSON.stringify(completeOrderData));
      sessionStorage.setItem('currentExpressOrder', JSON.stringify(completeOrderData));
      // Also save to general keys for compatibility
      localStorage.setItem('completeOrderData', JSON.stringify(completeOrderData));
      sessionStorage.setItem('currentOrder', JSON.stringify(completeOrderData));
      console.log('Complete express order data saved:', completeOrderData);
      return completeOrderData;
    } catch (error) {
      console.error('Error saving complete express order data:', error);
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

    // Check if distance limit has been exceeded
    if (hasExceededDistanceLimit) {
      alert('Jarak pengiriman melebihi batas. Silakan pilih lokasi yang lebih dekat.');
      setIsDistanceModalOpen(true); // Optionally re-open modal or rely on button being disabled
      return;
    }

    // Save complete order data before navigation
    const orderData = saveCompleteOrderData();
    
    if (orderData) {
      console.log('Navigating to express payment with order data:', orderData);
      // Navigate to express payment page
      router.push('/express-payment');
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (quotationTimeoutRef.current) {
        clearTimeout(quotationTimeoutRef.current);
      }
    };
  }, []);

  // Debug: Monitor selectedLocation changes
  useEffect(() => {
    console.log('🔍 EXPRESS: selectedLocation state changed:', selectedLocation);
  }, [selectedLocation]);

  // Debug: Monitor alamatLengkap changes
  useEffect(() => {
    console.log('🔍 EXPRESS: alamatLengkap state changed:', alamatLengkap);
  }, [alamatLengkap]);

  // Debug: Monitor mapCenter changes
  useEffect(() => {
    console.log('🔍 EXPRESS: mapCenter state changed:', mapCenter);
  }, [mapCenter]);

  // 📅 DELIVERY TIME VALIDATION FUNCTIONS FOR EXPRESS (SAME-DAY DELIVERY)
  const validateDeliveryTime = (dateTimeString: string) => {
    if (!dateTimeString) return { valid: true, warning: '' };
    
    const selectedDate = new Date(dateTimeString);
    const now = new Date();
    
    // Normalize dates to compare only the date part
    const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    
    const selectedHour = selectedDate.getHours();
    const selectedMinutes = selectedDate.getMinutes();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    
    // Express only allows same-day delivery
    if (selectedDateOnly.getTime() !== todayOnly.getTime()) {
      return {
        valid: false,
        warning: '⚡ Express delivery hanya tersedia untuk hari ini (same-day delivery). Silakan pilih hari ini.'
      };
    }
    
    // Check if delivery time is between 11:00-17:00 WIB
    if (selectedHour < 11 || selectedHour > 17) {
      return {
        valid: false,
        warning: '⚡ Waktu pengiriman express hanya tersedia antara jam 11:00 - 17:00 WIB. Silakan pilih waktu dalam rentang tersebut.'
      };
    }
    
    // Check if selected time is in the past
    const selectedTimeInMinutes = selectedHour * 60 + selectedMinutes;
    const currentTimeInMinutes = currentHour * 60 + currentMinutes;
    
    if (selectedTimeInMinutes <= currentTimeInMinutes + 30) { // At least 30 minutes from now
      return {
        valid: false,
        warning: '⚡ Waktu pengiriman express harus minimal 30 menit dari sekarang. Silakan pilih waktu yang lebih lama.'
      };
    }
    
    return { valid: true, warning: '' };
  };

  // Get minimum allowed delivery date (today)
  const getMinDeliveryDateTime = () => {
    const today = new Date();
    today.setHours(11, 0, 0, 0); // Default to 11:00 AM today
    return today.toISOString().slice(0, 16);
  };

  // Get maximum allowed delivery date (today at 16:00)
  const getMaxDeliveryDateTime = () => {
    const today = new Date();
    today.setHours(16, 0, 0, 0); // Max time is 16:00 today
    return today.toISOString().slice(0, 16);
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

  // 🗓️ CUSTOM DATE/TIME PICKER FUNCTIONS FOR EXPRESS
  const getAllTimeSlots = () => [
    '11:00', '11:15', '11:30', '11:45',
    '12:00', '12:15', '12:30', '12:45',
    '13:00', '13:15', '13:30', '13:45',
    '14:00', '14:15', '14:30', '14:45',
    '15:00', '15:15', '15:30', '15:45',
    '16:00', '16:15', '16:30', '16:45',
    '17:00'
  ];

  // Get available time slots based on current time + 30 minutes buffer
  const getAvailableTimeSlots = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    
    // Add 30 minutes buffer
    const bufferTime = new Date(now);
    bufferTime.setMinutes(currentMinutes + 30);
    
    const bufferHour = bufferTime.getHours();
    const bufferMinutes = bufferTime.getMinutes();
    
    const allSlots = getAllTimeSlots();
    
    return allSlots.filter(timeSlot => {
      const [slotHour, slotMinutes] = timeSlot.split(':').map(Number);
      const slotTimeInMinutes = slotHour * 60 + slotMinutes;
      const bufferTimeInMinutes = bufferHour * 60 + bufferMinutes;
      
      // Only show slots that are at least 30 minutes from now and within operating hours
      return slotTimeInMinutes >= bufferTimeInMinutes && slotHour >= 11 && slotHour <= 17;
    });
  };

  // Get the filtered time slots
  const timeSlots = useMemo(() => {
    return getAvailableTimeSlots();
  }, [timeSlotRefreshKey]);

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
    
    // For express, we only show today's month and only allow today to be selected
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today && !isToday; // Past but not today
      const isFuture = date > today; // Future dates not allowed for express
      
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
        isFuture,
        isSelected: selectedDate === dateStr,
        isDisabled: !isToday // For express, only today is enabled
      });
    }
    
    return days;
  };

  // Auto-set today's date for express same-day delivery
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    setSelectedDate(todayStr);
  }, []);

  // Refresh time slots every minute to update availability based on current time
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSlotRefreshKey(prev => prev + 1);
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF8F2] text-[#4A3B32]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white flex items-center px-4 py-3 border-b border-gray-200">
        <button className="mr-3" onClick={() => router.back()}>
          <svg width="24" height="24" fill="none" stroke="black" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-lg font-bold flex-1">Express Customer Info</h1>
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
      <div className="bg-white mx-2 sm:mx-4 mt-2 sm:mt-4 rounded-lg shadow-sm mb-20">
        <div className="p-3 sm:p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">Express Customer Info</h2>
          
          {/* Name Field */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">Nama Lengkap</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d63384] focus:border-transparent bg-white text-gray-900 text-base"
              placeholder="Nama lengkap"
            />
          </div>

          {/* Phone Field */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">Nomor Telepon</label>
            <div className="flex">
              <div className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg">
                <span className="text-gray-600 text-sm">+62</span>
              </div>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#d63384] focus:border-transparent bg-white text-gray-900 text-base"
                placeholder="8123456789"
              />
            </div>
          </div>

          {/* Recipient Name Field */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">Nama Penerima</label>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useSameName"
                  checked={useSameName}
                  onChange={(e) => handleUseSameNameChange(e.target.checked)}
                  className="appearance-none w-5 h-5 bg-white border border-black rounded checked:bg-white checked:border-black focus:ring-offset-0 focus:ring-0 checked:bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22black%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M12.207%204.793a1%201%200%20010%201.414l-5%205a1%201%200%2001-1.414%200l-2-2a1%201%200%20011.414-1.414L6.5%209.086l4.293-4.293a1%201%200%20011.414%200z%22/%3E%3C/svg%3E')] checked:bg-center checked:bg-no-repeat"
                />
                <label htmlFor="useSameName" className="ml-3 text-sm text-gray-600">
                  Gunakan nama yang sama
                </label>
              </div>
              <input
                type="text"
                value={formData.recipientName}
                onChange={(e) => handleInputChange('recipientName', e.target.value)}
                disabled={useSameName}
                className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d63384] focus:border-transparent text-base ${
                  useSameName ? 'bg-gray-100 text-gray-500' : 'bg-white text-gray-900'
                }`}
                placeholder="Nama penerima"
              />
            </div>
          </div>

          {/* Recipient Phone Field */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">Nomor Telepon Penerima</label>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useSamePhone"
                  checked={useSamePhone}
                  onChange={(e) => handleUseSamePhoneChange(e.target.checked)}
                  className="appearance-none w-5 h-5 bg-white border border-black rounded checked:bg-white checked:border-black focus:ring-offset-0 focus:ring-0 checked:bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22black%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M12.207%204.793a1%201%200%20010%201.414l-5%205a1%201%200%2001-1.414%200l-2-2a1%201%200%20011.414-1.414L6.5%209.086l4.293-4.293a1%201%200%20011.414%200z%22/%3E%3C/svg%3E')] checked:bg-center checked:bg-no-repeat"
                />
                <label htmlFor="useSamePhone" className="ml-3 text-sm text-gray-600">
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
                  className={`flex-1 p-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#d63384] focus:border-transparent text-base ${
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
              <div className="text-xs text-gray-600 bg-[#f8d7da] border border-[#f5c2c7] rounded-lg p-3 mb-3">
                <div className="font-medium text-[#d63384] mb-1">Lokasi Terpilih:</div>
                <div className="mb-2">{selectedLocation.address}</div>
                <div className="text-[#d63384] text-xs">
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d63384] focus:border-transparent bg-white text-gray-900 text-base"
                  placeholder="Edit alamat lengkap jika diperlukan..."
                  rows={3}
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Alamat ini akan digunakan untuk pengiriman. Anda dapat mengedit jika diperlukan.
                </p>
              </div>
            )}
            
            <div className="rounded-lg overflow-hidden">
              <SimpleGoogleMap
                key={mapKey}
                initialCenter={mapCenter || { lat: -6.2088, lng: 106.8456 }}
                onLocationSelect={handleLocationSelect}
                height="300px"
                regionBounds={{
                  province: formData.province,
                  city: formData.city,
                  district: formData.district
                }}
              />
            </div>
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
                {/* Auto-filled Date Display */}
                <div className="mb-3">
                  <label className="block text-sm text-gray-600 mb-2">Tanggal Pengiriman</label>
                  <div className="w-full p-3 bg-gradient-to-r from-[#b48a78]/10 to-[#d4a574]/10 border border-[#b48a78]/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-[#b48a78]">📅</span>
                      <span className="font-medium text-[#8b6f47]">
                        {selectedDate ? formatDateDisplay(selectedDate) : 'Hari ini'}
                      </span>
                      <span className="text-[#b48a78] text-sm">(Same-day Express)</span>
                    </div>
                  </div>
                </div>

                {/* Time Selection */}
                <label className="block text-sm text-gray-600 mb-2">Pilih Jam Pengiriman <span className="text-red-500">*</span></label>
                
                {/* Time Picker Display */}
                <div
                  onClick={() => setShowDatePicker(true)}
                  className="w-full p-4 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#b48a78] focus:border-transparent bg-white hover:border-[#b48a78] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-[#b48a78] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        {selectedTime ? (
                          <div>
                            <div className="font-medium text-gray-900">Jam {selectedTime} WIB</div>
                            <div className="text-sm text-[#b48a78]">Same-day Express Delivery</div>
                          </div>
                        ) : (
                          <div className="text-gray-500">Pilih jam pengiriman hari ini</div>
                        )}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mt-1">Express delivery hari ini jam 11:00 - 17:00 WIB (Same-day)</p>
                
                {/* Validation Warning */}
                {deliveryTimeWarning && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-yellow-800 text-sm">{deliveryTimeWarning}</div>
                  </div>
                )}
              </div>

              {/* Time Selection Modal */}
              {showDatePicker && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#b48a78] to-[#d4a574] text-white px-6 py-4 rounded-t-2xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold flex items-center gap-2">
                            <span>⚡</span>
                            Pilih Jam Pengiriman
                          </h3>
                          <p className="text-white text-opacity-80 text-sm">Same-day express - pilih jam pengiriman hari ini (WIB)</p>
                        </div>
                        <button 
                          onClick={() => setShowDatePicker(false)}
                          className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
                        >
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Date Display */}
                      <div className="mb-6 text-center">
                        <div className="bg-gradient-to-r from-[#b48a78]/10 to-[#d4a574]/10 border border-[#b48a78]/30 rounded-xl p-4">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-[#b48a78]">📅</span>
                            <span className="font-medium text-[#8b6f47]">
                              {selectedDate ? formatDateDisplay(selectedDate) : 'Hari ini'}
                            </span>
                          </div>
                          <div className="text-sm text-[#b48a78] mt-1">Same-day Express Delivery</div>
                        </div>
                      </div>

                      {/* Current Time & Buffer Info */}
                      <div className="mb-4 text-center">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="text-sm text-blue-800">
                            <div><strong>Waktu sekarang:</strong> {new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</div>
                            <div><strong>Tersedia mulai:</strong> {new Date(Date.now() + 30 * 60 * 1000).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</div>
                            <div className="text-xs text-blue-600 mt-1">Buffer 30 menit untuk persiapan express delivery</div>
                          </div>
                        </div>
                      </div>

                      {/* Time slots */}
                      <div className="mb-6">
                        <h5 className="text-sm font-medium text-gray-700 mb-3 text-center">Pilih Jam Pengiriman (WIB)</h5>
                        
                        {/* Show warning if no slots available */}
                        {timeSlots.length === 0 ? (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                            <div className="flex items-center justify-center mb-2">
                              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-yellow-800 font-medium">Tidak ada slot tersedia</span>
                            </div>
                            <p className="text-sm text-yellow-700">
                              Maaf, tidak ada slot pengiriman express yang tersedia hari ini. 
                              Express delivery memerlukan minimal 30 menit waktu persiapan dan beroperasi hingga jam 17:00 WIB.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                            {timeSlots.map((time: string) => (
                              <button
                                key={time}
                                onClick={() => handleTimeSelect(time)}
                                className={`
                                  p-3 text-sm rounded-lg border-2 transition-colors font-medium
                                  ${selectedTime === time
                                    ? 'border-[#b48a78] bg-gradient-to-r from-[#b48a78] to-[#d4a574] text-white'
                                    : 'border-gray-200 text-gray-700 hover:border-[#b48a78] hover:bg-gradient-to-r hover:from-[#b48a78]/10 hover:to-[#d4a574]/10'
                                  }
                                `}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Show buffer info */}
                        {timeSlots.length > 0 && (
                          <div className="mt-3 text-xs text-gray-500 text-center">
                            Slot waktu tersedia dengan buffer 30 menit dari sekarang
                          </div>
                        )}
                      </div>

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
                            if (selectedTime) {
                              setShowDatePicker(false);
                            }
                          }}
                          disabled={!selectedTime}
                          className={`
                            flex-1 px-4 py-3 rounded-xl font-medium transition-colors
                            ${selectedTime
                              ? 'bg-gradient-to-r from-[#b48a78] to-[#d4a574] text-white hover:from-[#8b6f47] hover:to-[#b48a78]'
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
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleVehicleTypeChange('MOTORCYCLE')}
                    className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                      vehicleType === 'MOTORCYCLE'
                        ? 'border-[#d63384] bg-[#f8d7da] text-[#d63384]'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-[#d63384]'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-1">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="font-medium">Motor</span>
                    </div>
                    <div className="text-xs text-center">lebih cepat & hemat, tidak ada garansi dalam pengiriman</div>
                  </button>
                  
                  <button
                    onClick={() => handleVehicleTypeChange('CAR')}
                    className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                      vehicleType === 'CAR'
                        ? 'border-[#d63384] bg-[#f8d7da] text-[#d63384]'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-[#d63384]'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-1">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      <span className="font-medium">Mobil</span>
                    </div>
                    <div className="text-xs text-center">kapasitas besar, untuk pudding dekorasi, dijamin aman</div>
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
                        className="appearance-none w-5 h-5 bg-white border border-black rounded checked:bg-white checked:border-black focus:ring-offset-0 focus:ring-0 checked:bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22black%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M12.207%204.793a1%201%200%20010%201.414l-5%205a1%201%200%2001-1.414%200l-2-2a1%201%200%20011.414-1.414L6.5%209.086l4.293-4.293a1%201%200%20011.414%200z%22/%3E%3C/svg%3E')] checked:bg-center checked:bg-no-repeat"
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
                                {deliveryQuotation.distance.unit === 'km' ?
                                  parseFloat(deliveryQuotation.distance.value).toFixed(1) :
                                  (parseInt(deliveryQuotation.distance.value) / 1000).toFixed(1)
                                } km
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
        <div className="px-3 sm:px-4 md:px-6 pb-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-[#d63384]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Kode Promo
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="text"
                value={promoInput}
                onChange={e => setPromoInput(e.target.value)}
                className="flex-1 border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d63384] focus:border-transparent bg-white text-gray-900 text-base"
                placeholder="Masukkan kode promo"
              />
              <Button 
                type="button" 
                onClick={handleApplyPromo} 
                className="w-full sm:w-auto px-6 py-3 text-base rounded-full bg-[#f5e1d8] text-black font-bold hover:bg-[#e9cfc0] shadow-lg whitespace-nowrap"
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
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-3 sm:p-4 z-30 safe-area-pb">
        <div className="mb-3">
          <div className="text-sm text-gray-600 space-y-2">
            {/* Subtotal Items */}
            <div className="flex justify-between">
              <span>Subtotal Items:</span>
              <span className="text-gray-900 font-medium">Rp{cartTotal.toLocaleString('id-ID')}</span>
            </div>
            
            {/* Delivery Cost */}
            {deliveryQuotation && (
              <div className="flex justify-between">
                <span>Biaya Pengiriman:</span>
                <span className="text-gray-900 font-medium">Rp{parseInt(deliveryQuotation.price.total).toLocaleString('id-ID')}</span>
              </div>
            )}
            
            {/* Discount */}
            {cart.promoCode && cart.discount && (
              <div className="flex justify-between">
                <span>Diskon ({cart.promoCode}):</span>
                <span className="text-green-600 font-medium">-Rp{cart.discount.toLocaleString('id-ID')}</span>
              </div>
            )}
            
            {/* Total */}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold text-lg">
                <span>Total Pembayaran:</span>
                <span className="text-[#d63384]">
                  Rp{(cartTotal - (cart.discount || 0) + (deliveryQuotation && !hasExceededDistanceLimit ? parseInt(deliveryQuotation.price.total) : 0)).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>
        <Button 
          onClick={handleSubmit}
          disabled={hasExceededDistanceLimit || isLoadingQuotation || !deliveryQuotation}
          className="w-full py-3 sm:py-4 text-base rounded-full bg-[#f5e1d8] text-black font-bold hover:bg-[#e9cfc0] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingQuotation ? 'Menghitung...' : (hasExceededDistanceLimit ? 'Pilih Lokasi Lain' : (deliveryQuotation ? 'Lanjut ke Pembayaran' : 'Lanjut ke Pembayaran'))}
        </Button>
      </div>

      {/* Delivery Info Modal */}
      {showDeliveryInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#b48a78] to-[#d4a574] text-white px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <span>⚡</span>
                    Aturan Pengiriman Express
                  </h3>
                  <p className="text-white text-opacity-80 text-sm">Ketentuan waktu pengiriman express</p>
                </div>
                <button 
                  onClick={() => setShowDeliveryInfo(false)}
                  className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-[#b48a78] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-gray-900">Waktu Pengiriman Express</div>
                    <div className="text-sm text-gray-600">Hari ini jam 11:00 - 17:00 WIB (Same-day delivery)</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-2 h-2 bg-[#b48a78] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-gray-900">Express Same-Day Delivery</div>
                    <div className="text-sm text-gray-600">Pesanan express dikirim hari ini juga, diproses dengan prioritas tinggi</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-2 h-2 bg-[#b48a78] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-gray-900">Minimal Waktu Pemesanan</div>
                    <div className="text-sm text-gray-600">Pesanan minimal 30 menit sebelum waktu pengiriman yang dipilih</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-2 h-2 bg-[#b48a78] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-gray-900">Slot Waktu Express</div>
                    <div className="text-sm text-gray-600">Tersedia setiap 15 menit dari jam 11:00 sampai 17:00 WIB</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-2 h-2 bg-[#b48a78] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-gray-900">Kendaraan Express</div>
                    <div className="text-sm text-gray-600">
                      <div>• Motor: express delivery tercepat, same-day</div>
                      <div>• Mobil: kapasitas besar untuk pesanan express, same-day, dijamin aman</div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDeliveryInfo(false)}
                className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-[#b48a78] to-[#d4a574] text-white rounded-xl font-medium hover:from-[#8b6f47] hover:to-[#b48a78] transition-colors"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      <DistanceExceededModal 
        isOpen={isDistanceModalOpen} 
        onClose={() => setIsDistanceModalOpen(false)} 
      />
    </div>
  );
}

export default function ExpressCustomerInfoPage() {
  return (
    <Suspense fallback={<div>Loading express customer info...</div>}>
      <ExpressCustomerInfoContent />
    </Suspense>
  );
} 