/**
 * UUID Mapping Service
 * Handles mapping between email addresses and proper UUIDs for database operations
 * Implements singleton pattern for optimal performance
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface UserUUIDMapping {
  id: number;
  email: string;
  uuid: string;
  created_at: string;
  last_used: string;
  is_active: boolean;
}

interface UUIDMappingConfig {
  cacheSize: number;
  cacheTTL: number; // milliseconds
  enableLogging: boolean;
}

export class UUIDMappingService {
  private static instance: UUIDMappingService;
  private supabase: SupabaseClient;
  private mappingCache = new Map<string, { uuid: string; timestamp: number }>();
  private config: UUIDMappingConfig;

  private constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.config = {
      cacheSize: 1000,
      cacheTTL: 3600000, // 1 hour
      enableLogging: true
    };

    if (this.config.enableLogging) {
      console.log('✅ [UUID_MAPPING] Service initialized with singleton pattern');
    }
  }

  static getInstance(): UUIDMappingService {
    if (!UUIDMappingService.instance) {
      UUIDMappingService.instance = new UUIDMappingService();
    }
    return UUIDMappingService.instance;
  }

  /**
   * Get or create UUID for email address
   * Implements caching for optimal performance
   */
  async getOrCreateUserUUID(email: string): Promise<string> {
    // Validate email format first (before try-catch to ensure it throws)
    if (!this.isValidEmail(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }

    try {

      // Check cache first
      const cached = this.getCachedUUID(email);
      if (cached) {
        if (this.config.enableLogging) {
          console.log(`💾 [UUID_MAPPING] Cache HIT for email: ${this.maskEmail(email)}`);
        }
        return cached;
      }

      // Check database
      const existing = await this.findExistingMapping(email);
      if (existing) {
        this.setCachedUUID(email, existing.uuid);
        await this.updateLastUsed(existing.uuid);
        
        if (this.config.enableLogging) {
          console.log(`🔍 [UUID_MAPPING] Database HIT for email: ${this.maskEmail(email)}`);
        }
        return existing.uuid;
      }

      // Create new UUID mapping
      const newUUID = crypto.randomUUID();
      await this.createMapping(email, newUUID);
      this.setCachedUUID(email, newUUID);

      if (this.config.enableLogging) {
        console.log(`✨ [UUID_MAPPING] Created new UUID for email: ${this.maskEmail(email)}`);
      }

      return newUUID;
    } catch (error) {
      console.error('❌ [UUID_MAPPING] Error in getOrCreateUserUUID:', error);
      
      // Fallback to deterministic UUID generation
      return this.generateFallbackUUID(email);
    }
  }

  /**
   * Get UUID for email if exists, return null if not found
   */
  async getExistingUUID(email: string): Promise<string | null> {
    try {
      // Check cache first
      const cached = this.getCachedUUID(email);
      if (cached) {
        return cached;
      }

      // Check database
      const existing = await this.findExistingMapping(email);
      if (existing) {
        this.setCachedUUID(email, existing.uuid);
        return existing.uuid;
      }

      return null;
    } catch (error) {
      console.error('❌ [UUID_MAPPING] Error in getExistingUUID:', error);
      return null;
    }
  }

  /**
   * Validate if string is a proper UUID
   */
  isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Check if identifier is email or UUID and return appropriate UUID
   */
  async resolveToUUID(identifier: string): Promise<string> {
    if (this.isValidUUID(identifier)) {
      return identifier;
    }

    if (this.isValidEmail(identifier)) {
      return await this.getOrCreateUserUUID(identifier);
    }

    // For local session IDs or other formats, generate deterministic UUID
    return this.generateFallbackUUID(identifier);
  }

  /**
   * Migrate existing email-based sessions to UUID format
   */
  async migrateExistingSessions(): Promise<{ migrated: number; errors: number }> {
    let migrated = 0;
    let errors = 0;

    try {
      if (this.config.enableLogging) {
        console.log('🔄 [UUID_MAPPING] Starting session migration...');
      }

      // Get all unique email-based user IDs from chat_sessions
      const { data: sessions, error } = await this.supabase
        .from('chat_sessions')
        .select('user_id')
        .like('user_id', '%@%')
        .limit(1000);

      if (error) {
        console.error('❌ [UUID_MAPPING] Error fetching sessions for migration:', error);
        return { migrated: 0, errors: 1 };
      }

      if (!sessions || sessions.length === 0) {
        if (this.config.enableLogging) {
          console.log('✅ [UUID_MAPPING] No email-based sessions found to migrate');
        }
        return { migrated: 0, errors: 0 };
      }

      // Get unique emails
      const uniqueEmails = [...new Set(sessions.map(s => s.user_id))];

      for (const email of uniqueEmails) {
        try {
          await this.getOrCreateUserUUID(email);
          migrated++;
        } catch (error) {
          console.error(`❌ [UUID_MAPPING] Error migrating email ${this.maskEmail(email)}:`, error);
          errors++;
        }
      }

      if (this.config.enableLogging) {
        console.log(`✅ [UUID_MAPPING] Migration completed: ${migrated} migrated, ${errors} errors`);
      }

      return { migrated, errors };
    } catch (error) {
      console.error('❌ [UUID_MAPPING] Error in migration process:', error);
      return { migrated, errors: errors + 1 };
    }
  }

  // Private helper methods

  private getCachedUUID(email: string): string | null {
    const cached = this.mappingCache.get(email);
    if (cached && (Date.now() - cached.timestamp) < this.config.cacheTTL) {
      return cached.uuid;
    }

    if (cached) {
      this.mappingCache.delete(email); // Remove expired cache
    }

    return null;
  }

  private setCachedUUID(email: string, uuid: string): void {
    // Implement LRU cache behavior
    if (this.mappingCache.size >= this.config.cacheSize) {
      const firstKey = this.mappingCache.keys().next().value;
      if (firstKey) {
        this.mappingCache.delete(firstKey);
      }
    }

    this.mappingCache.set(email, {
      uuid,
      timestamp: Date.now()
    });
  }

  private async findExistingMapping(email: string): Promise<UserUUIDMapping | null> {
    const { data, error } = await this.supabase
      .from('user_uuid_mappings')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return data;
  }

  private async createMapping(email: string, uuid: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_uuid_mappings')
      .insert({
        email,
        uuid,
        created_at: new Date().toISOString(),
        last_used: new Date().toISOString(),
        is_active: true
      });

    if (error) {
      throw error;
    }
  }

  private async updateLastUsed(uuid: string): Promise<void> {
    // Update asynchronously to avoid blocking
    this.supabase
      .from('user_uuid_mappings')
      .update({ last_used: new Date().toISOString() })
      .eq('uuid', uuid)
      .then(({ error }) => {
        if (error && this.config.enableLogging) {
          console.warn('⚠️ [UUID_MAPPING] Failed to update last_used:', error);
        }
      });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private generateFallbackUUID(identifier: string): string {
    // Generate deterministic UUID based on identifier
    // This ensures same identifier always gets same UUID
    const hash = this.simpleHash(identifier);

    // Ensure the hash is long enough for UUID format
    const paddedHash = hash.padEnd(32, '0');

    // Create a valid UUID v4 format with deterministic data
    const uuid = `${paddedHash.slice(0, 8)}-${paddedHash.slice(8, 12)}-4${paddedHash.slice(12, 15)}-8${paddedHash.slice(15, 18)}-${paddedHash.slice(18, 30)}`;

    if (this.config.enableLogging) {
      console.log(`🔄 [UUID_MAPPING] Generated fallback UUID for: ${identifier.slice(0, 10)}...`);
    }

    return uuid;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Create a longer, more deterministic hash
    const baseHash = Math.abs(hash).toString(16);
    const extendedHash = baseHash + baseHash + baseHash; // Repeat to ensure length
    return extendedHash.padStart(32, '0').slice(0, 32);
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    return `${local.slice(0, 2)}***@${domain}`;
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): { size: number; hitRate: number; maxSize: number } {
    return {
      size: this.mappingCache.size,
      hitRate: 0, // Would need to track hits/misses for accurate calculation
      maxSize: this.config.cacheSize
    };
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.mappingCache.clear();
    if (this.config.enableLogging) {
      console.log('🧹 [UUID_MAPPING] Cache cleared');
    }
  }
}
