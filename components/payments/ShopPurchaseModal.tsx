import React, { useEffect, useMemo, useRef, useState } from "react";
import { Film, ShoppingCart, X } from "lucide-react";
import { Button } from "../Button";
import { api } from "../../services/api";
import { MercadoPagoWallet } from "./MercadoPagoWallet";
import styles from "./ShopPurchaseModal.module.css";

type PurchaseType = "LIVE_PACK" | "REEL_PACK";
type PurchaseStep = "SELECT" | "SUMMARY" | "PAY";

type ProductConfig = {
  type: PurchaseType;
  title: string;
  subtitle: string;
  badge: string;
  quantity: number;
  theme: "green" | "crimson";
  icon: React.ReactNode;
};

const PRODUCT_CONFIG: Record<PurchaseType, ProductConfig> = {
  LIVE_PACK: {
    type: "LIVE_PACK",
    title: "Cupo extra de Vivo",
    subtitle: "Agrega 1 vivo adicional a tu agenda semanal.",
    badge: "1 Cupo de Vivo",
    quantity: 1,
    theme: "green",
    icon: <ShoppingCart size={18} />,
  },
  REEL_PACK: {
    type: "REEL_PACK",
    title: "Pack de Reels",
    subtitle: "Agrega 5 historias adicionales para hoy.",
    badge: "Pack 5 Historias",
    quantity: 5,
    theme: "crimson",
    icon: <Film size={18} />,
  },
};

interface ShopPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  defaultType: PurchaseType;
  isPreview?: boolean;
  onNotice: (title: string, message: string, tone?: "info" | "success" | "warning" | "error") => void;
  onPurchaseSync?: () => void;
}

export const ShopPurchaseModal: React.FC<ShopPurchaseModalProps> = ({
  isOpen,
  onClose,
  shopId,
  defaultType,
  isPreview,
  onNotice,
  onPurchaseSync,
}) => {
  const [step, setStep] = useState<PurchaseStep>("SELECT");
  const [selection, setSelection] = useState<PurchaseType>(defaultType);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stablePreferenceIdRef = useRef<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const product = useMemo(() => PRODUCT_CONFIG[selection], [selection]);

  useEffect(() => {
    if (!isOpen) return;
    setStep("SELECT");
    setSelection(defaultType);
    setPreferenceId(null);
    setPurchaseId(null);
    setError(null);
    setLoading(false);
    stablePreferenceIdRef.current = null;
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [isOpen, defaultType]);

  const handleCreatePreference = async () => {
    if (isPreview) {
      onNotice("Modo vista", "Accion bloqueada en modo vista tecnica.", "warning");
      return;
    }
    if (!shopId) {
      onNotice("Sin tienda", "No se pudo iniciar el pago sin tienda activa.", "error");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.createMercadoPagoPreference({
        type: product.type,
        quantity: product.quantity,
        shopId,
      });
      const nextPreference = data.preferenceId || null;
      setPreferenceId(nextPreference);
      if (!stablePreferenceIdRef.current && nextPreference) {
        stablePreferenceIdRef.current = nextPreference;
      }
      setPurchaseId(data.purchaseId || null);
      setStep("PAY");
    } catch (err: any) {
      const message = err?.message || "No se pudo iniciar el pago.";
      setError(message);
      onNotice("Pago no iniciado", message, "error");
    } finally {
      setLoading(false);
    }
  };

  const stablePreferenceId =
    stablePreferenceIdRef.current || preferenceId || null;

  const handleClose = () => {
    onClose();
    if (purchaseId) {
      onPurchaseSync?.();
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    if (isPreview) return;
    if (step !== "PAY") return;
    if (!purchaseId) return;
    if (pollRef.current) return;

    let attempts = 0;
    pollRef.current = window.setInterval(async () => {
      attempts += 1;
      try {
        const purchases = await api.fetchPurchasesByShop(shopId);
        const purchase = purchases?.find(
          (item: any) => item?.purchaseId === purchaseId || item?.id === purchaseId
        );
        const status = purchase?.status;
        if (status === "APPROVED") {
          onNotice(
            "Compra exitosa",
            `Compra ${purchaseId} aprobada. Muchas gracias por elegirnos!`,
            "success"
          );
          onPurchaseSync?.();
          handleClose();
        } else if (status === "REJECTED") {
          setError("El pago fue rechazado. Podes reintentarlo.");
          onNotice("Pago rechazado", "El pago fue rechazado.", "warning");
          if (pollRef.current) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }
      } catch {
        // No interrumpimos el flujo si falla el refresco.
      }

      if (attempts >= 20 && pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, 3000);

    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isOpen, isPreview, step, purchaseId, shopId, onNotice, onPurchaseSync]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalCard}>
        <button
          onClick={handleClose}
          className={styles.modalClose}
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        <div className={styles.modalHeader}>
          <div className={styles.modalIcon}>{product.icon}</div>
          <h2 className={styles.modalTitle}>
            {step === "SELECT" && "Comprar cupos"}
            {step === "SUMMARY" && "Resumen de compra"}
            {step === "PAY" && "Pago seguro"}
          </h2>
          <p className={styles.modalSubtitle}>
            {step === "SELECT" && "Elegi el cupo que necesitas."}
            {step === "SUMMARY" && "Revisa los detalles antes de pagar."}
            {step === "PAY" && "Se abrira Mercado Pago para completar el pago."}
          </p>
        </div>

        <div className={styles.stepper} aria-hidden="true">
          <span className={`${styles.stepDot} ${step === "SELECT" ? styles.stepDotActive : ""}`} />
          <span className={`${styles.stepDot} ${step === "SUMMARY" ? styles.stepDotActive : ""}`} />
          <span className={`${styles.stepDot} ${step === "PAY" ? styles.stepDotActive : ""}`} />
        </div>

        {step === "SELECT" && (
          <div className={styles.optionGrid}>
            {Object.values(PRODUCT_CONFIG).map((item) => (
              <button
                key={item.type}
                type="button"
                className={`${styles.optionCard} ${
                  selection === item.type ? styles.optionCardActive : ""
                }`}
                onClick={() => setSelection(item.type)}
              >
                <div className={styles.optionHeader}>
                  <span className={styles.optionTitle}>{item.title}</span>
                  <span
                    className={`${styles.optionBadge} ${
                      item.theme === "green" ? styles.optionBadgeGreen : styles.optionBadgeCrimson
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>
                <p className={styles.optionSubtitle}>{item.subtitle}</p>
                <span className={styles.optionPrice}>Precio en Mercado Pago</span>
              </button>
            ))}
            <Button
              className={styles.primaryButton}
              onClick={() => setStep("SUMMARY")}
            >
              Continuar
            </Button>
          </div>
        )}

        {step === "SUMMARY" && (
          <div className={styles.summarySection}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Producto</span>
              <span className={styles.summaryValue}>{product.title}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Cantidad</span>
              <span className={styles.summaryValue}>{product.quantity}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Total</span>
              <span className={styles.summaryValue}>Precio en Mercado Pago</span>
            </div>
            {error && <p className={styles.errorText}>{error}</p>}
            <div className={styles.summaryActions}>
              <Button variant="outline" onClick={() => setStep("SELECT")}>
                Volver
              </Button>
              <Button
                className={styles.primaryButton}
                onClick={handleCreatePreference}
                disabled={loading}
              >
                {loading ? "Iniciando pago..." : "Continuar con Mercado Pago"}
              </Button>
            </div>
            <p className={styles.summaryNote}>
              Los cupos se acreditan cuando el pago sea aprobado.
            </p>
          </div>
        )}

        {step === "PAY" && (
          <div className={styles.paySection}>
            {stablePreferenceId ? (
              <div className={styles.mpContainer}>
                <MercadoPagoWallet
                  preferenceId={stablePreferenceId}
                />
                {purchaseId && (
                  <p className={styles.purchaseNote}>
                    Compra #{purchaseId} en proceso. Cuando el pago se apruebe,
                    los cupos se acreditan automaticamente.
                  </p>
                )}
              </div>
            ) : (
              <p className={styles.errorText}>No se pudo iniciar el pago.</p>
            )}
            <Button variant="outline" onClick={() => setStep("SUMMARY")}>
              Volver al resumen
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
