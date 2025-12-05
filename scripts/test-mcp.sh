#!/bin/bash
# MCP Tool Testing Script

echo "========================================="
echo "NullAudit MCP Tool Testing"
echo "========================================="

BASE_URL="http://localhost:3000/api/mcp"

echo ""
echo "1. Testing MCP Manifest..."
curl -s $BASE_URL/manifest | jq '.'

echo ""
echo "2. Testing Tool Listing..."
curl -s $BASE_URL/tools | jq '.tools[] | {id, name}'

echo ""
echo "3. Minting Capability Token..."
TOKEN_RESPONSE=$(curl -s -X POST $BASE_URL/capability/mint \
  -H "Content-Type: application/json" \
  -d '{
    "tool_id": "analyze_code_security",
    "caller": "test-agent",
    "allowed_actions": ["analyze", "report"],
    "ttl_seconds": 3600
  }')

TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.token')
echo "Token: $TOKEN"

echo ""
echo "4. Testing Code Analysis Tool..."
curl -s -X POST $BASE_URL/invoke \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"inv_test_001\",
    \"caller\": \"test-agent\",
    \"tool_id\": \"analyze_code_security\",
    \"action\": \"analyze\",
    \"capability_token\": \"$TOKEN\",
    \"ts\": $(date +%s),
    \"metadata\": {
      \"code\": \"SELECT * FROM users WHERE id = \${userId}\",
      \"language\": \"sql\",
      \"depth\": \"standard\"
    }
  }" | jq '.'

echo ""
echo "5. Testing Attestation Minting..."
curl -s -X POST $BASE_URL/invoke \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"inv_test_002\",
    \"caller\": \"test-agent\",
    \"tool_id\": \"mint_attestation\",
    \"action\": \"mint\",
    \"capability_token\": \"$TOKEN\",
    \"ts\": $(date +%s),
    \"metadata\": {
      \"audit_id\": \"audit_001\",
      \"merkle_root\": \"0x1234567890abcdef\",
      \"cid\": \"QmExample123\"
    }
  }" | jq '.'

echo ""
echo "6. Testing Report Retrieval..."
curl -s -X POST $BASE_URL/invoke \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"inv_test_003\",
    \"caller\": \"test-agent\",
    \"tool_id\": \"get_report\",
    \"action\": \"get\",
    \"ts\": $(date +%s),
    \"metadata\": {
      \"audit_id\": \"audit_001\",
      \"format\": \"json\"
    }
  }" | jq '.'

echo ""
echo "7. Testing Attestation Verification..."
curl -s -X POST $BASE_URL/invoke \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"inv_test_004\",
    \"caller\": \"test-agent\",
    \"tool_id\": \"verify_attestation\",
    \"action\": \"verify\",
    \"ts\": $(date +%s),
    \"metadata\": {
      \"anchor_id\": \"0xabcdef123456\"
    }
  }" | jq '.'

echo ""
echo "8. Testing Health Check..."
curl -s $BASE_URL/health | jq '.'

echo ""
echo "========================================="
echo "MCP Tool Testing Complete!"
echo "========================================="
