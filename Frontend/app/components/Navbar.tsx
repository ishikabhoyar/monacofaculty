import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, FileText, BookOpen, LogOut } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path ? 'bg-blue-700' : '';
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('facultyId');
    window.location.href = '/login';
  };
  
  return (
    <nav className="bg-blue-600 text-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between">
          <div className="flex space-x-4">
            <Link href="/" className={`flex items-center px-3 py-4 hover:bg-blue-700 ${isActive('/')}`}>
              <Home className="h-5 w-5 mr-2" />
              <span>Dashboard</span>
            </Link>
            
            <Link href="/batches" className={`flex items-center px-3 py-4 hover:bg-blue-700 ${isActive('/batches')}`}>
              <Users className="h-5 w-5 mr-2" />
              <span>Batches</span>
            </Link>
            
            <Link href="/tests" className={`flex items-center px-3 py-4 hover:bg-blue-700 ${isActive('/tests')}`}>
              <FileText className="h-5 w-5 mr-2" />
              <span>Tests</span>
            </Link>
            
            <Link href="/lectures" className={`flex items-center px-3 py-4 hover:bg-blue-700 ${isActive('/lectures')}`}>
              <BookOpen className="h-5 w-5 mr-2" />
              <span>Lectures</span>
            </Link>
          </div>
          
          <div className="flex items-center">
            <button 
              onClick={handleLogout}
              className="flex items-center px-3 py-4 hover:bg-blue-700"
            >
              <LogOut className="h-5 w-5 mr-2" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}