'use client'

import { useState } from 'react'
import { SourceCard } from './source-card'
import type { EnhancedSource, Citation } from '@/lib/shared/types/llm-response'

interface SourcesPanelProps {
  sources: EnhancedSource[]
  citations: Citation[]
}

export function SourcesPanel({ sources, citations }: SourcesPanelProps) {
  const [expanded, setExpanded] = useState(false)

  if (sources.length === 0) return null

  return (
    <div className="mt-3 border-t border-gray-200 pt-3">
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="text-xs text-blue-600 hover:underline hover:text-blue-800 transition-colors flex items-center gap-1"
      >
        <span>{expanded ? 'Hide' : 'Show'} {sources.length} source{sources.length !== 1 ? 's' : ''}</span>
        <span className={`transform transition-transform ${expanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      
      {expanded && (
        <div className="mt-3 space-y-2">
          {sources.map((source, i) => (
            <SourceCard key={source.id} source={source} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
