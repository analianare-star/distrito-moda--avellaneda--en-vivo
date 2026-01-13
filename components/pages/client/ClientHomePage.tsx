import React from "react";
import { HeroSection } from "../../HeroSection";
import { StreamCard } from "../../StreamCard";
import { EmptyState } from "../../EmptyState";
import { Reel, Shop, Stream, UserContext } from "../../../types";
import styles from "./ClientHomePage.module.css";

// ClientHomePage muestra home y agenda publica.
// ClientHomePage renders home and public agenda.
interface ClientHomePageProps {
  activeFilter: string;
  filteredStreams: Stream[];
  sortedLiveStreams: Stream[];
  activeReels: Reel[];
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
  return (
    <section className={styles.section} aria-label="Contenido principal">
      <HeroSection
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
        liveStreams={sortedLiveStreams}
        activeReels={activeReels}
        onViewReel={onViewReel}
        viewedReels={user.viewedReels}
        onOpenShop={onOpenShop}
      />

      <div className={styles.schedule}>
        <div className={styles.scheduleHeader}>
          <h2 className={styles.scheduleTitle}>Agenda de Vivos</h2>
          <div className={styles.scheduleFilter}>
            Mostrando: <span className={styles.filterValue}>{activeFilter}</span>
          </div>
        </div>
        <div className={styles.streamsGrid}>
          {filteredStreams.map((stream) => (
            <StreamCard
              key={stream.id}
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
          ))}
          {filteredStreams.length === 0 && (
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
    </section>
  );
};
