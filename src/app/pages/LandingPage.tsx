import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { api } from "../api/supabase-api";
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";
import type { AuthPageSummary } from "../types";

export default function LandingPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [pageSummary, setPageSummary] = useState<AuthPageSummary | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: ""
  });

  useEffect(() => {
    api.auth.getPageSummary().then(setPageSummary);
  }, []);

  const handlechange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlesubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      navigate("/app/courses");
    } catch (error) {
      console.error("로그인 실패:", error);
      alert("로그인 실패: 이메일 또는 비밀번호를 확인해주세요.");
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden flex flex-col" style={{
      backgroundImage: "linear-gradient(141.655deg, rgb(239, 246, 255) 0%, rgb(238, 242, 255) 50%, rgb(250, 245, 255) 100%)",
    }}>
      <div className="grid flex-1 place-items-center overflow-hidden px-4 py-10">
        <div className="pointer-events-none col-start-1 row-start-1 h-full w-full self-stretch justify-self-stretch opacity-5">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: "linear-gradient(90deg, rgb(229, 231, 235) 1px, transparent 1px), linear-gradient(rgb(229, 231, 235) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
        </div>

        <div className="pointer-events-none hidden select-none text-[100px] font-black text-gray-400 opacity-30 sm:col-start-1 sm:row-start-1 sm:block sm:self-start sm:justify-self-start sm:text-[120px] lg:text-[128px]">
          WELCOME
        </div>

        <div className="pointer-events-none hidden select-none text-[100px] font-black text-gray-400 opacity-30 sm:col-start-1 sm:row-start-1 sm:block sm:self-end sm:justify-self-end sm:text-[120px] lg:text-[128px]">
          환영합니다
        </div>

        <div className="hidden w-32 rounded-xl bg-white p-4 shadow-lg sm:col-start-1 sm:row-start-1 sm:mt-12 sm:ml-8 sm:block sm:w-40 sm:self-start sm:justify-self-start">
          <div className="text-center">
            <div className="text-2xl mb-2">👥</div>
            <p className="text-xs font-bold text-gray-900 mb-1">수강인원</p>
            <p className="text-[10px] text-gray-600">
              {pageSummary?.activeCourseStudentCount ?? 0}명이 수강중입니다
            </p>
          </div>
        </div>

        <div className="hidden w-32 rounded-xl bg-white p-4 shadow-lg sm:col-start-1 sm:row-start-1 sm:mt-12 sm:mr-8 sm:block sm:w-40 sm:self-start sm:justify-self-end">
          <div className="text-center">
            <div className="text-2xl mb-2">💬</div>
            <p className="text-xs font-bold text-gray-900 mb-1">Q&A 게시판</p>
            <p className="text-[10px] text-gray-600">질문하고 답변 공유</p>
          </div>
        </div>

        <div className="z-10 col-start-1 row-start-1 w-full max-w-[380px]">
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-1">
              CampusConnect
            </h1>
            <p className="text-sm text-gray-600">웹개발 수업 협업 플랫폼</p>
          </div>

          <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-center text-gray-900 mb-6">
              로그인
            </h2>

            <form onSubmit={handlesubmit} className="space-y-4" data-testid="landing-login-form">
              <div>
                <label
                  htmlFor="landing-email"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  학번 또는 이메일
                </label>
                <input
                  id="landing-email"
                  type="text"
                  name="email"
                  autoComplete="username"
                  onChange={handlechange}
                  placeholder={pageSummary?.exampleEmail ?? ""}
                  data-testid="landing-email-input"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="landing-password"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  비밀번호
                </label>
                <input
                  id="landing-password"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  onChange={handlechange}
                  placeholder="••••••••"
                  data-testid="landing-password-input"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <button
                type="submit"
                data-testid="landing-login-submit"
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md text-sm"
              >
                로그인
              </button>
            </form>

            <div className="mt-5 text-center text-xs">
              <a href="#" className="text-blue-600 hover:underline">
                비밀번호를 잊으셨나요?
              </a>
              <span className="text-gray-400 mx-2">|</span>
              <Link to="/signin" className="text-blue-600 hover:underline">
                회원가입
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer variant="compact" />
    </div>
  );
}
