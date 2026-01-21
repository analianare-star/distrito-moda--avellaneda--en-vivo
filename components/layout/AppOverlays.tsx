import React from "react";
import { Stream } from "../../types";
import { Button } from "../Button";
import { NoticeModal } from "../NoticeModal";
import { ReportModal } from "../ReportModal";

type NoticePayload = {
  title: string;
  message: string;
  tone?: "info" | "success" | "warning" | "error";
} | null;

type AppOverlaysProps = {
  notice: NoticePayload;
  onCloseNotice: () => void;
  reportTarget: Stream | null;
  onCloseReport: () => void;
  onSubmitReport: (reason: string) => void;
  calendarPromptStream: Stream | null;
  onCalendarAccept: (stream: Stream) => void;
  onCalendarClose: () => void;
};

export const AppOverlays: React.FC<AppOverlaysProps> = ({
  notice,
  onCloseNotice,
  reportTarget,
  onCloseReport,
  onSubmitReport,
  calendarPromptStream,
  onCalendarAccept,
  onCalendarClose,
}) => (
  <>
    <NoticeModal
      isOpen={Boolean(notice)}
      title={notice?.title || ""}
      message={notice?.message || ""}
      tone={notice?.tone || "info"}
      onClose={onCloseNotice}
    />

    {reportTarget && (
      <ReportModal
        isOpen={Boolean(reportTarget)}
        streamTitle={reportTarget.title}
        onClose={onCloseReport}
        onSubmit={onSubmitReport}
      />
    )}

    {calendarPromptStream && (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
        <div className="w-full max-w-xs rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
          <p className="text-sm font-bold text-dm-dark">
            Agendamos en tu calendario?
          </p>
          <p className="mt-1 text-[11px] text-gray-500">
            {calendarPromptStream.title} -{" "}
            {calendarPromptStream.shop?.name || "Tienda"}
          </p>
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onCalendarAccept(calendarPromptStream)}
            >
              Si, agendar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={onCalendarClose}
            >
              No, gracias
            </Button>
          </div>
        </div>
      </div>
    )}
  </>
);
