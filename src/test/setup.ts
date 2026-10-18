import '@testing-library/jest-dom/vitest'
import '../i18n'

// CodeMirror measures text positions; jsdom has no layout engine, so return empty boxes.
const emptyRect = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  toJSON: () => ({}),
}
Range.prototype.getClientRects = () =>
  Object.assign([], { item: () => null }) as unknown as DOMRectList
Range.prototype.getBoundingClientRect = () => emptyRect as DOMRect
