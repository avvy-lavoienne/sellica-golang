/**
 * Service Container for Dependency Injection
 * Phase 1 Week 1-2 Implementation: Advanced Service Container with Lifecycle Management
 * Resolves circular dependencies and manages service lifecycle
 * 
 * Based on: docs/plan/phase1/2025-08-18-phase1-architecture-consolidation-detailed-plan.md
 * Lines 760-920: Advanced ServiceContainer Implementation
 */

export interface ServiceToken<T = any> {
  name: string;
  type: new (...args: any[]) => T;
}

export interface ServiceFactory<T = any> {
  (container: ServiceContainer): T;
}

export interface ServiceLifecycle {
  initialize?(): Promise<void>;
  dispose?(): Promise<void>;
}

export interface ServiceMetadata {
  singleton: boolean;
  lazy: boolean;
  dependencies: string[];
  lifecycle?: ServiceLifecycle;
}

export class ServiceContainer {
  private static instance: ServiceContainer;
  private services = new Map<string, any>();
  private factories = new Map<string, ServiceFactory>();
  private metadata = new Map<string, ServiceMetadata>();
  private initializing = new Set<string>();
  private dependencyGraph = new Map<string, Set<string>>();

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  register<T>(
    token: ServiceToken<T>,
    factory: ServiceFactory<T>,
    metadata: Partial<ServiceMetadata> = {}
  ): void {
    const serviceMetadata: ServiceMetadata = {
      singleton: true,
      lazy: false,
      dependencies: [],
      ...metadata
    };

    this.factories.set(token.name, factory);
    this.metadata.set(token.name, serviceMetadata);

    // Build dependency graph for circular detection
    this.buildDependencyGraph(token.name, serviceMetadata.dependencies);

    console.log(`📋 [SERVICE_CONTAINER] Registered service: ${token.name} (singleton: ${serviceMetadata.singleton})`);
  }

  resolve<T>(token: ServiceToken<T>): T {
    return this.resolveInternal(token.name);
  }

  private resolveInternal<T>(serviceName: string): T {
    // Detect circular dependencies
    if (this.initializing.has(serviceName)) {
      const cycle = this.findCircularDependencyPath(serviceName);
      throw new Error(`Circular dependency detected: ${cycle.join(' → ')}`);
    }

    const metadata = this.metadata.get(serviceName);
    if (!metadata) {
      throw new Error(`Service ${serviceName} not registered`);
    }

    // Return existing singleton
    if (metadata.singleton && this.services.has(serviceName)) {
      return this.services.get(serviceName);
    }

    // Create new instance
    this.initializing.add(serviceName);
    try {
      const factory = this.factories.get(serviceName)!;
      const instance = factory(this);

      // Initialize if lifecycle is defined
      if (metadata.lifecycle?.initialize) {
        metadata.lifecycle.initialize();
      }

      if (metadata.singleton) {
        this.services.set(serviceName, instance);
      }

      console.log(`✅ [SERVICE_CONTAINER] Resolved service: ${serviceName}`);
      return instance;
    } finally {
      this.initializing.delete(serviceName);
    }
  }

  private buildDependencyGraph(serviceName: string, dependencies: string[]): void {
    this.dependencyGraph.set(serviceName, new Set(dependencies));

    // Validate no circular dependencies
    if (this.hasCircularDependency(serviceName)) {
      throw new Error(`Circular dependency detected when registering ${serviceName}`);
    }
  }

  private hasCircularDependency(serviceName: string, visited = new Set<string>()): boolean {
    if (visited.has(serviceName)) {
      return true;
    }

    visited.add(serviceName);
    const dependencies = this.dependencyGraph.get(serviceName) || new Set();

    for (const dependency of dependencies) {
      if (this.hasCircularDependency(dependency, new Set(visited))) {
        return true;
      }
    }

    return false;
  }

  private findCircularDependencyPath(serviceName: string): string[] {
    // Implementation to find the actual circular path for better error messages
    const path: string[] = [];
    const visited = new Set<string>();

    const findPath = (current: string): boolean => {
      if (visited.has(current)) {
        const cycleStart = path.indexOf(current);
        return cycleStart !== -1;
      }

      visited.add(current);
      path.push(current);

      const dependencies = this.dependencyGraph.get(current) || new Set();
      for (const dependency of dependencies) {
        if (findPath(dependency)) {
          return true;
        }
      }

      path.pop();
      return false;
    };

    findPath(serviceName);
    return path;
  }

  // Cleanup method for testing
  dispose(): void {
    for (const [serviceName, instance] of this.services) {
      const metadata = this.metadata.get(serviceName);
      if (metadata?.lifecycle?.dispose) {
        metadata.lifecycle.dispose();
      }
    }
    this.services.clear();
    console.log('🧹 [SERVICE_CONTAINER] All services disposed');
  }

  // Diagnostic methods
  getRegisteredServices(): string[] {
    return Array.from(this.factories.keys());
  }

  getServiceMetadata(serviceName: string): ServiceMetadata | undefined {
    return this.metadata.get(serviceName);
  }

  getDependencyGraph(): Map<string, Set<string>> {
    return new Map(this.dependencyGraph);
  }

  // Health check
  validateAllDependencies(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const [serviceName, dependencies] of this.dependencyGraph) {
      for (const dependency of dependencies) {
        if (!this.factories.has(dependency)) {
          errors.push(`Service ${serviceName} depends on unregistered service: ${dependency}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
