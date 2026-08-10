import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  ChartBarIcon,
  CalendarIcon,
  UsersIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { getAnalyticsSummary, type AnalyticsSummary } from '../lib/api';
import { Spinner } from '../components/ui/Spinner';

/**
 * Restaurant admin analytics dashboard.
 * Headline KPIs + 2 charts (by day-of-week, by hour) + recent activity.
 * All data comes from a single `/api/analytics/summary` call — server-computed,
 * tenant-scoped via the auth middleware.
 */

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  trend,
  trendLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  suffix?: string;
  trend?: number | null;
  trendLabel?: string;
}) {
  const trendUp = typeof trend === 'number' && trend > 0;
  const trendDown = typeof trend === 'number' && trend < 0;

  return (
    <div className="bg-white dark:bg-surface-card border border-cream-200/40 dark:border-surface-border-light rounded-xl p-5 shadow-card dark:shadow-dark-card">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-coffee-100 dark:bg-coffee-900/40 flex items-center justify-center">
          <Icon className="w-5 h-5 text-coffee-600 dark:text-cream-400" />
        </div>
        {typeof trend === 'number' && (
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
            trendUp ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : trendDown ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {trendUp && <ArrowTrendingUpIcon className="w-3 h-3" />}
            {trendDown && <ArrowTrendingDownIcon className="w-3 h-3" />}
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-xs tracking-wider uppercase text-gray-500 dark:text-cream-400/60 mb-1 font-body">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-display font-bold text-gray-900 dark:text-cream-50">{value}</span>
        {suffix && <span className="text-sm text-gray-400 dark:text-cream-400/50">{suffix}</span>}
      </div>
      {trendLabel && (
        <p className="text-xs text-gray-400 dark:text-cream-400/40 mt-1">{trendLabel}</p>
      )}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-surface-card border border-cream-200/40 dark:border-surface-border-light rounded-xl p-5 shadow-card dark:shadow-dark-card">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-cream-100 mb-1">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400 dark:text-cream-400/50 mb-4">{subtitle}</p>}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  cancelled: 'Annulée',
  no_show: 'Absence',
};
const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  no_show:   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getAnalyticsSummary();
        if (!cancelled) setData(s);
      } catch (e: any) {
        if (!cancelled) setError(e?.response?.data?.message || 'Erreur de chargement des analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!data?.has_data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-coffee-100 dark:bg-coffee-900/40 flex items-center justify-center mb-4">
          <ChartBarIcon className="w-8 h-8 text-coffee-600 dark:text-cream-400" />
        </div>
        <h2 className="text-xl font-display font-bold text-gray-900 dark:text-cream-50 mb-2">
          Pas encore de données
        </h2>
        <p className="text-sm text-gray-500 dark:text-cream-400/70 max-w-md">
          {data?.message || 'Configurez votre plan de salle et acceptez vos premières réservations pour voir vos statistiques ici.'}
        </p>
      </div>
    );
  }

  const h = data.headline!;
  const sb = data.status_breakdown!;
  const trendLabel = typeof h.pct_change === 'number'
    ? `vs ${h.total_last_month} le mois dernier`
    : 'aucune donnée précédente';

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-cream-50">Statistiques</h1>
        <p className="text-sm text-gray-500 dark:text-cream-400/60 mt-1">
          Vue d'ensemble de votre activité — mois en cours et 30 derniers jours.
        </p>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CalendarIcon}
          label="Réservations ce mois"
          value={h.total_this_month}
          trend={h.pct_change}
          trendLabel={trendLabel}
        />
        <StatCard
          icon={CheckCircleIcon}
          label="Taux de confirmation"
          value={h.confirmed_rate}
          suffix="%"
        />
        <StatCard
          icon={UsersIcon}
          label="Convives moyens"
          value={h.avg_party_size}
          suffix="par résa"
        />
        <StatCard
          icon={ChartBarIcon}
          label="Confirmées ce mois"
          value={sb.confirmed}
          suffix={`/ ${h.total_this_month}`}
        />
      </div>

      {/* Status breakdown chips */}
      <div className="bg-white dark:bg-surface-card border border-cream-200/40 dark:border-surface-border-light rounded-xl p-5 shadow-card dark:shadow-dark-card">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-cream-100 mb-3">
          Répartition par statut ce mois
        </h3>
        <div className="flex flex-wrap gap-2">
          {(['pending', 'confirmed', 'cancelled', 'no_show'] as const).map(key => (
            <div key={key} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_COLOR[key]}`}>
              <span>{STATUS_LABEL[key]}</span>
              <span className="font-bold">{sb[key]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Réservations par jour de la semaine" subtitle="30 derniers jours">
          <BarChart data={data.by_day_of_week} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'rgba(150,150,150,0.2)' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', fontSize: 12 }}
              cursor={{ fill: 'rgba(180,148,118,0.1)' }}
            />
            <Bar dataKey="count" fill="#8f6a4f" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Réservations par heure d'arrivée" subtitle="30 derniers jours">
          <BarChart data={data.by_hour} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'rgba(150,150,150,0.2)' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', fontSize: 12 }}
              cursor={{ fill: 'rgba(180,148,118,0.1)' }}
            />
            <Bar dataKey="count" fill="#c49668" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>
      </div>

      {/* Recent activity */}
      <div className="bg-white dark:bg-surface-card border border-cream-200/40 dark:border-surface-border-light rounded-xl p-5 shadow-card dark:shadow-dark-card">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-cream-100 mb-3">
          Activité récente
        </h3>
        {data.recent_activity && data.recent_activity.length > 0 ? (
          <ul className="divide-y divide-cream-200/30 dark:divide-surface-border-light">
            {data.recent_activity.map(r => (
              <li key={r.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-cream-100 truncate">
                    {r.customer_name}
                    {r.is_event && <span className="ml-2 text-xs text-violet-600 dark:text-violet-400">· Événement</span>}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-cream-400/60 mt-0.5">
                    {r.party_size} {r.party_size > 1 ? 'personnes' : 'personne'} · {formatDate(r.arrival_time)}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${STATUS_COLOR[r.status] || STATUS_COLOR.pending}`}>
                  {STATUS_LABEL[r.status] || r.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400 dark:text-cream-400/40 italic">Aucune activité récente.</p>
        )}
      </div>
    </div>
  );
}
