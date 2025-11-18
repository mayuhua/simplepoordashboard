# Simple Poor Dashboard

A dynamic web-based dashboard for analyzing Payment Service Provider (PSP) performance data with real-time filtering and interactive visualizations.

## Overview

Simple Poor Dashboard is a React + TypeScript application that processes Excel files containing weekly PSP metrics and provides Tableau/QlikSense-style interactive analytics. The application extracts critical performance indicators including press buy counts, conversion rates, and market share distributions across different countries, PSPs, and time periods.

## Features

### 🔄 Dynamic Data Processing
- **Real-time Excel parsing** with intelligent column detection
- **Thousand separator handling** for formatted numeric data
- **Batch processing** for large datasets with performance optimization
- **Smart PSP extraction** from complex provider names

### 📊 Interactive Dashboard
- **Single-chart architecture** with dynamic metric selection
- **Multi-dimensional filtering**: Country, PSP, Week, Payment Options
- **Absolute vs Percentage view toggle** for market share analysis
- **Responsive line charts** for trend visualization

### 🎯 Key Metrics
- **Press Buy Count**: Total payment attempt volumes
- **Converted Count**: Successful transaction completions
- **Conversion Rate**: (Converted / Press Buy) × 100%
- **Market Share**: PSP distribution within country-week segments

### 🎨 User Experience
- **Clean, intuitive interface** inspired by BI tools
- **Real-time filtering** with instant chart updates
- **Intelligent PSP dimension logic** (global view vs breakdown)
- **Mobile-responsive design** with Tailwind CSS

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Charts**: Recharts library
- **Styling**: Tailwind CSS
- **File Processing**: SheetJS (xlsx)
- **Icons**: Lucide React

## Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/mayuhua/simplepoordashboard.git
cd simplepoordashboard

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The application will be available at `http://localhost:5173` in development mode.

## Usage Guide

### 1. Upload Data
- Prepare Excel file with PSP performance data
- Expected columns: Country, PSP, Week, Press Buy Count, Converted Count
- Optional: Last Selected Payment Option
- Upload via the file interface

### 2. Apply Filters
- **Countries**: Select specific markets or "All" for global view
- **PSPs**: Choose providers or "All" for aggregated analysis
- **Weeks**: Filter by time periods
- **Payment Options**: Refine by payment methods (if available)

### 3. Analyze Metrics
- Select metric from dropdown (Press Buy, Converted, Conversion Rate)
- Toggle between absolute values and percentages
- View trends over time with interactive tooltips
- Observe PSP breakdown when specific providers are selected

## Data Processing

### Excel File Requirements

**Required Columns:**
- `Country` or `Market`: Geographic market identifier
- `PSP` or `Partner Name`: Payment service provider
- `Week` or `Year Week`: Time period identifier
- `Press Buy Count` or `# Press Buy`: Payment attempt volumes
- `Converted Count` or `# Converted`: Successful conversions

**Optional Columns:**
- `Last Selected Payment Option`: Payment method selection data

### Calculations

- **Conversion Rate**: `(Converted Count / Press Buy Count) × 100`
- **Market Share**: PSP volume / Country-Week total volume × 100
- **Global Aggregation**: Sum across selected dimensions

## Architecture

### Component Structure
```
src/
├── components/
│   ├── SimpleFileUpload.tsx      # Excel upload interface
│   ├── DynamicFilters.tsx        # Multi-select filtering
│   ├── ImprovedDynamicChart.tsx  # Main chart component
│   └── ToggleButton.tsx          # UI toggle controls
├── utils/
│   ├── xlsxParser.ts             # Excel processing logic
│   ├── dashboardProcessor.ts     # Data aggregation
│   └── qlikProcessor.ts          # Qlik-style calculations
├── types/
│   └── index.ts                  # TypeScript definitions
└── App.tsx                       # Main application
```

### Key Features

1. **Intelligent PSP Extraction**
   - Detects core PSP names from complex strings
   - Supports Adyen, Stripe, and custom providers
   - Handles parent/child relationships

2. **Performance Optimization**
   - Batch processing for large datasets
   - Timeout protection and error handling
   - Memory-efficient parsing

3. **QlikSense-Style Logic**
   - Real-time metric calculations
   - Dynamic dimension switching
   - Responsive filtering

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
```

### Project Structure

- **React 18** with hooks for state management
- **TypeScript** for type safety
- **Modular architecture** with separation of concerns
- **Performance optimized** data processing

## Troubleshooting

### Common Issues

1. **Large File Processing**
   - Files larger than 50MB may timeout
   - Processing progress is shown with loading indicators

2. **Data Parsing**
   - Automatic column detection handles various naming conventions
   - Thousand separators are automatically processed
   - Missing required columns show helpful error messages

3. **Performance**
   - Browser may freeze with extremely large datasets
   - Use batch processing and timeout protections

### Error Messages

- "File size exceeds maximum allowed size" → Use smaller file
- "No valid data found" → Check Excel format and column names
- "Processing timeout" → File too large or corrupted

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with React and TypeScript
- Charts powered by Recharts
- Excel processing via SheetJS
- Styling with Tailwind CSS

---

**Simple Poor Dashboard** - Professional PSP analytics made simple.