/**
 * Multi-Service Response Synthesizer for SELLY
 * Combines information from multiple knowledge base entries to provide comprehensive guidance
 * Maintains SELLY's friendly tone while delivering complex multi-service information
 */

import { CrossServiceScenario, MultiServiceResponse, MultiServiceStep } from './crossServiceDependencyMapper';
import { ServiceInfo } from './knowledgeService';
import { QueryAnalysisResult } from './multiServiceQueryAnalyzer';

export interface SynthesisOptions {
  includeTimeline: boolean;
  includeCosts: boolean;
  includeWarnings: boolean;
  includeTips: boolean;
  responseStyle: 'comprehensive' | 'concise' | 'step_by_step';
  prioritizeUrgent: boolean;
}

export interface ServiceSynthesisData {
  serviceInfo: ServiceInfo;
  priority: number;
  dependencyLevel: 'primary' | 'secondary' | 'optional';
  estimatedPosition: number;
}

export class MultiServiceResponseSynthesizer {
  private defaultOptions: SynthesisOptions = {
    includeTimeline: true,
    includeCosts: true,
    includeWarnings: true,
    includeTips: true,
    responseStyle: 'comprehensive',
    prioritizeUrgent: false
  };

  /**
   * Synthesize comprehensive multi-service response
   */
  public synthesizeResponse(
    analysisResult: QueryAnalysisResult,
    servicesData: Map<string, ServiceInfo>,
    options: Partial<SynthesisOptions> = {}
  ): MultiServiceResponse {
    const finalOptions = { ...this.defaultOptions, ...options };
    
    if (!analysisResult.scenario) {
      throw new Error('Cannot synthesize multi-service response without scenario');
    }

    console.log(`🔄 [MULTI_SERVICE_SYNTHESIZER] Synthesizing response for scenario: ${analysisResult.scenario.name}`);

    // Step 1: Prepare service synthesis data
    const synthesisData = this.prepareSynthesisData(analysisResult, servicesData);
    
    // Step 2: Generate process steps
    const processSteps = this.generateProcessSteps(analysisResult.scenario, synthesisData);
    
    // Step 3: Calculate totals and priorities
    const totalEstimatedTime = this.calculateTotalTime(processSteps);
    const priorityOrder = this.determinePriorityOrder(analysisResult.scenario, synthesisData);
    
    // Step 4: Generate warnings and tips
    const warnings = this.generateWarnings(analysisResult.scenario, synthesisData, finalOptions);
    const tips = this.generateTips(analysisResult.scenario, synthesisData, finalOptions);

    return {
      scenario: analysisResult.scenario,
      involvedServices: analysisResult.detectedServices,
      processSteps,
      totalEstimatedTime,
      priorityOrder,
      warnings,
      tips
    };
  }

  /**
   * Format multi-service response for user display
   */
  public formatResponse(response: MultiServiceResponse, options: Partial<SynthesisOptions> = {}): string {
    const finalOptions = { ...this.defaultOptions, ...options };
    
    let formattedResponse = '';
    
    // Header with scenario information
    formattedResponse += this.formatHeader(response);
    
    // Process steps based on style
    switch (finalOptions.responseStyle) {
      case 'step_by_step':
        formattedResponse += this.formatStepByStepProcess(response);
        break;
      case 'concise':
        formattedResponse += this.formatConciseProcess(response);
        break;
      default:
        formattedResponse += this.formatComprehensiveProcess(response);
    }
    
    // Timeline and costs
    if (finalOptions.includeTimeline) {
      formattedResponse += this.formatTimeline(response);
    }
    
    // Warnings
    if (finalOptions.includeWarnings && response.warnings.length > 0) {
      formattedResponse += this.formatWarnings(response.warnings);
    }
    
    // Tips
    if (finalOptions.includeTips && response.tips.length > 0) {
      formattedResponse += this.formatTips(response.tips);
    }
    
    // Footer with encouragement
    formattedResponse += this.formatFooter();
    
    return formattedResponse;
  }

  /**
   * Prepare synthesis data from analysis results
   */
  private prepareSynthesisData(
    analysisResult: QueryAnalysisResult,
    servicesData: Map<string, ServiceInfo>
  ): Map<string, ServiceSynthesisData> {
    const synthesisData = new Map<string, ServiceSynthesisData>();
    
    if (!analysisResult.scenario) return synthesisData;
    
    // Primary services
    analysisResult.scenario.primaryServices.forEach((serviceId, index) => {
      const serviceInfo = servicesData.get(serviceId);
      if (serviceInfo) {
        synthesisData.set(serviceId, {
          serviceInfo,
          priority: 10 - index,
          dependencyLevel: 'primary',
          estimatedPosition: index + 1
        });
      }
    });
    
    // Dependent services
    if (analysisResult.scenario) {
      analysisResult.scenario.dependentServices.forEach((dependency, index) => {
        const serviceInfo = servicesData.get(dependency.serviceId);
        if (serviceInfo) {
          synthesisData.set(dependency.serviceId, {
            serviceInfo,
            priority: dependency.priority,
            dependencyLevel: dependency.dependencyType === 'required' ? 'secondary' : 'optional',
            estimatedPosition: analysisResult.scenario!.primaryServices.length + index + 1
          });
        }
      });
    }
    
    return synthesisData;
  }

  /**
   * Generate detailed process steps
   */
  private generateProcessSteps(
    scenario: CrossServiceScenario,
    synthesisData: Map<string, ServiceSynthesisData>
  ): MultiServiceStep[] {
    const steps: MultiServiceStep[] = [];
    let stepNumber = 1;
    
    // Follow the recommended process order
    for (const serviceId of scenario.processOrder) {
      const synthData = synthesisData.get(serviceId);
      if (synthData) {
        const step: MultiServiceStep = {
          stepNumber,
          serviceId,
          serviceName: synthData.serviceInfo.serviceName,
          description: `${synthData.serviceInfo.serviceType} - ${synthData.serviceInfo.serviceName}`,
          estimatedTime: synthData.serviceInfo.duration,
          requirements: synthData.serviceInfo.requirements.map(req => req.name),
          notes: synthData.serviceInfo.notes,
          dependsOn: stepNumber > 1 ? [scenario.processOrder[stepNumber - 2]] : undefined
        };
        
        steps.push(step);
        stepNumber++;
      }
    }
    
    return steps;
  }

  /**
   * Calculate total estimated time
   */
  private calculateTotalTime(steps: MultiServiceStep[]): string {
    // Simple heuristic: take the longest individual time and add buffer for dependencies
    const durations = steps.map(step => this.parseDuration(step.estimatedTime));
    const maxDuration = Math.max(...durations);
    const bufferTime = Math.ceil(durations.length * 0.5); // 0.5 weeks buffer per service
    
    const totalWeeks = maxDuration + bufferTime;
    
    if (totalWeeks <= 1) return '1 minggu';
    if (totalWeeks <= 4) return `${totalWeeks} minggu`;
    
    const months = Math.ceil(totalWeeks / 4);
    return `${months} bulan`;
  }

  /**
   * Parse duration string to weeks
   */
  private parseDuration(duration: string): number {
    const lowerDuration = duration.toLowerCase();
    
    if (lowerDuration.includes('hari')) {
      const days = parseInt(lowerDuration.match(/\d+/)?.[0] || '7');
      return Math.ceil(days / 7);
    }
    
    if (lowerDuration.includes('minggu')) {
      return parseInt(lowerDuration.match(/\d+/)?.[0] || '1');
    }
    
    if (lowerDuration.includes('bulan')) {
      const months = parseInt(lowerDuration.match(/\d+/)?.[0] || '1');
      return months * 4;
    }
    
    return 1; // Default to 1 week
  }

  /**
   * Determine priority order
   */
  private determinePriorityOrder(
    scenario: CrossServiceScenario,
    synthesisData: Map<string, ServiceSynthesisData>
  ): string[] {
    return scenario.processOrder.filter(serviceId => synthesisData.has(serviceId));
  }

  /**
   * Generate contextual warnings
   */
  private generateWarnings(
    scenario: CrossServiceScenario,
    synthesisData: Map<string, ServiceSynthesisData>,
    options: SynthesisOptions
  ): string[] {
    const warnings: string[] = [];
    
    // Complexity warnings
    if (scenario.complexity === 'complex') {
      warnings.push('Proses ini cukup kompleks dan memerlukan beberapa tahap. Pastikan dokumen lengkap sebelum memulai.');
    }
    
    // Time warnings
    if (synthesisData.size >= 4) {
      warnings.push('Karena melibatkan banyak dokumen, proses ini memerlukan waktu lebih lama. Rencanakan dengan baik.');
    }
    
    // Dependency warnings
    const requiredServices = Array.from(synthesisData.values())
      .filter(data => data.dependencyLevel === 'secondary');
    
    if (requiredServices.length > 0) {
      warnings.push('Beberapa dokumen saling bergantung. Ikuti urutan yang disarankan untuk menghindari penolakan.');
    }
    
    return warnings;
  }

  /**
   * Generate helpful tips
   */
  private generateTips(
    scenario: CrossServiceScenario,
    synthesisData: Map<string, ServiceSynthesisData>,
    options: SynthesisOptions
  ): string[] {
    const tips: string[] = [];
    
    // General tips
    tips.push('Siapkan fotokopi semua dokumen yang diperlukan sebelum datang ke kantor');
    tips.push('Datang pagi hari untuk menghindari antrian panjang');
    
    // Scenario-specific tips
    if (scenario.scenarioId === 'address_change') {
      tips.push('Urus surat kepindahan terlebih dahulu sebelum memperbarui dokumen lainnya');
      tips.push('Pastikan alamat baru sudah jelas dan sesuai dengan RT/RW setempat');
    }
    
    if (scenario.scenarioId === 'marriage_documentation') {
      tips.push('Akta perkawinan harus sudah jadi sebelum mengurus dokumen lainnya');
      tips.push('Koordinasikan dengan pasangan untuk dokumen yang memerlukan kehadiran berdua');
    }
    
    // Time-saving tips
    if (synthesisData.size >= 3) {
      tips.push('Pertimbangkan untuk mengurus beberapa dokumen dalam hari yang sama jika memungkinkan');
    }
    
    return tips;
  }

  /**
   * Format response header
   */
  private formatHeader(response: MultiServiceResponse): string {
    return `🎯 **${response.scenario.name}**

Halo kak! 😊 Saya SELLY akan membantu kakak dengan proses **${response.scenario.name.toLowerCase()}** yang melibatkan ${response.involvedServices.length} jenis dokumen.

${response.scenario.description}

`;
  }

  /**
   * Format comprehensive process
   */
  private formatComprehensiveProcess(response: MultiServiceResponse): string {
    let content = `📋 **Langkah-langkah Lengkap:**\n\n`;
    
    response.processSteps.forEach((step, index) => {
      content += `**${step.stepNumber}️⃣ ${step.serviceName}**\n`;
      content += `⏱️ Estimasi waktu: ${step.estimatedTime}\n`;
      content += `📄 Persyaratan utama:\n`;
      
      step.requirements.slice(0, 3).forEach(req => {
        content += `   • ${req}\n`;
      });
      
      if (step.requirements.length > 3) {
        content += `   • ... dan ${step.requirements.length - 3} dokumen lainnya\n`;
      }
      
      if (step.dependsOn && step.dependsOn.length > 0) {
        content += `⚠️ Bergantung pada: ${step.dependsOn.join(', ')}\n`;
      }
      
      content += '\n';
    });
    
    return content;
  }

  /**
   * Format step-by-step process
   */
  private formatStepByStepProcess(response: MultiServiceResponse): string {
    let content = `📝 **Urutan Proses:**\n\n`;
    
    response.priorityOrder.forEach((serviceId, index) => {
      const step = response.processSteps.find(s => s.serviceId === serviceId);
      if (step) {
        content += `${index + 1}. **${step.serviceName}** (${step.estimatedTime})\n`;
      }
    });
    
    content += '\n💡 *Ikuti urutan ini untuk hasil terbaik*\n\n';
    return content;
  }

  /**
   * Format concise process
   */
  private formatConciseProcess(response: MultiServiceResponse): string {
    const serviceNames = response.processSteps.map(step => step.serviceName);
    return `📋 **Dokumen yang perlu diurus:** ${serviceNames.join(' → ')}\n\n`;
  }

  /**
   * Format timeline
   */
  private formatTimeline(response: MultiServiceResponse): string {
    return `⏰ **Estimasi Waktu Total:** ${response.totalEstimatedTime}\n\n`;
  }

  /**
   * Format warnings
   */
  private formatWarnings(warnings: string[]): string {
    let content = `⚠️ **Hal Penting yang Perlu Diperhatikan:**\n\n`;
    warnings.forEach(warning => {
      content += `• ${warning}\n`;
    });
    return content + '\n';
  }

  /**
   * Format tips
   */
  private formatTips(tips: string[]): string {
    let content = `💡 **Tips dari SELLY:**\n\n`;
    tips.forEach(tip => {
      content += `• ${tip}\n`;
    });
    return content + '\n';
  }

  /**
   * Format footer
   */
  private formatFooter(): string {
    return `🤝 **Butuh bantuan lebih lanjut?**
Jangan ragu untuk bertanya jika ada yang kurang jelas. SELLY siap membantu kakak! 😊

📍 **Lokasi:** Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut
⏰ **Jam Pelayanan:** Senin-Jumat 08:00-15:00 WIB`;
  }
}
