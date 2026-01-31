import React from 'react';
import { Button } from '../Button';
import styles from '../AdminDashboard.module.css';

type AdminReportsTabProps = {
  reportQuery: string;
  setReportQuery: (value: string) => void;
  reportStatusFilter: string;
  setReportStatusFilter: (value: string) => void;
  reportsLoading: boolean;
  filteredReports: any[];
  reports: any[];
  formatReportStatus: (value?: string) => string;
  resolveReportAdmin: (id: string) => Promise<void>;
  rejectReportAdmin: (id: string) => Promise<void>;
  setReports: (next: any[]) => void;
  setNotice: (payload: { title: string; message: string; tone?: 'info' | 'success' | 'warning' | 'error' }) => void;
  setConfirmDialog: (payload: {
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  } | null) => void;
};

const AdminReportsTab: React.FC<AdminReportsTabProps> = ({
  reportQuery,
  setReportQuery,
  reportStatusFilter,
  setReportStatusFilter,
  reportsLoading,
  filteredReports,
  reports,
  formatReportStatus,
  resolveReportAdmin,
  rejectReportAdmin,
  setReports,
  setNotice,
  setConfirmDialog,
}) => {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Reportes</h2>
      <div className={styles.sectionFilters}>
        <input
          type="text"
          placeholder="Buscar vivo o tienda..."
          value={reportQuery}
          onChange={(e) => setReportQuery(e.target.value)}
          className={styles.sectionInput}
        />
        <select
          value={reportStatusFilter}
          onChange={(e) => setReportStatusFilter(e.target.value)}
          className={styles.sectionSelect}
        >
          <option value="ALL">Todos</option>
          <option value="OPEN">Abiertos</option>
          <option value="RESOLVED">Resueltos</option>
          <option value="DISMISSED">Rechazados</option>
        </select>
      </div>
      <div className={styles.tableCard}>
        <div className={styles.tableMobile}>
          {reportsLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className={styles.skeletonItem}>
                <div className={styles.skeletonLineLg} />
                <div className={styles.skeletonLineMd} />
                <div className={styles.skeletonLineFull} />
              </div>
            ))
          ) : filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <div key={report.id} className={styles.listItem}>
                <div>
                  <p className={styles.listTitle}>{report?.stream?.title || report.streamId}</p>
                  <p className={styles.listMeta}>{report?.stream?.shop?.name || 'Sin tienda'}</p>
                </div>
                <div className={`${styles.listRow} ${styles.listRowSmall}`}>
                  <span className={styles.listStatus}>{formatReportStatus(report.status)}</span>
                  <span className={styles.listMeta}>{report.reason || 'Sin motivo'}</span>
                </div>
                <div className={styles.listActionsRight}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await resolveReportAdmin(report.id);
                        const next = reports.filter((item) => item.id !== report.id);
                        setReports(next);
                      } catch (error: any) {
                        setNotice({
                          title: 'Error al resolver',
                          message: error?.message || 'No se pudo resolver el reporte.',
                          tone: 'error',
                        });
                      }
                    }}
                  >
                    Resolver
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setConfirmDialog({
                        title: 'Rechazar reporte',
                        message: 'El reporte quedara marcado como rechazado. Esta accion no se puede deshacer.',
                        confirmLabel: 'Rechazar',
                        onConfirm: async () => {
                          try {
                            await rejectReportAdmin(report.id);
                            const next = reports.filter((item) => item.id !== report.id);
                            setReports(next);
                          } catch (error: any) {
                            setNotice({
                              title: 'Error al rechazar',
                              message: error?.message || 'No se pudo rechazar el reporte.',
                              tone: 'error',
                            });
                          }
                        },
                      });
                    }}
                  >
                    Rechazar
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyText}>Sin reportes abiertos.</div>
          )}
        </div>
        <div className={styles.tableDesktop}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.tableHeadCell}>Vivo</th>
                <th className={styles.tableHeadCell}>Estado</th>
                <th className={styles.tableHeadCell}>Motivo</th>
                <th className={`${styles.tableHeadCell} ${styles.tableHeadCellRight}`}>Acciones</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {reportsLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className={styles.skeletonRow}>
                    <td className={styles.skeletonCell}>
                      <div className={styles.skeletonBlockLg} />
                      <div className={styles.skeletonBlockMd} />
                    </td>
                    <td className={styles.skeletonCell}>
                      <div className={styles.skeletonBlockSm} />
                    </td>
                    <td className={styles.skeletonCell}>
                      <div className={styles.skeletonBlockWide} />
                    </td>
                    <td className={`${styles.skeletonCell} ${styles.tableCellRight}`}>
                      <div className={styles.skeletonBlockButton} />
                    </td>
                  </tr>
                ))
              ) : filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td className={styles.tableCell}>
                      <p className={styles.reportTitle}>{report?.stream?.title || report.streamId}</p>
                      <p className={styles.reportMeta}>{report?.stream?.shop?.name || 'Sin tienda'}</p>
                    </td>
                    <td className={`${styles.tableCell} ${styles.reportStatus}`}>{formatReportStatus(report.status)}</td>
                    <td className={styles.tableCell}>
                      <p className={styles.reportReason}>{report.reason || 'Sin motivo'}</p>
                    </td>
                    <td className={`${styles.tableCell} ${styles.tableCellRight}`}>
                      <div className={styles.tableActions}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await resolveReportAdmin(report.id);
                              const next = reports.filter((item) => item.id !== report.id);
                              setReports(next);
                            } catch (error: any) {
                              setNotice({
                                title: 'Error al resolver',
                                message: error?.message || 'No se pudo resolver el reporte.',
                                tone: 'error',
                              });
                            }
                          }}
                        >
                          Resolver
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setConfirmDialog({
                              title: 'Rechazar reporte',
                              message: 'El reporte quedara marcado como rechazado. Esta accion no se puede deshacer.',
                              confirmLabel: 'Rechazar',
                              onConfirm: async () => {
                                try {
                                  await rejectReportAdmin(report.id);
                                  const next = reports.filter((item) => item.id !== report.id);
                                  setReports(next);
                                } catch (error: any) {
                                  setNotice({
                                    title: 'Error al rechazar',
                                    message: error?.message || 'No se pudo rechazar el reporte.',
                                    tone: 'error',
                                  });
                                }
                              },
                            });
                          }}
                        >
                          Rechazar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className={styles.emptyText}>
                    Sin reportes abiertos.
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

export default AdminReportsTab;
