/**
 * Administrative Workflow Intelligence for SELLY
 * Advanced workflow state tracking and bottleneck detection
 * Implements Week 3 components from the RAG optimization plan
 */

import { chatbotDataService } from "./dataService";
import { administrativeCrossTableAnalytics } from "./administrativeCrossTableAnalytics";

export interface WorkflowContext {
  type: 'userRegistration' | 'applicationProcessing' | 'recordValidation' | 'complaintHandling' | 'documentManagement' | 'general';
  stage: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedCompletion: string;
  bottlenecks: string[];
}

export interface WorkflowState {
  workflowId: string;
  workflowType: string;
  currentStage: string;
  progress: number;
  estimatedTimeRemaining: number;
  blockers: string[];
  nextActions: string[];
  stakeholders: string[];
}

export interface WorkflowAnalysis {
  context: WorkflowContext;
  currentState: WorkflowState[];
  nextSteps: string[];
  recommendations: string[];
  performanceMetrics: {
    averageCompletionTime: number;
    successRate: number;
    bottleneckFrequency: Record<string, number>;
  };
}

export interface WorkflowBottleneck {
  stage: string;
  frequency: number;
  averageDelay: number;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  suggestedActions: string[];
}

export class AdministrativeWorkflowIntelligence {
  private static instance: AdministrativeWorkflowIntelligence;

  public static getInstance(): AdministrativeWorkflowIntelligence {
    if (!AdministrativeWorkflowIntelligence.instance) {
      AdministrativeWorkflowIntelligence.instance = new AdministrativeWorkflowIntelligence();
    }
    return AdministrativeWorkflowIntelligence.instance;
  }

  /**
   * Analyze workflow status based on query context
   */
  public async analyzeWorkflowStatus(query: string): Promise<WorkflowAnalysis> {
    try {
      console.log('Analyzing workflow status for query:', query);

      // Detect workflow context
      const workflowContext = this.detectWorkflowContext(query);
      
      // Analyze current state across related tables
      const currentState = await this.getCurrentWorkflowState(workflowContext);
      
      // Predict next steps and bottlenecks
      const nextSteps = await this.predictNextSteps(currentState, workflowContext);
      
      // Generate performance metrics
      const performanceMetrics = await this.calculatePerformanceMetrics(workflowContext);

      return {
        context: workflowContext,
        currentState,
        nextSteps,
        recommendations: this.generateRecommendations(currentState, workflowContext),
        performanceMetrics
      };

    } catch (error) {
      console.error('Error analyzing workflow status:', error);
      throw error;
    }
  }

  /**
   * Detect workflow context from query
   */
  private detectWorkflowContext(query: string): WorkflowContext {
    const queryLower = query.toLowerCase();
    
    const contexts = {
      userRegistration: /pengguna.*(baru|daftar|registrasi|persetujuan|pending)/i,
      applicationProcessing: /pengajuan.*(proses|status|validasi|bulanan)/i,
      recordValidation: /rekam.*(adjudicate|validasi|koreksi|salah)/i,
      complaintHandling: /pengaduan.*(tindak.*lanjut|proses|selesai|keluhan)/i,
      documentManagement: /dokumen.*(upload|arsip|kelola|dokumentasi)/i
    };

    for (const [context, pattern] of Object.entries(contexts)) {
      if (pattern.test(query)) {
        return this.buildWorkflowContext(context as any, queryLower);
      }
    }

    return this.buildWorkflowContext('general', queryLower);
  }

  /**
   * Build detailed workflow context
   */
  private buildWorkflowContext(type: WorkflowContext['type'], query: string): WorkflowContext {
    const urgencyKeywords = ['urgent', 'penting', 'segera', 'darurat', 'cepat'];
    const timeKeywords = ['hari ini', 'sekarang', 'minggu ini', 'bulan ini'];
    
    let priority: WorkflowContext['priority'] = 'medium';
    
    if (urgencyKeywords.some(keyword => query.includes(keyword))) {
      priority = 'critical';
    } else if (timeKeywords.some(keyword => query.includes(keyword))) {
      priority = 'high';
    }

    const stageMapping = {
      userRegistration: this.detectUserRegistrationStage(query),
      applicationProcessing: this.detectApplicationStage(query),
      recordValidation: this.detectValidationStage(query),
      complaintHandling: this.detectComplaintStage(query),
      documentManagement: this.detectDocumentStage(query),
      general: 'analysis'
    };

    return {
      type,
      stage: stageMapping[type],
      priority,
      estimatedCompletion: this.estimateCompletion(type, priority),
      bottlenecks: this.identifyPotentialBottlenecks(type)
    };
  }

  /**
   * Get current workflow state across related tables
   */
  private async getCurrentWorkflowState(context: WorkflowContext): Promise<WorkflowState[]> {
    const states: WorkflowState[] = [];

    switch (context.type) {
      case 'userRegistration':
        states.push(...await this.getUserRegistrationStates());
        break;
      case 'applicationProcessing':
        states.push(...await this.getApplicationProcessingStates());
        break;
      case 'recordValidation':
        states.push(...await this.getRecordValidationStates());
        break;
      case 'complaintHandling':
        states.push(...await this.getComplaintHandlingStates());
        break;
      case 'documentManagement':
        states.push(...await this.getDocumentManagementStates());
        break;
      default:
        states.push(...await this.getGeneralSystemStates());
    }

    return states;
  }

  /**
   * Get user registration workflow states
   */
  private async getUserRegistrationStates(): Promise<WorkflowState[]> {
    const sql = `
      SELECT 
        pu.id,
        pu.name,
        pu.status,
        pu.requested_at,
        pu.approved_at,
        EXTRACT(days FROM (NOW() - pu.requested_at)) as days_pending
      FROM pending_users pu
      WHERE pu.status IN ('pending', 'approved', 'rejected')
      ORDER BY pu.requested_at DESC
      LIMIT 10
    `;

    const result = await chatbotDataService.executeCustomQuery(sql);
    
    if (!result.success || !result.data) {
      return [];
    }

    return result.data.map((row: any) => ({
      workflowId: row.id,
      workflowType: 'User Registration',
      currentStage: this.mapUserRegistrationStage(row.status),
      progress: this.calculateUserRegistrationProgress(row.status),
      estimatedTimeRemaining: this.estimateUserRegistrationTime(row.status, row.days_pending),
      blockers: this.identifyUserRegistrationBlockers(row),
      nextActions: this.suggestUserRegistrationActions(row.status),
      stakeholders: ['Admin', 'User', 'System']
    }));
  }

  /**
   * Get application processing workflow states
   */
  private async getApplicationProcessingStates(): Promise<WorkflowState[]> {
    const sql = `
      SELECT 
        pb.id,
        pb.nama_pengaju,
        pb.tanggal_pengajuan,
        pb.is_ready_to_record,
        ar.id as adjudicate_id,
        ar.is_ready_to_record as adjudicate_ready,
        sr.id as error_id,
        EXTRACT(days FROM (NOW() - pb.tanggal_pengajuan)) as days_since_submission
      FROM pengajuan_bulanan pb
      LEFT JOIN adjudicate_record ar ON pb.nik_pengaju = ar.nik_pengaju
      LEFT JOIN salah_rekam sr ON pb.nik_pengaju = sr.nik_salah_rekam
      WHERE pb.tanggal_pengajuan >= NOW() - INTERVAL '30 days'
      ORDER BY pb.tanggal_pengajuan DESC
      LIMIT 15
    `;

    const result = await chatbotDataService.executeCustomQuery(sql);
    
    if (!result.success || !result.data) {
      return [];
    }

    return result.data.map((row: any) => ({
      workflowId: row.id,
      workflowType: 'Application Processing',
      currentStage: this.mapApplicationStage(row),
      progress: this.calculateApplicationProgress(row),
      estimatedTimeRemaining: this.estimateApplicationTime(row),
      blockers: this.identifyApplicationBlockers(row),
      nextActions: this.suggestApplicationActions(row),
      stakeholders: ['Applicant', 'Validator', 'Operator']
    }));
  }

  /**
   * Get record validation workflow states
   */
  private async getRecordValidationStates(): Promise<WorkflowState[]> {
    const sql = `
      SELECT 
        ar.id,
        ar.nama_adjudicate,
        ar.jenis_eksepsi,
        ar.is_ready_to_record,
        ar.created_at,
        sr.id as correction_id,
        EXTRACT(days FROM (NOW() - ar.created_at)) as days_in_validation
      FROM adjudicate_record ar
      LEFT JOIN salah_rekam sr ON ar.nik_adjudicate = sr.nik_salah_rekam
      WHERE ar.created_at >= NOW() - INTERVAL '30 days'
      ORDER BY ar.created_at DESC
      LIMIT 10
    `;

    const result = await chatbotDataService.executeCustomQuery(sql);
    
    if (!result.success || !result.data) {
      return [];
    }

    return result.data.map((row: any) => ({
      workflowId: row.id,
      workflowType: 'Record Validation',
      currentStage: this.mapValidationStage(row),
      progress: this.calculateValidationProgress(row),
      estimatedTimeRemaining: this.estimateValidationTime(row),
      blockers: this.identifyValidationBlockers(row),
      nextActions: this.suggestValidationActions(row),
      stakeholders: ['Validator', 'Data Entry', 'Quality Control']
    }));
  }

  /**
   * Get complaint handling workflow states
   */
  private async getComplaintHandlingStates(): Promise<WorkflowState[]> {
    const sql = `
      SELECT 
        pg.id,
        pg.nama_pengaduan,
        pg.alasan_pengaduan,
        pg.tindak_lanjut_pengaduan,
        pg.tanggal_pengaduan,
        EXTRACT(days FROM (NOW() - pg.tanggal_pengaduan)) as days_since_complaint
      FROM pengaduan_bulanan pg
      WHERE pg.tanggal_pengaduan >= NOW() - INTERVAL '60 days'
      ORDER BY pg.tanggal_pengaduan DESC
      LIMIT 10
    `;

    const result = await chatbotDataService.executeCustomQuery(sql);
    
    if (!result.success || !result.data) {
      return [];
    }

    return result.data.map((row: any) => ({
      workflowId: row.id,
      workflowType: 'Complaint Handling',
      currentStage: this.mapComplaintStage(row),
      progress: this.calculateComplaintProgress(row),
      estimatedTimeRemaining: this.estimateComplaintTime(row),
      blockers: this.identifyComplaintBlockers(row),
      nextActions: this.suggestComplaintActions(row),
      stakeholders: ['Complainant', 'Handler', 'Supervisor']
    }));
  }

  /**
   * Get document management workflow states
   */
  private async getDocumentManagementStates(): Promise<WorkflowState[]> {
    const sql = `
      SELECT 
        d.id,
        d.judul,
        d.tanggal,
        d.created_at,
        p.name as creator_name,
        EXTRACT(days FROM (NOW() - d.created_at)) as days_since_creation
      FROM dokumentasi d
      LEFT JOIN profiles p ON d.created_by = p.id
      WHERE d.created_at >= NOW() - INTERVAL '30 days'
      ORDER BY d.created_at DESC
      LIMIT 8
    `;

    const result = await chatbotDataService.executeCustomQuery(sql);
    
    if (!result.success || !result.data) {
      return [];
    }

    return result.data.map((row: any) => ({
      workflowId: row.id,
      workflowType: 'Document Management',
      currentStage: 'Archived',
      progress: 100,
      estimatedTimeRemaining: 0,
      blockers: [],
      nextActions: ['Review', 'Update if needed'],
      stakeholders: ['Creator', 'Reviewer', 'Archive Manager']
    }));
  }

  /**
   * Get general system states
   */
  private async getGeneralSystemStates(): Promise<WorkflowState[]> {
    return [{
      workflowId: 'system-overview',
      workflowType: 'System Overview',
      currentStage: 'Operational',
      progress: 85,
      estimatedTimeRemaining: 0,
      blockers: ['Pending user approvals', 'High validation queue'],
      nextActions: ['Monitor performance', 'Process pending items'],
      stakeholders: ['System Admin', 'Operations Team']
    }];
  }

  /**
   * Predict next steps based on current state
   */
  private async predictNextSteps(states: WorkflowState[], context: WorkflowContext): Promise<string[]> {
    const nextSteps: string[] = [];

    // Analyze current states to predict next actions
    const highPriorityStates = states.filter(state => 
      state.blockers.length > 0 || state.estimatedTimeRemaining > 7
    );

    if (highPriorityStates.length > 0) {
      nextSteps.push(`Prioritaskan ${highPriorityStates.length} workflow yang memiliki blocker`);
    }

    const stuckStates = states.filter(state => state.progress < 50);
    if (stuckStates.length > 0) {
      nextSteps.push(`Review ${stuckStates.length} workflow yang terhambat`);
    }

    // Context-specific predictions
    switch (context.type) {
      case 'userRegistration':
        nextSteps.push('Percepat proses persetujuan pengguna baru');
        break;
      case 'applicationProcessing':
        nextSteps.push('Optimalisasi proses validasi pengajuan');
        break;
      case 'recordValidation':
        nextSteps.push('Tingkatkan akurasi validasi data');
        break;
      case 'complaintHandling':
        nextSteps.push('Pastikan semua pengaduan ditindaklanjuti');
        break;
    }

    return nextSteps.slice(0, 5);
  }

  /**
   * Calculate performance metrics for workflow type
   */
  private async calculatePerformanceMetrics(context: WorkflowContext): Promise<WorkflowAnalysis['performanceMetrics']> {
    // This would implement actual performance calculation
    // For now, returning sample metrics
    return {
      averageCompletionTime: 5.2,
      successRate: 87.5,
      bottleneckFrequency: {
        'Validation': 15,
        'Approval': 8,
        'Data Entry': 12,
        'Review': 6
      }
    };
  }

  /**
   * Generate workflow recommendations
   */
  private generateRecommendations(states: WorkflowState[], context: WorkflowContext): string[] {
    const recommendations: string[] = [];

    const blockedStates = states.filter(state => state.blockers.length > 0);
    if (blockedStates.length > 0) {
      recommendations.push(`Atasi ${blockedStates.length} workflow yang terblokir untuk meningkatkan efisiensi`);
    }

    const slowStates = states.filter(state => state.estimatedTimeRemaining > 10);
    if (slowStates.length > 0) {
      recommendations.push(`Percepat ${slowStates.length} workflow yang berjalan lambat`);
    }

    if (context.priority === 'critical') {
      recommendations.push('Alokasikan resource tambahan untuk menangani prioritas kritis');
    }

    return recommendations.slice(0, 4);
  }

  // Helper methods for stage detection and mapping
  private detectUserRegistrationStage(query: string): string {
    if (query.includes('pending') || query.includes('menunggu')) return 'pending_approval';
    if (query.includes('approved') || query.includes('disetujui')) return 'approved';
    if (query.includes('rejected') || query.includes('ditolak')) return 'rejected';
    return 'registration';
  }

  private detectApplicationStage(query: string): string {
    if (query.includes('validasi') || query.includes('adjudicate')) return 'validation';
    if (query.includes('proses') || query.includes('processing')) return 'processing';
    if (query.includes('selesai') || query.includes('complete')) return 'completed';
    return 'submitted';
  }

  private detectValidationStage(query: string): string {
    if (query.includes('koreksi') || query.includes('correction')) return 'correction';
    if (query.includes('review') || query.includes('tinjauan')) return 'review';
    return 'validation';
  }

  private detectComplaintStage(query: string): string {
    if (query.includes('tindak lanjut') || query.includes('follow up')) return 'follow_up';
    if (query.includes('selesai') || query.includes('resolved')) return 'resolved';
    return 'submitted';
  }

  private detectDocumentStage(query: string): string {
    if (query.includes('upload') || query.includes('unggah')) return 'upload';
    if (query.includes('review') || query.includes('tinjauan')) return 'review';
    return 'archived';
  }

  private estimateCompletion(type: WorkflowContext['type'], priority: WorkflowContext['priority']): string {
    const baseTime = {
      userRegistration: 3,
      applicationProcessing: 7,
      recordValidation: 5,
      complaintHandling: 10,
      documentManagement: 2,
      general: 1
    };

    const priorityMultiplier = {
      critical: 0.5,
      high: 0.7,
      medium: 1.0,
      low: 1.5
    };

    const days = Math.round(baseTime[type] * priorityMultiplier[priority]);
    return `${days} hari`;
  }

  private identifyPotentialBottlenecks(type: WorkflowContext['type']): string[] {
    const bottlenecks = {
      userRegistration: ['Manual approval process', 'Document verification'],
      applicationProcessing: ['Validation queue', 'Data quality issues'],
      recordValidation: ['Complex validation rules', 'Manual review required'],
      complaintHandling: ['Investigation time', 'Stakeholder coordination'],
      documentManagement: ['File processing', 'Quality control'],
      general: ['System capacity', 'Resource allocation']
    };

    return bottlenecks[type] || [];
  }

  // Additional helper methods for state mapping and calculations would be implemented here
  private mapUserRegistrationStage(status: string): string {
    const mapping: Record<string, string> = {
      'pending': 'Menunggu Persetujuan',
      'approved': 'Disetujui',
      'rejected': 'Ditolak'
    };
    return mapping[status] || 'Unknown';
  }

  private calculateUserRegistrationProgress(status: string): number {
    const progress: Record<string, number> = {
      'pending': 50,
      'approved': 100,
      'rejected': 100
    };
    return progress[status] || 0;
  }

  private estimateUserRegistrationTime(status: string, daysPending: number): number {
    if (status === 'approved' || status === 'rejected') return 0;
    return Math.max(0, 5 - daysPending);
  }

  private identifyUserRegistrationBlockers(row: any): string[] {
    const blockers: string[] = [];
    if (row.days_pending > 7) blockers.push('Pending terlalu lama');
    if (row.status === 'pending') blockers.push('Menunggu review admin');
    return blockers;
  }

  private suggestUserRegistrationActions(status: string): string[] {
    const actions: Record<string, string[]> = {
      'pending': ['Review dokumen', 'Verifikasi data', 'Approve/Reject'],
      'approved': ['Aktivasi akun', 'Kirim notifikasi'],
      'rejected': ['Kirim feedback', 'Archive record']
    };
    return actions[status] || [];
  }

  // Similar helper methods would be implemented for other workflow types
  private mapApplicationStage(row: any): string {
    if (row.adjudicate_id && row.adjudicate_ready) return 'Siap Rekam';
    if (row.adjudicate_id) return 'Dalam Validasi';
    if (row.error_id) return 'Ada Kesalahan';
    return 'Diajukan';
  }

  private calculateApplicationProgress(row: any): number {
    if (row.adjudicate_ready) return 100;
    if (row.adjudicate_id) return 75;
    if (row.error_id) return 25;
    return 50;
  }

  private estimateApplicationTime(row: any): number {
    if (row.adjudicate_ready) return 0;
    if (row.adjudicate_id) return 2;
    return Math.max(0, 7 - row.days_since_submission);
  }

  private identifyApplicationBlockers(row: any): string[] {
    const blockers: string[] = [];
    if (row.error_id) blockers.push('Ada kesalahan data');
    if (row.days_since_submission > 14) blockers.push('Proses terlalu lama');
    if (!row.adjudicate_id && row.days_since_submission > 7) blockers.push('Belum masuk validasi');
    return blockers;
  }

  private suggestApplicationActions(row: any): string[] {
    if (row.adjudicate_ready) return ['Lakukan perekaman'];
    if (row.adjudicate_id) return ['Lanjutkan validasi'];
    if (row.error_id) return ['Perbaiki kesalahan'];
    return ['Mulai proses validasi'];
  }

  // Additional helper methods for validation, complaint, and document workflows would follow similar patterns
  private mapValidationStage(row: any): string {
    if (row.is_ready_to_record) return 'Siap Rekam';
    if (row.correction_id) return 'Perlu Koreksi';
    return 'Dalam Validasi';
  }

  private calculateValidationProgress(row: any): number {
    if (row.is_ready_to_record) return 100;
    if (row.correction_id) return 30;
    return 60;
  }

  private estimateValidationTime(row: any): number {
    if (row.is_ready_to_record) return 0;
    return Math.max(0, 5 - row.days_in_validation);
  }

  private identifyValidationBlockers(row: any): string[] {
    const blockers: string[] = [];
    if (row.correction_id) blockers.push('Memerlukan koreksi');
    if (row.days_in_validation > 10) blockers.push('Validasi terlalu lama');
    return blockers;
  }

  private suggestValidationActions(row: any): string[] {
    if (row.is_ready_to_record) return ['Lakukan perekaman'];
    if (row.correction_id) return ['Lakukan koreksi'];
    return ['Lanjutkan validasi'];
  }

  private mapComplaintStage(row: any): string {
    if (row.tindak_lanjut_pengaduan && row.tindak_lanjut_pengaduan.trim()) return 'Ditindaklanjuti';
    return 'Menunggu Tindak Lanjut';
  }

  private calculateComplaintProgress(row: any): number {
    return (row.tindak_lanjut_pengaduan && row.tindak_lanjut_pengaduan.trim()) ? 100 : 25;
  }

  private estimateComplaintTime(row: any): number {
    if (row.tindak_lanjut_pengaduan && row.tindak_lanjut_pengaduan.trim()) return 0;
    return Math.max(0, 14 - row.days_since_complaint);
  }

  private identifyComplaintBlockers(row: any): string[] {
    const blockers: string[] = [];
    if (!row.tindak_lanjut_pengaduan || !row.tindak_lanjut_pengaduan.trim()) {
      blockers.push('Belum ada tindak lanjut');
    }
    if (row.days_since_complaint > 30) blockers.push('Pengaduan terlalu lama');
    return blockers;
  }

  private suggestComplaintActions(row: any): string[] {
    if (row.tindak_lanjut_pengaduan && row.tindak_lanjut_pengaduan.trim()) {
      return ['Monitor hasil', 'Follow up dengan pengadu'];
    }
    return ['Investigasi pengaduan', 'Tentukan tindak lanjut'];
  }
}

// Export singleton instance
export const administrativeWorkflowIntelligence = AdministrativeWorkflowIntelligence.getInstance();
