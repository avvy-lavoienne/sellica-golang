/**
 * Data Service - Simplified Version
 * Provides basic data management functionality for the core web app
 */

export interface QueryData {
  id: string;
  query: string;
  response: string;
  timestamp: Date;
  category?: string;
  accuracy?: number;
}

export interface TrainingData {
  id: string;
  input: string;
  output: string;
  category: string;
  metadata?: Record<string, any>;
}

export class DataService {
  private static instance: DataService;
  private queryHistory: QueryData[] = [];
  private trainingData: TrainingData[] = [];

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  async saveQuery(query: string, response: string, category?: string): Promise<QueryData> {
    const queryData: QueryData = {
      id: this.generateId(),
      query,
      response,
      timestamp: new Date(),
      category,
      accuracy: 1.0 // Default accuracy for basic implementation
    };

    this.queryHistory.push(queryData);

    // Store in localStorage for persistence
    try {
      localStorage.setItem('query_history', JSON.stringify(this.queryHistory));
    } catch (error) {
      console.warn('Failed to save query history:', error);
    }

    return queryData;
  }

  async getQueryHistory(limit?: number): Promise<QueryData[]> {
    // Load from localStorage if empty
    if (this.queryHistory.length === 0) {
      try {
        const stored = localStorage.getItem('query_history');
        if (stored) {
          this.queryHistory = JSON.parse(stored);
        }
      } catch (error) {
        console.warn('Failed to load query history:', error);
      }
    }

    const history = [...this.queryHistory].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return limit ? history.slice(0, limit) : history;
  }

  async addTrainingData(input: string, output: string, category: string, metadata?: Record<string, any>): Promise<TrainingData> {
    const trainingItem: TrainingData = {
      id: this.generateId(),
      input,
      output,
      category,
      metadata
    };

    this.trainingData.push(trainingItem);

    // Store in localStorage for persistence
    try {
      localStorage.setItem('training_data', JSON.stringify(this.trainingData));
    } catch (error) {
      console.warn('Failed to save training data:', error);
    }

    return trainingItem;
  }

  async getTrainingData(category?: string): Promise<TrainingData[]> {
    // Load from localStorage if empty
    if (this.trainingData.length === 0) {
      try {
        const stored = localStorage.getItem('training_data');
        if (stored) {
          this.trainingData = JSON.parse(stored);
        }
      } catch (error) {
        console.warn('Failed to load training data:', error);
      }
    }

    if (category) {
      return this.trainingData.filter(item => item.category === category);
    }

    return [...this.trainingData];
  }

  async searchQueries(searchTerm: string): Promise<QueryData[]> {
    const history = await this.getQueryHistory();
    const lowerSearchTerm = searchTerm.toLowerCase();

    return history.filter(item => 
      item.query.toLowerCase().includes(lowerSearchTerm) ||
      item.response.toLowerCase().includes(lowerSearchTerm) ||
      (item.category && item.category.toLowerCase().includes(lowerSearchTerm))
    );
  }

  async getStatistics(): Promise<{
    totalQueries: number;
    totalTrainingData: number;
    categories: string[];
    averageAccuracy: number;
  }> {
    const queries = await this.getQueryHistory();
    const training = await this.getTrainingData();
    
    const categories = [...new Set([
      ...queries.map(q => q.category).filter(Boolean),
      ...training.map(t => t.category)
    ])] as string[];

    const averageAccuracy = queries.length > 0 
      ? queries.reduce((sum, q) => sum + (q.accuracy || 0), 0) / queries.length
      : 0;

    return {
      totalQueries: queries.length,
      totalTrainingData: training.length,
      categories,
      averageAccuracy
    };
  }

  async clearData(): Promise<void> {
    this.queryHistory = [];
    this.trainingData = [];
    
    try {
      localStorage.removeItem('query_history');
      localStorage.removeItem('training_data');
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  private generateId(): string {
    return `data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const dataService = DataService.getInstance();
