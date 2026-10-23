// Thanh công cụ tổng kiểu Word. Chỉ nhận dữ liệu + callback; không biết gì về dữ liệu của từng dạng bài.
//   <Ribbon adapter state onCommand />  →  mọi nút gọi onCommand(id, value); trả về false nghĩa là dạng bài chưa nối lệnh đó.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';
import { groupsOf, visibleTabs } from './tabs';
import { ChevronDown } from 'lucide-react';
import { RibbonIcon, hasIcon } from './icons';
import { ColorPalette, ContextMenu, LayoutGallery, Popover, TableGrid, type Anchor, type LayoutOption } from './Popovers';
import type { ButtonItem, ExerciseAdapter, NumberItem, RibbonItem, RibbonState, SelectItem, TabId } from './types';

export type OnCommand = (id: string, value?: string | number) => boolean;

interface Props {
  adapter: ExerciseAdapter;
  state: RibbonState;
  layouts: LayoutOption[];
  currentLayout?: string;
  onCommand: OnCommand;
  /** Báo cho người dùng biết lệnh chưa nối (mặc định: không làm gì) */
  onNotWired?: (label: string) => void;
  tab: TabId;
  onTab: (tab: TabId) => void;
}

type Popup =
  | { kind: 'palette-text' | 'palette-highlight' | 'palette-shading' | 'table-grid' | 'layout-gallery'; anchor: Anchor }
  | { kind: 'menu'; anchor: Anchor; id: string; label: string; items: { label: string; value: string }[] }
  | null;

export const Ribbon = ({ adapter, state, layouts, currentLayout, onCommand, onNotWired, tab, onTab }: Props) => {
  const [popup, setPopup] = useState<Popup>(null);
  const [showStatus, setShowStatus] = useState(false);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const isCtx = (t: TabId): boolean => t === 'Picture Format' || t === 'Table Design' || t === 'Table Layout';
  const lastRegularTab = useRef<TabId>(tab === 'File' || isCtx(tab) ? 'Home' : tab);
  const tabs = visibleTabs(state.selection);
  const fileMenuOpen = tab === 'File';
  const candidate = fileMenuOpen
    ? lastRegularTab.current
    : isCtx(tab) && !tabs.includes(tab)
    ? lastRegularTab.current
    : tab;
  const active: TabId = candidate !== 'File' && tabs.includes(candidate)
    ? candidate
    : lastRegularTab.current && tabs.includes(lastRegularTab.current)
    ? lastRegularTab.current
    : 'Home';
  const groups = useMemo(() => groupsOf(active, adapter), [active, adapter]);
  const fileGroups = useMemo(() => groupsOf('File', adapter), [adapter]);

  useEffect(() => {
    if (tab !== 'File' && !isCtx(tab) && tabs.includes(tab)) {
      lastRegularTab.current = tab;
    }
  }, [tab, state.selection]);

  useEffect(() => {
    if (isCtx(tab) && !tabs.includes(tab)) {
      onTab(lastRegularTab.current);
    }
  }, [tab, tabs, onTab]);

  useEffect(() => {
    if (!fileMenuOpen) return;
    const close = () => onTab(tabs.includes(lastRegularTab.current) ? lastRegularTab.current : 'Home');
    const down = (event: globalThis.MouseEvent) => {
      const target = event.target as HTMLElement;
      if (fileMenuRef.current?.contains(target) || target.closest('[data-rb-file-tab]')) return;
      close();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    document.addEventListener('mousedown', down, true);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down, true);
      document.removeEventListener('keydown', key);
    };
  }, [fileMenuOpen, onTab, state.selection]);

  /** Lý do nút bị khóa (chuỗi rỗng = dùng được) */
  const reasonOf = (x: ButtonItem | SelectItem | NumberItem): string => {
    if (state.previewMode && !['preview', 'editMode', 'print', 'zoom', 'zoom100', 'onePage', 'help', 'shortcuts', 'feedback'].includes(x.id)) return 'Đang ở chế độ Preview – chuyển sang Edit Mode để chỉnh sửa';
    const why = x.disabledWhen?.(adapter);
    if (why) return why;
    // Status dots are audit metadata; command availability is decided by the controller/capability checks.
    if (x.need === 'text' && state.selection !== 'text' && state.selection !== 'table') return 'Chọn một đoạn chữ trên trang để dùng';
    if (x.need === 'image' && state.selection !== 'image') return 'Chọn một ảnh trên trang để dùng';
    if (x.id === 'undo' && !state.canUndo) return 'Chưa có thao tác nào để hoàn tác';
    if (x.id === 'redo' && !state.canRedo) return 'Không có thao tác để làm lại';
    return '';
  };

  const send = (id: string, label: string, value?: string | number) => {
    if (!onCommand(id, value)) onNotWired?.(label);
  };

  const renderItem = (x: RibbonItem, key: string, afterAction?: () => void) => {
    if (x.kind === 'sep') return <span key={key} className="rb-sep" />;
    if (x.kind === 'stack') return <span key={key} className="rb-stack">{x.items.map((c, n) => renderItem(c, `${key}-${n}`, afterAction))}</span>;
    const why = reasonOf(x);
    const dis = !!why;
    const tip = dis ? why : x.tip ?? x.label;
    const dot = <span className={`rb-dot ${x.status}`} />;

    if (x.kind === 'button') {
      const on = x.active?.(state) ?? false;
      const click = (e: MouseEvent<HTMLButtonElement>) => {
        if (dis) return;
        if (x.menu) {
          const r = e.currentTarget.getBoundingClientRect();
          setPopup({ kind: 'menu', anchor: { left: r.left, bottom: r.bottom }, id: x.id, label: x.label, items: x.menu });
          return;
        }
        if (x.popover) {
          const r = e.currentTarget.getBoundingClientRect();
          setPopup({ kind: x.popover, anchor: { left: r.left, bottom: r.bottom } });
          return;
        }
        send(x.id, x.label);
        afterAction?.();
      };
      const swatch = x.id === 'color' ? state.textAttrs.color ?? '#dc2626' : x.id === 'highlight' ? state.textAttrs.highlight ?? '#fde047' : undefined;
      return (
        <button
          key={key}
          type="button"
          aria-label={x.label}
          aria-pressed={x.active ? on : undefined}
          aria-disabled={dis || undefined}
          data-tip={tip}
          title={tip}
          className={`rb-btn${x.big ? ' big' : ''}${on ? ' on' : ''}${dis ? ' dis' : ''}`}
          onMouseDown={(e) => e.preventDefault()} // bấm nút không cướp vùng chọn chữ
          onClick={click}
        >
          {swatch ? <span className="rb-col"><span className="rb-ic">{hasIcon(x.icon) ? <RibbonIcon name={x.icon} size={15} /> : x.icon}</span><span className="rb-bar" style={{ background: swatch }} /></span> : <span className="rb-ic">{hasIcon(x.icon) ? <RibbonIcon name={x.icon} size={x.big ? 17 : 15} /> : x.icon}</span>}
          {x.big && <span className="rb-lb">{x.label}{x.chevron && <ChevronDown size={10} className="rb-chev" />}</span>}
          {!x.big && x.chevron && <ChevronDown size={10} className="rb-chev" />}
          {dot}
        </button>
      );
    }

    if (x.kind === 'number' && x.inline) {
      return (
        <label key={key} className="rb-inline" title={tip}>
          {x.icon && <span className="rb-ic"><RibbonIcon name={x.icon} size={15} /></span>}
          <span className="rb-inline-lb">{x.label}</span>
          <span className={`rb-inline-box${dis ? ' dis' : ''}`}>
            <input type="number" disabled={dis} defaultValue={x.value} onChange={(e) => send(x.id, x.label, Number(e.target.value))} />
            <span className="rb-unit">{x.unit}</span>
          </span>
        </label>
      );
    }

    const liveValue = x.kind === 'select' ? x.valueFromState?.(state) : undefined;
    const field = x.kind === 'select' ? (
      <select
        disabled={dis}
        title={tip}
        {...(liveValue !== undefined ? { value: liveValue } : { defaultValue: x.value })}
        style={x.width ? { width: x.width } : undefined}
        className="rb-sel"
        onChange={(e: ChangeEvent<HTMLSelectElement>) => send(x.id, x.label, e.target.value)}
      >
        {x.options.map((o) => <option key={o}>{o}</option>)}
      </select>
    ) : (
      <input
        type="number"
        disabled={dis}
        title={tip}
        defaultValue={x.value}
        className="rb-num"
        onChange={(e) => send(x.id, x.label, Number(e.target.value))}
      />
    );
    return x.labelled
      ? <label key={key} className="rb-field" title={tip}>{x.label}{field}</label>
      : <span key={key} className="rb-field plain" title={tip}>{field}</span>;
  };

  const close = () => setPopup(null);
  const closeFileMenu = () => onTab(tabs.includes(lastRegularTab.current) ? lastRegularTab.current : 'Home');

  const selectTab = (next: TabId) => {
    setPopup(null);
    if (next === 'File') {
      if (fileMenuOpen) closeFileMenu();
      else {
        if (!isCtx(active)) lastRegularTab.current = active;
        onTab('File');
      }
      return;
    }
    if (!isCtx(next)) {
      lastRegularTab.current = next;
    }
    onTab(next);
  };

  return (
    <div className="rb-root" data-testid="ribbon">
      <div className="rb-tabs" role="tablist">
        {tabs.map((t) => {
          const ctx = t === 'Picture Format' || t === 'Table Design' || t === 'Table Layout';
          const selected = t === 'File' ? fileMenuOpen : !fileMenuOpen && t === active;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={selected}
              aria-expanded={t === 'File' ? fileMenuOpen : undefined}
              aria-haspopup={t === 'File' ? 'menu' : undefined}
              data-rb-file-tab={t === 'File' ? '' : undefined}
              className={`rb-tab${selected ? ' on' : ''}${ctx ? ' ctx' : ''}`}
              onClick={() => selectTab(t)}
            >
              {t}{ctx && <span className="rb-tag">ngữ cảnh</span>}
            </button>
          );
        })}
        <label className="rb-status-toggle"><input type="checkbox" checked={showStatus} onChange={(e) => setShowStatus(e.target.checked)} /> Hiện chấm trạng thái</label>
      </div>

      <div className={`rb-body${showStatus ? ' show-status' : ''}`}>
        {groups.map((g) => (
          <div
            key={g.name}
            className={`rb-group${g.name === 'Clipboard' ? ' clipboard' : ''}${['Font', 'Paragraph', 'Styles', 'Editing'].includes(g.name) ? ' home-large' : ''}`}
          >
            <div className={`rb-row${g.nowrap ? ' nowrap' : g.items.length > 12 ? ' wide' : ''}`}>{g.items.map((x, i) => renderItem(x, `${g.name}-${i}`))}</div>
            <div className="rb-gname">{g.name}</div>
          </div>
        ))}
      </div>

      {fileMenuOpen && (
        <div ref={fileMenuRef} className={`rb-file-menu${showStatus ? ' show-status' : ''}`} role="menu" aria-label="File">
          {fileGroups.map((group) => (
            <section key={group.name} className="rb-file-group" aria-label={group.name}>
              <h3>{group.name}</h3>
              <div>{group.items.map((item, index) => renderItem(item, `file-${group.name}-${index}`, closeFileMenu))}</div>
            </section>
          ))}
        </div>
      )}

      {popup && (
        <Popover anchor={popup.anchor} onClose={close}>
          {popup.kind === 'menu' && <ContextMenu items={popup.items.map((m) => m.label)} onPick={(l) => { const m = popup.items.find((i) => i.label === l); send(m?.value ?? popup.id, l, m?.value); close(); }} />}
          {popup.kind === 'palette-text' && <ColorPalette onPick={(c) => { send('color', 'Font color', c ?? ''); close(); }} />}
          {popup.kind === 'palette-highlight' && <ColorPalette highlight onPick={(c) => { send('highlight', 'Highlight', c ?? ''); close(); }} />}
          {popup.kind === 'palette-shading' && <ColorPalette highlight label="Không tô nền đoạn" onPick={(c) => { send('shading', 'Shading', c ?? ''); close(); }} />}
          {popup.kind === 'table-grid' && <TableGrid onPick={(r, c) => { send('table', 'Table', `${r}x${c}`); close(); }} />}
          {popup.kind === 'layout-gallery' && <LayoutGallery options={layouts} value={currentLayout} onPick={(id) => { send('layout', 'Layout', id); close(); }} />}
        </Popover>
      )}
    </div>
  );
};
