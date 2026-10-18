import { act, fireEvent, render, screen } from '@testing-library/react'
import { ResponsibilityGate } from '../components/ResponsibilityGate'
import i18n from '../i18n'
import { TERMS_VERSION, useTerms } from '../store/terms'

const App = () => (
  <ResponsibilityGate>
    <p>App content</p>
  </ResponsibilityGate>
)

describe('ResponsibilityGate', () => {
  beforeEach(async () => {
    localStorage.clear()
    useTerms.setState({ acceptedVersion: null, acceptedAt: null, viewing: false })
    await i18n.changeLanguage('en')
  })

  it('blocks the app until the learner checks the box and accepts', () => {
    render(<App />)
    expect(screen.getByRole('dialog', { name: /Before you start/ })).toBeInTheDocument()
    expect(screen.queryByText('App content')).not.toBeInTheDocument()

    const accept = screen.getByRole('button', { name: 'Accept and continue' })
    expect(accept).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox'))
    expect(accept).toBeEnabled()
    fireEvent.click(accept)

    expect(screen.getByText('App content')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(useTerms.getState().acceptedVersion).toBe(TERMS_VERSION)
    expect(JSON.parse(localStorage.getItem('pq-terms')!).state.acceptedVersion).toBe(TERMS_VERSION)
  })

  it('explains what happens when the learner declines', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'I don’t accept' }))
    expect(screen.getByRole('heading', { name: /You need to accept/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /original repository/ })).toHaveAttribute(
      'href',
      'https://github.com/Asabeneh/30-Days-Of-Python',
    )
    expect(screen.queryByText('App content')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Read the notice again' }))
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('asks again when the notice changes', () => {
    useTerms.setState({ acceptedVersion: 'old-version', acceptedAt: '2026-01-01T00:00:00Z' })
    render(<App />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('can be read again later without blocking the app', () => {
    useTerms.setState({ acceptedVersion: TERMS_VERSION, acceptedAt: '2026-10-18T15:00:00Z' })
    render(<App />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    act(() => useTerms.getState().show())
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Accepted on/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('is available in Spanish', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'es' }))
    expect(screen.getByRole('dialog', { name: /Antes de empezar/ })).toBeInTheDocument()
    expect(screen.getByText(/bajo tu propia responsabilidad personal/)).toBeInTheDocument()
  })
})
