import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import type { Signupinput } from "../contexts/AuthContext";
import { UserRole } from "../types";

export default function SignInPage() {
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
    role: "student" as UserRole
  });

  // 이메일/비밀번호 input이나 역할 select 값이 바뀔 때 실행됩니다.
  const handlechange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev: Partial<Signupinput>) => ({
      ...prev,
      [name]: value,
    }));
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
      });

      // 회원가입이 성공하면 과목 목록 페이지로 이동합니다.
      navigate("/");
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

        {/* 왼쪽 상단 카드 - 수강인원 */}
        <div className="hidden w-32 rounded-xl bg-white p-4 shadow-lg sm:col-start-1 sm:row-start-1 sm:mt-12 sm:ml-8 sm:block sm:w-40 sm:self-start sm:justify-self-start">
          <div className="text-center">
            <div className="text-2xl mb-2">👥</div>
            <p className="text-xs font-bold text-gray-900 mb-1">수강인원</p>
            <p className="text-[10px] text-gray-600">45명이 수강중입니다</p>
          </div>
        </div>

        {/* 오른쪽 상단 카드 - Q&A 게시판 */}
        <div className="hidden w-32 rounded-xl bg-white p-4 shadow-lg sm:col-start-1 sm:row-start-1 sm:mt-12 sm:mr-8 sm:block sm:w-40 sm:self-start sm:justify-self-end">
          <div className="text-center">
            <div className="text-2xl mb-2">💬</div>
            <p className="text-xs font-bold text-gray-900 mb-1">Q&A 게시판</p>
            <p className="text-[10px] text-gray-600">질문하고 답변 공유</p>
          </div>
        </div>

        {/* 중앙 회원가입 폼 */}
        <div className="z-10 col-start-1 row-start-1 w-full max-w-[380px]">
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-1">
              CampusConnect
            </h1>
            <p className="text-sm text-gray-600">웹개발 수업 협업 플랫폼</p>
          </div>

          <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-center text-gray-900 mb-6">
              회원가입
            </h2>

            {/* form 안의 submit 버튼을 누르면 onSubmit에 연결된 handleSignIn이 실행됩니다. */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  이름
                </label>
                <input
                  type="text"
                  // name이 "name"이므로 handlechange에서 form.name을 바꿉니다.
                  name="name"
                  onChange={handlechange}
                  placeholder="홍길동"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  이메일
                </label>
                <input
                  type="text"
                  // name이 "email"이므로 handlechange에서 form.email을 바꿉니다.
                  name="email"
                  onChange={handlechange}
                  placeholder="student@example.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  비밀번호
                </label>
                <input
                  type="password"
                  // name이 "password"이므로 handlechange에서 form.password를 바꿉니다.
                  name="password"
                  onChange={handlechange}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* 역할 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  역할
                </label>
                <select
                  // name이 "role"이므로 handlechange에서 form.role을 바꿉니다.
                  name="role"
                  onChange={handlechange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  {/* value가 실제로 form.role에 저장되는 값입니다. */}
                  <option value="">선택하세요</option>
                  <option value="student">학생</option>
                  <option value="professor">교수</option>
                </select>
              </div>

              <button
                // submit 버튼이라서 클릭하면 form의 onSubmit이 실행됩니다.
                type="submit"
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
            <p className="text-gray-400 text-xs">
              학생들의 팀 프로젝트 협업을 위한 올인원 플랫폼
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-2">연락처</h4>
            <div className="space-y-1 text-xs text-gray-400">
              <p>support@campusconnect.com</p>
              <p>02-1234-5678</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-2">바로가기</h4>
            <div className="flex gap-3 text-xs text-gray-400">
              <a href="#" className="hover:text-white">이용약관</a>
              <a href="#" className="hover:text-white">개인정보처리방침</a>
              <a href="#" className="hover:text-white">FAQ</a>
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
