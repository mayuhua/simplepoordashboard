# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Temu PSP Tracker is a React + TypeScript web application for analyzing payment service provider (PSP) performance data. The application processes Excel files containing weekly PSP metrics and provides interactive visualizations with filtering capabilities.

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Charts**: Recharts
- **Styling**: Tailwind CSS
- **File Processing**: SheetJS (xlsx)
- **Icons**: Lucide React

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run build

# Run ESLint
npm run lint

# Preview production build
npm run preview
```

## Architecture

### Core Components

- **App.tsx**: Main application component with file upload and data management
- **FileUpload.tsx**: Excel file upload and processing interface
- **FilterPanel.tsx**: Multi-select filters for countries, PSPs, and payment options
- **ChartPanel.tsx**: Interactive charts showing all metrics with PSP-specific lines/bars

### Data Processing

- **XLSXParser**: Excel file parsing with automatic column detection and data validation
- **DataProcessor**: Data filtering, aggregation, and chart data preparation
- **Types**: TypeScript interfaces for data structures and filtering options

### Key Features

1. **Data Processing Pipeline**:
   - Automatic Excel column detection (flexible field naming)
   - Week/Country/PSP grouping and aggregation
   - Conversion rate calculation (converted / press_buy)
   - Share calculation within each country-week group

2. **Interactive Filtering**:
   - Countries: Multi-select with "All" option
   - PSPs: Multi-select with "All" option
   - Payment Options: Optional filtering by last selected payment method

3. **Visualization Metrics**:
   - Press Buy Count (line chart)
   - Converted Count (line chart)
   - Conversion Rate % (bar chart)
   - Press Buy Share % (bar chart)
   - Converted Share % (bar chart)

4. **Summary Statistics**:
   - Per-PSP totals and averages
   - Dataset overview (countries, PSPs, weeks, total press buys)

## File Structure

```
src/
├── components/
│   ├── FileUpload.tsx      # Excel file upload interface
│   ├── FilterPanel.tsx     # Multi-select filtering component
│   └── ChartPanel.tsx      # Charts and statistics display
├── hooks/                  # Custom React hooks (if needed)
├── types/
│   └── index.ts           # TypeScript type definitions
├── utils/
│   ├── xlsxParser.ts      # Excel file parsing logic
│   └── dataProcessor.ts   # Data filtering and chart preparation
├── styles/
│   └── globals.css        # Global Tailwind styles
├── App.tsx               # Main application component
└── main.tsx             # Application entry point
```

## Data Format Requirements

### Expected Excel Structure

The application expects Excel files with the following columns (field names are flexible):

**Required Columns:**
- Country/Market: Country name
- PSP/Payment Service Provider: PSP identifier
- Week/Date: Week identifier
- Press Buy Count/PressBuyCount: Number of press buy attempts
- Converted Count/ConvertedCount: Number of successful conversions

**Optional Columns:**
- Last Selected Payment Option: Payment method selection data

### Data Processing Logic

1. **Conversion Rate**: `(converted / press_buy) * 100`
2. **Press Buy Share**: `(psp_press_buy / country_week_total_press_buy) * 100`
3. **Converted Share**: `(psp_converted / country_week_total_converted) * 100`

## Development Notes

### Chart Configuration

- Line charts for count metrics (Press Buy, Converted)
- Bar charts for percentage metrics (CR, Shares)
- Automatic color assignment for PSPs (8-color palette)
- Responsive design with proper axis formatting

### Error Handling

- File validation (Excel format only)
- Data parsing error messages
- Empty state handling when filters return no results

### Performance Considerations

- Efficient data grouping using reduce operations
- Lazy chart rendering with filtered data
- Proper TypeScript typing for type safety

## Testing the Application

1. Use the sample file in `RowData/Temu Volume Allocation Between Stripe and Adyen Tracker .xlsx`
2. Upload through the file interface
3. Apply filters to test data processing
4. Verify chart rendering and interactions

## Deployment

The application builds to static files suitable for deployment on:
- GitHub Pages
- Netlify
- Vercel
- Any static file hosting service

Ensure the build command `npm run build` completes successfully before deployment.