import React, { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Shop, Stream, StreamStatus, UserContext } from "../types";
import { StreamCard } from "./StreamCard";
import styles from "./LiveQueueModal.module.css";

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
  onRequireLogin?: () => void;
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
  onRequireLogin,
  onLike,
  onRate,
  onDownloadCard,
  onNotify,
}) => {
  const listRef = useRef<HTMLDivElement | null>(null);
  const isScrollingRef = useRef(false);
  const touchStartRef = useRef<number | null>(null);
  const touchDeltaRef = useRef(0);
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
      if (isScrollingRef.current) return;
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
    setActiveIndex(bounded);
    list.scrollTo({ top: bounded * list.clientHeight, behavior });
    if (scrollTimerRef.current) {
      window.clearTimeout(scrollTimerRef.current);
    }
    isScrollingRef.current = true;
    scrollTimerRef.current = window.setTimeout(() => {
      isScrollingRef.current = false;
    }, 400);
  };

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const onWheel = (event: WheelEvent) => {
      if (isScrollingRef.current) return;
      const direction = event.deltaY > 0 ? -1 : 1;
      if (!direction) return;
      event.preventDefault();
      scrollToIndex(activeIndex + direction);
    };
    const onTouchStartNative = (event: TouchEvent) => {
      touchStartRef.current = event.touches[0]?.clientY ?? null;
      touchDeltaRef.current = 0;
    };
    const onTouchMoveNative = (event: TouchEvent) => {
      if (touchStartRef.current === null) return;
      const currentY = event.touches[0]?.clientY ?? touchStartRef.current;
      touchDeltaRef.current = touchStartRef.current - currentY;
      event.preventDefault();
    };
    const onTouchEndNative = () => {
      if (touchStartRef.current === null || isScrollingRef.current) {
        touchStartRef.current = null;
        touchDeltaRef.current = 0;
        return;
      }
      const delta = touchDeltaRef.current;
      touchStartRef.current = null;
      touchDeltaRef.current = 0;
      if (Math.abs(delta) < 40) return;
      const direction = delta > 0 ? 1 : -1;
      scrollToIndex(activeIndex + direction);
    };
    list.addEventListener("wheel", onWheel, { passive: false });
    list.addEventListener("touchstart", onTouchStartNative, { passive: true });
    list.addEventListener("touchmove", onTouchMoveNative, { passive: false });
    list.addEventListener("touchend", onTouchEndNative, { passive: true });
    return () => {
      list.removeEventListener("wheel", onWheel);
      list.removeEventListener("touchstart", onTouchStartNative);
      list.removeEventListener("touchmove", onTouchMoveNative);
      list.removeEventListener("touchend", onTouchEndNative);
    };
  }, [activeIndex, streams.length]);

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
        >
          {streams.map((stream) => (
            <div key={stream.id} className={styles.slide}>
              <div className={styles.slideInner}>
                <StreamCard
                  stream={stream}
                  user={user}
                  canClientInteract={canClientInteract}
                  onNotify={onNotify}
                  onRequireLogin={onRequireLogin}
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
