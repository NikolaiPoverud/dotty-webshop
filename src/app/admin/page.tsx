import { redirect } from 'next/navigation';

// Redirect /admin to /admin/dashboard (middleware handles auth check)
export default function AdminPage() {
  redirect('/admin/dashboard');
}
