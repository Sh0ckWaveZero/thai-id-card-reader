# Thai ID Card Reader

📱 A TypeScript library for reading personal information from Thai national ID cards with WebSocket server support for web applications.

## 🌟 Features

- ✅ Read Thai national ID card data via PC/SC
- 🌐 WebSocket server for web applications with multi-system support
- 🔌 HTTP API endpoint for card reading
- 🔒 HTTPS support with SSL certificates
- 📊 Structured logging system
- 🛡️ Enhanced error handling with PC/SC error management and validation
- 🏗️ Clean, maintainable TypeScript architecture with strict type checking
- ✅ Comprehensive testing infrastructure with Jest support
- 📝 Consistent camelCase file naming conventions
- 🔧 Plugin-based integration system for multiple hospital/clinic systems
- 📱 Cross-platform support (macOS, Windows, Linux)
- ⚙️ Configurable integration management (MEDHIS Centrix, custom systems)

## 🆕 Recent Improvements

### v1.0.50+ Updates
- ✅ **TypeScript Strict Mode** - Enhanced type safety and error prevention
- 🧹 **Code Cleanup** - Consistent camelCase naming conventions
- 📊 **Structured Logging** - Replaced console.log with proper logger system
- 🧪 **Testing Infrastructure** - Added Jest testing framework with coverage
- 🏗️ **Build System** - Enhanced build commands and quality checks
- 🔧 **Developer Experience** - Improved tooling and development workflow

For detailed improvement notes, see [`docs/IMPROVEMENTS_SUMMARY.md`](docs/IMPROVEMENTS_SUMMARY.md)

## 🖥️ Compatibility

- ✅ Node.js v16.17.0+ (tested)
- ✅ macOS Monterey v12.5.1+ (tested)
- ✅ Windows 11 v21H2+ (tested)
- ⚡ Linux (should work, not extensively tested)

![Demo](https://github.com/Sh0ckWaveZero/thai-id-card-reader/blob/main/demo.gif?raw=true)

## 📦 Installation

```bash
npm install thai-id-card-reader
```

### Windows Prerequisites

If you encounter errors on Windows, install build tools:

```bash
# Option 1: Windows Build Tools
npm install --global windows-build-tools@4.0.0

# Option 2: Visual Studio Build Tools 2019+
# Download from: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2019
```

For detailed Windows setup: [Stack Overflow Solution](https://stackoverflow.com/a/54136652/16455947)

## 🚀 Quick Start

### Library Usage

```typescript
import ThaiIDCardReader from "thai-id-card-reader"

const reader = new ThaiIDCardReader()
reader.init()

// Platform-specific delays
reader.setInsertCardDelay(process.platform === 'darwin' ? 500 : 1000)
reader.setReadTimeout(15) // Increased timeout for reliability

reader.onReadComplete((data) => {
  console.log('Card data:', data)
})

reader.onReadError((error) => {
  console.error('Read error:', error)
})
```

### WebSocket Server (for Web Applications)

```bash
# Start the server
npm start

# With SSL certificates (place cert.pem and key.pem in root)
npm run setup-cert && npm start
```

**Server Endpoints:**

- WebSocket: `ws://localhost:8182`
- HTTPS: `https://localhost:8085` (if certificates available)

## 🔧 Integration System

This library supports multiple hospital/clinic systems through a plugin-based architecture.

### Configuration

Edit `config/integrations.json` to enable/disable systems:

```json
{
  "integrations": {
    "medhis": {
      "name": "MEDHIS Centrix",
      "enabled": true,
      "priority": 10
    },
    "hospital_x": {
      "name": "Hospital System X", 
      "enabled": false,
      "priority": 5
    }
  }
}
```

### MEDHIS Centrix Integration

```javascript
// Connect to WebSocket server
const socket = new WebSocket('ws://localhost:8182');

// Send read command (MEDHIS format)
socket.send(JSON.stringify({ mode: 'readsmartcard' }));

// Receive patient data
socket.onmessage = function(e) {
  const response = JSON.parse(e.data);
  console.log(`Processed by: ${response.integrationUsed}`);
  
  if (response.mode === "readsmartcard") {
    console.log('Patient data:', response);
    // Use response.Citizenid, response.Th_Firstname, etc.
  }
};
```

### Custom Hospital System Integration

```javascript
// Hospital System X format
socket.send(JSON.stringify({ 
  action: 'read_card', 
  department: 'emergency' 
}));

// Generic format
socket.send(JSON.stringify({ 
  command: 'scan_id',
  clinic: 'CLINIC001'
}));
```

## 📋 Data Structures

### Library Response Object

| Field Name           | Type                  | Description                               |
| -------------------- | --------------------- | ----------------------------------------- |
| `citizenID`        | string                | 13-digit citizen ID number                |
|                      |                       |                                           |
| `fullNameTH`       | string                | Full name in Thai                         |
| `fullNameEN`       | string                | Full name in English                      |
| `titleTH`          | string                | Thai title (นาย, นาง, นางสาว) |
| `titleEN`          | string                | English title (Mr., Mrs., Miss)           |
| `firstNameTH`      | string                | Thai first name                           |
| `firstNameEN`      | string                | English first name                        |
| `lastNameTH`       | string                | Thai last name                            |
| `lastNameEN`       | string                | English last name                         |
| `gender`           | `"male" \| "female"` | Gender                                    |
| `dateOfBirth`      | string                | Birth date (YYYY-MM-DD)                   |
| `address`          | string                | Full address                              |
| `cardIssuer`       | string                | Card issuing authority                    |
| `issueDate`        | string                | Card issue date (YYYY-MM-DD)              |
| `expireDate`       | string                | Card expiry date (YYYY-MM-DD)             |
| `photoAsBase64Uri` | string                | Base64 encoded photo with data URI        |

### Integration Response Format

All responses include integration metadata:

| Field Name        | Type                | Description                                    |
| ----------------- | ------------------- | ---------------------------------------------- |
| `integrationUsed` | string              | Which integration processed the message        |
| `metadata`        | object              | Integration-specific metadata                  |

### MEDHIS Centrix Compatible Format

| Field Name        | Type                | Description                                    |
| ----------------- | ------------------- | ---------------------------------------------- |
| `mode`          | `"readsmartcard"` | Fixed mode identifier                          |
| `Citizenid`     | string              | 13-digit citizen ID                            |
| `Th_Firstname`  | string              | Thai first name                                |
| `Th_Middlename` | null                | Always null (Thai IDs don't have middle names) |
| `Th_Lastname`   | string              | Thai last name                                 |
| `Th_Prefix`     | string              | Thai title                                     |
| `Birthday`      | string              | Birth date (YYYY/MM/DD format)                 |
| `Sex`           | `1 \| 2`           | Gender (1=Male, 2=Female)                      |
| `Address`       | string              | Full address                                   |
| `addrHouseNo`   | string              | House number                                   |
| `addrVillageNo` | string              | Village number                                 |
| `addrTambol`    | string              | Sub-district                                   |
| `addrAmphur`    | string              | District                                       |
| `PhotoRaw`      | string              | Base64 photo without data URI prefix           |

### Custom Integration Formats

Hospital systems can define their own message formats. See `docs/INTEGRATION_ARCHITECTURE.md` for details on creating custom integrations.

## 🏗️ Architecture

### Project Structure

```
src/
├── config/
│   ├── constants.ts          # Configuration constants
│   └── integrationConfig.ts  # Integration system configuration
├── types/
│   ├── index.ts              # Core TypeScript interfaces
│   └── integration.ts        # Integration system interfaces
├── core/
│   ├── integrationManager.ts # Central integration manager
│   ├── cardReaderConnection.ts # Connection management
│   └── commandSender.ts       # APDU command handling
├── integrations/
│   ├── base/                  # Base classes for integrations
│   │   ├── baseIntegration.ts # Base integration class
│   │   └── baseValidator.ts   # Base validator class
│   ├── medhis/               # MEDHIS Centrix integration
│   │   ├── medhisIntegration.ts # MEDHIS integration
│   │   └── medhisValidator.ts   # MEDHIS validator
│   └── custom/               # Custom hospital integrations
│       └── hospitalIntegration.ts # Example custom integration
├── servers/
│   ├── httpServer.ts         # HTTP server manager
│   └── websocketServer.ts    # WebSocket server manager
├── utils/
│   ├── messageValidator.ts   # Message validation utilities
│   ├── pcscErrorHandler.ts   # PC/SC error handling
│   ├── dataTransformer.ts    # Data transformation utilities
│   ├── addressParser.ts      # Address parsing utilities
│   └── logger.ts             # Structured logging system
├── apdu/
│   └── apdu.ts               # Smart card APDU commands
├── thaiIdCardReader.ts       # Main card reader class
├── smartCardReturnData.ts    # Data structures
└── index.ts                  # Application entry point
```

### Key Components

- **🔧 Integration Manager**: Central orchestrator for multiple hospital/clinic systems
- **🔌 Connection Manager**: Handles multiple connection modes with retry logic
- **📡 Command Sender**: Manages APDU command transmission with timeout handling
- **✅ Message Validator**: Universal message validation with integration support
- **🛡️ PC/SC Error Handler**: Comprehensive error handling for smart card operations
- **📊 Logger**: Structured logging with configurable levels
- **🌐 WebSocket Server**: Real-time communication server for web applications
- **🔗 Plugin System**: Extensible integration system for custom hospital formats

## ⚙️ Configuration

### Integration Configuration

Configure which hospital/clinic systems to support in `config/integrations.json`:

```json
{
  "integrations": {
    "medhis": {
      "name": "MEDHIS Centrix",
      "enabled": true,
      "priority": 10,
      "compatibilityMode": true
    }
  },
  "general": {
    "allowMultipleIntegrations": false,
    "fallbackToGeneric": true
  }
}
```

### Environment Variables

```bash
LOG_LEVEL=INFO  # DEBUG, INFO, WARN, ERROR
```

### SSL Certificates

Place SSL certificates in the project root:

- `cert.pem` - SSL certificate
- `key.pem` - Private key

Generate self-signed certificates:

```bash
npm run setup-cert
```

### Connection Settings

Default configuration in `src/config/constants.ts`:

```typescript
export const CARD_READER_CONFIG = {
  DEFAULT_READ_TIMEOUT: 15,     // seconds
  DEFAULT_INSERT_DELAY: 500,    // milliseconds  
  CONNECTION_TIMEOUT: 5000,     // milliseconds
  MAX_RETRIES: 3,               // retry attempts
  RETRY_DELAY_BASE: 1000,       // milliseconds
  COMMAND_MIN_TIMEOUT: 3000,    // milliseconds
  // Enhanced stability settings
  CITIZEN_ID_RETRIES: 5,        // citizen ID read retries
  CITIZEN_ID_TIMEOUT: 10000,    // citizen ID timeout (ms)
  CARD_STABILIZATION_DELAY: 1500,  // card stabilization delay
  TRANSACTION_RETRY_DELAY: 2000     // transaction retry delay
}
```

## 🛠️ Development

### Build & Run

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build TypeScript
npm run build

# Type checking
npm run typecheck

# Run with different log levels
LOG_LEVEL=DEBUG npm start
```

### Testing

```bash
# Run Jest tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Test card reading (hardware test)
node test-card-reader.js

# Check card readers (hardware test)
node check-readers.js
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Type checking (strict mode enabled)
npm run typecheck

# Build production bundle
npm run build
```

## 🐛 Troubleshooting

### Common Issues

1. **Card not detected**

   - Try increasing `insertCardDelay` (Windows: 1000ms, macOS: 500ms)
   - Check card reader connection
   - Verify card reader drivers
2. **Timeout errors**

   - Increase `readTimeout` value
   - Check for hardware conflicts
   - Try different connection modes
3. **Build errors on Windows**

   - Install Visual Studio Build Tools
   - Use Node.js version 16+
   - Install Windows Build Tools
4. **Permission errors**

   - Run as administrator (Windows)
   - Check PC/SC service status
   - Verify card reader permissions

### Debug Mode

```bash
LOG_LEVEL=DEBUG npm start
```

This enables detailed logging for connection attempts, command transmission, and data processing.

## 📄 License

ISC License

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🔧 Adding Custom Integrations

To add support for your hospital/clinic system:

1. **Create Integration Class**:
   ```typescript
   // src/integrations/custom/my-system-integration.ts
   export class MySystemIntegration extends BaseIntegration {
     // Your implementation
   }
   ```

2. **Define Message Format**:
   ```json
   // config/integrations.json
   {
     "my_system": {
       "name": "My Hospital System",
       "enabled": true,
       "messageFormat": {
         "trigger": { "command": "read_patient" }
       }
     }
   }
   ```

3. **Register Integration**:
   ```typescript
   // src/core/integration-manager.ts
   case 'my hospital system':
     return new MySystemIntegration(config);
   ```

For detailed guides, see:
- `docs/INTEGRATION_ARCHITECTURE.md` - Technical architecture
- `docs/MIGRATION_GUIDE.md` - Migration from hard-coded systems
- `examples/integration-usage.md` - Usage examples

## 📞 Support

For issues and questions:

- Check the troubleshooting section
- Review integration documentation in `docs/`
- Review existing GitHub issues
- Create a new issue with detailed information
