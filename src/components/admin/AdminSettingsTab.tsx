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
  CheckCheck,
  Key,
  Database,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { SiteContent, SiteBranding, LoyverseConfig } from '../../types/siteContent';
import { testLoyverseToken } from '../../utils/loyverseClient';

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

  const loyverse = draft.loyverse || {
    apiToken: '',
    storeId: '',
    autoSync: true,
    lastSyncTime: ''
  };

  const [copiedLink, setCopiedLink] = useState(false);
  const [logoTestError, setLogoTestError] = useState(false);
  const [pwaTestError, setPwaTestError] = useState(false);

  // Loyverse test status
  const [isTestingLoyverse, setIsTestingLoyverse] = useState(false);
  const [loyverseTestFeedback, setLoyverseTestFeedback] = useState<{
    status: 'success' | 'error';
    message: string;
  } | null>(null);

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

  const updateLoyverseField = (field: keyof LoyverseConfig, value: any) => {
    onChange((prev) => ({
      ...prev,
      loyverse: {
        apiToken: '',
        storeId: '',
        autoSync: true,
        lastSyncTime: '',
        ...(prev.loyverse || {}),
        [field]: value
      }
    }));
    if (field === 'apiToken') {
      setLoyverseTestFeedback(null);
    }
  };

  const handleTestLoyverse = async () => {
    if (!loyverse.apiToken?.trim()) {
      setLoyverseTestFeedback({
        status: 'error',
        message: 'Ingresa primero la Ficha de Acceso de Loyverse para probar la conexión.'
      });
      return;
    }

    setIsTestingLoyverse(true);
    setLoyverseTestFeedback(null);

    const result = await testLoyverseToken(loyverse.apiToken);
    setIsTestingLoyverse(false);
    setLoyverseTestFeedback({
      status: result.success ? 'success' : 'error',
      message: result.message
    });
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

      {/* 4. Conexión e Integración con Loyverse POS API */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                4. Integración Loyverse POS (Módulo de Ingresos)
              </h3>
            </div>
            <p className="text-xs text-slate-500 pl-9">
              Conecta tu cuenta de punto de venta Loyverse para sincronizar ventas, recibos e ingresos en tiempo real.
            </p>
          </div>

          <a
            href="https://developer.loyverse.com/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Documentación Loyverse</span>
          </a>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                Ficha de Acceso Personal (Access Token de Loyverse)
              </span>
              <a
                href="https://loyverse.com/help/developer/how-to-generate-an-access-token"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-fuchsia-600 hover:underline font-normal"
              >
                ¿Dónde obtener mi ficha de acceso?
              </a>
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={loyverse.apiToken}
                onChange={(e) => updateLoyverseField('apiToken', e.target.value)}
                placeholder="Ingresa tu Ficha de Acceso de Loyverse (ej. 1a2b3c4d...)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={handleTestLoyverse}
                disabled={isTestingLoyverse || !loyverse.apiToken.trim()}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingLoyverse ? 'animate-spin' : ''}`} />
                <span>{isTestingLoyverse ? 'Probando...' : 'Probar Ficha'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              En tu Back Office de Loyverse ve a <strong>Ajustes &gt; Fichas de acceso</strong> y genera un token con permisos de lectura.
            </p>
          </div>

          {loyverseTestFeedback && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
                loyverseTestFeedback.status === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {loyverseTestFeedback.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-bold block">
                  {loyverseTestFeedback.status === 'success' ? '¡Conexión Exitosa!' : 'Fallo en la prueba:'}
                </span>
                <span className="text-[11px] leading-relaxed">{loyverseTestFeedback.message}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ID de Tienda (Opcional)
              </label>
              <input
                type="text"
                value={loyverse.storeId || ''}
                onChange={(e) => updateLoyverseField('storeId', e.target.value)}
                placeholder="Dejar vacío para incluir todas las tiendas"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Si manejas más de una sucursal en Loyverse, puedes filtrar solo los ingresos de esta tienda.
              </p>
            </div>

            <div className="flex flex-col justify-center">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Sincronización Automática
              </label>
              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={loyverse.autoSync !== false}
                  onChange={(e) => updateLoyverseField('autoSync', e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="text-xs font-medium text-slate-700">
                  Sincronizar ingresos automáticamente al abrir la pestaña
                </span>
              </label>
            </div>
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
