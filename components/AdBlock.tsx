
import React, { useEffect } from 'react';
import { DollarSign } from 'lucide-react';

interface AdBlockProps {
  slotId?: string; // The specific Ad Slot ID from your dashboard
  format?: 'auto' | 'fluid' | 'rectangle';
  layout?: 'in-article';
  className?: string;
}

const AdBlock: React.FC<AdBlockProps> = ({ slotId, format = 'auto', layout, className }) => {
  useEffect(() => {
    try {
      // Trigger Google AdSense to push an ad into the <ins> tag
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // Ads might be blocked by browser extensions, we catch it silently
      console.debug("AdSense Note: Ad blocked or not yet initialized.");
    }
  }, []);

  return (
    <div className={`my-8 px-6 overflow-hidden max-w-7xl mx-auto ${className}`}>
      <div className="relative bg-charcoal/20 border border-gold/10 rounded-[2rem] min-h-[120px] flex flex-col items-center justify-center ad-shine shadow-2xl">
        {/* AdSense Production Tag */}
        {/* 2. REPLACE 'ca-pub-YOUR_ID' with your actual Publisher ID */}
        <ins className="adsbygoogle"
             style={{ display: 'block', width: '100%', minHeight: '100px' }}
             data-ad-client="ca-pub-YOUR_ID" 
             data-ad-slot={slotId || "YOUR_SLOT_ID"} 
             data-ad-format={format}
             data-full-width-responsive="true"
             {...(layout ? { 'data-ad-layout': layout } : {})}
        ></ins>
        
        {/* Subtle Luxury Placeholder (Visible if ad fails to load or while loading) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <div className="flex flex-col items-center">
            <DollarSign className="w-10 h-10 text-gold mb-2" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gold">Premium Network Slot</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdBlock;
