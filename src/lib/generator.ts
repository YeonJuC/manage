import type { Assignee, Cohort, Task, TaskTemplate } from "../types";
import { addDays } from "./date";

const templates: TaskTemplate[] = [
  { key: "promo_instagram", title: "인스타그램 홍보 게시", offsetDays: -42 },
  { key: "entrants_info", title: "입과자 정보 정리", offsetDays: -21 },
  { key: "vendor_register", title: "거래처 등록", offsetDays: -21 },
  { key: "platform_register", title: "러닝플랫폼 등록", offsetDays: -21 },
  { key: "dorm_assign", title: "국제관 방배정", offsetDays: -14 },
  { key: "entrance_video", title: "입과식 영상 제작", offsetDays: -14 },
  { key: "snack_order", title: "다과 주문", offsetDays: -4 },
  { key: "online_ot", title: "온라인 OT 진행", offsetDays: -3 },
  { key: "copy_consent", title: "개인정보 동의서/서약서 복사", offsetDays: -3 },
  { key: "copy_life_guide", title: "생활 안내 복사", offsetDays: -3 },
  { key: "access_card", title: "출입카드 준비", offsetDays: -3 },
  { key: "camp_ot", title: "합숙 OT 진행", offsetDays: -1 }
];

export const generateBaselineTasks = (
  cohorts: Cohort[],
  assignees: Assignee[],
  existing: Record<string, Task>
) => {
  const assigneeMap = new Map(assignees.map(a => [a.id, a.name]));
  const next = { ...existing };

  for (const c of cohorts) {
    for (const t of templates) {
      const baselineDueDate = addDays(c.week1Start, t.offsetDays);
      const id = `${c.id}:${t.key}:${baselineDueDate}`;

      if (next[id]) continue; // 이미 있으면 유지

      next[id] = {
        id,
        cohortId: c.id,
        cohortName: c.name,
        key: t.key,
        title: t.title,
        dueDate: baselineDueDate,
        baselineDueDate,
        done: false,
        updatedAt: Date.now(),
        assigneeId: t.defaultAssigneeId,
        assigneeName: t.defaultAssigneeId ? assigneeMap.get(t.defaultAssigneeId) : undefined
      };
    }
  }
  return next;
};

export const updateAssigneeNames = (
  tasks: Record<string, Task>,
  assignees: Assignee[]
) => {
  const map = new Map(assignees.map(a => [a.id, a.name]));
  const next: Record<string, Task> = {};
  for (const [id, task] of Object.entries(tasks)) {
    next[id] = {
      ...task,
      assigneeName: task.assigneeId ? map.get(task.assigneeId) : undefined
    };
  }
  return next;
};
