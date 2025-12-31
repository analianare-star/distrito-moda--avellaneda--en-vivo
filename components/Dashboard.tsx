import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Plus, X, Instagram, Facebook, Video, AlertOctagon, Check, Save, Lock, RefreshCw, Pencil, Trash2, Star, History, LayoutDashboard, Store, Radio, Globe, Phone, MapPin, ExternalLink, User, CreditCard, DollarSign, ShoppingCart, AlertTriangle, Info, ArrowUpCircle, Film } from 'lucide-react';
import { StreamStatus, Shop, SocialHandles, Stream, SocialPlatform, WhatsappLine, WhatsappLabel, Reel } from '../types';
import { PLANES_URL } from '../constants';
import { AddressAutocomplete } from './AddressAutocomplete';
import { api } from '../services/api';

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
}

type Tab = 'RESUMEN' | 'REDES' | 'VIVOS' | 'REELS' | 'PERFIL';

const WA_LABELS: WhatsappLabel[] = ['Ventas por mayor', 'Ventas por menor', 'Consulta ingreso', 'Envíos', 'Reclamos'];
const PAYMENT_OPTIONS = ['Efectivo', 'Transferencia', 'Depósito', 'USDT', 'Cheque', 'Mercado Pago'];
const REEL_LIMITS: Record<string, number> = { 'Estandar': 1, 'Alta Visibilidad': 3, 'Maxima Visibilidad': 5 };

export const Dashboard: React.FC<DashboardProps> = ({ 
    currentShop, 
    streams, 
    onStreamCreate, 
    onStreamUpdate,
    onStreamDelete,
    onShopUpdate, 
    onExtendStream,
    onBuyQuota,
    onReelChange
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('RESUMEN');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [editingStream, setEditingStream] = useState<Stream | null>(null);
  const [shopReels, setShopReels] = useState<Reel[]>([]); 
  
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
          try {
            const allReels = await api.fetchAllReelsAdmin();
            const myReels = allReels.filter(r => r.shopId === currentShop.id);
            setShopReels(myReels);
          } catch (error) {
            console.error("Error cargando reels", error);
          }
      };
      loadReels();
  }, [currentShop]);

  // --- LOGIC: QUOTAS & PERMISSIONS (CORREGIDO PARA EVITAR NaN) ---
  
  const myStreams = streams.filter(s => s.shop.id === currentShop.id);
  const activeStreams = myStreams.filter(s =>
      s.status === StreamStatus.LIVE ||
      s.status === StreamStatus.UPCOMING ||
      s.status === StreamStatus.PENDING_REPROGRAMMATION
  );
  
  // CORRECCIÓN: Usamos Number() y || 0 para evitar errores si el backend manda null
  const baseQuota = Number(currentShop.baseQuota) || 0;
  const extraQuota = Number(currentShop.extraQuota) || 0;
  
  const totalQuota = baseQuota + extraQuota;
  const usedQuota = activeStreams.length;
  const availableQuota = totalQuota - usedQuota;
  
  // Reels Quota
  const todayStr = new Date().toISOString().split('T')[0];
  const reelsToday = shopReels.filter(r => r.createdAtISO.startsWith(todayStr) && r.origin === 'PLAN' && r.status !== 'HIDDEN').length;
  const reelPlanLimit = REEL_LIMITS[currentShop.plan] || 1; // Default a 1 si el plan no coincide
  const availableReelPlan = Math.max(0, reelPlanLimit - reelsToday);
  
  // CORRECCIÓN: Convertir a número
  const reelsExtra = Number(currentShop.reelsExtraQuota) || 0;
  
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

  const statusLabels: Record<string, string> = {
      ACTIVE: 'Activa',
      PENDING_VERIFICATION: 'Pendiente',
      AGENDA_SUSPENDED: 'Agenda suspendida',
      HIDDEN: 'Oculta',
      BANNED: 'Bloqueada',
  };
  const statusTones: Record<string, string> = {
      ACTIVE: 'bg-green-50 text-green-700 border-green-200',
      PENDING_VERIFICATION: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      AGENDA_SUSPENDED: 'bg-red-50 text-red-700 border-red-200',
      HIDDEN: 'bg-gray-100 text-gray-600 border-gray-200',
      BANNED: 'bg-red-100 text-red-700 border-red-300',
  };
  const statusLabel = statusLabels[shopStatus] || 'Activa';
  const statusTone = statusTones[shopStatus] || statusTones.ACTIVE;

  // --- HELPERS ---
  const handleInputChange = (field: keyof Shop, value: any) => {
      setShopForm(prev => ({ ...prev, [field]: value }));
  };
  const handleAddressChange = (field: string, value: string) => {
      setShopForm(prev => ({
          ...prev,
          addressDetails: {
              ...(prev.addressDetails || currentShop.addressDetails || { street: '', number: '', city: '', province: '', zip: '', mapsUrl: '' }),
              [field]: value
          }
      }));
  };
  const handleAddressSelect = (details: { street: string; number: string; city: string; province: string; zip: string }) => {
      const existingMapsUrl = (shopForm.addressDetails || currentShop.addressDetails || {}).mapsUrl || '';
      setShopForm(prev => ({
          ...prev,
          addressDetails: { ...details, mapsUrl: existingMapsUrl },
          address: `${details.street} ${details.number}, ${details.city}`
      }));
  };
  const togglePaymentMethod = (method: string) => {
      const current = shopForm.paymentMethods || [];
      const updated = current.includes(method) ? current.filter(m => m !== method) : [...current, method];
      handleInputChange('paymentMethods', updated);
  };
  const saveShopProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      const newAddress = shopForm.addressDetails 
        ? `${shopForm.addressDetails.street} ${shopForm.addressDetails.number}, ${shopForm.addressDetails.city}`
        : currentShop.address;
      const ok = await onShopUpdate({ ...currentShop, ...shopForm, address: newAddress });
      if (!ok) return;
      alert("Datos de tienda actualizados correctamente.");
  };

  // --- REELS HANDLERS ---
  const handleUploadReel = async () => {
      if (!reelUrl || !reelPlatform) {
          alert("Debes ingresar la URL y la plataforma.");
          return;
      }
      const result = await api.createReel(currentShop.id, reelUrl, reelPlatform as SocialPlatform);
      if (result.success) {
          alert(result.message);
          setReelUrl('');
          setReelPlatform('');
          if (onReelChange) onReelChange();
          const allReels = await api.fetchAllReelsAdmin();
          setShopReels(allReels.filter(r => r.shopId === currentShop.id));
      } else {
          alert(result.message);
      }
  };

  const handleBuyReelConfirm = async () => {
      if (window.confirm("¿Comprar paquete de 5 Historias extra por $2.500?")) {
           // CORRECCIÓN AQUÍ: Agregamos el tercer argumento (payment simulado)
           const updated = await api.buyReelQuota(currentShop.id, 5, { method: 'SIMULATED' });
           if(updated) {
               await onShopUpdate(updated);
               if (onReelChange) onReelChange();
           }
           alert("¡Paquete de historias comprado!");
      }
  };

  // --- STREAM FORM HANDLERS ---
  const handleBuyConfirm = () => {
      if (isAgendaSuspended) {
          alert("Agenda suspendida: no puedes comprar cupos de vivos.");
          return;
      }
      if (window.confirm("Confirmar compra de 1 cupo adicional por $5.000?")) {
          onBuyQuota(1);
          setShowBuyModal(false);
          alert("¡Cupo comprado exitosamente! Ya puedes agendar tu vivo.");
      }
  };
  const handleCreateClick = () => {
      if (!canSchedule) return;
      setFormTitle(''); setFormDate(''); setFormTime(''); setFormPlatform(''); setEditingStream(null);
      setShowCreateModal(true);
  };
  const handleConfirmStream = async () => { 
      if(!formTitle || !formTime || !formPlatform || !formDate) { alert("Todos los campos son obligatorios."); return; }
      const fullDateISO = new Date(`${formDate}T${formTime}`).toISOString();
      const selectedDateStr = fullDateISO.split('T')[0];
      const hasStreamOnDate = myStreams.some(s => {
          if (editingStream && s.id === editingStream.id) return false;
          if (![StreamStatus.UPCOMING, StreamStatus.LIVE, StreamStatus.PENDING_REPROGRAMMATION].includes(s.status)) return false;
          return s.fullDateISO.split('T')[0] === selectedDateStr;
      });
      if (hasStreamOnDate) { alert(`Límite diario: Ya tienes un vivo programado para el ${selectedDateStr}.`); return; }
      const handle = currentShop.socialHandles ? currentShop.socialHandles[formPlatform.toLowerCase() as keyof SocialHandles] : '';
      if (!handle) { alert(`Configura tu usuario de ${formPlatform} en la pestaña 'Mis Redes' antes de agendar.`); return; }
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
          const ok = await onStreamCreate({ id: `new-${Date.now()}`, shop: currentShop, shopId: currentShop.id, coverImage: currentShop.coverUrl || currentShop.logoUrl, status: StreamStatus.UPCOMING, views: 0, reportCount: 0, isVisible: true, likes: 0, extensionCount: 0, ...streamData });
          if (!ok) return;
      }
      setShowCreateModal(false);
  };
  const saveSocials = async (e: React.FormEvent) => {
      e.preventDefault();
      const validWaLines: WhatsappLine[] = [];
      for (const line of waLines.slice(0, whatsappLimit)) {
          if (line.number.trim()) {
              if (!line.label) { alert("Selecciona etiqueta para el WhatsApp: " + line.number); return; }
              validWaLines.push({ label: line.label as WhatsappLabel, number: line.number });
          }
      }
      const ok = await onShopUpdate({ ...currentShop, socialHandles: socials, whatsappLines: validWaLines, website: shopForm.website });
      if (!ok) return;
      alert("Redes y contactos actualizados.");
  };
  const openEditModal = (stream: Stream) => {
      if (!canManageAgenda) {
          alert(getRestrictionMessage() || "Agenda no disponible.");
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
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex-shrink-0 z-10 flex flex-col">
          <div className="p-6 border-b border-gray-100 text-center">
              <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full mb-3 overflow-hidden border-4 border-white shadow-sm">
                  <img src={currentShop.logoUrl} alt={currentShop.name} className="w-full h-full object-cover" />
              </div>
              <h2 className="font-serif text-lg font-bold text-dm-dark leading-tight">{currentShop.name}</h2>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{currentShop.plan}</p>
              <div className={`mt-2 inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusTone}`}>
                  {statusLabel}
              </div>
          </div>
          <nav className="p-4 space-y-1 flex-1">
               <button onClick={() => setActiveTab('RESUMEN')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === 'RESUMEN' ? 'bg-dm-crimson/5 text-dm-crimson' : 'text-gray-500 hover:bg-gray-50'}`}>
                   <LayoutDashboard size={18}/> Inicio / Resumen
               </button>
               <button onClick={() => setActiveTab('REDES')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === 'REDES' ? 'bg-dm-crimson/5 text-dm-crimson' : 'text-gray-500 hover:bg-gray-50'}`}>
                   <Globe size={18}/> Mis Redes
               </button>
               <button onClick={() => setActiveTab('VIVOS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === 'VIVOS' ? 'bg-dm-crimson/5 text-dm-crimson' : 'text-gray-500 hover:bg-gray-50'}`}>
                   <Radio size={18}/> Mis Vivos
               </button>
               <button onClick={() => setActiveTab('REELS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === 'REELS' ? 'bg-dm-crimson/5 text-dm-crimson' : 'text-gray-500 hover:bg-gray-50'}`}>
                   <Film size={18}/> Mis Historias
               </button>
               <button onClick={() => setActiveTab('PERFIL')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === 'PERFIL' ? 'bg-dm-crimson/5 text-dm-crimson' : 'text-gray-500 hover:bg-gray-50'}`}>
                   <Store size={18}/> Datos Tienda
               </button>
          </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto">
          
          {/* TAB 1: RESUMEN (HOME) */}
          {activeTab === 'RESUMEN' && (
              <div className="max-w-5xl space-y-6 animate-in fade-in">
                  <header>
                      <h1 className="font-serif text-3xl text-dm-dark">Panel de Control</h1>
                      <p className="text-gray-500 text-sm mt-1">Visión general de tu rendimiento y disponibilidad.</p>
                  </header>

                  {/* PENALTY ALERT */}
                  {(isPenalized || shopStatus !== 'ACTIVE') && (
                      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm flex items-start gap-4">
                          <AlertOctagon className="text-red-600 shrink-0" />
                          <div>
                              <h3 className="font-bold text-red-800">{shopStatus === 'PENDING_VERIFICATION' ? 'Cuenta en Verificacion' : 'Agenda Restringida'}</h3>
                              <p className="text-sm text-red-700 mt-1">
                                  {getRestrictionMessage()}
                              </p>
                              <div className="mt-2 text-xs font-mono bg-white/50 p-2 rounded">
                                  {currentShop.agendaSuspendedReason || currentShop.penalties.find(p => p.active)?.reason || 'Motivo: estado restringido.'}
                              </div>
                          </div>
                      </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* QUOTA CARD */}
                      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm md:col-span-2 relative overflow-hidden">
                          <div className="flex justify-between items-start mb-6">
                              <div>
                                  <h3 className="font-bold text-dm-dark text-lg">Cupos para Vivos</h3>
                                  <p className="text-xs text-gray-500">Disponibilidad semanal</p>
                              </div>
                              <Button size="sm" onClick={() => setShowBuyModal(true)} disabled={isAgendaSuspended} className="bg-green-600 hover:bg-green-700 border-none text-white shadow-green-200">
                                  <ShoppingCart size={16} className="mr-2"/> Comprar Extras
                              </Button>
                          </div>

                          <div className="flex items-center gap-8">
                              {/* Circle Chart */}
                              <div className="relative w-24 h-24 rounded-full border-8 border-gray-100 flex items-center justify-center">
                                  <div className="text-center">
                                      <span className={`text-2xl font-bold ${availableQuota > 0 ? 'text-dm-dark' : 'text-red-500'}`}>{isNaN(availableQuota) ? 0 : availableQuota}</span>
                                      <span className="block text-[10px] text-gray-400 uppercase">Disp.</span>
                                  </div>
                              </div>
                              
                              <div className="space-y-3 flex-1">
                                  <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                      <span className="text-gray-500">Plan Base ({currentShop.plan})</span>
                                      <span className="font-bold">{baseQuota}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                      <span className="text-gray-500 flex items-center gap-1"><Plus size={12} className="text-green-500"/> Cupos Extras</span>
                                      <span className="font-bold text-green-600">{extraQuota}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm">
                                      <span className="text-gray-500">Usados (En curso/Prog.)</span>
                                      <span className="font-bold text-dm-crimson">-{usedQuota}</span>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* PLAN STATUS */}
                      <div className="bg-gradient-to-b from-white to-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                           <div className="mb-4">
                                <h3 className="font-bold text-dm-dark text-lg flex items-center gap-2">
                                    Tu Suscripción
                                </h3>
                                <p className="text-xs text-gray-500">Nivel de visibilidad actual</p>
                           </div>
                           
                           <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
                                <span className={`text-sm font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                                    isMaxima ? 'bg-purple-100 text-purple-700' :
                                    isAlta ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-200 text-gray-600'
                                }`}>
                                    Plan {currentShop.plan}
                                </span>

                                {isStandard && (
                                    <div className="text-xs text-gray-500">
                                        <p className="mb-2">Estás en el plan básico.</p>
                                        <p className="text-blue-600 font-bold flex items-center justify-center gap-1">
                                            <ArrowUpCircle size={14}/> Pásate a ALTA
                                        </p>
                                    </div>
                                )}
                                {isAlta && (
                                    <div className="text-xs text-gray-500">
                                        <p className="mb-2">Tienes buena visibilidad.</p>
                                        <p className="text-purple-600 font-bold flex items-center justify-center gap-1">
                                            <ArrowUpCircle size={14}/> Pásate a MÁXIMA
                                        </p>
                                    </div>
                                )}
                                {isMaxima && (
                                    <div className="text-xs text-gray-500">
                                        <p>¡Eres un líder en la plataforma!</p>
                                        <p>Disfrutas de máxima exposición y cupos.</p>
                                    </div>
                                )}
                           </div>

                           {!isMaxima && (
                               <Button variant="secondary" size="sm" onClick={openPlanPage} className="w-full mt-4 text-xs">
                                   Mejorar mi Plan
                               </Button>
                           )}
                      </div>
                  </div>
              </div>
          )}

          {/* TAB: MIS REELS */}
          {activeTab === 'REELS' && (
              <div className="max-w-4xl space-y-6 animate-in fade-in">
                  <header className="flex justify-between items-end">
                      <div>
                          <h1 className="font-serif text-3xl text-dm-dark">Mis Historias</h1>
                          <p className="text-gray-500 text-sm mt-1">Comparte contenido corto por 24 horas.</p>
                      </div>
                      <div className="text-right">
                          <p className="text-xs text-gray-500">Disponibles hoy (Plan): <span className="font-bold">{availableReelPlan}</span></p>
                          <p className="text-xs text-gray-500">Extras comprados: <span className="font-bold text-green-600">{reelsExtra}</span></p>
                          <button onClick={handleBuyReelConfirm} className="text-[10px] text-dm-crimson underline font-bold mt-1">Comprar Extras</button>
                      </div>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* UPLOAD FORM */}
                      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-fit">
                          <h3 className="font-bold text-dm-dark mb-4 border-b pb-2 flex items-center gap-2"><Plus size={16}/> Subir Historia</h3>
                          <div className="space-y-4">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Enlace del Video</label>
                                  <input 
                                    type="text" 
                                    value={reelUrl}
                                    onChange={e => setReelUrl(e.target.value)}
                                    placeholder="https://instagram.com/reel/..."
                                    className="w-full p-2 border rounded text-sm"
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Plataforma</label>
                                  <select 
                                    value={reelPlatform}
                                    onChange={e => setReelPlatform(e.target.value as SocialPlatform)}
                                    className="w-full p-2 border rounded text-sm bg-gray-50"
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
                                className="w-full"
                              >
                                  Publicar Historia
                              </Button>
                              {(availableReelPlan === 0 && reelsExtra === 0) && (
                                  <p className="text-xs text-red-500 text-center">Sin cupos disponibles hoy.</p>
                              )}
                          </div>
                      </div>

                      {/* ACTIVE LIST */}
                      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                           <h3 className="font-bold text-dm-dark mb-4 border-b pb-2 flex items-center gap-2"><Film size={16}/> Activas (últimas 24h)</h3>
                           <div className="space-y-3">
                               {shopReels.filter(r => r.status === 'ACTIVE').length === 0 ? (
                                   <p className="text-sm text-gray-400 text-center py-4">No tienes historias activas.</p>
                               ) : (
                                   shopReels.filter(r => r.status === 'ACTIVE').map(reel => {
                                       const now = new Date();
                                       const expires = new Date(reel.expiresAtISO);
                                       const diffMs = expires.getTime() - now.getTime();
                                       const hours = Math.floor(diffMs / (1000 * 60 * 60));
                                       return (
                                           <div key={reel.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100">
                                               <div className="overflow-hidden">
                                                   <p className="text-xs font-bold truncate w-40">{reel.url}</p>
                                                   <p className="text-[10px] text-gray-500">{reel.platform} • Expira en {hours}h</p>
                                               </div>
                                               <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold">ACTIVA</span>
                                           </div>
                                       );
                                   })
                               )}
                           </div>
                           
                           {/* EXPIRED LIST */}
                           {shopReels.some(r => r.status === 'EXPIRED') && (
                               <div className="mt-6 pt-4 border-t border-gray-100 opacity-60">
                                   <h4 className="text-xs font-bold text-gray-500 mb-2">Expiradas recientemente</h4>
                                   {shopReels.filter(r => r.status === 'EXPIRED').slice(0, 3).map(reel => (
                                       <div key={reel.id} className="flex justify-between text-[10px] text-gray-400 py-1">
                                           <span className="truncate w-40">{reel.url}</span>
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
              <div className="max-w-3xl space-y-6 animate-in fade-in">
                  <header>
                      <h1 className="font-serif text-3xl text-dm-dark">Mis Redes</h1>
                      <p className="text-gray-500 text-sm mt-1">Configura dónde transmitirás tus vivos y cómo te contactan.</p>
                  </header>
                  <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
                      <form onSubmit={saveSocials} className="space-y-6">
                           <div className="space-y-4">
                               <h3 className="font-bold text-dm-dark flex items-center gap-2 border-b pb-2"><Phone size={18}/> WhatsApp</h3>
                               {waLines.map((line, idx) => {
                                   const isDisabled = idx >= whatsappLimit;
                                   return (
                                   <div key={idx} className={`flex gap-2 items-center ${isDisabled ? 'opacity-50' : ''}`}>
                                       <select 
                                            value={line.label} 
                                            onChange={e => {
                                                const newLines = [...waLines];
                                                newLines[idx].label = e.target.value as WhatsappLabel;
                                                setWaLines(newLines);
                                            }}
                                            disabled={isDisabled}
                                            className="w-1/3 p-2 border rounded text-xs bg-gray-50"
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
                                            disabled={isDisabled}
                                            className="flex-1 p-2 border rounded text-sm" 
                                            placeholder="54911..."
                                        />
                                   </div>
                               )})}
                           </div>
                           <div className="space-y-4 pt-4">
                               <h3 className="font-bold text-dm-dark flex items-center gap-2 border-b pb-2"><Globe size={18}/> Redes Sociales</h3>
                               <div className="grid grid-cols-1 gap-4">
                                   <label className="flex items-center gap-3">
                                       <div className="w-8 h-8 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center"><Instagram size={16}/></div>
                                       <input type="text" value={socials.instagram || ''} onChange={e => setSocials({...socials, instagram: e.target.value})} className="flex-1 p-2 border rounded text-sm" placeholder="Usuario Instagram (sin @)" />
                                   </label>
                                   <label className="flex items-center gap-3">
                                       <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center"><span className="font-serif italic font-bold text-xs">Tk</span></div>
                                       <input type="text" value={socials.tiktok || ''} onChange={e => setSocials({...socials, tiktok: e.target.value})} className="flex-1 p-2 border rounded text-sm" placeholder="Usuario TikTok (sin @)" />
                                   </label>
                                   <label className="flex items-center gap-3">
                                       <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center"><Facebook size={16}/></div>
                                       <input type="text" value={socials.facebook || ''} onChange={e => setSocials({...socials, facebook: e.target.value})} className="flex-1 p-2 border rounded text-sm" placeholder="Página Facebook" />
                                   </label>
                                   <label className="flex items-center gap-3">
                                       <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center"><Video size={16}/></div>
                                       <input type="text" value={socials.youtube || ''} onChange={e => setSocials({...socials, youtube: e.target.value})} className="flex-1 p-2 border rounded text-sm" placeholder="Canal YouTube" />
                                   </label>
                                   <label className="flex items-center gap-3">
                                       <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center"><ExternalLink size={16}/></div>
                                       <input
                                           type="text"
                                           value={shopForm.website || ''}
                                           onChange={e => setShopForm(prev => ({ ...prev, website: e.target.value }))}
                                           className="flex-1 p-2 border rounded text-sm"
                                           placeholder="https://tuweb.com"
                                       />
                                   </label>
                               </div>
                           </div>
                           <div className="flex justify-end pt-4">
                               <Button type="submit"><Save size={16} className="mr-2"/> Guardar Cambios</Button>
                           </div>
                      </form>
                  </div>
              </div>
          )}

          {/* TAB 3: MIS VIVOS (KEEP EXISTING) */}
          {activeTab === 'VIVOS' && (
              <div className="max-w-6xl space-y-6 animate-in fade-in">
                  <header className="flex justify-between items-end">
                      <div>
                          <h1 className="font-serif text-3xl text-dm-dark">Mis Vivos</h1>
                          <p className="text-gray-500 text-sm mt-1">Gestiona tu agenda y monitorea el rendimiento.</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                           <div className="relative group">
                                <Button 
                                    onClick={handleCreateClick} 
                                    disabled={!canSchedule}
                                    className={!canSchedule ? 'opacity-50 cursor-not-allowed bg-gray-400' : ''}
                                >
                                    <Plus size={18} className="mr-2" /> Agendar Vivo
                                </Button>
                                {!canSchedule && (
                                    <div className="absolute right-0 bottom-full mb-2 w-64 bg-black text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                        {getRestrictionMessage()}
                                    </div>
                                )}
                           </div>
                           <p className="text-[10px] text-gray-400">Cupos Disponibles: {availableQuota}</p>
                      </div>
                  </header>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <table className="w-full text-left">
                          <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-bold">
                              <tr>
                                  <th className="px-6 py-4">Información</th>
                                  <th className="px-6 py-4">Red Social</th>
                                  <th className="px-6 py-4">Estado</th>
                                  <th className="px-6 py-4">Calificación</th>
                                  <th className="px-6 py-4 text-right">Acciones</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                              {myStreams.length > 0 ? myStreams.map(stream => (
                                  <tr key={stream.id} className="hover:bg-gray-50/50 transition-colors">
                                      <td className="px-6 py-4">
                                          <div className="flex flex-col">
                                              <span className="font-bold text-dm-dark text-sm">{stream.title}</span>
                                              <span className="text-xs text-gray-500">
                                                  {new Date(stream.fullDateISO).toLocaleDateString()} - {stream.scheduledTime} hs
                                              </span>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                                             stream.platform === 'Instagram' ? 'border-pink-200 text-pink-600 bg-pink-50' : 
                                             stream.platform === 'TikTok' ? 'border-gray-800 text-gray-900 bg-gray-100' :
                                             'border-blue-200 text-blue-600 bg-blue-50'
                                          }`}>
                                             {stream.platform}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4">
                                           {stream.status === StreamStatus.LIVE ? (
                                               <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">EN VIVO</span>
                                           ) : stream.status === StreamStatus.UPCOMING ? (
                                               <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-full">PROGRAMADO</span>
                                           ) : stream.status === StreamStatus.MISSED ? (
                                               <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-full">NO REALIZADO</span>
                                           ) : stream.status === StreamStatus.CANCELLED ? (
                                               <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-full">CANCELADO</span>
                                           ) : stream.status === StreamStatus.BANNED ? (
                                               <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full">BLOQUEADO</span>
                                           ) : stream.status === StreamStatus.PENDING_REPROGRAMMATION ? (
                                               <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-full">REPROGRAMAR</span>
                                           ) : (
                                               <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-full">FINALIZADO</span>
                                           )}
                                      </td>
                                      <td className="px-6 py-4">
                                          <div className="flex items-center gap-1">
                                              <Star size={14} className={stream.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                                              <span className="text-sm font-bold text-gray-700">{stream.rating || '-'}</span>
                                              {stream.rating && <span className="text-xs text-gray-400">({Math.floor(Math.random() * 50) + 5})</span>}
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <div className="flex justify-end items-center gap-2">
                                              {stream.status === StreamStatus.LIVE && onExtendStream && stream.extensionCount < 3 && (
                                                  <Button 
                                                      size="sm" 
                                                      className="bg-green-500 hover:bg-green-600 text-white text-[10px] px-2 h-7"
                                                      onClick={() => onExtendStream(stream.id)}
                                                      title="Extender 30 minutos más"
                                                  >
                                                      <RefreshCw size={10} className="mr-1"/> Continuamos
                                                  </Button>
                                              )}
                                              {(stream.status === StreamStatus.UPCOMING || stream.status === StreamStatus.PENDING_REPROGRAMMATION) && (
                                                  <>
                                                    <button
                                                        onClick={() => openEditModal(stream)}
                                                        disabled={!canManageAgenda}
                                                        title={!canManageAgenda ? getRestrictionMessage() : 'Editar vivo'}
                                                        className={`p-1.5 rounded ${!canManageAgenda ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (!canManageAgenda) return;
                                                            if (window.confirm('Cancelar este vivo?')) onStreamDelete(stream.id);
                                                        }}
                                                        disabled={!canManageAgenda}
                                                        title={!canManageAgenda ? getRestrictionMessage() : 'Cancelar vivo'}
                                                        className={`p-1.5 rounded ${!canManageAgenda ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
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
                                      <td colSpan={5} className="p-8 text-center text-gray-400 text-sm">No has creado ningún vivo aún.</td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* TAB 4: PERFIL (KEEP EXISTING) */}
          {activeTab === 'PERFIL' && (
              <div className="max-w-3xl space-y-8 animate-in fade-in">
                  <header>
                      <h1 className="font-serif text-3xl text-dm-dark">Datos de Tienda</h1>
                      <p className="text-gray-500 text-sm mt-1">Información legal, ubicación y condiciones de venta.</p>
                  </header>
                  <form onSubmit={saveShopProfile} className="space-y-8">
                      <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                          <h3 className="font-bold text-dm-dark flex items-center gap-2 border-b pb-2"><Store size={18}/> Identidad & Legal</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <label className="block">
                                  <span className="text-xs font-bold text-gray-500">Nombre de Fantasía</span>
                                  <input type="text" value={shopForm.name || ''} onChange={e => handleInputChange('name', e.target.value)} className="w-full mt-1 p-2 border border-gray-200 rounded text-sm bg-gray-50" />
                              </label>
                              <label className="block">
                                  <span className="text-xs font-bold text-gray-500">Razón Social</span>
                                  <input type="text" value={shopForm.razonSocial || ''} onChange={e => handleInputChange('razonSocial', e.target.value)} className="w-full mt-1 p-2 border border-gray-200 rounded text-sm" />
                              </label>
                              <label className="block">
                                  <span className="text-xs font-bold text-gray-500">CUIT</span>
                                  <input type="text" value={shopForm.cuit || ''} onChange={e => handleInputChange('cuit', e.target.value)} className="w-full mt-1 p-2 border border-gray-200 rounded text-sm" />
                              </label>
                          </div>
                      </section>
                      <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                          <h3 className="font-bold text-dm-dark flex items-center gap-2 border-b pb-2"><MapPin size={18}/> Dirección Física</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="md:col-span-3 mb-2 relative">
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Buscador (Google Maps Simulado)</label>
                                  <AddressAutocomplete onSelect={handleAddressSelect} />
                              </div>
                              <label className="block md:col-span-2">
                                  <span className="text-xs font-bold text-gray-500">Calle</span>
                                  <input type="text" value={shopForm.addressDetails?.street || ''} onChange={e => handleAddressChange('street', e.target.value)} className="w-full mt-1 p-2 border border-gray-200 rounded text-sm" />
                              </label>
                              <label className="block">
                                  <span className="text-xs font-bold text-gray-500">Número</span>
                                  <input type="text" value={shopForm.addressDetails?.number || ''} onChange={e => handleAddressChange('number', e.target.value)} className="w-full mt-1 p-2 border border-gray-200 rounded text-sm" />
                              </label>
                              <label className="block">
                                  <span className="text-xs font-bold text-gray-500">Localidad / Barrio</span>
                                  <input type="text" value={shopForm.addressDetails?.city || ''} onChange={e => handleAddressChange('city', e.target.value)} className="w-full mt-1 p-2 border border-gray-200 rounded text-sm" />
                              </label>
                              <label className="block">
                                  <span className="text-xs font-bold text-gray-500">Provincia</span>
                                  <input type="text" value={shopForm.addressDetails?.province || ''} onChange={e => handleAddressChange('province', e.target.value)} className="w-full mt-1 p-2 border border-gray-200 rounded text-sm" />
                              </label>
                              <label className="block">
                                  <span className="text-xs font-bold text-gray-500">CP</span>
                                  <input type="text" value={shopForm.addressDetails?.zip || ''} onChange={e => handleAddressChange('zip', e.target.value)} className="w-full mt-1 p-2 border border-gray-200 rounded text-sm" />
                              </label>
                              <label className="block md:col-span-3">
                                  <span className="text-xs font-bold text-gray-500">Link Google Maps</span>
                                  <input
                                      type="text"
                                      value={shopForm.addressDetails?.mapsUrl || ''}
                                      onChange={e => handleAddressChange('mapsUrl', e.target.value)}
                                      className="w-full mt-1 p-2 border border-gray-200 rounded text-sm"
                                      placeholder="https://maps.google.com/..."
                                  />
                              </label>
                          </div>
                      </section>
                      <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                          <h3 className="font-bold text-dm-dark flex items-center gap-2 border-b pb-2"><CreditCard size={18}/> Condiciones de Venta</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                  <label className="block mb-2">
                                      <span className="text-xs font-bold text-gray-500">Monto Mínimo de Compra ($)</span>
                                      <div className="relative mt-1">
                                          <span className="absolute left-3 top-2 text-gray-500">$</span>
                                          <input type="number" value={shopForm.minimumPurchase || ''} onChange={e => handleInputChange('minimumPurchase', parseInt(e.target.value))} className="w-full pl-6 p-2 border border-gray-200 rounded text-sm" />
                                      </div>
                                  </label>
                              </div>
                              <div>
                                  <label className="block mb-2">
                                      <span className="text-xs font-bold text-gray-500">Formas de Pago Aceptadas</span>
                                  </label>
                                  <div className="grid grid-cols-2 gap-2">
                                      {PAYMENT_OPTIONS.map(method => (
                                          <label key={method} className="flex items-center space-x-2 text-sm cursor-pointer">
                                              <input 
                                                type="checkbox" 
                                                checked={(shopForm.paymentMethods || []).includes(method)}
                                                onChange={() => togglePaymentMethod(method)}
                                                className="rounded border-gray-300 text-dm-crimson focus:ring-dm-crimson"
                                              />
                                              <span>{method}</span>
                                          </label>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      </section>
                      <div className="flex justify-end pt-4">
                          <Button type="submit"><Save size={16} className="mr-2"/> Guardar Perfil</Button>
                      </div>
                  </form>
              </div>
          )}

      </main>

      {/* MODAL: BUY QUOTA */}
      {showBuyModal && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 relative animate-in zoom-in-95">
                  <button onClick={() => setShowBuyModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-dm-dark"><X size={20}/></button>
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <DollarSign size={32} />
                      </div>
                      <h2 className="font-serif text-2xl text-dm-dark">Comprar Cupo Extra</h2>
                      <p className="text-sm text-gray-500 mt-2">Agrega un vivo adicional a tu agenda semanal.</p>
                  </div>
                  
                  <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex justify-between items-center">
                          <span className="font-bold text-dm-dark">1 Cupo de Vivo</span>
                          <span className="font-bold text-green-600">$5.000</span>
                      </div>
                      <Button className="w-full bg-green-600 hover:bg-green-700 border-none text-white" onClick={handleBuyConfirm}>
                          Confirmar Compra
                      </Button>
                      <p className="text-[10px] text-center text-gray-400">Pago seguro procesado por Mercado Pago</p>
                  </div>
              </div>
           </div>
      )}

      {/* MODAL: CREATE STREAM */}
      {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="font-serif text-2xl text-dm-dark">
                          {editingStream ? 'Editar Vivo' : 'Agendar Nuevo Vivo'}
                      </h2>
                      <button onClick={() => setShowCreateModal(false)}><X size={20}/></button>
                  </div>
                  
                  {!editingStream && (
                      <div className="bg-blue-50 text-blue-700 text-xs p-3 rounded mb-4 flex items-center gap-2">
                          <Info size={14}/> 
                          Consumirá 1 cupo de tu saldo (Disp: {availableQuota})
                      </div>
                  )}

                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Título del Vivo</label>
                          <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="w-full p-2 border rounded-md text-sm" placeholder="Ej: Nueva Temporada..." />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Fecha</label>
                              <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full p-2 border rounded-md text-sm" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Hora</label>
                              <input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} className="w-full p-2 border rounded-md text-sm" />
                          </div>
                      </div>
                      
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Plataforma</label>
                          <select value={formPlatform} onChange={(e) => setFormPlatform(e.target.value as SocialPlatform)} className="w-full p-2 border rounded-md text-sm bg-white">
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
                      
                      <div className="pt-4">
                          <Button type="button" onClick={handleConfirmStream} className="w-full">
                              {editingStream ? 'Guardar Cambios' : 'Confirmar Agenda'}
                          </Button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}
