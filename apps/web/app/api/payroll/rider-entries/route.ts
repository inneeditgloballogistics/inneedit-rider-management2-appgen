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
      
      // First get the rider info to find cee_id
      const riderInfo = await sql`
        SELECT cee_id, full_name, vehicle_ownership, join_date FROM riders 
        WHERE user_id = ${rider_id} OR cee_id = ${rider_id} OR cee_id = ${resolvedCeeId}
        LIMIT 1
      `;
      
      console.log('Rider Info Query - Searching for rider_id:', rider_id, 'and cee_id:', resolvedCeeId);
      console.log('Rider Info Found:', riderInfo);
      
      const cee_id = riderInfo?.[0]?.cee_id || rider_id;
      const full_name = riderInfo?.[0]?.full_name || 'Unknown';
      const vehicleOwnership = riderInfo?.[0]?.vehicle_ownership;
      
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
      
      // Calculate vehicle rent dynamically based on rider settings - OPTION 1
      if (vehicleOwnership === 'company_ev' && start_date && end_date) {
        try {
          // Parse dates properly
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
          
          console.log('Calculating vehicle rent dynamically for', {cee_id: resolvedCeeId, startDateStr, endDateStr, riderJoinDate: riderJoinDate?.toISOString().split('T')[0]});\n          
          // Fetch latest rider settings for vehicle rent calculation\n          const riderSettings = await sql`\n            SELECT \n              ev_daily_rent,\n              ev_type,\n              is_leader,\n              leader_discount_percentage,\n              join_date\n            FROM riders\n            WHERE cee_id = ${resolvedCeeId}\n            LIMIT 1\n          `;\n          \n          if (riderSettings && riderSettings.length > 0) {\n            const settings = riderSettings[0];\n            const startDate = new Date(`${startDateStr}T00:00:00Z`);\n            const endDate = new Date(`${endDateStr}T00:00:00Z`);\n            \n            // Generate vehicle rent entries for each day from start to end\n            let currentDate = new Date(startDate);\n            const vehicleRentEntries: any[] = [];\n            \n            while (currentDate <= endDate) {\n              const dateStr = currentDate.toISOString().split('T')[0];\n              \n              // Check if rider was active on this date (on or after join_date)\n              let shouldInclude = true;\n              if (riderJoinDate) {\n                shouldInclude = currentDate >= riderJoinDate;\n              }\n              \n              if (shouldInclude) {\n                // Calculate base daily rent\n                let baseDailyRent = 0;\n                if (settings.ev_daily_rent && settings.ev_daily_rent > 0) {\n                  baseDailyRent = Number(settings.ev_daily_rent);\n                } else if (settings.ev_type === 'sunmobility_swap') {\n                  baseDailyRent = 243;\n                } else if (settings.ev_type === 'fixed_battery') {\n                  baseDailyRent = 215;\n                }\n                \n                // Apply leader discount if applicable\n                let dailyVehicleRentAmount = baseDailyRent;\n                const isLeader = settings.is_leader || false;\n                const leaderDiscountPercentage = settings.leader_discount_percentage || 0;\n                \n                if (isLeader && leaderDiscountPercentage > 0) {\n                  const discountAmount = baseDailyRent * (leaderDiscountPercentage / 100);\n                  dailyVehicleRentAmount = baseDailyRent - discountAmount;\n                }\n                \n                const vehicleRentEntry = {\n                  id: `vr_${dateStr.replace(/-/g, '')}_${resolvedCeeId}`.substring(0, 50),\n                  rider_id: rider_id,\n                  cee_id: resolvedCeeId,\n                  full_name: full_name,\n                  entry_type: 'vehicle_rent',\n                  amount: dailyVehicleRentAmount,\n                  description: `${settings.ev_type === 'sunmobility_swap' ? 'Sunmobility Swap' : 'Fixed Battery'} (${dateStr})`,\n                  status: 'auto-deducted',\n                  entry_date: dateStr,\n                  created_at: new Date().toISOString(),\n                  is_calculated: true\n                };\n                \n                vehicleRentEntries.push(vehicleRentEntry);\n                console.log(`Added vehicle rent for ${dateStr}: ₹${dailyVehicleRentAmount}`);\n              }\n              \n              // Move to next day\n              currentDate.setUTCDate(currentDate.getUTCDate() + 1);\n            }\n            \n            entries = [...entries, ...vehicleRentEntries];\n            console.log(`Total vehicle rent entries calculated: ${vehicleRentEntries.length}`);\n          }\n        } catch (e) {\n          console.log('Vehicle rent calculation error (non-critical):', e);\n        }\n      }
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
