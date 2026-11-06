import { expect, test, type Page } from '@playwright/test';
import { readFile, stat } from 'node:fs/promises';

const editor = '[data-editor-body]';

async function selectText(page: Page, needle: string) {
  await page.evaluate(({ selector, text }) => {
    const root = document.querySelector<HTMLElement>(selector);
    if (!root) throw new Error('Editor not found');
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode() as Text | null;
    while (node && !node.data.includes(text)) node = walker.nextNode() as Text | null;
    if (!node) throw new Error(`Text not found: ${text}`);
    const start = node.data.indexOf(text);
    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, start + text.length);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  }, { selector: editor, text: needle });
}

async function computedStyleFor(page: Page, needle: string) {
  return page.evaluate(({ selector, text }) => {
    const root = document.querySelector<HTMLElement>(selector)!;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode() as Text | null;
    while (node && !node.data.includes(text)) node = walker.nextNode() as Text | null;
    if (!node?.parentElement) throw new Error(`Text not found: ${text}`);
    const style = getComputedStyle(node.parentElement);
    const decorations: string[] = [];
    let ancestor: HTMLElement | null = node.parentElement;
    while (ancestor && root.contains(ancestor)) {
      const line = getComputedStyle(ancestor).textDecorationLine;
      if (line !== 'none') decorations.push(line);
      ancestor = ancestor.parentElement;
    }
    return { weight: style.fontWeight, style: style.fontStyle, decoration: decorations.join(' '), color: style.color, family: style.fontFamily, size: style.fontSize };
  }, { selector: editor, text: needle });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('tab', { name: 'Home' }).click();
  await page.locator(editor).first().evaluate((element) => {
    element.innerHTML = '<p>The cat is sleeping.</p><p>Second paragraph stays here.</p>';
    element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
  });
});

test('formats only the selected word and preserves combined formatting', async ({ page }) => {
  await selectText(page, 'cat');
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  await selectText(page, 'cat');
  await page.locator('select[title="Font family"]').selectOption('Times New Roman');

  const cat = await computedStyleFor(page, 'cat');
  const sleepingBefore = await computedStyleFor(page, 'sleeping');
  expect(Number(cat.weight)).toBeGreaterThanOrEqual(600);
  expect(cat.family).toContain('Times New Roman');
  expect(Number(sleepingBefore.weight)).toBeLessThan(600);

  await selectText(page, 'sleeping');
  await page.getByRole('button', { name: 'Italic', exact: true }).click();
  await page.getByRole('button', { name: 'Underline', exact: true }).click();
  await page.getByRole('button', { name: 'Font color', exact: true }).click();
  await page.locator('.rb-swatches i[title="#dc2626"]').click();

  const sleeping = await computedStyleFor(page, 'sleeping');
  expect(sleeping.style).toBe('italic');
  expect(sleeping.decoration).toContain('underline');
  expect(sleeping.color).toBe('rgb(220, 38, 38)');
});

test('font size, structured blank, undo/redo and save/reload keep document state', async ({ page }) => {
  await selectText(page, 'cat');
  await page.locator('select[title="Font size"]').selectOption('20');
  expect((await computedStyleFor(page, 'cat')).size).toBe('26.6667px');

  await selectText(page, 'sleeping');
  await page.getByRole('tab', { name: 'Exercise' }).click();
  await page.getByRole('button', { name: /Insert blank/i, exact: true }).click();
  await expect(page.locator(`${editor} [data-blank-id]`)).toHaveCount(1);
  await expect(page.locator(`${editor} [data-blank-id]`)).toHaveAttribute('data-answer', 'sleeping');

  await page.getByTitle('Undo (Ctrl+Z)').click();
  await expect(page.locator(`${editor} [data-blank-id]`)).toHaveCount(0);
  await page.getByTitle('Redo (Ctrl+Y)').click();
  await expect(page.locator(`${editor} [data-blank-id]`)).toHaveCount(1);

  await page.getByTitle('Save (Ctrl+S)').click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('autows-ribbon-document-v2'))).not.toBeNull();
  await expect(page.locator('.badge.saved')).toBeVisible();
  await page.reload();
  await expect(page.locator(`${editor} [data-blank-id]`)).toHaveCount(1);
  expect((await computedStyleFor(page, 'cat')).size).toBe('26.6667px');
});

test('paragraph alignment affects only selected paragraph', async ({ page }) => {
  await selectText(page, 'cat');
  await page.getByRole('button', { name: 'Center', exact: true }).click();
  await selectText(page, 'cat');
  await page.locator('select[title="Line spacing"]').selectOption('2.0');
  const alignments = await page.locator(`${editor} p`).evaluateAll((paragraphs) => paragraphs.map((paragraph) => getComputedStyle(paragraph).textAlign));
  const spacing = await page.locator(`${editor} p`).evaluateAll((paragraphs) => paragraphs.map((paragraph) => Number.parseFloat(getComputedStyle(paragraph).lineHeight) / Number.parseFloat(getComputedStyle(paragraph).fontSize)));
  expect(alignments[0]).toBe('center');
  expect(alignments[1]).not.toBe('center');
  expect(spacing[0]).toBeCloseTo(2, 1);
  expect(spacing[1]).not.toBeCloseTo(2, 1);
});

test('cursor formatting applies only to newly typed text', async ({ page }) => {
  await page.locator(editor).first().evaluate((root) => {
    const paragraph = root.querySelector('p')!;
    const text = paragraph.lastChild!;
    const range = document.createRange();
    range.setStart(text, text.textContent?.length ?? 0);
    range.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  await page.keyboard.type(' NEW');
  const fresh = await computedStyleFor(page, 'NEW');
  const old = await computedStyleFor(page, 'sleeping');
  expect(Number(fresh.weight)).toBeGreaterThanOrEqual(600);
  expect(Number(old.weight)).toBeLessThan(600);
});

test('clipboard and replace operate inside the active editor', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await selectText(page, 'cat');
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  await selectText(page, 'cat');
  await page.getByRole('button', { name: 'Copy', exact: true }).click();
  await page.locator(editor).first().evaluate((root) => {
    const paragraph = root.querySelector('p')!;
    const range = document.createRange();
    range.selectNodeContents(paragraph);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await page.getByRole('button', { name: 'Paste', exact: true }).click();
  await page.locator('.rb-menu').getByRole('button', { name: 'Paste', exact: true }).click();
  await expect(page.locator(editor).first()).toContainText('sleeping.cat');
  const copiedCats = page.locator(`${editor} span`).filter({ hasText: /^cat$/ });
  await expect(copiedCats).toHaveCount(2);
  expect(Number(await copiedCats.last().evaluate((node) => getComputedStyle(node).fontWeight))).toBeGreaterThanOrEqual(600);

  await page.evaluate(async () => {
    const html = '<img src="x" onerror="window.__unsafePaste=true"><script>window.__unsafePaste=true</script><b>SAFE_PASTE</b>';
    await navigator.clipboard.write([new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob(['SAFE_PASTE'], { type: 'text/plain' }),
    })]);
  });
  await page.getByRole('button', { name: 'Paste', exact: true }).click();
  await page.locator('.rb-menu').getByRole('button', { name: 'Paste', exact: true }).click();
  await expect(page.locator(`${editor} script, ${editor} [onerror]`)).toHaveCount(0);
  expect(await page.evaluate(() => (window as Window & { __unsafePaste?: boolean }).__unsafePaste)).not.toBe(true);

  await page.locator(editor).first().evaluate((root) => {
    const paragraph = root.querySelector('p:last-child')!;
    const range = document.createRange();
    range.selectNodeContents(paragraph);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await page.evaluate(async () => {
    await navigator.clipboard.write([new ClipboardItem({
      'text/html': new Blob(['<b>PLAIN_ONLY</b>'], { type: 'text/html' }),
      'text/plain': new Blob(['PLAIN_ONLY'], { type: 'text/plain' }),
    })]);
  });
  await page.getByRole('button', { name: 'Paste', exact: true }).click();
  await page.locator('.rb-menu').getByRole('button', { name: 'Paste text only', exact: true }).click();
  await expect(page.locator(`${editor} b`).filter({ hasText: 'PLAIN_ONLY' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Replace', exact: true }).click();
  await page.locator('.rb-find-body input').nth(0).fill('Second');
  await page.locator('.rb-find-body input').nth(1).fill('Another');
  await page.getByRole('button', { name: 'Replace all', exact: true }).click();
  await expect(page.locator(editor).first()).toContainText('Another paragraph');
});

test('inserted table is editable and preview keeps the same content', async ({ page }) => {
  const before = await page.locator(editor).first().innerText();
  await page.getByRole('tab', { name: 'Insert' }).click();
  await page.getByRole('button', { name: 'Table', exact: true }).click();
  await page.locator('.rb-tgrid i').nth(9).click();
  await expect(page.locator(`${editor} table[data-editor-table="true"]`)).toHaveCount(1);
  await expect(page.locator(`${editor} table[data-editor-table="true"] td`)).toHaveCount(4);

  await page.getByRole('tab', { name: 'View', exact: true }).click();
  await page.getByTestId('ribbon').getByRole('button', { name: 'Preview', exact: true }).click();
  expect(await page.locator(editor).first().innerText()).toContain(before);
  await expect(page.locator(editor).first()).toHaveAttribute('contenteditable', 'false');
});

test('Word export creates a non-empty document file', async ({ page }) => {
  await page.getByRole('tab', { name: 'File' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Word (.docx)', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.docx?$/);
  const path = await download.path();
  expect(path).not.toBeNull();
  expect((await stat(path!)).size).toBeGreaterThan(500);
  expect((await readFile(path!)).subarray(0, 2).toString('ascii')).toBe('PK');
});

test('large numeric text formats correctly and Bold undo redo restores exact state', async ({ page }) => {
  await page.locator(editor).first().evaluate((root) => {
    root.innerHTML = '<p>111 MATCH THE INFORMATION.</p><p>Unselected text remains normal.</p>';
    root.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
  });
  await selectText(page, '111');
  await page.locator('select[title="Font size"]').selectOption('48');
  expect(Number.parseFloat((await computedStyleFor(page, '111')).size)).toBeCloseTo(64, 0);
  expect(Number.parseFloat((await computedStyleFor(page, 'MATCH THE INFORMATION')).size)).toBeLessThan(20);

  await selectText(page, '111');
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  expect(Number((await computedStyleFor(page, '111')).weight)).toBeGreaterThanOrEqual(600);
  await page.getByTitle('Undo (Ctrl+Z)').click();
  expect(Number((await computedStyleFor(page, '111')).weight)).toBeLessThan(600);
  expect(Number.parseFloat((await computedStyleFor(page, '111')).size)).toBeCloseTo(64, 0);
  await page.getByTitle('Redo (Ctrl+Y)').click();
  expect(Number((await computedStyleFor(page, '111')).weight)).toBeGreaterThanOrEqual(600);
});

test('save and reload preserves rich text, blank, image and paragraph layout together', async ({ page }) => {
  await selectText(page, 'cat');
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  await selectText(page, 'sleeping');
  await page.getByRole('button', { name: 'Font color', exact: true }).click();
  await page.locator('.rb-swatches i[title="#dc2626"]').click();
  await selectText(page, 'Second');
  await page.getByRole('button', { name: 'Center', exact: true }).click();
  await selectText(page, 'Second');
  await page.getByRole('tab', { name: 'Exercise' }).click();
  await page.getByRole('button', { name: /Insert blank/i, exact: true }).click();

  await page.locator(editor).first().evaluate((root) => {
    const paragraph = root.querySelector('p:last-child')!;
    const range = document.createRange();
    range.selectNodeContents(paragraph);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await page.getByRole('tab', { name: 'Insert' }).click();
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Picture (from device)', exact: true }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles({
    name: 'pixel.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nWQAAAAASUVORK5CYII=', 'base64'),
  });
  await expect(page.locator(`${editor} img.inserted-image`)).toHaveCount(1);

  await page.getByTitle('Save (Ctrl+S)').click();
  await expect(page.locator('.badge.saved')).toBeVisible();
  await page.reload();
  expect(Number((await computedStyleFor(page, 'cat')).weight)).toBeGreaterThanOrEqual(600);
  expect((await computedStyleFor(page, 'sleeping')).color).toBe('rgb(220, 38, 38)');
  await expect(page.locator(`${editor} [data-blank-id]`)).toHaveAttribute('data-answer', 'Second');
  await expect(page.locator(`${editor} p`).nth(1)).toHaveCSS('text-align', 'center');
  await expect(page.locator(`${editor} img.inserted-image`)).toHaveAttribute('src', /^data:image\/png;base64,/);
});

test('Print PDF command uses the A4 document and Chromium creates a valid PDF', async ({ page }) => {
  await page.evaluate(() => {
    (window as Window & { __printCalled?: boolean }).__printCalled = false;
    window.print = () => { (window as Window & { __printCalled?: boolean }).__printCalled = true; };
  });
  await page.getByRole('tab', { name: 'File' }).click();
  await page.getByRole('button', { name: 'Print / PDF', exact: true }).click();
  expect(await page.evaluate(() => (window as Window & { __printCalled?: boolean }).__printCalled)).toBe(true);

  await page.emulateMedia({ media: 'print' });
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  expect(pdf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  expect(pdf.length).toBeGreaterThan(1_000);
  await expect(page.locator('.page')).toHaveCSS('width', '793.688px');
});

test('exercise adapter settings update the real table document model', async ({ page }) => {
  await page.getByLabel('Loại bài').selectOption('listening_table_completion');
  await page.getByRole('tab', { name: 'Exercise' }).click();

  const rows = page.getByRole('spinbutton', { name: 'Số hàng' });
  const columns = page.getByRole('spinbutton', { name: 'Số cột' });
  await rows.fill('5');
  await rows.press('Tab');
  await columns.fill('4');
  await columns.press('Tab');
  await expect(page.locator('.rb-exercise-table tbody tr')).toHaveCount(5);
  await expect(page.locator('.rb-exercise-table tbody tr').first().locator('td')).toHaveCount(4);

  await page.locator('select[title="Header row"]').selectOption('Không');
  await expect(page.locator('.rb-exercise-table thead')).toHaveCount(0);
  await page.locator('select[title="Ô là chỗ trống"]').selectOption('Có');
  await expect(page.locator('.rb-exercise-table .rb-cell-blank').first()).toBeVisible();
});
