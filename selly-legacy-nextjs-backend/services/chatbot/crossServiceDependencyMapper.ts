/**
 * Cross-Service Dependency Mapper for SELLY
 * Maps relationships between the 24+ Disdukcapil services for multi-document scenarios
 * Enables comprehensive guidance for complex administrative processes
 */

export interface ServiceDependency {
  serviceId: string;
  dependencyType: 'required' | 'recommended' | 'optional' | 'conditional';
  trigger: string; // What triggers this dependency
  priority: number; // 1-10, higher = more important
  description: string;
  conditions?: string[]; // When this dependency applies
}

export interface CrossServiceScenario {
  scenarioId: string;
  name: string;
  description: string;
  triggerPatterns: RegExp[];
  primaryServices: string[]; // Main services involved
  dependentServices: ServiceDependency[]; // Related services that may be needed
  commonCombinations: string[][]; // Frequently combined services
  processOrder: string[]; // Recommended order of completion
  estimatedDuration: string;
  complexity: 'simple' | 'moderate' | 'complex';
  userGuidance: string;
}

export interface MultiServiceResponse {
  scenario: CrossServiceScenario;
  involvedServices: string[];
  processSteps: MultiServiceStep[];
  totalEstimatedTime: string;
  priorityOrder: string[];
  warnings: string[];
  tips: string[];
}

export interface MultiServiceStep {
  stepNumber: number;
  serviceId: string;
  serviceName: string;
  description: string;
  estimatedTime: string;
  requirements: string[];
  notes?: string[];
  dependsOn?: string[]; // Previous steps that must be completed
}

export class CrossServiceDependencyMapper {
  private scenarios: Map<string, CrossServiceScenario> = new Map();
  private serviceDependencies: Map<string, ServiceDependency[]> = new Map();

  constructor() {
    this.initializeScenarios();
    this.initializeServiceDependencies();
  }

  /**
   * Initialize common cross-service scenarios
   */
  private initializeScenarios(): void {
    // Scenario 1: Address Change (Pindah Domisili)
    this.scenarios.set('address_change', {
      scenarioId: 'address_change',
      name: 'Perubahan Alamat/Domisili',
      description: 'Proses lengkap perubahan alamat yang mempengaruhi multiple dokumen',
      triggerPatterns: [
        /pindah.*domisili.*dokumen.*apa/i,
        /ganti.*alamat.*perlu.*update/i,
        /pindah.*rumah.*dokumen.*diperbarui/i,
        /ubah.*alamat.*ktp.*kk/i,
        /relokasi.*dokumen.*apa/i
      ],
      primaryServices: ['kepindahan'],
      dependentServices: [
        {
          serviceId: 'ktp_baru',
          dependencyType: 'required',
          trigger: 'address_change',
          priority: 9,
          description: 'KTP harus diperbarui dengan alamat baru',
          conditions: ['pindah_dalam_kabupaten', 'pindah_luar_kabupaten']
        },
        {
          serviceId: 'kk_perubahan',
          dependencyType: 'required',
          trigger: 'address_change',
          priority: 8,
          description: 'KK perlu diperbarui dengan alamat baru',
          conditions: ['kepala_keluarga', 'anggota_keluarga']
        },
        {
          serviceId: 'kia',
          dependencyType: 'conditional',
          trigger: 'has_children_under_17',
          priority: 7,
          description: 'KIA anak perlu diperbarui jika ada anak di bawah 17 tahun',
          conditions: ['ada_anak_dibawah_17']
        }
      ],
      commonCombinations: [
        ['kepindahan', 'ktp_baru', 'kk_perubahan'],
        ['kepindahan', 'ktp_baru', 'kk_perubahan', 'kia']
      ],
      processOrder: ['kepindahan', 'kk_perubahan', 'ktp_baru', 'kia'],
      estimatedDuration: '2-3 minggu',
      complexity: 'moderate',
      userGuidance: 'Mulai dengan mengurus surat kepindahan, lalu perbarui KK, kemudian KTP, dan terakhir KIA jika diperlukan'
    });

    // Scenario 2: Marriage Documentation
    this.scenarios.set('marriage_documentation', {
      scenarioId: 'marriage_documentation',
      name: 'Dokumentasi Pernikahan Lengkap',
      description: 'Proses lengkap dokumentasi setelah pernikahan',
      triggerPatterns: [
        /setelah.*nikah.*dokumen.*apa/i,
        /habis.*menikah.*perlu.*urus/i,
        /baru.*nikah.*dokumen.*diperbarui/i,
        /pernikahan.*dokumen.*lengkap/i
      ],
      primaryServices: ['akta_perkawinan'],
      dependentServices: [
        {
          serviceId: 'kk_baru_marriage',
          dependencyType: 'required',
          trigger: 'new_family_formation',
          priority: 9,
          description: 'KK baru untuk keluarga yang baru terbentuk',
          conditions: ['pisah_dari_orangtua', 'keluarga_baru']
        },
        {
          serviceId: 'ktp_baru',
          dependencyType: 'required',
          trigger: 'status_change',
          priority: 8,
          description: 'KTP perlu diperbarui dengan status pernikahan',
          conditions: ['status_berubah']
        },
        {
          serviceId: 'kepindahan',
          dependencyType: 'conditional',
          trigger: 'address_change_after_marriage',
          priority: 7,
          description: 'Kepindahan jika alamat berubah setelah menikah',
          conditions: ['pindah_setelah_nikah']
        }
      ],
      commonCombinations: [
        ['akta_perkawinan', 'kk_baru_marriage', 'ktp_baru'],
        ['akta_perkawinan', 'kk_baru_marriage', 'ktp_baru', 'kepindahan']
      ],
      processOrder: ['akta_perkawinan', 'kk_baru_marriage', 'kepindahan', 'ktp_baru'],
      estimatedDuration: '3-4 minggu',
      complexity: 'complex',
      userGuidance: 'Prioritaskan akta perkawinan terlebih dahulu, kemudian KK baru, lalu kepindahan jika diperlukan, dan terakhir KTP'
    });

    // Scenario 3: Child Birth Documentation
    this.scenarios.set('child_birth_documentation', {
      scenarioId: 'child_birth_documentation',
      name: 'Dokumentasi Kelahiran Anak',
      description: 'Proses lengkap dokumentasi kelahiran anak baru',
      triggerPatterns: [
        /bayi.*baru.*lahir.*dokumen/i,
        /anak.*lahir.*perlu.*urus/i,
        /kelahiran.*dokumen.*apa.*saja/i,
        /bayi.*dokumen.*lengkap/i
      ],
      primaryServices: ['akta_kelahiran'],
      dependentServices: [
        {
          serviceId: 'kk_penambahan',
          dependencyType: 'required',
          trigger: 'new_family_member',
          priority: 9,
          description: 'Menambahkan anak baru ke Kartu Keluarga',
          conditions: ['anak_baru_lahir']
        },
        {
          serviceId: 'kia',
          dependencyType: 'recommended',
          trigger: 'child_identity',
          priority: 8,
          description: 'Membuat KIA untuk identitas anak',
          conditions: ['anak_dibawah_17']
        }
      ],
      commonCombinations: [
        ['akta_kelahiran', 'kk_penambahan', 'kia']
      ],
      processOrder: ['akta_kelahiran', 'kk_penambahan', 'kia'],
      estimatedDuration: '2-3 minggu',
      complexity: 'moderate',
      userGuidance: 'Mulai dengan akta kelahiran, lalu tambahkan ke KK, kemudian buat KIA'
    });

    // Scenario 4: Document Loss Recovery
    this.scenarios.set('document_loss_recovery', {
      scenarioId: 'document_loss_recovery',
      name: 'Pemulihan Dokumen Hilang',
      description: 'Proses pemulihan ketika multiple dokumen hilang',
      triggerPatterns: [
        /dokumen.*hilang.*semua/i,
        /ktp.*kk.*hilang/i,
        /semua.*dokumen.*hilang/i,
        /kehilangan.*dokumen.*lengkap/i
      ],
      primaryServices: ['ktp_hilang', 'kk_penggantian'],
      dependentServices: [
        {
          serviceId: 'biodata_penduduk',
          dependencyType: 'recommended',
          trigger: 'identity_verification',
          priority: 7,
          description: 'Biodata penduduk untuk verifikasi identitas',
          conditions: ['verifikasi_identitas']
        },
        {
          serviceId: 'kia',
          dependencyType: 'conditional',
          trigger: 'child_documents_lost',
          priority: 6,
          description: 'KIA anak jika dokumen anak juga hilang',
          conditions: ['ada_anak_dibawah_17']
        }
      ],
      commonCombinations: [
        ['ktp_hilang', 'kk_penggantian'],
        ['ktp_hilang', 'kk_penggantian', 'biodata_penduduk', 'kia']
      ],
      processOrder: ['biodata_penduduk', 'kk_penggantian', 'ktp_hilang', 'kia'],
      estimatedDuration: '3-4 minggu',
      complexity: 'complex',
      userGuidance: 'Mulai dengan biodata penduduk untuk verifikasi, lalu KK, kemudian KTP, dan terakhir KIA jika diperlukan'
    });
  }

  /**
   * Initialize service-specific dependencies
   */
  private initializeServiceDependencies(): void {
    // KTP dependencies
    this.serviceDependencies.set('ktp_baru', [
      {
        serviceId: 'kk_baru',
        dependencyType: 'required',
        trigger: 'kk_required_for_ktp',
        priority: 10,
        description: 'KK diperlukan sebagai syarat pembuatan KTP'
      },
      {
        serviceId: 'akta_kelahiran',
        dependencyType: 'required',
        trigger: 'birth_certificate_required',
        priority: 9,
        description: 'Akta kelahiran diperlukan untuk KTP pertama kali'
      }
    ]);

    // KK dependencies
    this.serviceDependencies.set('kk_baru', [
      {
        serviceId: 'akta_perkawinan',
        dependencyType: 'conditional',
        trigger: 'married_status',
        priority: 8,
        description: 'Akta perkawinan diperlukan jika sudah menikah',
        conditions: ['status_menikah']
      }
    ]);

    // KIA dependencies
    this.serviceDependencies.set('kia', [
      {
        serviceId: 'akta_kelahiran',
        dependencyType: 'required',
        trigger: 'birth_certificate_for_kia',
        priority: 10,
        description: 'Akta kelahiran diperlukan untuk membuat KIA'
      },
      {
        serviceId: 'kk_penambahan',
        dependencyType: 'recommended',
        trigger: 'child_in_family_card',
        priority: 7,
        description: 'Anak sebaiknya sudah terdaftar di KK'
      }
    ]);
  }

  /**
   * Analyze query to identify cross-service scenarios
   */
  public analyzeQuery(query: string): CrossServiceScenario | null {
    const lowerQuery = query.toLowerCase();
    
    for (const [scenarioId, scenario] of this.scenarios) {
      if (scenario.triggerPatterns.some(pattern => pattern.test(lowerQuery))) {
        console.log(`🎯 [CROSS_SERVICE] Detected scenario: ${scenario.name}`);
        return scenario;
      }
    }
    
    return null;
  }

  /**
   * Get all scenarios for configuration management
   */
  public getAllScenarios(): CrossServiceScenario[] {
    return Array.from(this.scenarios.values());
  }

  /**
   * Get service dependencies for a specific service
   */
  public getServiceDependencies(serviceId: string): ServiceDependency[] {
    return this.serviceDependencies.get(serviceId) || [];
  }

  /**
   * Add new scenario (for future extensibility)
   */
  public addScenario(scenario: CrossServiceScenario): void {
    this.scenarios.set(scenario.scenarioId, scenario);
  }

  /**
   * Update existing scenario
   */
  public updateScenario(scenarioId: string, updates: Partial<CrossServiceScenario>): void {
    const existing = this.scenarios.get(scenarioId);
    if (existing) {
      this.scenarios.set(scenarioId, { ...existing, ...updates });
    }
  }
}
