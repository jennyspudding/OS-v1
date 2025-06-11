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

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category_id: number;
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

// Categories that include free vla bottle
const FREE_VLA_CATEGORY_IDS = [
  'fc2d5e2c-1e09-4e7c-8768-409f2ee8ec72',
  '4e692cca-aec9-4fe4-97dc-6066a27fcec4',
  '603c267a-f47d-420f-a28c-6a797360ddff',
  'c1027fbf-ea84-479d-8721-d773dd3ec2a6',
  'aebc65b1-b9d6-4b23-a979-92b3e552627f'
];

// Specific products that include free cup vla
const FREE_CUP_VLA_PRODUCT_IDS = [
  'a95ee4fe-03e9-4c6b-b5bb-4e764f6b160a',
  'b2f6f00e-8db2-4df4-8438-113b3c833cd6',
  '86035dc6-6054-4e65-a911-ab88319eaa20'
];

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

export type ProductDetailClientProps = { product: Product; addOns: AddOn[] };

function formatRupiah(num: number) {
  return 'Rp' + num.toLocaleString('id-ID');
}

export default function ProductDetailClient({ product, addOns }: ProductDetailClientProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [specialRequest, setSpecialRequest] = useState('');
  const [mainImageIdx, setMainImageIdx] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('15cm'); // default to 15cm
  const [selectedFlavor, setSelectedFlavor] = useState<string>('choco'); // default to chocolate
  const [selectedColor, setSelectedColor] = useState<string>('pink'); // default to pink
  const router = useRouter();
  const imageScrollRef = useRef<HTMLDivElement>(null);
  const { addToCart, cart } = useCart();
  const [isAnimating, setIsAnimating] = useState(false);
  const [flyImgStyle, setFlyImgStyle] = useState<any>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const cartBtnRef = useRef<HTMLAnchorElement>(null);
  const mainImgRef = useRef<HTMLImageElement>(null);

  // Check if this is a Pudding Tart product
  const isPuddingTart = product.category_id.toString() === PUDDING_TART_CATEGORY_ID;
  
  // Check if this is a Pudding Flower Bouquet product
  const isPuddingFlowerBouquet = product.category_id.toString() === PUDDING_FLOWER_BOUQUET_CATEGORY_ID;
  
  // Check if this category includes free vla bottle
  const includesFreeVla = FREE_VLA_CATEGORY_IDS.includes(product.category_id.toString());
  
  // Check if this specific product includes free cup vla
  const includesFreeCupVla = FREE_CUP_VLA_PRODUCT_IDS.includes(product.id.toString());
  
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

  // Carousel navigation
  const hasMultipleImages = product.images && product.images.length > 1;
  const goPrev = () => setMainImageIdx(idx => (idx === 0 ? product.images.length - 1 : idx - 1));
  const goNext = () => setMainImageIdx(idx => (idx === product.images.length - 1 ? 0 : idx + 1));

  // Swipe handler for mobile image carousel
  let touchStartX = 0;
  let touchEndX = 0;
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX - touchEndX > 40) {
      // swipe left
      setSlideDirection('left');
      setTimeout(() => {
        setMainImageIdx(idx => (idx === product.images.length - 1 ? 0 : idx + 1));
        setSlideDirection(null);
      }, 150);
    } else if (touchEndX - touchStartX > 40) {
      // swipe right
      setSlideDirection('right');
      setTimeout(() => {
        setMainImageIdx(idx => (idx === 0 ? product.images.length - 1 : idx - 1));
        setSlideDirection(null);
      }, 150);
    }
  };

  // Description logic
  const descLimit = 80;
  const isDescLong = product.description.length > descLimit;
  const descToShow = descExpanded || !isDescLong ? product.description : product.description.slice(0, descLimit) + '...';

  const handleAddToCart = () => {
    if (mainImgRef.current && cartBtnRef.current && addBtnRef.current) {
      const imgRect = mainImgRef.current.getBoundingClientRect();
      const cartRect = cartBtnRef.current.getBoundingClientRect();
      const cartSize = Math.max(cartRect.width, cartRect.height);
      setFlyImgStyle({
        display: 'block',
        position: 'fixed',
        left: imgRect.left,
        top: imgRect.top,
        width: imgRect.width,
        height: imgRect.height,
        zIndex: 9999,
        borderRadius: '16px',
        pointerEvents: 'none',
        transition: 'all 0.85s cubic-bezier(0.22, 0.61, 0.36, 1)',
      });
      setIsAnimating(true);
      setTimeout(() => {
        setFlyImgStyle((prev: any) => ({
          ...prev,
          left: cartRect.left + cartRect.width / 2 - cartSize / 2,
          top: cartRect.top + cartRect.height / 2 - cartSize / 2,
          width: cartSize,
          height: cartSize,
          borderRadius: cartSize / 2 + 'px',
          opacity: 0.7,
        }));
      }, 10);
      setTimeout(() => {
        setIsAnimating(false);
        setFlyImgStyle(null);
        addToCart({
          id: product.id,
          name: product.name,
          image: product.images && product.images.length > 0 ? product.images[mainImageIdx] : '/sample-product.jpg',
          price: basePrice,
          quantity,
          category: 'Uncategorized',
          addOns: addOns.filter(a => selectedAddOns.includes(a.id)),
          specialRequest,
          selectedSize: isPuddingTart ? selectedSizeOption : undefined,
          selectedFlavor: isPuddingFlowerBouquet ? selectedFlavorOption : undefined,
          selectedColor: isPuddingFlowerBouquet ? selectedColorOption : undefined,
        });
      }, 900);
    } else {
      addToCart({
        id: product.id,
        name: product.name,
        image: product.images && product.images.length > 0 ? product.images[mainImageIdx] : '/sample-product.jpg',
        price: basePrice,
        quantity,
        category: 'Uncategorized',
        addOns: addOns.filter(a => selectedAddOns.includes(a.id)),
        specialRequest,
        selectedSize: isPuddingTart ? selectedSizeOption : undefined,
        selectedFlavor: isPuddingFlowerBouquet ? selectedFlavorOption : undefined,
        selectedColor: isPuddingFlowerBouquet ? selectedColorOption : undefined,
      });
    }
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col pb-28 md:pb-8">
      {/* Top Bar with Back and Cart Button */}
      <div className="fixed top-4 left-0 w-full flex items-center justify-between z-40 px-4 md:px-8">
        <button
          onClick={() => router.back()}
          className="bg-white/90 rounded-full shadow p-2 flex items-center border border-gray-200"
          aria-label="Back"
          style={{ backdropFilter: 'blur(4px)' }}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <Link href="/cart" ref={cartBtnRef} className="relative bg-white/90 rounded-full shadow p-2 flex items-center border border-gray-200" aria-label="Cart" style={{ backdropFilter: 'blur(4px)' }}>
          <svg width="24" height="24" fill="none" stroke="black" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 6h15l-1.5 9h-13z" /><circle cx="9" cy="21" r="1" /><circle cx="19" cy="21" r="1" /></svg>
          {cart.items.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full px-1 md:text-xs md:px-2">{cart.items.reduce((sum, i) => sum + i.quantity, 0)}</span>
          )}
        </Link>
      </div>

      {/* Main Image + Thumbnails */}
      <div className="w-full flex flex-col items-center pt-16 px-2 md:px-0">
        <div
          className="relative w-full max-w-md aspect-square flex items-center justify-center overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            ref={mainImgRef}
            src={product.images && product.images.length > 0 ? product.images[mainImageIdx] : '/sample-product.jpg'}
            alt={product.name}
            className={`object-cover w-full h-full rounded-xl border select-none transition-transform duration-200 ${slideDirection === 'left' ? '-translate-x-full' : ''} ${slideDirection === 'right' ? 'translate-x-full' : ''}`}
            style={{ aspectRatio: 1 }}
            draggable={false}
          />
          {isAnimating && flyImgStyle && (
            <img
              src={product.images && product.images.length > 0 ? product.images[mainImageIdx] : '/sample-product.jpg'}
              alt="flying"
              style={flyImgStyle}
            />
          )}
        </div>
        {/* Thumbnails */}
        {product.images && product.images.length > 1 && (
          <div className="flex gap-2 mt-3 justify-center">
            {product.images.map((img, idx) => (
              <button
                key={img}
                className={`w-12 h-12 rounded-lg border ${mainImageIdx === idx ? 'border-[#b48a78] ring-2 ring-[#b48a78]' : 'border-gray-200'} overflow-hidden focus:outline-none`}
                onClick={() => setMainImageIdx(idx)}
                aria-label={`Show image ${idx + 1}`}
                tabIndex={0}
              >
                <img src={img} alt="thumbnail" className="object-cover w-full h-full" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-none mt-4 px-4 md:shadow-lg md:mt-8 md:p-8">
        <h1 className="text-lg md:text-xl font-bold mb-2">{product.name}</h1>
        <p className="text-gray-500 mb-3 text-sm md:text-base">
          {descToShow}
          {isDescLong && (
            <button
              className="ml-2 text-[#b48a78] underline text-xs font-semibold focus:outline-none"
              onClick={() => setDescExpanded(e => !e)}
            >
              {descExpanded ? 'Read less' : 'Read more'}
            </button>
          )}
        </p>
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-xs">Price</span>
          <span className="font-bold text-base">{formatRupiah(basePrice)}</span>
        </div>
        
        {/* Premium Free Vla Info */}
        {includesFreeVla && (
          <div className="mb-3 relative overflow-hidden rounded-xl bg-gradient-to-br from-[#fef7f0] via-[#fff8f5] to-[#ffe9ea] border-2 border-[#d4a574]/30 shadow-lg">
            {/* Premium background pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,_rgba(180,138,120,0.1)_0%,_transparent_60%),_radial-gradient(circle_at_80%_50%,_rgba(212,165,116,0.1)_0%,_transparent_60%)]"></div>
            
            {/* Content */}
            <div className="relative p-4">
              <div className="flex items-start gap-3">
                {/* Premium Icon */}
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#b48a78] to-[#d4a574] rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-lg">🍼</span>
                </div>
                
                {/* Text Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-[#8b5a3c] tracking-wide">GRATIS BONUS</span>
                    <div className="w-8 h-0.5 bg-gradient-to-r from-[#b48a78] to-[#d4a574] rounded-full"></div>
                  </div>
                  <p className="text-xs text-[#b48a78] font-medium leading-relaxed">
                    Dapatkan <span className="font-bold text-[#8b5a3c]">1 Botol Vla Premium (250ml)</span> gratis untuk setiap pudding
                  </p>
                </div>
                
                {/* Premium Badge */}
                <div className="flex-shrink-0">
                  <div className="bg-gradient-to-r from-[#b48a78] to-[#d4a574] text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                    FREE
                  </div>
                </div>
              </div>
              
              {/* Bottom accent line */}
              <div className="mt-3 h-0.5 bg-gradient-to-r from-transparent via-[#d4a574]/50 to-transparent rounded-full"></div>
            </div>
          </div>
        )}
        
        {/* Premium Free Cup Vla Info */}
        {includesFreeCupVla && (
          <div className="mb-3 relative overflow-hidden rounded-xl bg-gradient-to-br from-[#fef7f0] via-[#fff8f5] to-[#ffe9ea] border-2 border-[#d4a574]/30 shadow-lg">
            {/* Premium background pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,_rgba(180,138,120,0.1)_0%,_transparent_60%),_radial-gradient(circle_at_80%_50%,_rgba(212,165,116,0.1)_0%,_transparent_60%)]"></div>
            
            {/* Content */}
            <div className="relative p-4">
              <div className="flex items-start gap-3">
                {/* Premium Icon */}
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#b48a78] to-[#d4a574] rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-lg">🥤</span>
                </div>
                
                {/* Text Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-[#8b5a3c] tracking-wide">GRATIS BONUS</span>
                    <div className="w-8 h-0.5 bg-gradient-to-r from-[#b48a78] to-[#d4a574] rounded-full"></div>
                  </div>
                  <p className="text-xs text-[#b48a78] font-medium leading-relaxed">
                    Dapatkan <span className="font-bold text-[#8b5a3c]">1 Cup Vla (120ml)</span> gratis untuk setiap paket
                  </p>
                </div>
                
                {/* Premium Badge */}
                <div className="flex-shrink-0">
                  <div className="bg-gradient-to-r from-[#b48a78] to-[#d4a574] text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                    FREE
                  </div>
                </div>
              </div>
              
              {/* Bottom accent line */}
              <div className="mt-3 h-0.5 bg-gradient-to-r from-transparent via-[#d4a574]/50 to-transparent rounded-full"></div>
            </div>
          </div>
        )}
        
        {/* Size Options for Pudding Tart */}
        {isPuddingTart && (
          <div className="mb-3">
            <span className="font-semibold block mb-2 text-xs">Size Options</span>
            <div className="flex flex-col gap-2">
              {PUDDING_TART_SIZE_OPTIONS.map((sizeOption) => (
                <label
                  key={sizeOption.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{
                    borderColor: selectedSize === sizeOption.id ? '#b48a78' : '#e5e7eb',
                    backgroundColor: selectedSize === sizeOption.id ? '#fef7f0' : 'white'
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
          <div className="mb-3">
            <span className="font-semibold block mb-2 text-xs">Available Sizes</span>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size: any, idx: number) => (
                <span 
                  key={idx} 
                  className="bg-[#f5e1d8] text-[#8b5a3c] px-3 py-1 rounded-full text-xs font-medium border border-[#e9cfc0]"
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
            <div className="mb-3">
              <span className="font-semibold block mb-2 text-xs">Choose Flavor</span>
              <div className="grid grid-cols-3 gap-2">
                {PUDDING_FLOWER_BOUQUET_FLAVORS.map((flavorOption) => (
                  <label
                    key={flavorOption.id}
                    className="flex flex-col items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-center"
                    style={{
                      borderColor: selectedFlavor === flavorOption.id ? '#b48a78' : '#e5e7eb',
                      backgroundColor: selectedFlavor === flavorOption.id ? '#fef7f0' : 'white'
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
            <div className="mb-3">
              <span className="font-semibold block mb-2 text-xs">Choose Color</span>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {PUDDING_FLOWER_BOUQUET_COLORS.map((colorOption) => (
                  <label
                    key={colorOption.id}
                    className="flex flex-col items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-center"
                    style={{
                      borderColor: selectedColor === colorOption.id ? '#b48a78' : '#e5e7eb',
                      backgroundColor: selectedColor === colorOption.id ? '#fef7f0' : 'white'
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
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-xs">Quantity</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="text-xs px-2 py-1" onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</Button>
            <span className="px-2 min-w-[20px] text-center text-xs">{quantity}</span>
            <Button size="sm" variant="outline" className="text-xs px-2 py-1" onClick={() => setQuantity(q => q + 1)}>+</Button>
          </div>
        </div>
        <div className="mb-3">
          <label className="font-semibold block mb-1 text-xs">Special Request</label>
          <input
            type="text"
            value={specialRequest}
            onChange={e => setSpecialRequest(e.target.value)}
            placeholder="Type here (optional)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b48a78] text-xs bg-white"
            maxLength={200}
            inputMode="text"
            style={{ fontSize: 16 }}
          />
        </div>
        {/* Add-ons */}
        <div className="mb-3">
          <span className="block text-gray-400 text-xs mb-1">Optional</span>
          <div className="flex flex-col gap-2">
            {addOns.map(addOn => (
              <label key={addOn.id} className="flex items-center gap-2 justify-between text-xs">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedAddOns.includes(addOn.id)}
                    onChange={() => {
                      setSelectedAddOns(prev =>
                        prev.includes(addOn.id)
                          ? prev.filter(id => id !== addOn.id)
                          : [...prev, addOn.id]
                      );
                    }}
                    className="appearance-none w-4 h-4 bg-white border border-black rounded checked:bg-white checked:border-black focus:ring-offset-0 focus:ring-0 checked:bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22black%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M12.207%204.793a1%201%200%20010%201.414l-5%205a1%201%200%2001-1.414%200l-2-2a1%201%200%20011.414-1.414L6.5%209.086l4.293-4.293a1%201%200%20011.414%200z%22/%3E%3C/svg%3E')] checked:bg-center checked:bg-no-repeat"
                  />
                  <span>{addOn.name}</span>
                </div>
                <span className="text-gray-600">{formatRupiah(addOn.price)}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Premium Add to Cart Button */}
      <div className="fixed bottom-6 left-0 w-full z-30 flex flex-col items-center pointer-events-none md:static md:p-0 md:border-0 md:bg-transparent md:mt-4">
        <Button
          ref={addBtnRef}
          className="w-full max-w-sm mx-4 py-4 text-base rounded-xl bg-gradient-to-r from-[#b48a78] to-[#d4a574] text-white font-bold hover:from-[#8b5a3c] hover:to-[#b48a78] md:static pointer-events-auto shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] md:py-3 md:text-lg"
          onClick={handleAddToCart}
          disabled={isAnimating}
        >
          {isAnimating ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Adding...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add to Cart</span>
              <span className="bg-white/20 px-3 py-1 rounded-lg font-bold">
                {formatRupiah(totalPrice)}
              </span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
} 