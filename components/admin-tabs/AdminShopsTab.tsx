import React from 'react';
import { Plus, Eye } from 'lucide-react';
import { Button } from '../Button';
import styles from '../AdminDashboard.module.css';

type AdminShopsTabProps = {
  shopFilter: string;
  setShopFilter: (value: string) => void;
  shopQuery: string;
  setShopQuery: (value: string) => void;
  pendingShops: any[];
  filteredShops: any[];
  formatShopStatus: (value?: string) => string;
  formatIntegrity: (value?: string) => string;
  togglePenalty: (shopId: string) => void;
  activateShop: (shopId: string) => void;
  rejectShop: (shopId: string) => void;
  resetPassword: (shopId: string) => void;
  suspendAgenda: (shopId: string) => void;
  liftSuspension: (shopId: string) => void;
  assignOwner: (shopId: string) => void;
  openEditShop: (shop: any) => void;
  onPreviewShop: (shopId: string) => void;
  deleteShop: (shop: any) => void;
  openCreateModal: () => void;
  onPreviewClient: () => void;
};

const AdminShopsTab: React.FC<AdminShopsTabProps> = ({
  shopFilter,
  setShopFilter,
  shopQuery,
  setShopQuery,
  pendingShops,
  filteredShops,
  formatShopStatus,
  formatIntegrity,
  togglePenalty,
  activateShop,
  rejectShop,
  resetPassword,
  suspendAgenda,
  liftSuspension,
  assignOwner,
  openEditShop,
  onPreviewShop,
  deleteShop,
  openCreateModal,
  onPreviewClient,
}) => {
  return (
    <div className={styles.section}>
      <div className={styles.shopsHeader}>
        <h2 className={styles.sectionTitle}>Tiendas</h2>
        <div className={styles.shopsActions}>
          <button
            onClick={() =>
              setShopFilter(shopFilter === 'PENDING_VERIFICATION' ? 'ALL' : 'PENDING_VERIFICATION')
            }
            className={`${styles.shopFilterButton} ${
              shopFilter === 'PENDING_VERIFICATION' ? styles.shopFilterActive : styles.shopFilterInactive
            }`}
          >
            Pendientes ({pendingShops.length})
          </button>
          <Button onClick={openCreateModal} className={styles.adminPrimaryButton}>
            <Plus size={18} className={styles.buttonIcon} /> Nueva Tienda
          </Button>
          <Button variant="outline" onClick={onPreviewClient} className={styles.adminOutlineButton}>
            <Eye size={16} className={styles.buttonIcon} /> Ver como cliente
          </Button>
        </div>
      </div>
      <div className={styles.sectionFilters}>
        <input
          type="text"
          placeholder="Buscar tienda..."
          value={shopQuery}
          onChange={(e) => setShopQuery(e.target.value)}
          className={styles.sectionInput}
        />
        <select
          value={shopFilter}
          onChange={(e) => setShopFilter(e.target.value)}
          className={styles.sectionSelect}
        >
          <option value="ALL">Todos los estados</option>
          <option value="PENDING_VERIFICATION">Pendientes</option>
          <option value="ACTIVE">Activas</option>
          <option value="AGENDA_SUSPENDED">Suspendidas</option>
          <option value="HIDDEN">Ocultas</option>
          <option value="BANNED">Bloqueadas</option>
        </select>
      </div>
      <div className={styles.tableCard}>
        <div className={styles.tableMobile}>
          {filteredShops.length > 0 ? (
            filteredShops.map((shop) => {
              const status = shop.status || 'ACTIVE';
              return (
                <div key={shop.id} className={styles.shopCard}>
                  <div className={styles.shopHeader}>
                    <div>
                      <p className={styles.shopName}>{shop.name}</p>
                      <p className={styles.shopPlan}>{shop.plan}</p>
                    </div>
                    <span
                      className={`${styles.shopStatusBadge} ${
                        status === 'ACTIVE'
                          ? styles.shopStatusActive
                          : status === 'PENDING_VERIFICATION'
                          ? styles.shopStatusPending
                          : status === 'AGENDA_SUSPENDED'
                          ? styles.shopStatusSuspended
                          : styles.shopStatusBlocked
                      }`}
                    >
                      {formatShopStatus(status)}
                    </span>
                  </div>
                  <div className={`${styles.listRow} ${styles.listMeta}`}>
                    <span>Integridad</span>
                    <span
                      className={`${styles.integrityBadge} ${
                        shop.dataIntegrity === 'COMPLETE'
                          ? styles.integrityComplete
                          : shop.dataIntegrity === 'MINIMAL'
                          ? styles.integrityMinimal
                          : styles.integrityMissing
                      }`}
                    >
                      {formatIntegrity(shop.dataIntegrity)}
                    </span>
                  </div>
                  <div className={`${styles.listRow} ${styles.listMeta}`}>
                    <span>Penalización</span>
                    <button
                      onClick={() => togglePenalty(shop.id)}
                      className={`${styles.penaltyButton} ${
                        shop.isPenalized ? styles.penaltyActive : styles.penaltyInactive
                      }`}
                    >
                      {shop.isPenalized ? 'ACTIVA' : 'No'}
                    </button>
                  </div>
                  <div className={styles.listActions}>
                    {status === 'PENDING_VERIFICATION' && (
                      <>
                        <button onClick={() => activateShop(shop.id)} className={`${styles.tinyButton} ${styles.tinySuccess}`}>
                          Activar
                        </button>
                        <button onClick={() => rejectShop(shop.id)} className={`${styles.tinyButton} ${styles.tinyDanger}`}>
                          Rechazar
                        </button>
                        <button onClick={() => resetPassword(shop.id)} className={`${styles.tinyButton} ${styles.tinyNeutral}`}>
                          Restablecer clave
                        </button>
                      </>
                    )}
                    {status === 'ACTIVE' && (
                      <>
                        <button onClick={() => suspendAgenda(shop.id)} className={`${styles.tinyButton} ${styles.tinyWarn}`}>
                          Suspender Agenda
                        </button>
                        <button onClick={() => resetPassword(shop.id)} className={`${styles.tinyButton} ${styles.tinyNeutral}`}>
                          Restablecer clave
                        </button>
                      </>
                    )}
                    {status === 'AGENDA_SUSPENDED' && (
                      <>
                        <button onClick={() => liftSuspension(shop.id)} className={`${styles.tinyButton} ${styles.tinyInfo}`}>
                          Levantar Sanción
                        </button>
                        <button onClick={() => resetPassword(shop.id)} className={`${styles.tinyButton} ${styles.tinyNeutral}`}>
                          Restablecer clave
                        </button>
                      </>
                    )}
                    {(status === 'HIDDEN' || status === 'BANNED') && (
                      <>
                        <button onClick={() => activateShop(shop.id)} className={`${styles.tinyButton} ${styles.tinySuccess}`}>
                          Reactivar
                        </button>
                        <button onClick={() => resetPassword(shop.id)} className={`${styles.tinyButton} ${styles.tinyNeutral}`}>
                          Restablecer clave
                        </button>
                      </>
                    )}
                    <button onClick={() => assignOwner(shop.id)} className={`${styles.tinyButton} ${styles.tinyIndigo}`}>
                      Asignar dueño
                    </button>
                    <button onClick={() => openEditShop(shop)} className={`${styles.tinyButton} ${styles.tinyOutline}`}>
                      Editar datos
                    </button>
                    <button onClick={() => onPreviewShop(shop.id)} className={`${styles.tinyButton} ${styles.tinyOutline}`}>
                      Ver como tienda
                    </button>
                    <button onClick={() => deleteShop(shop)} className={`${styles.tinyButton} ${styles.tinyDanger}`}>
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.emptyText}>Sin resultados.</div>
          )}
        </div>
        <div className={styles.tableDesktop}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.tableHeadCell}>Tienda</th>
                <th className={styles.tableHeadCell}>Plan</th>
                <th className={styles.tableHeadCell}>Estado</th>
                <th className={styles.tableHeadCell}>Integridad</th>
                <th className={styles.tableHeadCell}>Penalización</th>
                <th className={`${styles.tableHeadCell} ${styles.tableHeadCellRight}`}>Acciones</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {filteredShops.length > 0 ? (
                filteredShops.map((shop) => {
                  const status = shop.status || 'ACTIVE';
                  return (
                    <tr key={shop.id}>
                      <td className={`${styles.tableCell} ${styles.tableTitle}`}>{shop.name}</td>
                      <td className={styles.tableCell}>{shop.plan}</td>
                      <td className={styles.tableCell}>
                        <span
                          className={`${styles.shopStatusBadge} ${
                            status === 'ACTIVE'
                              ? styles.shopStatusActive
                              : status === 'PENDING_VERIFICATION'
                              ? styles.shopStatusPending
                              : status === 'AGENDA_SUSPENDED'
                              ? styles.shopStatusSuspended
                              : styles.shopStatusBlocked
                          }`}
                        >
                          {formatShopStatus(status)}
                        </span>
                      </td>
                      <td className={styles.tableCell}>
                        <span
                          className={`${styles.integrityBadge} ${
                            shop.dataIntegrity === 'COMPLETE'
                              ? styles.integrityComplete
                              : shop.dataIntegrity === 'MINIMAL'
                              ? styles.integrityMinimal
                              : styles.integrityMissing
                          }`}
                        >
                          {formatIntegrity(shop.dataIntegrity)}
                        </span>
                      </td>
                      <td className={styles.tableCell}>
                        <button
                          onClick={() => togglePenalty(shop.id)}
                          className={`${styles.penaltyButton} ${
                            shop.isPenalized ? styles.penaltyActive : styles.penaltyInactive
                          }`}
                        >
                          {shop.isPenalized ? 'ACTIVA' : 'No'}
                        </button>
                      </td>
                      <td className={`${styles.tableCell} ${styles.tableCellRight}`}>
                        <div className={styles.tableActions}>
                          {status === 'PENDING_VERIFICATION' && (
                            <>
                              <button onClick={() => activateShop(shop.id)} className={`${styles.tinyButton} ${styles.tinySuccess}`}>
                                Activar
                              </button>
                              <button onClick={() => rejectShop(shop.id)} className={`${styles.tinyButton} ${styles.tinyDanger}`}>
                                Rechazar
                              </button>
                              <button onClick={() => resetPassword(shop.id)} className={`${styles.tinyButton} ${styles.tinyNeutral}`}>
                                Restablecer clave
                              </button>
                            </>
                          )}
                          {status === 'ACTIVE' && (
                            <>
                              <button onClick={() => suspendAgenda(shop.id)} className={`${styles.tinyButton} ${styles.tinyWarn}`}>
                                Suspender Agenda
                              </button>
                              <button onClick={() => resetPassword(shop.id)} className={`${styles.tinyButton} ${styles.tinyNeutral}`}>
                                Restablecer clave
                              </button>
                            </>
                          )}
                          {status === 'AGENDA_SUSPENDED' && (
                            <>
                              <button onClick={() => liftSuspension(shop.id)} className={`${styles.tinyButton} ${styles.tinyInfo}`}>
                                Levantar Sanción
                              </button>
                              <button onClick={() => resetPassword(shop.id)} className={`${styles.tinyButton} ${styles.tinyNeutral}`}>
                                Restablecer clave
                              </button>
                            </>
                          )}
                          {(status === 'HIDDEN' || status === 'BANNED') && (
                            <>
                              <button onClick={() => activateShop(shop.id)} className={`${styles.tinyButton} ${styles.tinySuccess}`}>
                                Reactivar
                              </button>
                              <button onClick={() => resetPassword(shop.id)} className={`${styles.tinyButton} ${styles.tinyNeutral}`}>
                                Restablecer clave
                              </button>
                            </>
                          )}
                          <button onClick={() => assignOwner(shop.id)} className={`${styles.tinyButton} ${styles.tinyIndigo}`}>
                            Asignar dueño
                          </button>
                          <button onClick={() => openEditShop(shop)} className={`${styles.tinyButton} ${styles.tinyOutline}`}>
                            Editar datos
                          </button>
                          <button onClick={() => onPreviewShop(shop.id)} className={`${styles.tinyButton} ${styles.tinyOutline}`}>
                            Ver como tienda
                          </button>
                          <button onClick={() => deleteShop(shop)} className={`${styles.tinyButton} ${styles.tinyDanger}`}>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className={styles.emptyText}>
                    Sin resultados.
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

export default AdminShopsTab;
