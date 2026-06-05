import React, { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  addDoc
} from 'firebase/firestore';
import { db, auth } from './lib/firebase';
import { 
  bootstrapFirestore, 
  DEMO_SCHOOL_ID,
  DEFAULT_SCHOOL_DATA, 
  DEFAULT_USERS, 
  DEFAULT_STUDENTS, 
  DEFAULT_CLASSES, 
  DEFAULT_ATTENDANCE, 
  DEFAULT_GRADES, 
  DEFAULT_FEES, 
  DEFAULT_COMPLAINTS, 
  DEFAULT_NOTIFICATIONS, 
  DEFAULT_MESSAGES,
  handleFirestoreError,
  OperationType
} from './lib/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { 
  School, 
  UserProfile, 
  Student, 
  ClassInfo, 
  FeeLedger, 
  Complaint, 
  Conversation, 
  SchoolNotification, 
  GradeExam 
} from './types';
import Navbar from './components/Navbar';
import NotificationCenter from './components/NotificationCenter';
import AdminPortal from './components/AdminPortal';
import TeacherPortal from './components/TeacherPortal';
import ParentPortal from './components/ParentPortal';
import AuthPage from './components/AuthPage';
import { 
  School as SchoolIcon, Key, Loader2, Sparkles, Building2, CheckCircle2 
} from 'lucide-react';

export default function App() {
  // Authentication & Role
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSyncActive, setIsSyncActive] = useState(false);
  const [currentRole, setCurrentRole] = useState<'admin' | 'teacher' | 'parent'>('admin');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // States mirroring Firestore
  const [school, setSchool] = useState<School>(DEFAULT_SCHOOL_DATA);
  const [users, setUsers] = useState<UserProfile[]>(DEFAULT_USERS);
  const [students, setStudents] = useState<Student[]>(DEFAULT_STUDENTS);
  const [classes, setClasses] = useState<ClassInfo[]>(DEFAULT_CLASSES);
  const [fees, setFees] = useState<FeeLedger[]>(DEFAULT_FEES);
  const [complaints, setComplaints] = useState<Complaint[]>(DEFAULT_COMPLAINTS);
  const [conversations, setConversations] = useState<Conversation[]>(DEFAULT_MESSAGES);
  const [grades, setGrades] = useState<GradeExam[]>(DEFAULT_GRADES);
  const [notifications, setNotifications] = useState<SchoolNotification[]>(DEFAULT_NOTIFICATIONS);

  // --- Firebase Authentication Listener ---
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (!user) {
        setIsSyncActive(false);
        setSchool(DEFAULT_SCHOOL_DATA);
        setUsers(DEFAULT_USERS);
        setStudents(DEFAULT_STUDENTS);
        setClasses(DEFAULT_CLASSES);
        setFees(DEFAULT_FEES);
        setComplaints(DEFAULT_COMPLAINTS);
        setConversations(DEFAULT_MESSAGES);
        setGrades(DEFAULT_GRADES);
        setNotifications(DEFAULT_NOTIFICATIONS);
        setLoading(false);
      } else {
        try {
          const { getDoc, doc } = await import('firebase/firestore');
          const userDoc = await getDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/users`, user.uid));
          if (user.email === '01029082772@school.master') {
            setCurrentRole('admin');
          } else if (userDoc.exists()) {
            const profile = userDoc.data();
            if (profile && profile.role) {
              setCurrentRole(profile.role);
            }
          } else {
            const email = user.email || '';
            if (email === '01029082772@school.master') {
              setCurrentRole('admin');
            } else if (email === '01111111111@school.master' || email === '01222222222@school.master') {
              setCurrentRole('teacher');
            } else {
              setCurrentRole('parent');
            }
          }
        } catch (err) {
          console.error("Failed to query authenticated profile:", err);
        } finally {
          setLoading(false);
        }
      }
    });
    return () => unsubAuth();
  }, []);

  // --- Real-time Sync listeners based on Authentication State ---
  useEffect(() => {
    if (!currentUser) {
      setIsSyncActive(false);
      return;
    }

    setIsSyncActive(true);

    // 1. Listen to School Root
    const unsubSchool = onSnapshot(doc(db, "schools", DEMO_SCHOOL_ID), (snapshot) => {
      if (snapshot.exists()) {
        setSchool({ id: snapshot.id, ...snapshot.data() } as School);
      }
    }, (error) => {
      console.log("School listener error, using local:", error);
      handleFirestoreError(error, OperationType.GET, `schools/${DEMO_SCHOOL_ID}`);
    });

    // 2. Listen to Users
    const unsubUsers = onSnapshot(collection(db, `schools/${DEMO_SCHOOL_ID}/users`), (snapshot) => {
      const items: UserProfile[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as UserProfile);
      });
      setUsers(items);
    }, (error) => {
      console.log("Users listener error, using local:", error);
      handleFirestoreError(error, OperationType.GET, `schools/${DEMO_SCHOOL_ID}/users`);
    });

    // 3. Listen to Students
    const unsubStudents = onSnapshot(collection(db, `schools/${DEMO_SCHOOL_ID}/students`), (snapshot) => {
      const items: Student[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as Student);
      });
      setStudents(items);
    }, (error) => {
      console.log("Students listener error, using local:", error);
      handleFirestoreError(error, OperationType.GET, `schools/${DEMO_SCHOOL_ID}/students`);
    });

    // 4. Listen to Classes
    const unsubClasses = onSnapshot(collection(db, `schools/${DEMO_SCHOOL_ID}/classes`), (snapshot) => {
      const items: ClassInfo[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as ClassInfo);
      });
      setClasses(items);
    }, (error) => {
      console.log("Classes listener error, using local:", error);
      handleFirestoreError(error, OperationType.GET, `schools/${DEMO_SCHOOL_ID}/classes`);
    });

    // 5. Listen to Fees
    const unsubFees = onSnapshot(collection(db, `schools/${DEMO_SCHOOL_ID}/fees`), (snapshot) => {
      const items: FeeLedger[] = [];
      snapshot.forEach(doc => {
        items.push({ studentId: doc.id, ...doc.data() } as FeeLedger);
      });
      setFees(items);
    }, (error) => {
      console.log("Fees listener error, using local:", error);
      handleFirestoreError(error, OperationType.GET, `schools/${DEMO_SCHOOL_ID}/fees`);
    });

    // 6. Listen to Complaints
    const unsubComplaints = onSnapshot(collection(db, `schools/${DEMO_SCHOOL_ID}/complaints`), (snapshot) => {
      const items: Complaint[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as Complaint);
      });
      setComplaints(items);
    }, (error) => {
      console.log("Complaints listener error, using local:", error);
      handleFirestoreError(error, OperationType.GET, `schools/${DEMO_SCHOOL_ID}/complaints`);
    });

    // 7. Listen to Conversations
    const unsubConversations = onSnapshot(collection(db, `schools/${DEMO_SCHOOL_ID}/messages`), (snapshot) => {
      const items: Conversation[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as Conversation);
      });
      setConversations(items);
    }, (error) => {
      console.log("Conversations listener error, using local:", error);
      handleFirestoreError(error, OperationType.GET, `schools/${DEMO_SCHOOL_ID}/messages`);
    });

    // 8. Listen to Grades
    const unsubGrades = onSnapshot(collection(db, `schools/${DEMO_SCHOOL_ID}/grades`), (snapshot) => {
      const items: GradeExam[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as GradeExam);
      });
      setGrades(items);
    }, (error) => {
      console.log("Grades listener error, using local:", error);
      handleFirestoreError(error, OperationType.GET, `schools/${DEMO_SCHOOL_ID}/grades`);
    });

    // 9. Listen to Notifications
    const unsubNotifications = onSnapshot(collection(db, `schools/${DEMO_SCHOOL_ID}/notifications`), (snapshot) => {
      const items: SchoolNotification[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as SchoolNotification);
      });
      // sort by newest
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(items);
    }, (error) => {
      console.log("Notifications listener error, using local:", error);
      handleFirestoreError(error, OperationType.GET, `schools/${DEMO_SCHOOL_ID}/notifications`);
    });

    return () => {
      unsubSchool();
      unsubUsers();
      unsubStudents();
      unsubClasses();
      unsubFees();
      unsubComplaints();
      unsubConversations();
      unsubGrades();
      unsubNotifications();
    };
  }, [currentUser]);

  // --- Auth Handlers ---
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Sign in failed:", e);
      alert("فشل تسجيل الدخول. يرجى التأكد من تشغيل النوافذ المنبثقة.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Sign out failed:", e);
    }
    setCurrentUser(null);
  };

  // --- Seed Trigger Function ---
  const handleSeedDemo = async () => {
    if (!currentUser) {
      alert("يرجى تسجيل الدخول السحابي أولاً لتتمكن من تهيئة قاعدة بيانات Firestore الخاصة بك!");
      return;
    }
    setSeeding(true);
    try {
      await bootstrapFirestore();
      alert("تمت تهيئة وربط قاعدة بيانات Firestore بنجاح بالهيكل المدرسي الكامل وتثبيت السجلات الأساسية!");
    } catch (e) {
      console.error(e);
      alert("لا يمكن استكمال تهيئة المستندات مباشرة، يرجى مراجعة الصلاحيات السحابية.");
    } finally {
      setSeeding(false);
    }
  };

  // --- Callback Actions with Offline Fallbacks ---
  const triggerNotification = async (
    type: "absence" | "grade" | "fee" | "complaint" | "general", 
    title: string, 
    body: string
  ) => {
    const newNotif: SchoolNotification = {
      id: "notif-" + Date.now(),
      type,
      title,
      body,
      targetRole: 'parent',
      read: false,
      createdAt: new Date().toISOString()
    };

    // Keep state responsive instantly
    setNotifications(prev => [newNotif, ...prev]);

    // إرسال تنبيه حقيقي فوري لنظام تشغيل الموبايل أو المتصفح في حال توفر الصلاحية
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: 'https://cdn-icons-png.flaticon.com/512/2201/2201570.png',
          dir: 'rtl'
        });
      } catch (err) {
        console.warn("إخفاق عرض الإشعار اللحظي:", err);
      }
    }

    try {
      await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/notifications`, newNotif.id), newNotif);
    } catch (err) {
      console.log("Firestore silent skip:", err);
    }
  };

  // 1. ADD STUDENT
  const handleAddStudent = async (studentData: Omit<Student, 'id'>) => {
    const studentId = "student-" + Date.now();
    const newStudent: Student = { id: studentId, ...studentData };
    
    setStudents(prev => [...prev, newStudent]);
    
    // Auto setup default fee ledger
    const newFee: FeeLedger = {
      studentId,
      totalDue: 5000,
      paid: 0,
      due: 5000,
      payments: []
    };
    setFees(prev => [...prev, newFee]);

    try {
      await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/students`, studentId), newStudent);
      await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/fees`, studentId), newFee);
    } catch (err) {
      console.log("Firestore sync skip:", err);
    }
  };

  // 2. EDIT STUDENT
  const handleEditStudent = async (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    try {
      await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/students`, updatedStudent.id), updatedStudent);
    } catch (err) {
      console.log("Firestore sync skip:", err);
    }
  };

  // 3. DELETE STUDENT
  const handleDeleteStudent = async (studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
    try {
      await deleteDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/students`, studentId));
      await deleteDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/fees`, studentId));
    } catch (err) {
      console.log("Firestore sync skip:", err);
    }
  };

  // 4. ADD TEACHER
  const handleAddTeacher = async (teacherData: Omit<UserProfile, 'id' | 'status' | 'createdAt'>) => {
    const teacherId = "teacher-" + (users.length + 1);
    const newTeacher: UserProfile = {
      id: teacherId,
      ...teacherData,
      status: 'approved',
      createdAt: new Date().toISOString()
    };

    setUsers(prev => [...prev, newTeacher]);

    try {
      await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/users`, teacherId), newTeacher);
    } catch (err) {
      console.log("Firestore sync skip:", err);
    }
  };

  // 4.5 ADD PARENT BY ADMIN
  const handleAddParent = async (parentData: { name: string; phone: string; email: string }) => {
    const parentId = "parent-" + (users.length + 1);
    const newParent: UserProfile = {
      id: parentId,
      name: parentData.name,
      role: 'parent',
      phone: parentData.phone,
      email: parentData.email || `${parentData.phone.trim()}@school.master`,
      status: 'approved',
      createdAt: new Date().toISOString()
    };

    setUsers(prev => [...prev, newParent]);

    try {
      await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/users`, parentId), newParent);
    } catch (err) {
      console.log("Firestore sync skip:", err);
    }
  };

  // 4.6 DELETE USER (ADMIN ONLY)
  const handleDeleteUser = async (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    try {
      await deleteDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/users`, userId));
    } catch (err) {
      console.log("Firestore sync skip:", err);
    }
  };

  // 5. APPROVE USER REGISTER
  const handleApproveUser = async (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'approved' as const } : u));
    try {
      await updateDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/users`, userId), { status: 'approved' });
    } catch (err) {
      console.log("Firestore sync skip:", err);
    }
  };

  // 5.5 UPDATE USER ROLE
  const handleUpdateUserRole = async (userId: string, newRole: 'admin' | 'teacher' | 'parent') => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    try {
      await updateDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/users`, userId), { role: newRole });
      await triggerNotification('general', 'تعديل الصلاحيات', 'تم تبديل صلاحيات حساب مستخدم بنجاح.');
    } catch (err) {
      console.log("Firestore sync skip:", err);
    }
  };

  // 6. ADD CLASS
  const handleAddClass = async (classData: Omit<ClassInfo, 'id' | 'studentsCount'>) => {
    const classId = "class-" + (classes.length + 1);
    const newClass: ClassInfo = {
      id: classId,
      ...classData,
      studentsCount: 0
    };

    setClasses(prev => [...prev, newClass]);

    try {
      await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/classes`, classId), newClass);
    } catch (err) {
      console.log("Firestore sync skip:", err);
    }
  };

  // 7. UPDATE FEES
  const handleUpdateFees = async (updatedLedger: FeeLedger) => {
    setFees(prev => prev.map(f => f.studentId === updatedLedger.studentId ? updatedLedger : f));
    try {
      await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/fees`, updatedLedger.studentId), updatedLedger);
    } catch (err) {
      console.log("Firestore sync skip:", err);
    }
  };

  // 8. RENEW SCHOOL SUBSCRIPTION
  const handleRenewSubscription = async (receiptUrl: string) => {
    const updatedSettings = {
      ...school.settings,
      licenseNumber: "VERIFIED-" + Math.floor(Math.random() * 900000 + 100000)
    };
    const updatedSchool = {
      ...school,
      subscriptionStatus: 'active' as const,
      settings: updatedSettings
    };

    setSchool(updatedSchool);

    try {
      await setDoc(doc(db, "schools", DEMO_SCHOOL_ID), updatedSchool);
    } catch (err) {
      console.log("Firestore sync skip:", err);
    }
  };

  // 9. DAILY ATTENDANCE SAVE LOG
  const handleSaveAttendance = async (
    date: string, 
    classId: string, 
    records: { studentId: string; status: "present" | "absent" | "late"; note?: string }[]
  ) => {
    try {
      await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/attendance/${date}_${classId}`), { records });
    } catch (err) {
      console.log("Firestore attendance sync skip:", err);
    }
  };

  // 10. ADD GRADES LOGS
  const handleAddGrade = async (examData: Omit<GradeExam, 'id'>) => {
    const examId = "exam-" + Date.now();
    const newExam: GradeExam = { id: examId, ...examData };

    setGrades(prev => [...prev, newExam]);

    try {
      await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/grades`, examId), newExam);
    } catch (err) {
      console.log("Firestore sync skip:", err);
    }
  };

  // 11. PARENT FILED COMPLAINT
  const handleAddComplaint = async (
    category: Complaint['category'], 
    description: string, 
    priority: Complaint['priority']
  ) => {
    const parentId = currentUser ? currentUser.uid : 'parent-1';
    const parentProfile = users.find(u => u.id === parentId);
    const parentName = parentProfile ? parentProfile.name : (currentUser?.displayName || 'أبو أحمد');
    const complaintId = "complaint-" + Date.now();
    const newComplaint: Complaint = {
      id: complaintId,
      parentId,
      parentName,
      category,
      description,
      status: 'new',
      priority,
      createdAt: new Date().toISOString(),
      replies: [
        { senderId: parentId, senderName: parentName, senderRole: 'parent', text: description, time: "صوت" }
      ]
    };

    setComplaints(prev => [newComplaint, ...prev]);

    try {
      await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/complaints`, complaintId), newComplaint);
      await triggerNotification('complaint', 'تسجيل شكوى جديدة', `قام ولي الأمر برفع شكوى تحت تصنيف ${category}.`);
    } catch (err) {
      console.log("Firestore sync skip:", err);
    }
  };

  // 12. FILED COMPLAINT COMMENT REPLY
  const handleAddComplaintReply = async (complaintId: string, replyText: string, senderRole: 'admin' | 'parent' = 'parent') => {
    const curComplaint = complaints.find(c => c.id === complaintId);
    if (!curComplaint) return;

    const senderId = currentUser ? currentUser.uid : (senderRole === 'admin' ? 'admin-1' : 'parent-1');
    const senderProfile = users.find(u => u.id === senderId);
    const senderName = senderProfile ? senderProfile.name : (currentUser?.displayName || (senderRole === 'admin' ? 'إدارة المدرسة' : 'ولي الأمر'));

    const newReply = {
      senderId,
      senderName,
      senderRole,
      text: replyText,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedComplaint: Complaint = {
      ...curComplaint,
      replies: [...curComplaint.replies, newReply],
      status: senderRole === 'admin' ? 'in_progress' : 'new'
    };

    setComplaints(prev => prev.map(c => c.id === complaintId ? updatedComplaint : c));

    try {
      await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/complaints`, complaintId), updatedComplaint);
    } catch (err) {
      console.log("Firestore sync skip:", err);
    }
  };

  // 12b. UPDATE COMPLAINT STATUS
  const handleUpdateComplaintStatus = async (complaintId: string, status: 'new' | 'in_progress' | 'solved') => {
    const curComplaint = complaints.find(c => c.id === complaintId);
    if (!curComplaint) return;

    const updatedComplaint: Complaint = {
      ...curComplaint,
      status
    };

    setComplaints(prev => prev.map(c => c.id === complaintId ? updatedComplaint : c));

    try {
      await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/complaints`, complaintId), updatedComplaint);
    } catch (err) {
      console.log("Firestore status update skip:", err);
    }
  };

  // 13. SEND DIRECT CHAT MESSAGE
  const handleSendMessage = async (conversationId: string, text: string, senderRole: 'admin' | 'parent' = 'parent') => {
    const curConv = conversations.find(c => c.id === conversationId);
    if (!curConv) return;

    const senderId = currentUser ? currentUser.uid : (senderRole === 'admin' ? 'admin-1' : 'parent-1');
    const senderProfile = users.find(u => u.id === senderId);
    const senderName = senderProfile ? senderProfile.name : (currentUser?.displayName || (senderRole === 'admin' ? 'إدارة المدرسة' : 'ولي الأمر'));

    const newMsg = {
      senderId,
      senderName,
      text,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedConv: Conversation = {
      ...curConv,
      messages: [...curConv.messages, newMsg],
      lastUpdate: new Date().toISOString()
    };

    setConversations(prev => prev.map(c => c.id === conversationId ? updatedConv : c));

    try {
      await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/messages`, conversationId), updatedConv);
    } catch (err) {
      console.log("Firestore sync skip:", err);
    }
  };

  // 14. INITIATE NEW CONVERSATION
  const handleCreateConversation = async (otherId: string, firstMsg: string, senderRole: 'admin' | 'parent' = 'parent') => {
    const senderId = currentUser ? currentUser.uid : (senderRole === 'admin' ? 'admin-1' : 'parent-1');
    const senderProfile = users.find(u => u.id === senderId);
    const senderName = senderProfile ? senderProfile.name : (currentUser?.displayName || (senderRole === 'admin' ? 'إدارة المدرسة' : 'ولي الأمر'));
    
    const convId = "chat-" + Date.now();
    const newConv: Conversation = {
      id: convId,
      participants: [senderId, otherId],
      messages: [
        {
          senderId,
          senderName,
          text: firstMsg,
          time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        }
      ],
      lastUpdate: new Date().toISOString()
    };

    setConversations(prev => [newConv, ...prev]);

    try {
      await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/messages`, convId), newConv);
    } catch (err) {
      console.log("Firestore sync skip:", err);
    }
  };

  // 15. PARENT UPLOAD RECEIPT
  const handleUploadFeeReceipt = async (studentId: string, amount: number, txId: string) => {
    const curFee = fees.find(f => f.studentId === studentId);
    if (!curFee) return;

    const newPayment = {
      amount,
      date: new Date().toISOString().split('T')[0],
      receiptUrl: txId,
      verified: false
    };

    const updatedLedger: FeeLedger = {
      ...curFee,
      paid: curFee.paid + amount,
      due: Math.max(0, curFee.due - amount),
      payments: [newPayment, ...curFee.payments]
    };

    await handleUpdateFees(updatedLedger);
    await triggerNotification('fee', 'سداد قسط دراسي', `تم تحويل قسط دراسي للطالب بمبلغ ${amount} ج.م.`);
  };

  // Filter unread notifications count
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await updateDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/notifications`, id), { read: true });
    } catch (e) {
      console.log("Firestore mark read sync skipped:", e);
    }
  };

  const handleClearNotifications = async () => {
    setNotifications([]);
    try {
      const snap = await getDocs(collection(db, `schools/${DEMO_SCHOOL_ID}/notifications`));
      snap.forEach(async (d) => {
        await deleteDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/notifications`, d.id));
      });
    } catch (e) {
      console.log("Firestore clear sync skipped:", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white scrollbar-hide select-none transition-all">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-gold/10 border border-brand-gold flex items-center justify-center text-brand-gold animate-bounce">
            <SchoolIcon className="w-8 h-8" />
          </div>
          <div className="absolute inset-0 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-xl font-bold font-sans">سكول ماستر • School Master</h2>
        <p className="text-xs text-slate-400 mt-2">جاري مزامنة ترخيص وتهيئة لوحات التحكم مع السحابة...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthPage 
        onAuthSuccess={(user, role) => {
          setCurrentUser(user);
          setCurrentRole(role);
        }}
        onGoogleSignIn={handleGoogleSignIn}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12">
      
      {/* Universal header */}
      <Navbar 
        currentRole={currentRole}
        onRoleChange={(role) => setCurrentRole(role)}
        onOpenNotifications={() => setIsNotifOpen(true)}
        schoolName={school.name}
        currentUser={currentUser}
        isSyncActive={isSyncActive}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Floating Notification Center Drawer */}
      <NotificationCenter 
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onClearAll={handleClearNotifications}
      />

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-4 mt-6">
        
        {currentRole === 'admin' && (
          <AdminPortal 
            school={school}
            users={users}
            students={students}
            classes={classes}
            fees={fees}
            grades={grades}
            complaints={complaints}
            conversations={conversations}
            onAddStudent={handleAddStudent}
            onEditStudent={handleEditStudent}
            onDeleteStudent={handleDeleteStudent}
            onAddTeacher={handleAddTeacher}
            onAddParent={handleAddParent}
            onDeleteUser={handleDeleteUser}
            onApproveUser={handleApproveUser}
            onUpdateUserRole={handleUpdateUserRole}
            onAddClass={handleAddClass}
            onUpdateFees={handleUpdateFees}
            onRenewSubscription={handleRenewSubscription}
            triggerNotification={triggerNotification}
            onAddComplaintReply={handleAddComplaintReply}
            onSendMessage={handleSendMessage}
            onCreateConversation={handleCreateConversation}
            onUpdateComplaintStatus={handleUpdateComplaintStatus}
            onSeedDemo={handleSeedDemo}
            isSeeding={seeding}
          />
        )}

        {currentRole === 'teacher' && (
          <TeacherPortal 
            teacherId="teacher-1"
            classes={classes}
            students={students}
            onSaveAttendance={handleSaveAttendance}
            onAddGrade={handleAddGrade}
            triggerNotification={triggerNotification}
          />
        )}

        {currentRole === 'parent' && (
          <ParentPortal 
            parentId={currentUser?.uid || "parent-1"}
            students={students}
            classes={classes}
            fees={fees}
            complaints={complaints}
            conversations={conversations}
            grades={grades}
            attendance={DEFAULT_ATTENDANCE}
            admins={users.filter(u => u.role === 'admin' || u.role === 'teacher')}
            users={users}
            onAddComplaint={handleAddComplaint}
            onAddComplaintReply={handleAddComplaintReply}
            onSendMessage={handleSendMessage}
            onCreateConversation={handleCreateConversation}
            onUploadFeeReceipt={handleUploadFeeReceipt}
          />
        )}

      </main>

    </div>
  );
}
