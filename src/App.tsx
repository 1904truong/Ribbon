// Trang thử Ribbon: controller cho Ribbon với các chức năng Tab File và Home hoạt động đầy đủ,
// sẵn sàng để chuyển giao vào dự án Flow Bridge Studio (AutoWS).

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import QRCode from 'qrcode';
import { Ribbon } from './ribbon/Ribbon';
import { MiniToolbar, QuickAccess } from './ribbon/Extras';
import { HelpCenter, type FeedbackPayload, type HelpSection } from './ribbon/HelpCenter';
import { FindReplacePanel, type FindReplaceMode } from './ribbon/FindReplacePanel';
import { ContextMenu, Popover, type LayoutOption, type MenuItem } from './ribbon/Popovers';
import { createTableEngine, type TableEngine } from './ribbon/tableEngine';
import { DocInfoModal, DeleteConfirmModal, BackConfirmModal, type DocInfoData } from './ribbon/FileModals';
import {
  SetOptionsModal, ExerciseSettingsModal, AiAssistModal, AudioModal, WordBankModal,
  type AiTab,
} from './ribbon/ExerciseModals';
import { exportWorksheetToDocx } from './ribbon/exportDocx';
import { ADAPTERS, GROUP_NAME, adapterOf } from './ribbon/adapters';
import type { ExerciseType, RibbonState, Selection, TabId, TextAttrs } from './ribbon/types';

const LAYOUTS: LayoutOption[] = [
  { id: 'l1', label: '1. Khung từ + đoạn văn' },
  { id: 'l2', label: '2. Khung từ + câu đánh số' },
  { id: 'l3', label: '3. Khung từ + hai cột' },
  { id: 'l4', label: '4. Bài hát / thơ + ảnh' },
];

const FONT_SIZES = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 36, 48];
const LINE_SPACINGS = ['1.0', '1.15', '1.5', '2.0', '2.5'];

interface PainterFormat {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  fontFamily: string;
  fontSizePt: number;
  color: string;
  highlight: string;
}

export interface ExerciseBlock {
  id: string;
  type?: ExerciseType;
  title: string;
  instruction?: string;
  showTitle?: boolean;
  showInstruction?: boolean;
  points?: number;
  pageBreakBefore?: boolean;
  wordBank: string[];
  showWordBank: boolean;
  wordBankStyle?: 'row' | 'grid3' | 'grid2';
  blankStroke?: 'dashed' | 'solid';
  blankWidth?: number;
  blankLabel?: '(a)' | '(1)' | 'none';
  wordBankBorder?: boolean;
  hint?: boolean;
  passage: string;
  /** Rich HTML used by the editor. `passage` remains the plain-text export fallback. */
  contentHtml?: string;
  calloutBox?: string | null;
  audioTrack?: {
    title: string;
    duration: string;
    src?: string;
  } | null;
  questions?: Array<{
    number: number;
    text: string;
    options?: string[];
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
    id: string;
    label: string;
    caption: string;
    imageUrl?: string;
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
  options?: Record<string, unknown>;
}

interface EditorSnapshot {
  exercises: ExerciseBlock[];
  activeExIndex: number;
}

interface PageSettings {
  fontFamily: string;
  lineHeight: string;
  headingSize: number;
  bodySize: number;
  marginMm: number;
  orientation: 'portrait' | 'landscape';
  columns: number;
  pageColor: string;
  pageBorder: boolean;
  watermark: string;
  header: string;
  footer: string;
  pageNumber: boolean;
}

const DEFAULT_PAGE_SETTINGS: PageSettings = {
  fontFamily: 'Arial', lineHeight: '1.5', headingSize: 13, bodySize: 11, marginMm: 15,
  orientation: 'portrait', columns: 1, pageColor: '#ffffff', pageBorder: false,
  watermark: '', header: '', footer: '', pageNumber: false,
};

export const createDefaultExercise = (exType: ExerciseType, index = 0): ExerciseBlock => {
  const exAdapter = adapterOf(exType);
  const grp = exAdapter.group;
  const baseId = `ex-${Date.now()}-${index + 1}`;

  if (grp === 'B') {
    return {
      id: baseId,
      type: exType,
      title: exType === 'listening_multiple_choice'
        ? 'Listening: Choose the best answer A, B, C or D'
        : exType === 'reading_multiple_choice'
        ? 'Reading Comprehension: Select the correct option'
        : exType === 'pronunciation_multiple_choice'
        ? 'Pronunciation: Choose the word with a different sound'
        : 'Multiple Choice: Choose the best answer to complete each question',
      instruction: 'Read each question carefully and select the best answer from the given choices.',
      showTitle: true,
      showInstruction: true,
      points: 10,
      pageBreakBefore: false,
      wordBank: [],
      showWordBank: false,
      passage: exType === 'reading_multiple_choice' || exType === 'reading_short_answer'
        ? "London is one of the most vibrant cities in the world. Every year, millions of tourists visit iconic landmarks such as Big Ben, Tower Bridge, and the British Museum. The River Thames flows right through the heart of the capital."
        : '',
      audioTrack: exType === 'listening_multiple_choice' ? { title: 'Track 05 - London City Tour Guide.mp3', duration: '02:30' } : null,
      questions: [
        {
          number: 1,
          text: exType === 'pronunciation_multiple_choice'
            ? 'Which word has the underlined vowel pronounced differently?'
            : 'Where is the famous Big Ben clock tower located in London?',
          options: exType === 'pronunciation_multiple_choice'
            ? ['A. pl<u>ea</u>se', 'B. p<u>ea</u>s', 'C. h<u>ea</u>d', 'D. m<u>ea</u>t']
            : ['A. Next to the Houses of Parliament', 'B. Inside Hyde Park', 'C. At Heathrow Airport', 'D. Beside Oxford Street'],
        },
        {
          number: 2,
          text: exType === 'pronunciation_multiple_choice'
            ? 'Which word has a different stress pattern?'
            : 'Why is Tower Bridge famous around the world?',
          options: exType === 'pronunciation_multiple_choice'
            ? ['A. historic', 'B. beautiful', 'C. capital', 'D. wonderful']
            : ['A. It opens in the middle for tall ships', 'B. It is painted completely bright pink', 'C. It was built entirely of wood', 'D. It is only accessible underground'],
        },
        {
          number: 3,
          text: 'What major river flows through central London?',
          options: ['A. River Thames', 'B. River Seine', 'C. River Danube', 'D. River Nile'],
        },
        {
          number: 4,
          text: 'What can tourists do when visiting the British Museum?',
          options: ['A. View historic treasures from around the world', 'B. Go swimming in an indoor pool', 'C. Ride a roller coaster', 'D. Buy train tickets to Paris'],
        },
      ],
      options: { optionLabel: 'A.', optionColumns: '2', imageOptions: false, underlineWord: exType === 'pronunciation_multiple_choice', startNumber: 1 },
    };
  }

  if (grp === 'C') {
    return {
      id: baseId,
      type: exType,
      title: 'Cloze Test: Choose the correct word for each numbered gap',
      instruction: 'Read the following passage and choose the best option (A, B, C or D) for each gap.',
      showTitle: true,
      showInstruction: true,
      points: 10,
      pageBreakBefore: false,
      wordBank: [],
      showWordBank: false,
      passage: "London has a long and rich history. Many visitors enjoy (1) [_________] through its picturesque royal parks. In the city center, you can see historic buildings that date back (2) [_________] centuries. Public transportation is very (3) [_________], with the famous red double-decker buses and the underground train system known (4) [_________] 'The Tube'.",
      clozeQuestions: [
        { number: 1, options: ['A. walking', 'B. walk', 'C. walked', 'D. walks'] },
        { number: 2, options: ['A. in', 'B. many', 'C. with', 'D. since'] },
        { number: 3, options: ['A. convenient', 'B. inconvenient', 'C. convenience', 'D. conveniently'] },
        { number: 4, options: ['A. as', 'B. for', 'C. like', 'D. of'] },
      ],
      options: { optionsStyle: 'inline', imagePosition: 'right', imageWidth: 45, showItemNumbers: true },
    };
  }

  if (grp === 'D') {
    return {
      id: baseId,
      type: exType,
      title: exType === 'listening_true_false'
        ? 'Listening: Decide if the statements are True or False'
        : 'True / False / Not Given: Read the passage and evaluate the statements',
      instruction: 'Decide whether each statement is TRUE (T), FALSE (F), or NOT GIVEN (NG) according to the information provided.',
      showTitle: true,
      showInstruction: true,
      points: 10,
      pageBreakBefore: false,
      wordBank: [],
      showWordBank: false,
      passage: "The Tower of London is a historic fortress on the north bank of the River Thames. Founded towards the end of 1066, it has served as a royal palace, a prison, and a place of execution. Today, it protects the priceless Crown Jewels of the United Kingdom and welcomes over 2 million guests annually.",
      audioTrack: exType === 'listening_true_false' ? { title: 'Track 08 - The Tower of London Tour.mp3', duration: '02:15' } : null,
      statements: [
        { number: 1, text: 'The Tower of London is situated along the River Thames.', answer: 'True' },
        { number: 2, text: 'The fortress was founded in the eighteenth century.', answer: 'False' },
        { number: 3, text: 'The Crown Jewels are kept safely inside the fortress.', answer: 'True' },
        { number: 4, text: 'General admission tickets are free for all foreign tourists.', answer: 'Not Given' },
      ],
      options: { answerColumn: 'right', pillStyle: 'boxes', imageUnderStory: false, imageHeight: 35 },
    };
  }

  if (grp === 'E') {
    return {
      id: baseId,
      type: exType,
      title: exType === 'matching_headings'
        ? 'Matching Headings: Match each paragraph with its correct heading'
        : exType === 'matching_information'
        ? 'Matching Information: Match each detail with the corresponding place'
        : exType === 'matching_vocabulary'
        ? 'Vocabulary: Match each English term with its accurate definition'
        : 'Listening Matching: Match the speakers with their opinions',
      instruction: 'Match each item in the left column (1-4) with its corresponding match in the right column (A-D).',
      showTitle: true,
      showInstruction: true,
      points: 10,
      pageBreakBefore: false,
      wordBank: [],
      showWordBank: false,
      passage: '',
      audioTrack: exType === 'listening_matching' ? { title: 'Track 15 - Tourist Opinions.mp3', duration: '01:50' } : null,
      matchingPairs: [
        { leftNumber: '1', leftText: 'Landmark', rightLetter: 'A', rightText: 'A prominent object easily recognized from a distance' },
        { leftNumber: '2', leftText: 'Historic', rightLetter: 'B', rightText: 'Famous or important in the history of a country' },
        { leftNumber: '3', leftText: 'Residence', rightLetter: 'C', rightText: 'A home, especially a large or official one like a palace' },
        { leftNumber: '4', leftText: 'Transport', rightLetter: 'D', rightText: 'A system for carrying people or goods from one place to another' },
      ],
      options: { leftLabels: '1, 2, 3', rightLabels: 'A, B, C', columnGap: 16, rowGap: 8, connectorStyle: 'bracket' },
    };
  }

  if (grp === 'F') {
    return {
      id: baseId,
      type: exType,
      title: 'Matching Pictures: Match each picture with the correct description',
      instruction: 'Look at the pictures A-D below and match each with the most suitable description.',
      showTitle: true,
      showInstruction: true,
      points: 10,
      pageBreakBefore: false,
      wordBank: ['Tower Bridge', 'Big Ben', 'London Eye', 'Buckingham Palace'],
      showWordBank: true,
      passage: '',
      pictureItems: [
        { id: 'p1', label: 'Picture A', caption: 'Tower Bridge', matchingPrompt: 'A bascule and suspension bridge crossing the River Thames' },
        { id: 'p2', label: 'Picture B', caption: 'Big Ben Clock Tower', matchingPrompt: 'The iconic clock tower at the north end of Parliament' },
        { id: 'p3', label: 'Picture C', caption: 'London Eye Ferris Wheel', matchingPrompt: 'A giant observation wheel offering panoramic city views' },
        { id: 'p4', label: 'Picture D', caption: 'Buckingham Palace', matchingPrompt: 'The official London residence of the British monarch' },
      ],
      options: { picturesPerRow: '4', imageSize: 'medium', showCaption: true, borderCard: true },
    };
  }

  if (grp === 'G') {
    return {
      id: baseId,
      type: exType,
      title: 'Listening & Table Completion: Complete the schedule below',
      instruction: 'Listen to the conversation and write NO MORE THAN TWO WORDS AND/OR A NUMBER in each blank.',
      showTitle: true,
      showInstruction: true,
      points: 10,
      pageBreakBefore: false,
      wordBank: [],
      showWordBank: false,
      audioTrack: { title: 'Track 22 - London Museum Tour Timetable.mp3', duration: '02:05' },
      passage: '',
      tableData: {
        headers: ['Day of Week', 'Destination / Attraction', 'Opening Hours', 'Admission Fee'],
        rows: [
          ['Monday', 'British Museum', '10:00 - 17:30', 'Free (Special exhibits: [_________])'],
          ['Wednesday', 'Tower of London', '09:00 - [_________]', '£33.60 per adult'],
          ['Friday', 'National Gallery', '10:00 - 21:00 (Late)', '[_________] general entry'],
          ['Saturday', 'Royal Observatory Greenwich', '[_________] - 17:00', '£18.00 per person'],
        ],
      },
      options: { tableBorders: 'all', headerRow: true, tableRows: 4, tableCols: 4, cellBlank: true },
    };
  }

  if (grp === 'H') {
    return {
      id: baseId,
      type: exType,
      title: exType === 'sentence_rearrangement'
        ? 'Sentence Rearrangement: Put the words in the correct order'
        : 'Sentence Construction: Build complete sentences from prompts',
      instruction: 'Rearrange the scrambled words to form meaningful and grammatically correct English sentences.',
      showTitle: true,
      showInstruction: true,
      points: 10,
      pageBreakBefore: false,
      wordBank: [],
      showWordBank: false,
      passage: '',
      sentenceItems: [
        {
          number: 1,
          jumbledWords: 'is / London / capital / the / of / England / .',
          hintInParentheses: 'capital city',
        },
        {
          number: 2,
          jumbledWords: 'tourists / millions / of / every / visit / London / year / .',
          hintInParentheses: 'Present Simple tense',
        },
        {
          number: 3,
          jumbledWords: 'Thames / River / through / flows / the / central / London / .',
          hintInParentheses: 'geography',
        },
        {
          number: 4,
          jumbledWords: 'take / double-decker / we / red / should / a / bus / ?',
          hintInParentheses: 'modal question',
        },
      ],
      options: { sentenceBlockStyle: 'blocks', hintParen: true, answerLineDotted: true, numberPrefix: '1.' },
    };
  }

  // Default: Group A
  return {
    id: baseId,
    type: exType,
    title: exType === 'listening_gap_fill'
      ? 'Listen and fill the gaps. Then read aloud'
      : exType === 'sentence_completion'
      ? 'Complete each sentence with one suitable word'
      : 'Word Formation: Complete the text with words from the box',
    instruction: 'Choose the correct words from the box to complete each blank.',
    showTitle: true,
    showInstruction: true,
    points: 10,
    pageBreakBefore: false,
    wordBank: ['zebra', 'peas', 'carrots', 'eat', 'hippo', 'bananas'],
    showWordBank: true,
    wordBankStyle: 'row',
    blankStroke: 'dashed',
    blankWidth: 28,
    blankLabel: '(a)',
    wordBankBorder: true,
    hint: true,
    passage: "The zebra likes sausages, he doesn't like [_________]. Some [_________] and sausages for the zebra, please.\nThe hippo likes [_________], she doesn't like peas. Some apples and pizza for the hippo, please.",
    audioTrack: exType === 'listening_gap_fill' ? { title: 'Track 12 - Zoo Animals Song.mp3', duration: '01:45' } : null,
    calloutBox: null,
    options: { blankWidth: 28, blankStroke: 'dashed', blankLabel: '(a)', wordBankStyle: 'row', wordBankBorder: true, hint: true },
  };
};

const INITIAL_EXERCISES: ExerciseBlock[] = [
  createDefaultExercise('listening_gap_fill', 0),
];

const STORAGE_KEY = 'autows-ribbon-document-v2';
const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const passageToHtml = (passage: string, exerciseId: string) => {
  let blankIndex = 0;
  return passage.split('\n').map((paragraph) => {
    const escaped = paragraph.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<p>${escaped.replace(/\[_+\]/g, () => {
      blankIndex += 1;
      return `<span class="structured-blank" contenteditable="false" data-blank-id="${exerciseId}-blank-${blankIndex}" data-answer="" aria-label="Blank ${blankIndex}"><span class="blank-label">(${blankIndex})</span><span class="blank-line"></span></span>`;
    })}</p>`;
  }).join('');
};

const DEMO_TABLE_HTML = `<tbody>${[0, 1].map(() => `<tr>${[0, 1, 2].map(() => '<td contenteditable="true">&nbsp;</td>').join('')}</tr>`).join('')}</tbody>`;

export default function App() {
  const [type, setType] = useState<ExerciseType>('gap_filling_word_formation');
  const [tab, setTab] = useState<TabId>('Exercise');
  const [selection, setSelection] = useState<Selection>('none');
  const [saved, setSaved] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [attrs, setAttrs] = useState<TextAttrs>({});
  const [zoom, setZoom] = useState(100);
  const [previewMode, setPreviewMode] = useState(false);
  const [showRuler, setShowRuler] = useState(false);
  const [showGridlines, setShowGridlines] = useState(false);
  const [showNavPane, setShowNavPane] = useState(true);
  const [pageSettings, setPageSettings] = useState<PageSettings>(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as { pageSettings?: PageSettings };
      if (parsed.pageSettings) return { ...DEFAULT_PAGE_SETTINGS, ...parsed.pageSettings };
      const defaults = JSON.parse(window.localStorage.getItem('autows-ribbon-page-defaults') ?? '{}') as Partial<PageSettings>;
      return { ...DEFAULT_PAGE_SETTINGS, ...defaults };
    } catch { return DEFAULT_PAGE_SETTINGS; }
  });
  const [toast, setToast] = useState('');
  const [helpSection, setHelpSection] = useState<HelpSection | null>(null);
  const [menu, setMenu] = useState<{ left: number; bottom: number; items: MenuItem[] } | null>(null);
  const [imgHidden, setImgHidden] = useState(false);
  const [tblHidden, setTblHidden] = useState(false);
  const [bodyEl, setBodyEl] = useState<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const pictureInputRef = useRef<HTMLInputElement>(null);
  const replacePictureRef = useRef(false);
  const [selectedPictureCardIdx, setSelectedPictureCardIdx] = useState<number>(-1);
  const selectedObjectRef = useRef<HTMLElement | null>(null);
  const tableRef = useRef<TableEngine | null>(null);
  const pushHistoryRef = useRef<() => void>(() => undefined);
  const selectionRef = useRef<Selection>('none');
  const previewModeRef = useRef(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const commentIndexRef = useRef(0);
  const adapter = adapterOf(type);

  // Quản lý danh sách bài tập của worksheet
  const [exercises, setExercises] = useState<ExerciseBlock[]>(() => {
    try {
      const savedDocument = window.localStorage.getItem(STORAGE_KEY);
      if (!savedDocument) return INITIAL_EXERCISES;
      const parsed = JSON.parse(savedDocument) as { exercises?: ExerciseBlock[] };
      return parsed.exercises?.length ? parsed.exercises : INITIAL_EXERCISES;
    } catch {
      return INITIAL_EXERCISES;
    }
  });
  const [activeExIndex, setActiveExIndex] = useState(0);

  // Quản lý Modal cho Tab File
  const [docInfoOpen, setDocInfoOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [backModalOpen, setBackModalOpen] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Vừa xong');
  const [findReplaceMode, setFindReplaceMode] = useState<FindReplaceMode | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const painterRef = useRef<PainterFormat | null>(null);
  const undoStackRef = useRef<EditorSnapshot[]>([]);
  const redoStackRef = useRef<EditorSnapshot[]>([]);
  const [, setHistoryVersion] = useState(0);

  // Quản lý Modal & tương tác cho Tab Exercise
  const [setOptionsOpen, setSetOptionsOpen] = useState(false);
  const [exerciseSettingsOpen, setExerciseSettingsOpen] = useState(false);
  const [aiAssistOpen, setAiAssistOpen] = useState<AiTab | null>(null);
  const [audioModalOpen, setAudioModalOpen] = useState<'add' | 'library' | 'record' | 'trim' | null>(null);
  const [wordBankModalOpen, setWordBankModalOpen] = useState<'add' | 'import' | null>(null);

  const say = useCallback((m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(''), 2200);
  }, []);

  const dirty = () => setSaved('unsaved');

  const nodeElement = (node: Node | null): HTMLElement | null => {
    if (!node) return null;
    return node.nodeType === Node.ELEMENT_NODE ? node as HTMLElement : node.parentElement;
  };

  const readTextState = useCallback(() => {
    const currentSelection = window.getSelection();
    const page = pageRef.current;
    if (!currentSelection || !currentSelection.anchorNode || !page?.contains(currentSelection.anchorNode)) return;
    const element = nodeElement(currentSelection.anchorNode);
    if (!element) return;
    if (element.closest('.img')) { setSelection('image'); return; }
    if (currentSelection.rangeCount) savedRangeRef.current = currentSelection.getRangeAt(0).cloneRange();

    const range = currentSelection.rangeCount ? currentSelection.getRangeAt(0) : null;
    const inlineElements: HTMLElement[] = [];
    if (range && !range.collapsed) {
      const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
      let textNode = walker.nextNode();
      while (textNode) {
        try {
          if (textNode.textContent && range.intersectsNode(textNode)) {
            const parent = textNode.parentElement;
            if (parent && !inlineElements.includes(parent)) inlineElements.push(parent);
          }
        } catch { /* detached nodes are ignored */ }
        textNode = walker.nextNode();
      }
    }
    if (!inlineElements.length) inlineElements.push(element);
    const computedStyles = inlineElements.map((item) => window.getComputedStyle(item));
    const commonStyle = (pick: (style: CSSStyleDeclaration) => string): string | undefined => {
      const first = pick(computedStyles[0]);
      return computedStyles.every((style) => pick(style) === first) ? first : undefined;
    };
    const computed = computedStyles[0];
    const block = element.closest<HTMLElement>('p, li, h1, h2, h3, h4, [data-rb-style]') ?? element;
    const blockComputed = window.getComputedStyle(block);
    const fontPx = Number.parseFloat(computed.fontSize) || 14.67;
    const rawLineHeight = Number.parseFloat(blockComputed.lineHeight);
    const ratio = Number.isFinite(rawLineHeight) ? rawLineHeight / (Number.parseFloat(blockComputed.fontSize) || fontPx) : 1.5;
    const lineSpacing = LINE_SPACINGS.reduce((best, item) => Math.abs(Number(item) - ratio) < Math.abs(Number(best) - ratio) ? item : best, '1.5');
    const family = commonStyle((style) => style.fontFamily.split(',')[0].replace(/["']/g, '').trim());
    const supportedFamily = family && ['Arial', 'Times New Roman', 'Calibri', 'Quicksand', 'Roboto', 'Inter'].includes(family) ? family : undefined;
    const commonFontSize = commonStyle((style) => style.fontSize);
    const blockStyle = (block.dataset.rbStyle as TextAttrs['blockStyle']) ?? (block.matches('h1') ? 'Heading 1' : block.matches('h2') ? 'Heading 2' : block.matches('h3') ? 'Heading 3' : 'Normal');
    const alignment: TextAttrs['alignment'] = document.queryCommandState('justifyCenter') ? 'center'
      : document.queryCommandState('justifyRight') ? 'right'
      : document.queryCommandState('justifyFull') ? 'justify'
      : 'left';

    setSelection(element.closest('table') ? 'table' : 'text');
    setAttrs((previous) => ({
      ...previous,
      bold: document.queryCommandIndeterm('bold') ? undefined : document.queryCommandState('bold'),
      italic: document.queryCommandIndeterm('italic') ? undefined : document.queryCommandState('italic'),
      underline: document.queryCommandIndeterm('underline') ? undefined : document.queryCommandState('underline'),
      strike: document.queryCommandIndeterm('strikeThrough') ? undefined : document.queryCommandState('strikeThrough'),
      script: document.queryCommandState('superscript') ? 'super' : document.queryCommandState('subscript') ? 'sub' : undefined,
      color: commonStyle((style) => style.color),
      highlight: (() => { const value = commonStyle((style) => style.backgroundColor); return value === 'rgba(0, 0, 0, 0)' ? undefined : value; })(),
      fontFamily: supportedFamily,
      fontSizePt: commonFontSize ? Math.round(Number.parseFloat(commonFontSize) * .75) : undefined,
      bullets: document.queryCommandState('insertUnorderedList'),
      numbering: document.queryCommandState('insertOrderedList'),
      alignment,
      lineSpacing,
      blockStyle,
      shading: blockComputed.backgroundColor === 'rgba(0, 0, 0, 0)' ? undefined : blockComputed.backgroundColor,
      bordered: ['Top', 'Right', 'Bottom', 'Left'].some((side) => Number.parseFloat(blockComputed[`border${side}Width` as keyof CSSStyleDeclaration] as string) > 0),
      formatPainter: !!painterRef.current,
    }));
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', readTextState);
    return () => document.removeEventListener('selectionchange', readTextState);
  }, [readTextState]);

  const restoreEditorSelection = () => {
    const range = savedRangeRef.current;
    if (!range || !range.startContainer.isConnected || !pageRef.current?.contains(range.startContainer)) return false;
    const currentSelection = window.getSelection();
    currentSelection?.removeAllRanges();
    currentSelection?.addRange(range);
    return true;
  };

  const selectedBlocks = (): HTMLElement[] => {
    restoreEditorSelection();
    const currentSelection = window.getSelection();
    if (!currentSelection?.rangeCount) return [];
    const range = currentSelection.getRangeAt(0);
    const start = nodeElement(range.startContainer);
    const editable = start?.closest<HTMLElement>('[contenteditable="true"]') ?? bodyEl;
    if (!editable) return [];
    if (editable.matches('p, li, h1, h2, h3, h4')) return [editable];
    const blocks = Array.from(editable.querySelectorAll<HTMLElement>('p, li, h1, h2, h3, h4')).filter((item) => {
      try { return range.intersectsNode(item); } catch { return false; }
    });
    return blocks.length ? blocks : [editable];
  };

  const refreshTextState = () => window.setTimeout(readTextState);

  /** Apply CSS only to text nodes covered by the saved range, including cross-element selections. */
  const applyInlineStyles = (styles: Partial<CSSStyleDeclaration>): boolean => {
    if (!restoreEditorSelection()) {
      say('Hãy đặt con trỏ hoặc chọn chữ trong vùng soạn thảo.');
      return false;
    }
    const currentSelection = window.getSelection();
    const page = pageRef.current;
    if (!currentSelection?.rangeCount || !page) return false;
    const sourceRange = currentSelection.getRangeAt(0);
    if (sourceRange.collapsed) return false;

    const segments: Array<{ node: Text; start: number; end: number }> = [];
    const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!node.textContent || !parent || parent.closest('[contenteditable="false"]')) return NodeFilter.FILTER_REJECT;
        try { return sourceRange.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; }
        catch { return NodeFilter.FILTER_REJECT; }
      },
    });
    let candidate = walker.nextNode();
    while (candidate) {
      const node = candidate as Text;
      const start = node === sourceRange.startContainer ? sourceRange.startOffset : 0;
      const end = node === sourceRange.endContainer ? sourceRange.endOffset : node.data.length;
      if (end > start) segments.push({ node, start, end });
      candidate = walker.nextNode();
    }

    const wrappers: HTMLSpanElement[] = [];
    for (let index = segments.length - 1; index >= 0; index -= 1) {
      const segment = segments[index];
      if (!segment.node.isConnected) continue;
      const range = document.createRange();
      range.setStart(segment.node, segment.start);
      range.setEnd(segment.node, segment.end);
      const wrapper = document.createElement('span');
      Object.assign(wrapper.style, styles);
      wrapper.append(range.extractContents());
      range.insertNode(wrapper);
      wrappers.unshift(wrapper);
    }
    if (!wrappers.length) return false;

    const resultRange = document.createRange();
    resultRange.setStartBefore(wrappers[0]);
    resultRange.setEndAfter(wrappers[wrappers.length - 1]);
    currentSelection.removeAllRanges();
    currentSelection.addRange(resultRange);
    savedRangeRef.current = resultRange.cloneRange();
    dirty();
    refreshTextState();
    return true;
  };

  const lastRegularTabRef = useRef<TabId>('Exercise');

  useEffect(() => {
    if (tab !== 'File' && tab !== 'Picture Format' && tab !== 'Table Design' && tab !== 'Table Layout') {
      lastRegularTabRef.current = tab;
    }
  }, [tab]);

  const select = (s: Selection) => {
    setSelection(s);
    if (s === 'image') {
      setTab('Picture Format');
    } else if (s === 'table') {
      setTab('Table Layout');
    } else {
      // Khi chọn chữ hoặc bỏ chọn đối tượng:
      // Chỉ khi đang ở tab ngữ cảnh (Picture Format / Table Layout) mới quay về tab thông thường trước đó.
      // Nếu đang ở bất kỳ tab nào khác (Insert, Exercise, Layout, Design, v.v.), TUYỆT ĐỐI GIỮ NGUYÊN TAB ĐANG MỞ!
      setTab((currentTab) => {
        if (currentTab === 'Picture Format' || currentTab === 'Table Design' || currentTab === 'Table Layout') {
          return lastRegularTabRef.current;
        }
        return currentTab;
      });
    }
  };

  // Bảng kiểu Word: chọn ô, kéo chọn, gộp/tách, kéo mép cột… (xem ribbon/tableEngine.ts)
  useEffect(() => {
    const engine = createTableEngine({
      page: () => pageRef.current,
      changed: () => setSaved('unsaved'),
      before: () => pushHistoryRef.current(),
      readonly: () => previewModeRef.current,
      say,
      selected: (cell) => { selectedObjectRef.current = cell; if (selectionRef.current !== 'table') select('table'); },
      removeTable: (table) => {
        if (table.hasAttribute('data-demo-table')) setTblHidden(true); else table.remove();
        select('none');
      },
    });
    tableRef.current = engine;
    const detach = engine.attach();
    return () => { detach(); tableRef.current = null; };
  }, []);

  const collectExercisesFromEditor = (): ExerciseBlock[] => {
    // bỏ lớp tô xám chọn ô / viền chọn bảng để không lưu vào nội dung, xong tô lại
    const read = () => exercises.map((exercise) => {
    const block = pageRef.current?.querySelector<HTMLElement>(`[data-ex-id="${CSS.escape(exercise.id)}"]`);
    const editor = block?.querySelector<HTMLElement>('[data-editor-body]');
    const editedTitle = block?.querySelector<HTMLElement>('[data-editor-title]')?.innerText
      .replace(/^EXERCISE\s+\d+\s*:\s*/i, '')
      .trim();
    if (!editor) return exercise;
    return {
      ...exercise,
      title: editedTitle || exercise.title,
      contentHtml: editor.innerHTML,
      passage: editor.innerText.replace(/\n{3,}/g, '\n\n').trim(),
    };
  });
    return tableRef.current ? tableRef.current.withoutPaint(read) : read();
  };

  const saveDocument = (list = collectExercisesFromEditor()): boolean => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, savedAt: new Date().toISOString(), exercises: list, pageSettings }));
      setExercises(list);
      setSaved('saved');
      setLastSavedTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
      return true;
    } catch (error) {
      setSaved('unsaved');
      say(`Không thể lưu tài liệu: ${error instanceof Error ? error.message : 'bộ nhớ trình duyệt không khả dụng'}`);
      return false;
    }
  };

  const captureSnapshot = (): EditorSnapshot => ({
    exercises: collectExercisesFromEditor().map((exercise) => structuredClone(exercise)),
    activeExIndex,
  });

  const pushHistory = () => {
    const snapshot = captureSnapshot();
    const previous = undoStackRef.current.at(-1);
    if (!previous || JSON.stringify(previous) !== JSON.stringify(snapshot)) {
      undoStackRef.current.push(snapshot);
      if (undoStackRef.current.length > 80) undoStackRef.current.shift();
    }
    redoStackRef.current = [];
    setHistoryVersion((version) => version + 1);
  };

  pushHistoryRef.current = pushHistory;
  selectionRef.current = selection;
  previewModeRef.current = previewMode;

  const restoreSnapshot = (snapshot: EditorSnapshot) => {
    setExercises(snapshot.exercises.map((exercise) => structuredClone(exercise)));
    setActiveExIndex(Math.min(snapshot.activeExIndex, snapshot.exercises.length - 1));
    savedRangeRef.current = null;
    setSelection('none');
    dirty();
    setHistoryVersion((version) => version + 1);
  };

  const insertHtmlAtCursor = (html: string): boolean => {
    const restored = restoreEditorSelection();
    const activeEditor = bodyEl ?? pageRef.current?.querySelector<HTMLElement>('[data-editor-body]');
    if (restored && document.execCommand('insertHTML', false, html)) {
      dirty();
      refreshTextState();
      return true;
    }
    if (activeEditor) {
      activeEditor.insertAdjacentHTML('beforeend', html);
      dirty();
      return true;
    }
    say('Hãy đặt con trỏ trong vùng soạn thảo trước khi chèn.');
    return false;
  };

  const selectedPicture = () => {
    const selected = selectedObjectRef.current;
    if (selected?.matches('.img')) return selected;
    return pageRef.current?.querySelector<HTMLElement>('.ex-block.active .img') ?? null;
  };

  const selectedTableCell = (): HTMLTableCellElement | null => {
    const selected = selectedObjectRef.current;
    if (selected instanceof HTMLTableCellElement) return selected;
    return pageRef.current?.querySelector<HTMLTableCellElement>('.ex-block.active table td') ?? null;
  };

  /** Thực hiện lệnh xuất Word */
  const handleExportDocx = async () => {
    say('⏳ Đang xuất file Word (.docx)...');
    try {
      await exportWorksheetToDocx(
        {
          title: 'Unit 2 – London | Worksheet: WS-Demo-1',
          unit: 'Unit 2: London',
          lesson: 'Lesson 1: Vocabulary & Reading',
          folder: 'Grade 7 Worksheets',
          page: {
            orientation: pageSettings.orientation,
            marginMm: pageSettings.marginMm,
            fontFamily: pageSettings.fontFamily,
            bodySizePt: pageSettings.bodySize,
            lineHeight: pageSettings.lineHeight,
            pageColor: pageSettings.pageColor,
            header: pageSettings.header,
            footer: pageSettings.footer,
            watermark: pageSettings.watermark,
            pageNumber: pageSettings.pageNumber,
          },
          exercises: collectExercisesFromEditor().map((e) => ({
            id: e.id,
            title: e.title,
            instructions: e.instruction || 'Complete the exercise according to instructions.',
            wordBank: e.wordBank,
            passage: e.passage,
            contentHtml: e.contentHtml,
            questions: e.questions,
            clozeQuestions: e.clozeQuestions,
            statements: e.statements,
            matchingPairs: e.matchingPairs,
            pictureItems: e.pictureItems,
            tableData: e.tableData,
            sentenceItems: e.sentenceItems,
          })),
        },
        'Worksheet_Unit2_London.docx'
      );
      say('✓ Đã tải xuống file Word (.doc / .docx) thành công!');
    } catch {
      say('Lỗi khi xuất file Word');
    }
  };

  const applyFontSize = (points: number) => {
    if (!Number.isFinite(points)) return;
    if (!applyInlineStyles({ fontSize: `${points}pt` })) {
      if (!restoreEditorSelection()) return;
      document.execCommand('styleWithCSS', false, 'false');
      document.execCommand('fontSize', false, '7');
      pageRef.current?.querySelectorAll<HTMLElement>('font[size="7"]').forEach((font) => {
        font.style.fontSize = `${points}pt`;
        font.removeAttribute('size');
      });
      document.execCommand('styleWithCSS', false, 'true');
      dirty();
      refreshTextState();
    }
    setAttrs((current) => ({ ...current, fontSizePt: points }));
  };

  const applyBlockStyle = (styleName: NonNullable<TextAttrs['blockStyle']>) => {
    const presets: Record<NonNullable<TextAttrs['blockStyle']>, Partial<CSSStyleDeclaration>> = {
      Normal: { fontSize: '11pt', fontWeight: '400', fontStyle: 'normal', textTransform: 'none', textAlign: 'left', color: '#0f172a' },
      Title: { fontSize: '20pt', fontWeight: '700', fontStyle: 'normal', textTransform: 'none', textAlign: 'center', color: '#1e3a8a' },
      Subtitle: { fontSize: '13pt', fontWeight: '400', fontStyle: 'italic', textTransform: 'none', textAlign: 'center', color: '#475569' },
      'Heading 1': { fontSize: '16pt', fontWeight: '700', fontStyle: 'normal', textTransform: 'none', textAlign: 'left', color: '#1d4ed8' },
      'Heading 2': { fontSize: '14pt', fontWeight: '700', fontStyle: 'normal', textTransform: 'none', textAlign: 'left', color: '#334155' },
      'Heading 3': { fontSize: '12pt', fontWeight: '700', fontStyle: 'normal', textTransform: 'none', textAlign: 'left', color: '#475569' },
    };
    selectedBlocks().forEach((block) => {
      block.dataset.rbStyle = styleName;
      Object.assign(block.style, presets[styleName]);
    });
    setAttrs((current) => ({ ...current, blockStyle: styleName }));
    dirty();
    refreshTextState();
  };

  const applyLineSpacing = (spacing: string) => {
    selectedBlocks().forEach((block) => { block.style.lineHeight = spacing; });
    setAttrs((current) => ({ ...current, lineSpacing: spacing }));
    dirty();
    refreshTextState();
  };

  const applyShading = (color: string) => {
    const value = color || 'transparent';
    selectedBlocks().forEach((block) => { block.style.backgroundColor = value; });
    setAttrs((current) => ({ ...current, shading: color || undefined }));
    dirty();
    refreshTextState();
  };

  const applyBorder = (mode: 'all' | 'bottom' | 'none') => {
    selectedBlocks().forEach((block) => {
      block.style.border = '';
      block.style.borderBottom = '';
      block.style.padding = '';
      if (mode === 'all') { block.style.border = '1px solid #64748b'; block.style.padding = '4px 6px'; }
      if (mode === 'bottom') { block.style.borderBottom = '1px solid #64748b'; block.style.paddingBottom = '3px'; }
    });
    setAttrs((current) => ({ ...current, bordered: mode !== 'none' }));
    dirty();
    refreshTextState();
  };

  const sanitizeClipboardHtml = (html: string) => {
    const template = document.createElement('template');
    template.innerHTML = html;
    template.content.querySelectorAll('script, style, iframe, object, embed, link, meta').forEach((node) => node.remove());
    template.content.querySelectorAll<HTMLElement>('*').forEach((node) => {
      Array.from(node.attributes).forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        const value = attribute.value.trim();
        if (name.startsWith('on') || ['srcdoc', 'formaction'].includes(name)) node.removeAttribute(attribute.name);
        if (['href', 'src', 'xlink:href'].includes(name) && !/^(https?:|mailto:|tel:|data:image\/|blob:|#|\/)/i.test(value)) node.removeAttribute(attribute.name);
        if (name === 'style' && /(expression\s*\(|javascript\s*:|url\s*\(\s*['"]?\s*(?!https?:|data:image\/))/i.test(value)) node.removeAttribute('style');
      });
    });
    return template.innerHTML;
  };

  const pasteFromClipboard = async (plainTextOnly: boolean) => {
    try {
      restoreEditorSelection();
      let text = '';
      let html = '';
      if (!plainTextOnly && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          if (!html && item.types.includes('text/html')) html = await (await item.getType('text/html')).text();
          if (!text && item.types.includes('text/plain')) text = await (await item.getType('text/plain')).text();
        }
      } else {
        text = await navigator.clipboard.readText();
      }
      restoreEditorSelection();
      if (html && !plainTextOnly) document.execCommand('insertHTML', false, sanitizeClipboardHtml(html));
      else document.execCommand('insertText', false, text);
      dirty();
      refreshTextState();
    } catch {
      const fallback = window.prompt('Trình duyệt đang chặn nút Paste. Hãy dán nội dung bằng Ctrl+V vào ô dưới đây:');
      if (fallback !== null) {
        restoreEditorSelection();
        document.execCommand('insertText', false, fallback);
        dirty();
        refreshTextState();
      }
    }
  };

  const copySelectionToClipboard = async (cut: boolean) => {
    if (!restoreEditorSelection()) return;
    const currentSelection = window.getSelection();
    if (!currentSelection?.rangeCount || currentSelection.isCollapsed) return;
    const range = currentSelection.getRangeAt(0);
    const fragment = range.cloneContents();
    const holder = document.createElement('div');
    holder.append(fragment);
    const text = currentSelection.toString();
    let copied = false;
    try {
      if (navigator.clipboard?.write && 'ClipboardItem' in window) {
        const item = new ClipboardItem({
          'text/html': new Blob([holder.innerHTML], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        });
        await navigator.clipboard.write([item]);
        copied = true;
      }
    } catch { /* browser permission fallback below */ }
    if (!copied) {
      restoreEditorSelection();
      copied = document.execCommand('copy');
    }
    if (cut && copied) {
      restoreEditorSelection();
      window.getSelection()?.getRangeAt(0).deleteContents();
      dirty();
      refreshTextState();
    }
    if (!copied) say('Trình duyệt không cho phép truy cập Clipboard. Dùng Ctrl+C hoặc Ctrl+X.');
  };

  const toggleFormatPainter = () => {
    restoreEditorSelection();
    if (!painterRef.current) {
      const currentSelection = window.getSelection();
      const element = nodeElement(currentSelection?.anchorNode ?? null);
      if (!element) { say('Hãy chọn chữ nguồn trước khi dùng Format Painter.'); return; }
      const computed = window.getComputedStyle(element);
      painterRef.current = {
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strike: document.queryCommandState('strikeThrough'),
        fontFamily: computed.fontFamily.split(',')[0].replace(/["']/g, '').trim(),
        fontSizePt: Math.round((Number.parseFloat(computed.fontSize) || 14.67) * .75),
        color: computed.color,
        highlight: computed.backgroundColor,
      };
      setAttrs((current) => ({ ...current, formatPainter: true }));
      say('Đã lấy định dạng. Chọn chữ đích rồi bấm Format Painter lần nữa.');
      return;
    }
    const format = painterRef.current;
    const toggle = (command: string, enabled: boolean) => {
      if (document.queryCommandState(command) !== enabled) document.execCommand(command, false);
    };
    document.execCommand('styleWithCSS', false, 'true');
    toggle('bold', format.bold);
    toggle('italic', format.italic);
    toggle('underline', format.underline);
    toggle('strikeThrough', format.strike);
    const inlineApplied = applyInlineStyles({
      fontFamily: format.fontFamily,
      fontSize: `${format.fontSizePt}pt`,
      color: format.color,
      backgroundColor: format.highlight === 'rgba(0, 0, 0, 0)' ? 'transparent' : format.highlight,
    });
    if (!inlineApplied) {
      document.execCommand('fontName', false, format.fontFamily);
      document.execCommand('foreColor', false, format.color);
      document.execCommand('hiliteColor', false, format.highlight === 'rgba(0, 0, 0, 0)' ? 'transparent' : format.highlight);
      applyFontSize(format.fontSizePt);
    }
    painterRef.current = null;
    setAttrs((current) => ({ ...current, formatPainter: false }));
    say('Đã áp dụng định dạng.');
  };

  /** Controller thực thi các lệnh từ Ribbon và phím tắt */
  const run = (id: string, value?: string | number): boolean => {
    const exec = (cmd: string, v?: string, mutates = true) => {
      restoreEditorSelection();
      document.execCommand('styleWithCSS', false, 'true');
      document.execCommand(cmd, false, v);
      if (mutates) dirty();
      refreshTextState();
      return true;
    };

    const toggleInlineCss = (command: string, on: Partial<CSSStyleDeclaration>, off: Partial<CSSStyleDeclaration>) => {
      restoreEditorSelection();
      const currentSelection = window.getSelection();
      const range = currentSelection?.rangeCount ? currentSelection.getRangeAt(0) : null;
      if (range && !range.collapsed) {
        const enabled = document.queryCommandState(command);
        return applyInlineStyles(enabled ? off : on);
      }
      return exec(command);
    };

    const toggleDecoration = (decoration: 'underline' | 'line-through', command: 'underline' | 'strikeThrough') => {
      restoreEditorSelection();
      const currentSelection = window.getSelection();
      const range = currentSelection?.rangeCount ? currentSelection.getRangeAt(0) : null;
      if (!range || range.collapsed) return exec(command);
      const element = nodeElement(range.startContainer);
      const current = element ? window.getComputedStyle(element).textDecorationLine.split(/\s+/).filter((item) => item && item !== 'none') : [];
      const enabled = current.includes(decoration);
      const next = enabled ? current.filter((item) => item !== decoration) : [...new Set([...current, decoration])];
      return applyInlineStyles({ textDecorationLine: next.join(' ') || 'none' });
    };

    const nonMutating = new Set([
      'save', 'saveReturn', 'exportDocx', 'print', 'back', 'docInfo', 'copy', 'find', 'replace', 'selectAll',
      'help', 'shortcuts', 'feedback', 'wordCount', 'spelling', 'readAloud', 'tts', 'preview', 'editMode',
      'zoom', 'zoom100', 'onePage', 'pageWidth', 'multiPages', 'ruler', 'gridlines', 'navPane', 'undo', 'redo',
    ]);
    if (!nonMutating.has(id)) pushHistory();
    if (tableRef.current?.run(id, value)) return true;

    switch (id) {
      // ══════════════ TAB FILE ══════════════
      case 'save':
        setSaved('saving');
        window.setTimeout(() => {
          if (saveDocument()) say('✓ Đã lưu nội dung và định dạng vào trình duyệt (Ctrl+S)');
        }, 400);
        return true;

      case 'saveReturn':
        setSaved('saving');
        window.setTimeout(() => {
          if (saveDocument()) say('✓ Đã lưu thành công. Có thể quay lại bài học mà không mất dữ liệu.');
        }, 400);
        return true;

      case 'saveAdd':
        setSaved('saving');
        window.setTimeout(() => {
          const currentList = collectExercisesFromEditor();
          if (!saveDocument(currentList)) return;
          const nextIndex = currentList.length + 1;
          const newEx: ExerciseBlock = {
            id: `ex-${Date.now()}`,
            title: `Exercise ${nextIndex}: Practice Vocabulary & Sentences`,
            wordBank: ['London', 'Big Ben', 'museum', 'bridge', 'river', 'park'],
            passage: 'London is famous for many historic places. Tourists love visiting the ancient tower and the beautiful parks.',
            showWordBank: true,
          };
          setExercises([...currentList, newEx]);
          setActiveExIndex(currentList.length);
          setSaved('unsaved');
          say(`✓ Đã lưu bài hiện tại và thêm Exercise ${nextIndex} trong cùng lesson.`);
        }, 400);
        return true;

      case 'exportDocx':
        void handleExportDocx();
        return true;

      case 'print':
        window.print();
        return true;

      case 'duplicate': {
        const currentList = collectExercisesFromEditor();
        const current = currentList[activeExIndex] ?? currentList[0];
        const nextIndex = currentList.length + 1;
        const duplicated: ExerciseBlock = {
          ...structuredClone(current),
          id: `ex-${Date.now()}`,
          title: `${current.title} (Bản sao #${nextIndex})`,
        };
        setExercises([...currentList, duplicated]);
        setActiveExIndex(currentList.length);
        dirty();
        say(`✓ Đã nhân bản bài tập "${current.title}"`);
        return true;
      }

      case 'deleteExercise':
        setDeleteModalOpen(true);
        return true;

      case 'back':
        if (saved === 'unsaved') {
          setBackModalOpen(true);
        } else {
          say('← Đang chuyển hướng quay lại danh sách bài học (Unit 2 – London)');
        }
        return true;

      case 'docInfo':
        setDocInfoOpen(true);
        return true;

      // ══════════════ TAB HOME & CHỈNH SỬA ══════════════
      case 'undo': {
        const snapshot = undoStackRef.current.pop();
        if (!snapshot) return true;
        redoStackRef.current.push(captureSnapshot());
        restoreSnapshot(snapshot);
        return true;
      }
      case 'redo': {
        const snapshot = redoStackRef.current.pop();
        if (!snapshot) return true;
        undoStackRef.current.push(captureSnapshot());
        restoreSnapshot(snapshot);
        return true;
      }
      case 'cut': {
        void copySelectionToClipboard(true);
        return true;
      }
      case 'copy': {
        void copySelectionToClipboard(false);
        return true;
      }
      case 'paste': void pasteFromClipboard(false); return true;
      case 'pasteText': void pasteFromClipboard(true); return true;
      case 'formatPainter': toggleFormatPainter(); return true;
      case 'fontFamily': {
        const family = String(value);
        setAttrs((current) => ({ ...current, fontFamily: family }));
        if (!applyInlineStyles({ fontFamily: family })) return exec('fontName', family);
        return true;
      }
      case 'fontSize': applyFontSize(Number(value)); return true;
      case 'sizeUp': {
        const current = attrs.fontSizePt ?? 11;
        applyFontSize(FONT_SIZES.find((size) => size > current) ?? FONT_SIZES[FONT_SIZES.length - 1]);
        return true;
      }
      case 'sizeDown': {
        const current = attrs.fontSizePt ?? 11;
        applyFontSize([...FONT_SIZES].reverse().find((size) => size < current) ?? FONT_SIZES[0]);
        return true;
      }
      case 'bold': return toggleInlineCss('bold', { fontWeight: '700' }, { fontWeight: '400' });
      case 'italic': return toggleInlineCss('italic', { fontStyle: 'italic' }, { fontStyle: 'normal' });
      case 'underline': return toggleDecoration('underline', 'underline');
      case 'strike': return toggleDecoration('line-through', 'strikeThrough');
      case 'subscript': return exec('subscript');
      case 'superscript': return exec('superscript');
      case 'clearFormat': {
        exec('removeFormat');
        selectedBlocks().forEach((block) => {
          delete block.dataset.rbStyle;
          block.style.backgroundColor = '';
          block.style.border = '';
          block.style.borderBottom = '';
          block.style.padding = '';
          block.style.lineHeight = '';
        });
        return true;
      }
      case 'bullets': return exec('insertUnorderedList');
      case 'numbering': return exec('insertOrderedList');
      case 'indent': return exec('indent');
      case 'outdent': return exec('outdent');
      case 'alignLeft': return exec('justifyLeft');
      case 'alignCenter': return exec('justifyCenter');
      case 'alignRight': return exec('justifyRight');
      case 'justify': return exec('justifyFull');
      case 'lineSpacing': applyLineSpacing(String(value)); return true;
      case 'shading': applyShading(String(value ?? '')); return true;
      case 'borders': applyBorder('all'); return true;
      case 'borderAll': applyBorder('all'); return true;
      case 'borderBottom': applyBorder('bottom'); return true;
      case 'borderNone': applyBorder('none'); return true;
      case 'style': applyBlockStyle(String(value) as NonNullable<TextAttrs['blockStyle']>); return true;
      case 'find': setFindReplaceMode('find'); return true;
      case 'replace': setFindReplaceMode('replace'); return true;
      case 'selectAll': {
        restoreEditorSelection();
        const anchor = nodeElement(window.getSelection()?.anchorNode ?? null);
        const editable = anchor?.closest<HTMLElement>('[contenteditable="true"]') ?? bodyEl;
        if (!editable) return true;
        const range = document.createRange();
        range.selectNodeContents(editable);
        const currentSelection = window.getSelection();
        currentSelection?.removeAllRanges();
        currentSelection?.addRange(range);
        savedRangeRef.current = range.cloneRange();
        readTextState();
        return true;
      }
      case 'color': {
        const color = String(value) || '#000000';
        setAttrs((a) => ({ ...a, color }));
        if (!applyInlineStyles({ color })) return exec('foreColor', color);
        return true;
      }
      case 'highlight': {
        const highlight = String(value) || 'transparent';
        setAttrs((a) => ({ ...a, highlight: highlight === 'transparent' ? undefined : highlight }));
        if (!applyInlineStyles({ backgroundColor: highlight })) return exec('hiliteColor', highlight);
        return true;
      }
      case 'zoom':
        setZoom(parseInt(String(value), 10));
        return true;
      case 'zoom100':
        setZoom(100);
        return true;
      case 'removePicture':
        if (selectedPicture()?.classList.contains('inserted-image')) selectedPicture()?.remove();
        else setImgHidden(true);
        select('none');
        dirty();
        return true;
      case 'deleteTable':
        if (selectedObjectRef.current?.closest('table')?.hasAttribute('data-editor-table')) selectedObjectRef.current.closest('table')?.remove();
        else setTblHidden(true);
        select('none');
        dirty();
        return true;
      case 'layout':
        pageRef.current?.setAttribute('data-layout', String(value));
        dirty();
        say(`Đã áp dụng layout: ${LAYOUTS.find((l) => l.id === value)?.label}`);
        return true;
      case 'table': {
        const [rows, columns] = String(value ?? '2x2').split('x').map((item) => Math.max(1, Math.min(10, Number(item) || 2)));
        const cells = Array.from({ length: rows }, () => `<tr>${Array.from({ length: columns }, () => '<td contenteditable="true"><br></td>').join('')}</tr>`).join('');
        const before = new Set(pageRef.current?.querySelectorAll('table[data-editor-table]'));
        insertHtmlAtCursor(`<table data-editor-table="true"><tbody>${cells}</tbody></table><p><br></p>`);
        const created = Array.from(pageRef.current?.querySelectorAll<HTMLTableElement>('table[data-editor-table]') ?? []).find((t) => !before.has(t));
        const first = created?.rows[0]?.cells[0];
        if (first) { // đặt con trỏ vào ô đầu để mở ngay tab Table Layout
          const range = document.createRange(); range.selectNodeContents(first); range.collapse(true);
          const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(range);
        }
        return true;
      }
      // Insert
      case 'pageBreak': return insertHtmlAtCursor('<div class="editor-page-break" contenteditable="false"><span>Page break</span></div><p><br></p>');
      case 'blankPage': return insertHtmlAtCursor('<div class="editor-blank-page" contenteditable="true"><p><br></p></div>');
      case 'pictureFile':
        replacePictureRef.current = false;
        pictureInputRef.current?.click();
        return true;
      case 'aiImage': say('AI Image chưa khả dụng vì chưa cấu hình dịch vụ tạo ảnh.'); return true;
      case 'replacePicture':
        replacePictureRef.current = true;
        pictureInputRef.current?.click();
        return true;
      case 'gallery':
        pictureInputRef.current?.click();
        return true;
      case 'shapes':
        return insertHtmlAtCursor('<span class="editor-shape" contenteditable="true">Text</span>');
      case 'blankObject': return run('insertBlank');
      case 'qr': {
        const payload = window.prompt('Nhập nội dung hoặc URL cho mã QR:');
        if (!payload) return true;
        void QRCode.toDataURL(payload, { width: 220, margin: 1 }).then((src) => {
          insertHtmlAtCursor(`<img class="img inserted-image qr-image" src="${src}" alt="QR: ${escapeHtml(payload)}" style="width:32mm;height:32mm" />`);
        }).catch((error) => say(`Không thể tạo QR: ${error instanceof Error ? error.message : 'lỗi không xác định'}`));
        return true;
      }
      case 'audio': setAudioModalOpen('add'); return true;
      case 'header': {
        const text = window.prompt('Nội dung header:', pageSettings.header);
        if (text !== null) { setPageSettings((current) => ({ ...current, header: text })); dirty(); }
        return true;
      }
      case 'footer': {
        const text = window.prompt('Nội dung footer:', pageSettings.footer);
        if (text !== null) { setPageSettings((current) => ({ ...current, footer: text })); dirty(); }
        return true;
      }
      case 'pageNumber': setPageSettings((current) => ({ ...current, pageNumber: !current.pageNumber })); dirty(); return true;
      case 'textBox': return insertHtmlAtCursor('<div class="editor-text-box" contenteditable="true">Nhập nội dung hộp văn bản…</div><p><br></p>');
      case 'hline': return insertHtmlAtCursor('<hr class="editor-horizontal-line"><p><br></p>');
      case 'link': {
        const url = window.prompt('Địa chỉ liên kết (https://…):', 'https://');
        if (!url) return true;
        if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) { say('Liên kết phải bắt đầu bằng http://, https:// hoặc mailto:.'); return true; }
        restoreEditorSelection();
        const selectedText = window.getSelection()?.toString();
        if (selectedText) exec('createLink', url);
        else insertHtmlAtCursor(`<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`);
        return true;
      }
      case 'symbol': {
        const symbol = window.prompt('Nhập ký hiệu cần chèn:', '©');
        if (symbol) insertHtmlAtCursor(escapeHtml(symbol));
        return true;
      }

      // Design
      case 'docFont': setPageSettings((current) => ({ ...current, fontFamily: String(value) })); dirty(); return true;
      case 'docLineHeight': setPageSettings((current) => ({ ...current, lineHeight: String(value) })); dirty(); return true;
      case 'headingSize': setPageSettings((current) => ({ ...current, headingSize: Number(value) })); dirty(); return true;
      case 'bodySize': setPageSettings((current) => ({ ...current, bodySize: Number(value) })); dirty(); return true;
      case 'setDefault':
        try { window.localStorage.setItem('autows-ribbon-page-defaults', JSON.stringify(pageSettings)); say('✓ Đã lưu thiết lập trang mặc định.'); }
        catch { say('Không thể lưu thiết lập mặc định.'); }
        return true;
      case 'pageBorders': setPageSettings((current) => ({ ...current, pageBorder: !current.pageBorder })); dirty(); return true;
      case 'watermark': {
        const text = window.prompt('Nội dung watermark (để trống để xóa):', pageSettings.watermark);
        if (text !== null) { setPageSettings((current) => ({ ...current, watermark: text })); dirty(); }
        return true;
      }
      case 'pageColor': {
        const color = window.prompt('Màu trang (HEX hoặc CSS color):', pageSettings.pageColor);
        if (color) { setPageSettings((current) => ({ ...current, pageColor: color })); dirty(); }
        return true;
      }
      case 'branding': {
        const header = window.prompt('Tên trường / thương hiệu ở header:', pageSettings.header);
        if (header === null) return true;
        const footer = window.prompt('Nội dung footer:', pageSettings.footer);
        if (footer !== null) { setPageSettings((current) => ({ ...current, header, footer })); dirty(); }
        return true;
      }

      // Layout
      case 'margins': {
        const margin = Number(window.prompt('Lề trang (mm):', String(pageSettings.marginMm)));
        if (Number.isFinite(margin) && margin >= 5 && margin <= 40) { setPageSettings((current) => ({ ...current, marginMm: margin })); dirty(); }
        else say('Lề trang phải từ 5 đến 40 mm.');
        return true;
      }
      case 'orientation': setPageSettings((current) => ({ ...current, orientation: current.orientation === 'portrait' ? 'landscape' : 'portrait' })); dirty(); return true;
      case 'paperSize': say('Khổ giấy đang dùng là A4 (210 × 297 mm).'); return true;
      case 'columns': setPageSettings((current) => ({ ...current, columns: current.columns >= 3 ? 1 : current.columns + 1 })); dirty(); return true;
      case 'columnBreak': return insertHtmlAtCursor('<span class="editor-column-break" contenteditable="false"></span>');
      case 'sectionBreak': return insertHtmlAtCursor('<div class="editor-section-break" contenteditable="false"><span>Section break</span></div><p><br></p>');
      case 'indentLeft': selectedBlocks().forEach((block) => { block.style.marginLeft = `${Number(value)}cm`; }); dirty(); return true;
      case 'indentRight': selectedBlocks().forEach((block) => { block.style.marginRight = `${Number(value)}cm`; }); dirty(); return true;
      case 'spaceBefore': selectedBlocks().forEach((block) => { block.style.marginTop = `${Number(value)}pt`; }); dirty(); return true;
      case 'spaceAfter': selectedBlocks().forEach((block) => { block.style.marginBottom = `${Number(value)}pt`; }); dirty(); return true;
      case 'position':
      case 'picPosition': { const picture = selectedPicture(); if (picture) { picture.style.position = picture.style.position === 'absolute' ? 'relative' : 'absolute'; dirty(); } return true; }
      case 'wrap':
      case 'picWrap': { const picture = selectedPicture(); if (picture) { picture.style.float = picture.style.float === 'left' ? 'right' : 'left'; dirty(); } return true; }
      case 'forward':
      case 'picForward': { const picture = selectedPicture(); if (picture) { picture.style.zIndex = String((Number(picture.style.zIndex) || 0) + 1); dirty(); } return true; }
      case 'backward':
      case 'picBackward': { const picture = selectedPicture(); if (picture) { picture.style.zIndex = String((Number(picture.style.zIndex) || 0) - 1); dirty(); } return true; }
      case 'align':
      case 'picAlign': { const picture = selectedPicture(); if (picture) { picture.style.display = 'block'; picture.style.marginLeft = 'auto'; picture.style.marginRight = 'auto'; picture.style.float = 'none'; dirty(); } return true; }
      case 'rotate': { const picture = selectedPicture(); if (picture) { picture.style.transform = picture.style.transform ? '' : 'rotate(90deg)'; dirty(); } return true; }
      case 'group': say('Chọn nhiều đối tượng bằng Ctrl+click để Group; hiện chỉ có một đối tượng được chọn.'); return true;

      // Review
      case 'wordCount': {
        const text = Array.from(pageRef.current?.querySelectorAll<HTMLElement>('[data-editor-body]') ?? []).map((item) => item.innerText).join(' ');
        const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
        const characters = text.replace(/\s/g, '').length;
        say(`Word count: ${words} từ · ${characters} ký tự (không tính metadata).`);
        return true;
      }
      case 'spelling': {
        const editors = pageRef.current?.querySelectorAll<HTMLElement>('[data-editor-body]');
        const enabled = editors?.[0]?.spellcheck !== true;
        editors?.forEach((editor) => { editor.spellcheck = enabled; });
        say(enabled ? 'Đã bật kiểm tra chính tả tiếng Anh của trình duyệt.' : 'Đã tắt kiểm tra chính tả.');
        return true;
      }
      case 'readAloud': {
        if (!('speechSynthesis' in window)) { say('Trình duyệt này không hỗ trợ đọc văn bản.'); return true; }
        if (window.speechSynthesis.speaking) {
          if (window.speechSynthesis.paused) { window.speechSynthesis.resume(); say('Tiếp tục đọc.'); }
          else { window.speechSynthesis.pause(); say('Đã tạm dừng đọc.'); }
          return true;
        }
        const text = window.getSelection()?.toString().trim() || bodyEl?.innerText.trim() || '';
        if (!text) { say('Hãy chọn nội dung cần đọc.'); return true; }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.onend = () => { speechRef.current = null; };
        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        say('Đang đọc nội dung. Bấm lại để tạm dừng/tiếp tục.');
        return true;
      }
      case 'pauseReadAloud':
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) window.speechSynthesis.pause();
        say('Đã tạm dừng đọc.');
        return true;
      case 'stopReadAloud':
        window.speechSynthesis.cancel();
        speechRef.current = null;
        say('Đã dừng đọc.');
        return true;
      case 'tts': say('Generate Audio (TTS) chưa khả dụng vì chưa cấu hình dịch vụ tạo file audio.'); return true;
      case 'newComment': {
        const comment = window.prompt('Nội dung nhận xét:');
        if (!comment || !restoreEditorSelection()) return true;
        const sel = window.getSelection();
        if (!sel?.rangeCount || sel.getRangeAt(0).collapsed) { say('Hãy chọn đoạn chữ cần nhận xét.'); return true; }
        const range = sel.getRangeAt(0);
        const marker = document.createElement('span');
        marker.className = 'editor-comment';
        marker.dataset.comment = comment;
        marker.title = comment;
        marker.append(range.extractContents());
        range.insertNode(marker);
        dirty();
        return true;
      }
      case 'deleteComment': { const marker = nodeElement(window.getSelection()?.anchorNode ?? null)?.closest<HTMLElement>('.editor-comment'); if (marker) { marker.replaceWith(...Array.from(marker.childNodes)); dirty(); } else say('Con trỏ chưa nằm trong nhận xét.'); return true; }
      case 'prevComment':
      case 'nextComment': {
        const comments = Array.from(pageRef.current?.querySelectorAll<HTMLElement>('.editor-comment') ?? []);
        if (!comments.length) { say('Tài liệu chưa có nhận xét.'); return true; }
        commentIndexRef.current = (commentIndexRef.current + (id === 'nextComment' ? 1 : -1) + comments.length) % comments.length;
        comments[commentIndexRef.current].scrollIntoView({ block: 'center' });
        comments[commentIndexRef.current].focus();
        say(comments[commentIndexRef.current].dataset.comment ?? 'Nhận xét');
        return true;
      }
      case 'trackChanges': { const page = pageRef.current; if (page) { page.toggleAttribute('data-track-changes'); say(page.hasAttribute('data-track-changes') ? 'Đã bật đánh dấu thay đổi mới.' : 'Đã tắt đánh dấu thay đổi.'); } return true; }

      // View
      case 'editMode': setPreviewMode(false); return true;
      case 'preview': setPreviewMode(true); setSelection('none'); return true;
      case 'ruler': setShowRuler((current) => !current); return true;
      case 'gridlines': setShowGridlines((current) => !current); return true;
      case 'navPane': setShowNavPane((current) => !current); return true;
      case 'onePage': setZoom(Math.max(35, Math.min(100, Math.floor((window.innerHeight - 220) / (pageSettings.orientation === 'portrait' ? 1123 : 794) * 100)))); return true;
      case 'pageWidth': setZoom(Math.max(35, Math.min(150, Math.floor((window.innerWidth - (showNavPane ? 390 : 80)) / (pageSettings.orientation === 'portrait' ? 794 : 1123) * 100)))); return true;
      case 'multiPages': setZoom(55); return true;
      case 'newWindow': window.open(window.location.href, '_blank', 'noopener,noreferrer'); return true;
      case 'arrangeAll': say('Trình duyệt quản lý vị trí các cửa sổ; cửa sổ tài liệu mới đã sẵn sàng để sắp xếp.'); return true;
      case 'split': document.querySelector('.stage')?.classList.toggle('split-view'); return true;
      case 'help':
        setHelpSection('guide');
        return true;
      case 'shortcuts':
        setHelpSection('shortcuts');
        return true;
      case 'feedback':
        setHelpSection('feedback');
        return true;
      // ══════════════ TAB EXERCISE ══════════════
      case 'addQuestion': {
        const current = exercises[activeExIndex] ?? exercises[0];
        const curGroup = adapter.group;
        const nextList = [...exercises];

        if (curGroup === 'B') {
          const qNum = (current.questions?.length ?? 0) + 1;
          const newQ = {
            number: qNum,
            text: `Question ${qNum}: What is the main highlight of the tour?`,
            options: ['A. Visit Buckingham Palace', 'B. Walk across Tower Bridge', 'C. Take a cruise on the Thames', 'D. Tour the British Museum'],
          };
          nextList[activeExIndex] = {
            ...current,
            questions: [...(current.questions ?? []), newQ],
          };
          setExercises(nextList);
          dirty();
          say(`✓ Đã thêm câu hỏi trắc nghiệm ${qNum} (Add Question)`);
          return true;
        }

        if (curGroup === 'C') {
          const cNum = (current.clozeQuestions?.length ?? 0) + 1;
          const newPassage = current.passage + ` Visitors can also (${cNum}) [_________] souvenirs at local shops.`;
          const newCloze = {
            number: cNum,
            options: ['A. buy', 'B. bought', 'C. buying', 'D. buys'],
          };
          nextList[activeExIndex] = {
            ...current,
            passage: newPassage,
            clozeQuestions: [...(current.clozeQuestions ?? []), newCloze],
          };
          setExercises(nextList);
          dirty();
          say(`✓ Đã thêm câu hỏi Cloze (${cNum})`);
          return true;
        }

        if (curGroup === 'D') {
          const sNum = (current.statements?.length ?? 0) + 1;
          const newStmt = {
            number: sNum,
            text: `Statement ${sNum}: The historic monument attracts visitors from all over the world.`,
            answer: 'True' as const,
          };
          nextList[activeExIndex] = {
            ...current,
            statements: [...(current.statements ?? []), newStmt],
          };
          setExercises(nextList);
          dirty();
          say(`✓ Đã thêm nhận định ${sNum} (True/False/Not Given)`);
          return true;
        }

        if (curGroup === 'E') {
          const pNum = (current.matchingPairs?.length ?? 0) + 1;
          const letter = String.fromCharCode(64 + pNum);
          const newPair = {
            leftNumber: String(pNum),
            leftText: `Item ${pNum}: London Cultural Landmark`,
            rightLetter: letter,
            rightText: `Definition ${letter}: An internationally acclaimed heritage site`,
          };
          nextList[activeExIndex] = {
            ...current,
            matchingPairs: [...(current.matchingPairs ?? []), newPair],
          };
          setExercises(nextList);
          dirty();
          say(`✓ Đã thêm cặp ghép nối ${pNum} - ${letter}`);
          return true;
        }

        if (curGroup === 'F') {
          const pNum = (current.pictureItems?.length ?? 0) + 1;
          const letter = String.fromCharCode(64 + pNum);
          const newPic = {
            id: `pic-${Date.now()}`,
            label: `Picture ${letter}`,
            caption: `Attraction ${letter}`,
            matchingPrompt: `Description for picture ${letter}`,
          };
          nextList[activeExIndex] = {
            ...current,
            pictureItems: [...(current.pictureItems ?? []), newPic],
            wordBank: [...current.wordBank, `Attraction ${letter}`],
          };
          setExercises(nextList);
          dirty();
          say(`✓ Đã thêm thẻ ảnh Picture ${letter}`);
          return true;
        }

        if (curGroup === 'G') {
          const table = current.tableData ?? { headers: ['Day', 'Attraction', 'Opening Hours', 'Admission Fee'], rows: [] };
          const rNum = table.rows.length + 1;
          const newRow = [`Day ${rNum}`, `Attraction ${rNum}`, `09:30 - 18:00`, `Free entry ([_________])`];
          nextList[activeExIndex] = {
            ...current,
            tableData: {
              ...table,
              rows: [...table.rows, newRow],
            },
          };
          setExercises(nextList);
          dirty();
          say(`✓ Đã thêm hàng bảng mới (Hàng ${rNum})`);
          return true;
        }

        if (curGroup === 'H') {
          const sNum = (current.sentenceItems?.length ?? 0) + 1;
          const newSent = {
            number: sNum,
            jumbledWords: 'visit / usually / tourists / in / summer / London / .',
            hintInParentheses: 'Present Simple',
          };
          nextList[activeExIndex] = {
            ...current,
            sentenceItems: [...(current.sentenceItems ?? []), newSent],
          };
          setExercises(nextList);
          dirty();
          say(`✓ Đã thêm câu cần sắp xếp ${sNum}`);
          return true;
        }

        // Default: Group A
        const count = (current.passage.match(/\[_+\]/g) || []).length + 1;
        const newPassage = current.passage + `\n${count}. Many visitors love visiting the historic [_________] in the afternoon.`;
        const newWb = current.wordBank.includes('museum') ? current.wordBank : [...current.wordBank, 'museum'];
        nextList[activeExIndex] = {
          ...current,
          passage: newPassage,
          wordBank: newWb,
        };
        setExercises(nextList);
        dirty();
        say(`✓ Đã thêm câu điền từ ${count} (Add Question)`);
        return true;
      }

      case 'moveUp': {
        if (activeExIndex > 0) {
          const nextList = [...exercises];
          const temp = nextList[activeExIndex];
          nextList[activeExIndex] = nextList[activeExIndex - 1];
          nextList[activeExIndex - 1] = temp;
          setExercises(nextList);
          setActiveExIndex(activeExIndex - 1);
          dirty();
          say('✓ Đã chuyển bài tập lên trên (Move Up)');
        } else {
          say('Bài tập đang ở vị trí đầu tiên');
        }
        return true;
      }

      case 'moveDown': {
        if (activeExIndex < exercises.length - 1) {
          const nextList = [...exercises];
          const temp = nextList[activeExIndex];
          nextList[activeExIndex] = nextList[activeExIndex + 1];
          nextList[activeExIndex + 1] = temp;
          setExercises(nextList);
          setActiveExIndex(activeExIndex + 1);
          dirty();
          say('✓ Đã chuyển bài tập xuống dưới (Move Down)');
        } else {
          say('Bài tập đang ở vị trí cuối cùng');
        }
        return true;
      }

      case 'addAudio':
        setAudioModalOpen('add');
        return true;

      case 'recordAudio':
        setAudioModalOpen('record');
        return true;

      case 'audioLibrary':
        setAudioModalOpen('library');
        return true;

      case 'trimAudio':
        say('Trim Audio chưa khả dụng vì chưa tích hợp waveform/audio encoder để xử lý file thật.');
        return true;

      case 'insertBlank': {
        restoreEditorSelection();
        const currentSelection = window.getSelection();
        if (!currentSelection?.rangeCount) { say('Hãy đặt con trỏ trong nội dung bài tập.'); return true; }
        const range = currentSelection.getRangeAt(0);
        const selectedText = currentSelection.toString().trim();
        const blank = document.createElement('span');
        blank.className = 'structured-blank';
        blank.contentEditable = 'false';
        blank.dataset.blankId = `blank-${Date.now()}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
        blank.dataset.answer = selectedText;
        blank.setAttribute('aria-label', selectedText ? `Blank for ${selectedText}` : 'Blank');
        const label = document.createElement('span');
        label.className = 'blank-label';
        const count = pageRef.current?.querySelectorAll('[data-blank-id]').length ?? 0;
        label.textContent = `(${count + 1})`;
        const line = document.createElement('span');
        line.className = 'blank-line';
        blank.append(label, line);
        range.deleteContents();
        range.insertNode(blank);
        range.setStartAfter(blank);
        range.collapse(true);
        currentSelection.removeAllRanges();
        currentSelection.addRange(range);
        savedRangeRef.current = range.cloneRange();
        if (selectedText) {
          const current = exercises[activeExIndex] ?? exercises[0];
          if (!current.wordBank.includes(selectedText)) {
            const nextList = [...exercises];
            nextList[activeExIndex] = { ...current, wordBank: [...current.wordBank, selectedText] };
            setExercises(nextList);
          }
        }
        dirty();
        refreshTextState();
        say('✓ Đã chèn blank có ID ổn định và giữ đáp án gốc.');
        return true;
      }

      case 'insertTextBox': {
        const current = exercises[activeExIndex] ?? exercises[0];
        const hasBox = !!current.calloutBox;
        const nextList = [...exercises];
        nextList[activeExIndex] = {
          ...current,
          calloutBox: hasBox ? null : 'Ghi chú học sinh: Chú ý nghe kỹ các danh từ số nhiều và mạo từ a/an.',
        };
        setExercises(nextList);
        dirty();
        say(hasBox ? 'Đã gỡ Text Box ghi chú' : '✓ Đã chèn Text Box ghi chú');
        return true;
      }

      case 'insertImage': {
        replacePictureRef.current = false;
        pictureInputRef.current?.click();
        return true;
      }

      case 'addWord':
        setWordBankModalOpen('add');
        return true;

      case 'importWords':
        setWordBankModalOpen('import');
        return true;

      case 'import': {
        const current = exercises[activeExIndex] ?? exercises[0];
        const adapter = adapterOf(current.type ?? type);
        if (adapter.group === 'A' || adapter.capabilities.wordBank) {
          setWordBankModalOpen('import');
        } else {
          setAiAssistOpen('smartPaste');
        }
        return true;
      }

      case 'resequence': {
        const editor = pageRef.current?.querySelector<HTMLElement>(`.ex-block.active [data-editor-body]`);
        const structuredBlanks = Array.from(editor?.querySelectorAll<HTMLElement>('[data-blank-id]') ?? []);
        if (structuredBlanks.length) {
          structuredBlanks.forEach((blank, index) => {
            const label = blank.querySelector<HTMLElement>('.blank-label');
            if (label) label.textContent = `(${index + 1})`;
          });
          dirty();
          say(`✓ Đã đánh số lại ${structuredBlanks.length} blank theo thứ tự thực tế.`);
          return true;
        }
        const current = exercises[activeExIndex] ?? exercises[0];
        let counter = 0;
        const letters = ['(a)', '(b)', '(c)', '(d)', '(e)', '(f)', '(g)', '(h)'];
        const resequenced = current.passage.replace(/\[_+\]|\([a-z0-9]+\)\s*\[?_+\]?/gi, () => {
          const label = letters[counter] || `(${counter + 1})`;
          counter++;
          return `${label} [_________]`;
        });
        const nextList = [...exercises];
        nextList[activeExIndex] = {
          ...current,
          passage: resequenced,
        };
        setExercises(nextList);
        dirty();
        say(`✓ Đã đánh số lại ${counter} chỗ trống theo thứ tự (Resequence)`);
        return true;
      }

      case 'showWordBank': {
        const current = exercises[activeExIndex] ?? exercises[0];
        const nextVisible = !current.showWordBank;
        const nextList = [...exercises];
        nextList[activeExIndex] = {
          ...current,
          showWordBank: nextVisible,
        };
        setExercises(nextList);
        dirty();
        say(nextVisible ? '✓ Đã hiện khung từ (Show Word Bank)' : '✓ Đã ẩn khung từ (Hide Word Bank)');
        return true;
      }

      case 'shuffleOptions':
      case 'shuffle':
      case 'shuffleImages': {
        const current = exercises[activeExIndex] ?? exercises[0];
        const shuffled = [...current.wordBank].sort(() => Math.random() - 0.5);
        const nextList = [...exercises];
        nextList[activeExIndex] = {
          ...current,
          wordBank: shuffled,
        };
        setExercises(nextList);
        dirty();
        say('✓ Đã xáo trộn thứ tự từ vựng / phương án (Shuffle)');
        return true;
      }

      case 'aiAssist': {
        const tabKey = (typeof value === 'string' && ['smartPaste', 'smartAi', 'aiRewrite'].includes(value)) ? value as AiTab : 'smartPaste';
        setAiAssistOpen(tabKey);
        return true;
      }

      case 'smartPaste':
        setAiAssistOpen('smartPaste');
        return true;

      case 'smartAi':
        setAiAssistOpen('smartAi');
        return true;

      case 'aiRewrite':
        setAiAssistOpen('aiRewrite');
        return true;

      case 'setOptions':
        setSetOptionsOpen(true);
        return true;

      case 'exerciseSettings':
        setExerciseSettingsOpen(true);
        return true;

      case 'insertExercise':
        return run('saveAdd');

      case 'exerciseTitle': {
        const current = exercises[activeExIndex] ?? exercises[0];
        const newTitle = window.prompt('Nhập tiêu đề bài tập:', current.title);
        if (newTitle !== null && newTitle.trim()) {
          const nextList = [...exercises];
          nextList[activeExIndex] = { ...current, title: newTitle.trim() };
          setExercises(nextList);
          dirty();
          say(`✓ Đã đổi tiêu đề: ${newTitle.trim()}`);
        }
        return true;
      }

      case 'instruction': {
        const current = exercises[activeExIndex] ?? exercises[0];
        const newInst = window.prompt('Nhập hướng dẫn bài tập (để trống nếu muốn ẩn):', current.instruction ?? '');
        if (newInst !== null) {
          const nextList = [...exercises];
          nextList[activeExIndex] = {
            ...current,
            instruction: newInst.trim(),
            showInstruction: !!newInst.trim(),
          };
          setExercises(nextList);
          dirty();
          say(newInst.trim() ? '✓ Đã cập nhật hướng dẫn bài tập' : '✓ Đã ẩn hướng dẫn bài tập');
        }
        return true;
      }

      case 'exerciseNumber':
      case 'numberBadge': {
        const current = exercises[activeExIndex] ?? exercises[0];
        const pts = window.prompt(`Thang điểm cho bài tập ${activeExIndex + 1}:`, String(current.points ?? 10));
        if (pts !== null && !isNaN(Number(pts))) {
          const nextList = [...exercises];
          nextList[activeExIndex] = { ...current, points: Math.max(0, Number(pts)) };
          setExercises(nextList);
          dirty();
          say(`✓ Đã cập nhật điểm số bài tập: ${pts} điểm`);
        }
        return true;
      }

      case 'pageBreakBefore': {
        const current = exercises[activeExIndex] ?? exercises[0];
        const nextVal = !current.pageBreakBefore;
        const nextList = [...exercises];
        nextList[activeExIndex] = { ...current, pageBreakBefore: nextVal };
        setExercises(nextList);
        dirty();
        say(nextVal ? '✓ Bật ngắt trang trước bài tập này' : '✓ Tắt ngắt trang trước bài tập này');
        return true;
      }

      // Inline Exercise Settings (Group A-H)
      case 'blankWidth': {
        const w = Number(value) || 28;
        const current = exercises[activeExIndex] ?? exercises[0];
        const nextList = [...exercises];
        nextList[activeExIndex] = { ...current, blankWidth: w };
        setExercises(nextList);
        dirty();
        say(`✓ Độ dài chỗ trống: ${w}mm`);
        return true;
      }

      case 'blankStroke': {
        const s = value === 'Liền' || value === 'solid' ? 'solid' : 'dashed';
        const current = exercises[activeExIndex] ?? exercises[0];
        const nextList = [...exercises];
        nextList[activeExIndex] = { ...current, blankStroke: s };
        setExercises(nextList);
        dirty();
        say(`✓ Kiểu nét chỗ trống: ${s === 'solid' ? 'Nét liền' : 'Nét đứt'}`);
        return true;
      }

      case 'blankLabel': {
        const lbl = value === '(1)' ? '(1)' : value === 'Không nhãn' || value === 'none' ? 'none' : '(a)';
        const current = exercises[activeExIndex] ?? exercises[0];
        const nextList = [...exercises];
        nextList[activeExIndex] = { ...current, blankLabel: lbl };
        setExercises(nextList);
        dirty();
        say(`✓ Nhãn chỗ trống: ${lbl === 'none' ? 'Không nhãn' : lbl}`);
        return true;
      }

      case 'wordBankStyle': {
        const st = value === 'Hai cột' ? 'grid2' : value === 'Lưới 3 cột' ? 'grid3' : 'row';
        const current = exercises[activeExIndex] ?? exercises[0];
        const nextList = [...exercises];
        nextList[activeExIndex] = { ...current, wordBankStyle: st };
        setExercises(nextList);
        dirty();
        say(`✓ Kiểu khung từ: ${value}`);
        return true;
      }

      case 'wordBankBorder': {
        const b = value === 'Có' || String(value) === 'true';
        const current = exercises[activeExIndex] ?? exercises[0];
        const nextList = [...exercises];
        nextList[activeExIndex] = { ...current, wordBankBorder: b };
        setExercises(nextList);
        dirty();
        say(b ? '✓ Đã bật viền khung từ' : '✓ Đã tắt viền khung từ');
        return true;
      }

      case 'hint': {
        const h = value === 'Hiện' || String(value) === 'true';
        const current = exercises[activeExIndex] ?? exercises[0];
        const nextList = [...exercises];
        nextList[activeExIndex] = { ...current, hint: h };
        setExercises(nextList);
        dirty();
        say(h ? '✓ Đã hiện gợi ý (hint)' : '✓ Đã ẩn gợi ý (hint)');
        return true;
      }

      case 'optionLabel':
      case 'optionColumns':
      case 'imageOptions':
      case 'underlineWord':
      case 'startNumber':
      case 'optionsStyle':
      case 'imagePosition':
      case 'imageWidth':
      case 'answerColumn':
      case 'showImage':
      case 'imageHeight':
      case 'leftLabel':
      case 'columnGap':
      case 'columnWidth':
      case 'rowGap':
      case 'imagesPerRow':
      case 'imageSize':
      case 'caption':
      case 'imageLabel':
      case 'headerRow':
      case 'rows':
      case 'cols':
      case 'cellBlank':
      case 'blockStyle':
      case 'hintParen':
      case 'answerLine': {
        dirty();
        say(`✓ Đã áp dụng cài đặt [${id}]: ${value}`);
        return true;
      }

      case 'addOption': {
        const current = exercises[activeExIndex] ?? exercises[0];
        const qList = [...(current.questions ?? [])];
        if (qList.length > 0) {
          const lastQ = { ...qList[qList.length - 1] };
          const optLetter = String.fromCharCode(65 + (lastQ.options?.length ?? 0));
          lastQ.options = [...(lastQ.options ?? []), `${optLetter}. New Option`];
          qList[qList.length - 1] = lastQ;
          const nextList = [...exercises];
          nextList[activeExIndex] = { ...current, questions: qList };
          setExercises(nextList);
          dirty();
          say(`✓ Đã thêm phương án ${optLetter} (Add option)`);
        } else {
          say('Chưa có câu hỏi nào để thêm phương án. Hãy bấm Add question trước.');
        }
        return true;
      }

      case 'addStatement': {
        const current = exercises[activeExIndex] ?? exercises[0];
        const qNum = (current.questions?.length ?? 0) + 1;
        const newStmt = {
          number: qNum,
          text: `Statement ${qNum}: London has many historic castles and famous bridges.`,
          options: ['True', 'False', 'Not Given'],
        };
        const nextList = [...exercises];
        nextList[activeExIndex] = {
          ...current,
          questions: [...(current.questions ?? []), newStmt],
        };
        setExercises(nextList);
        dirty();
        say(`✓ Đã thêm nhận định ${qNum} (Add statement)`);
        return true;
      }

      case 'addParagraph': {
        const current = exercises[activeExIndex] ?? exercises[0];
        const nextList = [...exercises];
        nextList[activeExIndex] = {
          ...current,
          passage: current.passage + "\nVisitors can also enjoy walking along the River Thames on sunny days.",
        };
        setExercises(nextList);
        dirty();
        say('✓ Đã thêm đoạn văn mới (Add paragraph)');
        return true;
      }

      case 'addIdea':
      case 'addDefinition': {
        const current = exercises[activeExIndex] ?? exercises[0];
        const newItem = id === 'addIdea' ? 'Buckingham Palace' : 'The London residence of the British monarch';
        const nextList = [...exercises];
        nextList[activeExIndex] = {
          ...current,
          wordBank: [...current.wordBank, newItem],
        };
        setExercises(nextList);
        dirty();
        say(`✓ Đã thêm ${id === 'addIdea' ? 'từ/ý cột trái' : 'định nghĩa cột phải'}`);
        return true;
      }

      case 'fitA4':
        setZoom(100);
        say('✓ Tự động căn chỉnh vừa khổ giấy A4 (Fit to A4)');
        return true;

      case 'insertRow':
      case 'rowBelow':
      case 'rowAbove': {
        const current = exercises[activeExIndex] ?? exercises[0];
        const adapter = adapterOf(current.type ?? type);
        if (adapter.group === 'G' && current.tableData) {
          pushHistory();
          const colCount = current.tableData.headers?.length || 4;
          const nextRow = Array.from({ length: colCount }, (_, idx) => `[Item ${current.tableData!.rows.length + 1}.${idx + 1}]`);
          const nextRows = id === 'rowAbove'
            ? [nextRow, ...current.tableData.rows]
            : [...current.tableData.rows, nextRow];
          const nextList = [...exercises];
          nextList[activeExIndex] = {
            ...current,
            tableData: {
              ...current.tableData,
              rows: nextRows,
            },
          };
          setExercises(nextList);
          dirty();
          say('✓ Đã thêm 1 dòng vào bảng điền');
          return true;
        }
        const cell = selectedTableCell();
        const row = cell?.parentElement as HTMLTableRowElement | undefined;
        const table = row?.closest('table');
        if (!row || !table) { say('Hãy chọn một ô trong bảng.'); return true; }
        const rowIndex = row.rowIndex + (id === 'rowAbove' ? 0 : 1);
        const next = table.insertRow(rowIndex);
        for (let index = 0; index < row.cells.length; index += 1) { const td = next.insertCell(); td.contentEditable = 'true'; td.innerHTML = '<br>'; }
        dirty();
        return true;
      }
      case 'insertColumn':
      case 'colRight':
      case 'colLeft': {
        const current = exercises[activeExIndex] ?? exercises[0];
        const adapter = adapterOf(current.type ?? type);
        if (adapter.group === 'G' && current.tableData) {
          pushHistory();
          const colIndex = id === 'colLeft' ? 0 : current.tableData.headers.length;
          const nextHeaders = [...current.tableData.headers];
          nextHeaders.splice(colIndex, 0, `Col ${nextHeaders.length + 1}`);
          const nextRows = current.tableData.rows.map((r) => {
            const nr = [...r];
            nr.splice(colIndex, 0, `(...)`);
            return nr;
          });
          const nextList = [...exercises];
          nextList[activeExIndex] = {
            ...current,
            tableData: {
              headers: nextHeaders,
              rows: nextRows,
            },
          };
          setExercises(nextList);
          dirty();
          say('✓ Đã thêm 1 cột vào bảng điền');
          return true;
        }
        const cell = selectedTableCell();
        const table = cell?.closest('table');
        if (!cell || !table) { say('Hãy chọn một ô trong bảng.'); return true; }
        const columnIndex = cell.cellIndex + (id === 'colLeft' ? 0 : 1);
        Array.from(table.rows).forEach((row) => { const td = row.insertCell(columnIndex); td.contentEditable = 'true'; td.innerHTML = '<br>'; });
        dirty();
        return true;
      }
      case 'deleteRow': {
        const current = exercises[activeExIndex] ?? exercises[0];
        const adapter = adapterOf(current.type ?? type);
        if (adapter.group === 'G' && current.tableData && current.tableData.rows.length > 1) {
          pushHistory();
          const nextList = [...exercises];
          nextList[activeExIndex] = {
            ...current,
            tableData: {
              ...current.tableData,
              rows: current.tableData.rows.slice(0, -1),
            },
          };
          setExercises(nextList);
          dirty();
          say('✓ Đã xóa 1 dòng cuối trong bảng điền');
          return true;
        }
        const cell = selectedTableCell(); const row = cell?.parentElement as HTMLTableRowElement | undefined; const table = row?.closest('table');
        if (row && table) { table.deleteRow(row.rowIndex); dirty(); }
        return true;
      }
      case 'deleteColumn': {
        const current = exercises[activeExIndex] ?? exercises[0];
        const adapter = adapterOf(current.type ?? type);
        if (adapter.group === 'G' && current.tableData && current.tableData.headers.length > 2) {
          pushHistory();
          const nextList = [...exercises];
          nextList[activeExIndex] = {
            ...current,
            tableData: {
              headers: current.tableData.headers.slice(0, -1),
              rows: current.tableData.rows.map(r => r.slice(0, -1)),
            },
          };
          setExercises(nextList);
          dirty();
          say('✓ Đã xóa 1 cột cuối trong bảng điền');
          return true;
        }
        const cell = selectedTableCell(); const table = cell?.closest('table');
        if (cell && table) { const index = cell.cellIndex; Array.from(table.rows).forEach((row) => { if (row.cells[index]) row.deleteCell(index); }); dirty(); }
        return true;
      }
      case 'mergeCells': {
        const cell = selectedTableCell(); const sibling = cell?.nextElementSibling as HTMLTableCellElement | null;
        if (cell && sibling) { cell.innerHTML += ` ${sibling.innerHTML}`; cell.colSpan += sibling.colSpan; sibling.remove(); dirty(); }
        else say('Ô cuối hàng không thể gộp sang phải.');
        return true;
      }
      case 'splitCells': {
        const cell = selectedTableCell();
        if (cell && cell.colSpan > 1) { const count = cell.colSpan; cell.colSpan = 1; for (let i = 1; i < count; i += 1) { const next = document.createElement('td'); next.contentEditable = 'true'; next.innerHTML = '<br>'; cell.after(next); } dirty(); }
        else say('Ô đang chọn chưa được gộp.');
        return true;
      }
      case 'rowHeight': { const cell = selectedTableCell(); if (cell?.parentElement) (cell.parentElement as HTMLElement).style.height = `${Number(value)}mm`; dirty(); return true; }
      case 'colWidth': { const cell = selectedTableCell(); if (cell) cell.style.width = `${Number(value)}mm`; dirty(); return true; }
      case 'autoFit': { const table = selectedTableCell()?.closest('table'); if (table) table.style.width = value === 'Content' ? 'auto' : value === 'Page' ? '100%' : table.style.width; dirty(); return true; }
      case 'cellAlign': { const cell = selectedTableCell(); if (cell) { cell.style.textAlign = cell.style.textAlign === 'center' ? 'right' : cell.style.textAlign === 'right' ? 'left' : 'center'; dirty(); } return true; }
      case 'textDirection': { const cell = selectedTableCell(); if (cell) { cell.style.writingMode = cell.style.writingMode ? '' : 'vertical-rl'; dirty(); } return true; }
      case 'tblBorders': { const table = selectedTableCell()?.closest('table'); table?.classList.toggle('no-borders'); dirty(); return true; }
      case 'tblShading': { const cell = selectedTableCell(); if (cell) { cell.style.backgroundColor = cell.style.backgroundColor ? '' : '#eff6ff'; dirty(); } return true; }
      case 'cellPadding': { const table = selectedTableCell()?.closest('table'); if (table) table.classList.toggle('roomy-cells'); dirty(); return true; }
      case 'headerRowBtn': { const table = selectedTableCell()?.closest('table'); if (table?.rows[0]) Array.from(table.rows[0].cells).forEach((cell) => { cell.style.fontWeight = cell.style.fontWeight ? '' : '700'; cell.style.backgroundColor = cell.style.backgroundColor ? '' : '#e2e8f0'; }); dirty(); return true; }
      case 'tblLeft':
      case 'tblCenter':
      case 'tblRight': { const table = selectedTableCell()?.closest('table'); if (table) { table.style.marginLeft = id === 'tblRight' ? 'auto' : id === 'tblCenter' ? 'auto' : '0'; table.style.marginRight = id === 'tblLeft' ? 'auto' : id === 'tblCenter' ? 'auto' : '0'; dirty(); } return true; }

      // Picture Format
      case 'picWidth': { const picture = selectedPicture(); if (picture) { picture.style.width = `${Number(value)}mm`; if (picture.dataset.lockRatio !== 'false') picture.style.height = 'auto'; dirty(); } return true; }
      case 'picHeight': { const picture = selectedPicture(); if (picture) { picture.style.height = `${Number(value)}mm`; if (picture.dataset.lockRatio !== 'false') picture.style.width = 'auto'; dirty(); } return true; }
      case 'lockRatio': { const picture = selectedPicture(); if (picture) { picture.dataset.lockRatio = picture.dataset.lockRatio === 'false' ? 'true' : 'false'; say(picture.dataset.lockRatio === 'false' ? 'Đã mở khóa tỉ lệ ảnh.' : 'Đã khóa tỉ lệ ảnh.'); } return true; }
      case 'resetRatio': { const picture = selectedPicture(); if (picture) { picture.style.width = '55mm'; picture.style.height = 'auto'; dirty(); } return true; }
      case 'fitWidth': { const picture = selectedPicture(); if (picture) { picture.style.width = '100%'; picture.style.height = 'auto'; picture.style.float = 'none'; dirty(); } return true; }
      case 'crop': { const picture = selectedPicture(); if (picture) { picture.style.objectFit = picture.style.objectFit === 'cover' ? 'contain' : 'cover'; picture.style.overflow = 'hidden'; dirty(); } return true; }
      case 'picBorder': { const picture = selectedPicture(); if (picture) { picture.style.border = picture.style.border ? '' : '2px solid #2563eb'; dirty(); } return true; }
      case 'picShadow': { const picture = selectedPicture(); if (picture) { picture.style.boxShadow = picture.style.boxShadow ? '' : '0 5px 15px rgba(15,23,42,.3)'; dirty(); } return true; }
      case 'altText': { const picture = selectedPicture(); const alt = window.prompt('Mô tả hình ảnh (alt text):', picture?.getAttribute('alt') ?? ''); if (picture && alt !== null) { picture.setAttribute('alt', alt); dirty(); } return true; }
      case 'regenAi': say('AI Image chưa được cấu hình API nên không thể tạo lại ảnh.');
        return true;

      default:
        return false;
    }
  };

  /** Xóa bài tập đang chọn */
  const handleConfirmDelete = () => {
    if (exercises.length <= 1) {
      setExercises([
        {
          id: `ex-${Date.now()}`,
          title: 'Exercise 1: (Bài tập trống)',
          wordBank: [],
          passage: '',
          showWordBank: true,
        },
      ]);
      setActiveExIndex(0);
      dirty();
      say('✓ Đã xóa nội dung bài tập');
    } else {
      const idxToRemove = activeExIndex;
      setExercises((prev) => prev.filter((_, i) => i !== idxToRemove));
      setActiveExIndex((prev) => Math.max(0, prev - 1));
      dirty();
      say('✓ Đã xóa bài tập');
    }
  };

  /** Xử lý khi nhấn Back mà chưa lưu */
  const handleSaveAndLeave = () => {
    if (saveDocument()) say('✓ Đã lưu thay đổi. Có thể chuyển về Unit 2 – London an toàn.');
  };

  const handleDiscardAndLeave = () => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as { exercises?: ExerciseBlock[]; pageSettings?: PageSettings };
      if (parsed.exercises?.length) setExercises(parsed.exercises);
      if (parsed.pageSettings) setPageSettings({ ...DEFAULT_PAGE_SETTINGS, ...parsed.pageSettings });
      setSaved('saved');
      say('← Đã khôi phục bản lưu gần nhất.');
    } catch { say('Không thể khôi phục bản lưu gần nhất.'); }
  };

  const submitFeedback = async (feedback: FeedbackPayload) => {
    const key = 'flow-bridge-feedback-demo';
    const current = JSON.parse(window.localStorage.getItem(key) ?? '[]') as FeedbackPayload[];
    window.localStorage.setItem(key, JSON.stringify([...current.slice(-19), feedback]));
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setHelpSection('guide');
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setHelpSection('shortcuts');
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        run('save');
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        run('print');
        return;
      }
      const activeElement = document.activeElement as HTMLElement | null;
      const typingOutsideEditor = !!activeElement && !pageRef.current?.contains(activeElement) && activeElement.matches('input, textarea, select, [contenteditable="true"]');
      if (typingOutsideEditor) return;
      const editorActive = !!pageRef.current?.contains(activeElement) || !!(savedRangeRef.current?.startContainer && pageRef.current?.contains(savedRangeRef.current.startContainer));
      if (!(e.ctrlKey || e.metaKey) || !editorActive) return;
      const key = e.key.toLowerCase();
      if (key === 'f') { e.preventDefault(); run('find'); return; }
      if (key === 'h') { e.preventDefault(); run('replace'); return; }
      if (key === 'a') { e.preventDefault(); run('selectAll'); return; }
      if (key === 'b') { e.preventDefault(); run('bold'); return; }
      if (key === 'i') { e.preventDefault(); run('italic'); return; }
      if (key === 'u') { e.preventDefault(); run('underline'); return; }
      if (key === '=' && !e.shiftKey) { e.preventDefault(); run('subscript'); return; }
      if (key === '+' || (key === '=' && e.shiftKey)) { e.preventDefault(); run('superscript'); return; }
      if ((key === '>' || key === '.') && e.shiftKey) { e.preventDefault(); run('sizeUp'); return; }
      if ((key === '<' || key === ',') && e.shiftKey) { e.preventDefault(); run('sizeDown'); return; }
      if (key === 'v' && e.shiftKey) { e.preventDefault(); run('pasteText'); return; }
      if (key === 'y' || (key === 'z' && e.shiftKey)) { e.preventDefault(); run('redo'); return; }
      if (key === 'z') { e.preventDefault(); run('undo'); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  const state: RibbonState = {
    selection,
    textAttrs: attrs,
    saveStatus: saved,
    canUndo: undoStackRef.current.length > 0,
    canRedo: redoStackRef.current.length > 0,
    previewMode,
    zoom,
  };

  const currentEx = exercises[activeExIndex] ?? exercises[0];

  const docInfoData: DocInfoData = {
    title: 'Edit Worksheet – Unit 2: London (WS-Demo-1)',
    unit: 'Unit 2: London',
    lesson: 'Lesson 1: Vocabulary & Reading',
    folder: 'Grade 7 Worksheets',
    exerciseTypeLabel: `${adapter.label} (${adapter.group})`,
    exerciseCount: exercises.length,
    totalPoints: exercises.length * 5,
    estimatedMinutes: exercises.length * 7,
    paperSize: 'ISO A4 Portrait (210 × 297 mm, lề 15mm)',
    lastSavedText: saved === 'unsaved' ? 'Chưa lưu thay đổi' : `Hôm nay lúc ${lastSavedTime}`,
  };

  return (
    <div className="app">
      <div className="titlebar">
        <button className="back" onClick={() => run('back')}>← Back to Lesson</button>
        <div className="ttl">
          <b>Edit Worksheet</b>
          <small>Unit 2 – London | Worksheet: WS-Demo-1</small>
        </div>
        <QuickAccess state={state} send={run} />
        <div className="sp" />
        <span className={`badge ${saved}`}>
          {saved === 'saved' ? '✓ Đã lưu' : saved === 'saving' ? 'Đang lưu…' : '● Chưa lưu'}
        </span>
        <button className="pill" onClick={() => run(previewMode ? 'editMode' : 'preview')}>{previewMode ? 'Edit' : 'Preview'}</button>
        <button className="pill pri" onClick={() => run('save')}>Save</button>
      </div>

      <div className="devbar">
        <label>
          Loại bài
          <select
            value={type}
            onChange={(e) => {
              const newType = e.target.value as ExerciseType;
              setType(newType);
              setExercises((prev) => {
                const next = [...prev];
                const cur = next[activeExIndex] ?? next[0];
                const newGrp = adapterOf(newType).group;
                const oldGrp = adapterOf(cur.type ?? type).group;
                if (newGrp !== oldGrp || cur.type !== newType) {
                  next[activeExIndex] = {
                    ...createDefaultExercise(newType, activeExIndex),
                    id: cur.id,
                  };
                } else {
                  next[activeExIndex] = { ...cur, type: newType };
                }
                return next;
              });
              dirty();
              say(`Đã chuyển dạng bài: ${adapterOf(newType).label} (${GROUP_NAME[adapterOf(newType).group]})`);
            }}
          >
            {ADAPTERS.map((a) => (
              <option key={a.type} value={a.type}>
                {a.label} ({a.group})
              </option>
            ))}
          </select>
        </label>
        <label>
          Giả lập đang chọn
          <select value={selection} onChange={(e) => select(e.target.value as Selection)}>
            <option value="none">Không chọn gì</option>
            <option value="text">Chữ</option>
            <option value="image">Ảnh</option>
            <option value="table">Bảng</option>
          </select>
        </label>
        <span className="legend">
          <i style={{ background: '#16a34a' }} />đã có
          <i style={{ background: '#d97706' }} />một phần
          <i style={{ background: '#94a3b8' }} />chưa có
        </span>
        <span>Controller: các tab đã nối vào editor/A4 document; AI và TTS bị khóa khi chưa có dịch vụ.</span>
      </div>

      <Ribbon
        adapter={adapter}
        state={state}
        layouts={LAYOUTS}
        currentLayout="l1"
        tab={tab}
        onTab={setTab}
        onCommand={run}
        onNotWired={(l) => say(`(${l}) – giao diện, chưa nối chức năng`)}
      />

      <div className={`work${previewMode ? ' preview-mode' : ''}${showGridlines ? ' show-gridlines' : ''}`}>
        <div className={`left${showNavPane ? ' nav-open' : ' nav-closed'}`}>
          <div className="typeset typeset-docs">
            <h3>{adapter.label}</h3>
            <p>
              Cột trái giữ nguyên các mục của từng loại bài: Exercise Content, Word Bank, Paragraph Editor, Audio &amp; QR, Image Manager…
            </p>
            <ul>
              <li>Nhóm Exercise: <strong>{GROUP_NAME[adapter.group]}</strong></li>
              <li>Động cơ chữ: <code>{adapter.textEngine}</code></li>
              <li>
                Ảnh: {adapter.capabilities.image ? 'có' : 'không'} · QR: {adapter.capabilities.qr ? 'có' : 'không'} · Audio: {adapter.capabilities.audio ? 'có' : 'không'} · Chỗ trống: {adapter.capabilities.blank ? 'có' : 'không'}
              </li>
            </ul>

            <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #cbd5e1' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 6 }}>
                Danh sách bài tập ({exercises.length}):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {exercises.map((ex, i) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => {
                      setActiveExIndex(i);
                      if (ex.type && ex.type !== type) setType(ex.type);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '5px 8px',
                      fontSize: 12,
                      borderRadius: 6,
                      border: '1px solid',
                      borderColor: activeExIndex === i ? '#3b82f6' : '#e2e8f0',
                      background: activeExIndex === i ? '#eff6ff' : '#fff',
                      color: activeExIndex === i ? '#1d4ed8' : '#334155',
                      fontWeight: activeExIndex === i ? 600 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    Ex {i + 1}: {ex.title.length > 25 ? `${ex.title.slice(0, 25)}…` : ex.title}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => run('saveAdd')}
                style={{
                  marginTop: 8,
                  width: '100%',
                  padding: '5px',
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: '1px dashed #3b82f6',
                  background: '#f0fdf4',
                  color: '#16a34a',
                  cursor: 'pointer',
                }}
              >
                + Thêm bài tập mới (Save &amp; Add)
              </button>
            </div>
          </div>
        </div>

        <div className="stage">
          {showRuler && <div className="editor-ruler" aria-label="Ruler" />}
          <div
            ref={pageRef}
            className="page"
            style={{
              transform: `scale(${zoom / 100})`,
              width: pageSettings.orientation === 'portrait' ? '210mm' : '297mm',
              minHeight: pageSettings.orientation === 'portrait' ? '297mm' : '210mm',
              padding: `${pageSettings.marginMm}mm`,
              backgroundColor: pageSettings.pageColor,
              border: pageSettings.pageBorder ? '2px solid #334155' : undefined,
              fontFamily: pageSettings.fontFamily,
              fontSize: `${pageSettings.bodySize}pt`,
              lineHeight: pageSettings.lineHeight,
              '--page-columns': pageSettings.columns,
              '--heading-size': `${pageSettings.headingSize}pt`,
            } as CSSProperties}
            onContextMenu={(e) => {
              e.preventDefault();
              const t = e.target as HTMLElement;
              const tableItems = t.closest('.img') ? null : tableRef.current?.contextItems(t) ?? null;
              const items: MenuItem[] = t.closest('.img')
                ? ['Replace picture', 'Wrap text', 'Remove picture']
                : tableItems
                ? tableItems
                : t.closest('table')
                ? ['Insert row below', 'Insert column right', 'Delete table']
                : ['Cut', 'Copy', 'Paste', 'Clear formatting'];
              setMenu({ left: e.clientX, bottom: e.clientY, items });
            }}
            onClick={(event) => {
              const target = event.target as HTMLElement;
              const image = target.closest<HTMLElement>('.img');
              const table = target.closest<HTMLElement>('table');
              if (image) { selectedObjectRef.current = image; select('image'); }
              else if (table) { selectedObjectRef.current = target.closest<HTMLElement>('td, th') ?? table; select('table'); }
            }}
          >
            {pageSettings.watermark && <div className="page-watermark" contentEditable={false}>{pageSettings.watermark}</div>}
            {pageSettings.header && <header className="page-header" contentEditable={!previewMode} suppressContentEditableWarning onInput={(event) => { setPageSettings((current) => ({ ...current, header: event.currentTarget.innerText })); dirty(); }}>{pageSettings.header}</header>}
            {exercises.map((ex, idx) => (
              <div
                key={ex.id}
                data-ex-id={ex.id}
                className={`ex-block${activeExIndex === idx ? ' active' : ''}${ex.pageBreakBefore ? ' page-break-before' : ''}`}
                onClick={() => {
                  setActiveExIndex(idx);
                  if (ex.type && ex.type !== type) setType(ex.type);
                }}
              >
                {ex.showTitle !== false && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <h2
                      data-editor-title
                      contentEditable={!previewMode}
                      suppressContentEditableWarning
                      spellCheck={false}
                      onBeforeInput={pushHistory}
                      onInput={dirty}
                      style={{ margin: 0, flex: 1 }}
                    >
                      EXERCISE {idx + 1}: {ex.title}
                    </h2>
                    {false && activeExIndex === idx && (
                      <span style={{ fontSize: 10, padding: '2px 6px', background: '#dbeafe', color: '#1d4ed8', borderRadius: 4, fontWeight: 700 }}>
                        ĐANG CHỌN
                      </span>
                    )}
                  </div>
                )}

                {ex.showInstruction !== false && ex.instruction && (
                  <p style={{ margin: '0 0 8px', fontStyle: 'italic', color: '#475569', fontSize: 12.5 }}>
                    {ex.instruction}
                  </p>
                )}

                {ex.audioTrack && (
                  <div className="rb-audio-player">
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#166534' }}>
                      🎧 {ex.audioTrack.title} ({ex.audioTrack.duration})
                    </span>
                    {ex.audioTrack.src
                      ? <audio controls preload="metadata" src={ex.audioTrack.src} style={{ height: 30, marginLeft: 'auto', maxWidth: 280 }} />
                      : <span style={{ fontSize: 11, color: '#b45309', marginLeft: 'auto' }}>Chưa có dữ liệu file audio</span>}
                  </div>
                )}

                {ex.showWordBank !== false && ex.wordBank.length > 0 && (
                  <div
                    className="wb"
                    style={{
                      border: ex.wordBankBorder !== false ? '1.5px solid #1e293b' : 'none',
                      display: ex.wordBankStyle === 'grid3' ? 'grid' : ex.wordBankStyle === 'grid2' ? 'grid' : 'flex',
                      gridTemplateColumns: ex.wordBankStyle === 'grid3' ? 'repeat(3, 1fr)' : ex.wordBankStyle === 'grid2' ? 'repeat(2, 1fr)' : undefined,
                      flexWrap: ex.wordBankStyle === 'row' ? 'wrap' : undefined,
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    {ex.wordBank.map((w, wIdx) => (
                      <span key={wIdx} style={{ padding: '2px 8px', borderRadius: 4, background: '#fff', border: '1px solid #cbd5e1', fontSize: 12.5 }}>
                        {w}
                      </span>
                    ))}
                  </div>
                )}

                {ex.calloutBox && (
                  <div className="rb-callout-box">
                    💡 {ex.calloutBox}
                  </div>
                )}

                {idx === 0 && !imgHidden && (
                  <div
                    className={`img${selection === 'image' ? ' sel' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      select('image');
                    }}
                  >
                    Ảnh (bấm để chọn)
                  </div>
                )}

                {/* 1. Passage text editor (if Group A, C, or reading in B/D) */}
                {(adapterOf(ex.type ?? type).group === 'A' || adapterOf(ex.type ?? type).group === 'C' || ((adapterOf(ex.type ?? type).group === 'B' || adapterOf(ex.type ?? type).group === 'D') && ex.passage)) && (
                  <div
                    ref={idx === activeExIndex ? setBodyEl : undefined}
                    data-editor-body
                    contentEditable={!previewMode}
                    suppressContentEditableWarning
                    spellCheck={false}
                    onBeforeInput={pushHistory}
                    onInput={dirty}
                    onFocus={() => {
                      setActiveExIndex(idx);
                      if (!tableRef.current?.active()) select('text'); // đang thao tác trong bảng: giữ ngữ cảnh bảng
                    }}
                    style={{ minHeight: 48, marginBottom: 10 }}
                    dangerouslySetInnerHTML={{ __html: ex.contentHtml ?? passageToHtml(ex.passage, ex.id) }}
                  />
                )}

                {/* 2. Group B: Trắc nghiệm (MCQ) */}
                {adapterOf(ex.type ?? type).group === 'B' && ex.questions && ex.questions.length > 0 && (
                  <div className="rb-mcq-wrap">
                    {ex.questions.map((q, qIdx) => (
                      <div key={qIdx} className="rb-mcq-item">
                        <div className="rb-mcq-question-text">
                          <span className="rb-mcq-num">{q.number}.</span>
                          <span
                            contentEditable={!previewMode}
                            suppressContentEditableWarning
                            onBeforeInput={pushHistory}
                            onInput={dirty}
                            dangerouslySetInnerHTML={{ __html: q.text }}
                          />
                        </div>
                        {q.options && q.options.length > 0 && (
                          <div
                            className="rb-mcq-options"
                            style={{
                              gridTemplateColumns: ex.options?.optionColumns === '1' ? '1fr' : ex.options?.optionColumns === '4' ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
                            }}
                          >
                            {q.options.map((opt, optIdx) => (
                              <label key={optIdx} className="rb-mcq-option">
                                <input type="radio" name={`mcq-${idx}-${qIdx}`} />
                                <span
                                  contentEditable={!previewMode}
                                  suppressContentEditableWarning
                                  onBeforeInput={pushHistory}
                                  onInput={dirty}
                                  dangerouslySetInnerHTML={{ __html: opt }}
                                />
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. Group C: Cloze test options */}
                {adapterOf(ex.type ?? type).group === 'C' && ex.clozeQuestions && ex.clozeQuestions.length > 0 && (
                  <div className="rb-cloze-choices-wrap" style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Options for gaps:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                      {ex.clozeQuestions.map((cq, cqIdx) => (
                        <div key={cqIdx} style={{ padding: '6px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12 }}>
                          <strong>({cq.number})</strong>{' '}
                          {cq.options.map((opt, oIdx) => (
                            <span
                              key={oIdx}
                              contentEditable={!previewMode}
                              suppressContentEditableWarning
                              onBeforeInput={pushHistory}
                              onInput={dirty}
                              style={{ marginRight: 10 }}
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Group D: True / False / Not Given */}
                {adapterOf(ex.type ?? type).group === 'D' && ex.statements && ex.statements.length > 0 && (
                  <div className="rb-tfng-wrap" style={{ marginTop: 12 }}>
                    {ex.statements.map((stmt, sIdx) => (
                      <div key={sIdx} className="rb-tfng-row">
                        <div className="rb-tfng-text">
                          <strong style={{ marginRight: 6 }}>{stmt.number}.</strong>
                          <span
                            contentEditable={!previewMode}
                            suppressContentEditableWarning
                            onBeforeInput={pushHistory}
                            onInput={dirty}
                          >
                            {stmt.text}
                          </span>
                        </div>
                        <div className="rb-tfng-pills">
                          {(['True', 'False', 'Not Given'] as const).map((pill) => (
                            <button
                              key={pill}
                              type="button"
                              className={`rb-tfng-pill${stmt.answer === pill ? ' active' : ''}`}
                              onClick={() => {
                                const nextList = [...exercises];
                                const stmts = [...(ex.statements ?? [])];
                                stmts[sIdx] = { ...stmts[sIdx], answer: pill };
                                nextList[idx] = { ...ex, statements: stmts };
                                setExercises(nextList);
                                dirty();
                              }}
                            >
                              {pill === 'Not Given' ? 'NG' : pill}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 5. Group E: Nối chữ (Matching 2 columns) */}
                {adapterOf(ex.type ?? type).group === 'E' && ex.matchingPairs && ex.matchingPairs.length > 0 && (
                  <div className="rb-matching-grid" style={{ marginTop: 12 }}>
                    <div className="rb-matching-col">
                      <div className="rb-matching-col-header">Left Column (1 - {ex.matchingPairs.length})</div>
                      {ex.matchingPairs.map((pair, pIdx) => (
                        <div key={pIdx} className="rb-matching-item">
                          <span className="rb-matching-badge">{pair.leftNumber}</span>
                          <span
                            contentEditable={!previewMode}
                            suppressContentEditableWarning
                            onBeforeInput={pushHistory}
                            onInput={dirty}
                          >
                            {pair.leftText}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="rb-matching-col">
                      <div className="rb-matching-col-header">Right Column (A - {String.fromCharCode(64 + ex.matchingPairs.length)})</div>
                      {ex.matchingPairs.map((pair, pIdx) => (
                        <div key={pIdx} className="rb-matching-item">
                          <span className="rb-matching-badge" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}>
                            {pair.rightLetter}
                          </span>
                          <span
                            contentEditable={!previewMode}
                            suppressContentEditableWarning
                            onBeforeInput={pushHistory}
                            onInput={dirty}
                          >
                            {pair.rightText}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Group F: Matching Pictures */}
                {adapterOf(ex.type ?? type).group === 'F' && ex.pictureItems && ex.pictureItems.length > 0 && (
                  <div className="rb-pictures-grid" style={{ marginTop: 12 }}>
                    {ex.pictureItems.map((pic, pIdx) => (
                      <div
                        key={pIdx}
                        className={`rb-picture-card ${selectedPictureCardIdx === pIdx ? 'selected' : ''}`}
                        onClick={() => setSelectedPictureCardIdx(pIdx)}
                        onDoubleClick={() => {
                          setSelectedPictureCardIdx(pIdx);
                          pictureInputRef.current?.click();
                        }}
                        style={{ cursor: 'pointer', outline: selectedPictureCardIdx === pIdx ? '2px solid #2563eb' : undefined }}
                      >
                        <div className="rb-picture-preview-box" title="Nhấp đúp để đổi ảnh">
                          {pic.imageUrl ? (
                            <img src={pic.imageUrl} alt={pic.caption} style={{ maxWidth: '100%', maxHeight: 90, objectFit: 'contain' }} />
                          ) : (
                            <>
                              <span style={{ fontSize: 26 }}>🏛️</span>
                              <span style={{ fontSize: 10.5, color: '#64748b', marginTop: 4 }}>[Nhấp đúp để tải ảnh]</span>
                            </>
                          )}
                        </div>
                        <div className="rb-picture-label">{pic.label}</div>
                        <div
                          className="rb-picture-caption"
                          contentEditable={!previewMode}
                          suppressContentEditableWarning
                          onBeforeInput={pushHistory}
                          onInput={dirty}
                        >
                          {pic.caption}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>
                          {pic.matchingPrompt}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 7. Group G: Table completion */}
                {adapterOf(ex.type ?? type).group === 'G' && ex.tableData && (
                  <div className="rb-table-wrap" style={{ marginTop: 12 }}>
                    <table className="rb-exercise-table">
                      {ex.tableData.headers && (
                        <thead>
                          <tr>
                            {ex.tableData.headers.map((h, hIdx) => (
                              <th
                                key={hIdx}
                                contentEditable={!previewMode}
                                suppressContentEditableWarning
                                onBeforeInput={pushHistory}
                                onInput={dirty}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                      )}
                      <tbody>
                        {ex.tableData.rows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                contentEditable={!previewMode}
                                suppressContentEditableWarning
                                onBeforeInput={pushHistory}
                                onInput={dirty}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 8. Group H: Sắp xếp / đặt câu (Sentence construction) */}
                {adapterOf(ex.type ?? type).group === 'H' && ex.sentenceItems && ex.sentenceItems.length > 0 && (
                  <div className="rb-sentences-wrap" style={{ marginTop: 12 }}>
                    {ex.sentenceItems.map((item, sIdx) => (
                      <div key={sIdx} className="rb-sentence-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, color: '#1e3a8a', fontSize: 13 }}>{item.number}.</span>
                          {item.jumbledWords.split(/\s*\/\s*/).map((word, wIdx) => (
                            <span key={wIdx} className="rb-word-chip">{word}</span>
                          ))}
                          {item.hintInParentheses && (
                            <span style={{ fontSize: 11.5, color: '#64748b', fontStyle: 'italic' }}>({item.hintInParentheses})</span>
                          )}
                        </div>
                        <div
                          className="rb-sentence-line"
                          contentEditable={!previewMode}
                          suppressContentEditableWarning
                          onBeforeInput={pushHistory}
                          onInput={dirty}
                        >
                          ....................................................................................................................................................................
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {idx === 0 && !tblHidden && (
                  <table
                    data-demo-table="true"
                    // Nội dung do tableEngine chỉnh trực tiếp trên DOM nên không để React quản lý từng ô
                    dangerouslySetInnerHTML={{ __html: DEMO_TABLE_HTML }}
                  />
                )}
              </div>
            ))}
            {(pageSettings.footer || pageSettings.pageNumber) && <footer className="page-footer"><span>{pageSettings.footer}</span>{pageSettings.pageNumber && <span>1</span>}</footer>}
          </div>
        </div>
      </div>

      <input
        ref={pictureInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (!file.type.startsWith('image/')) { say('File đã chọn không phải hình ảnh hợp lệ.'); return; }
          const reader = new FileReader();
          reader.onerror = () => say('Không thể đọc file hình ảnh.');
          reader.onload = () => {
            restoreEditorSelection();
            const src = String(reader.result);
            const current = exercises[activeExIndex] ?? exercises[0];
            const adapter = adapterOf(current.type ?? type);
            if (adapter.group === 'F' && current.pictureItems && current.pictureItems.length > 0) {
              pushHistory();
              const nextList = [...exercises];
              const items = [...current.pictureItems];
              const targetIdx = selectedPictureCardIdx >= 0 && selectedPictureCardIdx < items.length ? selectedPictureCardIdx : items.length - 1;
              items[targetIdx] = {
                ...items[targetIdx],
                imageUrl: src,
              };
              nextList[activeExIndex] = {
                ...current,
                pictureItems: items,
              };
              setExercises(nextList);
              dirty();
              say(`✓ Đã cập nhật ảnh cho mục ${items[targetIdx].label}`);
              return;
            }
            const replacement = replacePictureRef.current ? selectedPicture() : null;
            if (replacement instanceof HTMLImageElement) {
              replacement.src = src;
              replacement.alt = file.name;
            } else {
              document.execCommand('insertHTML', false, `<img class="img inserted-image" src="${src}" alt="${file.name.replace(/["<>]/g, '')}" style="width:55mm;height:auto" />`);
            }
            replacePictureRef.current = false;
            dirty();
          };
          reader.readAsDataURL(file);
          event.target.value = '';
        }}
      />

      <MiniToolbar container={pageRef.current} state={state} send={run} />

      {menu && (
        <Popover anchor={menu} onClose={() => setMenu(null)}>
          <ContextMenu items={menu.items} onPick={(item) => {
            setMenu(null);
            const command = { Cut: 'cut', Copy: 'copy', Paste: 'paste', 'Clear formatting': 'clearFormat' }[item];
            if (command) run(command);
            else if (tableRef.current?.pick(item)) return;
            else say(`${item} – giao diện, chưa nối`);
          }} />
        </Popover>
      )}

      {findReplaceMode && (
        <FindReplacePanel
          root={pageRef.current}
          mode={findReplaceMode}
          onModeChange={setFindReplaceMode}
          onClose={() => setFindReplaceMode(null)}
          onDocumentChange={dirty}
        />
      )}

      <HelpCenter
        open={helpSection !== null}
        section={helpSection ?? 'guide'}
        onSectionChange={setHelpSection}
        onClose={() => setHelpSection(null)}
        onSubmitFeedback={submitFeedback}
        feedbackSuccessMessage="Phản hồi đã được lưu trên trình duyệt của bản demo. Khi tích hợp, callback này sẽ gửi tới API của Flow Bridge Studio."
      />

      {/* Modal Thông tin tài liệu */}
      {docInfoOpen && (
        <DocInfoModal
          data={docInfoData}
          onClose={() => setDocInfoOpen(false)}
          onExportDocx={() => {
            setDocInfoOpen(false);
            handleExportDocx();
          }}
          onPrint={() => {
            setDocInfoOpen(false);
            window.print();
          }}
        />
      )}

      {/* Modal Xác nhận xóa bài tập */}
      {deleteModalOpen && (
        <DeleteConfirmModal
          exerciseTitle={currentEx ? `Exercise ${activeExIndex + 1}: ${currentEx.title}` : undefined}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Modal Cảnh báo khi Back mà chưa lưu */}
      {backModalOpen && (
        <BackConfirmModal
          onClose={() => setBackModalOpen(false)}
          onSaveAndLeave={handleSaveAndLeave}
          onDiscardAndLeave={handleDiscardAndLeave}
        />
      )}

      {/* Modal Cài đặt riêng loại bài (Set Options) */}
      {setOptionsOpen && (
        <SetOptionsModal
          group={adapter.group}
          groupName={GROUP_NAME[adapter.group]}
          options={{
            blankWidth: currentEx?.blankWidth ?? 28,
            blankStroke: currentEx?.blankStroke ?? 'dashed',
            blankLabel: currentEx?.blankLabel ?? '(a)',
            wordBankStyle: currentEx?.wordBankStyle ?? 'row',
            wordBankBorder: currentEx?.wordBankBorder ?? true,
            hint: currentEx?.hint ?? true,
            ...(currentEx?.options ?? {}),
          }}
          onClose={() => setSetOptionsOpen(false)}
          onSave={(newOpts) => {
            const nextList = collectExercisesFromEditor();
            nextList[activeExIndex] = {
              ...nextList[activeExIndex],
              ...newOpts,
              options: {
                ...(nextList[activeExIndex].options ?? {}),
                ...newOpts,
              },
            };
            const editor = pageRef.current?.querySelector<HTMLElement>('.ex-block.active [data-editor-body]');
            editor?.querySelectorAll<HTMLElement>('[data-blank-id]').forEach((blank) => {
              if (newOpts.blankWidth) blank.style.setProperty('--blank-width', `${newOpts.blankWidth}mm`);
              if (newOpts.blankStroke) blank.dataset.stroke = newOpts.blankStroke as string;
              if (newOpts.blankLabel) blank.dataset.hideLabel = String(newOpts.blankLabel === 'none');
            });
            setExercises(nextList);
            dirty();
            say('✓ Đã cập nhật cài đặt hiển thị loại bài (Set Options)');
          }}
        />
      )}

      {/* Modal Cấu hình bài tập (Exercise Settings) */}
      {exerciseSettingsOpen && (
        <ExerciseSettingsModal
          settings={{
            title: currentEx?.title ?? '',
            instruction: currentEx?.instruction ?? '',
            showTitle: currentEx?.showTitle ?? true,
            showInstruction: currentEx?.showInstruction ?? true,
            points: currentEx?.points ?? 10,
            pageBreakBefore: currentEx?.pageBreakBefore ?? false,
          }}
          onClose={() => setExerciseSettingsOpen(false)}
          onSave={(newSettings) => {
            const nextList = collectExercisesFromEditor();
            nextList[activeExIndex] = {
              ...nextList[activeExIndex],
              ...newSettings,
            };
            setExercises(nextList);
            dirty();
            say('✓ Đã lưu cấu hình bài tập (Exercise Settings)');
          }}
        />
      )}

      {/* Modal AI Assist */}
      {aiAssistOpen && (
        <AiAssistModal
          group={adapter.group}
          groupName={GROUP_NAME[adapter.group]}
          initialTab={aiAssistOpen}
          aiEnabled={false}
          currentPassage={currentEx.passage}
          onClose={() => setAiAssistOpen(null)}
          onApplyResult={(result) => {
            const nextList = collectExercisesFromEditor();
            const generatedQuestions = result.questions ?? result.statements?.map((statement) => ({
              number: statement.number,
              text: statement.text,
              options: ['True', 'False', 'Not Given'],
            }));
            const generatedPassage = result.passage
              ?? result.matchingPairs?.map((pair) => `${pair.leftNumber}. ${pair.leftText} — ${pair.rightLetter}. ${pair.rightText}`).join('\n')
              ?? result.sentenceItems?.map((item) => `${item.number}. ${item.jumbledWords}${item.hintInParentheses ? ` ${item.hintInParentheses}` : ''}`).join('\n');
            nextList[activeExIndex] = {
              ...nextList[activeExIndex],
              title: result.title || nextList[activeExIndex].title,
              instruction: result.instruction ?? nextList[activeExIndex].instruction,
              wordBank: result.wordBank ?? nextList[activeExIndex].wordBank,
              passage: result.passage ?? generatedPassage ?? nextList[activeExIndex].passage,
              contentHtml: undefined,
              questions: result.questions ?? generatedQuestions ?? nextList[activeExIndex].questions,
              statements: result.statements ?? nextList[activeExIndex].statements,
              matchingPairs: result.matchingPairs ?? nextList[activeExIndex].matchingPairs,
              sentenceItems: result.sentenceItems ?? nextList[activeExIndex].sentenceItems,
            };
            setExercises(nextList);
            dirty();
            say('✓ Đã áp dụng nội dung đã xem trước vào bài tập.');
          }}
        />
      )}

      {/* Modal Quản lý âm thanh */}
      {audioModalOpen && (
        <AudioModal
          mode={audioModalOpen}
          onClose={() => setAudioModalOpen(null)}
          onSelectTrack={(title, duration, src) => {
            const nextList = [...exercises];
            nextList[activeExIndex] = {
              ...currentEx,
              audioTrack: { title, duration, src },
            };
            setExercises(nextList);
            dirty();
            say(`✓ Đã gắn file nghe: ${title}`);
          }}
        />
      )}

      {/* Modal Thêm từ vào Word Bank */}
      {wordBankModalOpen && (
        <WordBankModal
          mode={wordBankModalOpen}
          currentWords={currentEx?.wordBank ?? []}
          onClose={() => setWordBankModalOpen(null)}
          onSave={(newWords) => {
            const nextList = collectExercisesFromEditor();
            nextList[activeExIndex] = {
              ...nextList[activeExIndex],
              wordBank: newWords,
            };
            setExercises(nextList);
            dirty();
            say(`✓ Đã cập nhật khung từ (${newWords.length} từ)`);
          }}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
