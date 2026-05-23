import type { StudentProfile } from "../types";
import AppModal from "./layout/AppModal";
import UserAvatar from "./UserAvatar";
import { LoadingSpinner } from "./layout/PageLoading";

type StudentQuickProfileModalProps = {
  profile: StudentProfile | null;
  loading: boolean;
  errorMessage?: string | null;
  onClose: () => void;
};

export default function StudentQuickProfileModal({
  profile,
  loading,
  errorMessage,
  onClose,
}: StudentQuickProfileModalProps) {
  const open = loading || profile != null || Boolean(errorMessage);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      testId="student-quick-profile-overlay"
      ariaLabel="수강생 프로필"
      panelClassName="max-w-md rounded-[14px] p-6 shadow-2xl"
    >
      <div data-testid="student-quick-profile-modal">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-[#101828]">수강생 프로필</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xl font-bold text-gray-400 hover:text-gray-700"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div
            className="flex flex-col items-center gap-3 py-10"
            role="status"
            aria-live="polite"
            aria-busy="true"
            data-testid="student-quick-profile-loading"
          >
            <LoadingSpinner size="sm" />
            <p className="text-sm font-medium text-[var(--cc-text-secondary)]">프로필을 불러오는 중…</p>
          </div>
        )}

        {errorMessage && !loading && (
          <p className="text-sm font-medium text-red-600" data-testid="student-quick-profile-error">
            {errorMessage}
          </p>
        )}

        {profile && !loading && (
          <div className="space-y-4" data-testid="student-quick-profile-body">
            <div className="flex items-center gap-3">
              <UserAvatar name={profile.name} imageUrl={profile.imageUrl} size="md" />
              <div>
              <p className="text-base font-bold text-[#101828]">{profile.name}</p>
              <p className="text-sm text-[#6a7282]">{profile.studentId}</p>
              <p className="text-sm text-[#6a7282]">{profile.major}</p>
              </div>
            </div>
            {profile.bio && (
              <div>
                <p className="mb-1 text-xs font-bold text-gray-500">자기소개</p>
                <p className="text-sm text-[#364153] leading-relaxed">{profile.bio}</p>
              </div>
            )}
            {(profile.skills?.length ?? 0) > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold text-gray-500">기술 스택</p>
                <div className="flex flex-wrap gap-2">
                  {profile.skills!.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-[#eff6ff] px-2.5 py-1 text-xs font-medium text-[#1c398e]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppModal>
  );
}
