// Bảng kiểu Word thao tác trực tiếp trên DOM của trang: chọn ô (kéo chuột), gộp/tách, chèn/xóa hàng cột,
// đổi độ rộng cột bằng cách kéo mép, handle ✥ / ô vuông góc dưới, border, shading…
// Chỉ áp dụng cho bảng tự do trên trang; bảng của dạng bài G (.rb-table-wrap) do React quản lý nên bỏ qua.

type Cell = HTMLTableCellElement & { _r?: number; _c?: number };
type Grid = Cell[][];

export interface TableHooks {
  page: () => HTMLElement | null;
  /** Nội dung bảng đã đổi → đánh dấu chưa lưu */
  changed: () => void;
  say: (message: string) => void;
  /** Người dùng vừa chọn một bảng (để Ribbon mở tab Table Layout) */
  selected: (cell: HTMLElement) => void;
  /** Cho phép App tự xử lý việc xóa bảng do React render */
  removeTable?: (table: HTMLTableElement) => void;
  /** Gọi trước mỗi thay đổi để App chụp snapshot Undo/Redo */
  before: () => void;
  /** Preview / chỉ đọc: engine không bắt sự kiện */
  readonly: () => boolean;
}

const PXMM = 96 / 25.4;
const DEF_BC = '#334155', DEF_BW = '1';
const edgeOf = (t: HTMLElement) => `${t.dataset.bw ?? DEF_BW}pt solid ${t.dataset.bc ?? DEF_BC}`;
const OPP = { Top: 'Bottom', Bottom: 'Top', Left: 'Right', Right: 'Left' } as const;
type Side = keyof typeof OPP;
const SIDES: Side[] = ['Top', 'Bottom', 'Left', 'Right'];

const ALIGN = ['left|top', 'center|top', 'right|top', 'left|middle', 'center|middle', 'right|middle', 'left|bottom', 'center|bottom', 'right|bottom'];

export const TABLE_MENU_ITEMS = {
  delete: [{ label: 'Delete columns', value: 'tbl:delCols' }, { label: 'Delete rows', value: 'tbl:delRows' }, { label: 'Delete table', value: 'tbl:delTable' }],
  align: ALIGN.map((v) => {
    const [h, t] = v.split('|') as [string, string];
    return { label: `${t === 'middle' ? 'Center' : t[0]!.toUpperCase() + t.slice(1)} ${h}`, value: `tbl:align:${v}` };
  }),
  borders: [
    { label: 'All borders', value: 'tbl:bord:all' }, { label: 'No border', value: 'tbl:bord:none' },
    { label: 'Outside borders', value: 'tbl:bord:outside' }, { label: 'Inside borders', value: 'tbl:bord:inside' },
    { label: 'Top border', value: 'tbl:bord:top' }, { label: 'Bottom border', value: 'tbl:bord:bottom' },
    { label: 'Left border', value: 'tbl:bord:left' }, { label: 'Right border', value: 'tbl:bord:right' },
  ],
  shading: [
    { label: 'No fill', value: 'tbl:shade:' }, { label: 'Light gray', value: 'tbl:shade:#e5e7eb' }, { label: 'Light blue', value: 'tbl:shade:#bfdbfe' },
    { label: 'Light yellow', value: 'tbl:shade:#fef08a' }, { label: 'Light green', value: 'tbl:shade:#bbf7d0' }, { label: 'Light pink', value: 'tbl:shade:#fbcfe8' },
  ],
  padding: [{ label: 'Narrow', value: 'tbl:pad:1mm 2mm' }, { label: 'Normal', value: 'tbl:pad:2mm 3mm' }, { label: 'Wide', value: 'tbl:pad:3mm 5mm' }],
} as Record<string, { label: string; value: string }[]>;

export const BORDER_COLORS = ['#000000', '#334155', '#94a3b8', '#dc2626', '#ea580c', '#16a34a', '#2563eb', '#7c3aed'];
TABLE_MENU_ITEMS.borderColor = BORDER_COLORS.map((c) => ({ label: c, value: `tbl:bcolor:${c}` }));
TABLE_MENU_ITEMS.styles = [
  { label: 'Table Grid', value: 'tbl:style:grid' }, { label: 'Header blue', value: 'tbl:style:blue' }, { label: 'Banded gray', value: 'tbl:style:banded' },
  { label: 'Minimal lines', value: 'tbl:style:minimal' }, { label: 'Dark header', value: 'tbl:style:dark' },
];
TABLE_MENU_ITEMS.select = [
  { label: 'Select cell', value: 'tbl:selCell' }, { label: 'Select row', value: 'tbl:selRow' }, { label: 'Select column', value: 'tbl:selCol' }, { label: 'Select table', value: 'tbl:selTable' },
];
TABLE_MENU_ITEMS.position = [
  { label: 'Inline (theo dòng chữ)', value: 'tbl:pos:inline' }, { label: 'Float left – chữ bao quanh', value: 'tbl:pos:float-left' }, { label: 'Float right – chữ bao quanh', value: 'tbl:pos:float-right' },
];
TABLE_MENU_ITEMS.insert = [
  { label: 'Insert rows above', value: 'tbl:insA' }, { label: 'Insert rows below', value: 'tbl:insB' }, { label: 'Insert columns left', value: 'tbl:insL' }, { label: 'Insert columns right', value: 'tbl:insR' },
];

export type ContextItem = string | { label: string; sub: string[] };

/** Nhãn menu chuột phải → lệnh của engine */
const MENU_COMMANDS: Record<string, string> = {
  'Insert columns left': 'insL', 'Insert columns right': 'insR', 'Insert rows above': 'insA', 'Insert rows below': 'insB',
  'Delete columns': 'delCols', 'Delete rows': 'delRows', 'Delete table': 'delTable',
  'Merge cells': 'merge', 'Split cells': 'split',
  'Distribute rows evenly': 'distR', 'Distribute columns evenly': 'distC',
  'AutoFit to contents': 'autofit:Content', 'AutoFit to window': 'autofit:Page', 'Fixed column width': 'autofit:Fixed',
  'Text direction': 'dir',
  ...Object.fromEntries(TABLE_MENU_ITEMS.borders.map((b) => [`Border: ${b.label}`, b.value.slice(4)])),
};

const RIBBON_IDS: Record<string, string> = {
  rowAbove: 'insA', rowBelow: 'insB', colLeft: 'insL', colRight: 'insR',
  deleteTable: 'delTable', deleteRow: 'delRows', deleteColumn: 'delCols',
  mergeCells: 'merge', splitCells: 'split', rowHeight: 'rowh', colWidth: 'colw', autoFit: 'autofit',
  textDirection: 'dir', headerRowBtn: 'header', tblLeft: 'left', tblCenter: 'center', tblRight: 'right', tblBorderWidth: 'bwidth',
};

export function createTableEngine(hooks: TableHooks) {
  let T: { t: HTMLTableElement; a: Cell; f: Cell } | null = null;
  let drag: { t: HTMLTableElement } | null = null;

  const mkHandle = (cls: string, title: string, text = '') => {
    const el = document.createElement('div');
    el.className = `tbl-handle ${cls}`; el.title = title; el.textContent = text; el.style.display = 'none';
    document.body.appendChild(el);
    return el;
  };
  const moveH = mkHandle('move', 'Chọn cả bảng', '✥');
  const sizeH = mkHandle('size', 'Kéo để đổi kích thước bảng');

  const page = () => hooks.page();
  const eligible = (t: Element | null): t is HTMLTableElement => !!t && t instanceof HTMLTableElement && !!page()?.contains(t) && !t.closest('.rb-table-wrap');
  const cellOf = (el: EventTarget | null): Cell | null => {
    const td = (el instanceof Element ? el.closest('td, th') : null) as Cell | null;
    return td && eligible(td.closest('table')) ? td : null;
  };
  const scale = () => { const p = page(); return p ? p.getBoundingClientRect().width / p.offsetWidth || 1 : 1; };
  const colsOf = (t: HTMLTableElement) => Array.from(t.querySelectorAll<HTMLTableColElement>(':scope > colgroup > col'));
  const mkTd = () => { const d = document.createElement('td'); d.contentEditable = 'true'; d.innerHTML = '<br>'; return d as Cell; };

  function gmap(t: HTMLTableElement): Grid {
    const g: Grid = [];
    Array.from(t.rows).forEach((tr, r) => {
      g[r] = g[r] ?? []; let c = 0;
      Array.from(tr.cells).forEach((cell) => {
        const td = cell as Cell;
        while (g[r]![c]) c++;
        td._r = r; td._c = c;
        for (let i = 0; i < td.rowSpan; i++) for (let j = 0; j < td.colSpan; j++) { (g[r + i] = g[r + i] ?? [])[c + j] = td; }
        c += td.colSpan;
      });
    });
    return g;
  }
  const nCols = (g: Grid) => Math.max(...g.map((row) => row.length));

  function rect() {
    const g = gmap(T!.t);
    const ext = (x: Cell) => [x._r!, x._c!, x._r! + x.rowSpan - 1, x._c! + x.colSpan - 1] as const;
    const a = ext(T!.a), b = ext(T!.f);
    let r1 = Math.min(a[0], b[0]), c1 = Math.min(a[1], b[1]), r2 = Math.max(a[2], b[2]), c2 = Math.max(a[3], b[3]), changed = true;
    while (changed) {
      changed = false;
      for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) {
        const x = g[r]?.[c]; if (!x) continue;
        const e = ext(x);
        if (e[0] < r1 || e[1] < c1 || e[2] > r2 || e[3] > c2) { r1 = Math.min(r1, e[0]); c1 = Math.min(c1, e[1]); r2 = Math.max(r2, e[2]); c2 = Math.max(c2, e[3]); changed = true; }
      }
    }
    return { g, r1, c1, r2, c2 };
  }
  function cells(): Cell[] {
    const R = rect(), s = new Set<Cell>();
    for (let r = R.r1; r <= R.r2; r++) for (let c = R.c1; c <= R.c2; c++) { const x = R.g[r]?.[c]; if (x) s.add(x); }
    return [...s];
  }

  function unpaint() { ['tbl-sel', 'tbl-dragging', 'tbl-active'].forEach((c) => page()?.querySelectorAll(`.${c}`).forEach((x) => x.classList.remove(c))); }
  function paint() { if (!T) return; unpaint(); T.t.classList.add('tbl-active'); const cs = cells(); if (cs.length > 1) cs.forEach((x) => x.classList.add('tbl-sel')); }
  /** Chạy fn (vd. chụp snapshot để lưu) khi không có lớp tô chọn tạm thời, rồi tô lại */
  function withoutPaint<R>(fn: () => R): R { unpaint(); try { return fn(); } finally { if (T && document.contains(T.t) && document.contains(T.a) && document.contains(T.f)) paint(); } }
  function place() {
    if (!T || !document.contains(T.t)) { moveH.style.display = sizeH.style.display = 'none'; return; }
    const r = T.t.getBoundingClientRect();
    moveH.style.display = sizeH.style.display = 'block';
    moveH.style.left = `${r.left - 20}px`; moveH.style.top = `${r.top - 20}px`;
    sizeH.style.left = `${r.right + 4}px`; sizeH.style.top = `${r.bottom + 4}px`;
  }
  function select(t: HTMLTableElement, a: Cell, f: Cell = a) {
    const first = !T || T.t !== t;
    if (!t.dataset.tableId) t.dataset.tableId = `tbl-${Math.random().toString(36).slice(2, 8)}`;
    T = { t, a, f }; paint(); place();
    if (first) hooks.selected(a);
  }
  function clear() { unpaint(); T = null; place(); }
  function ensure(): boolean {
    if (T && document.contains(T.t) && document.contains(T.a) && document.contains(T.f)) return true;
    T = null;
    const node = getSelection()?.anchorNode ?? null;
    const td = cellOf(node instanceof Element ? node : node?.parentElement ?? null);
    if (!td) return false;
    select(td.closest('table') as HTMLTableElement, td); return true;
  }
  const changed = () => { if (T) reband(T.t); paint(); place(); hooks.changed(); };

  /* ── cột & độ rộng ── */
  function syncW(t: HTMLTableElement) { const s = colsOf(t).reduce((acc, c) => acc + parseFloat(c.style.width), 0); if (s) t.style.width = `${s}px`; }
  function ensureCols(t: HTMLTableElement) {
    if (colsOf(t).length && t.style.tableLayout === 'fixed') return;
    const g = gmap(t), nc = nCols(g), w: number[] = [];
    for (let c = 0; c < nc; c++) { const x = g.map((row) => row[c]).find((d) => d && d.colSpan === 1); w[c] = x ? x.offsetWidth : t.offsetWidth / nc; }
    t.querySelector(':scope > colgroup')?.remove();
    const cg = document.createElement('colgroup');
    w.forEach((px) => { const col = document.createElement('col'); col.style.width = `${px}px`; cg.appendChild(col); });
    t.prepend(cg); t.style.tableLayout = 'fixed'; syncW(t);
  }

  function box(t: HTMLTableElement) { const p = t.parentElement!, cs = getComputedStyle(p); return p.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); }
  /** Thu các cột lại nếu tổng rộng vượt vùng chứa (không để bảng tràn khỏi trang in) */
  function fit(t: HTMLTableElement, max = box(t)) {
    const cg = colsOf(t), sum = cg.reduce((a, c) => a + parseFloat(c.style.width), 0);
    if (cg.length && sum > max && max > 0) { cg.forEach((c) => { c.style.width = `${parseFloat(c.style.width) * max / sum}px`; }); syncW(t); }
  }
  /** Banded rows / columns: tô nền xen kẽ bằng style inline (đánh dấu data-band để gỡ được, và xuất DOCX đúng) */
  function reband(t: HTMLTableElement) {
    t.querySelectorAll<HTMLElement>('[data-band]').forEach((x) => { x.style.background = ''; x.removeAttribute('data-band'); });
    if (!t.dataset.bandR && !t.dataset.bandC) return;
    const hdr = t.dataset.hdr === '1' ? 1 : 0; gmap(t);
    (Array.from(t.querySelectorAll('td, th')) as Cell[]).forEach((x) => {
      if (x.style.background || x.style.backgroundColor) return;
      const row = x._r! - hdr, col = x._c!;
      if ((t.dataset.bandR === '1' && row >= 0 && row % 2 === 1) || (t.dataset.bandC === '1' && col % 2 === 1)) { x.style.background = '#f1f5f9'; x.dataset.band = '1'; }
    });
  }
  function setHeader(t: HTMLTableElement, on: boolean, bg = '#e5e7eb', color = '') {
    t.dataset.hdr = on ? '1' : '';
    (Array.from(t.rows[0]!.cells) as HTMLElement[]).forEach((x) => { x.style.fontWeight = on ? '700' : ''; x.style.background = on ? bg : ''; x.style.color = on ? color : ''; });
  }
  function recolorBorders(t: HTMLTableElement) {
    const v = edgeOf(t);
    (Array.from(t.querySelectorAll('td, th')) as HTMLElement[]).forEach((x) => SIDES.forEach((s) => { if (getComputedStyle(x)[`border${s}Style`] !== 'none') x.style[`border${s}`] = v; }));
  }
  function applyStyle(t: HTMLTableElement, name: string) {
    (Array.from(t.querySelectorAll('td, th')) as HTMLElement[]).forEach((x) => { x.style.background = ''; x.style.color = ''; x.style.fontWeight = ''; x.style.border = ''; x.removeAttribute('data-band'); });
    t.dataset.bandR = ''; t.dataset.bandC = ''; t.dataset.hdr = '';
    const bc = ({ grid: '#334155', blue: '#2563eb', banded: '#94a3b8', minimal: '#94a3b8', dark: '#1e293b' } as Record<string, string>)[name] ?? '#334155';
    t.dataset.bc = bc; t.dataset.bw = '1'; t.dataset.style = name;
    if (name === 'blue') setHeader(t, true, '#dbeafe');
    if (name === 'banded') { setHeader(t, true, '#e5e7eb'); t.dataset.bandR = '1'; }
    if (name === 'dark') { setHeader(t, true, '#1e293b', '#ffffff'); t.dataset.bandR = '1'; }
    if (name === 'minimal') {
      (Array.from(t.querySelectorAll('td, th')) as HTMLElement[]).forEach((x) => { x.style.borderLeft = 'none'; x.style.borderRight = 'none'; x.style.borderTop = `1pt solid ${bc}`; x.style.borderBottom = `1pt solid ${bc}`; });
      setHeader(t, true, '#ffffff');
    } else recolorBorders(t);
  }

  /* ── hàng & cột ── */
  function insRow(t: HTMLTableElement, at: number) {
    const g = gmap(t), nc = nCols(g), tr = document.createElement('tr'), ref = t.rows[Math.min(at, t.rows.length - 1)];
    if (ref?.style.height) tr.style.height = ref.style.height;
    for (let c = 0; c < nc; c++) {
      const x = g[at]?.[c];
      if (x && x._r! < at) { if (x._c === c) x.rowSpan++; continue; }
      tr.appendChild(mkTd());
    }
    const before = t.rows[at];
    if (before) before.before(tr); else (t.tBodies[0] ?? t).appendChild(tr);
  }
  function insCol(t: HTMLTableElement, at: number) {
    const g = gmap(t);
    g.forEach((row, r) => {
      const x = row[at];
      if (x && x._c! < at) { if (x._r === r) x.colSpan++; return; }
      const tr = t.rows[r]!, ref = (Array.from(tr.cells) as Cell[]).find((d) => d._c! >= at), td = mkTd();
      if (ref) ref.before(td); else tr.appendChild(td);
    });
    const cg = colsOf(t);
    if (cg.length) {
      const col = document.createElement('col'); col.style.width = cg[Math.min(at, cg.length - 1)]!.style.width;
      if (cg[at]) cg[at]!.before(col); else cg[cg.length - 1]!.after(col);
      syncW(t); fit(t);
    }
  }
  function delRows(t: HTMLTableElement, r1: number, r2: number) {
    for (let r = r2; r >= r1; r--) {
      const g = gmap(t), tr = t.rows[r]!, next = t.rows[r + 1];
      g[r]!.forEach((x, c) => { if (x._r! < r && x._c === c) x.rowSpan--; });
      (Array.from(tr.cells) as Cell[]).forEach((x) => {
        if (x.rowSpan > 1 && next) {
          const n = x.cloneNode(true) as Cell; n.rowSpan = x.rowSpan - 1;
          const ref = (Array.from(next.cells) as Cell[]).find((d) => d._c! > x._c!);
          if (ref) ref.before(n); else next.appendChild(n);
        }
      });
      tr.remove();
    }
  }
  function delCols(t: HTMLTableElement, c1: number, c2: number) {
    for (let c = c2; c >= c1; c--) {
      const g = gmap(t), seen = new Set(g.map((row) => row[c]));
      seen.forEach((x) => { if (x) { if (x.colSpan > 1) x.colSpan--; else x.remove(); } });
      colsOf(t)[c]?.remove();
    }
    syncW(t);
  }
  function merge(R: ReturnType<typeof rect>) {
    const cs = cells(), first = R.g[R.r1]![R.c1]!;
    cs.forEach((x) => { if (x === first) return; if (x.textContent?.replace(/ /g, '').trim()) first.innerHTML += ` ${x.innerHTML}`; x.remove(); });
    first.colSpan = R.c2 - R.c1 + 1; first.rowSpan = R.r2 - R.r1 + 1; T!.a = T!.f = first;
  }
  function split(): boolean {
    const x = T!.f, cs = x.colSpan, rs = x.rowSpan; gmap(T!.t);
    if (cs === 1 && rs === 1) { hooks.say('Ô này chưa bị gộp nên không tách được'); return false; }
    const r = x._r!, c = x._c!; x.colSpan = 1; x.rowSpan = 1;
    for (let i = 0; i < rs; i++) {
      const tr = T!.t.rows[r + i]; if (!tr) continue;
      const ref = (Array.from(tr.cells) as Cell[]).find((d) => d !== x && d._c! >= c + cs);
      for (let j = i === 0 ? 1 : 0; j < cs; j++) { const n = mkTd(); if (ref) ref.before(n); else tr.appendChild(n); }
    }
    return true;
  }
  function borders(kind: string) {
    const R = rect();
    const nbr = (x: Cell, s: Side): Cell | undefined => s === 'Top' ? R.g[x._r! - 1]?.[x._c!] : s === 'Bottom' ? R.g[x._r! + x.rowSpan]?.[x._c!] : s === 'Left' ? R.g[x._r!]?.[x._c! - 1] : R.g[x._r!]?.[x._c! + x.colSpan];
    cells().forEach((x) => {
      const edge: Record<Side, boolean> = { Top: x._r === R.r1, Bottom: x._r! + x.rowSpan - 1 === R.r2, Left: x._c === R.c1, Right: x._c! + x.colSpan - 1 === R.c2 };
      SIDES.forEach((s) => {
        let v: string | null = null;
        const EDGE = edgeOf(T!.t);
        if (kind === 'all') v = EDGE; else if (kind === 'none') v = 'none';
        else if (kind === 'outside') v = edge[s] ? EDGE : null; else if (kind === 'inside') v = edge[s] ? null : EDGE;
        else if (kind === s.toLowerCase()) v = edge[s] ? EDGE : null;
        if (!v) return;
        x.style[`border${s}`] = v;
        const n = nbr(x, s); if (n) n.style[`border${OPP[s]}`] = v;
      });
    });
  }

  /** Thực thi một lệnh bảng; trả về true nếu đã xử lý */
  function exec(cmd: string, val = ''): boolean {
    if (!ensure()) { hooks.say('Bấm vào một ô trong bảng trước.'); return true; }
    hooks.before();
    const t = T!.t, R = rect(), nr = R.r2 - R.r1 + 1, nc = R.c2 - R.c1 + 1;
    const after = (r: number, c: number) => {
      const g = gmap(t), row = g[Math.min(r, g.length - 1)]!;
      T!.a = T!.f = row[Math.min(c, row.length - 1)]!; changed();
    };
    const rowsSel = () => nr > 1 ? Array.from(t.rows).slice(R.r1, R.r2 + 1) : Array.from(t.rows);
    switch (cmd) {
      case 'insA': for (let i = 0; i < nr; i++) insRow(t, R.r1); break;
      case 'insB': for (let i = 0; i < nr; i++) insRow(t, R.r2 + 1); break;
      case 'insL': for (let i = 0; i < nc; i++) insCol(t, R.c1); break;
      case 'insR': for (let i = 0; i < nc; i++) insCol(t, R.c2 + 1); break;
      case 'delRows': if (nr >= t.rows.length) return exec('delTable'); delRows(t, R.r1, R.r2); after(R.r1, R.c1); return true;
      case 'delCols': if (nc >= nCols(R.g)) return exec('delTable'); delCols(t, R.c1, R.c2); after(R.r1, R.c1); return true;
      case 'delTable': { const keep = t; clear(); if (hooks.removeTable) hooks.removeTable(keep); else keep.remove(); hooks.changed(); return true; }
      case 'merge': if (cells().length < 2) { hooks.say('Chọn từ 2 ô trở lên để gộp.'); return true; } merge(R); after(R.r1, R.c1); return true;
      case 'split': if (split()) changed(); return true;
      case 'rowh': for (let r = R.r1; r <= R.r2; r++) t.rows[r]!.style.height = `${Math.max(3, Number(val) || 9)}mm`; break;
      case 'colw': { ensureCols(t); const cg = colsOf(t); for (let c = R.c1; c <= R.c2; c++) cg[c]!.style.width = `${Math.max(5, Number(val) || 20) * PXMM}px`; syncW(t); fit(t); break; }
      case 'autofit':
        if (val === 'Content') { t.querySelector(':scope > colgroup')?.remove(); t.style.tableLayout = 'auto'; t.style.width = 'auto'; }
        else {
          t.style.tableLayout = ''; ensureCols(t);
          if (val === 'Page') {
            const p = t.parentElement!, cs = getComputedStyle(p), cg = colsOf(t);
            const k = (p.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) / cg.reduce((a, c) => a + parseFloat(c.style.width), 0);
            cg.forEach((c) => { c.style.width = `${parseFloat(c.style.width) * k}px`; }); syncW(t);
          }
        }
        break;
      case 'distR': { const rs = rowsSel(), h = rs.reduce((a, tr) => a + tr.offsetHeight, 0) / rs.length; rs.forEach((tr) => { tr.style.height = `${h}px`; }); break; }
      case 'distC': {
        ensureCols(t); const cg = colsOf(t), part = nc > 1 ? cg.slice(R.c1, R.c2 + 1) : cg, w = part.reduce((a, c) => a + parseFloat(c.style.width), 0) / part.length;
        part.forEach((c) => { c.style.width = `${w}px`; }); syncW(t); break;
      }
      case 'align': { const [h, v] = val.split('|') as [string, string]; cells().forEach((x) => { x.style.textAlign = h; x.style.verticalAlign = v; }); break; }
      case 'cellAlign': { cells().forEach((x) => { x.style.textAlign = x.style.textAlign === 'center' ? 'right' : x.style.textAlign === 'right' ? 'left' : 'center'; x.style.verticalAlign = 'middle'; }); break; }
      case 'dir': cells().forEach((x) => { x.style.writingMode = x.style.writingMode === 'vertical-rl' ? '' : 'vertical-rl'; }); break;
      case 'bord': borders(val); break;
      case 'shade': cells().forEach((x) => { x.style.background = val; }); break;
      case 'shadeToggle': cells().forEach((x) => { x.style.background = x.style.background ? '' : '#bfdbfe'; }); break;
      case 'pad': t.querySelectorAll<HTMLElement>('td, th').forEach((x) => { x.style.padding = val; }); break;
      case 'padToggle': t.querySelectorAll<HTMLElement>('td, th').forEach((x) => { x.style.padding = x.style.padding ? '' : '5mm'; }); break;
      case 'header': { const on = t.dataset.hdr !== '1'; setHeader(t, on); hooks.say(on ? 'Đã bật hàng tiêu đề' : 'Đã tắt hàng tiêu đề'); break; }
      case 'bandR': t.dataset.bandR = t.dataset.bandR === '1' ? '' : '1'; break;
      case 'bandC': t.dataset.bandC = t.dataset.bandC === '1' ? '' : '1'; break;
      case 'style': applyStyle(t, val); break;
      case 'bcolor': t.dataset.bc = val; recolorBorders(t); break;
      case 'bwidth': t.dataset.bw = val; recolorBorders(t); break;
      case 'selCell': T!.a = T!.f; break;
      case 'selRow': T!.a = R.g[R.r1]![0]!; T!.f = R.g[R.r1]![nCols(R.g) - 1]!; break;
      case 'selCol': T!.a = R.g[0]![R.c1]!; T!.f = R.g[R.g.length - 1]![R.c1]!; break;
      case 'selTable': T!.a = R.g[0]![0]!; T!.f = R.g[R.g.length - 1]![nCols(R.g) - 1]!; break;
      case 'pos':
        if (val === 'inline') { ['data-pos', 'data-x', 'data-y'].forEach((a) => t.removeAttribute(a)); t.style.left = ''; t.style.top = ''; }
        else { ['data-x', 'data-y'].forEach((a) => t.removeAttribute(a)); t.style.left = ''; t.style.top = ''; t.dataset.pos = val; ensureCols(t); fit(t, box(t) * 0.55); }
        break;
      case 'left': case 'center': case 'right':
        if (!t.style.width || t.style.width === '100%') ensureCols(t);
        t.style.marginLeft = cmd === 'left' ? '0' : 'auto'; t.style.marginRight = cmd === 'right' ? '0' : 'auto'; break;
      default: return false;
    }
    changed();
    return true;
  }

  /** Lệnh từ Ribbon (id nút hoặc 'tbl:<lệnh>:<giá trị>'). false = không phải lệnh bảng / chưa có bảng đang chọn */
  function run(id: string, value?: string | number): boolean {
    if (id.startsWith('tbl:')) { const [, cmd = '', ...rest] = id.split(':'); return exec(cmd, rest.join(':')); }
    if (id === 'tblBorders') return exec('bord', 'all');
    if (id === 'tblShading') return exec('shadeToggle');
    if (id === 'cellPadding') return exec('padToggle');
    const cmd = RIBBON_IDS[id] ?? (id === 'cellAlign' ? 'cellAlign' : undefined);
    if (!cmd) return false;
    if (!ensure()) return false;
    return exec(cmd, value === undefined ? '' : String(value));
  }

  /** Menu chuột phải cho bảng */
  function contextItems(): ContextItem[] {
    const multi = cells().length > 1, merged = T!.f.colSpan > 1 || T!.f.rowSpan > 1;
    return [
      'Cut', 'Copy', 'Paste', '-',
      { label: 'Insert', sub: ['Insert columns left', 'Insert columns right', 'Insert rows above', 'Insert rows below'] },
      { label: 'Delete', sub: ['Delete columns', 'Delete rows', 'Delete table'] },
      ...(multi ? ['Merge cells'] : []), ...(merged ? ['Split cells'] : []),
      'Distribute rows evenly', 'Distribute columns evenly', '-',
      { label: 'Border styles', sub: TABLE_MENU_ITEMS.borders.map((b) => `Border: ${b.label}`) },
      { label: 'AutoFit', sub: ['AutoFit to contents', 'AutoFit to window', 'Fixed column width'] },
      'Text direction',
    ];
  }
  function pick(label: string): boolean {
    const cmd = MENU_COMMANDS[label]; if (!cmd) return false;
    const [c, ...rest] = cmd.split(':'); return exec(c!, rest.join(':'));
  }

  /* ── chuột / phím ── */
  function colDrag(t: HTMLTableElement, td: Cell, e: MouseEvent) {
    hooks.before(); gmap(t); ensureCols(t);
    const cg = colsOf(t), i = td._c! + td.colSpan - 1, w0 = cg.map((c) => parseFloat(c.style.width)), x0 = e.clientX, s = scale();
    const mv = (ev: MouseEvent) => {
      const room = Math.max(0, box(t) - w0.reduce((a, b) => a + b, 0));
      const w = Math.min(Math.max(20, w0[i]! + (ev.clientX - x0) / s), w0[i]! + (cg[i + 1] ? w0[i + 1]! - 20 : room)); cg[i]!.style.width = `${w}px`;
      if (cg[i + 1]) cg[i + 1]!.style.width = `${Math.max(20, w0[i + 1]! - (w - w0[i]!))}px`;
      syncW(t); place(); hooks.changed();
    };
    const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); };
    addEventListener('mousemove', mv); addEventListener('mouseup', up);
  }
  const onMouseDown = (e: MouseEvent) => {
    if (hooks.readonly()) return;
    const td = cellOf(e.target);
    if (!td) {
      const p = page();
      if (T && p && e.target instanceof Node && p.contains(e.target) && !(e.target as Element).closest?.('.tbl-handle')) clear();
      return;
    }
    const t = td.closest('table') as HTMLTableElement;
    if (e.button !== 0) { if (!T || T.t !== t || !cells().includes(td)) select(t, td); return; }
    const r = td.getBoundingClientRect();
    if (e.clientX > r.right - 4 && e.clientX <= r.right + 3) { e.preventDefault(); select(t, td); colDrag(t, td, e); return; }
    const anchor = e.shiftKey && T && T.t === t ? T.a : td;
    gmap(t); select(t, anchor, td); drag = { t };
  };
  const onMouseMove = (e: MouseEvent) => {
    const td = cellOf(e.target), p = page();
    if (drag && T) {
      if (td && td.closest('table') === drag.t && td !== T.f) { T.f = td; paint(); drag.t.classList.add('tbl-dragging'); getSelection()?.removeAllRanges(); }
      return;
    }
    if (!p) return;
    const r = td?.getBoundingClientRect();
    p.classList.toggle('tbl-col-resize', !!td && !!r && e.clientX > r.right - 4 && e.clientX <= r.right + 3);
  };
  const onMouseUp = () => { if (!drag) return; drag.t.classList.remove('tbl-dragging'); drag = null; if (T) hooks.selected(T.f); };
  const onKeyDown = (e: KeyboardEvent) => { // Tab = ô kế; Tab ở ô cuối = thêm hàng (như Word)
    if (e.key !== 'Tab' || hooks.readonly()) return;
    const caret = getSelection()?.anchorNode;
    const td = cellOf(e.target) ?? cellOf(caret instanceof Element ? caret : caret?.parentElement ?? null); // phím gõ đi vào vùng soạn thảo ngoài, không phải <td>
    if (!td) return;
    e.preventDefault();
    const t = td.closest('table') as HTMLTableElement;
    let all = Array.from(t.querySelectorAll<Cell>('td, th'));
    const i = all.indexOf(td) + (e.shiftKey ? -1 : 1);
    if (i >= all.length) { hooks.before(); insRow(t, t.rows.length); all = Array.from(t.querySelectorAll<Cell>('td, th')); hooks.changed(); }
    const n = all[i]; if (!n) return;
    select(t, n);
    n.focus(); const rg = document.createRange(); rg.selectNodeContents(n); rg.collapse(false); const s = getSelection(); s?.removeAllRanges(); s?.addRange(rg);
  };
  const onInput = (e: Event) => { if (cellOf(e.target)) place(); };
  const onSelectionChange = () => { // đặt con trỏ vào ô bằng bàn phím / sau khi chèn bảng
    if (drag) return;
    const node = getSelection()?.anchorNode; if (!node) return;
    const td = cellOf(node instanceof Element ? node : node.parentElement);
    if (td && (!T || !document.contains(T.t) || T.t !== td.closest('table'))) select(td.closest('table') as HTMLTableElement, td);
  };
  /** Vị trí chèn dưới con trỏ chuột: trong đoạn chữ thì tách đoạn, ngoài đoạn thì trước/sau khối gần nhất */
  type Drop = { body: HTMLElement; block: HTMLElement | null; after: boolean; range: Range | null; x: number; y: number; w: number };
  function dropAt(cx: number, cy: number, skip: HTMLTableElement): Drop | null {
    const pg = page(); if (!pg) return null;
    const bodies = Array.from(pg.querySelectorAll<HTMLElement>('[data-editor-body]'));
    if (!bodies.length) return null;
    const dist = (r: DOMRect) => cy < r.top ? r.top - cy : cy > r.bottom ? cy - r.bottom : 0;
    const body = bodies.reduce((a, b) => dist(b.getBoundingClientRect()) < dist(a.getBoundingClientRect()) ? b : a);
    const topOf = (n: Node | null): HTMLElement | null => { let e: Node | null = n; while (e && e.parentNode !== body) e = e.parentNode; return e instanceof HTMLElement && e !== skip ? e : null; };
    const doc = document as Document & { caretRangeFromPoint?: (x: number, y: number) => Range | null };
    const r = doc.caretRangeFromPoint?.(cx, cy) ?? null;
    let block = r && body.contains(r.startContainer) ? topOf(r.startContainer) : null;
    if (block && block.matches('p') && r && !block.querySelector('table')) {
      const rr = r.cloneRange(); rr.collapse(true); const rc = rr.getClientRects()[0] ?? rr.getBoundingClientRect();
      const bb = block.getBoundingClientRect();
      if (cy > bb.top + 4 && cy < bb.bottom - 4) return { body, block, after: false, range: rr, x: bb.left, y: rc.bottom, w: bb.width };
    }
    if (!block) { // gần khối nào nhất thì chèn trước/sau khối đó
      let best = Infinity;
      Array.from(body.children).forEach((c) => { if (c === skip || !(c instanceof HTMLElement) || !c.offsetHeight) return; const d = dist(c.getBoundingClientRect()); if (d < best) { best = d; block = c; } });
    }
    if (!block) return { body, block: null, after: true, range: null, x: body.getBoundingClientRect().left, y: body.getBoundingClientRect().top, w: body.offsetWidth };
    const bb = (block as HTMLElement).getBoundingClientRect(), after = cy > bb.top + bb.height / 2;
    return { body, block, after, range: null, x: bb.left, y: after ? bb.bottom : bb.top, w: bb.width };
  }
  /** Bấm = chọn cả bảng; kéo = chuyển bảng tới chỗ khác trong luồng nội dung (chữ/ảnh tự dạt ra, không đè) */
  moveH.onmousedown = (e) => {
    e.preventDefault(); if (!T || hooks.readonly()) return;
    const t = T.t, x0 = e.clientX, y0 = e.clientY;
    const line = document.createElement('div'); line.className = 'tbl-drop-line'; document.body.appendChild(line);
    let drop: Drop | null = null, moved = false;
    const mv = (ev: MouseEvent) => {
      if (!moved && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 5) return;
      moved = true; document.body.classList.add('tbl-moving');
      drop = dropAt(ev.clientX, ev.clientY, t);
      if (drop) { line.style.display = 'block'; line.style.left = `${drop.x}px`; line.style.width = `${drop.w}px`; line.style.top = `${drop.y - 1}px`; }
    };
    const up = () => {
      removeEventListener('mousemove', mv); removeEventListener('mouseup', up); line.remove(); document.body.classList.remove('tbl-moving');
      if (!moved) { const g = gmap(t); T = { t, a: g[0]![0]!, f: g[g.length - 1]![nCols(g) - 1]! }; paint(); return; }
      const d = drop; if (!d) return;
      hooks.before();
      t.removeAttribute('data-pos'); t.style.left = ''; t.style.top = '';
      if (d.range && d.block) { // thả giữa đoạn: tách đoạn làm hai, bảng nằm giữa, không mất chữ nào
        const tail = document.createRange(); tail.setStart(d.range.startContainer, d.range.startOffset); tail.setEndAfter(d.block.lastChild ?? d.block);
        const rest = d.block.cloneNode(false) as HTMLElement; rest.appendChild(tail.extractContents());
        d.block.after(t, rest);
        if (!d.block.textContent?.trim() && !d.block.querySelector('img')) d.block.remove();
        if (!rest.textContent?.trim() && !rest.querySelector('img')) rest.innerHTML = '<br>';
      } else if (d.block) { if (d.after) d.block.after(t); else d.block.before(t); }
      else d.body.appendChild(t);
      changed();
    };
    addEventListener('mousemove', mv); addEventListener('mouseup', up);
  };
  sizeH.onmousedown = (e) => {
    if (!T || hooks.readonly()) return; e.preventDefault(); hooks.before();
    const t = T.t; ensureCols(t);
    const cg = colsOf(t), w0 = cg.map((c) => parseFloat(c.style.width)), tw = w0.reduce((a, b) => a + b, 0), h0 = Array.from(t.rows).map((tr) => tr.offsetHeight), x0 = e.clientX, y0 = e.clientY, s = scale();
    const mv = (ev: MouseEvent) => {
      const k = Math.min(box(t), Math.max(60, tw + (ev.clientX - x0) / s)) / tw, dy = (ev.clientY - y0) / s / t.rows.length;
      cg.forEach((c, i) => { c.style.width = `${w0[i]! * k}px`; }); syncW(t);
      Array.from(t.rows).forEach((tr, i) => { tr.style.height = `${Math.max(20, h0[i]! + dy)}px`; });
      place(); hooks.changed();
    };
    const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); };
    addEventListener('mousemove', mv); addEventListener('mouseup', up);
  };

  function attach() {
    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('input', onInput);
    document.addEventListener('selectionchange', onSelectionChange);
    document.addEventListener('scroll', place, true);
    addEventListener('resize', place);
    return () => {
      document.removeEventListener('mousedown', onMouseDown, true);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('input', onInput);
      document.removeEventListener('selectionchange', onSelectionChange);
      document.removeEventListener('scroll', place, true);
      removeEventListener('resize', place);
      moveH.remove(); sizeH.remove();
    };
  }

  return {
    attach, run, pick, unpaint, place, withoutPaint,
    /** Đang có một bảng được chọn */
    active: () => !!T && document.contains(T.t),
    /** Chuột phải vào ô bảng → danh sách mục menu (null nếu không phải bảng của engine) */
    contextItems(target: EventTarget | null): ContextItem[] | null {
      const td = cellOf(target); if (!td) return null;
      const t = td.closest('table') as HTMLTableElement;
      if (!T || T.t !== t || !cells().includes(td)) select(t, td);
      return contextItems();
    },
    selectedCell: (): HTMLTableCellElement | null => (ensure() ? T!.f : null),
  };
}

export type TableEngine = ReturnType<typeof createTableEngine>;
