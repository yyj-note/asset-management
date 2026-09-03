import { useEffect, useState } from 'react'
import type { Asset } from '../types'
import { CloneIcon, EditIcon, ReturnIcon, TrashIcon } from './Icons'
import { AssetImageLightbox } from './AssetImageLightbox'

interface Props {
  asset: Asset | null
  canEdit: boolean
  canReturn: boolean
  canDelete: boolean
  onClose: () => void
  onEdit: (asset: Asset) => void
  onClone: (asset: Asset) => void
  onReturn: (asset: Asset) => void
  onDelete: (asset: Asset) => void
}

const money = (value: number | null) => value == null ? '—' : `¥ ${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
const time = (value: string) => new Date(value).toLocaleString('zh-CN', { hour12: false })
const isMaintenance = (asset: Asset) => asset.status.name.includes('维修') || asset.status.name.includes('维护')
export function AssetDetail({ asset, canEdit, canReturn, canDelete, onClose, onEdit, onClone, onReturn, onDelete }: Props) {
  const [qrUnavailable, setQrUnavailable] = useState(false)
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
  useEffect(() => { setQrUnavailable(false); setImagePreviewOpen(false) }, [asset?.id])
  if (!asset) return null
  const maintenance = isMaintenance(asset)
  const scrapped = asset.status.name.includes('报废')
  const state = scrapped ? '已报废' : maintenance ? '维护中' : asset.checkedOut ? '已经领出' : '当前可用'
  const profile = asset.category.assetProfile || 'GENERAL'
  const relatedItems = [
    ...(asset.relatedDevices || []),
    ...(asset.accessories || []).map((item) => ({ name: item.name, model: '', serialNumber: '', orderNumber: '', specification: item.specification, quantity: item.quantity })),
  ]
  const identityRows = [
    ['资产名称', asset.name, '资产分类', asset.category.name],
  ]
  const deviceRows = profile === 'COMPUTER' ? [
    ['电脑型号', asset.model.name, '厂家序列号', asset.manufacturerSerialNumber || '—'],
    ['CPU', asset.cpu || '—', '内存', asset.memory || '—'],
    ['硬盘', asset.storage || '—', '显卡', asset.graphicsCard || '—'],
  ] : profile === 'DISPLAY' ? [
    ['显示器型号', asset.model.name, '厂家序列号', asset.manufacturerSerialNumber || '—'],
    ['屏幕尺寸', asset.screenSize || '—', '分辨率', asset.displayResolution || '—'],
    ['显示接口', asset.displayInterface || '—', '订单号', asset.orderNumber || '—'],
  ] : [
    ['设备型号', asset.model.name, '厂家序列号', asset.manufacturerSerialNumber || '—'],
    ['订单号', asset.orderNumber || '—', '设备模板', '普通设备'],
  ]
  const parameterRows = [
    ...identityRows,
    ...deviceRows,
    ['所属公司', asset.company.name, '归属部门', asset.ownershipDepartment || '未设置'],
    ['存放位置', asset.location.name, '资产分类', asset.category.name],
    ['领用情况', asset.checkedOut ? `${state} · ${asset.assignedTo || '未填写领用人'}` : state, '当前状态', state],
    ['创建时间', time(asset.createdAt), '更新时间', time(asset.updatedAt)],
    ['采购价格', money(asset.purchasePrice), '当前价值', money(asset.currentValue)],
  ]
  const boundAssets = profile === 'COMPUTER' ? asset.boundDisplays : asset.boundComputer ? [asset.boundComputer] : []

  return <section className="record-page">
    <div className="record-card-outer"><article className="record-card">
      <div className="record-topline">
        {qrUnavailable
          ? <div className="asset-label-download unavailable"><strong>资产标签未配置</strong><span>请联系超级管理员前往设置</span></div>
          : <a className="asset-label-download" href={`/label-print?assetId=${asset.id}&assetTag=${encodeURIComponent(asset.assetTag)}`} target="_blank" rel="noopener" title="点击预览并打印资产标签"><img src={`/api/assets/${asset.id}/qr`} onError={() => setQrUnavailable(true)} alt={`${asset.assetTag} 资产标签`} /></a>}
      </div>

      <div className="record-table">
        <div className="record-table-head"><span>参数名称</span><strong>参数内容</strong><span>参数名称</span><strong>参数内容</strong></div>
        {parameterRows.map(([labelA, valueA, labelB, valueB]) => <div className="record-table-row" key={labelA}>
          <span>{labelA}</span><strong>{valueA}</strong><span>{labelB}</span><strong>{valueB}</strong>
        </div>)}
      </div>

      {profile !== 'GENERAL' && <section className="record-subsection">
        <div className="record-subsection-head"><div><h3>设备绑定</h3><span>{boundAssets.length} 项</span></div></div>
        <div className="record-item-table related-record-table">
          <div className="record-item-head"><span>资产编号</span><span>资产名称</span><span>分类</span><span>型号</span><span>绑定关系</span><span>数量</span></div>
          {boundAssets.length === 0 ? <div className="record-item-empty">{profile === 'COMPUTER' ? '暂未绑定显示器' : '暂未绑定电脑'}</div> : boundAssets.map((item) => <div className="record-item-row" key={item.id}><strong>{item.assetTag}</strong><span>{item.name}</span><span>{item.category || '—'}</span><span>{item.model || '—'}</span><span>{profile === 'COMPUTER' ? '已配显示器' : '所属电脑'}</span><b>× 1</b></div>)}
        </div>
      </section>}

      <section className="record-subsection">
        <div className="record-subsection-head"><div><h3>随附配件</h3><span>{relatedItems.reduce((sum, item) => sum + item.quantity, 0)} 件</span></div></div>
        <div className="record-item-table related-record-table">
          <div className="record-item-head"><span>设备名称</span><span>型号</span><span>序列号</span><span>订单号</span><span>规格参数</span><span>数量</span></div>
          {relatedItems.length === 0 ? <div className="record-item-empty">暂无随附配件</div> : relatedItems.map((device, index) => <div className="record-item-row" key={`${device.name}-${index}`}><strong>{device.name}</strong><span>{device.model || '—'}</span><span>{device.serialNumber || '—'}</span><span>{device.orderNumber || '—'}</span><span>{device.specification || '—'}</span><b>× {device.quantity}</b></div>)}
        </div>
      </section>

      <div className="record-bottom centered-media">
        <div className="record-notes-media">
          {asset.imageUrl
            ? <div className="record-image-shell"><button className="record-image-preview" title="点击放大图片" onClick={() => setImagePreviewOpen(true)}><img src={asset.imageUrl} alt={asset.name} /><span>点击放大</span></button></div>
            : <div className="record-placeholder record-large-placeholder">{asset.name.slice(0, 1)}</div>}
          <div className="record-notes"><span>备注</span><p>{asset.notes || '暂无备注'}</p></div>
        </div>
      </div>

      <div className="record-actions danger-zone">
        <div>{canDelete && <button className="button danger-button" onClick={() => onDelete(asset)}><TrashIcon />删除资产</button>}</div>
        <div>
          {canReturn && asset.checkedOut && <button className="button return-button" onClick={() => onReturn(asset)}><ReturnIcon />归还资产</button>}
          {canEdit && <button className="button clone-button" onClick={() => onClone(asset)}><CloneIcon />克隆资产</button>}
          {canEdit && <button className="button warm" onClick={() => onEdit(asset)}><EditIcon />编辑资产</button>}
          <button className="button primary" onClick={onClose}>返回资产列表</button>
        </div>
      </div>
      <AssetImageLightbox asset={imagePreviewOpen ? asset : null} onClose={() => setImagePreviewOpen(false)} />
    </article></div>
  </section>
}
