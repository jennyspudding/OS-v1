const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://lbinjgbiugpvukqjclwd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiaW5qZ2JpdWdwdnVrcWpjbHdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODE1NDk0NiwiZXhwIjoyMDYzNzMwOTQ2fQ.kEYrsF5bxiPbaPIH6YTr7oR5n9e0krTTD9bg65sdWr0';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// List of pudding images to upload
const puddingImages = [
  'WhatsApp Image 2025-05-25 at 16.28.18.jpeg',
  'WhatsApp Image 2025-05-25 at 16.37.39.jpeg',
  'WhatsApp Image 2025-05-25 at 16.37.40 (1).jpeg',
  'WhatsApp Image 2025-05-25 at 16.37.40 (2).jpeg',
  'WhatsApp Image 2025-05-25 at 16.37.40 (3).jpeg',
  'WhatsApp Image 2025-05-25 at 16.37.40.jpeg',
  'WhatsApp Image 2025-05-25 at 16.37.41 (1).jpeg',
  'WhatsApp Image 2025-05-25 at 16.37.41 (2).jpeg',
  'WhatsApp Image 2025-05-25 at 16.37.41.jpeg'
];

async function uploadImages() {
  console.log('📸 Starting image upload to Supabase storage...');
  console.log(`🎯 Target: Upload ${puddingImages.length} pudding photos to product-photo bucket`);
  
  // Test connection first
  try {
    console.log('🔗 Testing Supabase connection...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.error('❌ Failed to connect to Supabase storage:', bucketError);
      return;
    }
    console.log('✅ Connected to Supabase storage');
    console.log('📂 Available buckets:', buckets.map(b => b.name).join(', '));
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return;
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const imageName of puddingImages) {
    try {
      const imagePath = path.join(__dirname, '..', 'public', imageName);
      console.log(`📁 Checking file: ${imagePath}`);
      
      // Check if file exists
      if (!fs.existsSync(imagePath)) {
        console.log(`⚠️ File not found: ${imageName}`);
        errorCount++;
        continue;
      }
      
      console.log(`📸 Reading image: ${imageName}`);
      
      // Read the file
      const imageBuffer = fs.readFileSync(imagePath);
      console.log(`📊 File size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
      
      // Upload to Supabase storage
      console.log(`⬆️ Uploading ${imageName} to product-photo bucket...`);
      const { data, error } = await supabase.storage
        .from('product-photo')
        .upload(imageName, imageBuffer, {
          contentType: 'image/jpeg',
          upsert: true // Overwrite if exists
        });
      
      if (error) {
        console.error(`❌ Failed to upload ${imageName}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Uploaded: ${imageName}`);
        console.log(`🔗 Path: ${data.path}`);
        successCount++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (err) {
      console.error(`❌ Error processing ${imageName}:`, err.message);
      errorCount++;
    }
  }
  
  console.log('\n📊 Upload Summary:');
  console.log(`✅ Successfully uploaded: ${successCount} images`);
  console.log(`❌ Failed uploads: ${errorCount} images`);
  
  if (successCount > 0) {
    console.log('\n🎉 Images uploaded successfully to product-photo bucket!');
    console.log('Now you can run npm run seed to populate the database with correct image URLs.');
  }
}

// Run the upload
uploadImages().catch(console.error); 