import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { DEMO_SCHOOL_ID } from '../lib/firestore';
import { 
  School as SchoolIcon, Key, Mail, Phone, User, Shield, Loader2, Sparkles,
  CheckCircle2, AlertTriangle, Eye, EyeOff, Info, ArrowLeft, ArrowRight
} from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: (user: any, role: 'admin' | 'teacher' | 'parent') => void;
  onGoogleSignIn?: () => Promise<void>;
}

export default function AuthPage({ onAuthSuccess, onGoogleSignIn }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'admin' | 'teacher' | 'parent'>('parent');

  // Input states / UI aids
  const [showPassword, setShowPassword] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Form Valitators
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordLengthValid = password.length >= 6;
  const hasPasswordNumber = /\d/.test(password);
  const isPasswordValid = isPasswordLengthValid && hasPasswordNumber;
  
  // Name Validator: At least 3 names (e.g., عبد الله بن محمد العتيبي)
  const nameParts = fullName.trim().split(/\s+/);
  const isNameValid = nameParts.length >= 3 && nameParts.every(part => part.length >= 2);

  // Phone Validator: Egyptian standard 01xxxxxxxxx (11 digits)
  const isPhoneValid = /^01[0125]\d{8}$/.test(phone);

  const isLoginInputValid = /^01[0125]\d{8}$/.test(email.trim());

  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  // Real Phone Number & Password Login Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorText('يرجى كتابة رقم الجوال مع كلمة المرور أولاً.');
      return;
    }

    let loginEmail = email.trim();
    if (/^01[0125]\d{8}$/.test(loginEmail)) {
      loginEmail = `${loginEmail}@school.master`;
    } else {
      setErrorText('الرجاء كتابة رقم جوال مصري صالح يبدأ بـ 01 ويتكون من 11 رقم للتحقق.');
      return;
    }

    if (loginEmail === '01029082772@school.master') {
      if (password !== '01029082772') {
        setErrorText('كلمة المرور لمدير النظام غير صحيحة.');
        return;
      }
    }

    setLoading(true);
    setErrorText(null);

    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      const user = userCredential.user;

      // Extract user role from Firestore
      const userDocRef = doc(db, `schools/${DEMO_SCHOOL_ID}/users`, user.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const profile = docSnap.data();
        const finalRole = loginEmail === '01029082772@school.master' ? 'admin' : (profile.role || 'parent');
        onAuthSuccess(user, finalRole);
      } else {
        // Fallback profile creation if not found in db
        const fallbackRole = loginEmail === '01029082772@school.master' ? 'admin' : (loginEmail.includes('teacher') ? 'teacher' : 'parent');
        const fallbackProfile = {
          id: user.uid,
          name: loginEmail === '01029082772@school.master' ? 'أ.د. عبد الرحمن المنشاوي (مدير النظام)' : (user.displayName || 'مستعمل مجهول'),
          role: fallbackRole,
          phone: loginEmail.split('@')[0],
          email: user.email || '',
          status: 'approved' as const,
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, fallbackProfile);
        onAuthSuccess(user, fallbackRole);
      }
    } catch (err: any) {
      console.error(err);

      if (loginEmail === '01029082772@school.master' && password === '01029082772' && (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential')) {
        // Auto register admin if not already in auth
        try {
          userCredential = await createUserWithEmailAndPassword(auth, loginEmail, password);
          const user = userCredential.user;
          const userDocRef = doc(db, `schools/${DEMO_SCHOOL_ID}/users`, user.uid);
          const adminProfile = {
            id: user.uid,
            name: 'أ.د. عبد الرحمن المنشاوي (مدير النظام)',
            role: 'admin' as const,
            phone: '01029082772',
            email: '01029082772@school.master',
            status: 'approved' as const,
            createdAt: new Date().toISOString()
          };
          await setDoc(userDocRef, adminProfile);
          onAuthSuccess(user, 'admin');
          return;
        } catch (signUpErr: any) {
          console.error("Failed to auto-create admin:", signUpErr);
        }
      }

      if (err.code === 'auth/operation-not-allowed') {
        setErrorText('تنبيه أمني هام: لم يتم تفعيل خيار تسجيل الدخول عبر البريد الإلكتروني وكلمة المرور (Email/Password) في منصة Firebase. يرجى تفعيله من (Firebase Console -> Authentication -> Sign-in Method) لتتمكن من تسجيل الحسابات والولوج بنجاح.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorText('الحساب غير مسجل بالمنظومة أو كلمة المرور غير مطابقة للملف الأمني.');
      } else if (err.code === 'auth/invalid-email') {
        setErrorText('تنسيق البريد الإلكتروني المكتوب أو رقم الهاتف غير صالح.');
      } else {
        setErrorText('فشل أمن البوابة: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Real Registration Sign Up Handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched to trigger active error highlights
    setTouchedFields({
      fullName: true,
      phone: true,
      password: true
    });

    if (!fullName || !phone || !password) {
      setErrorText('يرجى تعبئة الاسم ورقم الجوال وكلمة المرور لتسجيل حساب جديد.');
      return;
    }

    if (!isNameValid) {
      setErrorText('يرجى إدخال الاسم المعتمد ثلاثياً على الأقل للتحقق من الهوية الدراسية.');
      return;
    }

    if (!isPhoneValid) {
      setErrorText('الرجاء كتابة رقم محمول مصري صالح يبدأ بـ 01 ويتكون من 11 رقم.');
      return;
    }

    if (password.length < 6) {
      setErrorText('يجب أن تتكون كلمة المرور من 6 خانات كحد أدنى لحماية حسابك.');
      return;
    }

    if (phone === '01029082772') {
      setErrorText('عذراً، رقم الهاتف هذا مخصص لمدير النظام فقط. يرجى تسجيل الدخول مباشرة.');
      return;
    }

    setLoading(true);
    setErrorText(null);

    const emailField = `${phone}@school.master`;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, emailField, password);
      const user = userCredential.user;

      // Write User Profile to firestore
      const userProfile = {
        id: user.uid,
        name: fullName,
        role: 'parent' as const, // Always 'parent' for registration
        phone: phone,
        email: emailField,
        status: 'approved' as const, // Auto-approved
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/users`, user.uid), userProfile);
      onAuthSuccess(user, 'parent');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setErrorText('تنبيه أمني هام: لم يتم تفعيل خيار تسجيل الدخول عبر البريد الإلكتروني وكلمة المرور (Email/Password) in platform Firebase. يرجى تفعيله لتسجيل الحسابات والولوج بنجاح.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorText('رقم الجوال المدخل مسجل سابقاً ومقترن بملف مستخدم نشط سحابياً.');
      } else {
        setErrorText('فشل تسجيل حساب جديد: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d1a] text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-brand-gold relative overflow-y-auto" style={{ direction: 'rtl' }}>
      
      {/* Absolute futuristic decorative aura shapes */}
      <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-1/4 w-[400px] h-[400px] bg-brand-gold/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-lg bg-[#11182c] rounded-[32px] border border-slate-800 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] p-6 sm:p-10 space-y-8 relative z-10 transition-all duration-300">
        
        {/* App Branding & Dynamic Header */}
        <div className="text-center space-y-3.5">
          <div className="inline-flex p-4 bg-gradient-to-tr from-[#1a2542] to-[#25355c] border border-slate-700 rounded-3xl text-brand-gold shadow-[0_8px_16px_rgba(0,0,0,0.3)] hover:scale-105 duration-200">
            <SchoolIcon className="w-9 h-9 text-brand-gold" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              <span>سكول ماستر</span>
              <span className="text-brand-gold font-sans font-light text-lg">School Master</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">المنظومة السحابية الموحدة للإدارة المدرسية ومتابعة الطلاب</p>
          </div>
        </div>

        {/* Tab switcher - Custom Premium UI Segment */}
        <div className="bg-[#070b16] rounded-2xl p-1.5 border border-slate-800/80 flex">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorText(null); }}
            className={`flex-1 py-3 text-xs font-bold rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 ${
              !isSignUp 
                ? 'bg-gradient-to-r from-brand-blue to-[#2563eb] text-white shadow-lg' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>تسجيل الدخول</span>
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorText(null); }}
            className={`flex-1 py-3 text-xs font-bold rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 ${
              isSignUp 
                ? 'bg-gradient-to-r from-brand-blue to-[#2563eb] text-white shadow-lg' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>إنشاء حساب جديد</span>
          </button>
        </div>

        {/* Dynamic Mode Explanatory Banner */}
        <div className="bg-[#16213e]/40 p-3.5 rounded-2xl border border-slate-800/80 flex flex-col gap-3 text-right">
          <div className="flex items-start gap-2.5">
            <Info className="w-4.5 h-4.5 text-brand-gold shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="text-[11px] text-white block">
                {!isSignUp ? 'مرحباً بعودتك إلى بوابتك الذكية' : 'ربط آمن وفوري للأبناء برقم الجوال'}
              </strong>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {!isSignUp 
                  ? 'تفضل بكتابة رقم الجوال مع كلمة المرور لمتابعة غيابات ونتائج ورسوم أبنائك.' 
                  : 'يكفي تعبئة اسمك الثلاثي ورقم جوالك فقط! سيقوم النظام تلقائياً بربط وعرض جميع أبنائك المربوطين برقمك فور إتمام التسجيل.'}
              </p>
            </div>
          </div>
        </div>

        {/* Error notification banner */}
        {errorText && (
          <div className="space-y-3">
            <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-350 rounded-2xl text-[11px] font-bold text-right leading-relaxed flex items-start gap-2.5 animate-bounce">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <span>{errorText}</span>
            </div>
          </div>
        )}

        {/* Auth Forms */}
        <form onSubmit={isSignUp ? handleRegisterSubmit : handleLoginSubmit} className="space-y-4 text-xs font-medium">
          
          {isSignUp && (
            <>
              {/* Full Name Input & Real-time Validation */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-slate-400 font-bold">
                  <label className="text-white">الاسم الثلاثي الكامل (كولي أمر)</label>
                  {fullName && (
                    <span className={`text-[10px] flex items-center gap-1 font-bold ${isNameValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isNameValid ? 'اسم معتمد (ثلاثي)' : 'اكتب الاسم ثلاثياً على الأقل للتحقق'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    onBlur={() => handleFieldBlur('fullName')}
                    placeholder="مثال: عبد الله أحمد العتيبي"
                    className={`w-full bg-[#080d19] border rounded-xl p-3.5 pr-10 text-xs text-white outline-none focus:ring-1 focus:ring-brand-blue text-right transition-all font-semibold ${
                      touchedFields.fullName 
                        ? (isNameValid ? 'border-emerald-500/60 focus:border-emerald-500 bg-[#070f1a]' : 'border-amber-500/60 focus:border-amber-500 bg-[#140f12]') 
                        : 'border-slate-800 focus:border-brand-blue'
                    }`}
                  />
                </div>
                <p className="text-[9px] text-slate-500 leading-relaxed">يرجى كتابة الاسم الثلاثي الكامل لضمان توثيق الهوية المدرسية للأبناء بالشكل الصحيح.</p>
              </div>

              {/* Saudi Mobile Phone Input & Feedback */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-slate-400 font-bold">
                  <label className="text-white">رقم الجوال (حلقة الوصل مع الأبناء)</label>
                  {phone && (
                    <span className={`text-[10px] flex items-center gap-1 font-bold ${isPhoneValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isPhoneValid ? 'رقم محمول صالح' : 'يجب أن يبدأ بـ 01 ويتكون من 11 رقم'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    onBlur={() => handleFieldBlur('phone')}
                    placeholder="01xxxxxxxxx"
                    className={`w-full bg-[#080d19] border rounded-xl p-3.5 pr-10 text-xs text-white outline-none focus:ring-1 focus:ring-brand-blue text-right transition-all font-mono font-bold ${
                      touchedFields.phone 
                        ? (isPhoneValid ? 'border-emerald-500/60 focus:border-emerald-500 bg-[#070f1a]' : 'border-amber-500/60 focus:border-amber-500 bg-[#140f12]') 
                        : 'border-slate-800 focus:border-brand-blue'
                    }`}
                  />
                </div>
                <p className="text-[9px] text-slate-500 leading-relaxed">رقم الجوال هو حلقة الوصل المحورية؛ كافّة الأطفال المربوطين برقمك من الإدارة سيظهرون لك تلقائياً بمجرد إتمام تسجيلك.</p>
              </div>

              {/* Password Input for Register */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-slate-400 font-bold">
                  <label className="text-white">كلمة المرور الأمنية للحساب</label>
                  {password && (
                    <span className={`text-[10px] flex items-center gap-1 font-bold ${password.length >= 6 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {password.length >= 6 ? 'طول كلمة مرور آمن' : 'يجب ألا تقل عن 6 خانات'}
                    </span>
                  )}
                </div>
                <div className="relative font-sans">
                  <Key className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onBlur={() => handleFieldBlur('password')}
                    placeholder="اكتب كلمة مرور لا تقل عن 6 خانات"
                    className="w-full bg-[#080d19] border border-slate-800 focus:border-brand-blue rounded-xl p-3.5 pr-10 pl-11 text-xs text-white outline-none text-right transition-all font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[9px] text-slate-500 leading-relaxed">يرجى كتابة كلمة مرور قوية لتأمين حسابك ومتابعة تقارير أبنائك بأمان تام.</p>
              </div>
            </>
          )}

          {!isSignUp && (
            <>
              {/* Phone Input for Login (Exclusively Phone Number) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-slate-400 font-bold">
                  <label className="text-white">رقم الجوال الخاص بك</label>
                  {email && (
                    <span className={`text-[10px] flex items-center gap-1 font-bold ${isLoginInputValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isLoginInputValid ? 'تنسيق جوال صالح' : 'أدخل رقم جوال 01xxxxxxxx'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onBlur={() => handleFieldBlur('email')}
                    placeholder="01xxxxxxxxx"
                    className={`w-full bg-[#080d19] border rounded-xl p-3.5 pr-10 text-xs text-white outline-none focus:ring-1 focus:ring-brand-blue text-right transition-all font-semibold font-mono ${
                      touchedFields.email 
                        ? (isLoginInputValid ? 'border-emerald-500/60 focus:border-emerald-500 bg-[#070f1a]' : 'border-amber-500/60 focus:border-amber-500 bg-[#140f12]') 
                        : 'border-slate-800 focus:border-brand-blue'
                    }`}
                  />
                </div>
              </div>

              {/* Password Input for Login */}
              <div className="space-y-1.5 font-sans">
                <div className="flex justify-between items-center text-slate-400 font-bold font-sans">
                  <label className="text-white">كلمة المرور الأمنية</label>
                  <span className="text-[10px] text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full font-bold">لأولياء الأمور الجدد: رقم جوالك</span>
                </div>
                <div className="relative font-sans">
                  <Key className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onBlur={() => handleFieldBlur('password')}
                    placeholder="••••••••"
                    className="w-full bg-[#080d19] border rounded-xl p-3.5 pr-10 pl-11 text-xs text-white outline-none focus:ring-1 focus:ring-brand-blue text-left transition-all font-mono font-bold border-slate-800 focus:border-brand-blue"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Submit action button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-brand-blue to-blue-600 hover:from-brand-blue-dark hover:to-blue-700 hover:scale-[1.01] active:scale-[0.99] duration-150 text-white font-black p-4 rounded-2xl transition-all shadow-[0_8px_20px_rgba(37,99,235,0.3)] mt-2 cursor-pointer flex justify-center items-center gap-2 text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                <span>جاري معالجة وثيقة البوابة وتشفيرها...</span>
              </>
            ) : (
              <>
                <span>{isSignUp ? 'تأسيس الملف الأمني وتفعيل الحساب فوراً' : 'تسجيل دخول آمن'}</span>
                {!isSignUp ? <ArrowRight className="w-4 h-4 shrink-0 rotate-180" /> : <ArrowLeft className="w-4 h-4 shrink-0 rotate-180" />}
              </>
            )}
          </button>

          {/* Social / Google Authentication Alternative */}
          {onGoogleSignIn && (
            <>
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-slate-800"></div>
                <span className="text-[10px] text-slate-500 px-3 font-bold">أو الدخول المباشر الموثق</span>
                <div className="flex-1 border-t border-slate-800"></div>
              </div>

              <button
                type="button"
                onClick={onGoogleSignIn}
                className="w-full bg-[#16213e]/60 hover:bg-[#1a2b4f] active:scale-[0.99] border border-slate-800 hover:border-slate-700 text-white font-bold p-3.5 rounded-2xl transition-all flex justify-center items-center gap-2.5 text-xs cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>تسجيل دخول سريع بواسطة حساب Google</span>
              </button>
            </>
          )}
        {/* Form closing */}
        </form>
      </div>
    </div>
  );
}
