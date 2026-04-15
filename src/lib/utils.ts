import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Trigger a file download in the browser */
export function downloadFile(content: string, filename: string, mimeType = 'text/html') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Common web-safe + Google font options */
export const FONT_OPTIONS = [
  { label: 'Inter',            value: "'Inter', sans-serif" },
  { label: 'System UI',        value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { label: 'Arial',            value: 'Arial, Helvetica, sans-serif' },
  { label: 'Georgia',          value: "Georgia, 'Times New Roman', serif" },
  { label: 'Roboto',           value: "'Roboto', sans-serif" },
  { label: 'Open Sans',        value: "'Open Sans', sans-serif" },
  { label: 'Lato',             value: "'Lato', sans-serif" },
  { label: 'Montserrat',       value: "'Montserrat', sans-serif" },
  { label: 'Poppins',          value: "'Poppins', sans-serif" },
  { label: 'Raleway',          value: "'Raleway', sans-serif" },
  { label: 'Playfair Display', value: "'Playfair Display', serif" },
  { label: 'Fraunces',         value: "'Fraunces', serif" },
  { label: 'Merriweather',     value: "'Merriweather', serif" },
  { label: 'Courier New',      value: "'Courier New', Courier, monospace" },
]
