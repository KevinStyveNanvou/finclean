// app/login/page.tsx (ou le chemin de votre page de login)
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import api from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/user/login/', {
        username: formData.username,
        password: formData.password
      });

      // ✅ CORRECTION: Accès correct aux tokens depuis response.data.cookies
      // Notez la faute de frappe "acess_token" dans la réponse du backend
      const accessToken = response.data.cookies.access_token; 
      const refreshToken = response.data.cookies.refresh_token;
      
      console.log('Login response:', response.data);
      
      // Stocker les tokens dans les cookies
      document.cookie = `access_token=${accessToken}; path=/; max-age=86400`; // 24 heures
      document.cookie = `refresh_token=${refreshToken}; path=/; max-age=604800`; // 7 jours
      
      // Aussi stocker dans localStorage pour persistance
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);

      console.log("Cookies after login:", document.cookie);

      toast({
        title: 'Login successful',
        description: 'Welcome back to FinClean'
      });

      router.replace('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      
      toast({
        title: 'Login failed',
        description: error.response?.data?.message || 'Invalid username or password',
        variant: 'destructive'
      });

      setFormData(prev => ({ ...prev, password: '' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center space-y-2">
          <div className="flex items-center space-x-2">
            <img src="/logo2.png" alt="FinClean Logo" />
          </div>
          <p className="text-sm text-muted-foreground">
            Intelligent Vulnerability Management
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin} autoComplete="off">
            <CardContent className="space-y-4">

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="analyst123"
                    className="pl-10"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="#"
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full btn btn-accent text-amber-50"
                disabled={loading}
              >
                {loading ? (
                  'Signing in...'
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link
                  href="/register"
                  className="text-primary btn hover:text-primary/80 transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}