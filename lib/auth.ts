import { prisma } from './prisma';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createSession(studentId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  
  await prisma.session.create({
    data: {
      studentId,
      token,
      expiresAt,
    },
  });
  
  return token;
}

export async function getSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { student: true },
  });
  
  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    return null;
  }
  
  return session;
}

export async function getCurrentStudent() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  
  if (!token) return null;
  
  const session = await getSession(token);
  return session?.student || null;
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}

export async function validateStudentLogin(
  matricNumber: string,
  email: string
): Promise<{ success: boolean; student?: any; error?: string }> {
  const student = await prisma.student.findUnique({
    where: { matricNumber },
  });
  
  if (!student) {
    return { success: false, error: 'Credentials do not match' };
  }
  
  if (student.email !== email) {
    return { success: false, error: 'Credentials do not match' };
  }
  
  return { success: true, student };
}

export async function validateAdminLogin(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  // Check environment variables first
  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return { success: true };
  }
  
  // Check database
  const admin = await prisma.admin.findUnique({
    where: { email },
  });
  
  if (!admin) {
    return { success: false, error: 'Invalid credentials' };
  }
  
  const isValid = await bcrypt.compare(password, admin.password);
  
  if (!isValid) {
    return { success: false, error: 'Invalid credentials' };
  }
  
  return { success: true };
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  });
}

export async function setAdminCookie() {
  const cookieStore = await cookies();
  const token = randomBytes(32).toString('hex');
  
  cookieStore.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600, // 1 hour
    path: '/',
  });
  
  return token;
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  return !!token;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('session_token');
}

export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
}