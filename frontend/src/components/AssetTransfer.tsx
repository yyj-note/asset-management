import { useRef, useState } from 'react'
import { api } from '../api'
import type { CsvImportPreview } from '../types'
import { CheckIcon, DownloadIcon, UploadIcon } from './Icons'

interface Props {
  onNotify: (text: string, kind?: 'ok' | 'error') => void
}

export function AssetTransfer({ onNotify }: Props) {
  const [downloading, setDownloading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CsvImportPreview | null>(null)
  const [checking, setChecking] = useState(false)
  const [importing, setImporting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const downloadTemplate = async () => {
    setDownloading(true)
    try {
      await api.downloadAssetCsvTemplate()
      onNotify('CSV 空模板已下载')
    } catch (error) {
      onNotify(error instanceof Error ? error.message : '模板下载失败', 'error')
    } finally {
      setDownloading(false)
    }
  }

  const selectFile = async (selected?: File) => {
    if (!selected) return
    if (!selected.name.toLowerCase().endsWith('.csv')) { onNotify('请选择 CSV 文件', 'error'); return }
    setFile(selected); setPreview(null); setChecking(true)
    try { setPreview(await api.previewAssetCsv(selected)) }
    catch (error) { setFile(null); onNotify(error instanceof Error ? error.message : 'CSV 校验失败', 'error') }
    finally { setChecking(false) }
  }

  const confirmImport = async () => {
    if (!file || !preview?.canImport) return
    setImporting(true)
    try {
      const result = await api.importAssetCsv(file)
      onNotify(`成功导入 ${result.importedCount} 项资产${result.createdLookupCount ? `，并新建 ${result.createdLookupCount} 个选项` : ''}`)
      setFile(null); setPreview(null); if (inputRef.current) inputRef.current.value = ''
    } catch (error) { onNotify(error instanceof Error ? error.message : 'CSV 导入失败', 'error') }
    finally { setImporting(false) }
  }

  return <section className="transfer-page">
    <div className="transfer-card">
      <div className="transfer-copy">
        <span className="transfer-icon"><DownloadIcon /></span>
        <div>
          <h2>CSV 空模板</h2>
          <p>下载标准字段后交给 AI 填写；每一行代表一项资产。</p>
        </div>
      </div>
      <button className="button primary transfer-download" disabled={downloading} onClick={() => void downloadTemplate()}>
        <DownloadIcon />{downloading ? '正在生成…' : '下载空模板'}
      </button>
    </div>

    <div className="transfer-import-card">
      <div className="transfer-copy"><span className="transfer-icon import"><UploadIcon /></span><div><h2>导入 CSV</h2><p>先校验预览，全部通过后再一次性写入数据库。</p></div></div>
      <div className="transfer-import-actions"><input ref={inputRef} hidden type="file" accept=".csv,text/csv" onChange={(event) => void selectFile(event.target.files?.[0])} /><button className="button ghost" disabled={checking || importing} onClick={() => inputRef.current?.click()}><UploadIcon />{checking ? '正在校验…' : file ? '重新选择' : '选择 CSV'}</button>{preview?.canImport && <button className="button primary" disabled={importing} onClick={() => void confirmImport()}>{importing ? '正在导入…' : `确认导入 ${preview.validRows} 项`}</button>}</div>
    </div>

    {file && <div className="csv-file-line"><strong>{file.name}</strong><span>{(file.size / 1024).toFixed(1)} KB</span></div>}
    {preview && <div className={`csv-preview ${preview.canImport ? 'ready' : 'invalid'}`}>
      <div className="csv-preview-summary"><strong>{preview.canImport ? '校验通过，可以导入' : '校验未通过，请修改文件'}</strong><span>共 {preview.totalRows} 行 · 有效 {preview.validRows} 行 · 错误 {preview.errors.length} 处 · 提醒 {preview.warnings.length} 处</span></div>
      {preview.errors.length > 0 && <div className="csv-messages errors"><h3>必须修正</h3>{preview.errors.slice(0, 12).map((message, index) => <p key={`${message.row}-${message.field}-${index}`}>第 {message.row} 行 · {message.field}：{message.message}</p>)}{preview.errors.length > 12 && <small>还有 {preview.errors.length - 12} 处错误未显示</small>}</div>}
      {preview.warnings.length > 0 && <div className="csv-messages warnings"><h3>导入提醒</h3>{preview.warnings.slice(0, 8).map((message, index) => <p key={`${message.row}-${message.field}-${index}`}>第 {message.row} 行 · {message.message}</p>)}{preview.warnings.length > 8 && <small>还有 {preview.warnings.length - 8} 条提醒未显示</small>}</div>}
      <div className="csv-sample"><div className="csv-sample-head"><span>行</span><span>资产编号</span><span>资产名称</span><span>状态</span></div>{preview.sample.map((row) => <div key={row.row}><span>{row.row}</span><span>{row.assetTag || '—'}</span><span>{row.name || '—'}</span><span className={row.valid ? 'valid' : 'invalid'}>{row.valid ? row.status || '待确认' : '有错误'}</span></div>)}</div>
    </div>}

    <div className="transfer-notes">
      <div><CheckIcon /><span><strong>Excel 不乱码</strong>UTF-8 BOM 编码</span></div>
      <div><CheckIcon /><span><strong>字段与系统一致</strong>包含资产、硬件、价格和领用信息</span></div>
      <div><CheckIcon /><span><strong>支持设备绑定</strong>显示器使用资产编号绑定；鼠标、充电器填写随附配件 JSON 列</span></div>
    </div>

    <div className="transfer-guide">
      <h3>交给 AI 时可以直接这样说</h3>
      <p>“请把我的资产资料整理到这个 CSV 模板中，不要修改表头；资产编号必须是 12 位数字，一行一项资产，没有的信息留空。”</p>
      <small>带 * 的字段必填。公司、型号、分类和位置不存在时会在确认导入后自动新建；资产状态只能使用系统固定选项。</small>
    </div>
  </section>
}
