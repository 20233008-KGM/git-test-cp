import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { AdminProfile, StudentProfile, ProfessorProfile, UserRole } from "../types";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { supabase } from "../supabase";

export type Signupinput = {
  email: string;
  password: string;
  role: UserRole;
}

interface AuthContextType {
  user: AdminProfile | StudentProfile | ProfessorProfile | null;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  isStudent: boolean;
  isProfessor: boolean;
  isAdmin: boolean;
  signInWithEmail: (input: Signupinput) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUserRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminProfile | StudentProfile | ProfessorProfile | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const role = user?.role || null;
  const isStudent = role === "student";
  const isProfessor = role === "professor";
  const isAdmin = role === "admin";

  useEffect(() => {
    // Supabase 세션 확인, 새로고침할시도 동작, 로그인 상태 유지
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // 로그인된 사용자면 정보 로드
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("uid", session.user.id)
          .single();

        if (userData) setUser(userData);
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  // 구버전 회원가입 코드 (Firebase + Supabase)
  // const handleSignIn = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   createUserWithEmailAndPassword(auth, form.email, form.password)
  //     .then((userCredential) => {
  //       const user = userCredential.user;

  //       const userData = {
  //         email: user.email,
  //         uid: user.uid,
  //         role: form.role
  //       };

  //       return supabase.from("users").insert([userData]);
  //     })
  //     .then(() => {
  //       alert("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.");
  //       navigate("/");
  //     })
  //     .catch((error) => {
  //       const errorCode = error.code;
  //       const errorMessage = error.message;
  //       alert(`회원가입 실패: ${errorMessage}`);
  //     });
  // }


  const signInWithEmail = async (input: Signupinput) => {
    // 회원가입 요청이 시작됐다는 표시입니다.
    // 이 값이 true이면 화면에서 로딩 스피너 같은 것을 보여줄 수 있습니다.
    setIsLoading(true);
    try {
      // input은 회원가입할 때 필요한 정보 묶음입니다.
      // 예: { email: "...", password: "...", role: "student" }
      // 이렇게 객체 하나로 받으면 나중에 name, major 같은 값이 추가돼도 함수 인자를 계속 늘리지 않아도 됩니다.
      const { email, password, role } = input;

      // Firebase Auth에 이메일과 비밀번호를 넘겨서 실제 계정을 만듭니다.
      // 여기서 만들어지는 계정은 "로그인할 수 있는 계정"입니다.
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Firebase가 만들어준 사용자 정보입니다.
      // user.uid는 Firebase가 자동으로 만들어주는 고유한 사용자 ID입니다.
      const user = userCredential.user;

      // Supabase users 테이블에 저장할 사용자 정보입니다.
      // Firebase는 로그인 담당, Supabase는 우리 서비스에서 필요한 유저 정보 저장 담당이라고 생각하면 됩니다.
      const userData = {
        email: user.email,
        uid: user.uid,
        role: role,
      };

      // 위에서 만든 userData를 Supabase의 users 테이블에 한 줄 추가합니다.
      // 나중에 name, major, studentId 같은 값도 여기에 같이 넣으면 됩니다.
      await supabase.from("User").insert([userData]);
      alert("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.");

    } catch (error) {
      // 회원가입 중 에러가 나면 이 함수를 호출한 쪽으로 에러를 다시 던집니다.
      // 그러면 화면 쪽에서 "회원가입 실패" 같은 메시지를 보여줄 수 있습니다.
      throw error;
    } finally {
      // 성공하든 실패하든 회원가입 요청은 끝났으니 로딩 상태를 꺼줍니다.
      setIsLoading(false);
    }
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Firebase로 실제 로그인
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Supabase users 테이블에서 해당 uid의 사용자 정보 가져오기
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("uid", userCredential.user.uid)
        .single();

      if (userData) {
        // AuthContext의 user 업데이트
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const setUserRole = (newRole: UserRole) => {
    if (user) {
      if (newRole === "professor") {
        const mockProfessor: ProfessorProfile = {
          id: "prof1",
          name: "김교수",
          email: "prof@example.com",
          role: "professor",
          department: "컴퓨터공학부",
          office: "공학관 301호",
          researchAreas: ["웹 기술", "소프트웨어 공학"],
          officeHours: "화, 목 15:00-17:00",
        };
        setUser(mockProfessor);
      } else if (newRole === "student") {
        const mockStudent: StudentProfile = {
          id: "1",
          name: "류지원",
          email: "student@example.com",
          role: "student",
          studentId: "2021123456",
          major: "컴퓨터공학과",
          skills: ["React", "TypeScript", "Node.js"],
          bio: "웹 개발에 관심이 많은 학생입니다.",
        };
        setUser(mockStudent);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setIsAuthenticated,
        isAuthenticated,
        isLoading,
        role,
        isStudent,
        isProfessor,
        isAdmin,
        signInWithEmail,
        login,
        logout,
        setUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
