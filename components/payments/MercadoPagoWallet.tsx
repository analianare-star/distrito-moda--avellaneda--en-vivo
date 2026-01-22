import React from "react";
import { Wallet, initMercadoPago } from "@mercadopago/sdk-react";

type MercadoPagoWalletProps = {
  preferenceId: string;
  onReady?: () => void;
};

const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY as string | undefined;
if (publicKey) {
  initMercadoPago(publicKey, { locale: "es-AR" });
}

export const MercadoPagoWallet: React.FC<MercadoPagoWalletProps> = ({
  preferenceId,
  onReady,
}) => {
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
        key={preferenceId}
        initialization={{ preferenceId }}
        onReady={onReady}
      />
    </div>
  );
};
