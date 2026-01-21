import { useCallback, useState } from "react";

type Notice = {
  title: string;
  message: string;
  tone?: "info" | "success" | "warning" | "error";
};

export const useNoticeState = () => {
  const [notice, setNotice] = useState<Notice | null>(null);

  const notify = useCallback(
    (title: string, message: string, tone?: Notice["tone"]) => {
      setNotice({ title, message, tone });
    },
    []
  );

  const clearNotice = useCallback(() => setNotice(null), []);

  return {
    notice,
    setNotice,
    notify,
    clearNotice,
  };
};
