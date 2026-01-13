import React from "react";
import { Shield, Key, X } from "lucide-react";
import styles from "./ResetView.module.css";

// ResetView renders the password reset screen for Firebase links.
// ResetView muestra la pantalla de restablecimiento para enlaces Firebase.
interface ResetViewProps {
  status: "idle" | "loading" | "ready" | "success" | "error";
  email: string;
  password: string;
  confirm: string;
  error: string;
  busy: boolean;
  onClose: () => void;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  onSubmit: () => void;
}

export const ResetView: React.FC<ResetViewProps> = ({
  status,
  email,
  password,
  confirm,
  error,
  busy,
  onClose,
  onPasswordChange,
  onConfirmChange,
  onSubmit,
}) => {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <Shield size={18} className="text-dm-crimson" />
            <p className={styles.title}>Restablecer clave</p>
          </div>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Volver al inicio"
          >
            <X size={12} />
          </button>
        </div>
        <p className={styles.sub}>
          {email ? `Cuenta: ${email}` : "Validando enlace..."}
        </p>

        {status === "loading" && (
          <div className={`${styles.box} ${styles.boxNeutral}`}>
            Verificando enlace...
          </div>
        )}

        {status === "error" && (
          <div className={`${styles.box} ${styles.boxError}`}>
            {error || "No se pudo validar el enlace."}
          </div>
        )}

        {status === "success" && (
          <div className={`${styles.box} ${styles.boxSuccess}`}>
            Tu contraseña se actualizó correctamente. Ya podés iniciar sesión.
            <button onClick={onClose} className={styles.primaryButton}>
              Ir a iniciar sesión
            </button>
          </div>
        )}

        {status === "ready" && (
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <label className={styles.label}>
              Nueva contraseña
              <div className={styles.inputWrap}>
                <Key size={14} className="text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  className={styles.input}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
            </label>
            <label className={styles.label}>
              Repetí la contraseña
              <div className={styles.inputWrap}>
                <Key size={14} className="text-gray-400" />
                <input
                  type="password"
                  value={confirm}
                  onChange={(event) => onConfirmChange(event.target.value)}
                  className={styles.input}
                  placeholder="Confirmá la clave"
                  required
                />
              </div>
            </label>
            {error && <p className={styles.errorText}>{error}</p>}
            <button type="submit" disabled={busy} className={styles.submit}>
              {busy ? "Guardando..." : "Guardar contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
