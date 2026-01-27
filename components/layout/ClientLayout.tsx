import React from "react";
import styles from "./ClientLayout.module.css";

// ClientLayout wraps the public/client chrome and content.
// ClientLayout envuelve la interfaz publica/cliente y el contenido.
interface ClientLayoutProps {
  header: React.ReactNode;
  headerAccessory?: React.ReactNode;
  footer: React.ReactNode;
  authModal?: React.ReactNode;
  previewBanner?: React.ReactNode;
  isPreview?: boolean;
  hideChrome?: boolean;
  compactDesktop?: boolean;
  children: React.ReactNode;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({
  header,
  headerAccessory,
  footer,
  authModal,
  previewBanner,
  isPreview,
  hideChrome,
  compactDesktop,
  children,
}) => {
  return (
    <div className={styles.layout}>
      {!hideChrome && header}
      {!hideChrome && previewBanner}
      {!hideChrome && headerAccessory}
      <main
        className={`${styles.main} ${isPreview ? styles.mainPreview : ""} ${
          hideChrome ? styles.mainNoChrome : ""
        } ${compactDesktop ? styles.mainDesktopCompact : ""}`}
      >
        {children}
      </main>
      {!hideChrome && footer}
      {authModal}
    </div>
  );
};
