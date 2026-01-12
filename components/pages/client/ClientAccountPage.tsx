import React from "react";
import { EmptyState } from "../../EmptyState";

// ClientAccountPage resume acceso a cuenta y panel.
// ClientAccountPage summarizes account access and panel.
interface ClientAccountPageProps {
  isLoggedIn: boolean;
  onRequireLogin: () => void;
}

export const ClientAccountPage: React.FC<ClientAccountPageProps> = ({
  isLoggedIn,
  onRequireLogin,
}) => {
  if (!isLoggedIn) {
    return (
      <section className="max-w-3xl mx-auto px-4 py-10" aria-label="Cuenta">
        <EmptyState
          title="Ingresá para ver tu cuenta"
          message="Accedé a recordatorios, notificaciones y favoritos."
          actionLabel="Ingresar"
          onAction={onRequireLogin}
        />
      </section>
    );
  }

  return (
    <section className="max-w-3xl mx-auto px-4 py-10" aria-label="Cuenta">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-2xl text-dm-dark">Cuenta</h2>
        <p className="mt-2 text-sm text-gray-500">
          Tu panel de cuenta se muestra en el lateral derecho.
        </p>
      </div>
    </section>
  );
};
