import { motion } from 'framer-motion';
import { Zap, Shield, Lock, CheckCircle, Brain, Network } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Brain,
    title: 'Multi-LLM Consensus Engine',
    description: 'Coordinate GPT-4, Claude-3, and Gemini for comprehensive security analysis with consensus scoring',
    color: 'from-[#59d7b5] to-[#5f6dfa]',
    delay: 0.1
  },
  {
    icon: Zap,
    title: 'Real-Time Vulnerability Detection',
    description: 'Instant security scanning with severity classification and automated risk assessment',
    color: 'from-[#5f6dfa] to-[#59d7b5]',
    delay: 0.2
  },
  {
    icon: Shield,
    title: 'Blockchain Security Attestation',
    description: 'Immutable audit records anchored on Avalanche, Base, and Solana via NullShot Protocol',
    color: 'from-[#59d7b5] to-[#5f6dfa]',
    delay: 0.3
  },
  {
    icon: CheckCircle,
    title: 'Automated Fix Recommendations',
    description: 'AI-powered suggestions with code examples and best practices for each vulnerability',
    color: 'from-[#5f6dfa] to-[#59d7b5]',
    delay: 0.4
  }
];

export default function FeaturesGrid() {
  return (
    <section id="features" className="py-24 bg-gradient-to-b from-[#0a0f22] to-[#231942]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-[#59d7b5] to-[#5f6dfa] bg-clip-text text-transparent font-mono"
          >
            Powerful Security Features
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto"
          >
            Comprehensive AI security evaluation with multi-model orchestration
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: feature.delay }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group"
            >
              <Card className={cn(
                'bg-[#1a1f3a] border-[#59d7b5]/20 p-8 h-full transition-all duration-300',
                'hover:border-[#59d7b5]/50 hover:shadow-[0_0_30px_rgba(89,215,181,0.3)]'
              )}>
                <div className={cn(
                  'w-16 h-16 rounded-lg bg-gradient-to-br flex items-center justify-center mb-6',
                  `bg-gradient-to-br ${feature.color}`
                )}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 font-mono group-hover:text-[#59d7b5] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Animated border effect */}
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className={cn(
                    'absolute inset-0 rounded-lg bg-gradient-to-r opacity-20 blur-xl',
                    feature.color
                  )} />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


