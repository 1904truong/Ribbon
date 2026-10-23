import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check, Headphones, Mic, Plus, Scissors, Settings,
  SlidersHorizontal, Sparkles, Upload, Wand2, X
} from 'lucide-react';
import type { ExerciseGroup } from './types';

interface BaseModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

const ModalOverlay = ({ onClose, children }: BaseModalProps) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return createPortal(
    <div
      className="rb-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="rb-modal-card" role="dialog" aria-modal="true" style={{ maxWidth: 540 }}>
        {children}
      </div>
    </div>,
    document.body
  );
};

// ══════════════ 1. CÀI ĐẶT RIÊNG CỦA DẠNG BÀI (SET OPTIONS) ══════════════
export interface ExerciseGroupOptions {
  // Nhóm A: Khung từ + chỗ trống
  blankWidth?: number;
  blankStroke?: 'dashed' | 'solid';
  blankLabel?: '(a)' | '(1)' | 'none';
  wordBankStyle?: 'row' | 'grid3' | 'grid2';
  wordBankBorder?: boolean;
  hint?: boolean;

  // Nhóm B: Trắc nghiệm
  optionLabel?: 'A.' | 'a)' | '①';
  optionColumns?: '1' | '2' | '4';
  imageOptions?: boolean;
  underlineWord?: boolean;
  startNumber?: number;

  // Nhóm C: Cloze
  optionsStyle?: 'inline' | 'list';
  imagePosition?: 'top' | 'left' | 'right' | 'bottom';
  imageWidth?: number;

  // Nhóm D: Đúng / Sai / Không có
  answerColumn?: 'T F NG' | 'True False NG' | 'circles';
  showImage?: boolean;
  imageHeight?: number;

  // Nhóm E: Nối chữ
  leftLabel?: '1,2,3' | 'a,b,c' | 'A,B,C';
  columnGap?: number;
  columnWidth?: number;
  rowGap?: number;

  // Nhóm F: Nối với ảnh
  imagesPerRow?: '2' | '3' | '4';
  imageSize?: number;
  caption?: boolean;
  imageLabel?: boolean;

  // Nhóm G: Bảng
  headerRow?: boolean;
  tableRows?: number;
  tableCols?: number;
  cellBlank?: boolean;

  // Nhóm H: Sắp xếp / đặt câu
  sentenceBlockStyle?: 'blocks' | 'list';
  hintParen?: boolean;
  answerLine?: boolean;
}

export const SetOptionsModal = ({
  group,
  groupName,
  options,
  onClose,
  onSave,
}: {
  group: ExerciseGroup;
  groupName: string;
  options: ExerciseGroupOptions;
  onClose: () => void;
  onSave: (opts: ExerciseGroupOptions) => void;
}) => {
  const [form, setForm] = useState<ExerciseGroupOptions>({
    blankWidth: 28,
    blankStroke: 'dashed',
    blankLabel: '(a)',
    wordBankStyle: 'row',
    wordBankBorder: true,
    hint: true,
    optionLabel: 'A.',
    optionColumns: '2',
    imageOptions: false,
    underlineWord: false,
    startNumber: 1,
    optionsStyle: 'inline',
    imagePosition: 'right',
    imageWidth: 40,
    answerColumn: 'T F NG',
    showImage: true,
    imageHeight: 22,
    leftLabel: '1,2,3',
    columnGap: 10,
    columnWidth: 50,
    rowGap: 4.5,
    imagesPerRow: '2',
    imageSize: 45,
    caption: true,
    imageLabel: true,
    headerRow: true,
    tableRows: 3,
    tableCols: 4,
    cellBlank: true,
    sentenceBlockStyle: 'blocks',
    hintParen: true,
    answerLine: true,
    ...options,
  });

  return (
    <ModalOverlay onClose={onClose}>
      <div className="rb-modal-header">
        <div className="rb-modal-title-wrap">
          <div className="rb-modal-icon-badge info">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <h3 className="rb-modal-title">Cài đặt loại bài: {groupName}</h3>
            <p className="rb-modal-subtitle">Tùy biến tham số hiển thị và quy cách trình bày riêng của Nhóm {group}</p>
          </div>
        </div>
        <button type="button" className="rb-modal-close" onClick={onClose} aria-label="Đóng">
          <X size={18} />
        </button>
      </div>

      <div className="rb-modal-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Nhóm A: Khung từ + Chỗ trống */}
          {group === 'A' && (
            <>
              <div className="rb-form-row">
                <label className="rb-form-label">
                  <span>Độ dài chỗ trống (mm):</span>
                  <input
                    type="number"
                    min="15"
                    max="60"
                    value={form.blankWidth ?? 28}
                    onChange={(e) => setForm({ ...form, blankWidth: Number(e.target.value) })}
                    className="rb-form-input"
                    style={{ width: 80 }}
                  />
                </label>
                <span className="rb-form-desc">Độ rộng của vạch kẻ điền từ trên trang in A4.</span>
              </div>

              <div className="rb-form-row">
                <label className="rb-form-label">
                  <span>Kiểu nét chỗ trống:</span>
                  <select
                    value={form.blankStroke ?? 'dashed'}
                    onChange={(e) => setForm({ ...form, blankStroke: e.target.value as 'dashed' | 'solid' })}
                    className="rb-form-select"
                  >
                    <option value="dashed">Nét đứt (Dashed line - - -)</option>
                    <option value="solid">Nét liền (Solid underline ___)</option>
                  </select>
                </label>
              </div>

              <div className="rb-form-row">
                <label className="rb-form-label">
                  <span>Nhãn chỗ trống:</span>
                  <select
                    value={form.blankLabel ?? '(a)'}
                    onChange={(e) => setForm({ ...form, blankLabel: e.target.value as '(a)' | '(1)' | 'none' })}
                    className="rb-form-select"
                  >
                    <option value="(a)">(a), (b), (c)...</option>
                    <option value="(1)">(1), (2), (3)...</option>
                    <option value="none">Không nhãn (chỉ có chỗ trống)</option>
                  </select>
                </label>
              </div>

              <div className="rb-form-row">
                <label className="rb-form-label">
                  <span>Kiểu khung từ (Word Bank):</span>
                  <select
                    value={form.wordBankStyle ?? 'row'}
                    onChange={(e) => setForm({ ...form, wordBankStyle: e.target.value as 'row' | 'grid3' | 'grid2' })}
                    className="rb-form-select"
                  >
                    <option value="row">Một hàng ngang (Inline row)</option>
                    <option value="grid3">Lưới 3 cột (Grid 3 columns)</option>
                    <option value="grid2">Hai cột (Grid 2 columns)</option>
                  </select>
                </label>
              </div>

              <div className="rb-form-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={form.wordBankBorder ?? true}
                    onChange={(e) => setForm({ ...form, wordBankBorder: e.target.checked })}
                  />
                  <span>Hiển thị viền khung từ (Border bao quanh Word Bank)</span>
                </label>
              </div>

              <div className="rb-form-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={form.hint ?? true}
                    onChange={(e) => setForm({ ...form, hint: e.target.checked })}
                  />
                  <span>Hiển thị gợi ý chữ cái đầu (First letter hint)</span>
                </label>
              </div>
            </>
          )}

          {/* Nhóm B: Trắc nghiệm */}
          {group === 'B' && (
            <>
              <div className="rb-form-row">
                <label className="rb-form-label">
                  <span>Kiểu nhãn đáp án:</span>
                  <select
                    value={form.optionLabel ?? 'A.'}
                    onChange={(e) => setForm({ ...form, optionLabel: e.target.value as 'A.' | 'a)' | '①' })}
                    className="rb-form-select"
                  >
                    <option value="A.">A. B. C. D. (Chữ hoa có dấu chấm)</option>
                    <option value="a)">a) b) c) d) (Chữ thường đóng ngoặc)</option>
                    <option value="①">① ② ③ ④ (Vòng tròn số)</option>
                  </select>
                </label>
              </div>

              <div className="rb-form-row">
                <label className="rb-form-label">
                  <span>Số cột phương án lựa chọn:</span>
                  <select
                    value={form.optionColumns ?? '2'}
                    onChange={(e) => setForm({ ...form, optionColumns: e.target.value as '1' | '2' | '4' })}
                    className="rb-form-select"
                  >
                    <option value="1">1 cột (Xếp dọc theo danh sách)</option>
                    <option value="2">2 cột (Cân đối 2 bên)</option>
                    <option value="4">4 cột (Dàn ngang 1 hàng A B C D)</option>
                  </select>
                </label>
              </div>

              <div className="rb-form-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={form.imageOptions ?? false}
                    onChange={(e) => setForm({ ...form, imageOptions: e.target.checked })}
                  />
                  <span>Đáp án bằng hình ảnh minh họa (Image options)</span>
                </label>
              </div>

              <div className="rb-form-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={form.underlineWord ?? false}
                    onChange={(e) => setForm({ ...form, underlineWord: e.target.checked })}
                  />
                  <span>Gạch chân từ trong câu [...] (Pronunciation focus)</span>
                </label>
              </div>

              <div className="rb-form-row">
                <label className="rb-form-label">
                  <span>Số câu bắt đầu từ:</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={form.startNumber ?? 1}
                    onChange={(e) => setForm({ ...form, startNumber: Number(e.target.value) })}
                    className="rb-form-input"
                    style={{ width: 80 }}
                  />
                </label>
              </div>
            </>
          )}

          {/* Nhóm C: Cloze */}
          {group === 'C' && (
            <>
              <div className="rb-form-row">
                <label className="rb-form-label">
                  <span>Kiểu hiển thị lựa chọn dưới đoạn:</span>
                  <select
                    value={form.optionsStyle ?? 'inline'}
                    onChange={(e) => setForm({ ...form, optionsStyle: e.target.value as 'inline' | 'list' })}
                    className="rb-form-select"
                  >
                    <option value="inline">Hàng ngang từng câu (Inline grid)</option>
                    <option value="list">Danh sách 2 cột (Two-column list)</option>
                  </select>
                </label>
              </div>

              <div className="rb-form-row">
                <label className="rb-form-label">
                  <span>Vị trí ảnh minh họa đoạn văn:</span>
                  <select
                    value={form.imagePosition ?? 'right'}
                    onChange={(e) => setForm({ ...form, imagePosition: e.target.value as 'top' | 'left' | 'right' | 'bottom' })}
                    className="rb-form-select"
                  >
                    <option value="top">Trên cùng (Top)</option>
                    <option value="right">Bên phải đoạn văn (Right side)</option>
                    <option value="left">Bên trái đoạn văn (Left side)</option>
                    <option value="bottom">Dưới cùng (Bottom)</option>
                  </select>
                </label>
              </div>

              <div className="rb-form-row">
                <label className="rb-form-label">
                  <span>Độ rộng ảnh minh họa (%):</span>
                  <input
                    type="number"
                    min="20"
                    max="60"
                    value={form.imageWidth ?? 40}
                    onChange={(e) => setForm({ ...form, imageWidth: Number(e.target.value) })}
                    className="rb-form-input"
                    style={{ width: 80 }}
                  />
                </label>
              </div>
            </>
          )}

          {/* Nhóm D: Đúng / Sai / Không có */}
          {group === 'D' && (
            <>
              <div className="rb-form-row">
                <label className="rb-form-label">
                  <span>Cột lựa chọn trả lời:</span>
                  <select
                    value={form.answerColumn ?? 'T F NG'}
                    onChange={(e) => setForm({ ...form, answerColumn: e.target.value as 'T F NG' | 'True False NG' | 'circles' })}
                    className="rb-form-select"
                  >
                    <option value="T F NG">Chữ viết tắt: T / F / NG</option>
                    <option value="True False NG">Đầy đủ: True / False / Not Given</option>
                    <option value="circles">Ô tròn trắc nghiệm tô đen (Bubble circles)</option>
                  </select>
                </label>
              </div>

              <div className="rb-form-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={form.showImage ?? true}
                    onChange={(e) => setForm({ ...form, showImage: e.target.checked })}
                  />
                  <span>Hiển thị ảnh minh họa cạnh tiêu đề</span>
                </label>
              </div>

              <div className="rb-form-row">
                <label className="rb-form-label">
                  <span>Chiều cao ảnh minh họa (mm):</span>
                  <input
                    type="number"
                    min="15"
                    max="50"
                    value={form.imageHeight ?? 22}
                    onChange={(e) => setForm({ ...form, imageHeight: Number(e.target.value) })}
                    className="rb-form-input"
                    style={{ width: 80 }}
                  />
                </label>
              </div>
            </>
          )}

          {/* Nhóm E: Nối chữ */}
          {group === 'E' && (
            <>
              <div className="rb-form-row">
                <label className="rb-form-label">
                  <span>Nhãn đánh số cột trái:</span>
                  <select
                    value={form.leftLabel ?? '1,2,3'}
                    onChange={(e) => setForm({ ...form, leftLabel: e.target.value as '1,2,3' | 'a,b,c' | 'A,B,C' })}
                    className="rb-form-select"
                  >
                    <option value="1,2,3">Số thứ tự: 1, 2, 3, 4</option>
                    <option value="a,b,c">Chữ cái thường: a, b, c, d</option>
                    <option value="A,B,C">Chữ cái hoa: A, B, C, D</option>
                  </select>
                </label>
              </div>

              <div className="rb-form-row">
                <label className="rb-form-label">
                  <span>Khoảng cách giữa 2 cột ghép (mm):</span>
                  <input
                    type="number"
                    min="6"
                    max="30"
                    value={form.columnGap ?? 10}
                    onChange={(e) => setForm({ ...form, columnGap: Number(e.target.value) })}
                    className="rb-form-input"
                    style={{ width: 80 }}
                  />
                </label>
              </div>

              <div className="rb-form-row">
                <label className="rb-form-label">
                  <span>Độ rộng cột trái (%):</span>
                  <input
                    type="number"
                    min="30"
                    max="70"
                    value={form.columnWidth ?? 50}
                    onChange={(e) => setForm({ ...form, columnWidth: Number(e.target.value) })}
                    className="rb-form-input"
                    style={{ width: 80 }}
                  />
                </label>
              </div>

              <div className="rb-form-row">
                <label className="rb-form-label">
                  <span>Khoảng cách giữa các dòng (mm):</span>
                  <input
                    type="number"
                    min="2"
                    max="15"
                    step="0.5"
                    value={form.rowGap ?? 4.5}
                    onChange={(e) => setForm({ ...form, rowGap: Number(e.target.value) })}
                    className="rb-form-input"
                    style={{ width: 80 }}
                  />
                </label>
              </div>
            </>
          )}

          {/* Nhóm F: Nối với ảnh */}
          {group === 'F' && (
            <>
              <div className="rb-form-row">
                <label className="rb-form-label">
                  <span>Số ảnh trên mỗi hàng:</span>
                  <select
                    value={form.imagesPerRow ?? '2'}
                    onChange={(e) => setForm({ ...form, imagesPerRow: e.target.value as '2' | '3' | '4' })}
                    className="rb-form-select"
                  >
                    <option value="2">2 ảnh / hàng (Lưới 2x2 rõ nét)</option>
                    <option value="3">3 ảnh / hàng (Lưới 3x2 tiết kiệm diện tích)</option>
                    <option value="4">4 ảnh / hàng (Lưới 4x1 hàng ngang)</option>
                  </select>
                </label>
              </div>

              <div className="rb-form-row">
                <label className="rb-form-label">
                  <span>Kích thước ảnh minh họa (mm):</span>
                  <input
                    type="number"
                    min="25"
                    max="70"
                    value={form.imageSize ?? 45}
                    onChange={(e) => setForm({ ...form, imageSize: Number(e.target.value) })}
                    className="rb-form-input"
                    style={{ width: 80 }}
                  />
                </label>
              </div>

              <div className="rb-form-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={form.caption ?? true}
                    onChange={(e) => setForm({ ...form, caption: e.target.checked })}
                  />
                  <span>Hiển thị tiêu đề chú thích ảnh (Caption)</span>
                </label>
              </div>

              <div className="rb-form-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={form.imageLabel ?? true}
                    onChange={(e) => setForm({ ...form, imageLabel: e.target.checked })}
                  />
                  <span>Hiển thị nhãn huy hiệu ảnh A–F (Badge Label)</span>
                </label>
              </div>
            </>
          )}

          {/* Nhóm G: Bảng */}
          {group === 'G' && (
            <>
              <div className="rb-form-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={form.headerRow ?? true}
                    onChange={(e) => setForm({ ...form, headerRow: e.target.checked })}
                  />
                  <span>Hàng đầu tiên là Header (in đậm nền sáng)</span>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="rb-form-row">
                  <label className="rb-form-label">
                    <span>Số hàng:</span>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      value={form.tableRows ?? 3}
                      onChange={(e) => setForm({ ...form, tableRows: Number(e.target.value) })}
                      className="rb-form-input"
                    />
                  </label>
                </div>
                <div className="rb-form-row">
                  <label className="rb-form-label">
                    <span>Số cột:</span>
                    <input
                      type="number"
                      min="2"
                      max="6"
                      value={form.tableCols ?? 4}
                      onChange={(e) => setForm({ ...form, tableCols: Number(e.target.value) })}
                      className="rb-form-input"
                    />
                  </label>
                </div>
              </div>

              <div className="rb-form-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={form.cellBlank ?? true}
                    onChange={(e) => setForm({ ...form, cellBlank: e.target.checked })}
                  />
                  <span>Tự động nhận diện ô có chứa vạch kẻ điền từ</span>
                </label>
              </div>
            </>
          )}

          {/* Nhóm H: Sắp xếp / đặt câu */}
          {group === 'H' && (
            <>
              <div className="rb-form-row">
                <label className="rb-form-label">
                  <span>Kiểu hiển thị khối từ cần sắp xếp:</span>
                  <select
                    value={form.sentenceBlockStyle ?? 'blocks'}
                    onChange={(e) => setForm({ ...form, sentenceBlockStyle: e.target.value as 'blocks' | 'list' })}
                    className="rb-form-select"
                  >
                    <option value="blocks">Khối thẻ từ bo góc (Interactive word tags)</option>
                    <option value="list">Dòng chữ cách nhau bởi dấu gạch chéo (/)</option>
                  </select>
                </label>
              </div>

              <div className="rb-form-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={form.hintParen ?? true}
                    onChange={(e) => setForm({ ...form, hintParen: e.target.checked })}
                  />
                  <span>Hiển thị từ gợi ý hoặc thì ngữ pháp trong ngoặc (eat)</span>
                </label>
              </div>

              <div className="rb-form-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={form.answerLine ?? true}
                    onChange={(e) => setForm({ ...form, answerLine: e.target.checked })}
                  />
                  <span>Kẻ dòng chấm để học sinh viết câu trả lời (Dòng kẻ viết)</span>
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rb-modal-footer">
        <button type="button" className="rb-btn-subtle" onClick={onClose}>
          Hủy bỏ
        </button>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="rb-btn-primary"
          onClick={() => {
            onSave(form);
            onClose();
          }}
        >
          <Check size={15} /> Lưu cài đặt
        </button>
      </div>
    </ModalOverlay>
  );
};

// ══════════════ 2. CÀI ĐẶT CHUNG BÀI TẬP (EXERCISE SETTINGS) ══════════════
export interface GeneralExerciseSettings {
  title: string;
  instruction: string;
  showTitle: boolean;
  showInstruction: boolean;
  points: number;
  pageBreakBefore: boolean;
}

export const ExerciseSettingsModal = ({
  settings,
  onClose,
  onSave,
}: {
  settings: GeneralExerciseSettings;
  onClose: () => void;
  onSave: (s: GeneralExerciseSettings) => void;
}) => {
  const [form, setForm] = useState<GeneralExerciseSettings>({ ...settings });

  return (
    <ModalOverlay onClose={onClose}>
      <div className="rb-modal-header">
        <div className="rb-modal-title-wrap">
          <div className="rb-modal-icon-badge info">
            <Settings size={18} />
          </div>
          <div>
            <h3 className="rb-modal-title">Cấu hình bài tập (Exercise Settings)</h3>
            <p className="rb-modal-subtitle">Chỉnh sửa tiêu đề, hướng dẫn học sinh và quy cách trình bày</p>
          </div>
        </div>
        <button type="button" className="rb-modal-close" onClick={onClose} aria-label="Đóng">
          <X size={18} />
        </button>
      </div>

      <div className="rb-modal-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="rb-form-row">
            <label className="rb-form-label">
              <span>Tiêu đề bài tập:</span>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="rb-form-input"
                style={{ width: '100%' }}
                placeholder="Ví dụ: Listen and fill the gaps. Then read aloud"
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b', marginTop: 4 }}>
              <input
                type="checkbox"
                checked={form.showTitle}
                onChange={(e) => setForm({ ...form, showTitle: e.target.checked })}
              />
              Hiển thị tiêu đề bài tập khi in
            </label>
          </div>

          <div className="rb-form-row">
            <label className="rb-form-label">
              <span>Hướng dẫn làm bài (Instruction):</span>
              <textarea
                value={form.instruction}
                onChange={(e) => setForm({ ...form, instruction: e.target.value })}
                className="rb-form-input"
                rows={2}
                style={{ width: '100%', resize: 'vertical' }}
                placeholder="Ví dụ: Listen carefully to the track and complete each sentence."
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b', marginTop: 4 }}>
              <input
                type="checkbox"
                checked={form.showInstruction}
                onChange={(e) => setForm({ ...form, showInstruction: e.target.checked })}
              />
              Hiển thị dòng hướng dẫn (chữ nghiêng)
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="rb-form-row">
              <label className="rb-form-label">
                <span>Tổng điểm bài:</span>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={form.points}
                  onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                  className="rb-form-input"
                />
              </label>
            </div>

            <div className="rb-form-row" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, paddingBottom: 6 }}>
                <input
                  type="checkbox"
                  checked={form.pageBreakBefore}
                  onChange={(e) => setForm({ ...form, pageBreakBefore: e.target.checked })}
                />
                Ngắt sang trang mới
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="rb-modal-footer">
        <button type="button" className="rb-btn-subtle" onClick={onClose}>
          Hủy bỏ
        </button>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="rb-btn-primary"
          onClick={() => {
            onSave(form);
            onClose();
          }}
        >
          <Check size={15} /> Áp dụng cấu hình
        </button>
      </div>
    </ModalOverlay>
  );
};

// ══════════════ 3. AI ASSIST MODAL (SMART PASTE, SMART AI, AI REWRITE) ══════════════
export type AiTab = 'smartPaste' | 'smartAi' | 'aiRewrite';

export interface AiParsedResult {
  title: string;
  instruction?: string;
  wordBank?: string[];
  passage?: string;
  questions?: Array<{ number: number; text: string; options: string[] }>;
  statements?: Array<{ number: number; text: string; answer?: 'True' | 'False' | 'Not Given' }>;
  matchingPairs?: Array<{ leftNumber: string; leftText: string; rightLetter: string; rightText: string }>;
  sentenceItems?: Array<{ number: number; jumbledWords: string; hintInParentheses?: string; solution?: string }>;
}

export const AiAssistModal = ({
  group,
  groupName,
  initialTab,
  currentPassage,
  aiEnabled = false,
  onClose,
  onApplyResult,
}: {
  group: ExerciseGroup;
  groupName: string;
  initialTab: AiTab;
  currentPassage?: string;
  aiEnabled?: boolean;
  onClose: () => void;
  onApplyResult: (result: AiParsedResult) => void;
}) => {
  const [tab, setTab] = useState<AiTab>(aiEnabled ? initialTab : 'smartPaste');
  const [topic, setTopic] = useState('London Landmarks & Culture');
  const [level, setLevel] = useState('A2 - Pre-intermediate');
  const [rewriteMode, setRewriteMode] = useState<'simplify' | 'academic' | 'fix'>('simplify');
  const [previewResult, setPreviewResult] = useState<AiParsedResult | null>(null);

  const defaultRawText = group === 'B'
    ? `Multiple Choice Practice: London Attractions\n1. Where is Big Ben located in London?\nA. By the River Thames\nB. In Hyde Park\nC. At Heathrow Airport\nD. Inside Oxford University\n2. What is Tower Bridge famous for?\nA. It opens for tall boats\nB. It is painted pink\nC. It was made of wood\nD. It is underground`
    : group === 'D'
    ? `True / False: London City Tour\n1. London is the capital of England.\n2. The River Thames is located in Manchester.\n3. The British Museum offers free general admission.`
    : group === 'E'
    ? `Vocabulary Matching: Places in London\n1. Landmark - A famous feature easily identified from afar\n2. Historic - Dating back centuries in human history\n3. Residence - A place where people live, such as a palace\n4. Estuary - The mouth of a large river meeting the sea`
    : group === 'H'
    ? `Sentence Rearrangement: Living in London\n1. likes / the / sausages / zebra / he / but / not / peas / does (likes)\n2. tourists / millions / London / of / visit / year / every (present simple)\n3. capital / is / the / what / England / of / ? (question)`
    : `Listen and fill the gaps. Then read aloud\nWord box: zebra, peas, carrots, eat, hippo, bananas\n1. The zebra likes sausages, he doesn't like [peas].\n2. The hippo likes [bananas], she doesn't like peas.`;

  const [rawText, setRawText] = useState(defaultRawText);

  // Parse raw text based on group
  const handleGeneratePreview = () => {
    if (tab === 'smartPaste') {
      const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
      const title = lines[0] || `Exercise: Practice with ${groupName}`;

      if (group === 'B') {
        const questions: Array<{ number: number; text: string; options: string[] }> = [];
        let curQ: { number: number; text: string; options: string[] } | null = null;
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (/^\d+[\.\)]\s*/.test(line)) {
            if (curQ) questions.push(curQ);
            curQ = { number: questions.length + 1, text: line.replace(/^\d+[\.\)]\s*/, ''), options: [] };
          } else if (/^[A-D][\.\)]\s*/i.test(line) && curQ) {
            curQ.options.push(line);
          }
        }
        if (curQ) questions.push(curQ);
        if (questions.length === 0) {
          questions.push(
            { number: 1, text: 'Where is Big Ben located?', options: ['A. By the River Thames', 'B. In Hyde Park', 'C. At Oxford'] },
            { number: 2, text: 'What is Tower Bridge famous for?', options: ['A. Opening for large boats', 'B. Being pink', 'C. Underground railway'] }
          );
        }
        setPreviewResult({ title, questions });
      } else if (group === 'D') {
        const statements: Array<{ number: number; text: string; answer?: 'True' | 'False' | 'Not Given' }> = [];
        lines.slice(1).forEach((line, idx) => {
          if (line.length > 3) {
            statements.push({ number: idx + 1, text: line.replace(/^\d+[\.\)]\s*/, '') });
          }
        });
        setPreviewResult({ title, statements });
      } else if (group === 'E') {
        const matchingPairs: Array<{ leftNumber: string; leftText: string; rightLetter: string; rightText: string }> = [];
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        lines.slice(1).forEach((line, idx) => {
          const parts = line.split(/[-–—:]/);
          if (parts.length >= 2) {
            matchingPairs.push({
              leftNumber: String(idx + 1),
              leftText: parts[0].replace(/^\d+[\.\)]\s*/, '').trim(),
              rightLetter: letters[idx] || 'A',
              rightText: parts.slice(1).join('-').trim(),
            });
          }
        });
        if (matchingPairs.length === 0) {
          matchingPairs.push(
            { leftNumber: '1', leftText: 'Landmark', rightLetter: 'A', rightText: 'A prominent recognizable landscape feature' },
            { leftNumber: '2', leftText: 'Historic', rightLetter: 'B', rightText: 'Famous or important in history' }
          );
        }
        setPreviewResult({ title, matchingPairs });
      } else if (group === 'H') {
        const sentenceItems: Array<{ number: number; jumbledWords: string; hintInParentheses?: string; solution?: string }> = [];
        lines.slice(1).forEach((line, idx) => {
          const parenMatch = line.match(/\((.*?)\)/);
          const words = line.replace(/\(.*?\)/, '').replace(/^\d+[\.\)]\s*/, '').trim();
          sentenceItems.push({
            number: idx + 1,
            jumbledWords: words,
            hintInParentheses: parenMatch ? `(${parenMatch[1]})` : undefined,
          });
        });
        setPreviewResult({ title, sentenceItems });
      } else {
        let words: string[] = ['zebra', 'peas', 'carrots', 'eat', 'hippo', 'bananas'];
        const wbLine = lines.find((l) => l.toLowerCase().includes('word') || l.toLowerCase().includes('box') || l.includes(':'));
        if (wbLine) {
          const parts = wbLine.split(':')[1] || wbLine;
          words = parts.split(/[,•|/\s]+/).map((w) => w.trim()).filter((w) => w.length > 1);
        }
        const passage = lines.slice(1).filter((l) => l !== wbLine).join('\n');
        setPreviewResult({ title, wordBank: words, passage });
      }
    } else if (tab === 'smartAi') {
      const title = `Practice: ${topic} (${level})`;
      if (group === 'B') {
        setPreviewResult({
          title,
          questions: [
            { number: 1, text: `What is the most famous aspect of ${topic}?`, options: ['A. Its rich cultural heritage and historical sites', 'B. Extreme cold weather', 'C. Modern space stations', 'D. Remote desert nature'] },
            { number: 2, text: `Why do international visitors travel to explore ${topic}?`, options: ['A. To experience renowned attractions and authentic traditions', 'B. To buy cheap plastic items', 'C. To sleep all day', 'D. To avoid people'] },
          ],
        });
      } else if (group === 'D') {
        setPreviewResult({
          title,
          statements: [
            { number: 1, text: `${topic} is widely recognized by travelers around the world.` },
            { number: 2, text: `Visitors are not permitted to take photographs at any of the landmarks.` },
            { number: 3, text: `Most local museums have historical artifacts from ancient times.` },
          ],
        });
      } else if (group === 'E') {
        setPreviewResult({
          title,
          matchingPairs: [
            { leftNumber: '1', leftText: 'Monument', rightLetter: 'A', rightText: 'A statue, building, or structure erected to commemorate a notable person or event' },
            { leftNumber: '2', leftText: 'Tradition', rightLetter: 'B', rightText: 'The transmission of customs or beliefs from generation to generation' },
            { leftNumber: '3', leftText: 'Heritage', rightLetter: 'C', rightText: 'Valued objects and qualities such as historic buildings that have been passed down' },
          ],
        });
      } else if (group === 'H') {
        setPreviewResult({
          title,
          sentenceItems: [
            { number: 1, jumbledWords: `famous / is / for / ${topic} / its / heritage`, hintInParentheses: '(be + famous for)', solution: `${topic} is famous for its heritage.` },
            { number: 2, jumbledWords: 'tourists / wonderful / experience / had / a', hintInParentheses: '(past simple)', solution: 'Tourists had a wonderful experience.' },
          ],
        });
      } else {
        setPreviewResult({
          title,
          wordBank: ['landmark', 'historic', 'culture', 'explore', 'tradition', 'scenery'],
          passage: `Visiting a new city is a wonderful experience. Tourists often visit the most famous [_________] to learn about the local [_________]. Don't forget to take photos of the beautiful [_________]!`,
        });
      }
    } else if (tab === 'aiRewrite') {
      const original = currentPassage || "The zebra likes sausages, he doesn't like [_________].";
      let rewritten = original;
      if (rewriteMode === 'simplify') {
        rewritten = "The zebra loves good sausages. He does not like [_________]. We have some carrots and sausages for the zebra, please.\nThe hippo loves sweet bananas. She does not like peas.";
      } else if (rewriteMode === 'academic') {
        rewritten = "Zebras typically prefer sausages rather than [_________]. Kindly provide some fresh carrots and sausages for the zebra.\nConversely, the hippopotamus favors [_________] over vegetables.";
      } else {
        rewritten = "The zebra likes sausages, but he does not like [_________]. Please bring some carrots and sausages for the zebra.\nThe hippo likes bananas, and she does not like peas.";
      }
      setPreviewResult({ title: 'Rewritten Passage', passage: rewritten });
    }
  };

  const handleApply = () => {
    if (previewResult) {
      onApplyResult(previewResult);
      onClose();
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="rb-modal-header">
        <div className="rb-modal-title-wrap">
          <div className="rb-modal-icon-badge" style={{ background: '#fdf2f8', color: '#db2777' }}>
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="rb-modal-title">AI Trợ lý bài tập (AI Assist) — {groupName}</h3>
            <p className="rb-modal-subtitle">Bóc tách bài tập, sinh câu hỏi thông minh và viết lại nội dung chuyên biệt</p>
          </div>
        </div>
        <button type="button" className="rb-modal-close" onClick={onClose} aria-label="Đóng">
          <X size={18} />
        </button>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 12px' }}>
        <button
          type="button"
          onClick={() => { setTab('smartPaste'); setPreviewResult(null); }}
          className={`rb-ai-tab${tab === 'smartPaste' ? ' on' : ''}`}
        >
          📋 Smart Paste
        </button>
        <button
          type="button"
          disabled={!aiEnabled}
          title={aiEnabled ? 'Smart AI' : 'Chưa cấu hình workflow/API AI'}
          onClick={() => { setTab('smartAi'); setPreviewResult(null); }}
          className={`rb-ai-tab${tab === 'smartAi' ? ' on' : ''}`}
        >
          ✨ Smart AI Sinh đề
        </button>
        <button
          type="button"
          disabled={!aiEnabled}
          title={aiEnabled ? 'AI Rewrite' : 'Chưa cấu hình workflow/API AI'}
          onClick={() => { setTab('aiRewrite'); setPreviewResult(null); }}
          className={`rb-ai-tab${tab === 'aiRewrite' ? ' on' : ''}`}
        >
          ✍️ AI Rewrite
        </button>
      </div>

      <div className="rb-modal-body">
        {previewResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#166534', marginBottom: 4 }}>
                ✓ Xem trước kết quả AI (Preview Changes)
              </div>
              <div style={{ fontSize: 12, color: '#15803d' }}>
                Kiểm tra nội dung trước khi áp dụng vào bài tập. Giáo viên có thể bấm "Quay lại sửa" nếu muốn điều chỉnh thêm.
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, background: '#fff', maxHeight: 260, overflowY: 'auto' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginBottom: 6 }}>
                {previewResult.title}
              </div>

              {previewResult.wordBank && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '8px 0', padding: 8, background: '#f8fafc', borderRadius: 6 }}>
                  <strong style={{ fontSize: 11, width: '100%', color: '#64748b' }}>WORD BANK:</strong>
                  {previewResult.wordBank.map((w, idx) => (
                    <span key={idx} style={{ padding: '2px 8px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }}>
                      {w}
                    </span>
                  ))}
                </div>
              )}

              {previewResult.passage && (
                <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {previewResult.passage}
                </div>
              )}

              {previewResult.questions && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {previewResult.questions.map((q, idx) => (
                    <div key={idx} style={{ padding: 6, background: '#f8fafc', borderRadius: 6 }}>
                      <div style={{ fontWeight: 600, fontSize: 12.5 }}>{q.number}. {q.text}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4, marginLeft: 12, fontSize: 12, color: '#475569' }}>
                        {q.options.map((opt, optIdx) => (
                          <span key={optIdx}>{opt}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {previewResult.statements && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {previewResult.statements.map((s, idx) => (
                    <div key={idx} style={{ fontSize: 12.5, color: '#334155', padding: '4px 0', borderBottom: '1px dashed #e2e8f0' }}>
                      <strong>{s.number}.</strong> {s.text} <span style={{ color: '#0284c7', fontSize: 11, marginLeft: 6 }}>[True / False]</span>
                    </div>
                  ))}
                </div>
              )}

              {previewResult.matchingPairs && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {previewResult.matchingPairs.map((pair, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, padding: '4px 6px', background: '#f8fafc', borderRadius: 4 }}>
                      <div><strong>{pair.leftNumber}.</strong> {pair.leftText}</div>
                      <div><strong>{pair.rightLetter}.</strong> {pair.rightText}</div>
                    </div>
                  ))}
                </div>
              )}

              {previewResult.sentenceItems && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {previewResult.sentenceItems.map((item, idx) => (
                    <div key={idx} style={{ fontSize: 12.5, padding: '4px 0' }}>
                      <strong>{item.number}.</strong> {item.jumbledWords} {item.hintInParentheses && <em style={{ color: '#64748b' }}>{item.hintInParentheses}</em>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {tab === 'smartPaste' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ margin: 0, fontSize: 12.5, color: '#475569' }}>
                  Dán đề bài thô của <strong>{groupName}</strong>. AI sẽ phân tích và tách tự động theo đúng schema dữ liệu của dạng bài này:
                </p>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={7}
                  className="rb-form-input"
                  style={{ width: '100%', fontFamily: 'monospace', fontSize: 12 }}
                />
              </div>
            )}

            {tab === 'smartAi' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="rb-form-row">
                  <label className="rb-form-label">
                    <span>Chủ đề bài học (Topic):</span>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="rb-form-input"
                      style={{ width: '100%' }}
                    />
                  </label>
                </div>

                <div className="rb-form-row">
                  <label className="rb-form-label">
                    <span>Khung trình độ (CEFR Level):</span>
                    <select value={level} onChange={(e) => setLevel(e.target.value)} className="rb-form-select">
                      <option>A1 - Starter / Primary</option>
                      <option>A2 - Pre-intermediate</option>
                      <option>B1 - Intermediate</option>
                      <option>B2 - Upper-intermediate</option>
                    </select>
                  </label>
                </div>

                <div style={{ background: '#eff6ff', padding: '10px 12px', borderRadius: 8, fontSize: 12, color: '#1e40af' }}>
                  💡 AI sẽ tự động tạo bài tập chuẩn hóa phù hợp với định dạng <strong>{groupName}</strong> chủ đề "{topic}" và trình độ {level}.
                </div>
              </div>
            )}

            {tab === 'aiRewrite' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 12.5, color: '#475569' }}>
                  Chọn phong cách viết lại đoạn văn / câu hỏi của bài tập hiện tại:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label className={`rb-choice-box${rewriteMode === 'simplify' ? ' active' : ''}`}>
                    <input
                      type="radio"
                      name="rw"
                      checked={rewriteMode === 'simplify'}
                      onChange={() => setRewriteMode('simplify')}
                    />
                    <div>
                      <strong>Đơn giản hóa câu văn (Simpler English)</strong>
                      <div style={{ fontSize: 11.5, color: '#64748b' }}>Rút ngắn câu phức tạp, thay thế từ khó bằng từ thông dụng A1-A2.</div>
                    </div>
                  </label>

                  <label className={`rb-choice-box${rewriteMode === 'academic' ? ' active' : ''}`}>
                    <input
                      type="radio"
                      name="rw"
                      checked={rewriteMode === 'academic'}
                      onChange={() => setRewriteMode('academic')}
                    />
                    <div>
                      <strong>Nâng cao tính học thuật (More Formal &amp; Natural)</strong>
                      <div style={{ fontSize: 11.5, color: '#64748b' }}>Chỉnh sửa cách dùng từ chuẩn ngữ pháp bản xứ, diễn đạt tự nhiên hơn.</div>
                    </div>
                  </label>

                  <label className={`rb-choice-box${rewriteMode === 'fix' ? ' active' : ''}`}>
                    <input
                      type="radio"
                      name="rw"
                      checked={rewriteMode === 'fix'}
                      onChange={() => setRewriteMode('fix')}
                    />
                    <div>
                      <strong>Sửa lỗi ngữ pháp &amp; chính tả (Grammar &amp; Spelling)</strong>
                      <div style={{ fontSize: 11.5, color: '#64748b' }}>Giữ nguyên ý văn bản nhưng sửa mọi lỗi ngữ pháp tiếng Anh.</div>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="rb-modal-footer">
        {previewResult ? (
          <>
            <button type="button" className="rb-btn-subtle" onClick={() => setPreviewResult(null)}>
              ← Quay lại sửa
            </button>
            <div style={{ flex: 1 }} />
            <button type="button" className="rb-btn-primary" onClick={handleApply}>
              <Check size={15} /> Áp dụng vào bài tập (Apply)
            </button>
          </>
        ) : (
          <>
            <button type="button" className="rb-btn-subtle" onClick={onClose}>
              Hủy bỏ
            </button>
            <div style={{ flex: 1 }} />
            <button type="button" className="rb-btn-primary" onClick={handleGeneratePreview}>
              {tab === 'smartPaste' ? <Wand2 size={15} /> : <Sparkles size={15} />}
              {tab === 'smartPaste' ? 'Phân tích đề bài' : tab === 'smartAi' ? 'Tạo bài tập AI' : 'Xem trước viết lại'}
            </button>
          </>
        )}
      </div>
    </ModalOverlay>
  );
};
export const AudioModal = ({
  mode,
  onClose,
  onSelectTrack,
}: {
  mode: 'add' | 'library' | 'record' | 'trim';
  onClose: () => void;
  onSelectTrack: (title: string, duration: string, src: string) => void;
}) => {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    let timer: number;
    if (recording) {
      timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [recording]);

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);

  const blobToDataUrl = (blob: Blob, done: (src: string) => void) => {
    const reader = new FileReader();
    reader.onerror = () => setError('Không thể đọc dữ liệu âm thanh.');
    reader.onload = () => done(String(reader.result));
    reader.readAsDataURL(blob);
  };

  const startRecording = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Trình duyệt không hỗ trợ ghi âm bằng MediaRecorder.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        blobToDataUrl(blob, (src) => {
          onSelectTrack(`Bản ghi âm ${new Date().toLocaleTimeString('vi-VN')}`, `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`, src);
          onClose();
        });
        stream.getTracks().forEach((track) => track.stop());
      };
      setSeconds(0);
      setRecording(true);
      recorder.start(250);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể truy cập microphone.');
    }
  };

  const stopRecording = () => {
    setRecording(false);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  const useAudioFile = (file: File) => {
    if (!file.type.startsWith('audio/')) { setError('File đã chọn không phải âm thanh hợp lệ.'); return; }
    blobToDataUrl(file, (src) => {
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
        onSelectTrack(file.name, `${Math.floor(duration / 60).toString().padStart(2, '0')}:${Math.floor(duration % 60).toString().padStart(2, '0')}`, src);
        onClose();
      };
      audio.onerror = () => { onSelectTrack(file.name, '--:--', src); onClose(); };
      audio.src = src;
    });
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="rb-modal-header">
        <div className="rb-modal-title-wrap">
          <div className="rb-modal-icon-badge" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            {mode === 'record' ? <Mic size={18} /> : <Headphones size={18} />}
          </div>
          <div>
            <h3 className="rb-modal-title">
              {mode === 'record' ? 'Ghi âm bài giảng (Record Audio)' : mode === 'trim' ? 'Cắt ngắn âm thanh (Trim Audio)' : 'Thư viện âm thanh (Audio Library)'}
            </h3>
            <p className="rb-modal-subtitle">Gắn file nghe vào bài tập phục vụ kỹ năng Listening</p>
          </div>
        </div>
        <button type="button" className="rb-modal-close" onClick={onClose} aria-label="Đóng">
          <X size={18} />
        </button>
      </div>

      <div className="rb-modal-body">
        {mode === 'record' ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: recording ? '#fee2e2' : '#f1f5f9',
                color: recording ? '#dc2626' : '#64748b',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                transition: 'all .2s',
              }}
            >
              <Mic size={32} className={recording ? 'animate-pulse' : ''} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'monospace', color: '#0f172a', marginBottom: 8 }}>
              {Math.floor(seconds / 60).toString().padStart(2, '0')}:{(seconds % 60).toString().padStart(2, '0')}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              {recording ? '🔴 Đang ghi âm giọng đọc trực tiếp từ micro...' : 'Bấm nút bên dưới để bắt đầu ghi âm'}
            </div>
            <button
              type="button"
              className={recording ? 'rb-btn-danger' : 'rb-btn-primary'}
              onClick={() => { if (recording) stopRecording(); else void startRecording(); }}
              style={{ padding: '8px 24px', fontSize: 13 }}
            >
              {recording ? 'Dừng & Lưu vào bài tập' : 'Bắt đầu ghi âm'}
            </button>
            {error && <div role="alert" style={{ marginTop: 10, color: '#b91c1c', fontSize: 12 }}>{error}</div>}
          </div>
        ) : mode === 'trim' ? (
          <div role="status" style={{ padding: 16, color: '#92400e', background: '#fffbeb', borderRadius: 8 }}>
            <Scissors size={15} /> Chưa có bộ xử lý waveform/audio encoder để cắt file thật. Chức năng này được khóa ở Ribbon cho tới khi tích hợp dịch vụ audio.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>DANH SÁCH BÀI NGHE CÓ SẴN:</span>
              <label className="rb-btn-subtle" style={{ fontSize: 11, height: 26, cursor: 'pointer' }}>
                <Upload size={12} /> Tải file MP3 lên
                <input
                  type="file"
                  accept="audio/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) useAudioFile(f);
                  }}
                />
              </label>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', padding: 12, border: '1px dashed #cbd5e1', borderRadius: 8 }}>
              Thư viện chưa được nối với kho file của Flow Bridge Studio. Hãy tải một file audio thật từ thiết bị.
            </div>
            {error && <div role="alert" style={{ color: '#b91c1c', fontSize: 12 }}>{error}</div>}
          </div>
        )}
      </div>
    </ModalOverlay>
  );
};

// ══════════════ 5. THÊM TỪ VỰNG (ADD WORD / IMPORT WORDS) ══════════════
export const WordBankModal = ({
  mode,
  currentWords,
  onClose,
  onSave,
}: {
  mode: 'add' | 'import';
  currentWords: string[];
  onClose: () => void;
  onSave: (newWords: string[]) => void;
}) => {
  const [word, setWord] = useState('');
  const [importText, setImportText] = useState('');

  const handleAddSingle = () => {
    const trimmed = word.trim();
    if (!trimmed) return;
    if (!currentWords.includes(trimmed)) {
      onSave([...currentWords, trimmed]);
    }
    onClose();
  };

  const handleImportBatch = () => {
    const parsed = importText
      .split(/[,;\n\r\t]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);
    const merged = Array.from(new Set([...currentWords, ...parsed]));
    onSave(merged);
    onClose();
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="rb-modal-header">
        <div className="rb-modal-title-wrap">
          <div className="rb-modal-icon-badge info">
            <Plus size={18} />
          </div>
          <div>
            <h3 className="rb-modal-title">
              {mode === 'add' ? 'Thêm từ vào khung từ (Add Word)' : 'Nhập danh sách từ (Import Words)'}
            </h3>
            <p className="rb-modal-subtitle">Quản lý các từ khóa trong khung gợi ý của bài tập</p>
          </div>
        </div>
        <button type="button" className="rb-modal-close" onClick={onClose} aria-label="Đóng">
          <X size={18} />
        </button>
      </div>

      <div className="rb-modal-body">
        {mode === 'add' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label className="rb-form-label">
              <span>Nhập từ vựng mới:</span>
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Ví dụ: strawberry"
                autoFocus
                className="rb-form-input"
                style={{ width: '100%' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSingle();
                }}
              />
            </label>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Hiện có {currentWords.length} từ trong khung: <em>{currentWords.slice(0, 8).join(', ')}{currentWords.length > 8 ? '...' : ''}</em>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button type="button" className="rb-btn-subtle" onClick={onClose}>Hủy</button>
              <button type="button" className="rb-btn-primary" onClick={handleAddSingle}>
                <Plus size={15} /> Thêm từ
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label className="rb-form-label">
              <span>Dán danh sách từ (phân tách bởi dấu phẩy, khoảng trắng hoặc xuống dòng):</span>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={4}
                placeholder="Ví dụ: apple, banana, orange, grape, watermelon"
                autoFocus
                className="rb-form-input"
                style={{ width: '100%', resize: 'vertical' }}
              />
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button type="button" className="rb-btn-subtle" onClick={onClose}>Hủy</button>
              <button type="button" className="rb-btn-primary" onClick={handleImportBatch}>
                <Check size={15} /> Nhập danh sách
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
};
