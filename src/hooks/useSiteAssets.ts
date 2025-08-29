import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteAssets {
  logoUrl: string | null;
  faviconUrl: string | null;
  loadingGifUrl: string | null;
  loading: boolean;
}

export const useSiteAssets = (): SiteAssets => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [loadingGifUrl, setLoadingGifUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSiteAssets = async () => {
      try {
        // Carica logo sito
        const { data: logoData } = await supabase
          .from('avatar_assets')
          .select('value')
          .is('created_by', null)
          .eq('name', 'site-logo')
          .eq('type', 'image')
          .maybeSingle();
        
        if (logoData?.value) {
          setLogoUrl(logoData.value);
        }

        // Carica favicon sito
        const { data: faviconData } = await supabase
          .from('avatar_assets')
          .select('value')
          .is('created_by', null)
          .eq('name', 'site-favicon')
          .eq('type', 'image')
          .maybeSingle();
        
        if (faviconData?.value) {
          setFaviconUrl(faviconData.value);
        }

        // Carica loading GIF sito
        const { data: loadingGifData } = await supabase
          .from('avatar_assets')
          .select('value')
          .is('created_by', null)
          .eq('name', 'site-loading-gif')
          .eq('type', 'image')
          .maybeSingle();
        
        if (loadingGifData?.value) {
          setLoadingGifUrl(loadingGifData.value);
        }
      } catch (error) {
        console.error('Error loading site assets:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSiteAssets();
  }, []);

  return {
    logoUrl,
    faviconUrl,
    loadingGifUrl,
    loading
  };
};