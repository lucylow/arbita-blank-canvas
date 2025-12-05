import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Shield, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WalletConnect from '@/components/contracts/WalletConnect';
import { cn } from '@/lib/utils';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        isScrolled
          ? 'bg-[#0a0f22]/98 backdrop-blur-xl border-b border-[#59d7b5]/30 shadow-lg shadow-black/50'
          : 'bg-transparent'
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-[#59d7b5] to-[#5f6dfa] rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-lg group-hover:shadow-[#59d7b5]/50">
              <Shield className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold font-mono text-white">
                NULL<span className="text-[#59d7b5]">AUDIT</span>
              </span>
              <span className="text-xs text-gray-400 font-mono">Multi-LLM Security</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-gray-300 hover:text-[#59d7b5] transition-all duration-300 font-mono text-sm hover:scale-105 relative group"
            >
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#59d7b5] group-hover:w-full transition-all duration-300" />
            </button>
            <button
              onClick={() => scrollToSection('demo')}
              className="text-gray-300 hover:text-[#59d7b5] transition-all duration-300 font-mono text-sm hover:scale-105 relative group"
            >
              Demo
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#59d7b5] group-hover:w-full transition-all duration-300" />
            </button>
            <button
              onClick={() => scrollToSection('leaderboard')}
              className="text-gray-300 hover:text-[#59d7b5] transition-all duration-300 font-mono text-sm hover:scale-105 relative group"
            >
              Leaderboard
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#59d7b5] group-hover:w-full transition-all duration-300" />
            </button>
            <Link href="https://github.com/lucylow/deleteee" target="_blank" className="text-gray-300 hover:text-[#59d7b5] transition-all duration-300 font-mono text-sm hover:scale-105 relative group">
              GitHub
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#59d7b5] group-hover:w-full transition-all duration-300" />
            </Link>
            <WalletConnect />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-4 border-t border-gray-800 mt-4 pt-4">
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left text-gray-300 hover:text-[#59d7b5] transition-colors font-mono text-sm"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('demo')}
              className="block w-full text-left text-gray-300 hover:text-[#59d7b5] transition-colors font-mono text-sm"
            >
              Demo
            </button>
            <button
              onClick={() => scrollToSection('leaderboard')}
              className="block w-full text-left text-gray-300 hover:text-[#59d7b5] transition-colors font-mono text-sm"
            >
              Leaderboard
            </button>
            <Link
              href="https://github.com/lucylow/deleteee"
              target="_blank"
              className="block text-gray-300 hover:text-[#59d7b5] transition-colors font-mono text-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              GitHub
            </Link>
            <div className="pt-2">
              <WalletConnect />
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

