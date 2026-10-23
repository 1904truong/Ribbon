// 19 loại bài và khả năng của từng loại (nguồn: RIBBON_SPEC.md mục 12, 20; editor tương ứng ghi ở comment).
// Ribbon dùng `capabilities` để tự ẩn / tự khóa nút, không viết điều kiện riêng từng loại bài.

import type { Capabilities, ExerciseAdapter, ExerciseGroup, ExerciseType, TextEngine } from './types';

export const GROUP_NAME: Record<ExerciseGroup, string> = {
  A: 'Khung từ + chỗ trống', B: 'Trắc nghiệm', C: 'Cloze', D: 'Đúng / Sai / Không có',
  E: 'Nối chữ', F: 'Nối với ảnh', G: 'Bảng', H: 'Sắp xếp / đặt câu',
};

const cap = (p: Partial<Capabilities>): Capabilities => ({
  image: false, table: false, blank: false, qr: false, audio: false, wordBank: false, smartAi: false, gallery: false, ...p,
});

const a = (type: ExerciseType, label: string, group: ExerciseGroup, textEngine: TextEngine, c: Partial<Capabilities>): ExerciseAdapter =>
  ({ type, label, group, textEngine, capabilities: cap(c) });

export const ADAPTERS: ExerciseAdapter[] = [
  // ListeningGapFillEditor – engine riêng (A4DocHost)
  a('listening_gap_fill', 'Listening Fill in the Gap', 'A', 'listening-doc', { image: true, table: true, blank: true, qr: true, audio: true, wordBank: true, smartAi: true }),
  // ListeningMcqEditor
  a('listening_multiple_choice', 'Listening Multiple Choice', 'B', 'rich-fields', { image: true, qr: true, audio: true, smartAi: true }),
  // ListeningTrueFalseEditor
  a('listening_true_false', 'Listening True / False', 'D', 'rich-fields', { image: true, qr: true, audio: true, smartAi: true }),
  // ListeningMatchingEditor
  a('listening_matching', 'Listening Matching', 'E', 'rich-fields', { qr: true, audio: true, smartAi: true }),
  // ListeningTableEditor
  a('listening_table_completion', 'Listening Table Completion', 'G', 'rich-fields', { image: true, table: true, qr: true, audio: true, smartAi: true }),
  // ReadingMcqEditor (dùng chung 2 loại)
  a('reading_multiple_choice', 'Reading Multiple Choice', 'B', 'rich-fields', { image: true, smartAi: true }),
  a('reading_short_answer', 'Reading Short Answer', 'B', 'rich-fields', { image: true, smartAi: true }),
  // TfngEditor
  a('true_false_not_given', 'True / False / Not Given', 'D', 'rich-fields', { image: true, smartAi: true }),
  // MatchingHeadingsEditor
  a('matching_headings', 'Matching Headings', 'E', 'rich-fields', { image: true, smartAi: true }),
  // MatchingEditor (dữ liệu `matching`, 6 layout)
  a('matching_information', 'Matching Information', 'E', 'component-style', { smartAi: true }),
  // MatchingVocabularyEditor
  a('matching_vocabulary', 'Matching Vocabulary', 'E', 'rich-fields', { wordBank: true, smartAi: true }),
  // MatchingPicturesEditor
  a('matching_pictures', 'Matching Pictures', 'F', 'rich-fields', { image: true, gallery: true, smartAi: true }),
  // GrammarMcqEditor (dùng chung 4 loại)
  a('grammar_vocab_multiple_choice', 'Grammar & Vocab Multiple Choice', 'B', 'rich-fields', { smartAi: true }),
  a('pronunciation_multiple_choice', 'Pronunciation Multiple Choice', 'B', 'rich-fields', { smartAi: true }),
  // MultipleChoiceClozeEditor – chưa dùng ô chữ chung
  a('grammar_vocab_cloze', 'Grammar & Vocab Cloze', 'C', 'component-style', { image: true, blank: true, smartAi: true }),
  // GapFillingEditor
  a('gap_filling_word_formation', 'Gap Filling / Word Formation', 'A', 'rich-fields', { image: true, blank: true, qr: true, wordBank: true, smartAi: true }),
  a('sentence_rearrangement', 'Sentence Rearrangement', 'H', 'rich-fields', { smartAi: true }),
  a('sentence_construction', 'Sentence Construction', 'H', 'rich-fields', { smartAi: true }),
  // SentenceCompletionEditor
  a('sentence_completion', 'Sentence Completion', 'A', 'rich-fields', { blank: true, qr: true, wordBank: true, smartAi: true }),
];

export const adapterOf = (type: ExerciseType): ExerciseAdapter => ADAPTERS.find((x) => x.type === type) ?? ADAPTERS[0];
