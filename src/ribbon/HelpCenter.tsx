import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  Bug,
  CheckCircle2,
  ExternalLink,
  Keyboard,
  Lightbulb,
  MessageSquare,
  Search,
  Send,
  X,
} from 'lucide-react';

export type HelpSection = 'guide' | 'shortcuts' | 'feedback';

export interface FeedbackPayload {
  category: 'bug' | 'idea' | 'usability' | 'other';
  rating: number;
  message: string;
  includeDiagnostics: boolean;
  diagnostics?: string;
  createdAt: string;
}

interface HelpCenterProps {
  open: boolean;
  section: HelpSection;
  onSectionChange: (section: HelpSection) => void;
  onClose: () => void;
  onSubmitFeedback: (feedback: FeedbackPayload) => void | Promise<void>;
  feedbackSuccessMessage?: string;
}

const GUIDE_TOPICS = [
  {
    id: 'start',
    title: 'Bắt đầu nhanh',
    keywords: 'workflow quy trình tạo bài save lưu',
    content: (
      <ol>
        <li>Chọn loại bài ở cột nội dung rồi nhập hoặc dán dữ liệu.</li>
        <li>Dùng <b>Home</b> để định dạng chữ và đoạn đang chọn.</li>
        <li>Dùng <b>Exercise</b>, <b>Insert</b> và <b>Layout</b> để thêm câu hỏi, ảnh, âm thanh hoặc đổi bố cục.</li>
        <li>Mở <b>View → Preview</b> để kiểm tra, sau đó lưu hoặc xuất bản in.</li>
      </ol>
    ),
  },
  {
    id: 'ribbon',
    title: 'Cách dùng thanh Ribbon',
    keywords: 'tab nút công cụ ribbon contextual ngữ cảnh',
    content: (
      <ul>
        <li>Mỗi tab gom các lệnh cùng mục đích. Rê chuột lên nút để xem mô tả hoặc lý do nút đang bị khóa.</li>
        <li>Nút xám chỉ mở khi đúng đối tượng. Ví dụ, chọn ảnh để hiện tab <b>Picture Format</b>.</li>
        <li>Bấm nút Ribbon không làm mất vùng chữ đang bôi đen.</li>
        <li>Chấm xanh là chức năng hoàn chỉnh, vàng là một phần, xám là đang phát triển.</li>
      </ul>
    ),
  },
  {
    id: 'format',
    title: 'Định dạng nội dung',
    keywords: 'bold italic underline font đoạn văn format định dạng',
    content: (
      <ul>
        <li>Bôi đen chữ trước khi dùng Bold, Italic, Underline, màu chữ hoặc màu nền.</li>
        <li>Các lệnh căn lề, danh sách và giãn dòng áp dụng cho cả đoạn.</li>
        <li>Nếu thao tác nhầm, dùng <b>Ctrl+Z</b>; dùng <b>Ctrl+Y</b> để làm lại.</li>
      </ul>
    ),
  },
  {
    id: 'insert',
    title: 'Ảnh, bảng, audio và QR',
    keywords: 'insert chèn image ảnh table bảng audio qr',
    content: (
      <ul>
        <li>Tab <b>Insert</b> chỉ bật những nội dung phù hợp với loại bài đang mở.</li>
        <li>Sau khi chèn ảnh hoặc bảng, chọn đối tượng để mở tab công cụ ngữ cảnh.</li>
        <li>Audio và QR chỉ khả dụng với các loại bài có hỗ trợ nghe.</li>
      </ul>
    ),
  },
  {
    id: 'preview',
    title: 'Xem trước, lưu và xuất bản',
    keywords: 'preview save export pdf docx print in',
    content: (
      <ul>
        <li>Preview khóa các lệnh chỉnh sửa để bạn kiểm tra bố cục cuối.</li>
        <li><b>Ctrl+S</b> lưu thay đổi; huy hiệu trên thanh tiêu đề cho biết trạng thái lưu.</li>
        <li>Dùng File để in/lưu PDF hoặc xuất DOCX khi đã nối chức năng xuất của ứng dụng chính.</li>
      </ul>
    ),
  },
  {
    id: 'trouble',
    title: 'Xử lý sự cố thường gặp',
    keywords: 'lỗi khóa disabled không hoạt động sự cố',
    content: (
      <ul>
        <li><b>Nút bị khóa:</b> rê chuột lên nút để xem điều kiện còn thiếu.</li>
        <li><b>Định dạng không áp dụng:</b> chọn lại chữ hoặc đặt con trỏ trong vùng soạn thảo.</li>
        <li><b>Bố cục in lệch:</b> trở về Zoom 100% và kiểm tra lại trong Preview.</li>
        <li>Nếu lỗi vẫn còn, gửi phản hồi và bật thông tin chẩn đoán.</li>
      </ul>
    ),
  },
];

const SHORTCUT_GROUPS = [
  {
    title: 'Tệp và điều hướng',
    items: [
      ['Ctrl+S', 'Lưu worksheet'],
      ['Ctrl+P', 'In hoặc lưu PDF'],
      ['F1', 'Mở Help & Guide'],
      ['Ctrl+/', 'Mở bảng phím tắt'],
      ['Esc', 'Đóng cửa sổ hoặc menu đang mở'],
    ],
  },
  {
    title: 'Chỉnh sửa',
    items: [
      ['Ctrl+Z', 'Hoàn tác'],
      ['Ctrl+Y', 'Làm lại'],
      ['Ctrl+X', 'Cắt'],
      ['Ctrl+C', 'Sao chép'],
      ['Ctrl+V', 'Dán'],
      ['Ctrl+Shift+V', 'Dán chỉ văn bản'],
      ['Ctrl+A', 'Chọn tất cả trong vùng soạn thảo'],
      ['Ctrl+F', 'Tìm trong worksheet'],
      ['Ctrl+H', 'Tìm và thay thế'],
    ],
  },
  {
    title: 'Định dạng chữ',
    items: [
      ['Ctrl+B', 'In đậm'],
      ['Ctrl+I', 'In nghiêng'],
      ['Ctrl+U', 'Gạch chân'],
      ['Ctrl+Shift+>', 'Tăng cỡ chữ'],
      ['Ctrl+Shift+<', 'Giảm cỡ chữ'],
      ['Ctrl+=', 'Chỉ số dưới'],
      ['Ctrl+Shift+=', 'Chỉ số trên'],
    ],
  },
];

const HelpGuide = () => {
  const [query, setQuery] = useState('');
  const topics = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi');
    if (!normalized) return GUIDE_TOPICS;
    return GUIDE_TOPICS.filter((topic) => `${topic.title} ${topic.keywords}`.toLocaleLowerCase('vi').includes(normalized));
  }, [query]);

  return (
    <div className="rb-help-guide">
      <label className="rb-help-search">
        <Search size={17} aria-hidden="true" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm trong hướng dẫn…" aria-label="Tìm trong hướng dẫn" />
      </label>
      {topics.length > 0 ? (
        <div className="rb-help-topic-list">
          {topics.map((topic) => (
            <article key={topic.id} className="rb-help-topic">
              <h3>{topic.title}</h3>
              {topic.content}
            </article>
          ))}
        </div>
      ) : (
        <div className="rb-help-empty">Không tìm thấy nội dung phù hợp. Hãy thử từ khóa khác.</div>
      )}
    </div>
  );
};

const ShortcutList = () => (
  <div className="rb-help-shortcuts">
    <p className="rb-help-lead">Các phím tắt dưới đây đang hoạt động trong trình soạn thảo. Trên macOS, dùng ⌘ thay cho Ctrl.</p>
    {SHORTCUT_GROUPS.map((group) => (
      <section key={group.title} className="rb-help-shortcut-group">
        <h3>{group.title}</h3>
        <dl>
          {group.items.map(([keys, description]) => (
            <div key={keys}>
              <dt>{keys.split('+').map((key) => <kbd key={key}>{key}</kbd>)}</dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
      </section>
    ))}
  </div>
);

const FeedbackForm = ({ onSubmit, successMessage }: { onSubmit: HelpCenterProps['onSubmitFeedback']; successMessage: string }) => {
  const [category, setCategory] = useState<FeedbackPayload['category']>('idea');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent'>('idle');
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const clean = message.trim();
    if (clean.length < 10) {
      setError('Vui lòng mô tả ít nhất 10 ký tự.');
      return;
    }
    setError('');
    setStatus('submitting');
    try {
      await onSubmit({
        category,
        rating,
        message: clean,
        includeDiagnostics,
        diagnostics: includeDiagnostics ? `${navigator.userAgent}\n${window.location.href}` : undefined,
        createdAt: new Date().toISOString(),
      });
      setStatus('sent');
    } catch (reason) {
      setStatus('idle');
      setError(reason instanceof Error ? reason.message : 'Không thể gửi phản hồi. Vui lòng thử lại.');
    }
  };

  if (status === 'sent') {
    return (
      <div className="rb-help-feedback-sent" role="status">
        <CheckCircle2 size={42} aria-hidden="true" />
        <h3>Cảm ơn bạn!</h3>
        <p>{successMessage}</p>
        <button type="button" onClick={() => { setMessage(''); setRating(0); setStatus('idle'); }}>Gửi phản hồi khác</button>
      </div>
    );
  }

  return (
    <form className="rb-help-feedback" onSubmit={submit}>
      <p className="rb-help-lead">Ý kiến của bạn giúp Flow Bridge Studio dễ dùng và ổn định hơn.</p>
      <div className="rb-help-feedback-types" role="group" aria-label="Loại phản hồi">
        {([
          ['bug', 'Báo lỗi', Bug],
          ['idea', 'Ý tưởng', Lightbulb],
          ['usability', 'Khó sử dụng', MessageSquare],
          ['other', 'Khác', ExternalLink],
        ] as const).map(([value, label, Icon]) => (
          <button key={value} type="button" className={category === value ? 'on' : ''} aria-pressed={category === value} onClick={() => setCategory(value)}>
            <Icon size={16} aria-hidden="true" />{label}
          </button>
        ))}
      </div>
      <fieldset className="rb-help-rating">
        <legend>Mức độ hài lòng <span>(không bắt buộc)</span></legend>
        <div>
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} type="button" className={rating === value ? 'on' : ''} aria-label={`${value} trên 5`} aria-pressed={rating === value} onClick={() => setRating(value)}>★</button>
          ))}
        </div>
      </fieldset>
      <label className="rb-help-message">
        Mô tả chi tiết
        <textarea
          data-autofocus
          value={message}
          onChange={(event) => { setMessage(event.target.value.slice(0, 2000)); setError(''); }}
          placeholder="Bạn đang gặp vấn đề gì, hoặc muốn cải thiện điều gì?"
          rows={6}
          aria-describedby={error ? 'rb-help-feedback-error' : undefined}
        />
        <span>{message.length}/2000</span>
      </label>
      <label className="rb-help-diagnostics">
        <input type="checkbox" checked={includeDiagnostics} onChange={(event) => setIncludeDiagnostics(event.target.checked)} />
        Đính kèm trình duyệt và địa chỉ trang để dễ chẩn đoán (không gồm nội dung worksheet)
      </label>
      {error && <div id="rb-help-feedback-error" className="rb-help-error" role="alert">{error}</div>}
      <div className="rb-help-feedback-actions">
        <button type="submit" disabled={status === 'submitting'}><Send size={16} aria-hidden="true" />{status === 'submitting' ? 'Đang gửi…' : 'Gửi phản hồi'}</button>
      </div>
    </form>
  );
};

const SECTION_META: Record<HelpSection, { label: string; title: string; description: string; icon: typeof BookOpen }> = {
  guide: { label: 'Hướng dẫn', title: 'Help & Guide', description: 'Hướng dẫn nhanh để soạn và xuất worksheet.', icon: BookOpen },
  shortcuts: { label: 'Phím tắt', title: 'Keyboard shortcuts', description: 'Làm việc nhanh hơn mà không rời bàn phím.', icon: Keyboard },
  feedback: { label: 'Phản hồi', title: 'Feedback', description: 'Báo lỗi hoặc đề xuất cải tiến sản phẩm.', icon: MessageSquare },
};

export const HelpCenter = ({ open, section, onSectionChange, onClose, onSubmitFeedback, feedbackSuccessMessage = 'Phản hồi đã được ghi nhận.' }: HelpCenterProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => {
      const target = dialogRef.current?.querySelector<HTMLElement>('[data-autofocus], button, input, textarea');
      target?.focus();
    });
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [href]'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', keydown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  const meta = SECTION_META[section];
  const HeaderIcon = meta.icon;

  return createPortal(
    <div className="rb-help-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} className="rb-help-dialog" role="dialog" aria-modal="true" aria-labelledby="rb-help-title" aria-describedby="rb-help-description">
        <aside className="rb-help-nav" aria-label="Trung tâm trợ giúp">
          <div className="rb-help-brand"><span>FB</span><div><b>Flow Bridge</b><small>Help Center</small></div></div>
          <nav>
            {(Object.keys(SECTION_META) as HelpSection[]).map((item) => {
              const itemMeta = SECTION_META[item];
              const Icon = itemMeta.icon;
              return <button key={item} type="button" className={section === item ? 'on' : ''} aria-current={section === item ? 'page' : undefined} onClick={() => onSectionChange(item)}><Icon size={17} aria-hidden="true" />{itemMeta.label}</button>;
            })}
          </nav>
          <p>Nhấn <kbd>F1</kbd> để mở hướng dẫn bất cứ lúc nào.</p>
        </aside>
        <section className="rb-help-main">
          <header>
            <div className="rb-help-heading-icon"><HeaderIcon size={21} aria-hidden="true" /></div>
            <div><h2 id="rb-help-title">{meta.title}</h2><p id="rb-help-description">{meta.description}</p></div>
            <button type="button" className="rb-help-close" onClick={onClose} aria-label="Đóng trung tâm trợ giúp" title="Đóng (Esc)"><X size={20} /></button>
          </header>
          <div className="rb-help-content">
            {section === 'guide' && <HelpGuide />}
            {section === 'shortcuts' && <ShortcutList />}
            {section === 'feedback' && <FeedbackForm onSubmit={onSubmitFeedback} successMessage={feedbackSuccessMessage} />}
          </div>
        </section>
      </div>
    </div>,
    document.body,
  );
};
