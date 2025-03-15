# Testing Instructions for Reports & Visualizations

Follow these steps to test the Reports & Visualizations functionality in the application:

## Preparation
1. Make sure you have at least one data source available by going to the Data page and clicking "Create Sample Dataset"

## Testing Visualization Creation
1. Navigate to the Reports page by clicking "Reports" in the navigation menu
2. Click on the "Create Visualization" button
3. Select a data source from the dropdown (if multiple are available)
4. Select visualization options:
   - Chart Type: Bar, Line, or Pie
   - Select fields for X and Y axes (for Bar/Line) or Category (for Pie)
   - Enter a title for your chart (optional)
5. Click "Preview" to see how your visualization looks
6. Click "Create Visualization" to save it as a report

## Verify Report Persistence
1. After creating a visualization, refresh the page
2. Verify that your visualization report is still visible in the reports list
3. Click "View" to open the report and verify the visualization displays correctly

## Test Report Management
1. Create multiple visualizations with different chart types
2. Delete one of the reports by clicking the "Delete" button
3. Refresh the page and verify that the deleted report is gone, but others remain
4. Export reports by clicking the "Export Reports" button
5. Delete all reports
6. Import the previously exported reports file using the "Import Reports" button
7. Verify that all reports were restored correctly

## Known Limitations
- The visualization editor is basic and doesn't support advanced customization
- Some visualization types may not work well with all data formats
- Large datasets might cause performance issues in visualizations

## Reporting Issues
If you encounter any issues during testing, please document:
1. What steps you were performing
2. What you expected to happen
3. What actually happened 
4. Any error messages that appeared in the browser console (F12)

Thank you for testing!