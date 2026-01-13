import React from "react";
import styles from "./MerchantLayout.module.css";

// MerchantLayout wraps the shop header/footer chrome.
// MerchantLayout envuelve el header/footer de tienda.
interface MerchantLayoutProps {
  header: React.ReactNode;
  footer: React.ReactNode;
  previewBanner?: React.ReactNode;
  children: React.ReactNode;
}

export const MerchantLayout: React.FC<MerchantLayoutProps> = ({
  header,
  footer,
  previewBanner,
  children,
}) => {
  return (
    <div className={styles.layout}>
      {header}
      {previewBanner}
      <main className={styles.main}>{children}</main>
      {footer}
    </div>
  );
};
