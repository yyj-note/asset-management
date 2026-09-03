import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import type { AuditFilters, AuditLogItem, AuditLogPage as AuditPageData } from '../types'
import { CloseIcon, DownloadIcon, SearchIcon } from './Icons'

interface Props { onNotify: (text: string, kind?: 'ok' | 'error') => void }

const emptyFilters: AuditFilters = { username: '', module: '', action: '', result: '', keyword: '', from: '', to: '' }
const actionOptions = [
  ['LOGIN_SUCCESS', '登录成功'], ['LOGIN_FAILED', '登录失败'], ['LOGOUT', '退出登录'],
  ['PASSWORD_CHANGE', '修改密码'], ['ASSET_CREATE', '新增资产'], ['ASSET_CLONE', '克隆资产'],
  ['ASSET_UPDATE', '编辑资产'], ['ASSET_RETURN', '归还资产'], ['ASSET_DELETE', '删除资产'],
  ['LOOKUP_CREATE', '新建选项'], ['LOOKUP_DELETE', '删除选项'], ['USER_CREATE', '创建用户'],
  ['USER_PASSWORD_RESET', '重置密码'], ['USER_DELETE', '删除用户'], ['SETTING_UPDATE', '修改设置'],
  ['CSV_TEMPLATE_EXPORT', '下载CSV模板'], ['CSV_IMPORT', '导入CSV'],
]

export function AuditLogPage({ onNotify }: Props) {
  const [filters, setFilters] = useState<AuditFilters>(emptyFilters)
  const [applied, setApplied] = useState<AuditFilters>(emptyFilters)
  const [data, setData] = useState<AuditPageData>({ items: [], page: 0, size: 50, totalElements: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selected, setSelected] = useState<AuditLogItem | null>(null)

  const load = async (page: number, nextFilters = applied) => {
    setLoading(true)
    try { setData(await api.listAuditLogs(nextFilters, page, 50)) }
    catch (error) { onNotify(error instanceof Error ? error.message : '读取日志失败', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load(0, emptyFilters) }, [])

  const apply = () => { setApplied(filters); void load(0, filters) }
  const clear = () => { setFilters(emptyFilters); setApplied(emptyFilters); void load(0, emptyFilters) }
  const exportCsv = async () => {
    setExporting(true)
    try { await api.downloadAuditLogs(applied); onNotify('日志 CSV 已导出') }
    catch (error) { onNotify(error instanceof Error ? error.message : '日志导出失败', 'error') }
    finally { setExporting(false) }
  }

  return <section className="audit-page">
    <div className="audit-shell">
      <header className="audit-head"><div><h2>操作日志</h2><p>记录所有账号的登录及数据变更，日志不可在系统内修改或删除。</p></div><button className="button ghost" disabled={exporting} onClick={() => void exportCsv()}><DownloadIcon />{exporting ? '导出中…' : '导出日志'}</button></header>
      <form className="audit-filters" onSubmit={(event) => { event.preventDefault(); apply() }}>
        <label><span>开始日期</span><input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} /></label>
        <label><span>结束日期</span><input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} /></label>
        <label><span>操作账号</span><input value={filters.username} onChange={(event) => setFilters({ ...filters, username: event.target.value })} placeholder="例如 admin" /></label>
        <label><span>模块</span><select value={filters.module} onChange={(event) => setFilters({ ...filters, module: event.target.value })}><option value="">全部模块</option>{['认证', '资产', '用户', '选项', '设置', '导入导出'].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>操作</span><select value={filters.action} onChange={(event) => setFilters({ ...filters, action: event.target.value })}><option value="">全部操作</option>{actionOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span>结果</span><select value={filters.result} onChange={(event) => setFilters({ ...filters, result: event.target.value })}><option value="">全部结果</option><option value="SUCCESS">成功</option><option value="FAILURE">失败</option></select></label>
        <label className="audit-keyword"><span>关键词</span><input value={filters.keyword} onChange={(event) => setFilters({ ...filters, keyword: event.target.value })} placeholder="资产编号、对象或说明" /></label>
        <div className="audit-filter-actions"><button type="button" className="button ghost" onClick={clear}>清空</button><button className="button primary"><SearchIcon />查询</button></div>
      </form>
      <div className="audit-table-wrap"><table className="audit-table"><thead><tr><th>时间</th><th>账号</th><th>模块</th><th>操作</th><th>对象</th><th>结果</th><th>说明</th></tr></thead><tbody>
        {loading ? <tr><td colSpan={7}><div className="audit-empty"><span className="spinner" />正在读取日志…</div></td></tr>
          : data.items.length === 0 ? <tr><td colSpan={7}><div className="audit-empty">没有符合条件的日志</div></td></tr>
          : data.items.map((item) => <tr key={item.id} onClick={() => setSelected(item)}>
            <td>{formatTime(item.occurredAt)}</td><td><strong>{item.actorUsername}</strong><small>{item.actorRole === 'SUPER_ADMIN' ? '超级管理员' : item.actorRole === 'USER' ? '普通用户' : '未登录'}</small></td>
            <td><span className="audit-module">{item.module}</span></td><td>{item.actionLabel}</td><td>{item.targetLabel || '—'}</td>
            <td><span className={`audit-result ${item.result.toLowerCase()}`}>{item.result === 'SUCCESS' ? '成功' : '失败'}</span></td><td>{item.summary}</td>
          </tr>)}</tbody></table></div>
      <footer className="audit-footer"><span>共 {data.totalElements} 条日志</span><div><button disabled={data.page <= 0 || loading} onClick={() => void load(data.page - 1)}>上一页</button><span>{data.totalPages === 0 ? 0 : data.page + 1} / {data.totalPages}</span><button disabled={data.page + 1 >= data.totalPages || loading} onClick={() => void load(data.page + 1)}>下一页</button></div></footer>
    </div>
    {selected && <AuditDetail item={selected} onClose={() => setSelected(null)} />}
  </section>
}

function AuditDetail({ item, onClose }: { item: AuditLogItem; onClose: () => void }) {
  const changes = useMemo(() => {
    try { return JSON.parse(item.changesJson || '{}') as Record<string, unknown> }
    catch { return {} }
  }, [item])
  return <div className="audit-detail-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside className="audit-detail">
    <header><div><span>{item.module}</span><h3>{item.actionLabel}</h3></div><button className="icon-button" onClick={onClose}><CloseIcon /></button></header>
    <dl><div><dt>时间</dt><dd>{formatTime(item.occurredAt)}</dd></div><div><dt>操作账号</dt><dd>{item.actorUsername}</dd></div><div><dt>操作对象</dt><dd>{item.targetLabel || '—'}</dd></div><div><dt>执行结果</dt><dd>{item.result === 'SUCCESS' ? '成功' : '失败'}</dd></div><div><dt>IP 地址</dt><dd>{item.ipAddress || '—'}</dd></div><div><dt>说明</dt><dd>{item.summary}</dd></div></dl>
    <section><h4>变更内容</h4>{Object.keys(changes).length === 0 ? <p className="audit-no-changes">该操作没有字段变更明细。</p> : <div className="audit-changes">{Object.entries(changes).map(([field, value]) => {
      const pair = typeof value === 'object' && value !== null ? value as { before?: unknown; after?: unknown } : null
      return <div key={field}><strong>{field}</strong>{pair && ('before' in pair || 'after' in pair) ? <p><span>{display(pair.before)}</span><b>→</b><span>{display(pair.after)}</span></p> : <p><span>{display(value)}</span></p>}</div>
    })}</div>}</section>
    {item.userAgent && <details><summary>浏览器信息</summary><p>{item.userAgent}</p></details>}
  </aside></div>
}

function formatTime(value: string) { return new Date(value).toLocaleString('zh-CN', { hour12: false }) }
function display(value: unknown) { return value === null || value === undefined || value === '' ? '空' : String(value) }
