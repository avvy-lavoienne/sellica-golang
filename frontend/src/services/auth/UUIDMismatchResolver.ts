/**
 * UUID Mismatch Resolver Service
 * 
 * Purpose: Resolves UUID mismatches between Supabase Auth and Profiles table
 * Context: Fixes Phase 3 session ownership validation failures
 * Priority: CRITICAL - Required for proper authentication flow
 */

import { supabase } from '@/lib/conn/supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js';

interface ProfileData {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  nip: string | null;
  position: string | null;
  nik: string | null;
  created_at?: string;
  updated_at?: string;
}

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: any;
}

interface ResolutionResult {
  success: boolean;
  action: 'created' | 'updated' | 'skipped' | 'error';
  userId: string;
  email?: string;
  error?: string;
  details?: any;
}

export class UUIDMismatchResolver {
  private supabase: SupabaseClient;
  private logger: {
    info: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
    error: (message: string, data?: any) => void;
  };

  constructor() {
    this.supabase = supabase;
    this.logger = {
      info: (message: string, data?: any) => {
        console.log(`ℹ️ [UUID_RESOLVER] ${message}`, data || '');
      },
      warn: (message: string, data?: any) => {
        console.warn(`⚠️ [UUID_RESOLVER] ${message}`, data || '');
      },
      error: (message: string, data?: any) => {
        console.error(`❌ [UUID_RESOLVER] ${message}`, data || '');
      }
    };
  }

  /**
   * Resolve UUID mismatch for a specific user
   * This is the main method called when a user login fails due to missing profile
   */
  async resolveUserUUIDMismatch(authUserId: string, email?: string): Promise<ResolutionResult> {
    try {
      this.logger.info(`Resolving UUID mismatch for user: ${authUserId.slice(0, 8)}...`, { email });

      // Step 1: Check if profile already exists with this UUID
      const existingProfile = await this.getProfileById(authUserId);
      if (existingProfile) {
        this.logger.info('Profile already exists with correct UUID', { userId: authUserId.slice(0, 8) });
        return {
          success: true,
          action: 'skipped',
          userId: authUserId,
          email: existingProfile.email || undefined
        };
      }

      // Step 2: Get auth user data
      const authUser = await this.getAuthUser(authUserId);
      if (!authUser) {
        return {
          success: false,
          action: 'error',
          userId: authUserId,
          error: 'Auth user not found'
        };
      }

      // Step 3: Check if there's an existing profile with the same email
      if (authUser.email) {
        const profileByEmail = await this.getProfileByEmail(authUser.email);
        if (profileByEmail && profileByEmail.id !== authUserId) {
          // There's a profile with different UUID - this is the mismatch case
          this.logger.warn('Found profile with different UUID for same email', {
            authUserId: authUserId.slice(0, 8),
            profileUserId: profileByEmail.id.slice(0, 8),
            email: authUser.email
          });

          // Update the existing profile to use the correct auth UUID
          const updateResult = await this.updateProfileUUID(profileByEmail, authUserId);
          return updateResult;
        }
      }

      // Step 4: Create new profile for auth user
      const createResult = await this.createProfileForAuthUser(authUser);
      return createResult;

    } catch (error) {
      this.logger.error('Failed to resolve UUID mismatch', error);
      return {
        success: false,
        action: 'error',
        userId: authUserId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get profile by ID
   */
  private async getProfileById(userId: string): Promise<ProfileData | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Failed to get profile by ID', error);
      return null;
    }
  }

  /**
   * Get profile by email
   */
  private async getProfileByEmail(email: string): Promise<ProfileData | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Failed to get profile by email', error);
      return null;
    }
  }

  /**
   * Get auth user data
   */
  private async getAuthUser(userId: string): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error || !user || user.id !== userId) {
        // Try to get user data from admin API if available
        // For now, we'll construct basic user data
        return null;
      }

      return {
        id: user.id,
        email: user.email || '',
        created_at: user.created_at,
        user_metadata: user.user_metadata
      };
    } catch (error) {
      this.logger.error('Failed to get auth user', error);
      return null;
    }
  }

  /**
   * Create profile for auth user
   */
  private async createProfileForAuthUser(authUser: AuthUser): Promise<ResolutionResult> {
    try {
      const profileData: Partial<ProfileData> = {
        id: authUser.id,
        name: this.extractNameFromAuthUser(authUser),
        email: authUser.email,
        role: 'user',
        created_at: authUser.created_at,
        updated_at: new Date().toISOString()
      };

      const { error } = await this.supabase
        .from('profiles')
        .insert(profileData);

      if (error) {
        throw error;
      }

      this.logger.info('Created new profile for auth user', {
        userId: authUser.id.slice(0, 8),
        email: authUser.email
      });

      return {
        success: true,
        action: 'created',
        userId: authUser.id,
        email: authUser.email,
        details: profileData
      };

    } catch (error) {
      this.logger.error('Failed to create profile for auth user', error);
      return {
        success: false,
        action: 'error',
        userId: authUser.id,
        email: authUser.email,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update profile UUID (complex operation - requires careful handling)
   */
  private async updateProfileUUID(existingProfile: ProfileData, newUserId: string): Promise<ResolutionResult> {
    try {
      this.logger.warn('UUID update operation required - this is a complex migration', {
        oldUserId: existingProfile.id.slice(0, 8),
        newUserId: newUserId.slice(0, 8),
        email: existingProfile.email
      });

      // For safety, we'll create a new profile instead of updating the UUID
      // This prevents potential foreign key constraint issues
      const newProfileData: Partial<ProfileData> = {
        id: newUserId,
        name: existingProfile.name,
        email: existingProfile.email,
        role: existingProfile.role,
        nip: existingProfile.nip,
        position: existingProfile.position,
        nik: existingProfile.nik,
        created_at: existingProfile.created_at,
        updated_at: new Date().toISOString()
      };

      const { error } = await this.supabase
        .from('profiles')
        .insert(newProfileData);

      if (error) {
        throw error;
      }

      this.logger.info('Created new profile with correct UUID', {
        oldUserId: existingProfile.id.slice(0, 8),
        newUserId: newUserId.slice(0, 8),
        email: existingProfile.email
      });

      // Note: The old profile should be cleaned up in a separate maintenance operation
      // to avoid breaking existing references

      return {
        success: true,
        action: 'created',
        userId: newUserId,
        email: existingProfile.email || undefined,
        details: {
          oldUserId: existingProfile.id,
          newUserId: newUserId,
          migrationNote: 'Created new profile with correct UUID'
        }
      };

    } catch (error) {
      this.logger.error('Failed to update profile UUID', error);
      return {
        success: false,
        action: 'error',
        userId: newUserId,
        email: existingProfile.email || undefined,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Extract name from auth user data
   */
  private extractNameFromAuthUser(authUser: AuthUser): string {
    if (authUser.user_metadata?.name) {
      return authUser.user_metadata.name;
    }
    
    if (authUser.user_metadata?.full_name) {
      return authUser.user_metadata.full_name;
    }

    if (authUser.email) {
      return authUser.email.split('@')[0];
    }

    return 'User';
  }

  /**
   * Batch resolve multiple users (for migration purposes)
   */
  async batchResolveUUIDMismatches(): Promise<{
    resolved: number;
    errors: number;
    details: ResolutionResult[];
  }> {
    this.logger.info('Starting batch UUID mismatch resolution...');

    const results: ResolutionResult[] = [];
    let resolved = 0;
    let errors = 0;

    try {
      // This would need to be implemented with proper auth admin access
      // For now, we'll return a placeholder
      this.logger.warn('Batch resolution requires admin access - not implemented yet');
      
      return {
        resolved,
        errors,
        details: results
      };

    } catch (error) {
      this.logger.error('Batch resolution failed', error);
      return {
        resolved: 0,
        errors: 1,
        details: [{
          success: false,
          action: 'error',
          userId: 'batch',
          error: error instanceof Error ? error.message : 'Unknown error'
        }]
      };
    }
  }
}

// Singleton instance
let resolverInstance: UUIDMismatchResolver | null = null;

export function getUUIDMismatchResolver(): UUIDMismatchResolver {
  if (!resolverInstance) {
    resolverInstance = new UUIDMismatchResolver();
  }
  return resolverInstance;
}
