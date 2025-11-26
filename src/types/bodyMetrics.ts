/**
 * 体测数据相关类型定义
 */

export type MetricType = 
  | 'weight'           // 体重
  | 'bodyfat'          // 体脂率
  | 'muscle_mass'      // 肌肉量
  | 'chest'            // 胸围
  | 'waist'            // 腰围
  | 'hip'              // 臀围
  | 'arm'              // 臂围
  | 'thigh'            // 腿围
  | 'calf'             // 小腿围

export interface BodyMetric {
  id: string
  userId: string
  date: Date
  type: MetricType
  value: number
  unit: string
  note?: string
  photoUrls?: string[]
  createdAt: Date
}

export interface MetricEntry {
  date: Date
  value: number
  note?: string
}

export interface MetricConfig {
  type: MetricType
  label: string
  unit: string
  icon: string
  color: string
  min?: number
  max?: number
  step?: number
}

export const METRIC_CONFIGS: Record<MetricType, MetricConfig> = {
  weight: {
    type: 'weight',
    label: '体重',
    unit: 'kg',
    icon: '⚖️',
    color: '#409eff',
    min: 30,
    max: 300,
    step: 0.1
  },
  bodyfat: {
    type: 'bodyfat',
    label: '体脂率',
    unit: '%',
    icon: '📊',
    color: '#e6a23c',
    min: 5,
    max: 50,
    step: 0.1
  },
  muscle_mass: {
    type: 'muscle_mass',
    label: '肌肉量',
    unit: 'kg',
    icon: '💪',
    color: '#67c23a',
    min: 10,
    max: 100,
    step: 0.1
  },
  chest: {
    type: 'chest',
    label: '胸围',
    unit: 'cm',
    icon: '📏',
    color: '#f56c6c',
    min: 50,
    max: 150,
    step: 0.5
  },
  waist: {
    type: 'waist',
    label: '腰围',
    unit: 'cm',
    icon: '📏',
    color: '#909399',
    min: 40,
    max: 150,
    step: 0.5
  },
  hip: {
    type: 'hip',
    label: '臀围',
    unit: 'cm',
    icon: '📏',
    color: '#c084fc',
    min: 50,
    max: 150,
    step: 0.5
  },
  arm: {
    type: 'arm',
    label: '臂围',
    unit: 'cm',
    icon: '📏',
    color: '#34d399',
    min: 15,
    max: 60,
    step: 0.5
  },
  thigh: {
    type: 'thigh',
    label: '腿围',
    unit: 'cm',
    icon: '📏',
    color: '#fbbf24',
    min: 30,
    max: 100,
    step: 0.5
  },
  calf: {
    type: 'calf',
    label: '小腿围',
    unit: 'cm',
    icon: '📏',
    color: '#60a5fa',
    min: 20,
    max: 60,
    step: 0.5
  }
}

