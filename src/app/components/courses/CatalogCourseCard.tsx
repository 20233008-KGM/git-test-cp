import React from "react";
import { BookOpen, Clock, LogIn, MapPin, User } from "lucide-react";
import type { CourseCatalogEntry } from "../../types";

type Props = {
  entry: CourseCatalogEntry;
  joining: boolean;
  onJoin: (entry: CourseCatalogEntry) => void;
};

export default function CatalogCourseCard({ entry, joining, onJoin }: Props) {
  const departmentLabel = [
    entry.department,
    entry.grade ? `${entry.grade}학년` : null,
    entry.credit ? `${entry.credit}학점` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      className="cc-course-card cc-catalog-card m3-surface-card--elevated flex h-full flex-col"
      data-testid={`catalog-course-${entry.id}`}
    >
      <div className="cc-course-card__accent" aria-hidden />

      <div className="cc-course-card__body">
        <div className="cc-course-card__head">
          <div className="cc-course-card__head-row">
            <span className="cc-course-card__semester">{entry.semester}</span>
            <span className="cc-badge-success rounded-full px-2.5 py-0.5 text-[11px] font-bold">
              수강 가능
            </span>
          </div>

          <div className="cc-course-card__title-row">
            <h3 className="cc-course-card__title">{entry.courseName}</h3>
            <span className="cc-course-card__code cc-course-code" aria-label={`학수번호 ${entry.courseCode}`}>
              {entry.courseCode}
            </span>
          </div>
        </div>

        {entry.description ? (
          <p className="cc-course-card__desc">{entry.description}</p>
        ) : null}

        <dl className="cc-course-card__meta">
          {departmentLabel ? (
            <div className="cc-course-card__meta-item">
              <dt className="cc-course-card__meta-label">
                <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
                학과
              </dt>
              <dd className="cc-course-card__meta-value">{departmentLabel}</dd>
            </div>
          ) : null}
          {entry.professor ? (
            <div className="cc-course-card__meta-item">
              <dt className="cc-course-card__meta-label">
                <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
                교수
              </dt>
              <dd className="cc-course-card__meta-value">{entry.professor}</dd>
            </div>
          ) : null}
          {entry.schedule ? (
            <div className="cc-course-card__meta-item">
              <dt className="cc-course-card__meta-label">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                강의 시간
              </dt>
              <dd className="cc-course-card__meta-value">{entry.schedule}</dd>
            </div>
          ) : null}
          {entry.room ? (
            <div className="cc-course-card__meta-item">
              <dt className="cc-course-card__meta-label">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                강의실
              </dt>
              <dd className="cc-course-card__meta-value">{entry.room}</dd>
            </div>
          ) : null}
        </dl>

        <div className="cc-catalog-card__footer">
          <button
            type="button"
            disabled={joining}
            onClick={() => onJoin(entry)}
            className="cc-catalog-card__join"
            data-testid={`catalog-join-${entry.id}`}
          >
            <LogIn className="cc-catalog-card__join-icon" strokeWidth={2} aria-hidden />
            {joining ? "입장 중…" : "강의 입장하기"}
          </button>
        </div>
      </div>
    </article>
  );
}
