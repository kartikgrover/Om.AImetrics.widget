export const refreshFrequency = 10000; // 10 sec

export const command = "curl -s https://om-ai-backend-4f29d7469ff6.herokuapp.com/metrics";

export const render = ({ output }) => {
  if (!output) return <div>Loading...</div>;

  let data;
  try {
    data = JSON.parse(output);
  } catch (e) {
    return <div style={{ color: 'red' }}>Error parsing JSON</div>;
  }

  const { status, timestamp, services, jobs, connections } = data;

  const sectionTitle = (label) => (
    <div style={{
      fontSize: 12,
      fontWeight: 600,
      textTransform: 'uppercase',
      paddingBottom: 4,
      marginTop: 14,
      color: 'rgba(255,255,255,0.8)',
      letterSpacing: '0.5px',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    }}>{label}</div>
  );

  const getColor = (val) => {
    if (typeof val === 'string') {
      if (val.includes('🟢') || val.includes('✅')) return '#4caf50';
      if (val.includes('🔴') || val.includes('❌')) return '#f44336';
      if (val.includes('⚠️')) return '#ff9800';
    }
    return 'rgba(255,255,255,0.7)';
  };

  const label = (key, value) => (
    <div style={{
      fontSize: 14,
      fontWeight: 400,
      color: 'rgba(255,255,255,0.95)',
      marginBottom: 4,
      lineHeight: '1.35',
      display: 'flex',
      alignItems: 'center'
    }}>
      <span style={{ flexBasis: 160, color: 'rgba(255,255,255,0.8)' }}>{key}</span>
      <span style={{ fontWeight: 600, color: getColor(value), whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );

  return (
    <div style={{
      position: 'absolute',
      top: 5,
      left: 10,
      zIndex: 10,
      background: 'linear-gradient(135deg, rgba(30,30,30,0.85) 0%, rgba(10,10,10,0.85) 100%)',
      padding: '8px 0px 8px 10px',
      borderRadius: 5,
      fontFamily: '"Helvetica Neue", Menlo, monospace',
      color: '#fff',
      width: 650,
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.15)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
    }}>
      <div className="container">
        <div className="widget-title" style={{
          fontSize: 13,
          textTransform: 'uppercase',
          fontWeight: 600,
          paddingBottom: 6,
          letterSpacing: '0.8px',
          color: 'rgba(255,255,255,0.85)',
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
        }}>
          Om.AI Backend Metrics
        </div>

        <div style={{ display: 'flex', gap: 20 }}>
          {/* Left Column */}
          <div style={{ flex: 1 }}>
            {label('System Status', status === 'healthy' ? '🟢 Healthy' : '🔴 Unhealthy')}
            {label('Last Updated', new Date(timestamp).toLocaleString())}

            {sectionTitle('Infrastructure')}
            {label('Redis Database', services.redis ? '✅ Connected' : '❌ Disconnected')}
            {label('Job Queue Status', services.queue === 'ready' ? '✅ Ready' : `⚠️ ${services.queue}`)}
            {label('Redis Connection', connections.redis.status === 'ready' ? '✅ Ready' : `⚠️ ${connections.redis.status}`)}

            {sectionTitle('Job Overview')}
            {label('Total Jobs Processed', jobs.total.toLocaleString())}
            {label('Successfully Completed', jobs.completed.toLocaleString())}
            {label('Failed Jobs', jobs.failed.toLocaleString())}
            {label('Success Rate', `${jobs.successRate}%`)}

            {sectionTitle('Current Queue')}
            {label('Pending Jobs', jobs.waiting.toLocaleString())}
            {label('Currently Active', jobs.active.toLocaleString())}

            {sectionTitle('Performance Analytics')}
            {label('All-Time', jobs.processingTime.allTime.totalJobs > 0 ? `${jobs.processingTime.allTime.totalJobs} (${jobs.processingTime.allTime.averageSeconds}s)` : '0')}
            {label('Today', jobs.processingTime.today.totalJobs > 0 ? `${jobs.processingTime.today.totalJobs} (${jobs.processingTime.today.averageSeconds}s)` : '0')}
            {label('Yesterday', jobs.processingTime.yesterday.totalJobs > 0 ? `${jobs.processingTime.yesterday.totalJobs} (${jobs.processingTime.yesterday.averageSeconds}s)` : '0')}
            {label('Last Hour', jobs.processingTime.lastHour.totalJobs > 0 ? `${jobs.processingTime.lastHour.totalJobs} (${jobs.processingTime.lastHour.averageSeconds}s)` : '0')}

            {sectionTitle('Real-time Connections')}
            {label('Active WebSocket Connections', connections.websocket.activeConnections.toLocaleString())}
            {label('Subscribed Channels', connections.websocket.subscribedChannels.toLocaleString())}
          </div>

          {/* Right Column */}
          <div style={{ flex: 1 }}>
            {sectionTitle('Job Types - All Time')}
            {Object.entries(jobs.processingTime.byType).map(([type, data]) => (
              <div key={type} style={{ marginBottom: 2 }}>
                {label(
                  type.charAt(0).toUpperCase() + type.slice(1),
                  data.allTime.totalJobs > 0 ? `${data.allTime.totalJobs} (${data.allTime.averageSeconds}s)` : '0'
                )}
              </div>
            ))}

            {sectionTitle('Job Types - Today')}
            {Object.entries(jobs.processingTime.byType).map(([type, data]) => (
              <div key={type} style={{ marginBottom: 2 }}>
                {label(
                  type.charAt(0).toUpperCase() + type.slice(1),
                  data.today.totalJobs > 0 ? `${data.today.totalJobs} (${data.today.averageSeconds}s)` : '0'
                )}
              </div>
            ))}

            {sectionTitle('Job Types - Last Hour')}
            {Object.entries(jobs.processingTime.byType).map(([type, data]) => (
              <div key={type} style={{ marginBottom: 2 }}>
                {label(
                  type.charAt(0).toUpperCase() + type.slice(1),
                  data.lastHour.totalJobs > 0 ? `${data.lastHour.totalJobs} (${data.lastHour.averageSeconds}s)` : '0'
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
