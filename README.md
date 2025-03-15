# Agent Manager System

A system to manage AI agents, data sources, and reports.

## Important Usage Instructions

This is an offline-first application. All data is stored in your browser's localStorage.

### Working With Data

1. Go to the **Data** page
2. Click "Create Sample Dataset" to generate test data
3. View your data by clicking "View Data"

### Using Agents

1. Go to the **Agents** page
2. If no agents appear, click "Create Sample Agent"
3. Click "Execute Now" on any agent to generate a report
4. You will be redirected to the Reports page

### Viewing Reports

1. Go to the **Reports** page
2. View a report by clicking "View"
3. Delete a report by clicking "Delete"
4. Create a test report by clicking "Create Sample Report"

## Quick Fixes

If you encounter any issues:

### Data Doesn't Appear

1. Click "Create Sample Data" on the Agents or Data page
2. Refresh the page
3. The sample data should now be available

### Agents Don't Appear

1. Click "Create Sample Agent" on the Agents page 
2. Refresh the page
3. The sample agent should now be available

### Reports Page Is Blank

1. Go to the Agents page
2. Click "Execute Now" on any agent
3. You will be redirected to the Reports page with data

## Technical Notes

- The application uses localStorage for storage, not a backend API
- Large datasets are automatically stored locally rather than sent to the API
- All data persists in your browser's localStorage
- Click "Reset" on any page to clear that type of data