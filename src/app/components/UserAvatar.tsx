import React from "react";
import { isLikelyImageUrl } from "../utils/studentNetworkDisplay";

const SIZE_STYLES = {
  xs: { box: "h-8 w-8", icon: "h-4 w-4" },
  sm: { box: "h-10 w-10", icon: "h-5 w-5" },
  md: { box: "h-16 w-16", icon: "h-8 w-8" },
  lg: { box: "h-20 w-20", icon: "h-10 w-10" },
} as const;

/** vision #81 — 카카오톡 기본 프로필 느낌의 단색 + 실루엣 */
function DefaultProfileSilhouette({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-3.31 0-6 1.12-6 2.5V18h12v-1.5c0-1.38-2.69-2.5-6-2.5z" />
    </svg>
  );
}

export type UserAvatarSize = keyof typeof SIZE_STYLES;

export type UserAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: UserAvatarSize;
  className?: string;
  alt?: string;
};

export default function UserAvatar({
  name,
  imageUrl,
  size = "sm",
  className = "",
  alt,
}: UserAvatarProps) {
  const styles = SIZE_STYLES[size];
  const initial = (name?.trim() || "?").charAt(0);
  const label = alt ?? (name ? `${name} 프로필` : "프로필");

  if (imageUrl && isLikelyImageUrl(imageUrl)) {
    return (
      <div
        className={`${styles.box} shrink-0 overflow-hidden rounded-full ${className}`}
        aria-hidden={!alt}
      >
        <img src={imageUrl} alt={label} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`cc-default-avatar ${styles.box} flex shrink-0 items-center justify-center rounded-full ${className}`}
      aria-hidden={!alt}
      data-testid="user-avatar-default"
    >
      <DefaultProfileSilhouette className={`${styles.icon} text-[#8b95a1]`} />
      <span className="sr-only">{initial}</span>
    </div>
  );
}
