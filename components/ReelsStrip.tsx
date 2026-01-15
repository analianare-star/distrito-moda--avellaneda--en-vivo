import React from "react";
import { Reel } from "../types";
import heroStyles from "./HeroSection.module.css";

// ReelsStrip renders the reels carousel strip.
// ReelsStrip renderiza la tira/carrusel de reels.
interface ReelsStripProps {
  activeReels: Reel[];
  viewedReels: string[];
  onViewReel: (reel: Reel) => void;
}

export const ReelsStrip: React.FC<ReelsStripProps> = ({
  activeReels,
  viewedReels,
  onViewReel,
}) => {
  const sortedReels = [...activeReels].sort((a, b) => {
    const aSeen = viewedReels.includes(a.id);
    const bSeen = viewedReels.includes(b.id);
    if (aSeen === bSeen) {
      return new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime();
    }
    return aSeen ? 1 : -1;
  });

  return (
    <>
      {sortedReels.length > 0 && (
        <div className={heroStyles.reelsWrap}>
          <div className={heroStyles.reelsScroller}>
            <div className={heroStyles.reelsRow}>
              {sortedReels.map((reel) => {
                const isSeen = viewedReels.includes(reel.id);
                return (
                  <div
                    key={reel.id}
                    className={`${heroStyles.reelCard} group`}
                    onClick={() => onViewReel(reel)}
                  >
                    <div
                      className={`${heroStyles.reelRing} ${
                        isSeen ? heroStyles.reelRingSeen : heroStyles.reelRingNew
                      }`}
                    >
                      <div className={heroStyles.reelImageWrap}>
                        <img
                          src={reel.shopLogo}
                          alt={reel.shopName}
                          loading="lazy"
                          decoding="async"
                          className={`${heroStyles.reelImage} ${
                            isSeen ? heroStyles.reelImageSeen : heroStyles.reelImageNew
                          }`}
                        />
                      </div>
                    </div>
                    <span
                      className={`${heroStyles.reelName} ${
                        isSeen ? heroStyles.reelNameSeen : heroStyles.reelNameNew
                      }`}
                    >
                      {reel.shopName}
                    </span>
                    <span className={heroStyles.reelViews}>{reel.views || 0} vistas</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </>
  );
};
