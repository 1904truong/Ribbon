// Kiểu dữ liệu của thanh Ribbon tổng. Ribbon chỉ biết "controller" và "adapter" này, không biết gì về từng dạng bài cụ thể.
// Mỗi dạng bài sau này chỉ cần cung cấp một adapter + nối các lệnh vào dữ liệu thật của nó (xem RIBBON_SPEC.md mục 14, 20).

export type ExerciseGroup = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export type ExerciseType =
  | 'listening_gap_fill' | 'listening_multiple_choice' | 'listening_true_false' | 'listening_matching' | 'listening_table_completion'
  | 'reading_multiple_choice' | 'reading_short_answer' | 'true_false_not_given'
  | 'matching_headings' | 'matching_information' | 'matching_vocabulary' | 'matching_pictures'
  | 'grammar_vocab_multiple_choice' | 'pronunciation_multiple_choice' | 'grammar_vocab_cloze'
  | 'gap_filling_word_formation' | 'sentence_rearrangement' | 'sentence_construction' | 'sentence_completion';

/** Đang chọn gì trên trang A4 – quyết định tab ngữ cảnh và nút nào được dùng */
export type Selection = 'none' | 'text' | 'image' | 'table';

/** ✅ ok = đã có chức năng thật · partial = có một phần · todo = chưa có (nút bị khóa kèm lý do) */
export type Status = 'ok' | 'partial' | 'todo';

export type TabId =
  | 'File' | 'Home' | 'Exercise' | 'Insert' | 'Design' | 'Layout' | 'Review' | 'View' | 'Help'
  | 'Picture Format' | 'Table Design' | 'Table Layout';

export interface Capabilities {
  image: boolean;
  table: boolean;
  blank: boolean;
  qr: boolean;
  audio: boolean;
  wordBank: boolean;
  smartAi: boolean;
  gallery: boolean;
}

/** Cách định dạng chữ của dạng bài (mục 20.2 của spec) */
export type TextEngine = 'rich-fields' | 'listening-doc' | 'component-style';

export interface ExerciseAdapter {
  type: ExerciseType;
  label: string;
  group: ExerciseGroup;
  capabilities: Capabilities;
  textEngine: TextEngine;
}

/** Định dạng chữ tại con trỏ / vùng chọn */
export interface TextAttrs {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  script?: 'super' | 'sub';
  color?: string;
  highlight?: string;
  fontFamily?: string;
  fontSizePt?: number;
  bullets?: boolean;
  numbering?: boolean;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  lineSpacing?: string;
  blockStyle?: 'Normal' | 'Title' | 'Subtitle' | 'Heading 1' | 'Heading 2' | 'Heading 3';
  shading?: string;
  bordered?: boolean;
  formatPainter?: boolean;
}

/** Mọi lệnh mà ribbon có thể gọi. Dạng bài nào chưa nối thì trả về false → ribbon báo "chưa nối". */
export interface RibbonCommands {
  /** Trả về true nếu lệnh đã được xử lý */
  run(id: string, value?: string | number): boolean;
}

export interface RibbonState {
  selection: Selection;
  textAttrs: TextAttrs;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  canUndo: boolean;
  canRedo: boolean;
  previewMode: boolean;
  zoom: number;
}

// ───────────── Định nghĩa nút ─────────────

interface Base {
  /** id lệnh gửi cho controller */
  id: string;
  label: string;
  status: Status;
  tip?: string;
  /** Cần chọn gì thì mới dùng được */
  need?: Selection;
  /** Lý do khóa nếu không áp dụng cho dạng bài này */
  disabledWhen?: (a: ExerciseAdapter) => string | false;
}

export interface ButtonItem extends Base {
  kind: 'button';
  icon: string;
  /** Nút to (icon trên, chữ dưới) */
  big?: boolean;
  /** Trạng thái bật / tắt đọc từ state (vd. bold) */
  active?: (s: RibbonState) => boolean;
  /** Mũi tên ▾ cạnh nút (mở menu con) */
  chevron?: boolean;
  /** Có danh sách thì bấm nút mở menu; chọn mục nào gửi lệnh `id` kèm `value` của mục đó */
  menu?: { label: string; value: string }[];
  /** Mở panel thả xuống thay vì chạy lệnh ngay */
  popover?: 'palette-text' | 'palette-highlight' | 'palette-shading' | 'table-grid' | 'layout-gallery';
}

export interface SelectItem extends Base {
  kind: 'select';
  options: string[];
  value?: string;
  /** Giá trị hiện tại đọc trực tiếp từ trạng thái con trỏ/vùng chọn. */
  valueFromState?: (state: RibbonState) => string | undefined;
  /** Có nhãn nhỏ phía trên (dùng cho ô cài đặt bài) */
  labelled?: boolean;
  width?: number;
}

export interface NumberItem extends Base {
  /** Nhãn nằm ngang bên trái ô, kèm icon và đơn vị (Indent / Spacing) */
  inline?: boolean;
  icon?: string;
  unit?: string;
  kind: 'number';
  value: number;
  labelled?: boolean;
}

export interface SeparatorItem { kind: 'sep' }

/** Xếp chồng nhiều ô theo chiều dọc (Left / Right, Before / After) */
export interface StackItem { kind: 'stack'; items: NumberItem[] }

export type RibbonItem = ButtonItem | SelectItem | NumberItem | SeparatorItem | StackItem;

export interface RibbonGroup {
  name: string;
  /** Xếp tất cả nút trên một hàng (Font, Paragraph…) */
  nowrap?: boolean;
  items: RibbonItem[];
}
