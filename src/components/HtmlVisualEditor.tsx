'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Download, Monitor, Smartphone, Tablet, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Trash2, Copy,
  ChevronLeft, Code2, X, FileText, Sparkles, Undo2, Redo2,
  Layers, Image as ImageIcon, Type, Square, Pipette, Plus,
} from 'lucide-react'
import { cn, downloadFile, FONT_OPTIONS } from '@/lib/utils'
import { injectEditorScript, normalizeHtml } from '@/lib/editorScript'
import { SAMPLE_TEMPLATE } from '@/lib/sampleTemplate'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ElementStyles {
  color: string; backgroundColor: string; fontSize: string
  fontFamily: string; fontWeight: string; fontStyle: string
  textDecoration: string; textAlign: string; letterSpacing: string
  lineHeight: string; borderRadius: string; opacity: string
  padding: string; paddingTop: string; paddingRight: string
  paddingBottom: string; paddingLeft: string
  fill: string; stroke: string
  width: string; height: string
}

interface SelectedElement {
  tagName: string; id: string; className: string; textContent: string
  isText: boolean; isImage: boolean; isContainer: boolean; isSvg: boolean
  src: string | null; href: string | null; alt: string | null
  styles: ElementStyles
}

type ViewMode = 'desktop' | 'tablet' | 'mobile'
type Step = 'import' | 'edit'
type SidePanel = 'elements' | 'properties' | null

const DEFAULT_STYLES: ElementStyles = {
  color: '#000000', backgroundColor: 'transparent', fontSize: '16',
  fontFamily: '', fontWeight: '400', fontStyle: 'normal',
  textDecoration: 'none', textAlign: 'left', letterSpacing: '0',
  lineHeight: '1.5', borderRadius: '0', opacity: '1',
  padding: '', paddingTop: '0', paddingRight: '0', paddingBottom: '0', paddingLeft: '0',
  fill: '', stroke: '',
  width: '', height: '',
}

const CANVAS_WIDTHS: Record<ViewMode, string> = {
  desktop: '100%', tablet: '768px', mobile: '390px',
}

// ── Colour palette ─────────────────────────────────────────────────────────────

const COLOR_PALETTE = [
  '#000000','#111827','#374151','#6b7280','#9ca3af','#d1d5db','#f3f4f6','#ffffff',
  '#7f1d1d','#dc2626','#ef4444','#f87171','#fca5a5','#fecaca','#fee2e2','#fff1f2',
  '#7c2d12','#ea580c','#f97316','#fb923c','#fdba74','#fed7aa','#ffedd5','#fff7ed',
  '#713f12','#ca8a04','#eab308','#facc15','#fde047','#fef08a','#fef9c3','#fefce8',
  '#14532d','#16a34a','#22c55e','#4ade80','#86efac','#bbf7d0','#dcfce7','#f0fdf4',
  '#164e63','#0891b2','#06b6d4','#22d3ee','#67e8f9','#a5f3fc','#cffafe','#ecfeff',
  '#1e3a8a','#2563eb','#3b82f6','#60a5fa','#93c5fd','#bfdbfe','#dbeafe','#eff6ff',
  '#3730a3','#4f46e5','#6366f1','#818cf8','#a5b4fc','#c7d2fe','#e0e7ff','#eef2ff',
  '#581c87','#9333ea','#a855f7','#c084fc','#d8b4fe','#e9d5ff','#f3e8ff','#faf5ff',
  '#831843','#db2777','#ec4899','#f472b6','#f9a8d4','#fbcfe8','#fce7f3','#fdf2f8',
]

// ── Elements panel content ────────────────────────────────────────────────────

const ELEMENT_GROUPS = [
  {
    category: 'Text',
    icon: <Type size={13} />,
    items: [
      { label: 'Heading',    preview: 'Aa', html: '<h2 style="font-size:40px;font-weight:800;letter-spacing:-1.5px;color:#0a0a0a;margin:0;line-height:1.1;padding:8px 0;">Your Heading Here</h2>' },
      { label: 'Subheading', preview: 'Aa', html: '<h3 style="font-size:24px;font-weight:600;color:#333;margin:0;padding:6px 0;">Your Subheading</h3>' },
      { label: 'Paragraph',  preview: '¶',  html: '<p style="font-size:16px;line-height:1.75;color:#555;margin:0;padding:4px 0;">Add your paragraph text here. Double-click to edit this text.</p>' },
      { label: 'Button',     preview: '[ ]',html: '<div style="padding:8px 0;"><a href="#" style="display:inline-block;padding:12px 28px;background:#111;color:#fff;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;">Button Text</a></div>' },
      { label: 'Badge',      preview: '🏷', html: '<div style="padding:4px 0;"><span style="display:inline-block;padding:5px 14px;background:#eef2ff;color:#6366f1;border-radius:100px;font-size:13px;font-weight:600;">Badge Text</span></div>' },
      { label: 'Quote',      preview: '"',  html: '<blockquote style="border-left:4px solid #6366f1;padding:16px 20px;margin:0;background:#f9fafb;border-radius:0 8px 8px 0;"><p style="font-size:16px;color:#374151;font-style:italic;margin:0;line-height:1.7;">"Your quote goes here."</p></blockquote>' },
    ],
  },
  {
    category: 'Shapes',
    icon: <Square size={13} />,
    items: [
      { label: 'Rectangle',    preview: '▭', html: '<div style="width:200px;height:120px;background:#6366f1;border-radius:12px;"></div>' },
      { label: 'Circle',       preview: '●', html: '<div style="width:120px;height:120px;background:#6366f1;border-radius:50%;"></div>' },
      { label: 'Rounded Box',  preview: '▢', html: '<div style="width:200px;height:120px;background:transparent;border:3px solid #6366f1;border-radius:16px;"></div>' },
      { label: 'Gradient',     preview: '◈', html: '<div style="width:100%;height:160px;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#d946ef 100%);border-radius:16px;"></div>' },
      { label: 'Line',         preview: '─', html: '<div style="padding:8px 0;"><hr style="border:none;border-top:3px solid #111;margin:0;" /></div>' },
      { label: 'Dashed Line',  preview: '╌', html: '<div style="padding:8px 0;"><hr style="border:none;border-top:2px dashed #9ca3af;margin:0;" /></div>' },
    ],
  },
  {
    category: 'Layout',
    icon: <Layers size={13} />,
    items: [
      { label: 'Divider',     preview: '—',  html: '<div style="padding:20px 0;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" /></div>' },
      { label: 'Spacer',      preview: '↕',  html: '<div style="height:80px;"></div>' },
      { label: 'Card',        preview: '▤',  html: '<div style="background:#fff;border:1px solid #f0f0f0;border-radius:16px;padding:32px;box-shadow:0 4px 16px rgba(0,0,0,0.06);"><h3 style="font-size:18px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">Card Title</h3><p style="font-size:14px;color:#666;line-height:1.65;margin:0;">Card description text.</p></div>' },
      { label: 'Hero Block',  preview: '⬚',  html: '<section style="padding:80px 48px;background:linear-gradient(155deg,#f9fafb,#eef2ff);text-align:center;"><h2 style="font-size:48px;font-weight:900;color:#0a0a0a;margin:0 0 16px;letter-spacing:-2px;line-height:1.05;">Big Headline</h2><p style="font-size:18px;color:#555;margin:0 0 32px;">Supporting description goes here.</p><a href="#" style="display:inline-block;padding:14px 32px;background:#111;color:#fff;border-radius:10px;font-size:16px;font-weight:600;text-decoration:none;">Call to Action</a></section>' },
      { label: '2 Columns',   preview: '⊞',  html: '<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:16px 0;"><div style="background:#f9fafb;border-radius:12px;padding:28px;"><p style="color:#374151;font-weight:600;margin:0 0 8px;">Left Column</p><p style="color:#9ca3af;font-size:14px;margin:0;">Content goes here.</p></div><div style="background:#f9fafb;border-radius:12px;padding:28px;"><p style="color:#374151;font-weight:600;margin:0 0 8px;">Right Column</p><p style="color:#9ca3af;font-size:14px;margin:0;">Content goes here.</p></div></div>' },
      { label: '3 Columns',   preview: '⊟',  html: '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;padding:16px 0;"><div style="background:#f9fafb;border-radius:12px;padding:24px;text-align:center;"><p style="color:#374151;font-weight:600;margin:0 0 6px;font-size:15px;">Feature 1</p><p style="color:#9ca3af;font-size:13px;margin:0;">Description.</p></div><div style="background:#f9fafb;border-radius:12px;padding:24px;text-align:center;"><p style="color:#374151;font-weight:600;margin:0 0 6px;font-size:15px;">Feature 2</p><p style="color:#9ca3af;font-size:13px;margin:0;">Description.</p></div><div style="background:#f9fafb;border-radius:12px;padding:24px;text-align:center;"><p style="color:#374151;font-weight:600;margin:0 0 6px;font-size:15px;">Feature 3</p><p style="color:#9ca3af;font-size:13px;margin:0;">Description.</p></div></div>' },
    ],
  },
  {
    category: 'Media',
    icon: <ImageIcon size={13} />,
    items: [
      { label: 'Image',         preview: '🖼', html: '<img src="https://images.unsplash.com/photo-1554147090-e1221ad04913?w=800&q=80" alt="Image" style="width:100%;height:280px;object-fit:cover;border-radius:12px;display:block;" />' },
      { label: 'Image + Caption', preview: '🖼', html: '<figure style="margin:0;"><img src="https://images.unsplash.com/photo-1554147090-e1221ad04913?w=800&q=80" alt="Image" style="width:100%;height:240px;object-fit:cover;border-radius:12px;display:block;" /><figcaption style="font-size:13px;color:#9ca3af;text-align:center;padding:10px 0 0;">Image caption goes here</figcaption></figure>' },
      { label: 'Placeholder',   preview: '⬚', html: '<div style="width:100%;height:260px;background:linear-gradient(135deg,#e0e7ff,#c7d2fe);border-radius:12px;display:flex;align-items:center;justify-content:center;"><span style="font-size:15px;color:#6366f1;font-weight:500;">Image placeholder</span></div>' },
    ],
  },
]

// ── Main component ────────────────────────────────────────────────────────────

export default function HtmlVisualEditor() {
  const [step, setStep]           = useState<Step>('import')
  const [htmlInput, setHtmlInput] = useState('')
  const [iframeDoc, setIframeDoc] = useState('')
  const [selected, setSelected]   = useState<SelectedElement | null>(null)
  const [styles, setStyles]       = useState<ElementStyles>(DEFAULT_STYLES)
  const [viewMode, setViewMode]   = useState<ViewMode>('desktop')
  const [editingText, setEditingText] = useState(false)
  const [isDragging, setIsDragging]   = useState(false)
  const [showCode, setShowCode]   = useState(false)
  const [codeValue, setCodeValue] = useState('')
  const [sidePanel, setSidePanel] = useState<SidePanel>(null)
  const [canUndo, setCanUndo]     = useState(false)
  const [canRedo, setCanRedo]     = useState(false)
  const [uploadError, setUploadError] = useState('')

  const iframeRef = useRef<HTMLIFrameElement>(null)

  const send = useCallback((msg: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(msg, '*')
  }, [])

  // Message listener
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data
      if (!d?.type) return
      if (d.type === 'ELEMENT_SELECTED') {
        setSelected(d as SelectedElement & { type: string })
        setStyles({ ...DEFAULT_STYLES, ...d.styles })
        setEditingText(false)
        setSidePanel('properties')
      }
      if (d.type === 'DESELECTED' || d.type === 'ELEMENT_DELETED') {
        setSelected(null); setStyles(DEFAULT_STYLES); setEditingText(false)
      }
      if (d.type === 'EDITING_TEXT')  setEditingText(true)
      if (d.type === 'TEXT_CHANGED')  setEditingText(false)
      if (d.type === 'DRAGGING_STARTED') setIsDragging(true)
      if (d.type === 'DRAGGING_ENDED')   setIsDragging(false)
      if (d.type === 'HISTORY_UPDATE') {
        setCanUndo(!!d.canUndo); setCanRedo(!!d.canRedo)
      }
      if (d.type === 'HTML_CONTENT') downloadFile(d.html as string, 'page.html')
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (mod) {
        if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); send({ type: 'UNDO' }) }
        if (e.key === 'z' &&  e.shiftKey) { e.preventDefault(); send({ type: 'REDO' }) }
        if (e.key === 'y')                { e.preventDefault(); send({ type: 'REDO' }) }
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected && !editingText) {
        const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase()
        if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
          e.preventDefault()
          send({ type: 'DELETE_ELEMENT' })
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [send, selected, editingText])

  const loadHtml = useCallback((raw: string) => {
    const norm = normalizeHtml(raw.trim())
    setIframeDoc(injectEditorScript(norm))
    setCodeValue(norm)
    setSelected(null); setStyles(DEFAULT_STYLES)
    setCanUndo(false); setCanRedo(false)
    setStep('edit')
  }, [])

  const applyStyle = useCallback((props: Partial<Record<string, string>>) => {
    send({ type: 'APPLY_STYLE', styles: props })
    setStyles(prev => ({ ...prev, ...props }))
  }, [send])

  const toggle = useCallback((prop: string, on: string, off: string) => {
    const cur = styles[prop as keyof ElementStyles]
    applyStyle({ [prop]: cur === on ? off : on })
  }, [styles, applyStyle])

  const insertElement = useCallback((html: string) => {
    send({ type: 'INSERT_ELEMENT', html })
  }, [send])

  // Image upload handler
  const showUploadError = useCallback((msg: string) => {
    setUploadError(msg)
    setTimeout(() => setUploadError(''), 6000)
  }, [])

  const handleImageUpload = useCallback((file: File) => {
    const supported = ['image/jpeg','image/png','image/gif','image/webp','image/svg+xml','image/avif']
    if (!supported.includes(file.type)) {
      showUploadError(`"${file.name}" can't be displayed — please convert to JPG or PNG first (open in Photos → Export as JPEG)`)
      return
    }
    const reader = new FileReader()
    reader.onload = ev => {
      const src = ev.target?.result as string
      if (selected?.isImage) {
        send({ type: 'SET_IMG_SRC', src, alt: file.name })
        setSelected(prev => prev ? { ...prev, src } : null)
      } else {
        send({ type: 'INSERT_ELEMENT', html: `<img src="${src}" alt="${file.name}" style="max-width:100%;height:auto;display:block;border-radius:8px;" />` })
      }
    }
    reader.readAsDataURL(file)
  }, [selected, send, showUploadError])

  const handleReplaceImage = useCallback((file: File) => {
    const supported = ['image/jpeg','image/png','image/gif','image/webp','image/svg+xml','image/avif']
    if (!supported.includes(file.type)) {
      showUploadError(`"${file.name}" can't be displayed — please convert to JPG or PNG first`)
      return
    }
    const reader = new FileReader()
    reader.onload = ev => send({ type: 'SET_IMG_SRC', src: ev.target?.result, alt: file.name })
    reader.readAsDataURL(file)
  }, [send, showUploadError])

  // ── Import screen ───────────────────────────────────────────────────────────
  if (step === 'import') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col">
        <header className="flex items-center px-8 h-16 bg-white/80 backdrop-blur border-b border-slate-200 gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="font-semibold text-slate-800 text-sm">HTML Visual Editor</span>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
          <div className="w-full max-w-2xl">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Paste your HTML to get started</h1>
            <p className="text-slate-500 mb-8 leading-relaxed">Generated a one-pager with Claude? Paste the HTML below and edit it visually — no coding required.</p>
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
              <button onClick={() => htmlInput.trim() && loadHtml(htmlInput)} disabled={!htmlInput.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <Sparkles size={15} />Open in Editor
              </button>
              <span className="text-slate-400 text-sm">or</span>
              <button onClick={() => loadHtml(SAMPLE_TEMPLATE)}
                className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:border-slate-300 hover:bg-slate-50 transition-colors">
                <FileText size={15} />Try sample template
              </button>
            </div>
            <p className="mt-6 text-xs text-slate-400">
              💡 Ask Claude to <span className="font-medium text-slate-500">&ldquo;generate a one-page marketing site in HTML with inline CSS&rdquo;</span> then paste it here.
            </p>
          </div>
        </main>
      </div>
    )
  }

  // ── Editor screen ───────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">

      {/* Top bar */}
      <header className="h-12 flex items-center justify-between px-3 bg-white border-b border-slate-200 shrink-0 z-10 gap-2">
        {/* Left */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => { setStep('import'); setSelected(null) }}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors px-2 py-1 rounded-lg hover:bg-slate-100">
            <ChevronLeft size={15} /><span className="hidden sm:inline text-xs">Back</span>
          </button>
          <div className="w-px h-4 bg-slate-200" />
          {/* Undo / Redo */}
          <button onClick={() => send({ type: 'UNDO' })} disabled={!canUndo} title="Undo (⌘Z)"
            className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors">
            <Undo2 size={15} />
          </button>
          <button onClick={() => send({ type: 'REDO' })} disabled={!canRedo} title="Redo (⌘⇧Z)"
            className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors">
            <Redo2 size={15} />
          </button>
        </div>

        {/* Center — view mode */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {(['desktop','tablet','mobile'] as ViewMode[]).map(m => {
            const Icon = m === 'desktop' ? Monitor : m === 'tablet' ? Tablet : Smartphone
            return (
              <button key={m} onClick={() => setViewMode(m)} title={m}
                className={cn('p-1.5 rounded-md transition-colors', viewMode === m ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600')}>
                <Icon size={14} />
              </button>
            )
          })}
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowCode(v => !v)}
            className={cn('flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors', showCode ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
            <Code2 size={13} /><span className="hidden sm:inline">Code</span>
          </button>
          <label className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200 cursor-pointer transition-colors" title="Upload image">
            <ImageIcon size={13} /><span className="hidden sm:inline">Image</span>
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = '' }} />
          </label>
          <button onClick={() => send({ type: 'GET_HTML' })}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors">
            <Download size={13} /><span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      {/* Upload error toast */}
      {uploadError && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-red-50 border-b border-red-200 text-red-700 text-xs font-medium">
          <X size={13} className="shrink-0" />
          {uploadError}
          <button onClick={() => setUploadError('')} className="ml-auto text-red-400 hover:text-red-600"><X size={12} /></button>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: Code panel */}
        {showCode && (
          <aside className="w-72 shrink-0 bg-slate-900 flex flex-col border-r border-slate-700">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700">
              <span className="text-xs text-slate-400 font-medium">HTML Source</span>
              <button onClick={() => { const n = normalizeHtml(codeValue); setIframeDoc(injectEditorScript(n)) }}
                className="text-xs text-indigo-400 font-semibold hover:text-indigo-300">Apply</button>
            </div>
            <textarea className="flex-1 px-4 py-3 font-mono text-xs text-slate-300 bg-slate-900 resize-none focus:outline-none leading-relaxed"
              value={codeValue} onChange={e => setCodeValue(e.target.value)} spellCheck={false} />
          </aside>
        )}

        {/* Left: Elements panel */}
        {sidePanel === 'elements' && (
          <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Elements</span>
              <button onClick={() => setSidePanel(null)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {ELEMENT_GROUPS.map(group => (
                <div key={group.category}>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    {group.icon}{group.category}
                  </div>
                  <div className="space-y-1">
                    {group.items.map(item => (
                      <button key={item.label} onClick={() => insertElement(item.html)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition-colors text-left">
                        <span className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[11px] shrink-0">{item.preview}</span>
                        <span className="text-xs font-medium">{item.label}</span>
                        <Plus size={11} className="ml-auto text-slate-300" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Canvas */}
        <main className="flex-1 overflow-auto flex flex-col items-center py-6 px-4 relative"
          onClick={e => { if (e.target === e.currentTarget) { send({ type: 'DESELECT' }); setSelected(null) } }}>

          {/* Elements toggle button */}
          <button onClick={() => setSidePanel(p => p === 'elements' ? null : 'elements')}
            className={cn('absolute left-6 top-6 z-10 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-sm border transition-colors',
              sidePanel === 'elements' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300')}>
            <Layers size={13} />Elements
          </button>

          {(editingText || isDragging) && (
            <div className={cn('mb-3 mt-10 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0',
              isDragging ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700')}>
              {isDragging ? 'Dragging — release to drop' : 'Editing text — click outside to finish'}
            </div>
          )}

          <div className={cn('transition-all duration-300 bg-white shadow-xl rounded-lg overflow-hidden', !editingText && !isDragging && 'mt-10')}
            style={{ width: CANVAS_WIDTHS[viewMode], minHeight: '600px' }}>
            <iframe ref={iframeRef} srcDoc={iframeDoc} className="w-full border-0"
              style={{ minHeight: '600px', height: '100%', display: 'block' }} title="Visual editor canvas" />
          </div>
        </main>

        {/* Right: Properties panel */}
        {selected && sidePanel === 'properties' && (
          <PropertiesPanel selected={selected} styles={styles} applyStyle={applyStyle}
            toggle={toggle} send={send}
            onDelete={() => { send({ type: 'DELETE_ELEMENT' }) }}
            onDuplicate={() => send({ type: 'DUPLICATE_ELEMENT' })}
            onDeselect={() => { send({ type: 'DESELECT' }); setSelected(null); setSidePanel(null) }}
            onReplaceImage={handleReplaceImage}
          />
        )}

        {/* Properties tab — visible when element selected but panel closed */}
        {selected && sidePanel !== 'properties' && (
          <button onClick={() => setSidePanel('properties')}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-indigo-600 text-white text-xs font-semibold px-2 py-6 rounded-l-xl shadow-lg z-20 [writing-mode:vertical-lr] hover:bg-indigo-700 transition-colors">
            Properties
          </button>
        )}
      </div>
    </div>
  )
}

// ── Properties Panel ──────────────────────────────────────────────────────────

interface PanelProps {
  selected: SelectedElement; styles: ElementStyles
  applyStyle: (p: Partial<Record<string, string>>) => void
  toggle: (prop: string, on: string, off: string) => void
  send: (msg: Record<string, unknown>) => void
  onDelete: () => void; onDuplicate: () => void; onDeselect: () => void
  onReplaceImage: (file: File) => void
}

function PropertiesPanel({ selected, styles, applyStyle, toggle, send, onDelete, onDuplicate, onDeselect, onReplaceImage }: PanelProps) {
  return (
    <aside className="w-72 shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-mono bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-semibold">&lt;{selected.tagName}&gt;</span>
          <button onClick={onDeselect} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
        </div>
        {/* Actions */}
        <div className="px-4 py-2.5 border-b border-slate-100 flex gap-2">
          <button onClick={onDuplicate} className="flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors">
            <Copy size={12} />Duplicate
          </button>
          <button onClick={onDelete} className="flex items-center gap-1.5 text-xs text-red-500 font-medium bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors">
            <Trash2 size={12} />Delete
          </button>
        </div>

        <div className="px-4 py-4 space-y-5">
          {/* Typography */}
          <Section label="Typography">
            <Field label="Font family">
              <select className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                value={styles.fontFamily} onChange={e => applyStyle({ fontFamily: e.target.value })}>
                <option value="">— inherited —</option>
                {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </Field>
            <div className="flex gap-2">
              <Field label="Size (px)" className="flex-1">
                <input type="number" min={1} max={500}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                  value={parseFloat(String(styles.fontSize)) || ''}
                  onChange={e => applyStyle({ fontSize: e.target.value + 'px' })} />
              </Field>
              <Field label="Weight" className="flex-1">
                <select className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                  value={styles.fontWeight} onChange={e => applyStyle({ fontWeight: e.target.value })}>
                  {[['300','Light'],['400','Regular'],['500','Medium'],['600','Semibold'],['700','Bold'],['800','Extrabold'],['900','Black']].map(([v,l]) =>
                    <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Style & alignment">
              <div className="flex gap-1 flex-wrap">
                {[
                  { icon: <Bold size={13}/>,      p:'fontWeight',    on:'700',      off:'400',    active: styles.fontWeight==='700',               title:'Bold' },
                  { icon: <Italic size={13}/>,    p:'fontStyle',     on:'italic',   off:'normal', active: styles.fontStyle==='italic',             title:'Italic' },
                  { icon: <Underline size={13}/>, p:'textDecoration',on:'underline',off:'none',   active: styles.textDecoration?.includes('underline'), title:'Underline' },
                ].map(({ icon, p, on, off, active, title }) => (
                  <button key={p} title={title} onClick={() => toggle(p, on, off)}
                    className={cn('w-8 h-8 flex items-center justify-center rounded-lg border text-xs transition-colors',
                      active ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100')}>
                    {icon}
                  </button>
                ))}
                <div className="w-px h-8 bg-slate-200" />
                {[
                  { icon:<AlignLeft size={13}/>,    v:'left',    title:'Left' },
                  { icon:<AlignCenter size={13}/>,  v:'center',  title:'Center' },
                  { icon:<AlignRight size={13}/>,   v:'right',   title:'Right' },
                  { icon:<AlignJustify size={13}/>, v:'justify', title:'Justify' },
                ].map(({ icon, v, title }) => (
                  <button key={v} title={title} onClick={() => applyStyle({ textAlign: v })}
                    className={cn('w-8 h-8 flex items-center justify-center rounded-lg border text-xs transition-colors',
                      styles.textAlign===v ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100')}>
                    {icon}
                  </button>
                ))}
              </div>
            </Field>
            <div className="flex gap-2">
              <Field label="Letter spacing" className="flex-1">
                <NumInput value={styles.letterSpacing} min={-5} max={20} step={0.5} onChange={v => applyStyle({ letterSpacing: v + 'px' })} />
              </Field>
              <Field label="Line height" className="flex-1">
                <NumInput value={styles.lineHeight} min={0.8} max={4} step={0.1} onChange={v => applyStyle({ lineHeight: v })} />
              </Field>
            </div>
          </Section>

          {/* Colours */}
          <Section label="Colours">
            <ColorField label="Text colour"   value={styles.color}           onChange={v => applyStyle({ color: v })} />
            <ColorField label="Background"    value={styles.backgroundColor} onChange={v => applyStyle({ backgroundColor: v })} allowTransparent />
          </Section>

          {/* SVG fill/stroke */}
          {selected.isSvg && (
            <Section label="SVG">
              <ColorField label="Fill"   value={styles.fill}   onChange={v => applyStyle({ fill: v })} allowTransparent />
              <ColorField label="Stroke" value={styles.stroke} onChange={v => applyStyle({ stroke: v })} allowTransparent />
            </Section>
          )}

          {/* Spacing */}
          <Section label="Spacing">
            <Field label="Padding (px)">
              <div className="grid grid-cols-3 gap-1 items-center">
                <div /><NumInput value={styles.paddingTop}    onChange={v => applyStyle({ paddingTop:    v+'px' })} /><div />
                <NumInput value={styles.paddingLeft}   onChange={v => applyStyle({ paddingLeft:   v+'px' })} />
                <div className="text-center text-[9px] text-slate-400">pad</div>
                <NumInput value={styles.paddingRight}  onChange={v => applyStyle({ paddingRight:  v+'px' })} />
                <div /><NumInput value={styles.paddingBottom} onChange={v => applyStyle({ paddingBottom: v+'px' })} /><div />
              </div>
            </Field>
            <Field label="Border radius (px)">
              <NumInput value={styles.borderRadius} min={0} max={300} onChange={v => applyStyle({ borderRadius: v+'px' })} />
            </Field>
            <Field label="Opacity">
              <div className="flex items-center gap-2">
                <input type="range" min={0} max={1} step={0.01} value={styles.opacity}
                  onChange={e => applyStyle({ opacity: e.target.value })} className="flex-1 accent-indigo-600" />
                <span className="text-xs text-slate-500 w-8 text-right">{Math.round(parseFloat(styles.opacity||'1')*100)}%</span>
              </div>
            </Field>
          </Section>

          {/* Image */}
          {selected.isImage && (
            <Section label="Image">
              <div className="flex gap-2">
                <Field label="Width (px)" className="flex-1">
                  <NumInput value={parseFloat(styles.width) || ''} min={0} max={3000}
                    onChange={v => applyStyle({ width: v ? v+'px' : '', maxWidth: v ? 'none' : '' })} />
                </Field>
                <Field label="Height (px)" className="flex-1">
                  <NumInput value={parseFloat(styles.height) || ''} min={0} max={3000}
                    onChange={v => applyStyle({ height: v ? v+'px' : '' })} />
                </Field>
              </div>
              <Field label="Replace image">
                <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors">
                  <ImageIcon size={13} />Upload new image
                  <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/avif,image/svg+xml" className="hidden" onChange={e => {
                    const f = e.target.files?.[0]; if (!f) return
                    onReplaceImage(f); e.target.value=''
                  }} />
                </label>
              </Field>
              <Field label="Or image URL">
                <input type="text" placeholder="https://..." defaultValue={selected.src||''}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                  onBlur={e => e.target.value && send({ type:'SET_IMG_SRC', src: e.target.value })} />
              </Field>
            </Section>
          )}
        </div>
      </div>
    </aside>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

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
function NumInput({ value, min=0, max=9999, step=1, onChange }: { value:string|number; min?:number; max?:number; step?:number; onChange:(v:string)=>void }) {
  return (
    <input type="number" min={min} max={max} step={step} value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 text-center" />
  )
}

// ── Colour picker with palette + eyedropper ───────────────────────────────────

function ColorField({ label, value, onChange, allowTransparent=false }: {
  label: string; value: string; onChange: (v: string) => void; allowTransparent?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isTransparent = value === 'transparent' || value === ''
  const hex = isTransparent ? '#ffffff' : value

  useEffect(() => {
    function onOutside(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    if (open) document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  async function eyedrop() {
    if (!('EyeDropper' in window)) return
    try {
      // @ts-expect-error EyeDropper not in TS lib yet
      const r = await new window.EyeDropper().open()
      onChange(r.sRGBHex); setOpen(false)
    } catch (_) {}
  }

  return (
    <Field label={label}>
      <div className="relative" ref={ref}>
        <div className="flex items-center gap-2">
          <button onClick={() => setOpen(v => !v)}
            className="w-8 h-8 rounded-lg border-2 border-slate-200 shrink-0 overflow-hidden"
            style={{ background: isTransparent ? 'repeating-conic-gradient(#ccc 0% 25%,#fff 0% 50%) 0 0/10px 10px' : value }} />
          <input type="text" value={isTransparent ? 'transparent' : value} placeholder="#000000"
            onChange={e => onChange(e.target.value)}
            className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-mono" />
          {allowTransparent && (
            <button onClick={() => onChange('transparent')} title="Set transparent"
              className={cn('shrink-0 text-[10px] px-2 py-1.5 rounded-lg border font-medium transition-colors',
                isTransparent ? 'bg-indigo-100 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100')}>
              None
            </button>
          )}
        </div>

        {open && (
          <div className="absolute left-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-3 w-64">
            {/* Native picker + eyedropper */}
            <div className="flex items-center gap-2 mb-3">
              <label className="relative cursor-pointer">
                <div className="w-9 h-9 rounded-lg border border-slate-200 overflow-hidden" style={{ background: hex }} />
                <input type="color" value={hex} onChange={e => onChange(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              </label>
              <input type="text" value={isTransparent ? 'transparent' : value}
                onChange={e => onChange(e.target.value)}
                className="flex-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700" />
              <button onClick={eyedrop} title="Pick colour from screen"
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 transition-colors">
                <Pipette size={14} />
              </button>
            </div>
            {/* Palette grid */}
            <div className="grid grid-cols-8 gap-1">
              {COLOR_PALETTE.map(c => (
                <button key={c} title={c} onClick={() => { onChange(c); setOpen(false) }}
                  className={cn('w-6 h-6 rounded-md border transition-transform hover:scale-110',
                    c === value ? 'border-indigo-500 scale-110' : 'border-slate-200')}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Field>
  )
}
