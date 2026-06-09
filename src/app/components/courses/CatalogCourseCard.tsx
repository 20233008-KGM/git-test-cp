import React from "react";
import { BookOpen, Clock, GraduationCap, LogIn, MapPin, User } from "lucide-react";
import type { CourseCatalogEntry } from "../../types";

type Props = {
  entry: CourseCatalogEntry;
  joining: boolean;
  isMyInstructorCourse?: boolean;
  onJoin: (entry: CourseCatalogEntry) => void;
};

export default function CatalogCourseCard({
  entry,
  joining,
  isMyInstructorCourse = false,
  onJoin,
}: Props) {
  const departmentLabel = [
    entry.department,
    entry.grade ? `${entry.grade}학년` : null,
    entry.credit ? `${entry.credit}학점` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const hasAssignedProfessor = Boolean(entry.professorId?.trim());
  const cardClassName = [
    "cc-course-card cc-catalog-card m3-surface-card--elevated flex h-full flex-col",
    hasAssignedProfessor ? "cc-course-card--with-professor" : "cc-course-card--no-professor",
    isMyInstructorCourse ? "cc-course-card--my-instructor" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={cardClassName}
      data-testid={`catalog-course-${entry.id}`}
      data-course-has-professor={hasAssignedProfessor ? "true" : "false"}
      data-course-my-instructor={isMyInstructorCourse ? "true" : "false"}
    >
      <div className="cc-course-card__accent" aria-hidden />

      <div className="cc-course-card__body">
        <div className="cc-course-card__head">
          <div className="cc-course-card__head-row">
            <span className="cc-course-card__semester">{entry.semester}</span>
            <div className="cc-course-card__badges">
              {hasAssignedProfessor ? (
                <span
                  className={`cc-course-card__professor-badge ${
                    isMyInstructorCourse ? "cc-course-card__professor-badge--mine" : ""
                  }`}
                  data-testid={`catalog-course-professor-badge-${entry.id}`}
                >
                  <GraduationCap className="h-3 w-3 shrink-0" aria-hidden />
                  {isMyInstructorCourse ? "내 담당 수업" : "담당 교수 배정"}
                </span>
              ) : (
                <span
                  className="cc-course-card__professor-badge cc-course-card__professor-badge--empty"
                  data-testid={`catalog-course-professor-badge-${entry.id}`}
                >
                  교수 미배정
                </span>
              )}
              <span className="cc-badge-success rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                수강 가능
              </span>
            </div>
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
          <div className="cc-course-card__meta-item">
            <dt className="cc-course-card__meta-label">
              <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
              교수
            </dt>
            <dd
              className={`cc-course-card__meta-value ${
                hasAssignedProfessor ? "cc-course-card__meta-value--professor" : ""
              }`}
            >
              {hasAssignedProfessor ? entry.professor || "배정됨" : "미배정"}
            </dd>
          </div>
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
