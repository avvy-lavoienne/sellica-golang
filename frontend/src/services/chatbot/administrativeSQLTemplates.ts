/**
 * Administrative SQL Template Engine for SELLY
 * Specialized SQL templates for Indonesian administrative queries
 * Implements comprehensive templates from the RAG optimization plan
 */

export interface AdministrativeSQLTemplate {
  id: string;
  name: string;
  description: string;
  pattern: RegExp;
  queryType: 'COUNT' | 'SELECT' | 'AGGREGATE' | 'ANALYTICS';
  template: string;
  responseTemplate: string;
  requiredEntities: string[];
  optionalEntities: string[];
  securityLevel: 'safe' | 'restricted' | 'admin';
  estimatedComplexity: 'basic' | 'medium' | 'high';
  administrativeContext: string;
  indonesianKeywords: string[];
}

export interface TemplateMatch {
  template: AdministrativeSQLTemplate;
  confidence: number;
  extractedEntities: Record<string, any>;
}

export class AdministrativeSQLTemplateEngine {
  private templates: Map<string, AdministrativeSQLTemplate>;

  constructor() {
    this.templates = new Map();
    this.initializeAdministrativeTemplates();
  }

  /**
   * Initialize comprehensive administrative SQL templates
   */
  private initializeAdministrativeTemplates(): void {
    // User Management Templates
    this.addTemplate({
      id: 'USER_APPROVAL_DASHBOARD',
      name: 'User Approval Dashboard',
      description: 'Comprehensive user approval workflow status',
      pattern: /dashboard.*pengguna|status.*persetujuan.*pengguna|berapa.*pengguna.*(pending|menunggu)/i,
      queryType: 'AGGREGATE',
      template: `
        SELECT
          COUNT(pu.id) as total_pending,
          COUNT(CASE WHEN pu.status = 'pending' THEN 1 END) as menunggu_review,
          COUNT(CASE WHEN pu.status = 'approved' THEN 1 END) as disetujui,
          COUNT(CASE WHEN pu.status = 'rejected' THEN 1 END) as ditolak,
          AVG(EXTRACT(days FROM (COALESCE(pu.approved_at, NOW()) - pu.requested_at))) as rata_rata_hari_proses,
          (SELECT COUNT(*) FROM profiles WHERE role = 'user') as pengguna_aktif
        FROM pending_users pu
        {{#if timeframe}}
        WHERE pu.requested_at >= '{{timeframe.startDate}}'
          AND pu.requested_at <= '{{timeframe.endDate}}'
        {{/if}}
      `,
      responseTemplate: `
        📊 **Dashboard Persetujuan Pengguna**

        **Status Persetujuan:**
        • Total pending: {{total_pending}} pengguna
        • Menunggu review: {{menunggu_review}} pengguna  
        • Sudah disetujui: {{disetujui}} pengguna
        • Ditolak: {{ditolak}} pengguna

        **Analisis Waktu:**
        • Rata-rata proses: {{rata_rata_hari_proses}} hari
        • Pengguna aktif: {{pengguna_aktif}} orang
      `,
      requiredEntities: ['pending_users'],
      optionalEntities: ['profiles'],
      securityLevel: 'safe',
      estimatedComplexity: 'medium',
      administrativeContext: 'user_management',
      indonesianKeywords: ['pengguna', 'persetujuan', 'pending', 'dashboard']
    });

    // Record Management Templates
    this.addTemplate({
      id: 'SALAH_REKAM_STATUS',
      name: 'Salah Rekam Status Analysis',
      description: 'Analysis of incorrect record entries and correction status',
      pattern: /berapa.*(pengajuan.*)?salah.*rekam|ada.*berapa.*salah.*rekam|jumlah.*salah.*rekam|status.*salah.*rekam/i,
      queryType: 'AGGREGATE',
      template: `
        SELECT
          COUNT(sr.id) as total_salah_rekam,
          COUNT(CASE WHEN sr.created_at >= DATE_TRUNC('month', NOW()) THEN 1 END) as bulan_ini,
          COUNT(CASE WHEN sr.status_koreksi = 'dalam_proses' THEN 1 END) as dalam_proses,
          COUNT(CASE WHEN sr.status_koreksi = 'selesai' THEN 1 END) as selesai,
          COUNT(CASE WHEN sr.status_koreksi = 'pending' THEN 1 END) as pending,
          AVG(EXTRACT(days FROM (COALESCE(sr.tanggal_koreksi, NOW()) - sr.created_at))) as rata_rata_hari_koreksi,
          STRING_AGG(DISTINCT sr.jenis_kesalahan, ', ') as jenis_kesalahan_umum
        FROM salah_rekam sr
        {{#if timeframe}}
        WHERE sr.created_at >= '{{timeframe.startDate}}'
          AND sr.created_at <= '{{timeframe.endDate}}'
        {{/if}}
      `,
      responseTemplate: `
        📊 **Status Pengajuan Salah Rekam**

        **Data Terkini:**
        • Total salah rekam: {{total_salah_rekam}} record
        • Bulan ini: {{bulan_ini}} record baru
        • Status koreksi: {{dalam_proses}} dalam proses, {{selesai}} selesai

        **Analisis:**
        • Pending koreksi: {{pending}} record
        • Rata-rata waktu koreksi: {{rata_rata_hari_koreksi}} hari

        {{#if jenis_kesalahan_umum}}
        **Jenis Kesalahan Umum:** {{jenis_kesalahan_umum}}
        {{/if}}

        **Rekomendasi:**
        • Review proses input data untuk mengurangi error rate
        {{#if pending > 5}}
        • Prioritaskan koreksi yang sudah >5 hari
        {{/if}}
      `,
      requiredEntities: ['salah_rekam'],
      optionalEntities: [],
      securityLevel: 'safe',
      estimatedComplexity: 'medium',
      administrativeContext: 'record_management',
      indonesianKeywords: ['salah', 'rekam', 'pengajuan', 'koreksi', 'kesalahan']
    });

    this.addTemplate({
      id: 'APPLICATION_VALIDATION_WORKFLOW',
      name: 'Application Validation Workflow Analysis',
      description: 'Complete application processing and validation status',
      pattern: /workflow.*pengajuan|proses.*validasi.*pengajuan|berapa.*pengajuan.*(adjudicate|validasi)/i,
      queryType: 'AGGREGATE',
      template: `
        SELECT
          COUNT(pb.id) as total_pengajuan,
          COUNT(CASE WHEN pb.tanggal_pengajuan >= DATE_TRUNC('month', NOW()) THEN 1 END) as pengajuan_bulan_ini,
          COUNT(ar.id) as perlu_adjudicate,
          COUNT(CASE WHEN ar.is_ready_to_record = true THEN 1 END) as siap_rekam,
          COUNT(sr.id) as ada_kesalahan,
          COUNT(do.id) as duplicate_terdeteksi,
          AVG(EXTRACT(days FROM (ar.created_at - pb.tanggal_pengajuan))) as rata_rata_hari_validasi,
          STRING_AGG(DISTINCT ar.jenis_eksepsi, ', ') as jenis_eksepsi_ditemukan
        FROM pengajuan_bulanan pb
        LEFT JOIN adjudicate_record ar ON pb.nik_pengaju = ar.nik_pengaju
        LEFT JOIN salah_rekam sr ON pb.nik_pengaju = sr.nik_pengaju  
        LEFT JOIN duplicate_operator do ON pb.nik_pengaju = do.nik_pengaju
        {{#if timeframe}}
        WHERE pb.tanggal_pengajuan >= '{{timeframe.startDate}}'
          AND pb.tanggal_pengajuan <= '{{timeframe.endDate}}'
        {{/if}}
      `,
      responseTemplate: `
        🔄 **Analisis Workflow Validasi Pengajuan**

        **Volume Pengajuan:**
        • Total pengajuan: {{total_pengajuan}}
        • Pengajuan bulan ini: {{pengajuan_bulan_ini}}

        **Status Validasi:**
        • Perlu adjudicate: {{perlu_adjudicate}}
        • Siap untuk perekaman: {{siap_rekam}}
        • Ada kesalahan: {{ada_kesalahan}}
        • Duplicate terdeteksi: {{duplicate_terdeteksi}}

        **Analisis Waktu:**
        • Rata-rata validasi: {{rata_rata_hari_validasi}} hari

        {{#if jenis_eksepsi_ditemukan}}
        **Jenis Eksepsi:** {{jenis_eksepsi_ditemukan}}
        {{/if}}
      `,
      requiredEntities: ['pengajuan_bulanan'],
      optionalEntities: ['adjudicate_record', 'salah_rekam', 'duplicate_operator'],
      securityLevel: 'safe',
      estimatedComplexity: 'high',
      administrativeContext: 'application_processing',
      indonesianKeywords: ['pengajuan', 'validasi', 'workflow', 'adjudicate']
    });

    this.addTemplate({
      id: 'SYSTEM_HEALTH_MONITORING',
      name: 'System Health and Activity Monitoring',
      description: 'Comprehensive system health across all administrative functions',
      pattern: /kesehatan.*sistem|monitoring.*sistem|status.*sistem|aktivitas.*sistem/i,
      queryType: 'AGGREGATE',
      template: `
        SELECT
          (SELECT COUNT(*) FROM profiles WHERE role = 'user') as pengguna_aktif,
          (SELECT COUNT(*) FROM pending_users WHERE status = 'pending') as pending_approval,
          (SELECT COUNT(*) FROM pengajuan_bulanan WHERE tanggal_pengajuan >= NOW() - INTERVAL '7 days') as pengajuan_7_hari,
          (SELECT COUNT(*) FROM adjudicate_record WHERE is_ready_to_record = false) as pending_adjudicate,
          (SELECT COUNT(*) FROM salah_rekam WHERE created_at >= NOW() - INTERVAL '7 days') as error_7_hari,
          (SELECT COUNT(*) FROM aktivitas_siak WHERE created_at >= NOW() - INTERVAL '24 hours') as aktivitas_siak_24_jam,
          (SELECT COUNT(*) FROM dokumentasi) as total_dokumen,
          (SELECT COUNT(*) FROM duplicate_operator WHERE created_at >= NOW() - INTERVAL '7 days') as duplicate_7_hari,
          (SELECT COUNT(*) FROM pengaduan_bulanan WHERE tindak_lanjut_pengaduan IS NULL OR tindak_lanjut_pengaduan = '') as pengaduan_belum_ditindaklanjuti
      `,
      responseTemplate: `
        🏥 **Status Kesehatan Sistem SELLICA**

        **Kesehatan Pengguna:**
        • Pengguna aktif: {{pengguna_aktif}} orang
        • Menunggu approval: {{pending_approval}} orang

        **Kesehatan Pemrosesan:**
        • Pengajuan 7 hari: {{pengajuan_7_hari}} pengajuan
        • Pending adjudicate: {{pending_adjudicate}} record
        • Error 7 hari: {{error_7_hari}} kesalahan

        **Kesehatan Operasi:**
        • Aktivitas SIAK 24 jam: {{aktivitas_siak_24_jam}} aktivitas
        • Total dokumen: {{total_dokumen}} dokumen
        • Duplicate 7 hari: {{duplicate_7_hari}} duplicate

        **Kesehatan Pengaduan:**
        • Belum ditindaklanjuti: {{pengaduan_belum_ditindaklanjuti}} pengaduan

        {{#if pending_adjudicate > 10}}
        ⚠️ **Peringatan:** Banyak record pending adjudicate ({{pending_adjudicate}})
        {{/if}}

        {{#if pengaduan_belum_ditindaklanjuti > 0}}
        🚨 **Perhatian:** Ada {{pengaduan_belum_ditindaklanjuti}} pengaduan yang belum ditindaklanjuti
        {{/if}}
      `,
      requiredEntities: ['profiles', 'pengajuan_bulanan', 'aktivitas_siak'],
      optionalEntities: ['pending_users', 'adjudicate_record', 'salah_rekam', 'dokumentasi', 'duplicate_operator', 'pengaduan_bulanan'],
      securityLevel: 'safe',
      estimatedComplexity: 'high',
      administrativeContext: 'system_monitoring',
      indonesianKeywords: ['kesehatan', 'sistem', 'monitoring', 'status']
    });

    this.addTemplate({
      id: 'COMPLAINT_FOLLOWUP_STATUS',
      name: 'Complaint Follow-up Status Analysis',
      description: 'Analysis of complaint handling and follow-up status',
      pattern: /pengaduan.*(tindak.*lanjut|follow.*up|status)|status.*pengaduan/i,
      queryType: 'AGGREGATE',
      template: `
        SELECT 
          COUNT(*) as total_pengaduan,
          COUNT(CASE WHEN tindak_lanjut_pengaduan IS NOT NULL AND tindak_lanjut_pengaduan != '' THEN 1 END) as sudah_ditindaklanjuti,
          COUNT(CASE WHEN tindak_lanjut_pengaduan IS NULL OR tindak_lanjut_pengaduan = '' THEN 1 END) as belum_ditindaklanjuti,
          STRING_AGG(DISTINCT alasan_pengaduan, '; ') as alasan_umum,
          AVG(EXTRACT(days FROM (NOW() - tanggal_pengaduan))) as rata_rata_hari_pengaduan
        FROM pengaduan_bulanan
        {{#if timeframe}}
        WHERE tanggal_pengaduan >= '{{timeframe.startDate}}'
          AND tanggal_pengaduan <= '{{timeframe.endDate}}'
        {{/if}}
      `,
      responseTemplate: `
        📋 **Status Tindak Lanjut Pengaduan**

        **Ringkasan Pengaduan:**
        • Total pengaduan: {{total_pengaduan}}
        • Sudah ditindaklanjuti: {{sudah_ditindaklanjuti}}
        • Belum ditindaklanjuti: {{belum_ditindaklanjuti}}
        • Rata-rata umur pengaduan: {{rata_rata_hari_pengaduan}} hari

        {{#if alasan_umum}}
        **Alasan Pengaduan Umum:**
        {{alasan_umum}}
        {{/if}}

        {{#if belum_ditindaklanjuti > 0}}
        ⚠️ **Perhatian:** {{belum_ditindaklanjuti}} pengaduan masih memerlukan tindak lanjut
        {{/if}}
      `,
      requiredEntities: ['pengaduan_bulanan'],
      optionalEntities: [],
      securityLevel: 'safe',
      estimatedComplexity: 'medium',
      administrativeContext: 'complaint_management',
      indonesianKeywords: ['pengaduan', 'tindak lanjut', 'follow up', 'keluhan']
    });
  }

  /**
   * Add template to the engine
   */
  private addTemplate(template: AdministrativeSQLTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Find matching templates for a query
   */
  public findMatchingTemplates(query: string): TemplateMatch[] {
    const matches: TemplateMatch[] = [];
    const queryLower = query.toLowerCase();

    console.log(`🔍 [SQL_TEMPLATES] Searching templates for query: "${query}"`);
    // console.log(
    console.log(`🔍 [SQL_TEMPLATES] Total templates loaded: ${this.templates.size}`);

    for (const template of this.templates.values()) {
      const patternMatch = template.pattern.test(query);
      console.log(`🧪 [SQL_TEMPLATES] Testing ${template.id}: pattern=${template.pattern.toString()}, match=${patternMatch}`);

      if (patternMatch) {
        // Calculate confidence based on keyword matches
        const keywordMatches = template.indonesianKeywords.filter(keyword =>
          queryLower.includes(keyword.toLowerCase())
        ).length;

        // console.log(
        const confidence = Math.min(
          0.7 + (keywordMatches / template.indonesianKeywords.length) * 0.3,
          1.0
        );

        matches.push({
          template,
          confidence,
          extractedEntities: this.extractEntities(query, template)
        });
      }
    }

    // Sort by confidence
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get template by ID
   */
  public getTemplate(id: string): AdministrativeSQLTemplate | null {
    return this.templates.get(id) || null;
  }

  /**
   * Get all templates
   */
  public getAllTemplates(): AdministrativeSQLTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Extract entities from query for template
   */
  private extractEntities(query: string, template: AdministrativeSQLTemplate): Record<string, any> {
    const entities: Record<string, any> = {};
    const queryLower = query.toLowerCase();

    // Extract timeframe if mentioned
    if (queryLower.includes('hari ini')) {
      entities.timeframe = {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        description: 'hari ini'
      };
    } else if (queryLower.includes('minggu ini')) {
      const today = new Date();
      const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
      entities.timeframe = {
        startDate: weekStart.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        description: 'minggu ini'
      };
    } else if (queryLower.includes('bulan ini')) {
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      entities.timeframe = {
        startDate: monthStart.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        description: 'bulan ini'
      };
    }

    return entities;
  }
}

// Export singleton instance
export const administrativeSQLTemplates = new AdministrativeSQLTemplateEngine();
