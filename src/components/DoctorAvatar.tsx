import React, { useState } from 'react';
import { Stethoscope, User } from 'lucide-react';

interface DoctorAvatarProps {
  src?: string;
  name: string;
  specialty?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showBadge?: boolean;
}

export const DoctorAvatar: React.FC<DoctorAvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
  showBadge = false,
}) => {
  const [imageError, setImageError] = useState(false);

  // Extract initials
  const initials = name
    .replace(/^Dr\.\s+/i, '')
    .replace(/^Sister\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'MD';

  const sizeClasses = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-20 h-20 text-lg',
    '2xl': 'w-24 h-24 text-xl',
  };

  const badgeSize = {
    xs: 'w-2 h-2 ring-1',
    sm: 'w-2.5 h-2.5 ring-1.5',
    md: 'w-3.5 h-3.5 ring-2',
    lg: 'w-4 h-4 ring-2',
    xl: 'w-5 h-5 ring-2',
    '2xl': 'w-6 h-6 ring-2',
  };

  const hasValidPhoto = Boolean(src && !imageError);

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-2xl overflow-hidden flex items-center justify-center bg-gradient-to-tr from-emerald-700 via-teal-600 to-emerald-500 text-white font-black shadow-xs ring-2 ring-white/80 border border-emerald-200/60`}
      >
        {hasValidPhoto ? (
          <img
            src={src}
            alt={name}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-700 to-teal-800 text-emerald-50 select-none">
            <span>{initials}</span>
          </div>
        )}
      </div>

      {showBadge && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 bg-emerald-500 rounded-full ring-white ${badgeSize[size]} shadow-xs`}
          title="Active Medical Staff"
        />
      )}
    </div>
  );
};
