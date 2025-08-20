/**
 * Master Training Orchestrator
 * Comprehensive SELLY training enhancement system
 * Executes sequential training for all 4 new document types
 */

import { AktaKematianContinuousTraining } from './aktaKematianContinuousTraining';
import { AktaPerkawinanContinuousTraining } from './aktaPerkawinanContinuousTraining';
import { AktaPengakuanAnakContinuousTraining } from './aktaPengakuanAnakContinuousTraining';
import { KIAContinuousTraining } from './kiaContinuousTraining';
import { PerpindahanContinuousTraining } from './perpindahanContinuousTraining';

export interface MasterTrainingConfig {
  enableGroqIntegration: boolean;
  targetAccuracy: number;
  maxTrainingTimePerService: number;
  validationEnabled: boolean;
  generateReports: boolean;
}

export interface TrainingServiceResult {
  serviceName: string;
  success: boolean;
  accuracy: number;
  trainingTime: number;
  totalPairs: number;
  categoriesProcessed: string[];
  errors: string[];
}

export interface MasterTrainingResult {
  overallSuccess: boolean;
  totalTrainingTime: number;
  totalPairsProcessed: number;
  servicesCompleted: number;
  averageAccuracy: number;
  serviceResults: TrainingServiceResult[];
  errors: string[];
  reportPath?: string;
}

export class MasterTrainingOrchestrator {
  private aktaKematianTraining: AktaKematianContinuousTraining;
  private aktaPerkawinanTraining: AktaPerkawinanContinuousTraining;
  private aktaPengakuanAnakTraining: AktaPengakuanAnakContinuousTraining;
  private kiaTraining: KIAContinuousTraining;
  private perpindahanTraining: PerpindahanContinuousTraining;
  
  private initialized: boolean = false;

  constructor() {
    this.aktaKematianTraining = AktaKematianContinuousTraining.getInstance();
    this.aktaPerkawinanTraining = AktaPerkawinanContinuousTraining.getInstance();
    this.aktaPengakuanAnakTraining = AktaPengakuanAnakContinuousTraining.getInstance();
    this.kiaTraining = KIAContinuousTraining.getInstance();
    this.perpindahanTraining = PerpindahanContinuousTraining.getInstance();
  }

  /**
   * Initialize all training services
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🚀 [MASTER_TRAINING] Initializing comprehensive SELLY training system...');
      
      await Promise.all([
        this.aktaKematianTraining.initialize(),
        this.aktaPerkawinanTraining.initialize(),
        this.aktaPengakuanAnakTraining.initialize(),
        this.kiaTraining.initialize(),
        this.perpindahanTraining.initialize()
      ]);
      
      this.initialized = true;
      // console.log(
    } catch (error) {
      // console.error( [MASTER_TRAINING] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Execute comprehensive training enhancement for all services
   */
  public async executeComprehensiveTraining(config?: Partial<MasterTrainingConfig>): Promise<MasterTrainingResult> {
    const startTime = performance.now();
    
    const trainingConfig: MasterTrainingConfig = {
      enableGroqIntegration: true,
      targetAccuracy: 0.95,
      maxTrainingTimePerService: 4 * 60 * 60 * 1000, // 4 hours per service
      validationEnabled: true,
      generateReports: true,
      ...config
    };

    const serviceResults: TrainingServiceResult[] = [];
    const errors: string[] = [];
    let totalPairsProcessed = 0;

    try {
      console.log('🚀 [MASTER_TRAINING] Starting comprehensive SELLY training enhancement...');
      console.log('📋 [MASTER_TRAINING] Training sequence: Perpindahan → Akta Kematian → Akta Perkawinan → Akta Pengakuan Anak → KIA');
      
      // Step 1: Enhanced Perpindahan Training (includes new QnA pairs)
      console.log('\n🏠 [MASTER_TRAINING] Phase 1: Enhanced Perpindahan Training...');
      try {
        const perpindahanResult = await this.perpindahanTraining.executePerpindahanTraining({
          targetAccuracy: trainingConfig.targetAccuracy,
          maxTrainingTime: trainingConfig.maxTrainingTimePerService,
          validationSplit: 0.2,
          learningRate: 0.001,
          batchSize: 32,
          enableGroqEnhancement: trainingConfig.enableGroqIntegration
        });
        
        serviceResults.push({
          serviceName: 'Perpindahan (Enhanced)',
          success: perpindahanResult.success,
          accuracy: perpindahanResult.finalAccuracy,
          trainingTime: perpindahanResult.trainingDuration,
          totalPairs: perpindahanResult.totalTrainingPairs,
          categoriesProcessed: perpindahanResult.scenarioSupport,
          errors: []
        });
        
        totalPairsProcessed += perpindahanResult.totalTrainingPairs;
        // console.log(
      } catch (error) {
        // console.error( [MASTER_TRAINING] Perpindahan training failed:', error);
        errors.push(`Perpindahan: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Step 2: Akta Kematian Training
      console.log('\n⚰️ [MASTER_TRAINING] Phase 2: Akta Kematian Training...');
      try {
        const aktaKematianResult = await this.aktaKematianTraining.executeAktaKematianTraining({
          targetAccuracy: trainingConfig.targetAccuracy,
          maxTrainingTime: trainingConfig.maxTrainingTimePerService,
          validationSplit: 0.2,
          learningRate: 0.001,
          batchSize: 32
        });
        
        serviceResults.push({
          serviceName: 'Akta Kematian',
          success: aktaKematianResult.success,
          accuracy: aktaKematianResult.accuracy,
          trainingTime: aktaKematianResult.trainingTime,
          totalPairs: aktaKematianResult.totalPairs,
          categoriesProcessed: aktaKematianResult.categoriesProcessed,
          errors: aktaKematianResult.errors
        });
        
        totalPairsProcessed += aktaKematianResult.totalPairs;
        // console.log(
      } catch (error) {
        // console.error( [MASTER_TRAINING] Akta Kematian training failed:', error);
        errors.push(`Akta Kematian: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Step 3: Akta Perkawinan Training
      console.log('\n💒 [MASTER_TRAINING] Phase 3: Akta Perkawinan Training...');
      try {
        const aktaPerkawinanResult = await this.aktaPerkawinanTraining.executeAktaPerkawinanTraining({
          targetAccuracy: trainingConfig.targetAccuracy,
          maxTrainingTime: trainingConfig.maxTrainingTimePerService,
          validationSplit: 0.2,
          learningRate: 0.001,
          batchSize: 32
        });
        
        serviceResults.push({
          serviceName: 'Akta Perkawinan',
          success: aktaPerkawinanResult.success,
          accuracy: aktaPerkawinanResult.accuracy,
          trainingTime: aktaPerkawinanResult.trainingTime,
          totalPairs: aktaPerkawinanResult.totalPairs,
          categoriesProcessed: aktaPerkawinanResult.categoriesProcessed,
          errors: aktaPerkawinanResult.errors
        });
        
        totalPairsProcessed += aktaPerkawinanResult.totalPairs;
        // console.log(
      } catch (error) {
        // console.error( [MASTER_TRAINING] Akta Perkawinan training failed:', error);
        errors.push(`Akta Perkawinan: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Step 4: Akta Pengakuan Anak Training
      console.log('\n👶 [MASTER_TRAINING] Phase 4: Akta Pengakuan Anak Training...');
      try {
        const aktaPengakuanAnakResult = await this.aktaPengakuanAnakTraining.executeAktaPengakuanAnakTraining({
          targetAccuracy: trainingConfig.targetAccuracy,
          maxTrainingTime: trainingConfig.maxTrainingTimePerService,
          validationSplit: 0.2,
          learningRate: 0.001,
          batchSize: 32
        });
        
        serviceResults.push({
          serviceName: 'Akta Pengakuan Anak',
          success: aktaPengakuanAnakResult.success,
          accuracy: aktaPengakuanAnakResult.accuracy,
          trainingTime: aktaPengakuanAnakResult.trainingTime,
          totalPairs: aktaPengakuanAnakResult.totalPairs,
          categoriesProcessed: aktaPengakuanAnakResult.categoriesProcessed,
          errors: aktaPengakuanAnakResult.errors
        });
        
        totalPairsProcessed += aktaPengakuanAnakResult.totalPairs;
        // console.log(
      } catch (error) {
        // console.error( [MASTER_TRAINING] Akta Pengakuan Anak training failed:', error);
        errors.push(`Akta Pengakuan Anak: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Step 5: KIA Training
      console.log('\n🆔 [MASTER_TRAINING] Phase 5: KIA Training...');
      try {
        const kiaResult = await this.kiaTraining.executeKIATraining({
          targetAccuracy: trainingConfig.targetAccuracy,
          maxTrainingTime: trainingConfig.maxTrainingTimePerService,
          validationSplit: 0.2,
          learningRate: 0.001,
          batchSize: 32
        });
        
        serviceResults.push({
          serviceName: 'KIA (Kartu Identitas Anak)',
          success: kiaResult.success,
          accuracy: kiaResult.accuracy,
          trainingTime: kiaResult.trainingTime,
          totalPairs: kiaResult.totalPairs,
          categoriesProcessed: kiaResult.categoriesProcessed,
          errors: kiaResult.errors
        });
        
        totalPairsProcessed += kiaResult.totalPairs;
        // console.log(
      } catch (error) {
        // console.error( [MASTER_TRAINING] KIA training failed:', error);
        errors.push(`KIA: ${error instanceof Error ? error.message : String(error)}`);
      }

      const endTime = performance.now();
      const totalTrainingTime = endTime - startTime;
      
      // Calculate results
      const successfulServices = serviceResults.filter(r => r.success);
      const averageAccuracy = successfulServices.length > 0 
        ? successfulServices.reduce((sum, r) => sum + r.accuracy, 0) / successfulServices.length 
        : 0;

      const result: MasterTrainingResult = {
        overallSuccess: successfulServices.length === serviceResults.length,
        totalTrainingTime,
        totalPairsProcessed,
        servicesCompleted: successfulServices.length,
        averageAccuracy,
        serviceResults,
        errors
      };

      // Generate comprehensive report
      if (trainingConfig.generateReports) {
        result.reportPath = await this.generateComprehensiveReport(result);
      }

      console.log('\n🎉 [MASTER_TRAINING] Comprehensive training completed!');
      console.log(`📊 [MASTER_TRAINING] Services completed: ${result.servicesCompleted}/${serviceResults.length}`);
      console.log(`📈 [MASTER_TRAINING] Average accuracy: ${result.averageAccuracy.toFixed(3)}`);
      console.log(`📦 [MASTER_TRAINING] Total pairs processed: ${result.totalPairsProcessed}`);
      console.log(`⏱️ [MASTER_TRAINING] Total time: ${(result.totalTrainingTime / 1000 / 60).toFixed(2)} minutes`);

      return result;
      
    } catch (error) {
      // console.error( [MASTER_TRAINING] Comprehensive training failed:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive training report
   */
  private async generateComprehensiveReport(result: MasterTrainingResult): Promise<string> {
    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        trainingType: 'Comprehensive SELLY Enhancement',
        version: '1.0'
      },
      summary: {
        overallSuccess: result.overallSuccess,
        totalTrainingTime: result.totalTrainingTime,
        totalPairsProcessed: result.totalPairsProcessed,
        servicesCompleted: result.servicesCompleted,
        averageAccuracy: result.averageAccuracy
      },
      serviceResults: result.serviceResults,
      errors: result.errors,
      recommendations: this.generateRecommendations(result)
    };

    const reportPath = `training-reports/comprehensive-selly-training-${Date.now()}.json`;
    
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const fullPath = path.join(process.cwd(), reportPath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, JSON.stringify(report, null, 2));
      
      console.log(`📊 [MASTER_TRAINING] Comprehensive report saved: ${reportPath}`);
      return reportPath;
      
    } catch (error) {
      // console.warn(️ [MASTER_TRAINING] Failed to save report:', error);
      return '';
    }
  }

  /**
   * Generate recommendations based on training results
   */
  private generateRecommendations(result: MasterTrainingResult): string[] {
    const recommendations: string[] = [];
    
    if (result.averageAccuracy < 0.9) {
      recommendations.push('Consider increasing training time or adjusting learning parameters');
    }
    
    if (result.errors.length > 0) {
      recommendations.push('Review and resolve training errors for failed services');
    }
    
    if (result.servicesCompleted < result.serviceResults.length) {
      recommendations.push('Retry training for incomplete services');
    }
    
    recommendations.push('Test SELLY responses for all trained document types');
    recommendations.push('Monitor user interactions to identify areas for improvement');
    
    return recommendations;
  }
}
