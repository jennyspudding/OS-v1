import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import ProductDetailClient, { ProductDetailClientProps } from './ProductDetailClient';

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
  // Express-specific fields
  isExpress?: boolean;
  stock_quantity?: number;
  preparation_time?: number;
}

const PUDDING_LOYANG_CATEGORY_ID = 'fc2d5e2c-1e09-4e7c-8768-409f2ee8ec72';

// Function to get category-specific add-ons
function getCategoryAddOns(categoryId: string | number): AddOn[] {
  // Default add-ons for all categories
  const defaultAddOns: AddOn[] = [
    { id: '1', name: 'Extra Vla', price: 30000 },
    { id: '2', name: 'Topper Lilin', price: 15000 },
  ];

  // Special add-ons for Pudding Loyang (category_id: 4)
  const puddingLoyangAddOns: AddOn[] = [
    { id: '1', name: 'Extra Vla', price: 30000 },
    { id: '2', name: 'Topper Lilin', price: 15000 },
    { id: '3', name: 'Add Tulisan (maks. 3 kata)', price: 20000 },
    { id: '4', name: 'Add buah (half)', price: 75000 },
    { id: '5', name: 'Add buah (full)', price: 100000 },
    { id: '6', name: 'Add buah (half + tulisan)', price: 85000 },
  ];

  // Return category-specific add-ons
  switch (String(categoryId)) {
    case PUDDING_LOYANG_CATEGORY_ID:
      return puddingLoyangAddOns;
    default:
      return defaultAddOns;
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Await params as required by Next.js 15
  const { id } = await params;
  
  // Try to fetch from both products and express_products tables
  // First try regular products
  let { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  // If not found in products, try express_products
  if (!product || error) {
    const { data: expressProduct, error: expressError } = await supabase
      .from('express_products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (expressProduct && !expressError) {
      // Map express product structure to match regular product structure
      product = {
        id: expressProduct.id,
        name: expressProduct.name,
        description: expressProduct.description || '',
        price: expressProduct.price,
        images: expressProduct.images || [],
        category_id: expressProduct.category_id || 0,
        // Add express-specific metadata
        isExpress: true,
        stock_quantity: expressProduct.stock_quantity,
        preparation_time: expressProduct.preparation_time
      };
    }
  }

  if (!product) return notFound();

  // Get category-specific add-ons based on product's category
  const addOns: AddOn[] = getCategoryAddOns(product.category_id);

  return <ProductDetailClient product={product} addOns={addOns} />;
} 