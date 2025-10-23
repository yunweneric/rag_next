'use client'

import MarkdownPreview from '@uiw/react-markdown-preview'
import type { Citation } from '@/lib/shared/types/llm-response'

interface MarkdownMessageProps {
  content: string
  citations?: Citation[]
  className?: string
}

export function MarkdownMessage({ content, citations, className = '' }: MarkdownMessageProps) {
  // Transform [1] markers into clickable superscripts
  const contentWithSuperscripts = citations && citations.length > 0
    ? content.replace(/\[(\d+)\]/g, '<sup class="citation-marker text-blue-600 hover:text-blue-800 cursor-pointer font-semibold">[$1]</sup>')
    : content
  
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <MarkdownPreview 
        source={contentWithSuperscripts}
        style={{
          backgroundColor: 'transparent',
          color: 'inherit',
          fontSize: 'inherit',
          lineHeight: 'inherit'
        }}
        wrapperElement={{
          'data-color-mode': 'light'
        }}
        components={{
          sup: ({ children, ...props }) => (
            <sup 
              {...props} 
              className="citation-marker text-blue-600 hover:text-blue-800 cursor-pointer font-semibold text-xs"
              title="Click to view source"
            >
              {children}
            </sup>
          )
        }}
      />
    </div>
  )
}
