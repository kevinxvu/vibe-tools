
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, ArrowRight, ArrowLeft, Copy, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Button, Card, Input, Badge } from '../components/UI';
import { useToast } from '../context/ToastContext';
import bcrypt from 'bcryptjs';
import { useToolState } from '../lib/useToolState';

type Mode = 'generator' | 'checker';

export const BcryptTool: React.FC = () => {
  const [mode, setMode] = useState<Mode>('generator');
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Generator State
  const [inputPassword, setInputPassword] = useState('');
  const [saltRounds, setSaltRounds] = useState(10);
  const [generatedHash, setGeneratedHash] = useState('');
  const [isHashing, setIsHashing] = useState(false);

  // Checker State
  const [checkPassword, setCheckPassword] = useState('');
  const [checkHash, setCheckHash] = useState('');
  const [isMatching, setIsMatching] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Load saved state on mount
  const { loadState } = useToolState('bcrypt-tool', {
    inputs: { mode, inputPassword, saltRounds, checkPassword, checkHash },
    outputs: { generatedHash },
  });

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setMode(saved.inputs.mode || 'generator');
      setInputPassword(saved.inputs.inputPassword || '');
      setSaltRounds(saved.inputs.saltRounds || 10);
      setCheckPassword(saved.inputs.checkPassword || '');
      setCheckHash(saved.inputs.checkHash || '');
      setGeneratedHash(saved.outputs.generatedHash || '');
    }
  }, []);

  // Auto-save state
  useToolState('bcrypt-tool', {
    inputs: { mode, inputPassword, saltRounds, checkPassword, checkHash },
    outputs: { generatedHash },
  });

  const handleGenerate = async () => {
    if (!inputPassword) return;
    setIsHashing(true);
    setGeneratedHash('');

    // Use setTimeout to allow UI to render the loading state
    setTimeout(() => {
      try {
        const salt = bcrypt.genSaltSync(saltRounds);
        const hash = bcrypt.hashSync(inputPassword, salt);
        setGeneratedHash(hash);
        showToast(t('tools.bcryptTool.hashGenerated'));
      } catch (e) {
        showToast(t('tools.bcryptTool.hashFailed'), 'error');
      } finally {
        setIsHashing(false);
      }
    }, 100);
  };

  const handleCheck = async () => {
    if (!checkPassword || !checkHash) return;
    setIsChecking(true);
    setIsMatching(null);

    setTimeout(() => {
      try {
        const match = bcrypt.compareSync(checkPassword, checkHash);
        setIsMatching(match);
        if (match) showToast(t('tools.bcryptTool.passwordMatches'), 'success');
        else showToast(t('tools.bcryptTool.passwordNoMatch'), 'error');
      } catch (e) {
        setIsMatching(false);
        showToast(t('tools.bcryptTool.invalidHash'), 'error');
      } finally {
        setIsChecking(false);
      }
    }, 100);
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(t('common.copiedToClipboard'));
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl lg:h-[calc(100vh-4rem)] h-auto flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="text-indigo-600" />
          Bcrypt Generator & Checker
        </h1>
        <p className="text-sm text-slate-500">
          {t('tools.bcryptTool.pageDescription')}
        </p>
      </div>

      {/* Segmented Control */}
      <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl flex mb-6 shadow-inner max-w-md mx-auto">
        <button
          onClick={() => setMode('generator')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            mode === 'generator'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10 scale-[1.01]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          {t('tools.bcryptTool.generatorTab')}
        </button>
        <button
          onClick={() => setMode('checker')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            mode === 'checker'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10 scale-[1.01]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          {t('tools.bcryptTool.checkerTab')}
        </button>
      </div>

      <div className="flex justify-center">
        {mode === 'generator' ? (
          <Card className="w-full max-w-2xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{t('tools.bcryptTool.generateHash')}</h2>
            
            <div className="space-y-6">
              <div>
                <Input 
                  label="Password" 
                  placeholder="Enter plain text password..." 
                  value={inputPassword}
                  onChange={e => setInputPassword(e.target.value)}
                  type="text"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Salt Rounds: {saltRounds}
                </label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="4" 
                    max="15" 
                    value={saltRounds}
                    onChange={e => setSaltRounds(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <Input 
                    type="number" 
                    min="4" max="15" 
                    value={saltRounds} 
                    onChange={e => setSaltRounds(Number(e.target.value))}
                    className="w-20 text-center"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Higher rounds = slower generation & better security. Rounds ≥ 12 may freeze browser temporarily.
                </p>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={!inputPassword || isHashing} 
                className="w-full h-11"
              >
                {isHashing ? <RefreshCw className="animate-spin mr-2" /> : <RefreshCw className="mr-2" />}
                {isHashing ? t('tools.bcryptTool.hashing') : t('tools.bcryptTool.generateHashBtn')}
              </Button>

              {generatedHash && (
                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Bcrypt Hash</span>
                    <button onClick={() => copyToClipboard(generatedHash)} className="text-slate-400 hover:text-indigo-500">
                      <Copy size={16} />
                    </button>
                  </div>
                  <p className="font-mono text-sm break-all text-slate-700 dark:text-slate-300">
                    {generatedHash}
                  </p>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card className="w-full max-w-2xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{t('tools.bcryptTool.checkPassword')}</h2>
            
            <div className="space-y-6">
              <div>
                <Input 
                  label="Password" 
                  placeholder="Enter plain text password..." 
                  value={checkPassword}
                  onChange={e => setCheckPassword(e.target.value)}
                />
              </div>

              <div>
                <Input 
                  label="Hash" 
                  placeholder="Enter Bcrypt hash ($2a$10$...)" 
                  value={checkHash}
                  onChange={e => setCheckHash(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleCheck} 
                disabled={!checkPassword || !checkHash || isChecking} 
                className="w-full h-11"
              >
                {isChecking ? <RefreshCw className="animate-spin mr-2" /> : <CheckCircle className="mr-2" />}
                {isChecking ? t('tools.bcryptTool.checking') : t('tools.bcryptTool.checkMatchBtn')}
              </Button>

              {isMatching !== null && (
                <div className={`mt-6 p-4 rounded-lg border flex items-center gap-3 ${
                  isMatching 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' 
                    : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                }`}>
                  {isMatching ? <CheckCircle size={24} /> : <XCircle size={24} />}
                  <div>
                    <h3 className="font-bold">{isMatching ? t('tools.bcryptTool.matchFound') : t('tools.bcryptTool.noMatch')}</h3>
                    <p className="text-sm opacity-90">
                      {isMatching 
                        ? t('tools.bcryptTool.matchDescription') 
                        : t('tools.bcryptTool.noMatchDescription')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
