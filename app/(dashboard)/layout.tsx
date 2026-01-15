'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeToggle } from '@/app/components/ui/ThemeToggle';
import { Button } from '@/app/components/ui/Button';
import { toast } from 'sonner';
import Image from 'next/image';

interface Student {
  id: string;
  name: string;
  matricNumber: string;
  imageUrl: string;
  email: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [student, setStudent] = useState<Student | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchCurrentStudent();
    fetchUnreadNotifications();
  }, []);
  
  const fetchCurrentStudent = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.push('/login');
        return;
      }
      const data = await response.json();
      setStudent(data.student);
    } catch (error) {
      console.error('Fetch student error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUnreadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?unreadOnly=true');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Fetch notifications error:', error);
    }
  };
  
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Logged out successfully');
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-primary">SUESY</h1>
              
              <div className="hidden md:flex items-center gap-4">
                <Button
                  variant={pathname === '/feed' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => router.push('/feed')}
                >
                  Feed
                </Button>
                <Button
                  variant={pathname === '/dashboard' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                >
                  My Products
                </Button>
                <Button
                  variant={pathname === '/messages' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => router.push('/messages')}
                  className="relative"
                >
                  Messages
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              
              {student && (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <Image
                    src={student.imageUrl}
                    alt={student.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover border-2 border-primary"
                  />
                </button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}