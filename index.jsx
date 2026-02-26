export const refreshFrequency = 60000; // 60 sec

const API_KEY = "53636efb6ceb01864487ef21196cbc441e3a4aefca2b372d6dc68499d9dbbd94";
const BASE = "https://om-ai-backend-4f29d7469ff6.herokuapp.com";

export const command = `bash -c 'echo "---METRICS---"; curl -s -H "x-metrics-key: ${API_KEY}" "${BASE}/metrics"; echo "---PNL---"; curl -s -H "x-metrics-key: ${API_KEY}" "${BASE}/api/metrics/daily-pnl?days=1"'`;

export const render = ({ output }) => {
  if (!output) return <div>Loading...</div>;

  let metrics, pnl;
  try {
    const parts = output.split('---PNL---');
    const metricsRaw = parts[0].replace('---METRICS---', '').trim();
    metrics = JSON.parse(metricsRaw);
    pnl = JSON.parse(parts[1].trim());
  } catch (e) {
    return <div style={{ color: 'red', fontFamily: 'monospace', padding: 10 }}>Error parsing: {e.message}</div>;
  }

  const { status, timestamp, services, jobs, connections } = metrics;

  const sh = pnl.subscriberHealth || { total: 0, active: 0, activeButCancelling: 0, expired: 0, freeTrial: 0, introOffer: 0, byPlatform: { ios: { active: 0, total: 0 }, android: { active: 0, total: 0 } } };
  const days = pnl.days || [];
  const androidVerification = pnl.androidVerification || { totalAndroidChecked: 0, verifiedViaPlayApi: 0, playApiFallbacks: 0 };
  const today = days?.[0]?.summary || {};

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
      <span style={{ fontWeight: 600, color: getColor(value), whiteSpace: 'nowrap' }}>{String(value).replace(/[🟢🔴✅❌⚠️]/g, '').trim()}</span>
    </div>
  );

  const profitColor = today.profit >= 0 ? '#4caf50' : '#f44336';

  return (
    <div style={{
      position: 'absolute',
      top: 5,
      left: 10,
      zIndex: 10,
      background: 'linear-gradient(135deg, rgba(30,30,30,0.85) 0%, rgba(10,10,10,0.85) 100%)',
      padding: '8px 25px 8px 10px',
      borderRadius: 5,
      fontFamily: '"Helvetica Neue", Menlo, monospace',
      color: '#fff',
      width: 700,
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.15)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
    }}>
      <div className="container">
        <div style={{ display: 'flex', gap: 20 }}>
          {/* Left Column — System */}
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

            {sectionTitle('Performance')}
            {label('All-Time', jobs.processingTime.allTime.totalJobs > 0 ? `${jobs.processingTime.allTime.totalJobs} (${jobs.processingTime.allTime.averageSeconds}s)` : '0')}
            {label('Today', jobs.processingTime.today.totalJobs > 0 ? `${jobs.processingTime.today.totalJobs} (${jobs.processingTime.today.averageSeconds}s)` : '0')}
            {label('Last Hour', jobs.processingTime.lastHour.totalJobs > 0 ? `${jobs.processingTime.lastHour.totalJobs} (${jobs.processingTime.lastHour.averageSeconds}s)` : '0')}

            {sectionTitle('Real-time')}
            {label('Active WS', connections.websocket.activeConnections.toLocaleString())}
          </div>

          {/* Middle Column — Subscriber Health */}
          <div style={{ flex: 1 }}>
            {sectionTitle('Subscriber Health')}
            {label('Total', sh.total.toLocaleString())}
            {label('Active', `🟢 ${sh.active}`)}
            {label('Cancelling', sh.activeButCancelling > 0 ? `⚠️ ${sh.activeButCancelling}` : '0')}
            {label('Expired', sh.expired.toLocaleString())}
            {label('Free Trial', sh.freeTrial.toLocaleString())}
            {label('Intro Offer', sh.introOffer.toLocaleString())}

            {sectionTitle('By Platform')}
            {label('iOS', `${sh.byPlatform.ios.active} active / ${sh.byPlatform.ios.total} total`)}
            {label('Android', `${sh.byPlatform.android.active} active / ${sh.byPlatform.android.total} total`)}

            {sectionTitle('Android Verification')}
            {label('Checked', androidVerification.totalAndroidChecked.toLocaleString())}
            {label('Verified (Play)', `✅ ${androidVerification.verifiedViaPlayApi}`)}
            {label('Fallbacks', androidVerification.playApiFallbacks > 0 ? `⚠️ ${androidVerification.playApiFallbacks}` : '0')}

            {sectionTitle('Job Types - Today')}
            {Object.entries(jobs.processingTime.byType).map(([type, data]) => (
              <div key={type} style={{ marginBottom: 2 }}>
                {label(
                  type.charAt(0).toUpperCase() + type.slice(1),
                  data.today.totalJobs > 0 ? `${data.today.totalJobs} (${data.today.averageSeconds}s)` : '0'
                )}
              </div>
            ))}
          </div>

          {/* Right Column — P&L */}
          <div style={{ flex: 1 }}>
            {sectionTitle(`P&L (${days?.[0]?.date || ''})`)}
            {pnl.computedAt && label('Computed', new Date(pnl.computedAt).toLocaleString())}
            {label('Purchases', today.totalPurchases?.toLocaleString() || '0')}
            {label('Gross Revenue', `₹${today.grossRevenue?.toLocaleString() || '0'}`)}
            {label('Store Fees', `₹${today.storeFees?.toLocaleString() || '0'}`)}
            {label('Net Revenue', `₹${today.netRevenue?.toLocaleString() || '0'}`)}
            {label('Ad Spend', `$${today.metaAdSpend?.toLocaleString() || '0'}`)}
            <div style={{
              fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.95)',
              marginBottom: 4, lineHeight: '1.35', display: 'flex', alignItems: 'center'
            }}>
              <span style={{ flexBasis: 160, color: 'rgba(255,255,255,0.8)' }}>Profit</span>
              <span style={{ fontWeight: 700, color: profitColor, whiteSpace: 'nowrap' }}>
                ₹{today.profit?.toLocaleString() || '0'}
              </span>
            </div>

            {sectionTitle('Ads Performance')}
            {label('Impressions', today.metaImpressions?.toLocaleString() || '0')}
            {label('Clicks', today.metaClicks?.toLocaleString() || '0')}
            {today.metaImpressions > 0 && label('CTR', `${((today.metaClicks / today.metaImpressions) * 100).toFixed(2)}%`)}

            {sectionTitle('Revenue by Platform')}
            {label('iOS', `${today.byPlatform?.ios?.count || 0} sales — ₹${today.byPlatform?.ios?.gross?.toLocaleString() || '0'}`)}
            {label('Android', `${today.byPlatform?.android?.count || 0} sales — ₹${today.byPlatform?.android?.gross?.toLocaleString() || '0'}`)}

            {today.introOffers > 0 && label('Intro Offers', today.introOffers.toLocaleString())}
            {today.freeTrials > 0 && label('Free Trials', today.freeTrials.toLocaleString())}
          </div>
        </div>
      </div>
    </div>
  );
};
