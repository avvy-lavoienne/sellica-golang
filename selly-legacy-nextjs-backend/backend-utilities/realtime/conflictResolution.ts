/**
 * Conflict Resolution Service - Week 4 Implementation
 * Operational transformation and conflict resolution for real-time collaboration
 */

import { SessionStorageAdapter } from '@/services/session/storage';

export interface ConflictResolutionConfig {
  strategy: ConflictStrategy;
  maxHistorySize: number;
  operationTimeout: number;
  enableVersionVectors: boolean;
  enableOperationalTransform: boolean;
}

export type ConflictStrategy = 
  | 'last_writer_wins'
  | 'first_writer_wins'
  | 'operational_transform'
  | 'manual_resolution'
  | 'merge_strategy';

export interface Operation {
  id: string;
  type: OperationType;
  sessionId: string;
  userId: string;
  deviceId: string;
  timestamp: number;
  vectorClock: VectorClock;
  data: OperationData;
  dependencies: string[];
  isTransformed: boolean;
}

export type OperationType = 
  | 'insert_text'
  | 'delete_text'
  | 'insert_message'
  | 'edit_message'
  | 'delete_message'
  | 'move_cursor'
  | 'session_update'
  | 'user_action';

export interface OperationData {
  messageId?: string;
  position?: number;
  length?: number;
  content?: string;
  metadata?: Record<string, any>;
}

export interface VectorClock {
  [deviceId: string]: number;
}

export interface ConflictEvent {
  id: string;
  timestamp: number;
  sessionId: string;
  conflictType: ConflictType;
  operations: Operation[];
  resolution: ConflictResolution;
  status: 'pending' | 'resolved' | 'failed';
}

export type ConflictType = 
  | 'concurrent_edit'
  | 'delete_edit_conflict'
  | 'move_conflict'
  | 'state_divergence'
  | 'version_mismatch';

export interface ConflictResolution {
  strategy: ConflictStrategy;
  resolvedOperation: Operation;
  discardedOperations: Operation[];
  mergedData?: any;
  requiresManualReview: boolean;
}

export interface OperationHistory {
  operations: Operation[];
  maxSize: number;
  lastCleanup: number;
}

export class ConflictResolutionService {
  private config: ConflictResolutionConfig;
  private storageAdapter: SessionStorageAdapter;
  private operationHistory: Map<string, OperationHistory> = new Map();
  private vectorClocks: Map<string, VectorClock> = new Map();
  private pendingConflicts: Map<string, ConflictEvent> = new Map();
  private deviceId: string;

  constructor(storageAdapter: SessionStorageAdapter, deviceId: string, config?: Partial<ConflictResolutionConfig>) {
    this.storageAdapter = storageAdapter;
    this.deviceId = deviceId;
    this.config = {
      strategy: 'operational_transform',
      maxHistorySize: 1000,
      operationTimeout: 30000, // 30 seconds
      enableVersionVectors: true,
      enableOperationalTransform: true,
      ...config
    };

    this.initializeService();
  }

  /**
   * Initialize conflict resolution service
   */
  private async initializeService(): Promise<void> {
    // Load existing operation history
    await this.loadOperationHistory();
    
    // Initialize vector clock for this device
    await this.initializeVectorClock();
    
    console.log('🔄 Conflict resolution service initialized');
  }

  /**
   * Process incoming operation and resolve conflicts
   */
  async processOperation(operation: Operation): Promise<Operation> {
    try {
      // Update vector clock
      this.updateVectorClock(operation);

      // Check for conflicts
      const conflicts = await this.detectConflicts(operation);

      if (conflicts.length > 0) {
        console.log(`⚠️ Detected ${conflicts.length} conflicts for operation ${operation.id}`);
        return await this.resolveConflicts(operation, conflicts);
      }

      // No conflicts, apply operation directly
      await this.applyOperation(operation);
      return operation;

    } catch (error) {
      console.error('❌ Failed to process operation:', error);
      throw error;
    }
  }

  /**
   * Apply resolution strategy from conflict event
   */
  private async applyResolutionStrategy(conflictEvent: ConflictEvent): Promise<Operation> {
    const { resolution } = conflictEvent;

    switch (resolution.strategy) {
      case 'operational_transform':
        return resolution.resolvedOperation;
      case 'last_writer_wins':
        return await this.applyLastWriterWins(
          conflictEvent.operations[0],
          conflictEvent.operations.slice(1)
        );
      default:
        return resolution.resolvedOperation;
    }
  }

  /**
   * Apply last-writer-wins strategy
   */
  private async applyLastWriterWins(operation: Operation, conflicts: Operation[]): Promise<Operation> {
    const allOps = [operation, ...conflicts];
    const latestOp = allOps.reduce((latest, current) =>
      current.timestamp > latest.timestamp ? current : latest
    );

    await this.applyOperation(latestOp);
    return latestOp;
  }

  /**
   * Update conflict learning model (placeholder for ML integration)
   */
  private async updateConflictLearningModel(conflictEvent: ConflictEvent): Promise<void> {
    // Store conflict resolution data for future ML training
    const learningData = {
      conflictType: conflictEvent.conflictType,
      resolutionStrategy: conflictEvent.resolution.strategy,
      success: conflictEvent.status === 'resolved',
      timestamp: conflictEvent.timestamp,
      operationTypes: conflictEvent.operations.map(op => op.type)
    };

    await this.storageAdapter.set(
      `conflict_learning:${conflictEvent.id}`,
      learningData,
      86400 // 24 hours TTL
    );
  }

  /**
   * Classify conflict type using pattern recognition
   */
  private classifyConflictType(operation: Operation, conflicts: Operation[]): ConflictType {
    // Analyze operation patterns
    const hasDeleteEdit = conflicts.some(c =>
      (c.type === 'delete_message' || c.type === 'delete_text') &&
      (operation.type === 'edit_message' || operation.type === 'insert_text')
    );

    if (hasDeleteEdit) return 'delete_edit_conflict';

    const hasConcurrentEdit = conflicts.some(c =>
      c.type === operation.type &&
      Math.abs(c.timestamp - operation.timestamp) < 5000 // 5 seconds
    );

    if (hasConcurrentEdit) return 'concurrent_edit';

    const hasVersionMismatch = conflicts.some(c =>
      !this.isVectorClockCompatible(operation.vectorClock, c.vectorClock)
    );

    if (hasVersionMismatch) return 'version_mismatch';

    return 'state_divergence';
  }

  /**
   * Generate intelligent resolution based on conflict analysis
   */
  private async generateResolution(operation: Operation, conflicts: Operation[]): Promise<ConflictResolution> {
    const conflictType = this.classifyConflictType(operation, conflicts);

    switch (conflictType) {
      case 'concurrent_edit':
        return await this.generateOperationalTransformResolution(operation, conflicts);

      case 'delete_edit_conflict':
        return await this.generateDeleteEditResolution(operation, conflicts);

      case 'version_mismatch':
        return await this.generateVersionMismatchResolution(operation, conflicts);

      default:
        return await this.generateDefaultResolution(operation, conflicts);
    }
  }

  /**
   * Operational Transform resolution for concurrent edits
   */
  private async generateOperationalTransformResolution(
    operation: Operation,
    conflicts: Operation[]
  ): Promise<ConflictResolution> {
    if (!this.config.enableOperationalTransform) {
      return this.generateDefaultResolution(operation, conflicts);
    }

    // Sort operations by timestamp
    const allOps = [operation, ...conflicts].sort((a, b) => a.timestamp - b.timestamp);

    // Apply operational transformation
    let transformedOp = operation;
    const discarded: Operation[] = [];

    for (const conflictOp of conflicts) {
      const transformResult = this.transformOperations(transformedOp, conflictOp);

      if (transformResult.canMerge && transformResult.merged) {
        transformedOp = transformResult.merged;
      } else {
        // Choose based on priority (user rank, timestamp, etc.)
        if (this.getOperationPriority(operation) >= this.getOperationPriority(conflictOp)) {
          discarded.push(conflictOp);
        } else {
          discarded.push(transformedOp);
          transformedOp = conflictOp;
        }
      }
    }

    return {
      strategy: 'operational_transform',
      resolvedOperation: transformedOp,
      discardedOperations: discarded,
      requiresManualReview: false
    };
  }

  /**
   * Transform two operations for concurrent execution
   */
  private transformOperations(op1: Operation, op2: Operation): {
    canMerge: boolean;
    merged?: Operation;
    transformed1?: Operation;
    transformed2?: Operation;
  } {
    // Handle text operations
    if (op1.type === 'insert_text' && op2.type === 'insert_text') {
      return this.transformTextInsertions(op1, op2);
    }

    if (op1.type === 'delete_text' && op2.type === 'delete_text') {
      return this.transformTextDeletions(op1, op2);
    }

    if ((op1.type === 'insert_text' && op2.type === 'delete_text') ||
        (op1.type === 'delete_text' && op2.type === 'insert_text')) {
      return this.transformInsertDelete(op1, op2);
    }

    // Handle message operations
    if (op1.type === 'insert_message' && op2.type === 'insert_message') {
      return this.transformMessageInsertions(op1, op2);
    }

    // Default: cannot merge
    return { canMerge: false };
  }

  /**
   * Check if vector clocks are compatible
   */
  private isVectorClockCompatible(clock1: VectorClock, clock2: VectorClock): boolean {
    const devices1 = Object.keys(clock1);
    const devices2 = Object.keys(clock2);

    // Check if one clock is ahead of the other in all dimensions
    let clock1Ahead = true;
    let clock2Ahead = true;

    const allDevices = new Set([...devices1, ...devices2]);

    for (const device of allDevices) {
      const time1 = clock1[device] || 0;
      const time2 = clock2[device] || 0;

      if (time1 < time2) clock1Ahead = false;
      if (time2 < time1) clock2Ahead = false;
    }

    // Compatible if one is clearly ahead (no concurrent updates)
    return clock1Ahead || clock2Ahead;
  }

  /**
   * Generate default resolution strategy
   */
  private async generateDefaultResolution(operation: Operation, conflicts: Operation[]): Promise<ConflictResolution> {
    return {
      strategy: 'last_writer_wins',
      resolvedOperation: operation,
      discardedOperations: conflicts,
      requiresManualReview: false
    };
  }

  /**
   * Generate resolution for delete-edit conflicts
   */
  private async generateDeleteEditResolution(operation: Operation, conflicts: Operation[]): Promise<ConflictResolution> {
    // If operation is delete and conflicts are edits, delete wins
    if (operation.type.includes('delete')) {
      return {
        strategy: 'last_writer_wins',
        resolvedOperation: operation,
        discardedOperations: conflicts,
        requiresManualReview: false
      };
    }

    // If operation is edit and conflicts include delete, delete wins
    const deleteConflict = conflicts.find(c => c.type.includes('delete'));
    if (deleteConflict) {
      return {
        strategy: 'last_writer_wins',
        resolvedOperation: deleteConflict,
        discardedOperations: [operation, ...conflicts.filter(c => c !== deleteConflict)],
        requiresManualReview: false
      };
    }

    return this.generateDefaultResolution(operation, conflicts);
  }

  /**
   * Generate resolution for version mismatch conflicts
   */
  private async generateVersionMismatchResolution(operation: Operation, conflicts: Operation[]): Promise<ConflictResolution> {
    // For version mismatches, require manual review
    return {
      strategy: 'manual_resolution',
      resolvedOperation: operation,
      discardedOperations: conflicts,
      requiresManualReview: true
    };
  }

  /**
   * Get operation priority for conflict resolution
   */
  private getOperationPriority(operation: Operation): number {
    // Priority based on operation type and user role
    const typePriority = {
      'delete_message': 10,
      'delete_text': 9,
      'edit_message': 8,
      'insert_message': 7,
      'insert_text': 6,
      'move_cursor': 1,
      'user_action': 5,
      'session_update': 3
    };

    return typePriority[operation.type] || 1;
  }

  /**
   * Transform text insertions
   */
  private transformTextInsertions(op1: Operation, op2: Operation): {
    canMerge: boolean;
    merged?: Operation;
  } {
    const pos1 = op1.data.position || 0;
    const pos2 = op2.data.position || 0;

    if (pos1 === pos2) {
      // Same position - merge content
      return {
        canMerge: true,
        merged: {
          ...op1,
          data: {
            ...op1.data,
            content: (op1.data.content || '') + (op2.data.content || ''),
            length: (op1.data.content?.length || 0) + (op2.data.content?.length || 0)
          }
        }
      };
    }

    return { canMerge: false };
  }

  /**
   * Transform text deletions
   */
  private transformTextDeletions(op1: Operation, op2: Operation): {
    canMerge: boolean;
    merged?: Operation;
  } {
    const pos1 = op1.data.position || 0;
    const len1 = op1.data.length || 0;
    const pos2 = op2.data.position || 0;
    const len2 = op2.data.length || 0;

    // Check for overlapping deletions
    if (pos1 <= pos2 && pos1 + len1 >= pos2) {
      // Merge overlapping deletions
      const startPos = Math.min(pos1, pos2);
      const endPos = Math.max(pos1 + len1, pos2 + len2);

      return {
        canMerge: true,
        merged: {
          ...op1,
          data: {
            ...op1.data,
            position: startPos,
            length: endPos - startPos
          }
        }
      };
    }

    return { canMerge: false };
  }

  /**
   * Transform insert-delete operations
   */
  private transformInsertDelete(op1: Operation, op2: Operation): {
    canMerge: boolean;
    transformed1?: Operation;
    transformed2?: Operation;
  } {
    const insertOp = op1.type === 'insert_text' ? op1 : op2;
    const deleteOp = op1.type === 'delete_text' ? op1 : op2;

    const insertPos = insertOp.data.position || 0;
    const deletePos = deleteOp.data.position || 0;
    const deleteLen = deleteOp.data.length || 0;

    // If insert is within delete range, delete wins
    if (insertPos >= deletePos && insertPos <= deletePos + deleteLen) {
      return {
        canMerge: false,
        transformed1: deleteOp,
        transformed2: undefined
      };
    }

    return { canMerge: false };
  }

  /**
   * Transform message insertions
   */
  private transformMessageInsertions(op1: Operation, op2: Operation): {
    canMerge: boolean;
    merged?: Operation;
  } {
    // Messages can coexist, no transformation needed
    return { canMerge: false };
  }

  /**
   * Detect conflicts with existing operations
   */
  async detectConflicts(operation: Operation, existingOperations?: Operation[]): Promise<Operation[]> {
    // Use provided operations or get from session history
    let operationsToCheck: Operation[] = [];

    if (existingOperations) {
      operationsToCheck = existingOperations;
    } else {
      const sessionHistory = this.operationHistory.get(operation.sessionId);
      if (!sessionHistory) {
        return [];
      }
      operationsToCheck = sessionHistory.operations;
    }

    const conflicts: Operation[] = [];
    const operationTime = operation.timestamp;
    const timeWindow = this.config.operationTimeout;

    for (const existingOp of operationsToCheck) {
      // Skip if same operation
      if (existingOp.id === operation.id) continue;
      
      // Check if operations are within conflict window
      if (Math.abs(operationTime - existingOp.timestamp) > timeWindow) continue;
      
      // Check for specific conflict types
      if (this.hasConflict(operation, existingOp)) {
        conflicts.push(existingOp);
      }

      // Enhanced session-specific conflict detection
      if (this.hasSessionSpecificConflict(operation, existingOp)) {
        conflicts.push(existingOp);
      }
    }

    return conflicts;
  }

  /**
   * Check for session-specific conflicts
   */
  private hasSessionSpecificConflict(op1: Operation, op2: Operation): boolean {
    // Message ordering conflicts
    if (op1.type === 'insert_message' && op2.type === 'insert_message') {
      return this.hasMessageOrderingConflict(op1, op2);
    }

    // Session state conflicts
    if (op1.type === 'session_update' && op2.type === 'session_update') {
      return this.hasSessionStateConflict(op1, op2);
    }

    // User preference conflicts
    if (op1.type === 'user_action' && op2.type === 'user_action') {
      return this.hasPreferenceConflict(op1, op2);
    }

    return false;
  }

  /**
   * Check for message ordering conflicts
   */
  private hasMessageOrderingConflict(op1: Operation, op2: Operation): boolean {
    // Check for timestamp conflicts (messages sent at nearly the same time)
    const timeDiff = Math.abs(op1.timestamp - op2.timestamp);
    if (timeDiff < 1000) { // Within 1 second
      return true;
    }

    // Check for duplicate message conflicts
    if (this.areMessagesEquivalent(op1.data, op2.data)) {
      return true;
    }

    return false;
  }

  /**
   * Check for session state conflicts
   */
  private hasSessionStateConflict(op1: Operation, op2: Operation): boolean {
    // Check for concurrent state updates
    const timeDiff = Math.abs(op1.timestamp - op2.timestamp);
    if (timeDiff < 5000) { // Within 5 seconds
      return this.hasConflictingStateFields(op1.data, op2.data);
    }

    return false;
  }

  /**
   * Check for preference conflicts
   */
  private hasPreferenceConflict(op1: Operation, op2: Operation): boolean {
    const conflictingKeys = this.findConflictingPreferenceKeys(op1.data, op2.data);
    return conflictingKeys.length > 0;
  }

  /**
   * Check if two operations conflict
   */
  private hasConflict(op1: Operation, op2: Operation): boolean {
    // Same message conflicts
    if (op1.data.messageId && op2.data.messageId && op1.data.messageId === op2.data.messageId) {
      return true;
    }

    // Text editing conflicts (overlapping positions)
    if (op1.type.includes('text') && op2.type.includes('text')) {
      const pos1 = op1.data.position || 0;
      const len1 = op1.data.length || 0;
      const pos2 = op2.data.position || 0;
      const len2 = op2.data.length || 0;
      
      // Check for overlap
      return (pos1 < pos2 + len2) && (pos2 < pos1 + len1);
    }

    // Vector clock conflicts
    if (this.config.enableVersionVectors) {
      return this.hasVectorClockConflict(op1.vectorClock, op2.vectorClock);
    }

    return false;
  }

  /**
   * Check for vector clock conflicts
   */
  private hasVectorClockConflict(clock1: VectorClock, clock2: VectorClock): boolean {
    const devices1 = Object.keys(clock1);
    const devices2 = Object.keys(clock2);
    const allDevices = new Set([...devices1, ...devices2]);

    let clock1Greater = false;
    let clock2Greater = false;

    for (const device of allDevices) {
      const time1 = clock1[device] || 0;
      const time2 = clock2[device] || 0;

      if (time1 > time2) clock1Greater = true;
      if (time2 > time1) clock2Greater = true;
    }

    // Concurrent if both clocks have greater values
    return clock1Greater && clock2Greater;
  }

  /**
   * Resolve conflicts using configured strategy
   */
  async resolveConflicts(operation: Operation, conflicts: Operation[]): Promise<Operation> {
    const conflictEvent: ConflictEvent = {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      sessionId: operation.sessionId,
      conflictType: this.determineConflictType(operation, conflicts),
      operations: [operation, ...conflicts],
      resolution: {
        strategy: this.config.strategy,
        resolvedOperation: operation,
        discardedOperations: [],
        requiresManualReview: false
      },
      status: 'pending'
    };

    try {
      switch (this.config.strategy) {
        case 'last_writer_wins':
          conflictEvent.resolution = await this.resolveLastWriterWins(operation, conflicts);
          break;
          
        case 'first_writer_wins':
          conflictEvent.resolution = await this.resolveFirstWriterWins(operation, conflicts);
          break;
          
        case 'operational_transform':
          conflictEvent.resolution = await this.resolveOperationalTransform(operation, conflicts);
          break;
          
        case 'merge_strategy':
          conflictEvent.resolution = await this.resolveMergeStrategy(operation, conflicts);
          break;
          
        case 'manual_resolution':
          conflictEvent.resolution = await this.resolveManualStrategy(operation, conflicts);
          break;
          
        default:
          throw new Error(`Unknown conflict strategy: ${this.config.strategy}`);
      }

      conflictEvent.status = 'resolved';
      await this.applyOperation(conflictEvent.resolution.resolvedOperation);
      
      console.log(`✅ Conflict resolved using ${this.config.strategy}:`, conflictEvent.id);
      return conflictEvent.resolution.resolvedOperation;
      
    } catch (error) {
      conflictEvent.status = 'failed';
      console.error('❌ Conflict resolution failed:', error);
      throw error;
    } finally {
      this.pendingConflicts.set(conflictEvent.id, conflictEvent);
      await this.storageAdapter.set(`conflict:${conflictEvent.id}`, conflictEvent, 3600); // 1 hour TTL
    }
  }

  /**
   * Resolve using last writer wins strategy
   */
  private async resolveLastWriterWins(operation: Operation, conflicts: Operation[]): Promise<ConflictResolution> {
    const allOps = [operation, ...conflicts].sort((a, b) => b.timestamp - a.timestamp);
    const winner = allOps[0];
    const discarded = allOps.slice(1);

    return {
      strategy: 'last_writer_wins',
      resolvedOperation: winner,
      discardedOperations: discarded,
      requiresManualReview: false
    };
  }

  /**
   * Resolve using first writer wins strategy
   */
  private async resolveFirstWriterWins(operation: Operation, conflicts: Operation[]): Promise<ConflictResolution> {
    const allOps = [operation, ...conflicts].sort((a, b) => a.timestamp - b.timestamp);
    const winner = allOps[0];
    const discarded = allOps.slice(1);

    return {
      strategy: 'first_writer_wins',
      resolvedOperation: winner,
      discardedOperations: discarded,
      requiresManualReview: false
    };
  }

  /**
   * Resolve using operational transformation
   */
  private async resolveOperationalTransform(operation: Operation, conflicts: Operation[]): Promise<ConflictResolution> {
    if (!this.config.enableOperationalTransform) {
      // Fallback to last writer wins
      return this.resolveLastWriterWins(operation, conflicts);
    }

    let transformedOp = { ...operation };

    // Transform operation against each conflict
    for (const conflict of conflicts) {
      transformedOp = this.transformOperation(transformedOp, conflict);
    }

    transformedOp.isTransformed = true;

    return {
      strategy: 'operational_transform',
      resolvedOperation: transformedOp,
      discardedOperations: [],
      requiresManualReview: false
    };
  }

  /**
   * Transform operation against another operation
   */
  private transformOperation(op1: Operation, op2: Operation): Operation {
    // Text insertion transformation
    if (op1.type === 'insert_text' && op2.type === 'insert_text') {
      const pos1 = op1.data.position || 0;
      const pos2 = op2.data.position || 0;
      const len2 = op2.data.content?.length || 0;

      if (pos1 >= pos2) {
        // Adjust position for concurrent insertion
        return {
          ...op1,
          data: {
            ...op1.data,
            position: pos1 + len2
          }
        };
      }
    }

    // Text deletion transformation
    if (op1.type === 'delete_text' && op2.type === 'insert_text') {
      const delPos = op1.data.position || 0;
      const insPos = op2.data.position || 0;
      const insLen = op2.data.content?.length || 0;

      if (delPos >= insPos) {
        return {
          ...op1,
          data: {
            ...op1.data,
            position: delPos + insLen
          }
        };
      }
    }

    // Message editing transformation
    if (op1.type === 'edit_message' && op2.type === 'edit_message') {
      if (op1.data.messageId === op2.data.messageId) {
        // Merge message edits
        return {
          ...op1,
          data: {
            ...op1.data,
            content: this.mergeTextContent(op1.data.content || '', op2.data.content || '')
          }
        };
      }
    }

    return op1;
  }

  /**
   * Merge text content from two operations
   */
  private mergeTextContent(content1: string, content2: string): string {
    // Simple merge strategy - in production would use more sophisticated algorithms
    if (content1.length > content2.length) {
      return content1;
    }
    return content2;
  }

  /**
   * Resolve using merge strategy
   */
  private async resolveMergeStrategy(operation: Operation, conflicts: Operation[]): Promise<ConflictResolution> {
    const allOps = [operation, ...conflicts];
    
    // Create merged operation
    const mergedOp: Operation = {
      ...operation,
      id: `merged_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data: this.mergeOperationData(allOps.map(op => op.data))
    };

    return {
      strategy: 'merge_strategy',
      resolvedOperation: mergedOp,
      discardedOperations: allOps,
      mergedData: mergedOp.data,
      requiresManualReview: false
    };
  }

  /**
   * Merge operation data from multiple operations
   */
  private mergeOperationData(dataList: OperationData[]): OperationData {
    const merged: OperationData = {};

    for (const data of dataList) {
      if (data.content) {
        merged.content = (merged.content || '') + ' ' + data.content;
      }
      if (data.position !== undefined) {
        merged.position = Math.max(merged.position || 0, data.position);
      }
      if (data.metadata) {
        merged.metadata = { ...merged.metadata, ...data.metadata };
      }
    }

    return merged;
  }

  /**
   * Resolve using manual strategy
   */
  private async resolveManualStrategy(operation: Operation, conflicts: Operation[]): Promise<ConflictResolution> {
    return {
      strategy: 'manual_resolution',
      resolvedOperation: operation,
      discardedOperations: conflicts,
      requiresManualReview: true
    };
  }

  /**
   * Determine conflict type
   */
  private determineConflictType(operation: Operation, conflicts: Operation[]): ConflictType {
    if (operation.type.includes('edit') && conflicts.some(c => c.type.includes('delete'))) {
      return 'delete_edit_conflict';
    }
    
    if (operation.type.includes('text') && conflicts.some(c => c.type.includes('text'))) {
      return 'concurrent_edit';
    }
    
    if (this.hasVectorClockConflict(operation.vectorClock, conflicts[0]?.vectorClock)) {
      return 'version_mismatch';
    }
    
    return 'state_divergence';
  }

  /**
   * Apply operation to session state
   */
  private async applyOperation(operation: Operation): Promise<void> {
    // Add to operation history
    await this.addToHistory(operation);
    
    // Update session state based on operation type
    switch (operation.type) {
      case 'insert_message':
      case 'edit_message':
      case 'delete_message':
        await this.applyMessageOperation(operation);
        break;
        
      case 'session_update':
        await this.applySessionUpdate(operation);
        break;
        
      default:
        console.log(`📝 Applied operation: ${operation.type}`);
    }
  }

  /**
   * Apply message-related operation
   */
  private async applyMessageOperation(operation: Operation): Promise<void> {
    const sessionKey = `session:${operation.sessionId}`;
    const session = await this.storageAdapter.get(sessionKey);

    if (session) {
      // Update session with operation
      (session as any).lastModified = operation.timestamp;
      (session as any).lastOperation = operation.id;

      await this.storageAdapter.set(sessionKey, session);
    }
  }

  /**
   * Apply session update operation
   */
  private async applySessionUpdate(operation: Operation): Promise<void> {
    const sessionKey = `session:${operation.sessionId}`;
    await this.storageAdapter.set(sessionKey, operation.data);
  }

  /**
   * Add operation to history
   */
  private async addToHistory(operation: Operation): Promise<void> {
    let history = this.operationHistory.get(operation.sessionId);
    
    if (!history) {
      history = {
        operations: [],
        maxSize: this.config.maxHistorySize,
        lastCleanup: Date.now()
      };
      this.operationHistory.set(operation.sessionId, history);
    }

    history.operations.push(operation);

    // Cleanup old operations if needed
    if (history.operations.length > history.maxSize) {
      history.operations = history.operations.slice(-history.maxSize);
      history.lastCleanup = Date.now();
    }

    // Persist to storage
    await this.storageAdapter.set(`history:${operation.sessionId}`, history, 86400); // 24 hours TTL
  }

  /**
   * Update vector clock
   */
  private updateVectorClock(operation: Operation): void {
    if (!this.config.enableVersionVectors) return;

    let clock = this.vectorClocks.get(operation.sessionId);
    if (!clock) {
      clock = {};
      this.vectorClocks.set(operation.sessionId, clock);
    }

    // Update clock for the device that created the operation
    clock[operation.deviceId] = (clock[operation.deviceId] || 0) + 1;

    // Update operation's vector clock
    operation.vectorClock = { ...clock };
  }

  /**
   * Initialize vector clock for this device
   */
  private async initializeVectorClock(): Promise<void> {
    if (!this.config.enableVersionVectors) return;

    // Load existing vector clocks from storage
    const storedClocks = await this.storageAdapter.get('vector_clocks');
    if (storedClocks) {
      this.vectorClocks = new Map(Object.entries(storedClocks));
    }
  }

  /**
   * Load operation history from storage
   */
  private async loadOperationHistory(): Promise<void> {
    try {
      const historyKeys = await this.storageAdapter.scan('history:*');
      
      for (const key of historyKeys) {
        const history = await this.storageAdapter.get(key);
        if (history && typeof history === 'object' && 'operations' in history) {
          const sessionId = key.replace('history:', '');
          this.operationHistory.set(sessionId, history as OperationHistory);
        }
      }
      
      console.log(`📚 Loaded operation history for ${historyKeys.length} sessions`);
    } catch (error) {
      console.error('❌ Failed to load operation history:', error);
    }
  }

  /**
   * Get conflict statistics
   */
  getConflictStatistics(): {
    totalConflicts: number;
    resolvedConflicts: number;
    pendingConflicts: number;
    failedConflicts: number;
    strategyCounts: Record<ConflictStrategy, number>;
  } {
    const conflicts = Array.from(this.pendingConflicts.values());
    
    return {
      totalConflicts: conflicts.length,
      resolvedConflicts: conflicts.filter(c => c.status === 'resolved').length,
      pendingConflicts: conflicts.filter(c => c.status === 'pending').length,
      failedConflicts: conflicts.filter(c => c.status === 'failed').length,
      strategyCounts: conflicts.reduce((acc, c) => {
        acc[c.resolution.strategy] = (acc[c.resolution.strategy] || 0) + 1;
        return acc;
      }, {} as Record<ConflictStrategy, number>)
    };
  }

  /**
   * Get operation history for session
   */
  getOperationHistory(sessionId: string): Operation[] {
    const history = this.operationHistory.get(sessionId);
    return history ? [...history.operations] : [];
  }

  /**
   * Check if messages are equivalent (for duplicate detection)
   */
  private areMessagesEquivalent(msg1: any, msg2: any): boolean {
    if (!msg1 || !msg2) return false;

    // Compare content
    if (msg1.content !== msg2.content) return false;

    // Compare sender
    if (msg1.sender !== msg2.sender) return false;

    // Compare type
    if (msg1.type !== msg2.type) return false;

    return true;
  }

  /**
   * Check if state updates have conflicting fields
   */
  private hasConflictingStateFields(state1: any, state2: any): boolean {
    if (!state1 || !state2) return false;

    const keys1 = Object.keys(state1);
    const keys2 = Object.keys(state2);

    // Find common keys with different values
    for (const key of keys1) {
      if (keys2.includes(key) && state1[key] !== state2[key]) {
        return true;
      }
    }

    return false;
  }

  /**
   * Find conflicting preference keys
   */
  private findConflictingPreferenceKeys(pref1: any, pref2: any): string[] {
    if (!pref1 || !pref2) return [];

    const conflictingKeys: string[] = [];
    const keys1 = Object.keys(pref1);
    const keys2 = Object.keys(pref2);

    // Find common keys with different values
    for (const key of keys1) {
      if (keys2.includes(key) && pref1[key] !== pref2[key]) {
        conflictingKeys.push(key);
      }
    }

    return conflictingKeys;
  }

  /**
   * Clear old conflicts and history
   */
  async cleanup(): Promise<void> {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Clean up old conflicts
    for (const [id, conflict] of this.pendingConflicts.entries()) {
      if (now - conflict.timestamp > maxAge) {
        this.pendingConflicts.delete(id);
        await this.storageAdapter.delete(`conflict:${id}`);
      }
    }

    // Clean up old operation history
    for (const [sessionId, history] of this.operationHistory.entries()) {
      if (now - history.lastCleanup > maxAge) {
        history.operations = history.operations.filter(op => now - op.timestamp < maxAge);
        history.lastCleanup = now;
      }
    }

    console.log('🧹 Conflict resolution cleanup completed');
  }
}

// Factory function
export function createConflictResolution(
  storageAdapter: SessionStorageAdapter,
  deviceId: string
): ConflictResolutionService {
  return new ConflictResolutionService(storageAdapter, deviceId);
}
