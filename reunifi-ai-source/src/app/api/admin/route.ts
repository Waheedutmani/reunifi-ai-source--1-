import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/admin - Get admin data based on section (Admin only)
export async function GET(request: NextRequest) {
  // Auth check
  const authUser = getAuthUser(request);
  if (!authUser || authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    if (!section) {
      return NextResponse.json(
        { error: 'Missing required query param: section (users|reports|ai-logs)' },
        { status: 400 }
      );
    }

    switch (section) {
      case 'users': {
        const users = await db.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            avatar: true,
            phone: true,
            organization: true,
            verified: true,
            active: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                missingReports: true,
                foundReports: true,
                assignedCases: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({ users });
      }

      case 'reports': {
        const [missingChildren, foundChildren] = await Promise.all([
          db.missingChild.findMany({
            include: {
              reporter: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          }),
          db.foundChild.findMany({
            include: {
              registrar: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          }),
        ]);
        return NextResponse.json({
          data: {
            missing: missingChildren,
            found: foundChildren,
          },
        });
      }

      case 'ai-logs': {
        const matchResults = await db.matchResult.findMany({
          include: {
            missingChild: {
              select: {
                id: true,
                fullName: true,
                caseNumber: true,
              },
            },
            foundChild: {
              select: {
                id: true,
                estimatedName: true,
              },
            },
            verifier: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({ logs: matchResults });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid section. Use: users, reports, ai-logs' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin - Admin actions (Admin only)
export async function PUT(request: NextRequest) {
  // Auth check
  const authUser = getAuthUser(request);
  if (!authUser || authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, id, adminUserId, ...params } = body;

    if (!action || !id) {
      return NextResponse.json(
        { error: 'Missing required fields: action, id' },
        { status: 400 }
      );
    }

    const adminId = adminUserId || 'system';

    switch (action) {
      case 'toggleActive': {
        // Toggle user active status
        const user = await db.user.findUnique({ where: { id } });
        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        const updated = await db.user.update({
          where: { id },
          data: { active: !user.active },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            active: true,
          },
        });

        // Create audit log
        await db.auditLog.create({
          data: {
            userId: adminId,
            action: `User ${updated.active ? 'activated' : 'deactivated'}`,
            entity: 'User',
            entityId: id,
            details: JSON.stringify({ active: updated.active }),
          },
        });

        return NextResponse.json(updated);
      }

      case 'changeRole': {
        // Change user role
        const { role } = params;
        if (!role || !['admin', 'police', 'ngo', 'rescue', 'parent'].includes(role)) {
          return NextResponse.json(
            { error: 'Invalid role. Use: admin, police, ngo, rescue, parent' },
            { status: 400 }
          );
        }

        const existing = await db.user.findUnique({ where: { id } });
        if (!existing) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        const updated = await db.user.update({
          where: { id },
          data: { role },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            active: true,
          },
        });

        // Create audit log
        await db.auditLog.create({
          data: {
            userId: adminId,
            action: `Role changed from ${existing.role} to ${role}`,
            entity: 'User',
            entityId: id,
            details: JSON.stringify({ oldRole: existing.role, newRole: role }),
          },
        });

        return NextResponse.json(updated);
      }

      case 'verifyUser': {
        // Verify a user
        const user = await db.user.findUnique({ where: { id } });
        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        const updated = await db.user.update({
          where: { id },
          data: { verified: true },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            verified: true,
          },
        });

        // Create audit log
        await db.auditLog.create({
          data: {
            userId: adminId,
            action: 'User verified',
            entity: 'User',
            entityId: id,
            details: JSON.stringify({ verified: true }),
          },
        });

        // Notify the user
        await db.notification.create({
          data: {
            userId: id,
            title: 'Account Verified',
            message: 'Your account has been verified by an administrator.',
            type: 'info',
          },
        });

        return NextResponse.json(updated);
      }

      case 'removeReport': {
        // Remove a missing or found child report
        const { reportType } = params;
        if (!reportType || !['missing', 'found'].includes(reportType)) {
          return NextResponse.json(
            { error: 'Invalid reportType. Use: missing, found' },
            { status: 400 }
          );
        }

        if (reportType === 'missing') {
          // Delete related match results and cases first
          await db.matchResult.deleteMany({ where: { missingChildId: id } });
          await db.case.deleteMany({ where: { missingChildId: id } });
          await db.missingChild.delete({ where: { id } });
        } else {
          await db.matchResult.deleteMany({ where: { foundChildId: id } });
          await db.foundChild.delete({ where: { id } });
        }

        // Create audit log
        await db.auditLog.create({
          data: {
            userId: adminId,
            action: `Report removed (${reportType})`,
            entity: reportType === 'missing' ? 'MissingChild' : 'FoundChild',
            entityId: id,
          },
        });

        return NextResponse.json({
          success: true,
          message: `${reportType} report removed successfully`,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: toggleActive, changeRole, verifyUser, removeReport' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
