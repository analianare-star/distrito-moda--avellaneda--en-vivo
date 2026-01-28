import React, { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Shop, Stream, StreamStatus, UserContext } from "../types";
import { StreamCard } from "./StreamCard";
import styles from "./LiveQueueScreen.module.css";

// LiveQueueScreen renders a fullscreen, snap-scrolling live feed.
interface LiveQueueScreenProps {
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

export const LiveQueueScreen: React.FC<LiveQueueScreenProps> = ({
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
      <div ref={listRef} className={styles.scroller}>
        {streams.map((stream) => (
          <section key={stream.id} className={styles.slide}>
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
          </section>
        ))}
      </div>
    </div>
  );
};
