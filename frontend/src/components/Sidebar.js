import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  TrendingUp,
  LayoutDashboard,
  Search,
  Settings,
  Bookmark,
  LogOut,
  Menu,
  X,
  PenTool
} from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/analysis', label: 'Benzerlik Analizi', icon: Search },
    { path: '/draw-pattern', label: 'Kalıp Çizimi', icon: PenTool },
    { path: '/custom-pattern', label: 'Özel Kalıp', icon: Settings },
    { path: '/saved', label: 'Kayıtlı Analizler', icon: Bookmark },
  ];

  const isActive = (path) => location.pathname === path;

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6 border-b border-[#E6DCCF]">
        <div className="w-10 h-10 rounded-full bg-[#C86F4A] flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-[#2E2620] font-['Playfair_Display']">
          BIST Analiz
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
            data-testid={`nav-${item.path.slice(1)}`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User Section */}
      <div className="border-t border-[#E6DCCF] p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#E8D9C7] flex items-center justify-center">
            <span className="text-[#2E2620] font-medium">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#2E2620] truncate">
              {user?.full_name || 'Kullanıcı'}
            </p>
            <p className="text-xs text-[#7A6A5C] truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={logout}
          className="w-full justify-start text-[#7A6A5C] hover:text-[#B04832] hover:bg-[#B04832]/10"
          data-testid="logout-btn"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Çıkış Yap
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E6DCCF] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#C86F4A] flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-[#2E2620] font-['Playfair_Display']">
              BIST Analiz
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="mobile-menu-btn"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-white transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <NavContent />
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-[#E6DCCF]">
        <NavContent />
      </aside>
    </>
  );
};

export default Sidebar;
