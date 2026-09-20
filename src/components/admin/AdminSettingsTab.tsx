import React, { useState } from 'react';
import { 
  Sliders, 
  Image as ImageIcon, 
  Smartphone, 
  Globe, 
  Check, 
  RotateCcw, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Info,
  Copy,
  CheckCheck
} from 'lucide-react';
import { SiteContent, SiteBranding } from '../../types/siteContent';

interface AdminSettingsTabProps {
  draft: SiteContent;
  onChange: (updater: (prev: SiteContent) => SiteContent) => void;
  onSave: () => void;
  isSaving: boolean;
}

const DEFAULT_WEB_LOGO = 'https://lacasadeldisfraz.mx/images/logo-horizontal-web_one.png';
const DEFAULT_PWA_ICON = '/pwa-512x512.png';

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({
  draft,
  onChange,
  onSave,
  isSaving
}) => {
  const branding = draft.branding || {
    webLogoUrl: DEFAULT_WEB_LOGO,
    webLogoFooterUrl: 'https://lacasadeldisfraz.mx/images/2024/04/12/logo-blanco-2024.png',
    pwaIconUrl: DEFAULT_PWA_ICON,
    pwaAppName: 'La Casa del Disfraz',
    pwaShortName: 'LaCasaDisfraz'
  };

  const [copiedLink, setCopiedLink] = useState(false);
  const [logoTestError, setLogoTestError] = useState(false);
  const [pwaTestError, setPwaTestError] = useState(false);

  const updateBrandingField = (field: keyof SiteBranding, value: string) => {
    onChange((prev) => ({
      ...prev,
      branding: {
        webLogoUrl: DEFAULT_WEB_LOGO,
        pwaIconUrl: DEFAULT_PWA_ICON,
        pwaAppName: 'La Casa del Disfraz',
        pwaShortName: 'LaCasaDisfraz',
        ...(prev.branding || {}),
        [field]: value
      }
    }));
  };

  const copyGastosUrl = () => {
    const fullUrl = `${window.location.origin}/registrogastos`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-fuchsia-900 to-rose-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
            <Sliders className="w-3.5 h-3.5" />
            <span>Configuración General & Logotipos PWA</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-fun font-bold text-white">
            Ajustes de Marca, Web y Aplicación PWA
          </h2>
          <p className="text-xs sm:text-sm text-fuchsia-100 leading-relaxed">
            Personaliza el logotipo visible en el sitio web (cabecera y pie de página) y el icono oficial que se instalará en los celulares y computadoras a través de la Progressive Web App (PWA).
          </p>
        </div>
      </div>

      {/* 1. Logotipo para el Sitio Web */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-fuchsia-100 text-fuchsia-700">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                1. Logotipo para la Web (Cabecera y Navegación)
              </h3>
            </div>
            <p className="text-xs text-slate-500 pl-9">
              Esta imagen se muestra en la cabecera principal pública de todas las páginas del sitio.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              updateBrandingField('webLogoUrl', DEFAULT_WEB_LOGO);
              setLogoTestError(false);
            }}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-fuchsia-700 hover:bg-fuchsia-50 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Restaurar logotipo por defecto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Oficial</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Input */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                URL del Logotipo Web (PNG, SVG o WebP):
              </label>
              <input
                type="url"
                value={branding.webLogoUrl || ''}
                onChange={(e) => {
                  updateBrandingField('webLogoUrl', e.target.value);
                  setLogoTestError(false);
                }}
                placeholder="https://ejemplo.com/mi-logotipo.png"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Recomendación: Formato horizontal con fondo transparente (altura recomendada: 80px a 160px).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                URL del Logotipo Blanco para Footer (Opcional):
              </label>
              <input
                type="url"
                value={branding.webLogoFooterUrl || ''}
                onChange={(e) => updateBrandingField('webLogoFooterUrl', e.target.value)}
                placeholder="https://ejemplo.com/mi-logotipo-blanco.png"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Si se deja en blanco o no está disponible, se adaptará el logotipo principal.
              </p>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="lg:col-span-5 space-y-3">
            <span className="block text-xs font-bold text-slate-700">
              Vista previa en tiempo real:
            </span>

            {/* Light Background Preview */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center min-h-[90px] shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                Fondo Claro (Cabecera)
              </span>
              {branding.webLogoUrl && !logoTestError ? (
                <img
                  src={branding.webLogoUrl}
                  alt="Vista previa logo web"
                  className="max-h-12 w-auto object-contain"
                  onError={() => setLogoTestError(true)}
                />
              ) : (
                <div className="text-center text-rose-500 text-xs py-2 font-medium">
                  {logoTestError ? '⚠️ No se pudo cargar la imagen desde esa URL' : 'Sin imagen definida'}
                </div>
              )}
            </div>

            {/* Dark Background Preview (Footer) */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center min-h-[90px]">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                Fondo Oscuro (Pie de página)
              </span>
              {(branding.webLogoFooterUrl || branding.webLogoUrl) && !logoTestError ? (
                <img
                  src={branding.webLogoFooterUrl || branding.webLogoUrl}
                  alt="Vista previa logo footer"
                  className="max-h-10 w-auto object-contain"
                />
              ) : (
                <span className="text-xs text-slate-600">Sin logotipo para fondo oscuro</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Logotipo e Icono para la versión PWA */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                2. Logotipo e Icono para la Versión PWA (Instalación Móvil)
              </h3>
            </div>
            <p className="text-xs text-slate-500 pl-9">
              Este icono se guardará en la pantalla de inicio de los teléfonos de los usuarios al instalar la aplicación.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              updateBrandingField('pwaIconUrl', DEFAULT_PWA_ICON);
              setPwaTestError(false);
            }}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Restaurar icono oficial PWA"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Icono PWA</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Inputs */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                URL del Icono PWA (512x512 PNG o SVG cuadrado recomendado):
              </label>
              <input
                type="url"
                value={branding.pwaIconUrl || ''}
                onChange={(e) => {
                  updateBrandingField('pwaIconUrl', e.target.value);
                  setPwaTestError(false);
                }}
                placeholder="https://ejemplo.com/icono-pwa-512.png o /pwa-512x512.png"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Los sistemas operativos Android e iOS requieren un formato cuadrado con márgenes limpios para recortar en círculos y esquinas redondeadas.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nombre Completo de la App:
                </label>
                <input
                  type="text"
                  value={branding.pwaAppName || 'La Casa del Disfraz'}
                  onChange={(e) => updateBrandingField('pwaAppName', e.target.value)}
                  placeholder="La Casa del Disfraz"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nombre Corto (Home Screen, máx. 12 letras):
                </label>
                <input
                  type="text"
                  maxLength={14}
                  value={branding.pwaShortName || 'LaCasaDisfraz'}
                  onChange={(e) => updateBrandingField('pwaShortName', e.target.value)}
                  placeholder="LaCasaDisfraz"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Device Mockup Previews */}
          <div className="lg:col-span-5 space-y-3">
            <span className="block text-xs font-bold text-slate-700">
              Simulación de Icono en Pantalla de Inicio:
            </span>

            <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-white space-y-4">
              <div className="flex items-center justify-around gap-4 pt-1">
                {/* 1. Android Adaptive Circle */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-fuchsia-950 p-1.5 shadow-lg border-2 border-white/20 flex items-center justify-center">
                    <img
                      src={branding.pwaIconUrl || DEFAULT_PWA_ICON}
                      alt="PWA Android"
                      className="w-full h-full object-cover rounded-full"
                      onError={() => setPwaTestError(true)}
                    />
                  </div>
                  <span className="text-[10px] text-slate-300 font-bold truncate max-w-[70px]">
                    {branding.pwaShortName || 'LCD'}
                  </span>
                  <span className="text-[9px] text-slate-500">Android</span>
                </div>

                {/* 2. iOS Squircle */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-purple-950 p-1 shadow-lg border border-white/30 flex items-center justify-center">
                    <img
                      src={branding.pwaIconUrl || DEFAULT_PWA_ICON}
                      alt="PWA iOS"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                  <span className="text-[10px] text-slate-300 font-bold truncate max-w-[70px]">
                    {branding.pwaShortName || 'LCD'}
                  </span>
                  <span className="text-[9px] text-slate-500">iPhone/iPad</span>
                </div>

                {/* 3. Gastos LCD Dedicated Icon */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-rose-950 p-1 shadow-lg border border-amber-400/50 flex items-center justify-center relative">
                    <img
                      src={branding.pwaIconUrl || DEFAULT_PWA_ICON}
                      alt="PWA Gastos"
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <div className="absolute bottom-0 right-0 bg-amber-400 text-purple-950 text-[8px] font-black px-1 rounded-tl-md">
                      $$
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-300 font-bold truncate max-w-[70px]">
                    Gastos LCD
                  </span>
                  <span className="text-[9px] text-amber-400/80">/registrogastos</span>
                </div>
              </div>

              {pwaTestError && (
                <p className="text-center text-rose-400 text-[11px]">
                  ⚠️ La URL del icono no se pudo cargar. Se usará el icono oficial de respaldo.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Instalación PWA Directa a /registrogastos */}
      <div className="bg-gradient-to-br from-slate-900 to-purple-950 rounded-3xl p-6 sm:p-7 text-white border border-purple-900/50 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-800/60 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Instalación Dirigida y Acceso Rápido</span>
            </div>
            <h3 className="text-base font-bold text-white">
              3. Instalación PWA para Registro de Gastos (/registrogastos)
            </h3>
            <p className="text-xs text-purple-200">
              Configuración para que el personal o tú instalen la app directamente en su teléfono apuntando a la ruta de gastos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyGastosUrl}
              className="px-3.5 py-2 rounded-xl bg-purple-800/80 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar URL'}</span>
            </button>

            <a
              href="/registrogastos"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-purple-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir /registrogastos</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="font-bold text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>¿Cómo funciona la instalación directa?</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Al ingresar a <strong>/registrogastos</strong>, el sistema activa automáticamente el archivo de manifiesto <code>manifest-gastos.json</code> configurado con <code>start_url: "/registrogastos"</code>.
            </p>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Al pulsar <strong>"Instalar App PWA"</strong> en esa pantalla, la app se agrega al teléfono con el nombre <strong>"Gastos LCD"</strong> y se abre directamente en el formulario de gastos, sin pasar por la página pública.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="font-bold text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Compatibilidad y Modo Autónomo</span>
            </div>
            <ul className="text-slate-300 space-y-1 text-[11px] list-disc list-inside">
              <li>Funciona en Android (Google Chrome, Brave, Samsung Internet).</li>
              <li>Funciona en iOS (Safari &gt; Compartir &gt; Agregar al inicio).</li>
              <li>Funciona en Computadoras (Chrome / Edge &gt; Instalar aplicación).</li>
              <li>Soporta modo offline con Service Worker registrado.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Floating Save Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          <span>{isSaving ? 'Guardando en Firebase...' : 'Guardar Ajustes y Logotipos'}</span>
        </button>
      </div>
    </div>
  );
};
