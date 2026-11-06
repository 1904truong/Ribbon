# AutoWS Ribbon – báo cáo audit chức năng

Ngày kiểm tra: 2026-10-23

## Kết luận

- Build TypeScript/Vite: **PASS**.
- Playwright E2E: **11/11 PASS**.
- Inventory tĩnh: **192 command ID** được khai báo trên Ribbon; 5 ID là nút cha chỉ mở menu (`tblStyles`, `tblBorders`, `tblBorderColor`, `tblSelect`, `tblPosition`); tất cả command thực thi còn lại đều có controller. **0 command thực thi thiếu handler**.
- Các chức năng cần dịch vụ bên ngoài hoặc không được browser/document model hỗ trợ được khóa và ghi rõ lý do; không báo thành công giả.

## Kiến trúc đã xác nhận

- Ribbon và khai báo lệnh: `src/ribbon/Ribbon.tsx`, `src/ribbon/tabs.ts`.
- Editor: `contentEditable`, lưu `Selection/Range`, áp dụng inline style đúng text node được chọn.
- Document model: `ExerciseBlock[]`; rich text nằm trong `contentHtml`; blank là phần tử có `data-blank-id` và `data-answer`.
- Undo/Redo: snapshot document + rich HTML, tối đa 80 mốc.
- Save/Load: localStorage `autows-ribbon-document-v2`, gồm nội dung, cấu trúc bài và page settings.
- Edit, Preview, Print/PDF và DOCX lấy từ cùng document model.

## Ma trận chi tiết từng nhóm chức năng

| Tab | Chức năng | Trạng thái | Bằng chứng |
|---|---|---|---|
| File | Save; Save & Return; Save & Add another | WORKING | Save/reload rich text + blank + ảnh + layout PASS E2E |
| File | Export Word (.docx) | WORKING | File OOXML ZIP có chữ ký `PK`, PASS E2E |
| File | Print / PDF | WORKING | Gọi print thật; Chromium tạo `%PDF-`; trang giữ 210mm A4, PASS E2E |
| File | Duplicate; Delete exercise; Back to lesson; Document info | WORKING | Controller thay đổi document/modal thật; BUILD PASS |
| Home / Clipboard | Paste rich; Paste text only; Cut; Copy; Format Painter | WORKING | Rich style được giữ, HTML nguy hiểm bị lọc, plain paste không mang format nguồn, PASS E2E |
| Home / Font | Family; Size; Increase/Decrease; Bold; Italic; Underline; Strike; Sub/Superscript; Color; Highlight; Clear | WORKING | Selection-only, combined style, caret style, số `111` ở 48pt, Undo/Redo PASS E2E; size giới hạn 8–48pt |
| Home / Paragraph | Bullets; Numbering; Indent; Outdent; Align 4 kiểu; Line spacing; Shading; Borders | WORKING | Alignment + spacing chỉ tác động paragraph được chọn, PASS E2E |
| Home / Styles | Normal; Title; Subtitle; Heading 1–3 | WORKING | Áp style vào block đang chọn và được serialize; BUILD PASS |
| Home / Editing | Find; Replace one/all; Select all | WORKING | Replace giới hạn trong editor, PASS E2E |
| Exercise A | Add/Import word; Insert Blank; Resequence; Word bank; width/stroke/label/border/hint | WORKING | Structured blank giữ ID/answer; Undo/Redo/Save/Reload PASS E2E |
| Exercise B–H | Add/import/shuffle items; rows/columns; adapter settings | WORKING | Setting ghi vào `ExerciseBlock.options` và render A4; rows/cols/header/cell blank PASS E2E |
| Exercise | Title; Instruction; Number/points; Move; Page break; Duplicate/Delete; Settings modals | WORKING | Thay đổi document state thật; BUILD PASS |
| Exercise / Audio | Upload file; Record microphone; lưu/phát audio | WORKING | File thật/data URL và `MediaRecorder`; phụ thuộc quyền browser |
| Exercise / Audio | Audio Library | PARTIAL | Cho upload file thật; chưa có repository Flow Bridge Studio |
| Exercise / Audio | Trim Audio | DISABLED | Chưa có waveform/audio encoder |
| Exercise / AI | Smart Paste | WORKING | Parser cục bộ và áp dữ liệu thật |
| Exercise / AI | Smart AI; AI Rewrite | DISABLED | Chưa cấu hình workflow/API |
| Insert | Page/column/section break; Blank page; Table | WORKING | Table editable + Preview PASS E2E |
| Insert | Picture device; Gallery; Shapes; Blank; QR; Audio | WORKING | Chèn tại selection; ảnh được lưu/reload PASS E2E; Gallery theo adapter |
| Insert | Header; Footer; Page number; Text box; Line; Link; Symbol | WORKING | Cập nhật page/document state; BUILD PASS |
| Insert | AI Image | DISABLED | Chưa cấu hình dịch vụ tạo ảnh |
| Design | Document font/spacing/sizes; Set default; border; watermark; color; branding | WORKING | Page settings cập nhật A4 và default được load lại; BUILD PASS |
| Layout | Template; margins; orientation; A4; columns; breaks; indent; spacing | WORKING | Cập nhật trang/block thật; A4/PDF PASS E2E |
| Layout | Position; Wrap; Forward/Backward; Align; Rotate | WORKING | Chỉ bật khi có ảnh được chọn; thay đổi style đối tượng thật |
| Layout | Group | DISABLED | Model hiện chỉ chọn một object; khóa để tránh thành công giả |
| Review | Word count; browser spelling; Read Aloud Play/Pause/Stop | WORKING | Dùng nội dung editor và Web Speech API; phụ thuộc browser |
| Review | Comment add/delete/previous/next; Track changes marker | WORKING | Thay đổi/điều hướng marker thật; BUILD PASS |
| Review | Generate Audio TTS | DISABLED | Chưa cấu hình dịch vụ tạo file TTS |
| View | Edit; Preview; Ruler; Gridlines; Navigation pane | WORKING | Preview khóa editor và giữ nội dung, PASS E2E |
| View | Zoom; 100%; One Page; Page Width; Multiple Pages; New Window; Split | WORKING | Thay đổi viewport/cửa sổ thật; BUILD PASS |
| View | Arrange All | DISABLED | Browser không được phép sắp xếp cửa sổ hệ điều hành |
| Help | Help & Guide; Keyboard shortcuts | WORKING | Mở đúng section trong Help Center |
| Help | Feedback | PARTIAL | Lưu cục bộ và nói rõ chưa gửi API; không báo đã gửi thành công |
| Picture Format | Replace/Remove; size/ratio/crop; arrange; border/shadow/alt | WORKING | Thay đổi ảnh được chọn thật; BUILD PASS |
| Picture Format | Regenerate AI image | DISABLED | Ảnh không có workflow AI |
| Table Design/Layout | Styles; borders; shading; rows/cols; merge/split; size; align; padding; position | WORKING | Table engine thao tác DOM/document thật; Insert Table PASS E2E |

## Các lỗi đã sửa trong lượt audit cuối

- Cỡ chữ không còn nhận giá trị bất thường gây mảnh chữ 1pt/111pt; giới hạn 8–48pt và test riêng chuỗi số `111`.
- Rich Copy giữ định dạng của ancestor khi chỉ chọn một phần text node.
- Plain paste và rich paste được tách rõ; HTML clipboard lọc script/event handler/URL nguy hiểm.
- Print CSS không còn ép `width: 100%` hoặc ghi đè lề; `.page` dùng `box-sizing: border-box` và đúng kích thước A4.
- Chèn ảnh dùng selection đã lưu và được bảo toàn qua Save/Reload.
- Navigation Pane ẩn/hiện thật; Set as Default được load khi mở tài liệu mới.
- Record Audio dùng `MediaRecorder`; upload lưu dữ liệu file thật; bỏ timer/track demo giả.
- Smart AI/Rewrite, AI Image, TTS, Trim, Group và Arrange All được khóa có lý do.
- Các setting adapter A–H không còn chỉ hiện toast; đã ghi vào document model và render thật.
- Context menu ảnh đã nối Replace/Wrap/Remove vào controller.

## Test thực tế

`npm run test:e2e`: **11/11 PASS**, gồm:

1. Selection-only + combined formatting.
2. Font size + structured blank + Undo/Redo + Save/Reload.
3. Paragraph alignment + line spacing đúng phạm vi.
4. Cursor formatting.
5. Rich/plain Clipboard + lọc HTML nguy hiểm + Replace.
6. Insert Table + Preview.
7. DOCX thật.
8. Chuỗi số `111` ở font 48pt + Bold Undo/Redo.
9. Save/Reload tổng hợp: Bold + màu + blank + ảnh + alignment.
10. Print/PDF A4 thật.
11. Adapter settings cập nhật bảng/document model thật.

## Giới hạn khi đưa vào Flow Bridge Studio

- Prototype hiện lưu bằng localStorage; khi tích hợp cần thay save adapter bằng API/repository, giữ schema `contentHtml`, structured blank và `pageSettings`.
- Clipboard, microphone và speech phụ thuộc quyền/capability trình duyệt; UI đã có lỗi/fallback phù hợp.
- Cần cung cấp API/workflow thật trước khi mở Smart AI, AI Rewrite, AI Image, TTS và repository Audio Library.
