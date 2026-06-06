import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET /api/admin/users - List all users with stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (status === 'active') where.active = true;
    if (status === 'inactive') where.active = false;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const users = await db.user.findMany({
      where,
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
        lastLogin: true,
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
      take: limit,
    });

    const total = await db.user.count({ where });
    const totalActive = await db.user.count({ where: { active: true } });
    const totalInactive = await db.user.count({ where: { active: false } });

    // Role counts
    const roleCounts = await db.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentRegistrations = await db.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    return NextResponse.json({
      data: users,
      total,
      totalActive,
      totalInactive,
      roleCounts: roleCounts.map(r => ({ role: r.role, count: r._count.role })),
      recentRegistrations,
    });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone, role, avatar, active, adminUserId } = body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['admin', 'police', 'ngo', 'rescue', 'parent'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role,
        avatar: avatar || null,
        active: active !== undefined ? active : true,
        verified: false,
      },
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
      },
    });

    // Create notification for the new user
    await db.notification.create({
      data: {
        userId: user.id,
        title: 'Welcome to Reunifi AI',
        message: `Your account has been created as ${role}. Please verify your email to get started.`,
        type: 'info',
      },
    });

    // Create audit log
    if (adminUserId) {
      await db.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'User created',
          entity: 'User',
          entityId: user.id,
          details: JSON.stringify({ name, email, role }),
        },
      });
    }

    return NextResponse.json({ data: user, message: 'User created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users - Update a user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, email, phone, role, avatar, active, verified, adminUserId } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'User id is required' },
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

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (verified !== undefined) updateData.verified = verified;
    if (active !== undefined) updateData.active = active;

    if (role !== undefined) {
      const validRoles = ['admin', 'police', 'ngo', 'rescue', 'parent'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        );
      }
      updateData.role = role;
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
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
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create audit log for significant changes
    if (adminUserId) {
      const changes: string[] = [];
      if (role !== undefined && role !== existing.role) changes.push(`role: ${existing.role} → ${role}`);
      if (active !== undefined && active !== existing.active) changes.push(`status: ${existing.active ? 'active' : 'inactive'} → ${active ? 'active' : 'inactive'}`);
      if (verified !== undefined && verified !== existing.verified) changes.push(`verified: ${existing.verified} → ${verified}`);

      if (changes.length > 0) {
        await db.auditLog.create({
          data: {
            userId: adminUserId,
            action: `User updated: ${changes.join(', ')}`,
            entity: 'User',
            entityId: id,
            details: JSON.stringify(updateData),
          },
        });

        // Notify user about role/status changes
        if (role !== undefined && role !== existing.role) {
          await db.notification.create({
            data: {
              userId: id,
              title: 'Role Updated',
              message: `Your role has been changed from ${existing.role} to ${role}.`,
              type: 'alert',
            },
          });
        }
        if (active !== undefined && active !== existing.active) {
          await db.notification.create({
            data: {
              userId: id,
              title: existing.active ? 'Account Deactivated' : 'Account Activated',
              message: existing.active
                ? 'Your account has been deactivated by an administrator.'
                : 'Your account has been reactivated by an administrator.',
              type: 'alert',
            },
          });
        }
      }
    }

    return NextResponse.json({ data: user, message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users - Delete a user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const adminUserId = searchParams.get('adminUserId');

    if (!id) {
      return NextResponse.json(
        { error: 'User id is required' },
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

    // Prevent self-deletion
    if (id === adminUserId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete related records first
    await db.notification.deleteMany({ where: { userId: id } });
    await db.auditLog.deleteMany({ where: { userId: id } });

    // Unlink from related records (set to null or reassign)
    await db.matchResult.updateMany({
      where: { verifiedBy: id },
      data: { verifiedBy: null },
    });
    await db.case.updateMany({
      where: { assignedTo: id },
      data: { assignedTo: null },
    });

    // Delete the user
    await db.user.delete({ where: { id } });

    // Create audit log
    if (adminUserId) {
      await db.auditLog.create({
        data: {
          userId: adminUserId,
          action: `User deleted: ${existing.name} (${existing.email})`,
          entity: 'User',
          entityId: id,
          details: JSON.stringify({ name: existing.name, email: existing.email, role: existing.role }),
        },
      });
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users - Reset password
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, newPassword, adminUserId } = body;

    if (!id || !newPassword) {
      return NextResponse.json(
        { error: 'User id and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
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

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // Notify user
    await db.notification.create({
      data: {
        userId: id,
        title: 'Password Reset',
        message: 'Your password has been reset by an administrator. Please change it after your next login.',
        type: 'alert',
      },
    });

    // Audit log
    if (adminUserId) {
      await db.auditLog.create({
        data: {
          userId: adminUserId,
          action: `Password reset for user: ${existing.name} (${existing.email})`,
          entity: 'User',
          entityId: id,
        },
      });
    }

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
