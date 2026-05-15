import { useState } from "react";
import { useNavigate } from "react-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function SignInPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: ""
  });

  const handlechange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  const handlesubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserWithEmailAndPassword(auth, form.email, form.password)
      .then((userCredential) => {
        const user = userCredential.user;

        const userData = {
          email: user.email,
          uid: user.uid,
          role: form.role
        };

        // return superbase.from("users").insert([userData]);
      })
      .then(() => {
        alert("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.");
        navigate("/signin");
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        alert(`회원가입 실패: ${errorMessage}`);
      });
  }


  return (
    <div className="min-h-screen w-full flex flex-col" style={{
      backgroundImage: "linear-gradient(141.655deg, rgb(239, 246, 255) 0%, rgb(238, 242, 255) 50%, rgb(250, 245, 255) 100%)",
    }}>
      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 relative">
        {/* 배경 그리드 */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: "linear-gradient(90deg, rgb(229, 231, 235) 1px, transparent 1px), linear-gradient(rgb(229, 231, 235) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
        </div>

        {/* 배경 텍스트 - WELCOME */}
        <div className="absolute top-8 left-4 text-[100px] sm:text-[120px] lg:text-[128px] font-black text-gray-400 opacity-30 select-none">
          WELCOME
        </div>

        {/* 배경 텍스트 - 환영합니다 (오른쪽 하단) */}
        <div className="absolute bottom-20 right-4 text-[100px] sm:text-[120px] lg:text-[128px] font-black text-gray-400 opacity-30 select-none">
          환영합니다
        </div>

        {/* 왼쪽 상단 카드 - 수강인원 */}
        <div className="absolute top-12 left-8 bg-white rounded-xl shadow-lg p-4 w-32 sm:w-40">
          <div className="text-center">
            <div className="text-2xl mb-2">👥</div>
            <p className="text-xs font-bold text-gray-900 mb-1">수강인원</p>
            <p className="text-[10px] text-gray-600">45명이 수강중입니다</p>
          </div>
        </div>

        {/* 오른쪽 상단 카드 - Q&A 게시판 */}
        <div className="absolute top-12 right-8 bg-white rounded-xl shadow-lg p-4 w-32 sm:w-40">
          <div className="text-center">
            <div className="text-2xl mb-2">💬</div>
            <p className="text-xs font-bold text-gray-900 mb-1">Q&A 게시판</p>
            <p className="text-[10px] text-gray-600">질문하고 답변 공유</p>
          </div>
        </div>

        {/* 중앙 회원가입 폼 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[380px]">
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

            <form onSubmit={handlesubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  이메일
                </label>
                <input
                  type="text"
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
                  name="role"
                  onChange={handlechange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">선택하세요</option>
                  <option value="student">학생</option>
                  <option value="instructor">교수</option>
                </select>
              </div>

              <button
                type="submit"
                onClick={handlesubmit}
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
