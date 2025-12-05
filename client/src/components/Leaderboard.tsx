import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Shield, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Mock data for leaderboard
const mockProjects = [
  { id: '1', name: 'DeFi Protocol', description: 'Decentralized lending platform', score: 98, language: 'Solidity', vulnerabilities: 0, lastAudit: '2 days ago' },
  { id: '2', name: 'NFT Marketplace', description: 'Digital collectibles exchange', score: 95, language: 'Rust', vulnerabilities: 1, lastAudit: '5 days ago' },
  { id: '3', name: 'DAO Governance', description: 'On-chain voting system', score: 92, language: 'Solidity', vulnerabilities: 2, lastAudit: '1 week ago' },
];

const getRankColor = (rank: number) => {
  switch (rank) {
    case 1:
      return 'from-yellow-400 to-yellow-600';
    case 2:
      return 'from-gray-300 to-gray-500';
    case 3:
      return 'from-orange-400 to-orange-600';
    default:
      return 'from-[#59d7b5] to-[#5f6dfa]';
  }
};

const getRankIcon = (rank: number) => {
  if (rank <= 3) {
    return <Trophy className="w-6 h-6" />;
  }
  return null;
};

export default function Leaderboard() {
  return (
    <section id="leaderboard" className="py-24 bg-gradient-to-b from-[#231942] to-[#0a0f22]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-[#59d7b5] to-[#5f6dfa] bg-clip-text text-transparent font-mono"
          >
            Top Audited Projects
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto"
          >
            Community projects with the highest security scores
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {mockProjects.map((project, index) => {
            const rank = index + 1;
            const isTopThree = rank <= 3;
            
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={cn(
                  'relative',
                  isTopThree && 'md:col-span-1'
                )}
              >
                <Card className={cn(
                  'bg-[#1a1f3a] border-[#59d7b5]/20 p-6 h-full transition-all duration-300',
                  'hover:border-[#59d7b5]/50 hover:shadow-[0_0_30px_rgba(89,215,181,0.3)]',
                  isTopThree && rank === 1 && 'md:scale-105'
                )}>
                  {/* Rank Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn(
                      'flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r text-white font-bold text-sm',
                      `bg-gradient-to-r ${getRankColor(rank)}`
                    )}>
                      {getRankIcon(rank)}
                      <span className="font-mono">#{rank}</span>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs border-[#59d7b5]/30 text-[#59d7b5]">
                      {project.language}
                    </Badge>
                  </div>

                  {/* Project Info */}
                  <h3 className="text-2xl font-bold text-white mb-2 font-mono">{project.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{project.description}</p>

                  {/* Score Display */}
                  <div className="mb-4 p-4 bg-gradient-to-r from-[#59d7b5]/10 to-[#5f6dfa]/10 rounded-lg border border-[#59d7b5]/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-[#59d7b5]" />
                        <span className="text-sm text-gray-400 font-mono">Security Score</span>
                      </div>
                      <div className="text-3xl font-bold text-[#59d7b5] font-mono">
                        {project.score}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-[#0a0f22] rounded border border-[#59d7b5]/10">
                      <div className="text-2xl font-bold text-[#59d7b5] font-mono">{project.vulnerabilities}</div>
                      <div className="text-xs text-gray-400 font-mono mt-1">Vulnerabilities</div>
                    </div>
                    <div className="text-center p-3 bg-[#0a0f22] rounded border border-[#59d7b5]/10">
                      <div className="text-sm font-bold text-white font-mono">{project.lastAudit}</div>
                      <div className="text-xs text-gray-400 font-mono mt-1">Last Audit</div>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <button className="w-full py-2 bg-gradient-to-r from-[#59d7b5] to-[#5f6dfa] hover:from-[#59d7b5]/90 hover:to-[#5f6dfa]/90 text-white font-bold rounded font-mono text-sm transition-all flex items-center justify-center gap-2">
                    View Details
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-12"
        >
          <button className="px-8 py-3 border border-[#59d7b5] text-[#59d7b5] hover:bg-[#59d7b5]/10 font-mono transition-all rounded">
            View All Projects
          </button>
        </motion.div>
      </div>
    </section>
  );
}


