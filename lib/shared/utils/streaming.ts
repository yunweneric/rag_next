import type { AssistantResponseV2 } from '@/lib/shared/types/llm-response'

export class StreamingResponse {
  static createStream(
    onToken: (token: string) => void,
    onComplete: (data: AssistantResponseV2) => void,
    onError?: (error: string) => void
  ): ReadableStream {
    return new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        
        const sendEvent = (event: string, data: any) => {
          const eventData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(eventData))
        }

        // Store the callbacks for external use
        (controller as any).onToken = (token: string) => {
          sendEvent('token', { token })
          onToken(token)
        }

        (controller as any).onMetadata = (metadata: any) => {
          sendEvent('metadata', metadata)
        }

        (controller as any).onComplete = (data: AssistantResponseV2) => {
          sendEvent('complete', data)
          onComplete(data)
          controller.close()
        }

        (controller as any).onError = (error: string) => {
          sendEvent('error', { error })
          onError?.(error)
          controller.close()
        }
      }
    })
  }

  static parseStreamEvent(event: string): { type: string; data: any } | null {
    try {
      const lines = event.split('\n')
      let eventType = ''
      let data = ''

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.substring(7)
        } else if (line.startsWith('data: ')) {
          data = line.substring(6)
        }
      }

      if (eventType && data) {
        return {
          type: eventType,
          data: JSON.parse(data)
        }
      }

      return null
    } catch (error) {
      console.error('Error parsing stream event:', error)
      return null
    }
  }
}
