import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// POST /api/seed - Seed the database with demo data
export async function POST() {
  try {
    // Check if data already exists
    const userCount = await db.user.count();
    if (userCount > 0) {
      return NextResponse.json({ success: true, message: 'Database already has data, skipping seed' });
    }

    // Create demo users with specific passwords
    const admin = await db.user.create({
      data: { email: 'admin@reunifi.ai', name: 'Admin User', password: await bcrypt.hash('Admin@123', 10), role: 'admin', phone: '+92-300-0000001', organization: 'Reunifi AI HQ', verified: true },
    });
    const police = await db.user.create({
      data: { email: 'police@reunifi.ai', name: 'Officer Ahmed Khan', password: await bcrypt.hash('Police@123', 10), role: 'police', phone: '+92-300-0000002', organization: 'Lahore Police', verified: true },
    });
    const ngo = await db.user.create({
      data: { email: 'ngo@reunifi.ai', name: 'Fatima Hassan', password: await bcrypt.hash('NGO@123', 10), role: 'ngo', phone: '+92-300-0000003', organization: 'Child Rescue Foundation', verified: true },
    });
    const rescue = await db.user.create({
      data: { email: 'rescue@reunifi.ai', name: 'Rescue Worker Ali', password: await bcrypt.hash('Rescue@123', 10), role: 'rescue', phone: '+92-300-0000004', organization: 'Emergency Rescue Service', verified: true },
    });
    const parent = await db.user.create({
      data: { email: 'parent@reunifi.ai', name: 'Zainab Malik', password: await bcrypt.hash('Parent@123', 10), role: 'parent', phone: '+92-300-0000005', verified: true },
    });

    // Create demo missing children
    const missingChildren = await Promise.all([
      db.missingChild.create({
        data: {
          fullName: 'Ayesha Siddiqui', age: 7, gender: 'Female',
          lastSeenLocation: 'Lahore, Gulberg III', lastSeenDate: new Date('2024-12-15'),
          dateMissing: new Date('2024-12-15'), clothingDescription: 'Pink shalwar kameez with white flowers',
          medicalConditions: 'Asthma - requires inhaler', emergencyContact: '+92-300-1111111',
          parentGuardianName: 'Zainab Malik', parentGuardianPhone: '+92-300-0000005',
          parentGuardianEmail: 'parent@reunifi.ai', photos: JSON.stringify([
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Ayesha'
          ]),
          status: 'open', priority: 'critical', caseNumber: 'MC-20241215-0001', reportedBy: parent.id,
        },
      }),
      db.missingChild.create({
        data: {
          fullName: 'Bilal Raza', age: 10, gender: 'Male',
          lastSeenLocation: 'Karachi, Clifton Beach', lastSeenDate: new Date('2024-11-20'),
          dateMissing: new Date('2024-11-20'), clothingDescription: 'Blue jeans and white t-shirt',
          parentGuardianName: 'Raza Ahmed', parentGuardianPhone: '+92-321-2222222',
          photos: JSON.stringify(['https://api.dicebear.com/7.x/avataaars/svg?seed=Bilal']),
          status: 'investigating', priority: 'high', caseNumber: 'MC-20241120-0002', reportedBy: police.id,
        },
      }),
      db.missingChild.create({
        data: {
          fullName: 'Sana Noor', age: 5, gender: 'Female',
          lastSeenLocation: 'Islamabad, F-7 Markaz', lastSeenDate: new Date('2024-10-08'),
          dateMissing: new Date('2024-10-08'), clothingDescription: 'Yellow frock with butterfly print',
          medicalConditions: 'Heart condition', emergencyContact: '+92-333-3333333',
          parentGuardianName: 'Noor Muhammad', parentGuardianPhone: '+92-333-3333333',
          photos: JSON.stringify(['https://api.dicebear.com/7.x/avataaars/svg?seed=Sana']),
          status: 'matched', priority: 'high', caseNumber: 'MC-20241008-0003', reportedBy: ngo.id,
        },
      }),
      db.missingChild.create({
        data: {
          fullName: 'Hassan Ali', age: 12, gender: 'Male',
          lastSeenLocation: 'Rawalpindi, Saddar', lastSeenDate: new Date('2025-01-05'),
          dateMissing: new Date('2025-01-05'), clothingDescription: 'Green school uniform',
          parentGuardianName: 'Ali Akbar', parentGuardianPhone: '+92-344-4444444',
          photos: JSON.stringify(['https://api.dicebear.com/7.x/avataaars/svg?seed=Hassan']),
          status: 'open', priority: 'normal', caseNumber: 'MC-20250105-0004', reportedBy: police.id,
        },
      }),
      db.missingChild.create({
        data: {
          fullName: 'Maryam Khalid', age: 8, gender: 'Female',
          lastSeenLocation: 'Faisalabad, D-Ground', lastSeenDate: new Date('2024-09-12'),
          dateMissing: new Date('2024-09-12'), clothingDescription: 'Purple kurta and white shalwar',
          medicalConditions: 'Diabetes Type 1', emergencyContact: '+92-355-5555555',
          parentGuardianName: 'Khalid Mehmood', parentGuardianPhone: '+92-355-5555555',
          photos: JSON.stringify(['https://api.dicebear.com/7.x/avataaars/svg?seed=Maryam']),
          status: 'open', priority: 'high', caseNumber: 'MC-20240912-0005', reportedBy: ngo.id,
        },
      }),
      db.missingChild.create({
        data: {
          fullName: 'Usman Sheikh', age: 6, gender: 'Male',
          lastSeenLocation: 'Peshawar, University Road', lastSeenDate: new Date('2025-01-10'),
          dateMissing: new Date('2025-01-10'),
          clothingDescription: 'Brown jacket and grey pants',
          parentGuardianName: 'Sheikh Abdullah', parentGuardianPhone: '+92-366-6666666',
          photos: JSON.stringify(['https://api.dicebear.com/7.x/avataaars/svg?seed=Usman']),
          status: 'open', priority: 'critical', caseNumber: 'MC-20250110-0006', reportedBy: rescue.id,
        },
      }),
      db.missingChild.create({
        data: {
          fullName: 'Zara Imran', age: 9, gender: 'Female',
          lastSeenLocation: 'Multan, Cantt Area', lastSeenDate: new Date('2024-08-22'),
          dateMissing: new Date('2024-08-22'),
          parentGuardianName: 'Imran Shahid', parentGuardianPhone: '+92-377-7777777',
          photos: JSON.stringify(['https://api.dicebear.com/7.x/avataaars/svg?seed=Zara']),
          status: 'closed', priority: 'normal', caseNumber: 'MC-20240822-0007', reportedBy: police.id,
        },
      }),
      db.missingChild.create({
        data: {
          fullName: 'Daniyal Nawaz', age: 11, gender: 'Male',
          lastSeenLocation: 'Lahore, Model Town', lastSeenDate: new Date('2024-12-01'),
          dateMissing: new Date('2024-12-01'),
          clothingDescription: 'Black hoodie and jeans',
          parentGuardianName: 'Nawaz Iqbal', parentGuardianPhone: '+92-388-8888888',
          photos: JSON.stringify(['https://api.dicebear.com/7.x/avataaars/svg?seed=Daniyal']),
          status: 'investigating', priority: 'normal', caseNumber: 'MC-20241201-0008', reportedBy: police.id,
        },
      }),
    ]);

    // Create demo found children
    const foundChildren = await Promise.all([
      db.foundChild.create({
        data: {
          estimatedName: null, estimatedAge: 7, gender: 'Female',
          foundLocation: 'Lahore, Railway Station', foundDate: new Date('2024-12-20'),
          healthStatus: 'stable', rescueDetails: 'Found wandering near platform 3',
          shelterInfo: 'Child Protection Center Lahore',
          identificationMarks: 'Small scar on left eyebrow',
          photos: JSON.stringify(['https://api.dicebear.com/7.x/avataaars/svg?seed=FoundGirl1']),
          status: 'unidentified', registeredBy: rescue.id,
        },
      }),
      db.foundChild.create({
        data: {
          estimatedName: 'Possible Bilal', estimatedAge: 10, gender: 'Male',
          foundLocation: 'Karachi, Sea View', foundDate: new Date('2024-11-25'),
          healthStatus: 'injured', rescueDetails: 'Found with minor injuries near beach',
          shelterInfo: 'Edhi Home Karachi',
          photos: JSON.stringify(['https://api.dicebear.com/7.x/avataaars/svg?seed=FoundBoy1']),
          status: 'unidentified', registeredBy: ngo.id,
        },
      }),
      db.foundChild.create({
        data: {
          estimatedName: 'Sana (confirmed)', estimatedAge: 5, gender: 'Female',
          foundLocation: 'Islamabad, Blue Area', foundDate: new Date('2024-10-15'),
          healthStatus: 'stable', rescueDetails: 'Found near a shopping center',
          shelterInfo: 'Pakistan Sweet Home Islamabad',
          photos: JSON.stringify(['https://api.dicebear.com/7.x/avataaars/svg?seed=SanaFound']),
          status: 'identified', registeredBy: ngo.id,
        },
      }),
      db.foundChild.create({
        data: {
          estimatedName: null, estimatedAge: 9, gender: 'Female',
          foundLocation: 'Faisalabad, Ghulam Muhammad Abad', foundDate: new Date('2024-09-20'),
          healthStatus: 'critical', rescueDetails: 'Found in critical condition, malnourished',
          shelterInfo: 'District Hospital Faisalabad',
          identificationMarks: 'Birthmark on right arm',
          photos: JSON.stringify(['https://api.dicebear.com/7.x/avataaars/svg?seed=FoundGirl2']),
          status: 'unidentified', registeredBy: rescue.id,
        },
      }),
      db.foundChild.create({
        data: {
          estimatedName: null, estimatedAge: 6, gender: 'Male',
          foundLocation: 'Peshawar, GT Road', foundDate: new Date('2025-01-12'),
          healthStatus: 'stable', rescueDetails: 'Found near bus stop',
          shelterInfo: 'Child Rescue Center Peshawar',
          photos: JSON.stringify(['https://api.dicebear.com/7.x/avataaars/svg?seed=FoundBoy2']),
          status: 'unidentified', registeredBy: police.id,
        },
      }),
      db.foundChild.create({
        data: {
          estimatedName: 'Reunited Child', estimatedAge: 9, gender: 'Female',
          foundLocation: 'Multan, Nishtar Road', foundDate: new Date('2024-08-30'),
          healthStatus: 'stable', rescueDetails: 'Found near market area',
          shelterInfo: 'Edhi Center Multan',
          photos: JSON.stringify(['https://api.dicebear.com/7.x/avataaars/svg?seed=Reunited1']),
          status: 'reunited', registeredBy: ngo.id,
        },
      }),
    ]);

    // Create demo match results
    const matchResults = await Promise.all([
      db.matchResult.create({
        data: {
          missingChildId: missingChildren[2].id, foundChildId: foundChildren[2].id,
          similarityScore: 92, confidence: 'high', verified: true,
          verifiedBy: police.id, verificationNotes: 'Facial features and age match confirmed. Birthmark on right arm confirmed by parent.',
          status: 'confirmed',
        },
      }),
      db.matchResult.create({
        data: {
          missingChildId: missingChildren[0].id, foundChildId: foundChildren[0].id,
          similarityScore: 78, confidence: 'high', verified: false,
          status: 'pending', verificationNotes: 'Strong facial similarity detected. Awaiting human verification.',
        },
      }),
      db.matchResult.create({
        data: {
          missingChildId: missingChildren[1].id, foundChildId: foundChildren[1].id,
          similarityScore: 65, confidence: 'medium', verified: false,
          status: 'pending', verificationNotes: 'Moderate similarity. Additional verification needed.',
        },
      }),
      db.matchResult.create({
        data: {
          missingChildId: missingChildren[4].id, foundChildId: foundChildren[3].id,
          similarityScore: 55, confidence: 'medium', verified: false,
          status: 'pending',
        },
      }),
      db.matchResult.create({
        data: {
          missingChildId: missingChildren[5].id, foundChildId: foundChildren[4].id,
          similarityScore: 35, confidence: 'low', verified: false,
          status: 'pending',
        },
      }),
    ]);

    // Create demo cases
    await Promise.all([
      db.case.create({
        data: {
          caseNumber: 'CS-20241220-0001', title: 'Reunification: Ayesha Siddiqui',
          status: 'investigating', priority: 'critical',
          notes: JSON.stringify([
            { date: '2024-12-20T10:00:00Z', text: 'Case opened after AI match detected' },
            { date: '2024-12-21T14:30:00Z', text: 'Officer dispatched to shelter location' },
          ]),
          assignedTo: police.id, missingChildId: missingChildren[0].id, matchResultId: matchResults[1].id,
        },
      }),
      db.case.create({
        data: {
          caseNumber: 'CS-20241015-0002', title: 'Reunification: Sana Noor',
          status: 'matched', priority: 'high',
          notes: JSON.stringify([
            { date: '2024-10-15T09:00:00Z', text: 'AI match confirmed at 92% similarity' },
            { date: '2024-10-16T11:00:00Z', text: 'Parents contacted and identification verified' },
            { date: '2024-10-17T16:00:00Z', text: 'Reunification process initiated' },
          ]),
          assignedTo: ngo.id, missingChildId: missingChildren[2].id, matchResultId: matchResults[0].id,
        },
      }),
      db.case.create({
        data: {
          caseNumber: 'CS-20241125-0003', title: 'Investigation: Bilal Raza',
          status: 'investigating', priority: 'high',
          notes: JSON.stringify([
            { date: '2024-11-25T08:00:00Z', text: 'Potential match found at Clifton Beach' },
            { date: '2024-11-26T10:00:00Z', text: 'DNA sample requested for verification' },
          ]),
          assignedTo: police.id, missingChildId: missingChildren[1].id, matchResultId: matchResults[2].id,
        },
      }),
    ]);

    // Create demo notifications
    await db.notification.createMany({
      data: [
        { userId: admin.id, title: 'New Missing Child Report', message: 'A critical missing child report has been filed for Ayesha Siddiqui in Lahore', type: 'emergency', relatedId: missingChildren[0].id, relatedType: 'missing' },
        { userId: police.id, title: 'High Confidence Match', message: 'AI detected a 92% match for Sana Noor. Please verify immediately.', type: 'match', relatedId: matchResults[0].id, relatedType: 'match' },
        { userId: ngo.id, title: 'New Found Child', message: 'A child has been found at Lahore Railway Station and registered in the system.', type: 'alert', relatedId: foundChildren[0].id, relatedType: 'found' },
        { userId: rescue.id, title: 'Case Assignment', message: 'You have been assigned to the Ayesha Siddiqui reunification case.', type: 'info', relatedId: missingChildren[0].id, relatedType: 'case' },
        { userId: admin.id, title: 'Match Verified', message: 'The match for Sana Noor has been confirmed. Reunification process initiated.', type: 'match', relatedId: matchResults[0].id, relatedType: 'match' },
        { userId: parent.id, title: 'Potential Match Found', message: 'AI has found a potential match for Ayesha. Please check the match results.', type: 'match', relatedId: matchResults[1].id, relatedType: 'match' },
      ],
    });

    return NextResponse.json({
      success: true,
      message: 'Database seeded with demo data',
      counts: {
        users: 5,
        missingChildren: missingChildren.length,
        foundChildren: foundChildren.length,
        matchResults: matchResults.length,
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: String(error) },
      { status: 500 }
    );
  }
}
