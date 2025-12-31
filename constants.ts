import { Stream, StreamStatus, Shop } from './types';

export const PLANES_URL = '/planes.html';

// Helper to calculate Mock ISO dates relative to "Now"
const getRelativeDate = (hoursOffset: number) => {
    const d = new Date();
    d.setHours(d.getHours());
    d.setMinutes(d.getMinutes() + (hoursOffset * 60)); 
    return d.toISOString();
};

// Helper to extract HH:mm from the relative date
const getTimeFromDate = (isoString: string) => {
    const d = new Date(isoString);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

const dateNow = getRelativeDate(0);
const dateUpcoming = getRelativeDate(48); // +48 hours (2 days future)
const dateFinished = getRelativeDate(-72); // -72 hours (3 days ago)

export const MOCK_SHOPS: Shop[] = [
  { 
    id: 's1', 
    name: 'Las Marianas', 
    razonSocial: 'Las Marianas S.R.L.',
    cuit: '30-11223344-5',
    email: 'contacto@lasmarianas.com',
    memberSince: '2023-01-15T00:00:00.000Z',
    logoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
    plan: 'Alta Visibilidad', // CORREGIDO
    baseQuota: 1, // Plan Alta
    quotaUsed: 1, 
    extraQuota: 0,
    reelsExtraQuota: 0,
    whatsappLines: [
      { label: 'Ventas por mayor', number: '5491112345678' },
      { label: 'Envíos', number: '5491187654321' }
    ],
    website: 'https://lasmarianas.com',
    address: 'Argerich 450, Flores, CABA',
    addressDetails: {
        street: 'Argerich',
        number: '450',
        city: 'Flores',
        province: 'CABA',
        zip: '1406'
    },
    socialHandles: {
      instagram: 'lasmarianas_ok',
      facebook: 'LasMarianasModa'
    },
    minimumPurchase: 50000,
    paymentMethods: ['Efectivo', 'Transferencia'],
    dataIntegrity: 'COMPLETE',
    isPenalized: false,
    penalties: [],
    reviews: [],
    ratingAverage: 4.5
  },
  { 
    id: 's2', 
    name: 'Moda Urbana', 
    razonSocial: 'Moda Urbana S.A.',
    cuit: '30-99887766-1',
    email: 'ventas@modaurbana.com',
    memberSince: '2023-06-20T00:00:00.000Z',
    logoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', 
    plan: 'Estandar', 
    baseQuota: 0, // Plan Estandar
    quotaUsed: 0, 
    extraQuota: 0,
    reelsExtraQuota: 0,
    whatsappLines: [
      { label: 'Ventas por mayor', number: '5491187654321' }
    ],
    website: 'https://modaurbana.com',
    address: 'Helguera 300, Flores',
    addressDetails: {
        street: 'Helguera',
        number: '300',
        city: 'Flores',
        province: 'CABA',
        zip: '1406'
    },
    socialHandles: {
      tiktok: 'modaurbana'
    },
    minimumPurchase: 30000,
    paymentMethods: ['Efectivo'],
    dataIntegrity: 'MINIMAL',
    isPenalized: false,
    penalties: [],
    reviews: [],
    ratingAverage: 3.8 
  },
  { 
    id: 's3', 
    name: 'Estilo Libre', 
    razonSocial: 'Juan Perez',
    cuit: '20-12345678-9',
    email: 'juan@estilolibre.com',
    memberSince: '2024-02-10T00:00:00.000Z',
    logoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', 
    plan: 'Alta Visibilidad', // CORREGIDO
    baseQuota: 1,
    quotaUsed: 1, 
    extraQuota: 0,
    reelsExtraQuota: 0,
    whatsappLines: [
      { label: 'Ventas por mayor', number: '5491199999999' }
    ],
    website: '', 
    socialHandles: {
      instagram: 'estilolibre.av'
    },
    dataIntegrity: 'INSUFFICIENT', 
    isPenalized: true,
    penalties: [
      { id: 'p1', dateISO: '2024-05-10T10:00:00Z', reason: 'Incumplimiento de vivo programado (05/10)', active: true }
    ],
    reviews: [],
    ratingAverage: 2.5
  },
  { 
    id: 's4', 
    name: 'Denim Factory', 
    razonSocial: 'Denim Factory S.R.L.',
    cuit: '33-55555555-9',
    email: 'info@denimfactory.com',
    memberSince: '2022-11-01T00:00:00.000Z',
    logoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', 
    plan: 'Maxima Visibilidad', // CORREGIDO
    baseQuota: 3, // Plan Maxima
    quotaUsed: 2,
    extraQuota: 0,
    reelsExtraQuota: 0,
    whatsappLines: [
      { label: 'Ventas por mayor', number: '5491155555555' },
      { label: 'Ventas por menor', number: '5491166666666' },
      { label: 'Envíos', number: '5491177777777' }
    ],
    website: 'https://denimfactory.com',
    address: 'Avellaneda 2890, Flores',
    addressDetails: {
        street: 'Av. Avellaneda',
        number: '2890',
        city: 'Flores',
        province: 'CABA',
        zip: '1406'
    },
    socialHandles: {
      instagram: 'denimfactory',
      tiktok: 'denim_factory'
    },
    minimumPurchase: 100000,
    paymentMethods: ['Efectivo', 'Transferencia', 'Depósito', 'USDT'],
    dataIntegrity: 'COMPLETE',
    isPenalized: false,
    penalties: [],
    reviews: [],
    ratingAverage: 4.8
  }
];

export const MOCK_STREAMS: Stream[] = [
  {
    id: '1',
    shop: MOCK_SHOPS[0],
    shopId: 's1',
    title: 'Nueva Colección Invierno 2024',
    coverImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80',
    status: StreamStatus.LIVE,
    extensionCount: 0,
    scheduledTime: getTimeFromDate(dateNow), 
    fullDateISO: dateNow,
    startedAt: Date.now() - (12 * 60 * 1000), 
    platform: 'Instagram',
    url: 'https://instagram.com/lasmarianas_ok/live',
    views: 1200,
    reportCount: 0,
    isVisible: true,
    likes: 45
  },
  {
    id: '3',
    shop: MOCK_SHOPS[2],
    shopId: 's3',
    title: 'Showroom Exclusivo',
    coverImage: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=800&q=80',
    status: StreamStatus.FINISHED,
    extensionCount: 0,
    scheduledTime: getTimeFromDate(dateFinished),
    fullDateISO: dateFinished,
    platform: 'Instagram',
    url: 'https://instagram.com',
    views: 300,
    reportCount: 0,
    isVisible: true,
    likes: 12,
    rating: 4.8
  },
  {
    id: '4',
    shop: MOCK_SHOPS[3],
    shopId: 's4',
    title: 'Lanzamiento Jeans',
    coverImage: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80',
    status: StreamStatus.UPCOMING,
    extensionCount: 0,
    scheduledTime: getTimeFromDate(dateUpcoming),
    fullDateISO: dateUpcoming, 
    platform: 'TikTok',
    url: 'https://tiktok.com/@denim_factory',
    views: 0,
    reportCount: 0,
    isVisible: true,
    likes: 0
  }
];

export const FILTERS = ['Todos', 'En Vivo', 'Próximos', 'Finalizados'];
