
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export function CosmicThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Render a placeholder or nothing until mounted on the client
    return <div style={{width: '70px', height: '35px'}} />;
  }
  
  const isDark = resolvedTheme === 'dark';

  const handleToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const slider = e.currentTarget;
    const rect = slider.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    slider.style.setProperty('--x', `${x}px`);
    slider.style.setProperty('--y', `${y}px`);
  };
  
  return (
      <div className="scale-[0.5]">
        <label className="cosmic-toggle">
            <input 
                className="toggle" 
                type="checkbox" 
                checked={isDark} 
                onChange={handleToggle} 
            />
            <div className="slider" onMouseMove={handleMouseMove}>
                <div className="cosmos" />
                <div className="energy-line" />
                <div className="energy-line" />
                <div className="energy-line" />
                <div className="toggle-orb">
                    <div className="inner-orb" />
                    <div className="ring" />
                </div>
                <div className="particles">
                    <div style={{'--angle': '30deg'} as React.CSSProperties} className="particle" />
                    <div style={{'--angle': '60deg'} as React.CSSProperties} className="particle" />
                    <div style={{'--angle': '90deg'} as React.CSSProperties} className="particle" />
                    <div style={{'--angle': '120deg'} as React.CSSProperties} className="particle" />
                    <div style={{'--angle': '150deg'} as React.CSSProperties} className="particle" />
                    <div style={{'--angle': '180deg'} as React.CSSProperties} className="particle" />
                </div>
            </div>
        </label>
      </div>
  );
}
