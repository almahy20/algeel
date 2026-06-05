import React, { useState } from 'react';
import { 
  Users, Calendar, Award, Receipt, Mail, MessageSquare, AlertCircle, 
  Send, Upload, Plus, MessageCircle, AlertTriangle, UserCheck, ChevronRight, ChevronLeft, GraduationCap, CreditCard,
  BookOpen, Settings, Check, X
} from 'lucide-react';
import { Student, ClassInfo, FeeLedger, Complaint, Conversation, ChatMessage, UserProfile, GradeExam, AttendanceDay } from '../types';

interface ParentPortalProps {
  parentId: string;
  students: Student[];
  classes: ClassInfo[];
  fees: FeeLedger[];
  complaints: Complaint[];
  conversations: Conversation[];
  grades: GradeExam[];
  attendance: { [date: string]: { [classId: string]: { studentId: string; status: 'present' | 'absent' | 'late'; note?: string }[] } };
  admins: UserProfile[];
  users?: UserProfile[];
  onAddComplaint: (category: Complaint['category'], description: string, priority: Complaint['priority']) => Promise<void>;
  onAddComplaintReply: (complaintId: string, replyText: string) => Promise<void>;
  onSendMessage: (conversationId: string, text: string) => Promise<void>;
  onCreateConversation: (otherParticipantId: string, firstMsg: string) => Promise<void>;
  onUploadFeeReceipt: (studentId: string, amount: number, transactionId: string) => Promise<void>;
}

export default function ParentPortal({
  parentId,
  students,
  classes,
  fees,
  complaints,
  conversations,
  grades,
  attendance,
  admins,
  users = [],
  onAddComplaint,
  onAddComplaintReply,
  onSendMessage,
  onCreateConversation,
  onUploadFeeReceipt
}: ParentPortalProps) {
  const [activeTab, setActiveTab] = useState<'hub' | 'children' | 'fees' | 'complaints' | 'chat'>('hub');
  const [selectedKidId, setSelectedKidId] = useState<string | null>(null);
  
  // States of complaints
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintCategory, setComplaintCategory] = useState<Complaint['category']>('أكاديمي');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintPriority, setComplaintPriority] = useState<Complaint['priority']>('medium');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [complaintReplyText, setComplaintReplyText] = useState('');

  // States of chats
  const [activeChatId, setActiveChatId] = useState<string | null>(conversations[0]?.id || null);
  const [chatMsgText, setChatMsgText] = useState('');
  const [newChatAdminId, setNewChatAdminId] = useState('');

  // States of payments
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null); // studentId
  const [paymentAmount, setPaymentAmount] = useState<number>(1000);
  const [receiptTxId, setReceiptTxId] = useState('');

  // Find the logged-in parent's profile to get their phone number
  const parentProfile = users.find(u => u.id === parentId);
  const parentPhone = parentProfile?.phone;

  // Filter students: those whose parentId matches parentId (UID) OR whose parentId matches parentPhone,
  // or we look up the student's parent profile in `users` and compare its phone with parentPhone.
  const myKids = students.filter(s => {
    if (s.parentId === parentId) return true;
    if (parentPhone && s.parentId === parentPhone) return true;
    if (parentPhone) {
      const studentParent = users.find(u => u.id === s.parentId);
      if (studentParent && studentParent.phone === parentPhone) return true;
    }
    return false;
  });

  // Helper getters
  const getClassName = (classId: string) => classes.find(c => c.id === classId)?.name || 'غير محدد';
  
  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintDesc) return;
    await onAddComplaint(complaintCategory, complaintDesc, complaintPriority);
    setShowComplaintModal(false);
    setComplaintDesc('');
    alert('تم رفع الشكوى لإدارة المدرسة بنجاح. جاري المتابعة من مكتب الدعم الفني.');
  };

  const handleSendComplaintReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintId || !complaintReplyText) return;
    await onAddComplaintReply(selectedComplaintId, complaintReplyText);
    setComplaintReplyText('');
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatId || !chatMsgText) return;
    await onSendMessage(activeChatId, chatMsgText);
    setChatMsgText('');
  };

  const handleStartNewChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatAdminId || !chatMsgText) return;
    await onCreateConversation(newChatAdminId, chatMsgText);
    setChatMsgText('');
    setNewChatAdminId('');
  };

  const handleUploadPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaymentModal || !paymentAmount || !receiptTxId) return;
    await onUploadFeeReceipt(showPaymentModal, paymentAmount, receiptTxId);
    setShowPaymentModal(null);
    setReceiptTxId('');
    alert('تم رفع المعاملة وإشعار المحاسب لمراجعة صحة التحويل وتحديث رصيد الطالب.');
  };

  const activeChat = conversations.find(c => c.id === activeChatId);

  return (
    <div className="space-y-6">
      
      {/* Top Welcome banner */}
      <div className="bg-gradient-to-l from-brand-blue to-amber-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-24 h-24 bg-brand-gold/10 rounded-br-full transform -translate-x-6 -translate-y-6"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
          <div>
            <h2 className="text-xl md:text-2xl font-black mb-1">بوابة أولياء الأمور - مدرسة الجيل الجديد</h2>
            <p className="text-slate-200 text-xs">متابعة الأداء الأكاديمي للأبناء، سداد الرسوم المدرسية، والمراسلات الفورية مع الإدارة التعليمية.</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedKidId ? (
              <button 
                onClick={() => setSelectedKidId(null)}
                className="bg-brand-gold hover:bg-amber-600 text-brand-blue-dark text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 scale-x-[-1]" />
                <span>العودة لقائمة الأبناء</span>
              </button>
            ) : activeTab !== 'hub' ? (
              <button 
                onClick={() => {
                  setActiveTab('hub');
                  setSelectedKidId(null);
                }}
                className="bg-brand-gold hover:bg-amber-600 text-brand-blue-dark text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 scale-x-[-1]" />
                <span>العودة للرئيسية</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* HUB VIEW - NAVIGATION SQUARES GRID */}
      {activeTab === 'hub' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-800 text-base">بوابة الخدمات والخيارات المتاحة</h3>
            <p className="text-slate-500 text-xs">اضغط على أي من المربعات التالية للانتقال الفوري ومتابعة أطفالك والرسوم والشكاوى:</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Box 1: Children list */}
            <button
              onClick={() => setActiveTab('children')}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-brand-blue hover:shadow-lg transition-all duration-300 text-right group cursor-pointer flex flex-col justify-between h-44 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-16 h-16 bg-blue-50/50 rounded-br-full -translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform" />
              <div className="flex justify-between items-start z-10 relative">
                <span className="p-3.5 rounded-2xl bg-blue-50 text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all">
                  <GraduationCap className="w-6 h-6" />
                </span>
                <span className="bg-blue-100 text-brand-blue font-sans font-bold text-[11px] px-2.5 py-1 rounded-full">
                  {myKids.length} أبناء مقيدين
                </span>
              </div>
              <div className="z-10 relative mt-4">
                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-brand-blue transition-colors">الملف الدراسي لأبنائي</h4>
                <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">متابعة علامات الأبناء اليومية، دفاتر الغياب والتقارير الشهرية المرسلة</p>
              </div>
            </button>

            {/* Box 2: Tuition Fees */}
            <button
              onClick={() => setActiveTab('fees')}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all duration-300 text-right group cursor-pointer flex flex-col justify-between h-44 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-16 h-16 bg-emerald-50/50 rounded-br-full -translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform" />
              <div className="flex justify-between items-start z-10 relative">
                <span className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <Receipt className="w-6 h-6" />
                </span>
                <span className="bg-emerald-100 text-emerald-800 font-sans font-bold text-[11px] px-2.5 py-1 rounded-full">
                  الرسوم الدراسية
                </span>
              </div>
              <div className="z-10 relative mt-4">
                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">الرسوم والمدفوعات الدراسية</h4>
                <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">الاطلاع على الحساب، سداد الأقساط، وإرفاق إيصال الدفع للتحقق والموافقة</p>
              </div>
            </button>

            {/* Box 3: Complaints Hub */}
            <button
              onClick={() => setActiveTab('complaints')}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 text-right group cursor-pointer flex flex-col justify-between h-44 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-16 h-16 bg-indigo-50/50 rounded-br-full -translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform" />
              <div className="flex justify-between items-start z-10 relative">
                <span className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Mail className="w-6 h-6" />
                </span>
                <span className="bg-indigo-100 text-indigo-800 font-sans font-bold text-[11px] px-2.5 py-1 rounded-full">
                  {complaints.length} شكوى/مقترح
                </span>
              </div>
              <div className="z-10 relative mt-4">
                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">مركز المقترحات والشكاوى</h4>
                <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">إرسال وتوثيق الشكاوى للأبناء ومتابعة ردود الأجهزة الإدارية بالمنشأة</p>
              </div>
            </button>

            {/* Box 4: Conversional Chat */}
            <button
              onClick={() => setActiveTab('chat')}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-lg transition-all duration-300 text-right group cursor-pointer flex flex-col justify-between h-44 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-16 h-16 bg-amber-50/50 rounded-br-full -translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform" />
              <div className="flex justify-between items-start z-10 relative">
                <span className="p-3.5 rounded-2xl bg-amber-50 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                  <MessageSquare className="w-6 h-6" />
                </span>
                <span className="bg-amber-100 text-amber-800 font-sans font-bold text-[11px] px-2.5 py-1 rounded-full">
                  محادثة الإدارة
                </span>
              </div>
              <div className="z-10 relative mt-4">
                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-brand-gold transition-colors">شات التواصل الفوري والمباشر</h4>
                <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">فتح مراسلات خاصة مع مدير عام المدرسة لمناقشة مستويات أبنائك الفضلاء</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* CHILDREN DETAILS TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'children' && !selectedKidId && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {myKids.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-slate-200">
                <p className="text-slate-400">لا يوجد أبناء مرتبطين بحسابك حالياً. برجاء تزويد المدير بالهوية لربط الطالب.</p>
              </div>
            ) : (
              myKids.map(kid => (
                <div key={kid.id} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-2xs relative overflow-hidden group">
                  <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-brand-blue to-amber-500 rounded-t-2xl"></div>
                  
                  {/* Avatar and name */}
                  <div className="flex items-center gap-4">
                    <img src={kid.photo} alt={kid.name} className="w-14 h-14 rounded-full object-cover border-2 border-brand-gold shadow-xs bg-slate-100" />
                    <div className="flex-1 text-right">
                      <h4 className="font-bold text-slate-800 text-base">{kid.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">الصف: {getClassName(kid.classId)}</p>
                      <p className="text-[10px] text-slate-400">الهوية الوطنية: {kid.nationalId}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Attendance widget */}
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                      <span className="text-[11px] text-slate-400 block font-bold">نسبة الحضور التراكمي</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-sans font-black text-emerald-600">96.8%</span>
                        <span className="text-[9px] text-slate-400 font-bold">ممتاز</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '96.8%' }}></div>
                      </div>
                    </div>

                    {/* Academic state widget */}
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                      <span className="text-[11px] text-slate-400 block font-bold">المعدل الأكاديمي</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-indigo-600">A+</span>
                        <span className="text-[9px] text-slate-400 font-bold">متفوق</span>
                      </div>
                      <p className="text-[10px] text-slate-500">تم رصده بآخر 3 اختبارات</p>
                    </div>
                  </div>

                  {/* Grades timeline for this student */}
                  <div className="space-y-3">
                    <h5 className="font-bold text-slate-700 text-xs">آخر الدرجات المرصودة:</h5>
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1 text-right">
                      {grades
                        .filter(g => g.records.some(r => r.studentId === kid.id))
                        .map(g => {
                          const kidScore = g.records.find(r => r.studentId === kid.id)?.score || 0;
                          return (
                            <div key={g.id} className="p-2.5 bg-slate-50 rounded-xl flex justify-between items-center text-xs border border-slate-100/60">
                              <div>
                                <p className="font-bold text-slate-800">{g.subject} - {g.title}</p>
                                <span className="text-[9px] text-slate-400 font-sans">{g.date}</span>
                              </div>
                              <span className="font-sans font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                {kidScore} / {g.records[0]?.maxScore || 100}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Standalone child details navigation */}
                  <div className="pt-2 border-t border-slate-100">
                    <button 
                      onClick={() => setSelectedKidId(kid.id)}
                      className="w-full bg-brand-blue/5 hover:bg-brand-blue/10 text-brand-blue text-xs font-black py-2.5 rounded-xl text-center cursor-pointer transition-colors block"
                    >
                      عرض الملف الأكاديمي والمالي المفصل بالطالب
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* FINANCIAL LEDGER TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'fees' && !selectedKidId && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">مطالبات ذمم الطلاب وأقساط المدارس</h3>
            <p className="text-xs text-slate-500">سداد الفواتير الدراسية للأبناء وتحميل إيصالات الإثبات.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myKids.map(kid => {
              const kidFee = fees.find(f => f.studentId === kid.id) || { totalDue: 5000, paid: 1200, due: 3800, payments: [] };
              return (
                <div key={kid.id} className="p-5 border border-slate-100 rounded-2xl space-y-4 bg-slate-50">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-800 text-sm">أقساط الطالب: {kid.name}</h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      kidFee.due <= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {kidFee.due <= 0 ? 'مسدد بالكامل' : 'عالق ومستحق'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs bg-white p-3 rounded-xl border border-slate-100 text-center">
                    <div>
                      <span className="block text-[10px] text-slate-400">إجمالي المطلوب</span>
                      <span className="font-sans font-bold text-slate-700 mt-1 block">{kidFee.totalDue.toLocaleString('ar-EG')} ج.م</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">إجمالي المسدد</span>
                      <span className="font-sans font-bold text-emerald-600 mt-1 block">{kidFee.paid.toLocaleString('ar-EG')} ج.م</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">المبلغ المستحق</span>
                      <span className="font-sans font-bold text-rose-500 mt-1 block">{kidFee.due.toLocaleString('ar-EG')} ج.م</span>
                    </div>
                  </div>

                  {kidFee.due > 0 && (
                    <button 
                      onClick={() => {
                        setPaymentAmount(kidFee.due);
                        setShowPaymentModal(kid.id);
                      }}
                      className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-3xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع إشعار/إيصال تحويل السداد</span>
                    </button>
                  )}

                  {/* Payment history list */}
                  {kidFee.payments.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 block font-bold">آخر عمليات الدفع المسجلة:</span>
                      {kidFee.payments.map((p, idx) => (
                        <div key={idx} className="p-2 bg-white rounded-lg border border-slate-100 flex justify-between items-center text-[11px]">
                          <div>
                            <span className="font-sans font-bold text-slate-700">{p.amount.toLocaleString('ar-EG')} ج.م</span>
                            <span className="text-[9px] text-slate-400 block font-sans">{p.date}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                            p.verified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {p.verified ? 'مقبول ومؤكد' : 'تحت المراجعة'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* COMPLAINTS TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'complaints' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">بوابة المقترحات الشكاوى والملاحظات</h3>
              <p className="text-xs text-slate-500">مراسلة مكاتب الإدارة والتربويين بخصوص أية مسائل بشكل مباشر.</p>
            </div>
            <button 
              onClick={() => setShowComplaintModal(true)}
              className="bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تقديم شكوى أو مقترح جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left list of complaints */}
            <div className="lg:col-span-1 border border-slate-200/60 rounded-2xl overflow-hidden divide-y divide-slate-100">
              <div className="bg-slate-50 p-2.5 text-xs text-slate-600 font-bold">لائحة الشكاوى السابقة</div>
              {complaints.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">لا توجد شكاوى أو مقترحات مسجلة.</div>
              ) : (
                complaints.map(cp => (
                  <button 
                    key={cp.id}
                    onClick={() => setSelectedComplaintId(cp.id)}
                    className={`w-full p-3 text-right block hover:bg-slate-50 transition-colors cursor-pointer ${
                      selectedComplaintId === cp.id ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-850 text-xs">{cp.category}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        cp.status === 'new' ? 'bg-amber-50 text-amber-600' :
                        cp.status === 'in_progress' ? 'bg-indigo-50 text-indigo-500' :
                        'bg-emerald-50 text-emerald-600'
                      }`}>
                        {cp.status === 'new' ? 'جديد' :
                         cp.status === 'in_progress' ? 'قيد المعالجة' : 'حُلّت'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">{cp.description}</p>
                    <div className="flex justify-between items-center text-[9px] text-slate-400 mt-2 font-sans">
                      <span>الأولوية: {cp.priority === 'high' ? 'عالية' : 'عادية'}</span>
                      <span>{new Date(cp.createdAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Right Discussion Area */}
            <div className="lg:col-span-2 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between min-h-96">
              {(() => {
                const activeCp = complaints.find(c => c.id === selectedComplaintId);
                if (!activeCp) {
                  return (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2 p-6">
                      <AlertCircle className="w-10 h-10 text-slate-300" />
                      <p className="text-xs">برجاء اختيار أي شكوى من القائمة الجانبية لقراءة تفاصيل الردود وتحديثاتها المباشرة.</p>
                    </div>
                  );
                }

                return (
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* Topic Metadata banner */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-start gap-4 mb-4">
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs">نوع الشكوى: {activeCp.category}</h4>
                          <p className="text-[11px] text-slate-600 leading-relaxed mt-1.5">{activeCp.description}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-sans ${
                          activeCp.priority === 'high' ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-500'
                        }`}>
                          أولوية: {activeCp.priority === 'high' ? 'قصوى' : 'عادية'}
                        </span>
                      </div>

                      {/* Discussion log */}
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {activeCp.replies.map((reply, i) => {
                          const isAdmin = reply.senderId !== parentId;
                          return (
                            <div 
                              key={i} 
                              className={`p-3 rounded-xl max-w-sm text-xs space-y-1 ${
                                isAdmin 
                                  ? 'bg-slate-100 text-slate-800 mr-auto' 
                                  : 'bg-brand-blue text-white ml-auto'
                              }`}
                            >
                              <div className="flex justify-between items-center text-[10px] opacity-75">
                                <span className="font-bold">{reply.senderName}</span>
                                <span className="font-mono">{reply.time}</span>
                              </div>
                              <p className="leading-relaxed">{reply.text}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Simple Quick Reply Box */}
                    <form onSubmit={handleSendComplaintReply} className="flex gap-2 border-t border-slate-100 pt-3 mt-4">
                      <input 
                        type="text" 
                        required
                        placeholder="اكتب ردك أو استفسارك هنا ومراجعته مع الإدارة..."
                        value={complaintReplyText}
                        onChange={e => setComplaintReplyText(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-brand-blue"
                      />
                      <button 
                        type="submit"
                        className="bg-brand-blue hover:bg-brand-blue-dark text-white p-3 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <Send className="w-4 h-4 transform flip-x" />
                      </button>
                    </form>

                  </div>
                );
              })()}
            </div>

          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MESSAGING/CHAT TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'chat' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">الرسائل الفورية والمكاتبات الخاصة</h3>
            <p className="text-xs text-slate-500">قناة تواصل فورية بينك وبين إدارة المدرسة ورائد الفصل.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sidebar with conversations */}
            <div className="lg:col-span-1 border border-slate-200/60 rounded-2xl overflow-hidden divide-y divide-slate-100">
              <div className="bg-slate-50 p-3 text-xs text-slate-600 font-bold flex justify-between items-center">
                <span>المحادثات النشطة</span>
              </div>
              
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">لا توجد محادثات جارية.</div>
              ) : (
                conversations.map(c => (
                  <button 
                    key={c.id}
                    onClick={() => setActiveChatId(c.id)}
                    className={`w-full p-4 text-right block hover:bg-slate-50 transition-colors cursor-pointer ${
                      activeChatId === c.id ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-blue/5 border border-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-xs">
                        م
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800">إدارة المدرسة</span>
                          <span className="text-[10px] text-slate-400 font-sans font-mono">{new Date(c.lastUpdate).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{c.messages[c.messages.length - 1]?.text || 'لا توجد رسائل'}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}

              {/* Start new conversation form */}
              <form onSubmit={handleStartNewChatSubmit} className="p-3 bg-slate-50 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 block">بدء تواصل جديد مع المدير:</span>
                <select 
                  required
                  value={newChatAdminId}
                  onChange={e => setNewChatAdminId(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs p-1.5 rounded outline-none"
                >
                  <option value="">-- اختر مَن الموظف المسؤول --</option>
                  {admins.map(adm => (
                    <option key={adm.id} value={adm.id}>{adm.name} ({adm.role === 'admin' ? 'المدير العام' : 'معلم'})</option>
                  ))}
                </select>
                <input 
                  type="text" 
                  required
                  placeholder="رسالتك الافتتاحية الأولى هنا..." 
                  value={chatMsgText}
                  onChange={e => setChatMsgText(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs p-2 rounded outline-none"
                />
                <button 
                  type="submit"
                  className="w-full bg-brand-blue text-white font-bold py-1.5 rounded text-[10px] cursor-pointer"
                >
                  إرسال الرسالة وبدء الخط
                </button>
              </form>
            </div>

            {/* Chat Body */}
            <div className="lg:col-span-2 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between min-h-96">
              {activeChat ? (
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    {/* Header profile info */}
                    <div className="pb-3 border-b border-slate-100 flex items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="font-bold text-slate-800 text-sm">مكتب تواصل الإدارة المباشر</span>
                      </div>
                    </div>

                    {/* Messages logs */}
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {activeChat.messages.map((m, idx) => {
                        const isMe = m.senderId === parentId;
                        return (
                          <div 
                            key={idx}
                            className={`p-3 rounded-xl max-w-sm text-xs space-y-1 ${
                              isMe 
                                ? 'bg-brand-blue text-white ml-auto' 
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            <div className="flex justify-between items-center text-[10px] opacity-75">
                              <span className="font-bold">{m.senderName}</span>
                              <span className="font-mono">{m.time}</span>
                            </div>
                            <p className="leading-relaxed">{m.text}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Send Form message */}
                  <form onSubmit={handleSendChatMessage} className="flex gap-2 border-t border-slate-100 pt-3 mt-4">
                    <input 
                      type="text" 
                      required
                      placeholder="اكتب رسالتك للمدير هنا..."
                      value={chatMsgText}
                      onChange={e => setChatMsgText(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                    <button 
                      type="submit"
                      className="bg-brand-blue hover:bg-brand-blue-dark text-white p-3 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Send className="w-4 h-4 transform flip-x" />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2 p-6">
                  <MessageSquare className="w-10 h-10 text-slate-300" />
                  <p className="text-xs">ابدأ محادثة فورية جديدة مع إدارة المدرسة للحفاظ على أفضل تواصل تربوي.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* Standalone Child Details (Page View Mode) */}
      {/* ---------------------------------------------------- */}
      {selectedKidId && (() => {
        const kid = students.find(s => s.id === selectedKidId);
        if (!kid) return null;

        const sClass = classes.find(c => c.id === kid.classId);
        const classTeacher = admins.find(a => sClass && a.id === sClass.teacherId);
        const kidFee = fees.find(f => f.studentId === kid.id) || { totalDue: 5000, paid: 1200, due: 3800, payments: [] };
        
        // Cumulative Grades
        const kidGrades = grades.filter(g => g.records.some(r => r.studentId === kid.id));

        return (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 text-right space-y-6 animate-fadeIn">
            {/* Header Cover Banner */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-l from-brand-blue to-amber-900 p-6 sm:p-8 text-white min-h-[160px] flex flex-col justify-end">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-16 -translate-x-16"></div>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 z-10">
                <div className="flex items-center gap-4">
                  <img 
                    src={kid.photo} 
                    alt={kid.name} 
                    className="w-20 h-20 rounded-2xl object-cover border-4 border-white/25 shadow-lg bg-slate-100" 
                  />
                  <div className="text-right">
                    <h3 className="font-extrabold text-white text-lg sm:text-xl">{kid.name}</h3>
                    <p className="text-xs text-slate-200 mt-1 flex items-center gap-1.5 justify-end sm:justify-start">
                      <GraduationCap className="w-4 h-4 text-brand-gold animate-bounce" />
                      <span>الصف: {sClass ? sClass.name : 'لم يحدد الصف'} • المرحلة: {sClass ? sClass.grade : 'غير متوفر'}</span>
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setSelectedKidId(null)}
                  className="bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 justify-center shadow-xs"
                >
                  <ChevronLeft className="w-4 h-4 scale-x-[-1]" />
                  <span>العودة لقائمة الأبناء</span>
                </button>
              </div>
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
              
              {/* Right Columns: Financial & Academic Reports */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Financial Ledger card */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4 shadow-3xs">
                  <div className="flex justify-between items-center border-b border-slate-200/60 pb-3 text-right">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-500" />
                      <span>الحالة والالتزامات المالية للطالب</span>
                    </h4>
                    <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded">
                      قسط العام الحالي
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans text-right">
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs">
                      <span className="text-slate-400 text-[10px] block mb-1">إجمالي الرسوم المدرسية</span>
                      <strong className="text-slate-800 text-base">{kidFee.totalDue.toLocaleString('ar-EG')} ج.م</strong>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs">
                      <span className="text-emerald-500 text-[10px] block mb-1 font-bold">المسدد المدفوع</span>
                      <strong className="text-emerald-600 text-base">{kidFee.paid.toLocaleString('ar-EG')} ج.م</strong>
                    </div>
                    <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-100 shadow-2xs">
                      <span className="text-rose-500 text-[10px] block mb-1 font-bold">المتبقي المطلوب سداده</span>
                      <strong className="text-rose-600 text-base">{kidFee.due.toLocaleString('ar-EG')} ج.م</strong>
                    </div>
                  </div>

                  {/* Progress Ratio bar */}
                  <div className="space-y-1.5 bg-white p-4 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>نسبة تسوية الرسوم الدراسية</span>
                      <span className="font-bold text-emerald-600">{Math.round((kidFee.paid / (kidFee.totalDue || 1)) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${Math.round((kidFee.paid / (kidFee.totalDue || 1)) * 100)}%` }} 
                      />
                    </div>
                  </div>

                  {kidFee.due > 0 ? (
                    <div className="flex justify-end pt-1">
                      <button 
                        onClick={() => {
                          setPaymentAmount(kidFee.due);
                          setShowPaymentModal(kid.id);
                        }}
                        className="bg-brand-blue hover:bg-brand-blue-dark text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-all shadow-3xs flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>تحميل / رفع إيصال سداد مصرفي جديد</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-xl text-[11px] font-bold text-center">
                      ✓ تم سداد كافة التزامات الطالب المالية لهذا العام الدراسي، نشكر جزيل تعاونكم.
                    </div>
                  )}

                  {/* History Ledger List */}
                  {kidFee.payments && kidFee.payments.length > 0 && (
                    <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-100">
                      <h5 className="font-bold text-slate-705 text-xs border-b border-slate-100 pb-2 text-right">سجلات الحوالات المرفوعة مؤخراً:</h5>
                      <div className="divide-y divide-slate-100 text-right">
                        {kidFee.payments.map((p, idx) => (
                          <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-sans font-bold text-slate-800 block">{p.amount.toLocaleString('ar-EG')} ج.م</span>
                              <span className="text-[9px] text-slate-400 block mt-0.5">{p.date} • كود: {p.transactionId}</span>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded font-bold text-[9px] ${
                              p.verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-805 font-bold'
                            }`}>
                              {p.verified ? 'مقبول وفُحص' : 'بانتظار تدقيق المحاسب'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Academic Results Tab card */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4 shadow-3xs">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-200/60 pb-3 text-right">
                    <Award className="w-4 h-4 text-brand-gold animate-pulse" />
                    <span>سجل الإنجاز والمعدلات والأكاديمية</span>
                  </h4>

                  {kidGrades.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 space-y-2 bg-white rounded-xl border border-slate-100">
                      <Award className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="text-[11px] font-bold">لم يتم رصد نتائج اختبارات أو شهادات دورية باسم الابن حتى الآن.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {kidGrades.map((g, idx) => {
                        const scoreRecord = g.records.find(r => r.studentId === kid.id);
                        if (!scoreRecord) return null;
                        const percent = Math.round((scoreRecord.score / g.records[0].maxScore) * 100);
                        let gradeColor = "text-emerald-600 bg-emerald-50/70 border-emerald-100";
                        if (percent < 50) gradeColor = "text-rose-600 bg-rose-50/70 border-rose-100";
                        else if (percent < 75) gradeColor = "text-amber-600 bg-amber-50/70 border-amber-100";

                        return (
                          <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-150 flex items-center justify-between gap-3 text-right shadow-2xs">
                            <div className="min-w-0 flex-1">
                              <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[8px] mb-1 inline-block">
                                {g.subject}
                              </span>
                              <h5 className="font-extrabold text-slate-800 text-xs truncate">{g.title}</h5>
                              <span className="text-[9px] text-slate-400 block mt-0.5">{g.date}</span>
                            </div>
                            <div className={`text-center p-2 rounded-xl border min-w-[65px] ${gradeColor}`}>
                              <span className="font-mono text-xs font-black block">{scoreRecord.score} / {g.records[0].maxScore}</span>
                              <span className="text-[10px] font-bold block">{percent}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* Left Column: Direct info, teacher details & attendance stats */}
              <div className="space-y-6">
                
                {/* Panel 1: Teacher Contact Info */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4 shadow-3xs">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-200/60 pb-2.5 text-right">
                    <Users className="w-4 h-4 text-brand-blue" />
                    <span>رائد الصف والمعلم المشرف</span>
                  </h4>

                  {classTeacher ? (
                    <div className="space-y-3 text-right">
                      <div>
                        <span className="text-slate-400 block text-[10px]">المعلم المرشد:</span>
                        <strong className="text-slate-800 text-xs block mt-0.5">{classTeacher.name}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">رقم هاتف الاتصال:</span>
                        <strong className="font-mono text-slate-800 text-xs block mt-0.5">{classTeacher.phone}</strong>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-[11px] leading-relaxed text-right">بانتظار تعيين معلم رائد لهذا الصف من قبل المدير العام.</p>
                  )}
                </div>

                {/* Panel 2: General Status Indicators */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4 shadow-3xs">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-200/60 pb-2.5 text-right">
                    <Settings className="w-4 h-4 text-cyan-600" />
                    <span>مؤشرات المتابعة اليومية</span>
                  </h4>

                  <div className="space-y-3 font-sans text-right">
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/40 text-xs">
                      <span className="text-slate-400">حالة ملف الطالب:</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px]">نشط ومستمر</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/40 text-xs">
                      <span className="text-slate-400">مستوى السلوك والمواظبة:</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px]">ممتاز جداً</span>
                    </div>
                    <div className="flex justify-between items-center py-1 text-xs">
                      <span className="text-slate-400">تحديثات البوابة:</span>
                      <span className="text-slate-500 font-bold text-[10px]">محدثة اليوم</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom buttons */}
            <div className="flex justify-end border-t border-slate-100 pt-5">
              <button 
                onClick={() => setSelectedKidId(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-colors"
              >
                رجوع لقائمة الأبناء
              </button>
            </div>
          </div>
        );
      })()}

      {/* ---------------------------------------------------- */}
      {/* MODALS */}
      {/* ---------------------------------------------------- */}
      {showComplaintModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleComplaintSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-950 text-base border-b border-slate-100 pb-3">رفع مقترح أو شكوى رسمية</h3>
            
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-600 font-bold block">التصنيف الرئيسي</label>
                <select 
                  value={complaintCategory}
                  onChange={e => setComplaintCategory(e.target.value as Complaint['category'])}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none"
                >
                  <option value="أكاديمي">أكاديمي وتعليمي</option>
                  <option value="مالي">مالي وحسابات</option>
                  <option value="سلوكي">سلوكي وانضباطي</option>
                  <option value="أخرى">أخرى ومواضيع عامة</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-bold block">المستوى والأولوية</label>
                <select 
                  value={complaintPriority}
                  onChange={e => setComplaintPriority(e.target.value as Complaint['priority'])}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none"
                >
                  <option value="low">عادية</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">قصوى ومستعجلة جداً</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-bold block">تفاصيل وتوصيف الموضوع</label>
                <textarea 
                  required
                  rows={4}
                  value={complaintDesc}
                  onChange={e => setComplaintDesc(e.target.value)}
                  placeholder="تفصيل موضوع الشكوى بوضوح..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-brand-blue text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer">تقديم المقترح</button>
              <button type="button" onClick={() => setShowComplaintModal(false)} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-xs cursor-pointer">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleUploadPayment} className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-950 text-base border-b border-slate-100 pb-3">إيصال سداد رسوم الأبناء</h3>
            
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-600 font-bold block">مبلغ الدفع (ج.م)</label>
                <input 
                  type="number" 
                  required
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-bold block">رقم العملية / كود التحويل</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: TXN-0988112"
                  value={receiptTxId}
                  onChange={e => setReceiptTxId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="p-3 bg-brand-gold/10 rounded-xl border border-brand-gold/20 text-[10px] text-slate-700 leading-relaxed">
                تنويه: يرجى التحويل على محفظة فودافون كاش الرسمية للمدرسة على رقم 01012345678 أولاً قبل تأكيد المعاملة.
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-brand-blue text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer">تأكيد رفع المعاملة</button>
              <button type="button" onClick={() => setShowPaymentModal(null)} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-xs cursor-pointer font-bold">تراجع</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
