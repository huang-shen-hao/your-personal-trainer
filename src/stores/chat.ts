import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface MessageImage {
  id: string
  imageId: string // 关联 images 表
  analysisType?: 'food' | 'posture' | 'equipment'
  analysisResult?: any
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  images?: MessageImage[]
  timestamp: Date
  metadata?: {
    model?: string
    tokensUsed?: number
    inferenceTime?: number
  }
}

export interface ChatSession {
  id: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
  messageCount: number
}

export const useChatStore = defineStore('chat', () => {
  const sessions = ref<ChatSession[]>([])
  const currentSessionId = ref<string | null>(null)
  const messages = ref<Map<string, ChatMessage[]>>(new Map())
  const isLoading = ref(false)

  const currentSession = computed(() => {
    return sessions.value.find(s => s.id === currentSessionId.value) || null
  })

  const currentMessages = computed(() => {
    if (!currentSessionId.value) return []
    return messages.value.get(currentSessionId.value) || []
  })

  function createSession(title: string = '新对话') {
    const session: ChatSession = {
      id: crypto.randomUUID(),
      userId: '', // 将在保存时填充
      title,
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0
    }
    sessions.value.push(session)
    messages.value.set(session.id, [])
    currentSessionId.value = session.id
    return session
  }

  function setCurrentSession(sessionId: string) {
    if (sessions.value.find(s => s.id === sessionId)) {
      currentSessionId.value = sessionId
    }
  }

  function addMessage(sessionId: string, message: ChatMessage) {
    const sessionMessages = messages.value.get(sessionId) || []
    sessionMessages.push(message)
    messages.value.set(sessionId, sessionMessages)

    // 更新会话信息
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      session.messageCount = sessionMessages.length
      session.updatedAt = new Date()
      
      // 如果是第一条用户消息，用它作为标题
      if (sessionMessages.length === 1 && message.role === 'user') {
        session.title = message.content.substring(0, 30) + (message.content.length > 30 ? '...' : '')
      }
    }
  }

  function updateMessage(sessionId: string, messageId: string, updates: Partial<ChatMessage>) {
    const sessionMessages = messages.value.get(sessionId)
    if (sessionMessages) {
      const index = sessionMessages.findIndex(m => m.id === messageId)
      if (index !== -1) {
        sessionMessages[index] = {
          ...sessionMessages[index],
          ...updates
        }
      }
    }
  }

  function deleteSession(sessionId: string) {
    sessions.value = sessions.value.filter(s => s.id !== sessionId)
    messages.value.delete(sessionId)
    if (currentSessionId.value === sessionId) {
      currentSessionId.value = sessions.value[0]?.id || null
    }
  }

  function clearAllSessions() {
    sessions.value = []
    messages.value.clear()
    currentSessionId.value = null
  }

  function renameSession(sessionId: string, newTitle: string) {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      session.title = newTitle
      session.updatedAt = new Date()
    }
  }

  return {
    sessions,
    currentSessionId,
    messages,
    isLoading,
    currentSession,
    currentMessages,
    createSession,
    setCurrentSession,
    addMessage,
    updateMessage,
    deleteSession,
    clearAllSessions,
    renameSession
  }
})

