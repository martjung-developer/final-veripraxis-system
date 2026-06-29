'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowUp } from 'lucide-react'
import { slideUpFade } from '@/animations/slideUpFade'
import { popIn } from '@/animations/popIn'
import { highlightPulse } from '@/animations/highlightPulse'
import type { StudentReviewPayload } from '@/lib/services/student/results/resultReview.service'
import s from './results-review.module.css'

interface Props {
  review: StudentReviewPayload
}

function normalize(value: string | null): string {
  return (value ?? '').trim().toLowerCase()
}

export function ResultsReviewClient({ review }: Props) {
  const [openExplanations, setOpenExplanations] = useState<Record<string, boolean>>({})
  const [showJumpMenu, setShowJumpMenu] = useState(false)
  const jumpPanelRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<Record<string, HTMLElement | null>>({})
  const explanationRefs = useRef<Record<string, HTMLElement | null>>({})
  const widgetRef = useRef<HTMLButtonElement | null>(null)
  const pulsedChoiceKeys = useRef<Set<string>>(new Set())
  const statusAnimated = useRef<Set<string>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)

  const summary = useMemo(() => {
    let correct = 0
    let wrong = 0
    let skipped = 0

    for (const q of review.questions) {
      const student = normalize(q.studentAnswer)
      const correctAns = normalize(q.correctAnswer)
      if (!student) { skipped += 1; continue }
      if (student === correctAns) { correct += 1 } else { wrong += 1 }
    }

    const total = review.questions.length
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0
    return { correct, wrong, skipped, total, percentage }
  }, [review.questions])

  useEffect(() => {
    if (widgetRef.current) { popIn(widgetRef.current) }
  }, [])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {return}
          const el = entry.target as HTMLDivElement
          const idx = Number(el.dataset.index ?? '0')
          slideUpFade(el, idx)
          observerRef.current?.unobserve(el)
        })
      },
      { threshold: 0.15 },
    )

    Object.values(cardRefs.current).forEach((node) => {
      if (node) { observerRef.current?.observe(node) }
    })

    return () => {
      observerRef.current?.disconnect()
      observerRef.current = null
    }
  }, [review.questions.length])

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!showJumpMenu) {return}
      if (!jumpPanelRef.current) {return}
      const target = event.target as Node
      if (!jumpPanelRef.current.contains(target)) {
        setShowJumpMenu(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [showJumpMenu])

  function setCardRef(id: string, node: HTMLElement | null, index: number) {
    cardRefs.current[id] = node
    if (node) {
      node.dataset.index = String(index)
      node.style.opacity = '0'
      node.style.transform = 'translateY(20px)'
    }
  }

  function setStatusRef(id: string, node: HTMLSpanElement | null) {
    if (node && !statusAnimated.current.has(id)) {
      statusAnimated.current.add(id)
      popIn(node)
    }
  }

  function setChoiceRef(
    questionId: string,
    choiceLabel: string,
    type: 'correct' | 'wrong' | 'neutral',
    node: HTMLElement | null,
  ) {
    if (!node || type === 'neutral') {return}
    const key = `${questionId}-${choiceLabel}-${type}`
    if (pulsedChoiceKeys.current.has(key)) {return}
    pulsedChoiceKeys.current.add(key)
    highlightPulse(node, type === 'correct' ? '#16a34a' : '#dc2626')
  }

  function toggleExplanation(questionId: string) {
    setOpenExplanations((prev) => ({ ...prev, [questionId]: !prev[questionId] }))
    const el = explanationRefs.current[questionId]
    if (el) { slideUpFade(el, 0) }
  }

  function getQuestionStatus(q: StudentReviewPayload['questions'][number]) {
    const student = normalize(q.studentAnswer)
    const correct = normalize(q.correctAnswer)
    if (!student) { return 'unanswered' as const }
    if (student === correct) { return 'correct' as const }
    return 'wrong' as const
  }

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handlePrint() {
    window.print()
  }

  function handleDownloadPDF() {
    const originalTitle = document.title
    document.title = review.examTitle
    window.print()
    document.title = originalTitle
  }

  function jumpToQuestion(questionId: string) {
    const node = cardRefs.current[questionId]
    if (!node) {return}
    node.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setShowJumpMenu(false)
  }

  const pass = summary.wrong === 0 && summary.correct > 0

  return (
    <div className={s.page}>
      <div className={`${s.stickyHeader} ${s.printHide}`}>
        <div className={s.stickyTop}>
          <Link href="/student/results" className={s.backBtn}>
            ← Back to Results
          </Link>
          <h1 className={s.examTitle}>{review.examTitle}</h1>
          <div className={s.headerRight}>
            <span className={`${s.scorePill} ${pass ? s.scorePass : s.scoreFail}`}>
              {summary.correct}/{summary.total} · {summary.percentage}% · {pass ? 'PASSED' : 'FAILED'}
            </span>
            <button className={s.headerGhostBtn} onClick={handlePrint}>🖨 Print</button>
            <button className={s.headerGhostBtn} onClick={handleDownloadPDF}>⬇ Download PDF</button>
          </div>
        </div>

        <div className={`${s.topActions} ${s.printHide}`} ref={jumpPanelRef}>
          <button className={s.jumpToggle} onClick={() => setShowJumpMenu((v) => !v)}>
            Jump to Question {showJumpMenu ? '▴' : '▾'}
          </button>
          {showJumpMenu && (
            <div className={s.jumpMenu}>
              {review.questions.map((q, idx) => (
                <button key={q.id} className={s.jumpItem} onClick={() => jumpToQuestion(q.id)}>
                  {idx + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={s.progressStrip}>
          <span className={s.segCorrect} style={{ width: `${(summary.correct / Math.max(summary.total, 1)) * 100}%` }} />
          <span className={s.segWrong} style={{ width: `${(summary.wrong / Math.max(summary.total, 1)) * 100}%` }} />
          <span className={s.segSkip} style={{ width: `${(summary.skipped / Math.max(summary.total, 1)) * 100}%` }} />
        </div>
      </div>

      <div className={s.list}>
        {review.questions.map((q, idx) => {
          const status = getQuestionStatus(q)
          const open = !!openExplanations[q.id]
          const student = normalize(q.studentAnswer)
          const correct = normalize(q.correctAnswer)
          return (
            <article
              key={q.id}
              ref={(node) => setCardRef(q.id, node, idx)}
              className={`${s.card} ${status === 'correct' ? s.cardCorrect : status === 'wrong' ? s.cardWrong : s.cardNeutral}`}
            >
              <header className={s.cardHead}>
                <span className={s.questionPill}>Question {idx + 1}</span>
                <span className={s.pointsPill}>{q.points} pt</span>
                <span
                  ref={(node) => setStatusRef(q.id, node)}
                  className={`${s.statusPill} ${status === 'correct' ? s.statusCorrect : status === 'wrong' ? s.statusWrong : s.statusNeutral}`}
                >
                  {status === 'correct' ? 'Correct' : status === 'wrong' ? 'Wrong' : 'Unanswered'}
                </span>
              </header>

              {q.scenario && (
                <div className={s.scenario}>
                  <div className={s.scenarioLabel}>SCENARIO</div>
                  <p>{q.scenario}</p>
                </div>
              )}

              <h2 className={s.stem}>{q.stem}</h2>

              <div className={s.choices}>
                {q.options.map((opt) => {
                  const label = normalize(opt.label)
                  const isCorrect = label === correct
                  const isWrongStudent = label === student && label !== correct && student.length > 0
                  const type: 'correct' | 'wrong' | 'neutral' = isCorrect ? 'correct' : isWrongStudent ? 'wrong' : 'neutral'
                  return (
                    <div
                      key={`${q.id}-${opt.label}`}
                      ref={(node) => setChoiceRef(q.id, opt.label, type, node)}
                      className={`${s.choice} ${isCorrect ? s.choiceCorrect : ''} ${isWrongStudent ? s.choiceWrong : ''}`}
                    >
                      <span className={s.choiceLabel}>{opt.label}</span>
                      <span className={s.choiceText}>{opt.text}</span>
                      {isCorrect && <span className={s.choiceIcon}>✓</span>}
                      {isWrongStudent && <span className={s.choiceIcon}>✕</span>}
                    </div>
                  )
                })}
              </div>

              {q.explanation && (
                <div className={s.explainWrap}>
                  <button className={`${s.explainBtn} ${s.printHide}`} onClick={() => toggleExplanation(q.id)}>
                    {open ? 'Hide Explanation ▴' : 'Show Explanation ▾'}
                  </button>
                  <div className={`${s.explainBox} ${open ? s.explainOpen : ''} ${s.printExplainOpen}`}>
                    <div ref={(node) => { explanationRefs.current[q.id] = node }} className={s.explainText}>
                      {q.explanation}
                    </div>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>

      <button ref={widgetRef} className={`${s.floating} ${s.printHide}`} onClick={scrollTop}>
        <ArrowUp size={18} aria-hidden="true" />
      </button>
    </div>
  )
}
