import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import '@/app/globals.css'

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin_token')?.value;

  if (!adminToken) {
    redirect('/admin');
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">SUESY Admin Panel</h1>
          <form action="/api/auth/admin/logout" method="POST">
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:opacity-90"
            >
              Logout
            </button>
          </form>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}