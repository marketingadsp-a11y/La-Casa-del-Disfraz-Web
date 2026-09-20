import React, { useEffect } from 'react';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Lock, 
  Camera, 
  CreditCard, 
  Mail, 
  Phone, 
  CheckCircle2, 
  Printer 
} from 'lucide-react';
import { STORE_INFO } from '../data/costumesData';

interface PrivacyPageProps {
  onNavigate: (path: string) => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Breadcrumb & Back */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <button
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-fuchsia-700 hover:text-fuchsia-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs transition-all active:scale-95"
            id="back-to-home-from-privacidad"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Inicio</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs transition-colors"
              title="Imprimir aviso"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <a
              href={`mailto:${STORE_INFO.email}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-fuchsia-700 bg-fuchsia-50 px-3 py-2 rounded-xl border border-fuchsia-200 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{STORE_INFO.email}</span>
            </a>
          </div>
        </div>

        {/* Document Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Protección de Datos Personales
              </span>
              <h1 className="text-2xl sm:text-3xl font-fun font-bold text-slate-900">
                Aviso de Privacidad
              </h1>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-400 mb-6">
            Última actualización: <strong>09-12-2024</strong> | Domicilio: Quintanar #189, Centro, Ciudad Guzmán, Jalisco.
          </p>

          <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed space-y-6">
            <p>
              En <strong>La Casa del Disfraz</strong>, ubicada en <strong>Quintanar #189, Centro, Ciudad Guzmán, Jalisco</strong>, respetamos y protegemos la privacidad de tus datos personales. Este Aviso de Privacidad describe cómo recabamos, usamos, almacenamos y protegemos la información que nos proporcionas en nuestras actividades comerciales.
            </p>

            {/* Section 1: Datos Personales */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                1. Datos personales que recabamos
              </h2>
              <p className="mb-3">
                Recabamos los siguientes datos personales cuando realizas una renta o compra:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 font-medium text-slate-800">
                <li>Nombre completo</li>
                <li>Teléfono de contacto</li>
                <li>Domicilio</li>
              </ul>
              <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-3">
                <div className="flex items-start gap-2.5 text-xs text-slate-600">
                  <CreditCard className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <p>
                    <strong>Pagos con tarjeta:</strong> En caso de pagos con tarjeta de débito o crédito, los datos bancarios son procesados exclusivamente a través de la pasarela de pagos <strong>Zettle</strong>. La Casa del Disfraz no almacena ni tiene acceso a esta información bancaria detallada.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-600">
                  <Camera className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <p>
                    <strong>Cámaras de seguridad:</strong> Las grabaciones de las cámaras de seguridad dentro y fuera de nuestra tienda física también se recaban como parte de la información de seguridad. Estas grabaciones sirven como evidencia de la aceptación de las cláusulas, políticas y garantías expuestas en el recibo impreso, así como en las publicadas en nuestra página web <em>www.lacasadeldisfraz.mx</em>, al momento de recibir el recibo/contrato por parte del cliente al rentar un disfraz o accesorio.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Finalidad */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                2. Finalidad del tratamiento de datos
              </h2>
              <p className="mb-2">Usamos tus datos personales para:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Emitir recibos y contratos de renta de disfraces y accesorios.</li>
                <li>Cumplir con obligaciones legales y fiscales aplicables.</li>
                <li>Asegurar el cumplimiento de nuestras políticas de renta, mediante el uso de las grabaciones de seguridad que validan la aceptación de las cláusulas, políticas y garantías por parte de los clientes.</li>
                <li>
                  Enviar información publicitaria y promociones exclusivamente de <strong>La Casa del Disfraz</strong>. Esta información podrá ser enviada a través de SMS, WhatsApp o llamada telefónica, utilizando plataformas encargadas de hacer llegar estos mensajes.
                </li>
              </ul>
              <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs font-semibold">
                🛡️ En ningún caso compartiremos tus datos con otros negocios o empresas locales, ni los utilizaremos para fines distintos a los establecidos en este aviso de privacidad.
              </div>
            </div>

            {/* Section 3: Derechos ARCO */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                3. Ejercicio de Derechos ARCO
              </h2>
              <p className="mb-2">
                Tienes derecho a <strong>Acceder, Rectificar, Cancelar u Oponerte (ARCO)</strong> al tratamiento de tus datos personales. Si deseas ejercer cualquiera de estos derechos, por favor contáctanos directamente a través de:
              </p>
              <div className="mt-3 p-4 bg-white rounded-xl border border-slate-200 space-y-1 text-xs">
                <p>
                  <strong>Correo electrónico:</strong>{' '}
                  <a href={`mailto:${STORE_INFO.email}`} className="text-fuchsia-600 font-bold underline">
                    {STORE_INFO.email}
                  </a>
                </p>
                <p>
                  <strong>Teléfono / WhatsApp:</strong>{' '}
                  <a href={`tel:${STORE_INFO.phone}`} className="text-slate-800 font-bold">
                    {STORE_INFO.phoneFormatted}
                  </a>
                </p>
                <p>
                  <strong>Atención presencial:</strong> Quintanar #189, Centro, Ciudad Guzmán, Jalisco.
                </p>
                <p className="text-slate-500 pt-1">
                  *Recibirás una respuesta oficial en un lapso no mayor a 30 días hábiles conforme a la ley.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Back CTA */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-400">
              La Casa del Disfraz © {new Date().getFullYear()} — Ciudad Guzmán, Jalisco
            </span>
            <button
              onClick={() => onNavigate('/')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
            >
              Volver a la Página Principal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
