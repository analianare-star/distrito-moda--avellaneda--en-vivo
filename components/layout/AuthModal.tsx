import React from "react";
import { Mail, Key, X } from "lucide-react";
import { FaStore, FaUser, FaEnvelope } from "react-icons/fa";
import styles from "./AuthModal.module.css";

// AuthModal handles login and registration flow in a single dialog.
// AuthModal maneja el flujo de ingreso y registro en un solo dialogo.
interface AuthModalProps {
  isOpen: boolean;
  loginStep: "ENTRY" | "AUDIENCE" | "SHOP" | "CLIENT" | "CLIENT_EMAIL";
  clientEmailMode: "REGISTER" | "LOGIN";
  loginError: string;
  loginBusy: boolean;
  resetBusy: boolean;
  onClose: () => void;
  onContinueAsGuest: () => void;
  onOpenAudienceSelection: () => void;
  onEmailLogin: (email: string, password: string) => void;
  onEmailRegister: (email: string, password: string) => void;
  onGoogleLogin: () => void;
  onPasswordReset: (email: string) => void;
  onSetLoginStep: (value: "ENTRY" | "AUDIENCE" | "SHOP" | "CLIENT" | "CLIENT_EMAIL") => void;
  onSetLoginMode: (value: "GOOGLE" | "EMAIL") => void;
  onSetLoginAudience: (value: "SHOP" | null) => void;
  onSetClientEmailMode: (value: "REGISTER" | "LOGIN") => void;
  onSetLoginError: (value: string) => void;
}

const GoogleMark = () => (
  <svg viewBox="0 0 48 48" className="h-7 w-7" aria-hidden>
    <path
      fill="#EA4335"
      d="M24 9.5c3.3 0 6.3 1.2 8.7 3.5l6.5-6.5C35.3 2.7 30 0.5 24 0.5 14.6 0.5 6.4 5.9 2.5 13.7l7.6 5.9C12 13.2 17.5 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.5 24.5c0-1.8-0.2-3.1-0.5-4.5H24v8.5h12.6c-0.3 2.1-1.8 5.3-5.2 7.5l8 6.2c4.7-4.4 7.1-10.8 7.1-17.7z"
    />
    <path
      fill="#FBBC05"
      d="M10.1 28.7c-0.5-1.4-0.8-2.9-0.8-4.5s0.3-3.1 0.7-4.5l-7.6-5.9C0.9 17.1 0 20.5 0 24c0 3.5 0.9 6.9 2.5 10.2l7.6-5.5z"
    />
    <path
      fill="#34A853"
      d="M24 48c6 0 11.3-2 15.1-5.5l-8-6.2c-2.1 1.4-4.9 2.3-7.1 2.3-6.5 0-12-3.8-13.9-9.4l-7.6 5.5C6.4 42.1 14.6 48 24 48z"
    />
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  loginStep,
  clientEmailMode,
  loginError,
  loginBusy,
  resetBusy,
  onClose,
  onContinueAsGuest,
  onOpenAudienceSelection,
  onEmailLogin,
  onEmailRegister,
  onGoogleLogin,
  onPasswordReset,
  onSetLoginStep,
  onSetLoginMode,
  onSetLoginAudience,
  onSetClientEmailMode,
  onSetLoginError,
}) => {
  if (!isOpen) return null;
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  React.useEffect(() => {
    setEmail("");
    setPassword("");
  }, [clientEmailMode, isOpen, loginStep]);

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <p className={styles.title}>Ingreso</p>
            <p className={styles.subtitle}>
              Accede a recordatorios, favoritos y reportes.
            </p>
          </div>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Cerrar"
          >
            <X size={12} />
          </button>
        </div>

        {loginStep === "ENTRY" && (
          <div className={styles.stack}>
            <button
              onClick={() => onSetLoginStep("AUDIENCE")}
              className={styles.primaryButton}
            >
              Ingresar
            </button>
            <button onClick={onOpenAudienceSelection} className={styles.linkButton}>
              Registrarme
            </button>
          </div>
        )}

        {loginStep === "AUDIENCE" && (
          <div className={styles.roleGrid}>
            <button
              onClick={() => {
                onSetLoginMode("EMAIL");
                onSetLoginAudience("SHOP");
                onSetClientEmailMode("LOGIN");
                onSetLoginError("");
                onSetLoginStep("SHOP");
              }}
              className={styles.roleButton}
            >
              <FaStore size={22} className="mb-2 text-dm-crimson" />
              Soy tienda
              <span className={styles.roleNote}>Acceso mayorista</span>
            </button>
            <button
              onClick={() => {
                onSetLoginMode("GOOGLE");
                onSetLoginAudience(null);
                onSetLoginError("");
                onSetLoginStep("CLIENT");
              }}
              className={styles.roleButton}
            >
              <FaUser size={22} className="mb-2 text-dm-crimson" />
              Soy cliente
              <span className={styles.roleNote}>Comprar y seguir</span>
            </button>
          </div>
        )}

        {loginStep === "SHOP" && (
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              onEmailLogin(email, password);
            }}
          >
            <p className={styles.formHint}>
              Usá el correo registrado por el administrador.
            </p>
            <label className={styles.label}>
              Correo electrónico
              <div className={styles.inputWrap}>
                <Mail size={14} className="text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={styles.input}
                  placeholder="correo de la tienda"
                  autoComplete="email"
                  required
                />
              </div>
            </label>
            <label className={styles.label}>
              Contraseña
              <div className={styles.inputWrap}>
                <Key size={14} className="text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={styles.input}
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
                  required
                />
              </div>
            </label>
            {loginError && <p className={styles.errorText}>{loginError}</p>}
            <button
              type="submit"
              disabled={loginBusy}
              className={styles.primaryButton}
            >
              {loginBusy ? "Ingresando..." : "Ingresar"}
            </button>
            <button
              type="button"
              disabled={resetBusy}
              onClick={() => onPasswordReset(email)}
              className={styles.secondaryButton}
            >
              {resetBusy ? "Enviando enlace..." : "Olvidé mi contraseña"}
            </button>
            <button
              type="button"
              onClick={() => onSetLoginStep("AUDIENCE")}
              className={styles.backButton}
            >
              Volver
            </button>
          </form>
        )}

        {loginStep === "CLIENT" && (
          <div className={styles.clientStack}>
            <div className={styles.clientGrid}>
              <button
                onClick={onGoogleLogin}
                disabled={loginBusy}
                className={styles.clientOption}
              >
                <span className={styles.googleIcon}>
                  <GoogleMark />
                </span>
                Continuar con tu cuenta de Google
              </button>
              <button
                onClick={() => {
                  onSetLoginMode("EMAIL");
                  onSetLoginAudience(null);
                  onSetClientEmailMode("LOGIN");
                  onSetLoginError("");
                  onSetLoginStep("CLIENT_EMAIL");
                }}
                className={styles.clientOption}
              >
                <span className={styles.mailIcon}>
                  <FaEnvelope size={18} />
                </span>
                Continuá con tu correo
              </button>
            </div>
            <button
              onClick={() => {
                onSetLoginMode("EMAIL");
                onSetLoginAudience(null);
                onSetClientEmailMode("REGISTER");
                onSetLoginError("");
                onSetLoginStep("CLIENT_EMAIL");
              }}
              className={styles.linkButton}
            >
              Registrate
            </button>
            {loginError && <p className={styles.errorText}>{loginError}</p>}
            <button
              type="button"
              onClick={() => onSetLoginStep("AUDIENCE")}
              className={styles.backButton}
            >
              Volver
            </button>
          </div>
        )}

        {loginStep === "CLIENT_EMAIL" && (
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              if (clientEmailMode === "REGISTER") {
                onEmailRegister(email, password);
              } else {
                onEmailLogin(email, password);
              }
            }}
          >
            <p className={styles.formHint}>
              {clientEmailMode === "REGISTER"
                ? "Creando cuenta de cliente."
                : "Ingresá con tu correo."}
            </p>
            <label className={styles.label}>
              Correo electrónico
              <div className={styles.inputWrap}>
                <Mail size={14} className="text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={styles.input}
                  placeholder="tu@email.com"
                  autoComplete="email"
                  required
                />
              </div>
            </label>
            <label className={styles.label}>
              Contraseña
              <div className={styles.inputWrap}>
                <Key size={14} className="text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={styles.input}
                  placeholder="Tu contraseña"
                  autoComplete={
                    clientEmailMode === "REGISTER"
                      ? "new-password"
                      : "current-password"
                  }
                  required
                />
              </div>
            </label>
            {loginError && <p className={styles.errorText}>{loginError}</p>}
            <button
              type="submit"
              disabled={loginBusy}
              className={styles.primaryButton}
            >
              {loginBusy
                ? clientEmailMode === "REGISTER"
                  ? "Creando cuenta..."
                  : "Ingresando..."
                : clientEmailMode === "REGISTER"
                ? "Registrarme"
                : "Ingresar"}
            </button>
            {clientEmailMode === "LOGIN" && (
              <button
                type="button"
                disabled={resetBusy}
                onClick={() => onPasswordReset(email)}
                className={styles.secondaryButton}
              >
                {resetBusy ? "Enviando enlace..." : "Olvidé mi contraseña"}
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                onSetClientEmailMode(
                  clientEmailMode === "REGISTER" ? "LOGIN" : "REGISTER"
                )
              }
              className={styles.inlineLink}
            >
              {clientEmailMode === "REGISTER"
                ? "¿Ya tenés cuenta? Iniciá sesión"
                : "Quiero registrarme"}
            </button>
            <button
              type="button"
              onClick={() => onSetLoginStep("CLIENT")}
              className={styles.backButton}
            >
              Volver
            </button>
          </form>
        )}

        <button onClick={onContinueAsGuest} className={styles.continueGuest}>
          Continuar como visitante
        </button>
      </div>
    </div>
  );
};
