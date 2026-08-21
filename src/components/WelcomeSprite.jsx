import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRive } from '@rive-app/react-canvas';

export default function WelcomeSprite() {
  const { user } = useAuth();
  const [windowMouse, setWindowMouse] = useState({ x: 0, y: 0 });

  const { rive, RiveComponent } = useRive({
    src: '/riv%20files/28334-53514-interactive-character-follow.riv',
    stateMachines: 'State Machine 1',
    autoplay: true,
  });

  useEffect(() => {
    if (rive) {
      console.log("State Machines:", rive.stateMachineNames);
      try {
        const inputs = rive.stateMachineInputs('State Machine 1');
        console.log("Inputs for State Machine 1:", inputs.map(i => i.name));
      } catch (e) {
        console.log("Could not get inputs", e);
      }
    }
  }, [rive]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setWindowMouse({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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

      {/* Rive Animation Container - overflow hidden and scaled to crop out the background */}
      <div
        className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 pointer-events-auto hover:scale-105 transition-transform cursor-pointer overflow-hidden rounded-full flex items-center justify-center relative"
      >
        <div className="absolute w-[220%] h-[220%] flex items-center justify-center" style={{ mixBlendMode: 'multiply' }}>
          <RiveComponent className="w-full h-full object-contain" />
        </div>
      </div>
    </div>
  );
}
