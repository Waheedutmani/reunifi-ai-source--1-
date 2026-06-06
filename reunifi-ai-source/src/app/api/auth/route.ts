import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import {
  generateToken,
  checkLoginAttempts,
  recordFailedAttempt,
  clearLoginAttempts,
  generateCaptcha,
  verifyCaptcha,
} from '@/lib/auth';

// GET /api/auth - Generate CAPTCHA
export async function GET() {
  try {
    const captcha = generateCaptcha();
    return NextResponse.json({
      captchaId: captcha.id,
      question: captcha.question,
    });
  } catch (error) {
    console.error('Captcha generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate captcha' },
      { status: 500 }
    );
  }
}

// POST /api/auth - Login or Forgot Password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password, captchaId, captchaAnswer } = body;

    // Handle forgot-password action
    if (action === 'forgot-password') {
      if (!email) {
        return NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        );
      }

      // Check if user exists (but don't reveal this to the client)
      const user = await db.user.findUnique({
        where: { email },
      });

      // In production, you would send an email with a reset token here
      console.log(`Forgot password request for: ${email}, user exists: ${!!user}`);

      return NextResponse.json({
        message: 'If an account exists with this email, a reset link has been sent.',
      });
    }

    // Default: Login action
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check login attempts
    const attemptCheck = checkLoginAttempts(email);
    if (!attemptCheck.allowed) {
      const minutesLeft = Math.ceil((attemptCheck.lockedUntil - Date.now()) / 60000);
      return NextResponse.json(
        {
          error: `Account temporarily locked. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`,
          locked: true,
          lockedUntil: attemptCheck.lockedUntil,
        },
        { status: 429 }
      );
    }

    // Verify CAPTCHA if provided (required after 2 failed attempts)
    if (captchaId && captchaAnswer) {
      if (!verifyCaptcha(captchaId, captchaAnswer)) {
        return NextResponse.json(
          { error: 'CAPTCHA verification failed. Please try again.', captchaRequired: true },
          { status: 400 }
        );
      }
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      recordFailedAttempt(email);
      const remaining = checkLoginAttempts(email).remainingAttempts;
      const needsCaptcha = (5 - remaining) >= 2;
      return NextResponse.json(
        {
          error: 'Invalid email or password',
          remainingAttempts: remaining,
          captchaRequired: needsCaptcha,
        },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      recordFailedAttempt(email);
      const remaining = checkLoginAttempts(email).remainingAttempts;
      const needsCaptcha = (5 - remaining) >= 2;
      return NextResponse.json(
        {
          error: 'Invalid email or password',
          remainingAttempts: remaining,
          captchaRequired: needsCaptcha,
        },
        { status: 401 }
      );
    }

    if (!user.active) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      );
    }

    // Clear login attempts on success
    clearLoginAttempts(email);

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/auth - Signup or Reset Password
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, name, password, role, phone, organization, newPassword } = body;

    // Handle reset-password action
    if (action === 'reset-password') {
      if (!email || !newPassword) {
        return NextResponse.json(
          { error: 'Email and new password are required' },
          { status: 400 }
        );
      }

      // Enhanced password validation
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 }
        );
      }

      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
        return NextResponse.json(
          { error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' },
          { status: 400 }
        );
      }

      const user = await db.user.findUnique({
        where: { email },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'No account found with this email' },
          { status: 404 }
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await db.user.update({
        where: { email },
        data: { password: hashedPassword },
      });

      return NextResponse.json({
        message: 'Password reset successfully',
      });
    }

    // Default: Signup action
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, name, and password are required' },
        { status: 400 }
      );
    }

    // Enhanced signup validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Name validation
    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Validate role
    const validRoles = ['admin', 'police', 'ngo', 'rescue', 'parent'];
    const userRole = validRoles.includes(role) ? role : 'parent';

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        email,
        name: name.trim(),
        password: hashedPassword,
        role: userRole,
        phone,
        organization,
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
      token,
    }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
