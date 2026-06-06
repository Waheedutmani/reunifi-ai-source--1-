import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function generateCaseNumber(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CS-${dateStr}-${random}`;
}

// GET /api/cases - List all cases
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedTo = assignedTo;

    const [cases, total] = await Promise.all([
      db.case.findMany({
        where,
        include: {
          assignedOfficer: {
            select: { id: true, name: true, email: true, role: true, phone: true, avatar: true },
          },
          missingChild: {
            select: {
              id: true,
              fullName: true,
              age: true,
              gender: true,
              photos: true,
              lastSeenLocation: true,
              status: true,
              caseNumber: true,
            },
          },
          matchResult: {
            select: {
              id: true,
              similarityScore: true,
              confidence: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.case.count({ where }),
    ]);

    return NextResponse.json({ data: cases, total });
  } catch (error) {
    console.error('List cases error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/cases - Create new case
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, priority, assignedTo, missingChildId, matchResultId } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Missing required field: title' },
        { status: 400 }
      );
    }

    const caseNumber = generateCaseNumber();

    const caseRecord = await db.case.create({
      data: {
        caseNumber,
        title,
        status: 'open',
        priority: priority || 'normal',
        notes: '[]',
        assignedTo: assignedTo || null,
        missingChildId: missingChildId || null,
        matchResultId: matchResultId || null,
      },
      include: {
        assignedOfficer: {
          select: { id: true, name: true, email: true, role: true, phone: true, avatar: true },
        },
        missingChild: {
          select: {
            id: true,
            fullName: true,
            age: true,
            gender: true,
            photos: true,
            lastSeenLocation: true,
            status: true,
            caseNumber: true,
          },
        },
        matchResult: {
          select: {
            id: true,
            similarityScore: true,
            confidence: true,
            status: true,
          },
        },
      },
    });

    // If assigned to an officer, notify them
    if (assignedTo) {
      await db.notification.create({
        data: {
          userId: assignedTo,
          title: 'New Case Assigned',
          message: `You have been assigned to case: ${title} (${caseNumber})`,
          type: 'alert',
          relatedId: caseRecord.id,
          relatedType: 'case',
        },
      });
    }

    return NextResponse.json(caseRecord, { status: 201 });
  } catch (error) {
    console.error('Create case error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/cases - Update case
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, priority, assignedTo, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    // Check if case exists
    const existing = await db.case.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null;

    // If notes provided, append to notes JSON array
    if (notes) {
      const existingNotes: unknown[] = JSON.parse(existing.notes || '[]');
      existingNotes.push({
        date: new Date().toISOString(),
        note: notes,
      });
      updateData.notes = JSON.stringify(existingNotes);
    }

    const caseRecord = await db.case.update({
      where: { id },
      data: updateData,
      include: {
        assignedOfficer: {
          select: { id: true, name: true, email: true, role: true, phone: true, avatar: true },
        },
        missingChild: {
          select: {
            id: true,
            fullName: true,
            age: true,
            gender: true,
            photos: true,
            lastSeenLocation: true,
            status: true,
            caseNumber: true,
          },
        },
        matchResult: {
          select: {
            id: true,
            similarityScore: true,
            confidence: true,
            status: true,
          },
        },
      },
    });

    // If assigned to a new officer, notify them
    if (assignedTo && assignedTo !== existing.assignedTo) {
      await db.notification.create({
        data: {
          userId: assignedTo,
          title: 'Case Assigned to You',
          message: `You have been assigned to case: ${existing.title} (${existing.caseNumber})`,
          type: 'alert',
          relatedId: existing.id,
          relatedType: 'case',
        },
      });
    }

    return NextResponse.json(caseRecord);
  } catch (error) {
    console.error('Update case error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
