import { useCallback, type Dispatch, type SetStateAction } from "react";
import { api } from "../services/api";
import { NotificationItem, Shop, Stream, StreamStatus, UserContext } from "../types";
import { AuthProfile } from "./useAuthState";

type UseClientActionsArgs = {
  user: UserContext;
  setUser: Dispatch<SetStateAction<UserContext>>;
  allStreams: Stream[];
  setAllStreams: Dispatch<SetStateAction<Stream[]>>;
  allShops: Shop[];
  authProfile: AuthProfile | null;
  reportTarget: Stream | null;
  setReportTarget: Dispatch<SetStateAction<Stream | null>>;
  setNotice: (args: {
    title: string;
    message: string;
    tone?: "info" | "success" | "warning" | "error";
  }) => void;
  pushHistory: (label: string) => void;
  refreshData: () => void;
  refreshNotifications: (profile?: AuthProfile | null) => Promise<void>;
  setNotifications: Dispatch<SetStateAction<NotificationItem[]>>;
  setCalendarPromptStream: Dispatch<SetStateAction<Stream | null>>;
  setShopModalTab: Dispatch<SetStateAction<"INFO" | "CARD">>;
  setSelectedShopForModal: Dispatch<SetStateAction<Shop | null>>;
  setActiveBottomNav: (value: string) => void;
  setActiveFilter: (value: string) => void;
  navigateTo: (path: string, replace?: boolean) => void;
  requireClient: () => boolean;
};

export const useClientActions = ({
  user,
  setUser,
  allStreams,
  setAllStreams,
  allShops,
  authProfile,
  reportTarget,
  setReportTarget,
  setNotice,
  pushHistory,
  refreshData,
  refreshNotifications,
  setNotifications,
  setCalendarPromptStream,
  setShopModalTab,
  setSelectedShopForModal,
  setActiveBottomNav,
  setActiveFilter,
  navigateTo,
  requireClient,
}: UseClientActionsArgs) => {
  const handleReportStream = useCallback(
    async (streamId: string) => {
      if (!requireClient()) return;
      const stream = allStreams.find((s) => s.id === streamId);
      if (!stream) return;

      if (stream.status !== StreamStatus.LIVE) {
        setNotice({
          title: "Reporte no disponible",
          message: "Solo se pueden reportar vivos en vivo.",
          tone: "warning",
        });
        return;
      }
      if (user.reports.some((r) => r.streamId === streamId)) {
        setNotice({
          title: "Reporte ya enviado",
          message: "Ya reportaste este vivo.",
          tone: "info",
        });
        return;
      }

      setReportTarget(stream);
    },
    [allStreams, requireClient, setNotice, setReportTarget, user.reports]
  );

  const handleSubmitReport = useCallback(
    async (reason: string) => {
      if (!reportTarget) return;
      const result = await api.reportStream(reportTarget.id, reason);
      if (result.success) {
        setUser((prev) => ({
          ...prev,
          reports: [
            ...prev.reports,
            { streamId: reportTarget.id, timestamp: Date.now() },
          ],
        }));
        pushHistory(`Reporte enviado: ${reportTarget.title}`);
        setNotice({
          title: "Reporte enviado",
          message: result.message,
          tone: "success",
        });
        refreshData();
      } else {
        setNotice({
          title: "No se pudo reportar",
          message: result.message,
          tone: "error",
        });
      }
      setReportTarget(null);
    },
    [
      pushHistory,
      refreshData,
      reportTarget,
      setNotice,
      setReportTarget,
      setUser,
    ]
  );

  const handleToggleFavorite = useCallback(
    (shopId: string) => {
      if (!requireClient()) return;
      if (!user.isLoggedIn) return;
      const wasFollowing = user.favorites.includes(shopId);
      void (async () => {
        try {
          const updated = user.favorites.includes(shopId)
            ? await api.removeFavorite(shopId)
            : await api.addFavorite(shopId);
          if (updated) {
            setUser((prev) => ({ ...prev, favorites: updated }));
          }
          if (!wasFollowing) {
            setNotice({
              title: "Favorito guardado",
              message: "Siguiendo tienda!",
              tone: "success",
            });
            const shop = allShops.find((item) => item.id === shopId);
            if (shop) pushHistory(`Seguiste: ${shop.name}`);
          } else {
            const shop = allShops.find((item) => item.id === shopId);
            if (shop) pushHistory(`Dejaste de seguir: ${shop.name}`);
          }
        } catch (error) {
          setNotice({
            title: "No se pudo actualizar",
            message: "Intenta nuevamente.",
            tone: "error",
          });
        }
      })();
    },
    [
      allShops,
      pushHistory,
      requireClient,
      setNotice,
      setUser,
      user.favorites,
      user.isLoggedIn,
    ]
  );

  const handleToggleReminder = useCallback(
    (streamId: string) => {
      if (!requireClient()) return;
      if (!user.isLoggedIn) return;
      const wasActive = user.reminders.includes(streamId);
      void (async () => {
        try {
          const updated = user.reminders.includes(streamId)
            ? await api.removeReminder(streamId)
            : await api.addReminder(streamId);
          if (updated) {
            setUser((prev) => ({ ...prev, reminders: updated }));
          }
          await refreshNotifications(authProfile);
          const stream = allStreams.find((item) => item.id === streamId);
          if (stream) {
            pushHistory(
              `${wasActive ? "Quitaste" : "Agendaste"} recordatorio: ${
                stream.title
              }`
            );
            if (!wasActive && stream.status === StreamStatus.UPCOMING) {
              setCalendarPromptStream(stream);
            }
          }
        } catch (error) {
          setNotice({
            title: "No se pudo actualizar",
            message: "Intenta nuevamente.",
            tone: "error",
          });
        }
      })();
    },
    [
      allStreams,
      authProfile,
      pushHistory,
      refreshNotifications,
      requireClient,
      setCalendarPromptStream,
      setNotice,
      setUser,
      user.isLoggedIn,
      user.reminders,
    ]
  );

  const formatICSDate = (date: Date) =>
    date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");

  const getApiBaseUrl = () => {
    const raw = import.meta.env.VITE_API_URL || "http://localhost:3000";
    return raw.replace(/\/+$/, "");
  };

  const isAppleDevice = () => {
    const ua = navigator.userAgent || "";
    const isApple = /iPad|iPhone|iPod|Mac/.test(ua);
    const isTouchMac =
      navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    return isApple || isTouchMac;
  };

  const buildGoogleCalendarUrl = (stream: Stream) => {
    const start = new Date(stream.fullDateISO);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const title = stream.title || "Vivo en Avellaneda en Vivo";
    const shopName = stream.shop?.name || "Distrito Moda";
    const detailsLines = [
      `Tienda: ${shopName}`,
      stream.url ? `Enlace: ${stream.url}` : "",
    ].filter(Boolean);
    const details = detailsLines.join("\n");
    const location = stream.shop?.address || "Avellaneda en Vivo";
    const dates = `${formatICSDate(start)}/${formatICSDate(end)}`;
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates,
      details,
      location,
      sf: "true",
      output: "xml",
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const handleOpenCalendarInvite = useCallback(
    (stream: Stream) => {
      try {
        const apiBase = getApiBaseUrl();
        const calendarUrl = `${apiBase}/streams/${stream.id}/calendar.ics`;
        if (isAppleDevice()) {
          const webcalUrl = calendarUrl.replace(/^https?:\/\//, "webcal://");
          window.location.href = webcalUrl;
          return;
        }
        const googleUrl = buildGoogleCalendarUrl(stream);
        const popup = window.open(googleUrl, "_blank", "noopener");
        if (!popup) {
          window.location.href = googleUrl;
        }
      } catch {
        setNotice({
          title: "No se pudo abrir el calendario",
          message: "Intenta nuevamente.",
          tone: "error",
        });
      }
    },
    [setNotice]
  );

  const handleMarkNotificationRead = useCallback(
    (id: string) => {
      void (async () => {
        const updated = await api.markNotificationRead(id);
        if (updated) {
          setNotifications((prev) =>
            prev.map((note) => (note.id === id ? { ...note, read: true } : note))
          );
        }
      })();
    },
    [setNotifications]
  );

  const handleMarkAllNotificationsRead = useCallback(() => {
    if (!authProfile?.authUserId) return;
    void (async () => {
      await api.markAllNotificationsRead(authProfile.authUserId);
      setNotifications((prev) => prev.map((note) => ({ ...note, read: true })));
    })();
  }, [authProfile?.authUserId, setNotifications]);

  const handleNotificationAction = useCallback(
    (note: NotificationItem) => {
      if (!note.refId) return;
      const stream = allStreams.find((item) => item.id === note.refId);
      if (!stream) return;
      setActiveBottomNav("home");
      setActiveFilter("Próximos");
      navigateTo("/");
      setShopModalTab("INFO");
      setSelectedShopForModal(stream.shop);
      if (!note.read) {
        handleMarkNotificationRead(note.id);
      }
    },
    [
      allStreams,
      handleMarkNotificationRead,
      navigateTo,
      setActiveBottomNav,
      setActiveFilter,
      setSelectedShopForModal,
      setShopModalTab,
    ]
  );

  const handleLikeStream = useCallback(
    (streamId: string) => {
      if (!requireClient()) return;
      void (async () => {
        try {
          const result = await api.toggleLikeStream(streamId);
          if (!result) return;
          setAllStreams((prev) =>
            prev.map((stream) =>
              stream.id === streamId ? { ...stream, likes: result.likes } : stream
            )
          );
          setUser((prev) => {
            const hasLike = prev.likes.includes(streamId);
            const nextLikes = result.liked
              ? hasLike
                ? prev.likes
                : [...prev.likes, streamId]
              : prev.likes.filter((id) => id !== streamId);
            return { ...prev, likes: nextLikes };
          });
          if (result.liked) {
            const stream = allStreams.find((item) => item.id === streamId);
            if (stream) pushHistory(`Te gusto: ${stream.title}`);
          }
        } catch (error: any) {
          setNotice({
            title: "No se pudo guardar el like",
            message: error?.message || "Intenta nuevamente.",
            tone: "error",
          });
        }
      })();
    },
    [allStreams, pushHistory, requireClient, setAllStreams, setNotice, setUser]
  );

  const handleRateStream = useCallback(
    (streamId: string, rating: number) => {
      if (!requireClient()) return;
      void (async () => {
        try {
          await api.rateStream(streamId, rating);
          setNotice({
            title: "Gracias por calificar",
            message: `Calificaste con ${rating} estrellas.`,
            tone: "success",
          });
          const stream = allStreams.find((item) => item.id === streamId);
          if (stream) pushHistory(`Calificaste: ${stream.title}`);
          refreshData();
        } catch (error: any) {
          setNotice({
            title: "No se pudo calificar",
            message: error?.message || "Intenta nuevamente.",
            tone: "error",
          });
        }
      })();
    },
    [allStreams, pushHistory, refreshData, requireClient, setNotice]
  );

  const handleDownloadCard = useCallback(
    (stream: Stream) => {
      if (!requireClient()) return;
      setShopModalTab("CARD");
      setSelectedShopForModal(stream.shop);
      navigateTo(`/tiendas/${stream.shop.id}`);
    },
    [navigateTo, requireClient, setSelectedShopForModal, setShopModalTab]
  );

  return {
    handleReportStream,
    handleSubmitReport,
    handleToggleFavorite,
    handleToggleReminder,
    handleOpenCalendarInvite,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    handleNotificationAction,
    handleLikeStream,
    handleRateStream,
    handleDownloadCard,
  };
};
