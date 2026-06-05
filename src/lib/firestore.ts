import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ----------------------------------------------------
// DATABASE SEEDER / DEFAULT LOCAL SIMULATOR DATA
// ----------------------------------------------------
// This ensures that even when offline or if Firebase auth isn't fully linked yet, 
// the user can interact with the app. Also doubles as actual data seeded to Firestore.
export const DEMO_SCHOOL_ID = "school-main";

export const DEFAULT_SCHOOL_DATA = {
  id: DEMO_SCHOOL_ID,
  name: "مدرسة الجيل الجديد",
  logo: "school_master_logo",
  slug: "newgeneration",
  subscriptionStatus: "active" as const,
  subscriptionPlan: "نظام خاص دائم",
  trialEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  settings: {
    address: "مكة المكرمة، حي الشوقية، شارع الجيل الجديد، مبنى رقم 7",
    phone: "0123456789",
    licenseNumber: "EDU-NG-2026",
    academicYear: "2025 - 2026",
    semester: "الفصل الدراسي الأول" as const,
    gradingSystem: "Letter (A-F)"
  }
};

export const DEFAULT_USERS: any[] = [];

export const DEFAULT_STUDENTS: any[] = [];

export const DEFAULT_CLASSES: any[] = [];

export const DEFAULT_ATTENDANCE: any = {};

export const DEFAULT_GRADES: any[] = [];

export const DEFAULT_FEES: any[] = [];

export const DEFAULT_COMPLAINTS: any[] = [];

export const DEFAULT_NOTIFICATIONS: any[] = [];

export const DEFAULT_MESSAGES: any[] = [];

// Helper to check and bootstrap Firestore with demo documents if empty
export async function bootstrapFirestore() {
  try {
    const schoolDoc = await getDoc(doc(db, "schools", DEMO_SCHOOL_ID));
    if (schoolDoc.exists()) {
      console.log("Firebase is already seeded.");
      return;
    }

    console.log("Bootstrapping Firestore with rich school management data...");
    
    // 1. Seed school root
    await setDoc(doc(db, "schools", DEMO_SCHOOL_ID), DEFAULT_SCHOOL_DATA);
    
    // 2. Seed Users
    for (const u of DEFAULT_USERS) {
      await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/users`, u.id), u);
    }

    // Auto-seed current user as approved admin
    if (auth.currentUser) {
      const fallbackPhone = auth.currentUser.email ? auth.currentUser.email.split('@')[0] : "01029082772";
      await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/users`, auth.currentUser.uid), {
        id: auth.currentUser.uid,
        name: auth.currentUser.displayName || "مدير النظام (سحابي)",
        role: "admin",
        phone: auth.currentUser.phoneNumber || (fallbackPhone.match(/^01[0125]\d{8}$/) ? fallbackPhone : "01029082772"),
        email: auth.currentUser.email || "01029082772@school.master",
        status: "approved",
        createdAt: new Date().toISOString()
      });
    }
    
    // 3. Seed Students
    for (const s of DEFAULT_STUDENTS) {
      await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/students`, s.id), s);
    }
    
    // 4. Seed Classes
    for (const c of DEFAULT_CLASSES) {
      await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/classes`, c.id), c);
    }
    
    // 5. Seed Attendance (flat date log)
    await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/attendance/2026-05-28_class-1`), {
      records: DEFAULT_ATTENDANCE["2026-05-28"]["class-1"]
    });
    
    // 6. Seed Grades
    for (const g of DEFAULT_GRADES) {
      await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/grades`, g.id), g);
    }
    
    // 7. Seed Fees
    for (const f of DEFAULT_FEES) {
      await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/fees`, f.studentId), f);
    }
    
    // 8. Seed Complaints
    for (const cp of DEFAULT_COMPLAINTS) {
      await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/complaints`, cp.id), cp);
    }
    
    // 9. Seed Notifications
    for (const n of DEFAULT_NOTIFICATIONS) {
      await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/notifications`, n.id), n);
    }
    
    // 10. Seed Chats
    for (const m of DEFAULT_MESSAGES) {
      await setDoc(doc(db, `schools/${DEMO_SCHOOL_ID}/messages`, m.id), m);
    }

    console.log("Firestore successfully bootstrapped!");
  } catch (error) {
    console.error("Bootstrapping Firestore failed, using in-memory fallbacks.", error);
  }
}
