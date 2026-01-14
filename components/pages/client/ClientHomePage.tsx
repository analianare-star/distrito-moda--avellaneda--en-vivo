import React, { useMemo, useState } from "react";
import { HeroSection } from "../../HeroSection";
import { StreamCard } from "../../StreamCard";
import { EmptyState } from "../../EmptyState";
import { Reel, Shop, Stream, StreamStatus, UserContext } from "../../../types";
import { LiveQueueModal } from "../../LiveQueueModal";
import { LogoBubble } from "../../LogoBubble";
import styles from "./ClientHomePage.module.css";

// ClientHomePage muestra home y agenda publica.
// ClientHomePage renders home and public agenda.
interface ClientHomePageProps {
  activeFilter: string;
  filteredStreams: Stream[];
  sortedLiveStreams: Stream[];
  activeReels: Reel[];
  featuredShops: Shop[];
  queueStreamsSource: Stream[];
  user: UserContext;
  canClientInteract: boolean;
  onFilterChange: (value: string) => void;
  onSelectBottomNav: (value: string) => void;
  onOpenShop: (shop: Shop) => void;
  onViewReel: (reel: Reel) => void;
  onReport: (stream: Stream) => void;
  onToggleReminder: (streamId: string) => void;
  onLike: (streamId: string) => void;
  onRate: (streamId: string, rating: number) => void;
  onDownloadCard: (stream: Stream) => void;
  onNotify: (title: string, message: string, tone?: "info" | "success" | "warning" | "error") => void;
}

export const ClientHomePage: React.FC<ClientHomePageProps> = ({
  activeFilter,
  filteredStreams,
  sortedLiveStreams,
  activeReels,
  featuredShops,
  queueStreamsSource,
  user,
  canClientInteract,
  onFilterChange,
  onSelectBottomNav,
  onOpenShop,
  onViewReel,
  onReport,
  onToggleReminder,
  onLike,
  onRate,
  onDownloadCard,
  onNotify,
}) => {
  const [queueStream, setQueueStream] = useState<Stream | null>(null);
  const visibleStreams = filteredStreams.slice(0, 6);
  const streamLayout = ["wide", "small", "small", "wide", "small", "small"];
  const isMockStream = (streamId: string) => streamId.startsWith("mock-stream-");
  const blockMockAction = () => {
    onNotify?.("Demo de prueba", "Estas historias son de prueba para diseño UI.", "info");
  };
  const queueStreams = useMemo(() => {
    const filtered = queueStreamsSource.filter(
      (stream) =>
        stream.isVisible &&
        stream.shop?.status === "ACTIVE" &&
        (stream.status === StreamStatus.LIVE ||
          stream.status === StreamStatus.UPCOMING)
    );
    const live = filtered.filter((stream) => stream.status === StreamStatus.LIVE);
    const upcoming = filtered
      .filter((stream) => stream.status === StreamStatus.UPCOMING)
      .sort(
        (a, b) =>
          new Date(a.fullDateISO).getTime() - new Date(b.fullDateISO).getTime()
      );
    return [...live, ...upcoming].slice(0, 10);
  }, [queueStreamsSource]);

  const formatUpcoming = () => "Próximamente";

  return (
    <section className={styles.section} aria-label="Contenido principal">
      <div className={styles.content}>
        {queueStreams.length > 0 && (
          <div className={styles.queueSection} aria-label="En vivo y próximos">
            <div className={styles.queueRow}>
              {queueStreams.map((stream) => {
                const isLive = stream.status === StreamStatus.LIVE;
                return (
                  <button
                    key={stream.id}
                    className={styles.queueCard}
                    onClick={() => setQueueStream(stream)}
                  >
                    <LogoBubble
                      src={stream.shop.logoUrl}
                      alt={stream.shop.name}
                      size={50}
                      seed={stream.shop.id || stream.shop.name}
                      className={styles.queueLogo}
                    />
                    <span className={styles.queueName}>{stream.shop.name}</span>
                    {isLive ? (
                      <span className={styles.queueLiveBadge}>
                        <span className={styles.queueRecDot} /> VIVO
                      </span>
                    ) : (
                      <span className={styles.queueUpcoming}>
                        {formatUpcoming()}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <HeroSection
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          liveStreams={sortedLiveStreams}
          activeReels={activeReels}
          featuredShops={featuredShops}
          onViewReel={onViewReel}
          viewedReels={user.viewedReels}
          onOpenShop={onOpenShop}
        />

        <div className={styles.schedule}>
          <div className={styles.scheduleHeader}>
            <h2 className={styles.scheduleTitle}>Vivos recientes</h2>
            <div className={styles.scheduleFilter}>
              Mostrando: <span className={styles.filterValue}>{activeFilter}</span>
            </div>
          </div>
          <div className={styles.streamsGrid}>
            {visibleStreams.map((stream, index) => {
              const layout = streamLayout[index] || "small";
              return (
                <div
                  key={stream.id}
                  className={`${styles.streamItem} ${
                    layout === "wide" ? styles.streamItemWide : ""
                  }`}
                >
                  <StreamCard
                    stream={stream}
                    user={user}
                    canClientInteract={canClientInteract}
                    onNotify={onNotify}
                    onOpenShop={() => onOpenShop(stream.shop)}
                    onReport={onReport}
                    onToggleReminder={onToggleReminder}
                    onLike={onLike}
                    onRate={onRate}
                    onDownloadCard={onDownloadCard}
                  />
                </div>
              );
            })}
            {visibleStreams.length === 0 && (
              <EmptyState
                title="No hay vivos con este filtro"
                message="Probá ver todos los vivos o revisá más tarde."
                actionLabel="Ver todos"
                onAction={() => {
                  onFilterChange("Todos");
                  onSelectBottomNav("home");
                }}
              />
            )}
          </div>
        </div>
      </div>

      {queueStream && (
        <LiveQueueModal
          streams={queueStreams}
          activeStreamId={queueStream.id}
          user={user}
          canClientInteract={canClientInteract}
          onClose={() => setQueueStream(null)}
          onOpenShop={onOpenShop}
          onReport={(streamId) => {
            if (isMockStream(streamId)) {
              blockMockAction();
              return;
            }
            onReport(streamId);
          }}
          onToggleReminder={(streamId) => {
            if (isMockStream(streamId)) {
              blockMockAction();
              return;
            }
            onToggleReminder(streamId);
          }}
          onLike={(streamId) => {
            if (isMockStream(streamId)) {
              blockMockAction();
              return;
            }
            onLike?.(streamId);
          }}
          onRate={(streamId, rating) => {
            if (isMockStream(streamId)) {
              blockMockAction();
              return;
            }
            onRate?.(streamId, rating);
          }}
          onDownloadCard={(stream) => {
            if (isMockStream(stream.id)) {
              blockMockAction();
              return;
            }
            onDownloadCard?.(stream);
          }}
          onNotify={onNotify}
        />
      )}
    </section>
  );
};
