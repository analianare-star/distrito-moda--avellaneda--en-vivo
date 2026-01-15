import React from "react";
import styles from "./ClientLayout.module.css";

// ClientLayout wraps the public/client chrome and content.
// ClientLayout envuelve la interfaz publica/cliente y el contenido.
interface ClientLayoutProps {
  header: React.ReactNode;
  footer: React.ReactNode;
  authModal?: React.ReactNode;
  previewBanner?: React.ReactNode;
  isPreview?: boolean;
  hideChrome?: boolean;
  children: React.ReactNode;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({
  header,
  footer,
  authModal,
  previewBanner,
  isPreview,
  hideChrome,
  children,
}) => {
  return (
    <div className={styles.layout}>
      {!hideChrome && header}
      {!hideChrome && previewBanner}
      <main
        className={`${styles.main} ${isPreview ? styles.mainPreview : ""} ${
          hideChrome ? styles.mainNoChrome : ""
        }`}
      >
        {children}
      </main>
      {!hideChrome && footer}
      {authModal}
    </div>
  );
};
