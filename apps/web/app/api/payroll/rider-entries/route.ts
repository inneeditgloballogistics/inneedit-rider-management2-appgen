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
        // If it's an ISO string like "2026-03-11T00:00:00.000Z", extract just the date part
        const datePart = joinDateStr.split('T')[0]; // "2026-03-11"
        const [year, month, day] = datePart.split('-').map(Number);
        riderJoinDate = new Date(Date.UTC(year, month - 1, day));
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
        // Parse dates properly - handle both ISO and YYYY-MM-DD formats
        let startDateObj: Date;
        let endDateObj: Date;
        
        if (typeof start_date === 'string') {
          const [year, month, day] = start_date.split('-').map(Number);
          startDateObj = new Date(Date.UTC(year, month - 1, day));
        } else {
          startDateObj = start_date instanceof Date ? start_date : new Date(start_date);
        }
        
        if (typeof end_date === 'string') {
          const [year, month, day] = end_date.split('-').map(Number);
          endDateObj = new Date(Date.UTC(year, month - 1, day));
        } else {
          endDateObj = end_date instanceof Date ? end_date : new Date(end_date);
        }

        console.log('🚗 Vehicle Rent Debug:', {
          rider_id,
          vehicleOwnership,
          evWeeklyRent,
          riderJoinDate: riderJoinDate?.toISOString().split('T')[0],
          startDate: startDateObj.toISOString().split('T')[0],
          endDate: endDateObj.toISOString().split('T')[0]
        });

        // Helper function to calculate week boundaries for a given date
        const getWeekBoundaries = (date: Date): { week: number; start: Date; end: Date } => {
          const dayOfMonth = date.getUTCDate();
          let weekNum: number;
          let startDay: number;
          let endDay: number;
          
          if (dayOfMonth >= 1 && dayOfMonth <= 7) {
            weekNum = 1;
            startDay = 1;
            endDay = 7;
          } else if (dayOfMonth >= 8 && dayOfMonth <= 14) {
            weekNum = 2;
            startDay = 8;
            endDay = 14;
          } else if (dayOfMonth >= 15 && dayOfMonth <= 21) {
            weekNum = 3;
            startDay = 15;
            endDay = 21;
          } else {
            weekNum = 4;
            startDay = 22;
            // Get last day of month
            const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
            endDay = lastDay;
          }
          
          const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), startDay));
          const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), endDay));
          
          return { week: weekNum, start, end };
        };

        // Daily rate = weekly rent / 7
        const dailyRate = evWeeklyRent / 7;
        
        // Generate vehicle rent entries for each week in the date range
        let currentDate = new Date(startDateObj);
        const processedWeeks = new Set<string>();
        
        while (currentDate <= endDateObj) {
          const { week: weekOfMonth, start: weekStart, end: weekEnd } = getWeekBoundaries(currentDate);
          const weekKey = `${currentDate.getUTCFullYear()}-${currentDate.getUTCMonth()}-week${weekOfMonth}`;
          
          // Skip if we've already processed this week
          if (processedWeeks.has(weekKey)) {
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            continue;
          }
          processedWeeks.add(weekKey);
          
          // Check if this week overlaps with the provided date range
          if (weekEnd >= startDateObj && weekStart <= endDateObj) {
            console.log(`📅 Week ${weekOfMonth}:`, {
              weekStart: weekStart.toISOString().split('T')[0],
              weekEnd: weekEnd.toISOString().split('T')[0],
              riderJoinDate: riderJoinDate?.toISOString().split('T')[0]
            });
            
            // Skip if rider hasn't joined yet (joined AFTER this week ends)
            if (riderJoinDate && riderJoinDate > weekEnd) {
              console.log(`⏭️  Rider hasn't joined yet`);
              currentDate.setUTCDate(currentDate.getUTCDate() + 7);
              continue;
            }
            
            let rentAmount = evWeeklyRent;
            let description = 'Weekly vehicle rent - Company EV';
            
            // Apply prorate logic if rider joined during this week
            if (riderJoinDate && riderJoinDate >= weekStart && riderJoinDate <= weekEnd) {
              // Rider joined THIS week - count days from join date through week end (inclusive)
              const daysWorked = Math.floor((weekEnd.getTime() - riderJoinDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              rentAmount = Math.round((dailyRate * daysWorked) * 100) / 100;
              description = `Prorated vehicle rent (${daysWorked} days - from ${riderJoinDate.toISOString().split('T')[0]})`;
              console.log(`💰 Prorated Week ${weekOfMonth}: ${daysWorked} days × ₹${dailyRate.toFixed(2)} = ₹${rentAmount}`);
            } else {
              console.log(`💰 Full rent Week ${weekOfMonth}: ₹${rentAmount}`);
            }
            // else: rider joined before this week, charge full amount
            
            // Create vehicle rent entry
            const vehicleRentEntry = {
              id: `vehicle-rent-${weekStart.getUTCFullYear()}-${weekStart.getUTCMonth() + 1}-week${weekOfMonth}-${Date.now()}`,
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
            console.log(`✅ Added vehicle rent entry for week ${weekOfMonth}`);
          }
          
          // Move to next day to check next week
          currentDate.setUTCDate(currentDate.getUTCDate() + 1);
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
