import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/analytics - Get analytics data
export async function GET() {
  try {
    // Get basic counts
    const [
      totalMissing,
      totalFound,
      totalMatches,
      reunifications,
      openCases,
      pendingVerification,
      matchResults,
      missingChildren,
    ] = await Promise.all([
      db.missingChild.count(),
      db.foundChild.count(),
      db.matchResult.count(),
      db.foundChild.count({ where: { status: 'reunited' } }),
      db.case.count({ where: { status: { in: ['open', 'investigating'] } } }),
      db.matchResult.count({ where: { status: 'pending' } }),
      db.matchResult.findMany({
        select: { similarityScore: true, confidence: true, createdAt: true },
      }),
      db.missingChild.findMany({
        select: { lastSeenLocation: true, createdAt: true },
      }),
    ]);

    // Calculate average match score
    const avgMatchScore =
      matchResults.length > 0
        ? Math.round(
            matchResults.reduce((sum, m) => sum + m.similarityScore, 0) /
              matchResults.length
          )
        : 0;

    // Match confidence distribution
    const matchConfidence = {
      high: matchResults.filter((m) => m.confidence === 'high').length,
      medium: matchResults.filter((m) => m.confidence === 'medium').length,
      low: matchResults.filter((m) => m.confidence === 'low').length,
    };

    // Monthly data - group by YYYY-MM from createdAt
    const foundChildren = await db.foundChild.findMany({
      select: { createdAt: true },
    });

    const monthlyMap: Record<string, { missing: number; found: number; matched: number }> = {};

    // Process missing children by month
    for (const child of missingChildren) {
      const month = child.createdAt.toISOString().slice(0, 7);
      if (!monthlyMap[month]) monthlyMap[month] = { missing: 0, found: 0, matched: 0 };
      monthlyMap[month].missing++;
    }

    // Process found children by month
    for (const child of foundChildren) {
      const month = child.createdAt.toISOString().slice(0, 7);
      if (!monthlyMap[month]) monthlyMap[month] = { missing: 0, found: 0, matched: 0 };
      monthlyMap[month].found++;
    }

    // Process match results by month
    for (const match of matchResults) {
      const month = match.createdAt.toISOString().slice(0, 7);
      if (!monthlyMap[month]) monthlyMap[month] = { missing: 0, found: 0, matched: 0 };
      monthlyMap[month].matched++;
    }

    // Sort months and convert to array
    const monthlyData = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));

    // Region data - group by lastSeenLocation
    const regionMap: Record<string, number> = {};
    for (const child of missingChildren) {
      // Extract city from location (take first part before comma or whole string)
      const region = child.lastSeenLocation.split(',')[0].trim();
      regionMap[region] = (regionMap[region] || 0) + 1;
    }

    const regionData = Object.entries(regionMap)
      .sort(([, a], [, b]) => b - a)
      .map(([region, count]) => ({ region, count }));

    return NextResponse.json({
      stats: {
        totalMissing,
        totalFound,
        totalMatches,
        reunifications,
        openCases,
        pendingVerification,
        avgMatchScore,
      },
      monthlyData,
      regionData,
      matchConfidence,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
