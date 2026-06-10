import { useEffect, useRef, useState } from "react";
import { api } from "../api/supabase-api";
import { useAuth } from "../contexts/AuthContext";
import type { ProfessorProfile } from "../types";
import PageLoading from "../components/layout/PageLoading";
import svgPaths from "../../imports/Group43/svg-bqpgzlg1zb";
import { resolveProfileImageUrl } from "../utils/studentNetworkDisplay";

export default function ProfessorProfilePage() {
  const { user, isProfessor, isAdmin, refreshProfile } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfessorProfile | null>(null);
  const [department, setDepartment] = useState("");
  const [office, setOffice] = useState("");
  const [officeHours, setOfficeHours] = useState("");
  const [researchInput, setResearchInput] = useState("");
  const [bio, setBio] = useState("");
  const [teachingStyle, setTeachingStyle] = useState("");
  const [studentGrowthApproach, setStudentGrowthApproach] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || (!isProfessor && !isAdmin)) {
      setLoading(false);
      return;
    }
    void Promise.all([api.professors.getById(user.id), api.myPage.getProfile()]).then(
      ([data, myProfile]) => {
        if (data) {
          setProfile(data);
          setDepartment(data.department);
          setOffice(data.office);
          setOfficeHours(data.officeHours);
          setResearchInput((data.researchAreas ?? []).join(", "));
          setBio(data.bio ?? "");
          setTeachingStyle(data.teachingStyle ?? "");
          setStudentGrowthApproach(data.studentGrowthApproach ?? "");
        }
        setProfileImageUrl(
          resolveProfileImageUrl(myProfile.imageUrl) ??
            resolveProfileImageUrl(user.imageUrl) ??
            null,
        );
        setLoading(false);
      }
    );
  }, [user?.id, user?.imageUrl, isProfessor, isAdmin]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarMessage("이미지 파일만 선택할 수 있습니다.");
      return;
    }
    setAvatarUploading(true);
    setAvatarMessage(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
        reader.readAsDataURL(file);
      });
      const saved = await api.myPage.updateAvatar(dataUrl);
      setProfileImageUrl(saved);
      await refreshProfile();
      setAvatarMessage("프로필 이미지가 저장되었습니다.");
    } catch (err) {
      setAvatarMessage(err instanceof Error ? err.message : "이미지 저장에 실패했습니다.");
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  if (!isProfessor && !isAdmin) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <p className="text-gray-600">교수 계정에서만 프로필을 수정할 수 있습니다.</p>
      </div>
    );
  }

  if (loading) {
    return <PageLoading message="프로필을 불러오는 중…" testId="professor-profile-loading" />;
  }

  const display = profile ?? {
    id: user?.id ?? "",
    name: user?.name ?? "교수",
    email: user?.email ?? "",
    role: "professor" as const,
    department,
    office,
    officeHours,
    researchAreas: [],
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-lg bg-white p-8 shadow-md">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-[var(--cc-outline-variant)] text-3xl font-bold ${
                profileImageUrl
                  ? "bg-[var(--cc-surface-sunken)]"
                  : "bg-[var(--cc-primary)] text-[var(--cc-on-primary)]"
              }`}
            >
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={display.name ? `${display.name} 프로필 사진` : "프로필 사진"}
                  className="h-full w-full object-cover"
                />
              ) : (
                display.name.charAt(0)
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              data-testid="professor-profile-avatar-input"
              onChange={(e) => void handleAvatarChange(e)}
            />
            <button
              type="button"
              disabled={avatarUploading}
              onClick={() => avatarInputRef.current?.click()}
              data-testid="professor-profile-avatar-change"
              className="flex items-center gap-1 rounded-full border border-[var(--cc-outline-variant)] bg-[var(--cc-surface-container)] px-3 py-1.5 text-xs font-medium text-[var(--cc-on-surface-variant)] transition-colors hover:bg-[var(--cc-surface-container-high)] disabled:opacity-50"
              title="프로필 이미지 변경"
            >
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24.1667 22.9233" aria-hidden>
                <path
                  d={svgPaths.p38455680}
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              {avatarUploading ? "저장 중…" : "사진 변경"}
            </button>
            {avatarMessage ? (
              <p
                className="max-w-[12rem] text-center text-xs font-medium text-[var(--cc-on-surface-variant)]"
                data-testid="professor-profile-avatar-message"
              >
                {avatarMessage}
              </p>
            ) : null}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{display.name}</h1>
            <p className="text-gray-600">{display.email}</p>
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
              const updated = await api.professors.saveProfile({
                department,
                office,
                officeHours,
                bio,
                teachingStyle,
                studentGrowthApproach,
                researchAreas: researchInput
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              });
              setProfile(updated);
              await refreshProfile();
              setSaveMessage("프로필이 저장되었습니다.");
            } catch (error) {
              setSaveMessage(
                error instanceof Error ? error.message : "저장에 실패했습니다."
              );
            } finally {
              setSaving(false);
            }
          }}
        >
          <label className="block text-sm font-bold text-gray-700">
            소속
            <input
              data-testid="professor-profile-department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              required
            />
          </label>
          <label className="block text-sm font-bold text-gray-700">
            연구실
            <input
              value={office}
              onChange={(e) => setOffice(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-bold text-gray-700">
            Office Hours
            <input
              value={officeHours}
              onChange={(e) => setOfficeHours(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-bold text-gray-700">
            소개 · 강의 철학
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              data-testid="professor-profile-bio"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="연구·강의·지도 경험 등을 자유롭게 작성하세요."
            />
          </label>
          <label className="block text-sm font-bold text-gray-700">
            연구 분야 (쉼표로 구분)
            <input
              value={researchInput}
              onChange={(e) => setResearchInput(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-bold text-gray-700">
            수업 스타일
            <textarea
              value={teachingStyle}
              onChange={(e) => setTeachingStyle(e.target.value)}
              rows={3}
              data-testid="professor-profile-teaching-style"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="나중에 AI가 자동으로 채웁니다 — 직접 입력도 가능합니다."
            />
          </label>
          <label className="block text-sm font-bold text-gray-700">
            추구하는 학생들의 성장 방식
            <textarea
              value={studentGrowthApproach}
              onChange={(e) => setStudentGrowthApproach(e.target.value)}
              rows={3}
              data-testid="professor-profile-student-growth-approach"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="학생들이 어떻게 성장하기를 바라는지 작성해 주세요."
            />
          </label>
          <button
            type="submit"
            data-testid="professor-profile-save"
            disabled={saving}
            className="rounded-lg bg-[var(--cc-primary)] px-5 py-2 text-sm font-bold text-[var(--cc-on-primary)] hover:bg-[var(--cc-primary-hover)] disabled:opacity-60"
          >
            {saving ? "저장 중…" : "저장"}
          </button>
          {saveMessage && (
            <p className="text-sm font-medium text-gray-600" data-testid="professor-profile-save-message">
              {saveMessage}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
