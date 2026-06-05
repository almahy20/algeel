import React, { useState } from 'react';
import { Users, Plus, Search, Trash2, ArrowUpRight, Phone, Mail, Clock, X, AlertCircle } from 'lucide-react';
import { UserProfile, Student, ClassInfo } from '../types';

interface ParentsWorkspaceProps {
  users: UserProfile[];
  students: Student[];
  classes: ClassInfo[];
  onAddParent?: (parentData: { name: string; phone: string; email: string }) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
  onUpdateUserRole?: (userId: string, newRole: 'admin' | 'teacher' | 'parent') => Promise<void>;
}

export default function ParentsWorkspace({
  users,
  students,
  classes,
  onAddParent,
  onDeleteUser,
  onUpdateUserRole
}: ParentsWorkspaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [parentForm, setParentForm] = useState({ name: '', phone: '', email: '' });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter parents
  const parents = users.filter(u => u.role === 'parent');
  
  const filteredParents = parents.filter(p => {
    const nameMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = p.phone.includes(searchQuery);
    return nameMatch || phoneMatch;
  });

  const getClassName = (classId: string) => {
    return classes.find(c => c.id === classId)?.name || 'غير محدد';
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentForm.name || !parentForm.phone) {
      setErrorMsg('الرجاء كتابة الاسم ورقم الجوال أولاً.');
      return;
    }
    if (parentForm.phone.length < 11) {
      setErrorMsg('رقم الجوال يجب أن يكون 11 رقماً على الأقل.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (onAddParent) {
        await onAddParent(parentForm);
      }
      setShowAddModal(false);
      setParentForm({ name: '', phone: '', email: '' });
    } catch (err: any) {
      setErrorMsg('فشل الحفظ: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6 text-right" style={{ direction: 'rtl' }}>
      
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            <span>شؤون وأولياء الأمور</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">عرض الحسابات المسجلة لأولياء الأمور، إدارة الاتصال ومتابعة ارتباط الطلاب بأهاليهم.</p>
        </div>
        <button 
          onClick={() => {
            setErrorMsg(null);
            setShowAddModal(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل ولي أمر جديد</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50/50 border border-emerald-100/60 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500 text-white rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">إجمالي أولياء الأمور</span>
            <span className="text-xl font-black text-slate-800 font-sans">{parents.length}</span>
          </div>
        </div>
        <div className="bg-blue-50/50 border border-blue-100/60 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-500 text-white rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">الطلاب المرتبطين بأسر</span>
            <span className="text-xl font-black text-slate-800 font-sans">
              {students.filter(s => s.parentId && s.parentId !== '').length} طالبًا
            </span>
          </div>
        </div>
        <div className="bg-amber-50/50 border border-amber-100/60 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-brand-gold text-white rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">متوسط طلاب كل أسرة</span>
            <span className="text-xl font-black text-slate-800 font-sans">
              {parents.length > 0 ? (students.length / parents.length).toFixed(1) : 0}
            </span>
          </div>
        </div>
      </div>

      {/* Search Filter Strip */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
        <input 
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="ابحث عن ولي أمر بالاسم أو برقم الجوال..."
          className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-3 pr-10 pl-4 text-xs text-slate-800 outline-none text-right transition-all font-semibold"
        />
      </div>

      {/* Parents Grid View */}
      {filteredParents.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl space-y-3 bg-slate-50/30">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-700 text-sm">لا يتوفر أولياء أمور مطابقين للبحث</h4>
          <p className="text-xs text-slate-400">انقر على تسجيل ولي أمر جديد لإضافته يدوياً أو دعهم يسجلون حساباتهم بأنفسهم عبر البوابة الخارجية بصفحة التسجيل.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredParents.map(parent => {
            const linkedKids = students.filter(s => s.parentId === parent.id);
            return (
              <div 
                key={parent.id} 
                className="p-5 bg-white border border-slate-150 rounded-2xl relative shadow-3xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                {/* Header Profile Info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shadow-3xs">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-slate-800 text-sm truncate">{parent.name}</h4>
                    <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/50 mt-1">
                      حساب نشط ومثبت
                    </span>
                  </div>
                </div>

                {/* Contact metadata */}
                <div className="space-y-2 text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">رقم الجوال:</span>
                    <span className="font-mono text-slate-800 font-bold flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {parent.phone}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">البريد الموحد:</span>
                    <span className="font-mono text-slate-500 text-[10px]">{parent.email}</span>
                  </div>
                </div>

                {/* Linked Kids Panel */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-black block">الأبناء المربوطين بالحساب ({linkedKids.length}):</span>
                  {linkedKids.length === 0 ? (
                    <span className="text-[10px] text-amber-500 font-bold">لم يتم ربط أي طالب بهذا الحساب بعد.</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {linkedKids.map(kid => (
                        <span 
                          key={kid.id} 
                          className="inline-flex items-center gap-1 bg-blue-50 text-brand-blue border border-blue-100/60 px-2 py-0.5 rounded-lg text-[10px] font-bold"
                        >
                          <span>{kid.name}</span>
                          <span className="text-[9px] px-1 py-0.25 rounded-md bg-blue-100/50 text-blue-700">
                            {getClassName(kid.classId)}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions Bottom Bar */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 text-[10px]">
                  {onUpdateUserRole && (
                    <button
                      onClick={() => onUpdateUserRole(parent.id, 'teacher')}
                      className="flex-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 font-bold py-2 rounded-xl text-center cursor-pointer transition-colors text-slate-600"
                      title="ترقية ولي الأمر هذا ليكون مدرساً"
                    >
                      ترقية لمعلم
                    </button>
                  )}
                  {onDeleteUser && (
                    <button
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف الحساب الخاص بـ ${parent.name} نهائياً؟`)) {
                          onDeleteUser(parent.id);
                        }
                      }}
                      className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-xl cursor-pointer transition-colors border border-red-100/50"
                      title="حذف حساب ولي الأمر نهائياً"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Parent Manual Popup Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-fadeIn text-right" style={{ direction: 'rtl' }}>
            <div className="bg-emerald-600 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>تسجيل ولي أمر بالمنظومة يدوياً</span>
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold block">اسم ولي الأمر بالكامل</label>
                <input 
                  type="text"
                  required
                  placeholder="مثال: محمد أحمد علي اليماني"
                  value={parentForm.name}
                  onChange={e => setParentForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs outline-none text-right font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold block">رقم جوال العائلة (للدخول والمتابعة)</label>
                <input 
                  type="text"
                  required
                  placeholder="01xxxxxxxxx"
                  maxLength={11}
                  value={parentForm.phone}
                  onChange={e => setParentForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs outline-none text-left font-mono font-bold"
                />
                <span className="text-[9px] text-slate-500 block">يقوم ولي الأمر باستعمال رقم جواله هذا للدخول والتواصل مع المنظومة.</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold block">البريد الإلكتروني الموحد (اختياري)</label>
                <input 
                  type="email"
                  placeholder="name@example.com"
                  value={parentForm.email}
                  onChange={e => setParentForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs outline-none text-left font-mono font-semibold"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ والتوثيق...' : 'حفظ وتسجيل ولي الأمر'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
