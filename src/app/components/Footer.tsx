import React from "react";

type FooterProps = {
  variant?: "default" | "compact";
};

export default function Footer({ variant = "default" }: FooterProps) {
  if (variant === "compact") {
    return (
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
    );
  }

  return (
    <footer className="bg-[#111827] text-white mt-16">
      <div className="max-w-6xl mx-auto px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <p className="text-xl font-bold mb-2">CampusConnect</p>
          <p className="text-gray-400 text-sm leading-relaxed">
            학생들의 팀 프로젝트 협업을 위한
            <br />
            올인원 플랫폼
          </p>
        </div>
        <div>
          <p className="font-semibold mb-3">연락처</p>
          <ul className="text-gray-400 text-sm space-y-2">
            <li>✉ support@campusconnect.com</li>
            <li>📞 02-1234-5678</li>
            <li>📍 서울특별시 광진구 능동로 209</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-3">바로가기</p>
          <ul className="text-gray-400 text-sm space-y-2">
            <li><a href="#" className="hover:text-white transition-colors">이용약관</a></li>
            <li><a href="#" className="hover:text-white transition-colors">개인정보처리방침</a></li>
            <li><a href="#" className="hover:text-white transition-colors">공지사항</a></li>
            <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 py-6 text-center text-gray-500 text-xs space-y-1">
        <p>© 2026 CampusConnect. All rights reserved.</p>
        <p>본 서비스는 교육 목적으로 제작된 프로젝트입니다.</p>
      </div>
    </footer>
  );
}
