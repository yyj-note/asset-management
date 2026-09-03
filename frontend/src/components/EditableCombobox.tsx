import { useEffect, useRef, useState } from 'react'
import { ChevronIcon, CloseIcon, PlusIcon } from './Icons'

export interface ComboboxOption {
  id: number | string
  label: string
}

interface Props {
  value: string
  selectedId?: number | string | null
  options: ComboboxOption[]
  placeholder: string
  editable?: boolean
  required?: boolean
  allowCreate?: boolean
  onChange: (value: string, selectedId: number | string | null) => void
  onCreate?: () => void
  onDelete?: (option: ComboboxOption) => Promise<boolean>
}

export function EditableCombobox({ value, selectedId, options, placeholder, editable = false, required, allowCreate, onChange, onCreate, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const choose = (option: ComboboxOption) => {
    setOpen(false)
    onChange(option.label, option.id)
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    window.setTimeout(() => setOpen(false), 0)
  }

  const remove = async (option: ComboboxOption) => {
    if (!onDelete) return
    const deleted = await onDelete(option)
    if (deleted && option.id === selectedId) onChange('', null)
  }

  return <div ref={rootRef} className={`editable-combobox ${open ? 'open' : ''}`} onKeyDown={(event) => {
    if (event.key === 'Escape') setOpen(false)
  }}>
    {editable
      ? <input required={required} value={value} placeholder={placeholder} onFocus={() => setOpen(true)} onChange={(event) => {
        const next = event.target.value
        const exact = options.find((option) => option.label.localeCompare(next, undefined, { sensitivity: 'accent' }) === 0)
        onChange(next, exact?.id ?? null)
        setOpen(true)
      }} />
      : <button type="button" className={`combobox-value ${value ? '' : 'placeholder'}`} onClick={() => setOpen((current) => !current)}>{value || placeholder}</button>}
    <button type="button" className="combobox-arrow" aria-label={open ? '收起选项' : '展开选项'} aria-expanded={open} onClick={() => setOpen((current) => !current)}><ChevronIcon /></button>
    {open && <div className="combobox-menu">
      <div className="combobox-options">
        {options.length === 0 ? <span className="combobox-empty">暂无可选项</span> : options.map((option) => <div
          className={`combobox-option ${onDelete ? 'deletable' : ''} ${option.id === selectedId ? 'selected' : ''}`}
          key={option.id}
          role="option"
          aria-selected={option.id === selectedId}
          tabIndex={0}
          onClick={() => choose(option)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(option) }
          }}
        >
          {onDelete && <button type="button" className="combobox-delete" title={`删除${option.label}`} aria-label={`删除${option.label}`} onClick={(event) => { event.stopPropagation(); void remove(option) }}><CloseIcon /></button>}
          <span className="combobox-option-label">{option.label}</span>
        </div>)}
      </div>
      {allowCreate && onCreate && <button type="button" className="combobox-create" onClick={() => { setOpen(false); onCreate() }}><PlusIcon />新建选项</button>}
    </div>}
  </div>
}
