import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { questionsAPI, answersAPI } from '../services/api'

export default function SurveyView({ setError = () => {}, setSuccess = () => {} }) {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [savedAnswers, setSavedAnswers] = useState({})
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState(new Set())
  const [currentQuestionId, setCurrentQuestionId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchQuestions()
    fetchUserAnswers()
  }, [])

  const fetchQuestions = async () => {
    try {
      const questionsData = await questionsAPI.getAll(true)
      if (!Array.isArray(questionsData)) {
        setError('Failed to load questions')
        setQuestions([])
        setLoading(false)
        return
      }
      setQuestions(questionsData)
      setLoading(false)
    } catch (err) {
      setError('Failed to load questions')
      setLoading(false)
    }
  }

  const fetchUserAnswers = async () => {
    try {
      const answersData = await answersAPI.getUserAnswers()
      const answerMap = {}
      const answeredIds = new Set()
      answersData.forEach(ans => {
        answerMap[ans.question_id] = ans.answer_value
        answeredIds.add(ans.question_id)
      })
      setAnswers(answerMap)
      setSavedAnswers(answerMap)
      setAnsweredQuestionIds(answeredIds)
    } catch (err) {
      console.error('Error fetching answers:', err)
    }
  }

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
      await answersAPI.create({ question_id: question.id, answer_value: value })
      const nextSaved = { ...savedAnswers, [question.id]: value }
      const nextAnsweredIds = new Set(answeredQuestionIds)
      nextAnsweredIds.add(question.id)
      setSavedAnswers(nextSaved)
      setAnsweredQuestionIds(nextAnsweredIds)
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
      // Scale question (1-10 slider; hide numeric value until user interacts or it was previously saved)
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
    } else if (question.type === 'multiple_choice') {
      // Multiple choice question
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
    } else if (question.type === 'boolean') {
      // Boolean/Yes-No question
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
    // Default to scale
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

  const orderedQuestions = useMemo(() => questions, [questions])

  useEffect(() => {
    if (orderedQuestions.length === 0) return
    if (currentQuestionId === null) {
      setCurrentQuestionId(orderedQuestions[0].id)
      return
    }
    const stillExists = orderedQuestions.some(q => q.id === currentQuestionId)
    if (!stillExists) setCurrentQuestionId(orderedQuestions[0].id)
  }, [orderedQuestions, currentQuestionId])

  const currentIndex = useMemo(() => {
    if (currentQuestionId === null) return 0
    const idx = orderedQuestions.findIndex(q => q.id === currentQuestionId)
    return idx === -1 ? 0 : idx
  }, [orderedQuestions, currentQuestionId])

  const currentQuestion = orderedQuestions[currentIndex]
  const totalQuestions = orderedQuestions.length
  const answeredCount = useMemo(() => {
    return orderedQuestions.reduce((count, q) => (answeredQuestionIds.has(q.id) ? count + 1 : count), 0)
  }, [orderedQuestions, answeredQuestionIds])
  const progressPercent = totalQuestions === 0 ? 0 : Math.round((answeredCount / totalQuestions) * 100)

  const goPrev = () => {
    if (currentIndex <= 0) return
    setCurrentQuestionId(orderedQuestions[currentIndex - 1].id)
  }

  const firstUnansweredId = useMemo(() => {
    const first = orderedQuestions.find(q => !answeredQuestionIds.has(q.id))
    return first?.id ?? null
  }, [orderedQuestions, answeredQuestionIds])

  const goToFirstUnanswered = () => {
    if (firstUnansweredId === null) return
    setCurrentQuestionId(firstUnansweredId)
  }

  const handleNext = async () => {
    if (!currentQuestion) return

    setSubmitting(true)
    const result = await saveAnswerIfNeeded(currentQuestion)
    if (!result.ok) {
      setSubmitting(false)
      return
    }

    const nextIndex = currentIndex + 1
    if (nextIndex < totalQuestions) {
      setCurrentQuestionId(orderedQuestions[nextIndex].id)
      setSubmitting(false)
      return
    }

    // Finish
    const nextAnsweredIds = result.nextAnsweredIds ?? answeredQuestionIds
    const nextAnsweredCount = orderedQuestions.reduce((count, q) => (nextAnsweredIds.has(q.id) ? count + 1 : count), 0)
    if (nextAnsweredCount === totalQuestions) {
      setSuccess('All answers saved!')
      setTimeout(() => {
        navigate('/matches')
        setSuccess('')
      }, 600)
    } else if (firstUnansweredId !== null) {
      setCurrentQuestionId(firstUnansweredId)
    }

    setSubmitting(false)
  }

  if (loading) {
    return <div className="card loading">Loading questions...</div>
  }

  if (questions.length === 0) {
    return <div className="card">No questions available yet. Check back later!</div>
  }

  return (
    <div className="card">
      <h2>Answer Questions</h2>
      <p className="survey-intro">
        Answer questions one at a time. Answers save when you click Next/Finish.
      </p>
      <div>
        <div className="survey-topbar">
          <div className="survey-jump">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={goToFirstUnanswered}
              disabled={firstUnansweredId === null}
              title="Jump to the first unanswered question"
            >
              First Unanswered
            </button>
          </div>

          <div className="survey-progress">
            <div className="survey-progress-meta">
              <span>
                Answered {answeredCount} / {totalQuestions}
              </span>
              <span>
                {progressPercent}% • Q{Math.min(currentIndex + 1, totalQuestions)} / {totalQuestions}
              </span>
            </div>
            <div className="survey-progress-bar" aria-hidden="true">
              <div className="survey-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        {currentQuestion && (
          <div
            key={currentQuestion.id}
            className={`question-item ${answeredQuestionIds.has(currentQuestion.id) ? 'question-item--answered' : 'question-item--new'}`}
          >
            <div className="question-header">
              <div className="question-text">{currentQuestion.text}</div>
              <div className="question-status">
                {!answeredQuestionIds.has(currentQuestion.id) && <span className="pill pill--new">Unanswered</span>}
                {answeredQuestionIds.has(currentQuestion.id) && <span className="pill pill--saved">Answered</span>}
                {isQuestionDirty(currentQuestion) && <span className="pill pill--dirty">Unsaved changes</span>}
              </div>
            </div>
            {renderQuestionInput(currentQuestion)}

            <div className="survey-pager">
              <button type="button" className="btn btn-secondary" onClick={goPrev} disabled={currentIndex <= 0}>
                Previous
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNext}
                disabled={submitting}
              >
                {currentIndex >= totalQuestions - 1 ? (submitting ? 'Finishing...' : 'Finish') : (submitting ? 'Saving...' : 'Next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
