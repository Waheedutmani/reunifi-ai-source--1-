import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const unread = searchParams.get('unread');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required query param: userId' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const where: Record<string, unknown> = { userId };
    if (type) where.type = type;
    if (unread === 'true') where.read = false;
    if (unread === 'false') where.read = true;

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.notification.count({ where }),
      db.notification.count({
        where: { userId, read: false },
      }),
    ]);

    return NextResponse.json({ data: notifications, total, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications - Mark notification(s) as read
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get('id');
    const queryMarkAll = searchParams.get('markAll');
    const queryUserId = searchParams.get('userId');

    let body: Record<string, unknown> = {};
    try { body = await request.json(); } catch { /* empty body ok for query param usage */ }
    
    const { id: bodyId, markAll: bodyMarkAll, userId: bodyUserId } = body as Record<string, unknown>;
    
    const id = (bodyId as string) || queryId;
    const markAll = (bodyMarkAll as boolean) || queryMarkAll === 'true';
    const userId = (bodyUserId as string) || queryUserId;

    if (id) {
      // Mark single notification as read
      const existing = await db.notification.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }

      const notification = await db.notification.update({
        where: { id },
        data: { read: true },
      });

      return NextResponse.json(notification);
    }

    if (markAll && userId) {
      // Mark all notifications for a user as read
      const result = await db.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });

      return NextResponse.json({
        success: true,
        count: result.count,
        message: `${result.count} notifications marked as read`,
      });
    }

    return NextResponse.json(
      { error: 'Provide either { id } or { markAll: true, userId }' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Mark notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, message, type, relatedId, relatedType } = body;

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, message' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const notification = await db.notification.create({
      data: {
        userId,
        title,
        message,
        type: type || 'info',
        relatedId: relatedId || null,
        relatedType: relatedType || null,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
