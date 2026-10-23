import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, Replace, Search, X } from 'lucide-react';

export type FindReplaceMode = 'find' | 'replace';

interface Props {
  root: HTMLElement | null;
  mode: FindReplaceMode;
  onModeChange: (mode: FindReplaceMode) => void;
  onClose: () => void;
  onDocumentChange: () => void;
}

const textNodesOf = (root: HTMLElement): Text[] => {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!node.textContent || !parent || parent.closest('[contenteditable="false"]')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let node = walker.nextNode();
  while (node) {
    nodes.push(node as Text);
    node = walker.nextNode();
  }
  return nodes;
};

const rangesOf = (root: HTMLElement, query: string, matchCase: boolean): Range[] => {
  if (!query) return [];
  const needle = matchCase ? query : query.toLocaleLowerCase('vi');
  const ranges: Range[] = [];
  textNodesOf(root).forEach((node) => {
    const source = matchCase ? node.data : node.data.toLocaleLowerCase('vi');
    let from = 0;
    while (from <= source.length - needle.length) {
      const index = source.indexOf(needle, from);
      if (index < 0) break;
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + query.length);
      ranges.push(range);
      from = index + Math.max(needle.length, 1);
    }
  });
  return ranges;
};

const selectRange = (range: Range) => {
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  range.startContainer.parentElement?.scrollIntoView({ block: 'center', behavior: 'smooth' });
};

export const FindReplacePanel = ({ root, mode, onModeChange, onClose, onDocumentChange }: Props) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [current, setCurrent] = useState(-1);
  const [count, setCount] = useState(0);

  const move = (direction: 1 | -1, reset = false) => {
    if (!root || !query) { setCurrent(-1); setCount(0); return; }
    const ranges = rangesOf(root, query, matchCase);
    setCount(ranges.length);
    if (!ranges.length) { setCurrent(-1); return; }
    const next = reset ? 0 : (current + direction + ranges.length) % ranges.length;
    setCurrent(next);
    selectRange(ranges[next]);
  };

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [mode]);

  useEffect(() => {
    const timer = window.setTimeout(() => move(1, true), 80);
    return () => window.clearTimeout(timer);
    // current intentionally does not retrigger a search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, matchCase, root]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key === 'Enter' && panelRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        move(event.shiftKey ? -1 : 1);
      }
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  });

  const replaceCurrent = () => {
    if (!root || !query) return;
    const ranges = rangesOf(root, query, matchCase);
    if (!ranges.length) { setCount(0); setCurrent(-1); return; }
    const index = current >= 0 && current < ranges.length ? current : 0;
    const range = ranges[index];
    range.deleteContents();
    range.insertNode(document.createTextNode(replacement));
    onDocumentChange();
    window.setTimeout(() => move(1, true));
  };

  const replaceAll = () => {
    if (!root || !query) return;
    const ranges = rangesOf(root, query, matchCase);
    for (let index = ranges.length - 1; index >= 0; index -= 1) {
      ranges[index].deleteContents();
      ranges[index].insertNode(document.createTextNode(replacement));
    }
    if (ranges.length) onDocumentChange();
    setCount(0);
    setCurrent(-1);
  };

  return createPortal(
    <div ref={panelRef} className="rb-find-panel" role="dialog" aria-label={mode === 'find' ? 'Find' : 'Find and replace'}>
      <header>
        <div className="rb-find-tabs">
          <button type="button" className={mode === 'find' ? 'on' : ''} onClick={() => onModeChange('find')}><Search size={14} />Find</button>
          <button type="button" className={mode === 'replace' ? 'on' : ''} onClick={() => onModeChange('replace')}><Replace size={14} />Replace</button>
        </div>
        <button type="button" className="rb-find-close" onClick={onClose} title="Close (Esc)" aria-label="Close"><X size={17} /></button>
      </header>
      <div className="rb-find-body">
        <label>
          <span>Find</span>
          <div className="rb-find-input-row">
            <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Text to find…" />
            <button type="button" onClick={() => move(-1)} title="Previous result" aria-label="Previous result"><ChevronUp size={16} /></button>
            <button type="button" onClick={() => move(1)} title="Next result" aria-label="Next result"><ChevronDown size={16} /></button>
          </div>
        </label>
        {mode === 'replace' && <label><span>Replace with</span><input value={replacement} onChange={(event) => setReplacement(event.target.value)} placeholder="Replacement text…" /></label>}
        <div className="rb-find-options">
          <label><input type="checkbox" checked={matchCase} onChange={(event) => setMatchCase(event.target.checked)} />Match case</label>
          <span>{query ? (count ? `${current + 1} of ${count}` : 'No results') : 'Enter text to search'}</span>
        </div>
        {mode === 'replace' && <div className="rb-find-actions"><button type="button" onClick={replaceCurrent} disabled={!count}>Replace</button><button type="button" onClick={replaceAll} disabled={!count}>Replace all</button></div>}
      </div>
    </div>,
    document.body,
  );
};
