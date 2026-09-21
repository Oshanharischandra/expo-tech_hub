import React, { ReactNode, useEffect } from 'react';

export interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  glowColor?: 'gold' | 'amber' | 'champagne';
  size?: 'sm' | 'md' | 'lg';
  width?: string | number;
  height?: string | number;
  customSize?: boolean;
}

const glowColorMap = {
  gold: { base: 34, spread: 6 },      // Exact #ac834e
  amber: { base: 34, spread: 8 },     // Exact #ac834e
  champagne: { base: 34, spread: 4 }, // Exact #ac834e
};

const sizePresets = {
  sm: { width: '280px', height: '180px' },
  md: { width: '360px', height: '260px' },
  lg: { width: '440px', height: '320px' },
};

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = '',
  glowColor = 'gold',
  size = 'md',
  width,
  height,
  customSize = false,
  style,
  ...restProps
}) => {
  useEffect(() => {
    const syncPointer = (e: PointerEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      const xp = (x / window.innerWidth).toFixed(2);
      const yp = (y / window.innerHeight).toFixed(2);

      document.documentElement.style.setProperty('--x', x.toFixed(2));
      document.documentElement.style.setProperty('--xp', xp);
      document.documentElement.style.setProperty('--y', y.toFixed(2));
      document.documentElement.style.setProperty('--yp', yp);
    };

    document.addEventListener('pointermove', syncPointer);
    return () => {
      document.removeEventListener('pointermove', syncPointer);
    };
  }, []);

  const { base, spread } = glowColorMap[glowColor] || glowColorMap.gold;

  const getInlineStyles = () => {
    const baseStyles: Record<string, string | number> = {
      '--base': base,
      '--spread': spread,
      '--radius': '14',
      '--border': '2',
      '--backdrop': '#0e0e0e',
      '--backup-border': 'rgba(172, 131, 78, 0.35)',
      '--size': '250',
      '--outer': '1',
      '--saturation': '38',
      '--lightness': '49',
      '--bg-spot-opacity': '0.04',
      '--border-spot-opacity': '0.95',
      '--border-light-opacity': '0.15',
    };

    if (!customSize) {
      const preset = sizePresets[size];
      if (width !== undefined) {
        baseStyles.width = typeof width === 'number' ? `${width}px` : width;
      } else if (preset) {
        baseStyles.width = preset.width;
      }

      if (height !== undefined) {
        baseStyles.height = typeof height === 'number' ? `${height}px` : height;
      } else if (preset) {
        baseStyles.height = preset.height;
      }
    }

    return baseStyles;
  };

  return (
    <div
      data-glow
      style={{
        ...getInlineStyles(),
        ...style,
      }}
      className={`transition-all duration-300 ${className}`}
      {...restProps}
    >
      {children}
    </div>
  );
};

export default GlowCard;
