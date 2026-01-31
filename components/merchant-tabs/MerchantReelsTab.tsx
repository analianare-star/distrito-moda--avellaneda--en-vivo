import React from 'react';
import { Film, Plus, UploadCloud, CheckCircle2 } from 'lucide-react';
import { Reel, SocialPlatform } from '../../types';
import { Button } from '../Button';
import styles from '../Dashboard.module.css';

type MerchantReelsTabProps = {
  availableReelPlan: number;
  reelsExtra: number;
  openBuyReelModal: () => void;
  isPreview: boolean;
  reelMode: 'VIDEO' | 'PHOTO_SET';
  setReelMode: (value: 'VIDEO' | 'PHOTO_SET') => void;
  reelUrl: string;
  setReelUrl: (value: string) => void;
  reelPhotoUrls: string[];
  uploadReelFiles: (files: FileList | null, mode: 'VIDEO' | 'PHOTO_SET') => Promise<void>;
  isReelUploading: boolean;
  reelPlatform: SocialPlatform | '';
  setReelPlatform: (value: SocialPlatform) => void;
  handleUploadReel: () => void;
  shopReels: Reel[];
};

const PLATFORM_OPTIONS: SocialPlatform[] = [
  'Instagram',
  'TikTok',
  'YouTube',
  'Facebook',
];

const MerchantReelsTab: React.FC<MerchantReelsTabProps> = ({
  availableReelPlan,
  reelsExtra,
  openBuyReelModal,
  isPreview,
  reelMode,
  setReelMode,
  reelUrl,
  setReelUrl,
  reelPhotoUrls,
  uploadReelFiles,
  isReelUploading,
  reelPlatform,
  setReelPlatform,
  handleUploadReel,
  shopReels,
}) => {
  const [videoInputMode, setVideoInputMode] = React.useState<'LINK' | 'UPLOAD'>('LINK');
  const [selectedPreset, setSelectedPreset] = React.useState<'NUEVA' | 'LIQUIDACION' | 'TOP' | ''>('');
  const [showAllReels, setShowAllReels] = React.useState(false);
  const [noticeIndex, setNoticeIndex] = React.useState(0);

  const totalAvailable = availableReelPlan + reelsExtra;
  const activeReels = shopReels.filter((r) => r.status === 'ACTIVE' || r.status === 'PROCESSING');
  const expiredReels = shopReels.filter((r) => r.status === 'EXPIRED');
  const hasContent = reelMode === 'VIDEO' ? Boolean(reelUrl) : reelPhotoUrls.length > 0;
  const hasPlatform = Boolean(reelPlatform);
  const canPublish = totalAvailable > 0 && !isReelUploading && hasContent && hasPlatform;

  const todayKey = new Date().toISOString().split('T')[0];
  const reelsToday = shopReels.filter((r) => r.createdAtISO.startsWith(todayKey) && r.status !== 'HIDDEN').length;
  const dailyGoal = 1;
  const goalProgress = Math.min(100, Math.round((reelsToday / dailyGoal) * 100));
  const goalDone = reelsToday >= dailyGoal;

  const daySet = new Set<string>();
  shopReels.forEach((reel) => {
    if (reel.status === 'HIDDEN') return;
    const key = reel.createdAtISO.split('T')[0];
    if (key) daySet.add(key);
  });
  let streak = 0;
  for (let i = 0; i < 30; i += 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    if (daySet.has(key)) streak += 1;
    else break;
  }

  const scrollToCompose = () => {
    const el = document.getElementById('reels-compose');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const formatReelUrl = (value: string) => {
    const cleaned = value.replace(/^https?:\/\//, '').replace(/^www\./, '');
    if (cleaned.length <= 32) return cleaned;
    return `${cleaned.slice(0, 32)}...`;
  };

  const presetOptions = [
    { id: 'NUEVA', label: 'Nueva llegada', helper: 'Ideal para presentar producto nuevo.' },
    { id: 'LIQUIDACION', label: 'Liquidacion', helper: 'Resalta oferta o descuento.' },
    { id: 'TOP', label: 'Top ventas', helper: 'Muestra lo que mas se vende.' },
  ] as const;

  const selectedPresetLabel =
    presetOptions.find((preset) => preset.id === selectedPreset)?.label || '';

  const previewMedia =
    reelMode === 'PHOTO_SET'
      ? reelPhotoUrls[0]
      : videoInputMode === 'UPLOAD'
          ? reelUrl
          : '';

  const notices = [
    {
      title: 'Disponibles hoy',
      body: `${totalAvailable} historias. Plan ${availableReelPlan}, extras ${reelsExtra}.`,
    },
    {
      title: 'Meta diaria',
      body: goalDone ? 'Meta completada. Buen trabajo.' : 'Publica 1 historia para mantener visibilidad.',
    },
    {
      title: 'Actividad',
      body: activeReels.length > 0 ? `Tenes ${activeReels.length} historias activas.` : 'Todavia no hay historias activas.',
    },
  ];

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setNoticeIndex((prev) => (prev + 1) % notices.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [notices.length]);

  const applyPreset = (presetId: 'NUEVA' | 'LIQUIDACION' | 'TOP') => {
    setSelectedPreset(presetId);
    scrollToCompose();
  };

  return (
    <div className={styles.reelsSection}>
      <header className={styles.reelsHeroWrap}>
        <div className={styles.reelsHeroInfo}>
          <h1 className={styles.reelsTitle}>Historias</h1>
          <p className={styles.reelsSubtitle}>Publica contenido breve que dura 24 horas.</p>
        </div>
        <div className={styles.reelsAvailabilityCard}>
          <div>
            <p className={styles.reelsAvailabilityLabel}>Disponibles hoy</p>
            <p className={styles.reelsAvailabilityValue}>{totalAvailable}</p>
            <p className={styles.reelsAvailabilityMeta}>Plan {availableReelPlan} | Extras {reelsExtra}</p>
          </div>
          <div className={styles.reelsAvailabilityActions}>
            <button
              onClick={openBuyReelModal}
              className={`${styles.reelsAvailabilityCta} ${isPreview ? styles.reelsHeroCtaDisabled : ''}`}
            >
              Comprar extras
            </button>
            {totalAvailable === 0 && (
              <p className={styles.reelsWarning}>Sin cupos disponibles hoy.</p>
            )}
          </div>
        </div>
      </header>

      <div className={styles.reelsDiscoveryRow}>
        <button
          type="button"
          className={styles.reelsNoticeSlider}
          onClick={() => setNoticeIndex((prev) => (prev + 1) % notices.length)}
        >
          <div>
            <p className={styles.reelsNoticeTitle}>{notices[noticeIndex]?.title}</p>
            <p className={styles.reelsNoticeBody}>{notices[noticeIndex]?.body}</p>
          </div>
          <div className={styles.reelsNoticeDots}>
            {notices.map((_, idx) => (
              <span
                key={`notice-${idx}`}
                className={`${styles.reelsNoticeDot} ${idx === noticeIndex ? styles.reelsNoticeDotActive : ''}`}
              />
            ))}
          </div>
        </button>

        <div className={styles.reelsMissionCard}>
          <div>
            <p className={styles.reelsMissionTitle}>Meta de hoy</p>
            <p className={styles.reelsMissionValue}>{goalDone ? 'Completada' : 'Publica 1 historia'}</p>
            <p className={styles.reelsMissionMeta}>Historias hoy: {reelsToday}</p>
          </div>
          <div className={styles.reelsMissionBar}>
            <span style={{ width: `${goalProgress}%` }} />
          </div>
          <div className={styles.reelsMissionStreak}>Racha: {streak} dias</div>
        </div>
      </div>

      <div className={styles.reelsIdeasRow}>
        <div className={styles.reelsIdeasHeader}>
          <p className={styles.reelsIdeasTitle}>Ideas para publicar</p>
          <span className={styles.reelsIdeasHint}>Desliza para explorar</span>
        </div>
        <div className={styles.reelsIdeasTrack}>
          {presetOptions.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className={styles.reelsIdeaCard}
            >
              <p className={styles.reelsIdeaTitle}>{preset.label}</p>
              <p className={styles.reelsIdeaText}>{preset.helper}</p>
              <span className={styles.reelsIdeaAction}>Usar idea</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.reelsLayout}>
        <section id="reels-compose" className={styles.reelsComposeCard}>
          <div className={styles.reelsComposeHeader}>
            <h3 className={styles.reelsComposeTitle}>
              <Plus size={16} /> Publicar historia
            </h3>
            <span className={styles.reelsComposeMeta}>Duracion 24h</span>
          </div>

          <div className={styles.reelsQuickRow}>
            <span className={styles.reelsQuickBadge}>Publicar en 60s</span>
            <div className={styles.reelsQuickSteps}>
              <span className={styles.reelsQuickStep}>Formato</span>
              <span className={styles.reelsQuickDot} />
              <span className={styles.reelsQuickStep}>Contenido</span>
              <span className={styles.reelsQuickDot} />
              <span className={styles.reelsQuickStep}>Plataforma</span>
            </div>
          </div>

          <div className={styles.reelsStepBlock}>
            <span className={styles.reelsStepNumber}>1</span>
            <div className={styles.reelsStepContent}>
              <p className={styles.reelsStepTitle}>Formato</p>
              <div className={styles.reelModeRow}>
                <button
                  type="button"
                  onClick={() => setReelMode('VIDEO')}
                  className={`${styles.reelModeButton} ${reelMode === 'VIDEO' ? styles.reelModeActive : ''}`}
                >
                  Video 10s
                </button>
                <button
                  type="button"
                  onClick={() => setReelMode('PHOTO_SET')}
                  className={`${styles.reelModeButton} ${reelMode === 'PHOTO_SET' ? styles.reelModeActive : ''}`}
                >
                  5 Fotos
                </button>
              </div>
            </div>
          </div>

          <div className={styles.reelsStepBlock}>
            <span className={styles.reelsStepNumber}>2</span>
            <div className={styles.reelsStepContent}>
              <p className={styles.reelsStepTitle}>Contenido</p>
              {reelMode === 'VIDEO' ? (
                <>
                  <div className={styles.reelsToggleRow}>
                    <button
                      type="button"
                      onClick={() => setVideoInputMode('LINK')}
                      className={`${styles.reelsToggleButton} ${videoInputMode === 'LINK' ? styles.reelsToggleActive : ''}`}
                    >
                      Enlace
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoInputMode('UPLOAD')}
                      className={`${styles.reelsToggleButton} ${videoInputMode === 'UPLOAD' ? styles.reelsToggleActive : ''}`}
                    >
                      Subir archivo
                    </button>
                  </div>
                  {videoInputMode === 'LINK' ? (
                    <div>
                      <label className={styles.reelsLabel}>Enlace del video</label>
                      <input
                        type="text"
                        value={reelUrl}
                        onChange={(e) => setReelUrl(e.target.value)}
                        placeholder="https://instagram.com/reel/..."
                        className={styles.reelsInput}
                      />
                    </div>
                  ) : (
                    <div className={styles.reelsDropzone}>
                      <div className={styles.reelsDropzoneIcon}>
                        <UploadCloud size={20} />
                      </div>
                      <div>
                        <p className={styles.reelsDropzoneTitle}>Subir video</p>
                        <p className={styles.reelsDropzoneText}>Galeria o camara, max 10s.</p>
                      </div>
                      <input
                        type="file"
                        accept="video/*"
                        className={styles.reelsDropzoneInput}
                        disabled={isReelUploading}
                        onChange={async (e) => {
                          const input = e.currentTarget;
                          const files = input.files;
                          await uploadReelFiles(files, 'VIDEO');
                          if (input) input.value = '';
                        }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className={styles.reelsLabel}>Fotos (hasta 5)</label>
                    <div className={styles.reelPhotoGrid}>
                      {reelPhotoUrls.map((url, index) => (
                        <img key={`${url}-${index}`} src={url} alt={`Foto ${index + 1}`} className={styles.reelPhotoThumb} />
                      ))}
                    </div>
                  </div>
                  <div className={styles.reelsDropzone}>
                    <div className={styles.reelsDropzoneIcon}>
                      <UploadCloud size={20} />
                    </div>
                    <div>
                      <p className={styles.reelsDropzoneTitle}>Subir fotos</p>
                      <p className={styles.reelsDropzoneText}>Galeria o camara, max 5.</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className={styles.reelsDropzoneInput}
                      disabled={isReelUploading}
                      onChange={async (e) => {
                        const input = e.currentTarget;
                        const files = input.files;
                        await uploadReelFiles(files, 'PHOTO_SET');
                        if (input) input.value = '';
                      }}
                    />
                  </div>
                  <p className={styles.reelsHint}>Cada foto se muestra ~2s (10s total).</p>
                </>
              )}
              {isReelUploading && (
                <div className={styles.reelsProcessing}>
                  <span className={styles.reelsProcessingDot} />
                  Procesando y optimizando archivos...
                </div>
              )}
            </div>
          </div>

          <div className={styles.reelsStepBlock}>
            <span className={styles.reelsStepNumber}>3</span>
            <div className={styles.reelsStepContent}>
              <p className={styles.reelsStepTitle}>Estilo recomendado</p>
              <div className={styles.reelsPresetRow}>
                {presetOptions.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`${styles.reelsPresetChip} ${selectedPreset === preset.id ? styles.reelsPresetChipActive : ''}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              {selectedPresetLabel && (
                <p className={styles.reelsPresetHint}>Seleccionaste: {selectedPresetLabel}</p>
              )}
            </div>
          </div>

          <div className={styles.reelsStepBlock}>
            <span className={styles.reelsStepNumber}>4</span>
            <div className={styles.reelsStepContent}>
              <p className={styles.reelsStepTitle}>Plataforma</p>
              <div className={styles.reelsPlatformRow}>
                {PLATFORM_OPTIONS.map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => setReelPlatform(platform)}
                    className={`${styles.reelsPlatformChip} ${reelPlatform === platform ? styles.reelsPlatformChipActive : ''}`}
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.reelsPreviewCard}>
            <div className={styles.reelsPreviewHeader}>
              <span className={styles.reelsPreviewLabel}>Vista previa</span>
              <span className={styles.reelsPreviewMeta}>Expira en 24h</span>
            </div>
            <div className={styles.reelsPreviewBody}>
              {previewMedia ? (
                reelMode === 'VIDEO' ? (
                  <video src={previewMedia} className={styles.reelsPreviewMedia} controls muted />
                ) : (
                  <img src={previewMedia} alt="Vista previa" className={styles.reelsPreviewMedia} />
                )
              ) : reelUrl ? (
                <div className={styles.reelsPreviewLink}>
                  <p className={styles.reelsPreviewLinkLabel}>Enlace cargado</p>
                  <p className={styles.reelsPreviewLinkValue}>{formatReelUrl(reelUrl)}</p>
                </div>
              ) : (
                <div className={styles.reelsPreviewPlaceholder}>
                  Carga contenido para ver la vista previa.
                </div>
              )}
            </div>
            {selectedPresetLabel && (
              <div className={styles.reelsPreviewTag}>Historia: {selectedPresetLabel}</div>
            )}
          </div>

          {totalAvailable === 0 && (
            <div className={styles.reelsUpsellCard}>
              <div>
                <p className={styles.reelsUpsellTitle}>Sin cupos disponibles</p>
                <p className={styles.reelsUpsellText}>Compra extras para publicar ahora mismo.</p>
              </div>
              <Button
                size="sm"
                onClick={openBuyReelModal}
                disabled={isPreview}
                className={styles.reelsUpsellButton}
              >
                Comprar y publicar
              </Button>
            </div>
          )}

          <Button
            onClick={handleUploadReel}
            disabled={!canPublish}
            className={styles.reelsPrimaryButton}
          >
            Publicar historia
          </Button>

          <div className={styles.reelsChecklist}>
            <div className={`${styles.reelsChecklistItem} ${styles.reelsChecklistDone}`}>
              <CheckCircle2 size={14} />
              <span>Formato listo</span>
            </div>
            <div className={`${styles.reelsChecklistItem} ${hasContent ? styles.reelsChecklistDone : styles.reelsChecklistPending}`}>
              <CheckCircle2 size={14} />
              <span>{hasContent ? 'Contenido cargado' : 'Subi el contenido'}</span>
            </div>
            <div className={`${styles.reelsChecklistItem} ${hasPlatform ? styles.reelsChecklistDone : styles.reelsChecklistPending}`}>
              <CheckCircle2 size={14} />
              <span>{hasPlatform ? 'Plataforma elegida' : 'Elegi la plataforma'}</span>
            </div>
          </div>

          {isReelUploading && (
            <div className={styles.reelsProcessingNote}>No cierres esta ventana hasta que termine el procesamiento.</div>
          )}
          {totalAvailable === 0 && (
            <p className={styles.reelsDisabledNote}>Sin cupos disponibles hoy.</p>
          )}
        </section>

        <section className={styles.reelsListCard}>
          <div className={styles.reelsListHeader}>
            <h3 className={styles.reelsPanelTitle}>
              <Film size={16} /> Activas
            </h3>
            <div className={styles.reelsListActions}>
              <span className={styles.reelsListCount}>{activeReels.length} historias</span>
              {activeReels.length > 0 && (
                <button
                  type="button"
                  className={styles.reelsListToggle}
                  onClick={() => setShowAllReels((prev) => !prev)}
                >
                  {showAllReels ? 'Ocultar lista' : 'Ver todas'}
                </button>
              )}
            </div>
          </div>
          <p className={styles.reelsListSub}>Ultimas 24 horas</p>

          {activeReels.length === 0 ? (
            <div className={styles.reelsEmptyState}>
              <p className={styles.reelsEmpty}>No tenes historias activas.</p>
              <Button size="sm" variant="outline" onClick={scrollToCompose}>
                Publicar ahora
              </Button>
            </div>
          ) : (
            <div className={styles.reelsCarousel}>
              <div className={styles.reelsCarouselTrack}>
                {activeReels.map((reel) => {
                  const now = new Date();
                  const expires = new Date(reel.expiresAtISO);
                  const diffMs = expires.getTime() - now.getTime();
                  const hours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
                  const isProcessing = reel.status === 'PROCESSING';
                  const thumb = reel.thumbnail || reel.photoUrls?.[0] || reel.videoUrl || '';
                  const displayUrl = reel.url ? formatReelUrl(reel.url) : 'Contenido cargado';
                  return (
                    <div key={reel.id} className={styles.reelsCarouselItem}>
                      <div className={styles.reelsCarouselMedia}>
                        {thumb ? (
                          <img src={thumb} alt={reel.shopName} loading="lazy" decoding="async" className={styles.reelsItemThumb} />
                        ) : (
                          <div className={styles.reelsThumbPlaceholder} />
                        )}
                      </div>
                      <div className={styles.reelsCarouselBody}>
                        <p className={styles.reelsItemTitle}>{displayUrl}</p>
                        <p className={styles.reelsItemMeta}>
                          {reel.platform} | {isProcessing ? 'Procesando' : `Expira en ${hours}h`}
                        </p>
                        <div className={styles.reelsCarouselActions}>
                          <button className={styles.reelsItemActionButton}>Ver</button>
                          <button className={styles.reelsItemActionGhost}>Ocultar</button>
                        </div>
                      </div>
                      <span className={isProcessing ? styles.reelsItemBadgeProcessing : styles.reelsItemBadge}>
                        {isProcessing ? 'PROCESANDO' : 'ACTIVA'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {showAllReels && activeReels.length > 0 && (
            <div className={styles.reelsList}>
              {activeReels.map((reel) => {
                const now = new Date();
                const expires = new Date(reel.expiresAtISO);
                const diffMs = expires.getTime() - now.getTime();
                const hours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
                const isProcessing = reel.status === 'PROCESSING';
                const thumb = reel.thumbnail || reel.photoUrls?.[0] || reel.videoUrl || '';
                const displayUrl = reel.url ? formatReelUrl(reel.url) : 'Contenido cargado';
                return (
                  <div key={`full-${reel.id}`} className={styles.reelsItemPremium}>
                    <div className={styles.reelsItemMediaLg}>
                      {thumb ? (
                        <img src={thumb} alt={reel.shopName} loading="lazy" decoding="async" className={styles.reelsItemThumb} />
                      ) : (
                        <div className={styles.reelsThumbPlaceholder} />
                      )}
                    </div>
                    <div className={styles.reelsItemInfo}>
                      <p className={styles.reelsItemTitle}>{displayUrl}</p>
                      <p className={styles.reelsItemMeta}>
                        {reel.platform} | {isProcessing ? 'Procesando...' : `Expira en ${hours}h`} | {reel.views || 0} vistas
                      </p>
                      <div className={styles.reelsItemActions}>
                        <button className={styles.reelsItemActionButton}>Ver</button>
                        <button className={styles.reelsItemActionGhost}>Ocultar</button>
                      </div>
                    </div>
                    <span className={isProcessing ? styles.reelsItemBadgeProcessing : styles.reelsItemBadge}>
                      {isProcessing ? 'PROCESANDO' : 'ACTIVA'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {expiredReels.length > 0 && (
            <details className={styles.reelsExpiredWrap}>
              <summary className={styles.reelsExpiredTitle}>Expiradas recientes</summary>
              {expiredReels.slice(0, 5).map((reel) => (
                <div key={reel.id} className={styles.reelsExpiredRow}>
                  <span className={styles.reelsExpiredLink}>{reel.url}</span>
                  <span>EXPIRADA</span>
                </div>
              ))}
            </details>
          )}
        </section>
      </div>

      {isReelUploading && (
        <div className={styles.modalBackdrop}>
          <div className={styles.reelsProcessingModal}>
            <div className={styles.reelsProcessingModalIcon}>
              <UploadCloud size={20} />
            </div>
            <h3 className={styles.reelsProcessingModalTitle}>Procesando historia</h3>
            <p className={styles.reelsProcessingModalText}>
              Estamos optimizando tu contenido para que se vea perfecto. Esto puede tardar unos segundos.
            </p>
            <div className={styles.reelsProcessingModalBar}>
              <span />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantReelsTab;
