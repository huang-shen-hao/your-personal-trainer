import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface ImageRecord {
  id: string
  userId: string
  type: 'food' | 'posture' | 'equipment' | 'progress' | 'other'
  blob: Blob
  mimeType: string
  size: number // bytes
  width?: number
  height?: number
  capturedAt: Date
  tags?: string[]
  metadata?: Record<string, any>
}

export interface AnalysisResult {
  id: string
  imageId: string
  analysisType: 'food' | 'posture' | 'equipment'
  result: any
  confidence?: number
  modelVersion?: string
  timestamp: Date
}

export const useMediaStore = defineStore('media', () => {
  const images = ref<ImageRecord[]>([])
  const analysisResults = ref<Map<string, AnalysisResult>>(new Map())

  const imagesByType = computed(() => {
    const grouped: Record<string, ImageRecord[]> = {
      food: [],
      posture: [],
      equipment: [],
      progress: [],
      other: []
    }
    
    images.value.forEach(img => {
      if (grouped[img.type]) {
        grouped[img.type].push(img)
      }
    })
    
    return grouped
  })

  const totalImageSize = computed(() => {
    return images.value.reduce((sum, img) => sum + img.size, 0)
  })

  const totalImageCount = computed(() => images.value.length)

  function addImage(image: ImageRecord) {
    images.value.push(image)
  }

  function getImage(id: string) {
    return images.value.find(img => img.id === id)
  }

  function deleteImage(id: string) {
    images.value = images.value.filter(img => img.id !== id)
    analysisResults.value.delete(id)
  }

  function addAnalysisResult(result: AnalysisResult) {
    analysisResults.value.set(result.imageId, result)
  }

  function getAnalysisResult(imageId: string) {
    return analysisResults.value.get(imageId)
  }

  function updateImageTags(id: string, tags: string[]) {
    const image = images.value.find(img => img.id === id)
    if (image) {
      image.tags = tags
    }
  }

  function getImagesByDateRange(startDate: Date, endDate: Date) {
    return images.value.filter(img => {
      const capturedAt = new Date(img.capturedAt)
      return capturedAt >= startDate && capturedAt <= endDate
    })
  }

  function clearOldImages(daysToKeep: number = 90) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    
    images.value = images.value.filter(img => {
      const capturedAt = new Date(img.capturedAt)
      return capturedAt >= cutoffDate
    })
  }

  return {
    images,
    analysisResults,
    imagesByType,
    totalImageSize,
    totalImageCount,
    addImage,
    getImage,
    deleteImage,
    addAnalysisResult,
    getAnalysisResult,
    updateImageTags,
    getImagesByDateRange,
    clearOldImages
  }
})

