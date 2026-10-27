# Flower Shop E-Commerce Website

A modern, full-featured e-commerce website for a flower shop business built with Next.js, React, TypeScript, and Google Firestore.

## Features

### Customer Features
- **Home Page**: Beautiful landing page with featured products
- **Product Pages**: Browse all products with search and category filters
- **Product Details**: Detailed product pages with image slideshow
- **Customer Reviews & Ratings**: 5-star ratings system and customer reviews on products
- **WhatsApp Floating Chat & Quick Order**: Floating chat button + instant 1-click order via WhatsApp with pre-filled cart & product details
- **Google / Gmail Authentication**: 1-click Sign-in & account creation with Google
- **Phone Number Checkout & Accounts**: 11-digit Pakistani phone check (`03...`), automatic phone account generation
- **Customer Account Dashboard**: View past orders, real-time statuses, and order details
- **Categories**: Browse products by category
- **Shopping Cart**: Add, remove, update quantities, and order cart via WhatsApp
- **Checkout**: Secure checkout with COD and guest account prompts
- **Order Status**: Track orders using order number
- **About Us**: Information about the business
- **Contact Us**: Contact form and business information

### Admin Features
- **Secure Admin Login**: Firebase Authentication for admin access
- **Admin Dashboard**: Overview of orders, revenue, and statistics
- **Product Management**: Add, edit, and delete products
- **Order Management**: View all orders and update order status
- **Order Details**: View detailed order information and customer details

### Technical Features
- **Google Firestore Database**: Cloud-based NoSQL database
- **Image Slideshow**: Swiper.js for product image galleries
- **PKR Currency**: Pakistani Rupee as default currency
- **Meta Pixel Ready**: Integration setup for Meta advertising pixel
- **Responsive Design**: Fully mobile-responsive UI with Tailwind CSS
- **PWA Support**: Progressive Web App - installable on mobile devices
- **Error Handling**: Comprehensive error boundaries and user-friendly error messages
- **Loading States**: Smooth loading indicators throughout the app
- **Modern UI**: Beautiful, clean interface optimized for all devices

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Enable Authentication (Email/Password)
4. Get your Firebase configuration keys
5. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Firestore Security Rules

Set up your Firestore security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products - readable by all, writable by authenticated admins
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Orders - readable/writable by authenticated users (admin)
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow create: if true; // Allow customers to create orders
      allow update: if request.auth != null; // Only admins can update
    }
  }
}
```

### 4. Create Admin User

1. Go to Firebase Console > Authentication
2. Add a user with email and password
3. Use these credentials to log in to the admin panel at `/admin/login`

### 5. Meta Pixel (Optional)

To add Meta Pixel tracking:

1. Get your Meta Pixel ID from Facebook Business Manager
2. Add it to `.env.local`:

```env
NEXT_PUBLIC_META_PIXEL_ID=your_pixel_id
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── admin/              # Admin pages
│   │   ├── login/         # Admin login
│   │   ├── products/      # Product management
│   │   └── orders/        # Order management
│   ├── products/          # Product pages
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout page
│   ├── order-status/      # Order tracking
│   ├── categories/        # Category browsing
│   ├── about/             # About us page
│   ├── contact/           # Contact page
│   └── page.tsx           # Home page
├── components/            # Reusable components
├── context/              # React context (Cart)
├── lib/                  # Utilities and Firebase config
└── public/               # Static assets
```

## Adding Products

1. Log in to the admin panel at `/admin/login`
2. Navigate to Products Management
3. Click "Add New Product"
4. Fill in product details:
   - Name, Description, Price (PKR)
   - Category
   - Image URLs (use free hosting like Unsplash, Picsum, or Imgur)
   - Stock status

## Image URLs

You can use free image hosting services for product images:
- Unsplash: `https://images.unsplash.com/photo-...`
- Picsum: `https://picsum.photos/400/400`
- Imgur: Direct image links

## Order Flow

1. Customer browses products and adds to cart
2. Customer proceeds to checkout
3. Customer fills in shipping information
4. Order is created with status "confirmed"
5. Customer receives order number
6. Customer can track order using order number
7. Admin can update order status (pending → confirmed → processing → shipped → delivered)

## Technologies Used

- **Next.js 14**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Firebase/Firestore**: Database and authentication
- **Swiper.js**: Image slideshow
- **React Hot Toast**: Notifications
- **React Icons**: Icon library
- **next-pwa**: Progressive Web App support
- **Error Boundaries**: React error handling

## PWA (Progressive Web App) Features

This website is a Progressive Web App, which means:

- **Installable**: Users can install it on their mobile devices like a native app
- **Offline Support**: Basic offline functionality with service worker caching
- **Fast Loading**: Optimized caching for better performance
- **App-like Experience**: Standalone display mode when installed

### To Enable PWA Icons

1. Create two icon files:
   - `public/icon-192x192.png` (192x192 pixels)
   - `public/icon-512x512.png` (512x512 pixels)
2. See `public/icon-generator.md` for detailed instructions

### Testing PWA

1. Build the project: `npm run build`
2. Start production server: `npm start`
3. Open in Chrome/Edge
4. Look for "Install" button in address bar
5. Or use Chrome DevTools > Application > Manifest to test

## Error Handling

The app includes comprehensive error handling:

- **Error Boundaries**: Catches React component errors gracefully
- **Try-Catch Blocks**: All async operations are wrapped in error handling
- **User-Friendly Messages**: Clear error messages with retry options
- **Loading States**: Visual feedback during data fetching
- **Form Validation**: Client-side validation for all forms

## Mobile Responsiveness

The entire website is fully responsive:

- **Mobile-First Design**: Optimized for small screens
- **Touch-Friendly**: Large tap targets for mobile users
- **Responsive Typography**: Text scales appropriately
- **Flexible Layouts**: Grids and flexbox adapt to screen size
- **Mobile Navigation**: Hamburger menu for mobile devices

## Production Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy to Vercel, Netlify, or your preferred hosting platform
3. Make sure to set environment variables in your hosting platform
4. Update Firestore security rules for production

## Support

For issues or questions, please contact the development team.


