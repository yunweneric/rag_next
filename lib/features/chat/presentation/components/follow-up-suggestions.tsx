'use client'

interface FollowUpSuggestionsProps {
  suggestions: string[]
  onSelect: (suggestion: string) => void
}

export function FollowUpSuggestions({ suggestions, onSelect }: FollowUpSuggestionsProps) {
  if (suggestions.length === 0) return null

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <p className="text-xs text-gray-500 mb-2">You might also ask:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, i) => (
          <button 
            key={i} 
            onClick={() => onSelect(suggestion)} 
            className="text-xs px-3 py-1.5 rounded-full border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors text-gray-700 hover:text-gray-900"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}
