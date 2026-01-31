import React from 'react';
import { Plus, RefreshCw, Pencil, Trash2, Star } from 'lucide-react';
import { Stream, StreamStatus } from '../../types';
import { Button } from '../Button';
import styles from '../Dashboard.module.css';

type MerchantStreamsTabProps = {
  myStreams: Stream[];
  canSchedule: boolean;
  canManageAgenda: boolean;
  availableQuota: number;
  pendingReprogramCount: number;
  handleCreateClick: () => void;
  getRestrictionMessage: () => string;
  onExtendStream?: (streamId: string) => void;
  openEditModal: (stream: Stream) => void;
  setConfirmDialog: (value: {
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  } | null) => void;
  onStreamDelete: (streamId: string) => void;
};

const MerchantStreamsTab: React.FC<MerchantStreamsTabProps> = ({
  myStreams,
  canSchedule,
  canManageAgenda,
  availableQuota,
  pendingReprogramCount,
  handleCreateClick,
  getRestrictionMessage,
  onExtendStream,
  openEditModal,
  setConfirmDialog,
  onStreamDelete,
}) => {
  return (
    <div className={styles.streamsSection}>
      <header className={styles.streamsHeader}>
        <div>
          <h1 className={styles.streamsTitle}>Mis Vivos</h1>
          <p className={styles.streamsSubtitle}>Gestiona tu agenda y monitorea el rendimiento.</p>
        </div>
        <div className={styles.streamsHeaderRight}>
          <div className={`${styles.streamsActionWrap} group`}>
            <Button
              onClick={handleCreateClick}
              disabled={!canSchedule}
              className={!canSchedule ? styles.streamsActionDisabled : ''}
            >
              <Plus size={18} className={styles.buttonIcon} /> Agendar Vivo
            </Button>
            {!canSchedule && <div className={styles.streamsTooltip}>{getRestrictionMessage()}</div>}
          </div>
          <p className={styles.streamsQuotaNote}>Cupos Disponibles: {availableQuota}</p>
        </div>
      </header>

      <div className={styles.streamsRules}>
        <div className={styles.streamsRulesRow}>
          <span className={styles.streamsRulesLabel}>Reglas clave:</span>
          <span>Máximo 1 vivo por día.</span>
          <span>Máximo 7 vivos por semana.</span>
          <span>Requiere cupo disponible.</span>
          {pendingReprogramCount > 0 && (
            <span className={styles.streamsRulesWarning}>
              Tenés {pendingReprogramCount} vivos para reprogramar.
            </span>
          )}
        </div>
      </div>

      <div className={styles.streamsCard}>
        <div className={styles.streamsMobileList}>
          {myStreams.length > 0 ? (
            myStreams.map((stream) => (
              <div key={stream.id} className={styles.streamsMobileItem}>
                <div className={styles.streamsMobileHeader}>
                  <div>
                    <p className={styles.streamsMobileTitle}>{stream.title}</p>
                    <p className={styles.streamsMobileDate}>
                      {new Date(stream.fullDateISO).toLocaleDateString()} - {stream.scheduledTime} hs
                    </p>
                  </div>
                  <span
                    className={
                      stream.status === StreamStatus.LIVE
                        ? styles.streamsStatusLive
                        : stream.status === StreamStatus.UPCOMING
                        ? styles.streamsStatusUpcoming
                        : stream.status === StreamStatus.MISSED
                        ? styles.streamsStatusMissed
                        : stream.status === StreamStatus.CANCELLED
                        ? styles.streamsStatusCancelled
                        : stream.status === StreamStatus.BANNED
                        ? styles.streamsStatusBanned
                        : stream.status === StreamStatus.PENDING_REPROGRAMMATION
                        ? styles.streamsStatusPending
                        : styles.streamsStatusFinished
                    }
                  >
                    {stream.status === StreamStatus.UPCOMING
                      ? 'PROGRAMADO'
                      : stream.status === StreamStatus.LIVE
                      ? 'EN VIVO'
                      : stream.status === StreamStatus.MISSED
                      ? 'NO REALIZADO'
                      : stream.status === StreamStatus.CANCELLED
                      ? 'CANCELADO'
                      : stream.status === StreamStatus.BANNED
                      ? 'BLOQUEADO'
                      : stream.status === StreamStatus.PENDING_REPROGRAMMATION
                      ? 'REPROGRAMAR'
                      : 'FINALIZADO'}
                  </span>
                </div>
                <div className={styles.streamsMobileMeta}>
                  <span
                    className={`${styles.platformBadge} ${
                      stream.platform === 'Instagram'
                        ? styles.platformInstagram
                        : stream.platform === 'TikTok'
                        ? styles.platformTiktok
                        : styles.platformDefault
                    }`}
                  >
                    {stream.platform}
                  </span>
                  <div className={styles.ratingRow}>
                    <Star size={12} className={stream.rating ? styles.ratingStarActive : styles.ratingStarInactive} />
                    <span className={styles.streamsRatingRowText}>{stream.rating || '-'}</span>
                  </div>
                </div>
                <div className={styles.streamsMobileActions}>
                  {stream.status === StreamStatus.LIVE &&
                    onExtendStream &&
                    stream.extensionCount < 3 && (
                      <Button
                        size="sm"
                        className={styles.streamsActionConfirm}
                        onClick={() => onExtendStream(stream.id)}
                        title="Extender 30 minutos más"
                      >
                        <RefreshCw size={10} className={styles.buttonIconSm} /> Continuamos
                      </Button>
                    )}
                  {(stream.status === StreamStatus.UPCOMING ||
                    stream.status === StreamStatus.PENDING_REPROGRAMMATION) && (
                    <>
                      <button
                        onClick={() => openEditModal(stream)}
                        disabled={!canManageAgenda}
                        title={!canManageAgenda ? getRestrictionMessage() : 'Editar vivo'}
                        className={`${styles.iconButton} ${
                          !canManageAgenda ? styles.iconButtonDisabled : styles.iconButtonEdit
                        }`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (!canManageAgenda) return;
                          setConfirmDialog({
                            title: 'Cancelar vivo',
                            message: '¿Confirmas la cancelación de este vivo?',
                            confirmLabel: 'Cancelar vivo',
                            onConfirm: () => onStreamDelete(stream.id),
                          });
                        }}
                        disabled={!canManageAgenda}
                        title={!canManageAgenda ? getRestrictionMessage() : 'Cancelar vivo'}
                        className={`${styles.iconButton} ${
                          !canManageAgenda ? styles.iconButtonDisabled : styles.iconButtonDelete
                        }`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.streamsMobileEmpty}>No has creado ningún vivo aún.</div>
          )}
        </div>
        <div className={styles.streamsDesktopTable}>
          <table className={styles.streamsTable}>
            <thead className={styles.streamsTableHead}>
              <tr>
                <th className={styles.streamsTableHeadCell}>Información</th>
                <th className={styles.streamsTableHeadCell}>Red Social</th>
                <th className={styles.streamsTableHeadCell}>Estado</th>
                <th className={styles.streamsTableHeadCell}>Calificación</th>
                <th className={`${styles.streamsTableHeadCell} ${styles.streamsTableHeadRight}`}>Acciones</th>
              </tr>
            </thead>
            <tbody className={styles.streamsTableBody}>
              {myStreams.length > 0 ? (
                myStreams.map((stream) => (
                  <tr key={stream.id} className={styles.streamsTableRow}>
                    <td className={styles.streamsTableCell}>
                      <div className={styles.streamsInfoStack}>
                        <span className={styles.streamsInfoTitle}>{stream.title}</span>
                        <span className={styles.streamsInfoDate}>
                          {new Date(stream.fullDateISO).toLocaleDateString()} - {stream.scheduledTime} hs
                        </span>
                      </div>
                    </td>
                    <td className={styles.streamsTableCell}>
                      <span
                        className={`${styles.platformBadge} ${
                          stream.platform === 'Instagram'
                            ? styles.platformInstagram
                            : stream.platform === 'TikTok'
                            ? styles.platformTiktok
                            : styles.platformDefault
                        }`}
                      >
                        {stream.platform}
                      </span>
                    </td>
                    <td className={styles.streamsTableCell}>
                      {stream.status === StreamStatus.LIVE ? (
                        <span className={styles.streamsStatusLive}>EN VIVO</span>
                      ) : stream.status === StreamStatus.UPCOMING ? (
                        <span className={styles.streamsStatusUpcoming}>PROGRAMADO</span>
                      ) : stream.status === StreamStatus.MISSED ? (
                        <span className={styles.streamsStatusMissed}>NO REALIZADO</span>
                      ) : stream.status === StreamStatus.CANCELLED ? (
                        <span className={styles.streamsStatusCancelled}>CANCELADO</span>
                      ) : stream.status === StreamStatus.BANNED ? (
                        <span className={styles.streamsStatusBanned}>BLOQUEADO</span>
                      ) : stream.status === StreamStatus.PENDING_REPROGRAMMATION ? (
                        <span className={styles.streamsStatusPending}>REPROGRAMAR</span>
                      ) : (
                        <span className={styles.streamsStatusFinished}>FINALIZADO</span>
                      )}
                    </td>
                    <td className={styles.streamsTableCell}>
                      <div className={styles.streamsRatingRow}>
                        <Star size={14} className={stream.rating ? styles.ratingStarActive : styles.ratingStarInactive} />
                        <span className={styles.streamsRatingRowText}>{stream.rating || '-'}</span>
                        {stream.rating && (
                          <span className={styles.streamsRatingCount}>
                            ({Math.floor(Math.random() * 50) + 5})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`${styles.streamsTableCell} ${styles.streamsTableCellRight}`}>
                      <div className={styles.streamsActionsRow}>
                        {stream.status === StreamStatus.LIVE &&
                          onExtendStream &&
                          stream.extensionCount < 3 && (
                            <Button
                              size="sm"
                              className={styles.streamsActionConfirm}
                              onClick={() => onExtendStream(stream.id)}
                              title="Extender 30 minutos más"
                            >
                              <RefreshCw size={10} className={styles.buttonIconSm} /> Continuamos
                            </Button>
                          )}
                        {(stream.status === StreamStatus.UPCOMING ||
                          stream.status === StreamStatus.PENDING_REPROGRAMMATION) && (
                          <>
                            <button
                              onClick={() => openEditModal(stream)}
                              disabled={!canManageAgenda}
                              title={!canManageAgenda ? getRestrictionMessage() : 'Editar vivo'}
                              className={`${styles.iconButton} ${
                                !canManageAgenda ? styles.iconButtonDisabled : styles.iconButtonEdit
                              }`}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (!canManageAgenda) return;
                                setConfirmDialog({
                                  title: 'Cancelar vivo',
                                  message: '¿Confirmas la cancelación de este vivo?',
                                  confirmLabel: 'Cancelar vivo',
                                  onConfirm: () => onStreamDelete(stream.id),
                                });
                              }}
                              disabled={!canManageAgenda}
                              title={!canManageAgenda ? getRestrictionMessage() : 'Cancelar vivo'}
                              className={`${styles.iconButton} ${
                                !canManageAgenda ? styles.iconButtonDisabled : styles.iconButtonDelete
                              }`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className={styles.streamsTableEmpty}>
                    No has creado ningún vivo aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MerchantStreamsTab;
