import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { getShopCoverUrl } from '../utils/shopMedia';
import { Plus, X, Instagram, Facebook, Video, AlertOctagon, Check, Save, Lock, RefreshCw, Pencil, Trash2, Star, History, LayoutDashboard, Store, Radio, Globe, Phone, MapPin, ExternalLink, User, CreditCard, ShoppingCart, AlertTriangle, Info, Film } from 'lucide-react';
import { StreamStatus, Shop, SocialHandles, Stream, SocialPlatform, WhatsappLine, WhatsappLabel, Reel, NotificationItem } from '../types';
import { AddressAutocomplete } from './AddressAutocomplete';

// Dashboard is the shop control panel for schedule, reels, and profile data.
// Dashboard es el panel de tienda para agenda, reels y datos de perfil.
import { fetchPurchasesByShop, confirmMercadoPagoPayment } from '../domains/purchases';
import { fetchReelsByShop, uploadReelMedia, createReel } from '../domains/reels';
import { acceptShop } from '../domains/shops';
import { NoticeModal } from './NoticeModal';
import { LogoBubble } from './LogoBubble';
import { ShopPurchaseModal } from './payments/ShopPurchaseModal';
import { PlanUpgradeModal } from './payments/PlanUpgradeModal';
import styles from './Dashboard.module.css';

const MerchantStreamsTab = React.lazy(async () => {
  const mod = await import('./merchant-tabs/MerchantStreamsTab');
  return { default: mod.default };
});
const MerchantReelsTab = React.lazy(async () => {
  const mod = await import('./merchant-tabs/MerchantReelsTab');
  return { default: mod.default };
});

interface DashboardProps {
    currentShop: Shop;
    streams: Stream[];
    onStreamCreate: (stream: Stream) => Promise<boolean>;
    onStreamUpdate: (stream: Stream) => Promise<boolean>;
    onStreamDelete: (streamId: string) => Promise<void>;
    onShopUpdate: (shop: Shop) => Promise<boolean>;
    onExtendStream?: (streamId: string) => void;
    onBuyQuota: (amount: number) => void;
    onReelChange: () => void;
    onRefreshData: () => void;
    activeTab?: Tab;
    onTabChange?: (tab: Tab) => void;
    notifications?: NotificationItem[];
    onMarkNotificationRead?: (id: string) => void;
    onMarkAllNotificationsRead?: () => void;
    isPreview?: boolean;
    adminOverride?: boolean;
}

type Tab = 'RESUMEN' | 'REDES' | 'VIVOS' | 'REELS' | 'PERFIL';

const WA_LABELS: WhatsappLabel[] = ['Ventas por mayor', 'Ventas por menor', 'Consulta ingreso', 'Envíos', 'Reclamos'];
const PAYMENT_OPTIONS = ['Efectivo', 'Transferencia', 'Depósito', 'USDT', 'Cheque', 'Mercado Pago'];
const REEL_LIMITS: Record<string, number> = { 'Estandar': 1, 'Alta Visibilidad': 3, 'Maxima Visibilidad': 5 };
const MP_RETURN_STORAGE_KEY = 'mp_return';

type MpReturnPayload = {
  status?: string;
  paymentId?: string;
  purchaseId?: string;
  ts: number;
};

const readStoredMpReturn = (): MpReturnPayload | null => {
  try {
    const raw = window.sessionStorage.getItem(MP_RETURN_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MpReturnPayload;
  } catch {
    return null;
  }
};

export const Dashboard: React.FC<DashboardProps> = ({ 
    currentShop, 
    streams, 
    onStreamCreate, 
    onStreamUpdate,
    onStreamDelete,
    onShopUpdate, 
    onExtendStream,
    onBuyQuota,
    onReelChange,
    onRefreshData,
    activeTab: activeTabProp,
    onTabChange,
    notifications = [],
    onMarkNotificationRead,
    onMarkAllNotificationsRead,
    isPreview = false,
    adminOverride = false
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('RESUMEN');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPlanUpgradeModal, setShowPlanUpgradeModal] = useState(false);
  const [purchaseType, setPurchaseType] = useState<'LIVE_PACK' | 'REEL_PACK'>('LIVE_PACK');
  const [notice, setNotice] = useState<{ title: string; message: string; tone?: 'info' | 'success' | 'warning' | 'error' } | null>(null);
  const [showPendingNotice, setShowPendingNotice] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
      title: string;
      message: string;
      confirmLabel?: string;
      cancelLabel?: string;
      onConfirm: () => void;
  } | null>(null);
  const [editingStream, setEditingStream] = useState<Stream | null>(null);
  const [shopReels, setShopReels] = useState<Reel[]>([]); 
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [isPurchaseLoading, setIsPurchaseLoading] = useState(false);
  const [isPurchaseBlocked, setIsPurchaseBlocked] = useState(false);
  const purchasesLoadedRef = useRef(false);
  const mpReturnHandledRef = useRef(false);

  const blockPreviewAction = (message = 'Accion bloqueada en modo vista tecnica.') => {
      if (!isPreview) return false;
      setNotice({
          title: 'Modo vista',
          message,
          tone: 'warning',
      });
      return true;
  };

  const openBuyModal = () => {
      if (blockPreviewAction()) return;
      setPurchaseType('LIVE_PACK');
      setShowPurchaseModal(true);
  };

  const openBuyReelModal = () => {
      if (blockPreviewAction()) return;
      setPurchaseType('REEL_PACK');
      setShowPurchaseModal(true);
  };
  
  // Local states
  const [shopForm, setShopForm] = useState<Partial<Shop>>({});
  const [socials, setSocials] = useState<SocialHandles>(currentShop.socialHandles || {});
  const [waLines, setWaLines] = useState<{label: WhatsappLabel | '', number: string}[]>([
      { label: 'Ventas por mayor', number: '' },
      { label: 'Consulta ingreso', number: '' },
      { label: 'EnvÃ­os', number: '' }
  ]);
  const [activeProfileSection, setActiveProfileSection] = useState<'identity' | 'address' | 'sales'>('identity');

  // Reel Form States
  const [reelUrl, setReelUrl] = useState('');
  const [reelPlatform, setReelPlatform] = useState<SocialPlatform | ''>('');
  const [reelMode, setReelMode] = useState<'VIDEO' | 'PHOTO_SET'>('VIDEO');
  const [reelPhotoUrls, setReelPhotoUrls] = useState<string[]>([]);
  const [isReelUploading, setIsReelUploading] = useState(false);
  const [reelProcessingJobId, setReelProcessingJobId] = useState<string | null>(null);

  // Sync Logic & Load Reels
  const loadPurchases = async () => {
      if (isPreview) return;
      if (!currentShop.id || currentShop.id === 'empty' || isPurchaseBlocked) return;
      setIsPurchaseLoading(true);
      try {
          const data = await fetchPurchasesByShop(currentShop.id);
          setPurchaseHistory(data || []);
          purchasesLoadedRef.current = true;
      } catch (error) {
          console.error('Error cargando compras', error);
          const message = error instanceof Error ? error.message : '';
          if (message.toLowerCase().includes('403') || message.toLowerCase().includes('forbidden')) {
              setIsPurchaseBlocked(true);
          }
      } finally {
          setIsPurchaseLoading(false);
      }
  };

  const loadPurchasesOnce = async () => {
      if (isPreview) return;
      if (purchasesLoadedRef.current) return;
      await loadPurchases();
  };


  useEffect(() => {
      const initialLines = [
          { label: 'Ventas por mayor', number: '' },
          { label: 'Consulta ingreso', number: '' },
          { label: 'Envíos', number: '' }
      ];
      if (currentShop.whatsappLines && currentShop.whatsappLines.length > 0) {
          currentShop.whatsappLines.forEach((line, index) => {
              if (index < 3) initialLines[index] = { label: line.label, number: line.number };
          });
      }
      setWaLines(initialLines as any);
      setShopForm(prev => ({
          ...prev, 
          name: currentShop.name,
          razonSocial: currentShop.razonSocial,
          cuit: currentShop.cuit,
          email: currentShop.email,
          website: currentShop.website,
          address: currentShop.address,
          addressDetails: currentShop.addressDetails,
          paymentMethods: currentShop.paymentMethods || [],
          minimumPurchase: currentShop.minimumPurchase || 0
      }));

      const loadReels = async () => {
          if (isPreview) return;
          if (!currentShop.id || currentShop.id === 'empty') return;
          try {
            const myReels = await fetchReelsByShop(currentShop.id);
            setShopReels(myReels);
          } catch (error) {
            console.error("Error cargando reels", error);
          }
      };
      loadReels();
      setIsPurchaseBlocked(false);
      purchasesLoadedRef.current = false;
      loadPurchases();
  }, [currentShop]);

  useEffect(() => {
      if (mpReturnHandledRef.current) return;
      const params = new URLSearchParams(window.location.search);
      const mpResult = params.get('mp_result');
      const collectionStatus = params.get('collection_status') || params.get('status');
      const externalReference = params.get('external_reference');
      const paymentId =
          params.get('payment_id') ||
          params.get('collection_id') ||
          params.get('paymentId');
      const purchaseId = externalReference || params.get('purchaseId');

      let payload: MpReturnPayload | null = null;
      const statusFromUrl = (mpResult || collectionStatus || '').toLowerCase();
      if (statusFromUrl || paymentId || purchaseId) {
          payload = {
              status: statusFromUrl || undefined,
              paymentId: paymentId || undefined,
              purchaseId: purchaseId || undefined,
              ts: Date.now(),
          };
          window.sessionStorage.setItem(MP_RETURN_STORAGE_KEY, JSON.stringify(payload));
      } else {
          payload = readStoredMpReturn();
      }

      if (!payload || (!payload.status && !payload.paymentId && !payload.purchaseId)) return;

      mpReturnHandledRef.current = true;
      const status = (payload.status || '').toLowerCase();

      const finalizePayment = async () => {
          let approvedFromConfirm: boolean | null = null;
          if (payload?.paymentId || payload?.purchaseId) {
              try {
                  const result = await confirmMercadoPagoPayment({
                      paymentId: payload.paymentId,
                      purchaseId: payload.purchaseId,
                  });
                  approvedFromConfirm = Boolean(result?.approved);
              } catch (error) {
                  console.error('Error confirmando pago', error);
              }
          }

          const isApproved =
              approvedFromConfirm === true || status === 'approved' || status === 'success';

          if (isApproved) {
              setNotice({
                  title: 'Compra exitosa',
                  message: payload?.purchaseId
                      ? `Compra ${payload.purchaseId} aprobada. Muchas gracias por elegirnos!`
                      : 'Pago aprobado. Muchas gracias por elegirnos!',
                  tone: 'success',
              });
              onRefreshData();
              loadPurchases();
          } else if (status === 'pending' || status === 'in_process') {
              setNotice({
                  title: 'Pago en proceso',
                  message: 'Estamos acreditando la compra. Te avisamos en minutos.',
                  tone: 'info',
              });
              loadPurchases();
          } else {
              setNotice({
                  title: 'Pago no completado',
                  message: 'No se pudo completar el pago. Podes reintentarlo cuando quieras.',
                  tone: 'warning',
              });
          }

          window.history.replaceState({}, document.title, window.location.pathname);
          window.sessionStorage.removeItem(MP_RETURN_STORAGE_KEY);
      };

      void finalizePayment();
  }, [onRefreshData]);

  // --- LOGIC: QUOTAS & PERMISSIONS (CORREGIDO PARA EVITAR NaN) ---
  
  const myStreams = streams.filter(s => s.shop.id === currentShop.id);
  const activeStreams = myStreams.filter(s =>
      s.status === StreamStatus.LIVE ||
      s.status === StreamStatus.UPCOMING ||
      s.status === StreamStatus.PENDING_REPROGRAMMATION
  );
  
  // CORRECCIÓN: Usamos Number() y || 0 para evitar errores si el backend manda null
  const wallet = currentShop.quotaWallet;
  const baseQuota = wallet
      ? Math.max(0, Number(wallet.weeklyLiveBaseLimit) - Number(wallet.weeklyLiveUsed))
      : Number(currentShop.baseQuota) || 0;
  const extraQuota = wallet ? Number(wallet.liveExtraBalance) : Number(currentShop.extraQuota) || 0;
  
  const usedQuota = activeStreams.length;
  const availableQuota = wallet ? baseQuota + extraQuota : (baseQuota + extraQuota) - usedQuota;
  
  // Reels Quota
  const todayStr = new Date().toISOString().split('T')[0];
  const reelsToday = shopReels.filter(r => r.createdAtISO.startsWith(todayStr) && r.origin === 'PLAN' && r.status !== 'HIDDEN').length;
  const reelPlanLimit = wallet ? Number(wallet.reelDailyLimit) : (REEL_LIMITS[currentShop.plan] || 1);
  const reelDailyUsed = wallet ? Number(wallet.reelDailyUsed) : reelsToday;
  const availableReelPlan = Math.max(0, reelPlanLimit - reelDailyUsed);
  
  const reelsExtra = wallet ? Number(wallet.reelExtraBalance) : (Number(currentShop.reelsExtraQuota) || 0);
  
  // Validation Flags
  const shopStatus = currentShop.status || 'ACTIVE';
  const isPenalized = currentShop.isPenalized || shopStatus === 'AGENDA_SUSPENDED';
  const isStandard = currentShop.plan === 'Estandar';
  const isAlta = currentShop.plan === 'Alta Visibilidad';
  const isMaxima = currentShop.plan === 'Maxima Visibilidad';
  
  const whatsappLimit = 3;
  const isAgendaSuspended = shopStatus === 'AGENDA_SUSPENDED';
  const canManageAgenda = shopStatus === 'ACTIVE' && !isPenalized;
  const canSchedule = canManageAgenda && availableQuota > 0;
  const canAcceptShop = shopStatus === 'PENDING_VERIFICATION' && !currentShop.ownerAcceptedAt;
  const pendingReprogramCount = myStreams.filter(s => s.status === StreamStatus.PENDING_REPROGRAMMATION).length;
  const liveCount = myStreams.filter(s => s.status === StreamStatus.LIVE).length;
  const upcomingCount = myStreams.filter(s => s.status === StreamStatus.UPCOMING).length;
  const finishedCount = myStreams.filter(s => s.status === StreamStatus.FINISHED).length;
  const missedCount = myStreams.filter(s => s.status === StreamStatus.MISSED).length;
  const publicWhatsappCount = currentShop.whatsappLines?.length || 0;
  const mapsUrl = currentShop.addressDetails?.mapsUrl || '';

  const getRestrictionMessage = () => {
      if (shopStatus === 'PENDING_VERIFICATION') return "Tu cuenta esta en verificacion. Podras agendar cuando sea activada.";
      if (shopStatus === 'HIDDEN' || shopStatus === 'BANNED') return "Tu cuenta esta bloqueada. Contacta soporte.";
      if (isAgendaSuspended) {
          const until = currentShop.agendaSuspendedUntil ? new Date(currentShop.agendaSuspendedUntil).toLocaleDateString() : 'sin fecha';
          return `Agenda suspendida hasta ${until}. Contacta soporte.`;
      }
      if (isPenalized) return "Tu cuenta esta penalizada. No puedes agendar nuevos vivos.";
      if (availableQuota <= 0) {
          if (isStandard && extraQuota === 0) return "El plan Estándar no incluye vivos. Compra cupos extras o mejora tu plan.";
          return "Has consumido todos tus cupos (Plan + Extras). Compra más para seguir agendando.";
      }
      return "";
  };
  const getStatusMessage = () => {
      if (shopStatus === 'PENDING_VERIFICATION') {
          return currentShop.ownerAcceptedAt
              ? 'Tus datos ya fueron confirmados. Espera la aprobación del administrador.'
              : 'Confirma tus datos para iniciar el proceso de aprobación.';
      }
      if (shopStatus === 'AGENDA_SUSPENDED') {
          const until = currentShop.agendaSuspendedUntil ? new Date(currentShop.agendaSuspendedUntil).toLocaleDateString() : 'sin fecha';
          return `Tu agenda está suspendida hasta ${until}. Podés seguir actualizando perfil y redes.`;
      }
      if (shopStatus === 'BANNED' || shopStatus === 'HIDDEN') {
          return 'Tu cuenta está bloqueada. Contactá soporte para revisar el caso.';
      }
      if (isPenalized) return 'Tu agenda está restringida por penalización.';
      return 'Tu cuenta está activa. Podés agendar vivos y publicar historias.';
  };

  const statusLabels: Record<string, string> = {
      ACTIVE: 'Activa',
      PENDING_VERIFICATION: 'Pendiente',
      AGENDA_SUSPENDED: 'Agenda suspendida',
      HIDDEN: 'Oculta',
      BANNED: 'Bloqueada',
  };
  const statusTones: Record<string, string> = {
      ACTIVE: styles.statusToneActive,
      PENDING_VERIFICATION: styles.statusTonePending,
      AGENDA_SUSPENDED: styles.statusToneSuspended,
      HIDDEN: styles.statusToneHidden,
      BANNED: styles.statusToneBanned,
  };
  const statusLabel = statusLabels[shopStatus] || 'Activa';
  const statusTone = statusTones[shopStatus] || statusTones.ACTIVE;
  const reelsAvailableTotal = Math.max(0, availableReelPlan + reelsExtra);
  const livePlanLimit = Math.max(
      0,
      wallet ? Number(wallet.weeklyLiveBaseLimit) : Number(currentShop.baseQuota) || 0
  );
  const livePlanUsed = Math.max(
      0,
      wallet ? Number(wallet.weeklyLiveUsed) : Math.min(usedQuota, livePlanLimit)
  );
  const livePlanUsagePercent =
      livePlanLimit > 0 ? Math.min(100, Math.round((livePlanUsed / livePlanLimit) * 100)) : 0;
  const reelPlanUsagePercent =
      reelPlanLimit > 0 ? Math.min(100, Math.round((reelDailyUsed / reelPlanLimit) * 100)) : 0;

  const parseStreamDate = (stream: Stream) => {
      if (!stream.fullDateISO) return null;
      const datePart = stream.fullDateISO.split('T')[0] || stream.fullDateISO;
      const timePart = stream.scheduledTime || '00:00';
      const parsed = new Date(`${datePart}T${timePart}:00`);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const liveNow = myStreams.find(s => s.status === StreamStatus.LIVE) || null;
  const nextUpcoming = myStreams
      .filter(s => s.status === StreamStatus.UPCOMING)
      .map(stream => ({ stream, date: parseStreamDate(stream) }))
      .sort((a, b) => {
          const aTime = a.date ? a.date.getTime() : Number.POSITIVE_INFINITY;
          const bTime = b.date ? b.date.getTime() : Number.POSITIVE_INFINITY;
          return aTime - bTime;
      })[0]?.stream || null;

  const formatStreamDate = (stream: Stream) => {
      const parsed = parseStreamDate(stream);
      if (!parsed) return stream.fullDateISO;
      return parsed.toLocaleDateString('es-AR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
      });
  };
  const todayLabel = new Date().toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
  });

  const resolveText = (value?: string) => (value || '').trim();
  const resolveNumber = (value?: number) => (typeof value === 'number' ? value : 0);
  const resolveAddressField = (field: keyof NonNullable<Shop['addressDetails']>) =>
      resolveText(shopForm.addressDetails?.[field] || currentShop.addressDetails?.[field] || '');
  const normalizedPayments = (list?: string[]) => (list || []).slice().sort().join('|');

  const identityFields = [
      resolveText(shopForm.name || currentShop.name),
      resolveText(shopForm.razonSocial || currentShop.razonSocial || ''),
      resolveText(shopForm.cuit || currentShop.cuit || ''),
  ];
  const addressFields = [
      resolveAddressField('street'),
      resolveAddressField('number'),
      resolveAddressField('city'),
      resolveAddressField('province'),
      resolveAddressField('zip'),
  ];
  const salesFields = [
      resolveNumber(
          typeof shopForm.minimumPurchase === 'number'
              ? shopForm.minimumPurchase
              : currentShop.minimumPurchase || 0
      ),
      (shopForm.paymentMethods || currentShop.paymentMethods || []).length,
  ];
  const countFilled = (values: Array<string | number>) =>
      values.filter((value) => (typeof value === 'number' ? value > 0 : value.trim().length > 0)).length;

  const identityFilled = countFilled(identityFields);
  const addressFilled = countFilled(addressFields);
  const salesFilled = countFilled(salesFields);
  const totalFields = identityFields.length + addressFields.length + salesFields.length;
  const totalFilled = identityFilled + addressFilled + salesFilled;
  const profileCompletion = totalFields > 0 ? Math.round((totalFilled / totalFields) * 100) : 0;
  const profileChecklist = [
      { key: 'identity', label: 'Identidad & Legal', filled: identityFilled, total: identityFields.length },
      { key: 'address', label: 'Dirección', filled: addressFilled, total: addressFields.length },
      { key: 'sales', label: 'Condiciones de Venta', filled: salesFilled, total: salesFields.length },
  ];
  const missingSections = profileChecklist.filter((section) => section.filled < section.total).map((section) => section.label);

  const profileDirty =
      resolveText(shopForm.name || '') !== resolveText(currentShop.name || '') ||
      resolveText(shopForm.razonSocial || '') !== resolveText(currentShop.razonSocial || '') ||
      resolveText(shopForm.cuit || '') !== resolveText(currentShop.cuit || '') ||
      resolveText(shopForm.address || '') !== resolveText(currentShop.address || '') ||
      resolveText(shopForm.addressDetails?.street || '') !== resolveText(currentShop.addressDetails?.street || '') ||
      resolveText(shopForm.addressDetails?.number || '') !== resolveText(currentShop.addressDetails?.number || '') ||
      resolveText(shopForm.addressDetails?.city || '') !== resolveText(currentShop.addressDetails?.city || '') ||
      resolveText(shopForm.addressDetails?.province || '') !== resolveText(currentShop.addressDetails?.province || '') ||
      resolveText(shopForm.addressDetails?.zip || '') !== resolveText(currentShop.addressDetails?.zip || '') ||
      resolveText(shopForm.addressDetails?.mapsUrl || '') !== resolveText(currentShop.addressDetails?.mapsUrl || '') ||
      resolveNumber(shopForm.minimumPurchase ?? 0) !== resolveNumber(currentShop.minimumPurchase ?? 0) ||
      normalizedPayments(shopForm.paymentMethods || currentShop.paymentMethods) !== normalizedPayments(currentShop.paymentMethods);

  const purchaseStatusLabels: Record<string, string> = {
      PENDING: 'Pendiente',
      APPROVED: 'Aprobada',
      REJECTED: 'Rechazada',
  };

  const purchaseTypeLabels: Record<string, string> = {
      LIVE_PACK: 'Cupos de vivos',
      REEL_PACK: 'Cupos de historias',
      PLAN_UPGRADE: 'Upgrade de plan',
  };

  const formatPurchaseDate = (value?: string) => {
      if (!value) return '';
      try {
          return new Date(value).toLocaleDateString('es-AR', { dateStyle: 'short' });
      } catch {
          return value;
      }
  };

  const formatNotificationDate = (value?: string) => {
      if (!value) return '';
      try {
          return new Date(value).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
      } catch {
          return value;
      }
  };

  const unreadNotifications = notifications.filter((note) => !note.read);

  useEffect(() => {
      if (shopStatus === 'PENDING_VERIFICATION') {
          setShowPendingNotice(true);
      }
  }, [shopStatus]);

  const handleAcceptShop = async () => {
      if (blockPreviewAction()) return;
      try {
          await acceptShop(currentShop.id);
          setNotice({
              title: 'Datos confirmados',
              message: 'Tu aceptación fue registrada. Espera la aprobación del administrador.',
              tone: 'success',
          });
          onRefreshData();
      } catch (error) {
          setNotice({
              title: 'No se pudo confirmar',
              message: 'Intenta nuevamente.',
              tone: 'error',
          });
      } finally {
          setShowPendingNotice(false);
      }
  };

  useEffect(() => {
      if (activeTabProp && activeTabProp !== activeTab) {
          setActiveTab(activeTabProp);
      }
  }, [activeTabProp, activeTab]);

  const setTab = (tab: Tab) => {
      setActiveTab(tab);
      onTabChange?.(tab);
  };

  // --- HELPERS ---
  const isSensitiveLocked = isPreview && !adminOverride;
  const isCommercialLocked = isPreview && !adminOverride;
  const isProfileLocked = isSensitiveLocked;
  const guardSensitiveEdit = () => {
      if (!isSensitiveLocked) return false;
      setNotice({
          title: 'Edicion restringida',
          message: 'Estos datos son validados por administracion. Contacta soporte para cambios.',
          tone: 'warning',
      });
      return true;
  };
  const guardCommercialEdit = () => {
      if (!isCommercialLocked) return false;
      setNotice({
          title: 'Accion bloqueada',
          message: 'Modo vista tecnica. Esta accion no esta disponible.',
          tone: 'warning',
      });
      return true;
  };
  const handleInputChange = (
      field: keyof Shop,
      value: any,
      options?: { sensitive?: boolean }
  ) => {
      const isSensitive = options?.sensitive ?? true;
      if (isSensitive && isSensitiveLocked) return;
      if (!isSensitive && isCommercialLocked) return;
      setShopForm(prev => ({ ...prev, [field]: value }));
  };
  const handleAddressChange = (field: string, value: string) => {
      if (isSensitiveLocked) return;
      setShopForm(prev => ({
          ...prev,
          addressDetails: {
              ...(prev.addressDetails || currentShop.addressDetails || { street: '', number: '', city: '', province: '', zip: '', mapsUrl: '' }),
              [field]: value
          }
      }));
  };
  const handleAddressSelect = (details: { street: string; number: string; city: string; province: string; zip: string }) => {
      if (isSensitiveLocked) return;
      const existingMapsUrl = (shopForm.addressDetails || currentShop.addressDetails || {}).mapsUrl || '';
      setShopForm(prev => ({
          ...prev,
          addressDetails: { ...details, mapsUrl: existingMapsUrl },
          address: `${details.street} ${details.number}, ${details.city}`
      }));
  };
  const togglePaymentMethod = (method: string) => {
      if (guardCommercialEdit()) return;
      const current = shopForm.paymentMethods || [];
      const updated = current.includes(method) ? current.filter(m => m !== method) : [...current, method];
      handleInputChange('paymentMethods', updated, { sensitive: false });
  };
  const saveShopProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if (blockPreviewAction()) return;
      const newAddress = shopForm.addressDetails 
        ? `${shopForm.addressDetails.street} ${shopForm.addressDetails.number}, ${shopForm.addressDetails.city}`
        : currentShop.address;
      const ok = await onShopUpdate({ ...currentShop, ...shopForm, address: newAddress });
      if (!ok) return;
      setNotice({
          title: 'Datos actualizados',
          message: 'La información de la tienda se guardó correctamente.',
          tone: 'success',
      });
  };

  // --- REELS HANDLERS ---
  const uploadReelFiles = async (files: FileList | null, mode: 'VIDEO' | 'PHOTO_SET') => {
      if (!files || files.length === 0) return;
      if (blockPreviewAction()) return;
      if (!currentShop.id || currentShop.id === 'empty') return;

      const list = Array.from(files);
      const limited = mode === 'PHOTO_SET' ? list.slice(0, 5) : list.slice(0, 1);
      setIsReelUploading(true);

        try {
            const result = await uploadReelMedia({
                shopId: currentShop.id,
                type: mode,
                files: limited,
            });

            if (result?.processing) {
                setReelProcessingJobId(result?.jobId || null);
                setReelMode(mode);
                setReelPhotoUrls([]);
                setReelUrl('');
                setNotice({
                    title: 'Procesando video',
                    message: 'Tu video es pesado. Lo procesaremos en segundo plano y la historia se activará cuando termine.',
                    tone: 'info',
                });
            } else if (mode === 'VIDEO') {
                setReelProcessingJobId(null);
                setReelMode('VIDEO');
                setReelPhotoUrls([]);
                setReelUrl(result?.videoUrl || '');
                setNotice({
                    title: 'Archivos cargados',
                    message: 'Tu video se subió correctamente.',
                    tone: 'success',
                });
            } else {
                setReelProcessingJobId(null);
                setReelMode('PHOTO_SET');
                setReelPhotoUrls(Array.isArray(result?.photoUrls) ? result.photoUrls : []);
                setReelUrl('');
                setNotice({
                    title: 'Archivos cargados',
                    message: 'Tus fotos se subieron correctamente.',
                    tone: 'success',
                });
            }
        } catch (error: any) {
            setNotice({
                title: 'Error de carga',
                message: error?.message || 'No se pudo subir el archivo.',
              tone: 'error',
          });
      } finally {
          setIsReelUploading(false);
      }
  };

  const handleUploadReel = async () => {
      if (blockPreviewAction()) return;
    const isProcessingVideo = reelMode === 'VIDEO' && !reelUrl && Boolean(reelProcessingJobId);
    if ((!reelUrl && reelPhotoUrls.length === 0 && !isProcessingVideo) || !reelPlatform) {
        setNotice({
            title: 'Datos incompletos',
            message: 'Completa el contenido y la plataforma.',
            tone: 'warning',
        });
        return;
    }
    const result = await createReel({
        shopId: currentShop.id,
        type: reelMode,
        videoUrl: reelMode === 'VIDEO' ? reelUrl : undefined,
        photoUrls: reelMode === 'PHOTO_SET' ? reelPhotoUrls : undefined,
        durationSeconds: 10,
        platform: reelPlatform as SocialPlatform,
        isAdminOverride: adminOverride,
        status: isProcessingVideo ? 'PROCESSING' : undefined,
        processingJobId: isProcessingVideo ? reelProcessingJobId || undefined : undefined,
    });
    if (result.success) {
        setNotice({
            title: 'Historia publicada',
            message: result.message,
            tone: 'success',
        });
        setReelUrl('');
        setReelPhotoUrls([]);
        setReelMode('VIDEO');
        setReelPlatform('');
        setReelProcessingJobId(null);
        if (onReelChange) onReelChange();
        const myReels = await fetchReelsByShop(currentShop.id);
        setShopReels(myReels);
      } else {
          setNotice({
              title: 'No se pudo publicar',
              message: result.message,
              tone: 'error',
          });
      }
  };

  // --- STREAM FORM HANDLERS ---
  const handleCreateClick = () => {
      if (blockPreviewAction()) return;
      if (!canSchedule) return;
      setFormTitle(''); setFormDate(''); setFormTime(''); setFormPlatform(''); setEditingStream(null);
      setShowCreateModal(true);
  };
  const handleConfirmStream = async () => { 
      if (blockPreviewAction()) return;
      if(!formTitle || !formTime || !formPlatform || !formDate) {
          setNotice({
              title: 'Campos obligatorios',
              message: 'Completa título, fecha, hora y plataforma.',
              tone: 'warning',
          });
          return;
      }
      const fullDateISO = new Date(`${formDate}T${formTime}`).toISOString();
      const selectedDateStr = fullDateISO.split('T')[0];
      const hasStreamOnDate = myStreams.some(s => {
          if (editingStream && s.id === editingStream.id) return false;
          if (![StreamStatus.UPCOMING, StreamStatus.LIVE, StreamStatus.PENDING_REPROGRAMMATION].includes(s.status)) return false;
          return s.fullDateISO.split('T')[0] === selectedDateStr;
      });
      if (hasStreamOnDate) {
          setNotice({
              title: 'Límite diario',
              message: `Ya tienes un vivo programado para el ${selectedDateStr}.`,
              tone: 'warning',
          });
          return;
      }
      const handle = currentShop.socialHandles ? currentShop.socialHandles[formPlatform.toLowerCase() as keyof SocialHandles] : '';
      if (!handle) {
          setNotice({
              title: 'Red social requerida',
              message: `Configura tu usuario de ${formPlatform} en la pestaña 'Mis Redes' antes de agendar.`,
              tone: 'warning',
          });
          return;
      }
      let url = '';
      if (formPlatform === 'Instagram') url = `https://instagram.com/${handle}/live`;
      else if (formPlatform === 'TikTok') url = `https://tiktok.com/@${handle}/live`;
      
      const nextStatus = editingStream?.status === StreamStatus.PENDING_REPROGRAMMATION
        ? StreamStatus.UPCOMING
        : editingStream?.status;
      const streamData = { title: formTitle, fullDateISO, scheduledTime: formTime, platform: formPlatform as SocialPlatform, url, extensionCount: editingStream ? editingStream.extensionCount : 0, status: nextStatus };
      
      if (editingStream) { 
          const ok = await onStreamUpdate({ ...editingStream, ...streamData }); 
          if (!ok) return;
      } else { 
          const ok = await onStreamCreate({ id: `new-${Date.now()}`, shop: currentShop, shopId: currentShop.id, coverImage: getShopCoverUrl(currentShop), status: StreamStatus.UPCOMING, views: 0, reportCount: 0, isVisible: true, likes: 0, extensionCount: 0, ...streamData });
          if (!ok) return;
      }
      setShowCreateModal(false);
  };
  const saveSocials = async (e: React.FormEvent) => {
      e.preventDefault();
      if (blockPreviewAction()) return;
      if (guardSensitiveEdit()) return;
      const validWaLines: WhatsappLine[] = [];
      for (const line of waLines.slice(0, whatsappLimit)) {
          if (line.number.trim()) {
              if (!line.label) {
                  setNotice({
                      title: 'Etiqueta requerida',
                      message: `Selecciona etiqueta para el WhatsApp: ${line.number}`,
                      tone: 'warning',
                  });
                  return;
              }
              validWaLines.push({ label: line.label as WhatsappLabel, number: line.number });
          }
      }
      const ok = await onShopUpdate({ ...currentShop, socialHandles: socials, whatsappLines: validWaLines, website: shopForm.website });
      if (!ok) return;
      setNotice({
          title: 'Cambios guardados',
          message: 'Redes y contactos actualizados.',
          tone: 'success',
      });
  };
  const openEditModal = (stream: Stream) => {
      if (blockPreviewAction()) return;
      if (!canManageAgenda) {
          setNotice({
              title: 'Agenda no disponible',
              message: getRestrictionMessage() || 'Agenda no disponible.',
              tone: 'warning',
          });
          return;
      }
      setFormTitle(stream.title);
      const dateObj = new Date(stream.fullDateISO);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      setFormDate(`${year}-${month}-${day}`);
      setFormTime(stream.scheduledTime);
      setFormPlatform(stream.platform);
      setEditingStream(stream);
      setShowCreateModal(true);
  };
  const openPlanUpgradeModal = () => setShowPlanUpgradeModal(true);

  // --- STREAM FORM STATES ---
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formPlatform, setFormPlatform] = useState<SocialPlatform | ''>('');

  const primaryActionLabel = liveNow
      ? 'Gestionar vivo'
      : nextUpcoming
          ? 'Ver agenda'
          : 'Agendar vivo';
  const PrimaryActionIcon = liveNow ? Radio : nextUpcoming ? LayoutDashboard : Plus;
  const primaryActionClick = liveNow || nextUpcoming ? () => setTab('VIVOS') : handleCreateClick;
  const primaryActionDisabled = !liveNow && !nextUpcoming ? (!canSchedule || isPreview) : false;

  return (
    <div className={styles.root}>
      
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
              <div className={styles.sidebarLogoWrap}>
                  <LogoBubble
                    src={currentShop.logoUrl}
                    alt={currentShop.name}
                    size={76}
                    seed={currentShop.id || currentShop.name}
                  />
              </div>
              <h2 className={styles.sidebarTitle}>{currentShop.name}</h2>
              <p className={styles.sidebarPlan}>{currentShop.plan}</p>
              <div className={`${styles.sidebarStatus} ${statusTone}`}>
                  {statusLabel}
              </div>
          </div>
          <nav className={styles.sidebarNav}>
               <button onClick={() => setTab('RESUMEN')} className={`${styles.navButton} ${activeTab === 'RESUMEN' ? styles.navButtonActive : styles.navButtonInactive}`}>
                   <LayoutDashboard size={18}/> Inicio / Resumen
               </button>
               <button onClick={() => setTab('REDES')} className={`${styles.navButton} ${activeTab === 'REDES' ? styles.navButtonActive : styles.navButtonInactive}`}>
                   <Globe size={18}/> Mis Redes
               </button>
               <button onClick={() => setTab('VIVOS')} className={`${styles.navButton} ${activeTab === 'VIVOS' ? styles.navButtonActive : styles.navButtonInactive}`}>
                   <Radio size={18}/> Mis Vivos
               </button>
               <button onClick={() => setTab('REELS')} className={`${styles.navButton} ${activeTab === 'REELS' ? styles.navButtonActive : styles.navButtonInactive}`}>
                   <Film size={18}/> Mis Historias
               </button>
               <button onClick={() => setTab('PERFIL')} className={`${styles.navButton} ${activeTab === 'PERFIL' ? styles.navButtonActive : styles.navButtonInactive}`}>
                   <Store size={18}/> Datos Tienda
               </button>
          </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className={styles.main}>
          {activeTab !== 'RESUMEN' && activeTab !== 'PERFIL' && (
              <div className={styles.mobileHeader}>
                  <div className={styles.mobileCard}>
                      <LogoBubble
                        src={currentShop.logoUrl}
                        alt={currentShop.name}
                        size={56}
                        seed={currentShop.id || currentShop.name}
                      />
                      <div className={styles.mobileBody}>
                          <p className={styles.mobileLabel}>Tienda</p>
                          <h2 className={styles.mobileTitle}>{currentShop.name}</h2>
                          <p className={styles.mobilePlan}>{currentShop.plan}</p>
                      </div>
                      <div className={`${styles.mobileStatus} ${statusTone}`}>
                          {statusLabel}
                      </div>
                  </div>
                  <div className={styles.mobileActions}>
                      <button
                          onClick={() => setTab('VIVOS')}
                          className={styles.mobileActionButton}
                      >
                          Gestionar vivos
                      </button>
                      <button
                          onClick={() => setTab('PERFIL')}
                          className={styles.mobileActionButton}
                      >
                          Editar perfil
                      </button>
                  </div>
              </div>
          )}
          
          {/* TAB 1: RESUMEN (HOME) */}
          {activeTab === 'RESUMEN' && (
              <div className={styles.summarySection}>
                  <header className={styles.summaryHeader}>
                      <h1 className={styles.summaryTitle}>Panel de Control</h1>
                      <p className={styles.summarySubtitle}>Todo lo que necesitas para vender en vivo, en un solo lugar.</p>
                  </header>

                  <div className={styles.summaryHeroGrid}>
                      <section className={styles.summaryHeroCard}>
                          <div className={styles.summaryHeroTop}>
                              <LogoBubble
                                src={currentShop.logoUrl}
                                alt={currentShop.name}
                                size={60}
                                seed={currentShop.id || currentShop.name}
                              />
                              <div className={styles.summaryHeroMeta}>
                                  <p className={styles.summaryHeroLabel}>Tienda</p>
                                  <h2 className={styles.summaryHeroTitle}>{currentShop.name}</h2>
                                  <div className={styles.summaryHeroBadges}>
                                      <span className={styles.summaryHeroPlan}>{currentShop.plan}</span>
                                      <span className={`${styles.statusTag} ${statusTone}`}>{statusLabel}</span>
                                  </div>
                                  {currentShop.ownerAcceptedAt && (
                                      <span className={styles.statusConfirmed}>
                                          Datos confirmados {new Date(currentShop.ownerAcceptedAt).toLocaleDateString('es-AR')}
                                      </span>
                                  )}
                              </div>
                          </div>
                          <p className={styles.summaryHeroMessage}>{getStatusMessage()}</p>
                          <div className={styles.summaryHeroActions}>
                              {canAcceptShop && (
                                  <Button size="sm" onClick={handleAcceptShop} className={styles.primaryActionButton}>
                                      Confirmar datos
                                  </Button>
                              )}
                              <Button
                                  size="md"
                                  className={styles.summaryHeroPrimary}
                                  onClick={primaryActionClick}
                                  disabled={primaryActionDisabled}
                              >
                                  <PrimaryActionIcon size={14} className={styles.buttonIcon}/> {primaryActionLabel}
                              </Button>
                              <Button
                                  size="md"
                                  variant="outline"
                                  className={styles.summaryHeroSecondary}
                                  onClick={() => setTab('REELS')}
                              >
                                  <Film size={14} className={styles.buttonIcon}/> Subir historia
                              </Button>
                              <Button
                                  size="md"
                                  variant="outline"
                                  className={styles.summaryHeroSecondary}
                                  onClick={() => setTab('PERFIL')}
                              >
                                  Editar perfil
                              </Button>
                          </div>
                          {!canSchedule && (
                              <div className={styles.summaryHeroHint}>{getRestrictionMessage()}</div>
                          )}
                      </section>

                      <section className={styles.summaryTodayCard}>
                          <div className={styles.summaryTodayHeader}>
                              <span className={styles.summaryTodayLabel}>Hoy</span>
                              <span className={styles.summaryTodayDate}>{todayLabel}</span>
                          </div>
                          <div className={styles.summaryTodayFocus}>
                              <p className={styles.summaryTodayStatLabel}>Actividad de hoy</p>
                              <div className={styles.summaryTodayFocusRow}>
                                  <span>Historias publicadas</span>
                                  <span className={styles.summaryTodayFocusValue}>{reelsToday}</span>
                              </div>
                              <div className={styles.summaryTodayFocusRow}>
                                  <span>Vivos activos</span>
                                  <span className={styles.summaryTodayFocusValue}>{liveCount}</span>
                              </div>
                          </div>
                          <div className={styles.summaryNextLive}>
                              {liveNow ? (
                                  <>
                                      <p className={styles.summaryNextLiveLabel}>En vivo ahora</p>
                                      <p className={styles.summaryNextLiveTitle}>{liveNow.title || 'Vivo en curso'}</p>
                                      <p className={styles.summaryNextLiveMeta}>{liveNow.platform}</p>
                                      <Button size="sm" variant="outline" onClick={() => setTab('VIVOS')} className={styles.summaryNextLiveAction}>
                                          Ver agenda
                                      </Button>
                                  </>
                              ) : nextUpcoming ? (
                                  <>
                                      <p className={styles.summaryNextLiveLabel}>Proximo vivo</p>
                                      <p className={styles.summaryNextLiveTitle}>{nextUpcoming.title || 'Vivo programado'}</p>
                                      <p className={styles.summaryNextLiveMeta}>
                                          {formatStreamDate(nextUpcoming)} · {nextUpcoming.scheduledTime}
                                      </p>
                                      <Button size="sm" variant="outline" onClick={() => setTab('VIVOS')} className={styles.summaryNextLiveAction}>
                                          Ver agenda
                                      </Button>
                                  </>
                              ) : (
                                  <>
                                      <p className={styles.summaryNextLiveLabel}>Agenda vacia</p>
                                      <p className={styles.summaryNextLiveMeta}>Todavia no hay vivos programados.</p>
                                      <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={handleCreateClick}
                                          disabled={!canSchedule || isPreview}
                                          className={styles.summaryNextLiveAction}
                                      >
                                          Agendar ahora
                                      </Button>
                                  </>
                              )}
                          </div>
                      </section>
                  </div>

                  {/* PENALTY ALERT */}
                  {(isPenalized || shopStatus !== 'ACTIVE') && (
                      <div className={styles.penaltyAlert}>
                          <AlertOctagon className={styles.penaltyIcon} />
                          <div>
                              <h3 className={styles.penaltyTitle}>{shopStatus === 'PENDING_VERIFICATION' ? 'Cuenta en Verificacion' : 'Agenda Restringida'}</h3>
                              <p className={styles.penaltyText}>
                                  {getRestrictionMessage()}
                              </p>
                              <div className={styles.penaltyReason}>
                                  {currentShop.agendaSuspendedReason || currentShop.penalties.find(p => p.active)?.reason || 'Motivo: estado restringido.'}
                              </div>
                          </div>
                      </div>
                  )}

                  <div className={styles.summaryOpsGrid}>
                      <section className={styles.summaryQuotaCard}>
                          <div className={styles.summaryCardHeader}>
                              <div>
                                  <h3 className={styles.summaryCardTitle}>Disponibilidad</h3>
                                  <p className={styles.summaryCardSubtitle}>Cupos de vivos e historias</p>
                              </div>
                              <div className={styles.summaryCardActions}>
                                  <Button
                                      size="sm"
                                      onClick={openBuyModal}
                                      disabled={isAgendaSuspended || isPreview}
                                      className={styles.summaryActionGreen}
                                  >
                                      <ShoppingCart size={14} className={styles.buttonIcon}/> Comprar extras
                                  </Button>
                              </div>
                          </div>
                          <div className={styles.summaryQuotaRows}>
                              <div className={styles.summaryQuotaRow}>
                                  <div className={styles.summaryQuotaMain}>
                                      <p className={styles.summaryQuotaLabel}>Vivos disponibles</p>
                                      <p className={styles.summaryQuotaValue}>{isNaN(availableQuota) ? 0 : availableQuota}</p>
                                      <p className={styles.summaryQuotaMeta}>Plan {livePlanLimit} · Usados {livePlanUsed} · Extras {extraQuota}</p>
                                  </div>
                                  <div className={styles.summaryQuotaActions}>
                                      <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={openBuyModal}
                                          disabled={isAgendaSuspended || isPreview}
                                      >
                                          Comprar cupos
                                      </Button>
                                  </div>
                                  <div className={styles.summaryProgress}>
                                      <span className={styles.summaryProgressFill} style={{ width: `${livePlanUsagePercent}%` }} />
                                  </div>
                              </div>
                              <div className={styles.summaryQuotaDivider} />
                              <div className={styles.summaryQuotaRow}>
                                  <div className={styles.summaryQuotaMain}>
                                      <p className={styles.summaryQuotaLabel}>Historias disponibles</p>
                                      <p className={styles.summaryQuotaValue}>{reelsAvailableTotal}</p>
                                      <p className={styles.summaryQuotaMeta}>Plan {reelPlanLimit} · Usadas {reelDailyUsed} · Extras {reelsExtra}</p>
                                  </div>
                                  <div className={styles.summaryQuotaActions}>
                                      <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={openBuyReelModal}
                                          disabled={isPreview}
                                      >
                                          Comprar historias
                                      </Button>
                                  </div>
                                  <div className={styles.summaryProgress}>
                                      <span className={styles.summaryProgressFill} style={{ width: `${reelPlanUsagePercent}%` }} />
                                  </div>
                              </div>
                          </div>
                          {(availableQuota <= 0 || reelsAvailableTotal <= 0) && (
                              <div className={styles.summaryQuotaNotice}>
                                  {availableQuota <= 0
                                      ? 'Te quedaste sin cupos de vivos. Compra extras o mejora tu plan.'
                                      : 'Te quedaste sin historias disponibles. Compra extras para publicar hoy.'}
                              </div>
                          )}
                      </section>

                      <section className={styles.summaryAgendaCard}>
                          <div className={styles.summaryCardHeader}>
                              <div>
                                  <h3 className={styles.summaryCardTitle}>Agenda</h3>
                                  <p className={styles.summaryCardSubtitle}>Estado de tus vivos</p>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => setTab('VIVOS')} className={styles.summaryAgendaButton}>
                                  Ver agenda
                              </Button>
                          </div>
                          <div className={styles.summaryAgendaSummary}>
                              <div className={styles.summaryAgendaItem}>
                                  <span>En vivo</span>
                                  <span className={styles.summaryAgendaValue}>{liveCount}</span>
                              </div>
                              <div className={styles.summaryAgendaItem}>
                                  <span>Programados</span>
                                  <span className={styles.summaryAgendaValue}>{upcomingCount}</span>
                              </div>
                              <div className={styles.summaryAgendaItem}>
                                  <span>Reprogramar</span>
                                  <span className={styles.summaryAgendaValue}>{pendingReprogramCount}</span>
                              </div>
                          </div>
                          <div className={styles.summaryAgendaMeta}>
                              Finalizados {finishedCount} · No realizados {missedCount}
                          </div>
                          <div className={styles.summaryAgendaNext}>
                              {liveNow ? (
                                  <>
                                      <p className={styles.summaryNextLiveLabel}>En vivo ahora</p>
                                      <p className={styles.summaryNextLiveTitle}>{liveNow.title || 'Vivo en curso'}</p>
                                      <p className={styles.summaryNextLiveMeta}>{liveNow.platform}</p>
                                  </>
                              ) : nextUpcoming ? (
                                  <>
                                      <p className={styles.summaryNextLiveLabel}>Proximo vivo</p>
                                      <p className={styles.summaryNextLiveTitle}>{nextUpcoming.title || 'Vivo programado'}</p>
                                      <p className={styles.summaryNextLiveMeta}>
                                          {formatStreamDate(nextUpcoming)} · {nextUpcoming.scheduledTime}
                                      </p>
                                  </>
                              ) : (
                                  <>
                                      <p className={styles.summaryNextLiveLabel}>Agenda vacia</p>
                                      <p className={styles.summaryNextLiveMeta}>Todavia no hay vivos programados.</p>
                                      <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={handleCreateClick}
                                          disabled={!canSchedule || isPreview}
                                          className={styles.summaryNextLiveAction}
                                      >
                                          Agendar ahora
                                      </Button>
                                  </>
                              )}
                          </div>
                          {pendingReprogramCount > 0 && (
                              <p className={styles.summaryAgendaWarning}>
                                  Tenes {pendingReprogramCount} vivo{pendingReprogramCount > 1 ? 's' : ''} pendiente{pendingReprogramCount > 1 ? 's' : ''} de reprogramacion.
                              </p>
                          )}
                      </section>
                  </div>

                  <section className={styles.summaryGrowthCard}>
                      <div className={styles.summaryCardHeader}>
                          <div>
                              <h3 className={styles.summaryCardTitle}>Tu plan</h3>
                              <p className={styles.summaryCardSubtitle}>Visibilidad y beneficios activos</p>
                          </div>
                          <span className={`${styles.planBadge} ${
                              isMaxima ? styles.planBadgeMaxima :
                              isAlta ? styles.planBadgeAlta :
                              styles.planBadgeStandard
                          }`}>
                              Plan {currentShop.plan}
                          </span>
                      </div>
                      <div className={styles.summaryGrowthBody}>
                          <div className={styles.summaryGrowthMetrics}>
                              <div className={styles.summaryGrowthMetricRow}>
                                  <span>Vivos base/semana</span>
                                  <span>{isStandard ? '0' : isAlta ? '1' : '3'}</span>
                              </div>
                              <div className={styles.summaryGrowthMetricRow}>
                                  <span>Historias diarias</span>
                                  <span>{isStandard ? '1' : isAlta ? '3' : '5'}</span>
                              </div>
                              <div className={styles.summaryGrowthMetricRow}>
                                  <span>WhatsApp visible</span>
                                  <span>{isStandard ? '1' : isAlta ? '2' : '3'}</span>
                              </div>
                          </div>
                          {isStandard && (
                              <div className={styles.summaryGrowthHint}>
                                  Estas en el plan basico. Subi a Alta para mejorar visibilidad y cupos.
                              </div>
                          )}
                          {isAlta && (
                              <div className={styles.summaryGrowthHint}>
                                  Tu tienda tiene buena visibilidad. Subi a Maxima para el mejor rendimiento.
                              </div>
                          )}
                          {isMaxima && (
                              <div className={styles.summaryGrowthHint}>
                                  Estas en el nivel mas alto de visibilidad. Manten tu presencia activa.
                              </div>
                          )}
                          <p className={styles.summaryGrowthNote}>
                              Precios y upgrades se coordinan con Distrito Moda.
                          </p>
                      </div>
                      {!isMaxima && (
                          <div className={styles.summaryGrowthActions}>
                              <Button variant="secondary" size="sm" onClick={openPlanUpgradeModal} className={styles.planUpgradeButton}>
                                  Mejorar mi plan
                              </Button>
                          </div>
                      )}
                  </section>
              </div>
          )}

          {/* TAB: MIS REELS */}
          {activeTab === 'REELS' && (
            <Suspense fallback={<div className={styles.reelsSection} />}>
              <MerchantReelsTab
                availableReelPlan={availableReelPlan}
                reelsExtra={reelsExtra}
                openBuyReelModal={openBuyReelModal}
                isPreview={isPreview}
                reelMode={reelMode}
                setReelMode={setReelMode}
                reelUrl={reelUrl}
                setReelUrl={setReelUrl}
                reelPhotoUrls={reelPhotoUrls}
                uploadReelFiles={uploadReelFiles}
                isReelUploading={isReelUploading}
                reelPlatform={reelPlatform}
                setReelPlatform={setReelPlatform}
                handleUploadReel={handleUploadReel}
                shopReels={shopReels}
              />
            </Suspense>
          )}

          {/* TAB 2: MIS REDES (KEEP EXISTING) */}
          {activeTab === 'REDES' && (
              <div className={styles.socialsSection}>
                  <header className={styles.socialsHeader}>
                      <h1 className={styles.socialsTitle}>Mis Redes</h1>
                      <p className={styles.socialsSubtitle}>Configura dónde transmitirás tus vivos y cómo te contactan.</p>
                  </header>
                  <div className={styles.socialsCard}>
                      <form onSubmit={saveSocials} className={styles.socialsForm}>
                           <div className={styles.socialsGroup}>
                               <h3 className={styles.socialsGroupTitle}><Phone size={18}/> WhatsApp</h3>
                               {waLines.map((line, idx) => {
                                   const isDisabled = idx >= whatsappLimit;
                                   return (
                                   <div key={idx} className={`${styles.socialsRow} ${isDisabled ? styles.socialsRowDisabled : ''}`}>
                                       <select 
                                            value={line.label} 
                                            onChange={e => {
                                                const newLines = [...waLines];
                                                newLines[idx].label = e.target.value as WhatsappLabel;
                                                setWaLines(newLines);
                                            }}
                                            disabled={isDisabled || isProfileLocked}
                                            className={styles.socialsSelect}
                                       >
                                           <option value="">Etiqueta...</option>
                                           {WA_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
                                       </select>
                                       <input 
                                            type="text" 
                                            value={line.number} 
                                            onChange={e => {
                                                const newLines = [...waLines];
                                                newLines[idx].number = e.target.value;
                                                setWaLines(newLines);
                                            }}
                                            disabled={isDisabled || isProfileLocked}
                                            className={styles.socialsInput}
                                            placeholder="54911..."
                                        />
                                   </div>
                               )})}
                           </div>
                           <div className={`${styles.socialsGroup} ${styles.socialsGroupSpaced}`}>
                               <h3 className={styles.socialsGroupTitle}><Globe size={18}/> Redes Sociales</h3>
                               <div className={styles.socialsGrid}>
                                   <label className={styles.socialsItem}>
                                       <div className={`${styles.profileSocialIcon} ${styles.profileSocialInstagram}`}><Instagram size={16}/></div>
                                       <input type="text" value={socials.instagram || ''} onChange={e => setSocials({...socials, instagram: e.target.value})} className={styles.socialsInput} placeholder="Usuario Instagram (sin @)" disabled={isProfileLocked} />
                                   </label>
                                   <label className={styles.socialsItem}>
                                       <div className={`${styles.profileSocialIcon} ${styles.profileSocialTiktok}`}><span className={styles.profileSocialTiktokLabel}>Tk</span></div>
                                       <input type="text" value={socials.tiktok || ''} onChange={e => setSocials({...socials, tiktok: e.target.value})} className={styles.socialsInput} placeholder="Usuario TikTok (sin @)" disabled={isProfileLocked} />
                                   </label>
                                   <label className={styles.socialsItem}>
                                       <div className={`${styles.profileSocialIcon} ${styles.profileSocialFacebook}`}><Facebook size={16}/></div>
                                       <input type="text" value={socials.facebook || ''} onChange={e => setSocials({...socials, facebook: e.target.value})} className={styles.socialsInput} placeholder="Página Facebook" disabled={isProfileLocked} />
                                   </label>
                                   <label className={styles.socialsItem}>
                                       <div className={`${styles.profileSocialIcon} ${styles.profileSocialYoutube}`}><Video size={16}/></div>
                                       <input type="text" value={socials.youtube || ''} onChange={e => setSocials({...socials, youtube: e.target.value})} className={styles.socialsInput} placeholder="Canal YouTube" disabled={isProfileLocked} />
                                   </label>
                                   <label className={styles.socialsItem}>
                                       <div className={`${styles.profileSocialIcon} ${styles.profileSocialWeb}`}><ExternalLink size={16}/></div>
                                       <input
                                           type="text"
                                           value={shopForm.website || ''}
                                           onChange={e => handleInputChange('website', e.target.value)}
                                           className={styles.socialsInput}
                                           placeholder="https://tuweb.com"
                                           disabled={isProfileLocked}
                                       />
                                   </label>
                               </div>
                           </div>
                           <div className={styles.socialsActionRow}>
                               <Button type="submit" disabled={isProfileLocked}><Save size={16} className={styles.buttonIcon}/> Guardar Cambios</Button>
                           </div>
                      </form>
                  </div>
              </div>
          )}

          {/* TAB 3: MIS VIVOS (KEEP EXISTING) */}
          {activeTab === 'VIVOS' && (
            <Suspense fallback={<div className={styles.streamsSection} />}>
              <MerchantStreamsTab
                myStreams={myStreams}
                canSchedule={canSchedule}
                canManageAgenda={canManageAgenda}
                availableQuota={availableQuota}
                pendingReprogramCount={pendingReprogramCount}
                handleCreateClick={handleCreateClick}
                getRestrictionMessage={getRestrictionMessage}
                onExtendStream={onExtendStream}
                openEditModal={openEditModal}
                setConfirmDialog={setConfirmDialog}
                onStreamDelete={onStreamDelete}
              />
            </Suspense>
          )}

          {/* TAB 4: PERFIL (KEEP EXISTING) */}
          {activeTab === 'PERFIL' && (
              <div className={styles.profileSection}>
                  <header className={styles.profileHeader}>
                      <h1 className={styles.profileTitle}>Datos de Tienda</h1>
                      <p className={styles.profileSubtitle}>Información legal, ubicación y condiciones de venta.</p>
                  </header>

                  <div id="profile-public" className={styles.profileCard}>
                      <p className={styles.profileLabel}>Vista pública</p>
                      <div className={styles.profileSummary}>
                          <LogoBubble
                            src={currentShop.logoUrl}
                            alt={currentShop.name}
                            size={64}
                            seed={currentShop.id || currentShop.name}
                          />
                          <div className={styles.profileSummaryBody}>
                              <p className={styles.profileName}>{currentShop.name}</p>
                              <p className={styles.profileAddress}>{currentShop.address || 'Dirección sin definir'}</p>
                              <p className={styles.profileMeta}>WhatsApp visibles: {publicWhatsappCount}</p>
                          </div>
                          <div className={`${styles.profileBadge} ${statusTone}`}>
                              {statusLabel}
                          </div>
                      </div>
                      <div className={styles.profileTags}>
                          <span className={styles.profileTag}>Mínimo: ${currentShop.minimumPurchase || 0}</span>
                          <span className={styles.profileTag}>{currentShop.plan}</span>
                      </div>
                      <div className={styles.profileLinks}>
                          {mapsUrl && (
                              <a
                                  href={mapsUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={styles.profileMapsLink}
                              >
                                  Ver en Maps <ExternalLink size={12} />
                              </a>
                          )}
                      </div>
                  </div>

                  <form onSubmit={saveShopProfile} className={styles.profileForm}>
                      <div className={styles.profileActionBar}>
                          <div className={styles.profileActionInfo}>
                              <p className={styles.profileActionTitle}>Perfil {profileCompletion}% completo</p>
                              <p className={styles.profileActionHint}>
                                  {missingSections.length === 0
                                      ? 'Perfil listo para publicar.'
                                      : `Faltan ${missingSections.length} secciones por completar.`}
                              </p>
                          </div>
                          <div className={styles.profileActionProgress}>
                              <div className={styles.profileActionBarTrack}>
                                  <span style={{ width: `${profileCompletion}%` }} />
                              </div>
                              <p className={styles.profileActionMeta}>
                                  {profileDirty ? 'Hay cambios sin guardar.' : 'Todo está guardado.'}
                              </p>
                          </div>
                          <div className={styles.profileActionButtons}>
                              <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                      const target = document.getElementById('profile-public');
                                      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }}
                              >
                                  Ver vista pública
                              </Button>
                              <Button type="submit" size="sm" disabled={isCommercialLocked}>
                                  <Save size={16} className={styles.buttonIcon}/> Guardar cambios
                              </Button>
                          </div>
                      </div>

                      <section className={styles.profileAccordion}>
                          <button
                              type="button"
                              className={styles.profileAccordionHeader}
                              onClick={() => setActiveProfileSection('identity')}
                          >
                              <div className={styles.profileAccordionTitle}><Store size={18}/> Identidad & Legal</div>
                          </button>
                          {activeProfileSection === 'identity' && (
                              <div className={styles.profileAccordionBody}>
                                  <div className={styles.profileGridTwo}>
                                      <label className={styles.profileField}>
                                          <span className={styles.profileInputLabel}>Nombre de Fantasía</span>
                                          <input type="text" value={shopForm.name || ''} onChange={e => handleInputChange('name', e.target.value)} className={styles.profileInputMuted} readOnly={isProfileLocked} />
                                      </label>
                                      <label className={styles.profileField}>
                                          <span className={styles.profileInputLabel}>Razón Social</span>
                                          <input type="text" value={shopForm.razonSocial || ''} onChange={e => handleInputChange('razonSocial', e.target.value)} className={styles.profileInput} readOnly={isProfileLocked} />
                                      </label>
                                      <label className={styles.profileField}>
                                          <span className={styles.profileInputLabel}>CUIT</span>
                                          <input type="text" value={shopForm.cuit || ''} onChange={e => handleInputChange('cuit', e.target.value)} className={styles.profileInput} readOnly={isProfileLocked} />
                                      </label>
                                  </div>
                              </div>
                          )}
                      </section>

                      <section className={styles.profileAccordion}>
                          <button
                              type="button"
                              className={styles.profileAccordionHeader}
                              onClick={() => setActiveProfileSection('address')}
                          >
                              <div className={styles.profileAccordionTitle}><MapPin size={18}/> Dirección Física</div>
                          </button>
                          {activeProfileSection === 'address' && (
                              <div className={styles.profileAccordionBody}>
                                  <div className={styles.profileGridThree}>
                                      <div className={styles.profileFieldWide}>
                                          <label className={styles.profileInputLabel}>Buscador (Google Maps Simulado)</label>
                                          {isProfileLocked ? (
                                              <input
                                                  type="text"
                                                  value={shopForm.address || currentShop.address || ''}
                                                  className={styles.profileInput}
                                                  readOnly
                                              />
                                          ) : (
                                              <AddressAutocomplete onSelect={handleAddressSelect} />
                                          )}
                                      </div>
                                      <label className={styles.profileFieldSpanTwo}>
                                          <span className={styles.profileInputLabel}>Calle</span>
                                          <input type="text" value={shopForm.addressDetails?.street || ''} onChange={e => handleAddressChange('street', e.target.value)} className={styles.profileInput} readOnly={isProfileLocked} />
                                      </label>
                                      <label className={styles.profileField}>
                                          <span className={styles.profileInputLabel}>Número</span>
                                          <input type="text" value={shopForm.addressDetails?.number || ''} onChange={e => handleAddressChange('number', e.target.value)} className={styles.profileInput} readOnly={isProfileLocked} />
                                      </label>
                                      <label className={styles.profileField}>
                                          <span className={styles.profileInputLabel}>Localidad / Barrio</span>
                                          <input type="text" value={shopForm.addressDetails?.city || ''} onChange={e => handleAddressChange('city', e.target.value)} className={styles.profileInput} readOnly={isProfileLocked} />
                                      </label>
                                      <label className={styles.profileField}>
                                          <span className={styles.profileInputLabel}>Provincia</span>
                                          <input type="text" value={shopForm.addressDetails?.province || ''} onChange={e => handleAddressChange('province', e.target.value)} className={styles.profileInput} readOnly={isProfileLocked} />
                                      </label>
                                      <label className={styles.profileField}>
                                          <span className={styles.profileInputLabel}>CP</span>
                                          <input type="text" value={shopForm.addressDetails?.zip || ''} onChange={e => handleAddressChange('zip', e.target.value)} className={styles.profileInput} readOnly={isProfileLocked} />
                                      </label>
                                      <label className={styles.profileFieldSpanThree}>
                                          <span className={styles.profileInputLabel}>Link Google Maps</span>
                                          <input
                                              type="text"
                                              value={shopForm.addressDetails?.mapsUrl || ''}
                                              onChange={e => handleAddressChange('mapsUrl', e.target.value)}
                                              className={styles.profileInput}
                                              placeholder="https://maps.google.com/..."
                                              readOnly={isProfileLocked}
                                          />
                                      </label>
                                  </div>
                              </div>
                          )}
                      </section>

                      <section className={styles.profileAccordion}>
                          <button
                              type="button"
                              className={styles.profileAccordionHeader}
                              onClick={() => setActiveProfileSection('sales')}
                          >
                              <div className={styles.profileAccordionTitle}><CreditCard size={18}/> Condiciones de Venta</div>
                          </button>
                          {activeProfileSection === 'sales' && (
                              <div className={styles.profileAccordionBody}>
                                  <div className={styles.profileGridTwo}>
                                      <div>
                                          <label className={styles.profileField}>
                                              <span className={styles.profileInputLabel}>Monto Mínimo de Compra ($)</span>
                                              <div className={styles.profileFieldRelative}>
                                                  <span className={styles.profilePricePrefix}>$</span>
                                                  <input type="number" value={shopForm.minimumPurchase || ''} onChange={e => handleInputChange('minimumPurchase', e.target.value ? Number(e.target.value) : 0, { sensitive: false })} className={`${styles.profileInput} pl-6`} readOnly={isCommercialLocked} />
                                              </div>
                                          </label>
                                      </div>
                                      <div>
                                          <label className={styles.profileField}>
                                              <span className={styles.profileInputLabel}>Formas de Pago Aceptadas</span>
                                          </label>
                                          <div className={styles.profileGridPayments}>
                                              {PAYMENT_OPTIONS.map(method => (
                                                  <label key={method} className={styles.profileCheckboxItem}>
                                                      <input 
                                                        type="checkbox" 
                                                        checked={(shopForm.paymentMethods || []).includes(method)}
                                                        onChange={() => togglePaymentMethod(method)}
                                                        className={styles.profileCheckboxInput}
                                                        disabled={isCommercialLocked}
                                                      />
                                                      <span>{method}</span>
                                                  </label>
                                              ))}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          )}
                      </section>
                  </form>
              </div>
          )}

      </main>

      <ShopPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        shopId={currentShop.id}
        defaultType={purchaseType}
        isPreview={isPreview}
        onNotice={(title, message, tone) =>
          setNotice({ title, message, tone })
        }
        onPurchaseSync={() => {
          void loadPurchasesOnce();
          void loadPurchases();
        }}
      />

      <PlanUpgradeModal
        isOpen={showPlanUpgradeModal}
        onClose={() => setShowPlanUpgradeModal(false)}
        shopId={currentShop.id}
        currentPlan={currentShop.plan}
        isPreview={isPreview}
        onNotice={(title, message, tone) =>
          setNotice({ title, message, tone })
        }
        onPurchaseSync={() => {
          void onRefreshData();
          void loadPurchasesOnce();
          void loadPurchases();
        }}
      />

      {/* MODAL: CREATE STREAM */}
      {showCreateModal && (
          <div className={styles.modalBackdrop}>
              <div className={`${styles.modalCard} ${styles.modalCardLarge}`}>
                  <div className={styles.modalHeaderRow}>
                      <h2 className={styles.modalTitle}>
                          {editingStream ? 'Editar Vivo' : 'Agendar Nuevo Vivo'}
                      </h2>
                      <button onClick={() => setShowCreateModal(false)} className={styles.modalClose}><X size={20}/></button>
                  </div>
                  
                  {!editingStream && (
                      <div className={styles.modalInfo}>
                          <Info size={14}/> 
                          Consumirá 1 cupo de tu saldo (Disp: {availableQuota})
                      </div>
                  )}

                  <div className={styles.modalForm}>
                      <div>
                          <label className={styles.modalLabel}>Título del Vivo</label>
                          <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className={styles.modalInput} placeholder="Ej: Nueva Temporada..." />
                      </div>
                      
                      <div className={styles.modalGridTwo}>
                          <div>
                              <label className={styles.modalLabel}>Fecha</label>
                              <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className={styles.modalInput} />
                          </div>
                          <div>
                              <label className={styles.modalLabel}>Hora</label>
                              <input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} className={styles.modalInput} />
                          </div>
                      </div>
                      
                      <div>
                          <label className={styles.modalLabel}>Plataforma</label>
                          <select value={formPlatform} onChange={(e) => setFormPlatform(e.target.value as SocialPlatform)} className={styles.modalSelect}>
                               <option value="">Seleccionar Plataforma...</option>
                               {currentShop.socialHandles?.instagram && <option value="Instagram">Instagram</option>}
                               {currentShop.socialHandles?.tiktok && <option value="TikTok">TikTok</option>}
                               {currentShop.socialHandles?.facebook && <option value="Facebook">Facebook</option>}
                               {currentShop.socialHandles?.youtube && <option value="YouTube">YouTube</option>}
                               {!currentShop.socialHandles?.instagram && !currentShop.socialHandles?.tiktok && !currentShop.socialHandles?.facebook && !currentShop.socialHandles?.youtube && (
                                   <>
                                    <option value="Instagram">Instagram (Configurar en Redes)</option>
                                    <option value="TikTok">TikTok (Configurar en Redes)</option>
                                   </>
                               )}
                          </select>
                      </div>
                      
                      <div className={styles.modalFooter}>
                          <Button type="button" onClick={handleConfirmStream} className={styles.buttonFull}>
                              {editingStream ? 'Guardar Cambios' : 'Confirmar Agenda'}
                          </Button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {confirmDialog && (
          <div className={styles.modalBackdrop}>
              <div className={styles.modalCard}>
                  <button onClick={() => setConfirmDialog(null)} className={styles.modalClose}><X size={20}/></button>
                  <h3 className={styles.modalTitle}>{confirmDialog.title}</h3>
                  <p className={styles.modalSubtitle}>{confirmDialog.message}</p>
                  <div className={styles.modalActions}>
                      <Button variant="outline" className={styles.modalActionButton} onClick={() => setConfirmDialog(null)}>
                          {confirmDialog.cancelLabel || 'Cancelar'}
                      </Button>
                      <Button
                          className={styles.modalActionPrimary}
                          onClick={() => {
                              const action = confirmDialog.onConfirm;
                              setConfirmDialog(null);
                              action();
                          }}
                      >
                          {confirmDialog.confirmLabel || 'Confirmar'}
                      </Button>
                  </div>
              </div>
          </div>
      )}

      <NoticeModal
        isOpen={Boolean(notice)}
        title={notice?.title || ''}
        message={notice?.message || ''}
        tone={notice?.tone || 'info'}
        onClose={() => setNotice(null)}
      />

      <NoticeModal
        isOpen={showPendingNotice}
        title="Cuenta pendiente"
        message={
          canAcceptShop
            ? 'Confirmá tus datos para que el administrador pueda aprobar tu tienda.'
            : 'Tus datos ya fueron confirmados. Espera la aprobación del administrador.'
        }
        tone="warning"
        onClose={() => setShowPendingNotice(false)}
        confirmLabel={canAcceptShop ? 'Confirmar datos' : 'Entendido'}
        onConfirm={canAcceptShop ? handleAcceptShop : undefined}
      />

    </div>
  );
}

