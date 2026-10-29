/**
 * 固定局相关接口  ✅ 已全部接入后端（rally-server：GameTemplateController）
 * 后端每 10 分钟检查一次，上一场开始后自动生成下一周的场次。
 */
import type { GameTemplateBrief, GameTemplateForm } from '@/types'
import { http } from '@/utils/request'

/** 创建固定局（群主、管理员），同时生成第一场，返回第一场的 id */
export function createGameTemplate(form: GameTemplateForm): Promise<{ firstGameId: number }> {
  return http.post<{ firstGameId: number }>('/game-templates', form)
}

/** 某个群的固定局列表 */
export function fetchGroupTemplates(groupId: number): Promise<GameTemplateBrief[]> {
  return http.get<GameTemplateBrief[]>(`/groups/${groupId}/game-templates`)
}

/** 暂停 / 恢复固定局（群主、管理员）：暂停后不再每周自动开局，已经生成的场次不受影响 */
export function setTemplateActive(templateId: number, active: boolean): Promise<GameTemplateBrief> {
  return http.put<GameTemplateBrief>(`/game-templates/${templateId}`, { active })
}
