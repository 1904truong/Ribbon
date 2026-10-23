// Icon SVG của Ribbon. Nút khai báo `icon` bằng khóa (vd. 'save'); khóa không có ở đây thì hiện ký tự chữ như cũ.
// Phong cách: nét navy + điểm nhấn xanh (như thiết kế tab File). Cỡ: nút lớn 24px, nút nhỏ 16px.

import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, ArrowLeft, Bold, ClipboardPaste, CornerDownLeft, Copy, Eraser, Highlighter, Indent, Info, Italic,
  List, ListOrdered, Outdent, Paintbrush, PaintBucket, Plus, Printer, Replace, Save, Scissors, Search, SquareDashed, Strikethrough, Subscript, Superscript,
  TextSelect, Trash2, Underline, ArrowDown, ArrowUp, AudioLines, Brackets, Headphones, Image, Mic, Music2,
  Settings, SlidersHorizontal, SquarePlus, Sparkles, Type, FileDown, File as FileIcon, Table, Folder, Shapes, RectangleHorizontal, QrCode,
  PanelTop, PanelBottom, Hash, TextCursorInput, Minus, Link, Omega, Star, FileType, Frame, RectangleVertical, Files, Columns3, SeparatorHorizontal, SeparatorVertical, ScissorsLineDashed, Move,
  WrapText, BringToFront, SendToBack, AlignHorizontalJustifyStart, Group, RotateCw, IndentIncrease, IndentDecrease, ArrowUpToLine, ArrowDownToLine, Volume2, FileAudio, MessageSquarePlus, MessageSquareX, MessageSquareReply, MessageSquareShare, ListChecks, PencilLine, Eye, Ruler, Grid3x3, FileText, Columns2, BookOpen, AppWindow, Rows2, SquareSplitHorizontal, CircleHelp, Keyboard, Smile, type LucideIcon,
} from 'lucide-react';

type Tone = 'navy' | 'blue' | 'red' | 'green' | 'purple' | 'teal' | 'orange' | 'amber';
const TONE_COLOR: Record<Tone, string> = { navy: '#1e2a5a', blue: '#2563eb', red: '#e11d48', green: '#16a34a', purple: '#9333ea', teal: '#0d9488', orange: '#ea580c', amber: '#d97706' };
const BLUE = '#2563eb';

const LUCIDE: Record<string, { C: LucideIcon; tone: Tone }> = {
  save: { C: Save, tone: 'navy' },
  saveReturn: { C: CornerDownLeft, tone: 'blue' },
  saveAdd: { C: Plus, tone: 'blue' },
  print: { C: Printer, tone: 'navy' },
  duplicate: { C: Copy, tone: 'navy' },
  deleteExercise: { C: Trash2, tone: 'navy' },
  back: { C: ArrowLeft, tone: 'blue' },
  docInfo: { C: Info, tone: 'navy' },
  paste: { C: ClipboardPaste, tone: 'navy' }, cut: { C: Scissors, tone: 'blue' }, copy: { C: Copy, tone: 'blue' }, formatPainter: { C: Paintbrush, tone: 'blue' },
  bold: { C: Bold, tone: 'navy' }, italic: { C: Italic, tone: 'navy' }, underline: { C: Underline, tone: 'navy' }, strike: { C: Strikethrough, tone: 'navy' },
  subscript: { C: Subscript, tone: 'navy' }, superscript: { C: Superscript, tone: 'navy' }, highlight: { C: Highlighter, tone: 'navy' }, clearFormat: { C: Eraser, tone: 'navy' },
  bullets: { C: List, tone: 'navy' }, numbering: { C: ListOrdered, tone: 'navy' }, outdent: { C: Outdent, tone: 'navy' }, indent: { C: Indent, tone: 'navy' },
  alignLeft: { C: AlignLeft, tone: 'navy' }, alignCenter: { C: AlignCenter, tone: 'navy' }, alignRight: { C: AlignRight, tone: 'navy' }, justify: { C: AlignJustify, tone: 'navy' },
  shading: { C: PaintBucket, tone: 'navy' }, borders: { C: SquareDashed, tone: 'navy' }, find: { C: Search, tone: 'navy' }, replace: { C: Replace, tone: 'navy' }, selectAll: { C: TextSelect, tone: 'navy' },
  // Tab Exercise
  addQuestion: { C: SquarePlus, tone: 'blue' }, moveUp: { C: ArrowUp, tone: 'navy' }, moveDown: { C: ArrowDown, tone: 'navy' }, deleteExerciseRed: { C: Trash2, tone: 'red' },
  addAudio: { C: Headphones, tone: 'blue' }, recordAudio: { C: Mic, tone: 'green' }, audioLibrary: { C: Music2, tone: 'red' }, trimAudio: { C: AudioLines, tone: 'purple' },
  insertBlank: { C: Brackets, tone: 'blue' }, insertTextBox: { C: Type, tone: 'navy' }, insertImage: { C: Image, tone: 'purple' },
  aiAssist: { C: Sparkles, tone: 'red' }, setOptions: { C: SlidersHorizontal, tone: 'blue' }, exerciseSettings: { C: Settings, tone: 'navy' },
  smartPaste: { C: ClipboardPaste, tone: 'blue' }, smartAi: { C: Sparkles, tone: 'amber' }, aiRewrite: { C: PencilLine, tone: 'purple' }, insertExercise: { C: Plus, tone: 'green' },
  exerciseTitle: { C: Type, tone: 'navy' }, instruction: { C: Info, tone: 'blue' }, exerciseNumber: { C: Hash, tone: 'orange' },
  pageBreakBefore: { C: FileDown, tone: 'navy' }, numberBadge: { C: Star, tone: 'amber' },
  // Tab Insert
  insPageBreak: { C: FileDown, tone: 'navy' }, insBlankPage: { C: FileIcon, tone: 'navy' }, insTable: { C: Table, tone: 'navy' },
  insPicture: { C: Image, tone: 'blue' }, insAiImage: { C: Sparkles, tone: 'amber' }, insGallery: { C: Folder, tone: 'navy' }, insShapes: { C: Shapes, tone: 'blue' },
  insBlank: { C: RectangleHorizontal, tone: 'navy' }, insQr: { C: QrCode, tone: 'navy' }, insAudio: { C: Headphones, tone: 'navy' },
  insHeader: { C: PanelTop, tone: 'orange' }, insFooter: { C: PanelBottom, tone: 'orange' }, insPageNumber: { C: Hash, tone: 'navy' },
  insTextBox: { C: TextCursorInput, tone: 'blue' }, insHline: { C: Minus, tone: 'navy' }, insLink: { C: Link, tone: 'navy' }, insSymbol: { C: Omega, tone: 'navy' },
  // Tab Design
  desDefault: { C: Star, tone: 'navy' }, desBorders: { C: FileIcon, tone: 'navy' }, desWatermark: { C: FileType, tone: 'blue' },
  desPageColor: { C: PaintBucket, tone: 'teal' }, desBranding: { C: Image, tone: 'navy' },
  // Tab Layout
  layMargins: { C: Frame, tone: 'blue' }, layOrientation: { C: RectangleVertical, tone: 'navy' }, laySize: { C: Files, tone: 'blue' }, layColumns: { C: Columns3, tone: 'blue' },
  layPageBreak: { C: SeparatorHorizontal, tone: 'navy' }, layColumnBreak: { C: SeparatorVertical, tone: 'red' }, laySectionBreak: { C: ScissorsLineDashed, tone: 'red' },
  layIndentLeft: { C: IndentIncrease, tone: 'navy' }, layIndentRight: { C: IndentDecrease, tone: 'navy' }, laySpaceBefore: { C: ArrowUpToLine, tone: 'navy' }, laySpaceAfter: { C: ArrowDownToLine, tone: 'navy' },
  layPosition: { C: Move, tone: 'navy' }, layWrap: { C: WrapText, tone: 'navy' }, layForward: { C: BringToFront, tone: 'amber' }, layBackward: { C: SendToBack, tone: 'amber' },
  layAlign: { C: AlignHorizontalJustifyStart, tone: 'navy' }, layGroup: { C: Group, tone: 'navy' }, layRotate: { C: RotateCw, tone: 'navy' },
  // Tab Review
  revReadAloud: { C: Volume2, tone: 'blue' }, revTts: { C: FileAudio, tone: 'navy' },
  revNewComment: { C: MessageSquarePlus, tone: 'green' }, revDeleteComment: { C: MessageSquareX, tone: 'red' }, revPrevious: { C: MessageSquareReply, tone: 'blue' },
  revNext: { C: MessageSquareShare, tone: 'blue' }, revTrack: { C: ListChecks, tone: 'blue' },
  // Tab View
  vwEdit: { C: PencilLine, tone: 'blue' }, vwPreview: { C: Eye, tone: 'navy' }, vwRuler: { C: Ruler, tone: 'amber' }, vwGrid: { C: Grid3x3, tone: 'blue' }, vwNav: { C: FileText, tone: 'navy' },
  vwOnePage: { C: RectangleVertical, tone: 'navy' }, vwPageWidth: { C: Columns2, tone: 'navy' }, vwMulti: { C: BookOpen, tone: 'blue' },
  vwNewWindow: { C: AppWindow, tone: 'navy' }, vwArrange: { C: Rows2, tone: 'navy' }, vwSplit: { C: SquareSplitHorizontal, tone: 'blue' },
  // Tab Help
  hlpGuide: { C: CircleHelp, tone: 'blue' }, hlpShortcuts: { C: Keyboard, tone: 'navy' }, hlpFeedback: { C: Smile, tone: 'navy' },
};

/** Biểu tượng Word: khung vuông bo góc + chữ W */
const WordIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="2.5" y="2.5" width="19" height="19" rx="3" stroke={BLUE} strokeWidth="2" />
    <path d="M6.5 8.5l2 8 2.5-6.5 2.5 6.5 2-8" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const hasIcon = (key: string) => key in LUCIDE || key === 'exportDocx';

export const RibbonIcon = ({ name, size }: { name: string; size: number }) => {
  if (name === 'exportDocx') return <WordIcon size={size} />;
  const d = LUCIDE[name];
  if (!d) return null;
  const { C, tone } = d;
  return <C size={size} strokeWidth={size >= 24 ? 1.9 : 2.1} color={TONE_COLOR[tone]} aria-hidden />;
};
