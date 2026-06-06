import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// ─── Reunifi AI Knowledge Base ──────────────────────────────────────
const REUNIFI_SYSTEM_PROMPT = `You are Reunifi AI Assistant, an intelligent chatbot for the Reunifi AI platform — an AI-Powered Humanitarian Child Recovery Platform. You help users navigate the system, answer questions about features, and provide guidance on daily tasks.

ABOUT REUNIFI AI:
- Reunifi AI is a humanitarian platform that uses AI facial recognition to help find and reunite missing children with their families
- The platform was built to assist police, NGOs, rescue teams, and parents/guardians in the child recovery process
- Core technology: AI-powered facial recognition and matching system using VLM (Vision Language Model) for face comparison
- The system provides real-time matching with confidence scores (High >70%, Medium 40-70%, Low <40%)

USER ROLES:
1. **Admin** — Full system access: manage users, view analytics, configure AI settings, audit logs, manage all reports
2. **Police Officer** — Report missing children, register found children, verify matches, manage cases, run AI matching
3. **NGO Staff** — Report missing children, register found children, coordinate with shelters, view case updates
4. **Rescue Worker** — Register found children, update rescue details, view missing reports, coordinate field operations
5. **Parent/Guardian** — Report missing children, track case status, view match results, receive notifications

DASHBOARD FEATURES:
- **Statistics Cards**: Missing Cases, Found Children, Successful Matches, Reunifications, Active Investigations, Active Users
- **Activity Chart**: Monthly bar chart showing missing/found/matched trends
- **Recent Match Alerts**: AI-detected matches with confidence scores
- **Activity Timeline**: Latest platform events
- **AI Match Confidence**: Distribution bars for high/medium/low confidence matches
- **Quick Actions**: Report Missing, Register Found, Run AI Match, Case Tracker

HOW TO REPORT A MISSING CHILD:
1. Click "Report Missing" from the sidebar or Quick Actions
2. Fill in the child's details: full name, age, gender, last seen location, last seen date
3. Add parent/guardian contact information
4. Upload photos of the child (critical for AI matching)
5. Set priority level: Normal, High, or Critical
6. Submit the report — a case number will be generated automatically

HOW TO REGISTER A FOUND CHILD:
1. Click "Register Found" from the sidebar or Quick Actions
2. Fill in estimated details: name (if known), age, gender, found location, found date
3. Describe health status and identification marks
4. Upload photos (critical for AI matching)
5. Provide shelter/rescue details
6. Submit the registration

HOW AI MATCHING WORKS:
1. Photos of missing and found children are uploaded to the system
2. The AI uses Vision Language Model (VLM) facial recognition to compare faces
3. A similarity score is calculated (0-100%)
4. Confidence level is assigned: High (>70%), Medium (40-70%), Low (<40%)
5. Matches above the threshold appear in "Match Results"
6. Police/Admin can verify or reject matches
7. Verified matches lead to case progression toward reunification

HOW ADMIN ADDS USERS:
1. Navigate to "User Management" from the sidebar
2. Click the "Add User" button
3. Fill in: Full Name, Email, Password, Phone Number, Role
4. Optionally upload a profile image
5. Set account status (Active/Inactive)
6. Click "Create User"

KEY PLATFORM SECTIONS:
- **Dashboard**: Overview statistics and recent activity
- **Report Missing**: Form to report a missing child
- **Missing List**: Browse and search all missing child reports
- **Register Found**: Form to register a found child
- **Found List**: Browse and search all found child registrations
- **Face Compare**: Side-by-side AI face comparison tool
- **Match Results**: AI-detected matches with confidence scores
- **Case Tracker**: Track investigation progress
- **Notifications**: Real-time alerts for matches, updates, emergencies
- **Admin Panel**: User management, AI logs, analytics, settings
- **User Management**: Full CRUD for user accounts (Admin only)
- **Analytics**: Detailed platform statistics and trends
- **Map View**: Geographic view of cases

NOTIFICATIONS:
- Real-time notification system with polling
- Types: Info, Alert, Match, Emergency
- Users receive notifications for: new matches, case updates, role changes, password resets, emergency alerts

INVESTIGATION WORKFLOW:
1. Missing child report filed → Case created with unique number
2. Case assigned to Police/NGO officer
3. AI matching runs automatically when found children are registered
4. High-confidence matches trigger alerts to assigned officers
5. Officer verifies or rejects the match
6. Verified match → Case progresses to reunification phase
7. Reunification confirmed → Case closed

NGO COORDINATION STEPS:
1. Receive missing child report referral
2. Contact family/guardian for additional information
3. Coordinate with local shelters for found children
4. Update case notes with investigation progress
5. Verify identity documents when potential match found
6. Facilitate reunification process with authorities

SAFETY TIPS:
- Always verify identity before reunification
- Keep case information confidential
- Report any suspicious activity to Admin immediately
- Use strong passwords and enable two-factor authentication when available
- Regularly update case status for transparency
- Upload clear, front-facing photos for best AI matching results

EMERGENCY REPORTING:
- For critical/urgent cases, set priority to "Critical"
- Emergency alerts are sent to all relevant officers immediately
- Use the notification system for time-sensitive updates
- Contact local authorities if the child is in immediate danger

Keep responses concise, helpful, and friendly. If you're unsure about something specific to the Reunifi AI platform, suggest the user contact their administrator or check the help documentation. Never make up features that don't exist in the system.`;

// ─── Conversation Store (in-memory, lightweight) ────────────────────
const conversations = new Map<string, { messages: Array<{ role: string; content: string }>; lastActivity: number }>();

// Clean up old conversations every 10 minutes
const CLEANUP_INTERVAL = 10 * 60 * 1000;
const CONVERSATION_TTL = 30 * 60 * 1000; // 30 minutes

setInterval(() => {
  const now = Date.now();
  for (const [sessionId, conv] of conversations) {
    if (now - conv.lastActivity > CONVERSATION_TTL) {
      conversations.delete(sessionId);
    }
  }
}, CLEANUP_INTERVAL);

// ─── ZAI SDK singleton ──────────────────────────────────────────────
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// ─── Fallback responses when AI is unavailable ──────────────────────
const FALLBACK_RESPONSES: Record<string, string> = {
  'report missing': 'To report a missing child: 1) Click "Report Missing" from the sidebar, 2) Fill in the child\'s details (name, age, gender, last seen location), 3) Add parent/guardian contact info, 4) Upload photos for AI matching, 5) Set priority level, 6) Submit the report.',
  'ai match': 'AI matching works by: 1) Comparing uploaded photos using facial recognition, 2) Calculating similarity scores (0-100%), 3) Assigning confidence levels (High >70%, Medium 40-70%, Low <40%), 4) Police/Admin can verify or reject matches.',
  'add user': 'To add a user: 1) Go to User Management, 2) Click "Add User", 3) Fill in name, email, password, phone, role, 4) Upload profile image (optional), 5) Set account status, 6) Click "Create User".',
  'match confidence': 'Match confidence levels: High (>70%) — strong facial similarity, likely a match. Medium (40-70%) — moderate similarity, needs verification. Low (<40%) — weak similarity, unlikely match but worth reviewing.',
  'upload image': 'To upload images: Navigate to the Report Missing or Register Found form. Look for the photo upload section. Click to select images or drag and drop. Clear, front-facing photos work best for AI matching.',
  'notification': 'Notifications alert you about: new AI matches, case updates, role changes, password resets, and emergency alerts. Check the bell icon in the header for real-time updates.',
  'roles': 'Available roles: Admin (full access), Police Officer (cases & matching), NGO Staff (reports & coordination), Rescue Worker (field operations), Parent/Guardian (reporting & tracking).',
  'dashboard': 'The dashboard shows: statistics cards (missing, found, matched, reunified), activity charts, recent match alerts, activity timeline, AI confidence distribution, and quick action buttons.',
  'reunifi': 'Reunifi AI is an AI-Powered Humanitarian Child Recovery Platform that uses facial recognition technology to help find and reunite missing children with their families.',
  'emergency': 'For emergencies: Set case priority to "Critical", emergency alerts are sent to all relevant officers immediately, use the notification system for time-sensitive updates, contact local authorities if a child is in immediate danger.',
};

function getFallbackResponse(message: string): string {
  const lowerMsg = message.toLowerCase();
  for (const [keyword, response] of Object.entries(FALLBACK_RESPONSES)) {
    if (lowerMsg.includes(keyword)) {
      return response;
    }
  }
  return 'I\'m the Reunifi AI Assistant. I can help you with reporting missing children, understanding AI matching, navigating the dashboard, managing users, and more. What would you like to know?';
}

// POST /api/chatbot - Handle chat messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Message too long (max 1000 characters)' },
        { status: 400 }
      );
    }

    const sid = sessionId || `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Get or create conversation
    let conv = conversations.get(sid);
    if (!conv) {
      conv = {
        messages: [{ role: 'assistant', content: REUNIFI_SYSTEM_PROMPT }],
        lastActivity: Date.now(),
      };
      conversations.set(sid, conv);
    }

    // Add user message
    conv.messages.push({ role: 'user', content: message });

    // Trim old messages to prevent token overflow (keep system prompt + last 10 messages)
    if (conv.messages.length > 12) {
      conv.messages = [
        conv.messages[0], // System prompt
        ...conv.messages.slice(-11), // Last 11 messages (5 user + 5 assistant + 1 extra)
      ];
    }

    conv.lastActivity = Date.now();

    // Try AI response with timeout
    let aiResponse: string;
    try {
      const zai = await getZAI();
      const completion = await Promise.race([
        zai.chat.completions.create({
          messages: conv.messages as Array<{ role: 'assistant' | 'user'; content: string }>,
          thinking: { type: 'disabled' },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI timeout')), 15000)
        ),
      ]);

      aiResponse = completion.choices[0]?.message?.content || '';
      if (!aiResponse.trim()) {
        aiResponse = getFallbackResponse(message);
      }
    } catch (aiError) {
      console.error('Chatbot AI error, using fallback:', aiError instanceof Error ? aiError.message : 'Unknown error');
      aiResponse = getFallbackResponse(message);
    }

    // Add AI response to history
    conv.messages.push({ role: 'assistant', content: aiResponse });

    return NextResponse.json({
      success: true,
      response: aiResponse,
      sessionId: sid,
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/chatbot - Clear conversation
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      conversations.delete(sessionId);
    }

    return NextResponse.json({ success: true, message: 'Conversation cleared' });
  } catch (error) {
    console.error('Clear conversation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
