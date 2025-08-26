import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { useAvatarColor } from '@/hooks/useAvatarColor';

interface PlayerAvatarProps {
  // Player info
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  entityId?: string;
  
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
  entityId,
  className = '',
  size = 'lg',
  onClick,
  style
}) => {
  const { getAvatarBackground, getAvatarFallbackStyle, defaultAvatarImageUrl } = useAvatarColor();
  
  const safeFirst = firstName || '';
  const safeLast = lastName || '';
  // Chiave stabile per il colore: entityId se presente
  const fullName = entityId ? `${entityId}:${safeFirst}${safeLast}` : ((style && (style as any).__id) ? `${(style as any).__id}:${safeFirst}${safeLast}` : (safeFirst + safeLast));

  // Se player non ha avatar, usa sempre l'Avatar Persona di default (se presente)
  const resolvedAvatarUrl = avatarUrl || defaultAvatarImageUrl || undefined;
  const hasAvatar = !!resolvedAvatarUrl;
  const initials = (safeFirst.charAt(0) || '?') + (safeLast.charAt(0) || '');
  
  // Combina le classi di dimensione con quelle personalizzate
  const avatarClasses = `${sizeClasses[size]} ${className}`.trim();
  
  // Background: sempre applicare Avatar Background (colore o immagine)
  const avatarStyle = { ...getAvatarBackground(fullName, hasAvatar), ...style };

  return (
    <Avatar 
      className={avatarClasses}
      onClick={onClick}
      style={avatarStyle}
    >
      {hasAvatar && (
        <AvatarImage 
          src={resolvedAvatarUrl} 
          alt={`${safeFirst} ${safeLast}`} 
        />
      )}
      <AvatarFallback 
        className="font-bold"
        style={getAvatarFallbackStyle(fullName, hasAvatar)}
      >
        {!hasAvatar ? initials : ''}
      </AvatarFallback>
    </Avatar>
  );
};