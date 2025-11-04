import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Mock Plug Wallet connection
  const handlePlugWallet = async () => {
    setLoading(true);
    try {
      // Simulate Plug wallet connection delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock principal ID (ICP format)
      const mockPrincipalId = 'rrkah-fqaaa-aaaaa-aaaaq-cai';
      
      // Create mock user session with Supabase
      const { error } = await supabase.auth.signInWithPassword({
        email: `${mockPrincipalId}@icp.mock`,
        password: 'mock-plug-session',
      });

      if (error) {
        // If user doesn't exist, create it
        const { error: signUpError } = await supabase.auth.signUp({
          email: `${mockPrincipalId}@icp.mock`,
          password: 'mock-plug-session',
        });
        if (signUpError) throw signUpError;
      }

      toast.success('Connected to Plug Wallet!');
      navigate('/');
    } catch (error: any) {
      toast.error('Failed to connect Plug Wallet');
    } finally {
      setLoading(false);
    }
  };

  // Mock Internet Identity connection
  const handleInternetIdentity = async () => {
    setLoading(true);
    try {
      // Simulate II authentication delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock anchor number
      const mockAnchor = Math.floor(Math.random() * 100000);
      const mockPrincipalId = `ii-${mockAnchor}-principal`;
      
      // Create mock user session
      const { error } = await supabase.auth.signInWithPassword({
        email: `${mockPrincipalId}@ii.mock`,
        password: 'mock-ii-session',
      });

      if (error) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: `${mockPrincipalId}@ii.mock`,
          password: 'mock-ii-session',
        });
        if (signUpError) throw signUpError;
      }

      toast.success(`Authenticated with Internet Identity #${mockAnchor}`);
      navigate('/');
    } catch (error: any) {
      toast.error('Failed to authenticate with Internet Identity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4">
      <div className="max-w-md w-full bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Arbitra</h1>
          <p className="text-gray-600">Connect with Internet Computer</p>
        </div>

        <div className="space-y-4">
          {/* Plug Wallet Button */}
          <button
            onClick={handlePlugWallet}
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-4 px-6 rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg flex items-center justify-center gap-3 group"
          >
            <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 7h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 4h4v3h-4V4zm10 16H4V9h16v11z"/>
              <circle cx="12" cy="15" r="2"/>
            </svg>
            {loading ? 'Connecting...' : 'Connect with Plug Wallet'}
          </button>

          {/* Internet Identity Button */}
          <button
            onClick={handleInternetIdentity}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg flex items-center justify-center gap-3 group"
          >
            <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            {loading ? 'Authenticating...' : 'Internet Identity'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500">
            Powered by Internet Computer Protocol
          </p>
          <div className="flex justify-center gap-2 mt-2">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-gray-400">Mainnet Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
