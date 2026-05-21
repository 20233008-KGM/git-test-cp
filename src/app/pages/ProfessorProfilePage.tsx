import { useEffect, useState } from "react";
import { api } from "../api/supabase-api";
import { useAuth } from "../contexts/AuthContext";
import type { ProfessorProfile } from "../types";

export default function ProfessorProfilePage() {
  const { user, isProfessor, isAdmin, refreshProfile } = useAuth();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfessorProfile | null>(null);
  const [department, setDepartment] = useState("");
  const [office, setOffice] = useState("");
  const [officeHours, setOfficeHours] = useState("");
  const [researchInput, setResearchInput] = useState("");
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
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <p className="text-gray-600">프로필을 불러오는 중…</p>
      </div>
    );
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
          <div className="mr-6 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-600 text-3xl font-bold text-white">
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
            연구 분야 (쉼표로 구분)
            <input
              value={researchInput}
              onChange={(e) => setResearchInput(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            data-testid="professor-profile-save"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
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
