'use client'
import React from 'react'

export function LogoBadge({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Golden sun glow */}
      <circle cx="40" cy="18" r="14" fill="#DFA82A" />
      <circle cx="40" cy="16" r="8" fill="#F0C040" opacity="0.7" />

      {/* Mountain peaks */}
      <polygon points="2,62 21,25 40,62"  fill="#D8DDD0" />
      <polygon points="24,62 42,16 60,62" fill="#E8EAE2" />
      <polygon points="44,62 62,28 78,62" fill="#D0D5C8" />

      {/* Snow caps */}
      <polygon points="35,30 42,16 49,30" fill="white" opacity="0.7" />

      {/* Left tree */}
      <g fill="#2D3A1F">
        <polygon points="13,62 20,49 27,62" />
        <polygon points="14.5,57 20,45 25.5,57" />
        <polygon points="16,51 20,41 24,51" />
        <rect x="18.5" y="62" width="3" height="3" />
      </g>

      {/* Centre tree — tallest */}
      <g fill="#1A2810">
        <polygon points="32,62 40,44 48,62" />
        <polygon points="33.5,56 40,40 46.5,56" />
        <polygon points="35,49 40,35 45,49" />
        <polygon points="36.5,42 40,28 43.5,42" />
        <rect x="38.5" y="62" width="3" height="3" />
      </g>

      {/* Right tree */}
      <g fill="#2D3A1F">
        <polygon points="53,62 60,49 67,62" />
        <polygon points="54.5,57 60,45 65.5,57" />
        <polygon points="56,51 60,41 64,51" />
        <rect x="58.5" y="62" width="3" height="3" />
      </g>

      {/* Birds */}
      <g stroke="#1A2810" strokeWidth="1.4" fill="none" strokeLinecap="round">
        <path d="M18,14 Q20.5,11.5 23,14" />
        <path d="M29,8  Q32.5,5.5 36,8" />
        <path d="M46,8  Q49.5,5.5 53,8" />
        <path d="M59,13 Q61.5,10.5 64,13" />
      </g>
    </svg>
  )
}

