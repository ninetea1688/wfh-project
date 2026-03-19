import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import {
  Home,
  Clock,
  FileText,
  User,
  LogOut,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
}

const navItems = [
  { to: "/dashboard", icon: Home, label: "หน้าหลัก" },
  { to: "/checkin", icon: Clock, label: "ลงชื่อ" },
  { to: "/plan", icon: CalendarDays, label: "แผนงาน" },
  { to: "/history", icon: FileText, label: "ประวัติ" },
  { to: "/profile", icon: User, label: "โปรไฟล์" },
];

export default function StaffLayout({ children }: Props) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : "U";

  return (
    <div className="flex flex-col min-h-screen max-w-[430px] mx-auto bg-white shadow-lg">
      {/* Topbar */}
      <header className="bg-navy text-white px-4 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gold" />
          <span className="text-sm font-medium tracking-wide">WFH System</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue flex items-center justify-center text-xs font-medium border border-white/30">
            {initials}
          </div>
          <span className="text-xs text-white/70">
            {user?.firstName} {user?.lastName}
          </span>
          <button
            onClick={handleLogout}
            className="p-1 text-white/60 hover:text-white transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-auto">{children}</main>

      {/* Bottom Nav */}
      <nav className="bg-white border-t border-slate-200 flex flex-shrink-0">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex-1 flex flex-col items-center gap-1 py-2 px-1 transition-colors",
                isActive ? "text-navy" : "text-slate-400",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[9px]">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
