import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle, BookOpen, Calendar, Clock,
  FileDown, FileText, Folder, Info, Printer,
  Sparkles, Trash2, X
} from 'lucide-react';

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
      <div className="rb-modal-card" role="dialog" aria-modal="true">
        {children}
      </div>
    </div>,
    document.body
  );
};

export interface DocInfoData {
  title: string;
  unit: string;
  lesson: string;
  folder: string;
  exerciseTypeLabel: string;
  exerciseCount: number;
  totalPoints: number;
  estimatedMinutes: number;
  paperSize: string;
  lastSavedText: string;
}

export const DocInfoModal = ({
  data,
  onClose,
  onExportDocx,
  onPrint,
}: {
  data: DocInfoData;
  onClose: () => void;
  onExportDocx?: () => void;
  onPrint?: () => void;
}) => {
  return (
    <ModalOverlay onClose={onClose}>
      <div className="rb-modal-header">
        <div className="rb-modal-title-wrap">
          <div className="rb-modal-icon-badge info">
            <Info size={18} />
          </div>
          <div>
            <h3 className="rb-modal-title">Thông tin tài liệu (Document Info)</h3>
            <p className="rb-modal-subtitle">Chi tiết về bài học, số bài tập và thiết lập in ấn</p>
          </div>
        </div>
        <button type="button" className="rb-modal-close" onClick={onClose} aria-label="Đóng">
          <X size={18} />
        </button>
      </div>

      <div className="rb-modal-body">
        <div className="rb-docinfo-grid">
          <div className="rb-docinfo-item">
            <span className="rb-docinfo-lbl"><FileText size={14} /> Tên Worksheet:</span>
            <span className="rb-docinfo-val font-semibold">{data.title}</span>
          </div>

          <div className="rb-docinfo-item">
            <span className="rb-docinfo-lbl"><Folder size={14} /> Thư mục:</span>
            <span className="rb-docinfo-val">{data.folder}</span>
          </div>

          <div className="rb-docinfo-item">
            <span className="rb-docinfo-lbl"><BookOpen size={14} /> Bài học / Unit:</span>
            <span className="rb-docinfo-val">{data.unit} – {data.lesson}</span>
          </div>

          <div className="rb-docinfo-item">
            <span className="rb-docinfo-lbl"><Sparkles size={14} /> Dạng bài đang chọn:</span>
            <span className="rb-docinfo-val">{data.exerciseTypeLabel}</span>
          </div>

          <div className="rb-docinfo-row-2">
            <div className="rb-docinfo-stat">
              <span className="stat-label">Số bài tập</span>
              <span className="stat-value">{data.exerciseCount} bài</span>
            </div>
            <div className="rb-docinfo-stat">
              <span className="stat-label">Tổng điểm</span>
              <span className="stat-value">{data.totalPoints} pts</span>
            </div>
            <div className="rb-docinfo-stat">
              <span className="stat-label">Thời gian làm</span>
              <span className="stat-value">{data.estimatedMinutes} phút</span>
            </div>
          </div>

          <div className="rb-docinfo-item">
            <span className="rb-docinfo-lbl"><Clock size={14} /> Lần lưu gần nhất:</span>
            <span className="rb-docinfo-val">{data.lastSavedText}</span>
          </div>

          <div className="rb-docinfo-item">
            <span className="rb-docinfo-lbl"><Calendar size={14} /> Khổ trang:</span>
            <span className="rb-docinfo-val">{data.paperSize}</span>
          </div>
        </div>
      </div>

      <div className="rb-modal-footer">
        {onExportDocx && (
          <button
            type="button"
            className="rb-btn-subtle"
            onClick={() => {
              onClose();
              onExportDocx();
            }}
          >
            <FileDown size={15} /> Xuất Word (.docx)
          </button>
        )}
        {onPrint && (
          <button
            type="button"
            className="rb-btn-subtle"
            onClick={() => {
              onClose();
              onPrint();
            }}
          >
            <Printer size={15} /> In / PDF
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button type="button" className="rb-btn-primary" onClick={onClose}>
          Đóng
        </button>
      </div>
    </ModalOverlay>
  );
};

export const DeleteConfirmModal = ({
  exerciseTitle,
  onClose,
  onConfirm,
}: {
  exerciseTitle?: string;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  return (
    <ModalOverlay onClose={onClose}>
      <div className="rb-modal-header">
        <div className="rb-modal-title-wrap">
          <div className="rb-modal-icon-badge danger">
            <Trash2 size={18} />
          </div>
          <div>
            <h3 className="rb-modal-title">Xác nhận xóa bài tập</h3>
            <p className="rb-modal-subtitle">Thao tác này sẽ xóa nội dung bài tập khỏi worksheet</p>
          </div>
        </div>
        <button type="button" className="rb-modal-close" onClick={onClose} aria-label="Đóng">
          <X size={18} />
        </button>
      </div>

      <div className="rb-modal-body">
        <p style={{ margin: '0 0 10px', fontSize: '13.5px', color: '#334155', lineHeight: 1.5 }}>
          Bạn có chắc chắn muốn xóa bài tập <strong>"{exerciseTitle || 'bài tập đang chọn'}"</strong>?
        </p>
        <div className="rb-warning-box">
          <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>Nội dung đã nhập của bài tập này sẽ bị xóa. Bạn có thể sử dụng <strong>Undo (Ctrl+Z)</strong> nếu muốn khôi phục lại.</span>
        </div>
      </div>

      <div className="rb-modal-footer">
        <button type="button" className="rb-btn-subtle" onClick={onClose}>
          Hủy bỏ
        </button>
        <button
          type="button"
          className="rb-btn-danger"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          <Trash2 size={15} /> Xóa bài tập
        </button>
      </div>
    </ModalOverlay>
  );
};

export const BackConfirmModal = ({
  onClose,
  onSaveAndLeave,
  onDiscardAndLeave,
}: {
  onClose: () => void;
  onSaveAndLeave: () => void;
  onDiscardAndLeave: () => void;
}) => {
  return (
    <ModalOverlay onClose={onClose}>
      <div className="rb-modal-header">
        <div className="rb-modal-title-wrap">
          <div className="rb-modal-icon-badge warning">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 className="rb-modal-title">Thay đổi chưa được lưu</h3>
            <p className="rb-modal-subtitle">Bạn có bài tập chưa lưu trước khi quay lại bài học</p>
          </div>
        </div>
        <button type="button" className="rb-modal-close" onClick={onClose} aria-label="Đóng">
          <X size={18} />
        </button>
      </div>

      <div className="rb-modal-body">
        <p style={{ margin: 0, fontSize: '13.5px', color: '#334155', lineHeight: 1.5 }}>
          Nếu rời khỏi trang mà không lưu, các thay đổi vừa chỉnh sửa sẽ bị mất. Bạn muốn làm gì?
        </p>
      </div>

      <div className="rb-modal-footer">
        <button type="button" className="rb-btn-subtle" onClick={onClose}>
          Ở lại tiếp tục sửa
        </button>
        <button
          type="button"
          className="rb-btn-danger-ghost"
          onClick={() => {
            onDiscardAndLeave();
            onClose();
          }}
        >
          Bỏ qua thay đổi
        </button>
        <button
          type="button"
          className="rb-btn-primary"
          onClick={() => {
            onSaveAndLeave();
            onClose();
          }}
        >
          Lưu &amp; Quay lại
        </button>
      </div>
    </ModalOverlay>
  );
};
