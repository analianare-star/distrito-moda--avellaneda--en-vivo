import React from "react";
import { EmptyState } from "../../EmptyState";
import styles from "./ClientAccountPage.module.css";

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
      <section className={styles.section} aria-label="Cuenta">
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
    <section className={styles.section} aria-label="Cuenta">
      <div className={styles.card}>
        <h2 className={styles.title}>Cuenta</h2>
        <p className={styles.message}>
          Tu panel de cuenta se muestra en el lateral derecho.
        </p>
      </div>
    </section>
  );
};
