import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor } from './tweaks-panel.jsx'

// ─── helpers ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'tm_tasks_v1';
const FILTER_KEY = 'tm_filters_v1';

const uid = () => Math.random().toString(36).slice(2, 10);

const loadTasks = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    // migrate: ensure every task has priority & status
    return data.map((t) => ({
      priority: t.priority || 'medium',
      status: t.status || (t.done ? 'done' : 'pending'),
      ...t,
      // make sure status reflects done for legacy items
      ...(t.done ? { status: 'done' } : {}),
    }));
  } catch (e) {
    return [];
  }
};
const saveTasks = (tasks) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch (e) {}
};
const loadFilters = () => {
  try {
    const raw = localStorage.getItem(FILTER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
};
const saveFilters = (f) => {
  try { localStorage.setItem(FILTER_KEY, JSON.stringify(f)); } catch (e) {}
};

const pad = (n) => String(n).padStart(2, '0');
const todayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const nextHourTime = () => {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const taskDateObj = (t) => {
  if (!t.date) return null;
  const [y, m, d] = t.date.split('-').map(Number);
  const [hh, mm] = (t.time || '23:59').split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
};

const formatDateTime = (dateStr, timeStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const today = startOfDay(new Date());
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  let prefix;
  if (+date === +today) prefix = 'Hoje';
  else if (+date === +tomorrow) prefix = 'Amanhã';
  else if (+date === +yesterday) prefix = 'Ontem';
  else prefix = `${d} ${meses[m - 1]}`;
  return timeStr ? `${prefix} · ${timeStr}` : prefix;
};

const isOverdue = (t) => {
  if (t.status === 'done') return false;
  const dt = taskDateObj(t);
  return dt && dt.getTime() < Date.now();
};

// ─── constants ──────────────────────────────────────────────────────────────
const PRIORITIES = [
  { value: 'high',   label: 'Alta',   short: 'Alta',   rank: 0 },
  { value: 'medium', label: 'Média',  short: 'Média',  rank: 1 },
  { value: 'low',    label: 'Baixa',  short: 'Baixa',  rank: 2 },
];
const STATUSES = [
  { value: 'pending',     label: 'Pendente' },
  { value: 'in-progress', label: 'Em andamento' },
  { value: 'done',        label: 'Concluída' },
];
const priorityRank = (p) => PRIORITIES.find((x) => x.value === p)?.rank ?? 1;

// ─── icons ──────────────────────────────────────────────────────────────────
const Icon = {
  Plus: (p) => <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  Check: (p) => <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>,
  Undo: (p) => <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M3 13a9 9 0 1 0 3-7"/></svg>,
  Trash: (p) => <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></svg>,
  Clock: (p) => <svg width={p.size || 12} height={p.size || 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  Archive: (p) => <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M5 6v13a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6M10 11h4"/></svg>,
  Back: (p) => <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>,
  Edit: (p) => <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>,
  Filter: (p) => <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18M6 12h12M10 19h4"/></svg>,
  X: (p) => <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>,
};

// ─── form (composer + edit) ─────────────────────────────────────────────────
function TaskForm({ initial, onSubmit, onCancel, compact, submitLabel }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [desc, setDesc] = useState(initial?.desc || '');
  const [date, setDate] = useState(initial?.date || todayDate());
  const [time, setTime] = useState(initial?.time || nextHourTime());
  const [priority, setPriority] = useState(initial?.priority || 'medium');
  const [status, setStatus] = useState(initial?.status || 'pending');
  const titleRef = useRef(null);

  useEffect(() => {
    if (titleRef.current) titleRef.current.focus();
  }, []);

  const submit = (e) => {
    e && e.preventDefault();
    const t = title.trim();
    if (!t) { titleRef.current && titleRef.current.focus(); return; }
    onSubmit({
      title: t,
      desc: desc.trim(),
      date,
      time,
      priority,
      status,
    });
  };

  return (
    <form
      className={`composer ${compact ? 'is-compact' : ''}`}
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel && onCancel();
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(e);
      }}
    >
      <input
        ref={titleRef}
        className="composer-title"
        type="text"
        placeholder="Título da tarefa"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
      />
      <textarea
        className="composer-desc"
        placeholder="Descrição (opcional)"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        rows={2}
      />
      <div className="composer-meta">
        <label className="meta-field">
          <span className="meta-label">Data</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="meta-field">
          <span className="meta-label">Hora</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
        <label className="meta-field">
          <span className="meta-label">Prioridade</span>
          <span className={`prio-dot prio-${priority}`} aria-hidden="true"></span>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="meta-select">
            {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </label>
        <label className="meta-field">
          <span className="meta-label">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="meta-select">
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
      </div>
      <div className="composer-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-primary">{submitLabel || 'Adicionar tarefa'}</button>
      </div>
    </form>
  );
}

function Composer({ onAdd }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button className="composer-trigger" onClick={() => setOpen(true)}>
        <span className="composer-trigger-icon"><Icon.Plus size={14} /></span>
        <span>Nova tarefa</span>
        <span className="composer-trigger-hint">Enter</span>
      </button>
    );
  }
  return (
    <TaskForm
      onSubmit={(data) => { onAdd({ id: uid(), createdAt: Date.now(), ...data }); setOpen(false); }}
      onCancel={() => setOpen(false)}
      submitLabel="Adicionar tarefa"
    />
  );
}

// ─── task item ──────────────────────────────────────────────────────────────
function TaskItem({ task, archived, onComplete, onUndo, onDelete, onEdit, onStatusChange }) {
  const [leaving, setLeaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const overdue = isOverdue(task);
  const prioMeta = PRIORITIES.find((p) => p.value === task.priority) || PRIORITIES[1];

  const handleComplete = () => {
    setLeaving(true);
    setTimeout(() => onComplete(task.id), 260);
  };

  if (editing) {
    return (
      <li className="task is-editing">
        <TaskForm
          initial={task}
          compact
          submitLabel="Salvar alterações"
          onSubmit={(data) => { onEdit(task.id, data); setEditing(false); }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className={`task ${leaving ? 'is-leaving' : ''} ${archived ? 'is-archived' : ''}`} data-priority={task.priority}>
      <span className={`task-prio-rail prio-${task.priority}`} aria-hidden="true"></span>
      {!archived ? (
        <button className="task-check" onClick={handleComplete} aria-label="Concluir tarefa">
          <span className="task-check-inner"><Icon.Check size={12} /></span>
        </button>
      ) : (
        <button className="task-check is-done" onClick={() => onUndo(task.id)} aria-label="Reabrir tarefa">
          <span className="task-check-inner"><Icon.Check size={12} /></span>
        </button>
      )}
      <div className="task-body">
        <div className="task-row">
          <div className="task-title">{task.title}</div>
          <span className={`prio-badge prio-${task.priority}`}>
            <span className={`prio-dot prio-${task.priority}`} aria-hidden="true"></span>
            {prioMeta.short}
          </span>
        </div>
        {task.desc ? <div className="task-desc">{task.desc}</div> : null}
        <div className="task-meta">
          {!archived ? (
            <button
              className={`status-pill status-${task.status}`}
              onClick={() => onStatusChange(task.id, task.status === 'pending' ? 'in-progress' : 'pending')}
              title="Alternar entre pendente e em andamento"
            >
              <span className="status-dot" aria-hidden="true"></span>
              {STATUSES.find((s) => s.value === task.status)?.label}
            </button>
          ) : null}
          {task.date ? (
            <span className={`task-when ${overdue ? 'is-overdue' : ''}`}>
              <Icon.Clock size={11} />
              {formatDateTime(task.date, task.time)}
              {overdue ? ' · atrasada' : ''}
            </span>
          ) : null}
          {archived && task.completedAt ? (
            <span className="task-when task-when-muted">
              concluída {new Date(task.completedAt).toLocaleDateString('pt-BR')}
            </span>
          ) : null}
        </div>
      </div>
      <div className="task-actions">
        <button className="icon-btn" onClick={() => setEditing(true)} title="Editar"><Icon.Edit size={14} /></button>
        {archived ? (
          <button className="icon-btn" onClick={() => onUndo(task.id)} title="Reabrir tarefa">
            <Icon.Undo size={14} />
          </button>
        ) : null}
        <button
          className={`icon-btn ${archived ? 'icon-btn-danger' : 'icon-btn-subtle'}`}
          onClick={() => {
            if (archived && !confirm('Excluir esta tarefa permanentemente?')) return;
            onDelete(task.id);
          }}
          title="Excluir"
        >
          <Icon.Trash size={14} />
        </button>
      </div>
    </li>
  );
}

// ─── filters ────────────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { value: 'all',         label: 'Todos' },
  { value: 'pending',     label: 'Pendentes' },
  { value: 'in-progress', label: 'Em andamento' },
];
const PRIORITY_FILTERS = [
  { value: 'all',    label: 'Todas' },
  { value: 'high',   label: 'Alta' },
  { value: 'medium', label: 'Média' },
  { value: 'low',    label: 'Baixa' },
];
const DATE_FILTERS = [
  { value: 'all',      label: 'Todas as datas' },
  { value: 'overdue',  label: 'Atrasadas' },
  { value: 'today',    label: 'Hoje' },
  { value: 'week',     label: 'Esta semana' },
  { value: 'no-date',  label: 'Sem data' },
];

function ChipRow({ label, options, value, onChange }) {
  return (
    <div className="chip-row">
      <span className="chip-row-label">{label}</span>
      <div className="chip-row-chips">
        {options.map((o) => (
          <button
            key={o.value}
            className={`chip ${value === o.value ? 'is-active' : ''}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterBar({ filters, setFilters, defaults, archived }) {
  const isDefault =
    filters.status === defaults.status &&
    filters.priority === defaults.priority &&
    filters.date === defaults.date;
  return (
    <div className="filter-bar">
      {!archived && (
        <ChipRow
          label="Status"
          options={STATUS_FILTERS}
          value={filters.status}
          onChange={(v) => setFilters({ ...filters, status: v })}
        />
      )}
      <ChipRow
        label="Prioridade"
        options={PRIORITY_FILTERS}
        value={filters.priority}
        onChange={(v) => setFilters({ ...filters, priority: v })}
      />
      <ChipRow
        label="Data"
        options={DATE_FILTERS}
        value={filters.date}
        onChange={(v) => setFilters({ ...filters, date: v })}
      />
      {!isDefault && (
        <button className="filter-reset" onClick={() => setFilters(defaults)}>
          <Icon.X size={11} /> Limpar filtros
        </button>
      )}
    </div>
  );
}

// ─── counters ───────────────────────────────────────────────────────────────
function Counters({ stats, view, setView }) {
  const cards = [
    { key: 'total',       label: 'Total',       value: stats.total,      tone: 'neutral' },
    { key: 'pending',     label: 'Pendentes',   value: stats.pending,    tone: 'pending' },
    { key: 'in-progress', label: 'Em andamento', value: stats.inProgress, tone: 'progress' },
    { key: 'done',        label: 'Concluídas',  value: stats.done,       tone: 'done' },
  ];
  return (
    <div className="counters">
      {cards.map((c) => {
        const clickable = c.key === 'done' || c.key === 'pending' || c.key === 'in-progress';
        return (
          <button
            key={c.key}
            className={`counter counter-${c.tone} ${clickable ? 'is-clickable' : ''}`}
            onClick={() => {
              if (c.key === 'done') setView('archive');
              else if (c.key === 'pending') { setView('active'); }
              else if (c.key === 'in-progress') { setView('active'); }
            }}
            disabled={!clickable}
          >
            <span className="counter-value">{c.value}</span>
            <span className="counter-label">{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── list (with grouping for active) ────────────────────────────────────────
function TaskList({ tasks, archived, onComplete, onUndo, onDelete, onEdit, onStatusChange }) {
  if (tasks.length === 0) {
    return (
      <div className="empty">
        {archived ? (
          <>
            <div className="empty-mark"><Icon.Archive size={22} /></div>
            <div className="empty-title">Nenhuma tarefa concluída</div>
            <div className="empty-sub">Ao marcar uma tarefa como concluída, ela aparece aqui.</div>
          </>
        ) : (
          <>
            <div className="empty-mark"><Icon.Check size={22} /></div>
            <div className="empty-title">Nenhuma tarefa</div>
            <div className="empty-sub">Adicione uma tarefa ou ajuste os filtros.</div>
          </>
        )}
      </div>
    );
  }

  if (!archived) {
    const groups = [];
    const map = new Map();
    tasks.forEach((t) => {
      const key = t.date || '__no_date';
      if (!map.has(key)) {
        const g = { key, label: t.date ? formatDateTime(t.date, '') : 'Sem data', items: [] };
        map.set(key, g); groups.push(g);
      }
      map.get(key).items.push(t);
    });
    return (
      <ul className="task-list" role="list">
        {groups.map((g) => (
          <React.Fragment key={g.key}>
            <li className="task-group-label">{g.label}</li>
            {g.items.map((t) => (
              <TaskItem
                key={t.id} task={t} archived={false}
                onComplete={onComplete} onUndo={onUndo}
                onDelete={onDelete} onEdit={onEdit} onStatusChange={onStatusChange}
              />
            ))}
          </React.Fragment>
        ))}
      </ul>
    );
  }
  return (
    <ul className="task-list" role="list">
      {tasks.map((t) => (
        <TaskItem
          key={t.id} task={t} archived={true}
          onComplete={onComplete} onUndo={onUndo}
          onDelete={onDelete} onEdit={onEdit} onStatusChange={onStatusChange}
        />
      ))}
    </ul>
  );
}

// ─── app ────────────────────────────────────────────────────────────────────
const DEFAULT_FILTERS = { status: 'all', priority: 'all', date: 'all' };

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "warm",
  "density": "comfortable",
  "accent": "#3a3a38"
}/*EDITMODE-END*/;

function App() {
  const [tasks, setTasks] = useState(() => loadTasks());
  const [view, setView] = useState('active');
  const [filters, setFilters] = useState(() => loadFilters() || DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => { saveTasks(tasks); }, [tasks]);
  useEffect(() => { saveFilters(filters); }, [filters]);

  useEffect(() => {
    document.documentElement.dataset.theme = t.theme;
    document.documentElement.dataset.density = t.density;
    document.documentElement.style.setProperty('--accent', t.accent);
  }, [t.theme, t.density, t.accent]);

  // counters
  const stats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter((x) => x.status === 'pending').length,
    inProgress: tasks.filter((x) => x.status === 'in-progress').length,
    done: tasks.filter((x) => x.status === 'done').length,
  }), [tasks]);

  // sort helper: by date, then priority
  const sortByDateThenPrio = (a, b) => {
    const da = a.date ? `${a.date}T${a.time || '23:59'}` : '9999';
    const db = b.date ? `${b.date}T${b.time || '23:59'}` : '9999';
    if (da !== db) return da.localeCompare(db);
    return priorityRank(a.priority) - priorityRank(b.priority);
  };

  // active list
  const active = useMemo(() => {
    let list = tasks.filter((x) => x.status !== 'done');
    if (filters.status !== 'all') list = list.filter((x) => x.status === filters.status);
    if (filters.priority !== 'all') list = list.filter((x) => x.priority === filters.priority);
    if (filters.date !== 'all') {
      const now = new Date();
      const today0 = startOfDay(now);
      const weekEnd = new Date(today0); weekEnd.setDate(today0.getDate() + 7);
      list = list.filter((x) => {
        const dt = taskDateObj(x);
        if (filters.date === 'no-date') return !dt;
        if (!dt) return false;
        if (filters.date === 'overdue') return dt.getTime() < Date.now();
        if (filters.date === 'today') return startOfDay(dt).getTime() === today0.getTime();
        if (filters.date === 'week') return dt >= today0 && dt < weekEnd;
        return true;
      });
    }
    return list.sort(sortByDateThenPrio);
  }, [tasks, filters]);

  // archive list (concluídas)
  const archive = useMemo(() => {
    let list = tasks.filter((x) => x.status === 'done');
    if (filters.priority !== 'all') list = list.filter((x) => x.priority === filters.priority);
    if (filters.date !== 'all') {
      const now = new Date();
      const today0 = startOfDay(now);
      const weekEnd = new Date(today0); weekEnd.setDate(today0.getDate() + 7);
      list = list.filter((x) => {
        const dt = taskDateObj(x);
        if (filters.date === 'no-date') return !dt;
        if (!dt) return false;
        if (filters.date === 'today') return startOfDay(dt).getTime() === today0.getTime();
        if (filters.date === 'week') return dt >= today0 && dt < weekEnd;
        if (filters.date === 'overdue') return false;
        return true;
      });
    }
    return list.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  }, [tasks, filters]);

  // task ops
  const addTask = (task) => setTasks((p) => [task, ...p]);
  const completeTask = (id) => setTasks((p) => p.map((x) => x.id === id
    ? { ...x, status: 'done', done: true, completedAt: Date.now() }
    : x));
  const undoTask = (id) => setTasks((p) => p.map((x) => x.id === id
    ? { ...x, status: 'pending', done: false, completedAt: undefined }
    : x));
  const deleteTask = (id) => setTasks((p) => p.filter((x) => x.id !== id));
  const editTask = (id, data) => setTasks((p) => p.map((x) => {
    if (x.id !== id) return x;
    const next = { ...x, ...data };
    if (data.status === 'done' && x.status !== 'done') next.completedAt = Date.now();
    if (data.status !== 'done') { next.completedAt = undefined; next.done = false; }
    else next.done = true;
    return next;
  }));
  const changeStatus = (id, status) => setTasks((p) => p.map((x) => x.id === id
    ? { ...x,
        status,
        done: status === 'done',
        completedAt: status === 'done' ? Date.now() : undefined,
      }
    : x));

  const isFiltered =
    filters.status !== DEFAULT_FILTERS.status ||
    filters.priority !== DEFAULT_FILTERS.priority ||
    filters.date !== DEFAULT_FILTERS.date;

  return (
    <div className="app" data-screen-label={view === 'active' ? '01 Ativas' : '02 Concluídas'}>
      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true"></div>
            <div className="brand-text">
              <div className="brand-title">Tarefas</div>
              <div className="brand-sub">
                {view === 'active' ? 'Visualizando ativas' : 'Visualizando concluídas'}
              </div>
            </div>
          </div>
          {view === 'archive' ? (
            <button className="archive-link" onClick={() => setView('active')}>
              <Icon.Back size={14} />
              <span>Voltar</span>
            </button>
          ) : null}
        </header>

        <Counters stats={stats} view={view} setView={setView} />

        <main className="content">
          {view === 'active' ? (
            <>
              <Composer onAdd={addTask} />

              <div className="list-header">
                <div className="list-title">
                  {active.length} {active.length === 1 ? 'tarefa' : 'tarefas'}
                  {isFiltered ? ' (filtrado)' : ''}
                </div>
                <button
                  className={`filter-toggle ${showFilters ? 'is-open' : ''} ${isFiltered ? 'is-active' : ''}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Icon.Filter size={13} />
                  Filtros
                  {isFiltered && <span className="filter-dot" />}
                </button>
              </div>

              {showFilters && (
                <FilterBar
                  filters={filters}
                  setFilters={setFilters}
                  defaults={DEFAULT_FILTERS}
                  archived={false}
                />
              )}

              <TaskList
                tasks={active}
                archived={false}
                onComplete={completeTask}
                onUndo={undoTask}
                onDelete={deleteTask}
                onEdit={editTask}
                onStatusChange={changeStatus}
              />
            </>
          ) : (
            <div className="archive-view">
              <div className="archive-header">
                <div>
                  <div className="archive-title">Concluídas</div>
                  <div className="archive-hint">{archive.length} {archive.length === 1 ? 'tarefa concluída' : 'tarefas concluídas'}{isFiltered ? ' (filtrado)' : ''}</div>
                </div>
                <button
                  className={`filter-toggle ${showFilters ? 'is-open' : ''} ${isFiltered ? 'is-active' : ''}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Icon.Filter size={13} />
                  Filtros
                  {isFiltered && <span className="filter-dot" />}
                </button>
              </div>

              {showFilters && (
                <FilterBar
                  filters={filters}
                  setFilters={setFilters}
                  defaults={DEFAULT_FILTERS}
                  archived={true}
                />
              )}

              <TaskList
                tasks={archive}
                archived={true}
                onComplete={completeTask}
                onUndo={undoTask}
                onDelete={deleteTask}
                onEdit={editTask}
                onStatusChange={changeStatus}
              />
            </div>
          )}
        </main>

        <footer className="footer">
          <span>Salvo automaticamente no seu navegador</span>
        </footer>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Aparência">
          <TweakRadio
            label="Tema"
            value={t.theme}
            onChange={(v) => setTweak('theme', v)}
            options={[
              { value: 'warm', label: 'Quente' },
              { value: 'cool', label: 'Frio' },
              { value: 'mono', label: 'Mono' },
            ]}
          />
          <TweakRadio
            label="Densidade"
            value={t.density}
            onChange={(v) => setTweak('density', v)}
            options={[
              { value: 'comfortable', label: 'Confort.' },
              { value: 'compact', label: 'Compacto' },
            ]}
          />
          <TweakColor
            label="Acento"
            value={t.accent}
            onChange={(v) => setTweak('accent', v)}
            options={['#3a3a38', '#5b6b5c', '#7a5b48', '#4a5878']}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

export default App
