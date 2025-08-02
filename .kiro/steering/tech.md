# Technology Stack

## Core Technologies
- **TypeScript 5.0+**: Primary language with strict mode enabled
- **Node.js 16.17.0+**: Runtime environment
- **PC/SC Lite**: Smart card communication via `pcsclite` library

## Key Dependencies
- **pcsclite**: Smart card reader communication
- **ws**: WebSocket server implementation
- **moment**: Date/time handling for Thai date formats
- **encoding & legacy-encoding**: Thai character encoding support
- **ts-node**: TypeScript execution for development

## Development Tools
- **Jest**: Testing framework with coverage reporting
- **ESLint**: Code linting with TypeScript support
- **TypeScript Compiler**: Build system with declaration file generation

## Build System & Commands

### Development
```bash
npm start              # Start development server with ts-node
npm run dev           # Setup SSL certificates and start server
npm run setup-cert    # Generate self-signed SSL certificates
```

### Building
```bash
npm run build         # Compile TypeScript to JavaScript
npm run typecheck     # Type checking without emission
```

### Testing
```bash
npm test              # Run Jest test suite
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### Code Quality
```bash
npm run lint          # Run ESLint on TypeScript files
```

### Hardware Testing
```bash
node test-card-reader.js  # Test actual card reading functionality
node check-readers.js     # Check available card readers
```

## Configuration Files
- **tsconfig.json**: TypeScript compiler configuration with strict mode
- **jest.config.js**: Jest testing configuration with ts-jest preset
- **package.json**: Project dependencies and scripts
- **config/integrations.json**: Plugin system configuration

## Architecture Patterns
- **Plugin Architecture**: Extensible integration system
- **Factory Pattern**: Dynamic integration creation
- **Strategy Pattern**: Interchangeable validation algorithms
- **Chain of Responsibility**: Multiple integration fallback

## Logging & Monitoring
- Structured logging system via custom logger utility
- Configurable log levels via LOG_LEVEL environment variable
- PC/SC error handling with specific error code mapping