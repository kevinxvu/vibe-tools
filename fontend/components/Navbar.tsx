import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, Menu, X, LogOut, User as UserIcon, Heart, PanelLeftClose, PanelLeftOpen, Github, Home, Globe } from 'lucide-react';
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
      <div className="w-full pl-2 pr-3 sm:pr-4 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
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

          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 font-bold text-lg sm:text-xl text-slate-900 dark:text-white hover:opacity-80 transition-opacity min-w-0">
            <img src="/logo.png" alt="VibeTools Logo" className="h-7 sm:h-8 w-auto flex-shrink-0" />
            <span className="truncate">VibeTools</span>
          </Link>

          <div className="hidden md:flex items-center gap-1 ml-4">
            <Link to="/">
              <Button variant="ghost" size="sm">{t('nav.home')}</Button>
            </Link>
            <Link to="/donate">
              <Button variant="ghost" size="sm" className="gap-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300">
                <Heart size={16} className="fill-current" />
                {t('nav.donate')}
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <LangDropdown />
          <a
            href="https://github.com/kevinxvu/vibe-tools"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub"
            className="hidden sm:flex items-center justify-center w-9 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex-shrink-0"
          >
            <Github size={18} />
          </a>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="rounded-lg w-8 sm:w-9 h-8 p-0 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </Button>

          <button
            className="md:hidden p-1.5 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 space-y-1 shadow-lg animate-in fade-in slide-in-from-top-1">
          <Link
            to="/"
            onClick={() => setIsMenuOpen(false)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/')
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <Home size={18} />
            <span>{t('nav.home')}</span>
          </Link>

          <Link
            to="/donate"
            onClick={() => setIsMenuOpen(false)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/donate')
                ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-semibold'
                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20'
            }`}
          >
            <Heart size={18} className="fill-current" />
            <span>{t('nav.donate')}</span>
          </Link>

          <a
            href="https://github.com/kevinxvu/vibe-tools"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            <Github size={18} />
            <span>GitHub Repository</span>
          </a>

          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <Globe size={15} />
                {t('nav.switchLanguage')}
              </span>
              <LangDropdown showLabelOnMobile={true} onSelect={() => setIsMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};