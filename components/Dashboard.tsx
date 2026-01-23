import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { getShopCoverUrl } from '../utils/shopMedia';
import { Plus, X, Instagram, Facebook, Video, AlertOctagon, Check, Save, Lock, RefreshCw, Pencil, Trash2, Star, History, LayoutDashboard, Store, Radio, Globe, Phone, MapPin, ExternalLink, User, CreditCard, ShoppingCart, AlertTriangle, Info, ArrowUpCircle, Film } from 'lucide-react';
import { StreamStatus, Shop, SocialHandles, Stream, SocialPlatform, WhatsappLine, WhatsappLabel, Reel, NotificationItem } from '../types';
import { PLANES_URL } from '../constants';
import { AddressAutocomplete } from './AddressAutocomplete';

// Dashboard is the shop control panel for schedule, reels, and profile data.
// Dashboard es el panel de tienda para agenda, reels y datos de perfil.
import { api } from '../services/api';
import { NoticeModal } from './NoticeModal';
import { LogoBubble } from './LogoBubble';
import { ShopPurchaseModal } from './payments/ShopPurchaseModal';
import styles from './Dashboard.module.css';

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
      { label: 'Envíos', number: '' }
  ]);

  // Reel Form States
  const [reelUrl, setReelUrl] = useState('');
  const [reelPlatform, setReelPlatform] = useState<SocialPlatform | ''>('');

  // Sync Logic & Load Reels
  const loadPurchases = async () => {
      if (isPreview) return;
      if (!currentShop.id || currentShop.id === 'empty' || isPurchaseBlocked) return;
      setIsPurchaseLoading(true);
      try {
          const data = await api.fetchPurchasesByShop(currentShop.id);
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
            const myReels = await api.fetchReelsByShop(currentShop.id);
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
          if (payload?.paymentId) {
              try {
                  const result = await api.confirmMercadoPagoPayment(payload.paymentId);
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
  
  const whatsappLimit = isMaxima ? 3 : isAlta ? 2 : 1;
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

  const purchaseStatusLabels: Record<string, string> = {
      PENDING: 'Pendiente',
      APPROVED: 'Aprobada',
      REJECTED: 'Rechazada',
  };

  const purchaseTypeLabels: Record<string, string> = {
      LIVE_PACK: 'Cupos de vivos',
      REEL_PACK: 'Cupos de historias',
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
          await api.acceptShop(currentShop.id);
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
  const isSensitiveLocked = !adminOverride;
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
  const handleUploadReel = async () => {
      if (blockPreviewAction()) return;
      if (!reelUrl || !reelPlatform) {
          setNotice({
              title: 'Datos incompletos',
              message: 'Debes ingresar la URL y la plataforma.',
              tone: 'warning',
          });
          return;
      }
      const result = await api.createReel(
          currentShop.id,
          reelUrl,
          reelPlatform as SocialPlatform,
          { isAdminOverride: adminOverride }
      );
      if (result.success) {
          setNotice({
              title: 'Historia publicada',
              message: result.message,
              tone: 'success',
          });
          setReelUrl('');
          setReelPlatform('');
          if (onReelChange) onReelChange();
          const myReels = await api.fetchReelsByShop(currentShop.id);
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
  const openPlanPage = () => window.open(PLANES_URL, '_blank');

  // --- STREAM FORM STATES ---
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formPlatform, setFormPlatform] = useState<SocialPlatform | ''>('');

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
          
          {/* TAB 1: RESUMEN (HOME) */}
          {activeTab === 'RESUMEN' && (
              <div className={styles.summarySection}>
                  <header className={styles.summaryHeader}>
                      <h1 className={styles.summaryTitle}>Panel de Control</h1>
                      <p className={styles.summarySubtitle}>Visión general de tu rendimiento y disponibilidad.</p>
                  </header>

                  <div className={styles.statusPanel}>
                      <div className={styles.statusRow}>
                          <div>
                              <p className={styles.statusLabel}>Estado de cuenta</p>
                              <div className={styles.statusTags}>
                                  <span className={`${styles.statusTag} ${statusTone}`}>
                                      {statusLabel}
                                  </span>
                                  {currentShop.ownerAcceptedAt && (
                                      <span className={styles.statusConfirmed}>
                                          Datos confirmados {new Date(currentShop.ownerAcceptedAt).toLocaleDateString('es-AR')}
                                      </span>
                                  )}
                              </div>
                              <p className={styles.statusMessage}>{getStatusMessage()}</p>
                          </div>
                          <div className={styles.statusActions}>
                              {canAcceptShop && (
                                  <Button size="sm" onClick={handleAcceptShop} className={styles.primaryActionButton}>
                                      Confirmar datos
                                  </Button>
                              )}
                              <Button size="sm" variant="outline" onClick={() => setTab('PERFIL')}>
                                  Editar perfil
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setTab('VIVOS')}>
                                  Ver agenda
                              </Button>
                          </div>
                      </div>
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

                  <div className={styles.cardsGrid}>
                      
                      {/* QUOTA CARD */}
                      <div className={styles.quotaCard}>
                          <div className={styles.quotaHeader}>
                              <div>
                                  <h3 className={styles.quotaTitle}>Cupos para Vivos</h3>
                                  <p className={styles.quotaSubtitle}>Disponibilidad semanal</p>
                              </div>
                              <Button
                                  size="sm"
                                  onClick={openBuyModal}
                                  disabled={isAgendaSuspended || isPreview}
                                  className={styles.quotaBuyButton}
                              >
                                  <ShoppingCart size={16} className={styles.buttonIcon}/> Comprar Extras
                              </Button>
                          </div>

                          <div className={styles.quotaBody}>
                              {/* Circle Chart */}
                              <div className={styles.quotaCircle}>
                                  <div className={styles.quotaCenter}>
                                      <span className={`${styles.quotaCircleValue} ${availableQuota > 0 ? styles.quotaCircleValueNormal : styles.quotaCircleValueNegative}`}>{isNaN(availableQuota) ? 0 : availableQuota}</span>
                                      <span className={styles.quotaCircleLabel}>Disp.</span>
                                  </div>
                              </div>
                              
                              <div className={styles.quotaDetails}>
                                  <div className={styles.quotaRow}>
                                      <span className={styles.quotaLabel}>Plan Base ({currentShop.plan})</span>
                                      <span className={styles.quotaValue}>{baseQuota}</span>
                                  </div>
                                  <div className={styles.quotaRow}>
                                      <span className={styles.quotaExtraLabel}><Plus size={12} className={styles.quotaExtraIcon}/> Cupos Extras</span>
                                      <span className={styles.quotaValuePositive}>{extraQuota}</span>
                                  </div>
                                  <div className={styles.quotaRowLast}>
                                      <span className={styles.quotaLabel}>Usados (En curso/Prog.)</span>
                                      <span className={styles.quotaValueNegative}>-{usedQuota}</span>
                                  </div>
                                  {availableQuota <= 0 && (
                                      <div className={styles.quotaWarning}>
                                          <p className={styles.quotaWarningTitle}>Sin cupos disponibles</p>
                                          <p className={styles.quotaWarningText}>
                                              {isAgendaSuspended
                                                  ? 'Agenda suspendida: no podés comprar cupos de vivos.'
                                                  : 'Comprá cupos extras o mejorá tu plan para agendar.'}
                                          </p>
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>

                      {/* PLAN STATUS */}
                      <div className={styles.planCard}>
                           <div className={styles.planHeader}>
                                <h3 className={styles.planTitle}>
                                    Tu Suscripción
                                </h3>
                                <p className={styles.planSubtitle}>Nivel de visibilidad actual</p>
                           </div>
                           
                           <div className={styles.planBody}>
                                <span className={`${styles.planBadge} ${
                                    isMaxima ? styles.planBadgeMaxima :
                                    isAlta ? styles.planBadgeAlta :
                                    styles.planBadgeStandard
                                }`}>
                                    Plan {currentShop.plan}
                                </span>

                                {isStandard && (
                                    <div className={styles.planHint}>
                                        <p className={styles.planHintTitle}>Estás en el plan básico.</p>
                                        <p className={`${styles.planHintUpgrade} ${styles.planHintUpgradeBlue}`}>
                                            <ArrowUpCircle size={14}/> Pásate a ALTA
                                        </p>
                                    </div>
                                )}
                                {isAlta && (
                                    <div className={styles.planHint}>
                                        <p className={styles.planHintTitle}>Tienes buena visibilidad.</p>
                                        <p className={`${styles.planHintUpgrade} ${styles.planHintUpgradePurple}`}>
                                            <ArrowUpCircle size={14}/> Pásate a MÁXIMA
                                        </p>
                                    </div>
                                )}
                                {isMaxima && (
                                    <div className={styles.planHint}>
                                        <p>¡Eres un líder en la plataforma!</p>
                                        <p>Disfrutas de máxima exposición y cupos.</p>
                                    </div>
                                )}
                                <div className={styles.planInfo}>
                                    <div className={styles.planInfoRow}>
                                        <span>Vivos base/semana</span>
                                        <span>{isStandard ? '0' : isAlta ? '1' : '3'}</span>
                                    </div>
                                    <div className={styles.planInfoRow}>
                                        <span>Reels diarios</span>
                                        <span>{isStandard ? '1' : isAlta ? '3' : '5'}</span>
                                    </div>
                                    <p className={styles.planInfoNote}>
                                        Precios y upgrades se definen por Distrito Moda.
                                    </p>
                                </div>
                           </div>

                           {!isMaxima && (
                               <Button variant="secondary" size="sm" onClick={openPlanPage} className={styles.planUpgradeButton}>
                                   Mejorar mi Plan
                               </Button>
                           )}
                      </div>
                  </div>

                  <div className={styles.infoGrid}>
                      <div className={styles.infoCard}>
                          <h3 className={styles.infoCardTitle}>Acciones rápidas</h3>
                          <div className={styles.infoCardStack}>
                              <Button size="sm" className={styles.buttonFull} onClick={handleCreateClick} disabled={!canSchedule || isPreview}>
                                  <Plus size={14} className={styles.buttonIcon}/> Agendar vivo
                              </Button>
                              <Button
                                  size="sm"
                                  variant="outline"
                                  className={styles.buttonFull}
                                  onClick={openBuyModal}
                                  disabled={isAgendaSuspended || isPreview}
                              >
                                  <ShoppingCart size={14} className={styles.buttonIcon}/> Comprar cupo
                              </Button>
                              <Button size="sm" variant="outline" className={styles.buttonFull} onClick={() => setTab('REELS')}>
                                  <Film size={14} className={styles.buttonIcon}/> Subir historia
                              </Button>
                              <Button size="sm" variant="outline" className={styles.buttonFull} onClick={() => setTab('PERFIL')}>
                                  <Store size={14} className={styles.buttonIcon}/> Editar perfil
                              </Button>
                          </div>
                          {!canSchedule && (
                              <p className={styles.infoDanger}>{getRestrictionMessage()}</p>
                          )}
                      </div>
                      <div className={styles.infoCard}>
                          <h3 className={styles.infoCardTitle}>Agenda actual</h3>
                          <div className={styles.infoCardList}>
                              <div className={styles.infoRow}><span>En vivo</span><span className={styles.infoValue}>{liveCount}</span></div>
                              <div className={styles.infoRow}><span>Programados</span><span className={styles.infoValue}>{upcomingCount}</span></div>
                              <div className={styles.infoRow}><span>Finalizados</span><span className={styles.infoValue}>{finishedCount}</span></div>
                              <div className={styles.infoRow}><span>No realizados</span><span className={styles.infoValue}>{missedCount}</span></div>
                              <div className={styles.infoRow}><span>Reprogramar</span><span className={styles.infoValue}>{pendingReprogramCount}</span></div>
                          </div>
                          {pendingReprogramCount > 0 && (
                              <p className={styles.infoWarning}>
                                  Tenés {pendingReprogramCount} vivos pendientes de reprogramación.
                              </p>
                          )}
                      </div>
                      <div className={styles.infoCard}>
                          <h3 className={styles.infoCardTitle}>Historias hoy</h3>
                          <div className={styles.infoCardList}>
                              <div className={styles.infoRow}><span>Plan disponible</span><span className={styles.infoValue}>{availableReelPlan}</span></div>
                              <div className={styles.infoRow}><span>Extras comprados</span><span className={styles.infoValuePositive}>{reelsExtra}</span></div>
                              <div className={styles.infoRow}><span>Publicadas hoy</span><span className={styles.infoValue}>{reelsToday}</span></div>
                          </div>
                          <button
                              onClick={openBuyReelModal}
                              className={`${styles.infoLink} ${isPreview ? styles.infoLinkDisabled : styles.infoLinkActive}`}
                          >
                              Comprar extras
                          </button>
                      </div>
                  </div>
                  <div className={styles.notificationCard}>
                      <div className={styles.notificationHeader}>
                          <h3 className={styles.notificationTitle}>
                              <AlertTriangle size={16} /> Notificaciones
                          </h3>
                          <div className={styles.notificationCount}>
                              <span>{unreadNotifications.length} nuevas</span>
                              {unreadNotifications.length > 0 && onMarkAllNotificationsRead && (
                                  <button
                                      className={styles.notificationAction}
                                      onClick={onMarkAllNotificationsRead}
                                  >
                                      Marcar todo
                                  </button>
                              )}
                          </div>
                      </div>
                      {notifications.length === 0 ? (
                          <p className={styles.notificationEmpty}>Sin notificaciones por ahora.</p>
                      ) : (
                          <div className={styles.notificationList}>
                              {notifications.slice(0, 6).map((note) => (
                                  <div key={note.id} className={styles.notificationItem}>
                                      <div className={styles.notificationBody}>
                                          <p className={`${styles.notificationMessage} ${note.read ? styles.notificationMessageRead : styles.notificationMessageUnread}`}>
                                              {note.message}
                                          </p>
                                          <p className={styles.notificationMeta}>{formatNotificationDate(note.createdAt)}</p>
                                      </div>
                                      {!note.read && onMarkNotificationRead && (
                                          <button
                                              className={styles.notificationReadAction}
                                              onClick={() => onMarkNotificationRead(note.id)}
                                          >
                                              Leído
                                          </button>
                                      )}
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
                  <div className={styles.historyCard}>
                      <div className={styles.historyHeader}>
                          <h3 className={styles.historyTitle}>
                              <History size={16} /> Historial de compras
                          </h3>
                          <span className={styles.historyCount}>{purchaseHistory.length} movimientos</span>
                      </div>
                      {isPurchaseLoading ? (
                          <p className={styles.historyEmpty}>Cargando compras...</p>
                      ) : purchaseHistory.length === 0 ? (
                          <p className={styles.historyEmpty}>Sin compras registradas todavía.</p>
                      ) : (
                          <div className={styles.historyList}>
                              {purchaseHistory.slice(0, 6).map((purchase) => {
                                  const statusLabel = purchaseStatusLabels[purchase.status] || purchase.status;
                                  const typeLabel = purchaseTypeLabels[purchase.type] || purchase.type;
                                  return (
                                      <div key={purchase.purchaseId} className={styles.historyItem}>
                                          <div>
                                              <p className={styles.historyItemTitle}>{typeLabel}</p>
                                              <p className={styles.historyItemMeta}>
                                                  {formatPurchaseDate(purchase.createdAt)} • Cantidad {purchase.quantity}
                                              </p>
                                          </div>
                                          <span className={`${styles.historyStatus} ${
                                              purchase.status === 'APPROVED'
                                                  ? styles.historyStatusApproved
                                                  : purchase.status === 'REJECTED'
                                                  ? styles.historyStatusRejected
                                                  : styles.historyStatusPending
                                          }`}>
                                              {statusLabel}
                                          </span>
                                      </div>
                                  );
                              })}
                          </div>
                      )}
                  </div>
              </div>
          )}

          {/* TAB: MIS REELS */}
          {activeTab === 'REELS' && (
              <div className={styles.reelsSection}>
                  <header className={styles.reelsHeader}>
                      <div>
                          <h1 className={styles.reelsTitle}>Mis Historias</h1>
                          <p className={styles.reelsSubtitle}>Comparte contenido corto por 24 horas.</p>
                      </div>
                      <div className={styles.reelsStats}>
                          <p className={styles.reelsStatLine}>
                              Disponibles hoy (Plan): <span className={styles.reelsStatValue}>{availableReelPlan}</span>
                          </p>
                          <p className={styles.reelsStatLine}>
                              Extras comprados: <span className={styles.reelsStatValuePositive}>{reelsExtra}</span>
                          </p>
                          <button
                              onClick={openBuyReelModal}
                              className={`${styles.reelsBuyLink} ${isPreview ? styles.reelsBuyLinkDisabled : styles.reelsBuyLinkActive}`}
                          >
                              Comprar Extras
                          </button>
                          {(availableReelPlan === 0 && reelsExtra === 0) && (
                              <p className={styles.reelsWarning}>Sin cupos disponibles hoy.</p>
                          )}
                      </div>
                  </header>

                  <div className={styles.reelsGrid}>
                      
                      {/* UPLOAD FORM */}
                      <div className={`${styles.reelsPanel} ${styles.reelsPanelFit}`}>
                          <h3 className={styles.reelsPanelTitle}><Plus size={16}/> Subir Historia</h3>
                          <div className={styles.reelsForm}>
                              <div>
                                  <label className={styles.reelsLabel}>Enlace del Video</label>
                                  <input 
                                    type="text" 
                                    value={reelUrl}
                                    onChange={e => setReelUrl(e.target.value)}
                                    placeholder="https://instagram.com/reel/..."
                                    className={styles.reelsInput}
                                  />
                              </div>
                              <div>
                                  <label className={styles.reelsLabel}>Plataforma</label>
                                  <select 
                                    value={reelPlatform}
                                    onChange={e => setReelPlatform(e.target.value as SocialPlatform)}
                                    className={styles.reelsSelect}
                                  >
                                      <option value="">Seleccionar...</option>
                                      <option value="Instagram">Instagram</option>
                                      <option value="TikTok">TikTok</option>
                                      <option value="YouTube">YouTube Shorts</option>
                                      <option value="Facebook">Facebook</option>
                                  </select>
                              </div>
                              <Button 
                                onClick={handleUploadReel} 
                                disabled={availableReelPlan === 0 && reelsExtra === 0}
                                className={styles.buttonFull}
                              >
                                  Publicar Historia
                              </Button>
                              {(availableReelPlan === 0 && reelsExtra === 0) && (
                                  <p className={styles.reelsDisabledNote}>Sin cupos disponibles hoy.</p>
                              )}
                          </div>
                      </div>

                      {/* ACTIVE LIST */}
                      <div className={styles.reelsPanel}>
                           <h3 className={styles.reelsPanelTitle}><Film size={16}/> Activas (últimas 24h)</h3>
                           <div className={styles.reelsList}>
                               {shopReels.filter(r => r.status === 'ACTIVE').length === 0 ? (
                                   <p className={styles.reelsEmpty}>No tienes historias activas.</p>
                               ) : (
                                   shopReels.filter(r => r.status === 'ACTIVE').map(reel => {
                                       const now = new Date();
                                       const expires = new Date(reel.expiresAtISO);
                                       const diffMs = expires.getTime() - now.getTime();
                                       const hours = Math.floor(diffMs / (1000 * 60 * 60));
                                       return (
                                           <div key={reel.id} className={styles.reelsItem}>
                                               <div className={styles.reelsItemInfo}>
                                                   <p className={styles.reelsItemTitle}>{reel.url}</p>
                                                   <p className={styles.reelsItemMeta}>
                                                     {reel.platform} • Expira en {hours}h • {reel.views || 0} vistas
                                                   </p>
                                               </div>
                                               <span className={styles.reelsItemBadge}>ACTIVA</span>
                                           </div>
                                       );
                                   })
                               )}
                           </div>
                           
                           {/* EXPIRED LIST */}
                           {shopReels.some(r => r.status === 'EXPIRED') && (
                               <div className={styles.reelsExpiredWrap}>
                                   <h4 className={styles.reelsExpiredTitle}>Expiradas recientemente</h4>
                                   {shopReels.filter(r => r.status === 'EXPIRED').slice(0, 3).map(reel => (
                                       <div key={reel.id} className={styles.reelsExpiredRow}>
                                           <span className={styles.reelsExpiredLink}>{reel.url}</span>
                                           <span>EXPIRED</span>
                                       </div>
                                   ))}
                               </div>
                           )}
                      </div>
                  </div>
              </div>
          )}

          {/* TAB 2: MIS REDES (KEEP EXISTING) */}
          {activeTab === 'REDES' && (
              <div className={styles.socialsSection}>
                  <header className={styles.socialsHeader}>
                      <h1 className={styles.socialsTitle}>Mis Redes</h1>
                      <p className={styles.socialsSubtitle}>Configura dónde transmitirás tus vivos y cómo te contactan.</p>
                      {isProfileLocked && (
                          <div className={styles.profileLockedNote}>
                              <Lock size={14} />
                              <span>Datos sensibles validados por administracion. Solo podes editar condiciones comerciales.</span>
                          </div>
                      )}
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
              <div className={styles.streamsSection}>
                  <header className={styles.streamsHeader}>
                      <div>
                          <h1 className={styles.streamsTitle}>Mis Vivos</h1>
                          <p className={styles.streamsSubtitle}>Gestiona tu agenda y monitorea el rendimiento.</p>
                      </div>
                      <div className={styles.streamsHeaderRight}>
                           <div className={`${styles.streamsActionWrap} group`}>
                                <Button 
                                    onClick={handleCreateClick} 
                                    disabled={!canSchedule}
                                    className={!canSchedule ? styles.streamsActionDisabled : ''}
                                >
                                    <Plus size={18} className={styles.buttonIcon} /> Agendar Vivo
                                </Button>
                                {!canSchedule && (
                                    <div className={styles.streamsTooltip}>
                                        {getRestrictionMessage()}
                                    </div>
                                )}
                           </div>
                           <p className={styles.streamsQuotaNote}>Cupos Disponibles: {availableQuota}</p>
                      </div>
                  </header>

                  <div className={styles.streamsRules}>
                      <div className={styles.streamsRulesRow}>
                          <span className={styles.streamsRulesLabel}>Reglas clave:</span>
                          <span>Máximo 1 vivo por día.</span>
                          <span>Máximo 7 vivos por semana.</span>
                          <span>Requiere cupo disponible.</span>
                          {pendingReprogramCount > 0 && (
                              <span className={styles.streamsRulesWarning}>Tenés {pendingReprogramCount} vivos para reprogramar.</span>
                          )}
                      </div>
                  </div>

                  <div className={styles.streamsCard}>
                      <div className={styles.streamsMobileList}>
                          {myStreams.length > 0 ? myStreams.map(stream => (
                              <div key={stream.id} className={styles.streamsMobileItem}>
                                  <div className={styles.streamsMobileHeader}>
                                      <div>
                                          <p className={styles.streamsMobileTitle}>{stream.title}</p>
                                          <p className={styles.streamsMobileDate}>
                                              {new Date(stream.fullDateISO).toLocaleDateString()} - {stream.scheduledTime} hs
                                          </p>
                                      </div>
                                      <span className={
                                          stream.status === StreamStatus.LIVE ? styles.streamsStatusLive :
                                          stream.status === StreamStatus.UPCOMING ? styles.streamsStatusUpcoming :
                                          stream.status === StreamStatus.MISSED ? styles.streamsStatusMissed :
                                          stream.status === StreamStatus.CANCELLED ? styles.streamsStatusCancelled :
                                          stream.status === StreamStatus.BANNED ? styles.streamsStatusBanned :
                                          stream.status === StreamStatus.PENDING_REPROGRAMMATION ? styles.streamsStatusPending :
                                          styles.streamsStatusFinished
                                      }>
                                          {stream.status === StreamStatus.UPCOMING ? 'PROGRAMADO' :
                                           stream.status === StreamStatus.LIVE ? 'EN VIVO' :
                                           stream.status === StreamStatus.MISSED ? 'NO REALIZADO' :
                                           stream.status === StreamStatus.CANCELLED ? 'CANCELADO' :
                                           stream.status === StreamStatus.BANNED ? 'BLOQUEADO' :
                                           stream.status === StreamStatus.PENDING_REPROGRAMMATION ? 'REPROGRAMAR' :
                                           'FINALIZADO'}
                                      </span>
                                  </div>
                                  <div className={styles.streamsMobileMeta}>
                                      <span className={`${styles.platformBadge} ${
                                         stream.platform === 'Instagram' ? styles.platformInstagram : 
                                         stream.platform === 'TikTok' ? styles.platformTiktok :
                                         styles.platformDefault
                                      }`}>
                                         {stream.platform}
                                      </span>
                                      <div className={styles.ratingRow}>
                                          <Star size={12} className={stream.rating ? styles.ratingStarActive : styles.ratingStarInactive} />
                                          <span className={styles.streamsRatingRowText}>{stream.rating || '-'}</span>
                                      </div>
                                  </div>
                                  <div className={styles.streamsMobileActions}>
                                      {stream.status === StreamStatus.LIVE && onExtendStream && stream.extensionCount < 3 && (
                                          <Button 
                                              size="sm" 
                                              className={styles.streamsActionConfirm}
                                              onClick={() => onExtendStream(stream.id)}
                                              title="Extender 30 minutos más"
                                          >
                                              <RefreshCw size={10} className={styles.buttonIconSm}/> Continuamos
                                          </Button>
                                      )}
                                      {(stream.status === StreamStatus.UPCOMING || stream.status === StreamStatus.PENDING_REPROGRAMMATION) && (
                                          <>
                                            <button
                                                onClick={() => openEditModal(stream)}
                                                disabled={!canManageAgenda}
                                                title={!canManageAgenda ? getRestrictionMessage() : 'Editar vivo'}
                                                className={`${styles.iconButton} ${!canManageAgenda ? styles.iconButtonDisabled : styles.iconButtonEdit}`}
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (!canManageAgenda) return;
                                                    setConfirmDialog({
                                                        title: 'Cancelar vivo',
                                                        message: '¿Confirmas la cancelación de este vivo?',
                                                        confirmLabel: 'Cancelar vivo',
                                                        onConfirm: () => onStreamDelete(stream.id),
                                                    });
                                                }}
                                                disabled={!canManageAgenda}
                                                title={!canManageAgenda ? getRestrictionMessage() : 'Cancelar vivo'}
                                                className={`${styles.iconButton} ${!canManageAgenda ? styles.iconButtonDisabled : styles.iconButtonDelete}`}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                          </>
                                      )}
                                  </div>
                              </div>
                          )) : (
                              <div className={styles.streamsMobileEmpty}>No has creado ningún vivo aún.</div>
                          )}
                      </div>
                      <div className={styles.streamsDesktopTable}>
                          <table className={styles.streamsTable}>
                              <thead className={styles.streamsTableHead}>
                                  <tr>
                                      <th className={styles.streamsTableHeadCell}>Información</th>
                                      <th className={styles.streamsTableHeadCell}>Red Social</th>
                                      <th className={styles.streamsTableHeadCell}>Estado</th>
                                      <th className={styles.streamsTableHeadCell}>Calificación</th>
                                      <th className={`${styles.streamsTableHeadCell} ${styles.streamsTableHeadRight}`}>Acciones</th>
                                  </tr>
                              </thead>
                              <tbody className={styles.streamsTableBody}>
                                  {myStreams.length > 0 ? myStreams.map(stream => (
                                      <tr key={stream.id} className={styles.streamsTableRow}>
                                          <td className={styles.streamsTableCell}>
                                              <div className={styles.streamsInfoStack}>
                                                  <span className={styles.streamsInfoTitle}>{stream.title}</span>
                                                  <span className={styles.streamsInfoDate}>
                                                      {new Date(stream.fullDateISO).toLocaleDateString()} - {stream.scheduledTime} hs
                                                  </span>
                                              </div>
                                          </td>
                                          <td className={styles.streamsTableCell}>
                                              <span className={`${styles.platformBadge} ${
                                                 stream.platform === 'Instagram' ? styles.platformInstagram : 
                                                 stream.platform === 'TikTok' ? styles.platformTiktok :
                                                 styles.platformDefault
                                              }`}>
                                                 {stream.platform}
                                              </span>
                                          </td>
                                          <td className={styles.streamsTableCell}>
                                               {stream.status === StreamStatus.LIVE ? (
                                                   <span className={styles.streamsStatusLive}>EN VIVO</span>
                                               ) : stream.status === StreamStatus.UPCOMING ? (
                                                   <span className={styles.streamsStatusUpcoming}>PROGRAMADO</span>
                                               ) : stream.status === StreamStatus.MISSED ? (
                                                   <span className={styles.streamsStatusMissed}>NO REALIZADO</span>
                                               ) : stream.status === StreamStatus.CANCELLED ? (
                                                   <span className={styles.streamsStatusCancelled}>CANCELADO</span>
                                               ) : stream.status === StreamStatus.BANNED ? (
                                                   <span className={styles.streamsStatusBanned}>BLOQUEADO</span>
                                               ) : stream.status === StreamStatus.PENDING_REPROGRAMMATION ? (
                                                   <span className={styles.streamsStatusPending}>REPROGRAMAR</span>
                                               ) : (
                                                   <span className={styles.streamsStatusFinished}>FINALIZADO</span>
                                               )}
                                          </td>
                                          <td className={styles.streamsTableCell}>
                                              <div className={styles.streamsRatingRow}>
                                                  <Star size={14} className={stream.rating ? styles.ratingStarActive : styles.ratingStarInactive} />
                                                  <span className={styles.streamsRatingRowText}>{stream.rating || '-'}</span>
                                                  {stream.rating && <span className={styles.streamsRatingCount}>({Math.floor(Math.random() * 50) + 5})</span>}
                                              </div>
                                          </td>
                                          <td className={`${styles.streamsTableCell} ${styles.streamsTableCellRight}`}>
                                              <div className={styles.streamsActionsRow}>
                                                  {stream.status === StreamStatus.LIVE && onExtendStream && stream.extensionCount < 3 && (
                                                      <Button 
                                                          size="sm" 
                                                          className={styles.streamsActionConfirm}
                                                          onClick={() => onExtendStream(stream.id)}
                                                          title="Extender 30 minutos más"
                                                      >
                                                          <RefreshCw size={10} className={styles.buttonIconSm}/> Continuamos
                                                      </Button>
                                                  )}
                                                  {(stream.status === StreamStatus.UPCOMING || stream.status === StreamStatus.PENDING_REPROGRAMMATION) && (
                                                      <>
                                                        <button
                                                            onClick={() => openEditModal(stream)}
                                                            disabled={!canManageAgenda}
                                                            title={!canManageAgenda ? getRestrictionMessage() : 'Editar vivo'}
                                                            className={`${styles.iconButton} ${!canManageAgenda ? styles.iconButtonDisabled : styles.iconButtonEdit}`}
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (!canManageAgenda) return;
                                                                setConfirmDialog({
                                                                    title: 'Cancelar vivo',
                                                                    message: '¿Confirmas la cancelación de este vivo?',
                                                                    confirmLabel: 'Cancelar vivo',
                                                                    onConfirm: () => onStreamDelete(stream.id),
                                                                });
                                                            }}
                                                            disabled={!canManageAgenda}
                                                            title={!canManageAgenda ? getRestrictionMessage() : 'Cancelar vivo'}
                                                            className={`${styles.iconButton} ${!canManageAgenda ? styles.iconButtonDisabled : styles.iconButtonDelete}`}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                      </>
                                                  )}
                                              </div>
                                          </td>
                                      </tr>
                                  )) : (
                                      <tr>
                                          <td colSpan={5} className={styles.streamsTableEmpty}>No has creado ningún vivo aún.</td>
                                      </tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          )}

          {/* TAB 4: PERFIL (KEEP EXISTING) */}
          {activeTab === 'PERFIL' && (
              <div className={styles.profileSection}>
                  <header className={styles.profileHeader}>
                      <h1 className={styles.profileTitle}>Datos de Tienda</h1>
                      <p className={styles.profileSubtitle}>Información legal, ubicación y condiciones de venta.</p>
                      {isProfileLocked && (
                          <div className={styles.profileLockedNote}>
                              <Lock size={14} />
                              <span>Datos validados por administracion. Solo lectura.</span>
                          </div>
                      )}
                  </header>
                  <div className={styles.profileCard}>
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
                      <section className={styles.profileFormSection}>
                          <h3 className={styles.profileFormTitle}><Store size={18}/> Identidad & Legal</h3>
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
                      </section>
                      <section className={styles.profileFormSection}>
                          <h3 className={styles.profileFormTitle}><MapPin size={18}/> Dirección Física</h3>
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
                      </section>
                      <section className={styles.profileFormSection}>
                          <h3 className={styles.profileFormTitle}><CreditCard size={18}/> Condiciones de Venta</h3>
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
                      </section>
                      <div className={styles.profileActions}>
                          <Button type="submit" disabled={isCommercialLocked}><Save size={16} className={styles.buttonIcon}/> Guardar Perfil</Button>
                      </div>
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

