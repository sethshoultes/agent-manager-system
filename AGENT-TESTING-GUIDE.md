# Agent Testing Guide: Creating Reports with Agents

This guide explains how to create reports by executing agents in the Agent Manager System.

## Prerequisites

1. Make sure you have data sources available:
   - Go to the **Data** page
   - Click **Create Sample Dataset** to generate sample data
   - Verify the data appears in the list

2. Make sure you have agents available:
   - Go to the **Agents** page
   - If no agents appear, you need to create one
   - Alternatively, run the sample script to create test agents

## Creating Sample Agents (if needed)

If you don't see any agents, you can create them in two ways:

### Option 1: Using the UI
1. Go to the **Agents** page
2. Click **Add New Agent**
3. Fill in the form:
   - Name: "Data Analyzer"
   - Type: "analyzer"
   - Description: "Analyzes data and creates reports"
   - Add capabilities: ["data-analysis", "statistical-analysis"]
4. Click **Create Agent**

### Option 2: Using Developer Tools
1. Open Developer Tools (F12)
2. Go to the Console tab
3. Copy and paste the following code:
```javascript
const sampleAgents = [
  {
    id: 'test-agent-1',
    name: 'Data Analyzer Agent',
    description: 'Analyzes data sources and generates insights',
    type: 'analyzer',
    status: 'active',
    capabilities: ['data-analysis', 'insight-generation', 'statistical-analysis'],
    createdAt: new Date().toISOString(),
    lastRun: null
  },
  {
    id: 'test-agent-2',
    name: 'Visualization Agent',
    description: 'Creates charts and visualizations from data',
    type: 'visualizer',
    status: 'active',
    capabilities: ['chart-generation', 'data-visualization', 'pattern-detection'],
    createdAt: new Date().toISOString(),
    lastRun: null
  }
];
localStorage.setItem('agents', JSON.stringify(sampleAgents));
```
4. Refresh the page

## Executing an Agent to Create a Report

1. Go to the **Agents** page
2. Find an agent in the list (preferably one with visualization capabilities, like "Visualization Agent")
3. Click the **Execute** button on the agent card
4. A modal will open:
   - You'll see the selected agent name at the top
   - Below that, you'll see a list of available data sources
   - Click on a data source to select it (the one you created earlier)
   - Click the **Execute Agent** button

5. The agent will begin processing:
   - You'll see a progress bar and execution logs
   - This typically takes about 5-10 seconds to complete
   - Wait for the process to finish

6. When execution completes:
   - You'll be automatically redirected to the **Reports** page
   - You should see a new report created by the agent
   - Click **View** to see the full report with visualizations

## Troubleshooting

If you encounter issues:

1. Check the browser console (F12 > Console) for error messages

2. Verify localStorage:
   - Open Developer Tools (F12)
   - Go to Application tab > Storage > Local Storage
   - Check if keys like "dataSources", "agents", and "reports" exist

3. Try refreshing the page or restarting the application

4. If an agent execution gets stuck, refresh the page and try again

5. Ensure you've created sample data before executing agents