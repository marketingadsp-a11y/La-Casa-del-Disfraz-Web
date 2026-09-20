import React, { useEffect } from 'react';
import { 
  FileText, 
  ArrowLeft, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  Printer, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2 
} from 'lucide-react';
import { STORE_INFO } from '../data/costumesData';

interface TermsPageProps {
  onNavigate: (path: string) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
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
            id="back-to-home-from-tyc"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Inicio</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs transition-colors"
              title="Imprimir términos"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <a
              href={`tel:${STORE_INFO.phone}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Dudas: {STORE_INFO.phoneFormatted}</span>
            </a>
          </div>
        </div>

        {/* Header Document */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-fuchsia-100 text-fuchsia-700 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-fuchsia-600 uppercase tracking-wider">
                Documento Legal Oficial
              </span>
              <h1 className="text-2xl sm:text-3xl font-fun font-bold text-slate-900">
                Términos de Uso y Condiciones de Renta
              </h1>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 mb-8">
            Estos Términos y Condiciones de Uso aplican para todos los clientes de <strong>LA CASA DEL DISFRAZ</strong> por lo que, al utilizar nuestros servicios, los mismos siempre serán aplicables y así expresamente lo manifiestas como cliente de LA CASA DEL DISFRAZ. Por lo anterior, te invitamos a leerlos detenidamente y, en caso de duda, nos pidas las aclaraciones que necesites.
          </p>

          {/* Quick Summary Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10 pb-8 border-b border-slate-100">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Demora General
              </span>
              <span className="text-base font-black text-rose-600 block">$50.00 MXN / día</span>
              <span className="text-[11px] text-slate-500">Recargo por día de retraso</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Demora en Temporada
              </span>
              <span className="text-base font-black text-rose-600 block">$70.00 MXN / día</span>
              <span className="text-[11px] text-slate-500">Halloween, Navidad y Festivales</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Garantía y Reembolso
              </span>
              <span className="text-base font-black text-emerald-600 block">Depósito / INE</span>
              <span className="text-[11px] text-slate-500">Reintegro íntegro al devolver</span>
            </div>
          </div>

          {/* Detailed Clauses 1 to 13 */}
          <div className="space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base mb-1.5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-black">1</span>
                Obligación de Diligencia y Cuidado
              </h2>
              <p>
                Como cliente de <strong>LA CASA DEL DISFRAZ</strong> te comprometes expresamente a adoptar todas las medidas que sean necesarias a efectos de mantener la integridad y calidad de la prenda a alquilar, así como a prevenir cualquier tipo de daño que se pudiere causar al mismo. Del mismo modo, como cliente te obligas expresamente a obrar de buena fe y a notificar de manera oportuna a LA CASA DEL DISFRAZ los eventuales daños o la pérdida total o parcial de la prenda.
              </p>
              <p className="mt-2 text-rose-700 font-semibold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                ⚠️ Bajo ninguna circunstancia podrás realizar arreglos, ajustes, remiendos, modificaciones o alteraciones a las prendas de LA CASA DEL DISFRAZ que tomes en alquiler. En caso de hacerlo, LA CASA DEL DISFRAZ se reserva el derecho de cobrarte la totalidad del valor de reposición de la prenda correspondiente.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base mb-1.5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-black">2</span>
                Valor del Alquiler
              </h2>
              <p>
                El valor de alquiler dependerá de la prenda y accesorios que escojas. Dicho valor será previamente informado por LA CASA DEL DISFRAZ al momento del apartado o renta.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base mb-1.5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-black">3</span>
                Documentos y Depósito
              </h2>
              <p>
                Con el fin de cubrir eventuales daños menores o extravíos, como cliente de LA CASA DEL DISFRAZ deberás dejar tu credencial oficial IFE / INE o hacer un depósito en garantía que será establecido por LA CASA DEL DISFRAZ en el momento del alquiler. Dicho documento o depósito te será devuelto al momento en que hagas la devolución conforme las reglas que establecen estos Términos y Condiciones de Uso.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base mb-1.5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-black">4</span>
                Demora en la Entrega
              </h2>
              <p>
                Por cada día de demora en la entrega de la prenda alquilada se causará una multa de <strong>$50.00 (cincuenta pesos MXN)</strong> en disfraces en general y <strong>$70.00 (setenta pesos MXN)</strong> en rentas de temporadas. Dicho recargo por demora se aplicará inclusive al día en que sea efectivamente entregada la prenda. LA CASA DEL DISFRAZ descontará del Depósito las sumas de dinero que se llegaren a causar por esta mora en la entrega.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base mb-1.5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-black">5</span>
                Duración y Entrega
              </h2>
              <p>
                La prenda alquilada deberá ser entregada o enviada a LA CASA DEL DISFRAZ en o antes de la fecha de vencimiento acordada, transcurrida la cual se generará la multa por demora señalada anteriormente. Si fuera necesario, LA CASA DEL DISFRAZ cobrará un monto específico por gastos extraordinarios de limpieza de la prenda el cual se estipulará al momento del alquiler y que se deducirá del depósito entregado.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base mb-1.5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-black">6</span>
                Valor de Reposición por Pérdida o Destrucción Total o Parcial
              </h2>
              <p>
                Como cliente de LA CASA DEL DISFRAZ aceptas, reconoces y te obligas a cancelar la totalidad del valor de la prenda alquilada en caso de que la misma se dé por perdida, ya sea por pérdida material, por destrucción total o parcial. Para el efecto, al momento de la entrega de la prenda alquilada deberás certificar que el mismo se encuentra en perfectas condiciones lo cual será verificado por LA CASA DEL DISFRAZ.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base mb-1.5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-black">7</span>
                Daños Menores
              </h2>
              <p>
                Nuestras prendas alquiladas pueden llegar a sufrir daños menores que no implican la pérdida parcial de la prenda. En este caso, LA CASA DEL DISFRAZ cobrará el valor de los arreglos que se requieran para remediar el daño menor, los cuales serán requeridos al momento de entrega o descontados del Depósito.
              </p>
              <p className="mt-1.5 text-slate-500 text-xs">
                LA CASA DEL DISFRAZ considera que son daños menores, entre otros: manchas removibles, dobladillos sueltos, rasgadura de cremallera, pérdida de broches o pedrería (canutillos o lentejuelas, entre otros) y otros daños que no afecten la integridad, postura o uso del vestido. En caso de que el valor de los arreglos exceda el Depósito, aceptas que LA CASA DEL DISFRAZ te cobre los valores en exceso.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base mb-1.5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-black">8</span>
                Forma de Pago del Alquiler
              </h2>
              <p>
                El valor del alquiler de la prenda alquilada deberá ser cancelado por anticipado a través de los medios de pago dispuestos para el efecto por LA CASA DEL DISFRAZ (efectivo, terminal Zettle bancaria o transferencia).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base mb-1.5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-black">9</span>
                Forma de Pago del Valor de Reposición
              </h2>
              <p>
                Como cliente de LA CASA DEL DISFRAZ te obligas a cancelar, sin dilación y de contado, el valor de reposición del vestido, el cual te será debidamente informado. En caso de que transcurran más de diez (10) días calendario contados a partir de la fecha de entrega acordada entre las partes sin que hayas retornado nuestras prendas, LA CASA DEL DISFRAZ quedará facultada para hacer efectivas las garantías/depósito que has otorgado y/o adoptar las medidas judiciales y extrajudiciales que considere pertinentes a efectos de obtener el pago del valor de reposición del vestido.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base mb-1.5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-black">10</span>
                Garantías y Apartados
              </h2>
              <p>
                El Cliente, al tener el compromiso de recoger sus artículos y/o disfraces en la fecha acotada en el momento del apartado/renta, tendrá la garantía de tener disponible su ARTÍCULO dentro del horario de atención habitual (no aplica para horarios extraordinarios de temporada). Si el cliente no recoge su artículo en la fecha acordada, dicho artículo pasará a estar a estado <strong>disponible</strong> a menos que dejara pagada en su totalidad la renta del mismo. Con el fin de garantizar el pago de daños o pérdida, se exigirá otorgar un depósito que dependerá de la prenda a alquilar.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base mb-1.5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-black">11</span>
                Aceptación a Satisfacción y Registro Fotográfico
              </h2>
              <p>
                Una vez confirmes la prenda que quieres tomar en alquiler, previo a la entrega material de la misma, LA CASA DEL DISFRAZ podrá realizar un registro fotográfico de dicho vestido. A su vez, una vez recibes la prenda debes confirmar que la recibes a satisfacción y confirmas la calidad e integridad del mismo. Dicha aceptación a satisfacción se entenderá otorgada salvo que manifiestes lo contrario de forma inmediata.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base mb-1.5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-black">12</span>
                Garantía en Prendas de Venta
              </h2>
              <p>
                Toda prenda de venta será revisada por el cliente de LA CASA DEL DISFRAZ para verificar que no tenga defectos de fábrica y mantenga las expectativas deseadas. Una vez efectuado el pago y/o retirada la prenda del establecimiento por el Cliente, LA CASA DEL DISFRAZ se reservará el derecho de devolución.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base mb-1.5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-black">13</span>
                Mérito Ejecutivo y Contrato de Alquiler
              </h2>
              <p>
                Como cliente de LA CASA DEL DISFRAZ reconoces, aceptas y estás de acuerdo con que el contrato de alquiler que celebras al usar nuestros servicios presta mérito ejecutivo sin necesidad de que LA CASA DEL DISFRAZ te constituya en mora. Por lo tanto, al firmar el recibo de renta, aceptas y reconoces que LA CASA DEL DISFRAZ podrá ejecutar este contrato sin previo aviso.
              </p>
              <p className="mt-2 text-slate-500 text-xs italic">
                *Estos Términos y Condiciones de Uso se complementan con el Contrato de Alquiler que entregamos y que son obligatorios aún sin la firma del cliente, solo aceptando el recibo/contrato de renta en sus manos.
              </p>
            </div>
          </div>

          {/* Contact clarification footer */}
          <div className="mt-10 pt-6 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-slate-800">
                ¿Dudas sobre estos términos o aclaraciones?
              </p>
              <p>
                Escríbenos a <a href={`mailto:${STORE_INFO.email}`} className="text-fuchsia-600 font-semibold underline">{STORE_INFO.email}</a> o visítanos en {STORE_INFO.address}.
              </p>
            </div>
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
