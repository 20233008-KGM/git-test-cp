import React from "react";

type Props = {
  illustrationKey: string;
  className?: string;
};

export default function PeerEvaluationIllustration({ illustrationKey, className }: Props) {
  const key = illustrationKey.trim() || "teamSpark";

  return (
    <div
      className={`h-20 w-20 shrink-0 text-[#155dfc] ${className ?? ""}`}
      aria-hidden="true"
      data-testid="student-profile-peer-illustration"
      data-illustration-key={key}
    >
      {key === "leaderFlag" && <LeaderFlag />}
      {key === "careHeart" && <CareHeart />}
      {key === "humorStar" && <HumorStar />}
      {key === "clockShield" && <ClockShield />}
      {key === "flexWave" && <FlexWave />}
      {key === "teamJoy" && <TeamJoy />}
      {!["leaderFlag", "careHeart", "humorStar", "clockShield", "flexWave", "teamJoy"].includes(key) && (
        <TeamSpark />
      )}
    </div>
  );
}

function SvgFrame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 80 80" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      {children}
    </svg>
  );
}

function TeamSpark() {
  return (
    <SvgFrame>
      <circle cx="40" cy="40" r="38" fill="#eff6ff" />
      <circle cx="27" cy="30" r="6" fill="#155dfc" />
      <circle cx="53" cy="30" r="6" fill="#2b7fff" />
      <circle cx="40" cy="24" r="6" fill="#3b82f6" />
      <path d="M18 54c1-7 6-11 12-11s11 4 12 11" fill="#155dfc" />
      <path d="M38 54c1-7 6-11 12-11s11 4 12 11" fill="#2b7fff" />
      <path d="M28 58h24c4 0 6 2 6 6H22c0-4 2-6 6-6Z" fill="#bedbff" />
    </SvgFrame>
  );
}

function LeaderFlag() {
  return (
    <SvgFrame>
      <circle cx="40" cy="40" r="38" fill="#eff6ff" />
      <rect x="35" y="18" width="4" height="34" rx="2" fill="#155dfc" />
      <path d="M39 19h18l-7 7 7 7H39v-14Z" fill="#2b7fff" />
      <circle cx="24" cy="50" r="5" fill="#2b7fff" />
      <circle cx="40" cy="56" r="5" fill="#3b82f6" />
      <circle cx="55" cy="50" r="5" fill="#60a5fa" />
      <path d="M15 66c2-8 7-12 9-12s7 4 9 12H15Z" fill="#155dfc" />
      <path d="M31 66c2-8 7-12 9-12s7 4 9 12H31Z" fill="#2b7fff" />
      <path d="M46 66c2-8 7-12 9-12s7 4 9 12H46Z" fill="#3b82f6" />
    </SvgFrame>
  );
}

function CareHeart() {
  return (
    <SvgFrame>
      <circle cx="40" cy="40" r="38" fill="#eff6ff" />
      <path d="M40 58s-14-8-14-18a8 8 0 0 1 14-5 8 8 0 0 1 14 5c0 10-14 18-14 18Z" fill="#155dfc" />
      <circle cx="25" cy="26" r="5" fill="#93c5fd" />
      <circle cx="55" cy="26" r="5" fill="#93c5fd" />
    </SvgFrame>
  );
}

function HumorStar() {
  return (
    <SvgFrame>
      <circle cx="40" cy="40" r="38" fill="#eff6ff" />
      <path d="m40 20 4 10 11 1-8 7 2 11-9-6-9 6 2-11-8-7 11-1 4-10Z" fill="#155dfc" />
      <circle cx="25" cy="52" r="4" fill="#93c5fd" />
      <circle cx="55" cy="52" r="4" fill="#93c5fd" />
    </SvgFrame>
  );
}

function ClockShield() {
  return (
    <SvgFrame>
      <circle cx="40" cy="40" r="38" fill="#eff6ff" />
      <circle cx="32" cy="36" r="12" fill="#155dfc" />
      <path d="M32 29v7l5 3" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M46 26h14v12c0 10-7 16-14 18-7-2-14-8-14-18V26h14Z" fill="#2b7fff" />
    </SvgFrame>
  );
}

function FlexWave() {
  return (
    <SvgFrame>
      <circle cx="40" cy="40" r="38" fill="#eff6ff" />
      <path d="M14 49c8 0 8-10 16-10s8 10 16 10 8-10 16-10 8 10 16 10" stroke="#155dfc" strokeWidth="4" strokeLinecap="round" />
      <circle cx="24" cy="30" r="5" fill="#2b7fff" />
      <circle cx="56" cy="30" r="5" fill="#60a5fa" />
    </SvgFrame>
  );
}

function TeamJoy() {
  return (
    <SvgFrame>
      <circle cx="40" cy="40" r="38" fill="#eff6ff" />
      <circle cx="25" cy="34" r="6" fill="#2b7fff" />
      <circle cx="40" cy="28" r="6" fill="#155dfc" />
      <circle cx="55" cy="34" r="6" fill="#3b82f6" />
      <path d="M17 58c2-7 6-11 8-11 3 0 7 4 9 11H17Z" fill="#2b7fff" />
      <path d="M32 58c2-7 6-11 8-11 3 0 7 4 9 11H32Z" fill="#155dfc" />
      <path d="M47 58c2-7 6-11 8-11 3 0 7 4 9 11H47Z" fill="#3b82f6" />
    </SvgFrame>
  );
}
