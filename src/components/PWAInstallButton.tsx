import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle, Share2, PlusSquare, X, ArrowRight } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'card' | 'compact' | 'minimal';
  appName?: string;
  targetRoute?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'card',
  appName = 'Registro de Gastos',
  targetRoute = '/registrogastos'
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstallClick = async () => {
    try {
      localStorage.setItem('pwa_target_route', targetRoute);
    } catch {
      // ignore
    }

    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (isInstallable) {
      setIsInstalling(true);
      await install();
      setIsInstalling(false);
    } else {
      // If browser hasn't fired beforeinstallprompt yet or is on desktop Chrome/Edge without prompt
      setShowIOSModal(true);
    }
  };

  if (isInstalled) {
    if (variant === 'minimal') return null;
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
        <CheckCircle className="w-4 h-4 text-emerald-600" />
        <span>App instalada en modo pantalla completa</span>
      </div>
    );
  }

  return (
    <>
      {variant === 'card' && (
        <div className="bg-gradient-to-br from-purple-900 via-fuchsia-900 to-rose-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-purple-950 text-[11px] font-extrabold uppercase tracking-wide">
                <Smartphone className="w-3 h-3" />
                <span>Instalar como App en tu celular</span>
              </div>
              <h3 className="text-base sm:text-lg font-fun font-bold text-white">
                Acceso directo a {appName}
              </h3>
              <p className="text-xs text-fuchsia-100 max-w-md leading-relaxed">
                Instala la versión PWA para abrir directamente en <strong>{targetRoute}</strong> desde tu pantalla de inicio, sin barras de navegador y con carga instantánea.
              </p>
            </div>

            <div className="shrink-0">
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="w-full sm:w-auto px-5 py-3 bg-amber-400 hover:bg-amber-300 active:scale-95 text-purple-950 font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isInstalling ? 'Instalando...' : 'Instalar App PWA'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {variant === 'compact' && (
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-fuchsia-600 to-rose-600 hover:from-fuchsia-700 hover:to-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Instalar App PWA</span>
        </button>
      )}

      {/* Modal Guide for iOS / Manual installation */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 relative border border-slate-100">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-fuchsia-100 text-fuchsia-700 flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Instalar {appName}
                </h3>
                <p className="text-xs text-slate-500">
                  Acceso directo a {targetRoute} en tu dispositivo
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs text-slate-700">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-fuchsia-600 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>En iPhone / iPad (Safari):</span>
                </div>
                <div className="pl-7 space-y-1.5 text-slate-600">
                  <p className="flex items-center gap-2">
                    <Share2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Toca el botón <strong>Compartir</strong> en la barra de Safari.</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <PlusSquare className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                    <span>Selecciona <strong>"Agregar al inicio"</strong> o <strong>"Añadir a pantalla de inicio"</strong>.</span>
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>En Android (Chrome / Brave / Edge):</span>
                </div>
                <div className="pl-7 text-slate-600 space-y-1">
                  <p>
                    Toca los <strong>3 puntos verticales</strong> del navegador y selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                ✨ <strong>Beneficio:</strong> Al instalar la app desde esta pantalla, el ícono abrirá directamente en <strong>{targetRoute}</strong> con inicio ultrarrápido y pantalla completa.
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
