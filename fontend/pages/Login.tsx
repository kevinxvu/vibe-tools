import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User as UserIcon, AlertCircle, Loader2 } from 'lucide-react';
import { Button, Input, Card } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginManual } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (email === 'admin' && password === '123456') {
      setTimeout(() => {
        loginManual({
          uid: 'admin-local',
          email: 'admin@devtools.local',
          displayName: 'Administrator',
        });
        navigate('/');
      }, 500);
      return;
    }

    setError(t('auth.invalidCredentials'));
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-t-4 border-t-indigo-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400 mb-4">
            <UserIcon size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('auth.welcomeBack')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {t('auth.enterCredentials')}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              type="text" 
              placeholder={t('auth.usernameOrEmail')} 
              className="pl-10" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              type="password" 
              placeholder={t('auth.password')} 
              className="pl-10" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full h-11 text-base mt-2" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : t('auth.signIn')}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
           <p>{t('auth.restrictedAccess')}</p>
        </div>
      </Card>
    </div>
  );
};