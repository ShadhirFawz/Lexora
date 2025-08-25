"use client";

import DashboardLayout from "@/components/DashboardLayout";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <h2 className="text-black text-2xl font-bold mb-4">Welcome to your Dashboard 🎉</h2>
      <p className="text-gray-700">
        Here you can access courses, manage content, and view analytics.
      </p>
    </DashboardLayout>
  );
}
