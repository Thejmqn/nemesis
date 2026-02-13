import { useState, useEffect } from 'react'
import { questionsAPI, answersAPI } from '../services/api'

export default function SurveyView({ setError, setSuccess }) {
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchQuestions()
    fetchUserAnswers()
  }, [])

  const fetchQuestions = async () => {
    try {
      const questionsData = await questionsAPI.getAll(true)
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
      setAnsweredQuestionIds(answeredIds)
    } catch (err) {
      console.error('Error fetching answers:', err)
    }
  }

  const handleAnswerChange = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    const answerList = Object.entries(answers).map(([questionId, value]) => ({
      question_id: parseInt(questionId),
      answer_value: value
    }))

    try {
      await answersAPI.submitSurvey({ answers: answerList })
      setSuccess('Answers saved successfully!')
      fetchUserAnswers()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save answers')
    } finally {
      setSubmitting(false)
    }
  }

  const renderQuestionInput = (question) => {
    if (question.type === 'scale') {
      // Scale question (1-10 slider)
      const min = question.min || 1
      const max = question.max || 10
      const defaultValue = Math.floor((min + max) / 2)
      const value = answers[question.id] ?? defaultValue
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
          <div className="slider-value">
            {value} / {max}
          </div>
        </div>
      )
    } else if (question.type === 'multiple_choice') {
      // Multiple choice question
      return (
        <div className="option-list">
          {question.choices.map((choice, index) => (
            <label key={index} className="option-row">
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
          <label className="option-row">
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
          <label className="option-row">
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
    const defaultQuestion = { ...question, type: 'scale', min: 1, max: 10 }
    const defaultValue = Math.floor((defaultQuestion.min + defaultQuestion.max) / 2)
    const value = answers[defaultQuestion.id] ?? defaultValue
    return (
      <div className="slider-container">
        <input
          type="range"
          min={defaultQuestion.min}
          max={defaultQuestion.max}
          value={value}
          onChange={(e) => handleAnswerChange(defaultQuestion.id, parseInt(e.target.value))}
          className="slider"
          disabled={submitting}
        />
        <div className="slider-value">
          {value} / {defaultQuestion.max}
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="card loading">Loading questions...</div>
  }

  if (questions.length === 0) {
    return <div className="card">No questions available yet. Check back later!</div>
  }

  // Separate questions into answered and unanswered
  const unansweredQuestions = questions.filter(q => !answeredQuestionIds.has(q.id))
  const answeredQuestions = questions.filter(q => answeredQuestionIds.has(q.id))

  return (
    <div className="card">
      <h2>Answer Questions</h2>
      <p className="survey-intro">
        Answer each question according to its format. You can update your answers at any time.
      </p>
      <form onSubmit={handleSubmit}>
        {unansweredQuestions.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#FFA586', marginBottom: '15px' }}>
              New Questions ({unansweredQuestions.length})
            </h3>
            {unansweredQuestions.map(question => (
              <div key={question.id} className="question-item question-item--new">
                <div className="question-text">{question.text}</div>
                {renderQuestionInput(question)}
              </div>
            ))}
          </div>
        )}

        {answeredQuestions.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#FFA586', marginBottom: '15px' }}>
              Your Answers ({answeredQuestions.length})
            </h3>
            <p style={{ fontSize: '14px', color: '#b0b0b0', marginBottom: '15px' }}>
              You can modify your answers below.
            </p>
            {answeredQuestions.map(question => (
              <div key={question.id} className="question-item question-item--answered">
                <div className="question-text">{question.text}</div>
                {renderQuestionInput(question)}
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting || Object.keys(answers).length === 0}
          style={{ marginTop: '20px', width: '100%' }}
        >
          {submitting ? 'Saving...' : 'Save Answers'}
        </button>
      </form>
    </div>
  )
}
