'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Target, Zap, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: Shield,
    title: 'Risk Scoring',
    description:
      'Business-context aware risk assessment that prioritizes vulnerabilities based on actual impact to financial operations.',
  },
  {
    icon: Target,
    title: 'Continuous Scanning',
    description:
      'Automated vulnerability scanning across your entire infrastructure with real-time detection and alerting.',
  },
  {
    icon: Zap,
    title: 'Intelligent Exploitation',
    description:
      'Controlled exploitation testing with risk-aware automation to validate real-world exploitability.',
  },
  {
    icon: TrendingUp,
    title: 'Historical Analysis',
    description:
      'Track security posture over time with comprehensive analytics and compliance reporting.',
  },
];

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      router.replace('/dashboard');
    }
  }, [router]);

  return (
    <div className="flex m-2 flex-col">

        {/* Navigation */}
        <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
        
            <img src="/logo2.png" alt="FinClean Logo" className='h-15' />
            </div>
            <nav className="flex items-center space-x-6">
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Login
              </Link>
              <Button asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container flex flex-col items-center justify-center space-y-8 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex max-w-4xl flex-col items-center space-y-6 text-center"
          >
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm text-primary">
              <Shield className="mr-2 h-4 w-4" />
              Enterprise Security Platform
            </div>
            <motion.h1
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2}}
              className="overflow-hidden whitespace-nowrap text-5xl font-bold lg:text-7xl tracking-tight"
            >
              Intelligent Vulnerability
              <span className='block text-primary'>Management for FinTech</span>
            </motion.h1>

            <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Continuous security posture assessment with risk-aware exploitation automation.
              Protect your financial infrastructure with intelligent threat detection.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" variant="outline" asChild>
                <Link href="/register" className="flex items-center gap-2">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className='btn btn-accent btn-shine' asChild>
                <Link href="/login">View Demo</Link>
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3 pt-12"
          >
            {[
              { value: '99.9%', label: 'Accuracy Rate' },
              { value: '10M+', label: 'Scans Completed' },
              { value: '24/7', label: 'Monitoring' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center space-y-2 rounded-lg border border-border/50 bg-card/50 p-6"
              >
                <p className="text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="container py-24 md:py-32">
          <div className="flex flex-col items-center space-y-12">
            <div className="flex max-w-3xl flex-col items-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Comprehensive Security Coverage
              </h2>
              <p className="text-lg text-muted-foreground">
                Enterprise-grade vulnerability management designed specifically for financial institutions.
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={feature.title}
                    className="h-full border-border/50 bg-card/50 hover:border-primary/50 transition-colors"
                  >
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="pt-4">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="container py-24 md:py-32 bg-card/30">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Built for Financial Security Teams
              </h2>
              <p className="text-lg text-muted-foreground">
                FinClean understands the unique security challenges facing financial institutions.
              </p>

              <ul className="space-y-4">
                {[
                  'PCI-DSS and SOC 2 compliance reporting',
                  'Integration with existing SIEM platforms',
                  'Custom risk scoring for financial assets',
                  'Automated remediation workflows',
                ].map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-accent flex-shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-border/50 bg-card p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Security Posture</span>
                  <span className="text-2xl font-bold text-primary">87/100</span>
                </div>

                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full w-[87%] bg-primary rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container py-24 md:py-32">
          <div className="flex flex-col items-center space-y-6 text-center rounded-lg border border-border/50 bg-card/50 p-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to secure your infrastructure?
            </h2>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Join leading financial institutions using FinClean.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" asChild variant='outline'>
                <Link href="/register">Start Free Trial</Link>
              </Button>
              <Button size="lg" variant="outline" className='btn btn-accent btn-shine' asChild>
                <Link href="/login">Request Demo</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/40 py-8">
          <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center space-x-2">
            <img src="/logo2.png" alt="FinClean Logo" className='h-15' />
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 FinClean. All rights reserved.
            </p>
          </div>
        </footer>

    </div>
  );
}