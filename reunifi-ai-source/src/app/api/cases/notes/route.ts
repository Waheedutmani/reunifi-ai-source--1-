import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/cases/notes - Add a note to a case
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, text, author, type } = body;

    if (!caseId || !text) {
      return NextResponse.json(
        { error: 'caseId and text are required' },
        { status: 400 }
      );
    }

    const existingCase = await db.case.findUnique({ where: { id: caseId } });
    if (!existingCase) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    const existingNotes = JSON.parse(existingCase.notes || '[]');
    const newNote = {
      id: Date.now().toString(),
      text,
      author: author || 'Unknown',
      timestamp: new Date().toISOString(),
      type: type || 'note',
    };
    existingNotes.push(newNote);

    await db.case.update({
      where: { id: caseId },
      data: { notes: JSON.stringify(existingNotes) },
    });

    return NextResponse.json({ note: newNote, totalNotes: existingNotes.length }, { status: 201 });
  } catch (error) {
    console.error('Add case note error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
