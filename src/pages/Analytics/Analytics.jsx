import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Label,
    BarChart, Bar, LabelList, Legend
} from 'recharts';
import { BarChart2, Lightbulb, RefreshCw } from 'lucide-react';
import Navigation from '../../components/Navigation/Navigation';
import { getAnalyticsSummary } from '../../api/analyticsApi';
import styles from './Analytics.module.css';

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_COLORS = {
    Applied: '#38bdf8',
    Interview: '#FFD100',
    Offer: '#4ADE80',
    Rejected: '#FF66AA',
};

const heatmapBg = (count) => {
    if (count === 0) return '#f0f0f0';
    if (count <= 2) return '#c7d2fe';
    if (count <= 5) return '#818cf8';
    return '#4338ca';
};

// ── Small components ──────────────────────────────────────────────────────────
const MetricCard = ({ label, value, accent, colorClass }) => (
    <div className={styles.metricCard} style={{ borderLeftColor: accent }}>
        <div className={`${styles.metricValue} ${colorClass || ''}`}>{value}</div>
        <div className={styles.metricLabel}>{label}</div>
    </div>
);

const ChartCard = ({ title, children }) => (
    <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>{title}</h3>
        {children}
    </div>
);

const Skeleton = ({ height = 280 }) => (
    <div className={styles.skeleton} style={{ minHeight: height }} />
);

// Custom tooltip for line chart
const LineTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className={styles.tooltip}>
            <div className={styles.tooltipLabel}>{label}</div>
            <div className={styles.tooltipValue}>{payload[0].value} applications</div>
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
const Analytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getAnalyticsSummary();
            setData(result);
        } catch (err) {
            setError('Failed to load analytics. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // ── Loading ────────────────────────────────────────────────────────────────
    if (loading) return (
        <div className={styles.container}>
            <Navigation />
            <div className={styles.content}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Analytics</h1>
                    <p className={styles.subtitle}>Your job search at a glance</p>
                </div>
                <div className={styles.metricsGrid}>
                    {[...Array(6)].map((_, i) => <Skeleton key={i} height={90} />)}
                </div>
                <div className={styles.chartsRow}><Skeleton /><Skeleton /></div>
                <div className={styles.chartsRow}><Skeleton /><Skeleton /></div>
            </div>
        </div>
    );

    // ── Error ──────────────────────────────────────────────────────────────────
    if (error) return (
        <div className={styles.container}>
            <Navigation />
            <div className={styles.content}>
                <div className={styles.errorBox}>
                    <p>{error}</p>
                    <button className={styles.retryBtn} onClick={load}>
                        <RefreshCw size={16} /> Retry
                    </button>
                </div>
            </div>
        </div>
    );

    const { applicationsOverTime, statusDistribution, platformPerformance, weekdayHeatmap, keyMetrics } = data;

    // ── Empty state ────────────────────────────────────────────────────────────
    if (keyMetrics.totalApplications < 3) return (
        <div className={styles.container}>
            <Navigation />
            <div className={styles.content}>
                <div className={styles.emptyState}>
                    <BarChart2 size={64} strokeWidth={1.5} color="#6366F1" />
                    <h2 className={styles.emptyTitle}>Not enough data yet</h2>
                    <p className={styles.emptySub}>Track at least 3 applications to see your analytics.</p>
                    <Link to="/discover" className={styles.discoverBtn}>Discover Jobs →</Link>
                </div>
            </div>
        </div>
    );

    // ── Insight logic ──────────────────────────────────────────────────────────
    let insight = "You're on track. Keep applying consistently and following up on time.";
    if (platformPerformance.length >= 2) {
        const diff = platformPerformance[0].rate - platformPerformance[1].rate;
        if (diff > 10) {
            insight = `Your applications on ${platformPerformance[0].platform} convert to interviews ${diff.toFixed(0)}% more often — focus there.`;
        }
    }
    if (insight.startsWith("You're") && keyMetrics.avgResponseDays > 20) {
        insight = 'Recruiters are taking longer than average to respond. Follow up on applications over 14 days old.';
    }
    if (insight.startsWith("You're") && keyMetrics.thisWeekCount === 0) {
        insight = "You haven't applied to any jobs this week. Check the Discover page for new matches.";
    }

    const rateColor = keyMetrics.interviewRate > 20 ? styles.green
        : keyMetrics.interviewRate < 10 ? styles.red : styles.amber;

    const total = keyMetrics.totalApplications;

    return (
        <div className={styles.container}>
            <Navigation />
            <div className={styles.content}>

                {/* ── Header ── */}
                <div className={styles.header}>
                    <h1 className={styles.title}>Analytics</h1>
                    <p className={styles.subtitle}>Your job search at a glance</p>
                </div>

                {/* ── Metric Cards ── */}
                <div className={styles.metricsGrid}>
                    <MetricCard label="Total Applications" value={total} accent="#6366F1" />
                    <MetricCard label="Active Applications" value={keyMetrics.activeApplications} accent="#38bdf8" />
                    <MetricCard label="Interview Rate" value={`${keyMetrics.interviewRate}%`} accent="#FFD100" colorClass={rateColor} />
                    <MetricCard label="Avg Response (days)" value={keyMetrics.avgResponseDays || '—'} accent="#4ADE80" />
                    <MetricCard label="Offers Received" value={keyMetrics.offersReceived} accent="#FF66AA" />
                    <MetricCard label="Applied This Week" value={keyMetrics.thisWeekCount} accent="#f97316" />
                </div>

                {/* ── Row 1: Line + Donut ── */}
                <div className={styles.chartsRow}>

                    {/* Applications Over Time */}
                    <ChartCard title="Applications Over Time">
                        {applicationsOverTime.filter(d => d.count > 0).length < 3 ? (
                            <div className={styles.chartEmpty}>Add more applications to see trends</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <LineChart data={applicationsOverTime} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="week" tick={{ fontSize: 10, fontWeight: 700 }} interval="preserveStartEnd" />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <Tooltip content={<LineTooltip />} />
                                    <Line
                                        type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={3}
                                        dot={{ r: 5, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }}
                                        activeDot={{ r: 7, stroke: '#000', strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>

                    {/* Status Donut */}
                    <ChartCard title="Application Status">
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={statusDistribution}
                                    dataKey="count"
                                    nameKey="status"
                                    cx="50%" cy="50%"
                                    innerRadius={60} outerRadius={90}
                                    paddingAngle={3}
                                    stroke="none"
                                >
                                    {statusDistribution.map((entry) => (
                                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} stroke="#000" strokeWidth={2} />
                                    ))}
                                    <Label
                                        content={({ viewBox }) => {
                                            const { cx, cy } = viewBox;
                                            return (
                                                <g>
                                                    <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle"
                                                        style={{ fontSize: 26, fontWeight: 900, fontFamily: 'Outfit, Inter, sans-serif', fill: '#000' }}>
                                                        {total}
                                                    </text>
                                                    <text x={cx} y={cy + 16} textAnchor="middle" dominantBaseline="middle"
                                                        style={{ fontSize: 11, fontWeight: 700, fill: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
                                                        Total
                                                    </text>
                                                </g>
                                            );
                                        }}
                                    />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className={styles.donutLegend}>
                            {statusDistribution.map(item => (
                                <div key={item.status} className={styles.legendItem}>
                                    <span className={styles.legendSwatch} style={{ background: STATUS_COLORS[item.status] }} />
                                    <span className={styles.legendLabel}>{item.status}</span>
                                    <span className={styles.legendCount}>{item.count}</span>
                                    <span className={styles.legendPct}>{item.percentage}%</span>
                                </div>
                            ))}
                        </div>
                    </ChartCard>
                </div>

                {/* ── Row 2: Bar + Heatmap ── */}
                <div className={styles.chartsRow}>

                    {/* Platform Performance */}
                    <ChartCard title="Platform Performance">
                        {platformPerformance.length === 0 ? (
                            <div className={styles.chartEmpty}>No platform data available</div>
                        ) : (
                            <>
                                {platformPerformance.length === 1 && (
                                    <p className={styles.chartNote}>Use multiple platforms to compare performance</p>
                                )}
                                <ResponsiveContainer width="100%" height={Math.max(240, platformPerformance.length * 70)}>
                                    <BarChart data={platformPerformance} layout="vertical"
                                        margin={{ top: 5, right: 60, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                                        <YAxis dataKey="platform" type="category" width={80} tick={{ fontSize: 12, fontWeight: 700 }} />
                                        <Tooltip
                                            contentStyle={{ border: '2px solid #000', borderRadius: 8, fontWeight: 700 }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                                        <Bar dataKey="applied" name="Applied" fill="#cbd5e1" stroke="#000" strokeWidth={1} radius={[0, 4, 4, 0]} />
                                        <Bar dataKey="interviews" name="Interviews" fill="#6366F1" stroke="#000" strokeWidth={1} radius={[0, 4, 4, 0]}>
                                            <LabelList
                                                dataKey="rate"
                                                position="right"
                                                formatter={(val) => `${val}%`}
                                                style={{ fontSize: 11, fontWeight: 700, fill: '#444' }}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </>
                        )}
                    </ChartCard>

                    {/* Heatmap */}
                    <ChartCard title="Most Active Days">
                        <div className={styles.heatmapGrid}>
                            {weekdayHeatmap.map(({ day, count }) => (
                                <div key={day} className={styles.heatmapCell}>
                                    <div className={styles.heatmapSquare} style={{ background: heatmapBg(count) }}>
                                        {count > 0 && (
                                            <span className={styles.heatmapCount}>{count}</span>
                                        )}
                                    </div>
                                    <div className={styles.heatmapDay}>{day}</div>
                                </div>
                            ))}
                        </div>
                        <div className={styles.heatmapLegend}>
                            {[['#f0f0f0', '0'], ['#c7d2fe', '1–2'], ['#818cf8', '3–5'], ['#4338ca', '6+']].map(([bg, lbl]) => (
                                <React.Fragment key={lbl}>
                                    <span className={styles.legendBlock} style={{ background: bg }} />
                                    <span className={styles.legendText}>{lbl}</span>
                                </React.Fragment>
                            ))}
                        </div>
                    </ChartCard>
                </div>

                {/* ── Insight Card ── */}
                <div className={styles.insightCard}>
                    <div className={styles.insightIcon}>
                        <Lightbulb size={32} strokeWidth={1.5} />
                    </div>
                    <div className={styles.insightText}>{insight}</div>
                </div>

            </div>
        </div>
    );
};

export default Analytics;
