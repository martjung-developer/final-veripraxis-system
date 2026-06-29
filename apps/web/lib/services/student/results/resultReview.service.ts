import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/types/database'
import { parseOptions } from '@/lib/utils/admin/answer-key/parseOptions'

type TypedClient = SupabaseClient<Database>

interface RawAnswerRow {
  answer_text: string | null
  questions: {
    id: string
    question_text: string
    scenario: string | null
    explanation: string | null
    correct_answer: string | null
    options: Json | null
    points: number
    order_number: number | null
  } | null
}

export interface StudentReviewQuestion {
  id: string
  stem: string
  scenario: string | null
  explanation: string | null
  correctAnswer: string | null
  studentAnswer: string | null
  points: number
  orderNumber: number
  options: Array<{ label: string; text: string }>
}

export interface StudentReviewPayload {
  submissionId: string
  examTitle: string
  status: string
  questions: StudentReviewQuestion[]
}

export async function fetchStudentSubmissionReview(
  client: TypedClient,
  submissionId: string,
  studentId: string,
): Promise<{ data: StudentReviewPayload | null; error: string | null }> {
  const { data: submission, error: submissionError } = await client
    .from('submissions')
    .select('id, status, exam_id, exams(title)')
    .eq('id', submissionId)
    .eq('student_id', studentId)
    .single()

  if (submissionError || !submission) {
    return { data: null, error: submissionError?.message ?? 'Submission not found.' }
  }

  const { data: answerRows, error: answersError } = await client
    .from('answers')
    .select(
      'answer_text, questions:question_id(id, question_text, scenario, explanation, correct_answer, options, points, order_number)',
    )
    .eq('submission_id', submissionId)

  if (answersError) {
    return { data: null, error: answersError.message }
  }

  const questions = ((answerRows ?? []) as RawAnswerRow[])
    .filter((row) => row.questions !== null)
    .map((row) => {
      const q = row.questions!
      return {
        id: q.id,
        stem: q.question_text,
        scenario: q.scenario,
        explanation: q.explanation,
        correctAnswer: q.correct_answer,
        studentAnswer: row.answer_text,
        points: q.points,
        orderNumber: q.order_number ?? 0,
        options: parseOptions(q.options) ?? [],
      }
    })
    .sort((a, b) => a.orderNumber - b.orderNumber)

  return {
    data: {
      submissionId,
      examTitle: (submission.exams as { title?: string } | null)?.title ?? 'Exam',
      status: submission.status,
      questions,
    },
    error: null,
  }
}
