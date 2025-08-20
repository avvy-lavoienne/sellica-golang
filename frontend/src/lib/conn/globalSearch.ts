import { supabase } from './supabaseClient';

export type SearchResultType = 
  | 'dokumentasi'
  | 'pengaduan_bulanan'
  | 'aktivitas_siak'
  | 'adjudicate_record'
  | 'salah_rekam'
  | 'duplicate_operator'
  | 'pengajuan_bulanan';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description?: string | null;
  date?: string | null;
  imagePath?: string | null;
}

export async function searchEverything(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  
  const results: SearchResult[] = [];
  const searchPromises = [];
  
  // Search dokumentasi
  searchPromises.push(
    supabase
      .from('dokumentasi')
      .select('*')
      .or(`judul.ilike.%${query}%,deskripsi.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data, error }) => {
        if (error) throw error;
        if (data) {
          results.push(
            ...data.map(item => ({
              id: item.id,
              type: 'dokumentasi' as SearchResultType,
              title: item.judul || 'Dokumentasi',
              description: item.deskripsi,
              date: item.created_at,
              imagePath: item.foto
            }))
          );
        }
      })
      .then(
        () => {},
        error => console.error("Error searching dokumentasi:", error)
      )
  );
  
  // Search pengaduan_bulanan
  searchPromises.push(
    supabase
      .from('pengaduan_bulanan')
      .select('*')
      .or(`judul.ilike.%${query}%,deskripsi.ilike.%${query}%,perihal.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data, error }) => {
        if (error) throw error;
        if (data) {
          results.push(
            ...data.map(item => ({
              id: item.id,
              type: 'pengaduan_bulanan' as SearchResultType,
              title: item.judul || item.perihal || 'Pengaduan Bulanan',
              description: item.deskripsi,
              date: item.created_at
            }))
          );
        }
      })
      .then(
        () => {},
        error => {
          console.error("Error searching pengaduan_bulanan:", error);
          return Promise.resolve();
        }
      )
  );
  
  // Search aktivitas_siak
  searchPromises.push(
    supabase
      .from('aktivitas_siak')
      .select('*')
      .or(`deskripsi.ilike.%${query}%,keterangan.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data, error }) => {
        if (error) throw error;
        if (data) {
          results.push(
            ...data.map(item => ({
              id: item.id,
              type: 'aktivitas_siak' as SearchResultType,
              title: `Aktivitas SIAK: ${item.jenis_aktivitas || ''}`,
              description: item.deskripsi || item.keterangan,
              date: item.created_at
            }))
          );
        }
      }, error => console.error("Error searching aktivitas_siak:", error))
  );
  
  // Search adjudicate_record
  searchPromises.push(
    supabase
      .from('adjudicate_record')
      .select('*')
      .or(`nama.ilike.%${query}%,keterangan.ilike.%${query}%,nik.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data, error }) => {
        if (error) throw error;
        if (data) {
          results.push(
            ...data.map(item => ({
              id: item.id,
              type: 'adjudicate_record' as SearchResultType,
              title: item.nama || `NIK: ${item.nik || ''}`,
              description: item.keterangan,
              date: item.created_at
            }))
          );
        }
      }, error => console.error("Error searching adjudicate_record:", error))
  );
  
  // Search salah_rekam
  searchPromises.push(
    supabase
      .from('salah_rekam')
      .select('*')
      .or(`nama.ilike.%${query}%,keterangan.ilike.%${query}%,nik.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data, error }) => {
        if (error) throw error;
        if (data) {
          results.push(
            ...data.map(item => ({
              id: item.id,
              type: 'salah_rekam' as SearchResultType,
              title: item.nama || `NIK: ${item.nik || ''}`,
              description: item.keterangan,
              date: item.created_at
            }))
          );
        }
      })
      .then(
        () => {},
        error => console.error("Error searching salah_rekam:", error)
      )
  );
  
  // Search duplicate_operator
  searchPromises.push(
    supabase
      .from('duplicate_operator')
      .select('*')
      .or(`nama.ilike.%${query}%,keterangan.ilike.%${query}%,nik.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data, error }) => {
        if (error) throw error;
        if (data) {
          results.push(
            ...data.map(item => ({
              id: item.id,
              type: 'duplicate_operator' as SearchResultType,
              title: item.nama || `NIK: ${item.nik || ''}`,
              description: item.keterangan,
              date: item.created_at
            }))
          );
        }
      })
      .then(
        () => {},
        error => console.error("Error searching duplicate_operator:", error)
      )
  );
  
  // Search pengajuan_bulanan
  searchPromises.push(
    supabase
      .from('pengajuan_bulanan')
      .select('*')
      .or(`nama.ilike.%${query}%,keterangan.ilike.%${query}%,bulan_pengajuan.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data, error }) => {
        if (error) throw error;
        if (data) {
          results.push(
            ...data.map(item => ({
              id: item.id,
              type: 'pengajuan_bulanan' as SearchResultType,
              title: `Pengajuan: ${item.bulan_pengajuan || ''}`,
              description: item.keterangan,
              date: item.created_at
            }))
          );
        }
      })
      .then(
        () => {},
        error => console.error("Error searching pengajuan_bulanan:", error)
      )
  );
  
  try {
    // Wait for all search queries to complete
    await Promise.all(searchPromises);
  } catch (error) {
    console.error("Error in search promises:", error);
  }
  
  // Sort results by relevance and date
  return results.sort((a, b) => {
    // Prioritize exact matches
    const aExactMatch = a.title.toLowerCase().includes(query.toLowerCase());
    const bExactMatch = b.title.toLowerCase().includes(query.toLowerCase());
    
    if (aExactMatch && !bExactMatch) return -1;
    if (!aExactMatch && bExactMatch) return 1;
    
    // Then sort by date
    if (a.date && b.date) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    
    return 0;
  });
}