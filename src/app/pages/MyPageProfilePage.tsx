import React, { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router";
import svgPaths from "../../imports/Group43/svg-bqpgzlg1zb";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api/supabase-api";
import MyPageShell from "../components/mypage/MyPageShell";
import ProfileFieldLabel from "../components/mypage/ProfileFieldLabel";
import PortfolioAttachmentsPanel from "../components/students/PortfolioAttachmentsPanel";
import { resolveProfileImageUrl } from "../utils/studentNetworkDisplay";
import type { PortfolioFileItem } from "../types";

export default function MyPageProfilePage() {
  const { user, refreshProfile } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileEditForm, setProfileEditForm] = useState({
    name: "",
    studentId: "",
    school: "",
    major: "",
    bio: "",
    skills: [] as string[],
  });
  const [portfolioFiles, setPortfolioFiles] = useState<PortfolioFileItem[]>([]);
  const [profileEditSkillDraft, setProfileEditSkillDraft] = useState("");
  const [profileSaveMessage, setProfileSaveMessage] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  const profileEmail = user?.email ?? "-";
  const profileInitial = (user?.name ?? "?").slice(0, 1);

  useEffect(() => {
    if (user?.role !== "student") return;
    setProfileEditForm({
      name: user.name ?? "",
      studentId: user.studentId ?? "",
      school: user.school ?? "",
      major: user.major ?? "",
      bio: user.bio ?? "",
      skills: [...(user.skills ?? [])],
    });
  }, [user]);

  useEffect(() => {
    if (!user?.id) {
      setProfileImageUrl(null);
      return;
    }
    let cancelled = false;
    void api.myPage
      .getProfile()
      .then((profile) => {
        if (!cancelled) setProfileImageUrl(resolveProfileImageUrl(profile.imageUrl) ?? null);
      })
      .catch(() => {
        if (!cancelled) setProfileImageUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    const url = resolveProfileImageUrl(user?.imageUrl);
    if (url) setProfileImageUrl(url);
  }, [user?.imageUrl]);

  useEffect(() => {
    if (user?.role !== "student") return;
    let cancelled = false;
    void api.studentNetwork.getEditForm().then((form) => {
      if (!cancelled) setPortfolioFiles(form.portfolioFiles);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.role, user?.id]);

  const reloadPortfolioFiles = () => {
    void api.studentNetwork.getEditForm().then((form) => setPortfolioFiles(form.portfolioFiles));
  };

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

  async function handleSaveStudentProfile() {
    if (user?.role !== "student") return;
    setProfileSaving(true);
    setProfileSaveMessage(null);
    try {
      const saved = await api.myPage.saveStudentProfile(profileEditForm);
      setProfileEditForm(saved);
      await refreshProfile();
      setProfileSaveMessage("프로필이 저장되었습니다.");
    } catch (err) {
      setProfileSaveMessage(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setProfileSaving(false);
    }
  }

  if (user?.role === "professor" || user?.role === "admin") {
    return <Navigate to="/app/profile/professor" replace />;
  }

  return (
    <MyPageShell testId="mypage-profile-page">
      <h1 className="m3-headline-medium cc-text-primary mb-6 font-bold">내 정보</h1>

      <div
        className="m3-surface-card w-full p-6 sm:p-8"
        data-testid="mypage-profile-edit-form"
      >
        <div className="flex flex-col gap-8 md:flex-row md:items-start">
          <div className="flex shrink-0 flex-col items-center gap-2 md:w-[7.5rem]">
            <div
              className={`flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[var(--cc-outline-variant)] text-xl font-bold md:h-24 md:w-24 ${
                profileImageUrl
                  ? "bg-[var(--cc-surface-sunken)]"
                  : "bg-[var(--cc-primary)] text-white"
              }`}
            >
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={user?.name ? `${user.name} 프로필 사진` : "프로필 사진"}
                  className="h-full w-full object-cover"
                />
              ) : (
                profileInitial
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              disabled={avatarUploading}
              onClick={() => avatarInputRef.current?.click()}
              className="flex items-center gap-1 rounded-[var(--m3-shape-full)] border border-[var(--cc-outline-variant)] bg-[var(--cc-surface-container)] px-2 py-1 text-[11px] font-medium leading-tight text-[var(--cc-on-surface-variant)] transition-colors hover:bg-[var(--cc-surface-container-high)] disabled:opacity-50"
              title="프로필 이미지 변경"
            >
              <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24.1667 22.9233" aria-hidden>
                <path
                  d={svgPaths.p38455680}
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              사진 변경
            </button>
            {avatarMessage ? (
              <p className="max-w-[11rem] text-center text-xs font-medium text-[var(--cc-on-surface-variant)]">
                {avatarMessage}
              </p>
            ) : null}
          </div>

          <div className="min-w-0 flex-1 w-full space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <ProfileFieldLabel label="학번">
                <input
                  type="text"
                  value={profileEditForm.studentId}
                  onChange={(e) =>
                    setProfileEditForm((f) => ({ ...f, studentId: e.target.value }))
                  }
                  className="cc-input m3-body-large"
                  data-testid="mypage-profile-student-id"
                  autoComplete="off"
                />
              </ProfileFieldLabel>
              <ProfileFieldLabel label="이름">
                <input
                  type="text"
                  value={profileEditForm.name}
                  onChange={(e) => setProfileEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="cc-input m3-body-large"
                  autoComplete="name"
                />
              </ProfileFieldLabel>
              <ProfileFieldLabel label="이메일" hint="변경 불가">
                <input
                  type="email"
                  readOnly
                  tabIndex={-1}
                  value={profileEmail}
                  className="cc-input cc-input--readonly m3-body-large"
                  aria-readonly
                />
              </ProfileFieldLabel>
              <ProfileFieldLabel label="학교">
                <input
                  type="text"
                  value={profileEditForm.school}
                  onChange={(e) => setProfileEditForm((f) => ({ ...f, school: e.target.value }))}
                  className="cc-input m3-body-large"
                  data-testid="mypage-profile-school"
                  autoComplete="organization"
                />
              </ProfileFieldLabel>
              <div className="sm:col-span-2">
                <ProfileFieldLabel label="전공">
                  <input
                    type="text"
                    value={profileEditForm.major}
                    onChange={(e) => setProfileEditForm((f) => ({ ...f, major: e.target.value }))}
                    className="cc-input m3-body-large"
                    data-testid="mypage-profile-major"
                  />
                </ProfileFieldLabel>
              </div>
              <div className="sm:col-span-2">
                <ProfileFieldLabel label="자기소개">
                  <textarea
                    value={profileEditForm.bio}
                    onChange={(e) => setProfileEditForm((f) => ({ ...f, bio: e.target.value }))}
                    rows={4}
                    className="cc-textarea m3-body-large"
                  />
                </ProfileFieldLabel>
              </div>
            </div>
            <PortfolioAttachmentsPanel
              files={portfolioFiles}
              canManage
              onUpdated={reloadPortfolioFiles}
            />
            <div>
              <p className="m3-label-large mb-2 text-[var(--cc-on-surface-variant)]">기술 태그</p>
              <div className="flex flex-wrap gap-2">
                {profileEditForm.skills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() =>
                      setProfileEditForm((f) => ({
                        ...f,
                        skills: f.skills.filter((s) => s !== skill),
                      }))
                    }
                    className="rounded-[var(--m3-shape-full)] bg-[var(--cc-primary)] px-3 py-1 text-xs font-bold text-white"
                  >
                    {skill} ×
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={profileEditSkillDraft}
                  onChange={(e) => setProfileEditSkillDraft(e.target.value)}
                  placeholder="태그 추가"
                  className="cc-input m3-body-large flex-1"
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    const t = profileEditSkillDraft.trim();
                    if (!t || profileEditForm.skills.includes(t)) return;
                    if (profileEditForm.skills.length >= 12) return;
                    setProfileEditForm((f) => ({ ...f, skills: [...f.skills, t] }));
                    setProfileEditSkillDraft("");
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const t = profileEditSkillDraft.trim();
                    if (!t || profileEditForm.skills.includes(t)) return;
                    if (profileEditForm.skills.length >= 12) return;
                    setProfileEditForm((f) => ({ ...f, skills: [...f.skills, t] }));
                    setProfileEditSkillDraft("");
                  }}
                  className="shrink-0 rounded-[var(--m3-shape-medium)] border border-[var(--cc-outline-variant)] px-3 py-2 text-xs font-bold text-[var(--cc-on-surface)]"
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-[var(--cc-outline-variant)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          {profileSaveMessage ? (
            <p className="m3-body-small text-[var(--cc-on-surface-variant)]">{profileSaveMessage}</p>
          ) : (
            <p className="m3-body-small text-[var(--cc-on-surface-variant)]">
              변경 후 저장 버튼을 눌러 반영하세요.
            </p>
          )}
          <button
            type="button"
            disabled={profileSaving}
            onClick={() => void handleSaveStudentProfile()}
            className="m3-label-large shrink-0 self-end rounded-[var(--m3-shape-medium)] bg-[var(--cc-primary)] px-6 py-2.5 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:self-auto"
            data-testid="mypage-profile-save"
          >
            {profileSaving ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </MyPageShell>
  );
}
