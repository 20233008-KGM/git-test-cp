import React, { useState } from "react";
import { useNavigate } from "react-router";
import PlaceholderFooterLink from "../components/PlaceholderFooterLink";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useAuth } from "../contexts/AuthContext";
import type { Signupinput } from "../contexts/AuthContext";
import { UserRole } from "../types";

const SIGNUP_SKILL_PRESETS = [
  "React",
  "TypeScript",
  "Node.js",
  "Python",
  "Java",
  "Spring",
  "Figma",
  "UI/UX",
  "기획",
  "데이터분석",
  "Docker",
  "Git",
] as const;

export default function SignInPage() {
  useDocumentTitle();
  // 페이지 이동을 도와주는 함수입니다.
  // 예: 회원가입 성공 후 "/app/courses" 페이지로 이동할 때 사용합니다.
  const navigate = useNavigate();

  // AuthContext에서 회원가입 함수를 꺼내옵니다.
  // Firebase/Supabase에 실제로 가입시키는 코드는 AuthContext.tsx에 있습니다.
  const { signInWithEmail } = useAuth();

  // 사용자가 입력한 이름, 이메일, 비밀번호, 역할을 저장하는 상태입니다.
  // input/select 값이 바뀔 때마다 setForm으로 이 값들을 업데이트합니다.
  const [form, setForm] = useState<Partial<Signupinput>>({
    name: "",
    email: "",
    password: "",
    role: "student" as UserRole,
    skills: [],
  });
  const [customSkill, setCustomSkill] = useState("");

  const selectedSkills = form.skills ?? [];

  const toggleSkill = (skill: string) => {
    setForm((prev) => {
      const current = prev.skills ?? [];
      const next = current.includes(skill)
        ? current.filter((s) => s !== skill)
        : current.length < 12
          ? [...current, skill]
          : current;
      return { ...prev, skills: next };
    });
  };

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (!trimmed) return;
    setForm((prev) => {
      const current = prev.skills ?? [];
      if (current.includes(trimmed) || current.length >= 12) return prev;
      return { ...prev, skills: [...current, trimmed] };
    });
    setCustomSkill("");
  };

  // 이메일/비밀번호 input이나 역할 select 값이 바뀔 때 실행됩니다.
  const handlechange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev: Partial<Signupinput>) => {
      const next = { ...prev, [name]: value };
      if (name === "role" && value === "professor") {
        next.skills = [];
      }
      return next;
    });
    if (name === "role" && value === "professor") {
      setCustomSkill("");
    }
  };

  // 회원가입 폼이 제출될 때 실행됩니다.
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    // 브라우저의 기본 form 제출 동작은 페이지 새로고침입니다.
    // React에서는 새로고침 없이 직접 처리하려고 이 기본 동작을 막습니다.
    e.preventDefault();

    // 필수값을 모두 입력했는지 확인합니다.
    if (!form.name || !form.email || !form.password || !form.role) {
      alert("이름, 이메일, 비밀번호, 역할을 모두 입력해주세요");
      return;
    }

    try {
      // AuthContext의 signInWithEmail 함수에 회원가입 정보를 넘깁니다.
      // 객체 하나로 넘기면 나중에 name, major 같은 값을 추가하기 쉽습니다.
      await signInWithEmail({
        name: form.name as string,
        email: form.email as string,
        password: form.password as string,
        role: form.role as UserRole,
        skills: form.role === "student" ? form.skills : undefined,
      });

      navigate("/app/courses");
    } catch (error) {
      // Firebase/Supabase가 돌려준 실제 에러를 콘솔에 남겨야 400 원인을 확인하기 쉽습니다.
      console.error("회원가입 실패:", error);
      alert("회원가입 실패: 콘솔의 에러 메시지를 확인해주세요");
    }
  };


  return (
    // 이 페이지 전체를 감싸는 가장 바깥 영역입니다.
    // min-h-screen은 화면 높이를 꽉 채우라는 뜻입니다.
    <div className="min-h-screen w-full overflow-x-hidden flex flex-col" style={{
      backgroundImage: "linear-gradient(141.655deg, rgb(239, 246, 255) 0%, rgb(238, 242, 255) 50%, rgb(250, 245, 255) 100%)",
    }}>
      {/* 메인 컨텐츠 영역 */}
      <div className="grid flex-1 place-items-center overflow-hidden px-4 py-10">
        {/* 배경 그리드 */}
        <div className="pointer-events-none col-start-1 row-start-1 h-full w-full self-stretch justify-self-stretch opacity-5">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: "linear-gradient(90deg, rgb(229, 231, 235) 1px, transparent 1px), linear-gradient(rgb(229, 231, 235) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
        </div>

        {/* 배경 텍스트 - WELCOME */}
        <div className="pointer-events-none hidden select-none text-[100px] font-black text-gray-400 opacity-30 sm:col-start-1 sm:row-start-1 sm:block sm:self-start sm:justify-self-start sm:text-[120px] lg:text-[128px]">
          WELCOME
        </div>

        {/* 배경 텍스트 - 환영합니다 (오른쪽 하단) */}
        <div className="pointer-events-none hidden select-none text-[100px] font-black text-gray-400 opacity-30 sm:col-start-1 sm:row-start-1 sm:block sm:self-end sm:justify-self-end sm:text-[120px] lg:text-[128px]">
          환영합니다
        </div>

        {/* 중앙 회원가입 폼 */}
        <div className="z-10 col-start-1 row-start-1 w-full max-w-[380px]">
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-1">
              CampusConnect
            </h1>
            <p className="text-sm text-gray-600">원할한 팀플을 위한 올인원 플랫폼</p>
          </div>

          <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-center text-gray-900 mb-6">
              회원가입
            </h2>

            {/* form 안의 submit 버튼을 누르면 onSubmit에 연결된 handleSignIn이 실행됩니다. */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="cc-form-label mb-1.5 block text-sm font-medium">
                  이름
                </label>
                <input
                  type="text"
                  // name이 "name"이므로 handlechange에서 form.name을 바꿉니다.
                  name="name"
                  onChange={handlechange}
                  placeholder="홍길동"
                  data-testid="signup-name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="cc-form-label mb-1.5 block text-sm font-medium">
                  이메일
                </label>
                <input
                  type="text"
                  // name이 "email"이므로 handlechange에서 form.email을 바꿉니다.
                  name="email"
                  onChange={handlechange}
                  placeholder="student@example.com"
                  data-testid="signup-email"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="cc-form-label mb-1.5 block text-sm font-medium">
                  비밀번호
                </label>
                <input
                  type="password"
                  // name이 "password"이므로 handlechange에서 form.password를 바꿉니다.
                  name="password"
                  onChange={handlechange}
                  placeholder="••••••••"
                  minLength={8}
                  autoComplete="new-password"
                  data-testid="signup-password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <p className="mt-1.5 text-xs text-gray-500" data-testid="signup-password-hint">
                  비밀번호는 8자 이상이어야 합니다.
                </p>
              </div>

              {/* 역할 선택 */}
              <div>
                <label className="cc-form-label mb-1.5 block text-sm font-medium">
                  역할
                </label>
                <select
                  // name이 "role"이므로 handlechange에서 form.role을 바꿉니다.
                  name="role"
                  onChange={handlechange}
                  data-testid="signup-role"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  {/* value가 실제로 form.role에 저장되는 값입니다. */}
                  <option value="">선택하세요</option>
                  <option value="student">학생</option>
                  <option value="professor">교수</option>
                </select>
              </div>

              {form.role === "student" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    기술·역량 태그 (최대 12개)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SIGNUP_SKILL_PRESETS.map((skill) => {
                      const active = selectedSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${active
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-gray-300 bg-white text-gray-700 hover:border-blue-400"
                            }`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={customSkill}
                      onChange={(e) => setCustomSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomSkill();
                        }
                      }}
                      placeholder="직접 입력"
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addCustomSkill}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                    >
                      추가
                    </button>
                  </div>
                  {selectedSkills.length > 0 && (
                    <p className="mt-2 text-xs text-gray-600">
                      선택: {selectedSkills.join(", ")}
                    </p>
                  )}
                </div>
              )}

              <button
                // submit 버튼이라서 클릭하면 form의 onSubmit이 실행됩니다.
                type="submit"
                data-testid="signup-submit"
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md text-sm"
              >
                회원가입
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 작은 Footer */}
      <footer className="bg-[#0f172a] py-6 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          <div>
            <h3 className="font-bold text-white mb-2">CampusConnect</h3>
            <p className="cc-text-muted text-xs">
              학생들의 팀 프로젝트 협업을 위한 올인원 플랫폼
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-2">연락처</h4>
            <div className="space-y-1 text-xs cc-text-muted">
              <p>support@campusconnect.com</p>
              <p>02-1234-5678</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-2">바로가기</h4>
            <div className="flex flex-wrap gap-3 text-xs text-gray-300">
              <PlaceholderFooterLink className="hover:text-white">이용약관</PlaceholderFooterLink>
              <PlaceholderFooterLink className="hover:text-white">개인정보처리방침</PlaceholderFooterLink>
              <PlaceholderFooterLink className="hover:text-white">FAQ</PlaceholderFooterLink>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-4 pt-4 border-t border-gray-800 text-center text-xs text-gray-500">
          <p>© 2026 CampusConnect. All rights reserved. 본 서비스는 교육 목적으로 제작된 프로젝트입니다.</p>
        </div>
      </footer>
    </div>
  );
}
