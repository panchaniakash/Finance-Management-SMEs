import { ChartLine, Home, FileText, CreditCard, Building2, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "#", icon: Home, current: true },
    { name: "Invoices", href: "#", icon: FileText, current: false },
    { name: "Loans", href: "#", icon: CreditCard, current: false },
    { name: "Payments", href: "#", icon: Building2, current: false },
    { name: "GST & Tax", href: "#", icon: Receipt, current: false },
  ];

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="flex items-center px-6 py-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ChartLine className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">FinFlow</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                item.current
                  ? "text-primary bg-primary/10"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
              onClick={(e) => {
                e.preventDefault();
                onClose();
              }}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </a>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="px-4 py-4 border-t border-slate-200">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.profileImageUrl || ""} alt="User Profile" />
              <AvatarFallback>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {user?.companyName || user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
