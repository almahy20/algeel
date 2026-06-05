import React, { useState } from 'react';
import { 
  Users, UserCheck, BookOpen, CreditCard, BarChart2, Plus, Edit2, Trash2, 
  Check, X, Link, Award, GraduationCap, DollarSign, Wallet, ShieldAlert,
  Clock, AlertCircle, FileText, CheckCircle2, ChevronLeft, Settings, Send, MessageSquare
} from 'lucide-react';
import { School, UserProfile, Student, ClassInfo, FeeLedger, SchoolNotification, GradeExam, Complaint, Conversation } from '../types';
import ParentsWorkspace from './ParentsWorkspace';

interface AdminPortalProps {
  school: School;
  users: UserProfile[];
  students: Student[];
  classes: ClassInfo[];
  fees: FeeLedger[];
  grades?: GradeExam[];
  complaints: Complaint[];
  conversations: Conversation[];
  onAddStudent: (student: Omit<Student, 'id'>) => Promise<void>;
  onEditStudent: (student: Student) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  onAddTeacher: (teacher: Omit<UserProfile, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  onAddParent?: (parentData: { name: string; phone: string; email: string }) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
  onApproveUser: (userId: string) => Promise<void>;
  onAddClass: (newClass: Omit<ClassInfo, 'id' | 'studentsCount'>) => Promise<void>;
  onUpdateFees: (ledger: FeeLedger) => Promise<void>;
  onRenewSubscription: (receiptUrl: string) => Promise<void>;
  triggerNotification: (type: "absence" | "grade" | "fee" | "complaint" | "general", title: string, body: string) => Promise<void>;
  onAddComplaintReply: (complaintId: string, replyText: string, senderRole: 'admin' | 'parent') => Promise<void>;
  onSendMessage: (conversationId: string, text: string, senderRole: 'admin' | 'parent') => Promise<void>;
  onCreateConversation: (otherId: string, firstMsg: string, senderRole: 'admin' | 'parent') => Promise<void>;
  onUpdateComplaintStatus: (complaintId: string, status: 'new' | 'in_progress' | 'solved') => Promise<void>;
  onUpdateUserRole?: (userId: string, newRole: 'admin' | 'teacher' | 'parent') => Promise<void>;
  onSeedDemo?: () => Promise<void>;
  isSeeding?: boolean;
}

export default function AdminPortal({
  school,
  users,
  students,
  classes,
  fees,
  grades = [],
  complaints = [],
  conversations = [],
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onAddTeacher,
  onAddParent,
  onDeleteUser,
  onApproveUser,
  onUpdateUserRole,
  onAddClass,
  onUpdateFees,
  onRenewSubscription,
  triggerNotification,
  onAddComplaintReply,
  onSendMessage,
  onCreateConversation,
  onUpdateComplaintStatus,
  onSeedDemo,
  isSeeding = false
}: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'teachers' | 'classes' | 'fees' | 'subscription' | 'comms' | 'parents'>('overview');

  // --- Admin Comms States ---
  const [commsSubTab, setCommsSubTab] = useState<'complaints' | 'broadcast' | 'private_chat'>('complaints');
  const [selectedAdminComplaintId, setSelectedAdminComplaintId] = useState<string | null>(null);
  const [adminComplaintReplyText, setAdminComplaintReplyText] = useState('');
  const [broadcastForm, setBroadcastForm] = useState({ type: 'general' as 'general' | 'fee' | 'absence', title: '', body: '' });
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [privateMsgText, setPrivateMsgText] = useState('');

  // --- CRUD States ---
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({ id: '', name: '', classId: '', parentId: '', nationalId: '', photo: '' });
  
  const [selectedStudentDetailsId, setSelectedStudentDetailsId] = useState<string | null>(null);
  const [selectedTeacherDetailsId, setSelectedTeacherDetailsId] = useState<string | null>(null);

  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherForm, setTeacherForm] = useState({ name: '', phone: '', email: '' });

  const [showClassModal, setShowClassModal] = useState(false);
  const [classForm, setClassForm] = useState({ name: '', grade: '', teacherId: '', subjectsInput: '' });

  const [feeForm, setFeeForm] = useState<{ studentId: string; totalDue: number; paid: number } | null>(null);

  const [uploadedReceipt, setUploadedReceipt] = useState<string | null>(null);

  // --- Filter states ---
  const [studentSearch, setStudentSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');

  // Helpers
  const getParentName = (parentId: string) => users.find(u => u.id === parentId)?.name || 'غير محدد';
  const getClassName = (classId: string) => classes.find(c => c.id === classId)?.name || 'غير محدد';
  
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (studentForm.id) {
      // Edit mode
      await onEditStudent({
        id: studentForm.id,
        name: studentForm.name,
        photo: studentForm.photo || 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=150',
        classId: studentForm.classId,
        parentId: studentForm.parentId,
        nationalId: studentForm.nationalId,
        status: 'active'
      });
    } else {
      // Create mode
      await onAddStudent({
        name: studentForm.name,
        photo: studentForm.photo || 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=150',
        classId: studentForm.classId,
        parentId: studentForm.parentId,
        nationalId: studentForm.nationalId,
        status: 'active'
      });
      await triggerNotification('general', 'تسجيل طالب جديد', `تم تسجيل الطالب الجديد ${studentForm.name} بنجاح.`);
    }
    setShowStudentModal(false);
    setStudentForm({ id: '', name: '', classId: '', parentId: '', nationalId: '', photo: '' });
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddTeacher({
      name: teacherForm.name,
      phone: teacherForm.phone,
      email: `${teacherForm.phone.trim()}@school.master`,
      role: 'teacher'
    });
    setShowTeacherModal(false);
    setTeacherForm({ name: '', phone: '', email: '' });
  };

  const handleClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddClass({
      name: classForm.name,
      grade: classForm.grade,
      teacherId: classForm.teacherId,
      subjects: classForm.subjectsInput.split(',').map(s => s.trim()).filter(Boolean)
    });
    setShowClassModal(false);
    setClassForm({ name: '', grade: '', teacherId: '', subjectsInput: '' });
  };

  const handleFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (feeForm) {
      await onUpdateFees({
        studentId: feeForm.studentId,
        totalDue: Number(feeForm.totalDue),
        paid: Number(feeForm.paid),
        due: Number(feeForm.totalDue) - Number(feeForm.paid),
        payments: [
          { amount: Number(feeForm.paid), date: new Date().toISOString().split('T')[0], verified: true }
        ]
      });
      setFeeForm(null);
    }
  };

  const teachers = users.filter(u => u.role === 'teacher');
  const parents = users.filter(u => u.role === 'parent');

  return (
    <div className="space-y-6">
      
      {/* SaaS Status & Top Indicator banner */}
      <div className="bg-gradient-to-l from-brand-blue to-brand-blue-dark text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-24 h-24 bg-brand-gold/10 rounded-br-full transform -translate-x-6 -translate-y-6"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
          <div>
            <h2 className="text-xl md:text-2xl font-black mb-1">لوحة تحكم مدرسة الجيل الجديد</h2>
            <p className="text-slate-200 text-xs">إدارة شؤون الطلاب، الفصول والمدرسين وإعدادات نظام المدرسة.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1.5 rounded-full font-bold bg-emerald-500 text-white shadow-sm">
              الحالة: نظام خاص مفعل
            </span>
            {selectedStudentDetailsId ? (
              <button 
                onClick={() => setSelectedStudentDetailsId(null)} 
                className="bg-brand-gold hover:bg-amber-600 text-brand-blue-dark text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 scale-x-[-1]" />
                <span>العودة لقائمة الطلاب</span>
              </button>
            ) : selectedTeacherDetailsId ? (
              <button 
                onClick={() => setSelectedTeacherDetailsId(null)} 
                className="bg-brand-gold hover:bg-amber-600 text-brand-blue-dark text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 scale-x-[-1]" />
                <span>العودة لقائمة المعلمين</span>
              </button>
            ) : activeTab !== 'overview' ? (
              <button 
                onClick={() => setActiveTab('overview')} 
                className="bg-brand-gold hover:bg-amber-600 text-brand-blue-dark text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 scale-x-[-1]" />
                <span>العودة للرئيسية</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* OVERVIEW TAB HANDLER */}
      {activeTab === 'overview' && !selectedStudentDetailsId && !selectedTeacherDetailsId && (
        <div className="space-y-8">
          {/* Murbat Navigation Grid */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-slate-800 text-base">بوابة العمليات المدرسية الرئيسية</h3>
            <p className="text-slate-500 text-xs">انقر على أي من المربعات التالية للانتقال للقسم المطلوب فوراً وبسهولة تامة:</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Box 1: Students */}
            <button 
              onClick={() => setActiveTab('students')}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-brand-blue hover:shadow-lg transition-all duration-300 text-right group cursor-pointer flex flex-col justify-between h-44 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-20 h-20 bg-blue-50/50 rounded-br-full -translate-x-10 -translate-y-10 group-hover:scale-125 transition-transform" />
              <div className="flex justify-between items-start z-10 relative">
                <span className="p-3.5 rounded-2xl bg-blue-50 text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all">
                  <GraduationCap className="w-6 h-6" />
                </span>
                <span className="bg-blue-100 text-brand-blue font-sans font-bold text-[11px] px-2.5 py-1 rounded-full">
                  {students.length} طالب
                </span>
              </div>
              <div className="z-10 relative mt-4">
                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-brand-blue transition-colors">شؤون الطلاب المقيدين</h4>
                <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">عرض وتعديل ملفات الطلاب، وإضافة تسجيلات جديدة بالمنظومة</p>
              </div>
            </button>

            {/* Box 2: Teachers */}
            <button 
              onClick={() => setActiveTab('teachers')}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-lg transition-all duration-300 text-right group cursor-pointer flex flex-col justify-between h-44 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-20 h-20 bg-amber-50/50 rounded-br-full -translate-x-10 -translate-y-10 group-hover:scale-125 transition-transform" />
              <div className="flex justify-between items-start z-10 relative">
                <span className="p-3.5 rounded-2xl bg-amber-50 text-amber-500 group-hover:bg-brand-gold group-hover:text-white transition-all">
                  <Users className="w-6 h-6" />
                </span>
                <span className="bg-amber-100 text-amber-800 font-sans font-bold text-[11px] px-2.5 py-1 rounded-full">
                  {teachers.length} معلّم
                </span>
              </div>
              <div className="z-10 relative mt-4">
                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-brand-gold transition-colors">كادر معلمات ومعلمي المدرسة</h4>
                <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">إدارة الإسناد التعليمي، متابعة الحسابات وتنشيط بطاقاتهم</p>
              </div>
            </button>

            {/* Box 3: Classes */}
            <button 
              onClick={() => setActiveTab('classes')}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 text-right group cursor-pointer flex flex-col justify-between h-44 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-20 h-20 bg-indigo-50/50 rounded-br-full -translate-x-10 -translate-y-10 group-hover:scale-125 transition-transform" />
              <div className="flex justify-between items-start z-10 relative">
                <span className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <BookOpen className="w-6 h-6" />
                </span>
                <span className="bg-indigo-100 text-indigo-800 font-sans font-bold text-[11px] px-2.5 py-1 rounded-full">
                  {classes.length} شُعب
                </span>
              </div>
              <div className="z-10 relative mt-4">
                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">الشعب والفصول الدراسية</h4>
                <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">تنظيم الفصول الأكاديمية وتوزيع المواد وربط رواد الصف</p>
              </div>
            </button>

            {/* Box 4: Fees */}
            <button 
              onClick={() => setActiveTab('fees')}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all duration-300 text-right group cursor-pointer flex flex-col justify-between h-44 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-20 h-20 bg-emerald-50/50 rounded-br-full -translate-x-10 -translate-y-10 group-hover:scale-125 transition-transform" />
              <div className="flex justify-between items-start z-10 relative">
                <span className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <CreditCard className="w-6 h-6" />
                </span>
                <span className="bg-emerald-100 text-emerald-800 font-sans font-bold text-[11px] px-2.5 py-1 rounded-full">
                  إدارة الرسوم
                </span>
              </div>
              <div className="z-10 relative mt-4">
                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">إدارة الحسابات والرسوم المدرسية</h4>
                <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">تحديث البيانات والذمم المالية ومتابعة سداد الأقساط للأبناء</p>
              </div>
            </button>

            {/* Box 5: Communications, Group Messaging & Complaints Support */}
            <button 
              onClick={() => setActiveTab('comms')}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-violet-500 hover:shadow-lg transition-all duration-300 text-right group cursor-pointer flex flex-col justify-between h-44 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-20 h-20 bg-violet-50/50 rounded-br-full -translate-x-10 -translate-y-10 group-hover:scale-125 transition-transform" />
              <div className="flex justify-between items-start z-10 relative">
                <span className="p-3.5 rounded-2xl bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-all">
                  <MessageSquare className="w-6 h-6" />
                </span>
                <span className="bg-violet-100 text-violet-800 font-sans font-bold text-[11px] px-2.5 py-1 rounded-full">
                  {complaints.filter(c => c.status === 'new').length} شكوى جديدة
                </span>
              </div>
              <div className="z-10 relative mt-4">
                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-violet-600 transition-colors">مركز التواصل والشكاوى</h4>
                <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">البث الجماعي لأولياء الأمور، وإجراء محادثات مباشرة والرد على تذاكر الشكاوى</p>
              </div>
            </button>

            {/* Box 6: Configuration / Address Info */}
            <button 
              onClick={() => setActiveTab('subscription')}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-400 hover:shadow-lg transition-all duration-300 text-right group cursor-pointer flex flex-col justify-between h-44 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-20 h-20 bg-slate-50 rounded-br-full -translate-x-10 -translate-y-10 group-hover:scale-125 transition-transform" />
              <div className="flex justify-between items-start z-10 relative">
                <span className="p-3.5 rounded-2xl bg-slate-50 text-slate-600 group-hover:bg-slate-700 group-hover:text-white transition-all">
                  <Settings className="w-6 h-6" />
                </span>
                <span className="bg-slate-100 text-slate-700 font-sans font-bold text-[11px] px-2.5 py-1 rounded-full">
                  إعدادات المدرسة
                </span>
              </div>
              <div className="z-10 relative mt-4">
                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-slate-700 transition-colors">إعدادات المدرسة العامة</h4>
                <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">الاطلاع على معلومات العنوان، هاتف الاتصال والترخيص والتقويم السنوي</p>
              </div>
            </button>

            {/* Box Parents: Parents Management */}
            <button 
              onClick={() => setActiveTab('parents')}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-lg transition-all duration-300 text-right group cursor-pointer flex flex-col justify-between h-44 relative overflow-hidden animate-fadeIn"
            >
              <div className="absolute top-0 left-0 w-20 h-20 bg-emerald-50/50 rounded-br-full -translate-x-10 -translate-y-10 group-hover:scale-125 transition-transform" />
              <div className="flex justify-between items-start z-10 relative">
                <span className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <Users className="w-6 h-6" />
                </span>
                <span className="bg-emerald-100 text-emerald-800 font-sans font-bold text-[11px] px-2.5 py-1 rounded-full">
                  {users.filter(u => u.role === 'parent').length} أولياء أمور
                </span>
              </div>
              <div className="z-10 relative mt-4">
                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">شؤون أولياء الأمور</h4>
                <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">عرض وتحرير حسابات أولياء الأمور، وإضافة روابط الأبناء أو الرعاية والمتابعة</p>
              </div>
            </button>
          </div>

          <hr className="border-slate-100" />

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 scrollbar-hide">
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-blue-50 text-brand-blue">
                  <GraduationCap className="w-5 h-5" />
                </span>
                <span className="text-[10px] text-emerald-500 font-bold font-sans">98% حضور</span>
              </div>
              <p className="text-slate-500 text-xs font-medium">إجمالي الطلاب</p>
              <h3 className="text-2xl font-bold font-sans text-brand-blue-dark mt-1">{students.length} طالب</h3>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-amber-50 text-brand-gold">
                  <Users className="w-5 h-5" />
                </span>
                <span className="text-[10px] text-slate-500 font-bold font-sans">نشطين بالكامل</span>
              </div>
              <p className="text-slate-500 text-xs font-medium">المعلمون</p>
              <h3 className="text-2xl font-bold font-sans text-brand-blue-dark mt-1">{teachers.length} معلّم</h3>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-500">
                  <BookOpen className="w-5 h-5" />
                </span>
                <span className="text-[10px] text-indigo-500 font-bold">2 مادة متوسط</span>
              </div>
              <p className="text-slate-500 text-xs font-medium">الفصول</p>
              <h3 className="text-2xl font-bold font-sans text-brand-blue-dark mt-1">{classes.length} شعبة</h3>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-500">
                  <Wallet className="w-5 h-5" />
                </span>
                <span className="text-[10px] text-emerald-500 font-bold font-sans">+8% نمو</span>
              </div>
              <p className="text-slate-500 text-xs font-medium">الرسوم المحصلة</p>
              <h3 className="text-2xl font-bold font-sans text-brand-blue-dark mt-1">
                {fees.reduce((acc, curr) => acc + curr.paid, 0).toLocaleString('ar-EG')} ج.م
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            
            {/* Waiting Registrations & Approvals */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 mb-4">
                <UserCheck className="w-4 h-4 text-emerald-500" />
                <span>طلبات التسجيل بانتظار الموافقة</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.filter(u => u.status === 'waiting').length === 0 ? (
                  <div className="text-center py-8 col-span-full">
                    <p className="text-xs text-slate-400">لا توجد طلبات تسجيل معلقة حالياً</p>
                  </div>
                ) : (
                  users.filter(u => u.status === 'waiting').map(waitingUser => (
                    <div key={waitingUser.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{waitingUser.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{waitingUser.email} • {waitingUser.role === 'parent' ? 'ولي أمر' : 'مدرس'}</p>
                      </div>
                      <button 
                        onClick={() => onApproveUser(waitingUser.id)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg p-2 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                        title="موافقة وتنشيط الحساب"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100 text-[10px] text-slate-700 leading-relaxed mt-4">
                تنويه: لا يمكن للمستخدِم الدخول إلى حسابه الشخصي قبل موافقة المدير وتعديل حالته إلى "مفعل".
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SHU'OON STUDENTS TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'students' && !selectedStudentDetailsId && !selectedTeacherDetailsId && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">سجلات الطلاب المقيدين</h3>
              <p className="text-xs text-slate-500">إضافة وتعديل بيانات الطلاب وربط أولياء الأمور بالشعب الدراسية.</p>
            </div>
            <button 
              onClick={() => {
                setStudentForm({ id: '', name: '', classId: '', parentId: '', nationalId: '', photo: '' });
                setShowStudentModal(true);
              }}
              className="bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة طالب جديد</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <input 
              type="text" 
              placeholder="البحث باسم الطالب، الهيئة الوطنية أو ولي الأمر..."
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-10 pl-4 text-xs focus:ring-2 focus:ring-brand-blue outline-none"
            />
            <GraduationCap className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {students
              .filter(s => s.name.includes(studentSearch) || s.nationalId.includes(studentSearch))
              .map(student => {
                const sFee = fees.find(f => f.studentId === student.id) || { totalDue: 5000, paid: 0, due: 5000 };
                const isPaid = sFee.due <= 0;
                return (
                  <div key={student.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4 relative overflow-hidden group">
                    {/* Top Accent Strip */}
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-brand-blue to-cyan-500 rounded-t-2xl"></div>
                    
                    <div className="flex items-start gap-3">
                      <img 
                        src={student.photo} 
                        alt={student.name}
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm"
                      />
                      <div className="space-y-1 text-right flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm truncate" title={student.name}>{student.name}</h4>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="bg-blue-50 text-brand-blue text-[9px] px-2 py-0.5 rounded-full font-bold">
                            {getClassName(student.classId)}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                            isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {isPaid ? 'خالص مالياً' : 'مستحق'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[10px]">الهوية الوطنية:</span>
                        <span className="font-mono font-medium text-slate-700">{student.nationalId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[10px]">ولي الأمر:</span>
                        <span className="font-medium text-slate-700 truncate max-w-[120px]">{getParentName(student.parentId)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <button 
                        onClick={() => setSelectedStudentDetailsId(student.id)}
                        className="flex-1 bg-brand-blue/5 hover:bg-brand-blue/10 text-brand-blue font-bold text-[10px] py-2 rounded-xl text-center cursor-pointer transition-colors"
                      >
                        عرض التفاصيل والمتابعة
                      </button>
                      <button 
                        onClick={() => {
                          setStudentForm({
                            id: student.id,
                            name: student.name,
                            classId: student.classId,
                            parentId: student.parentId,
                            nationalId: student.nationalId,
                            photo: student.photo
                          });
                          setShowStudentModal(true);
                        }}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
                        title="تعديل بيانات الطالب"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm('هل أنت متأكد من حذف وثيقة الطالب؟')) {
                            await onDeleteStudent(student.id);
                          }
                        }}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl cursor-pointer"
                        title="حذف الطالب"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TEACHERS CONTROLS TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'teachers' && !selectedStudentDetailsId && !selectedTeacherDetailsId && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">الهيكل التدريسي</h3>
              <p className="text-xs text-slate-500">مراقبة وتنشيط وإضافة المعلمين وصلاحيات فصولهم.</p>
            </div>
            <button 
              onClick={() => setShowTeacherModal(true)}
              className="bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة معلم جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map(teacher => {
              const teacherClasses = classes.filter(c => c.teacherId === teacher.id);
              return (
                <div key={teacher.id} className="p-5 bg-white border border-slate-150 rounded-2xl relative shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-brand-blue/5 border border-brand-blue/10 flex items-center justify-center text-brand-blue shadow-3xs">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-slate-800 text-sm truncate">{teacher.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{teacher.email}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-[10px]">الجوال:</span>
                      <span className="font-mono text-slate-700">{teacher.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-[10px]">الفصول المسندة:</span>
                      <span className="font-bold text-slate-700">{teacherClasses.length} فصول</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <button 
                      onClick={() => setSelectedTeacherDetailsId(teacher.id)}
                      className="flex-1 bg-brand-blue/5 hover:bg-brand-blue/10 text-brand-blue font-bold text-[10px] py-2 rounded-xl text-center cursor-pointer transition-colors"
                    >
                      عرض ملف المعلم والتفاصيل
                    </button>
                    <span className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-[9px] whitespace-nowrap">
                      مفعل
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section: Convert Registered Parents into Teachers */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm">أولياء الأمور المسجلين (لإمكانية تحويلهم إلى معلمين للتحكم)</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">حسب سياسة المدرسة، أي حساب يتم تسجيله تلقائياً يبدأ كـ "ولي أمر". كمدير للنظام، يمكنك من هنا وبضغطة زر تحويل أي حساب ولي أمر مسجل إلى كادر المعلمين المعتمدين.</p>
            </div>
            
            {parents.length === 0 ? (
              <p className="text-[11px] text-slate-400">لا يوجد حسابات أولياء أمور مسجلة حالياً لتحويلها.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {parents.map(p => (
                  <div key={p.id} className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col justify-between items-stretch gap-3">
                    <div>
                      <div className="font-extrabold text-slate-800 text-xs truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{p.phone}</div>
                    </div>
                    <button
                      onClick={async () => {
                        if (onUpdateUserRole) {
                          await onUpdateUserRole(p.id, 'teacher');
                          alert(`تم تحويل المستخدم "${p.name}" بنجاح إلى حساب معلم معتمد.`);
                        }
                      }}
                      className="w-full bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 text-[#2563eb] border border-[#2563eb]/20 text-[10px] font-bold py-1.5 rounded-lg text-center cursor-pointer transition-all"
                    >
                      تحويل فوري إلى حساب معلم ⇆
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* CLASSES TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'classes' && !selectedStudentDetailsId && !selectedTeacherDetailsId && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">الشُّعب والفصول التدريسية</h3>
              <p className="text-xs text-slate-500">إنشاء وتوزيع المواد والشعب على المعلمين المشرفين.</p>
            </div>
            <button 
              onClick={() => setShowClassModal(true)}
              className="bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة فصل/شعبة جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map(cls => {
              const teacherName = users.find(u => u.id === cls.teacherId)?.name || 'لم يحدد معلم';
              return (
                <div key={cls.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 text-base">{cls.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{cls.grade}</p>
                    </div>
                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-bold">
                      {cls.studentsCount} طالباً
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="block text-[10px] text-slate-400">رائد الفصل</span>
                      <span className="font-bold text-slate-800 mt-1 block">{teacherName}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100 overflow-hidden text-ellipsis">
                      <span className="block text-[10px] text-slate-400">المواد المسندة</span>
                      <span className="font-bold text-brand-gold mt-1 block whitespace-nowrap">{cls.subjects.join('، ')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* FEES TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'fees' && !selectedStudentDetailsId && !selectedTeacherDetailsId && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">دفاتر المطالبات والرسوم المالية</h3>
            <p className="text-xs text-slate-500">إدارة الأقساط وتحديد رسوم المدارس ومراقبة التحصيل.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {students.map(s => {
              const sFee = fees.find(f => f.studentId === s.id) || { totalDue: 5000, paid: 0, due: 5000 };
              const isPaid = sFee.due <= 0;
              const payPercent = Math.min(100, Math.round((sFee.paid / (sFee.totalDue || 1)) * 100));
              return (
                <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-150 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-slate-800 text-sm truncate">{s.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{getClassName(s.classId)}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-extrabold text-[9px] whitespace-nowrap ${
                      isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {isPaid ? 'جاهز بالكامل' : 'عالق ومستحق'}
                    </span>
                  </div>

                  {/* Fee bar layout */}
                  <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between text-[11px] font-sans">
                      <span className="text-slate-400">إجمالي الرسوم:</span>
                      <span className="font-bold text-slate-700">{sFee.totalDue.toLocaleString('ar-EG')} ج.م</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-sans">
                      <span className="text-slate-400 font-bold text-emerald-500">المسدد بالفعل:</span>
                      <span className="font-bold text-emerald-600">{sFee.paid.toLocaleString('ar-EG')} ج.م</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-sans pt-1.5 border-t border-slate-250">
                      <span className="text-slate-400 font-bold text-rose-500">المتبقي المطلوب:</span>
                      <span className="font-extrabold text-rose-600">{sFee.due.toLocaleString('ar-EG')} ج.م</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${payPercent}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setFeeForm({ studentId: s.id, totalDue: sFee.totalDue, paid: sFee.paid })}
                      className="flex-1 bg-brand-gold hover:bg-amber-500 text-brand-blue-dark font-extrabold text-[10px] py-2 rounded-xl text-center cursor-pointer transition-colors shadow-3xs"
                    >
                      تعديل الرسوم
                    </button>
                    <button 
                      onClick={() => setSelectedStudentDetailsId(s.id)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-[10px] whitespace-nowrap cursor-pointer transition-colors"
                      title="تفاصيل كشف الحساب"
                    >
                      كشف حساب
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SCHOOL SETTINGS INFORMATION TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'subscription' && !selectedStudentDetailsId && !selectedTeacherDetailsId && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">البيانات الإدارية والترخيص المعتمد لمدرسة الجيل الجديد</h3>
            <p className="text-xs text-slate-500">معلومات المنشأة والترخيص والموقع الجغرافي المسجل لإصدار التقارير الرسمية.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left status panel */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-md">الاعتماد والترخيص الرسمي</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">مرخصة من وزارة التعليم للأعوام القادمة</p>
                </div>
              </div>

              <div className="border-t border-slate-200/50 pt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">الاسم الرسمي</span>
                  <span className="font-bold text-slate-700">مدرسة الجيل الجديد الأهلية</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ترخيص تشغيل رقم</span>
                  <span className="font-mono font-bold text-brand-blue">{school.settings.licenseNumber || 'EDU-NG-2026'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">العام الدراسي الحالي</span>
                  <span className="font-sans font-bold text-slate-700">{school.settings.academicYear || '2025 - 2026'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الفصل الدراسي الحالي</span>
                  <span className="font-bold text-brand-gold">{school.settings.semester || 'الفصل الدراسي الأول'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">نظام تقييم الدرجات والمعدل</span>
                  <span className="font-bold text-slate-700">{school.settings.gradingSystem || 'Letter (A-F)'}</span>
                </div>
              </div>
            </div>

            {/* Right upload payment receipt */}
            <div className="p-6 border border-slate-200 rounded-2xl space-y-4">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-brand-blue" />
                <span>عنوان الاتصال والمعلومات الجغرافية</span>
              </h4>
              
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 block font-bold">الموقع الجغرافي والفرع الرئيسي:</span>
                  <p className="p-3 bg-slate-50 rounded-xl font-bold text-slate-800">{school.settings.address || 'مكة المكرمة، حي الشوقية، شارع الجيل الجديد، مبنى رقم 7'}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 block font-bold">رقم الهاتف المدرسي المباشر:</span>
                  <p className="p-3 bg-slate-50 rounded-xl font-bold text-slate-800 font-sans">{school.settings.phone || '0123456789'}</p>
                </div>

                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-xl text-[11px] leading-relaxed">
                  ملاحظة: هذا النظام مهيأ محلياً وخصيصاً لفرع مدرسة الجيل الجديد. يرجى مراجعة وتحديث هذه الحقول الحساسة بالتنسيق مع قسم الدعم الفني العام للمنظومة.
                </div>
              </div>
            </div>

            {/* تهيئة مستندات ومحاكاة قاعدة البيانات السحابية */}
            {onSeedDemo && (
              <div className="md:col-span-2 p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-brand-blue/10 text-brand-blue rounded-xl shrink-0">
                    <svg className={`w-6 h-6 ${isSeeding ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-[#111827] text-sm">تهيئة وتعميد السجلات المدرسية (الهيكل السحابي الموحد)</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      بصفتك مديراً للنظام، يتيح لك هذا الخيار تأسيس قاعدة بيانات مدرسة "الجيل الجديد" كاملة ومصنفة (الطلاب، الغيابات، الحسابات والمدفوعات، الكادر التدريسي، والشكاوى) داخل قاعدة بيانات Firestore السحابية الخاصة بك لتشغيل النظام بهيكله الموحد مباشرة.
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end pt-2 border-t border-slate-200/50">
                  <button
                    onClick={async () => {
                      try {
                        await onSeedDemo();
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    disabled={isSeeding}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-[#2563eb] hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-[11px] px-5 py-3 rounded-xl cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(37,99,235,0.2)] transition-all"
                  >
                    <svg className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
                    </svg>
                    <span>{isSeeding ? 'جاري تهيئة وتعميد السجلات السحابية...' : 'بدء تهيئة قاعدة البيانات بالهيكل الموحد'}</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* PARENTS WORKSPACE TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'parents' && !selectedStudentDetailsId && !selectedTeacherDetailsId && (
        <ParentsWorkspace 
          users={users}
          students={students}
          classes={classes}
          onAddParent={onAddParent}
          onDeleteUser={onDeleteUser}
          onUpdateUserRole={onUpdateUserRole}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* COMMUNICATIONS & COMPLAINTS WORKSPACE */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'comms' && !selectedStudentDetailsId && !selectedTeacherDetailsId && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6 text-right animate-fadeIn" style={{ direction: 'rtl' }}>
          {/* Main Title Header */}
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-slate-900 text-lg">بوابة الاتصال الذكي والشكاوى الإلكترونية</h3>
            <p className="text-xs text-slate-500 mt-1">تنسيق الشكاوى، ومراسلة أولياء الأمور فورا، وإرسال التعاميم المدرسية الموحدة.</p>
          </div>

          {/* Sub-tab switcher */}
          <div className="flex border-b border-slate-200 gap-1 pb-px">
            <button
              onClick={() => { setCommsSubTab('complaints'); }}
              className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                commsSubTab === 'complaints'
                  ? 'border-brand-blue text-brand-blue'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              متابعة الشكاوى والاقتراحات ({complaints.length})
            </button>
            <button
              onClick={() => { setCommsSubTab('broadcast'); }}
              className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                commsSubTab === 'broadcast'
                  ? 'border-brand-blue text-brand-blue'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              البث الجماعي والتعاميم الفورية
            </button>
            <button
              onClick={() => { setCommsSubTab('private_chat'); }}
              className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                commsSubTab === 'private_chat'
                  ? 'border-brand-blue text-brand-blue'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              المراسلات الخاصة والدردشة المباشرة
            </button>
          </div>

          {/* Sub-tab view: Complaints & Suggestions */}
          {commsSubTab === 'complaints' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Right Column: Complaints List */}
              <div className="lg:col-span-1 border border-slate-200/60 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-slate-50/50">
                <div className="bg-slate-100/80 p-3 text-xs text-slate-600 font-bold border-b border-slate-200">الفرز والشكاوى المودعة</div>
                {complaints.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">لا توجد شكاوى نشطة بالمنظومة حالياً.</div>
                ) : (
                  complaints.map(cp => {
                    return (
                      <button
                        key={cp.id}
                        type="button"
                        onClick={() => { setSelectedAdminComplaintId(cp.id); }}
                        className={`w-full p-4 text-right block hover:bg-slate-100 transition-colors cursor-pointer border-r-4 ${
                          selectedAdminComplaintId === cp.id
                            ? 'bg-amber-50/30 border-r-brand-blue'
                            : 'border-r-transparent bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-extrabold text-slate-850 text-xs">{cp.category}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            cp.status === 'new' ? 'bg-amber-100 text-amber-800' :
                            cp.status === 'in_progress' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {cp.status === 'new' ? 'جديد' :
                             cp.status === 'in_progress' ? 'قيد المتابعة' : 'حُلّت الملاحظة'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mb-2 leading-relaxed">{cp.description}</p>
                        <div className="flex justify-between items-center text-[9px] text-slate-400">
                          <span className="font-bold">المستلم: {cp.parentName || 'ولي أمر'}</span>
                          <span>{cp.createdAt ? new Date(cp.createdAt).toLocaleDateString('ar-EG') : ''}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Left Column: Complaint Details and Chat replies */}
              <div className="lg:col-span-2 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between min-h-[420px] bg-white">
                {(() => {
                  const activeComplaint = complaints.find(c => c.id === selectedAdminComplaintId);
                  if (!activeComplaint) {
                    return (
                      <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3 p-8 my-auto">
                        <AlertCircle className="w-12 h-12 text-slate-300 animate-pulse" />
                        <h4 className="font-bold text-slate-700 text-xs text-brand-blue">بوابة معالجة الملاحظات والشكاوى</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm">يرجى نقر أحد تذاكر الشكاوى من القائمة اليمنى للتحاور المباشر مع ولي الأمر وحسم حالة التذكرة المرفوعة بنجاح.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="flex-1 flex flex-col justify-between">
                      {/* Topic Metadata & Action Controls */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                        <div>
                          <span className="font-bold text-[10px] text-brand-blue bg-blue-100 px-2 py-0.5 rounded">التصنيف: {activeComplaint.category}</span>
                          <strong className="block text-slate-800 text-xs mt-2 leading-relaxed">{activeComplaint.description}</strong>
                          <span className="text-[10px] text-slate-400 block mt-1">كود الملاحظة: {activeComplaint.id} • ولي الأمر: {activeComplaint.parentName}</span>
                        </div>

                        {/* Status Quick Action buttons */}
                        <div className="flex gap-1.5 flex-wrap sm:flex-nowrap">
                          <button
                            type="button"
                            onClick={() => onUpdateComplaintStatus(activeComplaint.id, 'in_progress')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              activeComplaint.status === 'in_progress'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100/80'
                            }`}
                          >
                            قيد المتابعة
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateComplaintStatus(activeComplaint.id, 'solved')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              activeComplaint.status === 'solved'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100/80'
                            }`}
                          >
                            محلولة
                          </button>
                        </div>
                      </div>

                      {/* Chat Threads */}
                      <div className="space-y-3 flex-1 max-h-[220px] overflow-y-auto p-3 bg-slate-50 border border-slate-100 rounded-xl pr-2">
                        {activeComplaint.replies && activeComplaint.replies.map((reply, i) => {
                          const isSenderAdmin = reply.senderRole === 'admin' || (reply.senderId && (reply.senderId.startsWith('admin') || reply.senderId === 'admin_reply'));
                          return (
                            <div
                              key={i}
                              className={`p-3 rounded-2xl max-w-sm text-xs space-y-1 ${
                                isSenderAdmin
                                  ? 'bg-brand-blue text-white mr-auto'
                                  : 'bg-white text-slate-800 border border-slate-150 ml-auto'
                              }`}
                            >
                              <div className="flex justify-between items-center text-[9px] opacity-80 gap-3">
                                <span className="font-extrabold">{reply.senderName}</span>
                                <span className="font-mono">{reply.time}</span>
                              </div>
                              <p className="leading-relaxed font-semibold">{reply.text}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Send response footer input */}
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!adminComplaintReplyText.trim()) return;
                          await onAddComplaintReply(activeComplaint.id, adminComplaintReplyText, 'admin');
                          setAdminComplaintReplyText('');
                        }}
                        className="flex gap-2 border-t border-slate-100 pt-3 mt-4"
                      >
                        <input
                          type="text"
                          required
                          value={adminComplaintReplyText}
                          onChange={e => setAdminComplaintReplyText(e.target.value)}
                          placeholder="اكتب رد رعاية الأبوية أو قرار الإدارة هنا ومتابعته فوراً..."
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-brand-blue text-right"
                        />
                        <button
                          type="submit"
                          className="bg-brand-blue hover:bg-brand-blue-dark hover:scale-105 duration-150 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                          <span>إرسال الرد</span>
                        </button>
                      </form>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Sub-tab view: Broadcast Announcements */}
          {commsSubTab === 'broadcast' && (
            <div className="max-w-2xl mx-auto border border-slate-200 bg-slate-50/50 rounded-2xl p-6 space-y-5">
              <div className="border-b border-slate-150 pb-3 flex items-center justify-start gap-2">
                <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
                  <BarChart2 className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">إرسال تعاميم وبث رسائل جماعية فورا</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">البث الجماعي يرسل تنبيها رقميا فوريا يظهر في لوحة الإشعارات لكامل أولياء أمور طلاب المدرسة.</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-600 font-bold block">نوع وتصنيف البث</label>
                    <select
                      value={broadcastForm.type}
                      onChange={e => setBroadcastForm({ ...broadcastForm, type: e.target.value as any })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-brand-blue"
                    >
                      <option value="general">تعميم وإشعار عام</option>
                      <option value="absence">غياب وحضور الطلبة</option>
                      <option value="fee">تذكير بالأقساط والرسوم المالية</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-600 font-bold block">عنوان الإشعار الرئيسي</label>
                    <input
                      type="text"
                      required
                      value={broadcastForm.title}
                      onChange={e => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                      placeholder="امثلة: تعميم هام بخصوص انطلاق الامتحانات..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-brand-blue text-right"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 font-bold block">مضمون ونص التعميم الموحد</label>
                  <textarea
                    required
                    rows={4}
                    value={broadcastForm.body}
                    onChange={e => setBroadcastForm({ ...broadcastForm, body: e.target.value })}
                    placeholder="كتب التفاصيل أو التعميم الكامل بوضوح ودقة..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-brand-blue resize-none text-right"
                  />
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (!broadcastForm.title.trim() || !broadcastForm.body.trim()) {
                      alert("فضلاً املأ العنوان ونص التعميم للبث.");
                      return;
                    }
                    await triggerNotification(broadcastForm.type, broadcastForm.title, broadcastForm.body);
                    alert("تم إرسال ونشر التعميم الجماعي لكافة أولياء الأمور بنجاح ولحظياً!");
                    setBroadcastForm({ type: 'general', title: '', body: '' });
                  }}
                  className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white font-extrabold text-xs py-3.5 rounded-xl cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>بث ونشر المراسلة الآن</span>
                </button>
              </div>
            </div>
          )}

          {/* Sub-tab view: Direct Chat with Parents */}
          {commsSubTab === 'private_chat' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Parent list */}
              <div className="lg:col-span-1 border border-slate-200/60 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-slate-50/50">
                <div className="bg-slate-100/80 p-3 text-xs text-slate-600 font-bold border-b border-slate-200">أولياء الأمور المسجلين بالبوابة بالكامل</div>
                {users.filter(u => u.role === 'parent').length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">لا يوجد أي أولياء أمور معتمدين بالبوابة بعد.</div>
                ) : (
                  users.filter(u => u.role === 'parent').map(p => {
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setSelectedParentId(p.id); }}
                        className={`w-full p-4 text-right block hover:bg-slate-100 transition-colors cursor-pointer border-r-4 ${
                          selectedParentId === p.id ? 'bg-amber-50/30 border-r-brand-blue' : 'border-r-transparent bg-white'
                        }`}
                      >
                        <div className="font-extrabold text-slate-800 text-xs mb-1">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{p.phone} • {p.email}</div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Private Chat interface */}
              <div className="lg:col-span-2 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between min-h-[420px] bg-white">
                {(() => {
                  const activeParent = users.find(u => u.id === selectedParentId);
                  if (!activeParent) {
                    return (
                      <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3 p-8 my-auto">
                        <MessageSquare className="w-12 h-12 text-slate-350 animate-bounce" />
                        <h4 className="font-bold text-slate-700 text-xs text-brand-blue">نظام مراسلة أولياء الأمور الخاصة ومتابعة الأبناء</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm">اختر أحد أولياء الأمور المعروضين في القائمة اليمنى لفتح شاشة تواصل ثنائية مباشرة وآمنة بينكما.</p>
                      </div>
                    );
                  }

                  // Find conversation
                  const currentConvo = conversations.find(c => 
                    c.participants.includes(activeParent.id)
                  );

                  return (
                    <div className="flex-1 flex flex-col justify-between h-full">
                      {/* Parent header */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center mb-4">
                        <div>
                          <strong className="text-slate-800 text-xs block">محادثة خاصة ومباشرة: {activeParent.name}</strong>
                          <span className="text-[9px] text-slate-400 mt-1 block">رقم للتواصل: {activeParent.phone}</span>
                        </div>
                        <span className="font-mono text-[9px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded font-extrabold">محادثة مشفرة فورية</span>
                      </div>

                      {/* Message lists */}
                      <div className="space-y-3 flex-1 max-h-[220px] overflow-y-auto p-3 bg-slate-50 border border-slate-100 rounded-xl pr-2">
                        {currentConvo ? (
                          currentConvo.messages.map((m, idx) => {
                            const isMe = m.senderId !== activeParent.id;
                            return (
                              <div
                                key={idx}
                                className={`p-3 rounded-2xl max-w-sm text-xs space-y-1 ${
                                  isMe ? 'bg-brand-blue text-white mr-auto' : 'bg-white text-slate-800 border border-slate-150 ml-auto'
                                }`}
                              >
                                <div className="flex justify-between items-center text-[9px] opacity-80 gap-3">
                                  <span className="font-bold">{m.senderName}</span>
                                  <span className="font-mono">{m.time}</span>
                                </div>
                                <p className="leading-relaxed font-semibold">{m.text}</p>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-12 text-slate-400 space-y-3.5">
                            <p className="text-[11px] leading-relaxed">لا توجد رسائل ثنائية متبادلة مع ولي الأمر بعد في البوابة.</p>
                            <button
                              type="button"
                              onClick={() => onCreateConversation(activeParent.id, "السلام عليكم ورحمة الله وبركاته، تسعد مدرسة الجيل الجديد بالتواصل معكم للاستفسار والمتابعة اليومية للأبناء.", 'admin')}
                              className="bg-brand-blue hover:bg-brand-blue-dark text-white text-[10px] font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-3xs inline-flex items-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>بدء ترحيب ومحادثة ثنائية ومغلقة</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Reply input */}
                      {currentConvo && (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (!privateMsgText.trim()) return;
                            await onSendMessage(currentConvo.id, privateMsgText, 'admin');
                            setPrivateMsgText('');
                          }}
                          className="flex gap-2 border-t border-slate-100 pt-3 mt-4"
                        >
                          <input
                            type="text"
                            required
                            value={privateMsgText}
                            onChange={e => setPrivateMsgText(e.target.value)}
                            placeholder="اكتب رسالتك لولي الأمر بالتفصيل هنا..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-brand-blue text-right"
                          />
                          <button
                            type="submit"
                            className="bg-brand-blue hover:bg-brand-blue-dark hover:scale-105 duration-150 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Send className="w-4 h-4" />
                            <span>إرسال</span>
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODALS */}
      {/* ---------------------------------------------------- */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleStudentSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-950 text-base border-b border-slate-100 pb-3">
              {studentForm.id ? 'تعديل وثيقة الطالب' : 'تسجيل طالب جديد بالمنظومة'}
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-600 font-bold block">اسم الطالب الكامل</label>
                <input 
                  type="text" 
                  required
                  value={studentForm.name}
                  onChange={e => setStudentForm({ ...studentForm, name: e.target.value })}
                  placeholder="أدخل الاسم الرباعي للطالب..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-bold block">رقم الهوية الوطنية / الإقامة</label>
                <input 
                  type="text" 
                  required
                  value={studentForm.nationalId}
                  onChange={e => setStudentForm({ ...studentForm, nationalId: e.target.value })}
                  placeholder="أدخل 10 أرقام للهوية..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-bold block">الفصـل والشعبة</label>
                <select 
                  required
                  value={studentForm.classId}
                  onChange={e => setStudentForm({ ...studentForm, classId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none"
                >
                  <option value="">-- اختر الفصل من القائمة --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-bold block">ولي الأمر المرتبط</label>
                <select 
                  required
                  value={studentForm.parentId}
                  onChange={e => setStudentForm({ ...studentForm, parentId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none"
                >
                  <option value="">-- ربط الحساب بولي أمر مسجل --</option>
                  {parents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-bold block">رابط الصورة الشخصية (اختياري)</label>
                <input 
                  type="text" 
                  value={studentForm.photo}
                  onChange={e => setStudentForm({ ...studentForm, photo: e.target.value })}
                  placeholder="أدخل رابط صورة الطالب إن وجد..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="submit" 
                className="flex-1 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer"
              >
                تأكيد وحفظ
              </button>
              <button 
                type="button" 
                onClick={() => setShowStudentModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
              >
                إلغاء الأمر
              </button>
            </div>
          </form>
        </div>
      )}

      {showTeacherModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleTeacherSubmit} className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-950 text-base border-b border-slate-100 pb-3">إسناد معلم جديد للكادر</h3>
            
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-600 font-bold block">اسم المعلم رباعي</label>
                <input 
                  type="text" 
                  required
                  value={teacherForm.name}
                  onChange={e => setTeacherForm({ ...teacherForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-bold block">رقم الموبايل / الجوال الشخصي</label>
                <input 
                  type="text" 
                  required
                  value={teacherForm.phone}
                  onChange={e => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                  placeholder="مثال: 01xxxxxxxxx"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-brand-blue text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer">إسناد المعلم</button>
              <button type="button" onClick={() => setShowTeacherModal(false)} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-xs cursor-pointer">تراجع</button>
            </div>
          </form>
        </div>
      )}

      {showClassModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleClassSubmit} className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-950 text-base border-b border-slate-100 pb-3">إنشاء شعبة دراسية جديدة</h3>
            
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-600 font-bold block">اسم الفصل والشعبة</label>
                <input 
                  type="text" 
                  required
                  value={classForm.name}
                  onChange={e => setClassForm({ ...classForm, name: e.target.value })}
                  placeholder="مثال: الصف الخامس - شعبة أ"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-bold block">المرحلة الدراسية</label>
                <input 
                  type="text" 
                  required
                  value={classForm.grade}
                  onChange={e => setClassForm({ ...classForm, grade: e.target.value })}
                  placeholder="مثال: المرحلة الابتدائية"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-bold block">رائد الفصل (المعلم المشرف)</label>
                <select 
                  required
                  value={classForm.teacherId}
                  onChange={e => setClassForm({ ...classForm, teacherId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none"
                >
                  <option value="">-- اختر رائد الفصل --</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-bold block">المواد المسندة (مفصولة بفواصل)</label>
                <input 
                  type="text" 
                  required
                  value={classForm.subjectsInput}
                  onChange={e => setClassForm({ ...classForm, subjectsInput: e.target.value })}
                  placeholder="مثال: رياضيات، فيزياء، لغة عربية"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-brand-blue text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer">حفظ الفصل</button>
              <button type="button" onClick={() => setShowClassModal(false)} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-xs cursor-pointer">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {feeForm && (
        <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleFeeSubmit} className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-950 text-base border-b border-slate-100 pb-3">تعديل القسط المالي والحسابات</h3>
            
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-600 font-bold block">المطالبة الكلية (ج.م)</label>
                <input 
                  type="number" 
                  required
                  value={feeForm.totalDue}
                  onChange={e => setFeeForm({ ...feeForm, totalDue: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-bold block">المسدد المدفوع (ج.م)</label>
                <input 
                  type="number" 
                  required
                  value={feeForm.paid}
                  onChange={e => setFeeForm({ ...feeForm, paid: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-brand-blue text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer">تعديل القسط والتحصيلات</button>
              <button type="button" onClick={() => setFeeForm(null)} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-xs cursor-pointer">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {/* Student Details Standalone Screen (Page View) */}
      {selectedStudentDetailsId && (() => {
        const student = students.find(s => s.id === selectedStudentDetailsId);
        if (!student) return null;
        const parent = users.find(u => u.id === student.parentId);
        const sClass = classes.find(c => c.id === student.classId);
        const sTeacher = sClass ? users.find(u => u.id === sClass.teacherId) : null;
        const sFee = fees.find(f => f.studentId === student.id) || { totalDue: 5000, paid: 0, due: 5000, payments: [] };
        const studentGrades = grades ? grades.map(exam => {
          const r = exam.records.find(rec => rec.studentId === student.id);
          return r ? { examTitle: exam.title, subject: exam.subject, score: r.score, maxScore: r.maxScore, date: exam.date } : null;
        }).filter(Boolean) : [];

        return (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 text-right space-y-6 animate-fadeIn">
            {/* Header / Cover Banner */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-l from-brand-blue to-cyan-800 p-6 sm:p-8 text-white min-h-[160px] flex flex-col justify-end">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-16 -translate-x-16"></div>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 z-10">
                <div className="flex items-center gap-4">
                  <img 
                    src={student.photo} 
                    alt={student.name}
                    className="w-20 h-20 rounded-2xl object-cover border-4 border-white/20 shadow-lg bg-slate-100"
                  />
                  <div>
                    <h3 className="font-extrabold text-white text-lg sm:text-xl">{student.name}</h3>
                    <p className="text-xs text-slate-200 mt-1 flex items-center gap-1.5 justify-end sm:justify-start">
                      <GraduationCap className="w-4 h-4 text-brand-gold animate-bounce" />
                      <span>الصف: {sClass ? sClass.name : 'لم يحدد الصف'} • المرحلة: {sClass ? sClass.grade : 'غير متوفر'}</span>
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setSelectedStudentDetailsId(null)}
                  className="bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 justify-center shadow-xs"
                >
                  <ChevronLeft className="w-4 h-4 scale-x-[-1]" />
                  <span>العودة لقائمة الطلاب</span>
                </button>
              </div>
            </div>

            {/* Grid Content Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
              {/* Right Column (span 2): Financial Ledger & Academic state */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Financial Ledger card */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-500" />
                      <span>كشف حساب المصروفات والمطالبات المالية للعام الحالي</span>
                    </h4>
                    <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded">
                      الفصل الأول
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans text-right">
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs">
                      <span className="text-slate-400 text-[10px] block mb-1">إجمالي الرسوم المستحقة</span>
                      <strong className="text-slate-800 text-base">{sFee.totalDue.toLocaleString('ar-EG')} ج.م</strong>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs">
                      <span className="text-emerald-500 text-[10px] block mb-1 font-bold">المسدد المدفوع</span>
                      <strong className="text-emerald-600 text-base">{sFee.paid.toLocaleString('ar-EG')} ج.م</strong>
                    </div>
                    <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-100 shadow-2xs">
                      <span className="text-rose-500 text-[10px] block mb-1 font-bold">المتبقي المطلوب سداده</span>
                      <strong className="text-rose-600 text-base">{sFee.due.toLocaleString('ar-EG')} ج.م</strong>
                    </div>
                  </div>

                  {/* Progress ratio */}
                  <div className="space-y-1.5 bg-white p-4 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>نسبة التحصيل والسداد الفعلي للرسوم الدراسية</span>
                      <span className="font-bold text-emerald-600">{Math.min(100, Math.round((sFee.paid / (sFee.totalDue || 1)) * 100))}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${Math.min(100, Math.round((sFee.paid / (sFee.totalDue || 1)) * 100))}%` }} 
                      />
                    </div>
                  </div>

                  {/* Quick update action link */}
                  <div className="flex justify-end gap-2 pt-1">
                    <button 
                      onClick={() => setFeeForm({ studentId: student.id, totalDue: sFee.totalDue, paid: sFee.paid })}
                      className="bg-brand-gold hover:bg-amber-500 hover:scale-105 active:scale-95 text-brand-blue-dark font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-all shadow-3xs"
                    >
                      تعديل أو تسجيل دفعة للرسوم
                    </button>
                  </div>
                </div>

                {/* Academic results table card */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-200/60 pb-3">
                    <Award className="w-4 h-4 text-brand-gold" />
                    <span>كشف نتائج التقييمات والاختبارات الدورية الرَّسمية</span>
                  </h4>

                  {studentGrades.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 space-y-2">
                      <Award className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="text-[11px] font-bold">لم يتم رصد تيجان أو درجات دراسية بملف الطالب حتى الآن.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {studentGrades.map((g: any, idx) => {
                        const percent = Math.round((g.score / g.maxScore) * 100);
                        let gradeColor = "text-emerald-600 bg-emerald-50/70 border-emerald-100";
                        if (percent < 50) gradeColor = "text-rose-600 bg-rose-50/70 border-rose-100";
                        else if (percent < 75) gradeColor = "text-amber-600 bg-amber-50/70 border-amber-100";

                        return (
                          <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-150 flex items-center justify-between gap-3 text-right shadow-2xs">
                            <div className="min-w-0 flex-1">
                              <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[8px] mb-1 inline-block">
                                {g.subject}
                              </span>
                              <h5 className="font-extrabold text-slate-800 text-xs truncate">{g.examTitle}</h5>
                              <span className="text-[9px] text-slate-400 block mt-0.5">{g.date}</span>
                            </div>
                            <div className={`text-center p-2 rounded-xl border min-w-[65px] ${gradeColor}`}>
                              <span className="font-mono text-xs font-black block">{g.score} / {g.maxScore}</span>
                              <span className="text-[10px] font-bold block">{percent}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* Left Column (span 1): Identity card, Classes, Guardian details */}
              <div className="space-y-6">
                
                {/* Panel 1: Personal & ID */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-200/60 pb-2.5">
                    <Users className="w-4 h-4 text-brand-blue" />
                    <span>المعلومات الهوياتية والتعريفية</span>
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <span className="text-slate-400 block text-[10px]">رقم الهوية الوطنية للطالب:</span>
                      <strong className="font-mono text-slate-800 text-xs block mt-0.5">{student.nationalId}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">حالة القيد في البوابة الأكاديمية:</span>
                      <span className="px-2.5 py-0.5 font-bold text-[9px] bg-emerald-100 text-emerald-800 rounded-md inline-block mt-1">
                        نشط ومقيد بالشعب الدراسية
                      </span>
                    </div>
                    {sTeacher && (
                      <div>
                        <span className="text-slate-400 block text-[10px]">رائد الصف / المعلم المشرف المباشر:</span>
                        <strong className="text-slate-800 text-xs block mt-0.5">{sTeacher.name}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Panel 2: Guardian Contacts */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-200/60 pb-2.5">
                    <Users className="w-4 h-4 text-cyan-600" />
                    <span>ملف ولي الأمر المقترن</span>
                  </h4>

                  {parent ? (
                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-400 block text-[10px]">اسم ولي الأمر:</span>
                        <strong className="text-slate-800 text-xs block mt-0.5">{parent.name}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">جوال التواصل المباشر:</span>
                        <strong className="font-mono text-slate-800 text-xs block mt-0.5">{parent.phone}</strong>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-[11px] leading-relaxed">لم يتم ربط الطالب بحساب ولي أمر نشط بعد. يرجى تعديل الطالب من القائمة وربطه بملف ولي الأمر.</p>
                  )}
                </div>

              </div>
            </div>

            {/* Bottom Dismiss options */}
            <div className="flex gap-2 justify-end border-t border-slate-100 pt-5">
              <button 
                onClick={() => setSelectedStudentDetailsId(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-colors"
              >
                رجوع لقائمة السجلات
              </button>
            </div>
          </div>
        );
      })()}

      {/* Teacher Details Standalone Screen (Page View) */}
      {selectedTeacherDetailsId && (() => {
        const teacher = users.find(u => u.id === selectedTeacherDetailsId);
        if (!teacher) return null;
        const teacherClasses = classes.filter(c => c.teacherId === teacher.id);

        return (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 text-right space-y-6 animate-fadeIn">
            {/* Header banner */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-l from-brand-blue to-emerald-900 p-6 sm:p-8 text-white min-h-[160px] flex flex-col justify-end">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-16 -translate-x-16"></div>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center text-brand-gold shadow-md">
                    <Users className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-lg sm:text-xl">{teacher.name}</h3>
                    <p className="text-xs text-slate-200 mt-1">عضو الهيئة التدريسية المعتمد والمفعل بالمنشأة</p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedTeacherDetailsId(null)}
                  className="bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 justify-center shadow-xs"
                >
                  <ChevronLeft className="w-4 h-4 scale-x-[-1]" />
                  <span>العودة لقائمة المعلمين</span>
                </button>
              </div>
            </div>

            {/* Content list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Box 1: settings and contacts */}
              <div className="p-5 bg-slate-50 border border-slate-150 rounded-2xl space-y-4 shadow-3xs">
                <h4 className="font-bold text-slate-800 text-xs border-b border-slate-200/60 pb-2 flex items-center gap-1.5 justify-start">
                  <Settings className="w-4 h-4 text-brand-blue" />
                  <span>الملف التعريفي للاتصال والبيانات</span>
                </h4>

                <div className="space-y-2.5 text-slate-750 text-right text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200/40">
                    <span className="text-slate-400">رقم جوال الاتصال بالبوابة:</span>
                    <strong className="font-mono font-bold text-slate-800">{teacher.phone}</strong>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-slate-400">صلاحيات المنظومة المعطاة:</span>
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">بوابة المعلمات مفعلة</span>
                  </div>
                </div>
              </div>

              {/* Box 2: classes assigned */}
              <div className="p-5 bg-slate-50 border border-slate-150 rounded-2xl space-y-4 shadow-3xs">
                <h4 className="font-bold text-slate-800 text-xs border-b border-slate-200/60 pb-2 flex items-center gap-1.5 justify-start">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  <span>الفصول والمواد المسندة من الإدارة</span>
                </h4>

                {teacherClasses.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    لم يقم المدير بإسناد أي شعب أو فصول تدريسية لهذا المعلم حتى الآن.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-48 overflow-y-auto">
                    {teacherClasses.map(cls => (
                      <div key={cls.id} className="bg-white p-3 border border-slate-150 rounded-xl flex justify-between items-center text-right shadow-2xs">
                        <div>
                          <strong className="text-slate-800 text-xs block">{cls.name}</strong>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{cls.grade}</span>
                        </div>
                        <span className="bg-indigo-50 text-indigo-600 text-[10px] px-3 py-1 rounded-full font-bold">
                          {cls.studentsCount} طالباً
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom button */}
            <div className="flex justify-end border-t border-slate-100 pt-5">
              <button 
                onClick={() => setSelectedTeacherDetailsId(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-colors"
              >
                إغلاق ملف المعلم والعودة
              </button>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
