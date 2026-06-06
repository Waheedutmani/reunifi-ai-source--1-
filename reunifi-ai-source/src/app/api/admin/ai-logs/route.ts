import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/ai-logs - List all AI match logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const confidence = searchParams.get('confidence');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');

    const where: Record<string, unknown> = {};
    if (confidence) where.confidence = confidence;
    if (status) where.status = status;

    const matches = await db.matchResult.findMany({
      where,
      include: {
        missingChild: {
          select: { id: true, fullName: true, age: true, gender: true, lastSeenLocation: true, caseNumber: true },
        },
        foundChild: {
          select: { id: true, estimatedName: true, estimatedAge: true, gender: true, foundLocation: true },
        },
        verifier: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const total = await db.matchResult.count({ where });

    return NextResponse.json({ data: matches, total });
  } catch (error) {
    console.error('List AI logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
