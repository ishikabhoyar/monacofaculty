"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import Bg from '../../public/BG-login(2).jpg';
import logo from '../../public/kjsce2x.png';
import logo1 from '../../public/Vidyavihar@3x.png';
import Bottom from '../../public/Bottom.png';

export default function Login() {
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/');
    }
  }, [router]);

  const handleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    console.log('Google login success:', credentialResponse);
    
    if (credentialResponse.credential) {
      try {
        console.log('Sending credential to backend...');
        const response = await fetch('http://localhost:5000/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${credentialResponse.credential}`,
          },
        });

        const data = await response.json();
        console.log('Backend response:', response.status, data);
        
        if (response.ok && data.success) {
          // Store the session token returned from the server
          localStorage.setItem('token', data.token);
          localStorage.setItem('facultyId', data.facultyId);
          localStorage.setItem('userName', data.user.name || '');
          localStorage.setItem('userEmail', data.user.email || '');
          router.push('/');
        } else {
          console.error('Login failed:', data.message);
          alert(`Login failed: ${data.message || 'Please try again.'}`);
        }
      } catch (error) {
        console.error('Error during login:', error);
        alert(`Network error during login. Please check your connection and try again. Error: ${error}`);
      }
    } else {
      console.error('No credential received from Google');
      alert('No credential received from Google. Please try again.');
    }
  };

  const handleLoginError = () => {
    console.error('Google login failed - checking network and configuration...');
    
    // Check if we're online
    if (!navigator.onLine) {
      alert('You appear to be offline. Please check your internet connection and try again.');
      return;
    }
    
    // Check if Google Identity Services script loaded
    if (typeof window !== 'undefined' && !(window as any).google) {
      console.error('Google Identity Services script not loaded');
      alert('Google authentication service is not available. Please refresh the page and try again.');
      return;
    }
    
    alert('Google login failed. This might be due to:\n• Network connectivity issues\n• Browser compatibility\n• Google account configuration\n\nPlease try again or contact support if the problem persists.');
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Left Side - Background Image */}
      <div className="w-1/2 relative">
        {/* Background image */}
        <Image
          src={Bg}
          alt="Login Background"
          fill
          sizes="100vw"
          className="object-cover brightness-[0.95] dark:brightness-[0.85]"
        />
      </div>

      {/* Right Side - Login Form */}
      <div className="w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Logos */}
          <div className="flex justify-center gap-4 mb-8">
            {/* Logo images with correct height and width properties */}
            <Image 
              src={logo1} 
              alt="KJSCE" 
              width={48} 
              height={48} 
              className="h-12 w-auto" 
            />

            <Image 
              src={logo} 
              alt="Somaiya Vidyavihar" 
              width={48} 
              height={48} 
              className="h-12 w-auto" 
            />
          </div>

          {/* Title */}
          <h1 className="text-xl font-semibold text-center text-foreground mb-2" style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>
            Welcome To Monaco Faculty
          </h1>
          <p className="text-center text-sm text-muted-foreground mb-8">
            Please sign in with your Google account to continue.
          </p>

          {/* Google Login Button */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={handleLoginError}
              useOneTap
            />
          </div>

          {/* Trust Logo */}
          <div className="mt-8 flex justify-end">
            {/* Bottom image with correct properties */}
            <Image
              src={Bottom}
              alt="Somaiya Trust"
              width={96}
              height={32}
              className="h-8 w-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}