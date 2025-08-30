import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useGTM } from '@/hooks/useGTM';

interface GTMProviderProps {
  children: React.ReactNode;
}

const GTMProvider = ({ children }: GTMProviderProps) => {
  const location = useLocation();
  const { trackPageView } = useGTM({
    gtmId: 'GTM-WFC39G5J'
  });

  // Track page views on route changes
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location, trackPageView]);

  return <>{children}</>;
};

export default GTMProvider;