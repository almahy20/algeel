import React, { useState, useEffect } from 'react';
import { 
  X, Bell, Trash2, CheckCircle, Smartphone, ShieldCheck, 
  AlertCircle, Sparkles, Loader2, Info 
} from 'lucide-react';
import { SchoolNotification } from '../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SchoolNotification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

export default function NotificationCenter({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onClearAll
}: NotificationCenterProps) {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  
  const [countdown, setCountdown] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<boolean>(false);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      setTestResult(true);
      setTimeout(() => setTestResult(false), 8000);
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      alert('نظام التشغيل أو المتصفح الحالي لا يدعم إشعارات النظام المحمولة.');
      return;
    }
    try {
      const status = await Notification.requestPermission();
      setPermission(status);
    } catch (e) {
      console.error("إخفاق طلب الصلاحية:", e);
    }
  };

  const handleBackgroundTest = () => {
    if (permission !== 'granted') {
      handleRequestPermission();
      return;
    }

    setCountdown(6);

    // إرسال رسالة فورية لوحدة الـ Service Worker لتسجيل منبه في الخلفية
    // هذا المنبه يعمل حتى لو أغلق المستخدم المتصفح تماماً أو قفل شاشة الموبايل
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'TRIGGER_NOTIFICATION',
        title: '🏫 لوحة سكول ماستر • إشعار معتمد',
        body: 'حالة الأبناء: تم رصد حضور الطالب "أحمد محمد العتيبي" في الحصة الأولى فصلياً.',
        delayMs: 6000,
        url: '/'
      });
    } else {
      // محاكاة المتصفح كبديل احتياطي
      setTimeout(() => {
        try {
          new Notification('🏫 لوحة سكول ماستر • إشعار معتمد', {
            body: 'حالة الأبناء: تم رصد حضور الطالب "أحمد محمد العتيبي" في الحصة الأولى فصلياً.',
            icon: 'https://cdn-icons-png.flaticon.com/512/2201/2201570.png',
            dir: 'rtl'
          });
        } catch (err) {
          console.warn("إخفاق عرض الإشعار المباشر:", err);
        }
      }, 6000);
    }
  };

  return (
    <div className="fixed inset-y-0 left-0 w-85 bg-slate-900 text-slate-100 shadow-2xl border-r border-slate-800 z-[100] flex flex-col transition-all duration-300 font-sans" style={{ direction: 'rtl' }}>
      
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-brand-gold/10 rounded-xl text-brand-gold">
            <Bell className="w-5 h-5 text-brand-gold animate-swing" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">مركز الإشعارات التنبيهية</h2>
            <p className="text-[10px] text-slate-400">التحديثات المباشرة للمنظومة</p>
          </div>
          <span className="text-xs bg-brand-gold-light/10 text-brand-gold border border-brand-gold/20 font-bold px-2 py-0.5 rounded-full">
            {notifications.filter(n => !n.read).length}
          </span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile background notifications configuration section */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 space-y-3.5">
        <div className="flex items-center gap-2 text-white">
          <Smartphone className="w-4.5 h-4.5 text-brand-gold shrink-0" />
          <h3 className="text-[11px] font-black tracking-wide uppercase">إشعارات الموبايل المستقلة (PWA)</h3>
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-between bg-[#111827] px-3 py-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            {permission === 'granted' ? (
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4.5 h-4.5 text-amber-400" />
            )}
            <span className="text-[10px] text-slate-300 font-bold">
              {permission === 'granted' ? 'الإشعارات الفورية مُفعّلة بنشاط' : 'صلاحية التنبيهات بانتظار موافقتك'}
            </span>
          </div>
          {permission !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              className="bg-brand-blue hover:bg-blue-600 text-white text-[9px] font-black px-2.5 py-1 rounded-lg duration-150 cursor-pointer"
            >
              موافقة
            </button>
          )}
        </div>

        {/* Production test launcher and simulation */}
        <div className="space-y-2">
          {countdown === null && !testResult ? (
            <button
              onClick={handleBackgroundTest}
              className="w-full bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25 py-2.5 px-3 rounded-xl transition-all font-black text-[10px] flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-[1.01]"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-gold animate-bounce" />
              <span>اختبر استلام الإشعار بعد إغلاق التطبيق 📱</span>
            </button>
          ) : countdown !== null ? (
            <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl space-y-2 text-right">
              <div className="flex items-center gap-2 text-amber-400 text-[10px] font-bold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>يرجى إغلاق التطبيق أو قفل الموبايل الآن!</span>
              </div>
              <p className="text-[9px] text-slate-400 leading-relaxed">
                سيقوم الـ Service Worker بإيقاظ جهازك وعرض الإشعار خلال بقية الحساب التنازلي:
              </p>
              <div className="text-center font-mono font-black text-lg text-brand-gold bg-[#1e1511]/80 py-1 rounded-lg">
                {countdown} ثوانٍ متبقية...
              </div>
            </div>
          ) : (
            <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-xl text-emerald-400 text-[10px] font-bold text-center flex items-center justify-center gap-2 animate-pulse">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>تم إطلاق الإشعار بنجاح في الخلفية!</span>
            </div>
          )}
          <p className="text-[8.5px] text-slate-400 leading-normal flex items-start gap-1">
            <Info className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" />
            <span>يعمل هذا الاختبار على تنشيط الخدمة الخلفية المستقلة، لمحاكاة الإشعارات الفورية عند إغلاق واجهات الويب.</span>
          </p>
        </div>
      </div>

      {/* Notifications Actions */}
      <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-950/20 text-[10px] text-slate-400">
        <button 
          onClick={onClearAll} 
          className="flex items-center gap-1.5 hover:text-rose-400 transition-colors cursor-pointer font-bold"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>تفريغ كافة التنبيهات</span>
        </button>
        <span className="font-bold">أحدث السجلات المدرسية</span>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/10">
        {notifications.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-full bg-slate-800/50 border border-slate-700/40 flex items-center justify-center text-slate-400 mb-3">
              <Bell className="w-5 h-5 text-slate-500" />
            </div>
            <p className="text-xs text-slate-400 font-bold">لا توجد إشعارات حالياً</p>
            <p className="text-[10px] text-slate-500 mt-1">سيتم سرد أي تنبيه رسمي وارد هنا فوراً.</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif.id}
              className={`p-3.5 rounded-xl border transition-all ${
                notif.read 
                  ? 'bg-slate-900/40 border-slate-800 text-slate-300' 
                  : 'bg-[#1a233a]/60 border-brand-blue/30 shadow-md text-white'
              }`}
            >
              <div className="flex justify-between items-start gap-2.5 mb-1.5">
                <h3 className={`text-xs font-black leading-snug ${notif.read ? 'text-slate-200' : 'text-white'}`}>
                  {notif.title}
                </h3>
                {!notif.read && (
                  <button 
                    onClick={() => onMarkAsRead(notif.id)}
                    className="text-brand-gold hover:text-white transition-colors cursor-pointer p-0.5"
                    title="تحديد كمقروء"
                  >
                    <CheckCircle className="w-4 h-4 text-brand-gold" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-2">{{ notif_body: notif.body }.notif_body}</p>
              <div className="flex justify-between items-center text-[9px] text-slate-500 font-medium">
                <span className="font-mono">{new Date(notif.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                  notif.type === 'absence' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                  notif.type === 'grade' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                  notif.type === 'fee' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  'bg-slate-800 text-slate-400 border border-slate-700/60'
                }`}>
                  {notif.type === 'absence' ? 'غياب' :
                   notif.type === 'grade' ? 'درجة دافعة' :
                   notif.type === 'fee' ? 'سداد مالي' : 'تنبيه مدرسي'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
