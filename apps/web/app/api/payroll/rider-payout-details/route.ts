import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { rider_id, week_number, month, year } = await request.json();

    if (!rider_id || !week_number || !month || !year) {
      return NextResponse.json({ 
        error: "Missing required fields",
        allAdditions: 0,
        allDeductions: 0,
        vehicleRent: 0,
        finalAmount: 0
      });
    }

    // Get date range for the week
    const getWeekDateRange = (week: number, month: number, year: number) => {
      let startDate, endDate;
      
      if (week === 1) {
        startDate = new Date(Date.UTC(year, month - 1, 1));
        endDate = new Date(Date.UTC(year, month - 1, 7));
      } else if (week === 2) {
        startDate = new Date(Date.UTC(year, month - 1, 8));
        endDate = new Date(Date.UTC(year, month - 1, 14));
      } else if (week === 3) {
        startDate = new Date(Date.UTC(year, month - 1, 15));
        endDate = new Date(Date.UTC(year, month - 1, 21));
      } else if (week === 4) {
        startDate = new Date(Date.UTC(year, month - 1, 22));
        endDate = new Date(Date.UTC(year, month, 0));
      }
      
      const formatDate = (date: Date) => {
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, '0');
        const d = String(date.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };
      
      return { startDate, endDate, startDateStr: formatDate(startDate), endDateStr: formatDate(endDate) };
    };

    const { startDate, endDate, startDateStr, endDateStr } = getWeekDateRange(week_number, month, year);

    // Fetch all entries for this week to calculate totals
    let allAdditions = 0;
    let allDeductions = 0;
    let vehicleRent = 0;

    // Get rider info
    const riderInfo = await sql`
      SELECT cee_id, full_name, vehicle_ownership, ev_daily_rent, ev_type, join_date 
      FROM riders 
      WHERE user_id = ${rider_id} OR cee_id = ${rider_id}
      LIMIT 1
    `;

    const cee_id = riderInfo?.[0]?.cee_id || rider_id;
    const full_name = riderInfo?.[0]?.full_name || "Unknown";
    const vehicleOwnership = riderInfo?.[0]?.vehicle_ownership;
    const storedEvDailyRent = riderInfo?.[0]?.ev_daily_rent || null;
    const evType = riderInfo?.[0]?.ev_type;

    // Fetch referrals (additions)
    try {
      const referrals = await sql`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM referrals
        WHERE referrer_cee_id = ${cee_id}
        AND approval_status = 'approved'
        AND DATE(created_at) BETWEEN ${startDateStr} AND ${endDateStr}
      `;
      allAdditions += parseFloat(referrals[0]?.total || 0);
    } catch (e) {
      console.log('Referrals sum error:', e);
    }

    // Fetch incentives (additions)
    try {
      const incentives = await sql`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM incentives
        WHERE cee_id = ${cee_id}
        AND DATE(incentive_date) BETWEEN ${startDateStr} AND ${endDateStr}
      `;
      allAdditions += parseFloat(incentives[0]?.total || 0);
    } catch (e) {
      console.log('Incentives sum error:', e);
    }

    // Fetch advances (deductions)
    try {
      const advances = await sql`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM advances
        WHERE cee_id = ${cee_id}
        AND status = 'approved'
        AND DATE(requested_at) BETWEEN ${startDateStr} AND ${endDateStr}
      `;
      allDeductions += parseFloat(advances[0]?.total || 0);
    } catch (e) {
      console.log('Advances sum error:', e);
    }

    // Fetch other deductions (excluding 'advance' type to avoid double counting)
    try {
      const deductions = await sql`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM deductions
        WHERE cee_id = ${cee_id}
        AND DATE(deduction_date) BETWEEN ${startDateStr} AND ${endDateStr}
        AND deduction_type != 'advance'
      `;
      allDeductions += parseFloat(deductions[0]?.total || 0);
    } catch (e) {
      console.log('Deductions sum error:', e);
    }

    // Calculate vehicle rent if company vehicle
    if (vehicleOwnership === 'company_ev') {
      // Parse join date
      let riderJoinDate: Date | null = null;
      if (riderInfo?.[0]?.join_date) {
        const dateObj = new Date(riderInfo[0].join_date);
        if (!isNaN(dateObj.getTime())) {
          const y = dateObj.getUTCFullYear();
          const m = dateObj.getUTCMonth() + 1;
          const d = dateObj.getUTCDate();
          riderJoinDate = new Date(Date.UTC(y, m - 1, d));
        }
      }

      // Determine daily rent
      let dailyRent = 0;
      if (storedEvDailyRent && storedEvDailyRent > 0) {
        dailyRent = Number(storedEvDailyRent);
      } else if (evType === 'sunmobility_swap') {
        dailyRent = 243;
      } else if (evType === 'fixed_battery') {
        dailyRent = 215;
      }

      // Count days for vehicle rent (excluding days before join date)
      if (dailyRent > 0) {
        let currentDate = new Date(startDate);
        let daysCount = 0;
        
        while (currentDate <= endDate) {
          if (!riderJoinDate || currentDate >= riderJoinDate) {
            daysCount++;
          }
          currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
        
        vehicleRent = dailyRent * daysCount;
      }
    }

    // Calculate final amount
    const finalAmount = allAdditions - allDeductions - vehicleRent;

    return NextResponse.json({
      allAdditions: parseFloat(allAdditions.toFixed(2)),
      allDeductions: parseFloat(allDeductions.toFixed(2)),
      vehicleRent: parseFloat(vehicleRent.toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2))
    });
  } catch (error) {
    console.error('Error fetching payout details:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch payout details',
      allAdditions: 0,
      allDeductions: 0,
      vehicleRent: 0,
      finalAmount: 0
    });
  }
}
