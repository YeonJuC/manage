import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import type { Assignee, Cohort, Task } from "./types";
import { loadTasks, saveTasks } from "./lib/storage";
import { generateBaselineTasks, updateAssigneeNames } from "./lib/generator";
import { addDays, endOfMonth, startOfMonth, toISO, weekday } from "./lib/date";

type Seed = { cohorts: Cohort[]; assignees: Assignee[] };

const todayISO = toISO(new Date());

function buildMonthGrid(monthISO: string) {
  const start = startOfMonth(monthISO);
  const end = endOfMonth(monthISO);

  const firstWeekday = weekday(start);
  const days: string[] = [];

  // 앞쪽 빈칸 채우기(이전달)
  for (let i = 0; i < firstWeekday; i++) {
    days.push(addDays(start, -(firstWeekday - i)));
  }

  // 이번달 날짜
  let cur = start;
  while (cur <= end) {
    days.push(cur);
    cur = addDays(cur, 1);
  }

  // 6주(42칸) 맞추기
  while (days.length < 42) {
    days.push(addDays(days[days.length - 1], 1));
  }

  return { start, end, days };
}

export default function App() {
  const [seed, setSeed] = useState<Seed | null>(null);
  const [seedLoading, setSeedLoading] = useState(true);
  const [seedError, setSeedError] = useState<string | null>(null);

  const [month, setMonth] = useState(startOfMonth(todayISO));
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [taskMap, setTaskMap] = useState<Record<string, Task>>({});

  useEffect(() => {
    (async () => {
      try {
        const url = import.meta.env.BASE_URL + "tasks.seed.json";
        console.log("seed fetch url:", url);

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`seed fetch failed: ${res.status} ${res.statusText}`);

        const data = (await res.json()) as Seed;
        setSeed(data);

        const stored = loadTasks();
        const withBaseline = generateBaselineTasks(data.cohorts, data.assignees, stored);
        const normalized = updateAssigneeNames(withBaseline, data.assignees);

        setTaskMap(normalized);
        saveTasks(normalized);
      } catch (e) {
        console.error(e);
        setSeedError((e as Error).message);
      } finally {
        setSeedLoading(false);
      }
    })();
  }, []);

  // ✅ 로딩/에러 UI (원인 확인용)
  if (seedLoading) {
    return (
      <div style={{ padding: 24 }}>
        <h2>로딩 중…</h2>
        <div>seedLoading = true</div>
        <div>BASE_URL: {import.meta.env.BASE_URL}</div>
      </div>
    );
  }

  if (seedError) {
    return (
      <div style={{ padding: 24 }}>
        <h2>에러 발생</h2>
        <pre style={{ whiteSpace: "pre-wrap" }}>{seedError}</pre>
        <div>BASE_URL: {import.meta.env.BASE_URL}</div>
      </div>
    );
  }

  const grid = useMemo(() => buildMonthGrid(month), [month]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    Object.values(taskMap).forEach((t) => {
      const arr = map.get(t.dueDate) ?? [];
      arr.push(t);
      map.set(t.dueDate, arr);
    });

    // 정렬(기수->업무명)
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => (a.cohortId + a.title).localeCompare(b.cohortId + b.title));
      map.set(k, arr);
    }

    return map;
  }, [taskMap]);

  const selectedTasks = tasksByDate.get(selectedDate) ?? [];

  const setTask = (task: Task) => {
    const next = { ...taskMap, [task.id]: task };
    setTaskMap(next);
    saveTasks(next);
  };

  const toggleDone = (task: Task) => setTask({ ...task, done: !task.done, updatedAt: Date.now() });

  const moveTaskDate = (task: Task, delta: number) => {
    // 날짜만 바꾸고, id는 그대로 두면 “충돌/중복”이 생길 수 있음 → id도 재생성
    const newDue = addDays(task.dueDate, delta);
    const newId = `${task.cohortId}:${task.key}:${newDue}`;

    const nextMap = { ...taskMap };
    delete nextMap[task.id];

    nextMap[newId] = {
      ...task,
      id: newId,
      dueDate: newDue,
      updatedAt: Date.now(),
    };

    setTaskMap(nextMap);
    saveTasks(nextMap);
  };

  const changeAssignee = (task: Task, assigneeId: string) => {
    const name = seed?.assignees.find((a) => a.id === assigneeId)?.name;
    setTask({ ...task, assigneeId, assigneeName: name, updatedAt: Date.now() });
  };

  const monthLabel = new Date(month + "T00:00:00").toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });

  const isSameMonth = (iso: string) => iso.slice(0, 7) === month.slice(0, 7);

  const badge = (dateISO: string) => {
    const tasks = tasksByDate.get(dateISO) ?? [];
    if (!tasks.length) return null;

    const done = tasks.filter((t) => t.done).length;
    const overdue = tasks.some((t) => !t.done && t.dueDate < todayISO);
    const imminent = tasks.some((t) => !t.done && t.dueDate >= todayISO && t.dueDate <= addDays(todayISO, 3));

    let cls = "badge";
    if (overdue) cls += " danger";
    else if (imminent) cls += " warn";

    return (
      <span className={cls}>
        {done}/{tasks.length}
      </span>
    );
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="title">교육 운영 에이전트 (MVP)</div>
        <div className="controls">
          <button onClick={() => setMonth(addDays(month, -30))}>◀</button>
          <div className="month">{monthLabel}</div>
          <button onClick={() => setMonth(addDays(month, 30))}>▶</button>
        </div>
      </header>

      <main className="main">
        <section className="calendar">
          <div className="dow">
            {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
              <div key={d} className="dowcell">
                {d}
              </div>
            ))}
          </div>

          <div className="grid">
            {grid.days.map((d) => (
              <button
                key={d}
                className={[
                  "cell",
                  isSameMonth(d) ? "" : "dim",
                  d === todayISO ? "today" : "",
                  d === selectedDate ? "selected" : "",
                ].join(" ")}
                onClick={() => setSelectedDate(d)}
              >
                <div className="celltop">
                  <span className="daynum">{Number(d.slice(8, 10))}</span>
                  {badge(d)}
                </div>

                <div className="celltasks">
                  {(tasksByDate.get(d) ?? []).slice(0, 2).map((t) => (
                    <div key={t.id} className={"mini " + (t.done ? "done" : "")}>
                      {t.cohortId}기 · {t.title}
                    </div>
                  ))}

                  {(tasksByDate.get(d) ?? []).length > 2 && (
                    <div className="more">+{(tasksByDate.get(d) ?? []).length - 2}개</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panelhead">
            <div className="paneldate">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "short",
              })}
            </div>
            <div className="hint">🔔 임박(3일 이내) / ⚠️ 지연(오늘 이전 미완료)</div>
          </div>

          <div className="tasklist">
            {selectedTasks.length === 0 ? (
              <div className="empty">이 날짜에 등록된 업무가 없어.</div>
            ) : (
              selectedTasks.map((task) => {
                const overdue = !task.done && task.dueDate < todayISO;
                const imminent = !task.done && task.dueDate >= todayISO && task.dueDate <= addDays(todayISO, 3);

                return (
                  <div key={task.id} className={"task " + (task.done ? "done" : "")}>
                    <div className="taskmain">
                      <label className="check">
                        <input type="checkbox" checked={task.done} onChange={() => toggleDone(task)} />
                        <span />
                      </label>

                      <div className="tasktext">
                        <div className="tasktitle">
                          {overdue ? "⚠️ " : imminent ? "🔔 " : ""}
                          [{task.cohortName}] {task.title}
                        </div>
                        <div className="taskmeta">
                          기준일: {task.baselineDueDate} · 현재: {task.dueDate}
                        </div>
                      </div>
                    </div>

                    <div className="taskactions">
                      <select value={task.assigneeId ?? ""} onChange={(e) => changeAssignee(task, e.target.value)}>
                        <option value="">담당자 미지정</option>
                        {seed?.assignees.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>

                      <div className="move">
                        <button onClick={() => moveTaskDate(task, -1)}>← 1일</button>
                        <button onClick={() => moveTaskDate(task, +1)}>1일 →</button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

