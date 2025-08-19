"use client";

import React from 'react';
import Image from 'next/image';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import Bg from '../../public/BG-login(2).jpg';
import logo from '../../public/KJSCE.png';
import logo1 from '../../public/university.png';
import Bottom from '../../public/Bottom.png';

export default function Login() {
  const router = useRouter();

  const handleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      try {
        const response = await fetch('http://localhost:5000/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${credentialResponse.credential}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Store the token or user data in local storage or context
          // For now, just redirect to the dashboard
          router.push('/');
        } else {
          console.error('Login failed:', await response.text());
          alert('Login failed. Please try again.');
        }
      } catch (error) {
        console.error('Error during login:', error);
        alert('An error occurred during login. Please try again.');
      }
    }
  };

  const handleLoginError = () => {
    console.error('Login failed');
    alert('Login failed. Please try again.');
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Left Side - Background Image */}
      <div className="w-1/2 relative">
        <Image
          src={Bg}
          alt="Login Background"
          fill
          priority
          className="object-cover brightness-[0.95] dark:brightness-[0.85]"
        />
      </div>

      {/* Right Side - Login Form */}
      <div className="w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Logos */}
          <div className="flex justify-center gap-4 mb-8">
            <Image src={logo1} alt="KJSCE" height={48} width={48} className="h-12 w-auto" />
            <Image src={logo} alt="Somaiya Vidyavihar" height={48} width={48} className="h-12 w-auto" />
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