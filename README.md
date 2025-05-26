# 🍮 Jenny's Pudding - E-Commerce System

A complete e-commerce platform for pudding delivery with integrated payment processing, Google Maps delivery selection, and order management.

## ✨ Features

- 🛒 **Shopping Cart**: Add products with customizable add-ons
- 📍 **Google Maps Integration**: Interactive location selection for delivery
- 💳 **Payment Processing**: Bank transfer with proof upload via Supabase
- 📱 **Mobile Responsive**: Beautiful design optimized for all devices
- 🎨 **Signature Design**: Custom pink/cream theme matching brand identity
- 📦 **Order Management**: Complete order tracking and admin dashboard
- 🚚 **Delivery Calculation**: Automatic cost calculation with Lalamove API
- 💬 **WhatsApp Integration**: Customer communication and support

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Storage, Auth)
- **Maps**: Google Maps API
- **Delivery**: Lalamove API
- **Payments**: Bank transfer with proof upload
- **Deployment**: Vercel/Netlify ready

## 📋 Setup Requirements

1. **Supabase Project**: Database and file storage
2. **Google Maps API**: Location selection and geocoding
3. **Lalamove Account**: Delivery cost calculation (optional)
4. **Bank Account**: Payment processing

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
├── components/             # Reusable React components
├── lib/                    # Utility functions and API clients
├── public/                 # Static assets and product images
└── Documentation/          # Setup guides and documentation
```

## 🔧 Configuration

See `DEPLOYMENT_GUIDE.md` for complete setup instructions including:
- Environment variables configuration
- Database schema setup
- API integrations
- Deployment options

## 📱 Customer Journey

1. **Browse Products** → View pudding catalog with images
2. **Product Details** → Select add-ons (Extra Vla, Topper Lilin)
3. **Shopping Cart** → Manage quantities and items
4. **Customer Info** → Fill details with Google Maps location
5. **Payment** → Bank transfer with QR code and proof upload
6. **Confirmation** → Thank you page with order tracking

## 🎨 Design System

- **Primary Color**: `#f5e1d8` (Signature cream)
- **Secondary Color**: `#b48a78` (Signature brown)
- **Typography**: Clean, readable fonts
- **Layout**: Mobile-first responsive design

## 🚀 Deployment

Ready for deployment on:
- **Vercel** (Recommended)
- **Netlify**
- **Self-hosted**

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

## 📞 Support

- **WhatsApp**: +62 812-8281-9898
- **Email**: support@jennyspudding.com

## 📄 License

Private project for Jenny's Pudding business.

---

**Built with ❤️ for Jenny's Pudding** 🍮
