
import React, { Suspense, useState, useEffect } from 'react';
import { Button } from './Button';
import { LayoutDashboard, Radio, Store, AlertTriangle, CheckCircle, XCircle, Edit, AlertOctagon, BarChart3, Search, Eye, EyeOff, PlayCircle, StopCircle, X, Film, Plus, Save, MapPin, CreditCard, User, Lock, ShoppingBag, Calendar, Globe } from 'lucide-react';
import { StreamStatus, DataIntegrityStatus, Stream, Shop, Reel } from '../types';
import { fetchAllReelsAdmin, reactivateReel, hideReel } from '../domains/reels';
import { fetchReportsAdmin, resolveReportAdmin, rejectReportAdmin } from '../domains/reports';
import { fetchPurchaseRequests, approvePurchase, rejectPurchase } from '../domains/purchases';
import { fetchNotificationsAdmin, markNotificationRead, runNotifications } from '../domains/notifications';
import { updateStream, cancelStream, banStream, runStreamsLifecycle } from '../domains/streams';
import {
  togglePenalty,
  activateShop,
  rejectShop,
  suspendAgenda,
  liftAgendaSuspension,
  resetShopPassword,
  assignShopOwner,
  deleteShop,
  createShop,
  buyStreamQuota,
  buyReelQuota,
} from '../domains/shops';
import { runSanctions, fetchSystemStatus } from '../domains/system';

// AdminDashboard centralizes moderation, governance, and system operations.
// AdminDashboard centraliza moderación, gobernanza y operaciones del sistema.
import { AddressAutocomplete } from './AddressAutocomplete';
import { NoticeModal } from './NoticeModal';
import styles from './AdminDashboard.module.css';

const AdminAdminTab = React.lazy(async () => {
  const mod = await import('./admin-tabs/AdminAdminTab');
  return { default: mod.default };
});
const AdminReportsTab = React.lazy(async () => {
  const mod = await import('./admin-tabs/AdminReportsTab');
  return { default: mod.default };
});
const AdminReelsTab = React.lazy(async () => {
  const mod = await import('./admin-tabs/AdminReelsTab');
  return { default: mod.default };
});
const AdminShopsTab = React.lazy(async () => {
  const mod = await import('./admin-tabs/AdminShopsTab');
  return { default: mod.default };
});

type AdminTab = 'DASHBOARD' | 'AGENDA' | 'STREAMS' | 'SHOPS' | 'REELS' | 'REPORTS' | 'ADMIN';

interface AdminDashboardProps {
    streams: Stream[];
    setStreams: React.Dispatch<React.SetStateAction<Stream[]>>;
    shops: Shop[];
    setShops: React.Dispatch<React.SetStateAction<Shop[]>>;
    onRefreshData: () => void;
    activeTab: AdminTab;
    onTabChange: (tab: AdminTab) => void;
    onPreviewClient: () => void;
    onPreviewShop: (shopId: string) => void;
    onShopUpdate: (shop: Shop) => Promise<boolean>;
    adminRole?: 'SUPERADMIN' | 'MODERATOR';
}

const PAYMENT_OPTIONS = ['Efectivo', 'Transferencia', 'Depósito', 'USDT', 'Cheque', 'Mercado Pago'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  streams,
  setStreams,
  shops,
  setShops,
  onRefreshData,
  activeTab,
  onTabChange,
  onPreviewClient,
  onPreviewShop,
  onShopUpdate,
  adminRole,
}) => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<any[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [reelsLoading, setReelsLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<'ALL' | 'UNREAD'>('UNREAD');
  const [notificationType, setNotificationType] = useState<'ALL' | 'SYSTEM' | 'REMINDER' | 'PURCHASE'>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const createStepLabels = [
      'Identidad & Legal',
      'Direccion',
      'Condiciones',
      'Redes',
      'Cuenta',
      'Recursos',
  ];
  const [createStep, setCreateStep] = useState(0);
  const [createErrors, setCreateErrors] = useState<string[]>([]);
  const [agendaQuery, setAgendaQuery] = useState('');
  const [agendaStatus, setAgendaStatus] = useState<'ALL' | StreamStatus>('ALL');
  const [shopFilter, setShopFilter] = useState<'ALL' | 'PENDING_VERIFICATION' | 'ACTIVE' | 'AGENDA_SUSPENDED' | 'HIDDEN' | 'BANNED'>('ALL');
  const [shopQuery, setShopQuery] = useState('');
  const [streamQuery, setStreamQuery] = useState('');
  const [streamStatusFilter, setStreamStatusFilter] = useState<'ALL' | StreamStatus>('ALL');
  const [reportStatusFilter, setReportStatusFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED' | 'DISMISSED'>('ALL');
  const [reportQuery, setReportQuery] = useState('');
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [purchaseQuery, setPurchaseQuery] = useState('');
  const [quotaShopId, setQuotaShopId] = useState('');
  const [quotaType, setQuotaType] = useState<'STREAM' | 'REEL'>('STREAM');
  const [quotaAmount, setQuotaAmount] = useState(1);
  const [officialMode, setOfficialMode] = useState(false);
  const [sanctionsRunning, setSanctionsRunning] = useState(false);
  const [notificationsRunning, setNotificationsRunning] = useState(false);
  const [streamsLifecycleRunning, setStreamsLifecycleRunning] = useState(false);
  const [sanctionsSummary, setSanctionsSummary] = useState<any | null>(null);
  const [notificationsSummary, setNotificationsSummary] = useState<any | null>(null);
  const [streamsLifecycleSummary, setStreamsLifecycleSummary] = useState<any | null>(null);
  const [systemStatus, setSystemStatus] = useState<any | null>(null);
  const [systemStatusLoading, setSystemStatusLoading] = useState(false);
  const [notice, setNotice] = useState<{ title: string; message: string; tone?: 'info' | 'success' | 'warning' | 'error' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
  } | null>(null);
  const [inputDialog, setInputDialog] = useState<{
    title: string;
    message: string;
    placeholders: string[];
    defaults?: string[];
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: (values: string[]) => void;
  } | null>(null);
  const [inputValues, setInputValues] = useState<string[]>([]);
  const [editShop, setEditShop] = useState<Shop | null>(null);
  const [editForm, setEditForm] = useState({
      name: '',
      razonSocial: '',
      cuit: '',
      email: '',
      website: '',
      logoUrl: '',
      minimumPurchase: 0,
      street: '',
      number: '',
      city: '',
      province: '',
      zip: '',
      whatsapp: '',
      instagram: '',
      tiktok: '',
      facebook: '',
      youtube: '',
  });

  // Expanded Form State for Create Shop
  const [formData, setFormData] = useState({
      name: '',
      razonSocial: '',
      cuit: '',
      street: '',
      number: '',
      city: '',
      province: '',
      zip: '',
      minimumPurchase: 0,
      paymentMethods: [] as string[],
      email: '',
      password: '',
      plan: 'BASIC' as 'BASIC' | 'PREMIUM' | 'PRO',
      status: 'PENDING_VERIFICATION' as 'PENDING_VERIFICATION' | 'ACTIVE',
      logoUrl: '',
      coverUrl: '',
      website: '',
      catalogUrl: '',
      phone: '',
      instagram: '',
      tiktok: '',
      facebook: '',
      youtube: '',
      mapsUrl: '',
      lat: '',
      lng: '',
      imageUrl: '',
      storeImageUrl: '',
      legacyUid: '',
      legacyUserType: '',
      legacyUser: '',
      contactName: '',
      streamQuota: 0,
      reelQuota: 0
  });
  const isSuperadmin = adminRole !== 'MODERATOR';
  const adminRoleLabel = adminRole === 'MODERATOR' ? 'Moderador' : 'Superadmin';

  const resetCreateForm = () => {
      setFormData({
          name: '',
          razonSocial: '',
          cuit: '',
          street: '',
          number: '',
          city: '',
          province: '',
          zip: '',
          minimumPurchase: 0,
          paymentMethods: [],
          email: '',
          password: '',
          plan: 'BASIC',
          status: 'PENDING_VERIFICATION',
          logoUrl: '',
          coverUrl: '',
          website: '',
          catalogUrl: '',
          phone: '',
          instagram: '',
          tiktok: '',
          facebook: '',
          youtube: '',
          mapsUrl: '',
          lat: '',
          lng: '',
          imageUrl: '',
          storeImageUrl: '',
          legacyUid: '',
          legacyUserType: '',
          legacyUser: '',
          contactName: '',
          streamQuota: 0,
          reelQuota: 0,
      });
      setCreateStep(0);
      setCreateErrors([]);
  };

  const validateCreateStep = (step: number) => {
      const errors: string[] = [];
      if (step === 0) {
          if (!formData.name.trim()) errors.push('Nombre de Fantasia');
          if (!formData.razonSocial.trim()) errors.push('Razon Social');
          if (!formData.cuit.trim()) errors.push('CUIT');
      }
      if (step === 1) {
          if (!formData.street.trim()) errors.push('Calle');
          if (!formData.number.trim()) errors.push('Numero');
          if (!formData.city.trim()) errors.push('Ciudad');
          if (!formData.province.trim()) errors.push('Provincia');
          if (!formData.zip.trim()) errors.push('Codigo postal');
      }
      if (step === 2) {
          if (formData.minimumPurchase < 0) errors.push('Monto minimo');
          if (formData.paymentMethods.length === 0) errors.push('Formas de pago');
      }
      if (step === 4) {
          if (!formData.email.trim()) errors.push('Email administrativo');
          if (!formData.password.trim()) errors.push('Contrasena inicial');
          if (!formData.plan) errors.push('Plan');
      }
      return errors;
  };

  const validateCreateForm = () => {
      let firstErrorStep = -1;
      const allErrors: string[] = [];
      createStepLabels.forEach((_, step) => {
          const stepErrors = validateCreateStep(step);
          if (stepErrors.length > 0 && firstErrorStep === -1) {
              firstErrorStep = step;
          }
          allErrors.push(...stepErrors.map((value) => `Paso ${step + 1}: ${value}`));
      });
      return { allErrors, firstErrorStep };
  };

  const goToNextCreateStep = () => {
      const errors = validateCreateStep(createStep);
      if (errors.length) {
          setCreateErrors(errors);
          return;
      }
      setCreateErrors([]);
      setCreateStep((step) => Math.min(step + 1, createStepLabels.length - 1));
  };

  const goToPrevCreateStep = () => {
      setCreateErrors([]);
      setCreateStep((step) => Math.max(step - 1, 0));
  };

  const openCreateModal = () => {
      setIsCreateModalOpen(true);
      setCreateStep(0);
      setCreateErrors([]);
  };

  const closeCreateModal = () => {
      setIsCreateModalOpen(false);
      setCreateErrors([]);
      setCreateStep(0);
  };

  useEffect(() => {
      const needsReels = activeTab === 'REELS' || activeTab === 'DASHBOARD';
      const needsReports = activeTab === 'REPORTS' || activeTab === 'DASHBOARD';
      const needsAdmin = activeTab === 'ADMIN' || activeTab === 'DASHBOARD';

      if (needsReels) {
          setReelsLoading(true);
          fetchAllReelsAdmin().then(setReels).finally(() => setReelsLoading(false));
      }
      if (needsReports) {
          setReportsLoading(true);
          fetchReportsAdmin().then(setReports).finally(() => setReportsLoading(false));
      }
      if (needsAdmin) {
          setPurchasesLoading(true);
          fetchPurchaseRequests(purchaseStatusFilter === 'ALL' ? undefined : purchaseStatusFilter)
            .then(setPurchaseRequests)
            .finally(() => setPurchasesLoading(false));

          setNotificationsLoading(true);
          fetchNotificationsAdmin({
              limit: 50,
              unreadOnly: notificationFilter === 'UNREAD',
              type: notificationType,
          }).then(setAdminNotifications).finally(() => setNotificationsLoading(false));

          setSystemStatusLoading(true);
          fetchSystemStatus()
              .then(setSystemStatus)
              .catch(() => setSystemStatus(null))
              .finally(() => setSystemStatusLoading(false));
      }
  }, [activeTab, notificationFilter, notificationType, purchaseStatusFilter]);
  
  const liveCount = streams.filter(s => s.status === StreamStatus.LIVE).length;
  const missedCount = streams.filter(s => s.status === StreamStatus.MISSED).length;
  const penalizedShops = shops.filter(s => s.isPenalized).length;
  const pendingShops = shops.filter(s => (s.status || 'ACTIVE') === 'PENDING_VERIFICATION');
  const openReports = reports.filter((report) => (report.status || 'OPEN') === 'OPEN');

  const streamStatusLabels: Record<string, string> = {
      LIVE: 'En vivo',
      UPCOMING: 'Próximo',
      FINISHED: 'Finalizado',
      MISSED: 'No realizado',
      CANCELLED: 'Cancelado',
      BANNED: 'Bloqueado',
      PENDING_REPROGRAMMATION: 'Reprogramación pendiente',
  };
  const reportStatusLabels: Record<string, string> = {
      OPEN: 'Abierto',
      RESOLVED: 'Resuelto',
      DISMISSED: 'Rechazado',
  };
  const reelStatusLabels: Record<string, string> = {
      ACTIVE: 'Activo',
      HIDDEN: 'Oculto',
      EXPIRED: 'Expirado',
  };
  const purchaseStatusLabels: Record<string, string> = {
      PENDING: 'Pendiente',
      APPROVED: 'Aprobada',
      REJECTED: 'Rechazada',
  };
  const dataIntegrityLabels: Record<string, string> = {
      COMPLETE: 'Completa',
      MINIMAL: 'Mínima',
      INSUFFICIENT: 'Insuficiente',
  };
  const notificationTypeLabels: Record<string, string> = {
      SYSTEM: 'Sistema',
      REMINDER: 'Recordatorio',
      PURCHASE: 'Compra',
  };
  const shopStatusLabels: Record<string, string> = {
      ACTIVE: 'Activa',
      PENDING_VERIFICATION: 'Pendiente',
      AGENDA_SUSPENDED: 'Agenda suspendida',
      HIDDEN: 'Oculta',
      BANNED: 'Bloqueada',
  };

  const formatStreamStatus = (status?: string) => streamStatusLabels[status || ''] || status || '-';
  const formatReportStatus = (status?: string) => reportStatusLabels[status || 'OPEN'] || status || '-';
  const formatReelStatus = (status?: string) => reelStatusLabels[status || ''] || status || '-';
  const formatPurchaseStatus = (status?: string) => purchaseStatusLabels[status || ''] || status || '-';
  const formatNotificationType = (value?: string) => notificationTypeLabels[value || ''] || value || '-';
  const formatIntegrity = (value?: string) => dataIntegrityLabels[value || ''] || value || '-';
  const formatShopStatus = (status?: string) => shopStatusLabels[status || ''] || status || '-';
  const pendingPurchases = purchaseRequests.filter((purchase) => (purchase.status || 'PENDING') === 'PENDING');

  const handleStatusChange = async (streamId: string, newStatus: StreamStatus) => {
      const stream = streams.find(s => s.id === streamId);
      if(stream) {
          const updates: Partial<Stream> = { status: newStatus };
          if (newStatus === StreamStatus.LIVE) {
                updates.startedAt = Date.now();
          }
          await updateStream({ ...stream, ...updates, isAdminOverride: true });
          onRefreshData();
      }
  };

  const forceExtend = async (streamId: string) => {
      const stream = streams.find(s => s.id === streamId);
      if (!stream) return;
      await updateStream({ ...stream, extensionCount: (stream.extensionCount || 0) + 1, isAdminOverride: true });
      onRefreshData();
  };

  const runSanctions = async () => {
      if (sanctionsRunning) return;
      setSanctionsRunning(true);
      try {
          const result = await runSanctions();
          setSanctionsSummary(result);
          setNotice({
              title: 'Motor ejecutado',
              message: `Procesados ${result?.candidates ?? 0} vivos. Sancionados: ${result?.sanctioned ?? 0}. Reprogramados: ${result?.reprogrammed ?? 0}.`,
              tone: 'success',
          });
          onRefreshData();
      } catch (error: any) {
          setNotice({
              title: 'Error en motor',
              message: error?.message || 'No se pudo ejecutar el motor.',
              tone: 'error',
          });
      } finally {
          setSanctionsRunning(false);
      }
  };

  const runNotifications = async () => {
      if (notificationsRunning) return;
      setNotificationsRunning(true);
      try {
          const result = await runNotifications(15);
          setNotificationsSummary(result);
          setNotice({
              title: 'Notificaciones ejecutadas',
              message: `Creadas: ${result?.created ?? 0}. Omitidas: ${result?.skipped ?? 0}.`,
              tone: 'success',
          });
      } catch (error: any) {
          setNotice({
              title: 'Error en notificaciones',
              message: error?.message || 'No se pudo ejecutar la cola.',
              tone: 'error',
          });
      } finally {
          setNotificationsRunning(false);
      }
  };

  const runStreamsLifecycle = async () => {
      if (streamsLifecycleRunning) return;
      setStreamsLifecycleRunning(true);
      try {
          const result = await runStreamsLifecycle();
          setStreamsLifecycleSummary(result);
          setNotice({
              title: 'Ciclo de vivos ejecutado',
              message: `Iniciados: ${result?.started ?? 0}. Finalizados: ${result?.finished ?? 0}.`,
              tone: 'success',
          });
          onRefreshData();
      } catch (error: any) {
          setNotice({
              title: 'Error en ciclo de vivos',
              message: error?.message || 'No se pudo ejecutar el ciclo.',
              tone: 'error',
          });
      } finally {
          setStreamsLifecycleRunning(false);
      }
  };

  const refreshAdminNotifications = async () => {
      const data = await fetchNotificationsAdmin({
          limit: 50,
          unreadOnly: notificationFilter === 'UNREAD',
          type: notificationType,
      });
      setAdminNotifications(data);
  };

  const markNotificationRead = async (id: string) => {
      await markNotificationRead(id);
      setAdminNotifications((prev) => prev.map((note) => (note.id === id ? { ...note, read: true } : note)));
  };

  const formatNotificationDate = (value?: string) => {
      if (!value) return '';
      try {
          return new Date(value).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
      } catch {
          return value;
      }
  };

  const editStreamUrl = async (streamId: string) => {
      const stream = streams.find(s => s.id === streamId);
      if (!stream) return;
      setInputDialog({
          title: 'Editar URL del vivo',
          message: 'Ingresa la nueva URL para este vivo.',
          placeholders: ['https://...'],
          defaults: [stream.url || ''],
          confirmLabel: 'Guardar',
          onConfirm: async ([url]) => {
              if (!url) return;
              await updateStream({ ...stream, url, isAdminOverride: true });
              onRefreshData();
          },
      });
      setInputValues([stream.url || '']);
  };

  const adjustStreamTime = async (streamId: string) => {
      const stream = streams.find(s => s.id === streamId);
      if (!stream) return;
      setInputDialog({
          title: 'Ajustar horario del vivo',
          message: 'Formato: YYYY-MM-DDTHH:mm',
          placeholders: ['2026-01-05T15:30'],
          defaults: [stream.fullDateISO.slice(0, 16)],
          confirmLabel: 'Actualizar',
          onConfirm: async ([value]) => {
              if (!value) return;
              const iso = new Date(value).toISOString();
              await updateStream({ ...stream, fullDateISO: iso, forceScheduleUpdate: true, isAdminOverride: true });
              onRefreshData();
          },
      });
      setInputValues([stream.fullDateISO.slice(0, 16)]);
  };

  const toggleVisibility = async (streamId: string) => {
    const stream = streams.find(s => s.id === streamId);
    if(stream) {
        await updateStream({ ...stream, isVisible: !stream.isVisible });
        onRefreshData();
    }
  };

  const cancelStream = async (streamId: string) => {
      setInputDialog({
          title: 'Cancelar vivo',
          message: 'Ingresa el motivo de cancelación.',
          placeholders: ['Motivo...'],
          confirmLabel: 'Cancelar vivo',
          onConfirm: async ([reason]) => {
              await cancelStream(streamId, reason || undefined);
              onRefreshData();
          },
      });
      setInputValues(['']);
  };

  const banStream = async (streamId: string) => {
      setInputDialog({
          title: 'Bloquear vivo',
          message: 'Ingresa el motivo del bloqueo.',
          placeholders: ['Motivo...'],
          confirmLabel: 'Bloquear vivo',
          onConfirm: async ([reason]) => {
              await banStream(streamId, reason || undefined);
              onRefreshData();
          },
      });
      setInputValues(['']);
  };

  const togglePenalty = async (shopId: string) => {
      await togglePenalty(shopId);
      onRefreshData();
  };

  const activateShop = async (shopId: string) => {
      await activateShop(shopId);
      onRefreshData();
  };

  const rejectShop = async (shopId: string) => {
      setInputDialog({
          title: 'Rechazar tienda',
          message: 'Ingresa el motivo del rechazo.',
          placeholders: ['Motivo...'],
          confirmLabel: 'Rechazar',
          onConfirm: async ([reason]) => {
              await rejectShop(shopId, reason || undefined);
              onRefreshData();
          },
      });
      setInputValues(['']);
  };

  const suspendAgenda = async (shopId: string) => {
      setInputDialog({
          title: 'Suspender agenda',
          message: 'Motivo y días de suspensión.',
          placeholders: ['Motivo...', '7'],
          defaults: ['', '7'],
          confirmLabel: 'Suspender',
          onConfirm: async ([reason, daysRaw]) => {
              const days = Number(daysRaw || 7);
              await suspendAgenda(shopId, reason || undefined, isNaN(days) ? 7 : days);
              onRefreshData();
          },
      });
      setInputValues(['', '7']);
  };

  const liftSuspension = async (shopId: string) => {
      await liftAgendaSuspension(shopId);
      onRefreshData();
  };

  const resetPassword = async (shopId: string) => {
      setConfirmDialog({
          title: 'Restablecer clave',
          message: 'Se generará un enlace para definir una nueva clave.',
          confirmLabel: 'Restablecer',
          onConfirm: async () => {
              const result = await resetShopPassword(shopId);
              if (result?.resetLink) {
                  let copied = false;
                  try {
                      await navigator.clipboard.writeText(result.resetLink);
                      copied = true;
                  } catch {}
                  setNotice({
                      title: 'Enlace generado',
                      message: copied
                          ? 'Se copió el enlace de restablecimiento.'
                          : `Enlace: ${result.resetLink}`,
                      tone: 'success',
                  });
                  return;
              }
              setNotice({
                  title: 'Clave reseteada',
                  message: 'No se recibió enlace de restablecimiento.',
                  tone: 'success',
              });
          },
      });
  };

  const assignOwner = async (shopId: string) => {
      setInputDialog({
          title: 'Asignar dueño',
          message: 'Ingresa el email del dueño (debe haber iniciado sesión).',
          placeholders: ['email@dominio.com'],
          defaults: [''],
          confirmLabel: 'Asignar',
          onConfirm: async ([email]) => {
              const trimmedEmail = (email || '').trim();
              if (!trimmedEmail) {
                  setNotice({
                      title: 'Email requerido',
                      message: 'Debes indicar un email válido.',
                      tone: 'warning',
                  });
                  return;
              }
              await assignShopOwner(shopId, { email: trimmedEmail });
              setNotice({
                  title: 'Dueño asignado',
                  message: 'La tienda quedó vinculada al nuevo dueño.',
                  tone: 'success',
              });
              onRefreshData();
          },
      });
      setInputValues(['']);
  };

  const deleteShop = async (shop: Shop) => {
      setConfirmDialog({
          title: 'Eliminar tienda',
          message: `Esta acción elimina la tienda "${shop.name}" y todos sus datos asociados. No se puede deshacer.`,
          confirmLabel: 'Eliminar definitivamente',
          onConfirm: async () => {
              try {
                  await deleteShop(shop.id);
                  setShops((prev) => prev.filter((item) => item.id !== shop.id));
                  setNotice({
                      title: 'Tienda eliminada',
                      message: 'La tienda fue eliminada correctamente.',
                      tone: 'success',
                  });
                  onRefreshData();
              } catch (error: any) {
                  setNotice({
                      title: 'No se pudo eliminar',
                      message: error?.message || 'Error al eliminar la tienda.',
                      tone: 'error',
                  });
              }
          },
      });
  };

  const toggleReelHide = async (reel: Reel) => {
      if (reel.status === 'HIDDEN') {
          await reactivateReel(reel.id);
      } else {
          await hideReel(reel.id);
      }
      fetchAllReelsAdmin().then(setReels);
  };

  const togglePaymentMethod = (method: string) => {
      setFormData(prev => ({
          ...prev,
          paymentMethods: prev.paymentMethods.includes(method) 
            ? prev.paymentMethods.filter(m => m !== method)
            : [...prev.paymentMethods, method]
      }));
  };

  const handleAddressSelect = (details: { street: string; number: string; city: string; province: string; zip: string }) => {
      setFormData(prev => ({
          ...prev,
          street: details.street,
          number: details.number,
          city: details.city,
          province: details.province,
          zip: details.zip
      }));
  };

  const handleCreateShop = async (e: React.FormEvent) => {
      e.preventDefault();
      const { allErrors, firstErrorStep } = validateCreateForm();
      if (allErrors.length > 0) {
          setNotice({
              title: 'Campos obligatorios',
              message: 'Completa los campos requeridos para continuar.',
              tone: 'warning',
          });
          setCreateErrors(allErrors);
          if (firstErrorStep >= 0) {
              setCreateStep(firstErrorStep);
          }
          return;
      }

      const latValue = formData.lat.trim();
      const lngValue = formData.lng.trim();
      const lat = latValue ? Number(latValue) : undefined;
      const lng = lngValue ? Number(lngValue) : undefined;
      const addressDetails = {
          street: formData.street,
          number: formData.number,
          city: formData.city,
          province: formData.province,
          zip: formData.zip,
          mapsUrl: formData.mapsUrl || undefined,
          lat: Number.isFinite(lat) ? lat : undefined,
          lng: Number.isFinite(lng) ? lng : undefined,
          catalogUrl: formData.catalogUrl || undefined,
          storeImageUrl: formData.storeImageUrl || undefined,
          imageUrl: formData.imageUrl || undefined,
          legacyUid: formData.legacyUid || undefined,
          legacyUserType: formData.legacyUserType || undefined,
          legacyUser: formData.legacyUser || undefined,
          contactName: formData.contactName || undefined,
      };
      const socialHandles = {
          instagram: formData.instagram || '',
          tiktok: formData.tiktok || '',
          facebook: formData.facebook || '',
          youtube: formData.youtube || '',
      };
      const whatsappLines = formData.phone
          ? [{ label: 'Ventas por mayor', number: formData.phone }]
          : [];

      const addressLine = [formData.street, formData.number].filter(Boolean).join(' ');
      const fullAddress = [addressLine, formData.city, formData.province, formData.zip]
          .filter(Boolean)
          .join(', ');
      const payload = {
          name: formData.name,
          razonSocial: formData.razonSocial,
          cuit: formData.cuit,
          address: fullAddress,
          addressDetails,
          minimumPurchase: formData.minimumPurchase,
          paymentMethods: formData.paymentMethods,
          email: formData.email,
          password: formData.password,
          plan: formData.plan,
          status: formData.status,
          active: formData.status === 'ACTIVE',
          logoUrl: formData.logoUrl,
          coverUrl: formData.coverUrl,
          website: formData.website,
          socialHandles,
          whatsappLines,
          streamQuota: formData.streamQuota,
          reelQuota: formData.reelQuota,
          slug: formData.name.toLowerCase().replace(/\s+/g, '-')
      };

      const result = await createShop(payload);
      if (result.success) {
          setNotice({
              title: 'Tienda creada',
              message: result.message,
              tone: 'success',
          });
          setIsCreateModalOpen(false);
          resetCreateForm();
          onRefreshData();
      }
  };

  const openEditShop = (shop: Shop) => {
      const details = shop.addressDetails || ({} as any);
      const firstWhatsapp = shop.whatsappLines?.[0]?.number || '';
      setEditShop(shop);
      setEditForm({
          name: shop.name || '',
          razonSocial: shop.razonSocial || '',
          cuit: shop.cuit || '',
          email: shop.email || '',
          website: shop.website || '',
          logoUrl: shop.logoUrl || '',
          minimumPurchase: Number(shop.minimumPurchase || 0),
          street: details.street || '',
          number: details.number || '',
          city: details.city || '',
          province: details.province || '',
          zip: details.zip || '',
          whatsapp: firstWhatsapp,
          instagram: shop.socialHandles?.instagram || '',
          tiktok: shop.socialHandles?.tiktok || '',
          facebook: shop.socialHandles?.facebook || '',
          youtube: shop.socialHandles?.youtube || '',
      });
  };

  const handleEditShopSave = async () => {
      if (!editShop) return;
      const addressLine = [editForm.street, editForm.number].filter(Boolean).join(' ');
      const fullAddress = [addressLine, editForm.city, editForm.province, editForm.zip].filter(Boolean).join(', ');
      const updated: Shop = {
          ...editShop,
          name: editForm.name,
          razonSocial: editForm.razonSocial,
          cuit: editForm.cuit,
          email: editForm.email,
          website: editForm.website || undefined,
          logoUrl: editForm.logoUrl || '',
          minimumPurchase: Number(editForm.minimumPurchase || 0),
          address: fullAddress || undefined,
          addressDetails: {
              street: editForm.street,
              number: editForm.number,
              city: editForm.city,
              province: editForm.province,
              zip: editForm.zip,
          },
          whatsappLines: editForm.whatsapp
              ? [{ label: 'Principal', number: editForm.whatsapp }]
              : [],
          socialHandles: {
              instagram: editForm.instagram,
              tiktok: editForm.tiktok,
              facebook: editForm.facebook,
              youtube: editForm.youtube,
          },
      };

      const ok = await onShopUpdate(updated);
      if (ok) {
          setNotice({
              title: 'Tienda actualizada',
              message: 'Los datos de la tienda se guardaron correctamente.',
              tone: 'success',
          });
          setEditShop(null);
      }
  };

  const handleAssignQuota = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isSuperadmin) {
          setNotice({
              title: 'Acceso restringido',
              message: 'Solo un SUPERADMIN puede asignar cupos manuales.',
              tone: 'warning',
          });
          return;
      }
      if (!quotaShopId) {
          setNotice({
              title: 'Selecciona una tienda',
              message: 'Debes elegir una tienda antes de asignar cupos.',
              tone: 'warning',
          });
          return;
      }
      if (quotaAmount <= 0) {
          setNotice({
              title: 'Cantidad inválida',
              message: 'La cantidad debe ser mayor a 0.',
              tone: 'warning',
          });
          return;
      }
      if (quotaType === 'STREAM') {
          await buyStreamQuota(quotaShopId, quotaAmount);
      } else {
          await buyReelQuota(quotaShopId, quotaAmount);
      }
      setNotice({
          title: 'Cupos asignados',
          message: 'La asignación se completó correctamente.',
          tone: 'success',
      });
      onRefreshData();
  };

  const refreshSystemStatus = async () => {
      setSystemStatusLoading(true);
      try {
          const data = await fetchSystemStatus();
          setSystemStatus(data);
      } catch (error) {
          setSystemStatus(null);
      } finally {
          setSystemStatusLoading(false);
      }
  };

  const handleApprovePurchase = async (purchaseId: string) => {
      if (!isSuperadmin) {
          setNotice({
              title: 'Acceso restringido',
              message: 'Solo un SUPERADMIN puede aprobar compras.',
              tone: 'warning',
          });
          return;
      }
      try {
          await approvePurchase(purchaseId);
          setNotice({
              title: 'Compra aprobada',
              message: 'La solicitud fue aprobada y los cupos se acreditaron.',
              tone: 'success',
          });
          const data = await fetchPurchaseRequests('PENDING');
          setPurchaseRequests(data);
          onRefreshData();
      } catch (error: any) {
          setNotice({
              title: 'Error al aprobar',
              message: error?.message || 'No se pudo aprobar la compra.',
              tone: 'error',
          });
      }
  };

  const handleRejectPurchase = async (purchaseId: string) => {
      if (!isSuperadmin) {
          setNotice({
              title: 'Acceso restringido',
              message: 'Solo un SUPERADMIN puede rechazar compras.',
              tone: 'warning',
          });
          return;
      }
      setInputDialog({
          title: 'Rechazar compra',
          message: 'Ingresa el motivo del rechazo (opcional).',
          placeholders: ['Motivo...'],
          confirmLabel: 'Rechazar',
          onConfirm: async ([reason]) => {
              try {
                  await rejectPurchase(purchaseId, reason || undefined);
                  setNotice({
                      title: 'Compra rechazada',
                      message: 'La solicitud fue rechazada.',
                      tone: 'info',
                  });
                  const data = await fetchPurchaseRequests('PENDING');
                  setPurchaseRequests(data);
                  onRefreshData();
              } catch (error: any) {
                  setNotice({
                      title: 'Error al rechazar',
                      message: error?.message || 'No se pudo rechazar la compra.',
                      tone: 'error',
                  });
              }
          },
      });
      setInputValues(['']);
  };

  const filteredShops = shops
      .filter((shop) => (shopFilter === 'ALL' ? true : (shop.status || 'ACTIVE') === shopFilter))
      .filter((shop) => shop.name.toLowerCase().includes(shopQuery.toLowerCase()));
  const filteredAgendaStreams = streams
      .filter(stream => stream.shop?.name?.toLowerCase().includes(agendaQuery.toLowerCase()))
      .filter(stream => agendaStatus === 'ALL' ? true : stream.status === agendaStatus)
      .sort((a, b) => new Date(a.fullDateISO).getTime() - new Date(b.fullDateISO).getTime());

  const filteredStreams = streams
      .filter((stream) => (streamStatusFilter === 'ALL' ? true : stream.status === streamStatusFilter))
      .filter((stream) => {
          const query = streamQuery.toLowerCase();
          return (
              stream.title.toLowerCase().includes(query) ||
              stream.shop?.name?.toLowerCase().includes(query)
          );
      });

  const filteredReports = reports
      .filter((report) => (reportStatusFilter === 'ALL' ? true : (report.status || 'OPEN') === reportStatusFilter))
      .filter((report) => {
          const query = reportQuery.toLowerCase();
          const title = report?.stream?.title || '';
          const shopName = report?.stream?.shop?.name || '';
          return title.toLowerCase().includes(query) || shopName.toLowerCase().includes(query);
      });

  const filteredPurchases = purchaseRequests.filter((purchase) => {
      const query = purchaseQuery.toLowerCase();
      const shopName = purchase?.shop?.name || '';
      return shopName.toLowerCase().includes(query);
  });

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
            <h1 className={styles.headerTitle}>Panel de Control ADMIN</h1>
            <span className={styles.headerBadge}>{adminRoleLabel}</span>
        </div>
      </header>

      <div className={styles.content}>
        <aside className={styles.sidebar}>
            <nav className={styles.sidebarNav}>
                {['DASHBOARD', 'AGENDA', 'STREAMS', 'SHOPS', 'REELS', 'REPORTS', 'ADMIN'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => onTabChange(tab as AdminTab)}
                        className={`${styles.sidebarButton} ${activeTab === tab ? styles.sidebarButtonActive : styles.sidebarButtonInactive}`}
                    >
                        {tab === 'DASHBOARD' ? <LayoutDashboard size={18} /> : tab === 'AGENDA' ? <Calendar size={18} /> : tab === 'STREAMS' ? <Radio size={18}/> : tab === 'SHOPS' ? <Store size={18}/> : tab === 'REELS' ? <Film size={18}/> : tab === 'REPORTS' ? <AlertTriangle size={18} /> : <ShoppingBag size={18}/>}
                        {tab === 'DASHBOARD' ? 'Resumen' : tab === 'AGENDA' ? 'Agenda' : tab === 'STREAMS' ? 'Vivos' : tab === 'SHOPS' ? 'Tiendas' : tab === 'REELS' ? 'Reels' : tab === 'REPORTS' ? 'Reportes' : 'Administrativo'}
                    </button>
                ))}
            </nav>
        </aside>

        <main className={styles.main}>
            <div className={styles.mobileTabs}>
                <div className={styles.mobileTabList}>
                    {['DASHBOARD', 'AGENDA', 'STREAMS', 'SHOPS', 'REELS', 'REPORTS', 'ADMIN'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => onTabChange(tab as AdminTab)}
                            className={`${styles.mobileTabButton} ${activeTab === tab ? styles.mobileTabActive : styles.mobileTabInactive}`}
                        >
                            {tab === 'DASHBOARD' ? 'Resumen' : tab === 'AGENDA' ? 'Agenda' : tab === 'STREAMS' ? 'Vivos' : tab === 'SHOPS' ? 'Tiendas' : tab === 'REELS' ? 'Reels' : tab === 'REPORTS' ? 'Reportes' : 'Administrativo'}
                        </button>
                    ))}
                </div>
            </div>
            {activeTab === 'DASHBOARD' && (
                <div className={styles.dashboardSection}>
                    <h2 className={styles.dashboardTitle}>Estado del Sistema</h2>
                    <div className={styles.statsGrid}>
                        <div className={styles.statsCard}>
                            <div>
                              <p className={styles.statLabel}>EN VIVO</p>
                              <p className={styles.statValue}>{liveCount}</p>
                            </div>
                            <Radio className={styles.statsIconLive} />
                        </div>
                        <div className={styles.statsCard}>
                            <div>
                              <p className={styles.statLabel}>INCUMPLIDOS</p>
                              <p className={styles.statValue}>{missedCount}</p>
                            </div>
                            <AlertTriangle className={styles.statsIconWarning} />
                        </div>
                        <div className={styles.statsCard}>
                            <div>
                              <p className={styles.statLabel}>PENALIZADAS</p>
                              <p className={styles.statValue}>{penalizedShops}</p>
                            </div>
                            <AlertOctagon className={styles.statsIconMuted} />
                        </div>
                        <div className={styles.statsCard}>
                            <div>
                              <p className={styles.statLabel}>REELS ACTIVOS</p>
                              <p className={styles.statValue}>
                                {reels.filter(r => r.status === 'ACTIVE').length}
                              </p>
                            </div>
                            <Film className={styles.statsIconAccent} />
                        </div>
                    </div>

                    <div className={styles.inboxWrap}>
                        <div className={styles.sectionHeader}>
                            <div>
                                <p className={styles.sectionLabel}>INBOX OPERATIVO</p>
                                <p className={styles.sectionSub}>Pendientes que requieren accion inmediata</p>
                            </div>
                        </div>
                        <div className={styles.inboxGrid}>
                            <div className={styles.pendingCard}>
                                <div className={styles.pendingHeader}>
                                    <div>
                                        <p className={styles.statLabel}>TIENDAS PENDIENTES</p>
                                        <p className={styles.pendingCount}>{pendingShops.length}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setShopFilter('PENDING_VERIFICATION');
                                            onTabChange('SHOPS');
                                        }}
                                    >
                                        Ver
                                    </Button>
                                </div>
                                <div className={styles.pendingList}>
                                    {pendingShops.slice(0, 3).map((shop) => (
                                        <button
                                            key={shop.id}
                                            onClick={() => {
                                                setShopFilter('PENDING_VERIFICATION');
                                                onTabChange('SHOPS');
                                            }}
                                            className={styles.pendingItem}
                                        >
                                            <p className={styles.pendingItemTitle}>{shop.name}</p>
                                            <p className={styles.pendingItemMeta}>{shop.email || 'Sin email'}</p>
                                        </button>
                                    ))}
                                    {pendingShops.length === 0 && (
                                        <p className={styles.pendingEmpty}>Sin pendientes por aprobar.</p>
                                    )}
                                </div>
                            </div>

                            <div className={styles.pendingCard}>
                                <div className={styles.pendingHeader}>
                                    <div>
                                        <p className={styles.statLabel}>REPORTES ABIERTOS</p>
                                        <p className={styles.pendingCount}>{openReports.length}</p>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => onTabChange('REPORTS')}>
                                        Ver
                                    </Button>
                                </div>
                                <div className={styles.pendingList}>
                                    {openReports.slice(0, 3).map((report) => (
                                        <button
                                            key={report.id}
                                            onClick={() => onTabChange('REPORTS')}
                                            className={styles.pendingItem}
                                        >
                                            <p className={styles.pendingItemTitle}>
                                                {report?.stream?.title || 'Vivo sin titulo'}
                                            </p>
                                            <p className={styles.pendingItemMeta}>
                                                {report?.stream?.shop?.name || 'Sin tienda'}
                                            </p>
                                        </button>
                                    ))}
                                    {openReports.length === 0 && (
                                        <p className={styles.pendingEmpty}>Sin reportes abiertos.</p>
                                    )}
                                </div>
                            </div>

                            <div className={styles.pendingCard}>
                                <div className={styles.pendingHeader}>
                                    <div>
                                        <p className={styles.statLabel}>COMPRAS PENDIENTES</p>
                                        <p className={styles.pendingCount}>{pendingPurchases.length}</p>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => onTabChange('ADMIN')}>
                                        Ver
                                    </Button>
                                </div>
                                <div className={styles.pendingList}>
                                    {pendingPurchases.slice(0, 3).map((purchase) => (
                                        <button
                                            key={purchase.purchaseId || purchase.id}
                                            onClick={() => onTabChange('ADMIN')}
                                            className={styles.pendingItem}
                                        >
                                            <p className={styles.pendingItemTitle}>
                                                {purchase?.shop?.name || 'Tienda sin nombre'}
                                            </p>
                                            <p className={styles.pendingItemMeta}>
                                                {purchase.type || 'PACK'} · {purchase.quantity || 0} cupos
                                            </p>
                                        </button>
                                    ))}
                                    {pendingPurchases.length === 0 && (
                                        <p className={styles.pendingEmpty}>Sin compras pendientes.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'AGENDA' && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Agenda Global</h2>
                    <div className={styles.sectionFilters}>
                        <input
                            type="text"
                            placeholder="Buscar tienda..."
                            value={agendaQuery}
                            onChange={(e) => setAgendaQuery(e.target.value)}
                            className={styles.sectionInput}
                        />
                        <select
                            value={agendaStatus}
                            onChange={(e) => setAgendaStatus(e.target.value as any)}
                            className={styles.sectionSelect}
                        >
                            <option value="ALL">Todos los estados</option>
                            <option value={StreamStatus.LIVE}>En vivo</option>
                            <option value={StreamStatus.UPCOMING}>Próximo</option>
                            <option value={StreamStatus.FINISHED}>Finalizado</option>
                            <option value={StreamStatus.MISSED}>No realizado</option>
                            <option value={StreamStatus.CANCELLED}>Cancelado</option>
                            <option value={StreamStatus.BANNED}>Bloqueado</option>
                            <option value={StreamStatus.PENDING_REPROGRAMMATION}>Reprogramación pendiente</option>
                        </select>
                    </div>

                    <div className={styles.tableCard}>
                        <div className={styles.tableMobile}>
                            {filteredAgendaStreams.length > 0 ? (
                                filteredAgendaStreams.map((stream) => (
                                    <div key={stream.id} className={styles.listItem}>
                                        <div className={styles.listRow}>
                                            <p className={styles.listTitle}>{stream.shop?.name || 'Sin tienda'}</p>
                                            <span className={styles.listStatus}>{formatStreamStatus(stream.status)}</span>
                                        </div>
                                        <p className={styles.listMeta}>
                                            {new Date(stream.fullDateISO).toLocaleDateString()} {stream.scheduledTime} hs
                                        </p>
                                        <p className={styles.listMetaUpper}>{stream.platform}</p>
                                    </div>
                                ))
                            ) : (
                                <div className={styles.emptyText}>Sin resultados</div>
                            )}
                        </div>
                        <div className={styles.tableDesktop}>
                            <table className={styles.table}>
                                <thead className={styles.tableHead}>
                                    <tr>
                                        <th className={styles.tableHeadCell}>Tienda</th>
                                        <th className={styles.tableHeadCell}>Fecha</th>
                                        <th className={styles.tableHeadCell}>Estado</th>
                                        <th className={styles.tableHeadCell}>Plataforma</th>
                                    </tr>
                                </thead>
                                <tbody className={styles.tableBody}>
                                    {filteredAgendaStreams.length > 0 ? (
                                        filteredAgendaStreams.map(stream => (
                                            <tr key={stream.id}>
                                                <td className={`${styles.tableCell} text-sm font-bold`}>{stream.shop?.name || 'Sin tienda'}</td>
                                                <td className={`${styles.tableCell} text-xs text-gray-500`}>
                                                    {new Date(stream.fullDateISO).toLocaleDateString()} {stream.scheduledTime} hs
                                                </td>
                                                <td className={`${styles.tableCell} text-xs font-bold`}>{formatStreamStatus(stream.status)}</td>
                                                <td className={`${styles.tableCell} text-xs`}>{stream.platform}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className={styles.emptyText}>Sin resultados</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'STREAMS' && (
                 <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Gestión de Vivos</h2>
                    <div className={styles.sectionFilters}>
                        <input
                            type="text"
                            placeholder="Buscar vivo o tienda..."
                            value={streamQuery}
                            onChange={(e) => setStreamQuery(e.target.value)}
                            className={styles.sectionInput}
                        />
                        <select
                            value={streamStatusFilter}
                            onChange={(e) => setStreamStatusFilter(e.target.value as any)}
                            className={styles.sectionSelect}
                        >
                            <option value="ALL">Todos los estados</option>
                            <option value={StreamStatus.LIVE}>En vivo</option>
                            <option value={StreamStatus.UPCOMING}>Próximo</option>
                            <option value={StreamStatus.FINISHED}>Finalizado</option>
                            <option value={StreamStatus.MISSED}>No realizado</option>
                            <option value={StreamStatus.CANCELLED}>Cancelado</option>
                            <option value={StreamStatus.BANNED}>Bloqueado</option>
                            <option value={StreamStatus.PENDING_REPROGRAMMATION}>Reprogramación pendiente</option>
                        </select>
                    </div>
                    <div className={styles.tableCard}>
                        <div className={styles.tableMobile}>
                            {filteredStreams.length > 0 ? (
                              filteredStreams.map((stream) => (
                                <div key={stream.id} className={styles.listItem}>
                                    <div className={styles.listRow}>
                                        <div>
                                            <p className={styles.listTitle}>{stream.title}</p>
                                            <p className={styles.listMeta}>{stream.shop.name}</p>
                                        </div>
                                        <span
                                          className={`${styles.statusBadge} ${
                                            stream.status === 'LIVE'
                                              ? styles.statusBadgeLive
                                              : styles.statusBadgeMuted
                                          }`}
                                        >
                                            {formatStreamStatus(stream.status)}
                                        </span>
                                    </div>
                                    <div className={`${styles.listRow} ${styles.listMeta}`}>
                                        <span>Reportes</span>
                                        {stream.reportCount > 0 ? (
                                            <span className={styles.listAlert}><AlertTriangle size={12}/> {stream.reportCount}</span>
                                        ) : (
                                            <span>-</span>
                                        )}
                                    </div>
                                    <div className={styles.listActions}>
                                        <button 
                                            onClick={() => toggleVisibility(stream.id)} 
                                            className={`${styles.visibilityButton} ${stream.isVisible ? styles.visibilityOn : styles.visibilityOff}`}
                                        >
                                            {stream.isVisible ? <Eye size={14}/> : <EyeOff size={14}/>}
                                            {stream.isVisible ? 'Visible' : 'Oculto'}
                                        </button>

                                        {stream.status === 'UPCOMING' && (
                                            <button 
                                                onClick={() => handleStatusChange(stream.id, StreamStatus.LIVE)} 
                                                className={styles.actionSuccess}
                                            >
                                                <PlayCircle size={14}/> Iniciar
                                            </button>
                                        )}
                                        
                                        {stream.status === 'LIVE' && (
                                            <button 
                                                onClick={() => handleStatusChange(stream.id, StreamStatus.FINISHED)} 
                                                className={styles.actionDangerGhost}
                                            >
                                                <StopCircle size={14}/> Finalizar
                                            </button>
                                        )}

                                        {stream.status === 'LIVE' && (
                                            <button 
                                                onClick={() => forceExtend(stream.id)} 
                                                className={styles.actionSuccess}
                                            >
                                                +30 min
                                            </button>
                                        )}

                                        {(stream.status === 'UPCOMING' || stream.status === 'LIVE') && (
                                            <button 
                                                onClick={() => editStreamUrl(stream.id)} 
                                                className={styles.actionNeutral}
                                            >
                                                URL
                                            </button>
                                        )}

                                        {(stream.status === 'UPCOMING' || stream.status === 'LIVE') && (
                                            <button 
                                                onClick={() => adjustStreamTime(stream.id)} 
                                                className={styles.actionNeutral}
                                            >
                                                Hora
                                            </button>
                                        )}

                                        {stream.status === 'UPCOMING' && (
                                            <button 
                                                onClick={() => cancelStream(stream.id)} 
                                                className={styles.actionNeutral}
                                            >
                                                Cancelar
                                            </button>
                                        )}

                                        {stream.status !== 'BANNED' && (
                                            <button 
                                                onClick={() => banStream(stream.id)} 
                                                className={styles.actionDanger}
                                            >
                                                Bloquear
                                            </button>
                                        )}
                                    </div>
                                </div>
                              ))
                            ) : (
                              <div className={styles.emptyText}>Sin resultados.</div>
                            )}
                        </div>
                        <div className={styles.tableDesktop}>
                            <table className={styles.table}>
                                <thead className={styles.tableHead}>
                                    <tr>
                                        <th className={styles.tableHeadCell}>Info</th>
                                        <th className={styles.tableHeadCell}>Reportes</th>
                                        <th className={`${styles.tableHeadCell} ${styles.tableHeadCellRight}`}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className={styles.tableBody}>
                                    {filteredStreams.length > 0 ? (
                                        filteredStreams.map(stream => (
                                        <tr key={stream.id}>
                                            <td className={styles.tableCell}>
                                                <p className={styles.tableTitle}>{stream.title}</p>
                                                <p className={styles.tableMeta}>{stream.shop.name}</p>
                                                <span className={`${styles.tableStatus} ${stream.status === 'LIVE' ? styles.tableStatusLive : styles.tableStatusMuted}`}>{formatStreamStatus(stream.status)}</span>
                                            </td>
                                            <td className={styles.tableCell}>
                                                {stream.reportCount > 0 ? <span className={styles.listAlert}><AlertTriangle size={12}/> {stream.reportCount}</span> : '-'}
                                            </td>
                                            <td className={styles.tableCell}>
                                                <div className={styles.listActionsRight}>
                                                    <button 
                                                        onClick={() => toggleVisibility(stream.id)} 
                                                        title={stream.isVisible ? "Ocultar vivo de la app" : "Hacer visible en la app"}
                                                        className={`${styles.visibilityButton} ${stream.isVisible ? styles.visibilityOn : styles.visibilityOff}`}
                                                    >
                                                        {stream.isVisible ? <Eye size={14}/> : <EyeOff size={14}/>}
                                                        {stream.isVisible ? 'Visible' : 'Oculto'}
                                                    </button>

                                                    {stream.status === 'UPCOMING' && (
                                                        <button 
                                                            onClick={() => handleStatusChange(stream.id, StreamStatus.LIVE)} 
                                                            title="INICIAR VIVO: Comienza el contador de 30 minutos."
                                                            className={styles.actionSuccessHover}
                                                        >
                                                            <PlayCircle size={14}/> Iniciar
                                                        </button>
                                                    )}
                                                    
                                                    {stream.status === 'LIVE' && (
                                                        <button 
                                                            onClick={() => handleStatusChange(stream.id, StreamStatus.FINISHED)} 
                                                            title="FINALIZAR VIVO: Cortar transmisión inmediatamente."
                                                            className={styles.actionDangerGhostHover}
                                                        >
                                                            <StopCircle size={14}/> Finalizar
                                                        </button>
                                                    )}

                                                    {stream.status === 'LIVE' && (
                                                        <button 
                                                            onClick={() => forceExtend(stream.id)} 
                                                            title="FORZAR EXTENSION +30"
                                                            className={styles.actionSuccessHover}
                                                        >
                                                            +30 min
                                                        </button>
                                                    )}

                                                    {(stream.status === 'UPCOMING' || stream.status === 'LIVE') && (
                                                        <button 
                                                            onClick={() => editStreamUrl(stream.id)} 
                                                            title="EDITAR URL"
                                                            className={styles.actionNeutralHover}
                                                        >
                                                            URL
                                                        </button>
                                                    )}

                                                    {(stream.status === 'UPCOMING' || stream.status === 'LIVE') && (
                                                        <button 
                                                            onClick={() => adjustStreamTime(stream.id)} 
                                                            title="AJUSTAR HORA"
                                                            className={styles.actionNeutralHover}
                                                        >
                                                            Hora
                                                        </button>
                                                    )}

                                                    {stream.status === 'UPCOMING' && (
                                                        <button 
                                                            onClick={() => cancelStream(stream.id)} 
                                                            title="CANCELAR VIVO"
                                                            className={styles.actionNeutralHover}
                                                        >
                                                            Cancelar
                                                        </button>
                                                    )}

                                                    {stream.status !== 'BANNED' && (
                                                        <button 
                                                            onClick={() => banStream(stream.id)} 
                                                            title="BLOQUEAR VIVO"
                                                            className={styles.actionDangerHover}
                                                        >
                                                            Bloquear
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className={styles.emptyText}>Sin resultados.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                 </div>
            )}

            {activeTab === 'REPORTS' && (
              <Suspense fallback={<div className={styles.section} />}>
                <AdminReportsTab
                  reportQuery={reportQuery}
                  setReportQuery={setReportQuery}
                  reportStatusFilter={reportStatusFilter}
                  setReportStatusFilter={setReportStatusFilter}
                  reportsLoading={reportsLoading}
                  filteredReports={filteredReports}
                  reports={reports}
                  formatReportStatus={formatReportStatus}
                  resolveReportAdmin={resolveReportAdmin}
                  rejectReportAdmin={rejectReportAdmin}
                  setReports={setReports}
                  setNotice={setNotice}
                  setConfirmDialog={setConfirmDialog}
                />
              </Suspense>
            )}

            {activeTab === 'SHOPS' && (
              <Suspense fallback={<div className={styles.section} />}>
                <AdminShopsTab
                  shopFilter={shopFilter}
                  setShopFilter={setShopFilter}
                  shopQuery={shopQuery}
                  setShopQuery={setShopQuery}
                  pendingShops={pendingShops}
                  filteredShops={filteredShops}
                  formatShopStatus={formatShopStatus}
                  formatIntegrity={formatIntegrity}
                  togglePenalty={togglePenalty}
                  activateShop={activateShop}
                  rejectShop={rejectShop}
                  resetPassword={resetPassword}
                  suspendAgenda={suspendAgenda}
                  liftSuspension={liftSuspension}
                  assignOwner={assignOwner}
                  openEditShop={openEditShop}
                  onPreviewShop={onPreviewShop}
                  deleteShop={deleteShop}
                  openCreateModal={openCreateModal}
                  onPreviewClient={onPreviewClient}
                />
              </Suspense>
            )}

            {activeTab === 'REELS' && (
              <Suspense fallback={<div className={styles.section} />}>
                <AdminReelsTab
                  reels={reels}
                  formatReelStatus={formatReelStatus}
                  toggleReelHide={toggleReelHide}
                />
              </Suspense>
            )}

            {activeTab === 'ADMIN' && (
              <Suspense fallback={<div className={styles.section} />}>
                <AdminAdminTab
                  isSuperadmin={isSuperadmin}
                  purchaseQuery={purchaseQuery}
                  setPurchaseQuery={setPurchaseQuery}
                  purchaseStatusFilter={purchaseStatusFilter}
                  setPurchaseStatusFilter={setPurchaseStatusFilter}
                  purchasesLoading={purchasesLoading}
                  filteredPurchases={filteredPurchases}
                  formatPurchaseStatus={formatPurchaseStatus}
                  handleRejectPurchase={handleRejectPurchase}
                  handleApprovePurchase={handleApprovePurchase}
                  quotaShopId={quotaShopId}
                  setQuotaShopId={setQuotaShopId}
                  quotaType={quotaType}
                  setQuotaType={setQuotaType}
                  quotaAmount={quotaAmount}
                  setQuotaAmount={setQuotaAmount}
                  handleAssignQuota={handleAssignQuota}
                  shops={shops}
                  officialMode={officialMode}
                  setOfficialMode={setOfficialMode}
                  refreshSystemStatus={refreshSystemStatus}
                  systemStatusLoading={systemStatusLoading}
                  systemStatus={systemStatus}
                  streamsLifecycleRunning={streamsLifecycleRunning}
                  runStreamsLifecycle={runStreamsLifecycle}
                  streamsLifecycleSummary={streamsLifecycleSummary}
                  sanctionsRunning={sanctionsRunning}
                  runSanctions={runSanctions}
                  sanctionsSummary={sanctionsSummary}
                  notificationsRunning={notificationsRunning}
                  runNotifications={runNotifications}
                  notificationsSummary={notificationsSummary}
                  notificationFilter={notificationFilter}
                  setNotificationFilter={setNotificationFilter}
                  notificationType={notificationType}
                  setNotificationType={setNotificationType}
                  refreshAdminNotifications={refreshAdminNotifications}
                  notificationsLoading={notificationsLoading}
                  adminNotifications={adminNotifications}
                  formatNotificationType={formatNotificationType}
                  formatNotificationDate={formatNotificationDate}
                  markNotificationRead={markNotificationRead}
                />
              </Suspense>
            )}
        </main>
      </div>

      {/* Modal: Crear Nueva Tienda (Expanded to include full business requirements) */}
      {isCreateModalOpen && (
          <div className={styles.createModalBackdrop}>
              <div className={styles.createModalCard}>
                  
                  {/* Modal Header */}
                  <div className={styles.createModalHeader}>
                      <div className={styles.createModalHeaderLeft}>
                        <div className={styles.createModalHeaderIcon}>
                            <Plus size={24} />
                        </div>
                        <div>
                            <h2 className={styles.createModalHeaderTitle}>Alta de Nueva Tienda</h2>
                            <p className={styles.createModalHeaderSubtitle}>Registro Administrativo</p>
                            <p className={styles.createModalHeaderMeta}>
                              Paso {createStep + 1} de {createStepLabels.length} · Estado inicial: {formData.status}
                            </p>
                        </div>
                      </div>
                      <button onClick={closeCreateModal} className={styles.createModalClose}>
                          <X size={24} />
                      </button>
                  </div>

                  {/* Modal Body / Form */}
                  <form onSubmit={handleCreateShop} className={styles.createModalForm}>
                      <div className={styles.createModalSteps}>
                          {createStepLabels.map((label, index) => {
                              const isActive = index === createStep;
                              const isDone = index < createStep;
                              return (
                                  <div
                                      key={label}
                                      className={`${styles.createModalStep} ${isActive ? styles.createModalStepActive : ''} ${isDone ? styles.createModalStepDone : ''}`}
                                  >
                                      <span className={styles.createModalStepIndex}>{index + 1}</span>
                                      <span className={styles.createModalStepLabel}>{label}</span>
                                  </div>
                              );
                          })}
                      </div>

                      {createErrors.length > 0 && (
                          <div className={styles.createModalErrorBox}>
                              <p className={styles.createModalErrorTitle}>Revisa estos campos:</p>
                              <ul className={styles.createModalErrorList}>
                                  {createErrors.map((error) => (
                                      <li key={error}>{error}</li>
                                  ))}
                              </ul>
                          </div>
                      )}
                      
                      {/* Section 1: Identidad & Legal */}
                      {createStep === 0 && (
                      <section className={styles.createModalSection}>
                          <h3 className={styles.createModalSectionTitle}>
                              <Store size={16} className={styles.adminSectionIcon} /> 1. Identidad & Legal
                          </h3>
                          <div className={styles.createModalGridTwo}>
                              <div className={styles.createModalSpanTwo}>
                                  <label className={styles.createModalLabel}>Nombre de Fantasía (Público) *</label>
                                  <input 
                                      type="text" required value={formData.name}
                                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                                      placeholder="Ej: Las Marianas"
                                      className={styles.createModalInput}
                                  />
                              </div>
                              <div>
                                  <label className={styles.createModalLabel}>Razón Social *</label>
                                  <input 
                                      type="text" required value={formData.razonSocial}
                                      onChange={(e) => setFormData({...formData, razonSocial: e.target.value})}
                                      placeholder="Nombre legal completo"
                                      className={styles.createModalInput}
                                  />
                              </div>
                              <div>
                                  <label className={styles.createModalLabel}>CUIT *</label>
                                  <input 
                                      type="text" required value={formData.cuit}
                                      onChange={(e) => setFormData({...formData, cuit: e.target.value})}
                                      placeholder="30-XXXXXXXX-X"
                                      className={styles.createModalInput}
                                  />
                              </div>
                              <div>
                                  <label className={styles.createModalLabel}>Nombre completo (contacto)</label>
                                  <input
                                      type="text"
                                      value={formData.contactName}
                                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                      placeholder="Nombre de contacto"
                                      className={styles.createModalInput}
                                  />
                              </div>
                              <div>
                                  <label className={styles.createModalLabel}>UID (importacion)</label>
                                  <input
                                      type="text"
                                      value={formData.legacyUid}
                                      onChange={(e) => setFormData({ ...formData, legacyUid: e.target.value })}
                                      placeholder="UID externo"
                                      className={styles.createModalInput}
                                  />
                              </div>
                              <div>
                                  <label className={styles.createModalLabel}>Usuario (importacion)</label>
                                  <input
                                      type="text"
                                      value={formData.legacyUser}
                                      onChange={(e) => setFormData({ ...formData, legacyUser: e.target.value })}
                                      placeholder="Usuario externo"
                                      className={styles.createModalInput}
                                  />
                              </div>
                              <div>
                                  <label className={styles.createModalLabel}>Tipo de usuario (importacion)</label>
                                  <input
                                      type="text"
                                      value={formData.legacyUserType}
                                      onChange={(e) => setFormData({ ...formData, legacyUserType: e.target.value })}
                                      placeholder="Tipo externo"
                                      className={styles.createModalInput}
                                  />
                              </div>
                          </div>
                      </section>
                      )}

                      {/* Section 2: Dirección Física */}
                      {createStep === 1 && (
                      <section className={styles.createModalSection}>
                          <h3 className={styles.createModalSectionTitle}>
                              <MapPin size={16} className={styles.adminSectionIcon} /> 2. Dirección Física
                          </h3>
                          <div className={styles.createModalStack}>
                               <div className={styles.createModalField}>
                                    <label className={styles.createModalLabel}>Buscador Google Maps (Simulado)</label>
                                    <AddressAutocomplete onSelect={handleAddressSelect} />
                               </div>
                               <div className={styles.createModalGridThree}>
                                    <div className={styles.createModalSpanTwo}>
                                        <label className={styles.createModalLabel}>Calle</label>
                                        <input 
                                            type="text" value={formData.street}
                                            onChange={(e) => setFormData({...formData, street: e.target.value})}
                                            className={`${styles.createModalInput} bg-gray-50`}
                                        />
                                    </div>
                                    <div>
                                        <label className={styles.createModalLabel}>Número</label>
                                        <input 
                                            type="text" value={formData.number}
                                            onChange={(e) => setFormData({...formData, number: e.target.value})}
                                            className={`${styles.createModalInput} bg-gray-50`}
                                        />
                                    </div>
                                    <div>
                                        <label className={styles.createModalLabel}>Localidad / Barrio</label>
                                        <input 
                                            type="text" value={formData.city}
                                            onChange={(e) => setFormData({...formData, city: e.target.value})}
                                            className={`${styles.createModalInput} bg-gray-50`}
                                        />
                                    </div>
                                    <div>
                                        <label className={styles.createModalLabel}>Provincia</label>
                                        <input 
                                            type="text" value={formData.province}
                                            onChange={(e) => setFormData({...formData, province: e.target.value})}
                                            className={`${styles.createModalInput} bg-gray-50`}
                                        />
                                    </div>
                                    <div>
                                        <label className={styles.createModalLabel}>CP</label>
                                        <input 
                                            type="text" value={formData.zip}
                                            onChange={(e) => setFormData({...formData, zip: e.target.value})}
                                            className={`${styles.createModalInput} bg-gray-50`}
                                        />
                                    </div>
                               </div>
                               <div className={styles.createModalGridThree}>
                                    <div className={styles.createModalSpanTwo}>
                                        <label className={styles.createModalLabel}>URL de Maps</label>
                                        <input
                                            type="text"
                                            value={formData.mapsUrl}
                                            onChange={(e) => setFormData({ ...formData, mapsUrl: e.target.value })}
                                            placeholder="https://maps.google.com/..."
                                            className={styles.createModalInput}
                                        />
                                    </div>
                                    <div>
                                        <label className={styles.createModalLabel}>Lat</label>
                                        <input
                                            type="text"
                                            value={formData.lat}
                                            onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                                            placeholder="-34.XXXX"
                                            className={styles.createModalInput}
                                        />
                                    </div>
                                    <div>
                                        <label className={styles.createModalLabel}>Lng</label>
                                        <input
                                            type="text"
                                            value={formData.lng}
                                            onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                                            placeholder="-58.XXXX"
                                            className={styles.createModalInput}
                                        />
                                    </div>
                               </div>
                          </div>
                      </section>
                      )}

                      {/* Section 3: Condiciones de Venta */}
                      {createStep === 2 && (
                      <section className={styles.createModalSection}>
                          <h3 className={styles.createModalSectionTitle}>
                              <CreditCard size={16} className={styles.adminSectionIcon} /> 3. Condiciones de Venta
                          </h3>
                          <div className={styles.createModalGridTwo}>
                              <div>
                                  <label className={styles.createModalLabel}>Monto Mínimo de Compra ($)</label>
                                  <div className={styles.createModalField}>
                                      <span className={styles.adminPricePrefix}>$</span>
                                      <input 
                                          type="number" value={formData.minimumPurchase}
                                          onChange={(e) => setFormData({...formData, minimumPurchase: parseInt(e.target.value) || 0})}
                                          className={`${styles.createModalInput} pl-8`}
                                      />
                                  </div>
                              </div>
                              <div>
                                  <label className={styles.createModalLabel}>Formas de Pago Aceptadas</label>
                                  <div className={styles.adminPaymentGrid}>
                                      {PAYMENT_OPTIONS.map(method => (
                                          <label key={method} className={`${styles.adminPaymentOption} group`}>
                                              <input 
                                                  type="checkbox" 
                                                  checked={formData.paymentMethods.includes(method)}
                                                  onChange={() => togglePaymentMethod(method)}
                                                  className={styles.adminPaymentInput}
                                              />
                                              <span className={styles.adminPaymentLabel}>{method}</span>
                                          </label>
                                      ))}
                                  </div>
                              </div>
                          </div>
                          <div className={styles.createModalGridTwo}>
                              <div>
                                  <label className={styles.createModalLabel}>URL tienda (sitio web)</label>
                                  <input
                                      type="text"
                                      value={formData.website}
                                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                      placeholder="https://..."
                                      className={styles.createModalInput}
                                  />
                              </div>
                              <div>
                                  <label className={styles.createModalLabel}>URL catalogo</label>
                                  <input
                                      type="text"
                                      value={formData.catalogUrl}
                                      onChange={(e) => setFormData({ ...formData, catalogUrl: e.target.value })}
                                      placeholder="https://..."
                                      className={styles.createModalInput}
                                  />
                              </div>
                          </div>
                      </section>
                      )}

                      {/* Section 4: Redes y enlaces */}
                      {createStep === 3 && (
                      <section className={styles.createModalSection}>
                          <h3 className={styles.createModalSectionTitle}>
                              <Globe size={16} className={styles.adminSectionIcon} /> 4. Redes y enlaces
                          </h3>
                          <div className={styles.createModalGridThree}>
                              <div>
                                  <label className={styles.createModalLabel}>Instagram URL</label>
                                  <input
                                      type="text"
                                      value={formData.instagram}
                                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                      placeholder="https://instagram.com/..."
                                      className={styles.createModalInput}
                                  />
                              </div>
                              <div>
                                  <label className={styles.createModalLabel}>TikTok URL</label>
                                  <input
                                      type="text"
                                      value={formData.tiktok}
                                      onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                                      placeholder="https://tiktok.com/@..."
                                      className={styles.createModalInput}
                                  />
                              </div>
                              <div>
                                  <label className={styles.createModalLabel}>Facebook URL</label>
                                  <input
                                      type="text"
                                      value={formData.facebook}
                                      onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                                      placeholder="https://facebook.com/..."
                                      className={styles.createModalInput}
                                  />
                              </div>
                              <div>
                                  <label className={styles.createModalLabel}>YouTube URL</label>
                                  <input
                                      type="text"
                                      value={formData.youtube}
                                      onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                                      placeholder="https://youtube.com/..."
                                      className={styles.createModalInput}
                                  />
                              </div>
                          </div>
                      </section>
                      )}

                      {/* Section 5: Contacto Administrativo & Cuenta */}
                      {createStep === 4 && (
                      <section className={styles.createModalSection}>
                          <h3 className={styles.createModalSectionTitle}>
                              <User size={16} className={styles.adminSectionIcon} /> 5. Contacto & Cuenta
                          </h3>
                          <div className={styles.createModalGridTwo}>
                              <div className={styles.createModalSpanTwo}>
                                  <label className={styles.createModalLabel}>Email administrativo (inicio de sesion) *</label>
                                  <input 
                                      type="email" required value={formData.email}
                                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                                      placeholder="admin@tienda.com"
                                      className={styles.createModalInput}
                                  />
                              </div>
                              <div>
                                  <label className={styles.createModalLabel}>Contrasena inicial *</label>
                                  <div className={styles.createModalField}>
                                      <Lock size={14} className={styles.adminLockIcon} />
                                      <input 
                                          type="password" required value={formData.password}
                                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                                          className={`${styles.createModalInput} pl-10`}
                                      />
                                  </div>
                              </div>
                              <div>
                                  <label className={styles.createModalLabel}>Celular / WhatsApp</label>
                                  <input
                                      type="text"
                                      value={formData.phone}
                                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                      placeholder="+54..."
                                      className={styles.createModalInput}
                                  />
                              </div>
                              <div>
                                  <label className={styles.createModalLabel}>Plan de suscripcion</label>
                                  <select 
                                      value={formData.plan}
                                      onChange={(e) => setFormData({...formData, plan: e.target.value as any})}
                                      className={`${styles.createModalSelect} font-bold text-dm-dark bg-gray-50`}
                                      disabled={!isSuperadmin}
                                  >
                                      <option value="BASIC">ESTANDAR (BASIC)</option>
                                      <option value="PREMIUM">ALTA VISIBILIDAD (PREMIUM)</option>
                                      <option value="PRO">MAXIMA VISIBILIDAD (PRO)</option>
                                  </select>
                                  {!isSuperadmin && (
                                      <p className={styles.createModalHelper}>Solo SUPERADMIN puede modificar el plan.</p>
                                  )}
                              </div>
                              <div>
                                  <label className={styles.createModalLabel}>Estado inicial</label>
                                  <select
                                      value={formData.status}
                                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                      className={`${styles.createModalSelect} bg-gray-50`}
                                  >
                                      <option value="PENDING_VERIFICATION">PENDIENTE</option>
                                      <option value="ACTIVE">ACTIVA</option>
                                  </select>
                              </div>
                          </div>
                      </section>
                      )}

                      {/* Section 6: Configuración Técnica (Oculta/Dashboard) */}
                      {createStep === 5 && (
                      <section className={styles.createModalDivider}>
                          <h3 className={styles.createModalDividerTitle}>
                              Configuración de Cuotas Iniciales
                          </h3>
                          <div className={styles.createModalGridThree}>
                               <div>
                                  <label className={styles.createModalTinyLabel}>Logo URL</label>
                                  <input
                                    type="text"
                                    value={formData.logoUrl}
                                    onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                                    className={styles.createModalTinyInput}
                                    placeholder="https://..."
                                  />
                               </div>
                               <div>
                                  <label className={styles.createModalTinyLabel}>Imagen destacada URL</label>
                                  <input
                                    type="text"
                                    value={formData.coverUrl}
                                    onChange={(e) => setFormData({...formData, coverUrl: e.target.value})}
                                    className={styles.createModalTinyInput}
                                    placeholder="https://..."
                                  />
                               </div>
                               <div>
                                  <label className={styles.createModalTinyLabel}>Imagen tienda URL</label>
                                  <input
                                    type="text"
                                    value={formData.storeImageUrl}
                                    onChange={(e) => setFormData({...formData, storeImageUrl: e.target.value})}
                                    className={styles.createModalTinyInput}
                                    placeholder="https://..."
                                  />
                               </div>
                               <div>
                                  <label className={styles.createModalTinyLabel}>URL imagen</label>
                                  <input
                                    type="text"
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                                    className={styles.createModalTinyInput}
                                    placeholder="https://..."
                                  />
                               </div>

                               <div>
                                  <label className={styles.createModalTinyLabel}>Cupos Vivos</label>
                                  <input
                                    type="number"
                                    value={formData.streamQuota}
                                    onChange={(e) => setFormData({...formData, streamQuota: parseInt(e.target.value) || 0})}
                                    className={styles.createModalTinyInput}
                                  />
                               </div>
                               <div>
                                  <label className={styles.createModalTinyLabel}>Cupos Reels</label>
                                  <input
                                    type="number"
                                    value={formData.reelQuota}
                                    onChange={(e) => setFormData({...formData, reelQuota: parseInt(e.target.value) || 0})}
                                    className={styles.createModalTinyInput}
                                  />
                               </div>
                          </div>
                      </section>
                      )}

                      {/* Form Actions */}
                      <div className={styles.createModalFooter}>
                          <Button
                            type="button"
                            variant="outline"
                            className={styles.createModalCancel}
                            onClick={closeCreateModal}
                          >
                              Cancelar
                          </Button>
                          <div className={styles.createModalFooterActions}>
                              {createStep > 0 && (
                                  <Button
                                      type="button"
                                      variant="outline"
                                      className={styles.createModalBack}
                                      onClick={goToPrevCreateStep}
                                  >
                                      Volver
                                  </Button>
                              )}
                              {createStep < createStepLabels.length - 1 ? (
                                  <Button
                                      type="button"
                                      className={styles.createModalSubmit}
                                      onClick={goToNextCreateStep}
                                  >
                                      Siguiente
                                  </Button>
                              ) : (
                                  <Button type="submit" className={styles.createModalSubmit}>
                                      <Save size={20} className={styles.buttonIcon} /> Dar de Alta Tienda
                                  </Button>
                              )}
                          </div>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {editShop && (
          <div className={styles.editModalBackdrop}>
              <div className={styles.editModalCard}>
                  <button onClick={() => setEditShop(null)} className={styles.editModalClose}>
                      <X size={18} />
                  </button>
                  <div className={styles.editModalHeader}>
                      <p className={styles.editModalKicker}>Editar tienda</p>
                      <h2 className={styles.editModalTitle}>Datos y redes</h2>
                  </div>

                  <div className={styles.editModalGridTwo}>
                      <div>
                          <label className={styles.editModalLabel}>Nombre</label>
                          <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className={styles.editModalInput}
                          />
                      </div>
                      <div>
                          <label className={styles.editModalLabel}>Razón social</label>
                          <input
                              type="text"
                              value={editForm.razonSocial}
                              onChange={(e) => setEditForm({ ...editForm, razonSocial: e.target.value })}
                              className={styles.editModalInput}
                          />
                      </div>
                      <div>
                          <label className={styles.editModalLabel}>Email</label>
                          <input
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              className={styles.editModalInput}
                          />
                      </div>
                      <div>
                          <label className={styles.editModalLabel}>CUIT</label>
                          <input
                              type="text"
                              value={editForm.cuit}
                              onChange={(e) => setEditForm({ ...editForm, cuit: e.target.value })}
                              className={styles.editModalInput}
                          />
                      </div>
                  </div>

                  <div className={styles.editModalGridTwoSpaced}>
                      <div>
                          <label className={styles.editModalLabel}>Instagram</label>
                          <input
                              type="text"
                              value={editForm.instagram}
                              onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                              className={styles.editModalInput}
                              placeholder="usuario (sin @)"
                          />
                      </div>
                      <div>
                          <label className={styles.editModalLabel}>TikTok</label>
                          <input
                              type="text"
                              value={editForm.tiktok}
                              onChange={(e) => setEditForm({ ...editForm, tiktok: e.target.value })}
                              className={styles.editModalInput}
                              placeholder="usuario (sin @)"
                          />
                      </div>
                      <div>
                          <label className={styles.editModalLabel}>Facebook</label>
                          <input
                              type="text"
                              value={editForm.facebook}
                              onChange={(e) => setEditForm({ ...editForm, facebook: e.target.value })}
                              className={styles.editModalInput}
                              placeholder="página"
                          />
                      </div>
                      <div>
                          <label className={styles.editModalLabel}>YouTube</label>
                          <input
                              type="text"
                              value={editForm.youtube}
                              onChange={(e) => setEditForm({ ...editForm, youtube: e.target.value })}
                              className={styles.editModalInput}
                              placeholder="canal"
                          />
                      </div>
                  </div>

                  <div className={styles.editModalGridTwoSpaced}>
                      <div>
                          <label className={styles.editModalLabel}>WhatsApp principal</label>
                          <input
                              type="text"
                              value={editForm.whatsapp}
                              onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                              className={styles.editModalInput}
                              placeholder="+54..."
                          />
                      </div>
                      <div>
                          <label className={styles.editModalLabel}>Sitio web</label>
                          <input
                              type="text"
                              value={editForm.website}
                              onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                              className={styles.editModalInput}
                              placeholder="https://..."
                          />
                      </div>
                      <div className={styles.editModalGridSingle}>
                          <label className={styles.editModalLabel}>Logo URL</label>
                          <input
                              type="text"
                              value={editForm.logoUrl}
                              onChange={(e) => setEditForm({ ...editForm, logoUrl: e.target.value })}
                              className={styles.editModalInput}
                              placeholder="https://..."
                          />
                      </div>
                  </div>

                  <div className={styles.editModalGridTwoSpaced}>
                      <div>
                          <label className={styles.editModalLabel}>Calle</label>
                          <input
                              type="text"
                              value={editForm.street}
                              onChange={(e) => setEditForm({ ...editForm, street: e.target.value })}
                              className={styles.editModalInput}
                          />
                      </div>
                      <div>
                          <label className={styles.editModalLabel}>Número</label>
                          <input
                              type="text"
                              value={editForm.number}
                              onChange={(e) => setEditForm({ ...editForm, number: e.target.value })}
                              className={styles.editModalInput}
                          />
                      </div>
                      <div>
                          <label className={styles.editModalLabel}>Ciudad</label>
                          <input
                              type="text"
                              value={editForm.city}
                              onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                              className={styles.editModalInput}
                          />
                      </div>
                      <div>
                          <label className={styles.editModalLabel}>Provincia</label>
                          <input
                              type="text"
                              value={editForm.province}
                              onChange={(e) => setEditForm({ ...editForm, province: e.target.value })}
                              className={styles.editModalInput}
                          />
                      </div>
                      <div>
                          <label className={styles.editModalLabel}>CP</label>
                          <input
                              type="text"
                              value={editForm.zip}
                              onChange={(e) => setEditForm({ ...editForm, zip: e.target.value })}
                              className={styles.editModalInput}
                          />
                      </div>
                      <div>
                          <label className={styles.editModalLabel}>Mínimo de compra</label>
                          <input
                              type="number"
                              value={editForm.minimumPurchase}
                              onChange={(e) => setEditForm({ ...editForm, minimumPurchase: parseInt(e.target.value) || 0 })}
                              className={styles.editModalInput}
                          />
                      </div>
                  </div>

                  <div className={styles.editModalActions}>
                      <Button
                          variant="outline"
                          className={styles.editModalCancel}
                          onClick={() => setEditShop(null)}
                      >
                          Cancelar
                      </Button>
                      <Button
                          className={styles.editModalSubmit}
                          onClick={handleEditShopSave}
                      >
                          <Save size={18} className={styles.buttonIcon} /> Guardar cambios
                      </Button>
                  </div>
              </div>
          </div>
      )}

      {confirmDialog && (
          <div className={styles.dialogBackdrop}>
              <div className={styles.dialogCard}>
                  <button
                      onClick={() => setConfirmDialog(null)}
                      className={styles.dialogClose}
                  >
                      <X size={18} />
                  </button>
                  <h3 className={styles.dialogTitle}>{confirmDialog.title}</h3>
                  <p className={styles.dialogMessage}>{confirmDialog.message}</p>
                  <div className={styles.dialogActions}>
                      <Button
                          variant="outline"
                          className={styles.dialogButton}
                          onClick={() => setConfirmDialog(null)}
                      >
                          {confirmDialog.cancelLabel || 'Cancelar'}
                      </Button>
                      <Button
                          className={styles.dialogButtonPrimary}
                          onClick={async () => {
                              const action = confirmDialog.onConfirm;
                              setConfirmDialog(null);
                              await action();
                          }}
                      >
                          {confirmDialog.confirmLabel || 'Confirmar'}
                      </Button>
                  </div>
              </div>
          </div>
      )}

      {inputDialog && (
          <div className={styles.dialogBackdrop}>
              <div className={styles.dialogCard}>
                  <button
                      onClick={() => setInputDialog(null)}
                      className={styles.dialogClose}
                  >
                      <X size={18} />
                  </button>
                  <h3 className={styles.dialogTitle}>{inputDialog.title}</h3>
                  <p className={styles.dialogMessage}>{inputDialog.message}</p>
                  <div className={styles.dialogForm}>
                      {inputDialog.placeholders.map((placeholder, idx) => (
                          <input
                              key={placeholder + idx}
                              value={inputValues[idx] || ''}
                              onChange={(e) => {
                                  const next = [...inputValues];
                                  next[idx] = e.target.value;
                                  setInputValues(next);
                              }}
                              placeholder={placeholder}
                              className={styles.dialogInput}
                          />
                      ))}
                  </div>
                  <div className={styles.dialogActions}>
                      <Button
                          variant="outline"
                          className={styles.dialogButton}
                          onClick={() => setInputDialog(null)}
                      >
                          {inputDialog.cancelLabel || 'Cancelar'}
                      </Button>
                      <Button
                          className={styles.dialogButtonPrimary}
                          onClick={async () => {
                              const action = inputDialog.onConfirm;
                              const values = inputValues;
                              setInputDialog(null);
                              await action(values);
                          }}
                      >
                          {inputDialog.confirmLabel || 'Confirmar'}
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
    </div>
  );
};
