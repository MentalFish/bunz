/**
 * BUNZ Telemetry - Built-in telemetry for Bun.js operations
 * Tracks requests, performance, WebSocket activity, errors, and system metrics
 */

interface TelemetryMetrics {
  // HTTP Metrics
  http: {
    totalRequests: number;
    requestsByMethod: Record<string, number>;
    requestsByPath: Record<string, number>;
    requestsByStatus: Record<string, number>;
    avgResponseTime: number;
    totalResponseTime: number;
    slowestRequests: Array<{ path: string; method: string; duration: number; timestamp: number }>;
  };
  
  // WebSocket Metrics
  websocket: {
    totalConnections: number;
    activeConnections: number;
    totalMessages: number;
    messagesByType: Record<string, number>;
    avgMessageSize: number;
    connectionsByRoom: Record<string, number>;
  };
  
  // Database Metrics
  database: {
    totalQueries: number;
    avgQueryTime: number;
    totalQueryTime: number;
    slowestQueries: Array<{ query: string; duration: number; timestamp: number }>;
    queriesByTable: Record<string, number>;
  };
  
  // Error Tracking
  errors: {
    total: number;
    byType: Record<string, number>;
    byEndpoint: Record<string, number>;
    recentErrors: Array<{ message: string; stack?: string; endpoint?: string; timestamp: number }>;
  };
  
  // System Metrics
  system: {
    startTime: number;
    uptimeSeconds: number;
    memoryUsage: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
    };
    cpuUsage: number;
  };
  
  // Custom Events
  events: Record<string, number>;
}

class BunzTelemetry {
  private metrics: TelemetryMetrics;
  private isEnabled: boolean = true;
  private maxSlowRequests: number = 50;
  private maxSlowQueries: number = 50;
  private maxRecentErrors: number = 100;
  private slowRequestThreshold: number = 1000; // ms
  private slowQueryThreshold: number = 100; // ms
  
  constructor() {
    this.metrics = this.initializeMetrics();
    this.startSystemMetricsCollection();
  }
  
  private initializeMetrics(): TelemetryMetrics {
    return {
      http: {
        totalRequests: 0,
        requestsByMethod: {},
        requestsByPath: {},
        requestsByStatus: {},
        avgResponseTime: 0,
        totalResponseTime: 0,
        slowestRequests: []
      },
      websocket: {
        totalConnections: 0,
        activeConnections: 0,
        totalMessages: 0,
        messagesByType: {},
        avgMessageSize: 0,
        connectionsByRoom: {}
      },
      database: {
        totalQueries: 0,
        avgQueryTime: 0,
        totalQueryTime: 0,
        slowestQueries: [],
        queriesByTable: {}
      },
      errors: {
        total: 0,
        byType: {},
        byEndpoint: {},
        recentErrors: []
      },
      system: {
        startTime: Date.now(),
        uptimeSeconds: 0,
        memoryUsage: {
          heapUsed: 0,
          heapTotal: 0,
          external: 0,
          rss: 0
        },
        cpuUsage: 0
      },
      events: {}
    };
  }
  
  /**
   * Track HTTP request
   */
  trackRequest(method: string, path: string, statusCode: number, duration: number) {
    if (!this.isEnabled) return;
    
    const { http } = this.metrics;
    
    // Increment counters
    http.totalRequests++;
    http.requestsByMethod[method] = (http.requestsByMethod[method] || 0) + 1;
    http.requestsByPath[path] = (http.requestsByPath[path] || 0) + 1;
    http.requestsByStatus[statusCode] = (http.requestsByStatus[statusCode] || 0) + 1;
    
    // Track response time
    http.totalResponseTime += duration;
    http.avgResponseTime = http.totalResponseTime / http.totalRequests;
    
    // Track slow requests
    if (duration > this.slowRequestThreshold) {
      http.slowestRequests.push({
        path,
        method,
        duration,
        timestamp: Date.now()
      });
      
      // Keep only N slowest
      http.slowestRequests.sort((a, b) => b.duration - a.duration);
      if (http.slowestRequests.length > this.maxSlowRequests) {
        http.slowestRequests = http.slowestRequests.slice(0, this.maxSlowRequests);
      }
    }
  }
  
  /**
   * Track WebSocket connection
   */
  trackWebSocketConnection(roomId: string, increment: boolean = true) {
    if (!this.isEnabled) return;
    
    const { websocket } = this.metrics;
    
    if (increment) {
      websocket.totalConnections++;
      websocket.activeConnections++;
      websocket.connectionsByRoom[roomId] = (websocket.connectionsByRoom[roomId] || 0) + 1;
    } else {
      websocket.activeConnections = Math.max(0, websocket.activeConnections - 1);
      websocket.connectionsByRoom[roomId] = Math.max(0, (websocket.connectionsByRoom[roomId] || 0) - 1);
    }
  }
  
  /**
   * Track WebSocket message
   */
  trackWebSocketMessage(type: string, size: number) {
    if (!this.isEnabled) return;
    
    const { websocket } = this.metrics;
    
    websocket.totalMessages++;
    websocket.messagesByType[type] = (websocket.messagesByType[type] || 0) + 1;
    
    // Update average message size
    const totalSize = websocket.avgMessageSize * (websocket.totalMessages - 1) + size;
    websocket.avgMessageSize = totalSize / websocket.totalMessages;
  }
  
  /**
   * Track database query
   */
  trackDatabaseQuery(query: string, duration: number, table?: string) {
    if (!this.isEnabled) return;
    
    const { database } = this.metrics;
    
    database.totalQueries++;
    database.totalQueryTime += duration;
    database.avgQueryTime = database.totalQueryTime / database.totalQueries;
    
    if (table) {
      database.queriesByTable[table] = (database.queriesByTable[table] || 0) + 1;
    }
    
    // Track slow queries
    if (duration > this.slowQueryThreshold) {
      database.slowestQueries.push({
        query: query.substring(0, 200), // Truncate long queries
        duration,
        timestamp: Date.now()
      });
      
      // Keep only N slowest
      database.slowestQueries.sort((a, b) => b.duration - a.duration);
      if (database.slowestQueries.length > this.maxSlowQueries) {
        database.slowestQueries = database.slowestQueries.slice(0, this.maxSlowQueries);
      }
    }
  }
  
  /**
   * Track error
   */
  trackError(error: Error, endpoint?: string) {
    if (!this.isEnabled) return;
    
    const { errors } = this.metrics;
    
    errors.total++;
    
    const errorType = error.name || 'UnknownError';
    errors.byType[errorType] = (errors.byType[errorType] || 0) + 1;
    
    if (endpoint) {
      errors.byEndpoint[endpoint] = (errors.byEndpoint[endpoint] || 0) + 1;
    }
    
    errors.recentErrors.push({
      message: error.message,
      stack: error.stack,
      endpoint,
      timestamp: Date.now()
    });
    
    // Keep only N recent errors
    if (errors.recentErrors.length > this.maxRecentErrors) {
      errors.recentErrors = errors.recentErrors.slice(-this.maxRecentErrors);
    }
  }
  
  /**
   * Track custom event
   */
  trackEvent(eventName: string) {
    if (!this.isEnabled) return;
    
    this.metrics.events[eventName] = (this.metrics.events[eventName] || 0) + 1;
  }
  
  /**
   * Start collecting system metrics
   */
  private startSystemMetricsCollection() {
    // Update system metrics every 10 seconds
    setInterval(() => {
      if (!this.isEnabled) return;
      
      this.metrics.system.uptimeSeconds = Math.floor((Date.now() - this.metrics.system.startTime) / 1000);
      
      // Memory metrics
      const memUsage = process.memoryUsage();
      this.metrics.system.memoryUsage = {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      };
      
      // CPU usage (basic approximation)
      // In production, you might want to use a library like 'pidusage'
      try {
        const usage = process.cpuUsage();
        this.metrics.system.cpuUsage = (usage.user + usage.system) / 1000000; // Convert to seconds
      } catch (e) {
        // CPU usage not available in all environments
      }
    }, 10000);
  }
  
  /**
   * Get all metrics
   */
  getMetrics(): TelemetryMetrics {
    return JSON.parse(JSON.stringify(this.metrics)); // Deep clone
  }
  
  /**
   * Get metrics summary (human readable)
   */
  getSummary(): string {
    const { http, websocket, database, errors, system } = this.metrics;
    
    const uptimeDays = Math.floor(system.uptimeSeconds / 86400);
    const uptimeHours = Math.floor((system.uptimeSeconds % 86400) / 3600);
    const uptimeMinutes = Math.floor((system.uptimeSeconds % 3600) / 60);
    const uptimeStr = `${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m`;
    
    const memUsedMB = Math.round(system.memoryUsage.heapUsed / 1024 / 1024);
    const memTotalMB = Math.round(system.memoryUsage.heapTotal / 1024 / 1024);
    
    return `
╔════════════════════════════════════════════════════════════════╗
║                    BUNZ TELEMETRY SUMMARY                      ║
╠════════════════════════════════════════════════════════════════╣
║ SYSTEM                                                         ║
║   Uptime: ${uptimeStr.padEnd(50)} ║
║   Memory: ${memUsedMB}MB / ${memTotalMB}MB${' '.repeat(50 - (memUsedMB.toString().length + memTotalMB.toString().length + 9))}║
║                                                                ║
║ HTTP REQUESTS                                                  ║
║   Total: ${http.totalRequests.toString().padEnd(54)} ║
║   Avg Response Time: ${http.avgResponseTime.toFixed(2)}ms${' '.repeat(37 - http.avgResponseTime.toFixed(2).length)}║
║   By Status: ${Object.entries(http.requestsByStatus).map(([k,v]) => `${k}:${v}`).join(', ').padEnd(46)} ║
║                                                                ║
║ WEBSOCKETS                                                     ║
║   Total Connections: ${websocket.totalConnections.toString().padEnd(42)} ║
║   Active Connections: ${websocket.activeConnections.toString().padEnd(41)} ║
║   Total Messages: ${websocket.totalMessages.toString().padEnd(45)} ║
║                                                                ║
║ DATABASE                                                       ║
║   Total Queries: ${database.totalQueries.toString().padEnd(46)} ║
║   Avg Query Time: ${database.avgQueryTime.toFixed(2)}ms${' '.repeat(40 - database.avgQueryTime.toFixed(2).length)}║
║                                                                ║
║ ERRORS                                                         ║
║   Total: ${errors.total.toString().padEnd(54)} ║
║   Recent: ${errors.recentErrors.length.toString().padEnd(53)} ║
╚════════════════════════════════════════════════════════════════╝
    `.trim();
  }
  
  /**
   * Reset metrics
   */
  reset() {
    const startTime = this.metrics.system.startTime;
    this.metrics = this.initializeMetrics();
    this.metrics.system.startTime = startTime;
  }
  
  /**
   * Enable/disable telemetry
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
  
  /**
   * Export metrics as JSON
   */
  exportJSON(): string {
    return JSON.stringify(this.getMetrics(), null, 2);
  }
  
  /**
   * Export metrics as Prometheus format
   */
  exportPrometheus(): string {
    const { http, websocket, database, errors, system } = this.metrics;
    
    let output = '# HELP bunz_http_requests_total Total number of HTTP requests\n';
    output += '# TYPE bunz_http_requests_total counter\n';
    output += `bunz_http_requests_total ${http.totalRequests}\n\n`;
    
    output += '# HELP bunz_http_response_time_avg Average HTTP response time in milliseconds\n';
    output += '# TYPE bunz_http_response_time_avg gauge\n';
    output += `bunz_http_response_time_avg ${http.avgResponseTime.toFixed(2)}\n\n`;
    
    output += '# HELP bunz_websocket_connections_active Active WebSocket connections\n';
    output += '# TYPE bunz_websocket_connections_active gauge\n';
    output += `bunz_websocket_connections_active ${websocket.activeConnections}\n\n`;
    
    output += '# HELP bunz_websocket_messages_total Total WebSocket messages\n';
    output += '# TYPE bunz_websocket_messages_total counter\n';
    output += `bunz_websocket_messages_total ${websocket.totalMessages}\n\n`;
    
    output += '# HELP bunz_database_queries_total Total database queries\n';
    output += '# TYPE bunz_database_queries_total counter\n';
    output += `bunz_database_queries_total ${database.totalQueries}\n\n`;
    
    output += '# HELP bunz_database_query_time_avg Average database query time in milliseconds\n';
    output += '# TYPE bunz_database_query_time_avg gauge\n';
    output += `bunz_database_query_time_avg ${database.avgQueryTime.toFixed(2)}\n\n`;
    
    output += '# HELP bunz_errors_total Total number of errors\n';
    output += '# TYPE bunz_errors_total counter\n';
    output += `bunz_errors_total ${errors.total}\n\n`;
    
    output += '# HELP bunz_system_uptime_seconds System uptime in seconds\n';
    output += '# TYPE bunz_system_uptime_seconds counter\n';
    output += `bunz_system_uptime_seconds ${system.uptimeSeconds}\n\n`;
    
    output += '# HELP bunz_memory_heap_used_bytes Heap memory used in bytes\n';
    output += '# TYPE bunz_memory_heap_used_bytes gauge\n';
    output += `bunz_memory_heap_used_bytes ${system.memoryUsage.heapUsed}\n\n`;
    
    return output;
  }
}

// Create singleton instance
export const telemetry = new BunzTelemetry();

/**
 * Middleware wrapper for tracking HTTP requests
 */
export function trackRequestTelemetry(
  handler: (req: Request) => Promise<Response> | Response
) {
  return async (req: Request): Promise<Response> => {
    const startTime = performance.now();
    const url = new URL(req.url);
    const method = req.method;
    const path = url.pathname;
    
    try {
      const response = await handler(req);
      const duration = performance.now() - startTime;
      
      telemetry.trackRequest(method, path, response.status, duration);
      
      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      telemetry.trackRequest(method, path, 500, duration);
      telemetry.trackError(error as Error, path);
      throw error;
    }
  };
}

/**
 * Utility to track database query timing
 */
export async function trackDatabaseQuery<T>(
  queryFn: () => T | Promise<T>,
  queryName: string,
  table?: string
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await queryFn();
    const duration = performance.now() - startTime;
    telemetry.trackDatabaseQuery(queryName, duration, table);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    telemetry.trackDatabaseQuery(queryName, duration, table);
    throw error;
  }
}

/**
 * Get metrics endpoint handler
 */
export function handleTelemetryMetrics(format: 'json' | 'prometheus' | 'summary' = 'json'): Response {
  switch (format) {
    case 'prometheus':
      return new Response(telemetry.exportPrometheus(), {
        headers: { 'Content-Type': 'text/plain' }
      });
    
    case 'summary':
      return new Response(telemetry.getSummary(), {
        headers: { 'Content-Type': 'text/plain' }
      });
    
    case 'json':
    default:
      return new Response(telemetry.exportJSON(), {
        headers: { 'Content-Type': 'application/json' }
      });
  }
}

/**
 * Log telemetry summary to console
 */
export function logTelemetrySummary() {
  console.log('\n' + telemetry.getSummary() + '\n');
}

/**
 * Start periodic telemetry logging
 */
export function startTelemetryLogging(intervalMinutes: number = 30) {
  setInterval(() => {
    logTelemetrySummary();
  }, intervalMinutes * 60 * 1000);
}

