// src/auth.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { getActiveSpaceCode } from "./utils/space";

const AuthContext = createContext();

const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [docLoading, setDocLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
      setAuthLoading(false);
    });

    return () => unsub();
  }, []);

  /* Live profile document (holds the active space) */
  useEffect(() => {
    if (!user) {
      setUserDoc(null);
      setDocLoading(false);
      return;
    }

    setDocLoading(true);
    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        setUserDoc(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setDocLoading(false);
      },
      (err) => {
        console.error("Failed to load user profile:", err);
        setDocLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  // ======================
  // SIGNUP
  // ======================
  const signup = async ({ email, password, name, username }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    await setDoc(doc(db, "users", uid), {
      id: uid,
      email,
      name,
      username,
      createdAt: new Date(),
      spaceCode: null,
      roleInSpace: null,
    });

    return cred.user;
  };

  // ======================
  // LOGIN
  // ======================
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // ======================
  // GOOGLE SIGN-IN
  // ======================
  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;

    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    // Create Firestore user ONLY if it doesn't exist
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || "",
        username: null,
        createdAt: new Date(),
        spaceCode: null,
        roleInSpace: null,
      });
    }

    return firebaseUser;
  };

  // ======================
  // LOGOUT
  // ======================
  const logout = () => signOut(auth);

  const value = {
    user,
    userDoc,
    activeSpaceCode: getActiveSpaceCode(userDoc),
    loading: authLoading || (!!user && docLoading),
    signup,
    login,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
