import React from 'react';
import { Button } from '../Button';
import styles from '../AdminDashboard.module.css';

type AdminAdminTabProps = {
  isSuperadmin: boolean;
  purchaseQuery: string;
  setPurchaseQuery: (value: string) => void;
  purchaseStatusFilter: string;
  setPurchaseStatusFilter: (value: string) => void;
  purchasesLoading: boolean;
  filteredPurchases: any[];
  formatPurchaseStatus: (value?: string) => string;
  handleRejectPurchase: (purchaseId: string) => void;
  handleApprovePurchase: (purchaseId: string) => void;
  quotaShopId: string;
  setQuotaShopId: (value: string) => void;
  quotaType: 'STREAM' | 'REEL';
  setQuotaType: (value: 'STREAM' | 'REEL') => void;
  quotaAmount: number;
  setQuotaAmount: (value: number) => void;
  handleAssignQuota: (event: React.FormEvent) => void;
  shops: Array<{ id: string; name: string }>;
  officialMode: boolean;
  setOfficialMode: (value: boolean) => void;
  refreshSystemStatus: () => void;
  systemStatusLoading: boolean;
  systemStatus: any | null;
  streamsLifecycleRunning: boolean;
  runStreamsLifecycle: () => void;
  streamsLifecycleSummary: any | null;
  sanctionsRunning: boolean;
  runSanctions: () => void;
  sanctionsSummary: any | null;
  notificationsRunning: boolean;
  runNotifications: () => void;
  notificationsSummary: any | null;
  notificationFilter: string;
  setNotificationFilter: (value: string) => void;
  notificationType: string;
  setNotificationType: (value: string) => void;
  refreshAdminNotifications: () => void;
  notificationsLoading: boolean;
  adminNotifications: any[];
  formatNotificationType: (value?: string) => string;
  formatNotificationDate: (value?: string) => string;
  markNotificationRead: (id: string) => void;
};

const AdminAdminTab: React.FC<AdminAdminTabProps> = ({
  isSuperadmin,
  purchaseQuery,
  setPurchaseQuery,
  purchaseStatusFilter,
  setPurchaseStatusFilter,
  purchasesLoading,
  filteredPurchases,
  formatPurchaseStatus,
  handleRejectPurchase,
  handleApprovePurchase,
  quotaShopId,
  setQuotaShopId,
  quotaType,
  setQuotaType,
  quotaAmount,
  setQuotaAmount,
  handleAssignQuota,
  shops,
  officialMode,
  setOfficialMode,
  refreshSystemStatus,
  systemStatusLoading,
  systemStatus,
  streamsLifecycleRunning,
  runStreamsLifecycle,
  streamsLifecycleSummary,
  sanctionsRunning,
  runSanctions,
  sanctionsSummary,
  notificationsRunning,
  runNotifications,
  notificationsSummary,
  notificationFilter,
  setNotificationFilter,
  notificationType,
  setNotificationType,
  refreshAdminNotifications,
  notificationsLoading,
  adminNotifications,
  formatNotificationType,
  formatNotificationDate,
  markNotificationRead,
}) => {
  const resolvePlanUpgradeLabel = (notes?: string) => {
    if (!notes) return '';
    const raw = notes.trim().toUpperCase();
    const value = raw.startsWith('PLAN:') ? raw.split(':').slice(1).join(':').trim() : raw;
    if (value.includes('ALTA')) return 'Alta Visibilidad';
    if (value.includes('MAXIMA') || value.includes('PRO')) return 'Maxima Visibilidad';
    if (value.includes('ESTANDAR') || value.includes('BASIC') || value.includes('STANDARD')) return 'Estandar';
    return '';
  };

  const formatPurchaseType = (req: any) => {
    if (req.type === 'LIVE_PACK') return 'Cupos de vivos';
    if (req.type === 'REEL_PACK') return 'Cupos de historias';
    if (req.type === 'PLAN_UPGRADE') {
      const target = resolvePlanUpgradeLabel(req.notes);
      return target ? `Upgrade a ${target}` : 'Upgrade de plan';
    }
    return req.type;
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Administrativo</h2>
      <div className={styles.adminGrid}>
        <div className={styles.adminCard}>
          <div className={styles.adminCardHeader}>
            <h3 className={styles.adminCardTitle}>Solicitudes de Compra</h3>
          </div>
          <p className={styles.adminCardSubtitle}>Bandeja de solicitudes pendientes (PENDING).</p>
          {!isSuperadmin && (
            <p className={styles.adminCardSubtitle}>Solo SUPERADMIN puede aprobar o rechazar compras.</p>
          )}
          <div className={styles.adminCardStack}>
            <input
              type="text"
              placeholder="Buscar tienda..."
              value={purchaseQuery}
              onChange={(e) => setPurchaseQuery(e.target.value)}
              className={styles.adminField}
            />
            <select
              value={purchaseStatusFilter}
              onChange={(e) => setPurchaseStatusFilter(e.target.value)}
              className={styles.adminFieldWhite}
            >
              <option value="PENDING">Pendientes</option>
              <option value="APPROVED">Aprobadas</option>
              <option value="REJECTED">Rechazadas</option>
              <option value="ALL">Todas</option>
            </select>
          </div>
          {purchasesLoading ? (
            <div className={styles.adminListStack}>
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className={styles.adminNoteSkeleton}>
                  <div className={styles.adminNoteSkeletonLineMd} />
                  <div className={styles.adminNoteSkeletonLineXs} />
                  <div className={styles.adminNoteSkeletonLineSm} />
                </div>
              ))}
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className={styles.adminEmpty}>Sin solicitudes registradas.</div>
          ) : (
            <div className={styles.adminListStack}>
              {filteredPurchases.map((req) => (
                <div key={req.purchaseId} className={styles.adminRequestItem}>
                  <div className={styles.adminRequestHeader}>
                    <div>
                      <p className={styles.adminRequestTitle}>{req.shop?.name || 'Tienda'}</p>
                      <p className={styles.adminRequestMeta}>
                        {formatPurchaseType(req)}
                      </p>
                    </div>
                    <span
                      className={`${styles.purchaseStatusBadge} ${
                        req.status === 'APPROVED'
                          ? styles.purchaseApproved
                          : req.status === 'REJECTED'
                          ? styles.purchaseRejected
                          : styles.purchasePending
                      }`}
                    >
                      {formatPurchaseStatus(req.status)}
                    </span>
                  </div>
                  <div className={styles.adminRequestFooter}>
                    <span className={styles.adminRequestQty}>
                      Cantidad: <span className={styles.adminRequestQtyValue}>{req.quantity}</span>
                    </span>
                    <div className={styles.adminRequestActions}>
                      <button
                        onClick={() => handleRejectPurchase(req.purchaseId)}
                        className={`${styles.adminActionReject} ${!isSuperadmin ? styles.adminActionDisabled : ''}`}
                        disabled={!isSuperadmin}
                        title={!isSuperadmin ? 'Solo SUPERADMIN' : 'Rechazar'}
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => handleApprovePurchase(req.purchaseId)}
                        className={`${styles.adminActionApprove} ${!isSuperadmin ? styles.adminActionDisabled : ''}`}
                        disabled={!isSuperadmin}
                        title={!isSuperadmin ? 'Solo SUPERADMIN' : 'Aprobar'}
                      >
                        Aprobar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={styles.adminCard}>
          <h3 className={styles.adminCardTitle}>Asignación Manual de Cupos</h3>
          <p className={styles.adminCardSubtitle}>Compensación manual (solo Superadmin).</p>
          {!isSuperadmin && (
            <p className={styles.adminCardSubtitle}>Solo SUPERADMIN puede asignar cupos manuales.</p>
          )}
          <form
            onSubmit={handleAssignQuota}
            className={`${styles.adminForm} ${!isSuperadmin ? styles.adminFormDisabled : ''}`}
          >
            <select
              value={quotaShopId}
              onChange={(e) => setQuotaShopId(e.target.value)}
              className={styles.adminInput}
              disabled={!isSuperadmin}
            >
              <option value="">Seleccionar tienda...</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
            <select
              value={quotaType}
              onChange={(e) => setQuotaType(e.target.value as 'STREAM' | 'REEL')}
              className={styles.adminInput}
              disabled={!isSuperadmin}
            >
              <option value="STREAM">Vivos</option>
              <option value="REEL">Reels</option>
            </select>
            <input
              type="number"
              value={quotaAmount}
              onChange={(e) => setQuotaAmount(parseInt(e.target.value || '0', 10))}
              className={styles.adminInput}
              min={1}
              disabled={!isSuperadmin}
            />
            <Button type="submit" className={styles.adminActionButton} disabled={!isSuperadmin}>
              Asignar Cupos
            </Button>
          </form>
        </div>
      </div>
      <div className={styles.adminCard}>
        <div className={styles.adminToggleRow}>
          <div>
            <h3 className={styles.adminCardTitle}>Actuar como Distrito Moda</h3>
            <p className={styles.adminCardSubtitle}>Publicar vivos y reels oficiales destacados.</p>
          </div>
          <label className={`${styles.adminToggleLabel} ${!isSuperadmin ? styles.adminToggleDisabled : ''}`}>
            <input
              type="checkbox"
              checked={officialMode}
              onChange={() => setOfficialMode(!officialMode)}
              className={styles.adminToggleInput}
              disabled={!isSuperadmin}
            />
            Modo Oficial
          </label>
        </div>
      </div>
      <div className={styles.adminCard}>
        <div className={styles.adminCardHeader}>
          <div>
            <h3 className={styles.adminCardTitle}>Estado del sistema</h3>
            <p className={styles.adminCardSubtitle}>Cron de notificaciones, sanciones y vivos.</p>
          </div>
          <button className={styles.adminUpdateButton} onClick={refreshSystemStatus} disabled={systemStatusLoading}>
            {systemStatusLoading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
        {systemStatusLoading ? (
          <div className={styles.adminPulseRow}>
            <div className={styles.adminPulseLineSm} />
            <div className={styles.adminPulseLineMd} />
            <div className={styles.adminPulseLineLg} />
          </div>
        ) : systemStatus ? (
          <div className={styles.adminInfoGrid}>
            <div className={styles.adminInfoCard}>
              <p className={styles.adminInfoLabel}>Notificaciones</p>
              <p
                className={`${styles.systemState} ${
                  systemStatus.notifications?.enabled ? styles.systemStateOn : styles.systemStateOff
                }`}
              >
                {systemStatus.notifications?.enabled ? 'Activo' : 'Inactivo'}
              </p>
              <p className={styles.adminInfoValue}>
                Intervalo {systemStatus.notifications?.intervalMinutes ?? '-'} min · Ventana{' '}
                {systemStatus.notifications?.windowMinutes ?? '-'} min
              </p>
            </div>
            <div className={styles.adminInfoCard}>
              <p className={styles.adminInfoLabel}>Sanciones</p>
              <p
                className={`${styles.systemState} ${
                  systemStatus.sanctions?.enabled ? styles.systemStateOn : styles.systemStateOff
                }`}
              >
                {systemStatus.sanctions?.enabled ? 'Activo' : 'Inactivo'}
              </p>
              <p className={styles.adminInfoValue}>
                Intervalo {systemStatus.sanctions?.intervalMinutes ?? '-'} min
              </p>
            </div>
            <div className={styles.adminInfoCard}>
              <p className={styles.adminInfoLabel}>Ciclo de vivos</p>
              <p
                className={`${styles.systemState} ${
                  systemStatus.streams?.enabled ? styles.systemStateOn : styles.systemStateOff
                }`}
              >
                {systemStatus.streams?.enabled ? 'Activo' : 'Inactivo'}
              </p>
              <p className={styles.adminInfoValue}>
                Intervalo {systemStatus.streams?.intervalMinutes ?? '-'} min
              </p>
            </div>
            <div className={styles.adminInfoFooter}>
              Entorno: {systemStatus.nodeEnv || '-'} ·{' '}
              {systemStatus.serverTime ? new Date(systemStatus.serverTime).toLocaleString('es-AR') : ''}
            </div>
          </div>
        ) : (
          <p className={styles.adminEmptyText}>Sin datos de sistema.</p>
        )}
      </div>
      <div className={styles.adminCard}>
        <div className={styles.adminCardHeader}>
          <div>
            <h3 className={styles.adminCardTitle}>Ciclo de vivos</h3>
            <p className={styles.adminCardSubtitle}>Arranca y finaliza vivos segun agenda.</p>
          </div>
          <span className={styles.adminActionBadge}>Activo</span>
        </div>
        <Button className={styles.adminActionButton} onClick={runStreamsLifecycle} disabled={streamsLifecycleRunning}>
          {streamsLifecycleRunning ? 'Procesando...' : 'Ejecutar ciclo'}
        </Button>
        {streamsLifecycleSummary && (
          <p className={styles.adminActionNote}>
            Ultima corrida: {streamsLifecycleSummary.started ?? 0} iniciados ·{' '}
            {streamsLifecycleSummary.finished ?? 0} finalizados.
          </p>
        )}
      </div>
      <div className={styles.adminCard}>
        <div className={styles.adminCardHeader}>
          <div>
            <h3 className={styles.adminCardTitle}>Motor de sanciones</h3>
            <p className={styles.adminCardSubtitle}>Ejecuta la corrida del motor (Paso 7).</p>
          </div>
          <span className={styles.adminActionBadge}>Activo</span>
        </div>
        <Button className={styles.adminActionButton} onClick={runSanctions} disabled={sanctionsRunning}>
          {sanctionsRunning ? 'Ejecutando...' : 'Ejecutar motor'}
        </Button>
        {sanctionsSummary && (
          <p className={styles.adminActionNote}>
            Última corrida: {sanctionsSummary.candidates ?? 0} candidatos ·{' '}
            {sanctionsSummary.sanctioned ?? 0} sancionados.
          </p>
        )}
      </div>
      <div className={styles.adminCard}>
        <div className={styles.adminCardHeader}>
          <div>
            <h3 className={styles.adminCardTitle}>Notificaciones</h3>
            <p className={styles.adminCardSubtitle}>Cola y estados del sistema.</p>
          </div>
          <span className={styles.adminActionBadge}>Activo</span>
        </div>
        <Button className={styles.adminActionButton} onClick={runNotifications} disabled={notificationsRunning}>
          {notificationsRunning ? 'Procesando...' : 'Ejecutar cola'}
        </Button>
        {notificationsSummary && (
          <p className={styles.adminActionNote}>
            Última corrida: {notificationsSummary.created ?? 0} creadas ·{' '}
            {notificationsSummary.skipped ?? 0} omitidas.
          </p>
        )}
        <div className={styles.adminTagRow}>
          <select
            value={notificationFilter}
            onChange={(e) => setNotificationFilter(e.target.value)}
            className={styles.notificationFilterSelect}
          >
            <option value="UNREAD">No leídas</option>
            <option value="ALL">Todas</option>
          </select>
          <select
            value={notificationType}
            onChange={(e) => setNotificationType(e.target.value)}
            className={styles.notificationFilterSelect}
          >
            <option value="ALL">Todos los tipos</option>
            <option value="SYSTEM">Sistema</option>
            <option value="REMINDER">Recordatorio</option>
            <option value="PURCHASE">Compra</option>
          </select>
          <button className={styles.notificationRefreshButton} onClick={refreshAdminNotifications}>
            Actualizar
          </button>
        </div>
        <div className={styles.adminNoteList}>
          {notificationsLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className={styles.adminNoteSkeleton}>
                <div className={styles.adminNoteSkeletonLineSm} />
                <div className={styles.adminNoteSkeletonLineMd} />
                <div className={styles.adminNoteSkeletonLineXs} />
              </div>
            ))
          ) : adminNotifications.length === 0 ? (
            <p className={styles.adminNoteEmpty}>No hay notificaciones para mostrar.</p>
          ) : (
            adminNotifications.map((note) => (
              <div key={note.id} className={styles.adminNoteItem}>
                <div className={styles.adminNoteHeader}>
                  <span
                    className={`${styles.notificationTypeBadge} ${
                      note.read ? styles.notificationTypeRead : styles.notificationTypeUnread
                    }`}
                  >
                    {formatNotificationType(note.type)}
                  </span>
                  <span className={styles.adminNoteDate}>{formatNotificationDate(note.createdAt)}</span>
                </div>
                <p
                  className={`${styles.notificationMessage} ${
                    note.read ? styles.notificationMessageRead : styles.notificationMessageUnread
                  }`}
                >
                  {note.message}
                </p>
                <div className={styles.adminNoteFooter}>
                  <span>{note.user?.email || 'Usuario sin email'}</span>
                  {!note.read && (
                    <button className={styles.adminNoteAction} onClick={() => markNotificationRead(note.id)}>
                      Marcar leído
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAdminTab;
