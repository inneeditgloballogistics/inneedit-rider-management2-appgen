import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { 
      filterType = 'all', // 'all', 'positive', 'negative'
      startDate = null, 
      endDate = null,
      week = null, // 1, 2, 3, 4 (for current month)
      month = new Date().getMonth() + 1,
      year = new Date().getFullYear()
    } = await request.json();

    let startDateFilter = startDate;
    let endDateFilter = endDate;

    // Determine date range based on week or date selection
    if (week) {
      // Calculate date range for the week in the given month/year
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      
      // Week 1: 1-7, Week 2: 8-14, Week 3: 15-21, Week 4: 22-28, Week 5: 29-31
      const weekNum = parseInt(week);
      const dayStart = (weekNum - 1) * 7 + 1;
      const dayEnd = Math.min(weekNum * 7, lastDay.getDate());
      
      const startDateObj = new Date(year, month - 1, dayStart);
      const endDateObj = new Date(year, month - 1, dayEnd);
      
      startDateFilter = startDateObj.toISOString().split('T')[0];
      endDateFilter = endDateObj.toISOString().split('T')[0];
    }

    // Fetch additions (referrals, incentives)
    let additions: any[] = [];
    if (startDateFilter && endDateFilter) {
      additions = await sql`
        SELECT 
          'addition' as entry_category,
          CASE WHEN entry_type = 'referral' THEN 'Referral' ELSE 'Incentive' END as entry_type,
          amount,
          cee_id,
          description,
          entry_date,
          created_at
        FROM additions
        WHERE DATE(entry_date) >= ${startDateFilter}::DATE AND DATE(entry_date) <= ${endDateFilter}::DATE
        ORDER BY entry_date DESC, created_at DESC
      `;
    } else if (startDateFilter) {
      additions = await sql`
        SELECT 
          'addition' as entry_category,
          CASE WHEN entry_type = 'referral' THEN 'Referral' ELSE 'Incentive' END as entry_type,
          amount,
          cee_id,
          description,
          entry_date,
          created_at
        FROM additions
        WHERE DATE(entry_date) = ${startDateFilter}::DATE
        ORDER BY entry_date DESC, created_at DESC
      `;
    } else {
      additions = await sql`
        SELECT 
          'addition' as entry_category,
          CASE WHEN entry_type = 'referral' THEN 'Referral' ELSE 'Incentive' END as entry_type,
          amount,
          cee_id,
          description,
          entry_date,
          created_at
        FROM additions
        ORDER BY entry_date DESC, created_at DESC
      `;
    }

    // Fetch deductions
    let deductions: any[] = [];
    if (startDateFilter && endDateFilter) {
      deductions = await sql`
        SELECT 
          'deduction' as entry_category,
          CASE 
            WHEN entry_type = 'advance' THEN 'Advance'
            WHEN entry_type = 'damage' THEN 'Damage'
            WHEN entry_type = 'challan' THEN 'Challan'
            ELSE entry_type
          END as entry_type,
          amount,
          cee_id,
          description,
          entry_date,
          created_at
        FROM deductions
        WHERE DATE(entry_date) >= ${startDateFilter}::DATE AND DATE(entry_date) <= ${endDateFilter}::DATE
        ORDER BY entry_date DESC, created_at DESC
      `;
    } else if (startDateFilter) {
      deductions = await sql`
        SELECT 
          'deduction' as entry_category,
          CASE 
            WHEN entry_type = 'advance' THEN 'Advance'
            WHEN entry_type = 'damage' THEN 'Damage'
            WHEN entry_type = 'challan' THEN 'Challan'
            ELSE entry_type
          END as entry_type,
          amount,
          cee_id,
          description,
          entry_date,
          created_at
        FROM deductions
        WHERE DATE(entry_date) = ${startDateFilter}::DATE
        ORDER BY entry_date DESC, created_at DESC
      `;
    } else {
      deductions = await sql`
        SELECT 
          'deduction' as entry_category,
          CASE 
            WHEN entry_type = 'advance' THEN 'Advance'
            WHEN entry_type = 'damage' THEN 'Damage'
            WHEN entry_type = 'challan' THEN 'Challan'
            ELSE entry_type
          END as entry_type,
          amount,
          cee_id,
          description,
          entry_date,
          created_at
        FROM deductions
        ORDER BY entry_date DESC, created_at DESC
      `;
    }

    // Get rider details for all cee_ids
    const allCeeIds = Array.from(
      new Set([
        ...additions.map((a: any) => a.cee_id),
        ...deductions.map((d: any) => d.cee_id)
      ])
    );

    const riderDetails: any = {};
    if (allCeeIds.length > 0) {
      const riders = await sql`
        SELECT cee_id, full_name, phone FROM riders WHERE cee_id = ANY(${allCeeIds})
      `;
      riders.forEach((rider: any) => {
        riderDetails[rider.cee_id] = { name: rider.full_name, phone: rider.phone };
      });
    }

    // Combine and filter entries
    let entries: any[] = [
      ...additions.map((a: any) => ({
        entry_category: a.entry_category,
        entry_type: a.entry_type,
        amount: parseFloat(a.amount),
        cee_id: a.cee_id,
        rider_name: riderDetails[a.cee_id]?.name || 'Unknown',
        phone: riderDetails[a.cee_id]?.phone || 'N/A',
        description: a.description,
        entry_date: a.entry_date,
        created_at: a.created_at
      })),
      ...deductions.map((d: any) => ({
        entry_category: d.entry_category,
        entry_type: d.entry_type,
        amount: parseFloat(d.amount),
        cee_id: d.cee_id,
        rider_name: riderDetails[d.cee_id]?.name || 'Unknown',
        phone: riderDetails[d.cee_id]?.phone || 'N/A',
        description: d.description,
        entry_date: d.entry_date,
        created_at: d.created_at
      }))
    ];

    // Apply filter type
    if (filterType === 'positive') {
      entries = entries.filter(e => e.entry_category === 'addition');
    } else if (filterType === 'negative') {
      entries = entries.filter(e => e.entry_category === 'deduction');
    }

    // Sort by date descending
    entries.sort((a, b) => {
      const dateA = new Date(a.entry_date).getTime();
      const dateB = new Date(b.entry_date).getTime();
      return dateB - dateA;
    });

    // Calculate totals
    const positiveTotal = entries
      .filter(e => e.entry_category === 'addition')
      .reduce((sum, e) => sum + e.amount, 0);

    const negativeTotal = entries
      .filter(e => e.entry_category === 'deduction')
      .reduce((sum, e) => sum + e.amount, 0);

    return NextResponse.json({
      entries,
      totals: {
        positive: positiveTotal,
        negative: negativeTotal,
        net: positiveTotal - negativeTotal
      },
      count: entries.length,
      success: true
    });
  } catch (error: any) {
    console.error("Error fetching all entries:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch entries" },
      { status: 500 }
    );
  }
}
