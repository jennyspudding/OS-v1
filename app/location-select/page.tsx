"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { availableProvinces, searchLocation, Province, City, District } from "@/lib/indonesia-data";

interface SelectedLocation {
  province: string;
  city: string;
  district: string;
  postalCode: string;
}

function LocationSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState<Province[]>(availableProvinces);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation>({
    province: "",
    city: "",
    district: "",
    postalCode: ""
  });
  const [currentStep, setCurrentStep] = useState<'province' | 'city' | 'district'>('province');
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  useEffect(() => {
    const results = searchLocation(searchQuery);
    setFilteredData(results);
  }, [searchQuery]);

  const handleProvinceSelect = (province: Province) => {
    setSelectedProvince(province);
    setSelectedLocation(prev => ({ ...prev, province: province.name, city: "", district: "", postalCode: "" }));
    setCurrentStep('city');
  };

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    setSelectedLocation(prev => ({ ...prev, city: city.name, district: "", postalCode: "" }));
    setCurrentStep('district');
  };

  const handleDistrictSelect = (district: District) => {
    setSelectedLocation(prev => ({ 
      ...prev, 
      district: district.name, 
      postalCode: district.postalCode 
    }));
  };

  const handleSave = () => {
    if (selectedLocation.province && selectedLocation.city && selectedLocation.district) {
      // Pass the selected location data back to customer info page
      const params = new URLSearchParams({
        province: selectedLocation.province,
        city: selectedLocation.city,
        district: selectedLocation.district,
        postalCode: selectedLocation.postalCode
      });
      router.push(`/customer-info?${params.toString()}`);
    }
  };

  const handleBack = () => {
    if (currentStep === 'city') {
      setCurrentStep('province');
      setSelectedProvince(null);
      setSelectedLocation(prev => ({ ...prev, city: "", district: "", postalCode: "" }));
    } else if (currentStep === 'district') {
      setCurrentStep('city');
      setSelectedCity(null);
      setSelectedLocation(prev => ({ ...prev, district: "", postalCode: "" }));
    } else {
      router.back();
    }
  };

  const renderProvinceList = () => (
    <div className="space-y-1">
      <div className="text-sm text-gray-500 px-4 py-2 bg-gray-50">Provinsi</div>
      {filteredData.map((province) => (
        <div
          key={province.name}
          onClick={() => handleProvinceSelect(province)}
          className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 ${
            selectedLocation.province === province.name ? 'bg-pink-50 text-pink-600' : ''
          }`}
        >
          <div className="flex items-center">
            <span className="text-gray-400 mr-3 text-sm font-medium">
              {province.name.charAt(0)}
            </span>
            <span className="font-medium">{province.name}</span>
          </div>
          {selectedLocation.province === province.name && (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );

  const renderCityList = () => (
    <div className="space-y-1">
      <div className="text-sm text-gray-500 px-4 py-2 bg-gray-50">
        {selectedProvince?.name} - Kota/Kabupaten
      </div>
      {selectedProvince?.cities.map((city) => (
        <div
          key={city.name}
          onClick={() => handleCitySelect(city)}
          className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 ${
            selectedLocation.city === city.name ? 'bg-pink-50 text-pink-600' : ''
          }`}
        >
          <span className="font-medium">{city.name}</span>
          {selectedLocation.city === city.name && (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );

  const renderDistrictList = () => (
    <div className="space-y-1">
      <div className="text-sm text-gray-500 px-4 py-2 bg-gray-50">
        {selectedCity?.name} - Kecamatan
      </div>
      {selectedCity?.districts.map((district) => (
        <div
          key={district.name}
          onClick={() => handleDistrictSelect(district)}
          className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 ${
            selectedLocation.district === district.name ? 'bg-pink-50 text-pink-600' : ''
          }`}
        >
          <div>
            <div className="font-medium">{district.name}</div>
            <div className="text-sm text-gray-500">{district.postalCode}</div>
          </div>
          {selectedLocation.district === district.name && (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="flex items-center px-4 py-3">
          <button className="mr-3" onClick={handleBack}>
            <svg width="28" height="28" fill="none" stroke="black" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="flex-1">
            <div className="relative">
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                width="20" 
                height="20" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Cari Kota, Kecamatan, atau Kode Pos"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Location Breadcrumb */}
        {(selectedLocation.province || selectedLocation.city) && (
          <div className="px-4 pb-3">
            <div className="flex items-center text-sm text-gray-600">
              <span className="text-pink-600 font-medium">Lokasi Terpilih</span>
              <span className="mx-2 text-pink-500">•</span>
              <span className="text-pink-500 font-medium">Atur Ulang</span>
            </div>
            <div className="mt-1">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-pink-500 rounded-full mr-2"></div>
                <span className="font-medium text-pink-600">{selectedLocation.province}</span>
              </div>
              {selectedLocation.city && (
                <div className="flex items-center mt-1 ml-4">
                  <span className="text-gray-600">{selectedLocation.city}</span>
                </div>
              )}
              {selectedLocation.district && (
                <div className="flex items-center mt-1 ml-4">
                  <span className="text-gray-600">{selectedLocation.district}</span>
                  <span className="ml-2 text-gray-500">({selectedLocation.postalCode})</span>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <div className="bg-white">
        {currentStep === 'province' && renderProvinceList()}
        {currentStep === 'city' && renderCityList()}
        {currentStep === 'district' && renderDistrictList()}
      </div>

      {/* Fixed Bottom Button */}
      {selectedLocation.province && selectedLocation.city && selectedLocation.district && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 z-30">
          <Button 
            onClick={handleSave}
            className="w-full py-4 text-base rounded-full bg-pink-500 text-white font-bold hover:bg-pink-600 shadow-lg"
          >
            Simpan
          </Button>
        </div>
      )}
    </div>
  );
}

export default function LocationSelectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          <span className="ml-3 text-gray-600">Memuat halaman...</span>
        </div>
      </div>
    }>
      <LocationSelectContent />
    </Suspense>
  );
} 