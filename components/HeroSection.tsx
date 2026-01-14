import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Stream, Reel, Shop } from '../types';
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
    featuredShops: Shop[];
    onViewReel: (reel: Reel) => void; 
    viewedReels: string[];
    onOpenShop: (shop: Stream['shop']) => void;
    isLoggedIn: boolean;
    onOpenLogin: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ 
    activeFilter, 
    onFilterChange, 
    liveStreams,
    activeReels,
    featuredShops,
    onViewReel,
    viewedReels,
    onOpenShop,
    isLoggedIn,
    onOpenLogin
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const bannerMessages = useMemo(() => {
    const base = [
      { id: "verified", text: "+280 TIENDAS VERIFICADAS", duration: 4000 },
      { id: "daily", text: "NUEVOS VIVOS CADA DÍA", duration: 4000 },
      { id: "prices", text: "PRECIOS MAYORISTAS", duration: 4000 },
    ];
    if (!isLoggedIn) {
      base.push({ id: "register", text: "REGISTRATE AHORA", duration: 4000 });
    }
    base.push({
      id: "brand",
      text: "AVELLANEDA EN VIVO",
      duration: 8000,
      isBrand: true,
    });
    return base;
  }, [isLoggedIn]);
  const [bannerIndex, setBannerIndex] = useState(0);

  const showcasePool = useMemo(
    () =>
      featuredShops.filter(
        (shop) => (shop.coverUrl && shop.coverUrl.trim()) || shop.logoUrl
      ),
    [featuredShops]
  );
  const [showcaseShops, setShowcaseShops] = useState<Shop[]>([]);
  const lastShowcaseIdsRef = useRef<string[]>([]);
  const showcaseLayout = ["wide", "tall", "small", "small", "wide"];

  const pickRandomShops = (
    pool: Shop[],
    count: number,
    excludeIds: string[]
  ) => {
    if (pool.length === 0) return [];
    const filteredPool =
      excludeIds.length > 0
        ? pool.filter((shop) => !excludeIds.includes(shop.id))
        : pool;
    if (filteredPool.length >= count) {
      const shuffled = [...filteredPool];
      for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled.slice(0, count);
    }
    const shuffledAll = [...pool];
    for (let i = shuffledAll.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledAll[i], shuffledAll[j]] = [shuffledAll[j], shuffledAll[i]];
    }
    return shuffledAll.slice(0, count);
  };

  useEffect(() => {
    if (showcasePool.length === 0) {
      setShowcaseShops([]);
      return;
    }
    const initial = pickRandomShops(showcasePool, 5, lastShowcaseIdsRef.current);
    setShowcaseShops(initial);
    lastShowcaseIdsRef.current = initial.map((shop) => shop.id);
    const timer = setInterval(() => {
      const nextBatch = pickRandomShops(
        showcasePool,
        5,
        lastShowcaseIdsRef.current
      );
      setShowcaseShops(nextBatch);
      lastShowcaseIdsRef.current = nextBatch.map((shop) => shop.id);
    }, 7000);
    return () => clearInterval(timer);
  }, [showcasePool]);

  useEffect(() => {
    if (bannerMessages.length === 0) return;
    const current = bannerMessages[bannerIndex % bannerMessages.length];
    const timer = window.setTimeout(() => {
      setBannerIndex((prev) => (prev + 1) % bannerMessages.length);
    }, current.duration);
    return () => window.clearTimeout(timer);
  }, [bannerIndex, bannerMessages]);

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
      {showcaseShops.length > 0 && (
        <section className={styles.showcase}>
          <div className={styles.showcaseHeader}>
            <div>
              <p className={styles.showcaseEyebrow}>Novedades de tiendas</p>
              <h2 className={styles.showcaseTitle}>Explorá Avellaneda en Vivo</h2>
            </div>
            <button
              className={styles.showcaseAction}
              onClick={() => onFilterChange("Todos")}
            >
              Ver todo
            </button>
          </div>
          <div className={styles.showcaseGrid}>
            {showcaseShops.map((shop, index) => {
              const layout = showcaseLayout[index] || "small";
              const tileClass =
                layout === "wide"
                  ? styles.showcaseTileWide
                  : layout === "tall"
                  ? styles.showcaseTileTall
                  : "";
              return (
                <button
                  key={shop.id}
                  className={`${styles.showcaseTile} ${tileClass}`}
                  onClick={() => onOpenShop(shop)}
                >
                  <img
                    src={shop.coverUrl || shop.logoUrl}
                    alt={shop.name}
                    loading="lazy"
                    decoding="async"
                    className={styles.showcaseImage}
                  />
                  <div className={styles.showcaseOverlay} />
                  <div className={styles.showcaseInfo}>
                    <span className={styles.showcaseName}>{shop.name}</span>
                    <span className={styles.showcaseMeta}>
                      {shop.plan?.toString() || "Tienda"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
      
      {/* --- STORIES / REELS CAROUSEL --- */}
      {sortedReels.length > 0 && (
          <div className={styles.reelsWrap}>
              <div className={styles.reelsHeader}>
                  <div className={styles.reelsIcon}>
                    <Sparkles size={16} className="fill-current" />
                  </div>
                  <h2 className={styles.reelsTitle}>
                      REELS DE TIENDAS
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

      <div className={styles.reelsBanner} aria-label="Beneficios de la plataforma">
          {(() => {
              const current = bannerMessages[bannerIndex % bannerMessages.length];
              return (
                <div className={styles.reelsBannerInner}>
                  <span
                    key={`${current.id}-${bannerIndex}`}
                    className={`${styles.reelsBannerText} ${
                      current.isBrand ? styles.reelsBannerBrand : ""
                    }`}
                    style={
                      {
                        "--banner-duration": `${current.duration}ms`,
                      } as React.CSSProperties
                    }
                  >
                    {current.text}
                  </span>
                </div>
              );
          })()}
      </div>

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
                                className={styles.livePrimaryButton}
                                onClick={() => window.open(activeStream.url, '_blank')}
                              >
                                  Entrar al Vivo
                              </Button>
                              <Button
                                variant="outline"
                                className={styles.liveSecondaryButton}
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
