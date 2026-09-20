import { SiteContent } from '../types/siteContent';

export const DEFAULT_SITE_CONTENT: SiteContent = {
  updatedAt: new Date().toISOString(),
  theme: {
    primaryColor: 'fuchsia',
    heroTheme: 'classic-fuchsia'
  },
  announcement: {
    enabled: false,
    badge: 'Aviso Importante',
    text: '¡Apartados abiertos para Festivales Escolares y Primavera 2026! Visítanos en nuestra sucursal.',
    buttonText: 'Ver Ubicación',
    buttonLink: '/#ubicacion'
  },
  storeInfo: {
    name: 'La Casa del Disfraz',
    tagline: 'Donde la Diversión Comienza y tus Fiestas Cobran Vida',
    founder: 'Ing. Cyntia Cárdenas',
    experienceYears: '9+',
    phone: '341 146 0580',
    phoneFormatted: '(341) 146-0580',
    whatsappNumber: '523411460580',
    email: 'hola@lacasadeldisfraz.mx',
    addressLine: 'Quintanar #189, Centro, C.P. 49000',
    cityState: 'Ciudad Guzmán (Zapotlán el Grande), Jalisco, México',
    googleMapsUrl: 'https://maps.google.com/?q=Quintanar+189+Centro+Ciudad+Guzman+Jalisco',
    facebookUrl: 'https://www.facebook.com/LaCasaDelDisfrazCyC',
    instagramUrl: 'https://www.instagram.com/lacasadeldisfraz_/',
    hours: {
      weekdays: '11:00 am a 2:10 pm y de 5:10 pm a 8:00 pm',
      saturday: '11:00 am a 2:00 pm',
      sunday: 'Cerrado (Atención previa cita para eventos)'
    },
    manualStatusOverride: 'auto'
  },
  hero: {
    livePillLocation: 'Quintanar #189, Centro',
    badgeText: 'Donde la Diversión Comienza',
    title: 'Donde la Diversión Comienza y tus Fiestas Cobran Vida 🎭',
    description: "Renta y venta de disfraces en Ciudad Guzmán, Jalisco. Atendemos a familias, escuelas, comparsas y academias con atención personalizada, prendas sanitizadas y taller propio de confección JoJo's.",
    btn1Text: '¿Cómo llegar a la tienda?',
    btn2Text: 'Requisitos de Renta',
    btn3Text: 'Escríbenos por WhatsApp',
    whatsappCustomMessage: '¡Hola La Casa del Disfraz! Me gustaría consultar información sobre un disfraz.',
    btn4Text: 'Ver Términos y Contrato Oficial'
  },
  locationSection: {
    badgeText: 'Visítanos en Ciudad Guzmán',
    title: 'Ubicación Céntrica y Horarios de Atención 📍',
    description: 'Ven a elegir y probarte tu disfraz en un ambiente cómodo, limpio y con estacionamiento cercano.',
    addressTitle: 'Dirección de la Sucursal',
    addressLine: 'Quintanar #189, Centro, C.P. 49000',
    addressCity: 'Ciudad Guzmán (Zapotlán el Grande), Jalisco, México.',
    gpsCardTitle: 'Ruta directa con GPS',
    gpsCardSubtitle: 'Toca para abrir la ruta en tu aplicación de navegación preferida.'
  },
  rentalSteps: {
    badgeText: 'Transparente y Seguro',
    title: 'Requisitos de Renta y Proceso Paso a Paso',
    description: 'Rentar tu disfraz con nosotros es un proceso rápido, claro y confiable en solo 4 pasos.',
    steps: [
      {
        step: '01',
        title: 'Elige tu Disfraz',
        desc: 'Visítanos en nuestra sucursal de Quintanar #189 en el Centro de Ciudad Guzmán para ver los modelos disponibles y probarte tu talla ideal.'
      },
      {
        step: '02',
        title: 'INE y Depósito en Garantía',
        desc: 'Aparta tu fecha con tu identificación oficial vigente (INE/IFE) y el depósito reembolsable acordado al momento de la renta.'
      },
      {
        step: '03',
        title: '¡Disfruta tu Fiesta o Festival!',
        desc: 'Recibes la prenda completamente limpia, desinfectada, planchada con vapor y con sus accesorios listos para tu evento.'
      },
      {
        step: '04',
        title: 'Devolución y Reembolso',
        desc: 'Regresas la prenda en la fecha pactada. Revisamos la integridad del disfraz y te devolvemos tu depósito de inmediato.'
      }
    ],
    contractBannerTitle: '¿Deseas conocer las reglas detalladas y derechos de cliente?',
    contractBannerSubtitle: 'Revisa nuestro Contrato de Prestación de Servicios de Renta y Apartado oficial con fundamento en la legislación mercantil mexicana y directrices PROFECO.',
    contractBannerBtnText: 'Consultar Términos y Condiciones'
  },
  story: {
    badgeText: 'Conoce Nuestro Corazón',
    title: 'Nuestra Historia: Pasión, Creatividad y Alegría 🎭',
    imageUrl: 'https://i.ibb.co/wFCb0tK9/banner-foto-1.jpg',
    badgeNumber: '9+ Años',
    badgeSub: 'En Ciudad Guzmán',
    paragraphs: [
      'Hace 9 años, me sumergí de lleno en el emocionante mundo de los disfraces con un sueño en mente: ¡llevar la diversión y la creatividad a cada fiesta y evento! Así nació La Casa del Disfraz, un proyecto liderado por mí, Cyntia Cárdenas, una ing. apasionada del arte de los disfraces y la diversión.',
      'Comenzamos modestamente, ofreciendo renta y venta de disfraces, pero pronto sentimos la necesidad de añadir un toque más personalizado a nuestro repertorio. En 2019, con "Personalizados CyC", nos aventuramos en la creación de artículos únicos y personalizados que reflejaran la personalidad de cada cliente. ¡Fue una explosión de creatividad y alegría!',
      'Y como si eso no fuera suficiente, decidimos dar un salto audaz: ¡empezar a fabricar nuestros propios disfraces bajo la marca "Disfraces JoJo\'s"! Dirigir este proyecto fue como un viaje mágico, donde cada diseño cobraba vida y cada puntada estaba impregnada de amor y dedicación.',
      'Ahora, una década después de aquel modesto comienzo, estoy increíblemente orgullosa del camino que hemos recorrido. Seguimos creciendo, aprendiendo y trayendo sonrisas a cada evento, ¡y no hay nada que me apasione más que ver la alegría en los rostros de nuestros clientes cuando se ponen uno de nuestros disfraces! ¡Bienvenidos a La Casa del Disfraz, donde los sueños se hacen realidad y la diversión nunca termina! 🎉🎭'
    ],
    strengths: [
      {
        title: "Taller Propio JoJo's",
        desc: 'Ajustes de bastilla, resortes y confección sobre pedido.'
      },
      {
        title: 'Festivales Escolares',
        desc: 'Paquetes especiales para escuelas y academias de baile.'
      },
      {
        title: 'Atención Cálida',
        desc: 'Te asesoramos con la talla y combinación ideal.'
      },
      {
        title: 'Apartado Sin Estrés',
        desc: 'Reserva tu traje con anticipación para Halloween o Primavera.'
      }
    ],
    ctaButtonText: "Cotizar Confección Especial JoJo's por WhatsApp",
    ctaWhatsappMessage: '¡Hola La Casa del Disfraz! Me gustaría cotizar un pedido especial de confección para mi evento.'
  },
  customOrders: {
    badgeText: 'Personalizados CyC & Diseño Gráfico',
    title: 'Invitaciones Temáticas y Recuerdos para Fiestas ✨',
    description: 'Complementa tu disfraz con invitaciones digitales interactivas y detalles personalizados que tus invitados nunca olvidarán.',
    items: [
      {
        title: 'Invitaciones Digitales con WhatsApp',
        desc: 'Diseños interactivos animados con música, mapa con botón directo a Google Maps, contador de días y botón para que tus invitados te confirmen asistencia en un clic.',
        badge: '¡Las más pedidas!'
      },
      {
        title: 'Souvenirs & Playeras CyC',
        desc: 'Playeras familiares para papá, mamá e hijos del festejado, termos personalizados, gorras y mochilitas dulceras con nombre.',
        badge: 'Personalizados CyC'
      }
    ],
    ctaButtonText: 'Cotizar Invitaciones y Personalizados por WhatsApp',
    ctaWhatsappMessage: '¡Hola! Me interesa solicitar información sobre las invitaciones digitales y artículos personalizados CyC.'
  },
  faqSection: {
    badgeText: 'Resolvemos tus Inquietudes',
    title: 'Preguntas Frecuentes sobre la Renta y Apartado',
    description: 'Todo lo que necesitas saber antes y durante la renta de tu disfraz.',
    items: [
      {
        q: '¿Tengo que lavar el disfraz antes de regresarlo?',
        a: '¡Para nada! En La Casa del Disfraz nosotros nos encargamos del proceso especializado de tintorería, desinfección y planchado con vapor. Solo te pedimos que no lo laves tú mismo ni le apliques químicos para proteger los tejidos y aplicaciones. Aunque no se debe lavar por cuenta propia, no se debe entregar manchado severo, roto ni pintado.'
      },
      {
        q: '¿Puedo apartar mi disfraz directamente por WhatsApp?',
        a: '¡Sí! Puedes escribirnos directamente por WhatsApp para verificar disponibilidad de modelos y tallas. Te confirmamos de inmediato y puedes apartar con transferencia o acudir a la sucursal a dejar tu depósito. Es necesario acudir a sucursal al recoger el disfraz para presentar tu INE y depósito en garantía.'
      },
      {
        q: '¿Qué pasa si necesito disfraces iguales para todo un grupo escolar?',
        a: 'A través de nuestra marca propia "Disfraces JoJo\'s" confeccionamos trajes para escuelas y academias. Ofrecemos precios preferenciales por volumen y paquetes grupales.'
      },
      {
        q: '¿Qué documentos y depósitos se requieren para la renta?',
        a: 'Solo requieres presentar tu credencial de elector (INE/IFE) vigente y dejar un depósito en garantía reembolsable (habitualmente entre $150 y $300 MXN dependiendo del disfraz). Al devolver la prenda completa y en buen estado, te reintegramos el depósito íntegro en efectivo o transferencia.'
      }
    ]
  },
  reviewsSection: {
    badgeText: 'Voces de Nuestros Clientes',
    title: 'Familias y Escuelas Felices en Jalisco',
    description: 'La confianza de mamás, maestros y organizadores de fiestas es nuestra mejor carta de presentación.',
    items: [
      {
        id: 'r1',
        author: 'Mariana Valencia G.',
        role: 'Mamá de preescolar',
        rating: 5,
        comment: '¡Salvada total para el festival de la primavera! El leoncito le quedó a la medida a mi hijo y la tela súper fresca para el calor de Ciudad Guzmán. Muy amables en el trato.',
        date: 'Hace 1 semana',
        costumeName: 'Leoncito de la Selva Primavera'
      },
      {
        id: 'r2',
        author: 'Prof. Carlos Mendoza',
        role: 'Coordinador de Teatro Escolar',
        rating: 5,
        comment: 'Trabajamos con el equipo de La Casa del Disfraz para rentar 18 trajes para la obra escolar. Todos impecables, limpios, con accesorios completos y a tiempo.',
        date: 'Hace 3 semanas',
        costumeName: 'Trajes Escolares en Paquete'
      },
      {
        id: 'r3',
        author: 'Valeria Robles',
        role: 'Cliente de fiesta temática',
        rating: 5,
        comment: 'Renté el de Catrina para el concurso de la empresa y me gané el primer lugar. El vestido tiene bordados hermosos y la corona de flores es espectacular.',
        date: 'Octubre 2025',
        costumeName: 'Catrina Mexicana de Gala'
      },
      {
        id: 'r4',
        author: 'Esteban Ochoa',
        role: 'Papá de 2 niños',
        rating: 5,
        comment: 'El sistema de renta con apartado nos dio mucha tranquilidad. Dejas el depósito, te dan tu comprobante y al devolverlo te regresan todo íntegro al momento.',
        date: 'Hace 1 mes',
        costumeName: 'Spiderman & Mario Bros'
      }
    ]
  },
  footer: {
    aboutText: 'Especialistas en renta y confección de disfraces en el Centro de Ciudad Guzmán, Jalisco. Calidad, higiene garantizada y atención cálida para todas tus celebraciones.',
    copyright: '© 2026 La Casa del Disfraz. Todos los derechos reservados.',
    brandsText: "La Casa del Disfraz • Disfraces JoJo's • Personalizados CyC"
  },
  navigationMenu: [
    { id: 'nav-inicio', label: 'Inicio', path: '/', enabled: true, order: 1, icon: 'home' },
    { id: 'nav-ubicacion', label: 'Ubicación y Horarios', path: '/#ubicacion', enabled: true, order: 2, icon: 'map-pin' },
    { id: 'nav-requisitos', label: 'Requisitos de Renta', path: '/#requisitos', enabled: true, order: 3, icon: 'shield' },
    { id: 'nav-historia', label: 'Nuestra Historia', path: '/#historia', enabled: true, order: 4, icon: 'sparkles' },
    { id: 'nav-invitaciones', label: 'Invitaciones CyC', path: '/#invitaciones', enabled: true, order: 5, icon: 'palette' },
    { id: 'nav-tyc', label: 'Términos y Condiciones (/tyc)', path: '/tyc', enabled: true, order: 6, icon: 'file-text' },
    { id: 'nav-privacidad', label: 'Aviso de Privacidad (/privacidad)', path: '/privacidad', enabled: true, order: 7, icon: 'lock' }
  ],
  customPages: [
    {
      id: 'page-temporada',
      slug: 'temporada',
      title: 'Catálogo de Temporada y Festivales 🎭',
      subtitle: 'Modelos destacados para festivales escolares, comparsas y eventos en Ciudad Guzmán',
      badge: 'Colección 2026',
      content: 'Contamos con una amplia variedad de disfraces en renta con telas suaves, accesorios completos y mantenimiento higiénico profesional para niños, jóvenes y adultos. Visítanos en nuestra sucursal de Quintanar #189.',
      heroImage: 'https://i.ibb.co/wFCb0tK9/banner-foto-1.jpg',
      ctaText: 'Consultar disponibilidad por WhatsApp',
      ctaWhatsappMsg: '¡Hola La Casa del Disfraz! Me gustaría consultar disfraces de la sección de Temporada.',
      showInMenu: false,
      items: [
        {
          title: 'Festivales de Primavera',
          desc: 'Abejas, mariposas, leoncitos, conejos, flores y animalitos de la selva listos para entrega inmediata.',
          tag: 'Infantil & Escolar',
          price: 'Apartado disponible'
        },
        {
          title: 'Personajes y Fantasía',
          desc: 'Trajes de época, películas, superhéroes y temáticas para fiestas y desfiles.',
          tag: 'Todas las tallas',
          price: 'Renta con depósito'
        },
        {
          title: 'Confección sobre Pedido',
          desc: 'Diseños especiales a través de nuestro taller JoJo\'s para grupos y academias.',
          tag: 'Taller JoJo\'s',
          price: 'Cotización personalizada'
        }
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    }
  ],
  adminUsers: [
    {
      id: 'admin-cristobal',
      username: 'Cristobal',
      passwordHashOrPlain: '012004',
      role: 'superadmin',
      name: 'Cristobal',
      createdAt: '2026-01-01T00:00:00.000Z'
    }
  ]
};
