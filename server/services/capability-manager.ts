/**
 * Capability Token Manager
 * Issues and verifies short-lived capability tokens for scoped MCP tool access
 */

import type { CapabilityToken } from '../../shared/envelopes.js';
import { logError } from '../utils/error-handler.js';

export class CapabilityManager {
  private serverKey: string;
  private tokenCache: Map<string, CapabilityToken> = new Map();

  constructor(serverKey?: string) {
    this.serverKey = serverKey || process.env.SERVER_KEY || 'default-dev-key';
  }

  /**
   * Mint a new capability token
   */
  mint(params: {
    tool_id: string;
    caller: string;
    allowed_actions: string[];
    ttl_seconds?: number;
    scope?: Record<string, any>;
  }): string {
    const now = Math.floor(Date.now() / 1000);
    const ttl = params.ttl_seconds || 3600; // 1 hour default

    const token: CapabilityToken = {
      tool_id: params.tool_id,
      caller: params.caller,
      allowed_actions: params.allowed_actions,
      exp: now + ttl,
      iat: now,
      scope: params.scope,
    };

    // Simple token generation (in production, use JWT)
    const tokenString = this.sign(token);
    
    // Cache for quick lookup
    this.tokenCache.set(tokenString, token);

    return tokenString;
  }

  /**
   * Verify a capability token
   */
  verify(tokenString: string): CapabilityToken | null {
    try {
      if (!tokenString || typeof tokenString !== 'string') {
        return null;
      }

      // Check cache first
      const cached = this.tokenCache.get(tokenString);
      if (cached) {
        if (this.isExpired(cached)) {
          this.tokenCache.delete(tokenString);
          return null;
        }
        return cached;
      }

      // Verify signature and decode
      const token = this.unsign(tokenString);
      
      if (!token || this.isExpired(token)) {
        return null;
      }

      // Cache valid token for future lookups
      this.tokenCache.set(tokenString, token);

      return token;
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: 'Token verification failed',
      });
      return null;
    }
  }

  /**
   * Check if token allows specific action
   */
  canPerformAction(
    tokenString: string,
    tool_id: string,
    action: string
  ): boolean {
    try {
      if (!tokenString || !tool_id || !action) {
        return false;
      }

      const token = this.verify(tokenString);
      
      if (!token) {
        return false;
      }

      if (token.tool_id !== tool_id) {
        return false;
      }

      if (!token.allowed_actions.includes(action) && !token.allowed_actions.includes('*')) {
        return false;
      }

      return true;
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: 'Error checking action permission',
      });
      return false;
    }
  }

  /**
   * Revoke a token
   */
  revoke(tokenString: string): void {
    this.tokenCache.delete(tokenString);
  }

  /**
   * Clean up expired tokens
   */
  cleanup(): void {
    const now = Math.floor(Date.now() / 1000);
    
    for (const [tokenString, token] of Array.from(this.tokenCache.entries())) {
      if (token.exp < now) {
        this.tokenCache.delete(tokenString);
      }
    }
  }

  /**
   * Sign token (simplified - use JWT in production)
   */
  private sign(token: CapabilityToken): string {
    const payload = JSON.stringify(token);
    const signature = this.hmac(payload, this.serverKey);
    return `${Buffer.from(payload).toString('base64')}.${signature}`;
  }

  /**
   * Unsign token
   */
  private unsign(tokenString: string): CapabilityToken | null {
    try {
      const [payloadB64, signature] = tokenString.split('.');
      const payload = Buffer.from(payloadB64, 'base64').toString('utf-8');
      
      // Verify signature
      const expectedSig = this.hmac(payload, this.serverKey);
      if (signature !== expectedSig) {
        return null;
      }

      return JSON.parse(payload) as CapabilityToken;
    } catch {
      return null;
    }
  }

  /**
   * Simple HMAC (use crypto.createHmac in production)
   */
  private hmac(data: string, key: string): string {
    // Simplified for demo - use proper crypto in production
    const combined = `${key}:${data}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash) + combined.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if token is expired
   */
  private isExpired(token: CapabilityToken): boolean {
    const now = Math.floor(Date.now() / 1000);
    return token.exp < now;
  }
}

// Singleton instance
export const capabilityManager = new CapabilityManager();
