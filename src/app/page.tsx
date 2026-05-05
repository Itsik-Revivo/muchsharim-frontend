'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loading } from '@/components/ui';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login');
      else if (user.is_admin) router.replace('/admin');
      else router.replace('/employee');
    }
  }, [user, loading, router]);

  return <div className="flex items-center justify-center h-screen"><Loading text="מעביר אותך..." /></div>;
}
