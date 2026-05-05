'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Alert } from '@/components/ui';

const DEMO_USERS = [
  { email: 'admin@demo.com',   name: 'עמית ברק (Admin)' },
  { email: 'israel@demo.com',  name: 'ישראל ישראלי' },
  { email: 'dana@demo.com',    name: 'דנה כהן' },
  { email: 'yosi@demo.com',    name: 'יוסי גולן' },
  { email: 'rachel@demo.com',  name: 'רחל אברהם' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e?: React.FormEvent, overrideEmail?: string) => {
    e?.preventDefault();
    const target = overrideEmail || email;
    if (!target) { setError('נא להזין כתובת דוא"ל'); return; }
    setLoading(true); setError('');
    try {
      await login(target);
      router.replace('/');
    } catch {
      setError('משתמש לא נמצא. נסה אחד מהמשתמשים למטה.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B3A6B] to-[#2E75B6] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl font-medium text-white mb-2">מוכ<span className="text-blue-300">שרים</span></div>
          <div className="text-blue-200 text-sm">וקסמן גרופ – מערכת ניהול כישורים</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h2 className="text-base font-medium text-gray-800 mb-5">כניסה למערכת</h2>

          {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

          <form onSubmit={handleLogin} className="space-y-4 mb-5">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">כתובת דוא"ל</label>
              <Input
                type="email"
                placeholder="your@waxman.co.il"
                value={email}
                onChange={e => setEmail(e.target.value)}
                dir="ltr"
              />
            </div>
            <Button type="submit" variant="primary" loading={loading} className="w-full">
              כניסה
            </Button>
          </form>

          <div className="border-t border-gray-100 pt-4">
            <div className="text-xs text-gray-400 mb-3 text-center">משתמשי דמו</div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_USERS.map(u => (
                <button
                  key={u.email}
                  onClick={() => handleLogin(undefined, u.email)}
                  className="text-right px-3 py-2 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors text-xs"
                >
                  <div className="font-medium text-gray-700">{u.name}</div>
                  <div className="text-gray-400 truncate" dir="ltr">{u.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
