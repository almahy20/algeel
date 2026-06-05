import React, { useState } from 'react';
import { 
  BookOpen, Calendar, CheckSquare, Award, Clock, ArrowLeft, Search, Plus, 
  Trash, Save, Info, AlertCircle, Sparkles, CheckCircle2, ChevronLeft 
} from 'lucide-react';
import { ClassInfo, Student, UserProfile, AttendanceDay, GradeExam } from '../types';

interface TeacherPortalProps {
  teacherId: string;
  classes: ClassInfo[];
  students: Student[];
  onSaveAttendance: (date: string, classId: string, records: { studentId: string; status: "present" | "absent" | "late"; note?: string }[]) => Promise<void>;
  onAddGrade: (exam: Omit<GradeExam, 'id'>) => Promise<void>;
  triggerNotification: (type: "absence" | "grade" | "fee" | "complaint" | "general", title: string, body: string) => Promise<void>;
}

export default function TeacherPortal({
  teacherId,
  classes,
  students,
  onSaveAttendance,
  onAddGrade,
  triggerNotification
}: TeacherPortalProps) {
  const [activeTab, setActiveTab] = useState<'hub' | 'classes' | 'attendance' | 'grades'>('hub');
  
  // States of currently active operations
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  
  // Attendance screen state
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<{ [studentId: string]: { status: 'present' | 'absent' | 'late'; note: string } }>({});

  // Grade screen state
  const [gradeClassId, setGradeClassId] = useState<string>('');
  const [gradeSubject, setGradeSubject] = useState<string>('');
  const [examTitle, setExamTitle] = useState<string>('');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentGrades, setStudentGrades] = useState<{ [studentId: string]: number }>({});
  const [maxScore, setMaxScore] = useState<number>(100);

  // Filter classes assigned only to this teacher
  const assignedClasses = classes.filter(c => c.teacherId === teacherId);

  // Load students for active class
  const getStudentsForClass = (classId: string) => students.filter(s => s.classId === classId);

  // Handle setting active attendance list
  const handleSelectAttendanceClass = (classId: string) => {
    setSelectedClassId(classId);
    const classStudents = getStudentsForClass(classId);
    const initialRecords: typeof attendanceRecords = {};
    classStudents.forEach(s => {
      initialRecords[s.id] = { status: 'present', note: '' };
    });
    setAttendanceRecords(initialRecords);
  };

  const handleAttendanceStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleAttendanceNoteChange = (studentId: string, note: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], note }
    }));
  };

  const handleSaveAttendanceSubmit = async () => {
    if (!selectedClassId) return;

    const recordsPayload = Object.keys(attendanceRecords).map(studentId => {
      const record = attendanceRecords[studentId] || { status: 'present', note: '' };
      return {
        studentId,
        status: record.status as "present" | "absent" | "late",
        note: record.note
      };
    });

    await onSaveAttendance(attendanceDate, selectedClassId, recordsPayload);

    // Trigger parenting warnings for absent students
    for (const record of recordsPayload) {
      if (record.status === 'absent') {
        const studentName = students.find(s => s.id === record.studentId)?.name || 'الطالب';
        await triggerNotification(
          'absence',
          'تنبيه غياب يومي',
          `نفيدكم بغياب الابن ${studentName} اليوم الموافق ${attendanceDate}. يرجى تقديم مبرر للغياب.`
        );
      }
    }

    alert('تم تسجيل ومزامنة كشف الحضور والغياب مع الإدارة بنجاح إلكترونياً.');
    setSelectedClassId(null);
  };

  const handleSaveGradesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeClassId || !gradeSubject || !examTitle) {
      alert('يرجى ملء جميع خانات الاختبار والمادة.');
      return;
    }

    const recordsPayload = Object.entries(studentGrades).map(([studentId, score]) => ({
      studentId,
      score: Number(score),
      maxScore: Number(maxScore)
    }));

    await onAddGrade({
      subject: gradeSubject,
      title: examTitle,
      date: examDate,
      records: recordsPayload
    });

    // Notify parents on new grade score releases
    for (const record of recordsPayload) {
      const studentName = students.find(s => s.id === record.studentId)?.name || 'الطالب';
      await triggerNotification(
         'grade',
         'رصد علامات أكاديمية جديدة',
         `تم رصد درجة جديدة للابن ${studentName} في مادة ${gradeSubject} بحصوله على ${record.score} من ${record.maxScore}.`
      );
    }

    alert('تم حفظ كشف رصد الدَّرجات والنتائج بنجاح ومزامنته مع الإدارة.');
    setGradeClassId('');
    setGradeSubject('');
    setExamTitle('');
    setStudentGrades({});
  };

  return (
    <div className="space-y-6">
      
      {/* Teacher banner */}
      <div className="bg-gradient-to-l from-brand-blue to-emerald-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-500/10 rounded-br-full transform -translate-x-6 -translate-y-6"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
          <div>
            <h2 className="text-xl md:text-2xl font-black mb-1">لوحة الكادر التعليمي - مدرسة الجيل الجديد</h2>
            <p className="text-slate-200 text-xs">سجل الحضور اليومي، قم برصد الدرجات، وأرسل تقارير الأبناء المباشرة والإنذارات لأولياء الأمور فورياً.</p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab !== 'hub' && (
              <button 
                onClick={() => { setActiveTab('hub'); setSelectedClassId(null); }}
                className="bg-brand-gold hover:bg-amber-600 text-brand-blue-dark text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 scale-x-[-1]" />
                <span>العودة للرئيسية</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* HUB VIEW - NAVIGATION TILES GRID */}
      {activeTab === 'hub' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-800 text-base">القائمة السريعة للعمليات</h3>
            <p className="text-slate-500 text-xs">اختر احد الأقسام التالية لمباشرة رصد الحضور أو الدرجات للطلاب بالفصول التابعة لك:</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Tile 1: Classes & Subjects */}
            <button
              onClick={() => { setActiveTab('classes'); setSelectedClassId(null); }}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-brand-blue hover:shadow-lg transition-all duration-300 text-right group cursor-pointer flex flex-col justify-between h-44 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-16 h-16 bg-blue-50/50 rounded-br-full -translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform" />
              <div className="flex justify-between items-start z-10 relative">
                <span className="p-3.5 rounded-2xl bg-blue-50 text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all">
                  <BookOpen className="w-6 h-6" />
                </span>
                <span className="bg-blue-100 text-brand-blue font-sans font-bold text-[11px] px-2.5 py-1 rounded-full">
                  {assignedClasses.length} فصول
                </span>
              </div>
              <div className="z-10 relative mt-4">
                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-brand-blue transition-colors">الفصول والشُعب التابعة لك</h4>
                <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">عرض الفصول التعليمية المشرف عليها، المواد المقررة، والطلاب المقيدين بها</p>
              </div>
            </button>

            {/* Tile 2: Attendance Registry */}
            <button
              onClick={() => { setActiveTab('attendance'); setSelectedClassId(null); }}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all duration-300 text-right group cursor-pointer flex flex-col justify-between h-44 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-16 h-16 bg-emerald-50/50 rounded-br-full -translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform" />
              <div className="flex justify-between items-start z-10 relative">
                <span className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <CheckSquare className="w-6 h-6" />
                </span>
                <span className="bg-emerald-100 text-emerald-800 font-sans font-bold text-[11px] px-2.5 py-1 rounded-full">
                  تحضير غياب يومي
                </span>
              </div>
              <div className="z-10 relative mt-4">
                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">رصد الغياب والحضور اليومي</h4>
                <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">تسجيل الحضور والمغادرة وإشعار أولياء الأمور بحالة الغياب المباشرة إلكترونياً</p>
              </div>
            </button>

            {/* Tile 3: Exam Grades */}
            <button
              onClick={() => { setActiveTab('grades'); setSelectedClassId(null); }}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 text-right group cursor-pointer flex flex-col justify-between h-44 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-16 h-16 bg-indigo-50/50 rounded-br-full -translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform" />
              <div className="flex justify-between items-start z-10 relative">
                <span className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Award className="w-6 h-6" />
                </span>
                <span className="bg-indigo-100 text-indigo-800 font-sans font-bold text-[11px] px-2.5 py-1 rounded-full">
                  رصد الدَّرجات
                </span>
              </div>
              <div className="z-10 relative mt-4">
                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">رصد الدرجات والاختبارات</h4>
                <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">رصد نتائج الامتحانات، تقارير العلامات ومشاركتها مع ملف ولي الأمر</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* CLASSES TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 text-base">الشُّعب والفصول المقترنة بك</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedClasses.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 col-span-2">
                <p className="text-slate-500 font-medium">لم يتم ربطك بأي فصول دراسية نشطة حالياً.</p>
              </div>
            ) : (
              assignedClasses.map(cls => (
                <div key={cls.id} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 text-base">{cls.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{cls.grade}</p>
                    </div>
                    <span className="bg-emerald-50 text-emerald-600 font-bold px-3 py-1 rounded-full text-[10px]">
                      {cls.studentsCount} طالباً مقيداً
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-500">المواد: {cls.subjects.join(' • ')}</span>
                    <button 
                      onClick={() => {
                        setActiveTab('attendance');
                        handleSelectAttendanceClass(cls.id);
                      }}
                      className="bg-brand-blue hover:bg-brand-blue-dark text-white px-3 py-1.5 rounded-lg font-bold cursor-pointer"
                    >
                      أخذ كشف الغياب اليومي
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* ATTENDANCE TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'attendance' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
          {!selectedClassId ? (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-base">برجاء تحديد الصف لأخذ الغياب اليومي</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {assignedClasses.map(cls => (
                  <button 
                    key={cls.id}
                    onClick={() => handleSelectAttendanceClass(cls.id)}
                    className="p-5 text-right bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 rounded-2xl cursor-pointer block w-full transition-all"
                  >
                    <h4 className="font-bold text-slate-800 text-sm">{cls.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">{cls.grade} • {cls.studentsCount} طالباً</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Heading and back button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h4 className="font-bold text-slate-800 text-base">تسجيل حضور الطلاب لـ: {classes.find(c => c.id === selectedClassId)?.name || 'غير محدد'}</h4>
                  <p className="text-xs text-slate-500 mt-1">حدد حالة كل طالب وصنف المتأخرين واكتب ملاحظات فورية.</p>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="date"
                    value={attendanceDate}
                    onChange={e => setAttendanceDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-sans outline-none"
                  />
                  <button 
                    onClick={() => setSelectedClassId(null)}
                    className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>تراجع</span>
                  </button>
                </div>
              </div>

              {/* Attendance Table */}
              <div className="space-y-3">
                {getStudentsForClass(selectedClassId).map(student => {
                  const record = attendanceRecords[student.id] || { status: 'present', note: '' };
                  return (
                    <div key={student.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      {/* Student info */}
                      <div className="flex items-center gap-3">
                        <img src={student.photo} alt={student.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">{student.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">الهوية الوطنية: {student.nationalId}</p>
                        </div>
                      </div>

                      {/* Controls present/absent/late */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button 
                          onClick={() => handleAttendanceStatusChange(student.id, 'present')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            record.status === 'present' 
                              ? 'bg-emerald-500 text-white shadow-3xs' 
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          حاضر
                        </button>
                        <button 
                          onClick={() => handleAttendanceStatusChange(student.id, 'absent')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            record.status === 'absent' 
                              ? 'bg-rose-500 text-white shadow-3xs' 
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          غائب
                        </button>
                        <button 
                          onClick={() => handleAttendanceStatusChange(student.id, 'late')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            record.status === 'late' 
                              ? 'bg-amber-500 text-white shadow-3xs' 
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          متأخر
                        </button>

                        <input 
                          type="text" 
                          placeholder="ملاحظات..." 
                          value={record.note}
                          onChange={e => handleAttendanceNoteChange(student.id, e.target.value)}
                          className="bg-white border border-slate-200 text-xs rounded-lg p-1.5 w-32 outline-none"
                        />
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Confirm submit */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button 
                  onClick={handleSaveAttendanceSubmit}
                  className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>تأكيد كشف الحضور والغياب وإشعار أولياء الأمور</span>
                </button>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* GRADES ENTRY TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'grades' && (
        <form onSubmit={handleSaveGradesSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
          <div>
            <h3 className="font-bold text-slate-800 text-base">رصد العلامات الأكاديمية والامتحانات</h3>
            <p className="text-xs text-slate-500 mt-1">اختر الفصل والمادة لتدخل درجات تقويم الشهر أو امتحانات نهاية الفصل.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-600 font-bold block">الفصـل والشعبة</label>
              <select 
                required
                value={gradeClassId}
                onChange={e => {
                  setGradeClassId(e.target.value);
                  // prefill student grades mapping
                  const initialGrades: typeof studentGrades = {};
                  getStudentsForClass(e.target.value).forEach(s => {
                    initialGrades[s.id] = 100;
                  });
                  setStudentGrades(initialGrades);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none"
              >
                <option value="">-- اختر صف للرصد --</option>
                {assignedClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-600 font-bold block">المادة العلمية</label>
              <select 
                required
                value={gradeSubject}
                onChange={e => setGradeSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none"
              >
                <option value="">-- اختر المادة --</option>
                {classes.find(c => c.id === gradeClassId)?.subjects.map(s => <option key={s} value={s}>{s}</option>) || (
                  <option value="">اختر الفصل أولاً</option>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-600 font-bold block">عنوان أو مسمى التقييم</label>
              <input 
                type="text" 
                required
                placeholder="مثال: الواجب الأسبوعي الأول"
                value={examTitle}
                onChange={e => setExamTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-600 font-bold block">الدرجة الكلية القصوى</label>
              <input 
                type="number" 
                required
                value={maxScore}
                onChange={e => setMaxScore(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none"
              />
            </div>
          </div>

          {/* Grades Inputs per student */}
          {gradeClassId && (
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">درجات كشف الحاضرين باللائحة:</h4>
              <div className="space-y-3">
                {getStudentsForClass(gradeClassId).map(student => (
                  <div key={student.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={student.photo} alt={student.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs" />
                      <span className="font-bold text-slate-800 text-xs">{student.name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <input 
                        type="number" 
                        required
                        max={maxScore}
                        min={0}
                        value={studentGrades[student.id] ?? 100}
                        onChange={e => setStudentGrades({ ...studentGrades, [student.id]: Number(e.target.value) })}
                        className="bg-white border border-slate-200 text-center rounded-lg p-1.5 w-20 font-sans font-bold"
                      />
                      <span className="text-slate-400 font-sans">/ {maxScore}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button 
                  type="submit"
                  className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>رصـد الدَّرجات ونشر تقارير أولياء الأمور المباشرة</span>
                </button>
              </div>
            </div>
          )}

        </form>
      )}

    </div>
  );
}
