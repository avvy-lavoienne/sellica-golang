/**
 * Server-side file utilities
 * This file should only be used in server-side code
 */

// Only import fs in server environment
let fs: any = null;
let path: any = null;

try {
  if (typeof window === 'undefined') {
    fs = require('fs');
    path = require('path');
  }
} catch (error) {
  // fs not available
}

export function loadKKTrainingData(): any {
  if (!fs || !path) {
    return null;
  }

  try {
    const kkDataPath = path.join(process.cwd(), 'src/data/material/kk');
    const trainingFiles = [
      'kk-advanced-pairs.json',
      'kk-biaya-pairs.json', 
      'kk-casual-pairs.json',
      'kk-converted-pairs.json',
      'kk-masalah-pairs.json',
      'kk-persyaratan-pairs.json',
      'kk-proses-pairs.json',
      'kk-skenario-pairs.json',
      'qna-pair.json',
      'qna-pair2.json'
    ];

    const trainingData: any = {};

    for (const filename of trainingFiles) {
      try {
        const filePath = path.join(kkDataPath, filename);
        if (!fs.existsSync(filePath)) continue;
        
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const trainingPairs = JSON.parse(fileContent);
        
        const categoryName = filename.replace('.json', '').replace('kk-', '').replace('-pairs', '');
        trainingData[categoryName] = trainingPairs;
      } catch (fileError) {
        console.warn(`⚠️ [SERVER_UTILS] Could not load ${filename}:`, fileError);
      }
    }

    return trainingData;
  } catch (error) {
    console.error('❌ [SERVER_UTILS] Error loading KK training data:', error);
    return null;
  }
}

export function loadQAIntegrationData(): any {
  if (!fs || !path) {
    return null;
  }

  try {
    const qaIntegrationPath = path.join(process.cwd(), 'data/training/qa-knowledge-integration.json');
    if (!fs.existsSync(qaIntegrationPath)) {
      return null;
    }

    return JSON.parse(fs.readFileSync(qaIntegrationPath, 'utf-8'));
  } catch (error) {
    console.error('❌ [SERVER_UTILS] Error loading Q&A data:', error);
    return null;
  }
}

export function loadPerpindahanTrainingData(): any {
  if (!fs || !path) {
    return null;
  }

  try {
    const perpindahanDataPath = path.join(process.cwd(), 'src/data/material/perpindahan');
    const trainingFiles = [
      'perpindahan-comprehensive-qa-pairs.json'
    ];

    const trainingData: any = {};

    for (const filename of trainingFiles) {
      try {
        const filePath = path.join(perpindahanDataPath, filename);
        if (!fs.existsSync(filePath)) continue;

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const trainingPairs = JSON.parse(fileContent);

        const categoryName = filename.replace('.json', '').replace('perpindahan-', '').replace('-pairs', '');
        trainingData[categoryName] = trainingPairs;
      } catch (fileError) {
        console.warn(`⚠️ [SERVER_UTILS] Could not load ${filename}:`, fileError);
      }
    }

    return trainingData;
  } catch (error) {
    console.error('❌ [SERVER_UTILS] Error loading Perpindahan training data:', error);
    return null;
  }
}

export function isServerEnvironment(): boolean {
  return typeof window === 'undefined' && process.env.NODE_ENV !== 'production';
}
