import { Link, useLocation, Outlet } from "react-router-dom";
import { Users, Target, Home, Mail, Phone, Calendar } from "lucide-react";
import NotFound from "../NOT-FOUND";
import Dashboard from "../../components/dashboard/Dashboard";

const navigationItems = [
  { title: "Dashboard", path: "/crm/dashboard", icon: Home },
  { title: "Leads", path: "/crm/leads", icon: Users },
  { title: "Oportunidades", path: "/crm/opportunities", icon: Target },
  { title: "Campanhas", path: "/crm/campains", icon: Mail },
  { title: "Atendimentos", path: "/dashboard", icon: Phone },
  { title: "Follow-up", path: "/dashboard", icon: Calendar },
];

export default function Layout() {
  const location = useLocation();
  const isValidPath = navigationItems.some((item) => location.pathname.startsWith(item.path));

  return (
    <Dashboard>
      <div className="min-h-screen flex flex-col w-full bg-gradient-to-br from-slate-50 to-blue-50">
        <nav className="bg-white border-b border-slate-200/60 flex overflow-x-auto">
          {navigationItems.map(({ title, path, icon: Icon }) => {
            const isActive = location.pathname.startsWith(path);

            return (
              <Link
                key={title}
                to={path}
                className={`
                  flex items-center gap-2 px-4 py-3 whitespace-nowrap border-b-2
                  ${isActive
                    ? "border-blue-600 text-blue-700 font-semibold"
                    : "border-transparent text-slate-600 hover:text-blue-700 hover:border-blue-600"}
                  transition-colors duration-300
                `}
              >
                <Icon className="w-5 h-5" />
                {title}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 overflow-auto p-6">
          {isValidPath ? <Outlet /> : <NotFound />}
        </main>
      </div>
    </Dashboard>
  );
}
