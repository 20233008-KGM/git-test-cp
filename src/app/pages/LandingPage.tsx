import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { api } from "../api/supabase-api";
import M3Button from "../components/layout/M3Button";
import PlaceholderFooterLink from "../components/PlaceholderFooterLink";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useAuth } from "../contexts/AuthContext";
import type { AuthPageSummary } from "../types";

export default function LandingPage() {
  useDocumentTitle();
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
    <div
      className="cc-page-bg flex min-h-screen w-full flex-col overflow-x-hidden"
      style={{ backgroundImage: "var(--cc-landing-gradient)" }}
    >
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

        <div
          className="pointer-events-none hidden select-none text-[100px] font-black text-gray-400 opacity-30 sm:col-start-1 sm:row-start-1 sm:block sm:self-start sm:justify-self-start sm:text-[120px] lg:text-[128px]"
          aria-hidden="true"
        >
          WELCOME
        </div>

        <div
          className="pointer-events-none hidden select-none text-[100px] font-black text-gray-400 opacity-30 sm:col-start-1 sm:row-start-1 sm:block sm:self-end sm:justify-self-end sm:text-[120px] lg:text-[128px]"
          aria-hidden="true"
        >
          환영합니다
        </div>

        <main id="main-content" className="z-10 col-start-1 row-start-1 w-full max-w-[380px]" tabIndex={-1}>
          <div className="text-center mb-6">
            <h1 className="m3-headline-medium cc-text-primary mb-1 font-bold sm:text-4xl">
              CampusConnect
            </h1>
            <p className="cc-text-secondary text-sm">웹개발 수업 협업 플랫폼</p>
          </div>

          <div className="cc-card p-6 shadow-[var(--m3-elevation-3)] sm:p-8">
            <h2 className="m3-title-large cc-text-primary mb-6 text-center font-bold">로그인</h2>

            <form onSubmit={handlesubmit} className="space-y-4" data-testid="landing-login-form">
              <div>
                <label htmlFor="landing-email" className="cc-label mb-1.5 block">
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
                  className="cc-input px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label htmlFor="landing-password" className="cc-label mb-1.5 block">
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
                  className="cc-input px-4 py-2.5 text-sm"
                />
              </div>

              <M3Button
                type="submit"
                variant="filled"
                data-testid="landing-login-submit"
                className="w-full"
              >
                로그인
              </M3Button>
            </form>

            <div className="mt-5 text-center text-xs">
              <PlaceholderFooterLink className="cc-link">
                비밀번호를 잊으셨나요?
              </PlaceholderFooterLink>
              <span className="cc-text-muted mx-2">|</span>
              <Link to="/signin" className="cc-link font-medium">
                회원가입
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
