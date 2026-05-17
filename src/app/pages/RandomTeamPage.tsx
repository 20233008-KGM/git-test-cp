import { useState, useEffect } from "react";
import type { Team, TeamMember } from "../types";
// api.students.getAll은 Supabase의 ai_students 테이블에서 학생 목록을 가져옵니다.
import { api } from "../api/mock-data";

export default function RandomTeamPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamSize, setTeamSize] = useState(4);
  const [students, setStudents] = useState<TeamMember[]>([]);

  useEffect(() => {
    // Supabase에서 가져온 학생 목록을 팀원 형태로 바꾸는 코드입니다.
    api.students.getAll().then((data) => {
      const members: TeamMember[] = data.map((s) => ({
        id: s.id,
        name: s.name,
        studentId: s.studentId,
      }));
      setStudents(members);
    });
  }, []);

  const generateRandomTeams = () => {

    // 랜덤 섞기
    const shuffled = [...students].sort(() => Math.random() - 0.5);

    // 팀 나누기
    const newTeams: Team[] = [];
    for (let i = 0; i < shuffled.length; i += teamSize) {
      newTeams.push({
        id: `team-${newTeams.length + 1}`,
        name: `팀 ${newTeams.length + 1}`,
        members: shuffled.slice(i, i + teamSize),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    setTeams(newTeams);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">랜덤 팀 생성</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <label className="text-gray-700 font-medium">팀당 인원:</label>
          <input
            type="number"
            min="2"
            max="10"
            value={teamSize}
            onChange={(e) => setTeamSize(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2 w-20"
          />
          <button
            onClick={generateRandomTeams}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors font-medium"
          >
            팀 생성하기
          </button>
        </div>
      </div>

      {teams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div key={team.id} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {team.name}
              </h2>
              <ul className="space-y-2">
                {team.members.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 text-gray-700"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-gray-500">
                        {member.studentId}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
