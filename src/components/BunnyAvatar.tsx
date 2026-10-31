import React from 'react';
import { BunnySkinId, BunnyHatId } from '../types/game';
import { BUNNY_SKINS } from '../utils/constants';

interface BunnyAvatarProps {
  skinId: BunnySkinId;
  hatId?: BunnyHatId;
  size?: number;
  animate?: boolean;
  className?: string;
  mood?: 'happy' | 'excited' | 'sleepy' | 'chewing';
}

export const BunnyAvatar: React.FC<BunnyAvatarProps> = ({
  skinId,
  hatId = 'none',
  size = 120,
  animate = true,
  className = '',
  mood = 'happy'
}) => {
  const skin = BUNNY_SKINS.find(s => s.id === skinId) || BUNNY_SKINS[0];
  const { fur, belly, innerEar, nose, eyes, cheeks } = skin.colors;
  const isBambi = skinId === 'bambi';
  const edgeStroke = isBambi ? '#383840' : undefined;
  const edgeWidth = isBambi ? 1 : 0;
  const detailStroke = isBambi ? '#a1a1aa' : eyes;
  const whiskerOpacity = isBambi ? 0.65 : 0.35;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 140 150"
        className={`w-full h-full overflow-visible ${animate ? 'hover:scale-105 transition-transform' : ''}`}
      >
        <defs>
          <filter id="soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Tail */}
        <circle cx="34" cy="115" r="14" fill={fur} stroke={edgeStroke} strokeWidth={edgeWidth} filter="url(#soft-shadow)" />
        <circle cx="32" cy="113" r="11" fill={belly} />

        {/* Back feet */}
        <ellipse cx="44" cy="132" rx="14" ry="9" fill={fur} stroke={edgeStroke} strokeWidth={edgeWidth} />
        <ellipse cx="96" cy="132" rx="14" ry="9" fill={fur} stroke={edgeStroke} strokeWidth={edgeWidth} />
        {/* Foot pads */}
        <ellipse cx="44" cy="134" rx="7" ry="5" fill={innerEar} opacity="0.6" />
        <ellipse cx="96" cy="134" rx="7" ry="5" fill={innerEar} opacity="0.6" />

        {/* Ears */}
        {/* Left Ear */}
        <g className={animate ? 'origin-bottom animate-pulse' : ''} style={{ transformOrigin: '50px 58px' }}>
          <ellipse
            cx="48"
            cy="32"
            rx="11"
            ry="28"
            transform="rotate(-10 48 32)"
            fill={fur}
            stroke={edgeStroke}
            strokeWidth={edgeWidth}
            filter="url(#soft-shadow)"
          />
          <ellipse
            cx="48"
            cy="33"
            rx="6"
            ry="22"
            transform="rotate(-10 48 33)"
            fill={innerEar}
          />
        </g>

        {/* Right Ear */}
        <g className={animate ? 'origin-bottom animate-pulse' : ''} style={{ transformOrigin: '90px 58px', animationDelay: '0.2s' }}>
          <ellipse
            cx="92"
            cy="32"
            rx="11"
            ry="28"
            transform="rotate(10 92 32)"
            fill={fur}
            stroke={edgeStroke}
            strokeWidth={edgeWidth}
            filter="url(#soft-shadow)"
          />
          <ellipse
            cx="92"
            cy="33"
            rx="6"
            ry="22"
            transform="rotate(10 92 33)"
            fill={innerEar}
          />
        </g>

        {/* Body */}
        <ellipse cx="70" cy="106" rx="36" ry="30" fill={fur} stroke={edgeStroke} strokeWidth={edgeWidth} filter="url(#soft-shadow)" />
        {/* Fluffy Belly */}
        <ellipse cx="70" cy="110" rx="24" ry="20" fill={belly} />

        {/* Head */}
        <circle cx="70" cy="68" r="32" fill={fur} stroke={edgeStroke} strokeWidth={edgeWidth} filter="url(#soft-shadow)" />

        {/* Cheeks */}
        <ellipse cx="48" cy="74" rx="8" ry="6" fill={cheeks} opacity="0.75" />
        <ellipse cx="92" cy="74" rx="8" ry="6" fill={cheeks} opacity="0.75" />

        {/* Eyes */}
        {mood === 'sleepy' ? (
          <>
            <path d="M 52 66 Q 57 70 62 66" stroke={detailStroke} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 78 66 Q 83 70 88 66" stroke={detailStroke} strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        ) : mood === 'excited' ? (
          <>
            <path d="M 50 67 Q 56 61 62 67" stroke={detailStroke} strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M 78 67 Q 84 61 90 67" stroke={detailStroke} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* Left Eye */}
            {isBambi && <circle cx="56" cy="64" r="6.8" fill="#3f3f46" />}
            <circle cx="56" cy="64" r="5.5" fill={isBambi ? '#09090b' : eyes} />
            <circle cx="54" cy="62" r="2" fill="#FFFFFF" />
            <circle cx="58" cy="66" r="0.9" fill="#FFFFFF" />

            {/* Right Eye */}
            {isBambi && <circle cx="84" cy="64" r="6.8" fill="#3f3f46" />}
            <circle cx="84" cy="64" r="5.5" fill={isBambi ? '#09090b' : eyes} />
            <circle cx="82" cy="62" r="2" fill="#FFFFFF" />
            <circle cx="86" cy="66" r="0.9" fill="#FFFFFF" />
          </>
        )}

        {/* Nose & Mouth */}
        <path
          d="M 67 73 C 67 71 73 71 73 73 C 73 75.5 70 77 70 77 C 70 77 67 75.5 67 73 Z"
          fill={nose}
        />
        {mood === 'chewing' ? (
          <ellipse cx="70" cy="80" rx="3.5" ry="2" fill="#B91C1C" />
        ) : (
          <path
            d="M 66 78 Q 70 82 74 78"
            stroke={detailStroke}
            strokeWidth="1.7"
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Whiskers */}
        <path d="M 44 74 L 30 72 M 44 77 L 28 78" stroke={detailStroke} strokeWidth="1.2" opacity={whiskerOpacity} strokeLinecap="round" />
        <path d="M 96 74 L 110 72 M 96 77 L 112 78" stroke={detailStroke} strokeWidth="1.2" opacity={whiskerOpacity} strokeLinecap="round" />

        {/* Front Paws */}
        <ellipse cx="58" cy="108" rx="8" ry="6" fill={fur} stroke={edgeStroke} strokeWidth={edgeWidth} />
        <ellipse cx="82" cy="108" rx="8" ry="6" fill={fur} stroke={edgeStroke} strokeWidth={edgeWidth} />

        {/* Hats & Accessories Layer */}
        {hatId === 'straw_hat' && (
          <g transform="translate(70, 36)">
            {/* Brim */}
            <ellipse cx="0" cy="6" rx="34" ry="8" fill="#FDE047" stroke="#CA8A04" strokeWidth="1.5" />
            {/* Crown */}
            <path d="M -18 6 C -18 -8 18 -8 18 6 Z" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" />
            {/* Ribbon */}
            <path d="M -18 4 Q 0 8 18 4" stroke="#DC2626" strokeWidth="3" fill="none" />
          </g>
        )}

        {hatId === 'flower_pin' && (
          <g transform="translate(86, 38)">
            {[0, 60, 120, 180, 240, 300].map(deg => (
              <ellipse
                key={deg}
                cx="0"
                cy="7"
                rx="4"
                ry="7"
                transform={`rotate(${deg} 0 0)`}
                fill="#FFFFFF"
                stroke="#E2E8F0"
                strokeWidth="0.8"
              />
            ))}
            <circle cx="0" cy="0" r="4.5" fill="#FACC15" />
          </g>
        )}

        {hatId === 'pink_bow' && (
          <g transform="translate(88, 38)">
            <polygon points="0,0 -12,-8 -12,8" fill="#F43F5E" />
            <polygon points="0,0 12,-8 12,8" fill="#F43F5E" />
            <circle cx="0" cy="0" r="4" fill="#FB7185" />
          </g>
        )}

        {hatId === 'sunglasses' && (
          <g transform="translate(70, 64)">
            {/* Bridge */}
            <line x1="-10" y1="0" x2="10" y2="0" stroke="#18181B" strokeWidth="2.5" />
            {/* Lenses */}
            <rect x="-24" y="-5" width="18" height="12" rx="3" fill="#18181B" />
            <rect x="6" y="-5" width="18" height="12" rx="3" fill="#18181B" />
            {/* Lens Glare */}
            <line x1="-20" y1="-2" x2="-14" y2="4" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="10" y1="-2" x2="16" y2="4" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        )}

        {hatId === 'magic_tophat' && (
          <g transform="translate(70, 36)">
            {/* Brim */}
            <ellipse cx="0" cy="6" rx="28" ry="7" fill="#18181B" />
            {/* Top Cylinder */}
            <path d="M -15 6 L -17 -22 L 17 -22 L 15 6 Z" fill="#27272A" />
            <ellipse cx="0" cy="-22" rx="17" ry="4" fill="#3F3F46" />
            {/* Purple Ribbon */}
            <path d="M -15.5 2 Q 0 5 15.5 2" stroke="#9333EA" strokeWidth="3.5" fill="none" />
            {/* Gold Buckle */}
            <rect x="-3" y="1" width="6" height="5" rx="1" fill="#FBBF24" />
          </g>
        )}

        {hatId === 'royal_crown' && (
          <g transform="translate(70, 36)">
            <path
              d="M -18 4 L -20 -14 L -9 -6 L 0 -18 L 9 -6 L 20 -14 L 18 4 Z"
              fill="#EAB308"
              stroke="#CA8A04"
              strokeWidth="1.5"
            />
            {/* Jewels */}
            <circle cx="0" cy="-2" r="2.5" fill="#EF4444" />
            <circle cx="-11" cy="0" r="2" fill="#3B82F6" />
            <circle cx="11" cy="0" r="2" fill="#10B981" />
          </g>
        )}

        {hatId === 'chef_hat' && (
          <g transform="translate(70, 34)">
            <rect x="-14" y="0" width="28" height="7" rx="1.5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
            <circle cx="-12" cy="-6" r="9" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
            <circle cx="0" cy="-12" r="11" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
            <circle cx="12" cy="-6" r="9" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
          </g>
        )}

        {hatId === 'party_hat' && (
          <g transform="translate(70, 35)">
            <polygon points="0,-24 -14,6 14,6" fill="#F97316" />
            <line x1="-10" y1="-2" x2="6" y2="4" stroke="#3B82F6" strokeWidth="3" />
            <line x1="-4" y1="-12" x2="10" y2="-4" stroke="#EAB308" strokeWidth="3" />
            <circle cx="0" cy="-24" r="4" fill="#F43F5E" />
          </g>
        )}

        {hatId === 'cozy_scarf' && (
          <g transform="translate(70, 96)">
            {/* Wrap */}
            <ellipse cx="0" cy="0" rx="26" ry="8" fill="#DC2626" />
            {/* Hanging tails */}
            <path d="M 8 4 L 14 26 L 22 24 L 16 2 Z" fill="#B91C1C" />
            {/* Stripes */}
            <line x1="-16" y1="-1" x2="-14" y2="3" stroke="#FEE2E2" strokeWidth="2" />
            <line x1="0" y1="-2" x2="2" y2="4" stroke="#FEE2E2" strokeWidth="2" />
            <line x1="10" y1="12" x2="20" y2="10" stroke="#FEE2E2" strokeWidth="2" />
          </g>
        )}
      </svg>
    </div>
  );
};
