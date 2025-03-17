# Collaborative Agents User Manual

## Overview

The Collaborative Agents feature allows you to create powerful multi-agent workflows by combining specialized agents into coordinated teams. This enables more comprehensive data analysis through the division of responsibilities and synthesis of results.

## Contents

1. [Agent Types](#agent-types)
2. [Creating Collaborative Agents](#creating-collaborative-agents)
3. [Configuring Collaborators](#configuring-collaborators)
4. [Execution Modes](#execution-modes)
5. [Result Synthesis](#result-synthesis)
6. [Execution Process](#execution-process)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Agent Types

The system includes two collaborative agent types:

### Collaborative Analyzer

This agent coordinates multiple specialized agents for comprehensive data analysis. It:
- Manages execution of collaborator agents
- Tracks progress across all collaborators
- Synthesizes results into a cohesive report
- Works well for complex analyses requiring multiple perspectives

### Analysis Pipeline

This agent creates multi-stage data processing workflows where outputs from each stage are fed into subsequent stages. It:
- Executes agents in a sequential, dependent chain
- Transforms data between processing steps
- Maintains context throughout the pipeline
- Excels at workflows requiring stepwise refinement

## Creating Collaborative Agents

1. Navigate to the **Agents** page
2. Click **Create New Agent**
3. Select either **Collaborative Analyzer** or **Analysis Pipeline** template
4. Provide a name and description
5. Configure execution settings (see below)
6. Select collaborator agents
7. Click **Create Agent**

## Configuring Collaborators

Collaborative agents require individual agents to coordinate. When creating a collaborative agent:

1. In the **Select Collaborator Agents** section, choose from available agents
2. You can select multiple agents of different types:
   - **Analyzers** for statistical analysis and pattern detection
   - **Visualizers** for creating charts and visual representations
   - **Summarizers** for generating text summaries and narratives

> **Note:** Only agents marked as "Can Collaborate" can be selected as collaborators.

## Execution Modes

Collaborative agents support two execution modes:

### Sequential Mode

- Collaborators execute one after another
- Useful when later agents depend on the results of earlier ones
- More predictable resource usage
- Takes longer to complete but may be more thorough

### Parallel Mode

- All collaborators execute simultaneously
- Best for independent analysis tasks
- Faster execution when multiple collaborators are used
- Higher resource usage during execution

## Result Synthesis

When "Synthesize Results" is enabled:

1. Each collaborator's results are collected
2. AI analyzes all results and identifies complementary insights
3. Redundant information is eliminated
4. A cohesive report is generated that:
   - Provides an executive summary
   - Highlights key findings from all collaborators
   - Combines statistical analyses
   - Creates integrated recommendations

If disabled, the raw results from each collaborator are presented separately.

## Execution Process

When executing a collaborative agent:

1. Select a data source to analyze
2. Configure AI settings (provider, model, etc.)
3. Click "Execute"
4. The collaborative execution view will show:
   - Overall progress of the workflow
   - Individual progress of each collaborator
   - Live execution logs
   - Synthesis progress (when applicable)
5. Upon completion, you'll be directed to the resulting report

## Best Practices

### Agent Selection

- **Combine complementary agents:** Pair analysts with visualizers and summarizers
- **Avoid redundancy:** Don't select multiple agents with identical capabilities
- **Consider resource usage:** Each additional agent increases execution time and costs

### Configuration

- **Pipeline agents:** Use sequential mode for dependent workflows
- **Analysis agents:** Use parallel mode for independent analyses of the same data
- **Enable synthesis** for complex datasets to get a unified perspective
- **Disable synthesis** if you prefer to review each agent's results separately

### Data Preparation

- Ensure your data is clean and well-structured
- For large datasets, consider using preprocessing agents first
- Provide context about the data when possible (in descriptions)

## Troubleshooting

### Common Issues

- **No collaborators available:** Create standard agents first before trying to create collaborative agents
- **Execution fails:** Check that the selected data source is compatible with all collaborator agents
- **Synthesis fails:** This can happen with very large results; try reducing the number of collaborators
- **Slow execution:** Parallel mode might be too resource-intensive; try sequential mode

### Error Messages

- **"Collaborator not found":** The selected collaborator may have been deleted
- **"API key required":** Set up API keys in the settings for AI-powered synthesis
- **"Invalid collaborator selection":** Ensure you've selected at least one collaborator

For further assistance, please consult the system administrator or refer to the full documentation.