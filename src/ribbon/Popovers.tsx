// Panel thả xuống dùng chung: bảng màu, lưới chọn kích thước bảng, thư viện layout, menu ngữ cảnh.
// Panel mở bằng portal (position: fixed) nên không bị cắt bởi vùng cuộn; bấm ra ngoài hoặc Esc thì đóng.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

export const PALETTE = [
  '#000000', '#434343', '#666666', '#999999', '#cccccc', '#ffffff', '#dc2626', '#ea580c', '#ca8a04', '#16a34a',
  '#0891b2', '#2563eb', '#7c3aed', '#db2777', '#7f1d1d', '#7c2d12', '#713f12', '#14532d', '#164e63', '#1e3a8a',
  '#fecaca', '#fed7aa', '#fef08a', '#bbf7d0', '#a5f3fc', '#bfdbfe', '#ddd6fe', '#fbcfe8', '#fde047', '#86efac',
];

export interface Anchor { left: number; bottom: number }

export const Popover = ({ anchor, onClose, children }: { anchor: Anchor; onClose: () => void; children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: anchor.left, top: anchor.bottom + 4 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setPos({
      left: Math.max(8, Math.min(anchor.left, window.innerWidth - el.offsetWidth - 8)),
      top: Math.max(8, Math.min(anchor.bottom + 4, window.innerHeight - el.offsetHeight - 8)),
    });
  }, [anchor]);

  useEffect(() => {
    const down = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', down, true);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down, true); document.removeEventListener('keydown', key); };
  }, [onClose]);

  return createPortal(
    // mousedown bị chặn để bấm vào panel không làm mất vùng chọn chữ trên trang
    <div ref={ref} className="rb-pop" style={pos} onMouseDown={(e) => e.preventDefault()}>{children}</div>,
    document.body,
  );
};

export const ColorPalette = ({ highlight, label, onPick }: { highlight?: boolean; label?: string; onPick: (color: string | null) => void }) => (
  <div>
    <button className="rb-pop-none" onClick={() => onPick(null)}>{label ?? (highlight ? 'Không tô nền' : 'Mặc định (đen)')}</button>
    <div className="rb-swatches">
      {PALETTE.map((c) => <i key={c} title={c} style={{ background: c }} onClick={() => onPick(c)} />)}
    </div>
  </div>
);

export const TableGrid = ({ onPick }: { onPick: (rows: number, cols: number) => void }) => {
  const [hover, setHover] = useState<[number, number]>([0, 0]);
  return (
    <div>
      <div className="rb-tgrid" onMouseLeave={() => setHover([0, 0])}>
        {Array.from({ length: 64 }, (_, i) => {
          const r = Math.floor(i / 8) + 1;
          const c = (i % 8) + 1;
          return <i key={i} className={r <= hover[0] && c <= hover[1] ? 'on' : ''} onMouseEnter={() => setHover([r, c])} onClick={() => onPick(r, c)} />;
        })}
      </div>
      <div className="rb-pop-cap">{hover[0] ? `${hover[0]} × ${hover[1]}` : 'Chọn số hàng × cột'}</div>
    </div>
  );
};

export interface LayoutOption { id: string; label: string }

export const LayoutGallery = ({ options, value, onPick }: { options: LayoutOption[]; value?: string; onPick: (id: string) => void }) => (
  <div>
    <div className="rb-gallery">
      {options.map((o) => (
        <button key={o.id} className={o.id === value ? 'on' : ''} onClick={() => onPick(o.id)}>
          <div className="rb-thumb" />
          <b>{o.label}</b>
        </button>
      ))}
    </div>
    <div className="rb-pop-cap">Mỗi loại bài có bộ layout riêng</div>
  </div>
);

export type MenuItem = string | { label: string; sub: string[] };

/** Menu ngữ cảnh: '-' là đường kẻ, { label, sub } mở menu con khi rê chuột */
export const ContextMenu = ({ items, onPick }: { items: MenuItem[]; onPick: (item: string) => void }) => (
  <div className="rb-menu">
    {items.map((it, i) => {
      if (it === '-') return <hr key={`sep-${i}`} />;
      if (typeof it === 'string') return <button key={it} onClick={() => onPick(it)}>{it}</button>;
      return (
        <div key={it.label} className="rb-wrap">
          <button className="rb-has-sub">{it.label}</button>
          <div className="rb-subm"><div className="rb-menu">{it.sub.map((t) => <button key={t} onClick={() => onPick(t)}>{t}</button>)}</div></div>
        </div>
      );
    })}
  </div>
);
