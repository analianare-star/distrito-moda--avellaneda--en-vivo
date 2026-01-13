import React, { useRef, useState } from 'react';
import { Shop, Stream, StreamStatus } from '../types';
import { Instagram, Globe, Download, Phone, MapPin, ShoppingBag, Video, CreditCard, Banknote, CalendarDays } from 'lucide-react';
import { Button } from './Button';
import { LogoBubble } from './LogoBubble';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

// ShareableCard builds the downloadable shop profile card.
interface ShareableCardProps {
  shop: Shop;
  stream?: Stream; 
  mode: 'CLIENT' | 'MERCHANT'; 
  onNotify?: (title: string, message: string, tone?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const ShareableCard: React.FC<ShareableCardProps> = ({ shop, stream, mode, onNotify }) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // LOGIC: Formating Date
  const dateObj = stream ? new Date(stream.fullDateISO) : new Date();
  const timeStr = stream ? stream.scheduledTime : '--:--';
  
  // Format DD MMM
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase().replace('.', '');
  const dateStr = `${day} ${month}`;
  
  const isLive = stream?.status === StreamStatus.LIVE;
  const canAddCalendar = Boolean(stream && stream.status === StreamStatus.UPCOMING);

  // Extract Primary WhatsApp
  const primaryWa = shop.whatsappLines && shop.whatsappLines.length > 0 ? shop.whatsappLines[0] : null;

  const buildFallbackPdf = () => {
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: [360, 640] });
    doc.setFillColor(20, 20, 20);
    doc.rect(0, 0, 360, 640, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(shop.name || 'Tienda', 24, 60);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(mode === 'MERCHANT' ? 'PROXIMO VIVO' : 'TE ESPERAMOS', 24, 80);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${timeStr} hs`, 24, 120);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(dateStr, 24, 140);
    doc.setFontSize(10);
    doc.text(`Minimo de compra: $${shop.minimumPurchase?.toLocaleString() || '-'}`, 24, 180);
    doc.text(`Pagos: ${(shop.paymentMethods || []).slice(0, 3).join(', ') || '-'}`, 24, 200);
    if (primaryWa) {
      doc.text(`WhatsApp: ${primaryWa.number}`, 24, 230);
    }
    if (shop.socialHandles?.instagram) {
      doc.text(`Instagram: @${shop.socialHandles.instagram}`, 24, 250);
    }
    if (shop.website) {
      doc.text(`Web: ${shop.website.replace('https://', '')}`, 24, 270);
    }
    if (shop.address) {
      doc.text(`Direccion: ${shop.address}`, 24, 300, { maxWidth: 312 });
    }
    doc.setFontSize(9);
    doc.setTextColor(180, 180, 180);
    doc.text('Distrito Moda - Avellaneda en Vivo', 24, 600);
    return doc;
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    if (isDownloading) return;
    setIsDownloading(true);
    const safeName = shop.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-');
    const downloadPng = (dataUrl: string) => {
      const link = document.createElement('a');
      link.download = `tarjeta-${safeName || 'tienda'}.png`;
      link.href = dataUrl;
      link.click();
    };
    try {
      const rect = cardRef.current.getBoundingClientRect();
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        useCORS: true,
      });
      try {
        const pdf = new jsPDF({
          orientation: rect.width > rect.height ? 'l' : 'p',
          unit: 'px',
          format: [rect.width, rect.height],
        });
        pdf.addImage(dataUrl, 'PNG', 0, 0, rect.width, rect.height);
        pdf.save(`tarjeta-${safeName || 'tienda'}.pdf`);
        onNotify?.('Tarjeta descargada', 'El PDF se guardó en tu dispositivo.', 'success');
      } catch (_pdfError) {
        downloadPng(dataUrl);
        onNotify?.('Tarjeta descargada', 'Se guardó la imagen PNG de la tarjeta.', 'success');
      }
    } catch (_error) {
      try {
        const fallback = buildFallbackPdf();
        fallback.save(`tarjeta-${safeName || 'tienda'}.pdf`);
        onNotify?.('Tarjeta descargada', 'Se generó un PDF simplificado.', 'success');
      } catch (_fallbackError) {
        onNotify?.('No se pudo descargar', 'Intenta nuevamente en unos segundos.', 'error');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const formatIcsDate = (date: Date) => {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
  };

  const handleAddCalendar = () => {
    if (!stream) return;
    if (!canAddCalendar) {
      onNotify?.('Recordatorio no disponible', 'Solo podes agendar vivos programados.', 'warning');
      return;
    }
    const start = new Date(stream.fullDateISO);
    if (stream.scheduledTime) {
      const [hours, minutes] = stream.scheduledTime.split(':').map(Number);
      start.setHours(hours || 0, minutes || 0, 0, 0);
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const safeName = shop.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-');
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Avellaneda en Vivo//ES',
      'BEGIN:VEVENT',
      `UID:${stream.id || safeName}@avellaneda-en-vivo`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(start)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:Vivo ${shop.name}`,
      `DESCRIPTION:${stream.title || 'Vivo en Avellaneda en Vivo'}`,
      `LOCATION:${shop.address || ''}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recordatorio-${safeName || 'tienda'}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    onNotify?.('Recordatorio listo', 'Se descargó un archivo para agregarlo a tu calendario.', 'success');
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* The Visual Card Container */}
      <div 
        id="downloadable-card" 
        ref={cardRef}
        className="relative w-[300px] h-[580px] bg-dm-dark shadow-2xl flex flex-col overflow-hidden border border-gray-800"
      >
        
        {/* Decorative Top Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-dm-crimson z-20"></div>

        {/* --- HEADER --- */}
        <div className="relative z-10 pt-8 pb-4 flex flex-col items-center bg-gradient-to-b from-black/40 to-transparent">
            <LogoBubble
              src={shop.logoUrl}
              alt={shop.name}
              size={88}
              seed={shop.id || shop.name}
              className="mb-3"
            />
            <h2 className="font-serif text-[20px] md:text-2xl text-white leading-tight text-center px-4">
              {shop.name}
            </h2>
            <p className="font-sans text-dm-light text-xs tracking-[0.2em] uppercase mt-2 text-center px-6">
                {stream?.title || 'Distrito Moda'}
            </p>
        </div>

        {/* --- CENTER: DATE & TIME (MANDATORY) --- */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 -mt-6">
            {/* Context Badge */}
            <div className="mb-6">
                <span className={`inline-block px-3 py-1 border text-xs font-sans tracking-widest uppercase backdrop-blur-md ${isLive ? 'border-dm-crimson text-dm-crimson bg-black/40' : 'border-white/50 text-white bg-white/10'}`}>
                    {isLive ? 'EN VIVO' : mode === 'MERCHANT' ? 'PRÓXIMO VIVO' : 'TE ESPERAMOS'}
                </span>
            </div>

            {/* Time Display */}
            <div className="flex flex-col items-center gap-1 mb-6">
                <div className="text-6xl font-serif text-white leading-none">{timeStr} <span className="text-2xl">hs</span></div>
                <div className="text-xl font-sans text-dm-light uppercase tracking-widest border-t border-white/20 pt-2 w-full text-center">
                    {dateStr}
                </div>
            </div>

            {stream && (
                <div className="flex items-center gap-2 text-white/80 text-xs font-sans uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full">
                    {stream.platform === 'Instagram' && <Instagram size={12} />}
                    {stream.platform === 'TikTok' && <span className="font-serif italic font-bold">Tk</span>}
                    {stream.platform === 'Facebook' && <span className="font-bold">Fb</span>}
                    {stream.platform === 'YouTube' && <Video size={12} />}
                    <span>{stream.platform}</span>
                </div>
            )}
        </div>

        {/* --- PAYMENT & MIN INFO (REQ-07) --- */}
        <div className="relative z-10 px-6 py-3 border-t border-white/10 bg-black/20">
            <div className="flex justify-between items-center text-white/90 mb-1">
                 <span className="text-[10px] uppercase tracking-wider opacity-70">Mínimo de Compra</span>
                 <span className="font-bold text-xs">${shop.minimumPurchase?.toLocaleString() || '-'}</span>
            </div>
            <div className="flex justify-between items-start text-white/90">
                 <span className="text-[10px] uppercase tracking-wider opacity-70">Pagos</span>
                 <span className="font-bold text-[10px] text-right max-w-[150px] leading-tight">
                     {shop.paymentMethods?.slice(0, 3).join(', ') || '-'}
                 </span>
            </div>
        </div>

        {/* --- FOOTER: MODE SPECIFIC --- */}
        <div className="relative z-10 bg-black/30 backdrop-blur-sm p-5 w-full">
            {mode === 'CLIENT' ? (
                // CLIENT MODE: Interactive Contact Links (Visual representation only for image, but conceptually links)
                <div className="space-y-2">
                    {primaryWa && (
                        <div className="flex items-center gap-3 text-white">
                            <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                                <Phone size={10} className="text-white fill-current" />
                            </div>
                            <span className="text-[10px] font-sans tracking-wide truncate">WA: {primaryWa.number}</span>
                        </div>
                    )}
                    {shop.socialHandles.instagram && (
                        <div className="flex items-center gap-3 text-white">
                             <div className="w-5 h-5 rounded-full bg-pink-600 flex items-center justify-center shrink-0">
                                <Instagram size={10} className="text-white" />
                            </div>
                            <span className="text-[10px] font-sans tracking-wide truncate">@{shop.socialHandles.instagram}</span>
                        </div>
                    )}
                    {shop.website && (
                        <div className="flex items-center gap-3 text-white">
                             <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                                <Globe size={10} className="text-white" />
                            </div>
                            <span className="text-[10px] font-sans tracking-wide truncate">{shop.website.replace('https://', '')}</span>
                        </div>
                    )}
                    {shop.address && (
                        <div className="flex items-center gap-3 text-white/70 pt-2 border-t border-white/10 mt-1">
                             <MapPin size={10} />
                             <span className="text-[9px] font-sans uppercase tracking-wider truncate">{shop.address}</span>
                        </div>
                    )}
                </div>
            ) : (
                // MERCHANT MODE: Branding Only (No links)
                <div className="flex flex-col items-center justify-center py-1">
                     <div className="flex items-center gap-4 text-white opacity-60 mb-1">
                        <Instagram size={16} />
                        <span className="w-px h-3 bg-white/40"></span>
                        <ShoppingBag size={16} />
                    </div>
                    <p className="font-serif text-white/40 text-xs italic">Avellaneda en Vivo</p>
                </div>
            )}
        </div>
      </div>

      <div className="flex w-full items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          <Download size={16} className="mr-2" />
          {isDownloading ? 'Generando...' : mode === 'CLIENT' ? 'Guardar Tarjeta (PDF)' : 'Descargar PDF'}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleAddCalendar}
          disabled={!stream}
          aria-label="Guardar recordatorio"
          title={canAddCalendar ? 'Guardar recordatorio' : 'Solo disponibles para vivos programados'}
        >
          <CalendarDays size={16} />
        </Button>
      </div>
    </div>
  );
};
