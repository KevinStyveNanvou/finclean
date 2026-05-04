'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Target, 
  Zap, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2,
  Lock,
  BarChart3,
  Brain,
  AlertTriangle,
  ChevronRight,
  Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: Zap,
    title: 'Intelligent Scanning',
    description: 'Advanced network and web vulnerability scanning with real-time detection. Identifies critical vulnerabilities across your entire infrastructure.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'Machine learning-based vulnerability analysis and risk scoring. Get context-aware insights tailored to your financial operations.',
  },
  {
    icon: BarChart3,
    title: 'Risk Management',
    description: 'Business-context aware risk assessment that prioritizes threats by actual impact to financial operations and compliance.',
  },
  {
    icon: Lock,
    title: 'Automated Remediation',
    description: 'Intelligent recommendations and guided remediation workflows. Reduce vulnerability resolution time from weeks to hours.',
  },
];

const benefits = [
  {
    icon: Shield,
    title: 'PCI-DSS & SOC 2 Compliance',
    description: 'Automated compliance reporting and audit trails for financial regulations',
  },
  {
    icon: Target,
    title: 'Continuous Monitoring',
    description: 'Schedule permanent scans to track security posture over time',
  },
  {
    icon: AlertTriangle,
    title: 'Critical Vulnerability Detection',
    description: 'Identify and prioritize exploitable vulnerabilities instantly',
  },
  {
    icon: TrendingUp,
    title: 'Historical Analytics',
    description: 'Track trends and measure security improvements over quarters',
  },
];

const stats = [
  { value: '1000+', label: 'Organizations Protected', subtext: 'Banking & FinTech institutions' },
  { value: '500M+', label: 'Vulnerabilities Scanned', subtext: 'Across all industries' },
  { value: '99.9%', label: 'Detection Accuracy', subtext: 'Verified by independent audits' },
];

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col bg-gradient-to-b from-background via-background to-card/20">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between pr-2">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-2"
          >
            <img src="/logo2.png" alt="FinClean Logo" className='h-12 w-auto' />
          </motion.div>
          
          <motion.nav 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-6"
          >
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              Sign In
            </Link>
            <Button asChild className="bg-primary hover:bg-primary/90 text-white">
              <Link href="/register">Get Started Free</Link>
            </Button>
          </motion.nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative container flex flex-col items-center justify-center min-h-[90vh] space-y-8 py-12 md:py-20">
        {/* Animated background elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl opacity-50 animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl opacity-50 animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center space-y-6 text-center max-w-4xl"
        >
          {/* Badge */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary"
          >
            <Flame className="mr-2 h-4 w-4" />
            <span className="font-semibold">Enterprise Vulnerability Management</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight"
          >
            Secure Your Financial
            <span className='block text-primary mt-2'>Infrastructure Today</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed"
          >
            FinClean is an intelligent vulnerability management platform designed for financial institutions. 
            Detect, assess, and remediate security threats with AI-powered analysis and compliance automation.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 pt-4"
          >
            <Button size="lg" className="bg-primary hover:bg-primary/90 btn-shine text-white text-base h-12" asChild>
              <Link href="/register" className="flex items-center gap-2">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base btn-shine h-12 border-primary/30 hover:bg-primary/5" asChild>
              <Link href="/login">View Demo</Link>
            </Button>
          </motion.div>

          {/* Trust Badge */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-sm text-muted-foreground pt-4"
          >
            ✓ No credit card required • 14-day free trial • Full feature access
          </motion.p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-4 pt-12"
        >
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 + idx * 0.1 }}
              className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 text-center hover:border-primary/30 transition-all duration-300"
            >
              <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
              <p className="font-semibold text-foreground mt-2">{stat.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container py-24 md:py-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-col items-center space-y-12"
        >
          <div className="flex flex-col items-center space-y-4 text-center max-w-3xl">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Comprehensive Vulnerability Management
            </h2>
            <p className="text-lg text-muted-foreground">
              Our AI-powered platform provides end-to-end vulnerability detection, analysis, and remediation 
              tailored specifically for financial institutions.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full border-border/50 bg-card/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-300 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/15 mb-2">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Benefits Section */}
      <section className="container py-24 md:py-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="space-y-12"
        >
          <div className="flex flex-col items-center space-y-4 text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Built for Financial Institutions
            </h2>
            <p className="text-lg text-muted-foreground">
              From compliance to security operations, FinClean addresses the unique challenges 
              facing modern financial organizations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="flex gap-4 p-6 rounded-xl border border-border/50 bg-card/30 hover:bg-card/50 transition-all duration-300"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/15">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="container py-24 md:py-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="space-y-12"
        >
          <div className="flex flex-col items-center space-y-4 text-center max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Simple & Powerful
            </h2>
            <p className="text-lg text-muted-foreground">
              Get started in minutes and begin detecting vulnerabilities across your infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Configure',
                description: 'Set up your network targets and scanning parameters in seconds'
              },
              {
                step: '02',
                title: 'Scan',
                description: 'Automated scans detect vulnerabilities across your infrastructure'
              },
              {
                step: '03',
                title: 'Remediate',
                description: 'Get AI-powered recommendations and track remediation progress'
              }
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="relative space-y-4"
              >
                {idx < 2 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[40%] h-[2px] bg-gradient-to-r from-primary/50 to-transparent"></div>
                )}
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="container py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="relative rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-12 md:p-16 text-center overflow-hidden"
        >
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Ready to Strengthen Your Security?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Join leading financial institutions protecting their infrastructure with FinClean.
            Start your 14-day free trial today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="btn-shine bg-primary hover:bg-primary/90 text-white text-base h-12" asChild>
              <Link href="/register" className="flex items-center gap-2">
                Start Free Trial <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="btn-shine text-base h-12 border-primary/30 hover:bg-primary/5" asChild>
              <Link href="/login">Schedule Demo</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 md:py-16 mt-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <img src="/logo2.png" alt="FinClean Logo" className='h-8 w-auto' />
              </div>
              <p className="text-sm text-muted-foreground">
                Intelligent vulnerability management for financial institutions.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Security</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Compliance</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 FinClean. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Securing financial infrastructure worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}