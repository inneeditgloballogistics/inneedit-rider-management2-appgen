import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { rider_id, month, year } = await request.json();

    if (!rider_id) {
      return NextResponse.json({ error: "rider_id required" }, { status: 400 });
    }

    // Resolve cee_id from rider
    let resolvedCeeId = rider_id;
    try {
      const riderResolve = await sql`SELECT cee_id FROM riders WHERE user_id = ${rider_id} OR cee_id = ${rider_id} LIMIT 1`;
      if (riderResolve?.[0]?.cee_id) {
        resolvedCeeId = riderResolve[0].cee_id;
      }
    } catch (e) {
      console.log("Could not resolve cee_id");
    }

    // Get current month/year if not provided
    const now = new Date();
    const currentMonth = month || now.getMonth() + 1;
    const currentYear = year || now.getFullYear();

    // **1. PERFORMANCE RANK & COMPARISON**
    // Get all riders' net payouts for the current month
    const allRidersPayouts = await sql`
      SELECT 
        p.rider_id,
        SUM(CAST(p.net_payout AS NUMERIC)) as total_earned,
        COUNT(DISTINCT p.week_number) as weeks_worked
      FROM payouts p
      WHERE p.month = ${currentMonth} AND p.year = ${currentYear}
      GROUP BY p.rider_id
      ORDER BY total_earned DESC
    `;

    // Get current rider's earnings
    const riderPayouts = await sql`
      SELECT SUM(CAST(p.net_payout AS NUMERIC)) as total_earned
      FROM payouts p
      WHERE p.rider_id = ${rider_id} AND p.month = ${currentMonth} AND p.year = ${currentYear}
    `;

    const riderEarnings = parseFloat(riderPayouts?.[0]?.total_earned || 0);
    const riderRank = allRidersPayouts.findIndex(r => r.rider_id === rider_id) + 1;
    const totalRiders = allRidersPayouts.length;
    const averageEarnings = allRidersPayouts.length > 0 
      ? allRidersPayouts.reduce((sum, r) => sum + parseFloat(r.total_earned || 0), 0) / allRidersPayouts.length
      : 0;

    // **2. GOALS & TARGETS**
    // Get target settings from database
    const targetSettings = await sql`
      SELECT setting_value FROM settings 
      WHERE setting_key = 'daily_earnings_target'
      LIMIT 1
    `;
    
    const dailyTarget = parseFloat(targetSettings?.[0]?.setting_value || "5000");
    const weeklyTarget = dailyTarget * 6; // Assuming 6-day work week

    // Calculate progress towards weekly target (this month)
    const weeklyProgress = ((riderEarnings / weeklyTarget) * 100).toFixed(1);

    // **3. EARNINGS TREND CHART**
    // Get daily earnings for current month
    const monthStart = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    const monthEnd = new Date(Date.UTC(currentYear, currentMonth, 0));

    const dailyEarnings = await sql`
      SELECT 
        TO_CHAR(p.payment_date, 'YYYY-MM-DD') as date,
        SUM(CAST(p.net_payout AS NUMERIC)) as earnings
      FROM payouts p
      WHERE p.rider_id = ${rider_id} AND p.month = ${currentMonth} AND p.year = ${currentYear}
      GROUP BY TO_CHAR(p.payment_date, 'YYYY-MM-DD')
      ORDER BY date ASC
    `;

    // Calculate average daily earnings (only days worked)
    const averageDailyEarnings = dailyEarnings.length > 0
      ? dailyEarnings.reduce((sum: number, d: any) => sum + parseFloat(d.earnings || 0), 0) / dailyEarnings.length
      : 0;

    // Find best earning day
    let topEarningDay = null;
    if (dailyEarnings.length > 0) {
      topEarningDay = dailyEarnings.reduce((max: any, d: any) => 
        parseFloat(d.earnings || 0) > parseFloat(max.earnings || 0) ? d : max
      );
    }

    return NextResponse.json({
      // Performance Rank & Comparison
      rank: {
        position: riderRank,
        totalRiders: totalRiders,
        percentile: totalRiders > 0 ? ((totalRiders - riderRank + 1) / totalRiders * 100).toFixed(1) : 0
      },
      earnings: {
        current: riderEarnings,
        average: parseFloat(averageEarnings.toFixed(2)),
        difference: parseFloat((riderEarnings - averageEarnings).toFixed(2)),
        isAboveAverage: riderEarnings > averageEarnings
      },
      
      // Goals & Targets
      goals: {
        dailyTarget: dailyTarget,
        weeklyTarget: weeklyTarget,
        weeklyProgress: parseFloat(weeklyProgress),
        monthlyEarnings: riderEarnings,
        monthlyTarget: dailyTarget * 26, // Assume 26 working days per month
        monthlyProgress: ((riderEarnings / (dailyTarget * 26)) * 100).toFixed(1)
      },

      // Analytics & Trend
      analytics: {
        totalDaysWorked: dailyEarnings.length,
        averageDailyEarnings: parseFloat(averageDailyEarnings.toFixed(2)),
        topEarningDay: topEarningDay ? {
          date: topEarningDay.date,
          amount: parseFloat(topEarningDay.earnings)
        } : null,
        dailyBreakdown: dailyEarnings.map((d: any) => ({
          date: d.date,
          earnings: parseFloat(d.earnings)
        }))
      },

      // Month & Year context
      period: {
        month: currentMonth,
        year: currentYear,
        monthName: new Date(currentYear, currentMonth - 1).toLocaleDateString('en-IN', { month: 'long', timeZone: 'Asia/Kolkata' })
      }
    });
  } catch (error) {
    console.error('Error fetching rider analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
