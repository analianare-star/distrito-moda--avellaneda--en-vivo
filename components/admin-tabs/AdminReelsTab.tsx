import React from 'react';
import styles from '../AdminDashboard.module.css';

type AdminReelsTabProps = {
  reels: Array<{
    id: string;
    shopLogo?: string;
    shopName?: string;
    createdAtISO: string;
    platform: string;
    status: string;
    views?: number;
    origin?: string;
  }>;
  formatReelStatus: (value?: string) => string;
  toggleReelHide: (reel: any) => void;
};

const AdminReelsTab: React.FC<AdminReelsTabProps> = ({
  reels,
  formatReelStatus,
  toggleReelHide,
}) => {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Control de Reels</h2>
      <div className={styles.tableCard}>
        <div className={styles.tableMobile}>
          {reels.map((reel) => (
            <div key={reel.id} className={styles.reelRow}>
              <div className={styles.reelHeader}>
                <div className={styles.reelShop}>
                  <div className={styles.reelAvatar}>
                    <img
                      src={reel.shopLogo}
                      alt={reel.shopName}
                      loading="lazy"
                      decoding="async"
                      className={styles.reelAvatarImg}
                    />
                  </div>
                  <div>
                    <p className={styles.reelShopName}>{reel.shopName}</p>
                    <p className={styles.reelDate}>
                      {new Date(reel.createdAtISO).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={styles.reelPlatform}>{reel.platform}</span>
              </div>
              <div className={styles.reelStats}>
                <span
                  className={`${styles.reelStatusBadge} ${
                    reel.status === 'ACTIVE'
                      ? styles.reelStatusActive
                      : reel.status === 'EXPIRED'
                      ? styles.reelStatusExpired
                      : styles.reelStatusHidden
                  }`}
                >
                  {formatReelStatus(reel.status)}
                </span>
                <span className={styles.reelViews}>{reel.views || 0} vistas</span>
              </div>
              <div className={styles.reelFooter}>
                {reel.origin === 'EXTRA' && <span className={styles.reelExtra}>EXTRA</span>}
                <button
                  onClick={() => toggleReelHide(reel)}
                  className={`${styles.reelToggleButton} ${
                    reel.status === 'HIDDEN' ? styles.reelToggleOn : styles.reelToggleOff
                  }`}
                >
                  {reel.status === 'HIDDEN' ? 'Reactivar' : 'Ocultar'}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.tableDesktop}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.tableHeadCell}>Tienda</th>
                <th className={styles.tableHeadCell}>Plataforma</th>
                <th className={styles.tableHeadCell}>Estado</th>
                <th className={styles.tableHeadCell}>Vistas</th>
                <th className={`${styles.tableHeadCell} ${styles.tableHeadCellRight}`}>Acciones</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {reels.map((reel) => (
                <tr key={reel.id}>
                  <td className={styles.tableCell}>
                    <div className={styles.reelShop}>
                      <div className={styles.reelAvatar}>
                        <img
                          src={reel.shopLogo}
                          alt={reel.shopName}
                          loading="lazy"
                          decoding="async"
                          className={styles.reelAvatarImg}
                        />
                      </div>
                      <div>
                        <p className={styles.reelShopName}>{reel.shopName}</p>
                        <p className={styles.reportMeta}>
                          {new Date(reel.createdAtISO).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className={styles.tableCell}>{reel.platform}</td>
                  <td className={styles.tableCell}>
                    <span
                      className={`${styles.reelStatusBadge} ${
                        reel.status === 'ACTIVE'
                          ? styles.reelStatusActive
                          : reel.status === 'EXPIRED'
                          ? styles.reelStatusExpired
                          : styles.reelStatusHidden
                      }`}
                    >
                      {formatReelStatus(reel.status)}
                    </span>
                    {reel.origin === 'EXTRA' && <span className={styles.reelExtra}>EXTRA</span>}
                  </td>
                  <td className={styles.tableCell}>{reel.views || 0}</td>
                  <td className={`${styles.tableCell} ${styles.tableCellRight}`}>
                    <button
                      onClick={() => toggleReelHide(reel)}
                      className={`${styles.reelToggleButton} ${
                        reel.status === 'HIDDEN' ? styles.reelToggleOn : styles.reelToggleOff
                      }`}
                    >
                      {reel.status === 'HIDDEN' ? 'Reactivar' : 'Ocultar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReelsTab;
