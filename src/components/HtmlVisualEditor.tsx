'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Download, Upload, Monitor, Smartphone, Tablet,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Trash2, Copy, ChevronLeft, Code2, X, FileText, Sparkles,
} from 'lucide-react'
import { cn, downloadFile, FONT_OPTIONS } from '@/lib/utils'
import { injectEditorScript, normalizeHtml } from '@/lib/editorScript'
import { SAMPLE_TEMPLATE } from '@/lib/sampleTemplate'

// ── Types ────────────────────────────────────────────────────────────────────

interface ElementStyles {
  color: string
  backgroundColor: string
  fontSize: string
  fontFamily: string
  fontWeight: string
  fontStyle: string
  textDecoration: string
  textAlign: string
  letterSpacing: string
  lineHeight: string
  borderRadius: string
  opacity: string
  padding: string
  paddingTop: string
  paddingRight: string
  paddingBottom: string
  paddingLeft: string
}

interface SelectedElement {
  tagName: string
  id: string
  className: string
  textContent: string
  isText: boolean
  isImage: boolean
  isContainer: boolean
  src: string | null
  href: string | null
  alt: string | null
  styles: ElementStyles
}

type ViewMode = 'desktop' | 'tablet' | 'mobile'
type Step = 'import' | 'edit'

const DEFAULT_STYLES: ElementStyles = {
  color: '#000000', backgroundColor: 'transparent',
  fontSize: '16', fontFamily: '', fontWeight: '400',
  fontStyle: 'normal', textDecoration: 'none', textAlign: 'left',
  letterSpacing: '0', lineHeight: '1.5', borderRadius: '0',
  opacity: '1', padding: '', paddingTop: '0', paddingRight: '0',
  paddingBottom: '0', paddingLeft: '0',
}

const CANVAS_WIDTHS: Record<ViewMode, string> = {
  desktop: '100%',
  tablet:  '768px',
  mobile:  '390px',
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HtmlVisualEditor() {
  const [step, setStep] = useState<Step>('import')
  const [htmlInput, setHtmlInput] = useState('')
  const [iframeDoc, setIframeDoc] = useState('')
  const [selected, setSelected] = useState<SelectedElement | null>(null)
  const [styles, setStyles] = useState<ElementStyles>(DEFAULT_STYLES)
  const [viewMode, setViewMode] = useState<ViewMode>('desktop')
  const [editingText, setEditingText] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [codeValue, setCodeValue] = useState('')

  const iframeRef = useRef<HTMLIFrameElement>(null)

  // ── iframe messaging ──────────────────────────────────────────────────────

  const send = useCallback((msg: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(msg, '*')
  }, [])

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const d = e.data
      if (!d?.type) return

      if (d.type === 'ELEMENT_SELECTED') {
        setSelected(d as SelectedElement & { type: string })
        setStyles({ ...DEFAULT_STYLES, ...d.styles })
        setEditingText(false)
      }
      if (d.type === 'DESELECTED' || d.type === 'ELEMENT_DELETED') {
        setSelected(null)
        setStyles(DEFAULT_STYLES)
        setEditingText(false)
      }
      if (d.type === 'EDITING_TEXT') setEditingText(true)
      if (d.type === 'TEXT_CHANGED')  setEditingText(false)
      if (d.type === 'HTML_CONTENT') {
        downloadFile(d.html as string, 'page.html')
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // ── Load HTML into iframe ─────────────────────────────────────────────────

  const loadHtml = useCallback((raw: string) => {
    const normalized = normalizeHtml(raw.trim())
    const injected   = injectEditorScript(normalized)
    setIframeDoc(injected)
    setCodeValue(normalized)
    setSelected(null)
    setStyles(DEFAULT_STYLES)
    setStep('edit')
  }, [])

  // ── Style helpers ─────────────────────────────────────────────────────────

  const applyStyle = useCallback((cssProps: Partial<Record<string, string>>) => {
    send({ type: 'APPLY_STYLE', styles: cssProps })
    setStyles(prev => ({ ...prev, ...cssProps }))
  }, [send])

  const toggle = useCallback((prop: string, onVal: string, offVal: string) => {
    const current = styles[prop as keyof ElementStyles]
    applyStyle({ [prop]: current === onVal ? offVal : onVal })
  }, [styles, applyStyle])

  // ── Export ────────────────────────────────────────────────────────────────

  const exportHtml = useCallback(() => {
    send({ type: 'GET_HTML' })
  }, [send])

  // ── Code panel sync ───────────────────────────────────────────────────────

  const applyCodeEdit = useCallback(() => {
    loadHtml(codeValue)
  }, [codeValue, loadHtml])

  // ─────────────────────────────────────────────────────────────────────────
  // IMPORT SCREEN
  // ─────────────────────────────────────────────────────────────────────────

  if (step === 'import') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-8 h-16 bg-white/80 backdrop-blur border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-sm tracking-tight">HTML Visual Editor</span>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
          <div className="w-full max-w-2xl">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
              Paste your HTML to get started
            </h1>
            <p className="text-slate-500 mb-8 text-base leading-relaxed">
              Generated a one-pager with Claude? Paste the HTML below and edit it
              visually — no coding required.
            </p>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
                <Code2 size={14} className="text-slate-400" />
                <span className="text-xs text-slate-500 font-medium">Paste HTML code</span>
              </div>
              <textarea
                className="w-full h-64 px-4 py-3 font-mono text-xs text-slate-700 resize-none focus:outline-none placeholder:text-slate-300"
                placeholder={'<!DOCTYPE html>\n<html>\n  ...\n</html>'}
                value={htmlInput}
                onChange={e => setHtmlInput(e.target.value)}
                spellCheck={false}
              />
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => htmlInput.trim() && loadHtml(htmlInput)}
                disabled={!htmlInput.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm
                           hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Sparkles size={15} />
                Open in Editor
              </button>

              <span className="text-slate-400 text-sm">or</span>

              <button
                onClick={() => loadHtml(SAMPLE_TEMPLATE)}
                className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700
                           rounded-xl font-medium text-sm hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <FileText size={15} />
                Try sample template
              </button>
            </div>

            {/* Tip */}
            <p className="mt-6 text-xs text-slate-400">
              💡 Tip: Ask Claude to&nbsp;
              <span className="font-medium text-slate-500">&ldquo;generate a one-page marketing site in HTML with inline CSS&rdquo;</span>
              &nbsp;then paste it here.
            </p>
          </div>
        </main>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EDITOR SCREEN
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <header className="h-12 flex items-center justify-between px-4 bg-white border-b border-slate-200 shrink-0 z-10">
        {/* Left */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setStep('import'); setSelected(null) }}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="w-px h-4 bg-slate-200 mx-1" />

          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center">
              <Sparkles size={10} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-800 hidden sm:inline">HTML Visual Editor</span>
          </div>
        </div>

        {/* Center — view mode */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {(['desktop', 'tablet', 'mobile'] as ViewMode[]).map(m => {
            const Icon = m === 'desktop' ? Monitor : m === 'tablet' ? Tablet : Smartphone
            return (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  viewMode === m ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600',
                )}
                title={m.charAt(0).toUpperCase() + m.slice(1)}
              >
                <Icon size={15} />
              </button>
            )
          })}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCode(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              showCode
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            <Code2 size={13} />
            <span className="hidden sm:inline">Code</span>
          </button>

          <button
            onClick={exportHtml}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      {/* ── Main area ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Code panel (left, collapsible) */}
        {showCode && (
          <aside className="w-80 shrink-0 bg-slate-900 flex flex-col border-r border-slate-700">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700">
              <span className="text-xs text-slate-400 font-medium">HTML Source</span>
              <button
                onClick={applyCodeEdit}
                className="text-xs text-indigo-400 font-semibold hover:text-indigo-300"
              >
                Apply changes
              </button>
            </div>
            <textarea
              className="flex-1 px-4 py-3 font-mono text-xs text-slate-300 bg-slate-900 resize-none focus:outline-none leading-relaxed"
              value={codeValue}
              onChange={e => setCodeValue(e.target.value)}
              spellCheck={false}
            />
          </aside>
        )}

        {/* Canvas */}
        <main
          className="flex-1 overflow-auto flex flex-col items-center py-6 px-4"
          onClick={e => {
            if (e.target === e.currentTarget) {
              send({ type: 'DESELECT' })
              setSelected(null)
            }
          }}
        >
          {editingText && (
            <div className="mb-3 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium shrink-0">
              Double-click mode — editing text directly. Click outside to finish.
            </div>
          )}

          <div
            className="transition-all duration-300 bg-white shadow-xl rounded-lg overflow-hidden"
            style={{ width: CANVAS_WIDTHS[viewMode], minHeight: '600px' }}
          >
            <iframe
              ref={iframeRef}
              srcDoc={iframeDoc}
              className="w-full border-0"
              style={{ minHeight: '600px', height: '100%', display: 'block' }}
              title="Visual editor canvas"
            />
          </div>
        </main>

        {/* Properties panel (right) */}
        <aside
          className={cn(
            'w-72 shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-hidden transition-all duration-200',
            !selected && 'opacity-60',
          )}
        >
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Upload size={18} className="text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">Click any element</p>
              <p className="text-xs text-slate-400 mt-1">Select an element on the canvas to edit its properties</p>
            </div>
          ) : (
            <PropertiesPanel
              selected={selected}
              styles={styles}
              applyStyle={applyStyle}
              toggle={toggle}
              send={send}
              onDelete={() => send({ type: 'DELETE_ELEMENT' })}
              onDuplicate={() => send({ type: 'DUPLICATE_ELEMENT' })}
              onDeselect={() => { send({ type: 'DESELECT' }); setSelected(null) }}
            />
          )}
        </aside>
      </div>
    </div>
  )
}

// ── Properties Panel ──────────────────────────────────────────────────────────

interface PanelProps {
  selected: SelectedElement
  styles: ElementStyles
  applyStyle: (props: Partial<Record<string, string>>) => void
  toggle: (prop: string, on: string, off: string) => void
  send: (msg: Record<string, unknown>) => void
  onDelete: () => void
  onDuplicate: () => void
  onDeselect: () => void
}

function PropertiesPanel({ selected, styles, applyStyle, toggle, send, onDelete, onDuplicate, onDeselect }: PanelProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Element header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-xs font-mono bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-semibold">
            &lt;{selected.tagName}&gt;
          </span>
          {selected.id && (
            <span className="ml-1.5 text-xs text-slate-400 font-mono">#{selected.id}</span>
          )}
        </div>
        <button onClick={onDeselect} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Actions */}
      <div className="px-4 py-2.5 border-b border-slate-100 flex gap-2">
        <button
          onClick={onDuplicate}
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <Copy size={12} /> Duplicate
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <Trash2 size={12} /> Delete
        </button>
      </div>

      <div className="px-4 py-4 space-y-5">

        {/* ── Typography ─────────────────────────────────────────── */}
        <Section label="Typography">
          {/* Font family */}
          <Field label="Font">
            <select
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-700"
              value={styles.fontFamily}
              onChange={e => applyStyle({ fontFamily: e.target.value })}
            >
              <option value="">— inherited —</option>
              {FONT_OPTIONS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </Field>

          {/* Size + Weight row */}
          <div className="flex gap-2">
            <Field label="Size (px)" className="flex-1">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
                <input
                  type="number"
                  min={1} max={200}
                  className="w-full text-xs px-2.5 py-1.5 bg-transparent focus:outline-none text-slate-700"
                  value={styles.fontSize}
                  onChange={e => applyStyle({ fontSize: e.target.value + 'px' })}
                />
              </div>
            </Field>
            <Field label="Weight" className="flex-1">
              <select
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                value={styles.fontWeight}
                onChange={e => applyStyle({ fontWeight: e.target.value })}
              >
                {[['300','Light'],['400','Regular'],['500','Medium'],['600','Semibold'],['700','Bold'],['800','Extrabold'],['900','Black']].map(([v,l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Style toggles */}
          <Field label="Style">
            <div className="flex gap-1">
              {[
                { icon: <Bold size={13} />,      prop: 'fontWeight',     on: '700', off: '400',    active: styles.fontWeight === '700',     title: 'Bold' },
                { icon: <Italic size={13} />,    prop: 'fontStyle',      on: 'italic', off: 'normal', active: styles.fontStyle === 'italic', title: 'Italic' },
                { icon: <Underline size={13} />, prop: 'textDecoration', on: 'underline', off: 'none', active: styles.textDecoration?.includes('underline'), title: 'Underline' },
              ].map(({ icon, prop, on, off, active, title }) => (
                <button
                  key={prop}
                  title={title}
                  onClick={() => toggle(prop, on, off)}
                  className={cn(
                    'w-8 h-8 flex items-center justify-center rounded-lg border text-xs transition-colors',
                    active
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100',
                  )}
                >
                  {icon}
                </button>
              ))}

              <div className="w-px h-8 bg-slate-200 mx-0.5" />

              {/* Alignment */}
              {[
                { icon: <AlignLeft size={13} />,    val: 'left',    title: 'Left' },
                { icon: <AlignCenter size={13} />,  val: 'center',  title: 'Center' },
                { icon: <AlignRight size={13} />,   val: 'right',   title: 'Right' },
                { icon: <AlignJustify size={13} />, val: 'justify', title: 'Justify' },
              ].map(({ icon, val, title }) => (
                <button
                  key={val}
                  title={title}
                  onClick={() => applyStyle({ textAlign: val })}
                  className={cn(
                    'w-8 h-8 flex items-center justify-center rounded-lg border text-xs transition-colors',
                    styles.textAlign === val
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100',
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </Field>

          {/* Letter spacing + Line height */}
          <div className="flex gap-2">
            <Field label="Letter spacing" className="flex-1">
              <NumberInput
                value={styles.letterSpacing}
                min={-5} max={20} step={0.5}
                onChange={v => applyStyle({ letterSpacing: v + 'px' })}
              />
            </Field>
            <Field label="Line height" className="flex-1">
              <NumberInput
                value={styles.lineHeight}
                min={0.5} max={4} step={0.1}
                onChange={v => applyStyle({ lineHeight: v })}
              />
            </Field>
          </div>
        </Section>

        {/* ── Colors ─────────────────────────────────────────────── */}
        <Section label="Colors">
          <ColorField
            label="Text color"
            value={styles.color}
            onChange={v => applyStyle({ color: v })}
          />
          <ColorField
            label="Background"
            value={styles.backgroundColor}
            onChange={v => applyStyle({ backgroundColor: v })}
            allowTransparent
          />
        </Section>

        {/* ── Spacing ────────────────────────────────────────────── */}
        <Section label="Spacing">
          <Field label="Padding (px)">
            <div className="grid grid-cols-3 gap-1 items-center">
              {/* Top */}
              <div />
              <NumberInput value={styles.paddingTop}    onChange={v => applyStyle({ paddingTop:    v + 'px' })} />
              <div />
              {/* Left / Right */}
              <NumberInput value={styles.paddingLeft}   onChange={v => applyStyle({ paddingLeft:   v + 'px' })} />
              <div className="text-center text-[10px] text-slate-400 font-mono">pad</div>
              <NumberInput value={styles.paddingRight}  onChange={v => applyStyle({ paddingRight:  v + 'px' })} />
              {/* Bottom */}
              <div />
              <NumberInput value={styles.paddingBottom} onChange={v => applyStyle({ paddingBottom: v + 'px' })} />
              <div />
            </div>
          </Field>

          <Field label="Border radius (px)">
            <NumberInput
              value={styles.borderRadius}
              min={0} max={200}
              onChange={v => applyStyle({ borderRadius: v + 'px' })}
            />
          </Field>

          <Field label="Opacity">
            <div className="flex items-center gap-2">
              <input
                type="range" min={0} max={1} step={0.01}
                value={styles.opacity}
                onChange={e => applyStyle({ opacity: e.target.value })}
                className="flex-1 accent-indigo-600"
              />
              <span className="text-xs text-slate-500 w-8 text-right">
                {Math.round(parseFloat(styles.opacity || '1') * 100)}%
              </span>
            </div>
          </Field>
        </Section>

        {/* ── Image ──────────────────────────────────────────────── */}
        {selected.isImage && (
          <Section label="Image">
            <Field label="Source URL">
              <input
                type="text"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                defaultValue={selected.src || ''}
                placeholder="https://..."
                onBlur={e => {
                  if (e.target.value) {
                    send({ type: 'APPLY_STYLE', styles: { src: e.target.value } })
                  }
                }}
              />
            </Field>
          </Section>
        )}

      </div>
    </div>
  )
}

// ── Small reusable sub-components ─────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">{label}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  )
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-[11px] text-slate-500 mb-1 font-medium">{label}</label>
      {children}
    </div>
  )
}

function NumberInput({
  value, min = 0, max = 9999, step = 1, onChange,
}: {
  value: string | number
  min?: number
  max?: number
  step?: number
  onChange: (v: string) => void
}) {
  return (
    <input
      type="number"
      min={min} max={max} step={step}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 text-center"
    />
  )
}

function ColorField({
  label, value, onChange, allowTransparent = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  allowTransparent?: boolean
}) {
  const isTransparent = value === 'transparent' || value === ''
  const hexValue = isTransparent ? '#ffffff' : value

  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <label className="relative cursor-pointer shrink-0">
          <div
            className="w-8 h-8 rounded-lg border-2 border-slate-200 overflow-hidden"
            style={{
              background: isTransparent
                ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 10px 10px'
                : value,
            }}
          />
          <input
            type="color"
            value={hexValue}
            onChange={e => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>

        <input
          type="text"
          value={isTransparent ? 'transparent' : value}
          onChange={e => onChange(e.target.value)}
          placeholder={allowTransparent ? 'transparent' : '#000000'}
          className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-mono"
        />

        {allowTransparent && (
          <button
            onClick={() => onChange('transparent')}
            title="Set transparent"
            className={cn(
              'shrink-0 text-[10px] px-2 py-1.5 rounded-lg border font-medium transition-colors',
              isTransparent
                ? 'bg-indigo-100 border-indigo-200 text-indigo-600'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100',
            )}
          >
            None
          </button>
        )}
      </div>
    </Field>
  )
}
