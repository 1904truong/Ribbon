// Nội dung từng tab của Ribbon (nguồn: RIBBON_SPEC.md mục 1–11, 16–17). Chỉ là dữ liệu: không có logic dạng bài.

import { GROUP_NAME } from './adapters';
import { TABLE_MENU_ITEMS } from './tableEngine';
import type { ButtonItem, ExerciseAdapter, ExerciseGroup, NumberItem, RibbonGroup, RibbonItem, SelectItem, Selection, Status, TabId } from './types';

// ───────────── Hàm dựng nút ─────────────
const btn = (id: string, label: string, icon: string, status: Status, o: Partial<ButtonItem> = {}): ButtonItem => ({ kind: 'button', id, label, icon, status, ...o });
const big = (id: string, label: string, icon: string, status: Status, o: Partial<ButtonItem> = {}) => btn(id, label, icon, status, { big: true, ...o });
const sel = (id: string, label: string, options: string[], status: Status, o: Partial<SelectItem> = {}): SelectItem => ({ kind: 'select', id, label, options, status, ...o });
const num = (id: string, label: string, value: number, status: Status, o: Partial<NumberItem> = {}): NumberItem => ({ kind: 'number', id, label, value, status, ...o });
const SEP: RibbonItem = { kind: 'sep' };
const text: Selection = 'text';
const image: Selection = 'image';

const noImage = (a: ExerciseAdapter) => !a.capabilities.image && 'Loại bài này không có ảnh';
const noQr = (a: ExerciseAdapter) => !a.capabilities.qr && 'Loại bài này không có mã QR';
const noAudio = (a: ExerciseAdapter) => !a.capabilities.audio && 'Chỉ dùng cho bài Listening';
const noBlank = (a: ExerciseAdapter) => !a.capabilities.blank && 'Loại bài này không có chỗ trống';

// ───────────── Tab Exercise: nút riêng theo nhóm loại bài (spec mục 3.2) ─────────────
const EXERCISE_BUTTONS: Record<ExerciseGroup, ButtonItem[]> = {
  A: [big('addWord', 'Add word', '＋W', 'ok'), big('importWords', 'Import words', '⇪', 'ok'), big('insertBlank', 'Insert blank', '▭', 'ok'), big('resequence', 'Resequence', '↻', 'ok'), big('showWordBank', 'Show word bank', '▣', 'ok')],
  B: [big('addQuestion', 'Add question', '＋Q', 'ok'), big('addOption', 'Add option', '＋O', 'ok'), big('import', 'Import', '⇪', 'ok'), big('shuffleOptions', 'Shuffle options', '⇄', 'ok')],
  C: [big('insertBlank', 'Insert blank', '▭', 'ok'), big('addQuestion', 'Add question', '＋Q', 'ok'), big('shuffleOptions', 'Shuffle options', '⇄', 'ok')],
  D: [big('addStatement', 'Add statement', '＋S', 'ok')],
  E: [big('addParagraph', 'Add paragraph', '＋P', 'ok'), big('addIdea', 'Add idea / word', '＋I', 'ok'), big('addDefinition', 'Add definition / option', '＋D', 'ok'), big('import', 'Import', '⇪', 'ok'), big('shuffle', 'Shuffle', '⇄', 'ok')],
  F: [big('addParagraph', 'Add paragraph', '＋P', 'ok'), big('shuffleImages', 'Shuffle images', '⇄', 'ok'), big('fitA4', 'Auto fit to A4', '⤢', 'ok')],
  G: [big('insertRow', 'Insert row', '⊞', 'ok'), big('insertColumn', 'Insert column', '⊟', 'ok'), big('deleteRow', 'Delete row', '⊖', 'ok'), big('deleteColumn', 'Delete column', '⊖', 'ok'), big('addQuestion', 'Add question', '＋Q', 'ok')],
  H: [big('addQuestion', 'Add question', '＋Q', 'ok'), big('import', 'Import', '⇪', 'ok'), big('shuffle', 'Shuffle', '⇄', 'ok')],
};

// Cài đặt bài theo nhóm (spec mục 16)
type SettingRow = [id: string, label: string, kind: 's' | 'n', v: string[] | number, status: Status];
export const SETTINGS: Record<ExerciseGroup, SettingRow[]> = {
  A: [['blankWidth', 'Độ dài chỗ trống (mm)', 'n', 28, 'ok'], ['blankStroke', 'Kiểu nét chỗ trống', 's', ['Đứt', 'Liền'], 'todo'], ['blankLabel', 'Nhãn chỗ trống', 's', ['(a)', '(1)', 'Không nhãn'], 'partial'], ['wordBankStyle', 'Kiểu khung từ', 's', ['Một hàng', 'Lưới 3 cột', 'Hai cột'], 'partial'], ['wordBankBorder', 'Viền khung từ', 's', ['Có', 'Không'], 'todo'], ['hint', 'Gợi ý (hint)', 's', ['Hiện', 'Ẩn'], 'ok']],
  B: [['optionLabel', 'Kiểu nhãn đáp án', 's', ['A.', 'a)', '①'], 'partial'], ['optionColumns', 'Số cột phương án', 's', ['1', '2', '4'], 'partial'], ['imageOptions', 'Đáp án bằng hình', 's', ['Tắt', 'Bật'], 'ok'], ['underlineWord', 'Gạch chân từ […]', 's', ['Tắt', 'Bật'], 'ok'], ['startNumber', 'Số câu bắt đầu từ', 'n', 1, 'todo']],
  C: [['optionsStyle', 'Kiểu lựa chọn dưới đoạn', 's', ['Hàng ngang', 'Danh sách'], 'partial'], ['imagePosition', 'Vị trí ảnh', 's', ['Trên', 'Trái', 'Phải', 'Dưới'], 'ok'], ['imageWidth', 'Độ rộng ảnh (%)', 'n', 40, 'ok']],
  D: [['answerColumn', 'Cột trả lời', 's', ['T F NG', 'True False NG', 'Ô tròn'], 'partial'], ['showImage', 'Ảnh minh họa', 's', ['Hiện', 'Ẩn'], 'ok'], ['imageHeight', 'Cao ảnh (mm)', 'n', 22, 'ok']],
  E: [['leftLabel', 'Nhãn cột trái', 's', ['1,2,3', 'a,b,c', 'A,B,C'], 'partial'], ['columnGap', 'Khoảng cách hai cột (mm)', 'n', 10, 'todo'], ['columnWidth', 'Độ rộng cột (%)', 'n', 50, 'todo'], ['rowGap', 'Khoảng cách dòng (mm)', 'n', 4.5, 'ok']],
  F: [['imagesPerRow', 'Số ảnh mỗi hàng', 's', ['2', '3', '4'], 'partial'], ['imageSize', 'Cỡ ảnh (mm)', 'n', 40, 'todo'], ['caption', 'Caption', 's', ['Hiện', 'Ẩn'], 'partial'], ['imageLabel', 'Nhãn ảnh (A–F)', 's', ['Hiện', 'Ẩn'], 'partial']],
  G: [['headerRow', 'Header row', 's', ['Có', 'Không'], 'todo'], ['rows', 'Số hàng', 'n', 3, 'partial'], ['cols', 'Số cột', 'n', 3, 'partial'], ['cellBlank', 'Ô là chỗ trống', 's', ['Không', 'Có'], 'partial']],
  H: [['blockStyle', 'Kiểu khối chữ', 's', ['Khối', 'Danh sách'], 'partial'], ['hintParen', 'Từ gợi ý trong ngoặc', 's', ['Hiện', 'Ẩn'], 'ok'], ['answerLine', 'Dòng viết câu trả lời', 's', ['Có', 'Không'], 'partial']],
};

/** Các nhóm nút của một tab, tính theo loại bài đang mở */
export const groupsOf = (tab: TabId, a: ExerciseAdapter): RibbonGroup[] => {
  switch (tab) {
    case 'File': return [
      { name: 'Save', items: [big('save', 'Save', 'save', 'ok', { tip: 'Save (Ctrl+S)' }), big('saveReturn', 'Save & Return', 'saveReturn', 'ok'), big('saveAdd', 'Save & Add another', 'saveAdd', 'ok')] },
      { name: 'Export', items: [big('exportDocx', 'Export Word (.docx)', 'exportDocx', 'ok'), big('print', 'Print / PDF', 'print', 'ok', { tip: 'Print (Ctrl+P)' })] },
      { name: 'Exercise', items: [big('duplicate', 'Duplicate', 'duplicate', 'ok'), big('deleteExercise', 'Delete exercise', 'deleteExercise', 'ok'), big('back', 'Back to lesson', 'back', 'ok')] },
      { name: 'Info', items: [big('docInfo', 'Document info', 'docInfo', 'ok')] },
    ];

    case 'Home': return [
      { name: 'Clipboard', nowrap: true, items: [
        btn('paste', 'Paste', 'paste', 'ok', { need: text, chevron: true, tip: 'Paste (Ctrl+V)', menu: [{ label: 'Paste', value: 'paste' }, { label: 'Paste text only', value: 'pasteText' }] }),
        btn('cut', 'Cut', 'cut', 'ok', { need: text, tip: 'Cut (Ctrl+X)' }), btn('copy', 'Copy', 'copy', 'ok', { need: text, tip: 'Copy (Ctrl+C)' }),
        btn('formatPainter', 'Format Painter', 'formatPainter', 'ok', { need: text, active: (s) => !!s.textAttrs.formatPainter, tip: 'Format Painter – bấm lần đầu để lấy định dạng; chọn chữ đích và bấm lần nữa để áp dụng' }),
      ] },
      { name: 'Font', nowrap: true, items: [
        sel('fontFamily', 'Font family', ['Arial', 'Times New Roman', 'Calibri', 'Quicksand', 'Roboto', 'Inter'], 'ok', { need: text, width: 110, valueFromState: (s) => s.textAttrs.fontFamily }),
        sel('fontSize', 'Font size', ['8', '9', '10', '11', '12', '13', '14', '16', '18', '20', '24', '28', '36', '48'], 'ok', { need: text, value: '11', width: 52, valueFromState: (s) => s.textAttrs.fontSizePt ? String(Math.round(s.textAttrs.fontSizePt)) : undefined }),
        btn('sizeUp', 'Increase size', 'A⁺', 'ok', { need: text }), btn('sizeDown', 'Decrease size', 'A⁻', 'ok', { need: text }), SEP,
        btn('bold', 'Bold', 'bold', 'ok', { need: text, tip: 'Bold (Ctrl+B)', active: (s) => !!s.textAttrs.bold }),
        btn('italic', 'Italic', 'italic', 'ok', { need: text, tip: 'Italic (Ctrl+I)', active: (s) => !!s.textAttrs.italic }),
        btn('underline', 'Underline', 'underline', 'ok', { need: text, tip: 'Underline (Ctrl+U)', active: (s) => !!s.textAttrs.underline }),
        btn('strike', 'Strikethrough', 'strike', 'ok', { need: text, active: (s) => !!s.textAttrs.strike }),
        btn('subscript', 'Subscript', 'subscript', 'ok', { need: text, active: (s) => s.textAttrs.script === 'sub' }),
        btn('superscript', 'Superscript', 'superscript', 'ok', { need: text, active: (s) => s.textAttrs.script === 'super' }), SEP,
        btn('color', 'Font color', 'A', 'ok', { need: text, popover: 'palette-text' }),
        btn('highlight', 'Highlight', 'highlight', 'ok', { need: text, popover: 'palette-highlight' }),
        btn('clearFormat', 'Clear formatting', 'clearFormat', 'ok', { need: text }),
      ] },
      { name: 'Paragraph', nowrap: true, items: [
        btn('bullets', 'Bullets', 'bullets', 'ok', { need: text, active: (s) => !!s.textAttrs.bullets }), btn('numbering', 'Numbering', 'numbering', 'ok', { need: text, active: (s) => !!s.textAttrs.numbering }),
        btn('outdent', 'Decrease indent', 'outdent', 'ok', { need: text }), btn('indent', 'Increase indent', 'indent', 'ok', { need: text }), SEP,
        btn('alignLeft', 'Align left', 'alignLeft', 'ok', { need: text, active: (s) => s.textAttrs.alignment === 'left' }), btn('alignCenter', 'Center', 'alignCenter', 'ok', { need: text, active: (s) => s.textAttrs.alignment === 'center' }), btn('alignRight', 'Align right', 'alignRight', 'ok', { need: text, active: (s) => s.textAttrs.alignment === 'right' }), btn('justify', 'Justify', 'justify', 'ok', { need: text, active: (s) => s.textAttrs.alignment === 'justify' }), SEP,
        sel('lineSpacing', 'Line spacing', ['1.0', '1.15', '1.5', '2.0', '2.5'], 'ok', { need: text, width: 52, value: '1.5', valueFromState: (s) => s.textAttrs.lineSpacing }),
        btn('shading', 'Shading', 'shading', 'ok', { need: text, popover: 'palette-shading' }),
        btn('borders', 'Borders', 'borders', 'ok', { need: text, chevron: true, menu: [{ label: 'All borders', value: 'borderAll' }, { label: 'Bottom border', value: 'borderBottom' }, { label: 'No border', value: 'borderNone' }], active: (s) => !!s.textAttrs.bordered }),
      ] },
      { name: 'Styles', items: [sel('style', 'Style', ['Normal', 'Title', 'Subtitle', 'Heading 1', 'Heading 2', 'Heading 3'], 'ok', { need: text, width: 110, value: 'Normal', valueFromState: (s) => s.textAttrs.blockStyle })] },
      { name: 'Editing', nowrap: true, items: [btn('find', 'Find', 'find', 'ok', { tip: 'Find (Ctrl+F)' }), btn('replace', 'Replace', 'replace', 'ok', { tip: 'Replace (Ctrl+H)' }), btn('selectAll', 'Select all', 'selectAll', 'ok', { need: text, tip: 'Select all (Ctrl+A)' })] },
    ];

    case 'Exercise': {
      const g = a.group;
      const groupButtons = EXERCISE_BUTTONS[g] ?? [];
      const settingRows = SETTINGS[g] ?? [];
      const settingItems: RibbonItem[] = settingRows.map(([sId, sLabel, sKind, sVal, sStatus]) => {
        if (sKind === 'n') {
          return num(sId, sLabel, typeof sVal === 'number' ? sVal : 28, sStatus, { inline: true });
        }
        return sel(sId, sLabel, Array.isArray(sVal) ? sVal : ['Có', 'Không'], sStatus, { labelled: true });
      });

      return [
        {
          name: `Exercise (${GROUP_NAME[g]})`,
          nowrap: true,
          items: groupButtons,
        },
        {
          name: 'Smart tools',
          nowrap: true,
          items: [
            big('smartPaste', 'Smart Paste', 'smartPaste', 'ok', { tip: 'Dán cả đề bài, tự động tách nội dung theo dạng bài' }),
            big('smartAi', 'Smart AI', 'smartAi', 'ok', { tip: 'Soạn thêm câu hỏi / nội dung mới bằng AI' }),
            big('aiRewrite', 'AI Rewrite', 'aiRewrite', 'ok', { tip: 'Viết lại đề bài / đoạn văn theo độ khó hoặc chủ đề mới' }),
            big('insertExercise', 'Insert exercise', 'insertExercise', 'ok', { tip: 'Lưu bài hiện tại và tạo thêm một bài tập mới (+)' }),
          ],
        },
        {
          name: 'Tiêu đề & hướng dẫn',
          nowrap: true,
          items: [
            btn('exerciseTitle', 'Exercise title', 'exerciseTitle', 'ok', { tip: 'Sửa tiêu đề bài tập' }),
            btn('instruction', 'Instruction', 'instruction', 'ok', { tip: 'Bật / tắt hoặc sửa hướng dẫn làm bài' }),
            btn('exerciseNumber', 'Exercise number', 'exerciseNumber', 'ok', { tip: 'Số thứ tự và điểm số bài tập' }),
          ],
        },
        ...(a.capabilities.audio ? [{
          name: 'Audio',
          nowrap: true,
          items: [
            big('addAudio', 'Add Audio', 'addAudio', 'ok'),
            big('recordAudio', 'Record Audio', 'recordAudio', 'ok'),
            big('audioLibrary', 'Audio Library', 'audioLibrary', 'ok'),
            big('trimAudio', 'Trim Audio', 'trimAudio', 'ok', { disabledWhen: () => 'Chưa tích hợp waveform/audio encoder để cắt file thật' }),
          ],
        }] : []),
        {
          name: `Cài đặt bài (${GROUP_NAME[g]})`,
          nowrap: true,
          items: settingItems.length > 0 ? settingItems : [big('setOptions', 'Set Options', 'setOptions', 'ok')],
        },
        {
          name: 'Worksheet',
          nowrap: true,
          items: [
            big('moveUp', 'Move up', 'moveUp', 'ok', { tip: 'Chuyển bài tập lên trên (▲)' }),
            big('moveDown', 'Move down', 'moveDown', 'ok', { tip: 'Chuyển bài tập xuống dưới (▼)' }),
            big('pageBreakBefore', 'Page break before', 'pageBreakBefore', 'ok', { tip: 'Bắt đầu bài tập này ở trang mới (📄)' }),
            big('numberBadge', 'Number badge', 'numberBadge', 'ok', { tip: 'Huy hiệu điểm số và số bài (🏷)' }),
            big('duplicate', 'Duplicate', 'duplicate', 'ok', { tip: 'Nhân bản bài tập' }),
            big('deleteExercise', 'Delete', 'deleteExerciseRed', 'ok', { tip: 'Xóa bài tập' }),
          ],
        },
        {
          name: 'Tùy chọn',
          nowrap: true,
          items: [
            big('setOptions', 'Set Options', 'setOptions', 'ok', { tip: 'Hộp thoại cài đặt nâng cao cho dạng bài này' }),
            big('exerciseSettings', 'Exercise Settings', 'exerciseSettings', 'ok', { tip: 'Hộp thoại thiết lập bài tập chung' }),
          ],
        },
      ];
    }

    case 'Insert': return [
      { name: 'Pages', nowrap: true, items: [big('pageBreak', 'Page break', 'insPageBreak', 'partial'), big('blankPage', 'Blank page', 'insBlankPage', 'todo')] },
      { name: 'Tables', nowrap: true, items: [big('table', 'Table', 'insTable', 'partial', { popover: 'table-grid' })] },
      { name: 'Illustrations', nowrap: true, items: [
        big('pictureFile', 'Picture (from device)', 'insPicture', 'ok', { disabledWhen: noImage }), big('aiImage', 'AI image', 'insAiImage', 'ok', { disabledWhen: () => 'Chưa cấu hình dịch vụ tạo ảnh AI' }),
        big('gallery', 'Gallery', 'insGallery', 'ok', { disabledWhen: (x) => !x.capabilities.gallery && 'Chỉ dùng cho Matching Pictures' }), big('shapes', 'Shapes', 'insShapes', 'partial'),
      ] },
      { name: 'Exercise objects', nowrap: true, items: [big('blankObject', 'Blank (a)___', 'insBlank', 'ok', { disabledWhen: noBlank }), big('qr', 'QR code', 'insQr', 'ok', { disabledWhen: noQr }), big('audio', 'Audio', 'insAudio', 'ok', { disabledWhen: noAudio })] },
      { name: 'Header & Footer', nowrap: true, items: [big('header', 'Header', 'insHeader', 'partial'), big('footer', 'Footer', 'insFooter', 'partial'), big('pageNumber', 'Page number', 'insPageNumber', 'todo')] },
      { name: 'Text', nowrap: true, items: [big('textBox', 'Text box', 'insTextBox', 'partial'), big('hline', 'Horizontal line', 'insHline', 'partial'), big('link', 'Link', 'insLink', 'todo')] },
      { name: 'Symbols', nowrap: true, items: [big('symbol', 'Symbol', 'insSymbol', 'todo')] },
    ];

    case 'Design': return [
      { name: 'Document Formatting', nowrap: true, items: [
        sel('docFont', 'Fonts (cả bài)', ['Quicksand', 'Arial', 'Times New Roman', 'Roboto', 'Inter'], 'ok', { labelled: true, width: 130 }),
        sel('docLineHeight', 'Paragraph spacing', ['1.3', '1.5', '1.75', '2.0', '2.1'], 'ok', { labelled: true, width: 90 }),
        sel('headingSize', 'Heading size', ['11', '12', '12.5', '13', '14', '16'], 'ok', { labelled: true, width: 70 }),
        sel('bodySize', 'Body size', ['10', '10.5', '11', '12', '13', '14'], 'ok', { labelled: true, width: 70 }),
        big('setDefault', 'Set as default', 'desDefault', 'todo'),
      ] },
      { name: 'Page Background', nowrap: true, items: [
        big('pageBorders', 'Page borders', 'desBorders', 'todo', { chevron: true }), big('watermark', 'Watermark', 'desWatermark', 'todo', { chevron: true }), big('pageColor', 'Page color', 'desPageColor', 'todo', { chevron: true }),
      ] },
      { name: 'Branding', nowrap: true, items: [big('branding', 'Header / footer thương hiệu', 'desBranding', 'ok', { chevron: true })] },
    ];

    case 'Layout': return [
      { name: 'Page Setup', nowrap: true, items: [
        big('margins', 'Margins', 'layMargins', 'todo', { chevron: true }), big('orientation', 'Orientation', 'layOrientation', 'todo', { chevron: true }),
        big('paperSize', 'Size', 'laySize', 'todo', { chevron: true }), big('columns', 'Columns', 'layColumns', 'partial', { chevron: true }),
      ] },
      { name: 'Breaks', nowrap: true, items: [big('pageBreak', 'Page Break', 'layPageBreak', 'partial'), big('columnBreak', 'Column Break', 'layColumnBreak', 'todo'), big('sectionBreak', 'Section Break', 'laySectionBreak', 'todo')] },
      { name: 'Indent', nowrap: true, items: [{ kind: 'stack', items: [
        num('indentLeft', 'Left:', 0, 'todo', { inline: true, icon: 'layIndentLeft', unit: 'cm' }), num('indentRight', 'Right:', 0, 'todo', { inline: true, icon: 'layIndentRight', unit: 'cm' }),
      ] }] },
      { name: 'Spacing', nowrap: true, items: [{ kind: 'stack', items: [
        num('spaceBefore', 'Before:', 0, 'todo', { inline: true, icon: 'laySpaceBefore', unit: 'pt' }), num('spaceAfter', 'After:', 0, 'todo', { inline: true, icon: 'laySpaceAfter', unit: 'pt' }),
      ] }] },
      { name: 'Arrange', nowrap: true, items: [
        big('position', 'Position', 'layPosition', 'todo', { need: image, chevron: true }), big('wrap', 'Wrap Text', 'layWrap', 'todo', { need: image, chevron: true }),
        big('forward', 'Bring Forward', 'layForward', 'todo', { need: image, chevron: true }), big('backward', 'Send Backward', 'layBackward', 'todo', { need: image, chevron: true }), SEP,
        big('align', 'Align', 'layAlign', 'todo', { need: image, chevron: true }), big('group', 'Group', 'layGroup', 'todo', { need: image, disabledWhen: () => 'Document model chỉ hỗ trợ chọn một đối tượng; Group được khóa để tránh báo thành công giả' }), big('rotate', 'Rotate', 'layRotate', 'todo', { need: image, chevron: true }),
      ] },
    ];

    case 'Review': return [
      { name: 'Proofing', nowrap: true, items: [big('wordCount', 'Word count', '123', 'todo'), big('spelling', 'Spelling & grammar', 'abc✓', 'todo', { chevron: true })] },
      { name: 'Speech', nowrap: true, items: [
        big('readAloud', 'Read aloud', 'revReadAloud', 'ok', { chevron: true, menu: [{ label: 'Play / Resume', value: 'readAloud' }, { label: 'Pause', value: 'pauseReadAloud' }, { label: 'Stop', value: 'stopReadAloud' }] }), big('tts', 'Generate audio (TTS)', 'revTts', 'ok', { chevron: true, disabledWhen: () => 'Chưa cấu hình dịch vụ TTS để tạo file audio' }),
      ] },
      { name: 'Review Tools', nowrap: true, items: [
        big('newComment', 'New comment', 'revNewComment', 'todo'), big('deleteComment', 'Delete', 'revDeleteComment', 'todo', { chevron: true }),
        big('prevComment', 'Previous', 'revPrevious', 'todo'), big('nextComment', 'Next', 'revNext', 'todo'), SEP, big('trackChanges', 'Track changes', 'revTrack', 'todo', { chevron: true }),
      ] },
    ];

    case 'View': return [
      { name: 'Views', nowrap: true, items: [
        big('editMode', 'Edit mode', 'vwEdit', 'ok', { active: (st) => !st.previewMode }), big('preview', 'Preview', 'vwPreview', 'ok', { active: (st) => st.previewMode }),
      ] },
      { name: 'Show', nowrap: true, items: [big('ruler', 'Ruler', 'vwRuler', 'todo'), big('gridlines', 'Gridlines', 'vwGrid', 'todo'), big('navPane', 'Navigation pane', 'vwNav', 'todo')] },
      { name: 'Zoom', nowrap: true, items: [
        sel('zoom', 'Zoom', ['50%', '75%', '100%', '125%', '150%'], 'ok', { value: '100%', width: 70 }), SEP,
        big('zoom100', '100%', '1:1', 'ok'), big('onePage', 'One page', 'vwOnePage', 'ok'), big('pageWidth', 'Page width', 'vwPageWidth', 'todo'), big('multiPages', 'Multiple pages', 'vwMulti', 'todo'),
      ] },
      { name: 'Window', nowrap: true, items: [big('newWindow', 'New window', 'vwNewWindow', 'todo'), big('arrangeAll', 'Arrange all', 'vwArrange', 'todo', { disabledWhen: () => 'Trình duyệt không cho phép ứng dụng tự sắp xếp cửa sổ hệ điều hành' }), big('split', 'Split', 'vwSplit', 'todo')] },
    ];

    case 'Help': return [
      { name: 'Help', nowrap: true, items: [
        big('help', 'Help & Guide', 'hlpGuide', 'ok', { tip: 'Mở hướng dẫn sử dụng (F1)' }), big('shortcuts', 'Keyboard shortcuts', 'hlpShortcuts', 'ok', { tip: 'Xem các phím tắt đang hoạt động (Ctrl+/)' }), big('feedback', 'Feedback', 'hlpFeedback', 'ok', { tip: 'Báo lỗi hoặc đề xuất cải tiến' }),
      ] },
    ];

    case 'Picture Format': return [
      { name: 'Adjust', items: [big('replacePicture', 'Replace picture', '⇄', 'partial'), big('regenAi', 'Regenerate AI image', '✨', 'ok', { disabledWhen: () => 'Ảnh hiện tại không có workflow AI đã cấu hình' }), big('removePicture', 'Remove picture', '🗑', 'ok')] },
      { name: 'Size', items: [num('picWidth', 'Width (mm)', 55, 'todo', { labelled: true }), num('picHeight', 'Height (mm)', 40, 'todo', { labelled: true }), btn('lockRatio', 'Lock aspect ratio', '🔒', 'todo'), btn('resetRatio', 'Reset ratio', '↺', 'todo'), btn('fitWidth', 'Fit to page width', '↔', 'todo'), btn('crop', 'Crop', '⌗', 'todo')] },
      { name: 'Arrange', items: [big('picWrap', 'Wrap text', '↯', 'todo'), big('picPosition', 'Position', '⌖', 'todo'), big('picAlign', 'Align', '⫶', 'todo'), big('picForward', 'Bring forward', '⬒', 'todo'), big('picBackward', 'Send backward', '⬓', 'todo')] },
      { name: 'Style', items: [big('picBorder', 'Border', '▢', 'todo'), big('picShadow', 'Shadow', '◪', 'todo'), big('altText', 'Alt text', 'Alt', 'todo')] },
    ];

    case 'Table Design': return [
      { name: 'Table Styles', nowrap: true, items: [big('tblStyles', 'Table Styles', '▦', 'ok', { chevron: true, menu: TABLE_MENU_ITEMS.styles })] },
      { name: 'Borders', nowrap: true, items: [big('tblBorders', 'Borders', '▢', 'ok', { chevron: true, menu: TABLE_MENU_ITEMS.borders }), big('tblBorderColor', 'Border Color', '🖍', 'ok', { chevron: true, menu: TABLE_MENU_ITEMS.borderColor }), sel('tblBorderWidth', 'Border Width (pt)', ['0.5', '1', '1.5', '2.25', '3'], 'ok', { labelled: true, value: '1' })] },
      { name: 'Shading', nowrap: true, items: [big('tblShading', 'Shading', '▨', 'ok', { chevron: true, menu: TABLE_MENU_ITEMS.shading })] },
      { name: 'Table Style Options', nowrap: true, items: [big('tbl:header', 'Header Row', '▭', 'ok'), big('tbl:bandR', 'Banded Rows', '☰', 'ok'), big('tbl:bandC', 'Banded Columns', '⫴', 'ok')] },
    ];

    case 'Table Layout': return [
      { name: 'Select', nowrap: true, items: [big('tblSelect', 'Select', '⬚', 'ok', { chevron: true, menu: TABLE_MENU_ITEMS.select })] },
      { name: 'Rows & Columns', nowrap: true, items: [big('rowAbove', 'Insert above', '⇑', 'ok'), big('rowBelow', 'Insert below', '⇓', 'ok'), big('colLeft', 'Insert left', '⇐', 'ok'), big('colRight', 'Insert right', '⇒', 'ok'), big('deleteTable', 'Delete', '🗑', 'ok', { chevron: true, menu: TABLE_MENU_ITEMS.delete })] },
      { name: 'Merge', nowrap: true, items: [big('mergeCells', 'Merge cells', '⧉', 'ok'), big('splitCells', 'Split cells', '⫽', 'ok')] },
      { name: 'Cell size', nowrap: true, items: [num('rowHeight', 'Row height (mm)', 9, 'ok', { labelled: true }), num('colWidth', 'Column width (mm)', 60, 'ok', { labelled: true }), sel('autoFit', 'AutoFit', ['Content', 'Page', 'Fixed'], 'ok', { labelled: true }), big('tbl:distR', 'Distribute rows', '☰', 'ok'), big('tbl:distC', 'Distribute columns', '⫴', 'ok')] },
      { name: 'Alignment', nowrap: true, items: [big('cellAlign', 'Align cell', '▦', 'ok', { chevron: true, menu: TABLE_MENU_ITEMS.align }), big('textDirection', 'Text direction', '⟲', 'ok')] },
      { name: 'Table style', nowrap: true, items: [big('tblBorders', 'Borders', '▢', 'ok', { chevron: true, menu: TABLE_MENU_ITEMS.borders }), big('tblShading', 'Shading', '▨', 'ok', { chevron: true, menu: TABLE_MENU_ITEMS.shading }), big('cellPadding', 'Cell padding', '▣', 'ok', { chevron: true, menu: TABLE_MENU_ITEMS.padding }), big('headerRowBtn', 'Header row', '▭', 'ok')] },
      { name: 'Position', nowrap: true, items: [big('tblLeft', 'Table left', '⫷', 'ok'), big('tblCenter', 'Table center', '≡', 'ok'), big('tblRight', 'Table right', '⫸', 'ok'), big('tblPosition', 'Wrap / Position', '⧉', 'ok', { chevron: true, menu: TABLE_MENU_ITEMS.position })] },
    ];
  }
};

/** Các tab đang hiện: tab ngữ cảnh chỉ hiện khi chọn ảnh / bảng */
export const visibleTabs = (selection: Selection): TabId[] => {
  const base: TabId[] = ['File', 'Home', 'Exercise', 'Insert', 'Design', 'Layout', 'Review', 'View', 'Help'];
  if (selection === 'image') base.push('Picture Format');
  if (selection === 'table') base.push('Table Design', 'Table Layout');
  return base;
};
