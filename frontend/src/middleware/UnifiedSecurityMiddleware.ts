/**
 * Unified Security Middleware - Phase 3 Week 23-24
 * Comprehensive security middleware for Indonesian government compliance
 * 
 * Integrates authentication, authorization, audit logging, compliance validation,
 * encryption, rate limiting, and security headers for government-grade protection
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import type { GovernmentAuditTrail, AuditEventType } from '../services/audit/GovernmentAuditTrail';
import type { IndonesianDataProtectionService } from '../services/compliance/IndonesianDataProtectionService';
import type { GovernmentGradeEncryption } from '../services/security/GovernmentGradeEncryption';
import type { DataClassification, LegalBasis } from '../types/compliance';

export interface SecurityConfig {
  enableAuthentication: boolean;
  enableAuthorization: boolean;
  enableAuditLogging: boolean;
  enableComplianceValidation: boolean;
  enableEncryption: boolean;
  enableRateLimit: boolean;
  enableSecurityHeaders: boolean;
  enableRequestValidation: boolean;
  enableResponseSanitization: boolean;
  rateLimitRequests: number; // requests per minute
  rateLimitWindow: number; // window in milliseconds
  maxRequestSize: number; // bytes
  allowedOrigins: string[];
  securityLevel: 'standard' | 'government' | 'classified';
}

export interface SecurityContext {
  requestId: string;
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  endpoint: string;
  method: string;
  dataClassification: DataClassification;
  legalBasis: LegalBasis;
  auditRequired: boolean;
  encryptionRequired: boolean;
}

export interface SecurityValidationResult {
  allowed: boolean;
  reason?: string;
  statusCode?: number;
  headers?: Record<string, string>;
  auditEvent?: {
    eventType: AuditEventType;
    outcome: 'success' | 'failure' | 'warning';
    details: any;
  };
}

export interface RateLimitState {
  requests: number;
  windowStart: number;
  blocked: boolean;
}

/**
 * Unified Security Middleware
 * Provides comprehensive security validation for all API endpoints
 */
export class UnifiedSecurityMiddleware {
  private static instance: UnifiedSecurityMiddleware;
  private config: SecurityConfig;
  private auditTrail: GovernmentAuditTrail | null = null;
  private complianceService: IndonesianDataProtectionService | null = null;
  private encryptionService: GovernmentGradeEncryption | null = null;
  private rateLimitStore: Map<string, RateLimitState> = new Map();
  private isInitialized: boolean = false;

  private constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      enableAuthentication: true,
      enableAuthorization: true,
      enableAuditLogging: true,
      enableComplianceValidation: true,
      enableEncryption: true,
      enableRateLimit: true,
      enableSecurityHeaders: true,
      enableRequestValidation: true,
      enableResponseSanitization: true,
      rateLimitRequests: 100, // 100 requests per minute
      rateLimitWindow: 60000, // 1 minute
      maxRequestSize: 10 * 1024 * 1024, // 10MB
      allowedOrigins: ['https://disdukcapil-garut.go.id', 'https://selly.disdukcapil-garut.go.id'],
      securityLevel: 'government',
      ...config
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<SecurityConfig>): UnifiedSecurityMiddleware {
    if (!UnifiedSecurityMiddleware.instance) {
      UnifiedSecurityMiddleware.instance = new UnifiedSecurityMiddleware(config);
    }
    return UnifiedSecurityMiddleware.instance;
  }

  /**
   * Initialize security middleware with services
   */
  public async initialize(
    auditTrail?: GovernmentAuditTrail,
    complianceService?: IndonesianDataProtectionService,
    encryptionService?: GovernmentGradeEncryption
  ): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('🔒 [SECURITY_MIDDLEWARE] Initializing unified security middleware...');

    try {
      this.auditTrail = auditTrail || null;
      this.complianceService = complianceService || null;
      this.encryptionService = encryptionService || null;

      // Start rate limit cleanup timer
      this.startRateLimitCleanup();

      this.isInitialized = true;
      console.log('✅ [SECURITY_MIDDLEWARE] Unified security middleware initialized');

    } catch (error) {
      console.error('❌ [SECURITY_MIDDLEWARE] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Main security validation middleware
   */
  public async validateRequest(request: NextRequest): Promise<SecurityValidationResult> {
    const startTime = performance.now();
    const securityContext = this.createSecurityContext(request);

    try {
      // 1. Security Headers Validation
      if (this.config.enableSecurityHeaders) {
        const headerValidation = await this.validateSecurityHeaders(request, securityContext);
        if (!headerValidation.allowed) {
          return headerValidation;
        }
      }

      // 2. Rate Limiting
      if (this.config.enableRateLimit) {
        const rateLimitValidation = await this.validateRateLimit(request, securityContext);
        if (!rateLimitValidation.allowed) {
          return rateLimitValidation;
        }
      }

      // 3. Request Size Validation
      const sizeValidation = await this.validateRequestSize(request, securityContext);
      if (!sizeValidation.allowed) {
        return sizeValidation;
      }

      // 4. Authentication
      if (this.config.enableAuthentication && this.requiresAuthentication(request)) {
        const authValidation = await this.validateAuthentication(request, securityContext);
        if (!authValidation.allowed) {
          return authValidation;
        }
      }

      // 5. Authorization
      if (this.config.enableAuthorization && this.requiresAuthorization(request)) {
        const authzValidation = await this.validateAuthorization(request, securityContext);
        if (!authzValidation.allowed) {
          return authzValidation;
        }
      }

      // 6. Request Validation
      if (this.config.enableRequestValidation) {
        const requestValidation = await this.validateRequestStructure(request, securityContext);
        if (!requestValidation.allowed) {
          return requestValidation;
        }
      }

      // 7. Compliance Validation
      if (this.config.enableComplianceValidation && this.complianceService) {
        const complianceValidation = await this.validateCompliance(request, securityContext);
        if (!complianceValidation.allowed) {
          return complianceValidation;
        }
      }

      // 8. Audit Logging
      if (this.config.enableAuditLogging && securityContext.auditRequired) {
        await this.logSecurityEvent(securityContext, 'data_access', 'success', {
          endpoint: securityContext.endpoint,
          method: securityContext.method,
          processingTime: performance.now() - startTime,
          securityLevel: this.config.securityLevel
        });
      }

      const processingTime = performance.now() - startTime;
      console.log(`🔒 [SECURITY_MIDDLEWARE] Request validated: ${securityContext.endpoint} (${processingTime.toFixed(2)}ms)`);

      return {
        allowed: true,
        headers: this.getSecurityHeaders()
      };

    } catch (error) {
      const processingTime = performance.now() - startTime;
      console.error(`❌ [SECURITY_MIDDLEWARE] Validation failed: ${error} (${processingTime.toFixed(2)}ms)`);

      // Log security failure
      if (this.config.enableAuditLogging) {
        await this.logSecurityEvent(securityContext, 'security_event', 'failure', {
          error: error instanceof Error ? error.message : 'Unknown error',
          endpoint: securityContext.endpoint,
          method: securityContext.method,
          processingTime
        });
      }

      return {
        allowed: false,
        reason: 'Security validation failed',
        statusCode: 500,
        headers: this.getSecurityHeaders()
      };
    }
  }

  /**
   * Create security context from request
   */
  private createSecurityContext(request: NextRequest): SecurityContext {
    const url = new URL(request.url);
    const endpoint = url.pathname;
    
    // Determine data classification based on endpoint
    const dataClassification = this.determineDataClassification(endpoint);
    
    // Determine legal basis
    const legalBasis = this.determineLegalBasis(endpoint);
    
    // Check if audit is required
    const auditRequired = this.isAuditRequired(endpoint);
    
    // Check if encryption is required
    const encryptionRequired = dataClassification !== 'public';

    return {
      requestId: crypto.randomUUID(),
      ipAddress: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date(),
      endpoint,
      method: request.method,
      dataClassification,
      legalBasis,
      auditRequired,
      encryptionRequired
    };
  }

  /**
   * Validate security headers
   */
  private async validateSecurityHeaders(
    request: NextRequest,
    context: SecurityContext
  ): Promise<SecurityValidationResult> {
    const origin = request.headers.get('origin');
    
    // Validate CORS
    if (origin && !this.config.allowedOrigins.includes(origin)) {
      return {
        allowed: false,
        reason: 'Invalid origin',
        statusCode: 403,
        auditEvent: {
          eventType: 'security_event',
          outcome: 'failure',
          details: { reason: 'cors_violation', origin }
        }
      };
    }

    // Validate Content-Type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {
          allowed: false,
          reason: 'Invalid content type',
          statusCode: 400,
          auditEvent: {
            eventType: 'security_event',
            outcome: 'failure',
            details: { reason: 'invalid_content_type', contentType }
          }
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Validate rate limiting
   */
  private async validateRateLimit(
    request: NextRequest,
    context: SecurityContext
  ): Promise<SecurityValidationResult> {
    const key = `${context.ipAddress}:${context.endpoint}`;
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindow;

    let rateLimitState = this.rateLimitStore.get(key);
    
    if (!rateLimitState || rateLimitState.windowStart < windowStart) {
      // New window or expired window
      rateLimitState = {
        requests: 1,
        windowStart: now,
        blocked: false
      };
    } else {
      // Existing window
      rateLimitState.requests++;
    }

    // Check if rate limit exceeded
    if (rateLimitState.requests > this.config.rateLimitRequests) {
      rateLimitState.blocked = true;
      this.rateLimitStore.set(key, rateLimitState);

      return {
        allowed: false,
        reason: 'Rate limit exceeded',
        statusCode: 429,
        headers: {
          'X-RateLimit-Limit': this.config.rateLimitRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil((rateLimitState.windowStart + this.config.rateLimitWindow) / 1000).toString()
        },
        auditEvent: {
          eventType: 'security_event',
          outcome: 'warning',
          details: { reason: 'rate_limit_exceeded', requests: rateLimitState.requests }
        }
      };
    }

    this.rateLimitStore.set(key, rateLimitState);

    return {
      allowed: true,
      headers: {
        'X-RateLimit-Limit': this.config.rateLimitRequests.toString(),
        'X-RateLimit-Remaining': (this.config.rateLimitRequests - rateLimitState.requests).toString(),
        'X-RateLimit-Reset': Math.ceil((rateLimitState.windowStart + this.config.rateLimitWindow) / 1000).toString()
      }
    };
  }

  /**
   * Validate request size
   */
  private async validateRequestSize(
    request: NextRequest,
    context: SecurityContext
  ): Promise<SecurityValidationResult> {
    const contentLength = request.headers.get('content-length');

    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > this.config.maxRequestSize) {
        return {
          allowed: false,
          reason: 'Request too large',
          statusCode: 413,
          auditEvent: {
            eventType: 'security_event',
            outcome: 'failure',
            details: { reason: 'request_too_large', size, maxSize: this.config.maxRequestSize }
          }
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Validate authentication
   */
  private async validateAuthentication(
    request: NextRequest,
    context: SecurityContext
  ): Promise<SecurityValidationResult> {
    const authHeader = request.headers.get('authorization');
    const apiKey = request.headers.get('x-api-key');

    // Check for Bearer token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const isValid = await this.validateJWTToken(token);

      if (!isValid) {
        return {
          allowed: false,
          reason: 'Invalid authentication token',
          statusCode: 401,
          auditEvent: {
            eventType: 'user_authentication',
            outcome: 'failure',
            details: { reason: 'invalid_jwt_token' }
          }
        };
      }

      // Extract user ID from token for context
      context.userId = await this.extractUserIdFromToken(token);
      return { allowed: true };
    }

    // Check for API key
    if (apiKey) {
      const isValid = await this.validateApiKey(apiKey);

      if (!isValid) {
        return {
          allowed: false,
          reason: 'Invalid API key',
          statusCode: 401,
          auditEvent: {
            eventType: 'user_authentication',
            outcome: 'failure',
            details: { reason: 'invalid_api_key' }
          }
        };
      }

      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Authentication required',
      statusCode: 401,
      auditEvent: {
        eventType: 'user_authentication',
        outcome: 'failure',
        details: { reason: 'no_authentication_provided' }
      }
    };
  }

  /**
   * Validate authorization
   */
  private async validateAuthorization(
    request: NextRequest,
    context: SecurityContext
  ): Promise<SecurityValidationResult> {
    if (!context.userId) {
      return {
        allowed: false,
        reason: 'User identification required for authorization',
        statusCode: 403
      };
    }

    const requiredRole = this.getRequiredRole(context.endpoint, context.method);
    const userRole = await this.getUserRole(context.userId);

    if (!this.hasRequiredRole(userRole, requiredRole)) {
      return {
        allowed: false,
        reason: 'Insufficient permissions',
        statusCode: 403,
        auditEvent: {
          eventType: 'security_event',
          outcome: 'failure',
          details: {
            reason: 'insufficient_permissions',
            requiredRole,
            userRole,
            endpoint: context.endpoint
          }
        }
      };
    }

    return { allowed: true };
  }

  /**
   * Validate request structure
   */
  private async validateRequestStructure(
    request: NextRequest,
    context: SecurityContext
  ): Promise<SecurityValidationResult> {
    // Basic request structure validation
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const body = await request.clone().text();
        if (body) {
          JSON.parse(body); // Validate JSON structure
        }
      } catch (error) {
        return {
          allowed: false,
          reason: 'Invalid JSON structure',
          statusCode: 400,
          auditEvent: {
            eventType: 'security_event',
            outcome: 'failure',
            details: { reason: 'invalid_json', error: error instanceof Error ? error.message : 'Unknown error' }
          }
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Validate compliance
   */
  private async validateCompliance(
    request: NextRequest,
    context: SecurityContext
  ): Promise<SecurityValidationResult> {
    if (!this.complianceService) {
      return { allowed: true }; // Graceful degradation
    }

    try {
      const isCompliant = await this.complianceService.validateConsent(
        context.userId || 'anonymous',
        context.dataClassification,
        'api_access'
      );

      if (!isCompliant) {
        return {
          allowed: false,
          reason: 'Compliance validation failed',
          statusCode: 403,
          auditEvent: {
            eventType: 'compliance_event',
            outcome: 'failure',
            details: {
              reason: 'compliance_violation',
              dataClassification: context.dataClassification,
              legalBasis: context.legalBasis
            }
          }
        };
      }

      return { allowed: true };

    } catch (error) {
      console.warn('⚠️ [SECURITY_MIDDLEWARE] Compliance validation failed:', error);
      return { allowed: true }; // Graceful degradation
    }
  }

  /**
   * Log security event to audit trail
   */
  private async logSecurityEvent(
    context: SecurityContext,
    eventType: AuditEventType,
    outcome: 'success' | 'failure' | 'warning',
    details: any
  ): Promise<void> {
    if (!this.auditTrail) {
      return; // Graceful degradation
    }

    try {
      await this.auditTrail.logAuditEvent({
        eventType,
        userId: context.userId,
        sessionId: context.sessionId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        resource: context.endpoint,
        action: context.method,
        outcome,
        details,
        classification: context.dataClassification,
        legalBasis: context.legalBasis,
        processingPurpose: 'api_security_validation',
        retentionPeriod: context.dataClassification === 'secret' ? 2555 : 1095 // 7 years for secret, 3 years for others
      });

    } catch (error) {
      console.error('❌ [SECURITY_MIDDLEWARE] Failed to log security event:', error);
      // Don't throw - graceful degradation
    }
  }

  /**
   * Get security headers for response
   */
  private getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'X-Powered-By': 'SELLY-Government-API',
      'X-Security-Level': this.config.securityLevel,
      'X-Compliance-Standards': 'UU-27-2022,ISO-27001,BSSN'
    };
  }

  /**
   * Helper methods
   */
  private getClientIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0] ||
           request.headers.get('x-real-ip') ||
           '127.0.0.1';
  }

  private determineDataClassification(endpoint: string): DataClassification {
    if (endpoint.includes('/admin') || endpoint.includes('/security')) return 'secret';
    if (endpoint.includes('/compliance') || endpoint.includes('/chat')) return 'confidential';
    if (endpoint.includes('/monitoring') || endpoint.includes('/session')) return 'internal';
    return 'public';
  }

  private determineLegalBasis(endpoint: string): LegalBasis {
    if (endpoint.includes('/auth') || endpoint.includes('/register')) return 'consent';
    if (endpoint.includes('/compliance') || endpoint.includes('/security')) return 'legal_obligation';
    return 'legitimate_interests';
  }

  private isAuditRequired(endpoint: string): boolean {
    return !endpoint.includes('/health') && !endpoint.includes('/metrics');
  }

  private requiresAuthentication(request: NextRequest): boolean {
    const url = new URL(request.url);
    const publicEndpoints = ['/health', '/api/auth/login', '/api/register'];
    return !publicEndpoints.some(endpoint => url.pathname.startsWith(endpoint));
  }

  private requiresAuthorization(request: NextRequest): boolean {
    const url = new URL(request.url);
    const adminEndpoints = ['/admin', '/security', '/compliance'];
    return adminEndpoints.some(endpoint => url.pathname.includes(endpoint));
  }

  private async validateJWTToken(token: string): Promise<boolean> {
    // Mock JWT validation - in production, use proper JWT library
    try {
      const parts = token.split('.');
      return parts.length === 3;
    } catch {
      return false;
    }
  }

  private async validateApiKey(apiKey: string): Promise<boolean> {
    // Mock API key validation - in production, validate against database
    return apiKey.length >= 32;
  }

  private async extractUserIdFromToken(token: string): Promise<string | undefined> {
    // Mock user ID extraction - in production, decode JWT payload
    return 'mock-user-id';
  }

  private async getUserRole(userId: string): Promise<string> {
    // Mock role retrieval - in production, query database
    return 'operator';
  }

  private getRequiredRole(endpoint: string, method: string): string {
    if (endpoint.includes('/admin')) return 'admin';
    if (endpoint.includes('/security') || endpoint.includes('/compliance')) return 'admin';
    if (method === 'DELETE') return 'admin';
    return 'operator';
  }

  private hasRequiredRole(userRole: string, requiredRole: string): boolean {
    const roleHierarchy = { viewer: 1, operator: 2, admin: 3 };
    return (roleHierarchy[userRole as keyof typeof roleHierarchy] || 0) >=
           (roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0);
  }

  private startRateLimitCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const expiredKeys: string[] = [];

      for (const [key, state] of this.rateLimitStore) {
        if (state.windowStart + this.config.rateLimitWindow < now) {
          expiredKeys.push(key);
        }
      }

      for (const key of expiredKeys) {
        this.rateLimitStore.delete(key);
      }

      if (expiredKeys.length > 0) {
        console.log(`🧹 [SECURITY_MIDDLEWARE] Cleaned up ${expiredKeys.length} expired rate limit entries`);
      }
    }, this.config.rateLimitWindow);
  }
}
