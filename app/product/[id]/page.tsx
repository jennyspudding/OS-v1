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
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Await params as required by Next.js 15
  const { id } = await params;
  // Fetch product data from Supabase
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (!product || error) return notFound();

  // Mock add-ons (replace with real fetch if available)
  const addOns: AddOn[] = [
    { id: '1', name: 'Extra Vla', price: 30000 },
    { id: '2', name: 'Topper Lilin', price: 15000 },
  ];

  return <ProductDetailClient product={product} addOns={addOns} />;
} 