'use client'

import MarkdownPreview from '@uiw/react-markdown-preview'

interface MarkdownMessageProps {
  content: string
  className?: string
}

export function MarkdownMessage({ content, className = '' }: MarkdownMessageProps) {
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <MarkdownPreview 
        source={content}
        style={{
          backgroundColor: 'transparent',
          color: 'inherit',
          fontSize: 'inherit',
          lineHeight: 'inherit'
        }}
        wrapperElement={{
          'data-color-mode': 'light'
        }}
      />
    </div>
  )
}
