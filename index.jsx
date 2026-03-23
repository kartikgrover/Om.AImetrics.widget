import { run } from 'uebersicht';

export const refreshFrequency = 60000; // 60 sec

const API_KEY = "53636efb6ceb01864487ef21196cbc441e3a4aefca2b372d6dc68499d9dbbd94";
const BASE = "https://om-ai-backend-4f29d7469ff6.herokuapp.com";

const PNL_CACHE = "/tmp/omai-pnl-cache.json";
const PNL_FORCE = "/tmp/omai-pnl-force";

export const command = `bash -c '
  echo "---METRICS---"
  curl -s -H "x-metrics-key: ${API_KEY}" "${BASE}/metrics"
  echo "---PNL---"
  FORCE=0
  if [ -f ${PNL_FORCE} ]; then
    rm -f ${PNL_FORCE}
    FORCE=1
  fi
  NEED_REFRESH=0
  if [ ! -f ${PNL_CACHE} ]; then
    NEED_REFRESH=1
  elif [ \$FORCE -eq 1 ]; then
    NEED_REFRESH=1
  else
    LAST_MOD=\$(stat -f %m ${PNL_CACHE})
    TODAY_CST=\$(TZ=America/Chicago date +%Y-%m-%d)
    MIDNIGHT_CST=\$(TZ=America/Chicago date -j -f "%Y-%m-%d %H:%M:%S" "\$TODAY_CST 00:00:00" +%s)
    if [ \$LAST_MOD -lt \$MIDNIGHT_CST ]; then
      NEED_REFRESH=1
    fi
  fi
  if [ \$NEED_REFRESH -eq 1 ]; then
    curl -s -H "x-metrics-key: ${API_KEY}" "${BASE}/api/metrics/daily-pnl?days=1" -o ${PNL_CACHE}
  fi
  cat ${PNL_CACHE}
'`;

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

  const sh = pnl.subscriberHealth || { total: 0, active: 0, activeButCancelling: 0, expired: 0, freeTrial: 0, introOffer: 0, onHold: 0, inGracePeriod: 0, paused: 0, byPlatform: { ios: { active: 0, total: 0 }, android: { active: 0, total: 0 } } };
  const days = pnl.days || [];
  const androidVerification = pnl.androidVerification || { totalAndroidChecked: 0, verifiedViaPlayApi: 0, playApiFallbacks: 0 };
  const today = days?.[0]?.summary || {};

  /* ── helpers ── */
  const statusColor = (val) => {
    if (typeof val === 'string') {
      if (/good|healthy|connected|ready|active/i.test(val)) return '#4caf50';
      if (/error|fail|unhealthy|disconnected/i.test(val)) return '#f44336';
      if (/warn|cancelling/i.test(val)) return '#ff9800';
    }
    if (typeof val === 'number') return '#fff';
    return 'rgba(255,255,255,0.85)';
  };

  const getColor = (val) => {
    if (typeof val === 'string') {
      if (val.includes('🟢') || val.includes('✅')) return '#4caf50';
      if (val.includes('🔴') || val.includes('❌')) return '#f44336';
      if (val.includes('⚠️')) return '#ff9800';
    }
    return 'rgba(255,255,255,0.85)';
  };

  const sectionTitle = (text) => (
    <div style={{
      fontSize: 12,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      color: 'rgba(255,255,255,0.8)',
      marginTop: 14,
      marginBottom: 4,
      paddingBottom: 4,
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    }}>{text}</div>
  );

  const row = (key, value, opts = {}) => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 2,
      lineHeight: '1.3',
    }}>
      <span style={{
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        flexShrink: 0,
        marginRight: 8,
      }}>{key}</span>
      <span style={{
        fontSize: 14,
        fontWeight: 600,
        color: opts.color || getColor(value),
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textAlign: 'right',
      }}>{String(value).replace(/[🟢🔴✅❌⚠️]/g, '').trim()}</span>
    </div>
  );

  const profitColor = today.profit >= 0 ? '#4caf50' : '#f44336';

  return (
    <div style={{
      position: 'absolute',
      top: 5,
      left: 10,
      zIndex: 10,
      background: 'linear-gradient(135deg, rgba(20,20,24,0.88) 0%, rgba(8,8,12,0.92) 100%)',
      padding: '10px 12px',
      borderRadius: 8,
      fontFamily: 'Menlo, "SF Mono", monospace',
      color: '#fff',
      width: 820,
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      {/* ── 3-column CSS Grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '0 16px',
      }}>

        {/* ═══ Column 1: System & Jobs ═══ */}
        <div style={{ minWidth: 0 }}>
          {row('System', status === 'healthy' ? '🟢 Healthy' : '🔴 Unhealthy')}
          {row('Updated', new Date(timestamp).toLocaleString())}

          {sectionTitle('Infrastructure')}
          {row('Redis DB', services.redis ? '✅ Connected' : '❌ Down')}
          {row('Job Queue', services.queue === 'ready' ? '✅ Ready' : `⚠️ ${services.queue}`)}
          {row('Redis Conn', connections.redis.status === 'ready' ? '✅ Ready' : `⚠️ ${connections.redis.status}`)}

          {sectionTitle('Jobs')}
          {row('Total', jobs.total.toLocaleString())}
          {row('Completed', jobs.completed.toLocaleString())}
          {row('Failed', jobs.failed.toLocaleString())}
          {row('Success', `${jobs.successRate}%`)}

          {sectionTitle('Queue')}
          {row('Pending', jobs.waiting.toLocaleString())}
          {row('Active', jobs.active.toLocaleString())}

          {sectionTitle('Performance')}
          {row('All-Time', jobs.processingTime.allTime.totalJobs > 0 ? `${jobs.processingTime.allTime.totalJobs.toLocaleString()} (${jobs.processingTime.allTime.averageSeconds}s)` : '0')}
          {row('Today', jobs.processingTime.today.totalJobs > 0 ? `${jobs.processingTime.today.totalJobs} (${jobs.processingTime.today.averageSeconds}s)` : '0')}
          {row('Last Hour', jobs.processingTime.lastHour.totalJobs > 0 ? `${jobs.processingTime.lastHour.totalJobs} (${jobs.processingTime.lastHour.averageSeconds}s)` : '0')}

          {sectionTitle('Real-time')}
          {row('Active WS', connections.websocket.activeConnections.toLocaleString())}
        </div>

        {/* ═══ Column 2: Subscribers & Job Types ═══ */}
        <div style={{ minWidth: 0 }}>
          {sectionTitle('Subscriber Health')}
          {row('Total', sh.total.toLocaleString())}
          {row('Active', `🟢 ${sh.active}`)}
          {row('Cancelling', sh.activeButCancelling > 0 ? `⚠️ ${sh.activeButCancelling}` : '0')}
          {row('Expired', sh.expired.toLocaleString())}
          {row('Free Trial', sh.freeTrial.toLocaleString())}
          {row('Intro Offer', sh.introOffer.toLocaleString())}
          {sh.onHold > 0 && row('On Hold', `⚠️ ${sh.onHold}`)}
          {sh.inGracePeriod > 0 && row('Grace Period', `⚠️ ${sh.inGracePeriod}`)}
          {sh.paused > 0 && row('Paused', sh.paused.toLocaleString())}

          {sectionTitle('By Platform')}
          {row('iOS', `${sh.byPlatform.ios.active} active / ${sh.byPlatform.ios.total} total`)}
          {row('Android', `${sh.byPlatform.android.active} active / ${sh.byPlatform.android.total} total`)}

          {sh.byMonth && Object.keys(sh.byMonth).length > 0 && sectionTitle('Retention')}
          {sh.byMonth && Object.keys(sh.byMonth)
            .sort((a, b) => parseInt(a.split(' ')[1]) - parseInt(b.split(' ')[1]))
            .map(k => row(k, `${sh.byMonth[k]} subs`))}

          {sectionTitle('Job Types — Today')}
          {Object.entries(jobs.processingTime.byType).map(([type, data]) => (
            row(
              type.charAt(0).toUpperCase() + type.slice(1),
              data.today.totalJobs > 0 ? `${data.today.totalJobs} (${data.today.averageSeconds}s)` : '0'
            )
          ))}
        </div>

        {/* ═══ Column 3: P&L & Ads ═══ */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {sectionTitle(`P&L (${days?.[0]?.date || ''})`)}
            <span
              onClick={(e) => {
                const el = e.currentTarget;
                el.style.transition = 'transform 0.6s ease';
                el.style.transform = 'rotate(360deg)';
                el.style.color = '#4caf50';
                run('touch /tmp/omai-pnl-force');
                setTimeout(() => {
                  el.style.transition = 'none';
                  el.style.transform = 'rotate(0deg)';
                  el.style.color = 'rgba(255,255,255,0.35)';
                }, 700);
              }}
              style={{
                color: 'rgba(255,255,255,0.35)',
                fontSize: 16,
                cursor: 'pointer',
                marginTop: 10,
                display: 'inline-block',
              }}
              title="Refresh P&L"
            >&#x21bb;</span>
          </div>
          {pnl.computedAt && row('Computed', new Date(pnl.computedAt).toLocaleString())}
          {row('Gross Rev', `₹${today.grossRevenue?.toLocaleString() || '0'}`)}
          {row('Store Fees', `₹${today.storeFees?.toLocaleString() || '0'}`)}
          {row('Net Rev', `₹${today.netRevenue?.toLocaleString() || '0'}`)}
          {row('Ad Spend', `$${today.metaAdSpend?.toLocaleString() || '0'} (₹${today.metaAdSpendInr?.toLocaleString() || '0'})`)}
          {row('OpenAI', `$${today.openaiCostUsd?.toLocaleString() || '0'} (₹${today.openaiCostInr?.toLocaleString() || '0'})`)}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            marginBottom: 2, lineHeight: '1.3',
          }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginRight: 8 }}>Profit</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: profitColor }}>
              ₹{today.profit?.toLocaleString() || '0'}
            </span>
          </div>
          {today.metaAdSpendInr > 0 && row('ROAS', `${(today.grossRevenue / today.metaAdSpendInr).toFixed(2)}x`)}

          {sectionTitle('Purchases')}
          {row('New', today.totalPurchases?.toLocaleString() || '0')}
          {row('Renewals', `🟢 ${today.totalRenewals || 0}`)}
          {today.totalOneTimePackages > 0 && row('Q-Packs', today.totalOneTimePackages.toLocaleString())}
          {today.winbackPurchases > 0 && row('Winbacks', today.winbackPurchases.toLocaleString())}
          {today.freeTrials > 0 && row('Free Trials', today.freeTrials.toLocaleString())}
          {today.introOffers > 0 && row('Intro Offers', today.introOffers.toLocaleString())}

          {sectionTitle('Revenue by Platform')}
          {row('iOS', `${today.byPlatform?.ios?.count || 0} sales — ₹${today.byPlatform?.ios?.gross?.toLocaleString() || '0'}`)}
          {row('Android', `${today.byPlatform?.android?.count || 0} sales — ₹${today.byPlatform?.android?.gross?.toLocaleString() || '0'}`)}

          {sectionTitle('Ads')}
          {row('Impressions', today.metaImpressions?.toLocaleString() || '0')}
          {row('Clicks', today.metaClicks?.toLocaleString() || '0')}
          {today.metaImpressions > 0 && row('CTR', `${((today.metaClicks / today.metaImpressions) * 100).toFixed(2)}%`)}
        </div>
      </div>
    </div>
  );
};
