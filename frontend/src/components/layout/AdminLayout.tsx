import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Building2,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
}

const navGroups = [
  {
    label: "หลัก",
    items: [
      { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/admin/reports", icon: BarChart3, label: "รายงาน" },
    ],
  },
  {
    label: "จัดการ",
    items: [
      { to: "/admin/users", icon: Users, label: "ผู้ใช้งาน" },
      { to: "/admin/departments", icon: Building2, label: "แผนก" },
    ],
  },
];

export default function AdminLayout({ children }: Props) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Topbar */}
      <header className="bg-navy text-white px-4 py-2.5 flex items-center justify-between z-10 shadow">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gold" />
          <span className="text-sm font-medium">WFH Admin Console</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue flex items-center justify-center text-xs font-medium border border-white/30">
            AD
          </div>
          <span className="text-xs text-white/70">
            {user?.firstName} {user?.lastName}
          </span>
          <button
            onClick={handleLogout}
            className="ml-2 p-1 text-white/60 hover:text-white transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-44 bg-navy flex-shrink-0 overflow-y-auto">
          <div className="py-3">
            <div className="px-4 py-2 border-b border-white/10 mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                <span className="text-xs font-medium text-white">
                  WFH System
                </span>
              </div>
            </div>

            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="px-4 py-2 text-[9px] text-white/35 uppercase tracking-widest">
                  {group.label}
                </p>
                {group.items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 px-4 py-2 text-xs transition-all",
                        isActive
                          ? "bg-white/10 text-white border-l-3 border-gold border-l-[3px]"
                          : "text-white/65 hover:bg-white/10 hover:text-white",
                      )
                    }
                  >
                    <Icon size={14} className="opacity-80 flex-shrink-0" />
                    {label}
                  </NavLink>
                ))}
              </div>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
    </div>
  );
}
