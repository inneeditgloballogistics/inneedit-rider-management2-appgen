import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { rider_id, start_date, end_date } = await request.json();

    console.log("=== RIDER-ENTRIES API ===");
    console.log("Received rider_id:", rider_id);
    console.log("Received start_date:", start_date);
    console.log("Received end_date:", end_date);

    if (!rider_id) {
      return NextResponse.json({ entries: [] });
    }

    // First, resolve rider_id to cee_id (in case rider_id is a user_id)
    let resolvedCeeId = rider_id;
    try {
      const riderResolve = await sql`SELECT cee_id FROM riders WHERE user_id = ${rider_id} OR cee_id = ${rider_id} LIMIT 1`;
      if (riderResolve?.[0]?.cee_id) {
        resolvedCeeId = riderResolve[0].cee_id;
        console.log("Resolved rider_id to cee_id:", resolvedCeeId);
      }
    } catch (e) {
      console.log("Could not resolve cee_id, using rider_id as-is");
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
          WHERE (r.referrer_cee_id = ${resolvedCeeId} OR r.referrer_id = ${resolvedCeeId} OR r.referrer_id = ${rider_id})
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
          WHERE (r.referrer_cee_id = ${resolvedCeeId} OR r.referrer_id = ${resolvedCeeId} OR r.referrer_id = ${rider_id})
          AND r.approval_status = 'approved'
          ORDER BY r.created_at DESC
        `;
      }
      entries = [...entries, ...referrals];
      console.log("Referrals found:", referrals.length);
    } catch (e) {
      console.log('Referrals query error (non-critical):', e);
    }

    // Fetch incentives (filter by incentive_date for week determination)
    try {
      let incentives: any[] = [];
      if (start_date && end_date) {
        incentives = await sql`
          SELECT 
            i.id,
            i.rider_id,
            COALESCE(i.cee_id, 'N/A') as cee_id,
            COALESCE(r.full_name, 'Unknown') as full_name,
            'incentive' as entry_type,
            COALESCE(i.amount, 0) as amount,
            CONCAT(COALESCE(i.incentive_type, 'Incentive'), ': ', COALESCE(i.description, '')) as description,
            'approved' as status,
            i.incentive_date as entry_date,
            i.created_at
          FROM incentives i
          LEFT JOIN riders r ON i.rider_id = r.user_id OR i.rider_id = r.cee_id
          WHERE i.cee_id = ${cee_id}
          AND DATE(i.incentive_date) BETWEEN ${start_date} AND ${end_date}
          ORDER BY i.incentive_date DESC
        `;
      } else {
        incentives = await sql`
          SELECT 
            i.id,
            i.rider_id,
            COALESCE(i.cee_id, 'N/A') as cee_id,
            COALESCE(r.full_name, 'Unknown') as full_name,
            'incentive' as entry_type,
            COALESCE(i.amount, 0) as amount,
            CONCAT(COALESCE(i.incentive_type, 'Incentive'), ': ', COALESCE(i.description, '')) as description,
            'approved' as status,
            i.incentive_date as entry_date,
            i.created_at
          FROM incentives i
          LEFT JOIN riders r ON i.rider_id = r.user_id OR i.rider_id = r.cee_id
          WHERE i.cee_id = ${cee_id}
          ORDER BY i.incentive_date DESC
        `;
      }
      entries = [...entries, ...incentives];
      console.log("Incentives found:", incentives.length);
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
          WHERE a.cee_id = ${cee_id}
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
          WHERE a.cee_id = ${cee_id}
          AND a.status = 'approved'
          ORDER BY a.requested_at DESC
        `;
      }
      entries = [...entries, ...advances];
      console.log("Advances found:", advances.length);
    } catch (e) {
      console.log('Advances query error (non-critical):', e);
    }

    // Fetch deductions and vehicle rent - get rider's cee_id first (filter by created_at for week determination)
    try {
      let deductions: any[] = [];
      
      // First get the rider info to find cee_id and vehicle rent (already resolved above)
      const riderInfo = await sql`
        SELECT cee_id, full_name, vehicle_ownership, ev_daily_rent, ev_type, join_date FROM riders 
        WHERE user_id = ${rider_id} OR cee_id = ${rider_id} OR cee_id = ${resolvedCeeId}
        LIMIT 1
      `;
      
      console.log('🔍 Rider Info Query - Searching for rider_id:', rider_id, 'and cee_id:', resolvedCeeId);
      console.log('🔍 Rider Info Found:', riderInfo);
      
      const cee_id = riderInfo?.[0]?.cee_id || rider_id;
      const full_name = riderInfo?.[0]?.full_name || 'Unknown';
      const vehicleOwnership = riderInfo?.[0]?.vehicle_ownership;
      const storedEvDailyRent = riderInfo?.[0]?.ev_daily_rent || null;
      const evType = riderInfo?.[0]?.ev_type; // Get the EV type (sunmobility_swap or fixed_battery)
      
      console.log('🔍 Rider Details:', { cee_id, full_name, vehicleOwnership, evType, storedEvDailyRent });
      
      // Parse and normalize join_date to midnight UTC for proper date comparison
      let riderJoinDate: Date | null = null;
      if (riderInfo?.[0]?.join_date) {
        const joinDateStr = riderInfo[0].join_date;
        console.log('🔍 Parsing join_date:', joinDateStr);
        
        // Handle ISO string format "2026-03-01T00:00:00.000Z"
        const dateObj = new Date(joinDateStr);
        if (!isNaN(dateObj.getTime())) {
          // Extract the UTC date components
          const year = dateObj.getUTCFullYear();
          const month = dateObj.getUTCMonth() + 1;
          const day = dateObj.getUTCDate();
          riderJoinDate = new Date(Date.UTC(year, month - 1, day));
          console.log('✅ Parsed join_date to:', riderJoinDate.toISOString().split('T')[0]);
        } else {
          console.warn('⚠️ Invalid join_date format:', joinDateStr);
        }
      }
      
      console.log("🔍 Deductions Query Debug - Looking for rider_id:", rider_id, "or cee_id:", cee_id);
      
      console.log("🔍 === DEDUCTIONS QUERY DEBUG ===");
      console.log("Looking for deductions with rider_id:", rider_id, "or cee_id:", cee_id, "or resolvedCeeId:", resolvedCeeId);
      
      if (start_date && end_date) {
        console.log("🔍 Date range query: start_date =", start_date, "end_date =", end_date);
        console.log("🔍 Query will match deductions WHERE cee_id =", cee_id);
        
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
          WHERE d.cee_id = ${cee_id}
          AND DATE(d.deduction_date) BETWEEN ${start_date} AND ${end_date}
          ORDER BY d.deduction_date DESC
        `;
        console.log("✅ Deductions with dates found:", deductions.length);
        console.log("✅ Deduction details:", JSON.stringify(deductions, null, 2));
      } else {
        console.log("🔍 No date range - fetching all deductions");
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
          WHERE d.cee_id = ${cee_id}
          ORDER BY d.deduction_date DESC
        `;
        console.log("✅ All deductions found:", deductions.length);
      }
      console.log("=== TOTAL DEDUCTIONS FOUND:", deductions.length);
      entries = [...entries, ...deductions];
      
      // Add daily vehicle rent deduction if it's a company vehicle
      if (vehicleOwnership === 'company_ev' && start_date && end_date) {
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

        // Determine daily rent: use stored value first, then default based on EV type
        let dailyRent = 0;
        let evTypeLabel = '';
        
        if (storedEvDailyRent && storedEvDailyRent > 0) {
          dailyRent = Number(storedEvDailyRent);
          evTypeLabel = evType === 'sunmobility_swap' ? 'Sunmobility Swap' : 'Fixed Battery';
        } else if (evType === 'sunmobility_swap') {
          dailyRent = 243;
          evTypeLabel = 'Sunmobility Swap';
        } else if (evType === 'fixed_battery') {
          dailyRent = 215;
          evTypeLabel = 'Fixed Battery';
        } else {
          // Don't generate entries if we can't determine daily rent
          console.log('⚠️ Cannot determine daily rent for rider:', { evType, storedEvDailyRent });
          dailyRent = 0;
        }

        console.log('🚗 Vehicle Rent Debug:', {
          rider_id,
          cee_id,
          vehicleOwnership,
          evType,
          storedEvDailyRent,
          evTypeLabel,
          dailyRent,
          willGenerate: dailyRent > 0,
          riderJoinDate: riderJoinDate?.toISOString().split('T')[0],
          weekStart: startDateObj.toISOString().split('T')[0],
          weekEnd: endDateObj.toISOString().split('T')[0],
          dateComparison: {
            riderJoinDateMs: riderJoinDate?.getTime(),
            weekStartMs: startDateObj.getTime(),
            riderJoinedBeforeWeek: riderJoinDate && startDateObj ? riderJoinDate.getTime() <= startDateObj.getTime() : 'no join date'
          }
        });

        // Only generate if dailyRent > 0
        if (dailyRent > 0) {
          // Generate daily vehicle rent entries
          let currentDate = new Date(startDateObj);
          let daysAdded = 0;
          
          while (currentDate <= endDateObj) {
            // Skip if rider hasn't joined yet
            if (riderJoinDate && currentDate < riderJoinDate) {
              console.log(`⏭️  Skipping ${currentDate.toISOString().split('T')[0]} - rider hasn't joined yet (join_date: ${riderJoinDate.toISOString().split('T')[0]})`);
              currentDate.setUTCDate(currentDate.getUTCDate() + 1);
              continue;
            }

            // Create daily vehicle rent entry
            const dateStr = currentDate.toISOString().split('T')[0];
            const vehicleRentEntry = {
              id: `vehicle-rent-${rider_id}-${dateStr}`,
              rider_id: rider_id,
              cee_id: cee_id,
              full_name: full_name,
              entry_type: 'vehicle_rent',
              amount: dailyRent,
              description: `${evTypeLabel} (${dateStr})`,
              status: 'auto-deducted',
              entry_date: dateStr,
              created_at: (() => {
                const now = new Date();
                const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
                return istTime.toISOString();
              })(),
              is_auto_calculated: true
            };
            
            entries.push(vehicleRentEntry);
            daysAdded++;
            console.log(`✅ Added vehicle rent for ${dateStr}: ₹${dailyRent}`);
            
            // Move to next day
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
          }
          
          console.log(`📊 Total vehicle rent days added for ${cee_id}: ${daysAdded} days`);
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
