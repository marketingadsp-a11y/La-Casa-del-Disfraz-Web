export function getStoreLiveStatus(manualOverride?: 'auto' | 'open' | 'closed'): {
  isOpen: boolean;
  statusText: string;
  badgeColor: string;
  detail: string;
} {
  if (manualOverride === 'open') {
    return {
      isOpen: true,
      statusText: 'Abierto ahora en Ciudad Guzmán',
      badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-300',
      detail: 'Horario especial activo en sucursal'
    };
  }

  if (manualOverride === 'closed') {
    return {
      isOpen: false,
      statusText: 'Cerrado temporalmente',
      badgeColor: 'bg-rose-500/10 text-rose-700 border-rose-200',
      detail: 'Atención especial y dudas vía WhatsApp'
    };
  }

  try {
    // Current time in America/Mexico_City
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Mexico_City',
      weekday: 'narrow',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });

    const parts = formatter.formatToParts(now);
    let hour = 12;
    let minute = 0;
    for (const part of parts) {
      if (part.type === 'hour') hour = parseInt(part.value, 10);
      if (part.type === 'minute') minute = parseInt(part.value, 10);
    }

    // day of week in Mexico City
    const dayFormatter = new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Mexico_City',
      weekday: 'short'
    });
    const dayStr = dayFormatter.format(now).toLowerCase(); // dom, lun, mar, mié, jue, vie, sáb

    const timeMinutes = hour * 60 + minute;

    const isSunday = dayStr.startsWith('dom');
    const isSaturday = dayStr.startsWith('s');

    if (isSunday) {
      return {
        isOpen: false,
        statusText: 'Cerrado hoy Domingo',
        badgeColor: 'bg-rose-500/10 text-rose-700 border-rose-200',
        detail: 'Abrimos mañana Lunes a las 11:00 am'
      };
    }

    if (isSaturday) {
      // Sat: 11:00 to 14:00 (660 to 840) only
      const isOpenSat = timeMinutes >= 660 && timeMinutes <= 840;

      if (isOpenSat) {
        return {
          isOpen: true,
          statusText: 'Abierto ahora en Ciudad Guzmán',
          badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-300',
          detail: 'Horario de Sábado: Cerramos a las 2:00 pm'
        };
      } else if (timeMinutes < 660) {
        return {
          isOpen: false,
          statusText: 'Cerrado por el momento',
          badgeColor: 'bg-amber-500/10 text-amber-800 border-amber-300',
          detail: 'Abrimos hoy Sábado de 11:00 am a 2:00 pm'
        };
      } else {
        return {
          isOpen: false,
          statusText: 'Cerrado por hoy',
          badgeColor: 'bg-slate-500/10 text-slate-700 border-slate-300',
          detail: 'Abrimos el Lunes a las 11:00 am'
        };
      }
    }

    // Weekdays (Lun - Vie): 11:00 to 14:10 (660 to 850) and 17:10 to 20:00 (1030 to 1200)
    const morningOpen = timeMinutes >= 660 && timeMinutes <= 850;
    const eveningOpen = timeMinutes >= 1030 && timeMinutes <= 1200;

    if (morningOpen) {
      return {
        isOpen: true,
        statusText: 'Abierto ahora en Ciudad Guzmán',
        badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-300',
        detail: 'Turno matutino: Cerramos 2:10 pm (reabrimos 5:10 pm)'
      };
    } else if (eveningOpen) {
      return {
        isOpen: true,
        statusText: 'Abierto ahora en Ciudad Guzmán',
        badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-300',
        detail: 'Turno vespertino: Cerramos hoy a las 8:00 pm'
      };
    } else if (timeMinutes < 660) {
      return {
        isOpen: false,
        statusText: 'Cerrado por la mañana',
        badgeColor: 'bg-amber-500/10 text-amber-800 border-amber-300',
        detail: 'Abrimos hoy a las 11:00 am'
      };
    } else if (timeMinutes > 850 && timeMinutes < 1030) {
      return {
        isOpen: false,
        statusText: 'Pausa intermedia',
        badgeColor: 'bg-amber-500/10 text-amber-800 border-amber-300',
        detail: 'Reabrimos hoy a las 5:10 pm'
      };
    } else {
      return {
        isOpen: false,
        statusText: 'Cerrado por la noche',
        badgeColor: 'bg-slate-500/10 text-slate-700 border-slate-300',
        detail: 'Abrimos mañana a las 11:00 am'
      };
    }
  } catch {
    return {
      isOpen: true,
      statusText: 'Lunes a Sábado abiertos',
      badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-300',
      detail: '11:00am - 2:10pm y 5:10pm - 8:00pm (Sábados 11:00am - 2:00pm)'
    };
  }
}

export function buildWhatsAppLink(message: string, customNumber?: string): string {
  const number = customNumber ? customNumber.replace(/\D/g, '') : '523411460580';
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
