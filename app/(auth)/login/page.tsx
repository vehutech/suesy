// app/(auth)/login/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { toast } from 'sonner';
import { ThemeToggle } from '@/app/components/ui/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [matricNumber, setMatricNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!matricNumber || !email) {
      toast.error('Please fill in all fields');
      return;
    }
    
    // Validate matric number format
    const matricRegex = /^[A-Z]{3}\/\d{2}\/[A-Z]{3}\/\d{3}$/;
    if (!matricRegex.test(matricNumber)) {
      toast.error('Invalid matric number format. Expected: SCI/21/CSC/228');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matricNumber, email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || 'Credentials do not match');
        return;
      }
      
      toast.success('Login successful!');
      router.push('/feed');
      router.refresh();
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-md animate-in">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <CardTitle className="text-3xl">SUESY</CardTitle>
          <CardDescription>
            Students&apos; Used Items Exchange System
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Matric Number"
              type="text"
              placeholder="SCI/21/CSC/228"
              value={matricNumber}
              onChange={(e) => setMatricNumber(e.target.value.toUpperCase())}
              disabled={isLoading}
              required
            />
            
            <Input
              label="Email"
              type="email"
              placeholder="student@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
            
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
            >
              Login
            </Button>
            
            <p className="text-xs text-center text-muted-foreground mt-4">
              Don&apos;t have credentials? Contact admin for registration
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}