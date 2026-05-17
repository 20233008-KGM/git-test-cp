import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { AdminProfile, StudentProfile, ProfessorProfile, UserRole } from "../types";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { supabase } from "../supabase";

export type Signupinput = {
  name: string;
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
    // Firebase Auth 상태를 기준으로 로그인 유지 여부를 확인합니다.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Firebase로 로그인된 사용자라면 Supabase ai_users에서 서비스 프로필을 가져옵니다.
        const { data: userData } = await supabase
          .from("ai_users")
          .select("*")
          .eq("firebase_uid", firebaseUser.uid)
          .single();

        if (userData) setUser(userData);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (input: Signupinput) => {
    // 회원가입 요청이 시작됐다는 표시입니다.
    // 이 값이 true이면 화면에서 로딩 스피너 같은 것을 보여줄 수 있습니다.
    setIsLoading(true);
    try {
      // input은 회원가입할 때 필요한 정보 묶음입니다.
      // 예: { name: "...", email: "...", password: "...", role: "student" }
      // 이렇게 객체 하나로 받으면 나중에 name, major 같은 값이 추가돼도 함수 인자를 계속 늘리지 않아도 됩니다.
      const { name, email, password, role } = input;

      // Firebase Auth에 계정을 만들고, Firebase uid를 Supabase에 저장합니다.
      const firebaseUid = (await createUserWithEmailAndPassword(auth, email, password)).user.uid;

      // Supabase ai_users 테이블에 저장할 사용자 정보입니다.
      // Firebase는 로그인 담당, Supabase는 우리 서비스에서 필요한 유저 정보 저장 담당이라고 생각하면 됩니다.
      // 비밀번호 원문은 절대 Supabase에 저장하지 않습니다. 비밀번호는 Firebase Auth가 안전하게 관리합니다.
      const userData = {
        email,
        firebase_uid: firebaseUid,
        name,
        role,
      };

      // 위에서 만든 userData를 Supabase의 ai_users 테이블에 한 줄 추가합니다.
      // 나중에 name, major, studentId 같은 값도 여기에 같이 넣으면 됩니다.
      await supabase.from("ai_users").upsert([userData], { onConflict: "firebase_uid" });
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

      // Supabase ai_users 테이블에서 해당 uid의 사용자 정보 가져오기
      const { data: userData } = await supabase
        .from("ai_users")
        .select("*")
        .eq("firebase_uid", userCredential.user.uid)
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
    signOut(auth);
    setUser(null);
    setIsAuthenticated(false);
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
