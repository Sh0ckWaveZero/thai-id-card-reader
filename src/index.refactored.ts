import { HttpServerManager } from "./servers/httpServer";
import { WebSocketServerManager } from "./servers/websocketServer";
import { logger, LogLevel } from "./utils/logger";

class Application {
  private httpServer: HttpServerManager;
  private websocketServer: WebSocketServerManager;

  constructor() {
    this.httpServer = new HttpServerManager();
    this.websocketServer = new WebSocketServerManager();
    
    // Set log level based on environment
    const logLevel = process.env.LOG_LEVEL as keyof typeof LogLevel || 'INFO';
    logger.setLogLevel(LogLevel[logLevel]);
  }

  start(): void {
    try {
      logger.info('Starting Thai ID Card Reader Application...');
      
      this.httpServer.start();
      this.websocketServer.start();
      
      logger.info('Application started successfully');
      
      // Graceful shutdown handling
      this.setupGracefulShutdown();
      
    } catch (error) {
      logger.error('Failed to start application:', error);
      process.exit(1);
    }
  }

  stop(): void {
    logger.info('Stopping application...');
    
    this.httpServer.stop();
    this.websocketServer.stop();
    
    logger.info('Application stopped');
  }

  private setupGracefulShutdown(): void {
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    
    signals.forEach(signal => {
      process.on(signal, () => {
        logger.info(`Received ${signal}, initiating graceful shutdown...`);
        this.stop();
        process.exit(0);
      });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.stop();
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.stop();
      process.exit(1);
    });
  }
}

// Start the application
const app = new Application();
app.start();