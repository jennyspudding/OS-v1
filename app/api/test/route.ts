import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('id', { ascending: true });

    // Test products
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*')
      .limit(5);

    // Test hero banners
    const { data: banners, error: bannerError } = await supabase
      .from('hero-banner')
      .select('*')
      .order('id', { ascending: true });

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        categories: {
          count: categories?.length || 0,
          data: categories || [],
          error: catError
        },
        products: {
          count: products?.length || 0,
          data: products || [],
          error: prodError
        },
        banners: {
          count: banners?.length || 0,
          data: banners || [],
          error: bannerError
        }
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('API test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 