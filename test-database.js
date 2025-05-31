const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing database connection...');
console.log('Supabase URL configured:', !!supabaseUrl);
console.log('Supabase Key configured:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables not configured');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  try {
    console.log('\n🔍 Testing categories...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('id', { ascending: true });

    if (catError) {
      console.error('❌ Categories error:', catError);
    } else {
      console.log('✅ Categories found:', categories?.length || 0);
      if (categories?.length > 0) {
        console.log('Categories:', categories.map(c => ({ id: c.id, name: c.name, icon_url: c.icon_url })));
      }
    }

    console.log('\n🔍 Testing products...');
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*')
      .limit(5);

    if (prodError) {
      console.error('❌ Products error:', prodError);
    } else {
      console.log('✅ Products found:', products?.length || 0);
      if (products?.length > 0) {
        console.log('Sample products:', products.map(p => ({ 
          id: p.id, 
          name: p.name, 
          price: p.price,
          images: p.images?.slice(0, 1)
        })));
      }
    }

    console.log('\n🔍 Testing hero banners...');
    const { data: banners, error: bannerError } = await supabase
      .from('hero-banner')
      .select('*')
      .order('id', { ascending: true });

    if (bannerError) {
      console.error('❌ Hero banners error:', bannerError);
    } else {
      console.log('✅ Hero banners found:', banners?.length || 0);
      if (banners?.length > 0) {
        console.log('Banners:', banners.map(b => ({ id: b.id, text: b.text })));
      }
    }

    console.log('\n🎯 Summary:');
    console.log('- Categories:', categories?.length || 0);
    console.log('- Products:', products?.length || 0); 
    console.log('- Banners:', banners?.length || 0);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDatabase(); 