import { useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Github, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function HeroSection() {
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create floating particles
    if (!particlesRef.current) return;
    
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.width = `${Math.random() * 4 + 2}px`;
      particle.style.height = particle.style.width;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${Math.random() * 8}s`;
      particle.style.animationDuration = `${Math.random() * 4 + 6}s`;
      particlesRef.current.appendChild(particle);
    }

    return () => {
      if (particlesRef.current) {
        particlesRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#231942] via-[#0a0f22] to-[#231942] animate-gradient" />
      
      {/* Floating Particles */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Animated Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#59d7b5]/10 border border-[#59d7b5]/30 rounded-full mb-8 backdrop-blur-sm hover:bg-[#59d7b5]/20 transition-all duration-300 hover:scale-105 cursor-default"
          >
            <Zap className="w-4 h-4 text-[#59d7b5] animate-pulse" />
            <span className="text-sm font-mono text-[#59d7b5]">AI-Powered Security Evaluation</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-white via-[#59d7b5] to-[#5f6dfa] bg-clip-text text-transparent">
              Null Audit
            </span>
            <br />
            <span className="text-white">Multi-LLM Security</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto mb-4 font-mono"
          >
            Automated security audits with multi-model consensus
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto mb-12"
          >
            Powered by GPT-4, Claude-3, and Gemini. Get comprehensive security analysis with blockchain-attested results.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              size="lg"
              onClick={() => {
                const element = document.getElementById('demo');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="bg-gradient-to-r from-[#59d7b5] to-[#5f6dfa] hover:from-[#59d7b5]/90 hover:to-[#5f6dfa]/90 text-white font-bold px-8 py-6 text-lg font-mono group shadow-lg hover:shadow-xl hover:shadow-[#59d7b5]/50 transition-all duration-300 hover:scale-105"
            >
              Try Live Demo
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
            <Link href="https://github.com/lucylow/deleteee" target="_blank">
              <Button
                size="lg"
                variant="outline"
                className="border-[#59d7b5] text-[#59d7b5] hover:bg-[#59d7b5]/10 px-8 py-6 text-lg font-mono group shadow-md hover:shadow-lg hover:shadow-[#59d7b5]/30 transition-all duration-300 hover:scale-105"
              >
                <Github className="mr-2 w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                View GitHub Repo
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto"
          >
            {[
              { label: 'LLM Models', value: '3' },
              { label: 'Security Score', value: '94%' },
              { label: 'Projects Audited', value: '1,234+' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + i * 0.1, duration: 0.5 }}
                className="text-center group cursor-default"
              >
                <div className="text-4xl font-bold text-[#59d7b5] font-mono mb-2 transition-all duration-300 group-hover:scale-110 group-hover:text-[#5f6dfa]">{stat.value}</div>
                <div className="text-sm text-gray-400 font-mono transition-colors duration-300 group-hover:text-gray-300">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-[#59d7b5]/50 rounded-full flex items-start justify-center p-2"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-3 bg-[#59d7b5] rounded-full"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

