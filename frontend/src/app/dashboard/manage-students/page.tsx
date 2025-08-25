"use client";

import DashboardLayout from "@/components/DashboardLayout";

export default function ManageStudentsPage() {
  return (
    <DashboardLayout>
      <h2 className="text-2xl font-bold mb-4">Manage Students</h2>
      <p className="text-gray-700">
        Instructors can view and manage enrolled students here.
      </p>
    </DashboardLayout>
  );
}
