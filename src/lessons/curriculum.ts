import type { Localized } from './types'

/**
 * The 30-day map, following the topic order of "30 Days Of Python"
 * (github.com/Asabeneh/30-Days-Of-Python). Titles are our own wording.
 * `browser` = can run 100% in the browser with Pyodide; otherwise the day
 * needs an adapted / simulated version (see docs/RESOURCES.md).
 */
export interface DayInfo {
  day: number
  title: Localized
  browser: boolean
}

const d = (day: number, en: string, es: string, browser = true): DayInfo => ({
  day,
  title: { en, es },
  browser,
})

export const CURRICULUM: DayInfo[] = [
  d(1, 'Hello, Python!', '¡Hola, Python!'),
  d(2, 'Variables & built-in functions', 'Variables y funciones integradas'),
  d(3, 'Operators', 'Operadores'),
  d(4, 'Strings', 'Cadenas de texto'),
  d(5, 'Lists', 'Listas'),
  d(6, 'Tuples', 'Tuplas'),
  d(7, 'Sets', 'Conjuntos'),
  d(8, 'Dictionaries', 'Diccionarios'),
  d(9, 'Conditionals', 'Condicionales'),
  d(10, 'Loops', 'Bucles'),
  d(11, 'Functions', 'Funciones'),
  d(12, 'Modules', 'Módulos'),
  d(13, 'List comprehensions', 'Comprensión de listas'),
  d(14, 'Higher-order functions', 'Funciones de orden superior'),
  d(15, 'Reading error messages', 'Leer mensajes de error'),
  d(16, 'Dates & times', 'Fechas y horas'),
  d(17, 'Handling exceptions', 'Manejo de excepciones'),
  d(18, 'Regular expressions', 'Expresiones regulares'),
  d(19, 'Working with files', 'Trabajar con archivos'),
  d(20, 'Packages with pip', 'Paquetes con pip', false),
  d(21, 'Classes & objects', 'Clases y objetos'),
  d(22, 'Web scraping', 'Web scraping', false),
  d(23, 'Virtual environments', 'Entornos virtuales', false),
  d(24, 'Statistics', 'Estadística'),
  d(25, 'Data with pandas', 'Datos con pandas'),
  d(26, 'Python for the web', 'Python para la web', false),
  d(27, 'Databases (MongoDB)', 'Bases de datos (MongoDB)', false),
  d(28, 'APIs', 'APIs', false),
  d(29, 'Build your own API', 'Crea tu propia API', false),
  d(30, 'Final project', 'Proyecto final'),
]
