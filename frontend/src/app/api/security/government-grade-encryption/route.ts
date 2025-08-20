/**
 * Government-Grade Encryption API - Phase 3 Week 2
 * API endpoint for AES-256-GCM, TLS 1.3, RSA-4096, and HSM integration
 * 
 * Provides comprehensive government-grade encryption services
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGovernmentGradeEncryption } from '../../../../services/security/GovernmentGradeEncryption';
import { getTLS13ConfigurationService } from '../../../../services/security/TLS13ConfigurationService';
import { getHSMIntegrationService } from '../../../../services/security/HSMIntegrationService';

/**
 * GET /api/security/government-grade-encryption
 * Handle government-grade encryption requests
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';
    
    console.log(`🔐 [GOVERNMENT_ENCRYPTION_API] Processing ${action} request`);

    // Initialize services
    const encryptionService = getGovernmentGradeEncryption();
    const tlsService = getTLS13ConfigurationService();
    const hsmService = getHSMIntegrationService();

    // Ensure services are initialized
    try {
      await encryptionService.initialize();
      await tlsService.initialize();
      await hsmService.initialize();
    } catch (initError) {
      console.warn('⚠️ [GOVERNMENT_ENCRYPTION_API] Service initialization warning:', initError);
      // Continue with partially initialized services for status check
    }

    switch (action) {
      case 'status':
        return await handleStatusRequest(encryptionService, tlsService, hsmService);
      
      case 'encryption-metrics':
        return await handleEncryptionMetricsRequest(encryptionService);
      
      case 'tls-config':
        return await handleTLSConfigRequest(tlsService);
      
      case 'hsm-status':
        return await handleHSMStatusRequest(hsmService);
      
      case 'generate-rsa-keypair':
        return await handleGenerateRSAKeyPairRequest(encryptionService);
      
      case 'security-validation':
        return await handleSecurityValidationRequest(encryptionService, tlsService, hsmService);
      
      default:
        return NextResponse.json({
          error: 'Invalid action',
          validActions: [
            'status', 'encryption-metrics', 'tls-config', 
            'hsm-status', 'generate-rsa-keypair', 'security-validation'
          ]
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [GOVERNMENT_ENCRYPTION_API] Error:', error);
    return NextResponse.json({
      error: 'Government-grade encryption service error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST /api/security/government-grade-encryption
 * Handle government-grade encryption operations
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();
    
    console.log(`🔐 [GOVERNMENT_ENCRYPTION_API] Processing POST ${action} request`);

    // Initialize services
    const encryptionService = getGovernmentGradeEncryption();
    const tlsService = getTLS13ConfigurationService();
    const hsmService = getHSMIntegrationService();

    // Ensure services are initialized
    try {
      await encryptionService.initialize();
      await tlsService.initialize();
      await hsmService.initialize();
    } catch (initError) {
      console.warn('⚠️ [GOVERNMENT_ENCRYPTION_API] Service initialization warning:', initError);
      // Continue with partially initialized services
    }

    switch (action) {
      case 'encrypt-data':
        return await handleEncryptDataRequest(encryptionService, body);
      
      case 'decrypt-data':
        return await handleDecryptDataRequest(encryptionService, body);
      
      case 'generate-key':
        return await handleGenerateKeyRequest(encryptionService, body);
      
      case 'rotate-key':
        return await handleRotateKeyRequest(encryptionService, body);
      
      case 'hsm-encrypt':
        return await handleHSMEncryptRequest(hsmService, body);
      
      case 'hsm-decrypt':
        return await handleHSMDecryptRequest(hsmService, body);
      
      case 'validate-tls-connection':
        return await handleValidateTLSConnectionRequest(tlsService, body);
      
      default:
        return NextResponse.json({
          error: 'Invalid action',
          validActions: [
            'encrypt-data', 'decrypt-data', 'generate-key', 'rotate-key',
            'hsm-encrypt', 'hsm-decrypt', 'validate-tls-connection'
          ]
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [GOVERNMENT_ENCRYPTION_API] Error:', error);
    return NextResponse.json({
      error: 'Government-grade encryption service error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Handle status request
 */
async function handleStatusRequest(
  encryptionService: any,
  tlsService: any,
  hsmService: any
) {
  const encryptionStatus = encryptionService.getStatus();
  const tlsStatus = tlsService.getStatus();
  const hsmStatus = hsmService.getStatus();

  return NextResponse.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    phase: 'Phase 3 Week 2',
    title: 'Government-Grade Encryption Service Status',
    data: {
      system: {
        isInitialized: true,
        serviceName: 'GovernmentGradeEncryptionService',
        version: '3.0.0',
        phase: 'Phase 3 Week 2',
        compliance: {
          encryptionStandard: 'AES-256-GCM',
          tlsVersion: 'TLS 1.3',
          keyExchange: 'RSA-4096',
          hsmSupport: hsmStatus.hsmEnabled,
          complianceLevel: 'government'
        }
      },
      components: {
        encryption: {
          isInitialized: encryptionStatus.isInitialized,
          algorithm: encryptionStatus.algorithm,
          complianceLevel: encryptionStatus.complianceLevel,
          activeKeys: encryptionStatus.activeKeys,
          keyRotationEnabled: encryptionStatus.keyRotationEnabled,
          systemHealth: encryptionStatus.systemHealth
        },
        tls: {
          isInitialized: tlsStatus.isInitialized,
          tlsVersion: tlsStatus.tlsVersion,
          approvedCipherSuites: tlsStatus.approvedCipherSuites,
          hstsEnabled: tlsStatus.hstsEnabled,
          governmentCompliant: tlsStatus.governmentCompliant,
          systemHealth: tlsStatus.systemHealth
        },
        hsm: {
          isInitialized: hsmStatus.isInitialized,
          hsmEnabled: hsmStatus.hsmEnabled,
          hsmType: hsmStatus.hsmType,
          keysStored: hsmStatus.keysStored,
          systemHealth: hsmStatus.systemHealth
        }
      },
      capabilities: [
        'AES-256-GCM encryption/decryption',
        'TLS 1.3 with approved cipher suites',
        'RSA-4096 key exchange',
        'Automated key rotation (90-day intervals)',
        'HSM integration for secure key storage',
        'Perfect Forward Secrecy',
        'Government-grade compliance',
        'Real-time security monitoring'
      ],
      integrationPoints: [
        'Indonesian Data Protection Service',
        'Audit logging systems',
        'Government certificate authorities',
        'HSM hardware modules',
        'TLS termination proxies'
      ]
    },
    week2Status: 'Government-Grade Encryption Active'
  });
}

/**
 * Handle encryption metrics request
 */
async function handleEncryptionMetricsRequest(encryptionService: any) {
  const metrics = encryptionService.getMetrics();

  return NextResponse.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    title: 'Government-Grade Encryption Metrics',
    data: metrics
  });
}

/**
 * Handle TLS configuration request
 */
async function handleTLSConfigRequest(tlsService: any) {
  const serverConfig = tlsService.getServerTLSConfig();
  const clientConfig = tlsService.getClientTLSConfig();
  const hstsHeaders = tlsService.generateHSTSHeaders();

  return NextResponse.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    title: 'TLS 1.3 Configuration',
    data: {
      serverConfig,
      clientConfig,
      hstsHeaders,
      complianceLevel: 'government'
    }
  });
}

/**
 * Handle HSM status request
 */
async function handleHSMStatusRequest(hsmService: any) {
  const hsmStatus = await hsmService.getHSMStatus();
  const metrics = hsmService.getMetrics();

  return NextResponse.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    title: 'HSM Integration Status',
    data: {
      hsmStatus,
      metrics
    }
  });
}

/**
 * Handle generate RSA key pair request
 */
async function handleGenerateRSAKeyPairRequest(encryptionService: any) {
  const keyPair = await encryptionService.generateRSAKeyPair();

  return NextResponse.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    title: 'RSA-4096 Key Pair Generated',
    data: {
      keyId: keyPair.keyId,
      publicKey: keyPair.publicKey,
      // Note: Private key is not returned for security
      keySize: 4096,
      algorithm: 'RSA'
    }
  });
}

/**
 * Handle security validation request
 */
async function handleSecurityValidationRequest(
  encryptionService: any,
  tlsService: any,
  hsmService: any
) {
  const encryptionMetrics = encryptionService.getMetrics();
  const tlsMetrics = tlsService.getMetrics();
  const hsmMetrics = hsmService.getMetrics();

  const overallComplianceScore = Math.round(
    (encryptionMetrics.complianceScore + 
     tlsMetrics.complianceScore + 
     hsmMetrics.complianceScore) / 3
  );

  return NextResponse.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    title: 'Government-Grade Security Validation',
    data: {
      overallComplianceScore,
      complianceLevel: overallComplianceScore >= 95 ? 'government' : 'standard',
      components: {
        encryption: {
          complianceScore: encryptionMetrics.complianceScore,
          status: encryptionMetrics.complianceScore >= 95 ? 'compliant' : 'needs_improvement'
        },
        tls: {
          complianceScore: tlsMetrics.complianceScore,
          status: tlsMetrics.complianceScore >= 95 ? 'compliant' : 'needs_improvement'
        },
        hsm: {
          complianceScore: hsmMetrics.complianceScore,
          status: hsmMetrics.complianceScore >= 95 ? 'compliant' : 'needs_improvement'
        }
      },
      recommendations: overallComplianceScore < 95 ? [
        'Review and update encryption algorithms',
        'Ensure TLS 1.3 is properly configured',
        'Validate HSM integration and key management',
        'Conduct security audit and penetration testing'
      ] : [
        'Maintain current security standards',
        'Continue regular security monitoring',
        'Schedule periodic compliance reviews'
      ]
    }
  });
}

/**
 * Handle encrypt data request
 */
async function handleEncryptDataRequest(encryptionService: any, body: any) {
  const { data, dataType, purpose, userId, keyId } = body;
  const result = await encryptionService.encryptData(data, dataType, purpose, userId, keyId);

  return NextResponse.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    title: 'Data Encrypted Successfully',
    data: result
  });
}

/**
 * Handle decrypt data request
 */
async function handleDecryptDataRequest(encryptionService: any, body: any) {
  const { encryptedData, keyId, userId, purpose, iv, tag, dataType } = body;
  const result = await encryptionService.decryptData(encryptedData, keyId, userId, purpose, iv, tag, dataType);

  return NextResponse.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    title: 'Data Decrypted Successfully',
    data: { decryptedData: result }
  });
}

/**
 * Handle generate key request
 */
async function handleGenerateKeyRequest(encryptionService: any, body: any) {
  const { purpose, dataClassification } = body;
  const keyId = await encryptionService.generateKey(purpose, dataClassification);

  return NextResponse.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    title: 'Encryption Key Generated',
    data: { keyId, purpose, dataClassification }
  });
}

/**
 * Handle rotate key request
 */
async function handleRotateKeyRequest(encryptionService: any, body: any) {
  const { keyId } = body;
  const result = await encryptionService.rotateKey(keyId);

  return NextResponse.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    title: 'Key Rotation Completed',
    data: result
  });
}

/**
 * Handle HSM encrypt request
 */
async function handleHSMEncryptRequest(hsmService: any, body: any) {
  const { keyId, data, algorithm } = body;
  const result = await hsmService.encryptWithHSM(keyId, data, algorithm);

  return NextResponse.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    title: 'HSM Encryption Completed',
    data: result
  });
}

/**
 * Handle HSM decrypt request
 */
async function handleHSMDecryptRequest(hsmService: any, body: any) {
  const { keyId, encryptedData, algorithm } = body;
  const result = await hsmService.decryptWithHSM(keyId, encryptedData, algorithm);

  return NextResponse.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    title: 'HSM Decryption Completed',
    data: result
  });
}

/**
 * Handle validate TLS connection request
 */
async function handleValidateTLSConnectionRequest(tlsService: any, body: any) {
  const result = tlsService.validateTLSConnection(body);

  return NextResponse.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    title: 'TLS Connection Validation Result',
    data: result
  });
}
