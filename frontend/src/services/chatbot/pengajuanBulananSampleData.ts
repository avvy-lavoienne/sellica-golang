/**
 * Sample Data Generator for Pengajuan Bulanan Intelligence Testing
 * 
 * Generates realistic sample data for testing SELLY's enhanced intelligence
 * Based on actual database structure with 2530+ records
 */

export interface PengajuanBulananSample {
  id: string;
  user_id: string;
  nik_pengajuan_hapus: string;
  nama_pengajuan: string;
  alasan_pengajuan: string;
  alasan_lainnya?: string;
  nik_pengaju: string;
  nama_pengaju: string;
  tanggal_pengajuan: string;
  estimasi_tanggal_perekaman: string;
  is_ready_to_record: boolean;
  created_at: string;
}

export class PengajuanBulananSampleData {
  
  /**
   * Common alasan pengajuan categories based on real data
   */
  private static readonly ALASAN_CATEGORIES = [
    { alasan: 'LAINNYA', weight: 0.45, requiresDetail: true },
    { alasan: 'DUPLIKASI', weight: 0.25, requiresDetail: false },
    { alasan: 'KESALAHAN_DATA', weight: 0.15, requiresDetail: false },
    { alasan: 'MENINGGAL', weight: 0.10, requiresDetail: false },
    { alasan: 'PINDAH_DOMISILI', weight: 0.05, requiresDetail: false }
  ];

  /**
   * Common staff members based on real data
   */
  private static readonly STAFF_DATA = [
    { nik: '3273052309950003', nama: 'FIRMAN FIRDAUS', efficiency: 0.85 },
    { nik: '3205011908780002', nama: 'ARIS GRISTIANTO', efficiency: 0.78 },
    { nik: '3205330311100001', nama: 'KARIN', efficiency: 0.82 },
    { nik: '3273052309950084', nama: 'FIRMAN', efficiency: 0.75 },
    { nik: '3205021305890000', nama: 'SIGIT PRATAMA', efficiency: 0.80 }
  ];

  /**
   * Generate realistic sample data for testing
   */
  public static generateSampleData(count: number = 100): PengajuanBulananSample[] {
    const samples: PengajuanBulananSample[] = [];
    const baseDate = new Date('2024-01-01');
    const endDate = new Date('2025-01-28');
    
    for (let i = 0; i < count; i++) {
      const sample = this.generateSingleSample(i, baseDate, endDate);
      samples.push(sample);
    }
    
    return samples;
  }

  /**
   * Generate a single realistic sample
   */
  private static generateSingleSample(
    index: number, 
    startDate: Date, 
    endDate: Date
  ): PengajuanBulananSample {
    
    // Random date between start and end
    const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
    const tanggalPengajuan = new Date(randomTime);
    
    // Estimation date (7-30 days after submission)
    const estimasiDays = 7 + Math.random() * 23;
    const estimasiTanggal = new Date(tanggalPengajuan.getTime() + estimasiDays * 24 * 60 * 60 * 1000);
    
    // Select random alasan based on weights
    const alasan = this.selectWeightedAlasan();
    
    // Select random staff
    const staff = this.STAFF_DATA[Math.floor(Math.random() * this.STAFF_DATA.length)];
    
    // Determine if ready based on staff efficiency and time elapsed
    const daysSinceSubmission = (Date.now() - tanggalPengajuan.getTime()) / (1000 * 60 * 60 * 24);
    const readyProbability = staff.efficiency * Math.min(daysSinceSubmission / 14, 1);
    const isReady = Math.random() < readyProbability;
    
    return {
      id: `sample-${index.toString().padStart(4, '0')}`,
      user_id: 'c395d8af-410d-4821-91f4-1fd8ec39b0e4',
      nik_pengajuan_hapus: this.generateRandomNIK(),
      nama_pengajuan: Math.random() < 0.3 ? this.generateRandomName() : '-',
      alasan_pengajuan: alasan.alasan,
      alasan_lainnya: alasan.requiresDetail && Math.random() < 0.7 ?
        this.generateAlasanLainnya() : undefined,
      nik_pengaju: staff.nik,
      nama_pengaju: staff.nama,
      tanggal_pengajuan: tanggalPengajuan.toISOString().split('T')[0],
      estimasi_tanggal_perekaman: estimasiTanggal.toISOString().split('T')[0],
      is_ready_to_record: isReady,
      created_at: tanggalPengajuan.toISOString()
    };
  }

  /**
   * Select alasan based on weighted distribution
   */
  private static selectWeightedAlasan(): { alasan: string; requiresDetail: boolean } {
    const random = Math.random();
    let cumulative = 0;
    
    for (const category of this.ALASAN_CATEGORIES) {
      cumulative += category.weight;
      if (random <= cumulative) {
        return {
          alasan: category.alasan,
          requiresDetail: category.requiresDetail
        };
      }
    }
    
    return this.ALASAN_CATEGORIES[0];
  }

  /**
   * Generate random Indonesian NIK
   */
  private static generateRandomNIK(): string {
    // Format: PPKKSSDDMMYYXXXX
    // PP = Province (32 = West Java)
    // KK = Regency (05 = Garut)
    const province = '32';
    const regency = ['05', '06', '07', '08'][Math.floor(Math.random() * 4)];
    const district = Math.floor(Math.random() * 40).toString().padStart(2, '0');
    const day = Math.floor(Math.random() * 31 + 1).toString().padStart(2, '0');
    const month = Math.floor(Math.random() * 12 + 1).toString().padStart(2, '0');
    const year = Math.floor(Math.random() * 50 + 50).toString().padStart(2, '0'); // 1950-1999
    const sequence = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    
    return `${province}${regency}${district}${day}${month}${year}${sequence}`;
  }

  /**
   * Generate random Indonesian name
   */
  private static generateRandomName(): string {
    const firstNames = [
      'AHMAD', 'BUDI', 'SITI', 'DEWI', 'AGUS', 'RINA', 'DEDI', 'MAYA',
      'ANDI', 'LINA', 'RUDI', 'SARI', 'JOKO', 'WATI', 'HADI', 'YUNI'
    ];
    
    const lastNames = [
      'SANTOSO', 'WIJAYA', 'KUSUMA', 'PRATAMA', 'SARI', 'PUTRA', 'DEWI',
      'RAHMAN', 'HIDAYAT', 'PERMANA', 'SETIAWAN', 'MAHARANI', 'GUNAWAN'
    ];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName} ${lastName}`;
  }

  /**
   * Generate realistic alasan lainnya text
   */
  private static generateAlasanLainnya(): string {
    const reasons = [
      'Data tidak sesuai dengan dokumen asli',
      'Kesalahan input operator sebelumnya',
      'Perubahan status pernikahan',
      'Koreksi alamat domisili',
      'Update data pendidikan',
      'Perbaikan nama sesuai ijazah',
      'Koreksi tanggal lahir',
      'Update status pekerjaan',
      'Perbaikan data orang tua',
      'Koreksi nomor telepon'
    ];
    
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  /**
   * Generate analytics summary from sample data
   */
  public static generateAnalyticsSummary(samples: PengajuanBulananSample[]) {
    const total = samples.length;
    const ready = samples.filter(s => s.is_ready_to_record).length;
    const pending = total - ready;
    
    // Calculate overdue (estimation date passed)
    const today = new Date();
    const overdue = samples.filter(s => 
      new Date(s.estimasi_tanggal_perekaman) < today && !s.is_ready_to_record
    ).length;
    
    // Alasan breakdown
    const alasanBreakdown = samples.reduce((acc, sample) => {
      const alasan = sample.alasan_pengajuan;
      acc[alasan] = (acc[alasan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Staff breakdown
    const staffBreakdown = samples.reduce((acc, sample) => {
      const staff = sample.nama_pengaju;
      if (!acc[staff]) {
        acc[staff] = { total: 0, ready: 0, pending: 0 };
      }
      acc[staff].total++;
      if (sample.is_ready_to_record) {
        acc[staff].ready++;
      } else {
        acc[staff].pending++;
      }
      return acc;
    }, {} as Record<string, { total: number; ready: number; pending: number }>);
    
    // Monthly trend (last 6 months)
    const monthlyTrend = samples.reduce((acc, sample) => {
      const month = sample.tanggal_pengajuan.substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      summary: {
        total,
        ready,
        pending,
        overdue,
        readyPercentage: Math.round((ready / total) * 100),
        overduePercentage: Math.round((overdue / total) * 100)
      },
      alasanBreakdown: Object.entries(alasanBreakdown)
        .map(([alasan, count]) => ({
          alasan,
          count,
          percentage: Math.round((count / total) * 100)
        }))
        .sort((a, b) => b.count - a.count),
      staffBreakdown: Object.entries(staffBreakdown)
        .map(([nama, data]) => ({
          nama,
          ...data,
          efficiency: Math.round((data.ready / data.total) * 100)
        }))
        .sort((a, b) => b.total - a.total),
      monthlyTrend: Object.entries(monthlyTrend)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      insights: [
        `${ready} dari ${total} pengajuan siap diproses (${Math.round((ready/total)*100)}%)`,
        `${overdue} pengajuan melewati estimasi waktu`,
        `Alasan terbanyak: ${Object.entries(alasanBreakdown).sort((a,b) => b[1] - a[1])[0][0]}`,
        `Staff paling produktif: ${Object.entries(staffBreakdown).sort((a,b) => b[1].total - a[1].total)[0][0]}`
      ]
    };
  }

  /**
   * Generate test queries based on sample data
   */
  public static generateTestQueries(): string[] {
    return [
      'Ada berapa pengajuan bulanan?',
      'Berapa pengajuan yang siap direkam?',
      'Pengajuan yang overdue ada berapa?',
      'Breakdown pengajuan per alasan',
      'Siapa yang paling banyak mengajukan?',
      'Trend pengajuan 6 bulan terakhir',
      'Analisis performa SLA pengajuan',
      'Dashboard pengajuan bulanan lengkap',
      'Efisiensi petugas pengaju',
      'Laporan pengajuan untuk management'
    ];
  }

  /**
   * Validate sample data quality
   */
  public static validateSampleData(samples: PengajuanBulananSample[]): {
    isValid: boolean;
    issues: string[];
    quality: number;
  } {
    const issues: string[] = [];
    let qualityScore = 100;
    
    // Check data completeness
    const missingNIK = samples.filter(s => !s.nik_pengajuan_hapus).length;
    if (missingNIK > 0) {
      issues.push(`${missingNIK} records missing NIK pengajuan hapus`);
      qualityScore -= 10;
    }
    
    // Check date validity
    const invalidDates = samples.filter(s => 
      new Date(s.tanggal_pengajuan) > new Date(s.estimasi_tanggal_perekaman)
    ).length;
    if (invalidDates > 0) {
      issues.push(`${invalidDates} records have invalid date sequences`);
      qualityScore -= 15;
    }
    
    // Check alasan consistency
    const invalidAlasan = samples.filter(s => 
      s.alasan_pengajuan === 'LAINNYA' && !s.alasan_lainnya
    ).length;
    if (invalidAlasan > 0) {
      issues.push(`${invalidAlasan} LAINNYA records missing detail`);
      qualityScore -= 5;
    }
    
    // Check distribution balance
    const readyCount = samples.filter(s => s.is_ready_to_record).length;
    const readyPercentage = (readyCount / samples.length) * 100;
    if (readyPercentage < 60 || readyPercentage > 90) {
      issues.push(`Ready percentage (${readyPercentage.toFixed(1)}%) seems unrealistic`);
      qualityScore -= 5;
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      quality: Math.max(0, qualityScore)
    };
  }
}

export default PengajuanBulananSampleData;
