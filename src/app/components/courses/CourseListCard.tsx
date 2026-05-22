import React from "react";
import { Link } from "react-router";
import { Clock, Copy, GitBranch, MapPin, User, Users } from "lucide-react";
import type { Course } from "../../types";

type CourseListCardProps = {
  course: Course;
  canManageCourses: boolean;
  canArchiveCourse: boolean;
  canManageThisCourse: boolean;
  submitting: boolean;
  onCopyCode: (code: string) => void;
  onArchive: (course: Course) => void;
  onDelete: (course: Course) => void;
};

export default function CourseListCard({
  course,
  canManageCourses,
  canArchiveCourse,
  canManageThisCourse,
  submitting,
  onCopyCode,
  onArchive,
  onDelete,
}: CourseListCardProps) {
  const stageCount = course.stageCount ?? course.stages?.length ?? 0;
  const studentLabel = course.maxStudents
    ? `${course.students}/${course.maxStudents}명`
    : `${course.students}명`;

  return (
    <Link
      to={`/app/courses/${course.id}`}
      className="cc-course-card m3-surface-card--elevated m3-surface-card--interactive group"
      data-testid={`course-card-${course.id}`}
    >
      <div className="cc-course-card__accent" aria-hidden />

      <div className="cc-course-card__body">
        <div className="cc-course-card__head">
          <div className="cc-course-card__head-row">
            <span className="cc-course-card__semester">{course.semester}</span>
            {course.status === "archived" ? (
              <span className="cc-badge-archived rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                종료
              </span>
            ) : (
              <span className="cc-badge-success rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                진행 중
              </span>
            )}
          </div>

          <div className="cc-course-card__title-row">
            <h2 className="cc-course-card__title">{course.name}</h2>
            <button
              type="button"
              className="cc-course-card__code cc-course-code"
              title="수업 코드 복사"
              aria-label={`수업 코드 ${course.code} 복사`}
              data-testid={`course-card-copy-code-${course.id}`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onCopyCode(course.code);
              }}
            >
              <Copy className="cc-course-card__code-icon" strokeWidth={1.5} aria-hidden />
              <span>{course.code}</span>
            </button>
          </div>
        </div>

        {course.description ? (
          <p className="cc-course-card__desc">{course.description}</p>
        ) : null}

        <dl className="cc-course-card__meta">
          <div className="cc-course-card__meta-item">
            <dt className="cc-course-card__meta-label">
              <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
              교수
            </dt>
            <dd className="cc-course-card__meta-value">{course.professor}</dd>
          </div>
          <div className="cc-course-card__meta-item">
            <dt className="cc-course-card__meta-label">
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              시간
            </dt>
            <dd className="cc-course-card__meta-value">{course.schedule}</dd>
          </div>
          {course.room ? (
            <div className="cc-course-card__meta-item">
              <dt className="cc-course-card__meta-label">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                강의실
              </dt>
              <dd className="cc-course-card__meta-value">{course.room}</dd>
            </div>
          ) : null}
          <div className="cc-course-card__meta-item">
            <dt className="cc-course-card__meta-label">
              <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
              수강생
            </dt>
            <dd className="cc-course-card__meta-value">{studentLabel}</dd>
          </div>
          <div className="cc-course-card__meta-item">
            <dt className="cc-course-card__meta-label">
              <GitBranch className="h-3.5 w-3.5 shrink-0" aria-hidden />
              팀플 단계
            </dt>
            <dd className="cc-course-card__meta-value">{stageCount}개</dd>
          </div>
        </dl>

        {(canArchiveCourse || canManageThisCourse) && (
          <div className="cc-course-card__actions">
            {canArchiveCourse && (
              <button
                type="button"
                disabled={submitting}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onArchive(course);
                }}
                className="cc-course-card__action cc-course-card__action--danger"
              >
                수업 종료
              </button>
            )}
            {canManageThisCourse && (
              <button
                type="button"
                data-testid={`course-delete-${course.id}`}
                disabled={submitting}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onDelete(course);
                }}
                className="cc-course-card__action cc-course-card__action--neutral"
              >
                수업 삭제
              </button>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
