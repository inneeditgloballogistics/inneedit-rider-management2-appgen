import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { rider_id, start_date, end_date } = await request.json();

    if (!rider_id) {
      return NextResponse.json({ entries: [] });
    }

    let entries: any[] = [];

    // Fetch referrals - only include approved ones (filter by created_at for week determination)
    try {
      let referrals: any[] = [];
      if (start_date && end_date) {
        referrals = await sql`
          SELECT 
            r.id,
            r.referrer_id as rider_id,
            COALESCE(r.referrer_cee_id, 'N/A') as cee_id,
            COALESCE(r.referrer_name, 'Unknown') as full_name,
            'referral' as entry_type,
            COALESCE(r.amount, 0) as amount,
            CONCAT(r.referred_name, ' (', r.referred_phone, ')') as description,
            'approved' as status,
            r.created_at as entry_date,
            r.created_at as created_at
          FROM referrals r
          WHERE (r.referrer_id = ${rider_id} OR r.referrer_cee_id = ${rider_id})
          AND r.approval_status = 'approved'
          AND DATE(r.created_at) BETWEEN ${start_date} AND ${end_date}
          ORDER BY r.created_at DESC
        `;
      } else {
        referrals = await sql`
          SELECT 
            r.id,
            r.referrer_id as rider_id,
            COALESCE(r.referrer_cee_id, 'N/A') as cee_id,
            COALESCE(r.referrer_name, 'Unknown') as full_name,
            'referral' as entry_type,
            COALESCE(r.amount, 0) as amount,
            CONCAT(r.referred_name, ' (', r.referred_phone, ')') as description,
            'approved' as status,
            r.created_at as entry_date,
            r.created_at as created_at
          FROM referrals r
          WHERE (r.referrer_id = ${rider_id} OR r.referrer_cee_id = ${rider_id})
          AND r.approval_status = 'approved'
          ORDER BY r.created_at DESC
        `;
      }
      entries = [...entries, ...referrals];
    } catch (e) {
      console.log('Referrals query error (non-critical):', e);
    }

    // Fetch incentives (filter by created_at for week determination)
    try {
      let incentives: any[] = [];
      if (start_date && end_date) {
        incentives = await sql`
          SELECT 
            i.id,
            i.rider_id,
            COALESCE(r.cee_id, 'N/A') as cee_id,
            COALESCE(r.full_name, 'Unknown') as full_name,
            'incentive' as entry_type,
            COALESCE(i.amount, 0) as amount,
            CONCAT(COALESCE(i.incentive_type, 'Incentive'), ': ', COALESCE(i.description, '')) as description,
            'approved' as status,
            i.created_at as entry_date,
            i.created_at
          FROM incentives i
          LEFT JOIN riders r ON i.rider_id = r.user_id OR i.rider_id = r.cee_id
          WHERE (i.rider_id = ${rider_id})
          AND DATE(i.created_at) BETWEEN ${start_date} AND ${end_date}
          ORDER BY i.created_at DESC
        `;
      } else {
        incentives = await sql`
          SELECT 
            i.id,
            i.rider_id,
            COALESCE(r.cee_id, 'N/A') as cee_id,
            COALESCE(r.full_name, 'Unknown') as full_name,
            'incentive' as entry_type,
            COALESCE(i.amount, 0) as amount,
            CONCAT(COALESCE(i.incentive_type, 'Incentive'), ': ', COALESCE(i.description, '')) as description,
            'approved' as status,
            i.created_at as entry_date,
            i.created_at
          FROM incentives i
          LEFT JOIN riders r ON i.rider_id = r.user_id OR i.rider_id = r.cee_id
          WHERE (i.rider_id = ${rider_id})
          ORDER BY i.created_at DESC
        `;
      }
      entries = [...entries, ...incentives];
    } catch (e) {
      console.log('Incentives query error (non-critical):', e);
    }

    // Fetch advances (filter by created_at/requested_at for week determination, only approved ones)
    try {
      let advances: any[] = [];
      if (start_date && end_date) {
        advances = await sql`
          SELECT 
            a.id,
            a.rider_id,
            COALESCE(a.cee_id, 'N/A') as cee_id,
            COALESCE(a.rider_name, 'Unknown') as full_name,
            'advance' as entry_type,
            COALESCE(a.amount, 0) as amount,
            CONCAT('Reason: ', COALESCE(a.reason, '')) as description,
            'approved' as status,
            a.requested_at as entry_date,
            a.requested_at as created_at
          FROM advances a
          WHERE (a.rider_id = ${rider_id} OR a.cee_id = ${rider_id})
          AND a.status = 'approved'
          AND DATE(a.requested_at) BETWEEN ${start_date} AND ${end_date}
          ORDER BY a.requested_at DESC
        `;
      } else {
        advances = await sql`
          SELECT 
            a.id,
            a.rider_id,
            COALESCE(a.cee_id, 'N/A') as cee_id,
            COALESCE(a.rider_name, 'Unknown') as full_name,
            'advance' as entry_type,
            COALESCE(a.amount, 0) as amount,
            CONCAT('Reason: ', COALESCE(a.reason, '')) as description,
            'approved' as status,
            a.requested_at as entry_date,
            a.requested_at as created_at
          FROM advances a
          WHERE (a.rider_id = ${rider_id} OR a.cee_id = ${rider_id})
          AND a.status = 'approved'
          ORDER BY a.requested_at DESC
        `;
      }
      entries = [...entries, ...advances];
    } catch (e) {
      console.log('Advances query error (non-critical):', e);
    }

    // Fetch deductions and vehicle rent - get rider's cee_id first (filter by created_at for week determination)
    try {
      let deductions: any[] = [];
      
      // First get the rider info to find cee_id and vehicle rent
      const riderInfo = await sql`
        SELECT cee_id, full_name, vehicle_ownership, ev_weekly_rent, join_date FROM riders 
        WHERE user_id = ${rider_id} OR cee_id = ${rider_id}
        LIMIT 1
      `;
      
      const cee_id = riderInfo?.[0]?.cee_id || rider_id;
      const full_name = riderInfo?.[0]?.full_name || 'Unknown';
      const vehicleOwnership = riderInfo?.[0]?.vehicle_ownership;
      const evWeeklyRent = riderInfo?.[0]?.ev_weekly_rent || 0;
      
      // Parse and normalize join_date to midnight UTC for proper date comparison
      let riderJoinDate: Date | null = null;
      if (riderInfo?.[0]?.join_date) {
        const joinDateStr = riderInfo[0].join_date;
        // Parse as UTC date to avoid timezone issues
        const parsed = new Date(joinDateStr);
        riderJoinDate = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
      }
      
      if (start_date && end_date) {
        deductions = await sql`
          SELECT 
            d.id,
            d.rider_id,
            ${cee_id} as cee_id,
            ${full_name} as full_name,
            CASE 
              WHEN d.deduction_type ILIKE 'security%' THEN 'security_deposit'
              WHEN d.deduction_type ILIKE 'advance%' THEN 'advance'
              WHEN d.deduction_type ILIKE 'damage%' THEN 'damage'
              WHEN d.deduction_type ILIKE 'challan%' THEN 'challan'
              ELSE 'other'
            END as entry_type,
            COALESCE(d.amount, 0) as amount,
            COALESCE(d.description, '') as description,
            'approved' as status,
            d.deduction_date as entry_date,
            d.created_at
          FROM deductions d
          WHERE (d.rider_id = ${rider_id} OR d.rider_id = ${cee_id})
          AND DATE(d.deduction_date) BETWEEN ${start_date} AND ${end_date}
          ORDER BY d.deduction_date DESC
        `;
      } else {
        deductions = await sql`
          SELECT 
            d.id,
            d.rider_id,
            ${cee_id} as cee_id,
            ${full_name} as full_name,
            CASE 
              WHEN d.deduction_type ILIKE 'security%' THEN 'security_deposit'
              WHEN d.deduction_type ILIKE 'advance%' THEN 'advance'
              WHEN d.deduction_type ILIKE 'damage%' THEN 'damage'
              WHEN d.deduction_type ILIKE 'challan%' THEN 'challan'
              ELSE 'other'
            END as entry_type,
            COALESCE(d.amount, 0) as amount,
            COALESCE(d.description, '') as description,
            'approved' as status,
            d.deduction_date as entry_date,
            d.created_at
          FROM deductions d
          WHERE (d.rider_id = ${rider_id} OR d.rider_id = ${cee_id})
          ORDER BY d.deduction_date DESC
        `;
      }
      entries = [...entries, ...deductions];
      
      // Add vehicle rent deduction with prorate logic if it's a company vehicle
      if (vehicleOwnership === 'company_ev' && evWeeklyRent > 0 && start_date && end_date) {
        // Helper function to get which week a date falls into (based on day of month)
        const getWeekOfDate = (date: Date): number => {
          const dayOfMonth = date.getDate();
          
          // Week 1: 1-7
          if (dayOfMonth >= 1 && dayOfMonth <= 7) return 1;
          // Week 2: 8-14
          if (dayOfMonth >= 8 && dayOfMonth <= 14) return 2;
          // Week 3: 15-21
          if (dayOfMonth >= 15 && dayOfMonth <= 21) return 3;
          // Week 4: 22-31 (fixed at 7 days as per user request)
          return 4;
        };

        const startDateObj = new Date(start_date);
        const endDateObj = new Date(end_date);

        // Daily rate = weekly rent / 7
        const dailyRate = evWeeklyRent / 7;
        
        // Generate vehicle rent entries for each week in the date range
        let currentDate = new Date(startDateObj);
        const processedWeeks = new Set<string>();
        
        while (currentDate <= endDateObj) {
          const currentMonth = currentDate.getMonth();
          const currentYear = currentDate.getFullYear();
          const weekOfMonth = getWeekOfDate(currentDate);
          const weekKey = `${currentYear}-${currentMonth}-week${weekOfMonth}`;
          
          // Skip if we've already processed this week
          if (processedWeeks.has(weekKey)) {
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }
          processedWeeks.add(weekKey);
          
          // Determine week start and end dates based on month week definition
          let weekStart: Date, weekEnd: Date;
          
          if (weekOfMonth === 4) {
            // Week 4: Always starts from 22nd and goes to 28th (fixed 7 days)
            weekStart = new Date(currentYear, currentMonth, 22);
            weekEnd = new Date(currentYear, currentMonth, 28);
          } else {
            // Weeks 1-3: 7-day periods
            const startDay = (weekOfMonth - 1) * 7 + 1;
            weekStart = new Date(currentYear, currentMonth, startDay);
            weekEnd = new Date(currentYear, currentMonth, startDay + 6);
          }
          
          // Normalize dates to UTC for proper comparison (remove time component)
          const weekStartUTC = new Date(Date.UTC(weekStart.getUTCFullYear(), weekStart.getUTCMonth(), weekStart.getUTCDate()));
          const weekEndUTC = new Date(Date.UTC(weekEnd.getUTCFullYear(), weekEnd.getUTCMonth(), weekEnd.getUTCDate()));
          const startDateUTC = new Date(Date.UTC(startDateObj.getUTCFullYear(), startDateObj.getUTCMonth(), startDateObj.getUTCDate()));
          const endDateUTC = new Date(Date.UTC(endDateObj.getUTCFullYear(), endDateObj.getUTCMonth(), endDateObj.getUTCDate()));
          
          // Check if this week overlaps with the provided date range\n          if (weekEndUTC >= startDateUTC && weekStartUTC <= endDateUTC) {
            let rentAmount = evWeeklyRent;
            let description = 'Weekly vehicle rent - Company EV';
            
            // Apply prorate logic
            // Check if rider joined in this week (join_date >= week start AND join_date <= week end)
            if (riderJoinDate && riderJoinDate >= weekStartUTC && riderJoinDate <= weekEndUTC) {
              // Rider joined mid-week - calculate remaining days (including join date)
              const timeDiff = weekEndUTC.getTime() - riderJoinDate.getTime();
              const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
              rentAmount = Math.round((dailyRate * daysRemaining) * 100) / 100;
              description = `Prorated vehicle rent (${daysRemaining} days, joined ${riderJoinDate.toLocaleDateString()})`;
            } else if (riderJoinDate && riderJoinDate > weekEndUTC) {
              // Rider hasn't joined yet, skip this week
              currentDate.setDate(currentDate.getDate() + 7);
              continue;
            }
            
            // For Week 4, always charge full amount (7 days fixed)
            // No additional prorate needed as it's already defined
            
            // Create vehicle rent entry
            const vehicleRentEntry = {
              id: `vehicle-rent-${currentYear}-${currentMonth + 1}-week${weekOfMonth}-${Date.now()}`,
              rider_id: rider_id,
              cee_id: cee_id,
              full_name: full_name,
              entry_type: 'vehicle_rent',
              amount: rentAmount,
              description: description,
              status: 'auto-deducted',
              entry_date: weekStart.toISOString(),
              created_at: new Date().toISOString(),
              is_auto_calculated: true,
              week_of_month: weekOfMonth
            };
            
            entries.push(vehicleRentEntry);
          }
          
          // Move to next day to check next week
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    } catch (e) {
      console.log('Deductions query error (non-critical):', e);
    }

    // Sort by date descending
    entries.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error fetching rider entries:', error);
    return NextResponse.json({ entries: [] });
  }
}
