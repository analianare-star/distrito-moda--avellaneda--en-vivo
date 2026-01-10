
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { LayoutDashboard, Radio, Store, AlertTriangle, CheckCircle, XCircle, Edit, AlertOctagon, BarChart3, Search, Eye, EyeOff, PlayCircle, StopCircle, X, Film, Plus, Save, MapPin, CreditCard, User, Lock, ShoppingBag, Calendar } from 'lucide-react';
import { StreamStatus, DataIntegrityStatus, Stream, Shop, Reel } from '../types';
import { api } from '../services/api';
import { AddressAutocomplete } from './AddressAutocomplete';
import { NoticeModal } from './NoticeModal';

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
      logoUrl: '',
      streamQuota: 0,
      reelQuota: 0
  });

  useEffect(() => {
      const needsReels = activeTab === 'REELS' || activeTab === 'DASHBOARD';
      const needsReports = activeTab === 'REPORTS' || activeTab === 'DASHBOARD';
      const needsAdmin = activeTab === 'ADMIN' || activeTab === 'DASHBOARD';

      if (needsReels) {
          setReelsLoading(true);
          api.fetchAllReelsAdmin().then(setReels).finally(() => setReelsLoading(false));
      }
      if (needsReports) {
          setReportsLoading(true);
          api.fetchReportsAdmin().then(setReports).finally(() => setReportsLoading(false));
      }
      if (needsAdmin) {
          setPurchasesLoading(true);
          api.fetchPurchaseRequests(purchaseStatusFilter === 'ALL' ? undefined : purchaseStatusFilter)
            .then(setPurchaseRequests)
            .finally(() => setPurchasesLoading(false));

          setNotificationsLoading(true);
          api.fetchNotificationsAdmin({
              limit: 50,
              unreadOnly: notificationFilter === 'UNREAD',
              type: notificationType,
          }).then(setAdminNotifications).finally(() => setNotificationsLoading(false));
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
          await api.updateStream({ ...stream, ...updates, isAdminOverride: true });
          onRefreshData();
      }
  };

  const forceExtend = async (streamId: string) => {
      const stream = streams.find(s => s.id === streamId);
      if (!stream) return;
      await api.updateStream({ ...stream, extensionCount: (stream.extensionCount || 0) + 1, isAdminOverride: true });
      onRefreshData();
  };

  const runSanctions = async () => {
      if (sanctionsRunning) return;
      setSanctionsRunning(true);
      try {
          const result = await api.runSanctions();
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
          const result = await api.runNotifications(15);
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
          const result = await api.runStreamsLifecycle();
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
      const data = await api.fetchNotificationsAdmin({
          limit: 50,
          unreadOnly: notificationFilter === 'UNREAD',
          type: notificationType,
      });
      setAdminNotifications(data);
  };

  const markNotificationRead = async (id: string) => {
      await api.markNotificationRead(id);
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
              await api.updateStream({ ...stream, url, isAdminOverride: true });
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
              await api.updateStream({ ...stream, fullDateISO: iso, forceScheduleUpdate: true, isAdminOverride: true });
              onRefreshData();
          },
      });
      setInputValues([stream.fullDateISO.slice(0, 16)]);
  };

  const toggleVisibility = async (streamId: string) => {
    const stream = streams.find(s => s.id === streamId);
    if(stream) {
        await api.updateStream({ ...stream, isVisible: !stream.isVisible });
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
              await api.cancelStream(streamId, reason || undefined);
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
              await api.banStream(streamId, reason || undefined);
              onRefreshData();
          },
      });
      setInputValues(['']);
  };

  const togglePenalty = async (shopId: string) => {
      await api.togglePenalty(shopId);
      onRefreshData();
  };

  const activateShop = async (shopId: string) => {
      await api.activateShop(shopId);
      onRefreshData();
  };

  const rejectShop = async (shopId: string) => {
      setInputDialog({
          title: 'Rechazar tienda',
          message: 'Ingresa el motivo del rechazo.',
          placeholders: ['Motivo...'],
          confirmLabel: 'Rechazar',
          onConfirm: async ([reason]) => {
              await api.rejectShop(shopId, reason || undefined);
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
              await api.suspendAgenda(shopId, reason || undefined, isNaN(days) ? 7 : days);
              onRefreshData();
          },
      });
      setInputValues(['', '7']);
  };

  const liftSuspension = async (shopId: string) => {
      await api.liftAgendaSuspension(shopId);
      onRefreshData();
  };

  const resetPassword = async (shopId: string) => {
      setConfirmDialog({
          title: 'Restablecer clave',
          message: 'Se generará un enlace para definir una nueva clave.',
          confirmLabel: 'Restablecer',
          onConfirm: async () => {
              const result = await api.resetShopPassword(shopId);
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
              await api.assignShopOwner(shopId, { email: trimmedEmail });
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
                  await api.deleteShop(shop.id);
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
          await api.reactivateReel(reel.id);
      } else {
          await api.hideReel(reel.id);
      }
      api.fetchAllReelsAdmin().then(setReels);
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
      if (!formData.name || !formData.razonSocial || !formData.email || !formData.password) {
          setNotice({
              title: 'Campos obligatorios',
              message: 'Completa Nombre, Razón Social, Email y Contraseña.',
              tone: 'warning',
          });
          return;
      }

      const payload = {
          name: formData.name,
          razonSocial: formData.razonSocial,
          cuit: formData.cuit,
          address: `${formData.street} ${formData.number}, ${formData.city}`,
          addressDetails: {
              street: formData.street,
              number: formData.number,
              city: formData.city,
              province: formData.province,
              zip: formData.zip
          },
          minimumPurchase: formData.minimumPurchase,
          paymentMethods: formData.paymentMethods,
          email: formData.email,
          password: formData.password,
          plan: formData.plan,
          logoUrl: formData.logoUrl,
          streamQuota: formData.streamQuota,
          reelQuota: formData.reelQuota,
          slug: formData.name.toLowerCase().replace(/\s+/g, '-')
      };

      const result = await api.createShop(payload);
      if (result.success) {
          setNotice({
              title: 'Tienda creada',
              message: result.message,
              tone: 'success',
          });
          setIsCreateModalOpen(false);
          // Reset
          setFormData({
              name: '', razonSocial: '', cuit: '', street: '', number: '', city: '', province: '', zip: '',
              minimumPurchase: 0, paymentMethods: [], email: '', password: '',
              plan: 'BASIC', logoUrl: '', streamQuota: 0, reelQuota: 0
          });
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
          await api.buyStreamQuota(quotaShopId, quotaAmount);
      } else {
          await api.buyReelQuota(quotaShopId, quotaAmount);
      }
      setNotice({
          title: 'Cupos asignados',
          message: 'La asignación se completó correctamente.',
          tone: 'success',
      });
      onRefreshData();
  };

  const handleApprovePurchase = async (purchaseId: string) => {
      try {
          await api.approvePurchase(purchaseId);
          setNotice({
              title: 'Compra aprobada',
              message: 'La solicitud fue aprobada y los cupos se acreditaron.',
              tone: 'success',
          });
          const data = await api.fetchPurchaseRequests('PENDING');
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
      setInputDialog({
          title: 'Rechazar compra',
          message: 'Ingresa el motivo del rechazo (opcional).',
          placeholders: ['Motivo...'],
          confirmLabel: 'Rechazar',
          onConfirm: async ([reason]) => {
              try {
                  await api.rejectPurchase(purchaseId, reason || undefined);
                  setNotice({
                      title: 'Compra rechazada',
                      message: 'La solicitud fue rechazada.',
                      tone: 'info',
                  });
                  const data = await api.fetchPurchaseRequests('PENDING');
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
    <div className="min-h-screen bg-gray-50 flex flex-col h-screen overflow-hidden">
      <header className="bg-dm-dark text-white px-8 py-4 shadow-md z-10 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="font-serif text-xl tracking-wide">Panel de Control ADMIN</h1>
            <span className="text-xs bg-dm-crimson px-2 py-1 rounded">Superadmin</span>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full overflow-hidden">
        <aside className="w-64 bg-white border-r border-gray-200 hidden md:block shrink-0 h-full">
            <nav className="p-4 space-y-1">
                {['DASHBOARD', 'AGENDA', 'STREAMS', 'SHOPS', 'REELS', 'REPORTS', 'ADMIN'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => onTabChange(tab as AdminTab)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === tab ? 'bg-gray-100 text-dm-crimson' : 'text-dm-dark hover:bg-gray-50'}`}
                    >
                        {tab === 'DASHBOARD' ? <LayoutDashboard size={18} /> : tab === 'AGENDA' ? <Calendar size={18} /> : tab === 'STREAMS' ? <Radio size={18}/> : tab === 'SHOPS' ? <Store size={18}/> : tab === 'REELS' ? <Film size={18}/> : tab === 'REPORTS' ? <AlertTriangle size={18} /> : <ShoppingBag size={18}/>}
                        {tab === 'DASHBOARD' ? 'Resumen' : tab === 'AGENDA' ? 'Agenda' : tab === 'STREAMS' ? 'Vivos' : tab === 'SHOPS' ? 'Tiendas' : tab === 'REELS' ? 'Reels' : tab === 'REPORTS' ? 'Reportes' : 'Administrativo'}
                    </button>
                ))}
            </nav>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto">
            <div className="md:hidden mb-4">
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {['DASHBOARD', 'AGENDA', 'STREAMS', 'SHOPS', 'REELS', 'REPORTS', 'ADMIN'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => onTabChange(tab as AdminTab)}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-dm-crimson text-white' : 'bg-gray-100 text-gray-500'}`}
                        >
                            {tab === 'DASHBOARD' ? 'Resumen' : tab === 'AGENDA' ? 'Agenda' : tab === 'STREAMS' ? 'Vivos' : tab === 'SHOPS' ? 'Tiendas' : tab === 'REELS' ? 'Reels' : tab === 'REPORTS' ? 'Reportes' : 'Administrativo'}
                        </button>
                    ))}
                </div>
            </div>
            {activeTab === 'DASHBOARD' && (
                <div className="space-y-8 animate-in fade-in">
                    <h2 className="font-serif text-2xl text-dm-dark">Estado del Sistema</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 md:p-6 rounded-xl border flex justify-between">
                            <div><p className="text-xs font-bold text-gray-400">EN VIVO</p><p className="text-3xl font-serif">{liveCount}</p></div>
                            <Radio className="text-red-500" />
                        </div>
                        <div className="bg-white p-4 md:p-6 rounded-xl border flex justify-between">
                            <div><p className="text-xs font-bold text-gray-400">INCUMPLIDOS</p><p className="text-3xl font-serif">{missedCount}</p></div>
                            <AlertTriangle className="text-orange-500" />
                        </div>
                        <div className="bg-white p-4 md:p-6 rounded-xl border flex justify-between">
                            <div><p className="text-xs font-bold text-gray-400">PENALIZADAS</p><p className="text-3xl font-serif">{penalizedShops}</p></div>
                            <AlertOctagon className="text-gray-500" />
                        </div>
                        <div className="bg-white p-4 md:p-6 rounded-xl border flex justify-between">
                            <div><p className="text-xs font-bold text-gray-400">REELS ACTIVOS</p><p className="text-3xl font-serif">{reels.filter(r => r.status === 'ACTIVE').length}</p></div>
                            <Film className="text-dm-crimson" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold tracking-widest text-gray-400">INBOX OPERATIVO</p>
                                <p className="text-sm font-semibold text-dm-dark">Pendientes que requieren accion inmediata</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-4 md:p-5 rounded-xl border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400">TIENDAS PENDIENTES</p>
                                        <p className="text-lg font-bold text-dm-dark">{pendingShops.length}</p>
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
                                <div className="mt-3 space-y-2">
                                    {pendingShops.slice(0, 3).map((shop) => (
                                        <button
                                            key={shop.id}
                                            onClick={() => {
                                                setShopFilter('PENDING_VERIFICATION');
                                                onTabChange('SHOPS');
                                            }}
                                            className="w-full rounded-lg border border-gray-100 px-3 py-2 text-left transition hover:bg-gray-50"
                                        >
                                            <p className="text-xs font-bold text-dm-dark">{shop.name}</p>
                                            <p className="text-[10px] text-gray-500">{shop.email || 'Sin email'}</p>
                                        </button>
                                    ))}
                                    {pendingShops.length === 0 && (
                                        <p className="text-xs text-gray-400">Sin pendientes por aprobar.</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white p-4 md:p-5 rounded-xl border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400">REPORTES ABIERTOS</p>
                                        <p className="text-lg font-bold text-dm-dark">{openReports.length}</p>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => onTabChange('REPORTS')}>
                                        Ver
                                    </Button>
                                </div>
                                <div className="mt-3 space-y-2">
                                    {openReports.slice(0, 3).map((report) => (
                                        <button
                                            key={report.id}
                                            onClick={() => onTabChange('REPORTS')}
                                            className="w-full rounded-lg border border-gray-100 px-3 py-2 text-left transition hover:bg-gray-50"
                                        >
                                            <p className="text-xs font-bold text-dm-dark">
                                                {report?.stream?.title || 'Vivo sin titulo'}
                                            </p>
                                            <p className="text-[10px] text-gray-500">
                                                {report?.stream?.shop?.name || 'Sin tienda'}
                                            </p>
                                        </button>
                                    ))}
                                    {openReports.length === 0 && (
                                        <p className="text-xs text-gray-400">Sin reportes abiertos.</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white p-4 md:p-5 rounded-xl border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400">COMPRAS PENDIENTES</p>
                                        <p className="text-lg font-bold text-dm-dark">{pendingPurchases.length}</p>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => onTabChange('ADMIN')}>
                                        Ver
                                    </Button>
                                </div>
                                <div className="mt-3 space-y-2">
                                    {pendingPurchases.slice(0, 3).map((purchase) => (
                                        <button
                                            key={purchase.purchaseId || purchase.id}
                                            onClick={() => onTabChange('ADMIN')}
                                            className="w-full rounded-lg border border-gray-100 px-3 py-2 text-left transition hover:bg-gray-50"
                                        >
                                            <p className="text-xs font-bold text-dm-dark">
                                                {purchase?.shop?.name || 'Tienda sin nombre'}
                                            </p>
                                            <p className="text-[10px] text-gray-500">
                                                {purchase.type || 'PACK'} · {purchase.quantity || 0} cupos
                                            </p>
                                        </button>
                                    ))}
                                    {pendingPurchases.length === 0 && (
                                        <p className="text-xs text-gray-400">Sin compras pendientes.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'AGENDA' && (
                <div className="space-y-6 animate-in fade-in">
                    <h2 className="font-serif text-2xl text-dm-dark">Agenda Global</h2>
                    <div className="flex flex-col md:flex-row gap-3">
                        <input
                            type="text"
                            placeholder="Buscar tienda..."
                            value={agendaQuery}
                            onChange={(e) => setAgendaQuery(e.target.value)}
                            className="flex-1 p-3 border border-gray-200 rounded-lg text-sm"
                        />
                        <select
                            value={agendaStatus}
                            onChange={(e) => setAgendaStatus(e.target.value as any)}
                            className="p-3 border border-gray-200 rounded-lg text-sm bg-white"
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

                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="md:hidden divide-y">
                            {filteredAgendaStreams.length > 0 ? (
                                filteredAgendaStreams.map((stream) => (
                                    <div key={stream.id} className="p-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-bold text-dm-dark">{stream.shop?.name || 'Sin tienda'}</p>
                                            <span className="text-[11px] font-bold text-gray-600">{formatStreamStatus(stream.status)}</span>
                                        </div>
                                        <p className="text-[11px] text-gray-600">
                                            {new Date(stream.fullDateISO).toLocaleDateString()} {stream.scheduledTime} hs
                                        </p>
                                        <p className="text-[11px] text-gray-600 uppercase">{stream.platform}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="px-6 py-6 text-center text-xs text-gray-400">Sin resultados</div>
                            )}
                        </div>
                        <div className="hidden md:block">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500">Tienda</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500">Fecha</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500">Estado</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500">Plataforma</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredAgendaStreams.length > 0 ? (
                                        filteredAgendaStreams.map(stream => (
                                            <tr key={stream.id}>
                                                <td className="px-6 py-4 text-sm font-bold">{stream.shop?.name || 'Sin tienda'}</td>
                                                <td className="px-6 py-4 text-xs text-gray-500">
                                                    {new Date(stream.fullDateISO).toLocaleDateString()} {stream.scheduledTime} hs
                                                </td>
                                                <td className="px-6 py-4 text-xs font-bold">{formatStreamStatus(stream.status)}</td>
                                                <td className="px-6 py-4 text-xs">{stream.platform}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-6 text-center text-xs text-gray-400">Sin resultados</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'STREAMS' && (
                 <div className="space-y-6 animate-in fade-in">
                    <h2 className="font-serif text-2xl text-dm-dark">Gestión de Vivos</h2>
                    <div className="flex flex-col md:flex-row gap-3">
                        <input
                            type="text"
                            placeholder="Buscar vivo o tienda..."
                            value={streamQuery}
                            onChange={(e) => setStreamQuery(e.target.value)}
                            className="flex-1 p-3 border border-gray-200 rounded-lg text-sm"
                        />
                        <select
                            value={streamStatusFilter}
                            onChange={(e) => setStreamStatusFilter(e.target.value as any)}
                            className="p-3 border border-gray-200 rounded-lg text-sm bg-white"
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
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="md:hidden divide-y">
                            {filteredStreams.length > 0 ? (
                              filteredStreams.map((stream) => (
                                <div key={stream.id} className="p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-dm-dark">{stream.title}</p>
                                            <p className="text-[11px] text-gray-600">{stream.shop.name}</p>
                                        </div>
                                        <span className={`text-[11px] px-2 py-1 rounded ${stream.status === 'LIVE' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                            {formatStreamStatus(stream.status)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-gray-600">
                                        <span>Reportes</span>
                                        {stream.reportCount > 0 ? (
                                            <span className="text-red-600 font-bold flex items-center gap-1"><AlertTriangle size={12}/> {stream.reportCount}</span>
                                        ) : (
                                            <span>-</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <button 
                                            onClick={() => toggleVisibility(stream.id)} 
                                            className={`px-3 py-1.5 border rounded text-xs font-bold flex items-center gap-2 transition-colors ${stream.isVisible ? 'text-gray-600 hover:bg-gray-100' : 'bg-gray-100 text-gray-400'}`}
                                        >
                                            {stream.isVisible ? <Eye size={14}/> : <EyeOff size={14}/>}
                                            {stream.isVisible ? 'Visible' : 'Oculto'}
                                        </button>

                                        {stream.status === 'UPCOMING' && (
                                            <button 
                                                onClick={() => handleStatusChange(stream.id, StreamStatus.LIVE)} 
                                                className="px-3 py-1.5 border border-green-200 bg-green-50 text-green-700 rounded text-xs font-bold flex items-center gap-2"
                                            >
                                                <PlayCircle size={14}/> Iniciar
                                            </button>
                                        )}
                                        
                                        {stream.status === 'LIVE' && (
                                            <button 
                                                onClick={() => handleStatusChange(stream.id, StreamStatus.FINISHED)} 
                                                className="px-3 py-1.5 border border-red-200 bg-white text-red-600 rounded text-xs font-bold flex items-center gap-2"
                                            >
                                                <StopCircle size={14}/> Finalizar
                                            </button>
                                        )}

                                        {stream.status === 'LIVE' && (
                                            <button 
                                                onClick={() => forceExtend(stream.id)} 
                                                className="px-3 py-1.5 border border-green-200 bg-green-50 text-green-700 rounded text-xs font-bold"
                                            >
                                                +30 min
                                            </button>
                                        )}

                                        {(stream.status === 'UPCOMING' || stream.status === 'LIVE') && (
                                            <button 
                                                onClick={() => editStreamUrl(stream.id)} 
                                                className="px-3 py-1.5 border border-gray-200 bg-gray-50 text-gray-600 rounded text-xs font-bold"
                                            >
                                                URL
                                            </button>
                                        )}

                                        {(stream.status === 'UPCOMING' || stream.status === 'LIVE') && (
                                            <button 
                                                onClick={() => adjustStreamTime(stream.id)} 
                                                className="px-3 py-1.5 border border-gray-200 bg-gray-50 text-gray-600 rounded text-xs font-bold"
                                            >
                                                Hora
                                            </button>
                                        )}

                                        {stream.status === 'UPCOMING' && (
                                            <button 
                                                onClick={() => cancelStream(stream.id)} 
                                                className="px-3 py-1.5 border border-gray-200 bg-gray-50 text-gray-600 rounded text-xs font-bold"
                                            >
                                                Cancelar
                                            </button>
                                        )}

                                        {stream.status !== 'BANNED' && (
                                            <button 
                                                onClick={() => banStream(stream.id)} 
                                                className="px-3 py-1.5 border border-red-200 bg-red-50 text-red-600 rounded text-xs font-bold"
                                            >
                                                Bloquear
                                            </button>
                                        )}
                                    </div>
                                </div>
                              ))
                            ) : (
                              <div className="px-6 py-6 text-center text-xs text-gray-400">Sin resultados.</div>
                            )}
                        </div>
                        <div className="hidden md:block">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500">Info</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500">Reportes</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredStreams.length > 0 ? (
                                        filteredStreams.map(stream => (
                                        <tr key={stream.id}>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-sm">{stream.title}</p>
                                                <p className="text-xs text-gray-500">{stream.shop.name}</p>
                                                <span className={`text-[10px] px-1 rounded ${stream.status === 'LIVE' ? 'bg-red-100 text-red-600' : 'bg-gray-100'}`}>{formatStreamStatus(stream.status)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {stream.reportCount > 0 ? <span className="text-red-600 font-bold flex items-center gap-1"><AlertTriangle size={12}/> {stream.reportCount}</span> : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => toggleVisibility(stream.id)} 
                                                        title={stream.isVisible ? "Ocultar vivo de la app" : "Hacer visible en la app"}
                                                        className={`px-3 py-1.5 border rounded text-xs font-bold flex items-center gap-2 transition-colors ${stream.isVisible ? 'text-gray-600 hover:bg-gray-100' : 'bg-gray-100 text-gray-400'}`}
                                                    >
                                                        {stream.isVisible ? <Eye size={14}/> : <EyeOff size={14}/>}
                                                        {stream.isVisible ? 'Visible' : 'Oculto'}
                                                    </button>

                                                    {stream.status === 'UPCOMING' && (
                                                        <button 
                                                            onClick={() => handleStatusChange(stream.id, StreamStatus.LIVE)} 
                                                            title="INICIAR VIVO: Comienza el contador de 30 minutos."
                                                            className="px-3 py-1.5 border border-green-200 bg-green-50 text-green-700 rounded text-xs font-bold flex items-center gap-2 hover:bg-green-100 transition-colors shadow-sm"
                                                        >
                                                            <PlayCircle size={14}/> Iniciar
                                                        </button>
                                                    )}
                                                    
                                                    {stream.status === 'LIVE' && (
                                                        <button 
                                                            onClick={() => handleStatusChange(stream.id, StreamStatus.FINISHED)} 
                                                            title="FINALIZAR VIVO: Cortar transmisión inmediatamente."
                                                            className="px-3 py-1.5 border border-red-200 bg-white text-red-600 rounded text-xs font-bold flex items-center gap-2 hover:bg-red-50 transition-colors shadow-sm"
                                                        >
                                                            <StopCircle size={14}/> Finalizar
                                                        </button>
                                                    )}

                                                    {stream.status === 'LIVE' && (
                                                        <button 
                                                            onClick={() => forceExtend(stream.id)} 
                                                            title="FORZAR EXTENSION +30"
                                                            className="px-3 py-1.5 border border-green-200 bg-green-50 text-green-700 rounded text-xs font-bold flex items-center gap-2 hover:bg-green-100 transition-colors shadow-sm"
                                                        >
                                                            +30 min
                                                        </button>
                                                    )}

                                                    {(stream.status === 'UPCOMING' || stream.status === 'LIVE') && (
                                                        <button 
                                                            onClick={() => editStreamUrl(stream.id)} 
                                                            title="EDITAR URL"
                                                            className="px-3 py-1.5 border border-gray-200 bg-gray-50 text-gray-600 rounded text-xs font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors shadow-sm"
                                                        >
                                                            URL
                                                        </button>
                                                    )}

                                                    {(stream.status === 'UPCOMING' || stream.status === 'LIVE') && (
                                                        <button 
                                                            onClick={() => adjustStreamTime(stream.id)} 
                                                            title="AJUSTAR HORA"
                                                            className="px-3 py-1.5 border border-gray-200 bg-gray-50 text-gray-600 rounded text-xs font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors shadow-sm"
                                                        >
                                                            Hora
                                                        </button>
                                                    )}

                                                    {stream.status === 'UPCOMING' && (
                                                        <button 
                                                            onClick={() => cancelStream(stream.id)} 
                                                            title="CANCELAR VIVO"
                                                            className="px-3 py-1.5 border border-gray-200 bg-gray-50 text-gray-600 rounded text-xs font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors shadow-sm"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    )}

                                                    {stream.status !== 'BANNED' && (
                                                        <button 
                                                            onClick={() => banStream(stream.id)} 
                                                            title="BLOQUEAR VIVO"
                                                            className="px-3 py-1.5 border border-red-200 bg-red-50 text-red-600 rounded text-xs font-bold flex items-center gap-2 hover:bg-red-100 transition-colors shadow-sm"
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
                                            <td colSpan={3} className="px-6 py-6 text-center text-xs text-gray-400">Sin resultados.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                 </div>
            )}

            {activeTab === 'REPORTS' && (
                <div className="space-y-6 animate-in fade-in">
                    <h2 className="font-serif text-2xl text-dm-dark">Reportes</h2>
                    <div className="flex flex-col md:flex-row gap-3">
                        <input
                            type="text"
                            placeholder="Buscar vivo o tienda..."
                            value={reportQuery}
                            onChange={(e) => setReportQuery(e.target.value)}
                            className="flex-1 p-3 border border-gray-200 rounded-lg text-sm"
                        />
                        <select
                            value={reportStatusFilter}
                            onChange={(e) => setReportStatusFilter(e.target.value as any)}
                            className="p-3 border border-gray-200 rounded-lg text-sm bg-white"
                        >
                            <option value="ALL">Todos</option>
                            <option value="OPEN">Abiertos</option>
                            <option value="RESOLVED">Resueltos</option>
                            <option value="DISMISSED">Rechazados</option>
                        </select>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="md:hidden divide-y">
                            {reportsLoading ? (
                                Array.from({ length: 4 }).map((_, index) => (
                                    <div key={index} className="p-3 space-y-2 animate-pulse">
                                        <div className="h-4 w-40 bg-gray-200 rounded" />
                                        <div className="h-3 w-28 bg-gray-100 rounded" />
                                        <div className="h-3 w-full bg-gray-100 rounded" />
                                    </div>
                                ))
                            ) : filteredReports.length > 0 ? (
                                filteredReports.map((report) => (
                                    <div key={report.id} className="p-3 space-y-2">
                                        <div>
                                            <p className="text-sm font-bold text-dm-dark">{report?.stream?.title || report.streamId}</p>
                                            <p className="text-[11px] text-gray-600">{report?.stream?.shop?.name || 'Sin tienda'}</p>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-gray-700">{formatReportStatus(report.status)}</span>
                                            <span className="text-[11px] text-gray-600">{report.reason || 'Sin motivo'}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={async () => {
                                                    try {
                                                        await api.resolveReportAdmin(report.id);
                                                        const next = reports.filter((item) => item.id !== report.id);
                                                        setReports(next);
                                                    } catch (error: any) {
                                                        setNotice({
                                                            title: 'Error al resolver',
                                                            message: error?.message || 'No se pudo resolver el reporte.',
                                                            tone: 'error',
                                                        });
                                                    }
                                                }}
                                            >
                                                Resolver
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => {
                                                    setConfirmDialog({
                                                        title: 'Rechazar reporte',
                                                        message: 'El reporte quedara marcado como rechazado. Esta accion no se puede deshacer.',
                                                        confirmLabel: 'Rechazar',
                                                        onConfirm: async () => {
                                                            try {
                                                                await api.rejectReportAdmin(report.id);
                                                                const next = reports.filter((item) => item.id !== report.id);
                                                                setReports(next);
                                                            } catch (error: any) {
                                                                setNotice({
                                                                    title: 'Error al rechazar',
                                                                    message: error?.message || 'No se pudo rechazar el reporte.',
                                                                    tone: 'error',
                                                                });
                                                            }
                                                        },
                                                    });
                                                }}
                                            >
                                                Rechazar
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="px-6 py-6 text-center text-xs text-gray-400">Sin reportes abiertos.</div>
                            )}
                        </div>
                        <div className="hidden md:block">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500">Vivo</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500">Estado</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500">Motivo</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {reportsLoading ? (
                                        Array.from({ length: 6 }).map((_, index) => (
                                            <tr key={index} className="animate-pulse">
                                                <td className="px-6 py-4">
                                                    <div className="h-3 w-40 bg-gray-200 rounded" />
                                                    <div className="mt-2 h-2 w-24 bg-gray-100 rounded" />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="h-3 w-12 bg-gray-200 rounded" />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="h-3 w-32 bg-gray-100 rounded" />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="h-7 w-24 bg-gray-100 rounded inline-block" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : filteredReports.length > 0 ? (
                                        filteredReports.map((report) => (
                                            <tr key={report.id}>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs font-bold">{report?.stream?.title || report.streamId}</p>
                                                    <p className="text-[10px] text-gray-400">{report?.stream?.shop?.name || 'Sin tienda'}</p>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-bold">{formatReportStatus(report.status)}</td>
                                                <td className="px-6 py-4">
                                                    <p className="text-[10px] text-gray-500">{report.reason || 'Sin motivo'}</p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={async () => {
                                                                try {
                                                                    await api.resolveReportAdmin(report.id);
                                                                    const next = reports.filter((item) => item.id !== report.id);
                                                                    setReports(next);
                                                                } catch (error: any) {
                                                                    setNotice({
                                                                        title: 'Error al resolver',
                                                                        message: error?.message || 'No se pudo resolver el reporte.',
                                                                        tone: 'error',
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            Resolver
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => {
                                                                setConfirmDialog({
                                                                    title: 'Rechazar reporte',
                                                                    message: 'El reporte quedara marcado como rechazado. Esta accion no se puede deshacer.',
                                                                    confirmLabel: 'Rechazar',
                                                                    onConfirm: async () => {
                                                                        try {
                                                                            await api.rejectReportAdmin(report.id);
                                                                            const next = reports.filter((item) => item.id !== report.id);
                                                                            setReports(next);
                                                                        } catch (error: any) {
                                                                            setNotice({
                                                                                title: 'Error al rechazar',
                                                                                message: error?.message || 'No se pudo rechazar el reporte.',
                                                                                tone: 'error',
                                                                            });
                                                                        }
                                                                    },
                                                                });
                                                            }}
                                                        >
                                                            Rechazar
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-6 text-center text-xs text-gray-400">Sin reportes abiertos.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'SHOPS' && (
                 <div className="space-y-6 animate-in fade-in">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <h2 className="font-serif text-2xl text-dm-dark">Tiendas</h2>
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={() => setShopFilter(shopFilter === 'PENDING_VERIFICATION' ? 'ALL' : 'PENDING_VERIFICATION')}
                                className={`text-xs font-bold px-3 py-2 rounded-full border ${shopFilter === 'PENDING_VERIFICATION' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-white text-gray-500 border-gray-200'}`}
                            >
                                Pendientes ({pendingShops.length})
                            </button>
                            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-dm-crimson hover:bg-red-700 border-none text-white shadow-lg shadow-dm-crimson/20">
                                <Plus size={18} className="mr-2" /> Nueva Tienda
                            </Button>
                            <Button
                                variant="outline"
                                onClick={onPreviewClient}
                                className="border-gray-200 text-gray-600"
                            >
                                <Eye size={16} className="mr-2" /> Ver como cliente
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3">
                        <input
                            type="text"
                            placeholder="Buscar tienda..."
                            value={shopQuery}
                            onChange={(e) => setShopQuery(e.target.value)}
                            className="flex-1 p-3 border border-gray-200 rounded-lg text-sm"
                        />
                        <select
                            value={shopFilter}
                            onChange={(e) => setShopFilter(e.target.value as any)}
                            className="p-3 border border-gray-200 rounded-lg text-sm bg-white"
                        >
                            <option value="ALL">Todos los estados</option>
                            <option value="PENDING_VERIFICATION">Pendientes</option>
                            <option value="ACTIVE">Activas</option>
                            <option value="AGENDA_SUSPENDED">Suspendidas</option>
                            <option value="HIDDEN">Ocultas</option>
                            <option value="BANNED">Bloqueadas</option>
                        </select>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="md:hidden divide-y">
                            {filteredShops.length > 0 ? (
                              filteredShops.map((shop) => {
                                const status = shop.status || 'ACTIVE';
                                return (
                                    <div key={shop.id} className="p-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-dm-dark">{shop.name}</p>
                                                <p className="text-[11px] text-gray-600">{shop.plan}</p>
                                            </div>
                                            <span className={`text-[11px] px-2 py-1 rounded-full font-bold ${
                                                status === 'ACTIVE' ? 'bg-green-50 text-green-600' :
                                                status === 'PENDING_VERIFICATION' ? 'bg-yellow-50 text-yellow-700' :
                                                status === 'AGENDA_SUSPENDED' ? 'bg-orange-50 text-orange-600' :
                                                'bg-red-50 text-red-600'
                                            }`}>{formatShopStatus(status)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] text-gray-600">
                                            <span>Integridad</span>
                                            <span className={`text-[11px] px-2 py-1 rounded-full font-bold ${
                                                shop.dataIntegrity === 'COMPLETE' ? 'bg-green-50 text-green-600' :
                                                shop.dataIntegrity === 'MINIMAL' ? 'bg-yellow-50 text-yellow-600' :
                                                'bg-red-50 text-red-600'
                                            }`}>{formatIntegrity(shop.dataIntegrity)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] text-gray-600">
                                            <span>Penalización</span>
                                            <button onClick={() => togglePenalty(shop.id)} className={`text-[11px] font-bold px-2 py-1 rounded border ${shop.isPenalized ? 'bg-red-50 border-red-200 text-red-600' : 'border-gray-200'}`}>
                                                {shop.isPenalized ? 'ACTIVA' : 'No'}
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {status === 'PENDING_VERIFICATION' && (
                                                <>
                                                  <button onClick={() => activateShop(shop.id)} className="text-xs border px-2 py-1 rounded bg-green-50 text-green-700 border-green-200">Activar</button>
                                                  <button onClick={() => rejectShop(shop.id)} className="text-xs border px-2 py-1 rounded bg-red-50 text-red-600 border-red-200">Rechazar</button>
                                                  <button onClick={() => resetPassword(shop.id)} className="text-xs border px-2 py-1 rounded bg-gray-50 text-gray-600 border-gray-200">Restablecer clave</button>
                                                </>
                                            )}
                                            {status === 'ACTIVE' && (
                                                <>
                                                  <button onClick={() => suspendAgenda(shop.id)} className="text-xs border px-2 py-1 rounded bg-orange-50 text-orange-600 border-orange-200">Suspender Agenda</button>
                                                  <button onClick={() => resetPassword(shop.id)} className="text-xs border px-2 py-1 rounded bg-gray-50 text-gray-600 border-gray-200">Restablecer clave</button>
                                                </>
                                            )}
                                            {status === 'AGENDA_SUSPENDED' && (
                                                <>
                                                  <button onClick={() => liftSuspension(shop.id)} className="text-xs border px-2 py-1 rounded bg-blue-50 text-blue-600 border-blue-200">Levantar Sancion</button>
                                                  <button onClick={() => resetPassword(shop.id)} className="text-xs border px-2 py-1 rounded bg-gray-50 text-gray-600 border-gray-200">Restablecer clave</button>
                                                </>
                                            )}
                                            {(status === 'HIDDEN' || status === 'BANNED') && (
                                                <>
                                                  <button onClick={() => activateShop(shop.id)} className="text-xs border px-2 py-1 rounded bg-green-50 text-green-700 border-green-200">Reactivar</button>
                                                  <button onClick={() => resetPassword(shop.id)} className="text-xs border px-2 py-1 rounded bg-gray-50 text-gray-600 border-gray-200">Restablecer clave</button>
                                                </>
                                            )}
                                            <button onClick={() => assignOwner(shop.id)} className="text-xs border px-2 py-1 rounded bg-indigo-50 text-indigo-600 border-indigo-200">
                                                Asignar dueño
                                            </button>
                                            <button
                                                onClick={() => openEditShop(shop)}
                                                className="text-xs border px-2 py-1 rounded bg-white text-gray-600 border-gray-200"
                                            >
                                                Editar datos
                                            </button>
                                            <button
                                                onClick={() => onPreviewShop(shop.id)}
                                                className="text-xs border px-2 py-1 rounded bg-white text-gray-600 border-gray-200"
                                            >
                                                Ver como tienda
                                            </button>
                                            <button
                                                onClick={() => deleteShop(shop)}
                                                className="text-xs border px-2 py-1 rounded bg-red-50 text-red-600 border-red-200"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                );
                              })
                            ) : (
                              <div className="px-6 py-6 text-center text-xs text-gray-400">Sin resultados.</div>
                            )}
                        </div>
                        <div className="hidden md:block">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500">Tienda</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500">Plan</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500">Estado</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500">Integridad</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500">Penalización</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredShops.length > 0 ? (
                                      filteredShops.map(shop => {
                                        const status = shop.status || 'ACTIVE';
                                        return (
                                        <tr key={shop.id}>
                                            <td className="px-6 py-4 font-bold text-sm">{shop.name}</td>
                                            <td className="px-6 py-4 text-xs">{shop.plan}</td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                                                    status === 'ACTIVE' ? 'bg-green-50 text-green-600' :
                                                    status === 'PENDING_VERIFICATION' ? 'bg-yellow-50 text-yellow-700' :
                                                    status === 'AGENDA_SUSPENDED' ? 'bg-orange-50 text-orange-600' :
                                                    'bg-red-50 text-red-600'
                                                }`}>{formatShopStatus(status)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                                                    shop.dataIntegrity === 'COMPLETE' ? 'bg-green-50 text-green-600' :
                                                    shop.dataIntegrity === 'MINIMAL' ? 'bg-yellow-50 text-yellow-600' :
                                                    'bg-red-50 text-red-600'
                                                }`}>{formatIntegrity(shop.dataIntegrity)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => togglePenalty(shop.id)} className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded border ${shop.isPenalized ? 'bg-red-50 border-red-200 text-red-600' : 'border-gray-200'}`}>
                                                    {shop.isPenalized ? 'ACTIVA' : 'No'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {status === 'PENDING_VERIFICATION' && (
                                                        <>
                                                          <button onClick={() => activateShop(shop.id)} className="text-xs border px-2 py-1 rounded bg-green-50 text-green-700 border-green-200">Activar</button>
                                                          <button onClick={() => rejectShop(shop.id)} className="text-xs border px-2 py-1 rounded bg-red-50 text-red-600 border-red-200">Rechazar</button>
                                                          <button onClick={() => resetPassword(shop.id)} className="text-xs border px-2 py-1 rounded bg-gray-50 text-gray-600 border-gray-200">Restablecer clave</button>
                                                        </>
                                                    )}
                                                    {status === 'ACTIVE' && (
                                                        <>
                                                          <button onClick={() => suspendAgenda(shop.id)} className="text-xs border px-2 py-1 rounded bg-orange-50 text-orange-600 border-orange-200">Suspender Agenda</button>
                                                          <button onClick={() => resetPassword(shop.id)} className="text-xs border px-2 py-1 rounded bg-gray-50 text-gray-600 border-gray-200">Restablecer clave</button>
                                                        </>
                                                    )}
                                                    {status === 'AGENDA_SUSPENDED' && (
                                                        <>
                                                          <button onClick={() => liftSuspension(shop.id)} className="text-xs border px-2 py-1 rounded bg-blue-50 text-blue-600 border-blue-200">Levantar Sancion</button>
                                                          <button onClick={() => resetPassword(shop.id)} className="text-xs border px-2 py-1 rounded bg-gray-50 text-gray-600 border-gray-200">Restablecer clave</button>
                                                        </>
                                                    )}
                                                    {(status === 'HIDDEN' || status === 'BANNED') && (
                                                        <>
                                                          <button onClick={() => activateShop(shop.id)} className="text-xs border px-2 py-1 rounded bg-green-50 text-green-700 border-green-200">Reactivar</button>
                                                          <button onClick={() => resetPassword(shop.id)} className="text-xs border px-2 py-1 rounded bg-gray-50 text-gray-600 border-gray-200">Restablecer clave</button>
                                                        </>
                                                    )}
                                                    <button onClick={() => assignOwner(shop.id)} className="text-xs border px-2 py-1 rounded bg-indigo-50 text-indigo-600 border-indigo-200">
                                                        Asignar dueño
                                                    </button>
                                                    <button
                                                        onClick={() => openEditShop(shop)}
                                                        className="text-xs border px-2 py-1 rounded bg-white text-gray-600 border-gray-200"
                                                    >
                                                        Editar datos
                                                    </button>
                                                    <button
                                                        onClick={() => onPreviewShop(shop.id)}
                                                        className="text-xs border px-2 py-1 rounded bg-white text-gray-600 border-gray-200"
                                                    >
                                                        Ver como tienda
                                                    </button>
                                                    <button
                                                        onClick={() => deleteShop(shop)}
                                                        className="text-xs border px-2 py-1 rounded bg-red-50 text-red-600 border-red-200"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                      )})
                                    ) : (
                                      <tr>
                                          <td colSpan={6} className="px-6 py-6 text-center text-xs text-gray-400">Sin resultados.</td>
                                      </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                 </div>
            )}

            {activeTab === 'REELS' && (
                <div className="space-y-6 animate-in fade-in">
                    <h2 className="font-serif text-2xl text-dm-dark">Control de Reels</h2>
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="md:hidden divide-y">
                            {reels.map((reel) => (
                                <div key={reel.id} className="p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden">
                                                <img src={reel.shopLogo} alt={reel.shopName} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-dm-dark">{reel.shopName}</p>
                                                <p className="text-[11px] text-gray-500">{new Date(reel.createdAtISO).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-gray-500">{reel.platform}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className={`text-[11px] px-2 py-1 rounded font-bold ${
                                            reel.status === 'ACTIVE' ? 'bg-green-50 text-green-700' :
                                            reel.status === 'EXPIRED' ? 'bg-gray-100 text-gray-500' :
                                            'bg-red-50 text-red-600'
                                        }`}>
                                            {formatReelStatus(reel.status)}
                                        </span>
                                        <span className="text-[11px] text-gray-600">{reel.views || 0} vistas</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        {reel.origin === 'EXTRA' && (
                                            <span className="text-[11px] bg-yellow-50 text-yellow-600 px-1 rounded border border-yellow-200">EXTRA</span>
                                        )}
                                        <button 
                                            onClick={() => toggleReelHide(reel)}
                                            className={`text-xs border px-2 py-1 rounded ${reel.status === 'HIDDEN' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}
                                        >
                                            {reel.status === 'HIDDEN' ? 'Reactivar' : 'Ocultar'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="hidden md:block">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500">Tienda</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500">Plataforma</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500">Estado</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500">Vistas</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {reels.map(reel => (
                                        <tr key={reel.id}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden"><img src={reel.shopLogo} alt={reel.shopName} loading="lazy" decoding="async" className="w-full h-full object-cover"/></div>
                                                    <div>
                                                        <p className="font-bold text-sm">{reel.shopName}</p>
                                                        <p className="text-[10px] text-gray-400">{new Date(reel.createdAtISO).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs">{reel.platform}</td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] px-2 py-1 rounded font-bold ${
                                                    reel.status === 'ACTIVE' ? 'bg-green-50 text-green-700' :
                                                    reel.status === 'EXPIRED' ? 'bg-gray-100 text-gray-500' :
                                                    'bg-red-50 text-red-600'
                                                }`}>
                                                    {formatReelStatus(reel.status)}
                                                </span>
                                                {reel.origin === 'EXTRA' && <span className="ml-2 text-[10px] bg-yellow-50 text-yellow-600 px-1 rounded border border-yellow-200">EXTRA</span>}
                                            </td>
                                            <td className="px-6 py-4 text-xs">{reel.views || 0}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => toggleReelHide(reel)}
                                                    className={`text-xs border px-2 py-1 rounded ${reel.status === 'HIDDEN' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}
                                                >
                                                    {reel.status === 'HIDDEN' ? 'Reactivar' : 'Ocultar'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'ADMIN' && (
                <div className="space-y-6 animate-in fade-in">
                    <h2 className="font-serif text-2xl text-dm-dark">Administrativo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-dm-dark">Solicitudes de Compra</h3>
                            </div>
                            <p className="text-xs text-gray-500">Bandeja de solicitudes pendientes (PENDING).</p>
                            <div className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    placeholder="Buscar tienda..."
                                    value={purchaseQuery}
                                    onChange={(e) => setPurchaseQuery(e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded text-xs"
                                />
                                <select
                                    value={purchaseStatusFilter}
                                    onChange={(e) => setPurchaseStatusFilter(e.target.value as any)}
                                    className="w-full p-2 border border-gray-200 rounded text-xs bg-white"
                                >
                                    <option value="PENDING">Pendientes</option>
                                    <option value="APPROVED">Aprobadas</option>
                                    <option value="REJECTED">Rechazadas</option>
                                    <option value="ALL">Todas</option>
                                </select>
                            </div>
                            {purchasesLoading ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 3 }).map((_, index) => (
                                        <div key={index} className="border border-gray-100 rounded-lg p-3 text-xs animate-pulse">
                                            <div className="h-3 w-32 bg-gray-200 rounded" />
                                            <div className="mt-2 h-2 w-24 bg-gray-100 rounded" />
                                            <div className="mt-3 h-7 w-24 bg-gray-100 rounded" />
                                        </div>
                                    ))}
                                </div>
                            ) : filteredPurchases.length === 0 ? (
                                <div className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg p-4">
                                    Sin solicitudes registradas.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredPurchases.map((req) => (
                                        <div key={req.purchaseId} className="border border-gray-100 rounded-lg p-3 text-xs">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-dm-dark">{req.shop?.name || 'Tienda'}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase">
                                                        {req.type === 'LIVE_PACK' ? 'Cupos de vivos' : req.type === 'REEL_PACK' ? 'Cupos de historias' : req.type}
                                                    </p>
                                                </div>
                                                <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 border ${
                                                    req.status === 'APPROVED'
                                                      ? 'bg-green-50 text-green-700 border-green-200'
                                                      : req.status === 'REJECTED'
                                                      ? 'bg-red-50 text-red-600 border-red-200'
                                                      : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                }`}>
                                                    {formatPurchaseStatus(req.status)}
                                                </span>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between">
                                                <span className="text-gray-500">Cantidad: <span className="font-bold text-dm-dark">{req.quantity}</span></span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleRejectPurchase(req.purchaseId)}
                                                        className="text-[10px] px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
                                                    >
                                                        Rechazar
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprovePurchase(req.purchaseId)}
                                                        className="text-[10px] px-2 py-1 rounded border border-green-200 text-green-600 hover:bg-green-50"
                                                    >
                                                        Aprobar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
                            <h3 className="font-bold text-dm-dark">Asignación Manual de Cupos</h3>
                            <p className="text-xs text-gray-500">Compensación manual (solo Superadmin).</p>
                            <form onSubmit={handleAssignQuota} className="space-y-3">
                                <select
                                    value={quotaShopId}
                                    onChange={(e) => setQuotaShopId(e.target.value)}
                                    className="w-full p-2 border rounded text-sm bg-white"
                                >
                                    <option value="">Seleccionar tienda...</option>
                                    {shops.map(shop => (
                                        <option key={shop.id} value={shop.id}>{shop.name}</option>
                                    ))}
                                </select>
                                <select
                                    value={quotaType}
                                    onChange={(e) => setQuotaType(e.target.value as any)}
                                    className="w-full p-2 border rounded text-sm bg-white"
                                >
                                    <option value="STREAM">Vivos</option>
                                    <option value="REEL">Reels</option>
                                </select>
                                <input
                                    type="number"
                                    value={quotaAmount}
                                    onChange={(e) => setQuotaAmount(parseInt(e.target.value || '0', 10))}
                                    className="w-full p-2 border rounded text-sm"
                                    min={1}
                                />
                                <Button type="submit" className="w-full">Asignar Cupos</Button>
                            </form>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-dm-dark">Actuar como Distrito Moda</h3>
                            <p className="text-xs text-gray-500">Publicar vivos y reels oficiales destacados.</p>
                        </div>
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-600">
                            <input
                                type="checkbox"
                                checked={officialMode}
                                onChange={() => setOfficialMode(!officialMode)}
                                className="w-4 h-4"
                            />
                            Modo Oficial
                        </label>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-dm-dark">Ciclo de vivos</h3>
                                <p className="text-xs text-gray-500">Arranca y finaliza vivos segun agenda.</p>
                            </div>
                            <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                                Activo
                            </span>
                        </div>
                        <Button className="mt-4 w-full" onClick={runStreamsLifecycle} disabled={streamsLifecycleRunning}>
                            {streamsLifecycleRunning ? 'Procesando...' : 'Ejecutar ciclo'}
                        </Button>
                        {streamsLifecycleSummary && (
                          <p className="mt-3 text-xs text-gray-500">
                            Ultima corrida: {streamsLifecycleSummary.started ?? 0} iniciados · {streamsLifecycleSummary.finished ?? 0} finalizados.
                          </p>
                        )}
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-dm-dark">Motor de sanciones</h3>
                                <p className="text-xs text-gray-500">Ejecuta la corrida del motor (Paso 7).</p>
                            </div>
                            <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                                Activo
                            </span>
                        </div>
                        <Button className="mt-4 w-full" onClick={runSanctions} disabled={sanctionsRunning}>
                            {sanctionsRunning ? 'Ejecutando...' : 'Ejecutar motor'}
                        </Button>
                        {sanctionsSummary && (
                          <p className="mt-3 text-xs text-gray-500">
                            Última corrida: {sanctionsSummary.candidates ?? 0} candidatos · {sanctionsSummary.sanctioned ?? 0} sancionados.
                          </p>
                        )}
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-dm-dark">Notificaciones</h3>
                                <p className="text-xs text-gray-500">Cola y estados del sistema.</p>
                            </div>
                            <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                                Activo
                            </span>
                        </div>
                        <Button className="mt-4 w-full" onClick={runNotifications} disabled={notificationsRunning}>
                            {notificationsRunning ? 'Procesando...' : 'Ejecutar cola'}
                        </Button>
                        {notificationsSummary && (
                          <p className="mt-3 text-xs text-gray-500">
                            Última corrida: {notificationsSummary.created ?? 0} creadas · {notificationsSummary.skipped ?? 0} omitidas.
                          </p>
                        )}
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <select
                            value={notificationFilter}
                            onChange={(e) => setNotificationFilter(e.target.value as any)}
                            className="rounded-lg border border-gray-200 px-2 py-1 text-[10px] font-bold text-gray-600"
                          >
                            <option value="UNREAD">No leídas</option>
                            <option value="ALL">Todas</option>
                          </select>
                          <select
                            value={notificationType}
                            onChange={(e) => setNotificationType(e.target.value as any)}
                            className="rounded-lg border border-gray-200 px-2 py-1 text-[10px] font-bold text-gray-600"
                          >
                            <option value="ALL">Todos los tipos</option>
                            <option value="SYSTEM">Sistema</option>
                            <option value="REMINDER">Recordatorio</option>
                            <option value="PURCHASE">Compra</option>
                          </select>
                          <button
                            className="text-[10px] font-bold text-dm-crimson"
                            onClick={refreshAdminNotifications}
                          >
                            Actualizar
                          </button>
                        </div>
                        <div className="mt-4 max-h-44 space-y-3 overflow-y-auto pr-1">
                          {notificationsLoading ? (
                            Array.from({ length: 4 }).map((_, index) => (
                              <div key={index} className="rounded-lg border border-gray-100 p-3 text-[11px] animate-pulse">
                                <div className="h-2 w-20 bg-gray-200 rounded" />
                                <div className="mt-2 h-3 w-40 bg-gray-100 rounded" />
                                <div className="mt-2 h-2 w-24 bg-gray-100 rounded" />
                              </div>
                            ))
                          ) : adminNotifications.length === 0 ? (
                            <p className="text-xs text-gray-400">No hay notificaciones para mostrar.</p>
                          ) : (
                            adminNotifications.map((note) => (
                              <div key={note.id} className="rounded-lg border border-gray-100 p-3 text-[11px] text-gray-600">
                                <div className="flex items-center justify-between">
                                  <span className={`text-[10px] font-bold uppercase ${note.read ? 'text-gray-400' : 'text-dm-crimson'}`}>
                                    {formatNotificationType(note.type)}
                                  </span>
                                  <span className="text-[10px] text-gray-400">{formatNotificationDate(note.createdAt)}</span>
                                </div>
                                <p className={`mt-1 ${note.read ? 'text-gray-500' : 'text-dm-dark font-semibold'}`}>
                                  {note.message}
                                </p>
                                <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                                  <span>{note.user?.email || 'Usuario sin email'}</span>
                                  {!note.read && (
                                    <button className="text-[10px] font-bold text-gray-500" onClick={() => markNotificationRead(note.id)}>
                                      Marcar leído
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                    </div>
                </div>
            )}
        </main>
      </div>

      {/* Modal: Crear Nueva Tienda (Expanded to include full business requirements) */}
      {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
                  
                  {/* Modal Header */}
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-dm-crimson rounded-lg text-white">
                            <Plus size={24} />
                        </div>
                        <div>
                            <h2 className="font-serif text-2xl text-dm-dark font-bold leading-tight">Alta de Nueva Tienda</h2>
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Registro Administrativo</p>
                            <p className="text-[10px] text-gray-400 mt-1">Estado inicial: PENDING_VERIFICATION</p>
                        </div>
                      </div>
                      <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-dm-dark p-2 rounded-full hover:bg-white shadow-sm transition-all">
                          <X size={24} />
                      </button>
                  </div>

                  {/* Modal Body / Form */}
                  <form onSubmit={handleCreateShop} className="p-8 space-y-8 overflow-y-auto no-scrollbar">
                      
                      {/* Section 1: Identidad & Legal */}
                      <section className="space-y-4">
                          <h3 className="flex items-center gap-2 text-xs font-bold text-dm-dark uppercase tracking-[0.2em] border-b pb-2 border-gray-100">
                              <Store size={16} className="text-dm-crimson" /> 1. Identidad & Legal
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="md:col-span-2">
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nombre de Fantasía (Público) *</label>
                                  <input 
                                      type="text" required value={formData.name}
                                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                                      placeholder="Ej: Las Marianas"
                                      className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-dm-crimson/5 focus:border-dm-crimson outline-none transition-all"
                                  />
                              </div>
                              <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Razón Social *</label>
                                  <input 
                                      type="text" required value={formData.razonSocial}
                                      onChange={(e) => setFormData({...formData, razonSocial: e.target.value})}
                                      placeholder="Nombre legal completo"
                                      className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-dm-crimson/5 focus:border-dm-crimson outline-none transition-all"
                                  />
                              </div>
                              <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">CUIT *</label>
                                  <input 
                                      type="text" required value={formData.cuit}
                                      onChange={(e) => setFormData({...formData, cuit: e.target.value})}
                                      placeholder="30-XXXXXXXX-X"
                                      className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-dm-crimson/5 focus:border-dm-crimson outline-none transition-all"
                                  />
                              </div>
                          </div>
                      </section>

                      {/* Section 2: Dirección Física */}
                      <section className="space-y-4">
                          <h3 className="flex items-center gap-2 text-xs font-bold text-dm-dark uppercase tracking-[0.2em] border-b pb-2 border-gray-100">
                              <MapPin size={16} className="text-dm-crimson" /> 2. Dirección Física
                          </h3>
                          <div className="space-y-4">
                               <div className="relative">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Buscador Google Maps (Simulado)</label>
                                    <AddressAutocomplete onSelect={handleAddressSelect} />
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Calle</label>
                                        <input 
                                            type="text" value={formData.street}
                                            onChange={(e) => setFormData({...formData, street: e.target.value})}
                                            className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Número</label>
                                        <input 
                                            type="text" value={formData.number}
                                            onChange={(e) => setFormData({...formData, number: e.target.value})}
                                            className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Localidad / Barrio</label>
                                        <input 
                                            type="text" value={formData.city}
                                            onChange={(e) => setFormData({...formData, city: e.target.value})}
                                            className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Provincia</label>
                                        <input 
                                            type="text" value={formData.province}
                                            onChange={(e) => setFormData({...formData, province: e.target.value})}
                                            className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">CP</label>
                                        <input 
                                            type="text" value={formData.zip}
                                            onChange={(e) => setFormData({...formData, zip: e.target.value})}
                                            className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-gray-50"
                                        />
                                    </div>
                               </div>
                          </div>
                      </section>

                      {/* Section 3: Condiciones de Venta */}
                      <section className="space-y-4">
                          <h3 className="flex items-center gap-2 text-xs font-bold text-dm-dark uppercase tracking-[0.2em] border-b pb-2 border-gray-100">
                              <CreditCard size={16} className="text-dm-crimson" /> 3. Condiciones de Venta
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Monto Mínimo de Compra ($)</label>
                                  <div className="relative">
                                      <span className="absolute left-3 top-3 text-gray-400 font-bold">$</span>
                                      <input 
                                          type="number" value={formData.minimumPurchase}
                                          onChange={(e) => setFormData({...formData, minimumPurchase: parseInt(e.target.value) || 0})}
                                          className="w-full pl-8 p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-dm-crimson/5 transition-all"
                                      />
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Formas de Pago Aceptadas</label>
                                  <div className="grid grid-cols-2 gap-2">
                                      {PAYMENT_OPTIONS.map(method => (
                                          <label key={method} className="flex items-center gap-2 text-xs cursor-pointer group">
                                              <input 
                                                  type="checkbox" 
                                                  checked={formData.paymentMethods.includes(method)}
                                                  onChange={() => togglePaymentMethod(method)}
                                                  className="w-4 h-4 rounded border-gray-300 text-dm-crimson focus:ring-dm-crimson"
                                              />
                                              <span className="text-gray-600 group-hover:text-dm-dark transition-colors">{method}</span>
                                          </label>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      </section>

                      {/* Section 4: Contacto Administrativo & Cuenta */}
                      <section className="space-y-4">
                          <h3 className="flex items-center gap-2 text-xs font-bold text-dm-dark uppercase tracking-[0.2em] border-b pb-2 border-gray-100">
                              <User size={16} className="text-dm-crimson" /> 4. Contacto & Cuenta
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="md:col-span-2">
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Email administrativo (inicio de sesión) *</label>
                                  <input 
                                      type="email" required value={formData.email}
                                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                                      placeholder="admin@tienda.com"
                                      className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-dm-crimson/5 transition-all"
                                  />
                              </div>
                              <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Contraseña Inicial *</label>
                                  <div className="relative">
                                      <Lock size={14} className="absolute left-3 top-3.5 text-gray-300" />
                                      <input 
                                          type="password" required value={formData.password}
                                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                                          className="w-full pl-10 p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-dm-crimson/5 transition-all"
                                      />
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Plan de Suscripción</label>
                                  <select 
                                      value={formData.plan}
                                      onChange={(e) => setFormData({...formData, plan: e.target.value as any})}
                                      className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:ring-4 focus:ring-dm-crimson/5 transition-all font-bold text-dm-dark"
                                  >
                                      <option value="BASIC">ESTÁNDAR (BASIC)</option>
                                      <option value="PREMIUM">ALTA VISIBILIDAD (PREMIUM)</option>
                                      <option value="PRO">MÁXIMA VISIBILIDAD (PRO)</option>
                                  </select>
                              </div>
                          </div>
                      </section>

                      {/* Section 5: Configuración Técnica (Oculta/Dashboard) */}
                      <section className="space-y-4 pt-4 border-t border-gray-100">
                          <h3 className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">
                              Configuración de Cuotas Iniciales
                          </h3>
                          <div className="grid grid-cols-3 gap-4">
                               <div>
                                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Logo URL</label>
                                  <input type="text" value={formData.logoUrl} onChange={(e) => setFormData({...formData, logoUrl: e.target.value})} className="w-full p-2 border border-gray-100 rounded-lg text-[10px]" placeholder="https://..." />
                               </div>
                               <div>
                                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Cupos Vivos</label>
                                  <input type="number" value={formData.streamQuota} onChange={(e) => setFormData({...formData, streamQuota: parseInt(e.target.value) || 0})} className="w-full p-2 border border-gray-100 rounded-lg text-[10px]" />
                               </div>
                               <div>
                                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Cupos Reels</label>
                                  <input type="number" value={formData.reelQuota} onChange={(e) => setFormData({...formData, reelQuota: parseInt(e.target.value) || 0})} className="w-full p-2 border border-gray-100 rounded-lg text-[10px]" />
                               </div>
                          </div>
                      </section>

                      {/* Form Actions */}
                      <div className="pt-4 flex gap-4">
                          <Button 
                              type="button" 
                              variant="outline" 
                              className="flex-1 h-14 rounded-xl border-gray-200 text-gray-500 hover:bg-gray-50"
                              onClick={() => setIsCreateModalOpen(false)}
                          >
                              Cancelar
                          </Button>
                          <Button 
                              type="submit" 
                              className="flex-[2] h-14 bg-dm-crimson hover:bg-red-700 text-white border-none rounded-xl shadow-xl shadow-dm-crimson/20 text-lg"
                          >
                              <Save size={20} className="mr-2" /> Dar de Alta Tienda
                          </Button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {editShop && (
          <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 relative">
                  <button onClick={() => setEditShop(null)} className="absolute top-3 right-3 text-gray-400 hover:text-dm-dark">
                      <X size={18} />
                  </button>
                  <div className="mb-4">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold">Editar tienda</p>
                      <h2 className="font-serif text-xl text-dm-dark font-bold">Datos y redes</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nombre</label>
                          <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                          />
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Razón social</label>
                          <input
                              type="text"
                              value={editForm.razonSocial}
                              onChange={(e) => setEditForm({ ...editForm, razonSocial: e.target.value })}
                              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                          />
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Email</label>
                          <input
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                          />
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">CUIT</label>
                          <input
                              type="text"
                              value={editForm.cuit}
                              onChange={(e) => setEditForm({ ...editForm, cuit: e.target.value })}
                              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                          />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Instagram</label>
                          <input
                              type="text"
                              value={editForm.instagram}
                              onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                              placeholder="usuario (sin @)"
                          />
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">TikTok</label>
                          <input
                              type="text"
                              value={editForm.tiktok}
                              onChange={(e) => setEditForm({ ...editForm, tiktok: e.target.value })}
                              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                              placeholder="usuario (sin @)"
                          />
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Facebook</label>
                          <input
                              type="text"
                              value={editForm.facebook}
                              onChange={(e) => setEditForm({ ...editForm, facebook: e.target.value })}
                              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                              placeholder="página"
                          />
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">YouTube</label>
                          <input
                              type="text"
                              value={editForm.youtube}
                              onChange={(e) => setEditForm({ ...editForm, youtube: e.target.value })}
                              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                              placeholder="canal"
                          />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">WhatsApp principal</label>
                          <input
                              type="text"
                              value={editForm.whatsapp}
                              onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                              placeholder="+54..."
                          />
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Sitio web</label>
                          <input
                              type="text"
                              value={editForm.website}
                              onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                              placeholder="https://..."
                          />
                      </div>
                      <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Logo URL</label>
                          <input
                              type="text"
                              value={editForm.logoUrl}
                              onChange={(e) => setEditForm({ ...editForm, logoUrl: e.target.value })}
                              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                              placeholder="https://..."
                          />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Calle</label>
                          <input
                              type="text"
                              value={editForm.street}
                              onChange={(e) => setEditForm({ ...editForm, street: e.target.value })}
                              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                          />
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Número</label>
                          <input
                              type="text"
                              value={editForm.number}
                              onChange={(e) => setEditForm({ ...editForm, number: e.target.value })}
                              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                          />
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ciudad</label>
                          <input
                              type="text"
                              value={editForm.city}
                              onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                          />
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Provincia</label>
                          <input
                              type="text"
                              value={editForm.province}
                              onChange={(e) => setEditForm({ ...editForm, province: e.target.value })}
                              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                          />
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">CP</label>
                          <input
                              type="text"
                              value={editForm.zip}
                              onChange={(e) => setEditForm({ ...editForm, zip: e.target.value })}
                              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                          />
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mínimo de compra</label>
                          <input
                              type="number"
                              value={editForm.minimumPurchase}
                              onChange={(e) => setEditForm({ ...editForm, minimumPurchase: parseInt(e.target.value) || 0 })}
                              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                          />
                      </div>
                  </div>

                  <div className="flex gap-3 mt-5">
                      <Button
                          variant="outline"
                          className="flex-1 h-11 rounded-xl border-gray-200 text-gray-500 hover:bg-gray-50"
                          onClick={() => setEditShop(null)}
                      >
                          Cancelar
                      </Button>
                      <Button
                          className="flex-[2] h-11 bg-dm-crimson hover:bg-red-700 text-white border-none rounded-xl shadow-xl shadow-dm-crimson/20"
                          onClick={handleEditShopSave}
                      >
                          <Save size={18} className="mr-2" /> Guardar cambios
                      </Button>
                  </div>
              </div>
          </div>
      )}

      {confirmDialog && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
                  <button
                      onClick={() => setConfirmDialog(null)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-dm-dark"
                  >
                      <X size={18} />
                  </button>
                  <h3 className="font-serif text-xl text-dm-dark">{confirmDialog.title}</h3>
                  <p className="mt-2 text-xs text-gray-500">{confirmDialog.message}</p>
                  <div className="mt-6 flex gap-3">
                      <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setConfirmDialog(null)}
                      >
                          {confirmDialog.cancelLabel || 'Cancelar'}
                      </Button>
                      <Button
                          className="flex-1 bg-dm-crimson hover:bg-red-700 text-white border-none"
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
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
                  <button
                      onClick={() => setInputDialog(null)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-dm-dark"
                  >
                      <X size={18} />
                  </button>
                  <h3 className="font-serif text-xl text-dm-dark">{inputDialog.title}</h3>
                  <p className="mt-2 text-xs text-gray-500">{inputDialog.message}</p>
                  <div className="mt-4 space-y-3">
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
                              className="w-full rounded-lg border border-gray-200 p-2 text-sm"
                          />
                      ))}
                  </div>
                  <div className="mt-6 flex gap-3">
                      <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setInputDialog(null)}
                      >
                          {inputDialog.cancelLabel || 'Cancelar'}
                      </Button>
                      <Button
                          className="flex-1 bg-dm-crimson hover:bg-red-700 text-white border-none"
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
