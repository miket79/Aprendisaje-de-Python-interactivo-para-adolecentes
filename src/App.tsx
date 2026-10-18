import { MotionConfig } from 'motion/react'
import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router'
import { Header } from './components/Header'
import { ResponsibilityGate } from './components/ResponsibilityGate'
import { HomePage } from './pages/HomePage'
import { PwaStatus } from './pwa/PwaStatus'

// The lesson player (code editor, Python runtime) loads only when a lesson opens.
const LessonPage = lazy(() => import('./pages/LessonPage'))

export default function App() {
  return (
    // Respect the device's "reduce motion" setting for every animation.
    <MotionConfig reducedMotion="user">
      <ResponsibilityGate>
        <HashRouter>
          <Header />
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/day/:day" element={<LessonPage />} />
            </Routes>
          </Suspense>
        </HashRouter>
        <PwaStatus />
      </ResponsibilityGate>
    </MotionConfig>
  )
}
