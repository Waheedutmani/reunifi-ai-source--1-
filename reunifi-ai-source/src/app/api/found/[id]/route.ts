import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/found/[id] - Get found child by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const child = await db.foundChild.findUnique({
      where: { id },
      include: {
        registrar: {
          select: { id: true, name: true, email: true, role: true, phone: true },
        },
        matches: {
          include: {
            missingChild: true,
            verifier: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!child) {
      return NextResponse.json(
        { error: 'Found child not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(child);
  } catch (error) {
    console.error('Get found child error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/found/[id] - Update found child
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.foundChild.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Found child not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'estimatedName', 'estimatedAge', 'gender', 'foundLocation',
      'foundDate', 'healthStatus', 'rescueDetails', 'shelterInfo',
      'identificationMarks', 'photos',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'estimatedAge') {
          updateData[field] = parseInt(String(body[field]));
        } else if (field === 'photos') {
          updateData[field] = JSON.stringify(body[field]);
        } else if (field === 'foundDate') {
          updateData[field] = body[field] ? new Date(body[field]) : undefined;
        } else {
          updateData[field] = body[field];
        }
      }
    }

    const child = await db.foundChild.update({
      where: { id },
      data: updateData,
      include: {
        registrar: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json(child);
  } catch (error) {
    console.error('Update found child error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/found/[id] - Update status
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

    const validStatuses = ['unidentified', 'identified', 'reunited'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const existing = await db.foundChild.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Found child not found' },
        { status: 404 }
      );
    }

    const child = await db.foundChild.update({
      where: { id },
      data: { status },
      include: {
        registrar: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // Create notification for status change
    await db.notification.create({
      data: {
        userId: existing.registeredBy,
        title: 'Found Child Status Updated',
        message: `The status of found child at ${existing.foundLocation} has been updated to ${status}`,
        type: status === 'reunited' ? 'match' : 'info',
        relatedId: id,
        relatedType: 'found',
      },
    });

    return NextResponse.json(child);
  } catch (error) {
    console.error('Update found child status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
