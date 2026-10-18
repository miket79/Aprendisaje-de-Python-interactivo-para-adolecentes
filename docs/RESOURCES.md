# Guía de dependencias y recursos: Python Quest

> App web interactiva para que adolescentes aprendan Python en 30 días, basada en el orden de temas de [30 Days Of Python](https://github.com/Asabeneh/30-Days-Of-Python). Inglés por defecto, con opción de español.
> Última actualización: 18 de octubre de 2026.

## 1. Decisiones principales

| Área | Elección | Por qué |
|---|---|---|
| Plataforma | App web: **React 19 + Vite 8 + TypeScript 6** | Funciona en cualquier navegador, incluidos los Chromebooks escolares. El hosting es gratis. |
| Ejecutar Python | **Pyodide 314** dentro de un *Web Worker* | Python real en el navegador, sin servidor. Si el alumno escribe un bucle infinito, la página no se congela: se corta a los 8 s y Python se reinicia. |
| Editor de código | **CodeMirror 6** (`@uiw/react-codemirror`) | Ligero, accesible y funciona en tablets. |
| Idiomas | **i18next + react-i18next** | Inglés por defecto y botón EN/ES. La elección se recuerda. Todo el contenido es bilingüe (EN/ES) en JSON. |
| Voz en off | **Kokoro-82M** local (`kokoro-onnx`) | Gratis, licencia Apache-2.0, buena calidad, genera MP3 en tu Mac. |
| Animación | **Motion** (antes Framer Motion) + SVG | Animaciones simples y ligeras. Respeta el ajuste "reducir movimiento". |
| Progreso | **zustand** + `localStorage` | Sin cuentas ni datos personales: el progreso se queda en el dispositivo. |
| Estilos | **Tailwind CSS 4**, fuentes **Lexend** y **JetBrains Mono** | Lexend se diseñó para facilitar la lectura. |

## 2. Lo que necesitas en tu Mac (solo una vez)

| Herramienta | Versión | Cómo instalar |
|---|---|---|
| Homebrew | la más reciente | <https://brew.sh> |
| Node.js | 22.12 o superior (LTS recomendado) | `brew install node` o el instalador LTS de <https://nodejs.org>. Evita `node@22`: Homebrew no lo agrega al PATH. |
| Python (para generar las voces) | 3.10 a 3.13 (recomendado 3.12) | `brew install python@3.12`. El Python 3.9 que trae macOS **no** sirve. |
| Git | cualquiera | Ya lo tienes |
| Editor (opcional) | VS Code | <https://code.visualstudio.com> |

### Primeros comandos

```bash
cd ~/tts/"Aprendisaje de Python interactivo para adolecentes"/"Aprendisaje de Python interactivo para adolecentes"
npm install          # instala las dependencias de la app (~1 min)
npm run dev          # abre la app en http://localhost:5173
```

Otros comandos útiles:

| Comando | Qué hace |
|---|---|
| `npm test` | Pruebas automáticas (contenido bilingüe completo, reglas de ejercicios, rachas, errores) |
| `npm run build` | Genera la versión publicable en `dist/` |
| `npm run lint` / `npm run format` | Revisa el código y le da formato |
| `npm run voice:setup` | Crea el entorno de Python para las voces (los modelos ya están descargados en `tools/tts/models/`) |
| `npm run voice` | Genera o actualiza los audios. Solo vuelve a grabar las frases que cambiaron. |
| `npm run package` | Crea los ejecutables para estudiantes en `release/` (requiere Go: `brew install go`). Ver sección 11. |

## 3. Dependencias de la app (`package.json`)

**Para el funcionamiento**

| Paquete | Para qué |
|---|---|
| `react`, `react-dom` (19) | Interfaz |
| `react-router` (8) | Navegación: mapa de días → lección. Usa *hash routing* para que funcione en cualquier hosting. |
| `pyodide` (314) | Python 3 compilado a WebAssembly. Los archivos se copian a `dist/pyodide/`, así que no dependen de un CDN (muchas redes escolares bloquean CDNs). |
| `@uiw/react-codemirror`, `@codemirror/lang-python` | Editor con colores de sintaxis |
| `i18next`, `react-i18next`, `i18next-browser-languagedetector` | Traducciones EN/ES |
| `howler` | Reproduce la voz en off. Si falta un audio, se usa la voz del navegador como respaldo. |
| `motion` | Animaciones de la mascota y de las transiciones |
| `zustand` | XP, rachas y pasos completados |
| `react-markdown` | Texto de las lecciones con formato |
| `canvas-confetti` | Celebraciones al acertar |
| `lucide-react` | Íconos |
| `workbox-window` | Registra el *service worker* que guarda la app para usarla sin internet |
| `@fontsource-variable/lexend`, `@fontsource-variable/jetbrains-mono` | Fuentes incluidas en la app (sin Google Fonts externos) |

**Para desarrollar**

| Paquete | Para qué |
|---|---|
| `vite`, `@vitejs/plugin-react`, `typescript` | Servidor de desarrollo y compilación |
| `tailwindcss`, `@tailwindcss/vite` | Estilos |
| `vite-plugin-static-copy` | Copia los archivos de Pyodide al build |
| `vite-plugin-pwa` | Convierte la app en instalable (manifest, íconos y *service worker*). Ver sección 13. |
| `vitest`, `@testing-library/*`, `jsdom` | Pruebas |
| `oxlint`, `prettier` | Calidad y formato del código |

**Para las voces (`tools/tts/requirements.txt`, Python)**: `kokoro-onnx 0.6.1` (incluye `onnxruntime` y `espeak-ng`) y `soundfile 0.14` (escribe los MP3 directamente, sin ffmpeg).

## 4. Voz en off: cómo funciona

1. El texto de cada paso vive en `src/content/lessons/day-XX.json`, en el campo `voice` (`en` y `es`). La app y el generador leen el mismo archivo.
2. `npm run voice` crea `public/audio/<idioma>/<día>/<paso>.mp3`. El Día 1 ya está generado: 14 clips, unos 2 minutos de audio y 1 MB en total.
3. Las voces se configuran en `tools/tts/voices.json`:
   - **Inglés:** `af_heart`, la voz mejor calificada de Kokoro (nota A).
   - **Español:** `ef_dora`, femenina. Hay alternativas masculinas: `em_alex` y `em_santa`.
4. Mientras habla, la mascota mueve la boca. Hay un botón para apagar la voz, útil en clase sin audífonos.

**Ten en cuenta:** Kokoro se entrenó con menos datos en español que en inglés. Escucha `public/audio/es/day-01/intro.mp3`. Si no te convence, hay dos opciones:

- **Piper** (gratis, voces `es_MX`).
- **ElevenLabs** (de pago, la más natural).

El script se puede adaptar a cualquiera de las dos.

Prueba rápida de cualquier frase: `tools/tts/.venv/bin/python tools/tts/generate_voiceovers.py --say "Hola" --lang es`

## 5. Contenido: el repositorio 30-Days-Of-Python

- **El repositorio no tiene archivo de licencia.** Sin licencia, en principio el autor conserva todos los derechos, así que no copiamos su texto ni sus imágenes. Usamos el **orden de temas** como guía y escribimos lecciones originales adaptadas a adolescentes. La app da crédito y enlaza al original.
- Si quieres traducir o reutilizar texto, imágenes o ejercicios tal cual, pide permiso al autor (Asabeneh Yetayeh) con un *issue* en GitHub o desde asabeneh.com. Esto no es asesoría legal.
- El repo incluye una traducción al español (carpeta `Spanish/`), útil como referencia de terminología. La misma advertencia aplica.
- **Días que no funcionan tal cual en el navegador** (marcados `browser: false` en `src/lessons/curriculum.ts`):

| Día | Tema | Adaptación propuesta |
|---|---|---|
| 20 | pip | `micropip` de Pyodide para paquetes en Python puro, y un video o simulación de `pip` en la terminal |
| 22 | Web scraping | Analizar HTML incluido en la lección: el navegador bloquea pedir páginas ajenas (CORS) |
| 23 | Entornos virtuales | Simulación guiada, más un reto opcional "en tu computadora" |
| 26 | Python web (Flask) | Conceptos de rutas y plantillas simulados, más un proyecto opcional en casa |
| 27 | MongoDB | Simular una base de datos con diccionarios y JSON |
| 28–29 | APIs | Consumir APIs públicas que permitan CORS (`pyodide.http`) y simular una API propia |

- Los días 24 y 25 (estadística y pandas) **sí** funcionan en Pyodide, pero `numpy` y `pandas` se descargan aparte. Cuando lleguemos ahí habrá que decidir entre auto-alojarlos (unos 10–20 MB) o usar el CDN de Pyodide.

## 6. Técnicas de aprendizaje para adolescentes (EE. UU.) y cómo se aplican

| Técnica | Evidencia | En la app |
|---|---|---|
| **PRIMM** (Predecir → Ejecutar → Investigar → Modificar → Crear) | Estudio con unos 500 alumnos de 11 a 14 años: el grupo con PRIMM sacó resultados significativamente mejores (Sentance et al., 2019) | ✅ Cada día sigue esa estructura. Cada paso muestra su etapa. |
| **Práctica de recuperación y práctica espaciada** | Las dos técnicas de "alta utilidad" en la revisión de Dunlosky et al. (2013). Releer y subrayar salieron de baja utilidad. | ✅ Preguntas de predicción. ⏭ Calentamiento al inicio de cada día con preguntas de días anteriores. |
| **Problemas de Parsons** (ordenar líneas de código) | Con ayuda de tipo Parsons, los estudiantes practicaron mejor y con más eficiencia, y aprendieron lo mismo (Hou, Ericson & Wang, 2023) | ⏭ Como ayuda cuando alguien se atasca en "Modificar" o "Crear" |
| **Gamificación moderada** | Meta-análisis de Sailer & Homner (2020): efectos de g = 0.49 en lo cognitivo, 0.36 en motivación y 0.25 en conducta. Competencia más colaboración funciona mejor que solo competencia. | ✅ XP, rachas y celebraciones. Sin rankings públicos por ahora. |
| **Respeto y autonomía** | De los 13 a los 17 años, los jóvenes son muy sensibles al respeto y al estatus. Las intervenciones tipo "el adulto sabe más" suelen fallar (Yeager, Dahl & Dweck, 2018). | ✅ Tono no infantil, retos con sus propios intereses (juegos, música, deportes) y errores explicados sin regañar |
| **Principios multimedia de Mayer** | Narración más imágenes, pasos cortos (segmentación), señalización y tono conversacional | ✅ Voz en off, pasos de 1–2 minutos, mascota y etiqueta de etapa |
| **Errores amigables** | Los mensajes de error estándar frustran a los principiantes | ✅ Traceback limpio, con la línea exacta y una explicación en lenguaje simple (EN/ES) |
| **Accesibilidad (UDL / WCAG 2.2)** | Varias formas de presentar la información | ✅ Lexend, "reducir movimiento" y voz apagable. ⏭ Subtítulos opcionales, modo oscuro y revisión de contraste. |

## 7. Privacidad

- La app **no tiene cuentas, no tiene analíticas y no recoge datos personales**. El progreso se guarda solo en el navegador.
- Si más adelante agregas cuentas, analíticas o uso en escuelas con menores de 13 años, revisa estas normas:
  - **COPPA**: la regla enmendada se cumple desde el 22 de abril de 2026.
  - **FERPA**: aplica a los datos escolares.
  - **Leyes estatales**: algunas protegen a menores de 18.

Esto no es asesoría legal.

## 8. Recursos gráficos y de sonido

- **Mascota "Pip":** un SVG original (`src/components/Mascot.tsx`), una figura de palo con cabeza grande y gorra al revés en los colores de Python. Sigue el estilo de tus imágenes de referencia, pero con diseño propio.
- **Fondos y escenas** (salón, gimnasio, escenario): se pueden diseñar en **Figma**, que ya tienes conectado.
- **Recursos gratuitos:**

| Recurso | Qué ofrece | Licencia |
|---|---|---|
| Kenney.nl | Ilustraciones y efectos de sonido | CC0, sin atribución |
| unDraw | Ilustraciones | Licencia libre propia |
| OpenMoji | Emojis | CC BY-SA 4.0, requiere atribución |
| Lucide | Íconos | ISC, ya instalado |
| Freesound | Sonidos | Varía según el archivo; revisa cada uno |
| LottieFiles | Animaciones más elaboradas | Revisa la licencia de cada una. Habría que agregar `@lottiefiles/dotlottie-react`. |

## 9. Publicación (hosting)

- **GitHub Pages** (tu repo `miket79/Aprendisaje-de-Python-interactivo-para-adolecentes`): ya está listo. El *workflow* `.github/workflows/deploy-pages.yml` publica en cada `git push`. Los pasos para activarlo están en la sección 13. Netlify, Vercel y Cloudflare Pages son alternativas.
- **`input()` interactivo:** el alumno tendría que escribir mientras el programa corre, y eso requiere `SharedArrayBuffer`. A su vez, eso necesita cabeceras de aislamiento (COOP/COEP), que GitHub Pages no permite configurar. Las soluciones son `coi-serviceworker` o usar Netlify/Cloudflare. Mientras tanto, `input()` lee respuestas predefinidas por la lección.

## 10. Estado y próximos pasos

**Hecho**

- ✅ App instalable desde el navegador (PWA) que funciona sin internet, con publicación automática en GitHub Pages (sección 13)
- ✅ Ejecutables autónomos para macOS y Windows (sección 11)
- ✅ Ventana de responsabilidad personal sobre el contenido de 30 Days Of Python (sección 12)
- ✅ Proyecto creado, compilando y con 15 pruebas pasando
- ✅ El Día 1 completo funciona de principio a fin en un navegador real, en inglés y español
- ✅ Python corre en el navegador, con protección contra bucles infinitos y errores explicados
- ✅ Voces EN/ES del Día 1 generadas con Kokoro

**Pendiente**

- ⏭ Contenido de los días 2 a 30, empezando por el 2 (variables), que necesita `input()`
- ⏭ Ejercicios de Parsons y calentamiento de repaso
- ⏭ Escenas de fondo y más poses de la mascota
- ⏭ Subtítulos opcionales para la voz
- ⏭ Pruebas end-to-end con Playwright en el repo
- ⏭ Firmar los ejecutables, si se siguen usando, para quitar las advertencias de macOS y Windows

## 11. Ejecutables para estudiantes (sin instalar nada)

| Archivo | Sistema | Cómo se usa |
|---|---|---|
| `release/PythonQuest-Mac` (28 MB) | macOS 11 o superior, Apple Silicon e Intel (binario universal) | Doble clic. Se abre una ventana de Terminal y la app se abre en el navegador. |
| `release/PythonQuest-Windows.exe` (14 MB) | Windows 10/11 x64 (también funciona en equipos ARM) | Doble clic. Se abre una consola y la app se abre en el navegador. |

**Cómo funciona.** Cada archivo es un pequeño servidor escrito en Go que lleva **toda la app adentro**: Python (Pyodide), las voces, las fuentes y las imágenes. No hay que instalar Node, Python ni nada más, y funciona sin internet. Solo sirve la app a la propia computadora, en `http://127.0.0.1:51730`, nunca a la red.

- **Cerrar la app:** se cierra la ventana de Terminal o la consola.
- **Si se abre dos veces:** la segunda vez solo abre el navegador.
- **El progreso:** se guarda en el navegador de cada computadora. El puerto es fijo para que no se pierda entre una sesión y otra.

**La primera vez aparece una advertencia, porque los archivos no están firmados:**

- **macOS:** clic derecho → **Abrir**. En macOS 15 o superior: *Ajustes del Sistema → Privacidad y seguridad → Abrir de todos modos*. Si el archivo pierde el permiso de ejecución al copiarlo, en Terminal: `chmod +x PythonQuest-Mac`.
- **Windows (SmartScreen):** **Más información → Ejecutar de todas formas**. Algunos antivirus desconfían de ejecutables nuevos sin firma. Firmarlos lo evita.

Para quitar estas advertencias hay que firmar los archivos:

- **macOS:** un *Developer ID* del Apple Developer Program (membresía de pago) más la notarización de Apple.
- **Windows:** un certificado de firma de código.

**Volver a generar los ejecutables** (después de cambiar lecciones, audios o código):

```bash
brew install go        # una sola vez
npm run package        # crea release/PythonQuest-Mac y release/PythonQuest-Windows.exe
```

La carpeta `release/` está excluida de git porque los ejecutables pesan mucho. Para compartirlos, súbelos como *Release* en GitHub, a Google Drive o a una memoria USB.

## 12. Ventana de responsabilidad personal

- **Cuándo aparece:** al abrir la app por primera vez en cada dispositivo, sea con el ejecutable o en la web. Nada más carga hasta que la persona marca la casilla y pulsa **Aceptar y continuar**.
- **Si no acepta:** la app explica que hace falta aceptar y enlaza al repositorio original.
- **Qué dice:** está en inglés y español, y explica que el repositorio original no tiene licencia. La persona acepta usar el contenido bajo su propia responsabilidad, solo para aprender y sin copiar, publicar ni vender el material original sin el permiso del autor. Para menores de 18 años recomienda leerlo con su madre, padre o tutor.
- **Dónde se guarda:** solo en ese navegador, con la fecha. Se puede volver a leer desde el enlace **Aviso de responsabilidad** al pie del mapa de días.
- **Cómo cambiar el texto:** se edita en `src/i18n/locales/en.json` y `es.json` (sección `terms`). Después se cambia `TERMS_VERSION` en `src/store/terms.ts` para que todos lo acepten de nuevo.

**Importante:** el aviso deja clara la responsabilidad de cada usuario, pero **no da permiso para copiar** el contenido del repositorio original. Además, que un menor acepte tiene poco peso legal. Por eso sigue siendo importante que las lecciones sean originales y, si quieres reutilizar material de Asabeneh, pedirle permiso. Esto no es asesoría legal.

## 13. App instalable (PWA): la opción recomendada para estudiantes

Es la forma de evitar los conflictos de permisos. Python Quest se publica una vez en **GitHub Pages**, que es gratis. Cada estudiante la **instala desde Chrome o Edge** con un clic, y desde ese momento funciona **sin internet**, como una app local. No se descarga ningún ejecutable, así que macOS y Windows no muestran advertencias.

**Cómo funciona**
- Un *service worker* guarda en el dispositivo toda la app la primera vez (unos 16 MB): Python/Pyodide, voces, fuentes y código.
- Probado en Chromium:
  - Chrome reporta 0 errores de instalabilidad y aparece el botón **Instalar app**.
  - Sin conexión, la página recarga, Python ejecuta código y se oyen las voces, en inglés y en español.
- Cuando publicas una versión nueva, la app muestra **"Hay una nueva versión → Actualizar"**. No se recarga sola, así que nadie pierde su lugar en la lección.
- El progreso y el aviso aceptado se guardan en cada dispositivo.
- El ejecutable de la sección 11 también es instalable, porque sirve la misma app.

**Publicarla (una sola vez)**

1. El repositorio `miket79/Aprendisaje-de-Python-interactivo-para-adolecentes` debe ser **público**. Con el plan gratuito de GitHub, Pages solo funciona en repos públicos; los privados requieren Pro, Team o Enterprise.
2. En GitHub, ve a **Settings → Pages → Build and deployment → Source** y elige **GitHub Actions**.
3. Sube el código desde Terminal:
   ```bash
   cd ~/tts/"Aprendisaje de Python interactivo para adolecentes"/"Aprendisaje de Python interactivo para adolecentes"
   git add -A
   git commit -m "Python Quest: app instalable (PWA) y despliegue a GitHub Pages"
   git push
   ```
4. En la pestaña **Actions** verás el *workflow* "Deploy to GitHub Pages" (`.github/workflows/deploy-pages.yml`). Primero corre las pruebas, luego compila y publica. Tarda unos 2 minutos.
5. La app queda en <https://miket79.github.io/Aprendisaje-de-Python-interactivo-para-adolecentes/>.

A partir de ahí, cada `git push` a `main` publica una versión nueva automáticamente.

**Para los estudiantes:** comparte el enlace y la guía bilingüe [`docs/INSTALL.md`](INSTALL.md), que explica cómo instalar en Chromebook, Windows, Mac, iPhone/iPad y Android.

**Ten en cuenta**
- **Equipos escolares:** algunos están administrados y no permiten instalar apps. En ese caso basta con abrir el enlace, que también funciona sin internet después de la primera visita.
- **Firefox:** no instala apps web en escritorio. Funciona como página normal; recomienda Chrome o Edge para instalarla.
- **Aviso de responsabilidad:** también aparece en la versión publicada, la primera vez en cada dispositivo.

## Fuentes

- GitHub Pages: [flujos de trabajo personalizados y planes disponibles](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) y [actions/deploy-pages](https://github.com/actions/deploy-pages)

- Pyodide: [uso con bundlers](https://pyodide.org/en/314.0.5/_sources/usage/working-with-bundlers.md) y [streams/stdin](https://pyodide.org/en/314.0.6/_sources/usage/streams.md)
- Kokoro: [archivos del modelo kokoro-onnx v1.0](https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0), [lista de voces y calificaciones](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md) y [guía de Kokoro (idiomas y licencia)](https://soniqo.audio/guides/kokoro)
- PRIMM: [Teaching Programming with PRIMM, Raspberry Pi Foundation](https://www.raspberrypi.org/app/uploads/2022/08/Teaching_Programming_with_PRIMM-1.pdf)
- Parsons: [Hou, Ericson & Wang (2023)](https://par.nsf.gov/servlets/purl/10510493)
- Gamificación: [Sailer & Homner (2020), meta-análisis](https://link.springer.com/article/10.1007/s10648-019-09498-w)
- Adolescentes: [Yeager, Dahl & Dweck (2018), UCLA Center for the Developing Adolescent](https://developingadolescent.semel.ucla.edu/topics/item/why-interventions-to-influence-adolescent-behavior-often-fail-but-could-succeed)
- Estrategias de estudio: [Dunlosky et al. (2013), APS](https://www.psychologicalscience.org/news/releases/which-study-strategies-make-the-grade.html)
- Multimedia: [Mayer, principios multimedia](https://ugc.futurelearn.com/uploads/files/7d/d6/7dd6188d-c343-4311-b064-ac98d2c95abc/Multimedia_Principles._R._E._Mayer__2020.pdf)
- COPPA: [fechas de la regla enmendada](https://www.ashurstperkinscoie.com/en/insights/ftc-finally-publishes-amended-coppa-rule-compliance-deadlines-set/)
