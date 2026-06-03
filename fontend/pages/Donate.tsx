import React from 'react';
import { Heart, Coffee, Zap, Server, DollarSign, Copy, Check } from 'lucide-react';
import { Card } from '../components/UI';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

export const Donate: React.FC = () => {
  const { showToast } = useToast();
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const { t } = useTranslation();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(label);
      showToast(t('donate.accountNumberCopied'), 'success');
      setTimeout(() => setCopiedField(null), 2000);
    });
  };
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full mb-6">
            <Heart className="w-10 h-10 text-white" fill="currentColor" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {t('donate.pageTitle')}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {t('donate.pageDescription')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
          <Card className="text-center p-6">
            <Server className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{t('donate.serverHosting')}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{t('donate.maintainUptime')}</p>
          </Card>
          <Card className="text-center p-6">
            <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{t('donate.aiApiCosts')}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{t('donate.aiTokens')}</p>
          </Card>
          <Card className="text-center p-6">
            <Coffee className="w-8 h-8 text-orange-500 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{t('donate.development')}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{t('donate.coffeeForDev')}</p>
          </Card>
        </div>

        {/* Donation Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Buy Me a Coffee */}
          <Card className="p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4">
                <Coffee className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                {t('donate.buyMeACoffee')}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {t('donate.supportViaBuyMeACoffee')}
              </p>
              <a
                href="https://buymeacoffee.com/genzdev"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
              >
                <Coffee className="w-5 h-5" />
                {t('donate.supportOnBuyMeACoffee')}
              </a>
            </div>
          </Card>

          {/* Bank Transfer */}
          <Card className="p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                <DollarSign className="w-8 h-8 text-green-600 dark:text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                {t('donate.bankTransfer')}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {t('donate.scanQrCode')}
              </p>
              
              {/* QR Code Placeholder */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl inline-block mb-4 border-2 border-slate-200 dark:border-slate-700">
                <div className="w-64 h-64 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                  {/* Thay thế bằng QR code thực tế của bạn */}
                  <img 
                    src="https://img.vietqr.io/image/VCB-1014903559-compact.png?amount=50000&addInfo=Ung%20ho%20VibeTools&accountName=VU%20VAN%20DUONG" 
                    alt="QR Code" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              
              <div className="text-left bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">{t('donate.bank')}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{t('donate.vietcombank')}</span>
                </div>
                <div className="flex justify-between text-sm group">
                  <span className="text-slate-600 dark:text-slate-400">{t('donate.accountNumber')}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">1014903559</span>
                    <button
                      onClick={() => copyToClipboard('1014903559', 'Số tài khoản')}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                      title={t('donate.copyAccountNumber')}
                    >
                      {copiedField === 'Số tài khoản' ? (
                        <Check size={16} className="text-green-600 dark:text-green-400" />
                      ) : (
                        <Copy size={16} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">{t('donate.accountHolder')}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">VU VAN DUONG</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">{t('donate.transferContent')}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{t('donate.supportDevTools')}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Thank You Message */}
        <div className="text-center mt-12 max-w-2xl mx-auto">
          <Card className="p-8 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-2 border-indigo-200 dark:border-indigo-800">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              {t('donate.thankYou')}
            </h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {t('donate.supportHelps')}
            </p>
          </Card>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400">
          <p>{t('donate.freeProject')}</p>
          <p className="mt-1">{t('donate.builtWithLove')}</p>
        </div>
      </div>
    </div>
  );
};
