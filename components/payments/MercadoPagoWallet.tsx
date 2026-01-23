import React, { useEffect, useRef } from "react";
import { Wallet, initMercadoPago } from "@mercadopago/sdk-react";

type MercadoPagoWalletProps = {
  preferenceId: string;
  onReady?: () => void;
};

const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY as string | undefined;
if (publicKey) {
  initMercadoPago(publicKey, { locale: "es-AR" });
}

export const MercadoPagoWallet = React.memo(
  ({ preferenceId, onReady }: MercadoPagoWalletProps) => {
    const readyRef = useRef(false);

    useEffect(() => {
      readyRef.current = false;
    }, [preferenceId]);

  if (!publicKey) {
    return (
      <p className="text-sm text-gray-500">
        Mercado Pago no esta configurado en el frontend.
      </p>
    );
  }

  return (
    <div>
      <Wallet
        initialization={{ preferenceId }}
        onReady={() => {
          if (readyRef.current) return;
          readyRef.current = true;
          onReady?.();
        }}
      />
    </div>
  );
  },
  (prev, next) => prev.preferenceId === next.preferenceId
);
