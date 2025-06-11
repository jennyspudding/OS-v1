const { createClient } = require('@supabase/supabase-js');
const { productTemplates } = require('./product-data');

const supabaseUrl = 'https://lbinjgbiugpvukqjclwd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiaW5qZ2JpdWdwdnVrcWpjbHdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODE1NDk0NiwiZXhwIjoyMDYzNzMwOTQ2fQ.kEYrsF5bxiPbaPIH6YTr7oR5n9e0krTTD9bg65sdWr0';

console.log('🔍 Debug info:');
console.log('URL:', supabaseUrl.substring(0, 30) + '...');
console.log('Service Key length:', supabaseKey.length);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Available pudding photos from public folder - convert to Supabase storage URLs
const puddingPhotos = [
  'https://lbinjgbiugpvukqjclwd.supabase.co/storage/v1/object/public/product-photo/WhatsApp Image 2025-05-25 at 16.28.18.jpeg',
  'https://lbinjgbiugpvukqjclwd.supabase.co/storage/v1/object/public/product-photo/WhatsApp Image 2025-05-25 at 16.37.39.jpeg',
  'https://lbinjgbiugpvukqjclwd.supabase.co/storage/v1/object/public/product-photo/WhatsApp Image 2025-05-25 at 16.37.40 (1).jpeg',
  'https://lbinjgbiugpvukqjclwd.supabase.co/storage/v1/object/public/product-photo/WhatsApp Image 2025-05-25 at 16.37.40 (2).jpeg',
  'https://lbinjgbiugpvukqjclwd.supabase.co/storage/v1/object/public/product-photo/WhatsApp Image 2025-05-25 at 16.37.40 (3).jpeg',
  'https://lbinjgbiugpvukqjclwd.supabase.co/storage/v1/object/public/product-photo/WhatsApp Image 2025-05-25 at 16.37.40.jpeg',
  'https://lbinjgbiugpvukqjclwd.supabase.co/storage/v1/object/public/product-photo/WhatsApp Image 2025-05-25 at 16.37.41 (1).jpeg',
  'https://lbinjgbiugpvukqjclwd.supabase.co/storage/v1/object/public/product-photo/WhatsApp Image 2025-05-25 at 16.37.41 (2).jpeg',
  'https://lbinjgbiugpvukqjclwd.supabase.co/storage/v1/object/public/product-photo/WhatsApp Image 2025-05-25 at 16.37.41.jpeg'
];

// 9 Categories for Jenny's Pudding - Use original URLs (will be replaced by admin-uploaded icons)
const categories = [
  { name: 'Pudding Loyang', icon_url: 'https://images.unsplash.com/photo-1541599468348-e96984315921?w=100&h=100&fit=crop' },
  { name: 'Pudding Tumpeng', icon_url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=100&h=100&fit=crop' },
  { name: 'Pudding Cup', icon_url: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=100&h=100&fit=crop' },
  { name: 'Pudding Oriental', icon_url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=100&h=100&fit=crop' },
  { name: 'Pudding Tart', icon_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100&h=100&fit=crop' },
  { name: 'Pudding Moon', icon_url: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=100&h=100&fit=crop' },
  { name: 'Pudding 2 Tiers', icon_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=100&h=100&fit=crop' },
  { name: 'Pudding Flower Bouquet', icon_url: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=100&h=100&fit=crop' },
  { name: 'Brownie', icon_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=100&h=100&fit=crop' }
];

function getRandomPhotos(count = 4) {
  const shuffled = [...puddingPhotos].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function main() {
  console.log('🍮 Starting Jenny\'s Pudding seed process...');
  console.log('🔑 Using service role key for seeding (bypasses RLS)');
  console.log('📊 Target: 9 categories × 8 products = 72 products');
  
  try {
    // Test connection first
    console.log('🔗 Testing connection...');
    const { data: testData, error: testError } = await supabase.from('categories').select('count');
    if (testError) {
      console.error('❌ Connection test failed:', testError);
      return;
    }
    console.log('✅ Connection successful!');
    
    const insertedCategories = await seedCategories();
    await seedProducts(insertedCategories);
    await seedHeroBanners();
    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

async function seedCategories() {
  console.log('📦 Seeding categories...');
  
  // Clear existing data
  console.log('🧹 Clearing existing products...');
  await supabase.from('products').delete().neq('id', 0);
  console.log('🧹 Clearing existing categories...');
  await supabase.from('categories').delete().neq('id', 0);
  
  // Insert categories using upsert to handle duplicates
  const insertedCategories = [];
  for (const category of categories) {
    const { data, error } = await supabase
      .from('categories')
      .upsert([category], { onConflict: 'name' })
      .select();
      
    if (error) {
      console.error(`❌ Failed to insert category ${category.name}:`, error);
      throw error;
    }
    
    if (data && data.length > 0) {
      insertedCategories.push(data[0]);
      console.log(`✅ Inserted category: ${category.name}`);
    }
  }
  
  console.log(`✅ Inserted ${insertedCategories.length} categories`);
  return insertedCategories;
}

async function seedProducts(categoryData) {
  console.log('🍯 Seeding products...');
  
  let totalProducts = 0;
  
  for (const category of categoryData) {
    const templates = productTemplates[category.name] || [];
    
    console.log(`📝 Processing ${category.name}...`);
    
    if (templates.length === 0) {
      console.log(`⚠️ No product templates for ${category.name}, creating generic ones...`);
      // Create 8 generic products
      for (let i = 1; i <= 8; i++) {
        const product = {
          name: `${category.name} ${i}`,
          price: 20000 + (i * 2000),
          description: `Delicious ${category.name.toLowerCase()} variant ${i}`,
          category_id: category.id,
          images: getRandomPhotos(4)
        };
        
        const { error } = await supabase.from('products').insert([product]);
        if (error) {
          console.error(`❌ Failed to insert product ${product.name}:`, error);
          throw error;
        }
        totalProducts++;
      }
    } else {
      // Use predefined templates - take first 8 products
      const productsToInsert = templates.slice(0, 8);
      for (const template of productsToInsert) {
        const product = {
          ...template,
          category_id: category.id,
          images: getRandomPhotos(4)
        };
        
        const { error } = await supabase.from('products').insert([product]);
        if (error) {
          console.error(`❌ Failed to insert product ${product.name}:`, error);
          throw error;
        }
        totalProducts++;
      }
    }
    
    console.log(`✅ Added 8 products for ${category.name}`);
  }
  
  console.log(`🎉 Total products inserted: ${totalProducts}`);
}

async function seedHeroBanners() {
  console.log('🎯 Seeding hero banners...');
  
  const banners = [
    { text: 'Pudding Coklat Premium - Rasa Terbaik!', image: 'https://images.unsplash.com/photo-1541599468348-e96984315921?w=800&h=400&fit=crop' },
    { text: 'Pudding Buah Segar - Langsung dari Kebun!', image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=400&fit=crop' },
    { text: 'Koleksi Pudding Premium - Limited Edition!', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&h=400&fit=crop' }
  ];
  
  // Clear existing banners
  await supabase.from('hero-banner').delete().neq('id', 0);
  
  const { data, error } = await supabase
    .from('hero-banner')
    .insert(banners)
    .select();
    
  if (error) throw error;
  
  console.log(`✅ Inserted ${data.length} hero banners`);
}

main(); 