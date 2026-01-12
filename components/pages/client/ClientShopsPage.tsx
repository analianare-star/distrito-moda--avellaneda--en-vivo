import React from "react";
import { Search } from "lucide-react";
import { EmptyState } from "../../EmptyState";
import { Shop } from "../../../types";

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
      <div className="mx-auto max-w-3xl px-4 pt-4 md:pt-6">
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
          <Search size={16} className="text-gray-400" />
          <input
            type="search"
            value={shopQuery}
            onChange={(event) => onShopQueryChange(event.target.value)}
            placeholder="Buscar tiendas, zonas o rubros"
            className="w-full text-sm font-semibold text-dm-dark outline-none placeholder:text-gray-400"
          />
          {shopQuery && (
            <button
              onClick={onClearShopQuery}
              className="text-[11px] font-semibold text-gray-400 hover:text-dm-crimson"
            >
              Borrar
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-3xl text-dm-dark">Tiendas</h2>
          <div className="text-sm font-sans text-gray-500">
            {filteredPublicShops.length} registradas
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
