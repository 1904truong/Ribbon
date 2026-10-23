// Thành phần ngoài các tab: Quick Access Toolbar (thanh tiêu đề) và mini toolbar nổi khi bôi đen chữ.

import { useEffect, useState } from 'react';
import { Popover, ColorPalette, ContextMenu } from './Popovers';
import { TABLE_MENU_ITEMS } from './tableEngine';
import type { RibbonState } from './types';

type Send = (id: string, value?: string | number) => void;

export const QuickAccess = ({ state, send }: { state: RibbonState; send: Send }) => (
  <div className="rb-qat" aria-label="Quick Access Toolbar">
    <button className="rb-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => send('save')} title="Save (Ctrl+S)">💾</button>
    <button className="rb-btn" disabled={!state.canUndo} onMouseDown={(e) => e.preventDefault()} onClick={() => send('undo')} title="Undo (Ctrl+Z)">↶</button>
    <button className="rb-btn" disabled={!state.canRedo} onMouseDown={(e) => e.preventDefault()} onClick={() => send('redo')} title="Redo (Ctrl+Y)">↷</button>
  </div>
);

const FONTS = ['Arial', 'Times New Roman', 'Calibri', 'Quicksand', 'Roboto', 'Inter'];
const SIZES = ['8', '9', '10', '11', '12', '13', '14', '16', '18', '20', '24', '28', '36', '48'];

/** Hiện cạnh vùng chữ vừa bôi đen (hoặc con trỏ trong ô bảng) trong `container`; chỉ gọi lệnh chung `send`, không tự định dạng */
export const MiniToolbar = ({ container, state, send }: { container: HTMLElement | null; state: RibbonState; send: Send }) => {
  const [pos, setPos] = useState<{ left: number; top: number; inTable: boolean } | null>(null);
  const [palette, setPalette] = useState<{ left: number; bottom: number; kind: 'color' | 'highlight' } | null>(null);
  const [menu, setMenu] = useState<{ left: number; bottom: number; items: { label: string; value: string }[] } | null>(null);

  useEffect(() => {
    const onChange = () => {
      const s = window.getSelection();
      if (!container || !s || s.rangeCount === 0 || !s.anchorNode || !container.contains(s.anchorNode)) { setPos(null); return; }
      const anchor = s.anchorNode instanceof Element ? s.anchorNode : s.anchorNode.parentElement;
      const cell = anchor?.closest('td, th');
      const inTable = !!cell && !cell.closest('.rb-table-wrap') && !container.classList.contains('preview-mode');
      if (s.isCollapsed && !inTable) { setPos(null); return; }
      const r = (s.isCollapsed && cell ? cell : s.getRangeAt(0)).getBoundingClientRect();
      const top = r.top - 44 < 8 ? r.bottom + 6 : r.top - 44;
      setPos({ left: Math.max(8, r.left), top, inTable });
    };
    document.addEventListener('selectionchange', onChange);
    return () => document.removeEventListener('selectionchange', onChange);
  }, [container]);

  if (!pos) return null;
  const a = state.textAttrs;
  const B = ({ id, label, on, tip }: { id: string; label: string; on?: boolean; tip?: string }) => (
    <button className={`rb-btn${on ? ' on' : ''}`} onMouseDown={(e) => e.preventDefault()} onClick={() => send(id)} title={tip ?? id}>{label}</button>
  );
  const MenuBtn = ({ label, tip, items }: { label: string; tip: string; items: { label: string; value: string }[] }) => (
    <button className="rb-btn" title={tip} onMouseDown={(e) => e.preventDefault()} onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setMenu({ left: r.left, bottom: r.bottom, items }); }}>{label}</button>
  );
  return (
    <div className="rb-mini" style={{ left: pos.left, top: pos.top }} onMouseDown={(e) => { if (!(e.target instanceof HTMLSelectElement)) e.preventDefault(); }}>
      {pos.inTable && (
        <>
          <select className="rb-sel" title="Font family" style={{ width: 92 }} value={a.fontFamily ?? ''} onChange={(e) => send('fontFamily', e.target.value)}>
            {!a.fontFamily && <option value="">Font</option>}{FONTS.map((f) => <option key={f}>{f}</option>)}
          </select>
          <select className="rb-sel" title="Font size" style={{ width: 52 }} value={a.fontSizePt ? String(Math.round(a.fontSizePt)) : ''} onChange={(e) => send('fontSize', e.target.value)}>
            {!a.fontSizePt && <option value="">Pt</option>}{SIZES.map((f) => <option key={f}>{f}</option>)}
          </select>
        </>
      )}
      <B id="bold" label="B" on={a.bold} /><B id="italic" label="I" on={a.italic} /><B id="underline" label="U" on={a.underline} />
      <B id="strike" label="S̶" on={a.strike} /><B id="subscript" label="x₂" on={a.script === 'sub'} /><B id="superscript" label="x²" on={a.script === 'super'} />
      <button className="rb-btn" title="Font color" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPalette({ left: r.left, bottom: r.bottom, kind: 'color' }); }}>
        <span className="rb-col"><span className="rb-ic">A</span><span className="rb-bar" style={{ background: a.color ?? '#dc2626' }} /></span>
      </button>
      {pos.inTable && (
        <>
          <button className="rb-btn" title="Highlight" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPalette({ left: r.left, bottom: r.bottom, kind: 'highlight' }); }}>
            <span className="rb-col"><span className="rb-ic">🖍</span><span className="rb-bar" style={{ background: a.highlight ?? '#fde047' }} /></span>
          </button>
          <B id="alignLeft" label="⫷" on={a.alignment === 'left'} tip="Align left" /><B id="alignCenter" label="≡" on={a.alignment === 'center'} tip="Center" /><B id="alignRight" label="⫸" on={a.alignment === 'right'} tip="Align right" />
          <MenuBtn label="▢▾" tip="Borders" items={TABLE_MENU_ITEMS.borders!} />
          <MenuBtn label="▨▾" tip="Shading" items={TABLE_MENU_ITEMS.shading!} />
          <MenuBtn label="Insert ▾" tip="Insert row / column" items={TABLE_MENU_ITEMS.insert!} />
          <MenuBtn label="Delete ▾" tip="Delete row / column / table" items={TABLE_MENU_ITEMS.delete!} />
        </>
      )}
      <B id="clearFormat" label="⌫" />
      {palette && <Popover anchor={palette} onClose={() => setPalette(null)}><ColorPalette highlight={palette.kind === 'highlight'} onPick={(c) => { send(palette.kind, c ?? ''); setPalette(null); }} /></Popover>}
      {menu && <Popover anchor={menu} onClose={() => setMenu(null)}><ContextMenu items={menu.items.map((i) => i.label)} onPick={(l) => { const m = menu.items.find((i) => i.label === l); setMenu(null); if (m) send(m.value); }} /></Popover>}
    </div>
  );
};
