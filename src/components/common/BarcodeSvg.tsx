import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface BarcodeSvgProps {
  value: string;
  className?: string;
  height?: number;
  showText?: boolean;
}

// Generate realistic CODE128 style line patterns based on hash of string
export const BarcodeSvg: React.FC<BarcodeSvgProps> = ({
  value,
  className = 'w-full max-w-[200px]',
  height = 42,
  showText = true,
}) => {
  // Deterministic bar widths generator for valid visual barcode representation
  const generateBars = (text: string) => {
    const bars: { width: number; isBlack: boolean }[] = [];
    // Start guard
    bars.push({ width: 2, isBlack: true });
    bars.push({ width: 1, isBlack: false });
    bars.push({ width: 2, isBlack: true });

    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }

    const absHash = Math.abs(hash);
    const charCodeSum = text.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

    for (let i = 0; i < 32; i++) {
      const bit = ((absHash >> (i % 24)) ^ (charCodeSum >> (i % 7))) & 3;
      const width = (bit % 3) + 1;
      const isBlack = (i + bit) % 2 === 0;
      bars.push({ width, isBlack });
    }

    // Stop guard
    bars.push({ width: 2, isBlack: true });
    bars.push({ width: 1, isBlack: false });
    bars.push({ width: 2, isBlack: true });

    return bars;
  };

  const bars = generateBars(value);
  const totalWidth = bars.reduce((acc, b) => acc + b.width, 0);

  let currentX = 0;

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full h-auto overflow-hidden bg-white"
        preserveAspectRatio="none"
      >
        {bars.map((bar, idx) => {
          const x = currentX;
          currentX += bar.width;
          if (!bar.isBlack) return null;
          return (
            <rect
              key={idx}
              x={x}
              y={0}
              width={bar.width}
              height={height}
              fill="#000000"
            />
          );
        })}
      </svg>
      {showText && (
        <span className="font-mono text-[10px] tracking-widest text-slate-800 font-bold mt-0.5">
          *{value}*
        </span>
      )}
    </div>
  );
};

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export const QrCodeComponent: React.FC<QrCodeProps> = ({
  value,
  size = 96,
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(
      value,
      {
        width: size * 2,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url && isMounted) {
          setDataUrl(url);
        }
      }
    );
    return () => {
      isMounted = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-slate-100 rounded-lg animate-pulse flex items-center justify-center text-[10px] text-slate-400 font-mono ${className}`}
      >
        QR
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={`QR Code: ${value}`}
      width={size}
      height={size}
      className={`rounded-sm border border-slate-200 bg-white p-0.5 ${className}`}
    />
  );
};
