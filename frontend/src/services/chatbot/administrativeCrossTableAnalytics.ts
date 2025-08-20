/**
 * Administrative Cross-Table Analytics for SELLY
 * Advanced cross-table analytics for administrative insights
 * Implements Week 2 of the RAG optimization plan
 */

import { chatbotDataService } from "./dataService";

export interface UserEngagementInsights {
  userId: string;
  userName: string;
  totalPengajuan: number;
  totalAktivitas: number;
  pengajuanTerakhir: string | null;
  aktivitasTerakhir: string | null;
  engagementScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ApplicationTrendInsights {
  bulan: string;
  totalPengajuan: number;
  perluAdjudicate: number;
  adaKesalahan: number;
  rataRataHariValidasi: number;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  seasonalPattern: string;
}

export interface ValidationEfficiencyInsights {
  totalValidations: number;
  averageProcessingTime: number;
  successRate: number;
  commonErrorTypes: string[];
  bottleneckStages: string[];
  efficiencyScore: number;
}

export interface SystemPerformanceInsights {
  overallHealth: number;
  userActivityLevel: 'low' | 'medium' | 'high';
  applicationVolume: 'low' | 'medium' | 'high';
  errorRate: number;
  systemRecommendations: string[];
}

export interface AdministrativeInsights {
  userEngagement: UserEngagementInsights[];
  applicationTrends: ApplicationTrendInsights[];
  validationEfficiency: ValidationEfficiencyInsights;
  systemPerformance: SystemPerformanceInsights;
  generatedAt: string;
  dataQuality: {
    completeness: number;
    accuracy: number;
    timeliness: number;
  };
}

export class AdministrativeCrossTableAnalytics {
  private static instance: AdministrativeCrossTableAnalytics;

  public static getInstance(): AdministrativeCrossTableAnalytics {
    if (!AdministrativeCrossTableAnalytics.instance) {
      AdministrativeCrossTableAnalytics.instance = new AdministrativeCrossTableAnalytics();
    }
    return AdministrativeCrossTableAnalytics.instance;
  }

  /**
   * Generate comprehensive administrative insights
   */
  public async generateAdministrativeInsights(): Promise<AdministrativeInsights> {
    try {
      console.log('Generating comprehensive administrative insights...');

      const [
        userEngagement,
        applicationTrends,
        validationEfficiency,
        systemPerformance
      ] = await Promise.all([
        this.analyzeUserEngagement(),
        this.analyzeApplicationTrends(),
        this.analyzeValidationEfficiency(),
        this.analyzeSystemPerformance()
      ]);

      return {
        userEngagement,
        applicationTrends,
        validationEfficiency,
        systemPerformance,
        generatedAt: new Date().toISOString(),
        dataQuality: await this.assessDataQuality()
      };

    } catch (error) {
      console.error('Error generating administrative insights:', error);
      throw error;
    }
  }

  /**
   * Analyze user engagement across applications and activities
   */
  private async analyzeUserEngagement(): Promise<UserEngagementInsights[]> {
    const sql = `
      SELECT 
        p.id as user_id,
        p.name as user_name,
        COUNT(pb.id) as total_pengajuan,
        COUNT(au.id) as total_aktivitas,
        MAX(pb.tanggal_pengajuan) as pengajuan_terakhir,
        MAX(au.created_at) as aktivitas_terakhir,
        -- Calculate engagement score
        (COUNT(pb.id) * 2 + COUNT(au.id)) as raw_engagement_score
      FROM profiles p
      LEFT JOIN pengajuan_bulanan pb ON p.id = pb.user_id
      LEFT JOIN aktivitas_user au ON p.id = au.user_id
      WHERE p.role = 'user'
      GROUP BY p.id, p.name
      ORDER BY raw_engagement_score DESC, total_pengajuan DESC
      LIMIT 20
    `;

    const result = await chatbotDataService.executeCustomQuery(sql);
    
    if (!result.success || !result.data) {
      return [];
    }

    return result.data.map((row: any) => {
      const engagementScore = this.calculateEngagementScore(
        row.total_pengajuan || 0,
        row.total_aktivitas || 0
      );

      return {
        userId: row.user_id,
        userName: row.user_name || 'Unknown',
        totalPengajuan: row.total_pengajuan || 0,
        totalAktivitas: row.total_aktivitas || 0,
        pengajuanTerakhir: row.pengajuan_terakhir,
        aktivitasTerakhir: row.aktivitas_terakhir,
        engagementScore,
        riskLevel: this.determineRiskLevel(engagementScore, row.pengajuan_terakhir)
      };
    });
  }

  /**
   * Analyze application trends with validation status
   */
  private async analyzeApplicationTrends(): Promise<ApplicationTrendInsights[]> {
    const sql = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', pb.tanggal_pengajuan), 'YYYY-MM') as bulan,
        COUNT(pb.id) as total_pengajuan,
        COUNT(ar.id) as perlu_adjudicate,
        COUNT(sr.id) as ada_kesalahan,
        AVG(EXTRACT(days FROM (ar.created_at - pb.tanggal_pengajuan))) as rata_rata_hari_validasi
      FROM pengajuan_bulanan pb
      LEFT JOIN adjudicate_record ar ON pb.nik_pengaju = ar.nik_pengaju
      LEFT JOIN salah_rekam sr ON pb.nik_pengaju = sr.nik_pengaju
      WHERE pb.tanggal_pengajuan >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', pb.tanggal_pengajuan)
      ORDER BY bulan DESC
      LIMIT 12
    `;

    const result = await chatbotDataService.executeCustomQuery(sql);
    
    if (!result.success || !result.data) {
      return [];
    }

    return result.data.map((row: any, index: number, array: any[]) => {
      const trendDirection = this.calculateTrendDirection(row, array, index);
      const seasonalPattern = this.detectSeasonalPattern(row.bulan);

      return {
        bulan: row.bulan,
        totalPengajuan: row.total_pengajuan || 0,
        perluAdjudicate: row.perlu_adjudicate || 0,
        adaKesalahan: row.ada_kesalahan || 0,
        rataRataHariValidasi: Math.round(row.rata_rata_hari_validasi || 0),
        trendDirection,
        seasonalPattern
      };
    });
  }

  /**
   * Analyze validation efficiency across the system
   */
  private async analyzeValidationEfficiency(): Promise<ValidationEfficiencyInsights> {
    const sql = `
      SELECT 
        COUNT(ar.id) as total_validations,
        AVG(EXTRACT(days FROM (ar.created_at - pb.tanggal_pengajuan))) as avg_processing_time,
        COUNT(CASE WHEN ar.is_ready_to_record = true THEN 1 END) as successful_validations,
        STRING_AGG(DISTINCT ar.jenis_eksepsi, '|') as error_types,
        COUNT(sr.id) as total_errors
      FROM adjudicate_record ar
      LEFT JOIN pengajuan_bulanan pb ON ar.nik_pengaju = pb.nik_pengaju
      LEFT JOIN salah_rekam sr ON ar.nik_adjudicate = sr.nik_salah_rekam
      WHERE ar.created_at >= NOW() - INTERVAL '3 months'
    `;

    const result = await chatbotDataService.executeCustomQuery(sql);
    
    if (!result.success || !result.data || result.data.length === 0) {
      return this.getDefaultValidationEfficiency();
    }

    const row = result.data[0];
    const totalValidations = row.total_validations || 0;
    const successfulValidations = row.successful_validations || 0;
    const successRate = totalValidations > 0 ? (successfulValidations / totalValidations) * 100 : 0;
    
    const commonErrorTypes = row.error_types 
      ? row.error_types.split('|').filter((type: string) => type && type.trim())
      : [];

    return {
      totalValidations,
      averageProcessingTime: Math.round(row.avg_processing_time || 0),
      successRate: Math.round(successRate),
      commonErrorTypes,
      bottleneckStages: this.identifyBottleneckStages(row),
      efficiencyScore: this.calculateEfficiencyScore(successRate, row.avg_processing_time)
    };
  }

  /**
   * Analyze overall system performance
   */
  private async analyzeSystemPerformance(): Promise<SystemPerformanceInsights> {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM profiles WHERE role = 'user') as total_users,
        (SELECT COUNT(*) FROM aktivitas_user WHERE created_at >= NOW() - INTERVAL '7 days') as recent_activity,
        (SELECT COUNT(*) FROM pengajuan_bulanan WHERE tanggal_pengajuan >= NOW() - INTERVAL '7 days') as recent_applications,
        (SELECT COUNT(*) FROM salah_rekam WHERE created_at >= NOW() - INTERVAL '7 days') as recent_errors,
        (SELECT COUNT(*) FROM pending_users WHERE status = 'pending') as pending_approvals
    `;

    const result = await chatbotDataService.executeCustomQuery(sql);
    
    if (!result.success || !result.data || result.data.length === 0) {
      return this.getDefaultSystemPerformance();
    }

    const row = result.data[0];
    const totalUsers = row.total_users || 0;
    const recentActivity = row.recent_activity || 0;
    const recentApplications = row.recent_applications || 0;
    const recentErrors = row.recent_errors || 0;

    const activityLevel = this.determineActivityLevel(recentActivity, totalUsers);
    const applicationVolume = this.determineApplicationVolume(recentApplications);
    const errorRate = recentApplications > 0 ? (recentErrors / recentApplications) * 100 : 0;
    const overallHealth = this.calculateOverallHealth(activityLevel, applicationVolume, errorRate);

    return {
      overallHealth,
      userActivityLevel: activityLevel,
      applicationVolume,
      errorRate: Math.round(errorRate),
      systemRecommendations: this.generateSystemRecommendations(
        activityLevel, 
        applicationVolume, 
        errorRate, 
        row.pending_approvals || 0
      )
    };
  }

  /**
   * Assess overall data quality
   */
  private async assessDataQuality(): Promise<{ completeness: number; accuracy: number; timeliness: number }> {
    // Simplified data quality assessment
    const completenessScore = await this.assessDataCompleteness();
    const accuracyScore = await this.assessDataAccuracy();
    const timelinessScore = await this.assessDataTimeliness();

    return {
      completeness: completenessScore,
      accuracy: accuracyScore,
      timeliness: timelinessScore
    };
  }

  // Helper methods
  private calculateEngagementScore(pengajuan: number, aktivitas: number): number {
    return Math.min(Math.round((pengajuan * 2 + aktivitas) / 3), 100);
  }

  private determineRiskLevel(score: number, lastActivity: string | null): 'low' | 'medium' | 'high' {
    if (!lastActivity) return 'high';
    
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (score < 20 || daysSinceActivity > 90) return 'high';
    if (score < 50 || daysSinceActivity > 30) return 'medium';
    return 'low';
  }

  private calculateTrendDirection(
    current: any, 
    array: any[], 
    index: number
  ): 'increasing' | 'decreasing' | 'stable' {
    if (index >= array.length - 1) return 'stable';
    
    const previous = array[index + 1];
    const currentValue = current.total_pengajuan || 0;
    const previousValue = previous.total_pengajuan || 0;
    
    const changePercent = previousValue > 0 ? 
      ((currentValue - previousValue) / previousValue) * 100 : 0;

    if (changePercent > 10) return 'increasing';
    if (changePercent < -10) return 'decreasing';
    return 'stable';
  }

  private detectSeasonalPattern(month: string): string {
    const monthNum = parseInt(month.split('-')[1]);
    
    if ([12, 1, 2].includes(monthNum)) return 'Akhir/Awal Tahun';
    if ([6, 7, 8].includes(monthNum)) return 'Pertengahan Tahun';
    if ([3, 4, 5].includes(monthNum)) return 'Kuartal Pertama';
    return 'Kuartal Ketiga';
  }

  private identifyBottleneckStages(data: any): string[] {
    const bottlenecks: string[] = [];
    
    if (data.avg_processing_time > 7) {
      bottlenecks.push('Validasi terlalu lama');
    }
    
    if (data.total_errors > data.total_validations * 0.2) {
      bottlenecks.push('Tingkat error tinggi');
    }

    return bottlenecks;
  }

  private calculateEfficiencyScore(successRate: number, avgTime: number): number {
    const timeScore = Math.max(0, 100 - (avgTime * 5)); // Penalty for longer processing time
    return Math.round((successRate + timeScore) / 2);
  }

  private determineActivityLevel(activity: number, totalUsers: number): 'low' | 'medium' | 'high' {
    if (totalUsers === 0) return 'low';
    
    const activityRate = (activity / totalUsers) * 100;
    if (activityRate > 50) return 'high';
    if (activityRate > 20) return 'medium';
    return 'low';
  }

  private determineApplicationVolume(applications: number): 'low' | 'medium' | 'high' {
    if (applications > 100) return 'high';
    if (applications > 20) return 'medium';
    return 'low';
  }

  private calculateOverallHealth(
    activityLevel: string, 
    applicationVolume: string, 
    errorRate: number
  ): number {
    let health = 70; // Base health

    // Activity level impact
    if (activityLevel === 'high') health += 15;
    else if (activityLevel === 'medium') health += 5;
    else health -= 10;

    // Application volume impact
    if (applicationVolume === 'high') health += 10;
    else if (applicationVolume === 'medium') health += 5;

    // Error rate impact
    health -= Math.min(errorRate * 2, 30);

    return Math.max(0, Math.min(100, Math.round(health)));
  }

  private generateSystemRecommendations(
    activityLevel: string,
    applicationVolume: string,
    errorRate: number,
    pendingApprovals: number
  ): string[] {
    const recommendations: string[] = [];

    if (activityLevel === 'low') {
      recommendations.push('Tingkatkan engagement pengguna dengan notifikasi dan reminder');
    }

    if (errorRate > 15) {
      recommendations.push('Review dan perbaiki proses validasi untuk mengurangi error rate');
    }

    if (pendingApprovals > 10) {
      recommendations.push('Percepat proses persetujuan pengguna untuk mengurangi backlog');
    }

    if (applicationVolume === 'high' && errorRate > 10) {
      recommendations.push('Implementasi quality control tambahan untuk volume tinggi');
    }

    if (recommendations.length === 0) {
      recommendations.push('Sistem berjalan dengan baik, lanjutkan monitoring rutin');
    }

    return recommendations;
  }

  // Default fallback methods
  private getDefaultValidationEfficiency(): ValidationEfficiencyInsights {
    return {
      totalValidations: 0,
      averageProcessingTime: 0,
      successRate: 0,
      commonErrorTypes: [],
      bottleneckStages: ['Data tidak tersedia'],
      efficiencyScore: 0
    };
  }

  private getDefaultSystemPerformance(): SystemPerformanceInsights {
    return {
      overallHealth: 50,
      userActivityLevel: 'low',
      applicationVolume: 'low',
      errorRate: 0,
      systemRecommendations: ['Sistem memerlukan data untuk analisis yang akurat']
    };
  }

  private async assessDataCompleteness(): Promise<number> {
    // Simplified completeness check
    return 85; // Placeholder - would implement actual completeness logic
  }

  private async assessDataAccuracy(): Promise<number> {
    // Simplified accuracy check
    return 90; // Placeholder - would implement actual accuracy logic
  }

  private async assessDataTimeliness(): Promise<number> {
    // Simplified timeliness check
    return 88; // Placeholder - would implement actual timeliness logic
  }
}

// Export singleton instance
export const administrativeCrossTableAnalytics = AdministrativeCrossTableAnalytics.getInstance();
