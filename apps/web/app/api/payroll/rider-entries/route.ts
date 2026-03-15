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

    // Fetch additions (referrals, incentives, bonuses, etc.)
    try {
      let additions: any[] = [];
      if (start_date && end_date) {
        additions = await sql`
          SELECT 
            a.id,
            ${resolvedCeeId} as rider_id,
            COALESCE(${resolvedCeeId}, 'N/A') as cee_id,
            COALESCE((SELECT full_name FROM riders WHERE cee_id = ${resolvedCeeId} LIMIT 1), 'Unknown') as full_name,
            a.entry_type,
            COALESCE(a.amount, 0) as amount,
            COALESCE(a.description, '') as description,
            'approved' as status,
            a.entry_date as entry_date,
            a.created_at
          FROM additions a
          WHERE a.cee_id = ${resolvedCeeId}
          AND DATE(a.entry_date) BETWEEN ${start_date} AND ${end_date}
          ORDER BY a.entry_date DESC
        `;
      } else {
        additions = await sql`
          SELECT 
            a.id,
            ${resolvedCeeId} as rider_id,
            COALESCE(${resolvedCeeId}, 'N/A') as cee_id,
            COALESCE((SELECT full_name FROM riders WHERE cee_id = ${resolvedCeeId} LIMIT 1), 'Unknown') as full_name,
            a.entry_type,
            COALESCE(a.amount, 0) as amount,
            COALESCE(a.description, '') as description,
            'approved' as status,
            a.entry_date as entry_date,
            a.created_at
          FROM additions a
          WHERE a.cee_id = ${resolvedCeeId}
          ORDER BY a.entry_date DESC
        `;
      }
      entries = [...entries, ...additions];
      console.log("Additions found:", additions.length);
    } catch (e) {
      console.log('Additions query error (non-critical):', e);
    }
    // Fetch deductions and vehicle rent
    try {
      let deductions: any[] = [];
      
      // First get the rider info to find cee_id and vehicle rent
      const riderInfo = await sql`
        SELECT cee_id, full_name, vehicle_ownership, ev_daily_rent, ev_type, join_date, is_leader, leader_discount_percentage FROM riders 
        WHERE user_id = ${rider_id} OR cee_id = ${rider_id} OR cee_id = ${resolvedCeeId}
        LIMIT 1
      `;
      
      console.log('Rider Info Query - Searching for rider_id:', rider_id, 'and cee_id:', resolvedCeeId);
      console.log('Rider Info Found:', riderInfo);
      
      const cee_id = riderInfo?.[0]?.cee_id || rider_id;
      const full_name = riderInfo?.[0]?.full_name || 'Unknown';
      const vehicleOwnership = riderInfo?.[0]?.vehicle_ownership;
      const storedEvDailyRent = riderInfo?.[0]?.ev_daily_rent || null;
      const evType = riderInfo?.[0]?.ev_type; // Get the EV type (sunmobility_swap or fixed_battery)
      const isLeader = riderInfo?.[0]?.is_leader || false; // Check if rider is a leader
      const leaderDiscountPercentage = riderInfo?.[0]?.leader_discount_percentage || 0; // Get leader discount percentage
      
      console.log('Rider Details:', { cee_id, full_name, vehicleOwnership, evType, storedEvDailyRent });
      
      // Parse and normalize join_date to midnight UTC for proper date comparison
      let riderJoinDate: Date | null = null;
      if (riderInfo?.[0]?.join_date) {
        const joinDateStr = riderInfo[0].join_date;
        console.log('Parsing join_date:', joinDateStr);
        
        // Handle ISO string format "2026-03-01T00:00:00.000Z"
        const dateObj = new Date(joinDateStr);
        if (!isNaN(dateObj.getTime())) {
          // Extract the UTC date components
          const year = dateObj.getUTCFullYear();
          const month = dateObj.getUTCMonth() + 1;
          const day = dateObj.getUTCDate();
          riderJoinDate = new Date(Date.UTC(year, month - 1, day));
          console.log('Parsed join_date to:', riderJoinDate.toISOString().split('T')[0]);
        } else {
          console.warn('Invalid join_date format:', joinDateStr);
        }
      }
      
      console.log("Deductions Query Debug - Looking for rider_id:", rider_id, "or cee_id:", cee_id);
      
      console.log("=== DEDUCTIONS QUERY DEBUG ===");
      console.log("Looking for deductions with rider_id:", rider_id, "or cee_id:", cee_id, "or resolvedCeeId:", resolvedCeeId);
      
      if (start_date && end_date) {
        deductions = await sql`
          SELECT 
            d.id,
            ${resolvedCeeId} as rider_id,
            ${resolvedCeeId} as cee_id,
            ${full_name} as full_name,
            d.entry_type,
            COALESCE(d.amount, 0) as amount,
            COALESCE(d.description, '') as description,
            d.status,
            d.entry_date as entry_date,
            d.created_at
          FROM deductions d
          WHERE d.cee_id = ${resolvedCeeId}
          AND d.status = 'approved'
          AND DATE(d.entry_date) BETWEEN ${start_date} AND ${end_date}
          ORDER BY d.entry_date DESC
        `;
      } else {
        deductions = await sql`
          SELECT 
            d.id,
            ${resolvedCeeId} as rider_id,
            ${resolvedCeeId} as cee_id,
            ${full_name} as full_name,
            d.entry_type,
            COALESCE(d.amount, 0) as amount,
            COALESCE(d.description, '') as description,
            d.status,
            d.entry_date as entry_date,
            d.created_at
          FROM deductions d
          WHERE d.cee_id = ${resolvedCeeId}
          AND d.status = 'approved'
          ORDER BY d.entry_date DESC
        `;
      }
      console.log("=== TOTAL DEDUCTIONS FOUND:", deductions.length);
      entries = [...entries, ...deductions];
      
      // Fetch vehicle rent from database instead of calculating dynamically
      if (vehicleOwnership === 'company_ev' && start_date && end_date) {
        try {
          // Parse dates properly - handle both ISO and YYYY-MM-DD formats
          let startDateStr: string;
          let endDateStr: string;
          
          if (typeof start_date === 'string') {
            startDateStr = start_date;
          } else {
            const d = start_date instanceof Date ? start_date : new Date(start_date);
            startDateStr = d.toISOString().split('T')[0];
          }
          
          if (typeof end_date === 'string') {
            endDateStr = end_date;
          } else {
            const d = end_date instanceof Date ? end_date : new Date(end_date);
            endDateStr = d.toISOString().split('T')[0];
          }
          
          console.log('Fetching vehicle rent from database for', {cee_id, startDateStr, endDateStr, riderJoinDate: riderJoinDate?.toISOString().split('T')[0]});
          
          // Fetch vehicle rent records from database - ONLY if rent_date >= rider's join_date
          const vehicleRentRecords = await sql`
            SELECT 
              id,
              cee_id,
              rent_date,
              base_daily_rent,
              discount_percentage,
              daily_rent_amount,
              description,
              status,
              created_at
            FROM vehicle_rent
            WHERE cee_id = ${resolvedCeeId}
            AND rent_date >= ${startDateStr}::date
            AND rent_date <= ${endDateStr}::date
            AND (${riderJoinDate ? riderJoinDate.toISOString().split('T')[0] : '1900-01-01'}::date IS NULL OR rent_date >= ${riderJoinDate ? riderJoinDate.toISOString().split('T')[0] : '1900-01-01'}::date)
            ORDER BY rent_date DESC
          `;
          console.log('Vehicle rent records found:', vehicleRentRecords.length);
          // Add vehicle rent entries from database - CALCULATE amount dynamically from parameters
          for (const record of vehicleRentRecords) {
            // Calculate the amount dynamically: base * (1 - discount/100)
            const baseDailyRent = parseFloat(record.base_daily_rent) || 0;
            const discountPercentage = parseFloat(record.discount_percentage) || 0;
            const calculatedAmount = baseDailyRent * (1 - discountPercentage / 100);
            
            const vehicleRentEntry = {
              id: record.id,
              rider_id: rider_id,
              cee_id: resolvedCeeId,
              full_name: full_name,
              entry_type: 'vehicle_rent',
              amount: calculatedAmount,
              description: `Vehicle Rent (${record.rent_date}) - Base: ₹${baseDailyRent}, Discount: ${discountPercentage}%`,
              status: 'auto-deducted',
              entry_date: record.rent_date,
              created_at: record.created_at,
              is_from_database: true
            };
            
            entries.push(vehicleRentEntry);
            console.log('Added vehicle rent from DB for', record.rent_date, ': Rs', calculatedAmount, '(Base:', baseDailyRent, '- Discount:', discountPercentage + '%)');
          }
        } catch (e) {
          console.log('Vehicle rent fetch error (non-critical):', e);
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
