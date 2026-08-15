import React from 'react';

interface HospitalLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'emerald';
  showSubtext?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  className?: string;
  iconOnly?: boolean;
}

export const HospitalLogo: React.FC<HospitalLogoProps> = ({
  size = 'md',
  variant = 'dark',
  showSubtext = true,
  showBadge = false,
  badgeText = '24/7 CARE',
  className = '',
  iconOnly = false,
}) => {
  // Dimensions based on size
  const iconDimensions = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-13 h-13',
    xl: 'w-16 h-16',
  }[size];

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  }[size];

  const subtextSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-sm',
  }[size];

  const isLight = variant === 'light';

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Emblem Icon */}
      <div className="relative shrink-0">
        {/* Glowing backdrop halo */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-emerald-500/30 via-teal-400/20 to-emerald-600/30 blur-xs transition-all" />

        {/* Outer Icon Shield Container */}
        <div
          className={`${iconDimensions} relative rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-0.5 shadow-md shadow-emerald-900/15 flex items-center justify-center`}
        >
          {/* Inner Glossy Glass & Medical Cross Vector */}
          <div className="w-full h-full rounded-[10px] bg-gradient-to-b from-emerald-500/20 to-transparent flex items-center justify-center relative overflow-hidden">
            {/* Ambient specular highlight */}
            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-t-[10px]" />

            {/* Custom SVG Medical Cross & ECG Pulse Line */}
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-4/5 h-4/5 text-white drop-shadow-sm"
            >
              {/* Medical Cross Background Shape */}
              <path
                d="M19 6C19 4.89543 19.8954 4 21 4H27C28.1046 4 29 4.89543 29 6V19H42C43.1046 19 44 19.8954 44 21V27C44 28.1046 43.1046 29 42 29H29V42C29 43.1046 28.1046 44 27 44H21C19.8954 44 19 43.1046 19 42V29H6C4.89543 29 4 28.1046 4 21V27C4 19.8954 4.89543 19 6 19H19V6Z"
                fill="currentColor"
                fillOpacity="0.18"
              />
              {/* Solid Inner Cross */}
              <rect x="20" y="7" width="8" height="34" rx="3" fill="white" />
              <rect x="7" y="20" width="34" height="8" rx="3" fill="white" />

              {/* Dynamic ECG Heartbeat Line Overlay */}
              <path
                d="M9 24H16L19 16L23 32L27 20L29 26L32 24H39"
                stroke="#047857"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Sparkle Node */}
              <circle cx="23" cy="32" r="1.5" fill="#10B981" />
              <circle cx="19" cy="16" r="1.5" fill="#34D399" />
            </svg>
          </div>
        </div>

        {/* Small Active Status Indicator dot */}
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full shadow-xs" />
      </div>

      {/* Typography & Subtitles */}
      {!iconOnly && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`${titleSizes} font-black tracking-tight leading-none ${
                isLight ? 'text-white' : 'text-slate-900'
              }`}
            >
              GARASBALEY <span className={isLight ? 'text-emerald-300' : 'text-emerald-600'}>HOSPITAL</span>
            </span>

            {showBadge && (
              <span
                className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  isLight
                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {badgeText}
              </span>
            )}
          </div>

          {showSubtext && (
            <p
              className={`${subtextSizes} font-semibold leading-tight mt-0.5 flex items-center gap-1.5 ${
                isLight ? 'text-emerald-100/90' : 'text-slate-500'
              }`}
            >
              <span className="truncate">Emergency & Specialized Medical Center</span>
              <span className="opacity-40">•</span>
              <span className={isLight ? 'text-teal-200' : 'text-emerald-700 font-bold'}>GB-EMR</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};
