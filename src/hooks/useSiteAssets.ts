import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteAssets {
  logoUrl: string | null;
  favicon16Url: string | null;
  favicon32Url: string | null;
  appleTouchIconUrl: string | null;
  loadingGifUrl: string | null;
  loading: boolean;
}

export const useSiteAssets = (): SiteAssets => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [favicon16Url, setFavicon16Url] = useState<string | null>(null);
  const [favicon32Url, setFavicon32Url] = useState<string | null>(null);
  const [appleTouchIconUrl, setAppleTouchIconUrl] = useState<string | null>(null);
  const [loadingGifUrl, setLoadingGifUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSiteAssets = async () => {
      try {
        // Carica logo sito
        console.log('🎯 [LOGO DEBUG] Loading site logo...');
        const { data: logoData, error: logoError } = await supabase
          .from('avatar_assets')
          .select('value')
          .is('created_by', null)
          .eq('name', 'site-logo')
          .eq('type', 'image')
          .maybeSingle();
        
        console.log('🎯 [LOGO DEBUG] Logo query result:', { logoData, logoError });
        
        if (logoData?.value) {
          console.log('🎯 [LOGO DEBUG] Setting logo URL from database:', logoData.value);
          setLogoUrl(logoData.value);
        } else {
          // Fallback: prova a caricare direttamente da Storage
          console.log('🎯 [LOGO DEBUG] No logo in database, trying direct storage URL...');
          const storageUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/global/site-logo.png`;
          
          // Verifica se il file esiste su storage
          try {
            const response = await fetch(storageUrl, { method: 'HEAD' });
            if (response.ok) {
              console.log('🎯 [LOGO DEBUG] Found logo in storage, using direct URL:', storageUrl);
              setLogoUrl(storageUrl);
            } else {
              console.log('🎯 [LOGO DEBUG] No logo found in storage either, using fallback');
            }
          } catch (error) {
            console.log('🎯 [LOGO DEBUG] Error checking storage, using fallback:', error);
          }
        }

        // Carica favicon 16x16
        const { data: favicon16Data } = await supabase
          .from('avatar_assets')
          .select('value')
          .is('created_by', null)
          .eq('name', 'site-favicon-16x16')
          .eq('type', 'image')
          .maybeSingle();
        
        if (favicon16Data?.value) {
          setFavicon16Url(favicon16Data.value);
        }

        // Carica favicon 32x32
        const { data: favicon32Data } = await supabase
          .from('avatar_assets')
          .select('value')
          .is('created_by', null)
          .eq('name', 'site-favicon-32x32')
          .eq('type', 'image')
          .maybeSingle();
        
        if (favicon32Data?.value) {
          setFavicon32Url(favicon32Data.value);
        }

        // Carica Apple Touch Icon
        const { data: appleTouchData } = await supabase
          .from('avatar_assets')
          .select('value')
          .is('created_by', null)
          .eq('name', 'site-apple-touch-icon')
          .eq('type', 'image')
          .maybeSingle();
        
        if (appleTouchData?.value) {
          setAppleTouchIconUrl(appleTouchData.value);
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
    favicon16Url,
    favicon32Url,
    appleTouchIconUrl,
    loadingGifUrl,
    loading
  };
};