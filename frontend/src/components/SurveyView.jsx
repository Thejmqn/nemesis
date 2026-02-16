import { useMemo, useState, useEffect } from 'react'
import { surveyAPI } from '../services/api'

export default function SurveyView({ setError = () => {}, setSuccess = () => {} }) {
  const [questionList, setQuestionList] = useState([])
  const [questionDetailsById, setQuestionDetailsById] = useState({})
  const [answers, setAnswers] = useState({})
  const [savedAnswers, setSavedAnswers] = useState({})
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState(new Set())
  const [currentQuestionId, setCurrentQuestionId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingQuestion, setLoadingQuestion] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchSurveyQuestions()
  }, [])

  const fetchSurveyQuestions = async () => {
    try {
      const items = await surveyAPI.listQuestions(true)
      if (!Array.isArray(items)) {
        setError('Failed to load questions')
        setQuestionList([])
        setLoading(false)
        return
      }

      const answerMap = {}
      const answeredIds = new Set()
      items.forEach((item) => {
        if (!item) return
        if (item.answered) {
          answeredIds.add(item.id)
          if (typeof item.answer_value === 'number' && !Number.isNaN(item.answer_value)) {
            answerMap[item.id] = item.answer_value
          }
        }
      })

      setQuestionList(items)
      setAnswers(answerMap)
      setSavedAnswers(answerMap)
      setAnsweredQuestionIds(answeredIds)
      setLoading(false)
    } catch {
      setError('Failed to load questions')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (questionList.length === 0) return
    if (currentQuestionId !== null) {
      const stillExists = questionList.some(q => q.id === currentQuestionId)
      if (stillExists) return
    }

    const firstUnanswered = questionList.find(q => !q.answered)
    setCurrentQuestionId((firstUnanswered ?? questionList[0]).id)
  }, [questionList, currentQuestionId])

  useEffect(() => {
    if (currentQuestionId === null) return
    if (Object.prototype.hasOwnProperty.call(questionDetailsById, currentQuestionId)) return

    let cancelled = false
    setLoadingQuestion(true)
    surveyAPI.getQuestion(currentQuestionId).then((q) => {
      if (cancelled) return

      setQuestionDetailsById(prev => ({ ...prev, [currentQuestionId]: q }))

      if (q?.answered) {
        setAnsweredQuestionIds((prev) => {
          const next = new Set(prev)
          next.add(currentQuestionId)
          return next
        })
      }

      if (typeof q?.answer_value === 'number' && !Number.isNaN(q.answer_value)) {
        setAnswers((prev) => ({ ...prev, [currentQuestionId]: prev[currentQuestionId] ?? q.answer_value }))
        setSavedAnswers((prev) => ({ ...prev, [currentQuestionId]: q.answer_value }))
      }

      setLoadingQuestion(false)
    }).catch(() => {
      if (cancelled) return
      setError('Failed to load question')
      setLoadingQuestion(false)
    })

    return () => { cancelled = true }
  }, [currentQuestionId, questionDetailsById, setError])

  const orderedQuestions = useMemo(() => questionList, [questionList])
  const totalQuestions = orderedQuestions.length

  const overallIndexById = useMemo(() => {
    const map = {}
    orderedQuestions.forEach((q, idx) => {
      map[q.id] = idx
    })
    return map
  }, [orderedQuestions])

  const overallIndex = useMemo(() => {
    if (currentQuestionId === null) return 0
    const idx = orderedQuestions.findIndex(q => q.id === currentQuestionId)
    return idx === -1 ? 0 : idx
  }, [orderedQuestions, currentQuestionId])

  const currentQuestion = currentQuestionId === null ? null : (questionDetailsById[currentQuestionId] ?? null)

  const answeredCount = useMemo(() => {
    return orderedQuestions.reduce((count, q) => (answeredQuestionIds.has(q.id) ? count + 1 : count), 0)
  }, [orderedQuestions, answeredQuestionIds])

  const progressPercent = totalQuestions === 0 ? 0 : Math.round((answeredCount / totalQuestions) * 100)

  const unansweredIds = useMemo(() => {
    return orderedQuestions.filter(q => !answeredQuestionIds.has(q.id)).map(q => q.id)
  }, [orderedQuestions, answeredQuestionIds])

  const answeredIds = useMemo(() => {
    return orderedQuestions.filter(q => answeredQuestionIds.has(q.id)).map(q => q.id)
  }, [orderedQuestions, answeredQuestionIds])

  const handleAnswerChange = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value })
  }

  const getScaleBounds = (question) => {
    const min = question.min ?? 1
    const max = question.max ?? 10
    return { min, max }
  }

  const hasDraftValue = (question) => Object.prototype.hasOwnProperty.call(answers, question.id)

  const isQuestionDirty = (question) => {
    if (!answeredQuestionIds.has(question.id)) return false
    if (!hasDraftValue(question)) return false
    return answers[question.id] !== savedAnswers[question.id]
  }

  const getScaleDisplayedValue = (question) => {
    const { min, max } = getScaleBounds(question)
    const midpoint = Math.floor((min + max) / 2)
    return answers[question.id] ?? midpoint
  }

  const saveAnswerIfNeeded = async (question) => {
    setError('')
    setSuccess('')

    const isAnswered = answeredQuestionIds.has(question.id)
    const dirty = isQuestionDirty(question)
    if (isAnswered && !dirty) return { ok: true, saved: false }

    const hasDraft = hasDraftValue(question)
    if (!hasDraft) {
      setError('Please select an answer to continue.')
      return { ok: false }
    }

    const value = answers[question.id]
    if (typeof value !== 'number' || Number.isNaN(value)) {
      setError('Please select an answer to continue.')
      return { ok: false }
    }

    if (question.type === 'scale' || !question.type) {
      const { min, max } = getScaleBounds(question)
      if (value < min || value > max) {
        setError(`Answer must be between ${min} and ${max}.`)
        return { ok: false }
      }
    }

    try {
      await surveyAPI.upsertAnswer(question.id, value)
      const nextSaved = { ...savedAnswers, [question.id]: value }
      const nextAnsweredIds = new Set(answeredQuestionIds)
      nextAnsweredIds.add(question.id)
      setSavedAnswers(nextSaved)
      setAnsweredQuestionIds(nextAnsweredIds)
      setQuestionList((prev) => prev.map((q) => (q.id === question.id ? { ...q, answered: true, answer_value: value } : q)))
      setSuccess('Saved')
      setTimeout(() => setSuccess(''), 800)
      return { ok: true, saved: true, nextAnsweredIds }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save answer')
      return { ok: false }
    }
  }

  const renderQuestionInput = (question) => {
    if (question.type === 'scale') {
      const { min, max } = getScaleBounds(question)
      const value = getScaleDisplayedValue(question)
      const showValue = hasDraftValue(question) || answeredQuestionIds.has(question.id)
      return (
        <div className="slider-container">
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value))}
            className="slider"
            disabled={submitting}
          />
          {showValue ? (
            <div className="slider-value">
              {value} / {max}
            </div>
          ) : (
            <div className="slider-hint">Select a value</div>
          )}
        </div>
      )
    }

    if (question.type === 'multiple_choice') {
      const choices = Array.isArray(question.choices) ? question.choices : []
      if (choices.length === 0) {
        return (
          <div style={{ color: '#b0b0b0' }}>
            This question is missing choices. Please contact an administrator.
          </div>
        )
      }
      return (
        <div className="option-list">
          {choices.map((choice, index) => (
            <label
              key={index}
              className={`option-row ${answers[question.id] === index ? 'option-row--selected' : ''}`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={index}
                checked={answers[question.id] === index}
                onChange={() => handleAnswerChange(question.id, index)}
                disabled={submitting}
              />
              <span>{choice}</span>
            </label>
          ))}
        </div>
      )
    }

    if (question.type === 'boolean') {
      return (
        <div className="option-list option-list--horizontal">
          <label className={`option-row ${answers[question.id] === 1 ? 'option-row--selected' : ''}`}>
            <input
              type="radio"
              name={`question-${question.id}`}
              value={1}
              checked={answers[question.id] === 1}
              onChange={() => handleAnswerChange(question.id, 1)}
              disabled={submitting}
            />
            <span>{question.true_label || 'Yes'}</span>
          </label>
          <label className={`option-row ${answers[question.id] === 0 ? 'option-row--selected' : ''}`}>
            <input
              type="radio"
              name={`question-${question.id}`}
              value={0}
              checked={answers[question.id] === 0}
              onChange={() => handleAnswerChange(question.id, 0)}
              disabled={submitting}
            />
            <span>{question.false_label || 'No'}</span>
          </label>
        </div>
      )
    }

    const { min, max } = getScaleBounds(question)
    const value = getScaleDisplayedValue(question)
    const showValue = hasDraftValue(question) || answeredQuestionIds.has(question.id)
    return (
      <div className="slider-container">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value))}
          className="slider"
          disabled={submitting}
        />
        {showValue ? (
          <div className="slider-value">
            {value} / {max}
          </div>
        ) : (
          <div className="slider-hint">Select a value</div>
        )}
      </div>
    )
  }

  const goPrev = () => {
    if (currentQuestionId === null) return
    const inAnswered = answeredQuestionIds.has(currentQuestionId)
    const groupIds = inAnswered ? answeredIds : unansweredIds
    const idx = groupIds.findIndex(id => id === currentQuestionId)
    if (idx <= 0) return
    setCurrentQuestionId(groupIds[idx - 1])
  }

  const handleNext = async () => {
    if (!currentQuestion) return

    const allAnsweredBefore = answeredQuestionIds.size === totalQuestions
    setSubmitting(true)
    const wasAnswered = answeredQuestionIds.has(currentQuestion.id)
    const result = await saveAnswerIfNeeded(currentQuestion)
    if (!result.ok) {
      setSubmitting(false)
      return
    }

    const nextAnsweredIds = result.nextAnsweredIds ?? answeredQuestionIds
    const nextAnswered = orderedQuestions.filter(q => nextAnsweredIds.has(q.id)).map(q => q.id)
    const nextAnsweredCount = nextAnswered.length
    const allAnsweredNow = nextAnsweredCount === totalQuestions

    if (!allAnsweredBefore && allAnsweredNow) {
      setSuccess('All answers saved!')
      setTimeout(() => setSuccess(''), 900)
    }

    if (allAnsweredNow) {
      const nextOverallId = orderedQuestions[overallIndex + 1]?.id ?? null
      if (nextOverallId !== null) setCurrentQuestionId(nextOverallId)
      setSubmitting(false)
      return
    }

    const nextUnanswered = orderedQuestions.filter(q => !nextAnsweredIds.has(q.id)).map(q => q.id)
    if (!wasAnswered) {
      const afterCurrent = orderedQuestions.slice(overallIndex + 1).map(q => q.id)
      const nextId = afterCurrent.find(id => !nextAnsweredIds.has(id)) ?? nextUnanswered[0] ?? null
      if (nextId !== null) setCurrentQuestionId(nextId)
      setSubmitting(false)
      return
    }

    const answeredIdx = nextAnswered.findIndex(id => id === currentQuestion.id)
    const nextAnsweredId = answeredIdx === -1 ? null : (nextAnswered[answeredIdx + 1] ?? null)
    if (nextAnsweredId !== null) {
      setCurrentQuestionId(nextAnsweredId)
      setSubmitting(false)
      return
    }

    if (nextUnanswered[0] !== undefined) {
      setCurrentQuestionId(nextUnanswered[0])
      setSubmitting(false)
      return
    }

    setSubmitting(false)
  }

  if (loading) {
    return <div className="card loading">Loading questions...</div>
  }

  if (questionList.length === 0) {
    return <div className="card">No questions available yet. Check back later!</div>
  }

  const inAnswered = currentQuestionId !== null && answeredQuestionIds.has(currentQuestionId)
  const groupIds = inAnswered ? answeredIds : unansweredIds
  const groupIndex = currentQuestionId === null ? -1 : groupIds.findIndex(id => id === currentQuestionId)

  const currentTextFallback = currentQuestionId === null
    ? ''
    : (orderedQuestions.find(q => q.id === currentQuestionId)?.text ?? '')

  return (
    <div className="card">
      <h2>Answer Questions</h2>
      <p className="survey-intro">
        Pick a question from the list. Answers save when you click Next.
      </p>

      <div className="survey-layout">
        <div className="survey-sidebar">
          <div className="survey-list-section">
            <div className="survey-list-title">Unanswered ({unansweredIds.length})</div>
            <div className="survey-list">
              {orderedQuestions.filter(q => !answeredQuestionIds.has(q.id)).map((q) => (
                <button
                  key={q.id}
                  type="button"
                  className={`survey-list-item ${q.id === currentQuestionId ? 'survey-list-item--active' : ''}`}
                  onClick={() => setCurrentQuestionId(q.id)}
                  disabled={submitting}
                  title={q.text}
                >
                  <span className="survey-list-item-meta">Q{(overallIndexById[q.id] ?? 0) + 1}</span>
                  <span className="survey-list-item-text">{q.text}</span>
                </button>
              ))}
              {unansweredIds.length === 0 && (
                <div className="survey-list-empty">All questions answered.</div>
              )}
            </div>
          </div>

          <div className="survey-list-section">
            <div className="survey-list-title">Answered ({answeredIds.length})</div>
            <div className="survey-list">
              {orderedQuestions.filter(q => answeredQuestionIds.has(q.id)).map((q) => (
                <button
                  key={q.id}
                  type="button"
                  className={`survey-list-item ${q.id === currentQuestionId ? 'survey-list-item--active' : ''}`}
                  onClick={() => setCurrentQuestionId(q.id)}
                  disabled={submitting}
                  title={q.text}
                >
                  <span className="survey-list-item-meta">Q{(overallIndexById[q.id] ?? 0) + 1}</span>
                  <span className="survey-list-item-text">{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="survey-main">
          <div className="survey-topbar">
            <div className="survey-progress">
              <div className="survey-progress-meta">
                <span>
                  Answered {answeredCount} / {totalQuestions}
                </span>
                <span>
                  {progressPercent}% • Q{Math.min(overallIndex + 1, totalQuestions)} / {totalQuestions}
                </span>
              </div>
              <div className="survey-progress-bar" aria-hidden="true">
                <div className="survey-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>

          <div
            className={`question-item ${currentQuestionId !== null && answeredQuestionIds.has(currentQuestionId) ? 'question-item--answered' : 'question-item--new'}`}
          >
            <div className="question-header">
              <div className="question-text">{currentQuestion?.text ?? currentTextFallback}</div>
              <div className="question-status">
                {currentQuestionId !== null && !answeredQuestionIds.has(currentQuestionId) && <span className="pill pill--new">Unanswered</span>}
                {currentQuestionId !== null && answeredQuestionIds.has(currentQuestionId) && <span className="pill pill--saved">Answered</span>}
                {currentQuestion && isQuestionDirty(currentQuestion) && <span className="pill pill--dirty">Unsaved changes</span>}
              </div>
            </div>

            {loadingQuestion || !currentQuestion ? (
              <div style={{ color: '#b0b0b0' }}>Loading question...</div>
            ) : (
              renderQuestionInput(currentQuestion)
            )}

            <div className="survey-pager">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={goPrev}
                disabled={submitting || groupIndex <= 0}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNext}
                disabled={submitting || !currentQuestion || (unansweredIds.length === 0 && overallIndex >= totalQuestions - 1)}
              >
                {submitting ? 'Saving...' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
