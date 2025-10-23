'use client'

import { Badge } from '@/components/ui/badge'
import type { ResponseMetrics } from '@/lib/shared/types/llm-response'

interface ConfidenceIndicatorProps {
  confidence: number
  metrics?: ResponseMetrics
}

export function ConfidenceIndicator({ confidence, metrics }: ConfidenceIndicatorProps) {
  const getConfidenceColor = (conf: number) => {
    if (conf > 0.8) return 'bg-green-100 text-green-800 border-green-200'
    if (conf > 0.5) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getConfidenceLabel = (conf: number) => {
    if (conf > 0.8) return 'High confidence'
    if (conf > 0.5) return 'Medium confidence'
    return 'Low confidence'
  }

  return (
    <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
      <Badge 
        variant="outline" 
        className={`${getConfidenceColor(confidence)} border`}
      >
        {getConfidenceLabel(confidence)} ({(confidence * 100).toFixed(0)}%)
      </Badge>
      
      {metrics?.processingTime && (
        <span className="text-gray-400">
          {(metrics.processingTime / 1000).toFixed(1)}s
        </span>
      )}
      
      {metrics?.tokenUsage?.total && (
        <span className="text-gray-400">
          {metrics.tokenUsage.total} tokens
        </span>
      )}
    </div>
  )
}
