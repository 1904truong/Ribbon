# RIBBON SPEC – Thanh công cụ kiểu Word dùng chung cho 19 loại bài của AutoWS

Tài liệu này là đặc tả để dựng giao diện thanh Ribbon trong thư mục `Ribbon/`, rồi nối từng chức năng vào 19 loại bài sau.
Nguồn: ảnh thanh công cụ Word (Home, Insert, Design, Layout, References, Mailings, Review, View, Help) + code hiện tại của dự án.

**Quy ước trạng thái** (cột "Hiện có" lấy từ việc đọc code, chưa phải kết quả test):

| Ký hiệu | Nghĩa |
|---|---|
| ✅ | Đã có chức năng thật trong code |
| 🟡 | Có một phần (chỉ một số loại bài, hoặc chỉ theo cả thành phần chứ chưa theo từng từ) |
| ⬜ | Chưa có, cần làm |
| ⛔ | Cố ý bỏ, không đưa vào AutoWS |

**Nguyên tắc:** nút chưa có chức năng thì `disabled` kèm tooltip lý do, không để nút giả. Không có Answer Key, chấm điểm hay chức năng dành cho học sinh.

---

## 0. Bố cục tổng thể

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Title bar: Back to Lesson | Tên worksheet | Chỉ báo lưu | Preview | Save      │
├──────────────────────────────────────────────────────────────────────────────┤
│ Tabs: File | Home | Exercise | Insert | Design | Layout | Review | View | Help │
│       (+ Picture Format / Table Layout: chỉ hiện khi chọn ảnh / bảng)         │
├──────────────────────────────────────────────────────────────────────────────┤
│ Ribbon body: các nhóm nút của tab đang chọn (tên nhóm ở dưới, như Word)       │
├──────────────────────────────────────────────────────────────────────────────┤
│ Vùng soạn: cột trái (nội dung) | trang A4 (Edit Mode)                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

Thứ tự tab đề xuất: **File, Home, Exercise, Insert, Design, Layout, Review, View, Help**.
Tab Word bị bỏ: **References, Mailings** (⛔). Hai tab theo ngữ cảnh: **Picture Format**, **Table Layout**.

Hành vi chung của mọi nút (học từ `ribbonKit.tsx` hiện có):
- Bấm nút không cướp focus / vùng chọn của ô soạn (`onMouseDown → preventDefault`).
- Có tooltip: tên chức năng + phím tắt + lý do nếu bị khóa.
- Có trạng thái active (Bold sáng khi con trỏ nằm trong chữ đậm), xử lý mixed state khi vùng chọn có nhiều định dạng.
- Dropdown dùng `position: fixed` qua portal, không bị cắt; Esc / bấm ngoài thì đóng; ←→ đổi tab, ↑↓ di chuyển trong menu.
- Chế độ Preview: khóa toàn bộ nút chỉnh sửa, chỉ cho View / Print / Export.

---

## 1. Tab FILE

Tab File dùng menu thả dọc kiểu Backstage thay cho nhóm nút ngang. Bấm File để mở/đóng; chọn một lệnh, chuyển sang tab khác, bấm ra ngoài hoặc nhấn Esc thì menu tự đóng.

| Nhóm | Nút | Phím tắt | Hiện có | Ghi chú |
|---|---|---|---|---|
| Save | Save | Ctrl+S | ✅ | `handleSave('stay')` |
| Save | Save & Return to lesson | | ✅ | `handleSave('return')` |
| Save | Save & Add another exercise | | ✅ | `handleSave('add_another')` |
| Export | Export Word (.docx) | | ✅ | `exportWorksheetToDocx` |
| Export | Print / Save as PDF | Ctrl+P | ✅ | `window.print()` |
| Exercise | Duplicate exercise | | ✅ | |
| Exercise | Delete exercise | | ✅ | có xác nhận |
| Navigate | Back to lesson | | ✅ | |
| Info | Document info (tên folder, unit, lesson, số bài, tổng điểm) | | ✅ | modal thông tin + lối tắt Export / Print |
| ⛔ | Share, Sign in, Open, New, Account | | ⛔ | không áp dụng |

## 2. Tab HOME (dùng chung 19 loại bài)

### 2.1 Nhóm Undo / Clipboard
| Nút | Phím tắt | Hiện có | Ghi chú |
|---|---|---|---|
| Undo | Ctrl+Z | ✅ | mỗi editor có stack riêng (snapshot, gộp 500ms) |
| Redo | Ctrl+Y / Ctrl+Shift+Z | ✅ | |
| Paste | Ctrl+V | ✅ | nút Paste đọc Clipboard; có hộp dán dự phòng khi trình duyệt chặn quyền |
| Paste special (chỉ chữ) | Ctrl+Shift+V | ✅ | |
| Cut | Ctrl+X | ✅ | |
| Copy | Ctrl+C | ✅ | |
| Format Painter | | ✅ | lấy định dạng nguồn, sau đó áp lên vùng chọn đích |

### 2.2 Nhóm Font (áp lên TỪ / vùng đang chọn)
| Nút | Phím tắt | Hiện có | Ghi chú |
|---|---|---|---|
| Font family | | ✅ | áp dụng lên vùng chọn và cập nhật theo con trỏ |
| Font size (ô nhập, 6–48pt, bước 0.5) | | ✅ | |
| Increase / Decrease font size (A⁺ A⁻) | Ctrl+> / Ctrl+< | ✅ | |
| Bold | Ctrl+B | ✅ | |
| Italic | Ctrl+I | ✅ | |
| Underline | Ctrl+U | ✅ | |
| Strikethrough | | ✅ | |
| Subscript | Ctrl+= | ✅ | `script: 'sub'` |
| Superscript | Ctrl+Shift+= | ✅ | `script: 'super'` |
| Font color (bảng màu + màu tùy chọn) | | ✅ | |
| Text highlight (tô nền chữ) | | ✅ | |
| Clear all formatting | | ✅ | xóa marks của vùng chọn |
| Change case (Aa) | | ⬜ | tùy chọn: UPPER / lower / Title |
| Text effects (A) | | ⛔ | |

Hành vi bắt buộc:
1. Có vùng chọn → chỉ đổi vùng đó.
2. Chỉ có con trỏ → lưu "định dạng chờ", chữ gõ tiếp mang định dạng đó.
3. Toolbar cập nhật theo định dạng tại con trỏ, mixed state hiển thị trung tính.

### 2.3 Nhóm Paragraph (áp lên ĐOẠN đang chọn)
| Nút | Hiện có | Ghi chú |
|---|---|---|
| Bullets | ✅ | |
| Numbering | ✅ | |
| Decrease indent / Increase indent | ✅ | |
| Align left / center / right | ✅ | |
| Justify | ✅ | |
| Line spacing (1.0–2.5) | ✅ | áp dụng theo đoạn đang chọn |
| Spacing before / after (pt) | ⬜ | |
| Shading (tô nền đoạn) | ✅ | bảng màu + bỏ màu |
| Borders (viền đoạn) | ✅ | toàn bộ / viền dưới / bỏ viền |
| Sort, Show ¶ | ⛔ | |

Khóa ở ô một dòng (tiêu đề, từ trong khung, phương án). Mở ở đoạn dài (passage, transcript, câu hỏi).

### 2.4 Nhóm Styles
| Nút | Hiện có | Ghi chú |
|---|---|---|
| Normal | ✅ | |
| Heading (to, đậm) | ✅ | |
| Subheading (đậm vừa) | ✅ | |
| Title (tiêu đề bài) | ✅ | |
| Instruction (nghiêng) | ✅ | |
| Quote, Emphasis, Strong, Intense… | ⛔ | |

### 2.5 Nhóm Editing
| Nút | Hiện có | Ghi chú |
|---|---|---|
| Find | ✅ | bảng tìm riêng, kết quả trước / sau, Match case |
| Replace | ✅ | thay một kết quả hoặc tất cả |
| Select all | Ctrl+A | ✅ | chọn trong vùng soạn thảo hiện tại |
| Select (đối tượng) | ⬜ | chọn ảnh / bảng / khối bài |

## 3. Tab EXERCISE (đổi theo loại bài đang mở; đặt ngay sau Home)

### 3.1 Nhóm chung (mọi loại bài)
| Nút | Hiện có | Ghi chú |
|---|---|---|
| Smart Paste | ✅ | dán cả đề, tự tách |
| Smart AI | 🟡 | có ở TFNG, True/False, Table, Vocabulary |
| AI Rewrite (viết lại bản dán) | ✅ | `AiRewriteBox`, có hạn mức hằng ngày |
| Insert exercise (lưu và chọn loại bài mới) | ✅ | |
| Exercise title (sửa) | ✅ | |
| Instruction (sửa, bật / tắt) | ✅ | |
| Exercise number | ✅ | |

### 3.2 Nhóm theo loại bài
| Nhóm | Nút riêng | Hiện có |
|---|---|---|
| **A. Khung từ + chỗ trống** | Add word, Import words, Insert blank (a)___, Resequence nhãn, Show/Hide word bank | ✅ (Resequence chỉ Listening) |
| **B. Trắc nghiệm** | Add question, Add option, Import, Shuffle options | ✅ |
| **C. Cloze** | Insert blank, Add question, Shuffle options | ✅ |
| **D. Đúng / Sai / Không có** | Add statement | ✅ |
| **E. Nối chữ** | Add paragraph / idea / word / definition, Add option, Import, Shuffle | ✅ |
| **F. Nối với ảnh** | Add paragraph, Shuffle images, Auto fit to A4 | ✅ |
| **G. Bảng** | Insert row, Insert column, Delete row, Delete column, Add question | ✅ |
| **H. Sắp xếp / đặt câu** | (dùng GrammarMcqEditor với `sentenceMode`) Add question, Import, Shuffle | ✅ |

---

## 4. Tab INSERT

| Nhóm | Nút | Hiện có | Áp dụng cho |
|---|---|---|---|
| Pages | Page break | 🟡 | cờ "bắt đầu bài ở trang mới" |
| Pages | Blank page | ⬜ | |
| Tables | Table (chọn số hàng × cột) | 🟡 | Listening Gap Fill, Listening Table |
| Illustrations | Picture – từ máy | ✅ | loại bài có ảnh |
| Illustrations | Picture – AI image | ✅ | loại bài có ảnh |
| Illustrations | Picture – Gallery | ✅ | Matching Pictures |
| Illustrations | Shapes (hình chữ nhật, elip) | 🟡 | Listening Gap Fill |
| Illustrations | Icons | ⛔ | |
| Illustrations | 3D Models, SmartArt, Chart, Screenshot | ⛔ | |
| Exercise objects | Blank (a)___ | ✅ | nhóm A, C |
| Exercise objects | QR code | ✅ | Gap Filling, Sentence Completion, Listening * |
| Exercise objects | Audio (tải lên / TTS) | ✅ | các loại Listening |
| Links | Link | ⬜ | tùy chọn |
| Header & Footer | Header, Footer | 🟡 | brand header / footer có sẵn, chưa tùy chỉnh trong ribbon |
| Header & Footer | Page number | ⬜ | cần phân trang thật |
| Text | Text box | 🟡 | Listening Gap Fill |
| Text | Horizontal line | 🟡 | Listening Gap Fill |
| Text | WordArt, Drop cap, Quick parts, Signature, Date & Time, Object | ⛔ | |
| Symbols | Symbol (ký tự đặc biệt: ✓ ✗ → ° ½ …) | ⬜ | |
| Symbols | Equation | ⛔ | |
| Add-ins, Media, Comments | tất cả | ⛔ | |

## 5. Tab DESIGN

| Nhóm | Nút | Hiện có | Ghi chú |
|---|---|---|---|
| Document Formatting | Fonts (phông cả bài) | ✅ | `settings.fontFamily` |
| Document Formatting | Paragraph spacing (giãn dòng cả bài) | ✅ | `settings.lineHeight` |
| Document Formatting | Heading size (cỡ tiêu đề) | ✅ | `headingFontSizePt` |
| Document Formatting | Body size (cỡ nội dung) | ✅ | `fontSizePt` |
| Document Formatting | Set as default | ⬜ | lưu thành mặc định cho bài mới |
| Document Formatting | Themes, Colors, Effects, 15 kiểu mẫu | ⛔ | |
| Page Background | Page borders | ⬜ | |
| Page Background | Watermark | ⬜ | tùy chọn |
| Page Background | Page color | ⬜ | tùy chọn (in thường dùng trắng) |
| Branding | Header / footer thương hiệu (logo, level, worksheet no.) | ✅ | `BrandingEditor` |

## 6. Tab LAYOUT

| Nhóm | Nút | Hiện có | Ghi chú |
|---|---|---|---|
| Template | **Layout của loại bài** (thư viện thumbnail) | ✅ | mỗi loại có bộ riêng (`*_LAYOUTS`) |
| Page Setup | Margins | ⬜ | hiện cố định 15mm |
| Page Setup | Orientation (A4 dọc / ngang) | ⬜ | |
| Page Setup | Size | ⬜ | mặc định A4 |
| Page Setup | Columns (1 / 2) | 🟡 | Listening "Chia 2 cột" |
| Page Setup | Breaks (page / column) | 🟡 | |
| Page Setup | Line numbers, Hyphenation | ⛔ | |
| Paragraph | Indent left / right (mm) | ⬜ | |
| Paragraph | Spacing before / after (pt) | ⬜ | |
| Arrange | Position (vị trí ảnh: góc, giữa) | ⬜ | |
| Arrange | Wrap text: Inline / Square / Top & Bottom / Behind / In front | ⬜ | |
| Arrange | Bring forward / Send backward | ⬜ | |
| Arrange | Align (trái / giữa / phải / đều) | ⬜ | |
| Arrange | Group / Ungroup | ⬜ | |
| Arrange | Selection pane (danh sách đối tượng trong trang) | ⬜ | |
| Arrange | Rotate | ⛔ | |
| Show | Hiện / ẩn: tiêu đề bài, hướng dẫn, khung từ, QR, đánh số | ✅ | theo `settings.show*` |

## 7. Tab REVIEW

| Nhóm | Nút | Hiện có | Ghi chú |
|---|---|---|---|
| Proofing | Word count (số từ, số ký tự, số chỗ trống) | ⬜ | |
| Proofing | Spelling & grammar | ⬜ | tùy chọn (tiếng Anh) |
| Speech | Read aloud (đọc đoạn đang chọn) | 🟡 | đã có TTS tạo audio, chưa có nút đọc thử |
| Speech | Generate audio (TTS) | ✅ | `TtsAudioButton` |
| Accessibility | Check readability | ⛔ | |
| Language, Comments, Tracking, Changes, Compare, Protect, Ink | tất cả | ⛔ | |

## 8. Tab VIEW

| Nhóm | Nút | Hiện có | Ghi chú |
|---|---|---|---|
| Views | Edit mode (≈ Print Layout) | ✅ | |
| Views | Preview (≈ Read Mode) | ✅ | |
| Views | Web layout, Outline, Draft | ⛔ | |
| Show | Ruler | ⬜ | |
| Show | Gridlines / layout guides | ⬜ | |
| Show | Navigation pane (danh sách bài / đoạn) | ⬜ | tùy chọn |
| Zoom | Zoom (50–150%) | ✅ | |
| Zoom | 100% | ✅ | |
| Zoom | One page (vừa một trang) | ✅ | `onFitPage` |
| Zoom | Page width | ⬜ | |
| Zoom | Multiple pages | ⬜ | cần phân trang thật |
| Window, Macros, Immersive, Focus, Page Movement | tất cả | ⛔ | |

## 9. Tab HELP
| Nút | Hiện có |
|---|---|
| Help & Guide (màn hướng dẫn) | ✅ |
| Keyboard shortcuts (bảng phím tắt) | ✅ |
| Feedback | ✅ |
| Contact support, Show training | ⛔ |

## 10. Tab PICTURE FORMAT (chỉ hiện khi chọn ảnh)

| Nhóm | Nút | Hiện có |
|---|---|---|
| Adjust | Replace picture (từ máy / AI / Gallery) | 🟡 |
| Adjust | Regenerate AI image | ✅ |
| Adjust | Remove picture | ✅ |
| Size | Width, Height (mm) | ⬜ |
| Size | Lock aspect ratio | ⬜ |
| Size | Reset to original ratio | ⬜ |
| Size | Fit to page width | ⬜ |
| Size | Crop | ⬜ |
| Arrange | Wrap text (5 chế độ), Position, Align, Bring forward / Send backward | ⬜ |
| Style | Border (viền, bo góc), Shadow | ⬜ |
| Accessibility | Alt text | ⬜ |

Tay nắm kéo đổi kích thước (4 góc + 4 cạnh), kéo di chuyển, giữ tỉ lệ khi kéo góc: ⬜.

## 11. Tab TABLE LAYOUT (chỉ hiện khi chọn bảng / ô)

| Nhóm | Nút | Hiện có |
|---|---|---|
| Rows & Columns | Insert row above / below | 🟡 (chỉ Listening Table: chèn dưới) |
| Rows & Columns | Insert column left / right | 🟡 (chỉ chèn phải) |
| Rows & Columns | Delete row / column / table | 🟡 |
| Merge | Merge cells, Split cells | ⬜ |
| Cell size | Row height, Column width, AutoFit (content / page / fixed) | ⬜ |
| Alignment | Cell alignment (9 vị trí), Text direction | ⬜ |
| Table style | Borders, Shading, Cell padding | ⬜ |
| Table style | Header row | ⬜ |
| Position | Align table left / center / right, Table width | ⬜ |
| Data | Sort, Formula | ⛔ |

Phím Tab / Shift+Tab chuyển ô, Tab ở ô cuối thêm hàng mới: ⬜.

---

## 12. Ma trận: tab / nhóm × 19 loại bài

Cột = 19 loại bài. `●` mở đầy đủ, `◐` mở một phần, `—` ẩn hoặc khóa.
Mỗi loại bài và editor tương ứng (đã xác minh từ `ManualExerciseBuilderScreen.tsx`):

| # | Loại bài | Editor | Nhóm Exercise |
|---|---|---|---|
| 1 | listening_gap_fill | ListeningGapFillEditor (engine riêng) | A |
| 2 | listening_multiple_choice | ListeningMcqEditor | B |
| 3 | listening_true_false | ListeningTrueFalseEditor | D |
| 4 | listening_matching | ListeningMatchingEditor | E |
| 5 | listening_table_completion | ListeningTableEditor | G |
| 6 | reading_multiple_choice | ReadingMcqEditor | B |
| 7 | reading_short_answer | ReadingMcqEditor | B |
| 8 | true_false_not_given | TfngEditor | D |
| 9 | matching_headings | MatchingHeadingsEditor | E |
| 10 | matching_information | MatchingEditor (dữ liệu `matching`, 6 layout) | E |
| 11 | matching_vocabulary | MatchingVocabularyEditor | E |
| 12 | matching_pictures | MatchingPicturesEditor | F |
| 13 | grammar_vocab_multiple_choice | GrammarMcqEditor | B |
| 14 | pronunciation_multiple_choice | GrammarMcqEditor (`grammarMcq.pronunciation`) | B |
| 15 | grammar_vocab_cloze | MultipleChoiceClozeEditor | C |
| 16 | gap_filling_word_formation | GapFillingEditor | A |
| 17 | sentence_rearrangement | GrammarMcqEditor (`sentenceMode: 'rearrange'`) | H |
| 18 | sentence_construction | GrammarMcqEditor (`sentenceMode: 'construct'`) | H |
| 19 | sentence_completion | SentenceCompletionEditor | A |

Quy tắc mở nút theo nhóm Exercise:

| Chức năng | A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|---|
| Add word / Import words / Word bank | ● | — | — | — | ◐ (E: word, definition) | — | — | — |
| Insert blank | ● | — | ● | — | — | — | — | — |
| Add question / statement | ◐ (sentence) | ● | ● | ● | — | — | ● | ● |
| Add option | — | ● | ● | — | ● | — | — | — |
| Add paragraph / idea | — | — | — | — | ● | ● | — | — |
| Shuffle | — | ● | ● | — | ● | ● (images) | — | ● |
| Insert / Delete row, column | — | — | — | — | — | — | ● | — |
| Insert picture / AI image | ◐ | ◐ | ● | ● | ◐ (headings) | ● | ● | — |
| QR | ● | — | — | ◐ (Listening) | ◐ (Listening) | — | ◐ | — |
| Audio | ◐ (Listening) | ◐ (Listening) | — | ◐ (Listening) | ◐ (Listening) | — | ● | — |
| Table (Insert → Table) | ● (loại 1) | — | — | — | — | — | ● | — |

Các tab File / Home / Design / Layout (Page Setup) / Review / View / Help: `●` cho cả 19 loại bài; chỉ khác ở việc khóa nút Paragraph ở ô một dòng.

---

## 13. Khác biệt kỹ thuật cần biết khi nối vào 19 loại bài

1. **Hai mô hình định dạng chữ đang song song:**
   - *Theo thành phần* (`textStyles[title | wordBank | passage]`): chọn "Đoạn văn" rồi bấm Bold → cả đoạn đậm. Mọi loại bài trừ Listening Gap Fill.
   - *Theo từng từ* (`marks` / `richMarks`): Listening Gap Fill (engine riêng, `para.marks`) và 12 loại bài dùng `RichEditable` (khóa `richMarks[chữ]`).
   Ribbon mới phải đọc trạng thái từ `useRichSelection()` khi có con trỏ trong ô chữ, và quay về theo thành phần khi không có.
2. **Cloze (#15)** chưa dùng ô chữ chung; **Listening Gap Fill (#1)** có engine riêng. Cần một adapter để ribbon điều khiển được cả hai.
3. **Undo / Redo** mỗi editor tự giữ stack riêng. Ribbon chỉ nhận `{ onUndo, onRedo, canUndo, canRedo }`.
4. **Lưu:** worksheet lưu ở localStorage (`folderStorageService.ts`) sau debounce 600ms trong `App.tsx`. Supabase chỉ dùng cho thư viện, gallery, audio.
5. **Hạn chế đã biết:** hai ô có chữ giống hệt nhau trong cùng một bài dùng chung định dạng từng từ (`richMarks` khóa theo nội dung chữ).
6. **Phân trang:** `WorksheetRenderer` chỉ xếp nguyên bài vào trang, chưa tách nội dung một bài sang trang sau. Các nút Page number, Multiple pages, Margins / Orientation phụ thuộc phần này.

## 14. Giao diện (controller) đề xuất để nối vào từng loại bài sau

```ts
interface RibbonController {
  // Trạng thái đọc để vẽ nút
  exerciseType: ExerciseType;
  selection: 'none' | 'text' | 'paragraph' | 'image' | 'table' | 'block';
  textAttrs: { bold?; italic?; underline?; strike?; script?; color?; highlight?; fontFamily?; fontSizePt? };
  paragraph: { align?; list?; indentMm?; lineHeight? };
  page: { zoom; orientation; margins; layout; previewMode };
  save: 'saved' | 'saving' | 'unsaved';
  undo: { canUndo; canRedo };

  // Lệnh
  applyText(patch): void;  clearFormat(): void;
  applyParagraph(patch): void;
  insert(kind: 'picture' | 'table' | 'textbox' | 'line' | 'blank' | 'qr' | 'audio' | 'pagebreak' | 'symbol'): void;
  exercise: ExerciseCommand[];   // nút riêng của loại bài: { id, label, icon, group, run, disabledReason? }
  save(mode: 'stay' | 'return' | 'add_another'): void;  exportDocx(); print();
  undo(); redo(); setZoom(n); setPreview(b);
}
```

Mỗi loại bài chỉ cần trả về `exercise: ExerciseCommand[]` (nhóm A–H ở mục 3.2) và các hàm xử lý. Phần còn lại của ribbon dùng chung.

## 15. Thứ tự làm đề xuất

1. Dựng giao diện ribbon tĩnh (9 tab + 2 tab ngữ cảnh) với dữ liệu giả, theo mục 0–11.
2. Nối tab File, Home (Font), View vào Gap Filling (`useRichSelection` đã sẵn).
3. Nối tab Exercise cho nhóm A rồi lần lượt B → H.
4. Nối Home (Paragraph), Layout, Design.
5. Làm các nút ⬜ cần kiến trúc: Picture Format, Table Layout, Wrap text, Page number, Margins / Orientation.

---

# PHẦN BỔ SUNG (v2) – những gì thanh tổng còn thiếu để phục vụ 19 loại bài

Các mục dưới đây bổ sung cho mục 3 (tab Exercise), mục 5–6 (Design, Layout) và mục 13–14. Trạng thái dùng cùng ký hiệu ✅ 🟡 ⬜ ⛔. "Hiện có" = đang nằm trong menu More hoặc cột trái của editor, chưa có trên ribbon.

## 16. Tab EXERCISE – nhóm "Cài đặt bài" (theo loại bài)

Hiển thị ngay sau nhóm nút thêm / nhập / xáo trộn ở mục 3.2. Mọi mục là `settings` của dạng bài đó, đổi thì A4 cập nhật ngay.

### 16.1 Nhóm A – Khung từ + chỗ trống (gap_filling, sentence_completion, listening_gap_fill)
| Nút / ô | Kiểu điều khiển | Hiện có | Ghi chú |
|---|---|---|---|
| Độ dài chỗ trống (16–50 mm) | thanh số | ✅ (`blankWidthMm`, trong More) | |
| Kiểu nét chỗ trống | đứt / liền | ⬜ | hiện cố định theo layout |
| Hiện nhãn chỗ trống | (a) / (1) / không nhãn | 🟡 | nhãn nằm trong chữ `(a) ____` |
| Kiểu khung từ | một hàng / lưới 3 cột / hai cột | 🟡 | gắn với layout đang chọn |
| Viền & bo góc khung từ | bật tắt + mm | ⬜ | |
| Hiện / ẩn khung từ | công tắc | ✅ | |
| Gợi ý trong ngoặc (hint) | công tắc | ✅ (sentence_completion) | |
| Resequence nhãn (a, b, c…) | nút | ✅ (Listening) | |

### 16.2 Nhóm B – Trắc nghiệm (reading_mcq, reading_short_answer, listening_mcq, grammar_vocab_mcq, pronunciation_mcq)
| Nút / ô | Kiểu điều khiển | Hiện có |
|---|---|---|
| Kiểu nhãn đáp án | A. / a) / ① | 🟡 |
| Số cột phương án | 1 / 2 / 4 | 🟡 (theo layout) |
| Đáp án bằng hình | công tắc | ✅ (listening_mcq) |
| Gạch chân từ trong câu (`[…]`) | nút | ✅ (pronunciation) |
| Tiêu đề phần (H) trước nhóm câu | nút | ✅ (pronunciation) |
| Số câu bắt đầu từ | ô số | ⬜ |

### 16.3 Nhóm C – Cloze (grammar_vocab_cloze)
| Nút / ô | Hiện có |
|---|---|
| Insert blank, Add question | ✅ |
| Vị trí & độ rộng ảnh | ✅ |
| Kiểu hiển thị lựa chọn dưới đoạn văn | 🟡 |

### 16.4 Nhóm D – Đúng / Sai / Không có (true_false_not_given, listening_true_false)
| Nút / ô | Kiểu điều khiển | Hiện có |
|---|---|---|
| Cột trả lời | T F NG / True False NG / ô tròn | 🟡 (theo layout) |
| Tô màu từ khóa trong tiêu đề (`[[TRUE]]` → đỏ nghiêng) | tự động | ✅ |
| Ảnh minh họa cạnh tiêu đề | công tắc + cao (mm) | ✅ (`showImage`, `imageHeightMm`) |

### 16.5 Nhóm E – Nối chữ (matching_headings, matching_information, matching_vocabulary, listening_matching)
| Nút / ô | Kiểu điều khiển | Hiện có |
|---|---|---|
| Kiểu nhãn cột trái / cột phải | 1,2,3 / a,b,c / A,B,C | 🟡 |
| Khoảng cách hai cột (mm) | thanh số | ⬜ |
| Chiều rộng mỗi cột (%) | thanh số | ⬜ |
| Khoảng cách giữa các dòng | thanh số | ✅ (`rowGapMm` ở vài loại) |
| Chọn layout (6 layout của matching_information) | gallery | ✅ |

### 16.6 Nhóm F – Nối với ảnh (matching_pictures)
| Nút / ô | Hiện có |
|---|---|
| Số ảnh mỗi hàng | 🟡 (theo layout) |
| Cỡ ảnh | ⬜ |
| Hiện / ẩn caption và nhãn ảnh (A–F) | 🟡 |
| Auto fit to A4 | ✅ |
| Shuffle images | ✅ |
| Chọn ảnh từ Gallery | ✅ |

### 16.7 Nhóm G – Bảng (listening_table_completion)
| Nút / ô | Hiện có |
|---|---|
| Header row (hàng đầu in đậm) | ⬜ |
| Số hàng × cột | 🟡 (thêm / xóa từng hàng cột) |
| Đánh dấu ô là chỗ trống | 🟡 |
| Ảnh / bản đồ kèm bảng | ✅ |

### 16.8 Nhóm H – Sắp xếp / đặt câu (sentence_rearrangement, sentence_construction)
| Nút / ô | Hiện có |
|---|---|
| Kiểu hiển thị khối chữ cần sắp xếp | 🟡 (`sentenceMode`) |
| Từ gợi ý trong ngoặc | ✅ |
| Dòng viết câu trả lời (đường kẻ) | 🟡 |

## 17. Tab EXERCISE – nhóm "Worksheet" (thứ tự bài trong cả worksheet)
Có sẵn ở trang Preview & Export; ribbon dùng chung các hàm này.

| Nút | Hiện có |
|---|---|
| Move exercise up / down | ✅ (Preview & Export) |
| Page break before this exercise | ✅ |
| Duplicate / Delete exercise | ✅ |
| Exercise number (huy hiệu số bài) – bật / tắt, số bắt đầu | 🟡 (`exerciseNumber`) |

## 18. Panel thả xuống cần dựng (bản mẫu v1 mới là nút đơn)

| Panel | Nội dung | Nơi dùng |
|---|---|---|
| Bảng màu chữ / tô nền | 10 màu cơ bản + màu mở rộng + "Không màu" + màu tùy chọn | Home → Font |
| Chọn kích thước bảng | lưới 8×8 rê chuột chọn hàng × cột | Insert → Table |
| Thư viện layout | thumbnail cho từng layout của loại bài đang mở (`*_LAYOUTS`) | Layout → Template |
| Chọn phông | danh sách phông, xem trước | Home → Font |
| Line spacing | 1.0 · 1.15 · 1.5 · 2.0 · 2.5 · Tùy chọn… | Home → Paragraph |
| Symbol | lưới ký tự hay dùng (✓ ✗ → ° ½ © ™) | Insert → Symbols |
| Wrap text | 5 chế độ kèm icon | Layout → Arrange |
| Margins | Narrow / Normal / Wide / Custom | Layout → Page Setup |
| Typography defaults | cỡ nội dung, cỡ tiêu đề, giãn dòng, phông cả bài | Design |
| Advanced settings | hiện / ẩn tiêu đề, hướng dẫn, khung từ, QR, ngắt trang | Layout → Show |

## 19. Thành phần giao diện ngoài các tab

| Thành phần | Mô tả | Hiện có |
|---|---|---|
| **Quick Access Toolbar** | Save · Undo · Redo cố định trên thanh tiêu đề, luôn thấy khi đổi tab | ⬜ |
| **Mini toolbar nổi** | hiện cạnh vùng chữ vừa bôi đen: font, cỡ, B / I / U, màu, tô nền, Clear | ⬜ |
| **Menu chuột phải** | Cut · Copy · Paste · Clear formatting; trên ảnh: Replace · Wrap · Remove; trên bảng: Insert row/column · Delete · Merge | ⬜ |
| **Thu gọn ribbon** | nút ⌃ ẩn phần nút, chỉ còn tên tab; bấm tab thì xổ ra | ⬜ |
| **Cuộn ngang khi hẹp** | khi màn hình hẹp các nhóm cuộn ngang, không đẩy trang | 🟡 |
| **Bảng phím tắt** | Help → Keyboard shortcuts: liệt kê phím tắt đang hoạt động | ✅ |
| **Thanh trạng thái dưới trang** | Page 1/1 · số từ · zoom nhanh | ⬜ |
| **Lock Preview** | khóa nút chỉnh sửa, tooltip nói rõ lý do | ✅ |

## 20. Cơ chế dùng chung cho 19 loại bài (bổ sung mục 14)

1. **Adapter** (một file cho mỗi loại bài, trả về dữ liệu cho `RibbonController`):
   ```ts
   interface ExerciseRibbonAdapter {
     type: ExerciseType;
     exerciseCommands(): ExerciseCommand[];        // nút tab Exercise (mục 3.2)
     exerciseSettings(): SettingControl[];         // mục 16.x
     capabilities: { image: boolean; table: boolean; blank: boolean; qr: boolean; audio: boolean; wordBank: boolean };
     layouts: { id: string; label: string; thumb: ReactNode }[];
     textEngine: 'rich-fields' | 'listening-doc' | 'component-style';  // cách định dạng chữ
   }
   ```
2. **Ba "động cơ chữ" hiện có mà ribbon phải hiểu:**
   - `rich-fields`: 12 loại dùng `RichEditable` (`richMarks`, `useRichSelection`).
   - `listening-doc`: Listening Gap Fill (`A4DocHost`, `para.marks`).
   - `component-style`: Cloze (định dạng theo cả thành phần, chưa theo từng từ). Cần chuyển sang `rich-fields` hoặc viết adapter riêng.
3. **Controller duy nhất** cho: Undo/Redo (hợp nhất stack), Save status, `selection` (none / text / paragraph / image / table / block), zoom, preview mode.
4. **Nút tự ẩn / tự khóa** bằng `capabilities` thay vì viết điều kiện riêng từng loại bài.
5. **Cài đặt lưu trong `settings` của từng dạng bài** (không tạo trường mới ngoài `richMarks`), để bài cũ mở ra không đổi.

## 21. Kiểm thử bắt buộc cho thanh tổng

| Loại kiểm thử | Nội dung | Hiện có |
|---|---|---|
| E2E định dạng từ | chọn từ → Bold / màu / cỡ → Save → Reload → Preview | ✅ 12/19 loại (`frontend/e2e/rich-edit.e2e.mjs`, mới test Bold) |
| E2E theo loại bài | mỗi nút tab Exercise của từng nhóm A–H | ⬜ |
| E2E ngữ cảnh | chọn ảnh → hiện Picture Format; chọn bảng → hiện Table Layout; bỏ chọn → tab biến mất | ⬜ |
| Khóa nút | mỗi nút bị khóa phải có tooltip lý do | ⬜ |
| Phím tắt | Ctrl+B/I/U/Z/Y/S, Ctrl+Enter, Tab trong bảng | 🟡 (Ctrl+S) |
| Hồi quy | Smart Paste, Insert Blank, Add Word, Image Manager, Upload, AI Image, Audio, QR, Preview, Export | ⬜ |

## 22. Hạn chế đã biết (phải ghi rõ trong ribbon hoặc tài liệu)
- Hai ô có chữ giống hệt nhau trong cùng một bài dùng chung định dạng từng từ (`richMarks` khóa theo nội dung chữ).
- Phân trang thật (tách nội dung một bài sang trang sau) chưa có, nên Page number, Multiple pages, Margins, Orientation phụ thuộc vào việc làm phân trang.
- Worksheet lưu ở `localStorage`, chưa lên Supabase.

## 23. Tích hợp Help Center vào Flow Bridge Studio

`src/ribbon/HelpCenter.tsx` là component độc lập. Controller mở đúng màn bằng ba command `help`, `shortcuts`, `feedback`; phím `F1` mở hướng dẫn và `Ctrl+/` mở bảng phím tắt.

Khi đưa vào ứng dụng chính:

1. Giữ một state `HelpSection | null` ở component cha và truyền vào `HelpCenter`.
2. Nối ba command trên vào `setHelpSection` như trang demo trong `src/App.tsx`.
3. Thay `onSubmitFeedback` của bản demo bằng hàm gọi API hoặc Supabase. Payload có kiểu `FeedbackPayload`; thông tin chẩn đoán không chứa nội dung worksheet.
4. Import `ribbon.css`; toàn bộ class của Help Center có tiền tố `rb-help-` để không xung đột CSS của ứng dụng.
