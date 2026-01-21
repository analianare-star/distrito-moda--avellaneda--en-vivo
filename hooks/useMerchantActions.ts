import { useCallback } from "react";
import { api } from "../services/api";
import { Shop, Stream } from "../types";

type NoticeArgs = {
  title: string;
  message: string;
  tone?: "info" | "success" | "warning" | "error";
};

type UseMerchantActionsArgs = {
  allStreams: Stream[];
  currentShopId: string;
  isAdminOverride: boolean;
  blockPreviewAction: (message?: string) => boolean;
  refreshData: () => void;
  setNotice: (notice: NoticeArgs) => void;
};

export const useMerchantActions = ({
  allStreams,
  currentShopId,
  isAdminOverride,
  blockPreviewAction,
  refreshData,
  setNotice,
}: UseMerchantActionsArgs) => {
  const handleStreamCreate = useCallback(
    async (newStream: Stream) => {
      if (blockPreviewAction()) return false;
      try {
        const result = await api.createStream({
          ...newStream,
          isAdminOverride,
        });
        if (!result.success) {
          setNotice({
            title: "No se pudo agendar",
            message: result.message,
            tone: "error",
          });
          return false;
        }
        await refreshData();
        return true;
      } catch (error) {
        console.error("Error creando vivo:", error);
        setNotice({
          title: "Error al agendar",
          message: "No se pudo agendar el vivo. Intenta de nuevo.",
          tone: "error",
        });
        return false;
      }
    },
    [blockPreviewAction, isAdminOverride, refreshData, setNotice]
  );

  const handleStreamUpdate = useCallback(
    async (updatedStream: Stream) => {
      if (blockPreviewAction()) return false;
      try {
        await api.updateStream({
          ...updatedStream,
          isAdminOverride,
        });
        await refreshData();
        return true;
      } catch (error) {
        console.error("Error actualizando vivo:", error);
        setNotice({
          title: "Error al actualizar",
          message: "No se pudo actualizar el vivo. Intenta de nuevo.",
          tone: "error",
        });
        return false;
      }
    },
    [blockPreviewAction, isAdminOverride, refreshData, setNotice]
  );

  const handleStreamDelete = useCallback(
    async (streamId: string) => {
      if (blockPreviewAction()) return;
      try {
        await api.cancelStream(streamId, "Cancelado por tienda");
        await refreshData();
      } catch (error) {
        console.error("Error cancelando vivo:", error);
        setNotice({
          title: "No se pudo cancelar",
          message: "No se pudo cancelar el vivo.",
          tone: "error",
        });
      }
    },
    [blockPreviewAction, refreshData, setNotice]
  );

  const handleShopUpdate = useCallback(
    async (updatedShop: Shop) => {
      if (blockPreviewAction()) return false;
      try {
        await api.updateShop(updatedShop.id, updatedShop);
        await refreshData();
        return true;
      } catch (error) {
        console.error("Error actualizando tienda:", error);
        setNotice({
          title: "No se pudo guardar",
          message: "No se pudo guardar la tienda. Intenta de nuevo.",
          tone: "error",
        });
        return false;
      }
    },
    [blockPreviewAction, refreshData, setNotice]
  );

  const handleExtendStream = useCallback(
    async (streamId: string) => {
      if (blockPreviewAction()) return;
      const stream = allStreams.find((s) => s.id === streamId);
      if (stream && stream.extensionCount < 3) {
        await api.updateStream({
          ...stream,
          extensionCount: stream.extensionCount + 1,
        });
        refreshData();
        setNotice({
          title: "Vivo extendido",
          message: "Tienes 30 minutos adicionales.",
          tone: "success",
        });
      }
    },
    [allStreams, blockPreviewAction, refreshData, setNotice]
  );

  const handleBuyQuota = useCallback(
    async (amount: number) => {
      if (blockPreviewAction()) return;
      if (!currentShopId) {
        setNotice({
          title: "Sin tienda",
          message: "No hay tienda seleccionada.",
          tone: "warning",
        });
        return;
      }
      try {
        const result = await api.buyQuota(currentShopId, amount);
        if (result?.purchase?.status === "PENDING") {
          setNotice({
            title: "Solicitud enviada",
            message: "Tu compra quedo pendiente de aprobacion.",
            tone: "info",
          });
        } else {
          setNotice({
            title: "Cupos actualizados",
            message: "La compra fue aprobada.",
            tone: "success",
          });
        }
        refreshData();
      } catch (error) {
        console.error("Error comprando cupo:", error);
        setNotice({
          title: "Error de compra",
          message: "No se pudo comprar el cupo.",
          tone: "error",
        });
      }
    },
    [blockPreviewAction, currentShopId, refreshData, setNotice]
  );

  return {
    handleStreamCreate,
    handleStreamUpdate,
    handleStreamDelete,
    handleShopUpdate,
    handleExtendStream,
    handleBuyQuota,
  };
};
