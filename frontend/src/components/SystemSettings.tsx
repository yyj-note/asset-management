import { useEffect, useState } from 'react'
import { api } from '../api'
import type { QrSetting } from '../types'
import { SaveIcon, SettingsIcon } from './Icons'
import { AssetTransfer } from './AssetTransfer'

interface Props {
  onNotify: (text: string, kind?: 'ok' | 'error') => void
}

export function SystemSettings({ onNotify }: Props) {
  const [setting, setSetting] = useState<QrSetting | null>(null)
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.getQrSetting().then((qrResult) => {
      setSetting(qrResult); setValue(qrResult.qrBaseUrl || '')
    })
      .catch((error) => onNotify(error instanceof Error ? error.message : '读取设置失败', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const updated = await api.updateQrSetting(value)
      setSetting(updated); setValue(updated.qrBaseUrl)
      onNotify('二维码访问地址已保存，新生成的二维码将使用该地址')
    } catch (error) {
      onNotify(error instanceof Error ? error.message : '保存设置失败', 'error')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="settings-loading"><span className="spinner" />正在读取设置…</div>

  return <section className="settings-page">
    <div className="settings-shell"><article className="settings-card">
      <header className="settings-head"><div className="settings-icon"><SettingsIcon /></div><div><h2>系统设置</h2><p>管理二维码访问地址与资产数据工具</p></div></header>
      <div className="settings-section-title"><strong>二维码设置</strong><span>为每个部署实例配置自己的长期访问地址</span></div>
      <div className="settings-field">
        <label htmlFor="qr-base-url">二维码访问地址</label>
        <div><input id="qr-base-url" type="url" value={value} onChange={(event) => setValue(event.target.value)} placeholder="例如 https://asset.example.com" /><button className="button primary" disabled={saving || !value.trim()} onClick={() => void save()}><SaveIcon />{saving ? '保存中…' : '保存设置'}</button></div>
        <small>必须填写完整的 http:// 或 https:// 地址。建议使用内部 DNS 固定域名，不要填写可能迁移的服务器 IP。</small>
      </div>
      <div className="settings-status"><span className={setting?.configured ? 'configured' : 'unconfigured'}>{setting?.configured ? '已配置' : '未配置'}</span><div><strong>{setting?.qrBaseUrl || '尚未设置二维码访问地址'}</strong><p>资产二维码使用不可变标识，修改资产编号不会导致二维码失效。</p></div></div>
      <div className="settings-guidance"><h3>域名迁移规则</h3><p>二维码打印后内容无法改变。更换域名时，请保留旧域名并通过 DNS 或 HTTP 301/302 跳转到新域名，旧标签才能继续使用。</p></div>
      <section className="settings-transfer-section">
        <div className="settings-section-title"><strong>导入导出</strong><span>下载统一 CSV 模板，集中处理资产数据</span></div>
        <AssetTransfer onNotify={onNotify} />
      </section>
    </article></div>
  </section>
}
