# Version History

## v0.6.0 - 2025-03-15
- Fixed CSS styling conflicts between App.css and Tailwind CSS
- Improved sidebar design with icons and better visual hierarchy
- Enhanced header design with mobile-responsive menu
- Fixed mobile menu toggle functionality
- Added proper dark mode support with consistent variables
- Improved layout system for better responsiveness
- Added version footer to sidebar for better context
- Fixed CSS variable conflicts for hybrid styling system

## v0.5.0 - 2025-03-15
- Enhanced visualization capabilities for agent responses
- Improved AI response formatting with structured JSON output
- Added table extraction from unstructured AI responses
- Enhanced chart rendering and data mapping
- Standardized visualization response format across agent types
- Fixed visualization rendering issues in report panels
- Added better support for pie, bar, and line charts
- Implemented intelligent fallback for unformatted AI responses

## v0.4.0 - 2025-03-15
- Added data source selection to agent execution modal
- Fixed issue where agents couldn't select specific data sources
- Improved UI feedback for data source selection
- Enhanced execution flow to require data source selection
- Updated agent service to handle direct data source selection
- Removed forced mock data mode for more flexibility
- Added clear error messages when data source is missing

## v0.3.2 - 2025-03-14
- Fixed TypeError in AgentCard when capabilities is undefined
- Added null check for agent.capabilities before mapping
- Enhanced AgentForm to properly pass agent data to callback
- Improved error handling for agent-related operations
- Added defensive coding to prevent undefined mapping errors

## v0.3.1 - 2025-03-14
- Fixed missing routes for /agents/new and /data/upload
- Created NewAgentPage for adding new agents
- Created DataUploadPage for dedicated data upload UI
- Updated CsvUploader component to support callback on completion
- Enhanced router configuration to support all sidebar navigation links

## v0.3.0 - 2025-03-14
- Implemented real-time agent execution monitoring
- Added progress bar and execution stage tracking
- Created detailed execution logs system 
- Added time tracking (elapsed and estimated completion time)
- Enhanced agent status management
- Improved execution modal with live updates

## v0.2.0 - 2025-03-14
- Added persistence using localStorage
- Implemented import/export functionality for agents, data sources, and reports
- Added UI controls for importing and exporting data
- Updated documentation to reflect new persistence features
- Added styling for import/export buttons

## v0.1.0 - 2025-03-14
- Initial version with basic functionality
- Created core components for agents, data, and reports
- Implemented agent creation and execution
- Added CSV data uploading and preview
- Integrated data visualization with charts