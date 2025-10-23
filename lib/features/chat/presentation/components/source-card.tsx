'use client'

import { Badge } from '@/components/ui/badge'
import type { EnhancedSource } from '@/lib/shared/types/llm-response'

interface SourceCardProps {
  source: EnhancedSource
  index: number
}

export function SourceCard({ source, index }: SourceCardProps) {
  return (
    <div className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-blue-600">[{index + 1}]</span>
            <h4 className="text-sm font-medium text-gray-900">{source.title}</h4>
          </div>
          <p className="text-xs text-gray-500 mb-2">Page {source.page}</p>
          {source.snippet && (
            <p className="text-xs text-gray-600 leading-relaxed">{source.snippet}</p>
          )}
        </div>
        <div className="ml-3 flex flex-col items-end gap-1">
          <Badge variant="secondary" className="text-xs">
            {(source.score * 100).toFixed(0)}%
          </Badge>
          {source.url && (
            <a 
              href={source.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline hover:text-blue-800 transition-colors"
            >
              View source →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
