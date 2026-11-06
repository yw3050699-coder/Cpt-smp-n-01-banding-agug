import React from 'react';

interface TutWuriLogoProps {
  className?: string;
  size?: number;
}

export const TutWuriLogo: React.FC<TutWuriLogoProps> = ({ className = 'w-8 h-8', size }) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className={className}
      style={style}
      aria-label="Logo Tut Wuri Handayani - Kementerian Pendidikan"
      role="img"
    >
      {/* Background Pentagon (Segilima Biru Muda) */}
      <polygon
        points="100,10 188,72 154,178 46,178 12,72"
        fill="#0080CC"
        stroke="#111827"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Ribbon Banner Top for Text "TUT WURI HANDAYANI" */}
      <path
        d="M 28,68 Q 100,20 172,68"
        fill="none"
        stroke="none"
        id="tutWuriTextPath"
      />
      <text
        fill="#FFFFFF"
        fontSize="14.5"
        fontWeight="800"
        fontFamily="'Plus Jakarta Sans', Arial, sans-serif"
        letterSpacing="1.8"
      >
        <textPath href="#tutWuriTextPath" startOffset="50%" textAnchor="middle">
          TUT WURI HANDAYANI
        </textPath>
      </text>

      {/* Open Book at Bottom (Buku Terbuka Putih) */}
      <g stroke="#111827" strokeWidth="2.8" strokeLinejoin="round">
        {/* Book pages */}
        <path
          d="M 64,152 Q 100,140 100,154 Q 100,140 136,152 L 138,162 Q 100,150 100,166 Q 100,150 62,162 Z"
          fill="#FFFFFF"
        />
        {/* Spine line */}
        <line x1="100" y1="154" x2="100" y2="166" />
      </g>

      {/* Belencong Flame (Lidah Api Kuning Keemasan Menyala) */}
      <path
        d="M 100,100 C 92,112 90,126 95,138 C 98,144 100,147 100,147 C 100,147 102,144 105,138 C 110,126 108,112 100,100 Z"
        fill="#FFB703"
        stroke="#E67E22"
        strokeWidth="1.8"
      />
      {/* Inner flame heart */}
      <path
        d="M 100,110 C 96,118 95,127 98,136 C 100,140 100,142 100,142 C 100,142 100,140 102,136 C 105,127 104,118 100,110 Z"
        fill="#FB8500"
      />

      {/* Garuda Wings (Sayap Burung Putih Kiri & Kanan) */}
      <g fill="#FFFFFF" stroke="#111827" strokeWidth="2.8" strokeLinejoin="round">
        {/* Left Wing with feather arches */}
        <path d="M 100,146 C 88,142 74,136 60,140 C 44,144 32,130 36,112 C 38,102 44,95 50,91 C 46,98 47,108 55,114 C 58,116 63,116 68,114 C 66,104 69,94 77,88 C 76,96 79,104 87,108 C 89,103 91,88 88,72 C 92,79 93,89 96,98 C 97,94 97,70 100,60" />
        
        {/* Right Wing with feather arches */}
        <path d="M 100,146 C 112,142 126,136 140,140 C 156,144 168,130 164,112 C 162,102 156,95 150,91 C 154,98 153,108 145,114 C 142,116 137,116 132,114 C 134,104 131,94 123,88 C 124,96 121,104 113,108 C 111,103 109,88 112,72 C 108,79 107,89 104,98 C 103,94 103,70 100,60" />

        {/* Central Crown / Belencong Lamp Vessel */}
        <path d="M 92,62 L 108,62 L 105,82 L 95,82 Z" />
        <path d="M 94,82 Q 100,85 106,82 L 104,98 Q 100,102 96,98 Z" />
      </g>

      {/* Decorative Base Pedestal */}
      <path
        d="M 94,146 L 106,146 L 104,152 L 96,152 Z"
        fill="#FFFFFF"
        stroke="#111827"
        strokeWidth="2"
      />
    </svg>
  );
};
