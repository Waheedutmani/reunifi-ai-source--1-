import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/reports - List all reports (missing + found)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'missing', 'found', or null for both
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let missingChildren: unknown[] = [];
    let foundChildren: unknown[] = [];

    if (!type || type === 'missing') {
      const missingWhere: Record<string, unknown> = {};
      if (status) missingWhere.status = status;
      missingChildren = await db.missingChild.findMany({
        where: missingWhere,
        include: {
          reporter: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      missingChildren = missingChildren.map((c: Record<string, unknown>) => ({ ...c, reportType: 'missing' }));
    }

    if (!type || type === 'found') {
      const foundWhere: Record<string, unknown> = {};
      if (status) foundWhere.status = status;
      foundChildren = await db.foundChild.findMany({
        where: foundWhere,
        include: {
          registrar: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      foundChildren = foundChildren.map((c: Record<string, unknown>) => ({ ...c, reportType: 'found' }));
    }

    return NextResponse.json({
      data: [...missingChildren, ...foundChildren],
      missingCount: missingChildren.length,
      foundCount: foundChildren.length,
    });
  } catch (error) {
    console.error('List reports error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
