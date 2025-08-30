import { useEffect } from 'react';
import TagManager from 'react-gtm-module';

interface GTMConfig {
  gtmId: string;
  dataLayer?: object;
  dataLayerName?: string;
  auth?: string;
  preview?: string;
}

export const useGTM = (config: GTMConfig) => {
  useEffect(() => {
    // Inizializza GTM
    TagManager.initialize({
      gtmId: config.gtmId,
      dataLayer: config.dataLayer,
      dataLayerName: config.dataLayerName || 'dataLayer',
      auth: config.auth,
      preview: config.preview
    });

    console.log('🎯 [GTM] Initialized with container:', config.gtmId);
  }, [config.gtmId]);

  // Funzioni helper per tracking
  const trackEvent = (event: string, parameters?: object) => {
    TagManager.dataLayer({
      dataLayer: {
        event,
        ...parameters
      }
    });
    console.log('🎯 [GTM] Event tracked:', event, parameters);
  };

  const trackPageView = (pagePath: string, pageTitle?: string) => {
    TagManager.dataLayer({
      dataLayer: {
        event: 'page_view',
        page_path: pagePath,
        page_title: pageTitle || document.title
      }
    });
    console.log('🎯 [GTM] Page view tracked:', pagePath);
  };

  return {
    trackEvent,
    trackPageView
  };
};