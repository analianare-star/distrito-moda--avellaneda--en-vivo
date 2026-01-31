import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpCircle, Crown, X } from "lucide-react";
import { Button } from "../Button";
import { createMercadoPagoPreference, fetchPurchasesByShop } from "../../domains/purchases";
import styles from "./ShopPurchaseModal.module.css";

const MercadoPagoWallet = React.lazy(async () => {
  const mod = await import("./MercadoPagoWallet");
  return { default: mod.MercadoPagoWallet };
});

type PlanCode = "ALTA" | "MAXIMA";
type PurchaseStep = "SELECT" | "SUMMARY" | "PAY";

type PlanOption = {
  code: PlanCode;
  label: string;
  subtitle: string;
  badge: string;
  theme: "green" | "crimson";
  icon: React.ReactNode;
  rank: number;
};

const PLAN_OPTIONS: PlanOption[] = [
  {
    code: "ALTA",
    label: "Alta Visibilidad",
    subtitle: "Mas exposicion, redes activas y 1 vivo semanal.",
    badge: "Upgrade a Alta",
    theme: "green",
    icon: <ArrowUpCircle size={18} />,
    rank: 1,
  },
  {
    code: "MAXIMA",
    label: "Maxima Visibilidad",
    subtitle: "Maxima exposicion, 3 vivos por semana y beneficios premium.",
    badge: "Upgrade a Maxima",
    theme: "crimson",
    icon: <Crown size={18} />,
    rank: 2,
  },
];

const resolvePlanRank = (value?: string) => {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("maxima")) return 2;
  if (normalized.includes("pro")) return 2;
  if (normalized.includes("alta")) return 1;
  return 0;
};

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  currentPlan?: string;
  isPreview?: boolean;
  onNotice: (title: string, message: string, tone?: "info" | "success" | "warning" | "error") => void;
  onPurchaseSync?: () => void;
}

export const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({
  isOpen,
  onClose,
  shopId,
  currentPlan,
  isPreview,
  onNotice,
  onPurchaseSync,
}) => {
  const [step, setStep] = useState<PurchaseStep>("SELECT");
  const [selection, setSelection] = useState<PlanCode | null>(null);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stablePreferenceIdRef = useRef<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const currentRank = resolvePlanRank(currentPlan);
  const availableOptions = useMemo(
    () => PLAN_OPTIONS.filter((option) => option.rank > currentRank),
    [currentRank]
  );

  useEffect(() => {
    if (!isOpen) return;
    setStep("SELECT");
    setPreferenceId(null);
    setPurchaseId(null);
    setError(null);
    setLoading(false);
    stablePreferenceIdRef.current = null;
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setSelection(availableOptions[0]?.code ?? null);
  }, [isOpen, availableOptions]);

  const selectedOption = useMemo(
    () => availableOptions.find((option) => option.code === selection) || null,
    [availableOptions, selection]
  );

  const handleCreatePreference = async () => {
    if (isPreview) {
      onNotice("Modo vista", "Accion bloqueada en modo vista tecnica.", "warning");
      return;
    }
    if (!shopId) {
      onNotice("Sin tienda", "No se pudo iniciar el pago sin tienda activa.", "error");
      return;
    }
    if (!selection) {
      onNotice("Sin plan", "Selecciona un plan para continuar.", "warning");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await createMercadoPagoPreference({
        type: "PLAN_UPGRADE",
        quantity: 1,
        shopId,
        plan: selection,
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

  const stablePreferenceId = stablePreferenceIdRef.current || preferenceId || null;

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
        const purchases = await fetchPurchasesByShop(shopId);
        const purchase = purchases?.find(
          (item: any) => item?.purchaseId === purchaseId || item?.id === purchaseId
        );
        const status = purchase?.status;
        if (status === "APPROVED") {
          onNotice(
            "Plan actualizado",
            `Upgrade aprobado. Tu plan fue actualizado.`,
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
        // ignore
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
        <button onClick={handleClose} className={styles.modalClose} aria-label="Cerrar">
          <X size={20} />
        </button>

        <div className={styles.modalHeader}>
          <div className={styles.modalIcon}>
            {selectedOption?.icon || <ArrowUpCircle size={18} />}
          </div>
          <h2 className={styles.modalTitle}>
            {step === "SELECT" && "Mejorar plan"}
            {step === "SUMMARY" && "Resumen de upgrade"}
            {step === "PAY" && "Pago seguro"}
          </h2>
          <p className={styles.modalSubtitle}>
            {step === "SELECT" && "Elegi el plan al que queres subir."}
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
            {availableOptions.length === 0 ? (
              <div className={styles.summarySection}>
                <p className={styles.summaryValue}>Ya estas en el plan mas alto.</p>
              </div>
            ) : (
              <>
                {availableOptions.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    className={`${styles.optionCard} ${
                      selection === option.code ? styles.optionCardActive : ""
                    }`}
                    onClick={() => setSelection(option.code)}
                  >
                    <div className={styles.optionHeader}>
                      <span className={styles.optionTitle}>{option.label}</span>
                      <span
                        className={`${styles.optionBadge} ${
                          option.theme === "green"
                            ? styles.optionBadgeGreen
                            : styles.optionBadgeCrimson
                        }`}
                      >
                        {option.badge}
                      </span>
                    </div>
                    <p className={styles.optionSubtitle}>{option.subtitle}</p>
                    <span className={styles.optionPrice}>Precio en Mercado Pago</span>
                  </button>
                ))}
                <Button
                  className={styles.primaryButton}
                  onClick={() => setStep("SUMMARY")}
                  disabled={!selection}
                >
                  Continuar
                </Button>
              </>
            )}
          </div>
        )}

        {step === "SUMMARY" && (
          <div className={styles.summarySection}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Plan actual</span>
              <span className={styles.summaryValue}>{currentPlan || "-"}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Nuevo plan</span>
              <span className={styles.summaryValue}>{selectedOption?.label || "-"}</span>
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
              El plan se actualiza cuando el pago sea aprobado.
            </p>
          </div>
        )}

        {step === "PAY" && (
          <div className={styles.paySection}>
            {stablePreferenceId ? (
              <div className={styles.mpContainer}>
                <Suspense fallback={<div className="min-h-[120px] w-full rounded-2xl bg-white/80" />}>
                  <MercadoPagoWallet preferenceId={stablePreferenceId} />
                </Suspense>
                {purchaseId && (
                  <p className={styles.purchaseNote}>
                    Compra #{purchaseId} en proceso. Cuando el pago se apruebe,
                    el plan se actualiza automaticamente.
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

