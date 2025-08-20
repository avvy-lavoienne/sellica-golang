/**
 * API Standardization Utilities - Phase 3 Week 23-24
 * Consistent API response formatting and validation for Indonesian government compliance
 * 
 * Implements standardized error handling, response structures, status codes,
 * request/response validation, API versioning, and security headers
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import type { DataClassification, LegalBasis } from '../types/compliance';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: string;
  timestamp: string;
  requestId: string;
  field?: string; // For validation errors
  value?: any; // For validation errors
}

export interface ResponseMetadata {
  timestamp: string;
  requestId: string;
  version: string;
  compliance: ComplianceMetadata;
  performance: PerformanceMetadata;
  security: SecurityMetadata;
}

export interface ComplianceMetadata {
  dataClassification: DataClassification;
  auditLogged: boolean;
  encryptionApplied: boolean;
  legalBasis?: LegalBasis;
  retentionPeriod?: number; // days
  processingPurpose?: string;
}

export interface PerformanceMetadata {
  processingTime: number; // milliseconds
  cacheHit: boolean;
  cacheKey?: string;
  dbQueries?: number;
  memoryUsage?: number; // bytes
}

export interface SecurityMetadata {
  securityLevel: 'standard' | 'government' | 'classified';
  encryptionAlgorithm?: string;
  signatureVerified?: boolean;
  rateLimitRemaining?: number;
  sessionId?: string;
}

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'uuid';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: string[];
  custom?: (value: any) => boolean | string;
}

export interface ApiVersionConfig {
  version: string;
  supportedVersions: string[];
  deprecatedVersions: string[];
  defaultVersion: string;
  versionHeader: string;
}

/**
 * API Standardization Service
 * Provides consistent API response formatting and validation
 */
export class ApiStandardization {
  private static instance: ApiStandardization;
  private versionConfig: ApiVersionConfig;
  private requestStartTimes: Map<string, number> = new Map();

  private constructor() {
    this.versionConfig = {
      version: '2.0.0',
      supportedVersions: ['1.0.0', '1.1.0', '2.0.0'],
      deprecatedVersions: ['1.0.0'],
      defaultVersion: '2.0.0',
      versionHeader: 'X-API-Version'
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ApiStandardization {
    if (!ApiStandardization.instance) {
      ApiStandardization.instance = new ApiStandardization();
    }
    return ApiStandardization.instance;
  }

  /**
   * Create standardized success response
   */
  public createSuccessResponse<T>(
    data: T,
    request: NextRequest,
    options: {
      dataClassification?: DataClassification;
      legalBasis?: LegalBasis;
      processingPurpose?: string;
      cacheHit?: boolean;
      cacheKey?: string;
      dbQueries?: number;
      encryptionApplied?: boolean;
      auditLogged?: boolean;
    } = {}
  ): NextResponse<ApiResponse<T>> {
    const requestId = this.getRequestId(request);
    const processingTime = this.getProcessingTime(requestId);

    const response: ApiResponse<T> = {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        version: this.getApiVersion(request),
        compliance: {
          dataClassification: options.dataClassification || 'internal',
          auditLogged: options.auditLogged || false,
          encryptionApplied: options.encryptionApplied || false,
          legalBasis: options.legalBasis,
          processingPurpose: options.processingPurpose
        },
        performance: {
          processingTime,
          cacheHit: options.cacheHit || false,
          cacheKey: options.cacheKey,
          dbQueries: options.dbQueries
        },
        security: {
          securityLevel: 'government',
          sessionId: this.getSessionId(request)
        }
      }
    };

    return this.createResponse(response, 200, request);
  }

  /**
   * Create standardized error response
   */
  public createErrorResponse(
    error: {
      code: string;
      message: string;
      details?: string;
      field?: string;
      value?: any;
    },
    statusCode: number,
    request: NextRequest,
    options: {
      dataClassification?: DataClassification;
      auditLogged?: boolean;
    } = {}
  ): NextResponse<ApiResponse<never>> {
    const requestId = this.getRequestId(request);
    const processingTime = this.getProcessingTime(requestId);

    const response: ApiResponse<never> = {
      success: false,
      error: {
        ...error,
        timestamp: new Date().toISOString(),
        requestId
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        version: this.getApiVersion(request),
        compliance: {
          dataClassification: options.dataClassification || 'internal',
          auditLogged: options.auditLogged || false,
          encryptionApplied: false
        },
        performance: {
          processingTime,
          cacheHit: false
        },
        security: {
          securityLevel: 'government',
          sessionId: this.getSessionId(request)
        }
      }
    };

    return this.createResponse(response, statusCode, request);
  }

  /**
   * Create validation error response
   */
  public createValidationErrorResponse(
    validationErrors: Array<{
      field: string;
      message: string;
      value?: any;
    }>,
    request: NextRequest
  ): NextResponse<ApiResponse<never>> {
    const requestId = this.getRequestId(request);
    const processingTime = this.getProcessingTime(requestId);

    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: JSON.stringify(validationErrors),
        timestamp: new Date().toISOString(),
        requestId
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        version: this.getApiVersion(request),
        compliance: {
          dataClassification: 'internal',
          auditLogged: true,
          encryptionApplied: false
        },
        performance: {
          processingTime,
          cacheHit: false
        },
        security: {
          securityLevel: 'government'
        }
      }
    };

    return this.createResponse(response, 400, request);
  }

  /**
   * Validate request against schema
   */
  public validateRequest(
    request: NextRequest,
    rules: ValidationRule[]
  ): Promise<{
    isValid: boolean;
    errors: Array<{
      field: string;
      message: string;
      value?: any;
    }>;
    data?: any;
  }> {
    return new Promise(async (resolve) => {
      try {
        const body = await request.clone().text();
        let data: any = {};

        // Parse JSON body if present
        if (body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
          try {
            data = JSON.parse(body);
          } catch (error) {
            resolve({
              isValid: false,
              errors: [{
                field: 'body',
                message: 'Invalid JSON format',
                value: body
              }]
            });
            return;
          }
        }

        // Parse query parameters
        const url = new URL(request.url);
        for (const [key, value] of url.searchParams) {
          data[key] = value;
        }

        const errors: Array<{ field: string; message: string; value?: any }> = [];

        // Validate each rule
        for (const rule of rules) {
          const value = data[rule.field];
          const error = this.validateField(rule, value);
          if (error) {
            errors.push({
              field: rule.field,
              message: error,
              value
            });
          }
        }

        resolve({
          isValid: errors.length === 0,
          errors,
          data
        });

      } catch (error) {
        resolve({
          isValid: false,
          errors: [{
            field: 'request',
            message: 'Request processing failed',
            value: error instanceof Error ? error.message : 'Unknown error'
          }]
        });
      }
    });
  }

  /**
   * Start request timing
   */
  public startRequestTiming(request: NextRequest): string {
    const requestId = this.getRequestId(request);
    this.requestStartTimes.set(requestId, performance.now());
    return requestId;
  }

  /**
   * Get API version from request
   */
  public getApiVersion(request: NextRequest): string {
    const versionHeader = request.headers.get(this.versionConfig.versionHeader);
    const urlVersion = this.extractVersionFromUrl(request.url);
    
    const requestedVersion = versionHeader || urlVersion || this.versionConfig.defaultVersion;
    
    // Validate version
    if (!this.versionConfig.supportedVersions.includes(requestedVersion)) {
      return this.versionConfig.defaultVersion;
    }
    
    return requestedVersion;
  }

  /**
   * Check if API version is deprecated
   */
  public isVersionDeprecated(version: string): boolean {
    return this.versionConfig.deprecatedVersions.includes(version);
  }

  /**
   * Get security headers for response
   */
  public getSecurityHeaders(request: NextRequest): Record<string, string> {
    const version = this.getApiVersion(request);
    
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'X-API-Version': version,
      'X-Powered-By': 'SELLY-Government-API',
      'X-Security-Level': 'government',
      'X-Compliance-Standards': 'UU-27-2022,ISO-27001,BSSN',
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
  }

  /**
   * Private helper methods
   */
  private createResponse<T>(
    data: T,
    status: number,
    request: NextRequest
  ): NextResponse<T> {
    const headers = this.getSecurityHeaders(request);
    
    // Add deprecation warning if needed
    const version = this.getApiVersion(request);
    if (this.isVersionDeprecated(version)) {
      headers['Warning'] = `299 - "API version ${version} is deprecated. Please upgrade to ${this.versionConfig.defaultVersion}"`;
    }

    return NextResponse.json(data, {
      status,
      headers
    });
  }

  private getRequestId(request: NextRequest): string {
    const existingId = request.headers.get('X-Request-ID');
    if (existingId) {
      return existingId;
    }
    
    return crypto.randomUUID();
  }

  private getSessionId(request: NextRequest): string | undefined {
    return request.headers.get('X-Session-ID') || undefined;
  }

  private getProcessingTime(requestId: string): number {
    const startTime = this.requestStartTimes.get(requestId);
    if (!startTime) {
      return 0;
    }
    
    const processingTime = performance.now() - startTime;
    this.requestStartTimes.delete(requestId); // Cleanup
    return Math.round(processingTime * 100) / 100; // Round to 2 decimal places
  }

  private extractVersionFromUrl(url: string): string | null {
    const versionMatch = url.match(/\/v(\d+(?:\.\d+)*)\//);
    return versionMatch ? versionMatch[1] : null;
  }

  private validateField(rule: ValidationRule, value: any): string | null {
    // Required validation
    if (rule.required && (value === undefined || value === null || value === '')) {
      return `${rule.field} is required`;
    }

    // Skip other validations if value is not provided and not required
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return null;
    }

    // Type validation
    const typeError = this.validateType(rule, value);
    if (typeError) {
      return typeError;
    }

    // Length validation for strings
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return `${rule.field} must be at least ${rule.minLength} characters`;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return `${rule.field} must be at most ${rule.maxLength} characters`;
      }
    }

    // Range validation for numbers
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return `${rule.field} must be at least ${rule.min}`;
      }
      if (rule.max !== undefined && value > rule.max) {
        return `${rule.field} must be at most ${rule.max}`;
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string') {
      if (!rule.pattern.test(value)) {
        return `${rule.field} format is invalid`;
      }
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      return `${rule.field} must be one of: ${rule.enum.join(', ')}`;
    }

    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(value);
      if (typeof customResult === 'string') {
        return customResult;
      }
      if (customResult === false) {
        return `${rule.field} is invalid`;
      }
    }

    return null;
  }

  private validateType(rule: ValidationRule, value: any): string | null {
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          return `${rule.field} must be a string`;
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `${rule.field} must be a number`;
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return `${rule.field} must be a boolean`;
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          return `${rule.field} must be an array`;
        }
        break;
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          return `${rule.field} must be an object`;
        }
        break;
      case 'email':
        if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return `${rule.field} must be a valid email address`;
        }
        break;
      case 'uuid':
        if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
          return `${rule.field} must be a valid UUID`;
        }
        break;
    }
    return null;
  }
}
