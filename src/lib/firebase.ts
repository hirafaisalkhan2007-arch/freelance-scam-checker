import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Must specify firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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

// Connection test as mandated by skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Authentication Helpers
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || 'Freelancer',
        photoURL: result.user.photoURL || '',
        isGuest: false,
        createdAt: new Date().toISOString()
      }, { merge: true });
    }
    return result.user;
  } catch (err: any) {
    console.error("Google login failed:", err);
    throw err;
  }
}

export async function loginWithEmail(email: string, pass: string) {
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  return credential.user;
}

export async function registerWithEmail(email: string, pass: string, name: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  if (credential.user) {
    await updateProfile(credential.user, { displayName: name });
    await setDoc(doc(db, 'users', credential.user.uid), {
      uid: credential.user.uid,
      email,
      displayName: name,
      photoURL: '',
      isGuest: false,
      createdAt: new Date().toISOString()
    }, { merge: true });
  }
  return credential.user;
}

export async function loginAsGuest() {
  const credential = await signInAnonymously(auth);
  if (credential.user) {
    await setDoc(doc(db, 'users', credential.user.uid), {
      uid: credential.user.uid,
      email: '',
      displayName: 'Guest Freelancer',
      photoURL: '',
      isGuest: true,
      createdAt: new Date().toISOString()
    }, { merge: true });
  }
  return credential.user;
}

export async function logoutUser() {
  await signOut(auth);
}

// Sync saved scans with Firestore
export async function saveScanToFirestore(userId: string, scanData: any) {
  const path = `users/${userId}/scans/${scanData.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'scans', scanData.id), {
      ...scanData,
      userId,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchUserScansFromFirestore(userId: string) {
  const path = `users/${userId}/scans`;
  try {
    const q = query(collection(db, 'users', userId, 'scans'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

export async function deleteUserScanFromFirestore(userId: string, scanId: string) {
  const path = `users/${userId}/scans/${scanId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'scans', scanId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
