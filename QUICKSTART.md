# NullAudit v3.0 - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+ and pnpm
- Git

### Installation

```bash
# 1. Clone or extract the project
cd nullaudit-improved

# 2. Install dependencies
pnpm install

# 3. Start development server
pnpm dev
```

Your app is now running at `http://localhost:5173`

---

## 📝 First Security Audit

### Via Web UI

1. Open http://localhost:5173
2. Click "New Audit"
3. Paste your code
4. Select language (JavaScript, Python, Solidity, etc.)
5. Click "Analyze"
6. Review findings

### Via MCP API

```bash
curl -X POST http://localhost:3000/api/mcp/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "tool_id": "analyze_code_security",
    "inputs": {
      "code": "console.log(\"test\");",
      "language": "javascript"
    }
  }'
```

---

## 🔗 Smart Contract Analysis

For Solidity smart contracts:

```bash
curl -X POST http://localhost:3000/api/mcp/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "tool_id": "analyze_code_security",
    "inputs": {
      "code": "pragma solidity ^0.8.0;\ncontract Token { ... }",
      "language": "solidity",
      "blockchain": "ethereum",
      "depth": "deep"
    }
  }'
```

---

## ⛓️ On-Chain Attestation

Create an on-chain attestation for your audit:

```bash
curl -X POST http://localhost:3000/api/mcp/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "tool_id": "mint_attestation",
    "inputs": {
      "audit_id": "audit-123",
      "merkle_root": "0x...",
      "chain": "ethereum",
      "security_score": 85
    }
  }'
```

---

## 📊 MCP Tool Discovery

List all available MCP tools:

```bash
curl http://localhost:3000/api/mcp/manifest | jq
```

---

## 🏗️ Project Structure

```
nullaudit-improved/
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types
├── contracts/       # Smart contracts
├── mcp.json         # MCP configuration
└── package.json     # Dependencies
```

---

## 📚 Documentation

- **[README.md](./README.md)** - Full project overview
- **[NULLSHOT_INTEGRATION.md](./NULLSHOT_INTEGRATION.md)** - NullShot Agent integration
- **[WEB3_INTEGRATION.md](./WEB3_INTEGRATION.md)** - Blockchain features
- **[DEPLOYMENT_LOVABLE.md](./DEPLOYMENT_LOVABLE.md)** - Deploy to Lovable
- **[README_MCP.md](./README_MCP.md)** - MCP protocol details

---

## 🔧 Development

### Build for Production

```bash
pnpm build
```

### Start Production Server

```bash
pnpm start
```

### Type Checking

```bash
pnpm check
```

### Format Code

```bash
pnpm format
```

---

## 🚀 Deploy to Lovable

1. Push to GitHub
2. Go to https://lovable.dev
3. Click "Import from GitHub"
4. Select this repository
5. Configure environment variables
6. Deploy!

See [DEPLOYMENT_LOVABLE.md](./DEPLOYMENT_LOVABLE.md) for detailed instructions.

---

## 🆘 Troubleshooting

### Port Already in Use

```bash
# Use different port
PORT=3001 pnpm dev
```

### Dependencies Installation Issues

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Build Errors

```bash
# Check TypeScript errors
pnpm check

# Clear build cache
rm -rf dist
pnpm build
```

---

## 📞 Support

- **GitHub Issues**: Report bugs and request features
- **NullShot Docs**: https://nullshot.ai/en/docs/developers
- **MCP Specification**: https://modelcontextprotocol.io/

---

**Ready to audit? Start with `pnpm dev` and open http://localhost:5173!**
