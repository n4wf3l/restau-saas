<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Services\TenantContext;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    private function tc(): TenantContext
    {
        return app(TenantContext::class);
    }

    /**
     * Reservation analytics summary for the current tenant.
     * Returns headline KPIs + breakdowns for charts.
     */
    public function summary(Request $request)
    {
        $floorPlan = $this->tc()->require()->floorPlan;
        if (!$floorPlan) {
            return response()->json([
                'has_data' => false,
                'message'  => 'No floor plan configured yet.',
            ]);
        }

        $baseQuery = fn() => Reservation::where(function ($q) use ($floorPlan) {
            $q->whereHas('floorPlanItem', fn($sub) => $sub->where('floor_plan_id', $floorPlan->id))
              ->orWhere(fn($sub) => $sub->where('is_event', true)->whereNull('floor_plan_item_id'));
        });

        // Deduplicate multi-row reservations (one row per chair) into one per booking
        // using the same key the admin UI uses: email|arrival_time|party_size
        $dedupe = fn($reservations) => $reservations
            ->groupBy(fn($r) => $r->customer_email . '|' . $r->arrival_time->format('Y-m-d H:i') . '|' . $r->party_size)
            ->map->first();

        $now = Carbon::now();
        $monthStart      = $now->copy()->startOfMonth();
        $monthEnd        = $now->copy()->endOfMonth();
        $lastMonthStart  = $now->copy()->subMonth()->startOfMonth();
        $lastMonthEnd    = $now->copy()->subMonth()->endOfMonth();
        $thirtyDaysAgo   = $now->copy()->subDays(30);

        // ─── This-month / last-month totals ─────────────────────────────
        $thisMonthAll = $baseQuery()
            ->whereBetween('arrival_time', [$monthStart, $monthEnd])
            ->get();
        $lastMonthAll = $baseQuery()
            ->whereBetween('arrival_time', [$lastMonthStart, $lastMonthEnd])
            ->get();

        $thisMonth = $dedupe($thisMonthAll);
        $lastMonth = $dedupe($lastMonthAll);

        $totalThisMonth = $thisMonth->count();
        $totalLastMonth = $lastMonth->count();
        $pctChange = $totalLastMonth > 0
            ? round((($totalThisMonth - $totalLastMonth) / $totalLastMonth) * 100)
            : null;

        // ─── Status breakdown (this month) ──────────────────────────────
        $byStatus = $thisMonth->groupBy('status')->map->count();
        $statusPayload = [
            'pending'   => $byStatus->get('pending', 0),
            'confirmed' => $byStatus->get('confirmed', 0),
            'cancelled' => $byStatus->get('cancelled', 0),
            'no_show'   => $byStatus->get('no_show', 0),
        ];

        // ─── Avg party size (this month) ────────────────────────────────
        $avgPartySize = $thisMonth->count() > 0
            ? round($thisMonth->avg('party_size'), 1)
            : 0;

        // ─── Last 30 days: by day-of-week ───────────────────────────────
        $recent30All = $baseQuery()
            ->whereBetween('arrival_time', [$thirtyDaysAgo, $now])
            ->get();
        $recent30 = $dedupe($recent30All);

        $dayOfWeekLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        $byDayCounts = array_fill(0, 7, 0);
        foreach ($recent30 as $r) {
            // Carbon dayOfWeek: 0=Sunday, 1=Monday, ... — normalize to Mon=0
            $dow = ($r->arrival_time->dayOfWeek + 6) % 7;
            $byDayCounts[$dow]++;
        }
        $byDayOfWeek = [];
        foreach ($dayOfWeekLabels as $i => $label) {
            $byDayOfWeek[] = ['label' => $label, 'count' => $byDayCounts[$i]];
        }

        // ─── Last 30 days: by hour ──────────────────────────────────────
        $byHourCounts = array_fill(11, 13, 0); // hours 11..23
        foreach ($recent30 as $r) {
            $hour = (int) $r->arrival_time->format('H');
            if ($hour < 11 || $hour > 23) continue;
            $byHourCounts[$hour]++;
        }
        $byHour = [];
        foreach ($byHourCounts as $hour => $count) {
            $byHour[] = ['label' => sprintf('%02dh', $hour), 'count' => $count];
        }

        // ─── Recent activity (last 5 bookings, newest first by created_at) ──
        $recentActivityAll = $baseQuery()
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get();
        $recentActivity = $dedupe($recentActivityAll)
            ->take(5)
            ->values()
            ->map(fn($r) => [
                'id'            => $r->id,
                'customer_name' => $r->customer_name,
                'party_size'    => $r->party_size,
                'arrival_time'  => $r->arrival_time->toIso8601String(),
                'status'        => $r->status,
                'is_event'      => (bool) $r->is_event,
                'created_at'    => $r->created_at->toIso8601String(),
            ]);

        return response()->json([
            'has_data' => true,
            'headline' => [
                'total_this_month' => $totalThisMonth,
                'total_last_month' => $totalLastMonth,
                'pct_change'       => $pctChange,
                'avg_party_size'   => $avgPartySize,
                'confirmed_rate'   => $totalThisMonth > 0
                    ? round(($statusPayload['confirmed'] / $totalThisMonth) * 100)
                    : 0,
            ],
            'status_breakdown' => $statusPayload,
            'by_day_of_week'   => $byDayOfWeek,
            'by_hour'          => $byHour,
            'recent_activity'  => $recentActivity,
        ]);
    }
}
