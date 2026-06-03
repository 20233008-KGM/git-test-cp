import { useEffect, useState } from "react";
import { api } from "../api/supabase-api";
import { useAuth } from "../contexts/AuthContext";
import type { ProfessorProfile } from "../types";
import PageLoading from "../components/layout/PageLoading";

export default function ProfessorProfilePage() {
  const { user, isProfessor, isAdmin, refreshProfile } = useAuth();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfessorProfile | null>(null);
  const [department, setDepartment] = useState("");
  const [office, setOffice] = useState("");
  const [officeHours, setOfficeHours] = useState("");
  const [researchInput, setResearchInput] = useState("");
  const [bio, setBio] = useState("");
  const [teachingStyle, setTeachingStyle] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || (!isProfessor && !isAdmin)) {
      setLoading(false);
      return;
    }
    void api.professors.getById(user.id).then((data) => {
      if (data) {
        setProfile(data);
        setDepartment(data.department);
        setOffice(data.office);
        setOfficeHours(data.officeHours);
        setResearchInput((data.researchAreas ?? []).join(", "));
        setBio(data.bio ?? "");
        setTeachingStyle(data.teachingStyle ?? "");
      }
      setLoading(false);
    });
  }, [user?.id, isProfessor, isAdmin]);

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
        <div className="mb-6 flex items-center">
          <div className="mr-6 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--cc-primary)] text-3xl font-bold text-[var(--cc-on-primary)]">
            {display.name.charAt(0)}
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
