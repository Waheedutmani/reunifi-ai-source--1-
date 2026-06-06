import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/missing/[id] - Get missing child by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const child = await db.missingChild.findUnique({
      where: { id },
      include: {
        reporter: {
          select: { id: true, name: true, email: true, role: true, phone: true },
        },
        matches: {
          include: {
            foundChild: true,
            verifier: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        cases: true,
      },
    });

    if (!child) {
      return NextResponse.json(
        { error: 'Missing child not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(child);
  } catch (error) {
    console.error('Get missing child error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/missing/[id] - Update missing child
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.missingChild.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Missing child not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'fullName', 'age', 'gender', 'lastSeenLocation', 'lastSeenDate',
      'dateMissing', 'clothingDescription', 'medicalConditions',
      'emergencyContact', 'parentGuardianName', 'parentGuardianPhone',
      'parentGuardianEmail', 'photos', 'priority',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'age') {
          updateData[field] = parseInt(String(body[field]));
        } else if (field === 'photos') {
          updateData[field] = JSON.stringify(body[field]);
        } else if (field === 'lastSeenDate' || field === 'dateMissing') {
          updateData[field] = body[field] ? new Date(body[field]) : undefined;
        } else {
          updateData[field] = body[field];
        }
      }
    }

    const child = await db.missingChild.update({
      where: { id },
      data: updateData,
      include: {
        reporter: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json(child);
  } catch (error) {
    console.error('Update missing child error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/missing/[id] - Update status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['open', 'investigating', 'matched', 'closed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const existing = await db.missingChild.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Missing child not found' },
        { status: 404 }
      );
    }

    const child = await db.missingChild.update({
      where: { id },
      data: { status },
      include: {
        reporter: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // Create notification for status change
    await db.notification.create({
      data: {
        userId: existing.reportedBy,
        title: 'Case Status Updated',
        message: `The status of ${existing.fullName} (${existing.caseNumber}) has been updated to ${status}`,
        type: status === 'matched' ? 'match' : 'info',
        relatedId: id,
        relatedType: 'missing',
      },
    });

    return NextResponse.json(child);
  } catch (error) {
    console.error('Update missing child status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
