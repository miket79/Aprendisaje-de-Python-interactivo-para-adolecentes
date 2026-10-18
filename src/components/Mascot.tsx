import { motion, useReducedMotion } from 'motion/react'

export type MascotMood = 'happy' | 'thinking' | 'cheer'

interface Props {
  talking?: boolean
  mood?: MascotMood
  className?: string
}

const INK = '#111'

/**
 * Pip: an original stick-figure guide with a big round head and a backwards
 * cap in Python blue & yellow. Pure SVG + Motion, so it stays tiny and crisp.
 */
export function Mascot({ talking = false, mood = 'happy', className }: Props) {
  const reduce = useReducedMotion()
  const cheer = mood === 'cheer'
  const lookX = mood === 'thinking' ? 6 : 0

  return (
    <motion.svg
      viewBox="0 0 200 270"
      className={className}
      role="img"
      aria-label="Pip"
      animate={reduce ? undefined : { y: cheer ? [0, -16, 0] : [0, -4, 0] }}
      transition={{ duration: cheer ? 0.55 : 2.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <g stroke={INK} strokeWidth={7} strokeLinecap="round" fill="none">
        {/* body + legs */}
        <line x1="100" y1="138" x2="100" y2="205" />
        <line x1="100" y1="205" x2="72" y2="258" />
        <line x1="100" y1="205" x2="128" y2="258" />
        {/* arms: raised when cheering */}
        <motion.line
          x1="100"
          y1="160"
          x2="62"
          y2="195"
          style={{ originX: 1, originY: 0 }}
          animate={{ rotate: cheer ? 105 : mood === 'thinking' ? 60 : 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        />
        <motion.line
          x1="100"
          y1="160"
          x2="138"
          y2="195"
          style={{ originX: 0, originY: 0 }}
          animate={{ rotate: cheer ? -105 : 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        />
      </g>

      {/* head */}
      <circle cx="100" cy="80" r="58" fill="#fff" stroke={INK} strokeWidth={6} />

      {/* backwards cap */}
      <path
        d="M51.6 48 A58 58 0 0 1 148.4 48 Z"
        fill="#3776AB"
        stroke={INK}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <path
        d="M54 47 L16 54 Q14 43 56 38 Z"
        fill="#3776AB"
        stroke={INK}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <circle cx="100" cy="22" r="6" fill="#FFD43B" stroke={INK} strokeWidth={3} />

      {/* eyes (blink every few seconds) */}
      <motion.g
        animate={reduce ? undefined : { scaleY: [1, 1, 0.1, 1] }}
        transition={{ duration: 4, times: [0, 0.9, 0.95, 1], repeat: Infinity }}
      >
        <rect x={76 + lookX} y="62" width="9" height="24" rx="2" fill={INK} />
        <rect x={115 + lookX} y="62" width="9" height="24" rx="2" fill={INK} />
      </motion.g>

      {/* mouth */}
      {talking ? (
        <motion.ellipse
          cx="100"
          cy="112"
          rx="13"
          fill={INK}
          initial={{ ry: 3 }}
          animate={{ ry: [3, 10, 4, 9, 3] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        />
      ) : mood === 'thinking' ? (
        <line
          x1="86"
          y1="112"
          x2="116"
          y2="108"
          stroke={INK}
          strokeWidth={6}
          strokeLinecap="round"
        />
      ) : (
        <path
          d={cheer ? 'M76 104 Q100 134 124 104 Z' : 'M78 106 Q100 124 122 106'}
          fill={cheer ? INK : 'none'}
          stroke={INK}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </motion.svg>
  )
}
