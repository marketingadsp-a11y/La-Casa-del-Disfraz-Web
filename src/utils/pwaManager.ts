import { SiteBranding } from '../types/siteContent';

let currentBlobUrl: string | null = null;

/**
 * Registers the Service Worker for offline capability and PWA installability
 */
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // SW registered
        })
        .catch((err) => {
          console.warn('SW registration warning:', err);
        });
    });
  }
}

/**
 * Dynamically configures the active Web App Manifest based on route and custom branding
 */
export function updatePWAManifestForRoute(
  route: string,
  branding?: SiteBranding
) {
  if (typeof document === 'undefined') return;

  const isGastosRoute = route === '/registrogastos' || route.startsWith('/registrogastos');
  const customIcon = branding?.pwaIconUrl?.trim();
  const baseIcon = customIcon || '/pwa-512x512.png';

  try {
    let manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.id = 'app-manifest';
      document.head.appendChild(manifestLink);
    }
    
    // IMPORTANT: Chromium requires valid http(s) URL for manifest install prompts
    const targetManifest = isGastosRoute ? '/manifest-gastos.json' : '/manifest.json';
    if (manifestLink.getAttribute('href') !== targetManifest) {
      manifestLink.setAttribute('href', targetManifest);
    }

    // Update apple-touch-icon
    let appleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = baseIcon;

    // Update apple web app title
    let appleTitle = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]');
    if (appleTitle) {
      appleTitle.content = isGastosRoute ? 'Gastos LCD' : (branding?.pwaShortName || 'LaCasaDisfraz');
    }

    // Update favicon
    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (favicon && customIcon) {
      favicon.href = customIcon;
    }
  } catch (e) {
    console.warn('Error dynamically updating manifest:', e);
  }
}
