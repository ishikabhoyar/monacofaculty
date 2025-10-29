import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const withStudentAuth = (WrappedComponent: React.ComponentType) => {
  return function ProtectedRoute(props: any) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Verify the token is valid for a student
      const verifyToken = async () => {
        try {
          const response = await fetch('/api/students/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('token');
            router.push('/login');
          }
        } catch (error) {
          console.error('Error verifying token:', error);
          localStorage.removeItem('token');
          router.push('/login');
        }
      };

      verifyToken();
    }, []);

    if (!isAuthenticated) {
      return null; // or a loading spinner
    }

    return <WrappedComponent {...props} />;
  };
};

export default withStudentAuth;