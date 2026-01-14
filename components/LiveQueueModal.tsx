import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, X } from "lucide-react";
import { Stream, StreamStatus, UserContext } from "../types";
import { StreamCard } from "./StreamCard";
import styles from "./LiveQueueModal.module.css";

const formatUpcomingLabel = (stream: Stream) => {
  const date = new Date(stream.fullDateISO);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month} ${stream.scheduledTime}`;
};

// LiveQueueModal shows a vertical feed of live/upcoming streams.
// LiveQueueModal muestra un feed vertical de vivos y próximos.
interface LiveQueueModalProps {
  streams: Stream[];
  activeStreamId: string;
  user: UserContext;
  canClientInteract: boolean;
  onClose: () => void;
  onOpenShop: (stream: Stream) => void;
  onReport: (streamId: string) => void;
  onToggleReminder: (streamId: string) => void;
  onLike?: (streamId: string) => void;
  onRate?: (streamId: string, rating: number) => void;
  onDownloadCard?: (stream: Stream) => void;
  onNotify?: (title: string, message: string, tone?: "info" | "success" | "warning" | "error") => void;
}

export const LiveQueueModal: React.FC<LiveQueueModalProps> = ({
  streams,
  activeStreamId,
  user,
  canClientInteract,
  onClose,
  onOpenShop,
  onReport,
  onToggleReminder,
  onLike,
  onRate,
  onDownloadCard,
  onNotify,
}) => {
  const listRef = useRef<HTMLDivElement | null>(null);
  const initialIndex = useMemo(
    () => Math.max(0, streams.findIndex((item) => item.id === activeStreamId)),
    [activeStreamId, streams]
  );
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const offset = list.clientHeight * initialIndex;
    list.scrollTo({ top: offset, behavior: "auto" });
  }, [initialIndex]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const nextIndex = Math.round(list.scrollTop / list.clientHeight);
        if (nextIndex !== activeIndex) {
          setActiveIndex(nextIndex);
        }
      });
    };
    list.addEventListener("scroll", onScroll);
    return () => {
      list.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [activeIndex]);

  useEffect(() => {
    const current = streams[activeIndex];
    if (!current || current.status !== StreamStatus.UPCOMING) return;
    const list = listRef.current;
    if (!list) return;
    const timer = window.setTimeout(() => {
      const nextIndex = Math.min(activeIndex + 1, streams.length - 1);
      if (nextIndex === activeIndex) return;
      list.scrollTo({ top: nextIndex * list.clientHeight, behavior: "smooth" });
    }, 7000);
    return () => window.clearTimeout(timer);
  }, [activeIndex, streams]);

  return (
    <div className={styles.overlay}>
      <button className={styles.closeButton} onClick={onClose} aria-label="Cerrar">
        <X size={28} />
      </button>
      <div className={styles.modal}>
        <div ref={listRef} className={styles.scroller}>
          {streams.map((stream) => (
            <div key={stream.id} className={styles.slide}>
              <div className={styles.slideInner}>
                {stream.status === StreamStatus.UPCOMING && (
                  <div className={styles.upcomingMeta}>
                    <span className={styles.upcomingLabel}>
                      Próximamente {formatUpcomingLabel(stream)}
                    </span>
                    <button
                      type="button"
                      className={styles.calendarButton}
                      onClick={() => onToggleReminder(stream.id)}
                      aria-label="Agendar recordatorio"
                    >
                      <Calendar size={16} />
                    </button>
                  </div>
                )}
                <StreamCard
                  stream={stream}
                  user={user}
                  canClientInteract={canClientInteract}
                  onNotify={onNotify}
                  onOpenShop={() => onOpenShop(stream)}
                  onReport={onReport}
                  onToggleReminder={onToggleReminder}
                  onLike={onLike}
                  onRate={onRate}
                  onDownloadCard={onDownloadCard}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
