import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, isConfigured } from '../services/firebase';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null, 
  loading: true,
  isConfigured: false,
  login: async () => {},
  logout: async () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for demo session first
    const isDemo = localStorage.getItem('niklaus_demo_session') === 'true';
    if (isDemo) {
      setUser({
        uid: 'demo-admin-uid',
        email: 'niklaus.systems@gmail.com',
        displayName: 'Niklaus Admin',
      } as User);
      setProfile({
        uid: 'demo-admin-uid',
        name: 'Niklaus Admin',
        email: 'niklaus.systems@gmail.com',
        role: 'admin',
        tipo: 'admin'
      });
      setLoading(false);
      return;
    }

    if (!isConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user && db) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Create default profile if it doesn't exist (for first login)
            const newProfile: UserProfile = {
              uid: user.uid,
              name: user.displayName || 'Usuário',
              email: user.email || '',
              role: 'admin',
              tipo: 'admin'
            };
            await setDoc(docRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      if (auth) {
        await signInWithEmailAndPassword(auth, email, pass);
      }
    } catch (error: any) {
      // Fallback for demo credentials if real login fails or if Firebase is not fully configured
      if (email === 'niklaus.systems@gmail.com' && pass === '654326') {
        console.warn("Using demo login fallback");
        const mockUser = {
          uid: 'demo-admin-uid',
          email: 'niklaus.systems@gmail.com',
          displayName: 'Niklaus Admin',
        } as User;
        
        setUser(mockUser);
        setProfile({
          uid: 'demo-admin-uid',
          name: 'Niklaus Admin',
          email: 'niklaus.systems@gmail.com',
          role: 'admin',
          tipo: 'admin'
        });
        
        // Persist demo session
        localStorage.setItem('niklaus_demo_session', 'true');
        return;
      }
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem('niklaus_demo_session');
    if (auth) {
      await signOut(auth);
    }
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isConfigured, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
