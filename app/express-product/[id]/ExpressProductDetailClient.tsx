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

export type ExpressProductDetailClientProps = { product: ExpressProduct; addOns: AddOn[] };

function formatRupiah(num: number) {
  return 'Rp' + num.toLocaleString('id-ID');
}

export default function ExpressProductDetailClient({ product, addOns }: ExpressProductDetailClientProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [specialRequest, setSpecialRequest] = useState('');
  const router = useRouter();
  const { addToCart, cart } = useCart();

  // Calculate total price
  const addOnsTotal = addOns.filter(a => selectedAddOns.includes(a.id)).reduce((sum, a) => sum + a.price, 0);
  const totalPrice = (product.price + addOnsTotal) * quantity;

  const handleAddToExpressCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      image: product.images && product.images.length > 0 ? product.images[0] : '/logo.png',
      price: product.price,
      quantity,
      category: 'Express',
      addOns: addOns.filter(a => selectedAddOns.includes(a.id)),
      specialRequest,
      // @ts-ignore - extending CartItem interface for express items
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
            
            {/* Sizes */}
            {product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0 && (
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
              <span className="text-lg font-bold text-[#b48a78]">{formatRupiah(product.price)}</span>
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