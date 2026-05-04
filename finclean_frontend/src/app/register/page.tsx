"use client"
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Building2, ArrowRight, CheckCircle2, UserPlus } from 'lucide-react';
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
import api from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please ensure both passwords are identical',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      await api.post('/user/register/', {
        company: formData.company,
        email: formData.email,
        password: formData.password,
        username: formData.username
      });

      toast({
        title: 'Account created successfully',
        description: 'Redirecting to login page...'
      });

      router.replace('/login');
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Registration failed';

      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    'Real-time vulnerability scanning',
    'Risk-aware exploitation testing',
    'Compliance reporting',
    '24/7 monitoring and alerts'
  ];

  return (
    <div className="flex min-h-screen bg-background">

      {/* Left Side - Form */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center space-y-2">
            <Link href="/" className="flex items-center space-x-2">
            <img src="/logo2.png" alt="FinClean Logo" className='btn-shine h-15 w-auto'/>
            </Link>
            <h1 className="text-2xl font-bold">Create your account</h1>
          </div>

          <Card>
            <CardHeader>
    
              <CardDescription>
                Get started with FinClean and secure your financial infrastructure today.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleRegister} autoComplete="off">
              <CardContent className="space-y-4">

                {/* Company */}
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="company"
                      type="text"
                      placeholder="Acme Financial Corp"
                      className="pl-10"
                      value={formData.company}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Work Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      className="pl-10"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="username"
                      className="pl-10"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
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
                      minLength={8}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters
                  </p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full btn btn-accent text-amber-50" disabled={loading}>
                  {loading ? 'Creating account...' : (
                    <>
                      Create account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="text-primary btn hover:text-primary/80 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </div>

      {/* Right Side - Benefits */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:flex-1 flex-col justify-center bg-card/50 border-l border-border border-primary/50 p-12"
      >
        <div className="max-w-md space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">
              Enterprise-grade security for financial institutions
            </h2>
            <p className="text-muted-foreground">
              Join leading financial institutions in securing their critical infrastructure with FinClean.
            </p>
          </div>

          <div className="space-y-4">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

    </div>
  );
}