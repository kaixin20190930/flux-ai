import { useState, useEffect } from 'react';
import { getUserFromLocalStorage } from '@/utils/authUtils';
import { User } from '@/utils/userUtils';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getUserFromLocalStorage();
      setUser(currentUser);
      setLoading(false);
    };
    
    fetchUser();
  }, []);

  return { user, loading };
} 