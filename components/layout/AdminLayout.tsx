import React from "react";
import styles from "./AdminLayout.module.css";

// AdminLayout envuelve header/footer del panel admin.
// AdminLayout wraps the admin header/footer chrome.
interface AdminLayoutProps {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  header,
  footer,
  children,
}) => {
  return (
    <div className={styles.layout}>
      {header}
      <main className={styles.main}>{children}</main>
      {footer}
    </div>
  );
};
