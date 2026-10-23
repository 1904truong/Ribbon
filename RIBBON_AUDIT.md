# AutoWS Ribbon audit

Ngày kiểm tra: 2026-10-23

## Kiến trúc đã xác nhận

- Ribbon: `src/ribbon/Ribbon.tsx`, khai báo lệnh tại `src/ribbon/tabs.ts`.
- Editor: `contentEditable` có selection/range được lưu trong `App.tsx`.
- Document model: `ExerciseBlock[]`, rich HTML của từng bài nằm trong `contentHtml`; blank là phần tử có `data-blank-id` và `data-answer`.
- Undo/Redo: snapshot document model + rich HTML, tối đa 80 mốc.
- Save/Load: localStorage `autows-ribbon-document-v2`, gồm nội dung rich text và page settings.
- Preview/Print/DOCX dùng cùng dữ liệu editor. DOCX được đóng gói OOXML (ZIP), không còn là HTML giả đuôi `.docx`.
- Inventory tĩnh: 176 command ID trên UI, 188 controller case, 0 command UI thiếu controller.

## Kết quả theo tab

| Tab | Function | Before | After | Test result |
|---|---|---|---|---|
| Home | Font/selection | Font Size phụ thuộc `<font size=7>`; trạng thái chỉ đọc anchor | CSS áp đúng text node trong selection, hỗ trợ nhiều thẻ, mixed state, caret formatting | PASS E2E |
| Home | Combined formatting | Có thể mất Underline khi bấm sau Italic | Bold/Italic/Underline/Color cùng tồn tại trên một vùng | PASS E2E |
| Home | Clipboard | Fallback chỉ giữ plain text | Clipboard API ghi HTML + text, fallback `execCommand`, paste HTML được lọc | PASS E2E |
| Home | Paragraph | Có handler nhưng chưa chứng minh phạm vi | Alignment chỉ tác động paragraph được chọn | PASS E2E |
| Home | Find/Replace | Panel đã có | Replace All giới hạn trong A4 editor | PASS E2E |
| Exercise | Insert Blank | Chuỗi `[_________]` | Structured blank có ID/answer/style; undo/redo/save/reload giữ nguyên | PASS E2E |
| Exercise | Manage/tools | Nhiều handler mô phỏng | Add/move/duplicate/delete/settings/word bank/table tools thay đổi document state | BUILD; cần test từng adapter khi tích hợp |
| Insert | Table | Chỉ toast mô phỏng | Chèn bảng thật, ô editable, hỗ trợ hàng/cột và Table Layout | PASS E2E |
| Insert | Picture/QR/objects | Nhiều mục partial/todo | File image, QR thật, text box, shape, link, symbol, break, header/footer/page number | BUILD; cần manual browser test |
| Design | Document/page | Chưa nối | Font/spacing/size/default/border/watermark/color/branding cập nhật A4 | BUILD |
| Layout | Page/paragraph/arrange | Phần lớn todo | Margin/orientation/A4/columns/break/indent/spacing và image arrange đã nối | BUILD |
| Review | Proofing/speech/comments | Phần lớn todo/partial | Word count, browser spellcheck, Read Aloud Play/Pause/Stop, comments, track marker | BUILD; speech phụ thuộc browser |
| View | Edit/Preview/Zoom | Một phần | Preview khóa editor, giữ nội dung; ruler/grid/nav/zoom modes hoạt động | PASS E2E |
| File | Save/Reload | Chỉ đổi badge thành công | Lưu thật, báo lỗi thật, khôi phục rich HTML/page settings | PASS E2E |
| File | Export Word | HTML MIME `.doc` | DOCX OOXML tải xuống, giữ rich HTML/blank/image/page settings trong giới hạn converter | PASS E2E (`PK`) |
| File | Print/PDF | Gọi print | CSS print A4, page/section break, tránh cắt exercise | BUILD |
| Help | Guide/shortcuts/feedback | Đã có modal | Giữ nguyên; feedback lưu local demo và mô tả rõ chưa gửi backend | BUILD |
| Contextual | Picture/Table Format | Phần lớn todo | Size/ratio/wrap/position/style/alt và row/column/merge/split/style/alignment | BUILD |

## Dịch vụ cố ý không báo hoàn thành

- AI Assist / AI Image: disabled với lý do chưa cấu hình workflow/API.
- Generate Audio (TTS): disabled với lý do chưa có dịch vụ tạo file audio.
- `Read Aloud` vẫn dùng Web Speech API của trình duyệt và có Play/Pause/Stop.

## Test đã chạy

- `npm run test:e2e`: 7/7 PASS.
- `npm run build`: PASS (`tsc -b && vite build`).
- E2E bao phủ selection-only formatting, combined formatting, caret formatting, structured blank + undo/redo + save/reload, paragraph scope, Clipboard + Replace, Insert Table + Preview, DOCX thật.

## Giới hạn tích hợp

- Prototype lưu localStorage. Khi đưa vào Flow Bridge Studio cần thay adapter lưu bằng API/repository của dự án, giữ nguyên schema `contentHtml`/structured blank.
- Các thao tác phụ thuộc quyền trình duyệt (Clipboard, microphone, speech) có thể bị chặn; UI có fallback hoặc thông báo lỗi.
- Các lệnh chỉ được ghi PASS khi có E2E ở bảng trên; mục BUILD đã compile nhưng chưa được tuyên bố kiểm thử hành vi đầy đủ trên mọi adapter.
