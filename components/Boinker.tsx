import React, { useState } from 'react';
import { OBSIDIAN_ICON_URL } from '../constants';

interface BoinkerProps {
  onTap: (x: number, y: number) => void;
  disabled: boolean;
  disabledLabel: string;
  customIcon?: string | null;
}

export const Boinker: React.FC<BoinkerProps> = ({ onTap, disabled, disabledLabel, customIcon }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    setIsPressed(true);
    onTap(e.clientX, e.clientY);
    
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handlePointerUp = () => {
    setIsPressed(false);
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full max-h-[50vh] transition-all duration-300">
      <div 
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`relative w-64 h-64 md:w-80 md:h-80 cursor-pointer select-none touch-none transform transition-transform duration-75 active:scale-90 ${
          isPressed ? 'scale-95' : 'scale-100'
        }`}
      >
        <img 
          src={customIcon || OBSIDIAN_ICON_URL} 
          alt="Obsidian Gem"
          className={`w-full h-full object-contain transition-all duration-500 obsidian-icon ${
            isPressed ? 'brightness-110' : 'brightness-100'
          }`}
        />
        
        {disabled && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center z-30">
            <span className="text-white font-black text-sm uppercase tracking-[0.3em] bg-red-600/90 border border-white/20 px-6 py-3 rounded-full transform -rotate-6 shadow-2xl text-center mx-2 animate-pulse">
              {disabledLabel}
            </span>
          </div>
        )}
      </div>
      
      {/* Glow Footprint */}
      <div className={`absolute bottom-0 w-32 h-4 bg-indigo-500/20 blur-xl rounded-full transition-opacity duration-300 ${isPressed ? 'opacity-80' : 'opacity-40'}`}></div>
    </div>
  );
};