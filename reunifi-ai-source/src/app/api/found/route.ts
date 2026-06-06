import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function generateCaseNumber(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `FC-${dateStr}-${random}`;
}

// GET /api/found - List all found children
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { estimatedName: { contains: search } },
        { foundLocation: { contains: search } },
      ];
    }

    const [children, total] = await Promise.all([
      db.foundChild.findMany({
        where,
        include: {
          registrar: {
            select: { id: true, name: true, email: true, role: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.foundChild.count({ where }),
    ]);

    return NextResponse.json({ data: children, total });
  } catch (error) {
    console.error('List found children error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/found - Register a found child
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      estimatedName,
      estimatedAge,
      gender,
      foundLocation,
      foundDate,
      healthStatus,
      rescueDetails,
      shelterInfo,
      identificationMarks,
      photos,
      status,
      registeredBy,
    } = body;

    if (!estimatedAge || !gender || !foundLocation || !registeredBy) {
      return NextResponse.json(
        { error: 'Missing required fields: estimatedAge, gender, foundLocation, registeredBy' },
        { status: 400 }
      );
    }

    // Verify registrar exists
    const registrar = await db.user.findUnique({
      where: { id: registeredBy },
    });

    if (!registrar) {
      return NextResponse.json(
        { error: 'Registrar not found' },
        { status: 404 }
      );
    }

    const caseNumber = generateCaseNumber();

    const child = await db.foundChild.create({
      data: {
        estimatedName,
        estimatedAge: parseInt(String(estimatedAge)),
        gender,
        foundLocation,
        foundDate: foundDate ? new Date(foundDate) : new Date(),
        healthStatus: healthStatus || 'stable',
        rescueDetails,
        shelterInfo,
        identificationMarks,
        photos: photos ? JSON.stringify(photos) : '[]',
        status: status || 'unidentified',
        registeredBy,
      },
      include: {
        registrar: {
          select: { id: true, name: true, email: true, role: true, phone: true },
        },
      },
    });

    // Create notification for admins
    const admins = await db.user.findMany({
      where: { role: { in: ['admin', 'rescue'] }, active: true },
    });

    await db.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        title: 'New Found Child Registered',
        message: `A found child has been registered at ${foundLocation} (Ref: ${caseNumber})`,
        type: 'alert',
        relatedId: child.id,
        relatedType: 'found',
      })),
    });

    return NextResponse.json(child, { status: 201 });
  } catch (error) {
    console.error('Create found child error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
