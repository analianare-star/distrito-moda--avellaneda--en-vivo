import React, { useState, useEffect } from 'react';
import { Stream, StreamStatus, Reel } from '../types';
import { FILTERS } from '../constants';
import { Button } from './Button';
import { PlayCircle, Users, ChevronLeft, ChevronRight, Plus, Sparkles } from 'lucide-react';

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
    <div className="w-full flex flex-col">
      
      {/* --- STORIES / REELS CAROUSEL --- */}
      {sortedReels.length > 0 && (
          <div className="w-full bg-white border-b border-gray-100 pt-6 pb-6 animate-in slide-in-from-top-2 fade-in duration-500">
              <div className="max-w-7xl mx-auto px-4 mb-4 flex items-center gap-2">
                  <div className="p-1.5 bg-dm-crimson/10 rounded-full text-dm-crimson">
                    <Sparkles size={16} className="fill-current" />
                  </div>
                  <h2 className="font-serif text-lg font-bold text-dm-dark tracking-wide">
                      NOVEDADES & HISTORIAS
                  </h2>
              </div>

              <div className="max-w-7xl mx-auto px-4 overflow-x-auto no-scrollbar">
                  <div className="flex gap-5 min-w-max px-1 pb-2">
                      {sortedReels.map(reel => {
                          const isSeen = viewedReels.includes(reel.id);
                          return (
                              <div 
                                key={reel.id} 
                                className="flex flex-col items-center gap-2 cursor-pointer group w-[72px]"
                                onClick={() => onViewReel(reel)}
                              >
                                  <div className={`w-[72px] h-[72px] rounded-full p-[2px] transition-all duration-300 ${isSeen ? 'bg-gray-200' : 'bg-gradient-to-tr from-dm-crimson via-orange-400 to-yellow-400 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-dm-crimson/20'}`}>
                                      <div className="w-full h-full rounded-full border-[3px] border-white overflow-hidden bg-white">
                                          <img 
                                            src={reel.shopLogo} 
                                            alt={reel.shopName} 
                                            loading="lazy"
                                            decoding="async"
                                            className={`w-full h-full object-cover transition-all duration-500 ${isSeen ? 'opacity-60 grayscale scale-100' : 'opacity-100 scale-100 group-hover:scale-110'}`} 
                                          />
                                      </div>
                                  </div>
                                  <span className={`text-[10px] text-center truncate w-full transition-colors ${isSeen ? 'text-gray-400 font-normal' : 'text-dm-dark font-bold group-hover:text-dm-crimson'}`}>
                                      {reel.shopName}
                                  </span>
                                  <span className="text-[9px] text-gray-400">{reel.views || 0} vistas</span>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      )}

      {/* FEATURED LIVE SECTION (CAROUSEL) */}
      {activeStream && (
          <div className="w-full bg-dm-dark text-white overflow-hidden relative transition-all duration-500">
              
              {/* Dynamic Background Blur */}
              <div key={activeStream.id + '-bg'} className="absolute inset-0 z-0 animate-in fade-in duration-700">
                  <img src={activeStream.coverImage} className="w-full h-full object-cover opacity-30 blur-xl scale-110" alt={activeStream.title} />
                  <div className="absolute inset-0 bg-black/20"></div>
              </div>
              
              <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12 flex items-center gap-4">
                  
                  {/* PREV BUTTON (Only if multiple) */}
                  {liveStreams.length > 1 && (
                      <button 
                        onClick={prevSlide}
                        className="hidden md:flex p-2 rounded-full bg-black/20 hover:bg-white/20 text-white transition-all backdrop-blur-sm z-20"
                        aria-label="Anterior"
                      >
                          <ChevronLeft size={32} />
                      </button>
                  )}

                  {/* CONTENT WRAPPER */}
                  <div className="flex-1 flex flex-col md:flex-row items-center gap-8 animate-in slide-in-from-right-4 fade-in duration-300" key={activeStream.id}>
                      
                      {/* Video/Image Container */}
                      <div className="w-full md:w-1/2 aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/10 relative group cursor-pointer bg-black" onClick={() => window.open(activeStream.url, '_blank')}>
                          <img src={activeStream.coverImage} alt={activeStream.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"/>
                          
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                              <PlayCircle size={64} className="text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all drop-shadow-lg"/>
                          </div>
                          
                          <div className="absolute top-4 left-4 flex gap-2">
                              <span className="bg-dm-crimson text-white text-xs font-bold px-3 py-1 rounded animate-pulse shadow-lg flex items-center gap-2">
                                  <span className="w-2 h-2 bg-white rounded-full"></span> EN VIVO AHORA
                              </span>
                              <span className="bg-black/60 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded flex items-center gap-1">
                                  <Users size={12}/> {activeStream.views}
                              </span>
                          </div>
                      </div>

                      {/* Info Container */}
                      <div className="w-full md:w-1/2 text-left space-y-4 relative">
                          <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-white shadow-md">
                                  <img src={activeStream.shop.logoUrl} alt={activeStream.shop.name} loading="lazy" decoding="async" className="w-full h-full object-cover"/>
                              </div>
                              <div>
                                  <h3 className="font-serif text-xl font-bold leading-none text-white">{activeStream.shop.name}</h3>
                                  <p className="text-xs text-dm-light uppercase tracking-wider mt-1">Avellaneda en Vivo</p>
                              </div>
                          </div>
                          
                          <h1 className="font-serif text-3xl md:text-5xl font-bold leading-tight text-white drop-shadow-sm">
                              {activeStream.title}
                          </h1>
                          
                          <div className="flex gap-4 pt-2">
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
                              <div className="flex md:hidden justify-between mt-4 w-full">
                                  <button onClick={prevSlide} className="p-2 bg-white/10 rounded-full"><ChevronLeft/></button>
                                  <span className="text-xs self-center text-white/50">{currentIndex + 1} / {liveStreams.length}</span>
                                  <button onClick={nextSlide} className="p-2 bg-white/10 rounded-full"><ChevronRight/></button>
                              </div>
                          )}
                      </div>
                  </div>

                  {/* NEXT BUTTON (Only if multiple) */}
                  {liveStreams.length > 1 && (
                      <button 
                        onClick={nextSlide}
                        className="hidden md:flex p-2 rounded-full bg-black/20 hover:bg-white/20 text-white transition-all backdrop-blur-sm z-20"
                        aria-label="Siguiente"
                      >
                          <ChevronRight size={32} />
                      </button>
                  )}
              </div>

              {/* CAROUSEL INDICATORS (DOTS) */}
              {liveStreams.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                      {liveStreams.map((_, idx) => (
                          <button
                              key={idx}
                              onClick={() => setCurrentIndex(idx)}
                              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                  idx === currentIndex ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'
                              }`}
                          />
                      ))}
                  </div>
              )}
          </div>
      )}

      {/* STANDARD BANNER (Only if no live) */}
      {!activeStream && (
        <div className="relative w-full h-[40vh] md:h-[400px] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
                <img 
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop" 
                alt="Showroom Background" 
                className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-dm-dark/60 backdrop-blur-[1px]"></div>
            </div>

            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-8">
                <span className="font-serif text-white text-xl tracking-[0.3em] border-b border-white/30 pb-2 inline-block mb-4">DISTRITO MODA</span>
                <h1 className="font-serif text-4xl md:text-6xl text-white mb-4 leading-tight">
                Avellaneda en Vivo
                </h1>
                <p className="font-sans text-lg text-white/80 font-light max-w-xl mx-auto">
                La pasarela digital mayorista más grande de la región.
                </p>
            </div>
        </div>
      )}

      {/* FILTERS BAR */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-4 py-4 overflow-x-auto no-scrollbar">
               <div className="flex gap-2 md:justify-center min-w-max">
                    {FILTERS.map((filter) => (
                        <button
                        key={filter}
                        onClick={() => onFilterChange(filter)}
                        className={`px-6 py-2 rounded-full font-sans font-bold text-xs uppercase tracking-wider transition-all duration-200 border ${
                            activeFilter === filter
                            ? 'bg-dm-dark text-white border-dm-dark' 
                            : 'bg-white text-gray-500 border-gray-200 hover:border-dm-dark hover:text-dm-dark'
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
