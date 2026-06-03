import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Terminal, Moon, Sun, Menu, LogOut, User as UserIcon, Heart, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { Button } from './UI';
import { useTranslation } from 'react-i18next';
import { LangDropdown } from './LangDropdown';

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { isOpen, toggle } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { t } = useTranslation();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="w-full pl-2 pr-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Sidebar toggle */}
          <button
            onClick={toggle}
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className="
              flex items-center justify-center w-9 h-9 rounded-lg
              text-slate-500 dark:text-slate-400
              hover:text-indigo-600 dark:hover:text-indigo-400
              hover:bg-slate-100 dark:hover:bg-slate-800
              transition-all duration-150 flex-shrink-0
            "
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen
              ? <PanelLeftClose size={20} />
              : <PanelLeftOpen  size={20} />
            }
          </button>

          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-slate-900 dark:text-white hover:opacity-80 transition-opacity">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
              <Terminal size={20} />
            </div>
            <span>VibeTools</span>
          </Link>

          <div className="hidden md:flex items-center gap-1 ml-4">
            <a href="https://genzdev.net" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">{t('nav.home')}</Button>
            </a>
            <Link to="/donate">
              <Button variant="ghost" size="sm" className="gap-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300">
                <Heart size={16} className="fill-current" />
                {t('nav.donate')}
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LangDropdown />
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="rounded-lg w-9 h-8 p-0 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </Button>

          {/* Login/logout buttons hidden
          <div className="hidden md:block">
            {user ? (
               <div className="flex items-center gap-3 ml-2">
                 <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden lg:block">
                   {user.email}
                 </span>
                 <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                   <LogOut size={16} />
                 </Button>
               </div>
            ) : (
              <Link to="/login">
                <Button variant="primary" size="sm" className="gap-2">
                  <UserIcon size={16} />
                  <span>{t('nav.login')}</span>
                </Button>
              </Link>
            )}
          </div>
          */}

          <button
            className="md:hidden p-2 text-slate-600 dark:text-slate-300"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-2">
          <a href="https://genzdev.net" target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start">{t('nav.home')}</Button>
          </a>
          <Link to="/donate" onClick={() => setIsMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start gap-2 text-rose-600 dark:text-rose-400">
              <Heart size={16} className="fill-current" />
              {t('nav.donate')}
            </Button>
          </Link>
          <Link to="/" onClick={() => setIsMenuOpen(false)}>
            <Button variant={isActive('/') ? 'secondary' : 'ghost'} className="w-full justify-start">{t('nav.dashboard')}</Button>
          </Link>
          <div className="flex items-center gap-3 px-2 py-1">
            <span className="text-xs font-semibold text-slate-500">{t('nav.switchLanguage')}:</span>
            <LangDropdown onSelect={() => setIsMenuOpen(false)} />
          </div>
          {/* Login/logout hidden
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {user ? (
              <Button variant="danger" size="sm" onClick={handleLogout} className="w-full justify-center gap-2">
                <LogOut size={16} /> {t('nav.logout')}
              </Button>
            ) : (
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="primary" size="sm" className="w-full justify-center gap-2">
                  <UserIcon size={16} /> {t('nav.login')}
                </Button>
              </Link>
            )}
          </div>
          */}
        </div>
      )}
    </nav>
  );
};