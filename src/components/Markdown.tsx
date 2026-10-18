import ReactMarkdown from 'react-markdown'

/** Lesson text: Markdown with friendly styling for inline code and lists. */
export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        p: (props) => <p className="mb-3 last:mb-0" {...props} />,
        ul: (props) => <ul className="mb-3 list-disc space-y-1 pl-6" {...props} />,
        ol: (props) => <ol className="mb-3 list-decimal space-y-1 pl-6" {...props} />,
        code: (props) => (
          <code
            className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-py-blue"
            {...props}
          />
        ),
        strong: (props) => <strong className="font-semibold text-slate-900" {...props} />,
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
