/**
 * Indonesian Context Analyzer - Phase 4 AI Intelligence Enhancement
 * 
 * Analyzes Indonesian administrative contexts with cultural sensitivity
 * and government system awareness for accurate reasoning.
 * 
 * Compliance: Government Integration Rule, Cultural Adaptation Standards
 * Target: >90% cultural adaptation score with Indonesian administrative contexts
 */

import { z } from 'zod';

export const AdministrativeContextSchema = z.object({
  administrativeSystem: z.enum(['dukcapil', 'kemendagri', 'bpn', 'polri', 'kemenkumham']),
  userRole: z.enum(['warga_negara', 'petugas_administrasi', 'kepala_dinas', 'auditor']),
  region: z.string(),
  administrativeLevel: z.enum(['pusat', 'provinsi', 'kabupaten', 'kecamatan', 'kelurahan']),
  priority: z.enum(['rendah', 'sedang', 'tinggi', 'kritis'])
});

export type AdministrativeContext = z.infer<typeof AdministrativeContextSchema>;

/**
 * Analyzes Indonesian administrative contexts for culturally appropriate AI reasoning
 */
export class IndonesianContextAnalyzer {
  private readonly administrativeHierarchy = {
    pusat: { level: 1, authority: 'nasional', protocols: ['formal_tinggi', 'protokol_negara'] },
    provinsi: { level: 2, authority: 'regional', protocols: ['formal_sedang', 'protokol_daerah'] },
    kabupaten: { level: 3, authority: 'lokal', protocols: ['formal_sedang', 'protokol_lokal'] },
    kecamatan: { level: 4, authority: 'sub_lokal', protocols: ['formal_rendah', 'protokol_kecamatan'] },
    kelurahan: { level: 5, authority: 'komunitas', protocols: ['informal_formal', 'protokol_kelurahan'] }
  };

  private readonly systemCharacteristics = {
    dukcapil: {
      name: 'Direktorat Jenderal Kependudukan dan Pencatatan Sipil',
      services: ['ktp', 'kk', 'akta_kelahiran', 'akta_kematian', 'akta_perkawinan'],
      dataClassification: 'rahasia',
      processingTime: 'standard',
      culturalConsiderations: ['privasi_keluarga', 'adat_istiadat', 'agama']
    },
    kemendagri: {
      name: 'Kementerian Dalam Negeri',
      services: ['administrasi_daerah', 'otonomi_daerah', 'pemerintahan'],
      dataClassification: 'terbatas',
      processingTime: 'extended',
      culturalConsiderations: ['hierarki_pemerintahan', 'adat_daerah', 'protokol_resmi']
    },
    bpn: {
      name: 'Badan Pertanahan Nasional',
      services: ['sertifikat_tanah', 'pengukuran', 'pendaftaran_tanah'],
      dataClassification: 'terbatas',
      processingTime: 'extended',
      culturalConsiderations: ['hak_adat', 'tanah_ulayat', 'warisan_keluarga']
    },
    polri: {
      name: 'Kepolisian Negara Republik Indonesia',
      services: ['skck', 'laporan_polisi', 'izin_keramaian'],
      dataClassification: 'rahasia',
      processingTime: 'priority',
      culturalConsiderations: ['keamanan_masyarakat', 'hukum_adat', 'ketertiban']
    },
    kemenkumham: {
      name: 'Kementerian Hukum dan Hak Asasi Manusia',
      services: ['paspor', 'visa', 'imigrasi', 'hak_cipta'],
      dataClassification: 'rahasia',
      processingTime: 'standard',
      culturalConsiderations: ['hak_asasi', 'keadilan', 'supremasi_hukum']
    }
  };

  private readonly regionalCharacteristics: Record<string, {
    type: string;
    culture: string;
    language: string;
    administrativeComplexity: string;
  }> = {
    // Major Indonesian regions with cultural considerations
    'DKI Jakarta': {
      type: 'metropolitan',
      culture: 'kosmopolitan',
      language: 'indonesian_standard',
      administrativeComplexity: 'tinggi'
    },
    'Jawa Barat': {
      type: 'provinsi',
      culture: 'sunda',
      language: 'sundanese_indonesian',
      administrativeComplexity: 'sedang'
    },
    'Jawa Tengah': {
      type: 'provinsi',
      culture: 'jawa',
      language: 'javanese_indonesian',
      administrativeComplexity: 'sedang'
    },
    'Jawa Timur': {
      type: 'provinsi',
      culture: 'jawa_timur',
      language: 'javanese_indonesian',
      administrativeComplexity: 'sedang'
    },
    'Sumatera Utara': {
      type: 'provinsi',
      culture: 'batak_melayu',
      language: 'batak_indonesian',
      administrativeComplexity: 'sedang'
    },
    'Sulawesi Selatan': {
      type: 'provinsi',
      culture: 'bugis_makassar',
      language: 'bugis_indonesian',
      administrativeComplexity: 'sedang'
    },
    'Bali': {
      type: 'provinsi',
      culture: 'hindu_bali',
      language: 'balinese_indonesian',
      administrativeComplexity: 'sedang'
    }
  };

  /**
   * Analyzes Indonesian administrative context for culturally appropriate reasoning
   */
  async analyzeIndonesianAdministrativeContext(
    context: AdministrativeContext
  ): Promise<string[]> {
    const validatedContext = AdministrativeContextSchema.parse(context);
    const factors: string[] = [];

    // Analyze administrative system characteristics
    const systemInfo = this.systemCharacteristics[validatedContext.administrativeSystem];
    factors.push(`Administrative System: ${systemInfo.name}`);
    factors.push(`Data Classification: ${systemInfo.dataClassification}`);
    factors.push(`Expected Processing: ${systemInfo.processingTime}`);
    
    // Add system-specific services
    factors.push(`Available Services: ${systemInfo.services.join(', ')}`);

    // Analyze administrative hierarchy
    const hierarchyInfo = this.administrativeHierarchy[validatedContext.administrativeLevel];
    factors.push(`Administrative Level: ${validatedContext.administrativeLevel} (Level ${hierarchyInfo.level})`);
    factors.push(`Authority Scope: ${hierarchyInfo.authority}`);
    factors.push(`Required Protocols: ${hierarchyInfo.protocols.join(', ')}`);

    // Analyze user role implications
    const roleFactors = this.analyzeUserRole(validatedContext.userRole, validatedContext.administrativeLevel);
    factors.push(...roleFactors);

    // Analyze regional context
    const regionalFactors = this.analyzeRegionalContext(validatedContext.region);
    factors.push(...regionalFactors);

    // Analyze priority implications
    const priorityFactors = this.analyzePriorityContext(
      validatedContext.priority, 
      validatedContext.administrativeSystem
    );
    factors.push(...priorityFactors);

    // Add cultural considerations
    const culturalFactors = this.analyzeCulturalConsiderations(
      systemInfo.culturalConsiderations,
      validatedContext.region
    );
    factors.push(...culturalFactors);

    return factors;
  }

  /**
   * Analyzes user role implications for administrative processes
   */
  private analyzeUserRole(
    userRole: AdministrativeContext['userRole'],
    administrativeLevel: AdministrativeContext['administrativeLevel']
  ): string[] {
    const factors: string[] = [];

    switch (userRole) {
      case 'warga_negara':
        factors.push('User Role: Citizen (Warga Negara)');
        factors.push('Access Level: Public services');
        factors.push('Required Approach: User-friendly, educational');
        factors.push('Language Preference: Formal Indonesian with explanations');
        break;

      case 'petugas_administrasi':
        factors.push('User Role: Administrative Officer (Petugas Administrasi)');
        factors.push('Access Level: Internal systems');
        factors.push('Required Approach: Efficient, procedural');
        factors.push('Language Preference: Technical Indonesian');
        break;

      case 'kepala_dinas':
        factors.push('User Role: Department Head (Kepala Dinas)');
        factors.push('Access Level: Management systems');
        factors.push('Required Approach: Strategic, summary-focused');
        factors.push('Language Preference: Formal Indonesian with executive summary');
        break;

      case 'auditor':
        factors.push('User Role: Auditor');
        factors.push('Access Level: Audit and compliance systems');
        factors.push('Required Approach: Detailed, compliance-focused');
        factors.push('Language Preference: Technical Indonesian with legal references');
        break;
    }

    // Add hierarchy-specific considerations
    const hierarchyInfo = this.administrativeHierarchy[administrativeLevel];
    if (hierarchyInfo.level <= 2 && userRole !== 'warga_negara') {
      factors.push('Protocol Requirement: High-level government protocols apply');
    }

    return factors;
  }

  /**
   * Analyzes regional context for cultural appropriateness
   */
  private analyzeRegionalContext(region: string): string[] {
    const factors: string[] = [];
    const regionalInfo = this.regionalCharacteristics[region];

    if (regionalInfo) {
      factors.push(`Regional Context: ${region}`);
      factors.push(`Regional Type: ${regionalInfo.type}`);
      factors.push(`Cultural Context: ${regionalInfo.culture}`);
      factors.push(`Language Context: ${regionalInfo.language}`);
      factors.push(`Administrative Complexity: ${regionalInfo.administrativeComplexity}`);
    } else {
      factors.push(`Regional Context: ${region} (Standard Indonesian protocols)`);
      factors.push('Cultural Context: Standard Indonesian administrative culture');
      factors.push('Language Context: Formal Indonesian (Bahasa Baku)');
    }

    return factors;
  }

  /**
   * Analyzes priority context for appropriate handling
   */
  private analyzePriorityContext(
    priority: AdministrativeContext['priority'],
    administrativeSystem: AdministrativeContext['administrativeSystem']
  ): string[] {
    const factors: string[] = [];

    switch (priority) {
      case 'kritis':
        factors.push('Priority Level: Critical (Kritis)');
        factors.push('Response Time: Immediate (< 1 hour)');
        factors.push('Escalation: Automatic to senior officials');
        factors.push('Documentation: Comprehensive audit trail required');
        break;

      case 'tinggi':
        factors.push('Priority Level: High (Tinggi)');
        factors.push('Response Time: Urgent (< 4 hours)');
        factors.push('Escalation: Supervisor notification');
        factors.push('Documentation: Detailed logging required');
        break;

      case 'sedang':
        factors.push('Priority Level: Medium (Sedang)');
        factors.push('Response Time: Standard (1-2 business days)');
        factors.push('Escalation: Standard workflow');
        factors.push('Documentation: Standard logging');
        break;

      case 'rendah':
        factors.push('Priority Level: Low (Rendah)');
        factors.push('Response Time: Extended (3-5 business days)');
        factors.push('Escalation: Batch processing acceptable');
        factors.push('Documentation: Basic logging');
        break;
    }

    // Add system-specific priority considerations
    const systemInfo = this.systemCharacteristics[administrativeSystem];
    if (systemInfo.processingTime === 'priority' && priority !== 'kritis') {
      factors.push('System Note: This system typically handles priority requests');
    }

    return factors;
  }

  /**
   * Analyzes cultural considerations for appropriate service delivery
   */
  private analyzeCulturalConsiderations(
    systemConsiderations: string[],
    region: string
  ): string[] {
    const factors: string[] = [];

    factors.push('Cultural Considerations:');
    systemConsiderations.forEach(consideration => {
      switch (consideration) {
        case 'privasi_keluarga':
          factors.push('- Family privacy and confidentiality paramount');
          break;
        case 'adat_istiadat':
          factors.push('- Respect for traditional customs and practices');
          break;
        case 'agama':
          factors.push('- Religious considerations in service delivery');
          break;
        case 'hierarki_pemerintahan':
          factors.push('- Government hierarchy and protocol respect');
          break;
        case 'adat_daerah':
          factors.push('- Regional traditional law and customs');
          break;
        case 'protokol_resmi':
          factors.push('- Official government protocols and ceremonies');
          break;
        case 'hak_adat':
          factors.push('- Traditional land and community rights');
          break;
        case 'tanah_ulayat':
          factors.push('- Communal land ownership traditions');
          break;
        case 'warisan_keluarga':
          factors.push('- Family inheritance and legacy considerations');
          break;
        case 'keamanan_masyarakat':
          factors.push('- Community safety and security priorities');
          break;
        case 'hukum_adat':
          factors.push('- Traditional law integration with national law');
          break;
        case 'ketertiban':
          factors.push('- Public order and social harmony');
          break;
        case 'hak_asasi':
          factors.push('- Human rights protection and advocacy');
          break;
        case 'keadilan':
          factors.push('- Justice and fairness in service delivery');
          break;
        case 'supremasi_hukum':
          factors.push('- Rule of law and legal supremacy');
          break;
      }
    });

    // Add regional cultural factors
    const regionalInfo = this.regionalCharacteristics[region];
    if (regionalInfo && regionalInfo.culture !== 'kosmopolitan') {
      factors.push(`- Regional cultural sensitivity: ${regionalInfo.culture}`);
      factors.push(`- Language accommodation: ${regionalInfo.language}`);
    }

    return factors;
  }

  /**
   * Gets recommended communication style based on context
   */
  async getRecommendedCommunicationStyle(context: AdministrativeContext): Promise<{
    formality: 'sangat_formal' | 'formal' | 'semi_formal' | 'informal';
    language: 'bahasa_baku' | 'bahasa_sehari_hari' | 'bahasa_daerah';
    tone: 'resmi' | 'ramah' | 'edukatif' | 'teknis';
    protocols: string[];
  }> {
    const validatedContext = AdministrativeContextSchema.parse(context);
    const hierarchyInfo = this.administrativeHierarchy[validatedContext.administrativeLevel];
    
    // Determine formality based on administrative level and user role
    let formality: 'sangat_formal' | 'formal' | 'semi_formal' | 'informal' = 'formal';
    if (hierarchyInfo.level <= 2 || validatedContext.userRole === 'kepala_dinas') {
      formality = 'sangat_formal';
    } else if (validatedContext.userRole === 'warga_negara') {
      formality = 'semi_formal';
    }

    // Determine language based on context
    const language: 'bahasa_baku' | 'bahasa_sehari_hari' | 'bahasa_daerah' = 
      formality === 'sangat_formal' ? 'bahasa_baku' : 'bahasa_sehari_hari';

    // Determine tone based on user role
    let tone: 'resmi' | 'ramah' | 'edukatif' | 'teknis' = 'resmi';
    switch (validatedContext.userRole) {
      case 'warga_negara':
        tone = 'edukatif';
        break;
      case 'petugas_administrasi':
        tone = 'teknis';
        break;
      case 'kepala_dinas':
        tone = 'resmi';
        break;
      case 'auditor':
        tone = 'teknis';
        break;
    }

    return {
      formality,
      language,
      tone,
      protocols: hierarchyInfo.protocols
    };
  }
}
