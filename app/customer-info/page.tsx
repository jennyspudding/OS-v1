"use client";
import { useState, useEffect, Suspense } from "react";
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
  const [requestedDateTime, setRequestedDateTime] = useState('');
  const [alamatLengkap, setAlamatLengkap] = useState('');
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");
  const [coupons, setCoupons] = useState<any[]>([]);
  const [mapKey, setMapKey] = useState(0);

  // Calculate cart total
  const cartTotal = cart.items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    const addOnsTotal = item.addOns ? item.addOns.reduce((addOnSum, addOn) => addOnSum + addOn.price, 0) * item.quantity : 0;
    return sum + itemTotal + addOnsTotal;
  }, 0);

  // Auto-reload map when entering the page
  useEffect(() => {
    // Force map to reload by changing its key
    const timer = setTimeout(() => {
      setMapKey(prev => prev + 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Load saved data from both localStorage and sessionStorage on component mount
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    try {
      // Load form data from localStorage (persistent)
      const savedFormData = localStorage.getItem('customerFormData');
      if (savedFormData) {
        const parsedData = JSON.parse(savedFormData);
        console.log('Loading saved form data:', parsedData);
        setFormData(parsedData);
        setUseSamePhone(parsedData.phone === parsedData.recipientPhone);
        setUseSameName(parsedData.name === parsedData.recipientName);
      }

      // Load additional data from localStorage
      const savedMapCenter = localStorage.getItem('customerMapCenter');
      if (savedMapCenter) {
        const mapCenterData = JSON.parse(savedMapCenter);
        console.log('Loading saved map center:', mapCenterData);
        setMapCenter(mapCenterData);
      }

      const savedLocation = localStorage.getItem('customerSelectedLocation');
      if (savedLocation) {
        const locationData = JSON.parse(savedLocation);
        console.log('Loading saved location:', locationData);
        setSelectedLocation(locationData);
      }

      const savedAlamatLengkap = localStorage.getItem('customerAlamatLengkap');
      if (savedAlamatLengkap) {
        setAlamatLengkap(savedAlamatLengkap);
      }

      const savedQuotation = localStorage.getItem('customerDeliveryQuotation');
      if (savedQuotation) {
        const quotationData = JSON.parse(savedQuotation);
        console.log('Loading saved quotation:', quotationData);
        setDeliveryQuotation(quotationData.quotation);
        setIsMockQuotation(quotationData.isMock || false);
      }

      // Load session data from sessionStorage (temporary)
      const sessionData = sessionStorage.getItem('customerSessionData');
      if (sessionData) {
        const parsedSessionData = JSON.parse(sessionData);
        console.log('Loading session data:', parsedSessionData);
        if (parsedSessionData.useSamePhone !== undefined) {
          setUseSamePhone(parsedSessionData.useSamePhone);
        }
        if (parsedSessionData.useSameName !== undefined) {
          setUseSameName(parsedSessionData.useSameName);
        }
      }

      console.log('Customer data loaded from storage');
      setIsDataLoaded(true);
    } catch (error) {
      console.error('Error loading saved customer data:', error);
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
  }, [formData, useSamePhone, useSameName, isDataLoaded]);

  // Save map center to storage
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    if (mapCenter) {
      try {
        localStorage.setItem('customerMapCenter', JSON.stringify(mapCenter));
        console.log('Map center saved to storage:', mapCenter);
      } catch (error) {
        console.error('Error saving map center:', error);
      }
    }
  }, [mapCenter]);

  // Save selected location to storage
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    if (selectedLocation) {
      try {
        localStorage.setItem('customerSelectedLocation', JSON.stringify(selectedLocation));
        console.log('Selected location saved to storage:', selectedLocation);
      } catch (error) {
        console.error('Error saving selected location:', error);
      }
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

  // Auto-calculate delivery cost when location is loaded (but not when manually selected)
  useEffect(() => {
    if (selectedLocation && isDataLoaded && !deliveryQuotation) {
      console.log('Auto-calculating delivery cost for loaded location with MOTORCYCLE');
      setVehicleType('MOTORCYCLE');
      setTimeout(() => {
        getDeliveryQuotationWithVehicleType('MOTORCYCLE');
      }, 1500);
    }
  }, [selectedLocation, isDataLoaded]);

  useEffect(() => {
    // Get location data from URL params if coming back from location selection
    const province = searchParams.get('province');
    const city = searchParams.get('city');
    const district = searchParams.get('district');
    const postalCode = searchParams.get('postalCode');

    if (province && city && district && postalCode) {
      console.log('URL params detected:', { province, city, district, postalCode });
      
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
    console.log('getDeliveryQuotation called - delegating to getDeliveryQuotationWithVehicleType with MOTORCYCLE default');
    return getDeliveryQuotationWithVehicleType('MOTORCYCLE');
  };

  // Handle vehicle type change and auto-recalculate
  const handleVehicleTypeChange = (newVehicleType: 'MOTORCYCLE' | 'CAR') => {
    console.log('Vehicle type changed from', vehicleType, 'to', newVehicleType);
    setVehicleType(newVehicleType);
    
    // Auto-recalculate delivery cost when vehicle type changes
    if (selectedLocation) {
      setTimeout(() => {
        console.log('Auto-calculating delivery cost for vehicle type:', newVehicleType);
        // Call getDeliveryQuotation with the new vehicle type directly
        getDeliveryQuotationWithVehicleType(newVehicleType);
      }, 500);
    }
  };

  // Function to get delivery quotation with specific vehicle type
  const getDeliveryQuotationWithVehicleType = async (specificVehicleType?: 'MOTORCYCLE' | 'CAR') => {
    console.log('getDeliveryQuotationWithVehicleType called with:', specificVehicleType);
    
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
        serviceType: currentVehicleType
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
    setSelectedLocation(location);
    console.log('Location selected:', location);
    
    // Auto-populate alamat lengkap with the selected address
    setAlamatLengkap(location.address);
    
    // Extract location data from the address
    const locationData = extractLocationFromAddress(location.address);
    setFormData(prev => ({
      ...prev,
      ...locationData
    }));
    
    // Always reset to motorcycle when new location is selected and auto-calculate
    setVehicleType('MOTORCYCLE');
    setTimeout(() => {
      console.log('Auto-calculating delivery cost for new location with MOTORCYCLE');
      getDeliveryQuotationWithVehicleType('MOTORCYCLE');
    }, 1000);
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

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white flex items-center px-4 py-3 border-b border-gray-200">
        <button className="mr-3" onClick={() => router.back()}>
          <svg width="28" height="28" fill="none" stroke="black" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-lg font-bold flex-1">Informasi Customer</h1>
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d63384] focus:border-transparent"
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
                className="flex-1 p-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#d63384] focus:border-transparent"
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
                  className="w-4 h-4 text-[#d63384] bg-gray-100 border-gray-300 rounded focus:ring-[#d63384] focus:ring-2"
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
                  useSameName ? 'bg-gray-100 text-gray-500' : ''
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
                  className="w-4 h-4 text-[#d63384] bg-gray-100 border-gray-300 rounded focus:ring-[#d63384] focus:ring-2"
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
                    useSamePhone ? 'bg-gray-100 text-gray-500' : ''
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d63384] focus:border-transparent"
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
                <input
                  type="datetime-local"
                  value={requestedDateTime}
                  onChange={(e) => setRequestedDateTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d63384] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Pilih waktu pengiriman yang diinginkan</p>
              </div>
              
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
                    <div className="text-xs mt-1">Lebih cepat & murah (Default)</div>
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
                    <div className="text-xs mt-1">Kapasitas lebih besar</div>
                  </button>
                </div>
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
        <div className="px-4 pb-4">
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
                className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#d63384] focus:border-transparent"
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
        <div className="mb-3 text-center">
          <div className="text-sm text-gray-600 space-y-1">
            {cart.promoCode && (
              <div className="flex justify-between">
                <span>Diskon ({cart.promoCode}):</span>
                <span className="text-black">-Rp{cart.discount?.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="border-t pt-1 mt-2">
              <div className="flex justify-between font-bold text-base">
                <span>Total:</span>
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