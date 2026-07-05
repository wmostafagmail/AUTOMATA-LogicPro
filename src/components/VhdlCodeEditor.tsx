import React, { useMemo, useRef } from 'react';

const VHDL_KEYWORDS = new Set([
  'library', 'use', 'entity', 'is', 'port', 'generic', 'architecture', 'of', 'begin', 'end',
  'process', 'if', 'then', 'elsif', 'else', 'case', 'when', 'others', 'signal', 'constant',
  'variable', 'type', 'record', 'array', 'downto', 'to', 'loop', 'for', 'while', 'wait',
  'assert', 'report', 'severity', 'function', 'procedure', 'package', 'body', 'component',
  'map', 'generate', 'block', 'next', 'exit', 'after', 'transport', 'inertial', 'null',
  'shared', 'file', 'open', 'alias', 'attribute', 'configuration', 'return', 'not', 'and',
  'or', 'xor', 'xnor', 'nand', 'nor', 'mod', 'rem', 'abs', 'buffer', 'in', 'out', 'inout',
  'rising_edge', 'falling_edge'
]);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightVhdl(value: string) {
  return escapeHtml(value)
    .replace(/(--.*)$/gm, '<span class="text-slate-500">$1</span>')
    .replace(/(".*?")/g, '<span class="text-amber-200">$1</span>')
    .replace(/\b(\d+(?:_\d+)*|'[01UXZWLH-]')\b/g, '<span class="text-cyan-300">$1</span>')
    .replace(/\b([a-zA-Z][a-zA-Z0-9_]*)\b/g, (match, word: string) => (
      VHDL_KEYWORDS.has(word.toLowerCase())
        ? `<span class="text-fuchsia-300">${word}</span>`
        : match
    ));
}

export const VhdlCodeEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}> = ({
  value,
  onChange,
  readOnly = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);
  const highlighted = useMemo(() => highlightVhdl(value || ' '), [value]);

  const syncScroll = () => {
    if (!textareaRef.current || !preRef.current) return;
    preRef.current.scrollTop = textareaRef.current.scrollTop;
    preRef.current.scrollLeft = textareaRef.current.scrollLeft;
  };

  return (
    <div className="relative h-full min-h-0 overflow-hidden rounded-lg border border-emerald-400/20 bg-[#050811]">
      <pre
        ref={preRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-auto px-4 py-3 font-mono text-[12px] leading-6 whitespace-pre text-slate-200"
        dangerouslySetInnerHTML={{ __html: `${highlighted}\n` }}
      />
      <textarea
        ref={textareaRef}
        value={value}
        readOnly={readOnly}
        spellCheck={false}
        onScroll={syncScroll}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 resize-none overflow-auto bg-transparent px-4 py-3 font-mono text-[12px] leading-6 text-transparent caret-cyan-300 outline-none selection:bg-cyan-400/25"
      />
    </div>
  );
};
