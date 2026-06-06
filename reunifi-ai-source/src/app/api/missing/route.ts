import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function generateCaseNumber(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `MC-${dateStr}-${random}`;
}

// GET /api/missing - List all missing children
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { lastSeenLocation: { contains: search } },
        { caseNumber: { contains: search } },
      ];
    }

    const [children, total] = await Promise.all([
      db.missingChild.findMany({
        where,
        include: {
          reporter: {
            select: { id: true, name: true, email: true, role: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.missingChild.count({ where }),
    ]);

    return NextResponse.json({ data: children, total });
  } catch (error) {
    console.error('List missing children error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/missing - Create new missing child report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      age,
      gender,
      lastSeenLocation,
      lastSeenDate,
      dateMissing,
      clothingDescription,
      medicalConditions,
      emergencyContact,
      parentGuardianName,
      parentGuardianPhone,
      parentGuardianEmail,
      photos,
      status,
      priority,
      reportedBy,
    } = body;

    if (!fullName || !age || !gender || !lastSeenLocation || !reportedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: fullName, age, gender, lastSeenLocation, reportedBy' },
        { status: 400 }
      );
    }

    // Verify reporter exists
    const reporter = await db.user.findUnique({
      where: { id: reportedBy },
    });

    if (!reporter) {
      return NextResponse.json(
        { error: 'Reporter not found' },
        { status: 404 }
      );
    }

    const caseNumber = generateCaseNumber();

    const child = await db.missingChild.create({
      data: {
        fullName,
        age: parseInt(String(age)),
        gender,
        lastSeenLocation,
        lastSeenDate: lastSeenDate ? new Date(lastSeenDate) : new Date(),
        dateMissing: dateMissing ? new Date(dateMissing) : new Date(),
        clothingDescription,
        medicalConditions,
        emergencyContact,
        parentGuardianName: parentGuardianName || '',
        parentGuardianPhone: parentGuardianPhone || '',
        parentGuardianEmail,
        photos: photos ? JSON.stringify(photos) : '[]',
        status: status || 'open',
        priority: priority || 'normal',
        caseNumber,
        reportedBy,
      },
      include: {
        reporter: {
          select: { id: true, name: true, email: true, role: true, phone: true },
        },
      },
    });

    // Create notification for admins
    const admins = await db.user.findMany({
      where: { role: 'admin', active: true },
    });

    await db.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        title: 'New Missing Child Report',
        message: `A new missing child report has been filed: ${fullName} (Case: ${caseNumber})`,
        type: 'emergency',
        relatedId: child.id,
        relatedType: 'missing',
      })),
    });

    return NextResponse.json(child, { status: 201 });
  } catch (error) {
    console.error('Create missing child error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
