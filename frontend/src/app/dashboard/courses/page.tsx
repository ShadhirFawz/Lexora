"use client";

import DashboardLayout from "@/components/DashboardLayout";

export default function CoursesPage() {
  return (
    <DashboardLayout>
      <h2 className="text-2xl font-bold mb-4">My Courses</h2>
      <p className="text-gray-700">
        Here you will see your enrolled or created courses.
      </p>
    </DashboardLayout>
  );
}
