import React from "react";
import { BookOpen, Clock, MapPin, User } from "lucide-react";
import type { CourseCatalogEntry } from "../../types";

type Props = {
  entry: CourseCatalogEntry;
  joining: boolean;
  onJoin: (entry: CourseCatalogEntry) => void;
};

export default function CatalogCourseCard({ entry, joining, onJoin }: Props) {
  return (
    <article
      className="m3-surface-card flex flex-col gap-3 rounded-[14px] border border-[var(--cc-outline-variant)] p-4"
      data-testid={`catalog-course-${entry.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-[var(--cc-primary)]">{entry.semester}</p>
          <h3 className="mt-0.5 text-base font-bold text-[#1e2939]">{entry.courseName}</h3>
          <p className="mt-1 text-xs text-[#6a7282]">{entry.courseCode}</p>
        </div>
        {entry.isJoined ? (
          <span className="shrink-0 rounded-full bg-[#dcfce7] px-2.5 py-1 text-[10px] font-bold text-[#008236]">
            참여 중
          </span>
        ) : null}
      </div>

      {entry.description ? (
        <p className="line-clamp-2 text-xs text-[#4a5565]">{entry.description}</p>
      ) : null}

      <ul className="space-y-1 text-xs text-[#364153]">
        {entry.department ? (
          <li className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 shrink-0 text-[#6a7282]" aria-hidden />
            {entry.department}
            {entry.grade ? ` · ${entry.grade}학년` : ""}
            {entry.credit ? ` · ${entry.credit}학점` : ""}
          </li>
        ) : null}
        {entry.professor ? (
          <li className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 shrink-0 text-[#6a7282]" aria-hidden />
            {entry.professor}
          </li>
        ) : null}
        {entry.schedule ? (
          <li className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0 text-[#6a7282]" aria-hidden />
            {entry.schedule}
          </li>
        ) : null}
        {entry.room ? (
          <li className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#6a7282]" aria-hidden />
            {entry.room}
          </li>
        ) : null}
      </ul>

      <button
        type="button"
        disabled={joining}
        onClick={() => onJoin(entry)}
        className="mt-auto w-full rounded-[10px] bg-[#155dfc] px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
        data-testid={`catalog-join-${entry.id}`}
      >
        {joining ? "입장 중…" : entry.isJoined ? "강의 입장" : "강의 입장하기"}
      </button>
    </article>
  );
}
