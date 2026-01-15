export type Cohort = {
  id: string;
  name: string;
  week1Start: string; // YYYY-MM-DD
};

export type Assignee = { id: string; name: string };

export type TaskTemplate = {
  key: string;            // 고유키(템플릿)
  title: string;          // 업무명
  offsetDays: number;     // week1Start 기준 -n일 (D-?)
  defaultAssigneeId?: string;
};

export type Task = {
  id: string;             // 고유 id (cohort+key+date)
  cohortId: string;
  cohortName: string;
  key: string;
  title: string;
  dueDate: string;        // YYYY-MM-DD
  assigneeId?: string;
  assigneeName?: string;
  done: boolean;

  // 일정 조정 기록
  baselineDueDate: string; // 원래 기준일
  updatedAt: number;
};
