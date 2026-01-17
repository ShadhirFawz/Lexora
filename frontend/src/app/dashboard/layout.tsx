"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import AppLogo from "@/assets/images/AppLogo.png"
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  BarChart3,
  GraduationCap,
  UserCircle,
  LogOut,
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  // Logout with loading state
  const handleLogout = async () => {
    setIsLoggingOut(true);

    // simulate async action (e.g. API logout) before redirect
    await new Promise((resolve) => setTimeout(resolve, 800));

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/login");
  };

  // Sidebar navigation items by role with icons
  const navItems: Record<string, { label: string; path: string; icon: React.ReactNode }[]> = {
    student: [
      { label: "Dashboard", path: "/dashboard/student", icon: <LayoutDashboard className="w-5 h-5" /> },
      { label: "My Courses", path: "/dashboard/student/courses", icon: <BookOpen className="w-5 h-5" /> },
    ],
    instructor: [
      { label: "Dashboard", path: "/dashboard/instructor", icon: <LayoutDashboard className="w-5 h-5" /> },
      { label: "Manage Courses", path: "/dashboard/instructor/courses", icon: <BookOpen className="w-5 h-5" /> },
    ],
    admin: [
      { label: "Dashboard", path: "/dashboard/admin", icon: <LayoutDashboard className="w-5 h-5" /> },
      { label: "Manage Users", path: "/dashboard/admin/users", icon: <Users className="w-5 h-5" /> },
      { label: "Platform Stats", path: "/dashboard/admin/stats", icon: <BarChart3 className="w-5 h-5" /> },
    ],
  };

  if (!role) return null; // Prevent flicker before role loads

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100">
      {/* Fixed Sidebar */}
      <aside className="w-64 bg-gradient-to-br from-blue-950 to-blue-900 shadow-md p-6 flex flex-col fixed left-0 top-0 h-full">
        <div className="flex flex-col items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-50 text-center"
            style={{ fontFamily: "'Palatino Linotype', 'Book Antiqua', serif" }}>
              Lexo<span className="text-lg">R</span>a
          </h2>
          <div className="mt-2">
            <Image 
              src={AppLogo} 
              alt="Lexora Logo" 
              width={80}
              height={80}
              className="object-contain rounded-lg shadow-xl"
              priority
            />
          </div>
        </div>
        
        {/* Role indicator */}
        <div className="flex items-center justify-center gap-2 mb-4 text-gray-200">
          {role === "student" && <GraduationCap className="w-5 h-5" />}
          {role === "instructor" && <UserCircle className="w-5 h-5" />}
          {role === "admin" && <Users className="w-5 h-5" />}
          <span className="text-sm font-medium capitalize">{role}</span>
        </div>
        
        <nav className="flex-1 space-y-3">
          {navItems[role]?.map((item) => {
            const isActive = pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => !isActive && router.push(item.path)}
                className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-white text-purple-900 shadow-md cursor-default pointer-events-none"
                    : "bg-white hover:bg-indigo-100 text-purple-900 cursor-pointer hover:translate-x-1"
                }`}
                disabled={isActive}
              >
                <span className={`${isActive ? "text-purple-600" : "text-purple-500"}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button with Spinner */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`mt-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg cursor-pointer ${
            isLoggingOut
              ? "bg-red-400 text-white cursor-not-allowed"
              : "bg-red-500 text-white hover:bg-red-600"
          }`}
        >
          {isLoggingOut ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Logging out...</span>
            </>
          ) : (
            <>
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </>
          )}
        </button>
      </aside>

      {/* Scrollable Main Content */}
      <main className="flex-1 p-8 ml-64 overflow-y-auto h-screen">
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 shadow-md rounded-2xl p-6">{children}</div>
      </main>
    </div>
  );
}