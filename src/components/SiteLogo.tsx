import { useSiteAssets } from '@/hooks/useSiteAssets';

interface SiteLogoProps {
  className?: string;
  alt?: string;
  fallbackSrc?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

export const SiteLogo = ({ 
  className = "h-10 w-auto", 
  alt = "ElevenBase",
  fallbackSrc = "/assets/IMG_0055.png",
  onError
}: SiteLogoProps) => {
  const { logoUrl } = useSiteAssets();
  
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (onError) {
      onError(e);
    } else {
      // Fallback automatico al logo statico
      (e.currentTarget as HTMLImageElement).src = fallbackSrc;
    }
  };

  // Usa logo dinamico se disponibile, altrimenti fallback
  const logoSrc = logoUrl || fallbackSrc;

  return (
    <img
      src={logoSrc}
      alt={alt}
      className={className}
      onError={handleError}
      draggable={false}
    />
  );
};