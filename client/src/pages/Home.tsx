import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CodeDemo from "@/components/CodeDemo";
import FeaturesGrid from "@/components/FeaturesGrid";
import Leaderboard from "@/components/Leaderboard";
import LiveAttestation from "@/components/LiveAttestation";
import { Link } from "wouter";
import { Github, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#231942] via-[#0a0f22] to-[#231942] text-white">
      <Header />
      <HeroSection />
      <CodeDemo />
      <FeaturesGrid />
      <Leaderboard />
      <LiveAttestation />
      
      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-[#0a0f22] to-[#231942] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(89,215,181,0.1),transparent_50%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-gradient-to-r from-[#59d7b5]/10 to-[#5f6dfa]/10 border border-[#59d7b5]/30 rounded-lg p-12 text-center backdrop-blur-sm hover:border-[#59d7b5]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[#59d7b5]/20">
            <h2 className="text-3xl sm:text-4xl font-bold font-mono mb-4 bg-gradient-to-r from-[#59d7b5] to-[#5f6dfa] bg-clip-text text-transparent">
              READY TO SECURE YOUR AI?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Start auditing your AI systems today with NullAudit's comprehensive security platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#59d7b5] to-[#5f6dfa] hover:from-[#59d7b5]/90 hover:to-[#5f6dfa]/90 text-white font-bold px-8 py-6 text-lg font-mono group shadow-lg hover:shadow-xl hover:shadow-[#59d7b5]/50"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </Link>
              <Link href="https://github.com/lucylow/deleteee" target="_blank">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-[#59d7b5] text-[#59d7b5] hover:bg-[#59d7b5]/10 px-8 py-6 text-lg font-mono group shadow-md hover:shadow-lg hover:shadow-[#59d7b5]/30"
                >
                  <Github className="mr-2 w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                  View GitHub
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#59d7b5]/20 py-8 bg-[#0a0f22]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400 font-mono text-sm">
            <p>NULLAUDIT v3.0 - Powered by NullShot Protocol</p>
            <p className="mt-2">Multi-LLM Security & Evaluation Agent</p>
            <div className="mt-4 flex items-center justify-center gap-4">
              <Link
                href="https://github.com/lucylow/deleteee"
                target="_blank"
                className="text-[#59d7b5] hover:text-[#5f6dfa] transition-colors"
              >
                <Github className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
