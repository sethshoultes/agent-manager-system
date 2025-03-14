# Agent Manager System

A React-based application for creating, configuring, and orchestrating AI agents that analyze data and generate visual reports.

## Features

- Create and configure AI agents with different capabilities
- Upload and analyze CSV data files
- Execute agents against data sources to generate reports
- Visualize data with various chart types
- Create custom visualizations with an intuitive UI
- Data persistence with localStorage
- Import and export agents, data sources, and reports as JSON files

## Getting Started

### Prerequisites

- Node.js (v16.0 or higher recommended)
- npm or yarn

### Quick Start

The easiest way to run the application is to use the included start script:

```bash
# Make the script executable (if not already)
chmod +x start.sh

# Run the script
./start.sh
```

The script will guide you through choosing between development mode (with live reloading) and production mode (optimized build).

### Manual Installation

If you prefer to run commands manually:

1. Install dependencies:
```bash
npm install
```

2. Run in development mode:
```bash
npm run dev -- --host --port 8080
```

3. Or build and run for production:
```bash
npm run build
npm run preview -- --host --port 8080
```

### Accessing the Application

Once running, the application will be available at:
- [http://localhost:8080](http://localhost:8080)

## Usage Guide

### Creating an Agent

1. Navigate to the "Agents" page
2. Click "Add New Agent"
3. Fill in the details and select capabilities
4. Optionally, use a pre-configured template
5. Click "Create Agent"

### Uploading Data

1. Navigate to the "Data" page
2. Use the CSV uploader to upload a data file
3. Alternatively, click "Create Sample Dataset" to use demo data

### Executing an Agent

1. From the "Agents" page, click "Execute" on any agent
2. Select a data source to analyze
3. Wait for the agent to complete its analysis
4. View the generated report

### Creating Custom Visualizations

1. Navigate to the "Reports" page
2. Click "Create Visualization"
3. Select a data source
4. Configure the visualization type and parameters
5. Preview and create the visualization

### Working with Reports

1. Navigate to the "Reports" page to see all generated reports
2. Click "View" to see the full report details
3. Use "Export Reports" to save all reports as a JSON file
4. Use "Import Reports" to load previously exported reports

## Technology Stack

- **Frontend Framework**: React 18+
- **Build Tool**: Vite
- **State Management**: React Context API
- **Routing**: React Router 6
- **Data Visualization**: Recharts
- **Styling**: CSS Modules
- **File Parsing**: Papa Parse (for CSV)
- **HTTP Client**: Axios
- **Data Persistence**: localStorage & File System API

## Customization

- Modify the agent templates in `src/components/agents/AgentTemplates.js`
- Add new chart types in `src/components/reports/ChartComponent.jsx`
- Extend data analysis capabilities in `src/services/agentService.js`

## Project Structure

```
agent-manager/
├── public/            # Static assets
├── src/
│   ├── components/    # UI components
│   │   ├── agents/    # Agent-related components
│   │   ├── data/      # Data handling components
│   │   ├── layout/    # Layout components
│   │   ├── reports/   # Report & visualization components
│   │   └── shared/    # Shared UI components
│   ├── context/       # React Context providers
│   ├── hooks/         # Custom React hooks
│   ├── models/        # Data models
│   ├── pages/         # Page components
│   ├── services/      # Service modules
│   └── utils/         # Utility functions
├── App.jsx            # Main application component
├── App.css            # Application styles
└── main.jsx           # Entry point
```

## License

This project is licensed under the MIT License.
