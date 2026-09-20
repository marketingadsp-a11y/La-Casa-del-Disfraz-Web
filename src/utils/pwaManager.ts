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

  const isGastosRoute = route === '/registrogastos';
  const customIcon = branding?.pwaIconUrl?.trim();
  const baseIcon = customIcon || '/pwa-512x512.png';

  // Revoke previous blob if any
  if (currentBlobUrl) {
    try {
      URL.revokeObjectURL(currentBlobUrl);
    } catch {
      // ignore
    }
    currentBlobUrl = null;
  }

  const manifestData = {
    id: isGastosRoute ? '/registrogastos' : '/',
    name: isGastosRoute
      ? 'Registro de Gastos - La Casa del Disfraz'
      : (branding?.pwaAppName || 'La Casa del Disfraz'),
    short_name: isGastosRoute
      ? 'Gastos LCD'
      : (branding?.pwaShortName || 'LaCasaDisfraz'),
    description: isGastosRoute
      ? 'App de registro rápido de gastos y egresos diarios para La Casa del Disfraz.'
      : 'Renta y venta de disfraces en Ciudad Guzmán, Jalisco.',
    start_url: isGastosRoute ? '/registrogastos' : '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    theme_color: '#701a75',
    background_color: '#ffffff',
    icons: [
      {
        src: customIcon || '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: customIcon || '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: customIcon || '/pwa-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  };

  try {
    const stringified = JSON.stringify(manifestData, null, 2);
    const blob = new Blob([stringified], { type: 'application/manifest+json' });
    currentBlobUrl = URL.createObjectURL(blob);

    let manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = currentBlobUrl;

    // Also update apple-touch-icon
    let appleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = baseIcon;

    // Update favicon
    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (favicon && customIcon) {
      favicon.href = customIcon;
    }
  } catch (e) {
    console.warn('Error dynamically updating manifest:', e);
  }
}
