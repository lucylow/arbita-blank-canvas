import { useState, useCallback } from 'react';
import { Vulnerability, SecurityScanResult } from '@/data/mockData';
import { mockVulnerabilities } from '@/data/mockData';

export interface ScanProgress {
  stage: 'idle' | 'analyzing' | 'llm_processing' | 'consensus' | 'attestation' | 'complete';
  progress: number; // 0-100
  message: string;
}

export function useSecurityScan() {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress>({
    stage: 'idle',
    progress: 0,
    message: 'Ready to scan'
  });
  const [result, setResult] = useState<SecurityScanResult | null>(null);

  const scanCode = useCallback(async (code: string, language: string = 'javascript') => {
    setIsScanning(true);
    setResult(null);
    
    // Simulate multi-stage scanning process
    const stages: ScanProgress[] = [
      { stage: 'analyzing', progress: 10, message: 'Parsing code structure...' },
      { stage: 'llm_processing', progress: 30, message: 'GPT-4 analyzing vulnerabilities...' },
      { stage: 'llm_processing', progress: 50, message: 'Claude-3 evaluating security...' },
      { stage: 'llm_processing', progress: 70, message: 'Gemini cross-referencing findings...' },
      { stage: 'consensus', progress: 85, message: 'Calculating LLM consensus scores...' },
      { stage: 'attestation', progress: 95, message: 'Preparing blockchain attestation...' },
      { stage: 'complete', progress: 100, message: 'Security scan complete!' }
    ];

    for (const stage of stages) {
      setProgress(stage);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Generate mock results based on code content
    const detectedVulns = detectVulnerabilities(code, language);
    
    // Calculate security score
    const score = calculateSecurityScore(detectedVulns);
    
    // Generate mock blockchain attestation
    const attestation = generateMockAttestation();

    const scanResult: SecurityScanResult = {
      projectId: `scan-${Date.now()}`,
      score,
      vulnerabilities: detectedVulns,
      blockchainAttestation: attestation
    };

    setResult(scanResult);
    setIsScanning(false);
  }, []);

  const reset = useCallback(() => {
    setIsScanning(false);
    setResult(null);
    setProgress({
      stage: 'idle',
      progress: 0,
      message: 'Ready to scan'
    });
  }, []);

  return {
    isScanning,
    progress,
    result,
    scanCode,
    reset
  };
}

// Helper function to detect vulnerabilities in code
function detectVulnerabilities(code: string, language: string): Vulnerability[] {
  const detected: Vulnerability[] = [];
  const lowerCode = code.toLowerCase();

  // SQL Injection detection
  if (lowerCode.includes('select') && lowerCode.includes('+') && lowerCode.includes('where')) {
    detected.push(mockVulnerabilities[0]);
  }

  // Hardcoded secret detection
  if (lowerCode.includes('api_key') || lowerCode.includes('secret') || lowerCode.includes('password') && lowerCode.includes('=')) {
    if (lowerCode.includes('"') || lowerCode.includes("'")) {
      detected.push(mockVulnerabilities[1]);
    }
  }

  // XSS detection
  if (lowerCode.includes('innerhtml') || lowerCode.includes('dangerouslysetinnerhtml')) {
    detected.push(mockVulnerabilities[2]);
  }

  // Weak crypto detection
  if (lowerCode.includes('md5') || lowerCode.includes('sha1')) {
    detected.push(mockVulnerabilities[3]);
  }

  // Reentrancy detection (Solidity)
  if (language === 'solidity' && lowerCode.includes('call') && lowerCode.includes('value')) {
    detected.push(mockVulnerabilities[4]);
  }

  // If no specific vulnerabilities found, return a random one for demo
  if (detected.length === 0 && code.length > 50) {
    detected.push(mockVulnerabilities[Math.floor(Math.random() * mockVulnerabilities.length)]);
  }

  return detected;
}

// Calculate security score based on vulnerabilities
function calculateSecurityScore(vulnerabilities: Vulnerability[]): number {
  if (vulnerabilities.length === 0) return 100;
  
  let score = 100;
  for (const vuln of vulnerabilities) {
    switch (vuln.severity) {
      case 'critical':
        score -= 20;
        break;
      case 'high':
        score -= 10;
        break;
      case 'medium':
        score -= 5;
        break;
      case 'low':
        score -= 2;
        break;
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

// Generate mock blockchain attestation
function generateMockAttestation(): SecurityScanResult['blockchainAttestation'] {
  const chains: Array<'avalanche' | 'base' | 'solana'> = ['avalanche', 'base', 'solana'];
  const chain = chains[Math.floor(Math.random() * chains.length)];
  
  // Generate mock transaction hash
  const txHash = '0x' + Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

  return {
    chain,
    txHash,
    timestamp: new Date().toISOString(),
    status: 'success'
  };
}


