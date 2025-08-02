# Project Structure & Organization

## Root Directory Structure
```
thai-id-card-reader/
├── src/                    # TypeScript source code
├── build/                  # Compiled JavaScript output
├── dist/                   # Distribution files
├── tests/                  # Test files and mocks
├── docs/                   # Documentation
├── config/                 # Configuration files
├── examples/               # Usage examples
├── node_modules/           # Dependencies
├── cert.pem & key.pem     # SSL certificates (generated)
└── package.json           # Project configuration
```

## Source Code Organization (`src/`)

### Core Architecture
- **`index.ts`**: Application entry point with server setup
- **`thaiIdCardReader.ts`**: Main card reader class
- **`smartCardReturnData.ts`**: Data structure definitions

### Modular Components
```
src/
├── apdu/                   # Smart card APDU commands
│   └── apdu.ts
├── config/                 # Configuration management
│   ├── constants.ts        # System constants and configs
│   └── integrationConfig.ts # Integration system config
├── core/                   # Core business logic
│   ├── cardReaderConnection.ts # Connection management
│   ├── commandSender.ts    # APDU command handling
│   └── integrationManager.ts # Plugin system manager
├── integrations/           # Plugin system
│   ├── base/              # Base classes
│   ├── medhis/            # MEDHIS Centrix integration
│   └── custom/            # Custom hospital integrations
├── servers/               # Server implementations
│   ├── httpServer.ts      # HTTP/HTTPS server
│   └── websocketServer.ts # WebSocket server
├── types/                 # TypeScript type definitions
│   ├── index.ts           # Core interfaces
│   └── integration.ts     # Integration system types
└── utils/                 # Utility functions
    ├── addressParser.ts   # Thai address parsing
    ├── dataTransformer.ts # Data format conversion
    ├── logger.ts          # Structured logging
    ├── messageValidator.ts # Message validation
    └── pcscErrorHandler.ts # Error handling
```

## Testing Structure (`tests/`)
```
tests/
├── __mocks__/             # Mock implementations
│   ├── mockCardData.ts    # Sample card data
│   └── mockPcsc.ts        # PC/SC library mocks
├── integration/           # Integration tests
│   ├── cardReader.integration.test.ts
│   └── server.integration.test.ts
├── unit/                  # Unit tests
│   ├── core/              # Core component tests
│   ├── servers/           # Server tests
│   └── utils/             # Utility tests
├── setup.ts               # Test setup configuration
└── TEST_SUMMARY.md        # Testing documentation
```

## Configuration Structure (`config/`)
- **`integrations.json`**: Main integration configuration
- **`integrations.example.json`**: Example configuration template

## Documentation Structure (`docs/`)
- **Architecture guides**: Technical implementation details
- **Migration guides**: System upgrade documentation
- **Error handling**: Troubleshooting and fixes
- **Integration guides**: Plugin development

## File Naming Conventions
- **camelCase**: All TypeScript files use camelCase naming
- **kebab-case**: Configuration and documentation files
- **PascalCase**: Class names and interfaces
- **UPPER_CASE**: Constants and environment variables

## Import/Export Patterns
- **Barrel exports**: Use `index.ts` files for clean imports
- **Named exports**: Prefer named exports over default exports
- **Type-only imports**: Use `import type` for type-only imports
- **Relative imports**: Use relative paths within the same module

## Code Organization Principles
1. **Separation of Concerns**: Each module has a single responsibility
2. **Plugin Architecture**: Extensible integration system
3. **Type Safety**: Strict TypeScript configuration
4. **Error Boundaries**: Isolated error handling per component
5. **Configuration-Driven**: Behavior controlled via JSON configs

## Build Output Structure (`build/`)
- Mirrors `src/` structure with compiled JavaScript
- Includes TypeScript declaration files (`.d.ts`)
- Main entry point: `build/src/thaiIdCardReader.js`