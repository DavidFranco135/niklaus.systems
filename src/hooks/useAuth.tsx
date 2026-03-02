import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, isConfigured } from '../services/firebase';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile } from '../types';

interface ExtendedProfile extends UserProfile {
  photoURL?: string;
  phone?: string;
  storeName?: string;
  address?: string;
  cnpj?: string;
  notifications?: Record<string, boolean>;
  appearance?: Record<string, string>;
}

interface AuthContextType {
  user: User | null;
  profile: ExtendedProfile | null;
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
  logout: async () => {},
});

const DEMO_USER = {
  uid: 'demo-admin-uid',
  email: 'niklaus.systems@gmail.com',
  displayName: 'Niklaus Admin',
} as User;

const DEMO_PROFILE: ExtendedProfile = {
  uid: 'demo-admin-uid',
  name: 'Niklaus Admin',
  email: 'niklaus.systems@gmail.com',
  role: 'admin',
  tipo: 'admin',
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ExtendedProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão demo persistida
    const isDemo = localStorage.getItem('niklaus_demo_session') === 'true';
    if (isDemo) {
      setUser(DEMO_USER);
      setProfile(DEMO_PROFILE);
      setLoading(false);
      return;
    }

    if (!isConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser && db) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setProfile(docSnap.data() as ExtendedProfile);
          } else {
            // Criar perfil padrão para novo usuário
            const newProfile: ExtendedProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Usuário',
              email: firebaseUser.email || '',
              role: 'admin',
              tipo: 'admin',
            };
            await setDoc(docRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error('Erro ao buscar perfil:', error);
          // Perfil mínimo mesmo em caso de erro de permissão
          setProfile({
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'Usuário',
            email: firebaseUser.email || '',
            role: 'admin',
            tipo: 'admin',
          });
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, pass: string) => {
    // Tentar login real no Firebase primeiro
    if (auth && isConfigured) {
      try {
        await signInWithEmailAndPassword(auth, email, pass);
        return;
      } catch (error: any) {
        // Se falhar com credenciais demo, usar modo demo
        if (
          (error.code === 'auth/invalid-credential' ||
            error.code === 'auth/user-not-found' ||
            error.code === 'auth/wrong-password') &&
          email === 'niklaus.systems@gmail.com' &&
          pass === '654326'
        ) {
          console.warn('Usando modo demo (credenciais demo não cadastradas no Firebase).');
          setUser(DEMO_USER);
          setProfile(DEMO_PROFILE);
          localStorage.setItem('niklaus_demo_session', 'true');
          return;
        }
        throw error;
      }
    }

    // Firebase não configurado: modo demo automático
    if (email === 'niklaus.systems@gmail.com' && pass === '654326') {
      setUser(DEMO_USER);
      setProfile(DEMO_PROFILE);
      localStorage.setItem('niklaus_demo_session', 'true');
    } else {
      throw new Error('Credenciais inválidas no modo demo.');
    }
  };

  const logout = async () => {
    localStorage.removeItem('niklaus_demo_session');
    if (auth) {
      try {
        await signOut(auth);
      } catch {
        // Ignora erro de logout no modo demo
      }
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
