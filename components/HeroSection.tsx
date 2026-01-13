import React, { useState, useEffect } from 'react';
import { Stream, StreamStatus, Reel } from '../types';
import { FILTERS } from '../constants';
import { Button } from './Button';
import { LogoBubble } from './LogoBubble';
import { PlayCircle, Users, ChevronLeft, ChevronRight, Plus, Sparkles } from 'lucide-react';
import styles from './HeroSection.module.css';

// HeroSection renders the featured live carousel and filter controls.

interface HeroSectionProps {
    activeFilter: string;
    onFilterChange: (filter: string) => void;
    liveStreams: Stream[]; 
    activeReels: Reel[]; 
    onViewReel: (reel: Reel) => void; 
    viewedReels: string[];
    onOpenShop: (shop: Stream['shop']) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ 
    activeFilter, 
    onFilterChange, 
    liveStreams,
    activeReels,
    onViewReel,
    viewedReels,
    onOpenShop
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const sortedReels = [...activeReels].sort((a, b) => {
      const aSeen = viewedReels.includes(a.id);
      const bSeen = viewedReels.includes(b.id);
      if (aSeen === bSeen) {
          // Both seen or both unseen, sort by newest
          return new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime();
      }
      return aSeen ? 1 : -1; // Unseen first
  });

  // Reset index if the list of live streams changes
  useEffect(() => {
    if (currentIndex >= liveStreams.length) {
        setCurrentIndex(0);
    }
  }, [liveStreams.length]);

  const hasLive = liveStreams.length > 0;
  const activeStream = hasLive ? liveStreams[currentIndex] : null;

  const nextSlide = () => {
      setCurrentIndex((prev) => (prev + 1) % liveStreams.length);
  };

  const prevSlide = () => {
      setCurrentIndex((prev) => (prev - 1 + liveStreams.length) % liveStreams.length);
  };

  return (
    <div className={styles.root}>
      
      {/* --- STORIES / REELS CAROUSEL --- */}
      {sortedReels.length > 0 && (
          <div className={styles.reelsWrap}>
              <div className={styles.reelsHeader}>
                  <div className={styles.reelsIcon}>
                    <Sparkles size={16} className="fill-current" />
                  </div>
                  <h2 className={styles.reelsTitle}>
                      NOVEDADES & HISTORIAS
                  </h2>
              </div>

              <div className={styles.reelsScroller}>
                  <div className={styles.reelsRow}>
                      {sortedReels.map(reel => {
                          const isSeen = viewedReels.includes(reel.id);
                          return (
                              <div 
                                key={reel.id} 
                                className={`${styles.reelCard} group`}
                                onClick={() => onViewReel(reel)}
                              >
                                  <div className={`${styles.reelRing} ${isSeen ? styles.reelRingSeen : styles.reelRingNew}`}>
                                      <div className={styles.reelImageWrap}>
                                          <img 
                                            src={reel.shopLogo} 
                                            alt={reel.shopName} 
                                            loading="lazy"
                                            decoding="async"
                                            className={`${styles.reelImage} ${isSeen ? styles.reelImageSeen : styles.reelImageNew}`} 
                                          />
                                      </div>
                                  </div>
                                  <span className={`${styles.reelName} ${isSeen ? styles.reelNameSeen : styles.reelNameNew}`}>
                                      {reel.shopName}
                                  </span>
                                  <span className={styles.reelViews}>{reel.views || 0} vistas</span>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      )}

      {/* FEATURED LIVE SECTION (CAROUSEL) */}
      {activeStream && (
          <div className={styles.liveWrap}>
              
              {/* Dynamic Background Blur */}
              <div key={activeStream.id + '-bg'} className={styles.liveBackdrop}>
                  <img src={activeStream.coverImage} className={styles.liveBackdropImage} alt={activeStream.title} />
                  <div className={styles.liveBackdropOverlay}></div>
              </div>
              
              <div className={styles.liveContent}>
                  
                  {/* PREV BUTTON (Only if multiple) */}
                  {liveStreams.length > 1 && (
                      <button 
                        onClick={prevSlide}
                        className={styles.liveNavButton}
                        aria-label="Anterior"
                      >
                          <ChevronLeft size={32} />
                      </button>
                  )}

                  {/* CONTENT WRAPPER */}
                  <div className={styles.liveStack} key={activeStream.id}>
                      
                      {/* Video/Image Container */}
                      <div className={`${styles.liveMedia} group`} onClick={() => window.open(activeStream.url, '_blank')}>
                          <img src={activeStream.coverImage} alt={activeStream.title} className={styles.liveMediaImage}/>
                          
                          <div className={styles.liveMediaOverlay}>
                              <PlayCircle size={64} className="text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all drop-shadow-lg"/>
                          </div>
                          
                          <div className={styles.liveMediaBadgeRow}>
                              <span className={styles.liveBadge}>
                                  <span className={styles.liveBadgeDot}></span> EN VIVO AHORA
                              </span>
                              <span className={styles.liveBadgeViews}>
                                  <Users size={12}/> {activeStream.views}
                              </span>
                          </div>
                      </div>

                      {/* Info Container */}
                      <div className={styles.liveInfo}>
                          <div className={styles.liveShop}>
                              <LogoBubble
                                src={activeStream.shop.logoUrl}
                                alt={activeStream.shop.name}
                                size={56}
                                seed={activeStream.shop.id || activeStream.shop.name}
                              />
                              <div>
                                  <h3 className={styles.liveShopName}>{activeStream.shop.name}</h3>
                                  <p className={styles.liveShopTag}>Avellaneda en Vivo</p>
                              </div>
                          </div>
                          
                          <h1 className={styles.liveTitle}>
                              {activeStream.title}
                          </h1>
                          
                          <div className={styles.liveActions}>
                              <Button 
                                variant="primary" 
                                size="lg" 
                                className="bg-white text-dm-crimson hover:bg-gray-100 border-none font-bold shadow-lg shadow-white/10"
                                onClick={() => window.open(activeStream.url, '_blank')}
                              >
                                  Entrar al Vivo
                              </Button>
                              <Button
                                variant="outline"
                                className="border-white text-white hover:bg-white/10"
                                onClick={() => onOpenShop(activeStream.shop)}
                              >
                                  Ver Perfil
                              </Button>
                          </div>

                          {/* Mobile Navigation (Visible only on small screens) */}
                          {liveStreams.length > 1 && (
                              <div className={styles.liveMobileNav}>
                                  <button onClick={prevSlide} className={styles.liveMobileButton}><ChevronLeft/></button>
                                  <span className={styles.liveMobileCounter}>{currentIndex + 1} / {liveStreams.length}</span>
                                  <button onClick={nextSlide} className={styles.liveMobileButton}><ChevronRight/></button>
                              </div>
                          )}
                      </div>
                  </div>

                  {/* NEXT BUTTON (Only if multiple) */}
                  {liveStreams.length > 1 && (
                      <button 
                        onClick={nextSlide}
                        className={styles.liveNavButton}
                        aria-label="Siguiente"
                      >
                          <ChevronRight size={32} />
                      </button>
                  )}
              </div>

              {/* CAROUSEL INDICATORS (DOTS) */}
              {liveStreams.length > 1 && (
                  <div className={styles.liveIndicators}>
                      {liveStreams.map((_, idx) => (
                          <button
                              key={idx}
                              onClick={() => setCurrentIndex(idx)}
                              className={`${styles.liveDot} ${
                                  idx === currentIndex ? styles.liveDotActive : styles.liveDotInactive
                              }`}
                          />
                      ))}
                  </div>
              )}
          </div>
      )}

      {/* STANDARD BANNER (Only if no live) */}
      {!activeStream && (
        <div className={styles.banner}>
            <div className={styles.bannerBackdrop}>
                <img 
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop" 
                alt="Showroom Background" 
                className={styles.bannerImage}
                />
                <div className={styles.bannerOverlay}></div>
            </div>

            <div className={styles.bannerContent}>
                <span className={styles.bannerEyebrow}>DISTRITO MODA</span>
                <h1 className={styles.bannerTitle}>
                Avellaneda en Vivo
                </h1>
                <p className={styles.bannerText}>
                La pasarela digital mayorista más grande de la región.
                </p>
            </div>
        </div>
      )}

      {/* FILTERS BAR */}
      <div className={styles.filters}>
          <div className={styles.filtersInner}>
               <div className={styles.filtersRow}>
                    {FILTERS.map((filter) => (
                        <button
                        key={filter}
                        onClick={() => onFilterChange(filter)}
                        className={`${styles.filterButton} ${
                            activeFilter === filter
                            ? styles.filterActive
                            : styles.filterInactive
                        }`}
                        >
                        {filter}
                        </button>
                    ))}
               </div>
          </div>
      </div>
    </div>
  );
};
