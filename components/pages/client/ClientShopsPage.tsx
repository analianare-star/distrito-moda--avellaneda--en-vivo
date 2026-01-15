import React from "react";
import { Search } from "lucide-react";
import { EmptyState } from "../../EmptyState";
import { Shop } from "../../../types";
import styles from "./ClientShopsPage.module.css";

// ClientShopsPage muestra buscador y listado de tiendas.
// ClientShopsPage renders shop search and list.
interface ClientShopsPageProps {
  shopQuery: string;
  filteredPublicShops: Shop[];
  renderShopCard: (shop: Shop) => React.ReactNode;
  onShopQueryChange: (value: string) => void;
  onClearShopQuery: () => void;
  onRefreshData: () => void;
}

export const ClientShopsPage: React.FC<ClientShopsPageProps> = ({
  shopQuery,
  filteredPublicShops,
  renderShopCard,
  onShopQueryChange,
  onClearShopQuery,
  onRefreshData,
}) => {
  return (
    <section aria-label="Listado de tiendas">
      <div className={styles.listWrap}>
        <div className={styles.searchSticky}>
          <div className={styles.searchBar}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="search"
              value={shopQuery}
              onChange={(event) => onShopQueryChange(event.target.value)}
              placeholder="Buscar tiendas, zonas o rubros"
              className={styles.searchInput}
            />
            {shopQuery && (
              <button
                onClick={onClearShopQuery}
                className={styles.clearButton}
              >
                Borrar
              </button>
            )}
          </div>
        </div>
        <div className={styles.listHeader}>
          <h2 className={styles.listTitle}>Tiendas</h2>
          <div className={styles.listCount}>
            {filteredPublicShops.length} registradas
          </div>
        </div>
        <div className={styles.shopsGrid}>
          {filteredPublicShops.map((shop) => renderShopCard(shop))}
          {filteredPublicShops.length === 0 && (
            <EmptyState
              title="Aún no hay tiendas publicadas"
              message="Volvé más tarde o refrescá la lista."
              actionLabel="Actualizar"
              onAction={onRefreshData}
            />
          )}
        </div>
      </div>
    </section>
  );
};
