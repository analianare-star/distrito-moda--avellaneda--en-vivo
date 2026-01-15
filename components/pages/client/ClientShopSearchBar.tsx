import React from "react";
import { Search } from "lucide-react";
import styles from "./ClientShopsPage.module.css";

// ClientShopSearchBar fija el buscador bajo el header.
// ClientShopSearchBar pins the search bar under the header.
interface ClientShopSearchBarProps {
  shopQuery: string;
  onShopQueryChange: (value: string) => void;
  onClearShopQuery: () => void;
}

export const ClientShopSearchBar: React.FC<ClientShopSearchBarProps> = ({
  shopQuery,
  onShopQueryChange,
  onClearShopQuery,
}) => {
  return (
    <div className={styles.searchSticky} role="search" aria-label="Buscar tiendas">
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
  );
};
