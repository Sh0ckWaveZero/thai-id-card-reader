# Product Overview

Thai ID Card Reader is a TypeScript library for reading personal information from Thai national ID cards with WebSocket server support for web applications.

## Core Purpose
- Read Thai national ID card data via PC/SC smart card readers
- Provide WebSocket and HTTP API endpoints for web applications
- Support multiple hospital/clinic system integrations through a plugin architecture

## Key Features
- Cross-platform support (macOS, Windows, Linux)
- Real-time WebSocket communication for web applications
- HTTPS support with SSL certificates
- Plugin-based integration system for multiple hospital systems (MEDHIS Centrix, custom systems)
- Comprehensive error handling and logging
- Structured data transformation for different system formats

## Target Users
- Healthcare systems requiring Thai ID card integration
- Web applications needing real-time card reading capabilities
- Developers building patient management systems
- Hospital and clinic management software

## Integration Systems
The library supports multiple output formats through its plugin architecture:
- **MEDHIS Centrix**: Hospital management system integration
- **Generic Format**: Standard card data structure
- **Custom Systems**: Extensible plugin system for proprietary formats