import type { User } from "firebase/auth";
import { supabase } from "./supabase";

/** H-001 RLS Beta: Supabase Dashboard에서 Firebase provider 활성화 후 `.env`에서 true */
export function isSupabaseFirebaseJwtEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_SUPABASE_FIREBASE_JWT === "true";
}

/**
 * Firebase ID 토큰을 Supabase Auth 세션으로 동기화합니다.
 * 기본값 off — Alpha(anon) 동작 유지. RLS 적용 시에만 켭니다.
 */
export async function syncFirebaseUserToSupabaseSession(
  firebaseUser: User | null
): Promise<void> {
  if (!isSupabaseFirebaseJwtEnabled()) return;

  if (!firebaseUser) {
    await supabase.auth.signOut();
    return;
  }

  try {
    const token = await firebaseUser.getIdToken();
    const { error } = await supabase.auth.signInWithIdToken({
      provider: "firebase",
      token,
    });
    if (error) {
      console.warn(
        "[CampusConnect] Supabase Firebase JWT 동기화 실패:",
        error.message,
        "— Dashboard Firebase provider·33번 가이드를 확인하세요."
      );
    }
  } catch (err) {
    console.warn("[CampusConnect] Firebase ID 토큰 조회 실패:", err);
  }
}

export async function clearSupabaseAuthSession(): Promise<void> {
  if (!isSupabaseFirebaseJwtEnabled()) return;
  await supabase.auth.signOut();
}
