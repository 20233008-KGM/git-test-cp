import React, { useEffect, useRef, useState } from "react";
import { api } from "../api/supabase-api";
import type { ChatMessage } from "../types";
import AppModal from "./layout/AppModal";

type DirectChatModalProps = {
  open: boolean;
  courseId: string;
  peerUserId: string;
  peerName: string;
  onClose: () => void;
};

export default function DirectChatModal({
  open,
  courseId,
  peerUserId,
  peerName,
  onClose,
}: DirectChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const reload = async () => {
    if (!courseId || !peerUserId) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await api.directMessages.getThread(courseId, peerUserId);
      setMessages(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "메시지를 불러오지 못했습니다.");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    void reload();
  }, [open, courseId, peerUserId]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const handleSend = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const sent = await api.directMessages.send(courseId, peerUserId, draft);
      setMessages((prev) => [...prev, sent]);
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "전송에 실패했습니다.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      testId="direct-chat-modal-overlay"
      ariaLabel={`${peerName}님과 1:1 채팅`}
      panelClassName="!p-0 flex max-w-[520px] w-full flex-col overflow-hidden rounded-[14px] shadow-2xl !max-h-[min(640px,88vh)]"
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">1:1 채팅</h2>
          <p className="text-xs text-gray-500">{peerName}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
          aria-label="채팅 닫기"
        >
          닫기
        </button>
      </div>

      <div
        ref={scrollRef}
        className="min-h-[240px] flex-1 overflow-y-auto bg-gray-50 px-4 py-3"
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
                msg.isMine ? "bg-[#155dfc] text-white" : "bg-white border border-gray-200 text-gray-800"
              }`}
            >
              <p>{msg.text}</p>
              <p className={`mt-1 text-[10px] ${msg.isMine ? "text-blue-100" : "text-gray-400"}`}>
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
              void handleSend();
            }
          }}
          placeholder="메시지 입력"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          data-testid="direct-chat-input"
        />
        <button
          type="button"
          disabled={sending || !draft.trim()}
          onClick={() => void handleSend()}
          className="rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          data-testid="direct-chat-send"
        >
          {sending ? "전송…" : "전송"}
        </button>
      </div>
    </AppModal>
  );
}
