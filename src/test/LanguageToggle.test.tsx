import { fireEvent, render, screen } from '@testing-library/react'
import i18n from '../i18n'
import { LanguageToggle } from '../components/LanguageToggle'

describe('LanguageToggle', () => {
  it('switches between English and Spanish', async () => {
    await i18n.changeLanguage('en')
    render(<LanguageToggle />)
    fireEvent.click(screen.getByRole('button', { name: 'es' }))
    expect(i18n.resolvedLanguage).toBe('es')
    expect(document.documentElement.lang).toBe('es')
    expect(screen.getByRole('button', { name: 'es' })).toHaveAttribute('aria-pressed', 'true')
  })
})
