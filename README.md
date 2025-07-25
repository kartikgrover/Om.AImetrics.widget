# Om.AI Metrics Widget

A Übersicht widget for displaying real-time backend metrics from the Om.AI system.

## Features

- Real-time backend metrics monitoring
- System health status indicators
- Job processing statistics
- Infrastructure status (Redis, Queue)
- Performance analytics
- WebSocket connection monitoring
- Live updates every 10 seconds

## Installation

1. Place this folder in your Übersicht widgets directory:
   ```
   ~/Library/Application Support/Übersicht/widgets/
   ```

2. Restart Übersicht or refresh widgets

## Configuration

The widget automatically connects to the Om.AI backend metrics endpoint. No additional configuration required.

## Metrics Displayed

### System Status
- Overall system health
- Last update timestamp

### Infrastructure
- Redis database connection status
- Job queue status
- Redis connection health

### Job Overview
- Total jobs processed
- Successfully completed jobs
- Failed jobs
- Success rate percentage

### Current Queue
- Pending jobs count
- Currently active jobs

### Performance Analytics
- Processing times for different time periods (All Time, Today, Yesterday, Last Hour)
- Job type breakdown with counts and average processing times

### Real-time Connections
- Active WebSocket connections
- Subscribed channels count

## Position

The widget is positioned at:
- Top: 630px
- Left: 10px
- Z-index: 10

## Refresh Rate

Updates every 10 seconds to provide near real-time metrics monitoring. 