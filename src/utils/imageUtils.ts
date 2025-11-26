/**
 * 图片处理工具
 */

/**
 * 将文件转换为 Base64
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * 压缩图片
 * @param file 原始文件
 * @param maxWidth 最大宽度
 * @param maxHeight 最大高度
 * @param quality 质量 (0-1)
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        
        // 计算缩放比例
        let width = img.width
        let height = img.height
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
        
        canvas.width = width
        canvas.height = height
        
        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height)
        
        // 转换为 Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          file.type,
          quality
        )
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * 验证图片文件
 */
export function validateImageFile(file: File, maxSize: number = 10 * 1024 * 1024): {
  valid: boolean
  error?: string
} {
  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: '不支持的图片格式，请上传 JPG、PNG、GIF 或 WebP 格式的图片'
    }
  }
  
  // 检查文件大小
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `图片大小不能超过 ${(maxSize / 1024 / 1024).toFixed(0)}MB`
    }
  }
  
  return { valid: true }
}

/**
 * 保存图片到 IndexedDB
 */
export async function saveImageToDb(
  file: File,
  type: 'food' | 'posture' | 'equipment' | 'progress' | 'other',
  userId: string
): Promise<string> {
  const { db } = await import('@/db')
  
  // 压缩图片
  const compressed = await compressImage(file)
  
  const id = crypto.randomUUID()
  
  await db.images.add({
    id,
    userId,
    type,
    blob: compressed,
    mimeType: file.type,
    size: compressed.size,
    capturedAt: new Date(),
    tags: []
  } as any)
  
  return id
}

/**
 * 从 IndexedDB 获取图片
 */
export async function getImageFromDb(imageId: string): Promise<string | null> {
  const { db } = await import('@/db')
  
  const image = await db.images.get(imageId)
  
  if (!image) {
    return null
  }
  
  // 将 Blob 转换为 Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      resolve(reader.result as string)
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read image'))
    }
    
    reader.readAsDataURL(image.blob)
  })
}

/**
 * 创建图片预览 URL
 */
export function createImagePreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

/**
 * 释放图片预览 URL
 */
export function revokeImagePreviewUrl(url: string): void {
  URL.revokeObjectURL(url)
}

