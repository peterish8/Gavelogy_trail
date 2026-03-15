import { supabase } from '@/lib/supabase';

interface CourseWithFolders {
  courseId: string;
  courseName: string;
  folders: { id: string; title: string; parentId: string | null; questionCount: number }[];
}

/**
 * (Client-side) Fetch the user's purchased courses and their folder structure with question counts.
 * Uses the client-side Supabase instance so the auth session is available.
 */
export async function fetchUserCoursesWithFolders(userId: string): Promise<CourseWithFolders[]> {
  // 1. Get purchased course IDs
  const { data: userCourses, error: ucError } = await supabase
    .from('user_courses')
    .select('course_id')
    .eq('user_id', userId);

  if (ucError) {
    console.error('[SPEED COURT] Error fetching user courses:', ucError);
    return [];
  }

  if (!userCourses || userCourses.length === 0) {
    console.warn('[SPEED COURT] No user courses found for user:', userId);
    return [];
  }

  const courseIds = userCourses.map(uc => uc.course_id);
  console.log('[SPEED COURT] Found course IDs:', courseIds);

  // 2. Get course details
  const { data: courses, error: courseError } = await supabase
    .from('courses')
    .select('id, name')
    .in('id', courseIds)
    .eq('is_active', true);

  if (courseError) {
    console.error('[SPEED COURT] Error fetching courses:', courseError);
    return [];
  }

  if (!courses || courses.length === 0) {
    console.warn('[SPEED COURT] No active courses found for IDs:', courseIds);
    return [];
  }

  console.log('[SPEED COURT] Found courses:', courses.map(c => c.name));

  // 3. Get ALL structure items for these courses (folders)
  const { data: items, error: itemsError } = await supabase
    .from('structure_items')
    .select('id, title, parent_id, course_id')
    .in('course_id', courseIds)
    .eq('is_active', true)
    .order('order_index');

  if (itemsError) {
    console.error('[SPEED COURT] Error fetching structure items:', itemsError);
  }

  if (!items || items.length === 0) {
    console.warn('[SPEED COURT] No structure items found');
    // Still return courses with empty folders
    return courses.map(course => ({
      courseId: course.id,
      courseName: course.name,
      folders: [],
    }));
  }

  console.log('[SPEED COURT] Found', items.length, 'structure items');

  // 4. Get question counts per folder (structure_item → attached_quiz → quiz_questions)
  const itemIds = items.map(i => i.id);

  // Get attached quizzes for these items
  const { data: quizzes } = await supabase
    .from('attached_quizzes')
    .select('id, note_item_id')
    .in('note_item_id', itemIds);

  const quizIds = (quizzes || []).map(q => q.id);
  console.log('[SPEED COURT] Found', quizIds.length, 'attached quizzes');

  // Get question counts per quiz
  const questionCounts: Record<string, number> = {};
  if (quizIds.length > 0) {
    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('quiz_id')
      .in('quiz_id', quizIds);

    if (questions) {
      // Map quiz_id → note_item_id
      const quizToItem: Record<string, string> = {};
      (quizzes || []).forEach(q => {
        if (q.note_item_id) quizToItem[q.id] = q.note_item_id;
      });

      // Count questions per item
      questions.forEach(q => {
        const itemId = quizToItem[q.quiz_id];
        if (itemId) {
          questionCounts[itemId] = (questionCounts[itemId] || 0) + 1;
        }
      });
    }
  }

  // 5. Build result
  return courses.map(course => ({
    courseId: course.id,
    courseName: course.name,
    folders: items
      .filter(i => i.course_id === course.id)
      .map(i => ({
        id: i.id,
        title: i.title,
        parentId: i.parent_id,
        questionCount: questionCounts[i.id] || 0,
      }))
  }));
}

/**
 * (Client-side) Fetch questions from specific folder IDs for Speed Court.
 * Returns shuffled questions from all selected folders.
 */
export async function fetchSpeedCourtQuestions(folderIds: string[]) {
  if (folderIds.length === 0) return [];

  // 1. Get attached quizzes for these folders
  const { data: quizzes } = await supabase
    .from('attached_quizzes')
    .select('id, note_item_id')
    .in('note_item_id', folderIds);

  if (!quizzes || quizzes.length === 0) return [];

  const quizIds = quizzes.map(q => q.id);

  // 2. Fetch questions from these quizzes
  const { data: questions, error } = await supabase
    .from('quiz_questions')
    .select('id, question_text, options, correct_answer, explanation, quiz_id')
    .in('quiz_id', quizIds);

  if (error || !questions) return [];

  // 3. Get context (titles for passages)
  const quizToItem: Record<string, string> = {};
  quizzes.forEach(q => { if (q.note_item_id) quizToItem[q.id] = q.note_item_id; });

  const itemIds = [...new Set(Object.values(quizToItem))];
  const { data: items } = await supabase
    .from('structure_items')
    .select('id, title')
    .in('id', itemIds);

  const titleMap: Record<string, string> = {};
  (items || []).forEach(i => { titleMap[i.id] = i.title; });

  // 4. Parse and shuffle
  const parsed = questions.map(q => {
    let options = q.options;
    if (typeof options === 'string') {
      try { options = JSON.parse(options); } catch { options = []; }
    }

    const itemId = quizToItem[q.quiz_id];
    return {
      id: q.id,
      text: q.question_text,
      options,
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
      title: itemId ? titleMap[itemId] : undefined,
    };
  });

  // Shuffle (Fisher-Yates)
  for (let i = parsed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [parsed[i], parsed[j]] = [parsed[j], parsed[i]];
  }

  return parsed;
}
