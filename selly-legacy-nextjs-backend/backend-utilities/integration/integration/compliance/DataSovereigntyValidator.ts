/**
 * Data Sovereignty Validator - Phase 4 Enterprise Integration
 * 
 * Validates data sovereignty compliance for Indonesian government data
 * ensuring all processing occurs within Indonesian jurisdiction.
 * 
 * Compliance: Government Integration Rule, Security Compliance Rule
 */

import { z } from 'zod';

export const DataLocationRequestSchema = z.object({
  dataType: z.enum(['population_data', 'administrative_data', 'land_data', 'legal_data']),
  operation: z.enum(['storage', 'processing', 'transmission', 'verification']),
  region: z.string(),
  classification: z.enum(['public', 'internal', 'confidential', 'secret'])
});

export type DataLocationRequest = z.infer<typeof DataLocationRequestSchema>;

/**
 * Validates data sovereignty compliance for Indonesian government data
 */
export class DataSovereigntyValidator {
  private readonly ALLOWED_REGIONS = ['ap-southeast-1', 'ap-southeast-3', 'indonesia'];
  private readonly PROHIBITED_REGIONS = ['us-east-1', 'us-west-1', 'eu-west-1', 'eu-central-1'];

  /**
   * Validates that data processing complies with Indonesian sovereignty requirements
   */
  async validateDataLocation(request: DataLocationRequest): Promise<{
    compliant: boolean;
    violations: string[];
    recommendations: string[];
  }> {
    const validatedRequest = DataLocationRequestSchema.parse(request);
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check region compliance
    if (this.PROHIBITED_REGIONS.includes(validatedRequest.region)) {
      violations.push(`Data processing in prohibited region: ${validatedRequest.region}`);
      recommendations.push('Move data processing to Indonesian regions (ap-southeast-1, ap-southeast-3)');
    }

    // Check classification requirements
    if (validatedRequest.classification === 'secret' && validatedRequest.region !== 'indonesia') {
      violations.push('Secret classification data must be processed within Indonesia');
      recommendations.push('Use Indonesian data centers for secret classification data');
    }

    return {
      compliant: violations.length === 0,
      violations,
      recommendations
    };
  }
}
