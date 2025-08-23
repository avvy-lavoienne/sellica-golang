/**
 * Service Migration Utility - Critical-2 Memory Leaks Fix
 * Helps migrate existing services to use GlobalServiceRegistry
 * 
 * Provides utilities to identify services that need migration and
 * helps enforce singleton patterns across the application.
 * 
 * Based on: docs/plan/2025-08-16-authentication-system-fixes-implementation-plan.md
 */

import { GlobalServiceRegistry } from './GlobalServiceRegistry';

export interface ServiceMigrationReport {
  serviceName: string;
  currentInstances: number;
  memoryUsage: number;
  migrationStatus: 'not_migrated' | 'partially_migrated' | 'fully_migrated';
  recommendations: string[];
  hasCleanupMethods: boolean;
}

export interface MigrationSummary {
  totalServices: number;
  migratedServices: number;
  duplicateServices: number;
  memoryReclaimed: number;
  recommendations: string[];
}

/**
 * ServiceMigrationUtility
 * Helps identify and migrate services to use GlobalServiceRegistry
 */
export class ServiceMigrationUtility {
  private static instance: ServiceMigrationUtility | null = null;

  private constructor() {
    console.log('🔧 [SERVICE_MIGRATION] Service migration utility initialized');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ServiceMigrationUtility {
    if (!ServiceMigrationUtility.instance) {
      ServiceMigrationUtility.instance = new ServiceMigrationUtility();
    }
    return ServiceMigrationUtility.instance;
  }

  /**
   * Analyze current service usage and identify migration opportunities
   */
  analyzeServices(): MigrationSummary {
    const serviceMetrics = GlobalServiceRegistry.getMemoryMetrics();
    const allServices = GlobalServiceRegistry.getAllServices();
    
    const migrationReports: ServiceMigrationReport[] = [];
    let totalMemoryReclaimed = 0;
    const recommendations: string[] = [];

    // Analyze each service
    for (const [serviceName, serviceInstance] of allServices) {
      const report = this.analyzeService(serviceName, serviceInstance);
      migrationReports.push(report);
      
      if (report.currentInstances > 1) {
        totalMemoryReclaimed += report.memoryUsage * (report.currentInstances - 1);
      }
    }

    // Generate recommendations
    if (serviceMetrics.duplicateServices.length > 0) {
      recommendations.push(`Remove ${serviceMetrics.duplicateServices.length} duplicate service instances`);
    }

    if (serviceMetrics.totalMemoryUsage > 400 * 1024 * 1024) {
      recommendations.push('Memory usage exceeds 400MB target - implement aggressive cleanup');
    }

    const migratedCount = migrationReports.filter(r => r.migrationStatus === 'fully_migrated').length;

    return {
      totalServices: migrationReports.length,
      migratedServices: migratedCount,
      duplicateServices: serviceMetrics.duplicateServices.length,
      memoryReclaimed: totalMemoryReclaimed,
      recommendations
    };
  }

  /**
   * Analyze individual service
   */
  private analyzeService(serviceName: string, serviceInstance: any): ServiceMigrationReport {
    const recommendations: string[] = [];
    let migrationStatus: 'not_migrated' | 'partially_migrated' | 'fully_migrated' = 'fully_migrated';

    // Check if service has cleanup methods
    const hasCleanupMethods = 
      typeof serviceInstance.instance?.clearCache === 'function' ||
      typeof serviceInstance.instance?.cleanup === 'function';

    if (!hasCleanupMethods) {
      recommendations.push('Add clearCache() and cleanup() methods for memory management');
      migrationStatus = 'partially_migrated';
    }

    // Check for singleton violations
    const baseServiceName = serviceName.split('_')[0];
    const allServices = GlobalServiceRegistry.getAllServices();
    const similarServices = Array.from(allServices.keys())
      .filter(name => name.startsWith(baseServiceName));

    if (similarServices.length > 1) {
      recommendations.push(`Multiple instances detected: ${similarServices.join(', ')}`);
      migrationStatus = 'partially_migrated';
    }

    // Check memory usage
    if (serviceInstance.memoryUsage > 50 * 1024 * 1024) { // 50MB
      recommendations.push('High memory usage - consider implementing memory optimization');
    }

    return {
      serviceName,
      currentInstances: similarServices.length,
      memoryUsage: serviceInstance.memoryUsage,
      migrationStatus,
      recommendations,
      hasCleanupMethods
    };
  }

  /**
   * Generate migration code template for a service
   */
  generateMigrationTemplate(serviceName: string): string {
    return `
// Migration template for ${serviceName}
import { GlobalServiceRegistry } from '@/services/core/GlobalServiceRegistry';

export class ${serviceName} {
  private static instance: ${serviceName} | null = null;

  private constructor() {
    // Initialize service
  }

  /**
   * Get singleton instance via GlobalServiceRegistry
   */
  static getInstance(): ${serviceName} {
    return GlobalServiceRegistry.getServiceInstance(
      ${serviceName},
      '${serviceName}'
    );
  }

  /**
   * Clear cache for GlobalServiceRegistry cleanup
   */
  clearCache(): void {
    // Implement cache clearing logic
    console.log('🧹 [${serviceName.toUpperCase()}] Cache cleared');
  }

  /**
   * Cleanup method for GlobalServiceRegistry
   */
  cleanup(): void {
    // Implement cleanup logic
    this.clearCache();
    console.log('🧹 [${serviceName.toUpperCase()}] Cleanup completed');
  }
}
`;
  }

  /**
   * Perform automatic migration for services that support it
   */
  performAutomaticMigration(): {
    migrated: string[];
    failed: string[];
    memoryReclaimed: number;
  } {
    const migrated: string[] = [];
    const failed: string[] = [];
    let memoryReclaimed = 0;

    const serviceMetrics = GlobalServiceRegistry.getMemoryMetrics();
    
    // Remove duplicate services
    for (const duplicateService of serviceMetrics.duplicateServices) {
      try {
        const removed = GlobalServiceRegistry.removeService(duplicateService);
        if (removed) {
          migrated.push(duplicateService);
          memoryReclaimed += 1024 * 1024; // Estimate 1MB per service
          console.log(`✅ [SERVICE_MIGRATION] Removed duplicate service: ${duplicateService}`);
        }
      } catch (error) {
        failed.push(duplicateService);
        console.error(`❌ [SERVICE_MIGRATION] Failed to remove ${duplicateService}:`, error);
      }
    }

    return {
      migrated,
      failed,
      memoryReclaimed
    };
  }

  /**
   * Generate migration report
   */
  generateMigrationReport(): string {
    const summary = this.analyzeServices();
    const serviceMetrics = GlobalServiceRegistry.getMemoryMetrics();
    
    let report = `
# Service Migration Report - Critical-2 Memory Leaks Fix

## Summary
- Total Services: ${summary.totalServices}
- Migrated Services: ${summary.migratedServices}
- Duplicate Services: ${summary.duplicateServices}
- Memory Usage: ${(serviceMetrics.totalMemoryUsage / 1024 / 1024).toFixed(2)}MB
- Potential Memory Reclaimed: ${(summary.memoryReclaimed / 1024 / 1024).toFixed(2)}MB

## Recommendations
`;

    for (const recommendation of summary.recommendations) {
      report += `- ${recommendation}\n`;
    }

    report += `
## Service Details
`;

    const allServices = GlobalServiceRegistry.getAllServices();
    for (const [serviceName, serviceInstance] of allServices) {
      const serviceReport = this.analyzeService(serviceName, serviceInstance);
      report += `
### ${serviceName}
- Status: ${serviceReport.migrationStatus}
- Memory Usage: ${(serviceReport.memoryUsage / 1024 / 1024).toFixed(2)}MB
- Has Cleanup Methods: ${serviceReport.hasCleanupMethods ? 'Yes' : 'No'}
- Recommendations: ${serviceReport.recommendations.join(', ') || 'None'}
`;
    }

    return report;
  }

  /**
   * Validate service migration
   */
  validateMigration(): {
    isValid: boolean;
    issues: string[];
    memoryUsage: number;
    serviceCount: number;
  } {
    const issues: string[] = [];
    const serviceMetrics = GlobalServiceRegistry.getMemoryMetrics();
    const memoryUsageMB = serviceMetrics.totalMemoryUsage / 1024 / 1024;

    // Check memory usage against target (400MB)
    if (memoryUsageMB > 400) {
      issues.push(`Memory usage ${memoryUsageMB.toFixed(2)}MB exceeds 400MB target`);
    }

    // Check for duplicate services
    if (serviceMetrics.duplicateServices.length > 0) {
      issues.push(`${serviceMetrics.duplicateServices.length} duplicate services detected`);
    }

    // Check service count (should be reasonable)
    if (serviceMetrics.serviceCount > 50) {
      issues.push(`High service count: ${serviceMetrics.serviceCount} services`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      memoryUsage: memoryUsageMB,
      serviceCount: serviceMetrics.serviceCount
    };
  }

  /**
   * Get migration status
   */
  getMigrationStatus(): {
    phase: 'not_started' | 'in_progress' | 'completed';
    progress: number; // 0-100
    nextSteps: string[];
  } {
    const summary = this.analyzeServices();
    const progress = summary.totalServices > 0 ? 
      (summary.migratedServices / summary.totalServices) * 100 : 0;

    let phase: 'not_started' | 'in_progress' | 'completed' = 'not_started';
    if (progress > 0 && progress < 100) {
      phase = 'in_progress';
    } else if (progress === 100) {
      phase = 'completed';
    }

    const nextSteps: string[] = [];
    if (summary.duplicateServices > 0) {
      nextSteps.push('Remove duplicate service instances');
    }
    if (summary.migratedServices < summary.totalServices) {
      nextSteps.push('Complete service migration to GlobalServiceRegistry');
    }
    if (nextSteps.length === 0) {
      nextSteps.push('Monitor memory usage and maintain singleton patterns');
    }

    return {
      phase,
      progress,
      nextSteps
    };
  }
}
