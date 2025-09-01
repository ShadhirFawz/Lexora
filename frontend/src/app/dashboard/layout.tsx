"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  // Read user role from localStorage
  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    if (!token || !savedRole) {
      router.push("/login"); // Redirect unauthenticated
    } else {
      setRole(savedRole);
    }
  }, [router]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/login");
  };

  // Sidebar navigation items by role
  const navItems: Record<string, { label: string; path: string }[]> = {
    student: [
      { label: "Dashboard", path: "/dashboard/student" },
      { label: "My Courses", path: "/dashboard/student/courses" },
    ],
    instructor: [
      { label: "Dashboard", path: "/dashboard/instructor" },
      { label: "Manage Courses", path: "/dashboard/instructor/courses" },
    ],
    admin: [
      { label: "Dashboard", path: "/dashboard/admin" },
      { label: "Manage Users", path: "/dashboard/admin/users" },
      { label: "Platform Stats", path: "/dashboard/admin/stats" },
    ],
  };

  if (!role) return null; // Prevent flicker before role loads

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-6 flex flex-col">
        <h2 className="text-2xl font-bold text-indigo-600 mb-6">E-Learning</h2>
        <nav className="flex-1 space-y-4">
          {navItems[role]?.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`block w-full text-left px-4 py-2 rounded-lg ${
                pathname === item.path
                  ? "bg-indigo-500 text-white"
                  : "text-gray-700 hover:bg-indigo-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="mt-auto bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
        >
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="bg-white shadow-md rounded-2xl p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
