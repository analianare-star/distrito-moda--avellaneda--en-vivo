import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, X } from "lucide-react";
import { Shop, Stream, StreamStatus, UserContext } from "../types";
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
  onOpenShop: (shop: Shop, options?: { navigate?: boolean }) => void;
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
  const isScrollingRef = useRef(false);
  const touchStartRef = useRef<number | null>(null);
  const scrollTimerRef = useRef<number | null>(null);
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

  const scrollToIndex = (nextIndex: number, behavior: ScrollBehavior = "smooth") => {
    const list = listRef.current;
    if (!list) return;
    const bounded = Math.max(0, Math.min(nextIndex, streams.length - 1));
    list.scrollTo({ top: bounded * list.clientHeight, behavior });
    if (scrollTimerRef.current) {
      window.clearTimeout(scrollTimerRef.current);
    }
    isScrollingRef.current = true;
    scrollTimerRef.current = window.setTimeout(() => {
      isScrollingRef.current = false;
    }, 400);
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (isScrollingRef.current) return;
    const direction = event.deltaY > 0 ? 1 : -1;
    if (!direction) return;
    scrollToIndex(activeIndex + direction);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartRef.current === null) return;
    event.preventDefault();
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartRef.current === null || isScrollingRef.current) {
      touchStartRef.current = null;
      return;
    }
    const endY = event.changedTouches[0]?.clientY ?? touchStartRef.current;
    const delta = touchStartRef.current - endY;
    touchStartRef.current = null;
    if (Math.abs(delta) < 30) return;
    const direction = delta > 0 ? 1 : -1;
    scrollToIndex(activeIndex + direction);
  };

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
        <div
          ref={listRef}
          className={styles.scroller}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
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
                  onOpenShop={() => onOpenShop(stream.shop, { navigate: false })}
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
