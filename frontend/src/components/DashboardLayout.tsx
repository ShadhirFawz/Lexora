"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { FaChalkboardTeacher, FaBook, FaUsers, FaSignOutAlt } from "react-icons/fa";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      apiFetch("/me", "GET", null, token)
        .then((data) => setUser(data))
        .catch(() => {
          localStorage.removeItem("token");
          router.push("/login");
        });
    }
  }, [router]);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      await apiFetch("/logout", "POST", null, token);
      localStorage.removeItem("token");
    }
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-blue-600 to-purple-700 text-white flex flex-col p-5">
        <h2 className="text-2xl font-bold mb-8">E-Learning</h2>
        <nav className="flex flex-col gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 hover:text-yellow-300 cursor-pointer z-50"
          >
            <FaChalkboardTeacher /> Dashboard
          </button>
          <button
            onClick={() => router.push("/dashboard/courses")}
            className="flex items-center gap-2 hover:text-yellow-300 cursor-pointer"
          >
            <FaBook /> Courses
          </button>
          {user?.role === "instructor" && (
            <button
              onClick={() => router.push("/dashboard/manage-students")}
              className="flex items-center gap-2 hover:text-yellow-300 cursor-pointer"
            >
              <FaUsers /> Manage Students
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 hover:text-red-300 mt-auto cursor-pointer"
          >
            <FaSignOutAlt /> Logout
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="bg-white text-black shadow p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Dashboard</h1>
          <span className="text-gray-600">
            {user ? `${user.name} (${user.role})` : "Loading..."}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
