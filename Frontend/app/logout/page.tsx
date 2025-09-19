"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LogOut, CheckCircle, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LogoutPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const [logoutComplete, setLogoutComplete] = useState(false);

  useEffect(() => {
    // Simulate logout process
    const performLogout = async () => {
      try {
        // Clear all authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('facultyId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        
        // Add a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setIsLoggingOut(false);
        setLogoutComplete(true);
        
        // Auto redirect after showing success message
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (error) {
        console.error('Error during logout:', error);
        // Even if there's an error, clear local storage
        localStorage.clear();
        setIsLoggingOut(false);
        setLogoutComplete(true);
      }
    };

    performLogout();
  }, [router]);

  const handleLoginRedirect = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-gray-900 dark:to-black p-4">
      <div className="w-full max-w-md">
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full w-fit">
              {isLoggingOut ? (
                <LogOut className="h-8 w-8 text-white animate-pulse" />
              ) : logoutComplete ? (
                <CheckCircle className="h-8 w-8 text-white" />
              ) : (
                <LogOut className="h-8 w-8 text-white" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
              {isLoggingOut ? 'Logging Out...' : logoutComplete ? 'Logged Out Successfully' : 'Logout'}
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-gray-400">
              {isLoggingOut 
                ? 'Please wait while we securely log you out of your account.' 
                : logoutComplete 
                  ? 'You have been successfully logged out. You will be redirected to the login page shortly.' 
                  : 'Logging out of your account...'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {isLoggingOut && (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
                <div className="text-center text-sm text-slate-500 dark:text-gray-400">
                  Clearing session data...
                </div>
              </div>
            )}

            {logoutComplete && (
              <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                    <div>
                      <div className="font-medium text-green-900 dark:text-green-100">
                        Logout Complete
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        Your session has been securely terminated.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
                    Redirecting to login page in 3 seconds...
                  </p>
                  <Button 
                    onClick={handleLoginRedirect}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Go to Login Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500 dark:text-gray-500">
            Thank you for using Monaco Faculty Portal
          </p>
        </div>
      </div>
    </div>
  );
}