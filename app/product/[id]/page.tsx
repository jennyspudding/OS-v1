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
}

// Function to get category-specific add-ons
function getCategoryAddOns(categoryId: number): AddOn[] {
  // Default add-ons for all categories
  const defaultAddOns: AddOn[] = [
    { id: '1', name: 'Extra Vla', price: 30000 },
    { id: '2', name: 'Topper Lilin', price: 15000 },
  ];

  // Special add-ons for Pudding Loyang (category_id: 4)
  const puddingLoyangAddOns: AddOn[] = [
    { id: '1', name: 'Extra Vla', price: 30000 },
    { id: '2', name: 'Topper Lilin', price: 15000 },
    { id: '3', name: 'Add Tulisan (maks 3 kata)', price: 20000 },
    { id: '4', name: 'Topping Buah Half', price: 75000 },
    { id: '5', name: 'Topping Buah Full', price: 100000 },
  ];

  // Return category-specific add-ons
  switch (categoryId) {
    case 4: // Pudding Loyang
      return puddingLoyangAddOns;
    default:
      return defaultAddOns;
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Await params as required by Next.js 15
  const { id } = await params;
  
  // Fetch product data from Supabase with category information
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (!product || error) return notFound();

  // Get category-specific add-ons based on product's category
  const addOns: AddOn[] = getCategoryAddOns(product.category_id);

  return <ProductDetailClient product={product} addOns={addOns} />;
} 