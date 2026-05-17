import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "../api/mock-data";
import { useAuth } from "../contexts/AuthContext";
import type { Course } from "../types";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    api.courses.getAll().then((data) => {
      setCourses(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-600">?? ?...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <div>???? ?????</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">?? ?? ??</h1>
        <p className="text-gray-600">? {courses.length}? ??</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Link
            key={course.id}
            to={`/app/courses/${course.id}`}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all hover:-translate-y-1"
          >
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-xl font-bold text-gray-900">
                {course.name}
              </h2>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {course.code}
              </span>
            </div>

            {course.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {course.description}
              </p>
            )}

            <div className="space-y-1 text-sm">
              <p className="text-gray-600">??: {course.professor}</p>
              <p className="text-gray-600">??: {course.schedule}</p>
              {course.room && (
                <p className="text-gray-600">???: {course.room}</p>
              )}
              <p className="text-gray-600">
                ???: {course.students}
                {course.maxStudents && `/${course.maxStudents}`}?
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
