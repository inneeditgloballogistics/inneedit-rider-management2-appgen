import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referral_id } = body;

    // Get referral details
    const referral = await sql`
      SELECT * FROM referrals WHERE id = ${referral_id}
    `;

    if (referral.length === 0) {
      return NextResponse.json({ eligible: false, reason: 'Referral not found' });
    }

    const ref = referral[0];

    // Check if approval status is approved
    if (ref.approval_status !== 'approved') {
      return NextResponse.json({ eligible: false, reason: 'Referral not approved' });
    }

    // Check if 30 days have passed since approval
    // Use CURRENT_TIMESTAMP from DB which is IST
    const currentDate = new Date();
    const monthCompletionDate = new Date(ref.month_completion_date);

    if (currentDate < monthCompletionDate) {
      return NextResponse.json({ 
        eligible: false, 
        reason: 'Rider completion period not yet done',
        daysRemaining: Math.ceil((monthCompletionDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
      });
    }

    // Check if referred rider exists and their status
    const referredRider = await sql`
      SELECT status, created_at FROM riders WHERE cee_id = ${ref.referred_rider_id} OR user_id = ${ref.referred_rider_id}
    `;

    if (referredRider.length === 0) {
      return NextResponse.json({ 
        eligible: false, 
        reason: 'Referred rider not found or inactive'
      });
    }

    const rider = referredRider[0];

    // Check if rider is still active
    if (rider.status !== 'active') {
      return NextResponse.json({ 
        eligible: false, 
        reason: 'Referred rider is inactive or left'
      });
    }

    // Check if rider has been working for the entire 30 days (no long inactivity)
    const riderCreatedDate = new Date(rider.created_at);
    const thirtyDaysFromRiderCreation = new Date(riderCreatedDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Check orders count in last 30 days to verify activity
    const recentOrders = await sql`
      SELECT COUNT(*) as count FROM orders 
      WHERE rider_id = ${ref.referred_rider_id} 
      AND DATE(order_date) >= CURRENT_DATE - INTERVAL '30 days'
    `;

    const orderCount = parseInt(recentOrders[0].count || 0);

    if (orderCount === 0) {
      return NextResponse.json({ 
        eligible: false, 
        reason: 'Referred rider has no orders in the last 30 days'
      });
    }

    // If all checks pass, rider is eligible for the reward
    return NextResponse.json({ 
      eligible: true, 
      reason: 'Rider is eligible for the referral reward',
      orderCount,
      riderStatus: rider.status
    });

  } catch (error) {
    console.error('Error checking referral eligibility:', error);
    return NextResponse.json({ error: 'Failed to check referral eligibility' }, { status: 500 });
  }
}
