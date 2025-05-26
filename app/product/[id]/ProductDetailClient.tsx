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
}

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
  const router = useRouter();
  const imageScrollRef = useRef<HTMLDivElement>(null);
  const { addToCart, cart } = useCart();
  const [isAnimating, setIsAnimating] = useState(false);
  const [flyImgStyle, setFlyImgStyle] = useState<any>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const cartBtnRef = useRef<HTMLAnchorElement>(null);
  const mainImgRef = useRef<HTMLImageElement>(null);

  // Calculate total price
  const addOnsTotal = addOns.filter(a => selectedAddOns.includes(a.id)).reduce((sum, a) => sum + a.price, 0);
  const totalPrice = (product.price + addOnsTotal) * quantity;

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
          price: product.price,
          quantity,
          category: 'Uncategorized',
          addOns: addOns.filter(a => selectedAddOns.includes(a.id)),
          specialRequest,
        });
      }, 900);
    } else {
      addToCart({
        id: product.id,
        name: product.name,
        image: product.images && product.images.length > 0 ? product.images[mainImageIdx] : '/sample-product.jpg',
        price: product.price,
        quantity,
        category: 'Uncategorized',
        addOns: addOns.filter(a => selectedAddOns.includes(a.id)),
        specialRequest,
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
          <span className="font-bold text-base">{formatRupiah(product.price)}</span>
        </div>
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b48a78] text-xs"
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
                    onChange={e => {
                      setSelectedAddOns(prev =>
                        e.target.checked
                          ? [...prev, addOn.id]
                          : prev.filter(id => id !== addOn.id)
                      );
                    }}
                  />
                  <span>{addOn.name}</span>
                </div>
                <span className="text-gray-700 font-medium">+ {formatRupiah(addOn.price)}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Add to Cart Button (mobile) - floating with more margin and up from edge */}
      <div className="fixed bottom-6 left-0 w-full z-30 flex flex-col items-center pointer-events-none md:static md:p-0 md:border-0 md:bg-transparent">
        <Button
          ref={addBtnRef}
          className="w-full max-w-sm mx-4 py-2 text-base rounded-full bg-[#f5e1d8] text-black font-bold hover:bg-[#e9cfc0] md:static pointer-events-auto shadow-lg"
          onClick={handleAddToCart}
          disabled={isAnimating}
        >
          Add <span className="ml-2">{formatRupiah(totalPrice)}</span>
        </Button>
      </div>
    </div>
  );
} 