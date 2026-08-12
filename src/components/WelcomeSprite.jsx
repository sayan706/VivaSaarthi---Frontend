import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function WelcomeSprite() {
  const { user } = useAuth();
  const [frame, setFrame] = useState(1);
  const totalFrames = 30;

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prevFrame) => (prevFrame % totalFrames) + 1);
    }, 50); // 20 frames per second for a faster smile
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-end gap-3 pointer-events-none">
      {/* Cloud Bubble */}
      <div className="relative bg-white font-bold px-6 py-4 rounded-[30px] shadow-[0_8px_25px_rgba(0,0,0,0.15)] animate-[bounce_3s_infinite] mb-20 pointer-events-auto flex items-center justify-center border border-gray-100">
        {/* Cloud tail pointing right */}
        <div className="absolute -bottom-3 right-6 w-8 h-8 bg-white transform rotate-45 border-b border-r border-gray-100 shadow-[4px_4px_10px_rgba(0,0,0,0.05)]"></div>
        
        <p className="text-lg m-0 relative z-10 whitespace-nowrap text-[#0e5c53]">
          Welcome back, {user?.name ? user.name.split(' ')[0] : 'User'}! 🚀
        </p>
      </div>

      {/* Sprite Animation */}
      <div className="w-32 h-40 md:w-48 md:h-60 flex-shrink-0 pointer-events-auto hover:scale-105 transition-transform cursor-pointer drop-shadow-xl">
        <img
          src={`/Male_Frendly_Smile/${frame}-01.png`}
          alt="Friendly Mascot"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}
