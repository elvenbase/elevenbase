import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { useAvatarColor } from '@/hooks/useAvatarColor';

interface PlayerAvatarProps {
  // Player info
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  
  // Avatar styling
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  // Event handlers
  onClick?: () => void;
  
  // Override styles if needed
  style?: React.CSSProperties;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10', 
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
};

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  firstName,
  lastName,
  avatarUrl,
  className = '',
  size = 'lg',
  onClick,
  style
}) => {
  const { getAvatarBackground, getAvatarFallbackStyle } = useAvatarColor();
  
  const fullName = firstName + lastName;
  const hasAvatar = !!avatarUrl;
  const initials = firstName.charAt(0) + lastName.charAt(0);
  
  // Combina le classi di dimensione con quelle personalizzate
  const avatarClasses = `${sizeClasses[size]} ${className}`.trim();
  
  // Logica per lo style del componente Avatar
  const avatarStyle = hasAvatar 
    ? { ...getAvatarBackground(fullName, hasAvatar), ...style }
    : style;

  return (
    <Avatar 
      className={avatarClasses}
      onClick={onClick}
      style={avatarStyle}
    >
      <AvatarImage 
        src={avatarUrl || undefined} 
        alt={`${firstName} ${lastName}`} 
      />
      <AvatarFallback 
        className="text-white font-bold"
        style={getAvatarFallbackStyle(fullName, hasAvatar)}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};