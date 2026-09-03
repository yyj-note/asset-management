import { useEffect, useState } from 'react'
import type { AssetProfile, LookupType } from '../types'
import { lookupLabels } from '../types'
import { CloseIcon, PlusIcon } from './Icons'

interface Props {
  type: LookupType | null
  loading: boolean
  onClose: () => void
  onCreate: (name: string, assetProfile?: AssetProfile) => Promise<void>
}

export function LookupModal({ type, loading, onClose, onCreate }: Props) {
  const [name, setName] = useState('')
  const [assetProfile, setAssetProfile] = useState<AssetProfile>('GENERAL')

  useEffect(() => { setName(''); setAssetProfile('GENERAL') }, [type])
  if (!type) return null

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="lookup-title">
        <div className="modal-head">
          <div>
            <span className="eyebrow">快速补充选项</span>
            <h3 id="lookup-title">新建{lookupLabels[type]}</h3>
          </div>
          <button className="icon-button" onClick={onClose}><CloseIcon /></button>
        </div>
        <form onSubmit={async (event) => { event.preventDefault(); if (name.trim()) await onCreate(name.trim(), type === 'CATEGORY' ? assetProfile : undefined) }}>
          <label className="field-label" htmlFor="lookup-name">{lookupLabels[type]}名称</label>
          <input id="lookup-name" autoFocus maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder={`例如：${type === 'LOCATION' ? '上海办公室' : '请输入名称'}`} />
          {type === 'CATEGORY' && <><label className="field-label lookup-profile-label" htmlFor="lookup-profile">参数模板</label><select id="lookup-profile" value={assetProfile} onChange={(event) => setAssetProfile(event.target.value as AssetProfile)}><option value="COMPUTER">电脑设备</option><option value="DISPLAY">显示设备</option><option value="GENERAL">普通设备</option></select></>}
          <p className="field-help">保存后会自动加入下拉选项，并在当前资产表单中选中。</p>
          <div className="modal-actions">
            <button type="button" className="button ghost" onClick={onClose}>取消</button>
            <button className="button primary" disabled={loading || !name.trim()}><PlusIcon />{loading ? '创建中…' : '创建并选中'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
