export interface Vulnerability {
  id: string;
  type: 'sql_injection' | 'xss' | 'hardcoded_secret' | 'weak_crypto' | 'reentrancy' | 'access_control' | 'csrf' | 'xxe' | 'ssrf' | 'deserialization' | 'path_traversal' | 'command_injection';
  severity: 'critical' | 'high' | 'medium' | 'low';
  location: string;
  description: string;
  suggestedFix: string;
  llmConsensus: number; // 0-100%
  modelsFound: string[]; // ['gpt-4', 'claude-3', 'gemini']
  cve?: string;
  cvssScore?: number;
  impact?: string;
  remediationTime?: string;
  affectedLines?: string[];
  codeSnippet?: string;
  references?: string[];
}

export interface SecurityScanResult {
  projectId: string;
  score: number;
  vulnerabilities: Vulnerability[];
  blockchainAttestation: {
    chain: 'avalanche' | 'base' | 'solana';
    txHash: string;
    timestamp: string;
    status: 'success' | 'failed';
  };
}

export interface Project {
  id: string;
  name: string;
  description: string;
  score: number;
  vulnerabilities: number;
  lastAudit: string;
  language: string;
  repository?: string;
  owner?: string;
  stars?: number;
  contributors?: number;
  lastCommit?: string;
  totalLines?: number;
  testCoverage?: number;
  dependencies?: number;
  license?: string;
  tags?: string[];
}

// Mock vulnerabilities for demo
export const mockVulnerabilities: Vulnerability[] = [
  {
    id: 'vuln-1',
    type: 'sql_injection',
    severity: 'critical',
    location: 'src/api/users.ts:42-45',
    description: 'SQL injection vulnerability detected in getUserById function. User input is directly concatenated into SQL query without sanitization or parameterization. An attacker could inject malicious SQL code to read, modify, or delete database records.',
    suggestedFix: 'Use parameterized queries or prepared statements. Example: db.query("SELECT * FROM users WHERE id = ?", [userId]) or use an ORM with built-in protection.',
    llmConsensus: 95,
    modelsFound: ['gpt-4', 'claude-3', 'gemini', 'llama-3'],
    cve: 'CWE-89',
    cvssScore: 9.8,
    impact: 'Critical - Full database compromise possible. Attackers can read sensitive user data, modify records, or delete entire tables. Could lead to complete system compromise.',
    remediationTime: '2-4 hours',
    affectedLines: ['42', '43', '44', '45'],
    codeSnippet: `async function getUserById(userId: string) {
  const query = \`SELECT * FROM users WHERE id = \${userId}\`;
  return await db.query(query);
}`,
    references: [
      'https://owasp.org/www-community/attacks/SQL_Injection',
      'https://cwe.mitre.org/data/definitions/89.html'
    ]
  },
  {
    id: 'vuln-2',
    type: 'hardcoded_secret',
    severity: 'high',
    location: 'src/config/api.ts:15',
    description: 'Hardcoded AWS API key found in source code. The key "AKIAIOSFODNN7EXAMPLE" is exposed in version control and could be used by attackers to access AWS resources, potentially leading to data breaches or unauthorized service usage.',
    suggestedFix: 'Move API key to environment variables: process.env.AWS_ACCESS_KEY_ID or use AWS Secrets Manager, HashiCorp Vault, or similar secrets management service. Rotate the exposed key immediately.',
    llmConsensus: 88,
    modelsFound: ['gpt-4', 'claude-3', 'gemini'],
    cve: 'CWE-798',
    cvssScore: 7.5,
    impact: 'High - Exposed credentials can be used to access cloud resources, potentially leading to data exfiltration, service disruption, or financial loss through unauthorized usage.',
    remediationTime: '1-2 hours (plus key rotation)',
    affectedLines: ['15'],
    codeSnippet: `export const awsConfig = {
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  region: 'us-east-1'
};`,
    references: [
      'https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_cryptographic_key',
      'https://cwe.mitre.org/data/definitions/798.html'
    ]
  },
  {
    id: 'vuln-3',
    type: 'xss',
    severity: 'high',
    location: 'src/components/UserProfile.tsx:78-82',
    description: 'Stored Cross-Site Scripting (XSS) vulnerability in user profile rendering. User-controlled data from the database is rendered directly into the DOM using dangerouslySetInnerHTML without sanitization. Malicious scripts stored in user profiles will execute for all users viewing the profile.',
    suggestedFix: 'Sanitize user input before rendering. Use libraries like DOMPurify, React\'s built-in escaping, or Content Security Policy. Avoid dangerouslySetInnerHTML when possible.',
    llmConsensus: 92,
    modelsFound: ['gpt-4', 'claude-3', 'gemini', 'llama-3'],
    cve: 'CWE-79',
    cvssScore: 8.2,
    impact: 'High - Attackers can execute arbitrary JavaScript in users\' browsers, steal session cookies, perform actions on behalf of users, or redirect to malicious sites.',
    remediationTime: '3-5 hours',
    affectedLines: ['78', '79', '80', '81', '82'],
    codeSnippet: `function UserProfile({ user }) {
  return (
    <div>
      <h1>{user.name}</h1>
      <div dangerouslySetInnerHTML={{ __html: user.bio }} />
    </div>
  );
}`,
    references: [
      'https://owasp.org/www-community/attacks/xss/',
      'https://cwe.mitre.org/data/definitions/79.html'
    ]
  },
  {
    id: 'vuln-4',
    type: 'weak_crypto',
    severity: 'medium',
    location: 'src/auth/password.ts:33-36',
    description: 'Weak cryptographic algorithm detected in password hashing function. MD5 is cryptographically broken and vulnerable to collision attacks. Passwords hashed with MD5 can be cracked using rainbow tables or brute force attacks in minutes.',
    suggestedFix: 'Use bcrypt (cost factor 10+), argon2id, or scrypt for password hashing. Example: bcrypt.hash(password, 12) or argon2.hash(password, { type: argon2.argon2id }).',
    llmConsensus: 85,
    modelsFound: ['gpt-4', 'gemini', 'claude-3'],
    cve: 'CWE-327',
    cvssScore: 5.3,
    impact: 'Medium - Weak password hashing allows attackers to crack passwords efficiently, potentially leading to account takeover. Existing passwords should be re-hashed on next login.',
    remediationTime: '4-6 hours (including migration strategy)',
    affectedLines: ['33', '34', '35', '36'],
    codeSnippet: `import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('md5').update(password).digest('hex');
}`,
    references: [
      'https://owasp.org/www-community/vulnerabilities/Use_of_a_Broken_or_Risky_Cryptographic_Algorithm',
      'https://cwe.mitre.org/data/definitions/327.html'
    ]
  },
  {
    id: 'vuln-5',
    type: 'reentrancy',
    severity: 'critical',
    location: 'contracts/Vault.sol:120-128',
    description: 'Reentrancy vulnerability in withdrawFunds function. External call to msg.sender occurs before updating the balance state variable. An attacker could create a malicious contract that recursively calls withdrawFunds to drain the contract before the balance is updated.',
    suggestedFix: 'Use checks-effects-interactions pattern: update state before external calls. Alternatively, use OpenZeppelin\'s ReentrancyGuard modifier. Consider using pull payment pattern for additional security.',
    llmConsensus: 98,
    modelsFound: ['gpt-4', 'claude-3', 'gemini', 'llama-3'],
    cve: 'CWE-841',
    cvssScore: 9.1,
    impact: 'Critical - Complete fund drainage possible. Attackers can exploit this to withdraw more funds than their balance, potentially draining the entire contract. Similar to the DAO hack of 2016.',
    remediationTime: '6-8 hours (including comprehensive testing)',
    affectedLines: ['120', '121', '122', '123', '124', '125', '126', '127', '128'],
    codeSnippet: `function withdrawFunds(uint256 amount) public {
  require(balances[msg.sender] >= amount, "Insufficient balance");
  (bool success, ) = msg.sender.call{value: amount}("");
  require(success, "Transfer failed");
  balances[msg.sender] -= amount; // State updated AFTER external call
}`,
    references: [
      'https://swcregistry.io/docs/SWC-107',
      'https://consensys.github.io/smart-contract-best-practices/attacks/reentrancy/'
    ]
  },
  {
    id: 'vuln-6',
    type: 'access_control',
    severity: 'high',
    location: 'src/routes/admin.ts:45-52',
    description: 'Broken access control in admin endpoint. The /api/admin/users endpoint lacks proper authorization checks. Any authenticated user can access admin functions, allowing privilege escalation and unauthorized data access.',
    suggestedFix: 'Implement role-based access control (RBAC). Check user roles before allowing access: if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" }). Use middleware for consistent authorization.',
    llmConsensus: 90,
    modelsFound: ['gpt-4', 'claude-3', 'gemini'],
    cve: 'CWE-284',
    cvssScore: 8.1,
    impact: 'High - Unauthorized users can access admin functions, view sensitive data, modify system settings, or delete user accounts. Could lead to complete system compromise.',
    remediationTime: '3-4 hours',
    affectedLines: ['45', '46', '47', '48', '49', '50', '51', '52'],
    codeSnippet: `router.get('/api/admin/users', async (req, res) => {
  // Missing authorization check!
  const users = await db.query('SELECT * FROM users');
  res.json(users);
});`,
    references: [
      'https://owasp.org/www-project-top-ten/2017/A5_2017-Broken_Access_Control',
      'https://cwe.mitre.org/data/definitions/284.html'
    ]
  },
  {
    id: 'vuln-7',
    type: 'csrf',
    severity: 'medium',
    location: 'src/middleware/auth.ts:23-30',
    description: 'Missing CSRF protection on state-changing operations. POST endpoints that modify data lack CSRF token validation, allowing attackers to perform unauthorized actions on behalf of authenticated users through malicious websites.',
    suggestedFix: 'Implement CSRF token validation using csrf middleware. Generate tokens on GET requests and validate on POST/PUT/DELETE. Use SameSite cookie attribute and verify Origin/Referer headers.',
    llmConsensus: 87,
    modelsFound: ['gpt-4', 'claude-3'],
    cve: 'CWE-352',
    cvssScore: 6.5,
    impact: 'Medium - Attackers can trick authenticated users into performing unintended actions like changing passwords, transferring funds, or deleting data without their knowledge.',
    remediationTime: '2-3 hours',
    affectedLines: ['23', '24', '25', '26', '27', '28', '29', '30'],
    codeSnippet: `app.post('/api/transfer', async (req, res) => {
  // No CSRF token validation
  const { amount, recipient } = req.body;
  await transferFunds(req.user.id, recipient, amount);
  res.json({ success: true });
});`,
    references: [
      'https://owasp.org/www-community/attacks/csrf',
      'https://cwe.mitre.org/data/definitions/352.html'
    ]
  },
  {
    id: 'vuln-8',
    type: 'ssrf',
    severity: 'high',
    location: 'src/api/webhook.ts:67-75',
    description: 'Server-Side Request Forgery (SSRF) vulnerability in webhook validation endpoint. User-controlled URL is used to make server-side HTTP requests without validation, allowing attackers to access internal services, cloud metadata endpoints, or perform port scanning.',
    suggestedFix: 'Validate and whitelist allowed URLs. Block private IP ranges (10.x.x.x, 192.168.x.x, 127.x.x.x), localhost, and cloud metadata endpoints. Use a URL parser and validate the hostname before making requests.',
    llmConsensus: 91,
    modelsFound: ['gpt-4', 'claude-3', 'gemini'],
    cve: 'CWE-918',
    cvssScore: 7.5,
    impact: 'High - Attackers can access internal services, read cloud metadata (potentially exposing credentials), or perform network reconnaissance. Could lead to internal network compromise.',
    remediationTime: '4-5 hours',
    affectedLines: ['67', '68', '69', '70', '71', '72', '73', '74', '75'],
    codeSnippet: `async function validateWebhook(url: string) {
  // No URL validation - SSRF risk!
  const response = await fetch(url);
  return response.ok;
}`,
    references: [
      'https://owasp.org/www-community/attacks/Server_Side_Request_Forgery',
      'https://cwe.mitre.org/data/definitions/918.html'
    ]
  },
  {
    id: 'vuln-9',
    type: 'path_traversal',
    severity: 'high',
    location: 'src/api/files.ts:34-41',
    description: 'Path traversal vulnerability in file download endpoint. User-controlled filename is used to construct file paths without proper sanitization, allowing attackers to read arbitrary files from the server filesystem, including configuration files, source code, or sensitive data.',
    suggestedFix: 'Validate and sanitize file paths. Use path.basename() to extract filename, resolve paths relative to a base directory, and check that resolved path stays within allowed directory. Whitelist allowed file extensions.',
    llmConsensus: 89,
    modelsFound: ['gpt-4', 'claude-3', 'gemini'],
    cve: 'CWE-22',
    cvssScore: 7.5,
    impact: 'High - Attackers can read sensitive files like configuration files, environment variables, private keys, or source code. Could lead to complete system compromise if credentials are exposed.',
    remediationTime: '2-3 hours',
    affectedLines: ['34', '35', '36', '37', '38', '39', '40', '41'],
    codeSnippet: `app.get('/api/files/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  // No path traversal protection!
  res.sendFile(filePath);
});`,
    references: [
      'https://owasp.org/www-community/attacks/Path_Traversal',
      'https://cwe.mitre.org/data/definitions/22.html'
    ]
  },
  {
    id: 'vuln-10',
    type: 'deserialization',
    severity: 'critical',
    location: 'src/api/data.ts:89-95',
    description: 'Insecure deserialization of untrusted data. User-controlled JSON is deserialized without validation, potentially allowing remote code execution through prototype pollution or if using eval-based deserialization. This is a critical vulnerability that could lead to complete server compromise.',
    suggestedFix: 'Use safe deserialization methods. Avoid eval() or Function() constructors. Validate deserialized data structure. Use JSON.parse() with reviver function for validation, or use a schema validation library like Zod or Joi.',
    llmConsensus: 94,
    modelsFound: ['gpt-4', 'claude-3', 'gemini', 'llama-3'],
    cve: 'CWE-502',
    cvssScore: 9.8,
    impact: 'Critical - Remote code execution possible. Attackers can execute arbitrary code on the server, leading to complete system compromise, data exfiltration, or lateral movement within the network.',
    remediationTime: '5-7 hours (including security review)',
    affectedLines: ['89', '90', '91', '92', '93', '94', '95'],
    codeSnippet: `app.post('/api/data', (req, res) => {
  const data = eval('(' + req.body.data + ')'); // Dangerous!
  // Process data...
});`,
    references: [
      'https://owasp.org/www-community/vulnerabilities/Deserialization_of_untrusted_data',
      'https://cwe.mitre.org/data/definitions/502.html'
    ]
  }
];

// Mock projects for leaderboard
export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'SecureDeFi Protocol',
    description: 'Decentralized finance protocol with comprehensive security audits, yield farming, and liquidity pools. Implements advanced security measures including multi-signature wallets and time-locked transactions.',
    score: 94,
    vulnerabilities: 2,
    lastAudit: '2024-01-15',
    language: 'Solidity',
    repository: 'https://github.com/securedefi/protocol',
    owner: 'SecureDeFi Team',
    stars: 2847,
    contributors: 23,
    lastCommit: '2024-01-20T14:32:00Z',
    totalLines: 45230,
    testCoverage: 87,
    dependencies: 12,
    license: 'MIT',
    tags: ['defi', 'ethereum', 'smart-contracts', 'security', 'audited']
  },
  {
    id: 'proj-2',
    name: 'AuthGuard API',
    description: 'Enterprise-grade authentication and authorization service with multi-factor authentication, OAuth2/OIDC support, session management, and comprehensive audit logging. Used by 500+ companies.',
    score: 88,
    vulnerabilities: 5,
    lastAudit: '2024-01-12',
    language: 'TypeScript',
    repository: 'https://github.com/authguard/api',
    owner: 'AuthGuard Inc.',
    stars: 5231,
    contributors: 45,
    lastCommit: '2024-01-19T09:15:00Z',
    totalLines: 67890,
    testCoverage: 92,
    dependencies: 28,
    license: 'Apache-2.0',
    tags: ['authentication', 'security', 'oauth', 'enterprise', 'api']
  },
  {
    id: 'proj-3',
    name: 'CryptoWallet Mobile',
    description: 'Mobile cryptocurrency wallet application with hardware security module integration, biometric authentication, multi-chain support (Bitcoin, Ethereum, Solana), and DeFi integration.',
    score: 86,
    vulnerabilities: 7,
    lastAudit: '2024-01-10',
    language: 'React Native',
    repository: 'https://github.com/cryptowallet/mobile',
    owner: 'CryptoWallet Labs',
    stars: 1923,
    contributors: 18,
    lastCommit: '2024-01-18T16:45:00Z',
    totalLines: 34120,
    testCoverage: 78,
    dependencies: 67,
    license: 'GPL-3.0',
    tags: ['mobile', 'cryptocurrency', 'wallet', 'blockchain', 'react-native']
  },
  {
    id: 'proj-4',
    name: 'SecureBank Core',
    description: 'Core banking system with real-time transaction processing, fraud detection, compliance automation, and regulatory reporting. Handles millions of transactions daily.',
    score: 91,
    vulnerabilities: 3,
    lastAudit: '2024-01-14',
    language: 'Java',
    repository: 'https://github.com/securebank/core',
    owner: 'SecureBank Corporation',
    stars: 892,
    contributors: 67,
    lastCommit: '2024-01-20T11:20:00Z',
    totalLines: 234560,
    testCoverage: 89,
    dependencies: 145,
    license: 'Proprietary',
    tags: ['banking', 'fintech', 'enterprise', 'java', 'compliance']
  },
  {
    id: 'proj-5',
    name: 'MedSecure Health',
    description: 'HIPAA-compliant healthcare data management platform with encrypted patient records, telemedicine integration, and secure messaging. Serves 200+ healthcare facilities.',
    score: 89,
    vulnerabilities: 4,
    lastAudit: '2024-01-11',
    language: 'Python',
    repository: 'https://github.com/medsecure/health',
    owner: 'MedSecure Technologies',
    stars: 1456,
    contributors: 34,
    lastCommit: '2024-01-19T13:55:00Z',
    totalLines: 98760,
    testCoverage: 85,
    dependencies: 42,
    license: 'AGPL-3.0',
    tags: ['healthcare', 'hipaa', 'encryption', 'telemedicine', 'python']
  },
  {
    id: 'proj-6',
    name: 'CloudGuard Infrastructure',
    description: 'Infrastructure as Code security scanning and compliance automation platform. Integrates with AWS, Azure, and GCP to detect misconfigurations and enforce security policies.',
    score: 87,
    vulnerabilities: 6,
    lastAudit: '2024-01-13',
    language: 'Go',
    repository: 'https://github.com/cloudguard/infrastructure',
    owner: 'CloudGuard Security',
    stars: 3214,
    contributors: 52,
    lastCommit: '2024-01-20T08:30:00Z',
    totalLines: 123450,
    testCoverage: 83,
    dependencies: 89,
    license: 'MIT',
    tags: ['infrastructure', 'cloud', 'security', 'iac', 'compliance']
  },
  {
    id: 'proj-7',
    name: 'PaymentGateway Pro',
    description: 'High-performance payment processing gateway supporting credit cards, cryptocurrencies, and bank transfers. PCI-DSS compliant with tokenization and fraud detection.',
    score: 93,
    vulnerabilities: 1,
    lastAudit: '2024-01-16',
    language: 'Rust',
    repository: 'https://github.com/paymentgateway/pro',
    owner: 'PaymentGateway Inc.',
    stars: 4567,
    contributors: 29,
    lastCommit: '2024-01-20T15:10:00Z',
    totalLines: 78920,
    testCoverage: 94,
    dependencies: 18,
    license: 'MIT',
    tags: ['payments', 'pci-dss', 'fintech', 'rust', 'high-performance']
  },
  {
    id: 'proj-8',
    name: 'IoT Security Hub',
    description: 'Centralized security management platform for IoT devices. Provides device authentication, encrypted communication, firmware update verification, and anomaly detection.',
    score: 85,
    vulnerabilities: 8,
    lastAudit: '2024-01-09',
    language: 'C++',
    repository: 'https://github.com/iotsecurity/hub',
    owner: 'IoT Security Foundation',
    stars: 2134,
    contributors: 41,
    lastCommit: '2024-01-17T10:25:00Z',
    totalLines: 156780,
    testCoverage: 76,
    dependencies: 23,
    license: 'LGPL-2.1',
    tags: ['iot', 'embedded', 'security', 'firmware', 'c++']
  },
  {
    id: 'proj-9',
    name: 'Blockchain Explorer',
    description: 'Multi-chain blockchain explorer and analytics platform supporting Ethereum, Bitcoin, Polygon, and 15+ other chains. Real-time transaction monitoring and smart contract analysis.',
    score: 90,
    vulnerabilities: 3,
    lastAudit: '2024-01-14',
    language: 'TypeScript',
    repository: 'https://github.com/blockchain/explorer',
    owner: 'Blockchain Analytics',
    stars: 6789,
    contributors: 38,
    lastCommit: '2024-01-20T12:40:00Z',
    totalLines: 112340,
    testCoverage: 88,
    dependencies: 56,
    license: 'Apache-2.0',
    tags: ['blockchain', 'analytics', 'ethereum', 'bitcoin', 'typescript']
  },
  {
    id: 'proj-10',
    name: 'ZeroTrust Network',
    description: 'Zero-trust network access solution with micro-segmentation, continuous authentication, and threat detection. Implements least-privilege access and encrypted communication.',
    score: 92,
    vulnerabilities: 2,
    lastAudit: '2024-01-15',
    language: 'Go',
    repository: 'https://github.com/zerotrust/network',
    owner: 'ZeroTrust Security',
    stars: 3456,
    contributors: 27,
    lastCommit: '2024-01-20T14:00:00Z',
    totalLines: 89340,
    testCoverage: 91,
    dependencies: 34,
    license: 'MIT',
    tags: ['zero-trust', 'networking', 'security', 'vpn', 'go']
  }
];

// Sample vulnerable code examples
export const sampleCodeExamples: Record<string, string> = {
  javascript: `// Vulnerable JavaScript Code Examples

// SQL Injection Vulnerability
async function getUserData(userId) {
  // VULNERABLE: Direct string concatenation
  const query = "SELECT * FROM users WHERE id = " + userId;
  return await db.query(query);
  // FIX: Use parameterized queries
  // return await db.query("SELECT * FROM users WHERE id = ?", [userId]);
}

// XSS Vulnerability
function renderUserInput(input) {
  // VULNERABLE: Direct innerHTML assignment
  document.getElementById('output').innerHTML = input;
  // FIX: Use textContent or sanitize with DOMPurify
  // document.getElementById('output').textContent = input;
}

// Hardcoded Secret
const API_KEY = "sk_live_1234567890abcdef";
const AWS_SECRET = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
// FIX: Use environment variables
// const API_KEY = process.env.API_KEY;

// Command Injection
function executeCommand(userInput) {
  // VULNERABLE: User input in shell command
  const command = \`npm install \${userInput}\`;
  exec(command);
  // FIX: Validate and sanitize input, use whitelist
}

// Path Traversal
app.get('/download/:filename', (req, res) => {
  // VULNERABLE: No path validation
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  res.sendFile(filePath);
  // FIX: Validate filename, use path.basename(), check boundaries
});`,
  python: `# Vulnerable Python Code Examples

import hashlib
import subprocess
from flask import Flask, request

# Weak Cryptography
def hash_password(password):
    # VULNERABLE: MD5 is cryptographically broken
    return hashlib.md5(password.encode()).hexdigest()
    # FIX: Use bcrypt or argon2
    # import bcrypt
    # return bcrypt.hashpw(password.encode(), bcrypt.gensalt())

# SQL Injection
def process_user_input(user_input):
    # VULNERABLE: String formatting in SQL
    query = f"SELECT * FROM users WHERE name = '{user_input}'"
    return execute_query(query)
    # FIX: Use parameterized queries
    # query = "SELECT * FROM users WHERE name = %s"
    # return execute_query(query, (user_input,))

# Command Injection
@app.route('/api/run')
def run_command():
    command = request.args.get('cmd')
    # VULNERABLE: User input in shell command
    result = subprocess.run(command, shell=True, capture_output=True)
    return result.stdout
    # FIX: Use whitelist, avoid shell=True, validate input

# Insecure Deserialization
import pickle
@app.route('/api/data')
def load_data():
    data = request.get_data()
    # VULNERABLE: Unpickling untrusted data
    obj = pickle.loads(data)
    # FIX: Use JSON with validation, avoid pickle for untrusted data

# SSRF Vulnerability
import requests
@app.route('/api/fetch')
def fetch_url():
    url = request.args.get('url')
    # VULNERABLE: No URL validation
    response = requests.get(url)
    return response.text
    # FIX: Validate URL, whitelist domains, block private IPs`,
  solidity: `// Vulnerable Solidity Code Examples

// Reentrancy Vulnerability
contract VulnerableWallet {
    mapping(address => uint256) public balances;
    
    function withdrawFunds() public {
        uint256 amount = balances[msg.sender];
        // VULNERABLE: External call before state update
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        balances[msg.sender] = 0; // Too late!
    }
    
    // FIX: Update state before external call
    // function withdrawFunds() public {
    //     uint256 amount = balances[msg.sender];
    //     balances[msg.sender] = 0; // Update first
    //     (bool success, ) = msg.sender.call{value: amount}("");
    //     require(success, "Transfer failed");
    // }
}

// Integer Overflow (pre-Solidity 0.8.0)
contract VulnerableMath {
    function add(uint256 a, uint256 b) public pure returns (uint256) {
        // VULNERABLE: No overflow check (pre-0.8.0)
        return a + b;
        // FIX: Use SafeMath library or Solidity 0.8.0+
    }
}

// Access Control Issue
contract VulnerableToken {
    mapping(address => uint256) public balances;
    address public owner;
    
    function transfer(address to, uint256 amount) public {
        // VULNERABLE: No access control
        balances[msg.sender] -= amount;
        balances[to] += amount;
        // FIX: Add proper checks and modifiers
    }
    
    function setOwner(address newOwner) public {
        // VULNERABLE: Missing onlyOwner modifier
        owner = newOwner;
        // FIX: Add modifier: function setOwner(address newOwner) public onlyOwner
    }
}

// Unchecked External Call
contract VulnerablePayment {
    function pay(address recipient, uint256 amount) public {
        // VULNERABLE: No return value check
        recipient.call{value: amount}("");
        // FIX: Check return value and handle failures
        // (bool success, ) = recipient.call{value: amount}("");
        // require(success, "Payment failed");
    }
}

// Front-running Vulnerability
contract VulnerableAuction {
    uint256 public highestBid;
    address public highestBidder;
    
    function bid() public payable {
        // VULNERABLE: Predictable state changes
        require(msg.value > highestBid);
        highestBid = msg.value;
        highestBidder = msg.sender;
        // FIX: Use commit-reveal scheme or Vickrey auction
    }
}`
};

