'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function MetaPixel() {
  useEffect(() => {
    // Meta Pixel will be initialized here when you add your pixel ID
    // For now, this is a placeholder
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    
    if (pixelId) {
      // Meta Pixel code will be added here
      // You can add it later when you have your pixel ID
    }
  }, []);

  return (
    <>
      {/* Meta Pixel Code - Add your pixel ID in .env.local */}
      {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}
    </>
  );
}







