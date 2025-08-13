"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Eye, Mail } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import Bg from '../../public/BG-login(2).jpg';
import logo from '../../public/KJSCE.png';
import logo1 from '../../public/university.png';
import Bottom from '../../public/Bottom.png';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    svvNetId: '',
    password: '',
    rememberMe: false
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
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
            Welcome To Monaco Editor
          </h1>
          <p className="text-center text-sm text-muted-foreground mb-8">
            Please enter your SVV Net ID & password to Login.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-card p-7 rounded-lg shadow-md border border-border/50">
            <div className="space-y-6">
              {/* SVV Net ID */}
              <div>
                <label htmlFor="svvNetId" className="block text-sm font-medium text-card-foreground">
                  SVV Net ID <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  id="svvNetId"
                  className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm bg-card text-card-foreground focus:outline-none focus:ring-primary focus:border-primary"
                  value={formData.svvNetId}
                  onChange={(e) => setFormData({...formData, svvNetId: e.target.value})}
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-card-foreground">
                  Password <span className="text-destructive">*</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="block w-full px-3 py-2 border border-input rounded-md shadow-sm bg-card text-card-foreground focus:outline-none focus:ring-primary focus:border-primary"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <Eye className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-input rounded bg-background"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({...formData, rememberMe: e.target.checked})}
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-muted-foreground">
                    Remember Me
                  </label>
                </div>
                <a href="#" className="text-sm font-medium text-primary hover:text-primary/80">
                  Forgot Password?
                </a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-md text-sm font-medium text-primary-foreground bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Login
              </button>

              {/* OR Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-input"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">OR</span>
                </div>
              </div>

              {/* Email Login Button */}
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-input/50 rounded-md text-sm font-medium text-card-foreground bg-card hover:bg-accent/50 transition-colors focus:outline-none"
              >
                <Mail className="h-5 w-5" />
                Login with Somaiya Email ID
              </button>
            </div>
          </form>

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