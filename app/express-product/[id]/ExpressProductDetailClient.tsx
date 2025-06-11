"use client";
import { Button } from '@/components/ui/button';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartContext';
import Link from 'next/link';

interface AddOn {
  id: string;
  name: string;
  price: number;
}

interface ExpressProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category_id: number;
  stock_quantity: number;
  preparation_time?: number;
  sizes?: string[] | any[];
}

// Define size options for Pudding Tart category
interface SizeOption {
  id: string;
  name: string;
  diameter: string;
  priceAdd: number;
}

// Define flavor and color options for Pudding Flower Bouquet category
interface FlavorOption {
  id: string;
  name: string;
  description: string;
}

interface ColorOption {
  id: string;
  name: string;
  color: string;
  emoji: string;
}

const PUDDING_TART_CATEGORY_ID = '603c267a-f47d-420f-a28c-6a797360ddff';

const PUDDING_TART_SIZE_OPTIONS: SizeOption[] = [
  {
    id: '15cm',
    name: 'Diameter 15 cm',
    diameter: '15 cm',
    priceAdd: 0 // normal price
  },
  {
    id: '20cm', 
    name: 'Diameter 20 cm',
    diameter: '20 cm',
    priceAdd: 160000 // add Rp 160,000
  }
];

const PUDDING_FLOWER_BOUQUET_CATEGORY_ID = 'aebc65b1-b9d6-4b23-a979-92b3e552627f';

const PUDDING_FLOWER_BOUQUET_FLAVORS: FlavorOption[] = [
  {
    id: 'choco',
    name: 'Chocolate',
    description: 'Rich chocolate flavor'
  },
  {
    id: 'mocca',
    name: 'Mocca',
    description: 'Coffee mocca blend'
  },
  {
    id: 'taro',
    name: 'Taro',
    description: 'Purple taro flavor'
  }
];

const PUDDING_FLOWER_BOUQUET_COLORS: ColorOption[] = [
  {
    id: 'pink',
    name: 'Pink',
    color: '#FF69B4',
    emoji: '🌸'
  },
  {
    id: 'blue',
    name: 'Blue', 
    color: '#4169E1',
    emoji: '💙'
  },
  {
    id: 'purple',
    name: 'Purple',
    color: '#9932CC',
    emoji: '💜'
  },
  {
    id: 'red',
    name: 'Red',
    color: '#DC143C',
    emoji: '❤️'
  },
  {
    id: 'orange',
    name: 'Orange',
    color: '#FF8C00',
    emoji: '🧡'
  },
  {
    id: 'pink-red',
    name: 'Pink Red',
    color: 'linear-gradient(45deg, #FF69B4, #DC143C)',
    emoji: '🌺'
  },
  {
    id: 'pink-blue',
    name: 'Pink Blue',
    color: 'linear-gradient(45deg, #FF69B4, #4169E1)',
    emoji: '🌷'
  },
  {
    id: 'pink-yellow-orange',
    name: 'Pink Sunset',
    color: 'linear-gradient(45deg, #FF69B4, #FFD700, #FF8C00)',
    emoji: '🌻'
  },
  {
    id: 'pink-purple',
    name: 'Pink Purple',
    color: 'linear-gradient(45deg, #FF69B4, #9932CC)',
    emoji: '🌼'
  },
  {
    id: 'purple-blue',
    name: 'Purple Blue',
    color: 'linear-gradient(45deg, #9932CC, #4169E1)',
    emoji: '💐'
  },
  {
    id: 'purple-red',
    name: 'Purple Red',
    color: 'linear-gradient(45deg, #9932CC, #DC143C)',
    emoji: '🌹'
  }
];

export type ExpressProductDetailClientProps = { product: ExpressProduct; addOns: AddOn[] };

function formatRupiah(num: number) {
  return 'Rp' + num.toLocaleString('id-ID');
}

export default function ExpressProductDetailClient({ product, addOns }: ExpressProductDetailClientProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [specialRequest, setSpecialRequest] = useState('');
  const [selectedSize, setSelectedSize] = useState<string>('15cm'); // default to 15cm
  const [selectedFlavor, setSelectedFlavor] = useState<string>('choco'); // default to chocolate
  const [selectedColor, setSelectedColor] = useState<string>('pink'); // default to pink
  const router = useRouter();
  const { addToCart, cart } = useCart();

  // Check if this is a Pudding Tart product
  const isPuddingTart = product.category_id.toString() === PUDDING_TART_CATEGORY_ID;
  
  // Check if this is a Pudding Flower Bouquet product
  const isPuddingFlowerBouquet = product.category_id.toString() === PUDDING_FLOWER_BOUQUET_CATEGORY_ID;
  
  // Get selected size details
  const selectedSizeOption = PUDDING_TART_SIZE_OPTIONS.find(size => size.id === selectedSize);
  const sizePrice = selectedSizeOption ? selectedSizeOption.priceAdd : 0;
  
  // Get selected flavor and color details
  const selectedFlavorOption = PUDDING_FLOWER_BOUQUET_FLAVORS.find(flavor => flavor.id === selectedFlavor);
  const selectedColorOption = PUDDING_FLOWER_BOUQUET_COLORS.find(color => color.id === selectedColor);

  // Calculate total price
  const addOnsTotal = addOns.filter(a => selectedAddOns.includes(a.id)).reduce((sum, a) => sum + a.price, 0);
  const basePrice = product.price + (isPuddingTart ? sizePrice : 0);
  const totalPrice = (basePrice + addOnsTotal) * quantity;

  const handleAddToExpressCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      image: product.images && product.images.length > 0 ? product.images[0] : '/logo.png',
      price: basePrice,
      quantity,
      category: 'Express',
      addOns: addOns.filter(a => selectedAddOns.includes(a.id)),
      specialRequest,
      selectedSize: isPuddingTart ? selectedSizeOption : undefined,
      selectedFlavor: isPuddingFlowerBouquet ? selectedFlavorOption : undefined,
      selectedColor: isPuddingFlowerBouquet ? selectedColorOption : undefined,
      isExpress: true,
      source: 'express'
    });
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col pb-28 md:pb-8">
      {/* Top Bar with Back and Express Cart Button */}
      <div className="fixed top-4 left-0 w-full flex items-center justify-between z-40 px-4 md:px-8">
        <button
          onClick={() => router.back()}
          className="bg-white/90 rounded-full shadow p-2 flex items-center border border-gray-200"
          aria-label="Back"
          style={{ backdropFilter: 'blur(4px)' }}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <Link href="/express-cart" className="relative bg-gradient-to-r from-[#b48a78] to-[#d4a574] rounded-full shadow p-2 flex items-center border border-[#b48a78]" aria-label="Express Cart" style={{ backdropFilter: 'blur(4px)' }}>
          <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 6h15l-1.5 9h-13z" />
            <circle cx="9" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
          </svg>
          <span className="text-white text-xs ml-1 font-bold">⚡</span>
          {cart.items.filter(item => item.isExpress === true || item.source === 'express').length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full px-1 md:text-xs md:px-2">
              {cart.items.filter(item => item.isExpress === true || item.source === 'express').reduce((sum, i) => sum + i.quantity, 0)}
            </span>
          )}
        </Link>
      </div>

      {/* Main Content */}
      <div className="w-full flex flex-col items-center pt-16 px-4">
        {/* Express Badge */}
        <div className="bg-gradient-to-r from-[#b48a78] to-[#d4a574] text-white px-4 py-2 rounded-full text-sm font-bold mb-4 animate-pulse">
          ⚡ EXPRESS - Same Day Delivery
        </div>

        {/* Product Image */}
        <div className="relative w-full max-w-md aspect-square flex items-center justify-center overflow-hidden mb-6">
          <img
            src={product.images && product.images.length > 0 ? product.images[0] : '/logo.png'}
            alt={product.name}
            className="object-cover w-full h-full rounded-xl border"
            style={{ aspectRatio: 1 }}
          />
        </div>

        {/* Product Info */}
        <div className="w-full max-w-md space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-[#b48a78] mb-2">{product.name}</h1>
            <p className="text-gray-600 text-sm">{product.description}</p>
            
            {/* Size Options for Pudding Tart */}
            {isPuddingTart && (
              <div className="mt-3">
                <span className="font-semibold block mb-2 text-sm text-[#8b5a3c]">Size Options</span>
                <div className="flex flex-col gap-2">
                  {PUDDING_TART_SIZE_OPTIONS.map((sizeOption) => (
                    <label
                      key={sizeOption.id}
                      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gradient-to-r hover:from-[#b48a78]/5 hover:to-[#d4a574]/5 transition-colors"
                      style={{
                        borderColor: selectedSize === sizeOption.id ? '#b48a78' : '#e5e7eb',
                        background: selectedSize === sizeOption.id ? 'linear-gradient(to right, #b48a78/10, #d4a574/10)' : 'white'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="size"
                          value={sizeOption.id}
                          checked={selectedSize === sizeOption.id}
                          onChange={(e) => setSelectedSize(e.target.value)}
                          className="w-4 h-4 text-[#b48a78] border-gray-300 focus:ring-[#b48a78]"
                        />
                        <div>
                          <div className="text-sm font-medium">{sizeOption.name}</div>
                          {sizeOption.priceAdd > 0 && (
                            <div className="text-xs text-gray-500">+{formatRupiah(sizeOption.priceAdd)}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-[#8b5a3c]">
                        {formatRupiah(product.price + sizeOption.priceAdd)}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {/* Original Sizes (for non-Pudding Tart products) */}
            {!isPuddingTart && product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0 && (
              <div className="mt-3">
                <span className="font-semibold block mb-2 text-sm text-[#8b5a3c]">Available Sizes</span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size: any, idx: number) => (
                    <span 
                      key={idx} 
                      className="bg-gradient-to-r from-[#b48a78]/20 to-[#d4a574]/20 text-[#8b5a3c] px-3 py-1 rounded-full text-xs font-medium border border-[#b48a78]/30"
                    >
                      {typeof size === 'object' ? (size.name || 'Custom Size') : size}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Flavor and Color Options for Pudding Flower Bouquet */}
            {isPuddingFlowerBouquet && (
              <>
                {/* Flavor Selection */}
                <div className="mt-3">
                  <span className="font-semibold block mb-2 text-sm text-[#8b5a3c]">Choose Flavor</span>
                  <div className="grid grid-cols-3 gap-2">
                    {PUDDING_FLOWER_BOUQUET_FLAVORS.map((flavorOption) => (
                      <label
                        key={flavorOption.id}
                        className="flex flex-col items-center p-3 border rounded-lg cursor-pointer hover:bg-gradient-to-r hover:from-[#b48a78]/5 hover:to-[#d4a574]/5 transition-colors text-center"
                        style={{
                          borderColor: selectedFlavor === flavorOption.id ? '#b48a78' : '#e5e7eb',
                          background: selectedFlavor === flavorOption.id ? 'linear-gradient(to right, #b48a78/10, #d4a574/10)' : 'white'
                        }}
                      >
                        <input
                          type="radio"
                          name="flavor"
                          value={flavorOption.id}
                          checked={selectedFlavor === flavorOption.id}
                          onChange={(e) => setSelectedFlavor(e.target.value)}
                          className="sr-only"
                        />
                        <div className="text-sm font-medium mb-1">{flavorOption.name}</div>
                        <div className="text-xs text-gray-500">{flavorOption.description}</div>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Color Selection */}
                <div className="mt-3">
                  <span className="font-semibold block mb-2 text-sm text-[#8b5a3c]">Choose Color</span>
                                     <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {PUDDING_FLOWER_BOUQUET_COLORS.map((colorOption) => (
                      <label
                        key={colorOption.id}
                        className="flex flex-col items-center p-3 border rounded-lg cursor-pointer hover:bg-gradient-to-r hover:from-[#b48a78]/5 hover:to-[#d4a574]/5 transition-colors text-center"
                        style={{
                          borderColor: selectedColor === colorOption.id ? '#b48a78' : '#e5e7eb',
                          background: selectedColor === colorOption.id ? 'linear-gradient(to right, #b48a78/10, #d4a574/10)' : 'white'
                        }}
                      >
                        <input
                          type="radio"
                          name="color"
                          value={colorOption.id}
                          checked={selectedColor === colorOption.id}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          className="sr-only"
                        />
                                                 <div className="text-2xl mb-1">{colorOption.emoji}</div>
                         <div 
                           className="w-6 h-6 rounded-full border-2 border-white shadow-sm mb-1"
                           style={{ 
                             background: colorOption.color.includes('gradient') 
                               ? colorOption.color 
                               : colorOption.color 
                           }}
                         ></div>
                         <div className="text-xs font-medium">{colorOption.name}</div>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Stock Info */}
          <div className="bg-gradient-to-r from-[#b48a78]/10 to-[#d4a574]/10 border border-[#b48a78]/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#8b5a3c] font-medium">⚡ Stok Express:</span>
              <span className="text-sm font-bold text-[#b48a78]">{product.stock_quantity} tersedia</span>
            </div>
          </div>

          {/* Price */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-[#b48a78]">{formatRupiah(basePrice)}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
                >
                  -
                </button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Add to Express Cart Button */}
          <Button 
            onClick={handleAddToExpressCart}
            className="w-full py-4 text-lg rounded-full bg-gradient-to-r from-[#b48a78] to-[#d4a574] text-white font-bold hover:from-[#8b5a3c] hover:to-[#b48a78] shadow-lg"
          >
            <span className="mr-2">⚡</span>
            Tambah ke Express Cart
            <span className="ml-2">⚡</span>
          </Button>
        </div>
      </div>
    </div>
  );
} 