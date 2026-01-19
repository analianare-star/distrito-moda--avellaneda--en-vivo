import { useEffect, useState, type MutableRefObject } from "react";
import {
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  verifyPasswordResetCode,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { api } from "../services/api";

type NoticePayload = {
  title: string;
  message: string;
  tone?: "info" | "success" | "warning" | "error";
};

type UseLoginFlowArgs = {
  isResetView: boolean;
  userIsLoggedIn: boolean;
  setNotice: (payload: NoticePayload) => void;
  setLoginPromptDismissed: (value: boolean) => void;
  setShowLoginPrompt: (value: boolean) => void;
  postLoginRedirect: MutableRefObject<string | null>;
};

export const useLoginFlow = ({
  isResetView,
  userIsLoggedIn,
  setNotice,
  setLoginPromptDismissed,
  setShowLoginPrompt,
  postLoginRedirect,
}: UseLoginFlowArgs) => {
  const [loginMode, setLoginMode] = useState<"GOOGLE" | "EMAIL">("GOOGLE");
  const [loginStep, setLoginStep] = useState<
    "ENTRY" | "AUDIENCE" | "SHOP" | "CLIENT" | "CLIENT_EMAIL"
  >("ENTRY");
  const [clientEmailMode, setClientEmailMode] = useState<"REGISTER" | "LOGIN">(
    "REGISTER"
  );
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [loginAudience, setLoginAudience] = useState<"SHOP" | null>(null);
  const [resetViewStatus, setResetViewStatus] = useState<
    "idle" | "loading" | "ready" | "success" | "error"
  >("idle");
  const [resetViewEmail, setResetViewEmail] = useState("");
  const [resetViewCode, setResetViewCode] = useState("");
  const [resetViewPassword, setResetViewPassword] = useState("");
  const [resetViewConfirm, setResetViewConfirm] = useState("");
  const [resetViewError, setResetViewError] = useState("");
  const [resetViewBusy, setResetViewBusy] = useState(false);

  useEffect(() => {
    if (!isResetView) return;
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const oobCode = params.get("oobCode") || "";
    if (mode !== "resetPassword" || !oobCode) {
      setResetViewStatus("error");
      setResetViewError("El enlace de restablecimiento no es valido.");
      return;
    }
    setResetViewStatus("loading");
    setResetViewCode(oobCode);
    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        setResetViewEmail(email);
        setResetViewStatus("ready");
      })
      .catch(() => {
        setResetViewStatus("error");
        setResetViewError("El enlace esta vencido o es incorrecto.");
      });
  }, [isResetView]);

  const openLoginModal = (
    step: "ENTRY" | "AUDIENCE" | "SHOP" | "CLIENT" | "CLIENT_EMAIL" = "ENTRY"
  ) => {
    setLoginMode("GOOGLE");
    setLoginStep(step);
    setClientEmailMode("REGISTER");
    setLoginError("");
    setLoginAudience(null);
    setLoginPromptDismissed(false);
    setShowLoginPrompt(true);
  };

  const openAudienceSelection = () => {
    setLoginMode("GOOGLE");
    setLoginStep("AUDIENCE");
    setClientEmailMode("REGISTER");
    setLoginError("");
    setLoginAudience(null);
    setLoginPromptDismissed(false);
    setShowLoginPrompt(true);
  };

  const handleGoogleLogin = async () => {
    try {
      setLoginBusy(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error iniciando sesion:", error);
      setLoginError("No se pudo iniciar sesion con Google.");
      setNotice({
        title: "No se pudo iniciar sesion",
        message: "Reintenta con tu cuenta de Google.",
        tone: "error",
      });
    } finally {
      setLoginBusy(false);
    }
  };

  const handleEmailLogin = async (emailInput: string, passwordInput: string) => {
    const email = emailInput.trim().toLowerCase();
    if (!email || !passwordInput) {
      setLoginError("Ingresa tu correo y contrasena.");
      return;
    }
    setLoginBusy(true);
    setLoginError("");
    try {
      const credential = await signInWithEmailAndPassword(auth, email, passwordInput);
      if (loginAudience !== "SHOP" && !credential.user.emailVerified) {
        await signOut(auth);
        const message = "Verifica tu correo para completar el ingreso.";
        setLoginError(message);
        setNotice({
          title: "Verificacion pendiente",
          message,
          tone: "warning",
        });
        return;
      }
    } catch (error: any) {
      const code = error?.code || "";
      const message =
        code === "auth/user-not-found"
          ? "No encontramos una cuenta con ese correo."
          : code === "auth/wrong-password"
          ? "La contrasena es incorrecta."
          : code === "auth/invalid-email"
          ? "El correo no es valido."
          : code === "auth/too-many-requests"
          ? "Se bloquearon intentos por seguridad. Proba mas tarde."
          : "No se pudo iniciar sesion.";
      setLoginError(message);
      setNotice({
        title: "No se pudo iniciar sesion",
        message,
        tone: "error",
      });
    } finally {
      setLoginBusy(false);
    }
  };

  const handleEmailRegister = async (
    emailInput: string,
    passwordInput: string
  ) => {
    const email = emailInput.trim().toLowerCase();
    if (!email || !passwordInput) {
      setLoginError("Ingresa tu correo y una contrasena.");
      return;
    }
    if (passwordInput.length < 6) {
      setLoginError("La contrasena debe tener al menos 6 caracteres.");
      return;
    }
    setLoginBusy(true);
    setLoginError("");
    try {
      const isShopEmail = await api.checkShopEmail(email);
      if (isShopEmail) {
        const message = "Ese correo ya esta registrado como tienda.";
        setLoginError(message);
        setNotice({
          title: "Correo no disponible",
          message,
          tone: "warning",
        });
        return;
      }
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        passwordInput
      );
      await sendEmailVerification(credential.user);
      await signOut(auth);
      setLoginStep("ENTRY");
      setLoginMode("GOOGLE");
      setClientEmailMode("REGISTER");
      setNotice({
        title: "Revisa tu correo",
        message:
          "Te enviamos un enlace para verificar tu cuenta. Mira tambien Spam/Promociones.",
        tone: "success",
      });
    } catch (error: any) {
      const code = error?.code || "";
      const message =
        code === "auth/email-already-in-use"
          ? "Ese correo ya tiene una cuenta."
          : code === "auth/invalid-email"
          ? "El correo no es valido."
          : code === "auth/weak-password"
          ? "La contrasena es muy debil."
          : "No se pudo crear la cuenta.";
      setLoginError(message);
      setNotice({
        title: "No se pudo crear la cuenta",
        message,
        tone: "error",
      });
    } finally {
      setLoginBusy(false);
    }
  };

  const handlePasswordReset = async (emailInput: string) => {
    const email = emailInput.trim().toLowerCase();
    if (!email) {
      setLoginError("Escribi tu correo para restablecer la clave.");
      return;
    }
    setResetBusy(true);
    setLoginError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setNotice({
        title: "Enlace enviado",
        message:
          "Revisa tu correo para restablecer la clave. Mira tambien Spam/Promociones.",
        tone: "success",
      });
    } catch (error: any) {
      const code = error?.code || "";
      const message =
        code === "auth/user-not-found"
          ? "Ese correo no tiene una cuenta creada."
          : code === "auth/invalid-email"
          ? "El correo no es valido."
          : "No se pudo enviar el enlace.";
      setLoginError(message);
      setNotice({
        title: "No se pudo enviar el enlace",
        message,
        tone: "error",
      });
    } finally {
      setResetBusy(false);
    }
  };

  const handleResetViewSubmit = async () => {
    setResetViewError("");
    if (!resetViewCode) {
      setResetViewError("El enlace no es valido.");
      return;
    }
    if (resetViewPassword.length < 6) {
      setResetViewError("La contrasena debe tener al menos 6 caracteres.");
      return;
    }
    if (resetViewPassword !== resetViewConfirm) {
      setResetViewError("Las contrasenas no coinciden.");
      return;
    }
    setResetViewBusy(true);
    try {
      await confirmPasswordReset(auth, resetViewCode, resetViewPassword);
      setResetViewStatus("success");
    } catch (error: any) {
      const code = error?.code || "";
      const message =
        code === "auth/expired-action-code"
          ? "El enlace vencio. Pedi un nuevo restablecimiento."
          : "No se pudo restablecer la clave.";
      setResetViewError(message);
      setResetViewStatus("error");
    } finally {
      setResetViewBusy(false);
    }
  };

  const handleContinueAsGuest = () => {
    setLoginPromptDismissed(true);
    setLoginError("");
    setShowLoginPrompt(false);
    setLoginStep("ENTRY");
    postLoginRedirect.current = null;
  };

  const handleToggleClientLogin = async () => {
    if (userIsLoggedIn) {
      try {
        await signOut(auth);
        setLoginPromptDismissed(false);
        postLoginRedirect.current = null;
      } catch (error) {
        console.error("Error cerrando sesion:", error);
        setNotice({
          title: "Error de sesion",
          message: "No se pudo cerrar la sesion.",
          tone: "error",
        });
      }
      return;
    }
    openLoginModal();
  };

  return {
    loginMode,
    loginStep,
    clientEmailMode,
    loginError,
    loginBusy,
    resetBusy,
    loginAudience,
    resetViewStatus,
    resetViewEmail,
    resetViewPassword,
    resetViewConfirm,
    resetViewError,
    resetViewBusy,
    setLoginMode,
    setLoginStep,
    setClientEmailMode,
    setLoginError,
    setLoginAudience,
    setResetViewPassword,
    setResetViewConfirm,
    openLoginModal,
    openAudienceSelection,
    handleGoogleLogin,
    handleEmailLogin,
    handleEmailRegister,
    handlePasswordReset,
    handleResetViewSubmit,
    handleContinueAsGuest,
    handleToggleClientLogin,
  };
};
