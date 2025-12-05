/**
 * Centralized Mock Data Service
 * Provides realistic mock data generation for development and demonstration
 */

import type { HumanTask } from '../../shared/hitl-types.js';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'debug';
  component: string;
  message: string;
  metadata?: Record<string, unknown>;
}

// Security finding types and templates with detailed information
const SECURITY_FINDING_TYPES = [
  { 
    type: 'SQL Injection', 
    severity: 'critical', 
    patterns: ['direct string concatenation', 'no sanitization', 'no prepared statements', 'dynamic query construction'],
    description: 'User input is directly concatenated into SQL queries without parameterization, allowing attackers to inject malicious SQL code.',
    impact: 'Full database compromise - read, modify, or delete any data. Potential for complete system takeover.',
    remediation: 'Use parameterized queries or prepared statements. Implement input validation and least-privilege database access.'
  },
  { 
    type: 'Insecure Authentication', 
    severity: 'high', 
    patterns: ['MD5 used', 'no salt', 'weak algorithm', 'SHA1 for passwords', 'insufficient iterations'],
    description: 'Weak cryptographic algorithms or missing security measures in password storage and authentication mechanisms.',
    impact: 'Passwords can be cracked using rainbow tables or brute force. Account takeover possible.',
    remediation: 'Use bcrypt, argon2id, or scrypt with appropriate cost factors. Implement password complexity requirements.'
  },
  { 
    type: 'XSS Vulnerability', 
    severity: 'high', 
    patterns: ['unsanitized user input', 'innerHTML usage', 'reflected input', 'dangerouslySetInnerHTML', 'eval() with user data'],
    description: 'User-controlled data is rendered in HTML without proper sanitization, allowing script injection.',
    impact: 'Session hijacking, credential theft, unauthorized actions on behalf of users, phishing attacks.',
    remediation: 'Sanitize all user input. Use Content Security Policy. Prefer textContent over innerHTML. Use DOMPurify for HTML sanitization.'
  },
  { 
    type: 'CSRF Vulnerability', 
    severity: 'medium', 
    patterns: ['missing CSRF token', 'no origin check', 'state-changing operations', 'no SameSite cookie attribute'],
    description: 'State-changing operations lack protection against cross-site request forgery attacks.',
    impact: 'Attackers can trick authenticated users into performing unintended actions like changing passwords or transferring funds.',
    remediation: 'Implement CSRF tokens. Validate Origin/Referer headers. Use SameSite cookie attribute. Consider double-submit cookie pattern.'
  },
  { 
    type: 'Sensitive Data Exposure', 
    severity: 'critical', 
    patterns: ['plaintext passwords', 'API keys in code', 'exposed credentials', 'secrets in logs', 'unencrypted sensitive data'],
    description: 'Sensitive information like passwords, API keys, or tokens are exposed in code, logs, or error messages.',
    impact: 'Complete system compromise. Unauthorized access to external services. Data breaches. Financial loss.',
    remediation: 'Move secrets to environment variables or secrets management. Encrypt sensitive data at rest. Remove secrets from logs and error messages.'
  },
  { 
    type: 'Broken Access Control', 
    severity: 'high', 
    patterns: ['missing authorization', 'privilege escalation', 'direct object reference', 'no role checks', 'horizontal privilege escalation'],
    description: 'Insufficient authorization checks allow users to access resources or perform actions beyond their permissions.',
    impact: 'Unauthorized data access, privilege escalation, data modification or deletion, complete system compromise.',
    remediation: 'Implement role-based access control (RBAC). Verify permissions on every request. Use principle of least privilege.'
  },
  { 
    type: 'Security Misconfiguration', 
    severity: 'medium', 
    patterns: ['default credentials', 'exposed debug info', 'missing security headers', 'verbose error messages', 'unnecessary services enabled'],
    description: 'Insecure default configurations, missing security headers, or exposed debugging information.',
    impact: 'Information disclosure, easier exploitation of other vulnerabilities, reduced attack surface requirements.',
    remediation: 'Remove default credentials. Disable debug mode in production. Implement security headers (CSP, HSTS, etc.). Regular security reviews.'
  },
  { 
    type: 'Insecure Deserialization', 
    severity: 'high', 
    patterns: ['unvalidated deserialization', 'remote code execution risk', 'insecure libraries', 'pickle usage', 'untrusted data'],
    description: 'Untrusted data is deserialized without validation, potentially allowing remote code execution or object injection.',
    impact: 'Remote code execution, complete server compromise, data exfiltration, lateral movement in network.',
    remediation: 'Avoid deserializing untrusted data. Use safe formats like JSON with schema validation. Implement integrity checks.'
  },
  { 
    type: 'Server-Side Request Forgery (SSRF)', 
    severity: 'high', 
    patterns: ['unvalidated URLs', 'internal network access', 'cloud metadata endpoints', 'no URL whitelist'],
    description: 'User-controlled URLs are used to make server-side HTTP requests without validation, allowing access to internal services.',
    impact: 'Access to internal services, cloud metadata exposure, port scanning, potential credential theft.',
    remediation: 'Validate and whitelist allowed URLs. Block private IP ranges. Use URL parsing libraries. Implement network segmentation.'
  },
  { 
    type: 'Path Traversal', 
    severity: 'high', 
    patterns: ['../ in filenames', 'no path validation', 'absolute path usage', 'directory traversal'],
    description: 'User-controlled file paths allow access to files outside intended directories through directory traversal sequences.',
    impact: 'Read arbitrary files including configuration, source code, or credentials. Potential for complete system compromise.',
    remediation: 'Validate and sanitize file paths. Use path.basename(). Resolve paths relative to base directory. Whitelist allowed extensions.'
  },
  { 
    type: 'Reentrancy Attack', 
    severity: 'critical', 
    patterns: ['external call before state update', 'no reentrancy guard', 'checks-effects-interactions violation'],
    description: 'Smart contract functions make external calls before updating state, allowing recursive calls to drain funds.',
    impact: 'Complete fund drainage. Similar to DAO hack. Financial loss. Contract compromise.',
    remediation: 'Use checks-effects-interactions pattern. Update state before external calls. Use ReentrancyGuard modifier. Consider pull payment pattern.'
  },
  { 
    type: 'Command Injection', 
    severity: 'critical', 
    patterns: ['user input in shell commands', 'system() calls', 'exec() with user data', 'no input validation'],
    description: 'User input is directly used in system commands without validation, allowing arbitrary command execution.',
    impact: 'Complete server compromise. Remote code execution. Data exfiltration. Lateral movement.',
    remediation: 'Avoid shell commands when possible. Use whitelist validation. Use parameterized command execution. Implement least privilege.'
  },
];

const CODE_LOCATIONS = [
  'src/api/users.ts',
  'src/api/files.ts',
  'src/api/webhook.ts',
  'src/api/data.ts',
  'src/auth/password.ts',
  'src/auth/session.ts',
  'src/auth/oauth.ts',
  'src/middleware/auth.ts',
  'src/middleware/csrf.ts',
  'src/middleware/rateLimit.ts',
  'src/routes/admin.ts',
  'src/routes/user.ts',
  'src/routes/payment.ts',
  'src/utils/crypto.ts',
  'src/utils/validation.ts',
  'src/db/queries.ts',
  'src/db/migrations.ts',
  'src/services/payment.ts',
  'src/services/email.ts',
  'src/services/storage.ts',
  'src/lib/validator.ts',
  'src/lib/serializer.ts',
  'src/lib/fileHandler.ts',
  'contracts/Vault.sol',
  'contracts/Token.sol',
  'contracts/Marketplace.sol',
  'contracts/Staking.sol',
];

const AUDIT_MODELS = [
  'GPT-4o',
  'Claude 3 Opus',
  'Llama 3 70B',
  'Mistral Large',
  'GPT-3.5 Turbo',
  'Grok-1',
  'Gemini Pro 1.5',
  'Custom Finetune v2',
  'Internal Dev Model',
];

const AUDIT_TYPES = [
  'Full Security Suite',
  'Prompt Injection',
  'PII Leakage',
  'Bias & Toxicity',
  'Jailbreak Resistance',
  'Hallucination Check',
  'Data Exfiltration',
  'Adversarial Attack',
];

const AGENT_NAMES = [
  'PEN-TESTER ALPHA',
  'FACT-CHECKER BETA',
  'BIAS-AUDITOR GAMMA',
  'HITL-COORDINATOR',
  'SECURITY-SCANNER DELTA',
  'COMPLIANCE-CHECKER EPSILON',
];

/**
 * Generate a random human task
 */
export function generateMockTask(overrides: Partial<HumanTask> = {}): HumanTask {
  const finding = SECURITY_FINDING_TYPES[Math.floor(Math.random() * SECURITY_FINDING_TYPES.length)];
  const location = CODE_LOCATIONS[Math.floor(Math.random() * CODE_LOCATIONS.length)];
  const line = Math.floor(Math.random() * 200) + 1;
  const confidence = Math.random() * 0.4 + 0.5; // 50-90%
  const priority = finding.severity === 'critical' ? 'critical' : 
                   finding.severity === 'high' ? 'high' :
                   finding.severity === 'medium' ? 'medium' : 'low';
  
  const taskId = `hitl_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  const codeSnippets = {
    'SQL Injection': `async function getUserById(userId: string) {
  const query = \`SELECT * FROM users WHERE id = \${userId}\`;
  return await db.query(query);
}`,
    'Insecure Authentication': `import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('md5').update(password).digest('hex');
}`,
    'XSS Vulnerability': `function renderUserProfile(user) {
  return (
    <div>
      <h1>{user.name}</h1>
      <div dangerouslySetInnerHTML={{ __html: user.bio }} />
    </div>
  );
}`,
    'CSRF Vulnerability': `app.post('/api/transfer', async (req, res) => {
  const { amount, recipient } = req.body;
  // Missing CSRF token validation
  await transferFunds(req.user.id, recipient, amount);
  res.json({ success: true });
});`,
    'Sensitive Data Exposure': `const config = {
  apiKey: 'sk_live_1234567890abcdef',
  secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
};

console.log('Config loaded:', config);`,
    'Broken Access Control': `router.get('/api/admin/users', async (req, res) => {
  // Missing authorization check
  const users = await db.query('SELECT * FROM users');
  res.json(users);
});`,
    'Security Misconfiguration': `if (process.env.NODE_ENV === 'development') {
  app.use('/debug', debugRouter);
  app.use(express.static('private'));
}`,
    'Insecure Deserialization': `app.post('/api/data', (req, res) => {
  const data = eval('(' + req.body.data + ')');
  // Process data...
});`,
    'Server-Side Request Forgery (SSRF)': `async function validateWebhook(url: string) {
  const response = await fetch(url);
  return response.ok;
}`,
    'Path Traversal': `app.get('/api/files/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  res.sendFile(filePath);
});`,
    'Reentrancy Attack': `function withdrawFunds(uint256 amount) public {
  require(balances[msg.sender] >= amount);
  (bool success, ) = msg.sender.call{value: amount}("");
  require(success);
  balances[msg.sender] -= amount; // State updated after external call
}`,
    'Command Injection': `function executeCommand(userInput) {
  const command = \`npm install \${userInput}\`;
  exec(command);
}`,
  };

  const cveMap: Record<string, string> = {
    'SQL Injection': 'CWE-89',
    'Insecure Authentication': 'CWE-327',
    'XSS Vulnerability': 'CWE-79',
    'CSRF Vulnerability': 'CWE-352',
    'Sensitive Data Exposure': 'CWE-798',
    'Broken Access Control': 'CWE-284',
    'Security Misconfiguration': 'CWE-16',
    'Insecure Deserialization': 'CWE-502',
    'Server-Side Request Forgery (SSRF)': 'CWE-918',
    'Path Traversal': 'CWE-22',
    'Reentrancy Attack': 'CWE-841',
    'Command Injection': 'CWE-78',
  };

  const cvssScores: Record<string, number> = {
    'critical': 9.0 + Math.random() * 0.8,
    'high': 7.0 + Math.random() * 1.0,
    'medium': 5.0 + Math.random() * 1.0,
    'low': 3.0 + Math.random() * 1.0,
  };

  const task: HumanTask = {
    id: taskId,
    type: Math.random() > 0.7 ? 'approval' : 'review',
    priority: priority as any,
    title: `Review: ${finding.type} - ${finding.severity.toUpperCase()} Severity`,
    description: `Security finding requires human review:

**Type:** ${finding.type}
**Severity:** ${finding.severity}
**CVE:** ${cveMap[finding.type] || 'N/A'}
**CVSS Score:** ${cvssScores[finding.severity].toFixed(1)}/10.0
**Confidence:** ${(confidence * 100).toFixed(1)}%
**Risk Level:** ${finding.severity === 'critical' ? 'CRITICAL' : finding.severity.toUpperCase()}
**Location:** ${location}:${line}
**Affected Lines:** ${line}-${line + Math.floor(Math.random() * 5) + 1}

**Description:**
${finding.description || `Potential ${finding.type.toLowerCase()} vulnerability detected in code.`}

**Impact:**
${finding.impact || 'This vulnerability could lead to security compromise.'}

**Evidence:**
${finding.patterns.map(p => `- ${p}`).join('\n')}

**Remediation:**
${finding.remediation || 'Review the code and implement appropriate security measures.'}

**Code Context:**
\`\`\`
${codeSnippets[finding.type as keyof typeof codeSnippets] || 'N/A'}
\`\`\`

**Action Required:**
Please review and confirm if this finding is valid and requires action. If confirmed, prioritize remediation based on severity and impact.`,
    metadata: {
      agentId: AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)],
      sessionId: `audit_${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      confidenceScore: confidence,
      context: {
        cve: cveMap[finding.type],
        cvssScore: cvssScores[finding.severity],
        remediationTime: finding.severity === 'critical' ? '2-4 hours' : 
                        finding.severity === 'high' ? '4-8 hours' : 
                        finding.severity === 'medium' ? '1-2 days' : '2-3 days',
        affectedComponent: location.split('/').pop() || location,
      },
    },
    payload: {
      type: finding.type,
      severity: finding.severity,
      confidenceScore: confidence,
      evidence: finding.patterns,
      context: {
        codeSnippet: codeSnippets[finding.type as keyof typeof codeSnippets] || 'N/A',
        file: location,
        line: line,
        cve: cveMap[finding.type],
        cvssScore: cvssScores[finding.severity],
        description: finding.description,
        impact: finding.impact,
        remediation: finding.remediation,
      },
    },
    status: 'pending',
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    assignedTo: undefined,
    ...overrides,
  };

  return task;
}

/**
 * Generate multiple mock tasks
 */
export function generateMockTasks(count: number): HumanTask[] {
  return Array.from({ length: count }, () => generateMockTask());
}

/**
 * Generate mock audit report data
 */
export function generateMockReport(overrides: any = {}) {
  const model = AUDIT_MODELS[Math.floor(Math.random() * AUDIT_MODELS.length)];
  const type = AUDIT_TYPES[Math.floor(Math.random() * AUDIT_TYPES.length)];
  const score = Math.floor(Math.random() * 60) + 40; // 40-100
  const vulnerabilities = score > 90 ? Math.floor(Math.random() * 2) :
                          score > 70 ? Math.floor(Math.random() * 5) + 1 :
                          Math.floor(Math.random() * 15) + 5;
  const status = score >= 90 ? 'PASSED' : score >= 70 ? 'WARNING' : 'FAILED';
  
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 30));
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  date.setSeconds(Math.floor(Math.random() * 60));

  const criticalVulns = Math.floor(vulnerabilities * 0.2);
  const highVulns = Math.floor(vulnerabilities * 0.3);
  const mediumVulns = Math.floor(vulnerabilities * 0.4);
  const lowVulns = vulnerabilities - criticalVulns - highVulns - mediumVulns;

  const duration = Math.floor(Math.random() * 300) + 60; // 60-360 seconds
  const testsRun = Math.floor(Math.random() * 500) + 100;
  const testsPassed = Math.floor(testsRun * (0.85 + Math.random() * 0.1));
  const testsFailed = testsRun - testsPassed;

  const projectNames = [
    'SecureDeFi Protocol',
    'AuthGuard API',
    'CryptoWallet Mobile',
    'SecureBank Core',
    'MedSecure Health',
    'CloudGuard Infrastructure',
    'PaymentGateway Pro',
    'IoT Security Hub',
    'Blockchain Explorer',
    'ZeroTrust Network',
  ];

  return {
    id: `AUD-2025-${String(Math.floor(Math.random() * 9000) + 1000).padStart(3, '0')}`,
    date: date.toISOString().replace('T', ' ').substring(0, 19),
    target: model,
    type: type,
    score: score,
    status: status,
    vulnerabilities: vulnerabilities,
    criticalVulnerabilities: criticalVulns,
    highVulnerabilities: highVulns,
    mediumVulnerabilities: mediumVulns,
    lowVulnerabilities: lowVulns,
    duration: duration,
    durationFormatted: `${Math.floor(duration / 60)}m ${duration % 60}s`,
    testsRun: testsRun,
    testsPassed: testsPassed,
    testsFailed: testsFailed,
    testCoverage: Math.floor(Math.random() * 20) + 75, // 75-95%
    filesScanned: Math.floor(Math.random() * 500) + 100,
    linesOfCode: Math.floor(Math.random() * 50000) + 10000,
    projectName: projectNames[Math.floor(Math.random() * projectNames.length)],
    auditor: AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)],
    reportUrl: `https://reports.example.com/audit/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.pdf`,
    summary: `Security audit completed for ${model}. Found ${vulnerabilities} vulnerabilities (${criticalVulns} critical, ${highVulns} high, ${mediumVulns} medium, ${lowVulns} low). Overall security score: ${score}/100.`,
    recommendations: [
      'Implement input validation on all user-facing endpoints',
      'Enable Content Security Policy headers',
      'Rotate exposed API keys immediately',
      'Update dependencies to latest secure versions',
      'Implement rate limiting on authentication endpoints',
    ].slice(0, Math.floor(Math.random() * 3) + 2),
    ...overrides,
  };
}

/**
 * Generate multiple mock reports
 */
export function generateMockReports(count: number) {
  return Array.from({ length: count }, () => generateMockReport()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Generate mock activity data points
 */
export function generateActivityData(hours: number = 24) {
  const points = [];
  const now = new Date();
  
  for (let i = hours - 1; i >= 0; i--) {
    const time = new Date(now);
    time.setHours(time.getHours() - i);
    
    // Simulate activity patterns (higher during business hours)
    const hour = time.getHours();
    const baseValue = hour >= 9 && hour <= 17 ? 60 : 30;
    const variation = Math.random() * 40;
    const value = Math.floor(baseValue + variation);
    
    points.push({
      time: time.toISOString(),
      value: value,
      audits: Math.floor(Math.random() * 5),
      vulnerabilities: Math.floor(Math.random() * 3),
    });
  }
  
  return points;
}

/**
 * Generate mock dashboard stats
 */
export function generateDashboardStats() {
  const totalAudits = Math.floor(Math.random() * 100) + 800;
  const passedAudits = Math.floor(totalAudits * 0.85);
  const vulnerabilities = Math.floor(Math.random() * 20) + 5;
  const securityScore = Math.floor(Math.random() * 10) + 88;
  const pendingReviews = Math.floor(Math.random() * 5) + 1;
  
  return {
    securityScore: securityScore,
    vulnerabilities: vulnerabilities,
    auditsPassed: passedAudits,
    totalAudits: totalAudits,
    activeModels: Math.floor(Math.random() * 3) + 6,
    pendingReviews: pendingReviews,
    criticalFindings: Math.floor(Math.random() * 5) + 1,
    averageResponseTime: Math.floor(Math.random() * 200) + 180, // seconds
  };
}

/**
 * Generate mock agent status
 */
export function generateAgentStatus() {
  return AGENT_NAMES.map((name, index) => {
    const statuses = ['ATTACKING', 'VERIFYING', 'IDLE', 'MONITORING', 'ANALYZING'];
    const targets = ['GPT-4o', 'CLAUDE-3', 'MISTRAL', 'LLAMA-3', 'MULTI-LLM', 'NONE'];
    
    const isActive = Math.random() > 0.3;
    const status = isActive 
      ? statuses[Math.floor(Math.random() * (statuses.length - 1))]
      : 'IDLE';
    const load = isActive 
      ? Math.floor(Math.random() * 60) + 40
      : Math.floor(Math.random() * 20);
    
    return {
      name: name,
      status: status,
      target: status === 'IDLE' ? 'NONE' : targets[Math.floor(Math.random() * targets.length)],
      load: `${load}%`,
      uptime: Math.floor(Math.random() * 100) + 50,
    };
  });
}

/**
 * Generate mock vulnerability breakdown
 */
export function generateVulnerabilityBreakdown() {
  const types = [
    { name: 'Injection', base: 65, color: '#FF003C' },
    { name: 'Data Leak', base: 45, color: '#FF8A00' },
    { name: 'Auth Bypass', base: 30, color: '#FFFF00' },
    { name: 'DoS', base: 20, color: '#00F0FF' },
    { name: 'Misconfiguration', base: 25, color: '#FF00FF' },
    { name: 'XSS', base: 35, color: '#FF8800' },
  ];
  
  return types.map(type => ({
    name: type.name,
    value: Math.floor(type.base + (Math.random() * 20 - 10)),
    color: type.color,
  })).sort((a, b) => b.value - a.value);
}

/**
 * Generate mock system log entry (legacy format with uppercase types)
 */
export function generateSystemLogEntry() {
  const types = ['INFO', 'WARN', 'ERROR', 'SUCCESS', 'DEBUG'];
  const components = [
    'Orchestrator',
    'PenTester',
    'FactChecker',
    'NetworkLayer',
    'AuthService',
    'Database',
    'Cache',
    'Queue',
  ];
  
  const messages = [
    'Connection established with remote node at 192.168.1.45:8080.',
    'Latency spike detected (240ms) - investigating network path.',
    'Failed to authenticate user token: expired JWT signature.',
    'Audit sequence #{id} initiated for project SecureDeFi Protocol.',
    'Vulnerability scan completed. {count} threats found across 12 files.',
    'Database backup successful. Backup size: 2.3GB, stored at s3://backups/db-{timestamp}.sql.gz',
    'Rate limit exceeded for API key ending in ...9X2. Client IP: {ip}, endpoint: /api/v1/scan',
    'New model definition loaded: GPT-5-Preview. Model size: 1.2TB, parameters: 1.8T',
    'Memory usage critical: {percent}%. Triggering emergency garbage collection.',
    'Garbage collection triggered. Freed 1.2GB memory in 450ms.',
    'User login from IP {ip}. User: admin@example.com, MFA: enabled, location: San Francisco, CA',
    'Injection attempt blocked by firewall. Pattern: SQL_INJECTION, source: {ip}, blocked at WAF layer.',
    'Report generated: {reportId}.pdf. Size: 4.2MB, contains 23 findings, delivered to security@example.com',
    'Syncing with NullShot protocol... 1,234 attestations synchronized, 5 pending.',
    "Agent '{agent}' status changed to {status}. Uptime: 23h 45m, tasks processed: 1,234",
    'Task {taskId} assigned to reviewer john.doe@example.com. Priority: HIGH, ETA: 2 hours',
    'Human feedback received for task #{taskId}. Decision: CONFIRMED, severity: CRITICAL, remediation started.',
    'Audit {auditId} completed successfully. Duration: 4m 32s, findings: 12, score: 87/100',
    'HITL escalation triggered for critical finding. Finding ID: vuln-{id}, CVSS: 9.8, assigned to security team.',
    'Cache cleared for session {sessionId}. Reason: security policy update, affected: 1,234 active sessions',
    'Database query optimization completed. Query time reduced from 2.3s to 145ms for /api/users endpoint.',
    'SSL certificate renewal scheduled. Current cert expires in 15 days, renewal date: 2024-02-05',
    'Failed payment processing attempt. Amount: $1,234.56, reason: insufficient funds, user: user-{id}',
    'Security patch applied: CVE-2024-1234. Affected packages: express@4.18.0 -> 4.18.2, restart required.',
    'Backup verification completed. Integrity check: PASSED, restore test: PASSED, stored at 3 locations.',
    'API rate limit configuration updated. New limits: 1000 req/min (was 500), effective immediately.',
    'Failed database connection attempt. Retry #3/5, error: timeout after 5s, switching to replica.',
    'Webhook delivery failed. Endpoint: https://client.example.com/webhook, status: 503, retrying in 30s',
    'New security policy deployed. Policy ID: sec-pol-{id}, affects: all endpoints, enforcement: active',
    'Memory leak detected in /api/process endpoint. Memory growth: 50MB/hour, investigation started.',
    'CDN cache purge completed. Purged 12,345 files, estimated propagation time: 2-5 minutes.',
  ];
  
  const type = types[Math.floor(Math.random() * types.length)];
  const component = components[Math.floor(Math.random() * components.length)];
  let message = messages[Math.floor(Math.random() * messages.length)];
  
  // Replace placeholders
  message = message
    .replace('{id}', String(Math.floor(Math.random() * 10000)))
    .replace('{count}', String(Math.floor(Math.random() * 5)))
    .replace('{percent}', String(Math.floor(Math.random() * 20) + 80))
    .replace('{ip}', `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`)
    .replace('{reportId}', `AUD-2025-${String(Math.floor(Math.random() * 9000) + 1000).padStart(3, '0')}`)
    .replace('{agent}', AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)])
    .replace('{status}', ['ACTIVE', 'IDLE', 'ERROR'][Math.floor(Math.random() * 3)])
    .replace('{taskId}', `hitl_${Math.floor(Math.random() * 1000)}`)
    .replace('{auditId}', `AUD-2025-${String(Math.floor(Math.random() * 9000) + 1000).padStart(3, '0')}`)
    .replace('{sessionId}', `session_${Math.floor(Math.random() * 10000)}`);
  
  return {
    id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    timestamp: new Date().toISOString(),
    type: type,
    component: component,
    message: message,
  };
}

const LOG_TYPES = ['info', 'warning', 'error', 'debug'] as const;
const COMPONENTS = [
  'auth-service',
  'api-gateway',
  'mcp-handler',
  'stripe-webhook',
  'hitl-manager',
  'contract-service',
  'database',
  'cache',
];

const MESSAGES: Record<string, string[]> = {
  info: [
    'Request processed successfully - GET /api/dashboard/stats, duration: 45ms, status: 200',
    'User authenticated - user_id: 12345, email: user@example.com, method: JWT, MFA: enabled',
    'Cache hit for resource - key: user:12345:profile, TTL: 3600s, saved: 120ms',
    'Webhook received and queued - event: payment.succeeded, webhook_id: wh_abc123, queue: high-priority',
    'MCP tool invocation completed - tool: security_scan, duration: 2.3s, result: 5 findings',
    'Database query executed - query: SELECT users WHERE id = ?, duration: 12ms, rows: 1',
    'File uploaded successfully - filename: report.pdf, size: 2.4MB, storage: s3://bucket/reports/',
    'Email sent - to: user@example.com, subject: Security Alert, template: security_alert_v2',
    'Session created - session_id: sess_xyz789, user_id: 12345, expires: 2024-01-21T12:00:00Z',
    'Audit log entry created - action: user.login, user_id: 12345, ip: 192.168.1.100, timestamp: 2024-01-20T10:30:00Z',
  ],
  warning: [
    'Rate limit approaching threshold - endpoint: /api/scan, current: 85/100 req/min, reset in: 45s',
    'Deprecated API endpoint accessed - endpoint: /api/v1/users (use /api/v2/users), client: mobile-app v1.2.3',
    'Cache miss - fetching from source - key: project:proj-123:details, source: database, duration: 234ms',
    'Retry attempt for failed request - attempt: 2/3, endpoint: external-api.example.com, previous error: timeout',
    'High memory usage detected - current: 85%, threshold: 80%, process: node-worker-3, action: monitoring',
    'Slow database query detected - query: SELECT * FROM audit_logs, duration: 1.2s, threshold: 500ms',
    'SSL certificate expiring soon - domain: api.example.com, expires: 2024-02-15, days remaining: 26',
    'Unusual activity pattern - user_id: 12345, pattern: rapid API calls, requests: 50 in 10s, action: rate limited',
    'Backup verification warning - backup: db-backup-2024-01-20, size: 2.1GB (expected: 2.3GB), investigating',
    'Deprecated dependency detected - package: express@4.16.0, latest: 4.18.2, vulnerabilities: 2, recommend update',
  ],
  error: [
    'Database connection timeout - host: db-primary.example.com, timeout: 5s, retry: 1/3, switching to replica',
    'Authentication failed - invalid token - token: eyJhbGc..., reason: expired, user_id: null, ip: 192.168.1.50',
    'External API returned 500 - endpoint: https://payment-gateway.com/api/charge, error: Internal Server Error, retrying',
    'Transaction rollback triggered - transaction_id: txn_abc123, reason: validation failed, affected rows: 0',
    'Rate limit exceeded - endpoint: /api/scan, client_ip: 192.168.1.100, limit: 100 req/min, current: 102',
    'File upload failed - filename: large-file.zip, size: 150MB, reason: exceeds max size (100MB), user_id: 12345',
    'Webhook delivery failed - webhook_id: wh_xyz789, endpoint: https://client.com/webhook, status: 503, attempts: 3/3',
    'Memory allocation failed - requested: 512MB, available: 128MB, process: node-worker-2, action: restarting',
    'SSL handshake failed - domain: external-api.example.com, error: certificate verification failed, reason: expired',
    'Database deadlock detected - transaction_id: txn_def456, tables: users, orders, action: retrying transaction',
  ],
  debug: [
    'Entering function processRequest - function: processRequest, params: { method: GET, path: /api/users, query: { page: 1 } }',
    'Variable state: pending - context: payment processing, state: PENDING, payment_id: pay_abc123',
    'Loop iteration 5 of 10 - loop: processBatch, current: 5, total: 10, processed: 500 items',
    'Exiting function with result - function: validateUser, result: { valid: true, user_id: 12345, role: admin }',
    'Memory allocation: 256MB - process: node-worker-1, purpose: image processing, duration: 1.2s',
    'Cache lookup - key: user:12345:profile, found: false, action: fetching from database',
    'Database connection pool - active: 5, idle: 10, max: 20, waiting: 0',
    'Request middleware chain - middleware: [auth, rateLimit, validation, handler], duration: 15ms',
    'Event emitted - event: user.registered, payload: { user_id: 12345, email: user@example.com }, listeners: 3',
    'Query plan generated - query: SELECT * FROM users WHERE id = ?, plan: index_scan, estimated_rows: 1',
  ],
};

let logCounter = 0;

/**
 * Generate mock log entry (standard format)
 */
export function generateLogEntry(): LogEntry {
  const type = LOG_TYPES[Math.floor(Math.random() * LOG_TYPES.length)];
  const component = COMPONENTS[Math.floor(Math.random() * COMPONENTS.length)];
  const messages = MESSAGES[type];
  const message = messages[Math.floor(Math.random() * messages.length)];

  return {
    id: `log-${++logCounter}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type,
    component,
    message,
    metadata: {
      requestId: `req-${Math.random().toString(36).substring(7)}`,
      duration: Math.floor(Math.random() * 1000),
    },
  };
}
