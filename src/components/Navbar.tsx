import React from 'react';
import { School, Bell, Shield, BookOpen, Users, LogOut, LogIn, RefreshCw, Cloud, CloudOff } from 'lucide-react';

interface NavbarProps {
  currentRole: 'admin' | 'teacher' | 'parent';
  onRoleChange: (role: 'admin' | 'teacher' | 'parent') => void;
  onOpenNotifications: () => void;
  schoolName: string;
  currentUser?: any;
  isSyncActive?: boolean;
  onGoogleSignIn?: () => Promise<void>;
  onSignOut?: () => Promise<void>;
}

export default function Navbar({
  currentRole,
  onRoleChange,
  onOpenNotifications,
  schoolName,
  currentUser,
  isSyncActive,
  onGoogleSignIn,
  onSignOut
}: NavbarProps) {
  const rolesInfo = {
    admin: { label: 'مدير النظام', color: 'bg-red-500/10 text-red-500' },
    teacher: { label: 'المعلم', color: 'bg-emerald-500/10 text-emerald-500' },
    parent: { label: 'ولي الأمر', color: 'bg-amber-500/10 text-amber-500' }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo and Branding (Right Aligned for RTL) */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center text-brand-gold shadow-md">
            <School className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-brand-blue-dark leading-tight flex items-center gap-1.5 font-sans">
              <span>سكول ماستر</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-gold-light text-brand-gold font-medium font-sans">SaaS</span>
            </h1>
            <p className="text-xs text-slate-500">{schoolName}</p>
          </div>
        </div>

        {/* Dynamic Controls / Interactive Role Swapping (Center/Left) */}
        <div className="flex items-center gap-3">
          
          {/* Cloud Synchronization Status Badge/Button */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1.5 rounded-lg text-xs font-semibold">
                <Cloud className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                <span>مزامنة سحابية نشطة</span>
              </div>
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-100 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>تسجيل الخروج</span>
                </button>
              )}
            </div>
          ) : null}

          {/* Role Status Tag */}
          <span className="inline-block text-[11px] px-2.5 py-1 rounded-full font-bold bg-[#1e293b] text-white border border-slate-700">
            البوابة الآمنة: {rolesInfo[currentRole].label}
          </span>

          {/* Notification Button */}
          <button 
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 left-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
          </button>
          
        </div>

      </div>
    </header>
  );
}
