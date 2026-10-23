// Dịch vụ xuất bài tập sang định dạng Word (.doc / .docx)
// Sử dụng chuẩn HTML MIME tương thích Microsoft Word (như trong flow-bridge-studio docxExportService)
// Sẵn sàng để chuyển vào dự án sau này.

export interface ExerciseItem {
  id: string;
  title: string;
  instructions?: string;
  wordBank?: string[];
  passage?: string;
  contentHtml?: string;
  questions?: Array<{
    number: number;
    text: string;
    options?: string[];
    answer?: string;
  }>;
  clozeQuestions?: Array<{
    number: number;
    options: string[];
  }>;
  statements?: Array<{
    number: number;
    text: string;
    answer?: 'True' | 'False' | 'Not Given';
  }>;
  matchingPairs?: Array<{
    leftNumber: string;
    leftText: string;
    rightLetter: string;
    rightText: string;
  }>;
  pictureItems?: Array<{
    label: string;
    caption: string;
    matchingPrompt?: string;
  }>;
  tableData?: {
    headers: string[];
    rows: string[][];
  };
  sentenceItems?: Array<{
    number: number;
    jumbledWords: string;
    hintInParentheses?: string;
  }>;
}

export interface WorksheetData {
  title: string;
  unit?: string;
  lesson?: string;
  folder?: string;
  exercises: ExerciseItem[];
  page?: {
    orientation?: 'portrait' | 'landscape';
    marginMm?: number;
    fontFamily?: string;
    bodySizePt?: number;
    lineHeight?: string;
    pageColor?: string;
    header?: string;
    footer?: string;
    watermark?: string;
    pageNumber?: boolean;
  };
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sanitizeEditorHtml(html: string): string {
  const template = document.createElement('template');
  template.innerHTML = html;
  template.content.querySelectorAll('script, style, iframe, object, embed, link, meta').forEach((node) => node.remove());
  template.content.querySelectorAll<HTMLElement>('*').forEach((node) => {
    Array.from(node.attributes).forEach((attribute) => {
      if (attribute.name.startsWith('on') || ['contenteditable', 'data-editor-body'].includes(attribute.name)) node.removeAttribute(attribute.name);
      if (['src', 'href'].includes(attribute.name) && /^javascript:/i.test(attribute.value.trim())) node.removeAttribute(attribute.name);
    });
  });
  // Bảng: dồn độ rộng cột (colgroup) xuống từng ô, chuyển float → align, bỏ dấu vết chọn, để Word dựng đúng bố cục
  template.content.querySelectorAll<HTMLTableElement>('table').forEach((table) => {
    ['tbl-sel', 'tbl-active', 'tbl-dragging'].forEach((c) => table.classList.remove(c));
    table.querySelectorAll('.tbl-sel').forEach((cell) => cell.classList.remove('tbl-sel'));
    const widths = Array.from(table.querySelectorAll<HTMLElement>(':scope > colgroup > col')).map((col) => parseFloat(col.style.width));
    if (widths.length && widths.every(Number.isFinite)) {
      let r = 0;
      const covered: number[] = [];
      Array.from(table.rows).forEach((row) => {
        let c = 0;
        Array.from(row.cells).forEach((cell) => {
          while ((covered[c] ?? 0) > r) c += 1;
          const span = cell.colSpan || 1;
          const w = widths.slice(c, c + span).reduce((sum, x) => sum + x, 0);
          if (w) { cell.style.width = `${(w * 0.75).toFixed(1)}pt`; cell.setAttribute('width', String(Math.round(w))); }
          for (let k = 0; k < span; k += 1) covered[c + k] = r + (cell.rowSpan || 1);
          c += span;
        });
        r += 1;
      });
      table.style.width = `${(widths.reduce((sum, x) => sum + x, 0) * 0.75).toFixed(1)}pt`;
    }
    const pos = table.dataset.pos;
    if (pos === 'float-left' || pos === 'float-right') { table.setAttribute('align', pos === 'float-left' ? 'left' : 'right'); table.style.float = pos === 'float-left' ? 'left' : 'right'; }
    table.style.borderCollapse = 'collapse';
    table.querySelectorAll('col, colgroup').forEach((node) => node.remove());
  });
  return template.innerHTML;
}

export async function exportWorksheetToDocx(data: WorksheetData, fileName?: string): Promise<void> {
  const { asBlob } = await import('html-docx-js-typescript');
  const title = data.title || 'Worksheet';
  const subTitle = [data.folder, data.unit, data.lesson].filter(Boolean).join(' • ');
  const page = data.page ?? {};
  const landscape = page.orientation === 'landscape';

  const exercisesHtml = data.exercises.map((ex, idx) => {
    const exNum = idx + 1;
    const wbHtml = ex.wordBank && ex.wordBank.length > 0
      ? `
        <div style="border: 1.5pt solid #1e293b; border-radius: 6pt; padding: 6pt 12pt; margin: 8pt 0 12pt 0; text-align: center; background-color: #f8fafc;">
          <strong style="color: #0f172a; font-size: 10.5pt; letter-spacing: 0.5pt;">${ex.wordBank.map(w => escapeXml(w)).join('&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;')}</strong>
        </div>
      `
      : '';

    const passageHtml = ex.contentHtml
      ? `
        <div style="background-color: #f1f5f9; border-left: 3pt solid #2563eb; padding: 8pt 12pt; margin: 8pt 0 10pt 0; font-size: 11pt; line-height: 1.6;">
          ${sanitizeEditorHtml(ex.contentHtml)}
        </div>
      `
      : ex.passage
      ? `
        <div style="background-color: #f1f5f9; border-left: 3pt solid #2563eb; padding: 8pt 12pt; margin: 8pt 0 10pt 0; font-size: 11pt; line-height: 1.6;">
          ${ex.passage.split('\n').filter(Boolean).map(p => `<p style="margin: 0 0 6pt 0;">${escapeXml(p)}</p>`).join('')}
        </div>
      `
      : '';

    const questionsHtml = ex.questions && ex.questions.length > 0
      ? `
        <div style="margin-top: 8pt;">
          ${ex.questions.map(q => `
            <div style="margin-bottom: 6pt;">
              <strong>${q.number}.</strong> ${escapeXml(q.text)}
              ${q.options && q.options.length > 0 ? `
                <div style="margin-left: 18pt; margin-top: 3pt; color: #334155;">
                  ${q.options.map(opt => escapeXml(opt)).join('&nbsp;&nbsp;&nbsp;&nbsp;')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `
      : '';

    const clozeHtml = ex.clozeQuestions && ex.clozeQuestions.length > 0
      ? `
        <div style="margin-top: 8pt; background-color: #f8fafc; padding: 6pt 10pt; border: 1pt solid #cbd5e1;">
          ${ex.clozeQuestions.map(cq => `
            <div style="margin-bottom: 4pt; font-size: 10.5pt;">
              <strong>(${cq.number})</strong>&nbsp;&nbsp;${cq.options.map(o => escapeXml(o)).join('&nbsp;&nbsp;&nbsp;&nbsp;')}
            </div>
          `).join('')}
        </div>
      `
      : '';

    const statementsHtml = ex.statements && ex.statements.length > 0
      ? `
        <table style="width: 100%; border-collapse: collapse; margin-top: 8pt;">
          ${ex.statements.map(s => `
            <tr style="border-bottom: 1pt dashed #cbd5e1;">
              <td style="padding: 4pt 0;"><strong>${s.number}.</strong> ${escapeXml(s.text)}</td>
              <td style="text-align: right; width: 140pt; color: #1e40af; font-weight: bold; font-size: 9.5pt;">[ TRUE / FALSE / NOT GIVEN ]</td>
            </tr>
          `).join('')}
        </table>
      `
      : '';

    const matchingHtml = ex.matchingPairs && ex.matchingPairs.length > 0
      ? `
        <table style="width: 100%; border-collapse: collapse; margin-top: 8pt;">
          <tr>
            <th style="width: 50%; text-align: left; padding: 4pt; border-bottom: 1.5pt solid #334155;">Column A</th>
            <th style="width: 50%; text-align: left; padding: 4pt; border-bottom: 1.5pt solid #334155;">Column B</th>
          </tr>
          ${ex.matchingPairs.map(p => `
            <tr>
              <td style="padding: 5pt 4pt; border-bottom: 1pt solid #e2e8f0;"><strong>${p.leftNumber}.</strong> ${escapeXml(p.leftText)}</td>
              <td style="padding: 5pt 4pt; border-bottom: 1pt solid #e2e8f0;"><strong>${p.rightLetter}.</strong> ${escapeXml(p.rightText)}</td>
            </tr>
          `).join('')}
        </table>
      `
      : '';

    const pictureHtml = ex.pictureItems && ex.pictureItems.length > 0
      ? `
        <div style="margin-top: 8pt;">
          <table style="width: 100%; border-collapse: collapse; text-align: center;">
            <tr>
              ${ex.pictureItems.map(p => `
                <td style="border: 1pt solid #cbd5e1; padding: 8pt; width: 25%;">
                  <div style="font-size: 14pt; font-weight: bold; color: #2563eb;">[ Picture ${escapeXml(p.label)} ]</div>
                  <div style="font-size: 9pt; color: #475569; margin-top: 4pt;">${escapeXml(p.caption)}</div>
                </td>
              `).join('')}
            </tr>
          </table>
          <div style="margin-top: 8pt;">
            ${ex.pictureItems.filter(p => p.matchingPrompt).map(p => `
              <div style="margin-bottom: 4pt;">${escapeXml(p.matchingPrompt || '')} &nbsp;&nbsp;→ &nbsp; [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]</div>
            `).join('')}
          </div>
        </div>
      `
      : '';

    const tableHtml = ex.tableData && ex.tableData.rows && ex.tableData.rows.length > 0
      ? `
        <table style="width: 100%; border-collapse: collapse; margin-top: 8pt;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              ${ex.tableData.headers.map(h => `<th style="border: 1pt solid #334155; padding: 5pt 8pt; text-align: left;">${escapeXml(h)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${ex.tableData.rows.map(row => `
              <tr>
                ${row.map(cell => `<td style="border: 1pt solid #334155; padding: 5pt 8pt;">${escapeXml(cell)}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
      : '';

    const sentencesHtml = ex.sentenceItems && ex.sentenceItems.length > 0
      ? `
        <div style="margin-top: 8pt;">
          ${ex.sentenceItems.map(s => `
            <div style="margin-bottom: 10pt;">
              <div><strong>${s.number}.</strong> ${escapeXml(s.jumbledWords)} ${s.hintInParentheses ? `<em style="color:#64748b;">${escapeXml(s.hintInParentheses)}</em>` : ''}</div>
              <div style="border-bottom: 1pt dotted #94a3b8; height: 16pt; margin-top: 4pt;">&nbsp;</div>
            </div>
          `).join('')}
        </div>
      `
      : '';

    return `
      <div style="margin-top: 16pt; margin-bottom: 16pt;">
        <div style="font-size: 12pt; font-weight: bold; text-transform: uppercase; color: #1e40af; border-bottom: 1pt solid #cbd5e1; padding-bottom: 3pt; margin-bottom: 6pt;">
          EXERCISE ${exNum}: ${escapeXml(ex.title)}
        </div>
        ${ex.instructions ? `<div style="font-size: 10pt; font-style: italic; color: #475569; margin-bottom: 8pt;">${escapeXml(ex.instructions)}</div>` : ''}
        ${wbHtml}
        ${passageHtml}
        ${questionsHtml}
        ${clozeHtml}
        ${statementsHtml}
        ${matchingHtml}
        ${pictureHtml}
        ${tableHtml}
        ${sentencesHtml}
      </div>
    `;
  }).join('');

  const content = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${escapeXml(title)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 {
      size: ${landscape ? '297mm 210mm' : '210mm 297mm'};
      margin: ${page.marginMm ?? 15}mm;
      mso-header-margin: 10mm;
      mso-footer-margin: 10mm;
      mso-paper-source: 0;
    }
    div.Section1 {
      page: Section1;
    }
    body {
      font-family: ${escapeXml(page.fontFamily ?? 'Arial')}, "Segoe UI", sans-serif;
      font-size: ${page.bodySizePt ?? 11}pt;
      line-height: ${escapeXml(page.lineHeight ?? '1.4')};
      color: #0f172a;
      background: ${escapeXml(page.pageColor ?? '#ffffff')};
    }
    h1 {
      font-size: 16pt;
      font-weight: bold;
      text-transform: uppercase;
      text-align: center;
      margin: 0 0 4pt 0;
      color: #1e3a8a;
    }
    .sub {
      text-align: center;
      font-size: 10pt;
      color: #64748b;
      margin: 0 0 14pt 0;
    }
    .student-box {
      width: 100%;
      border: 1pt solid #cbd5e1;
      padding: 6pt 10pt;
      margin-bottom: 14pt;
      background-color: #f8fafc;
      font-size: 10pt;
    }
  </style>
</head>
<body>
  <div class="Section1">
    ${page.header ? `<div style="font-size:9pt;color:#64748b;border-bottom:1pt solid #cbd5e1;margin-bottom:8pt;">${escapeXml(page.header)}</div>` : ''}
    ${page.watermark ? `<div style="position:absolute;left:25%;top:45%;font-size:48pt;color:#e2e8f0;transform:rotate(-30deg);">${escapeXml(page.watermark)}</div>` : ''}
    <h1>${escapeXml(title)}</h1>
    ${subTitle ? `<div class="sub">${escapeXml(subTitle)}</div>` : ''}

    <table class="student-box" cellpadding="4" cellspacing="0" style="width: 100%; border: 1pt solid #cbd5e1; margin-bottom: 12pt;">
      <tr>
        <td style="width: 50%;"><strong>Name:</strong> ________________________________</td>
        <td style="width: 25%;"><strong>Class:</strong> __________</td>
        <td style="width: 25%;"><strong>Date:</strong> ____________</td>
      </tr>
      <tr>
        <td colspan="2"><strong>Teacher's Remark:</strong> _________________________</td>
        <td><strong>Score:</strong> ______ / 10</td>
      </tr>
    </table>

    ${exercisesHtml}
    ${(page.footer || page.pageNumber) ? `<div style="font-size:9pt;color:#64748b;border-top:1pt solid #cbd5e1;margin-top:10pt;">${escapeXml(page.footer ?? '')}${page.pageNumber ? '<span style="float:right">1</span>' : ''}</div>` : ''}
  </div>
</body>
</html>
  `.trim();

  const generated = await asBlob(content, {
    orientation: landscape ? 'landscape' : 'portrait',
    margins: {
      top: Math.round((page.marginMm ?? 15) * 56.6929),
      right: Math.round((page.marginMm ?? 15) * 56.6929),
      bottom: Math.round((page.marginMm ?? 15) * 56.6929),
      left: Math.round((page.marginMm ?? 15) * 56.6929),
    },
  });
  const blob = generated instanceof Blob
    ? generated
    : new Blob([new Uint8Array(generated).buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const outName = (fileName || `${title.replace(/[\s\/:*?"<>|]+/g, '_')}.docx`).replace(/\.doc$/i, '.docx');
  a.download = outName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
