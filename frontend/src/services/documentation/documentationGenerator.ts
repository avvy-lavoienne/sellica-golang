/**
 * Documentation Generator Service - Week 3 Implementation
 * Comprehensive documentation generation for SELLY session management
 */

export interface DocumentationConfig {
  enabled: boolean;
  outputFormat: DocumentationFormat[];
  languages: DocumentationLanguage[];
  sections: DocumentationSection[];
  autoGenerate: boolean;
  updateInterval: number;
}

export type DocumentationFormat = 'markdown' | 'html' | 'pdf' | 'json' | 'yaml';
export type DocumentationLanguage = 'id' | 'en';

export interface DocumentationSection {
  name: string;
  type: 'api' | 'guide' | 'tutorial' | 'reference' | 'troubleshooting';
  enabled: boolean;
  priority: number;
  autoUpdate: boolean;
}

export interface APIDocumentation {
  endpoint: string;
  method: string;
  description: string;
  parameters: APIParameter[];
  responses: APIResponse[];
  examples: APIExample[];
  authentication: boolean;
  rateLimit?: RateLimit;
}

export interface APIParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: any;
  validation?: string;
}

export interface APIResponse {
  status: number;
  description: string;
  schema?: any;
  example?: any;
}

export interface APIExample {
  title: string;
  description: string;
  request: any;
  response: any;
  language: 'curl' | 'javascript' | 'python' | 'php';
}

export interface RateLimit {
  requests: number;
  window: number;
  unit: 'second' | 'minute' | 'hour';
}

export interface UserGuide {
  title: string;
  description: string;
  sections: GuideSection[];
  prerequisites: string[];
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface GuideSection {
  title: string;
  content: string;
  codeExamples?: CodeExample[];
  images?: string[];
  tips?: string[];
  warnings?: string[];
}

export interface CodeExample {
  title: string;
  description: string;
  code: string;
  language: string;
  runnable: boolean;
}

export interface TroubleshootingGuide {
  issue: string;
  symptoms: string[];
  causes: string[];
  solutions: Solution[];
  prevention: string[];
  relatedIssues: string[];
}

export interface Solution {
  title: string;
  description: string;
  steps: string[];
  codeExample?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
}

export class DocumentationGenerator {
  private config: DocumentationConfig;
  private apiDocs: APIDocumentation[] = [];
  private userGuides: UserGuide[] = [];
  private troubleshootingGuides: TroubleshootingGuide[] = [];
  private generationInterval?: NodeJS.Timeout;

  constructor(config?: Partial<DocumentationConfig>) {
    this.config = {
      enabled: true,
      outputFormat: ['markdown', 'html'],
      languages: ['id', 'en'],
      sections: [
        { name: 'api_reference', type: 'api', enabled: true, priority: 1, autoUpdate: true },
        { name: 'user_guide', type: 'guide', enabled: true, priority: 2, autoUpdate: true },
        { name: 'tutorials', type: 'tutorial', enabled: true, priority: 3, autoUpdate: false },
        { name: 'troubleshooting', type: 'troubleshooting', enabled: true, priority: 4, autoUpdate: true }
      ],
      autoGenerate: true,
      updateInterval: 24 * 60 * 60 * 1000, // 24 hours
      ...config
    };

    this.initializeDocumentation();
  }

  /**
   * Initialize documentation generation
   */
  private async initializeDocumentation(): Promise<void> {
    if (!this.config.enabled) {
      console.log('📚 Documentation generation disabled');
      return;
    }

    try {
      // Generate initial documentation
      await this.generateAllDocumentation();

      // Setup auto-generation if enabled
      if (this.config.autoGenerate) {
        this.setupAutoGeneration();
      }

      console.log('📚 Documentation generator initialized');
    } catch (error) {
      console.error('Failed to initialize documentation generator:', error);
    }
  }

  /**
   * Setup automatic documentation generation
   */
  private setupAutoGeneration(): void {
    this.generationInterval = setInterval(async () => {
      try {
        await this.generateAllDocumentation();
        console.log('📚 Documentation auto-updated');
      } catch (error) {
        console.error('Auto-documentation generation failed:', error);
      }
    }, this.config.updateInterval);

    console.log('🔄 Auto-documentation generation enabled');
  }

  /**
   * Generate all documentation
   */
  async generateAllDocumentation(): Promise<void> {
    const enabledSections = this.config.sections.filter(s => s.enabled);

    for (const section of enabledSections.sort((a, b) => a.priority - b.priority)) {
      try {
        switch (section.type) {
          case 'api':
            await this.generateAPIDocumentation();
            break;
          case 'guide':
            await this.generateUserGuides();
            break;
          case 'tutorial':
            await this.generateTutorials();
            break;
          case 'troubleshooting':
            await this.generateTroubleshootingGuides();
            break;
        }
      } catch (error) {
        console.error(`Failed to generate ${section.name} documentation:`, error);
      }
    }

    // Generate output files
    await this.generateOutputFiles();
  }

  /**
   * Generate API documentation
   */
  private async generateAPIDocumentation(): Promise<void> {
    this.apiDocs = [
      {
        endpoint: '/api/session',
        method: 'POST',
        description: 'Create a new session',
        parameters: [
          {
            name: 'userId',
            type: 'string',
            required: false,
            description: 'User ID for authenticated sessions',
            example: 'user_123'
          },
          {
            name: 'type',
            type: 'string',
            required: true,
            description: 'Session type',
            example: 'guest',
            validation: 'enum: guest, authenticated'
          }
        ],
        responses: [
          {
            status: 201,
            description: 'Session created successfully',
            example: {
              id: 'session_456',
              type: 'guest',
              createdAt: '2025-01-10T10:00:00Z'
            }
          },
          {
            status: 400,
            description: 'Invalid request parameters'
          }
        ],
        examples: [
          {
            title: 'Create Guest Session',
            description: 'Create a new guest session',
            request: {
              type: 'guest'
            },
            response: {
              id: 'session_456',
              type: 'guest',
              createdAt: '2025-01-10T10:00:00Z'
            },
            language: 'javascript'
          }
        ],
        authentication: false,
        rateLimit: {
          requests: 100,
          window: 60,
          unit: 'minute'
        }
      },
      {
        endpoint: '/api/session/{id}',
        method: 'GET',
        description: 'Get session details',
        parameters: [
          {
            name: 'id',
            type: 'string',
            required: true,
            description: 'Session ID',
            example: 'session_456'
          }
        ],
        responses: [
          {
            status: 200,
            description: 'Session details retrieved',
            example: {
              id: 'session_456',
              type: 'guest',
              messages: [],
              createdAt: '2025-01-10T10:00:00Z'
            }
          },
          {
            status: 404,
            description: 'Session not found'
          }
        ],
        examples: [
          {
            title: 'Get Session',
            description: 'Retrieve session details',
            request: {},
            response: {
              id: 'session_456',
              type: 'guest',
              messages: [],
              createdAt: '2025-01-10T10:00:00Z'
            },
            language: 'javascript'
          }
        ],
        authentication: false
      },
      {
        endpoint: '/api/session/convert',
        method: 'POST',
        description: 'Convert guest session to authenticated',
        parameters: [
          {
            name: 'guestSessionId',
            type: 'string',
            required: true,
            description: 'Guest session ID to convert',
            example: 'session_456'
          },
          {
            name: 'userId',
            type: 'string',
            required: true,
            description: 'User ID for the authenticated session',
            example: 'user_123'
          }
        ],
        responses: [
          {
            status: 200,
            description: 'Session converted successfully',
            example: {
              success: true,
              newSessionId: 'session_789',
              oldSessionId: 'session_456'
            }
          },
          {
            status: 404,
            description: 'Guest session not found'
          }
        ],
        examples: [
          {
            title: 'Convert Session',
            description: 'Convert guest session to authenticated',
            request: {
              guestSessionId: 'session_456',
              userId: 'user_123'
            },
            response: {
              success: true,
              newSessionId: 'session_789',
              oldSessionId: 'session_456'
            },
            language: 'javascript'
          }
        ],
        authentication: true
      }
    ];
  }

  /**
   * Generate user guides
   */
  private async generateUserGuides(): Promise<void> {
    this.userGuides = [
      {
        title: 'Getting Started with SELLY Session Management',
        description: 'Learn how to integrate and use SELLY session management in your application',
        prerequisites: [
          'Basic knowledge of JavaScript/TypeScript',
          'Understanding of React concepts',
          'Node.js development environment'
        ],
        estimatedTime: 30,
        difficulty: 'beginner',
        sections: [
          {
            title: 'Installation',
            content: 'Install the required dependencies and set up your environment.',
            codeExamples: [
              {
                title: 'Install Dependencies',
                description: 'Install the SELLY session management package',
                code: 'npm install @selly/session-management',
                language: 'bash',
                runnable: true
              }
            ]
          },
          {
            title: 'Basic Configuration',
            content: 'Configure the session management system with your storage adapter.',
            codeExamples: [
              {
                title: 'Basic Setup',
                description: 'Initialize the session manager with default configuration',
                code: `import { createDefaultStorage } from '@/services/session/storage';
import { useEnhancedChatHistory } from '@/hooks/useEnhancedChatHistory';

const storage = createDefaultStorage();
const { createSession, getSession } = useEnhancedChatHistory('user_123', storage);`,
                language: 'typescript',
                runnable: false
              }
            ],
            tips: [
              'Always use environment variables for sensitive configuration',
              'Test your storage adapter connection before deploying'
            ]
          },
          {
            title: 'Creating Sessions',
            content: 'Learn how to create and manage user sessions.',
            codeExamples: [
              {
                title: 'Create Guest Session',
                description: 'Create a new guest session for anonymous users',
                code: `// Create a guest session
const guestSession = createSession({
  type: 'guest',
  messages: []
});

console.log('Guest session created:', guestSession.id);`,
                language: 'typescript',
                runnable: false
              },
              {
                title: 'Create Authenticated Session',
                description: 'Create a session for authenticated users',
                code: `// Create an authenticated session
const authSession = createSession({
  type: 'authenticated',
  userId: 'user_123',
  messages: []
});

console.log('Authenticated session created:', authSession.id);`,
                language: 'typescript',
                runnable: false
              }
            ]
          }
        ]
      },
      {
        title: 'Advanced Session Management',
        description: 'Advanced features including session conversion, real-time sync, and analytics',
        prerequisites: [
          'Completed "Getting Started" guide',
          'Understanding of async/await patterns',
          'Knowledge of React hooks'
        ],
        estimatedTime: 60,
        difficulty: 'intermediate',
        sections: [
          {
            title: 'Session Conversion',
            content: 'Convert guest sessions to authenticated sessions seamlessly.',
            codeExamples: [
              {
                title: 'Convert Session',
                description: 'Convert a guest session when user logs in',
                code: `import { convertGuestToAuthenticated } from '@/services/session/guestSessionManager';

// Convert guest session to authenticated
const conversionResult = await convertGuestToAuthenticated(
  guestSessionId,
  userId
);

if (conversionResult.success) {
  console.log('Session converted:', conversionResult.newSessionId);
} else {
  console.error('Conversion failed:', conversionResult.error);
}`,
                language: 'typescript',
                runnable: false
              }
            ],
            warnings: [
              'Always validate user authentication before conversion',
              'Handle conversion failures gracefully'
            ]
          },
          {
            title: 'Real-time Synchronization',
            content: 'Enable real-time session synchronization across devices.',
            codeExamples: [
              {
                title: 'Enable Real-time Sync',
                description: 'Set up real-time synchronization for a session',
                code: `import { createRealTimeSyncManager } from '@/services/session/realTimeSync';

const syncManager = createRealTimeSyncManager(storageAdapter);

// Enable sync for a session
await syncManager.enableSync(sessionId, deviceId);

// Listen for updates
syncManager.onEvent('session_update', (event) => {
  console.log('Session updated:', event.data);
});`,
                language: 'typescript',
                runnable: false
              }
            ]
          }
        ]
      }
    ];
  }

  /**
   * Generate tutorials
   */
  private async generateTutorials(): Promise<void> {
    // Tutorials would be generated here
    console.log('📚 Generating tutorials...');
  }

  /**
   * Generate troubleshooting guides
   */
  private async generateTroubleshootingGuides(): Promise<void> {
    this.troubleshootingGuides = [
      {
        issue: 'Session Not Found Error',
        symptoms: [
          'API returns 404 when accessing session',
          'Session appears to be lost after page refresh',
          'Error message: "Session not found"'
        ],
        causes: [
          'Session expired due to TTL',
          'Storage adapter connection issues',
          'Session ID not properly stored in client',
          'Cache eviction due to memory limits'
        ],
        solutions: [
          {
            title: 'Check Session TTL Configuration',
            description: 'Verify that session TTL is configured appropriately',
            steps: [
              'Check your storage adapter TTL settings',
              'Verify session expiration logic',
              'Consider extending TTL for guest sessions'
            ],
            codeExample: `// Check TTL configuration
const storage = createDefaultStorage({
  redis: {
    ttl: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
});`,
            difficulty: 'easy',
            estimatedTime: 10
          },
          {
            title: 'Implement Session Recovery',
            description: 'Add fallback mechanisms for session recovery',
            steps: [
              'Implement session backup in localStorage',
              'Add session recreation logic',
              'Provide user notification for session recovery'
            ],
            codeExample: `// Session recovery logic
const recoverSession = async (sessionId: string) => {
  try {
    return await storage.get(sessionId);
  } catch (error) {
    // Try localStorage fallback
    const backup = localStorage.getItem(\`session_\${sessionId}\`);
    return backup ? JSON.parse(backup) : null;
  }
};`,
            difficulty: 'medium',
            estimatedTime: 30
          }
        ],
        prevention: [
          'Monitor session expiration patterns',
          'Implement proper error handling',
          'Use appropriate TTL values',
          'Set up session backup mechanisms'
        ],
        relatedIssues: [
          'Storage Connection Issues',
          'Cache Memory Limits',
          'Session Synchronization Problems'
        ]
      },
      {
        issue: 'Poor Cache Performance',
        symptoms: [
          'High response times for session operations',
          'Low cache hit ratio',
          'Frequent cache misses'
        ],
        causes: [
          'Insufficient cache size',
          'Poor cache eviction policy',
          'Cache fragmentation',
          'Inefficient cache key patterns'
        ],
        solutions: [
          {
            title: 'Optimize Cache Configuration',
            description: 'Tune cache settings for better performance',
            steps: [
              'Increase cache size limits',
              'Adjust eviction policies',
              'Optimize cache key patterns',
              'Enable cache compression'
            ],
            codeExample: `// Optimize cache configuration
const cacheConfig = {
  layers: [
    {
      name: 'L1_Memory',
      maxSize: 2000, // Increased from 1000
      evictionPolicy: 'adaptive' // Changed from 'lru'
    }
  ]
};`,
            difficulty: 'medium',
            estimatedTime: 20
          }
        ],
        prevention: [
          'Monitor cache metrics regularly',
          'Set up cache performance alerts',
          'Use appropriate cache sizes',
          'Implement cache warming strategies'
        ],
        relatedIssues: [
          'Memory Usage Issues',
          'Storage Latency Problems'
        ]
      }
    ];
  }

  /**
   * Generate output files
   */
  private async generateOutputFiles(): Promise<void> {
    for (const format of this.config.outputFormat) {
      for (const language of this.config.languages) {
        try {
          switch (format) {
            case 'markdown':
              await this.generateMarkdownDocs(language);
              break;
            case 'html':
              await this.generateHTMLDocs(language);
              break;
            case 'json':
              await this.generateJSONDocs(language);
              break;
          }
        } catch (error) {
          console.error(`Failed to generate ${format} docs in ${language}:`, error);
        }
      }
    }
  }

  /**
   * Generate Markdown documentation
   */
  private async generateMarkdownDocs(language: DocumentationLanguage): Promise<string> {
    const title = language === 'id' ? 'Dokumentasi SELLY Session Management' : 'SELLY Session Management Documentation';
    
    let markdown = `# ${title}\n\n`;
    
    // API Documentation
    if (this.apiDocs.length > 0) {
      markdown += `## ${language === 'id' ? 'Referensi API' : 'API Reference'}\n\n`;
      
      for (const api of this.apiDocs) {
        markdown += `### ${api.method} ${api.endpoint}\n\n`;
        markdown += `${api.description}\n\n`;
        
        if (api.parameters.length > 0) {
          markdown += `#### ${language === 'id' ? 'Parameter' : 'Parameters'}\n\n`;
          markdown += '| Name | Type | Required | Description |\n';
          markdown += '|------|------|----------|-------------|\n';
          
          for (const param of api.parameters) {
            markdown += `| ${param.name} | ${param.type} | ${param.required ? 'Yes' : 'No'} | ${param.description} |\n`;
          }
          markdown += '\n';
        }
        
        if (api.examples.length > 0) {
          markdown += `#### ${language === 'id' ? 'Contoh' : 'Example'}\n\n`;
          const example = api.examples[0];
          markdown += '```javascript\n';
          markdown += `// ${example.description}\n`;
          markdown += `const response = await fetch('${api.endpoint}', {\n`;
          markdown += `  method: '${api.method}',\n`;
          markdown += `  headers: { 'Content-Type': 'application/json' },\n`;
          markdown += `  body: JSON.stringify(${JSON.stringify(example.request, null, 2)})\n`;
          markdown += '});\n\n';
          markdown += `// Response: ${JSON.stringify(example.response, null, 2)}\n`;
          markdown += '```\n\n';
        }
      }
    }
    
    // User Guides
    if (this.userGuides.length > 0) {
      markdown += `## ${language === 'id' ? 'Panduan Pengguna' : 'User Guides'}\n\n`;
      
      for (const guide of this.userGuides) {
        markdown += `### ${guide.title}\n\n`;
        markdown += `${guide.description}\n\n`;
        
        if (guide.prerequisites.length > 0) {
          markdown += `#### ${language === 'id' ? 'Prasyarat' : 'Prerequisites'}\n\n`;
          for (const prereq of guide.prerequisites) {
            markdown += `- ${prereq}\n`;
          }
          markdown += '\n';
        }
        
        for (const section of guide.sections) {
          markdown += `#### ${section.title}\n\n`;
          markdown += `${section.content}\n\n`;
          
          if (section.codeExamples) {
            for (const example of section.codeExamples) {
              markdown += `##### ${example.title}\n\n`;
              markdown += `${example.description}\n\n`;
              markdown += `\`\`\`${example.language}\n${example.code}\n\`\`\`\n\n`;
            }
          }
          
          if (section.tips && section.tips.length > 0) {
            markdown += `> **${language === 'id' ? 'Tips' : 'Tips'}:**\n`;
            for (const tip of section.tips) {
              markdown += `> - ${tip}\n`;
            }
            markdown += '\n';
          }
        }
      }
    }
    
    // Troubleshooting
    if (this.troubleshootingGuides.length > 0) {
      markdown += `## ${language === 'id' ? 'Pemecahan Masalah' : 'Troubleshooting'}\n\n`;
      
      for (const guide of this.troubleshootingGuides) {
        markdown += `### ${guide.issue}\n\n`;
        
        markdown += `#### ${language === 'id' ? 'Gejala' : 'Symptoms'}\n\n`;
        for (const symptom of guide.symptoms) {
          markdown += `- ${symptom}\n`;
        }
        markdown += '\n';
        
        markdown += `#### ${language === 'id' ? 'Solusi' : 'Solutions'}\n\n`;
        for (const solution of guide.solutions) {
          markdown += `##### ${solution.title}\n\n`;
          markdown += `${solution.description}\n\n`;
          
          markdown += `**${language === 'id' ? 'Langkah-langkah' : 'Steps'}:**\n\n`;
          for (let i = 0; i < solution.steps.length; i++) {
            markdown += `${i + 1}. ${solution.steps[i]}\n`;
          }
          markdown += '\n';
          
          if (solution.codeExample) {
            markdown += '```typescript\n';
            markdown += solution.codeExample;
            markdown += '\n```\n\n';
          }
        }
      }
    }
    
    return markdown;
  }

  /**
   * Generate HTML documentation
   */
  private async generateHTMLDocs(language: DocumentationLanguage): Promise<string> {
    const markdown = await this.generateMarkdownDocs(language);
    // In production, would use a markdown-to-HTML converter
    return `<html><body><pre>${markdown}</pre></body></html>`;
  }

  /**
   * Generate JSON documentation
   */
  private async generateJSONDocs(language: DocumentationLanguage): Promise<string> {
    const docs = {
      language,
      generatedAt: new Date().toISOString(),
      api: this.apiDocs,
      guides: this.userGuides,
      troubleshooting: this.troubleshootingGuides
    };
    
    return JSON.stringify(docs, null, 2);
  }

  /**
   * Get documentation in specified format
   */
  async getDocumentation(
    format: DocumentationFormat = 'markdown',
    language: DocumentationLanguage = 'en'
  ): Promise<string> {
    switch (format) {
      case 'markdown':
        return this.generateMarkdownDocs(language);
      case 'html':
        return this.generateHTMLDocs(language);
      case 'json':
        return this.generateJSONDocs(language);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Update documentation section
   */
  async updateSection(sectionName: string): Promise<void> {
    const section = this.config.sections.find(s => s.name === sectionName);
    if (!section || !section.enabled) {
      throw new Error(`Section ${sectionName} not found or disabled`);
    }

    switch (section.type) {
      case 'api':
        await this.generateAPIDocumentation();
        break;
      case 'guide':
        await this.generateUserGuides();
        break;
      case 'troubleshooting':
        await this.generateTroubleshootingGuides();
        break;
    }

    console.log(`📚 Updated documentation section: ${sectionName}`);
  }

  /**
   * Stop auto-generation
   */
  stop(): void {
    if (this.generationInterval) {
      clearInterval(this.generationInterval);
      this.generationInterval = undefined;
    }
    console.log('📚 Documentation generator stopped');
  }
}

// Factory function
export function createDocumentationGenerator(config?: Partial<DocumentationConfig>): DocumentationGenerator {
  return new DocumentationGenerator(config);
}
