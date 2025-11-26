/**
 * System Prompt 模板库
 * 提供各类场景的预设 Prompt
 */

import type { PromptTemplate } from "@/types/ai";

// 导入 markdown 文件作为字符串
import basePrompt from "@/prompts/base.md?raw";
import strictPrompt from "@/prompts/strict.md?raw";
import encouragingPrompt from "@/prompts/encouraging.md?raw";
import humorousPrompt from "@/prompts/humorous.md?raw";
import academicPrompt from "@/prompts/academic.md?raw";
import planGenerationPrompt from "@/prompts/plan-generation.md?raw";
import imageAnalysisDietPrompt from "@/prompts/image-analysis-diet.md?raw";
import imageAnalysisPosturePrompt from "@/prompts/image-analysis-posture.md?raw";
import imageAnalysisEquipmentPrompt from "@/prompts/image-analysis-equipment.md?raw";

/**
 * 基础身份 Prompt（所有对话都包含）
 */
export const BASE_COACH_PROMPT = basePrompt;

/**
 * 性格预设 Prompts
 */
export const PERSONALITY_PROMPTS = {
  strict: strictPrompt,
  encouraging: encouragingPrompt,
  humorous: humorousPrompt,
  academic: academicPrompt,
};

/**
 * 场景化 Prompts
 */
export const SCENARIO_PROMPTS = {
  diet_analysis: imageAnalysisDietPrompt,
  posture_analysis: imageAnalysisPosturePrompt,
  equipment_recognition: imageAnalysisEquipmentPrompt,
  plan_generation: planGenerationPrompt,
  workout_guidance: `你正在指导用户完成训练。请提供：

1. **动作要点**：
   - 起始姿势（脚的位置、握距、身体角度等）
   - 动作轨迹（向心、离心、活动范围）
   - 呼吸节奏（何时吸气、何时呼气）
2. **常见错误**：
   - 列出 3-5 个新手常犯的错误
   - 每个错误说明后果和纠正方法
3. **强度建议**：
   - 根据用户的 RPE 反馈，建议下次是否加重或减重
   - 如何判断动作是否"做到力竭"
4. **安全检查**：
   - 提醒用户检查器械安全插销、卡扣等
   - 是否需要保护者（如：大重量卧推、深蹲）
5. **激励与反馈**：
   - 肯定用户的努力
   - 鼓励完成剩余训练

输出风格：
- 简洁有力，适合训练中快速阅读
- 关键步骤用数字编号
- 安全提示用 ⚠️ 高亮`,
};

/**
 * 动态上下文注入模板
 */
export const CONTEXT_TEMPLATE = `
---
**用户档案摘要**：
- 姓名：{name}
- 性别：{gender} | 年龄：{age}岁 | 身高：{height}cm | 体重：{weight}kg | BMI：{bmi}
- 训练经验：{experience} | 每周可训练：{frequency}次
- 训练目标：{goal}
- 器械条件：{equipment}
- 伤病史：{injuries}
- 当前计划：{currentPlan}
**最近体测数据**：
{recentMetrics}
---
`;

/**
 * 预设 Prompt 模板数据
 */
export const DEFAULT_PROMPT_TEMPLATES: Omit<
  PromptTemplate,
  "id" | "createdAt" | "updatedAt"
>[] = [
  {
    type: "base",
    name: "基础教练身份",
    content: BASE_COACH_PROMPT,
    version: "1.0.0",
    isDefault: true,
  },
  {
    type: "strict",
    name: "严格派教练",
    content: PERSONALITY_PROMPTS.strict,
    version: "1.0.0",
    isDefault: false,
  },
  {
    type: "encouraging",
    name: "鼓励派教练",
    content: PERSONALITY_PROMPTS.encouraging,
    version: "1.0.0",
    isDefault: true,
  },
  {
    type: "humorous",
    name: "幽默派教练",
    content: PERSONALITY_PROMPTS.humorous,
    version: "1.0.0",
    isDefault: false,
  },
  {
    type: "academic",
    name: "学术派教练",
    content: PERSONALITY_PROMPTS.academic,
    version: "1.0.0",
    isDefault: false,
  },
  {
    type: "diet_analysis",
    name: "饮食分析",
    content: SCENARIO_PROMPTS.diet_analysis,
    version: "1.0.0",
    isDefault: true,
    variables: ["userProfile"],
  },
  {
    type: "posture_analysis",
    name: "体态评估",
    content: SCENARIO_PROMPTS.posture_analysis,
    version: "1.0.0",
    isDefault: true,
    variables: ["userProfile"],
  },
  {
    type: "equipment_recognition",
    name: "器械识别",
    content: SCENARIO_PROMPTS.equipment_recognition,
    version: "1.0.0",
    isDefault: true,
  },
  {
    type: "plan_generation",
    name: "计划生成",
    content: SCENARIO_PROMPTS.plan_generation,
    version: "1.0.0",
    isDefault: true,
    variables: ["userProfile"],
  },
  {
    type: "workout_guidance",
    name: "训练指导",
    content: SCENARIO_PROMPTS.workout_guidance,
    version: "1.0.0",
    isDefault: true,
    variables: ["exercise", "userFeedback"],
  },
];

/**
 * 构建完整的 System Prompt
 * @param basePrompt 基础身份 Prompt
 * @param personalityPrompt 性格 Prompt（可选）
 * @param scenarioPrompt 场景 Prompt（可选）
 * @param context 动态上下文（可选）
 */
export function buildSystemPrompt(
  basePrompt: string,
  personalityPrompt?: string,
  scenarioPrompt?: string,
  context?: Record<string, any>
): string {
  let prompt = basePrompt;

  if (personalityPrompt) {
    prompt = personalityPrompt;
  }

  if (scenarioPrompt) {
    // 替换变量
    let processedScenario = scenarioPrompt;
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        processedScenario = processedScenario.replace(
          new RegExp(`\\{${key}\\}`, "g"),
          String(value)
        );
      });
    }
    prompt += "\n\n---\n" + processedScenario;
  }

  if (context) {
    // 注入动态上下文
    let contextStr = CONTEXT_TEMPLATE;
    Object.entries(context).forEach(([key, value]) => {
      contextStr = contextStr.replace(
        new RegExp(`\\{${key}\\}`, "g"),
        String(value)
      );
    });
    prompt += "\n\n" + contextStr;
  }

  return prompt;
}
