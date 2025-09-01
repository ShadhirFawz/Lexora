"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/courses")
      .then(setCourses)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-4">Loading...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Manage Courses</h1>
      {courses.length === 0 ? (
        <p className="text-gray-500">You haven’t created any courses yet.</p>
      ) : (
        <ul className="space-y-3">
          {courses.map((c) => (
            <li
              key={c.id}
              className="p-4 bg-white rounded-lg shadow flex justify-between"
            >
              <div>
                <h2 className="font-medium">{c.title}</h2>
                <p className="text-gray-500">{c.description}</p>
                <p className="text-sm text-gray-400">
                  Students: {c.students?.length ?? 0}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
