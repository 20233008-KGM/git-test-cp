import React, { useEffect, useRef } from "react";
import { useDirectChat } from "../hooks/useDirectChat";

type DirectChatPanelProps = {
  courseId: string;
  peerUserId: string;
  peerName: string;
  currentUserId: string | undefined;
  currentUserName: string;
  enabled?: boolean;
  className?: string;
};

export default function DirectChatPanel({
  courseId,
  peerUserId,
  peerName,
  currentUserId,
  currentUserName,
  enabled = true,
  className = "",
}: DirectChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, draft, setDraft, loading, sending, error, send } = useDirectChat(
    courseId,
    peerUserId,
    peerName,
    currentUserId,
    currentUserName,
    enabled && Boolean(peerUserId)
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, peerUserId]);

  if (!peerUserId) {
    return (
      <div
        className={`flex flex-1 items-center justify-center bg-gray-50 text-sm text-gray-500 ${className}`}
        data-testid="direct-chat-empty"
      >
        왼쪽에서 대화를 선택하세요.
      </div>
    );
  }

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${className}`} data-testid="direct-chat-panel">
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <p className="text-sm font-bold text-gray-900">{peerName}</p>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto bg-gray-50 px-4 py-3"
        data-testid="direct-chat-messages"
      >
        {loading && <p className="text-center text-sm text-gray-500">불러오는 중…</p>}
        {!loading && messages.length === 0 && (
          <p className="text-center text-sm text-gray-500">대화를 시작해 보세요.</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-2 flex ${msg.isMine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                msg.isMine
                  ? "bg-[#155dfc] text-white"
                  : "bg-white border border-gray-200 text-gray-800"
              }`}
            >
              <p>{msg.text}</p>
              <p className={`mt-1 text-[10px] ${msg.isMine ? "text-blue-100" : "cc-text-muted"}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p>
      )}

      <div className="flex gap-2 border-t border-gray-200 bg-white px-4 py-3">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="메시지 입력"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          data-testid="direct-chat-input"
        />
        <button
          type="button"
          disabled={sending || !draft.trim()}
          onClick={() => void send()}
          className="m3-btn m3-btn--filled px-4 py-2 text-sm disabled:opacity-50"
          data-testid="direct-chat-send"
        >
          {sending ? "전송…" : "전송"}
        </button>
      </div>
    </div>
  );
}
