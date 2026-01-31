import React, { useRef, useState } from 'react';
import { Shop, Stream } from '../types';
import { StreamStatus } from '../types';
import { Instagram, Globe, Download, Phone, MapPin, CalendarDays } from 'lucide-react';
import { Button } from './Button';
import { LogoBubble } from './LogoBubble';
import dmLogo from '../img/logo.svg';

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

  const canAddCalendar = Boolean(stream && stream.status === StreamStatus.UPCOMING);

  // Extract Primary WhatsApp
  const primaryWa = shop.whatsappLines && shop.whatsappLines.length > 0 ? shop.whatsappLines[0] : null;
  const catalogUrl = 'https://www.distritomoda.com.ar';

  const buildFallbackPdf = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: [360, 640] });
    doc.setFillColor(20, 20, 20);
    doc.rect(0, 0, 360, 640, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(shop.name || 'Tienda', 24, 60);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Tarjeta digital', 24, 80);
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
    doc.text(`Catalogo DM: distritomoda.com.ar`, 24, 290);
    if (shop.address) {
      doc.text(`Direccion: ${shop.address}`, 24, 320, { maxWidth: 312 });
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
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');
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
        const fallback = await buildFallbackPdf();
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
            <p className="font-sans text-dm-light text-[10px] tracking-[0.3em] uppercase mt-2 text-center px-6">
              Tarjeta digital
            </p>
        </div>

        {/* --- INFO --- */}
        <div className="flex-1 px-6 py-4 relative z-10 text-white space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/60">
              Mínimo de compra
            </div>
            <div className="text-lg font-bold">
              ${shop.minimumPurchase?.toLocaleString() || '-'}
            </div>
          </div>

          {shop.address && (
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="flex items-center gap-2 text-white/70 text-[10px] uppercase tracking-[0.2em]">
                <MapPin size={12} />
                Dirección
              </div>
              <div className="mt-2 text-[11px] font-semibold leading-snug">
                {shop.address}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 space-y-2">
            {primaryWa && (
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                <Phone size={12} />
                WhatsApp
                <span className="ml-auto text-[11px] font-bold tracking-normal text-white">
                  {primaryWa.number}
                </span>
              </div>
            )}
            {shop.socialHandles.instagram && (
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                <Instagram size={12} />
                Instagram
                <span className="ml-auto text-[11px] font-bold tracking-normal text-white">
                  @{shop.socialHandles.instagram}
                </span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 space-y-2">
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/60">Web de la marca</div>
            <div className="text-[11px] font-semibold truncate">
              {shop.website ? shop.website.replace('https://', '') : 'No disponible'}
            </div>
            <div className="pt-2 border-t border-white/10">
              <div className="text-[10px] uppercase tracking-[0.25em] text-white/60">Catálogo DM</div>
              <div className="text-[11px] font-semibold truncate">
                {catalogUrl.replace('https://', '')}
              </div>
            </div>
          </div>
        </div>

        {/* --- FOOTER: PALETTE + BRAND --- */}
        <div className="relative z-10 px-6 pb-5">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#ed1650] via-[#c1b5ab] to-[#6a5e56] p-3">
            <div className="flex items-center justify-center">
              <img src={dmLogo} alt="Distrito Moda" className="h-8 w-auto" />
            </div>
            <p className="mt-1 text-center text-[9px] font-semibold uppercase tracking-[0.3em] text-white/90">
              Avellaneda en vivo
            </p>
          </div>
          <div className="mt-2 flex gap-1">
            <span className="h-1 flex-1 rounded-full bg-[#ed1650]"></span>
            <span className="h-1 flex-1 rounded-full bg-[#c1b5ab]"></span>
            <span className="h-1 flex-1 rounded-full bg-[#6a5e56]"></span>
          </div>
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
