import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { api, type DirectMessageThread } from "../api/supabase-api";
import DirectChatPanel from "../components/DirectChatPanel";
import PageLoading from "../components/layout/PageLoading";
import { useAuth } from "../contexts/AuthContext";
import { useIsSmUp } from "../hooks/useIsSmUp";
import { markDirectMessageThreadSeen } from "../utils/navInboxSeen";

export default function CourseDirectMessagesPage() {
  const { courseId = "" } = useParams<{ courseId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [threads, setThreads] = useState<DirectMessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedPeerId = searchParams.get("peer") ?? "";
  const isSmUp = useIsSmUp();

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void api.directMessages
      .listThreads(courseId)
      .then((data) => {
        if (!cancelled) setThreads(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "채팅 목록을 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const selectedThread = threads.find((t) => t.peerUserId === selectedPeerId);

  useEffect(() => {
    if (!user?.id || !courseId || !selectedThread) return;
    markDirectMessageThreadSeen(
      user.id,
      courseId,
      selectedThread.peerUserId,
      selectedThread.lastAt
    );
  }, [user?.id, courseId, selectedThread?.peerUserId, selectedThread?.lastAt]);

  const selectPeer = (peerUserId: string) => {
    setSearchParams({ peer: peerUserId });
  };

  const chatPanelProps = {
    courseId,
    peerUserId: selectedPeerId,
    peerName: selectedThread?.peerName ?? "상대",
    currentUserId: user?.id,
    currentUserName: user?.name ?? "나",
    enabled: true as const,
  };

  return (
    <div className="flex h-[min(720px,calc(100vh-12rem))] min-h-[420px] w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link
            to={courseId ? `/app/courses/${courseId}/students` : "/app/courses"}
            className="cc-link text-sm font-bold"
          >
            ← 수강자들
          </Link>
          <h1 className="mt-1 text-2xl font-black text-[#101828]">챗리스트</h1>
          <p className="text-sm text-gray-500">이 수업에서 주고받은 1:1 메시지</p>
        </div>
      </div>

      {loading ? (
        <PageLoading layout="inline" message="대화 목록을 불러오는 중…" />
      ) : error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : (
        <div
          className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
          data-testid="course-direct-messages-layout"
        >
          <aside
            className="flex w-full min-w-0 flex-col border-r border-gray-200 sm:w-1/2 lg:max-w-[360px]"
            data-testid="direct-chat-thread-list"
          >
            {threads.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-500">아직 1:1 대화가 없습니다.</p>
            ) : (
              <ul className="min-h-0 flex-1 overflow-y-auto divide-y divide-gray-100">
                {threads.map((thread) => {
                  const active = thread.peerUserId === selectedPeerId;
                  return (
                    <li key={thread.peerUserId}>
                      <button
                        type="button"
                        onClick={() => selectPeer(thread.peerUserId)}
                        data-testid={`direct-chat-thread-${thread.peerUserId}`}
                        className={`w-full px-4 py-3 text-left transition-colors ${
                          active ? "bg-[#eff6ff]" : "hover:bg-gray-50"
                        }`}
                      >
                        <p className="text-sm font-bold text-gray-900">{thread.peerName}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                          {thread.lastMessage}
                        </p>
                        <p className="mt-1 text-[10px] cc-text-muted">{thread.lastTime}</p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          <div className="hidden min-w-0 flex-1 flex-col sm:flex">
            {selectedPeerId && isSmUp ? (
              <DirectChatPanel key={selectedPeerId} {...chatPanelProps} />
            ) : (
              <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-500">
                왼쪽 목록에서 대화를 선택하세요
              </div>
            )}
          </div>
        </div>
      )}

      {selectedPeerId && !isSmUp && (
        <div className="fixed inset-0 z-40 flex flex-col bg-white" data-testid="direct-chat-mobile-panel">
          <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
            <button
              type="button"
              className="cc-link text-sm font-bold"
              onClick={() => setSearchParams({})}
            >
              ← 목록
            </button>
          </div>
          <DirectChatPanel key={selectedPeerId} {...chatPanelProps} className="flex-1" />
        </div>
      )}
    </div>
  );
}
