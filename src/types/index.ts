/**
 * 前后端共用的数据结构，按模块拆在同目录的几个文件里，这里统一导出。
 * 页面里照旧写 import type { GameBrief } from '@/types' 即可，不用关心在哪个文件。
 *
 * 后端定接口时以这些字段名为准；后端改了字段，这里同步改。
 *
 * 约定：
 * - 时间一律用 ISO 8601 字符串，例如 2026-10-31T19:00:00+08:00
 * - 金额一律用「分」为单位的整数，避免小数精度问题（¥35 = 3500）
 *
 * 模块划分（和后端 rally-server 的 controller / dto 一一对应）：
 * - common.ts  多个模块都用到的：运动类型、成员
 * - user.ts    我的页面、我的报名记录
 * - group.ts   群组
 * - game.ts    场次、固定局规则
 * - bill.ts    费用账单、待付款
 */
export * from './common'
export * from './user'
export * from './group'
export * from './game'
export * from './bill'
