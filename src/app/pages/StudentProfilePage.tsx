import React from "react";
import { useAuth } from "../contexts/AuthContext";
import type { StudentProfile } from "../types";

export default function StudentProfilePage() {
  const { user } = useAuth();

  if (!user || user.role !== "student") {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-600">프로필을 불러올 수 없습니다.</p>
      </div>
    );
  }

  const profile = user as StudentProfile;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center mb-6">
          <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mr-6">
            {profile.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
            <p className="text-gray-600">{profile.studentId ?? ""}</p>
            <p className="text-gray-600">{profile.major ?? ""}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">연락처</h2>
            <p className="text-gray-700">{profile.email}</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">소개</h2>
            <p className="text-gray-700">{profile.bio}</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">기술 스택</h2>
            <div className="flex flex-wrap gap-2">
              {(profile.skills ?? []).map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
