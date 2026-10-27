import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">About Us</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          We are passionate about creating beautiful artificial flowers, bouquets and fancy gajray for your special moments
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 mb-12">
        <div>
          <h2 className="text-3xl font-bold mb-6">Our Story</h2>
          <p className="text-gray-700 mb-4 leading-relaxed">
            FZhandcrafts is dedicated to creating beautiful artificial flowers, bouquets, and fancy gajray 
            that bring elegance and joy to every occasion. We believe that every moment deserves the perfect 
            floral touch, crafted with care and attention to detail.
          </p>
          <p className="text-gray-700 mb-4 leading-relaxed">
            Our team of skilled artisans carefully handcrafts each piece to ensure that you receive only 
            the finest quality artificial flowers. We specialize in creating stunning bouquets and elegant 
            gajray that last forever, bringing beauty to your celebrations.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Whether you're celebrating a wedding, festival, or any special occasion, we're here to help 
            you find the perfect artificial flowers and gajray that will make your moments memorable.
          </p>
        </div>
        <div className="relative h-96 rounded-lg overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1563241521-5eda3f5b8e84?w=800"
            alt="Our flower shop"
            fill
            className="object-cover"
          />
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-8 mb-12">
        <h2 className="text-3xl font-bold mb-6 text-center">Our Values</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4">🌹</div>
            <h3 className="text-xl font-semibold mb-2">Quality</h3>
            <p className="text-gray-600">
              We use only the finest materials to create beautiful artificial flowers.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">💝</div>
            <h3 className="text-xl font-semibold mb-2">Care</h3>
            <p className="text-gray-600">
              Every piece is handcrafted with attention to detail and love.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold mb-2">Service</h3>
            <p className="text-gray-600">
              We're committed to providing exceptional customer service.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold mb-6 text-center">Why Choose Us?</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex items-start space-x-4">
            <div className="text-primary-600 text-2xl">✓</div>
            <div>
              <h3 className="font-semibold mb-2">Lasting Beauty</h3>
              <p className="text-gray-600">
                Our artificial flowers and gajray last forever, bringing beauty to your celebrations.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="text-primary-600 text-2xl">✓</div>
            <div>
              <h3 className="font-semibold mb-2">Expert Artisans</h3>
              <p className="text-gray-600">
                Our team has years of experience creating beautiful artificial flowers and gajray.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="text-primary-600 text-2xl">✓</div>
            <div>
              <h3 className="font-semibold mb-2">Wide Selection</h3>
              <p className="text-gray-600">
                Choose from a wide variety of artificial flowers, bouquets and fancy gajray.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="text-primary-600 text-2xl">✓</div>
            <div>
              <h3 className="font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">
                Quick and reliable delivery to your doorstep.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



