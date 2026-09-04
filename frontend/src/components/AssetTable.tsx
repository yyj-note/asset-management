import { useState } from 'react'
import type { Asset } from '../types'
import { CloneIcon, EditIcon } from './Icons'
import { AssetImageLightbox } from './AssetImageLightbox'

interface Props {
  assets: Asset[]
  loading: boolean
  canEdit: boolean
  onSelect: (asset: Asset) => void
  onEdit: (asset: Asset) => void
  onClone: (asset: Asset) => void
}

const money = (value: number | null) => value == null ? '' : `¥ ${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
const isMaintenance = (asset: Asset) => asset.status.name.includes('维修') || asset.status.name.includes('维护')
const isScrapped = (asset: Asset) => asset.status.name.includes('报废')

export function AssetTable({ assets, loading, canEdit, onSelect, onEdit, onClone }: Props) {
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null)
  const showPurchasePrice = assets.some((asset) => asset.purchasePrice != null)
  const showCurrentValue = assets.some((asset) => asset.currentValue != null)
  const valueColumnCount = Number(showPurchasePrice) + Number(showCurrentValue)
  const columnCount = 13 + valueColumnCount

  return (
    <><div className="table-wrap">
      <table className={`asset-table invoice-asset-table value-columns-${valueColumnCount}`}>
        <colgroup>
          <col className="asset-col-tag" />
          <col className="asset-col-name" />
          <col className="asset-col-image" />
          <col className="asset-col-model" />
          <col className="asset-col-cpu" />
          <col className="asset-col-memory" />
          <col className="asset-col-storage" />
          <col className="asset-col-graphics" />
          <col className="asset-col-category" />
          <col className="asset-col-status" />
          <col className="asset-col-assignee" />
          <col className="asset-col-location" />
          {showPurchasePrice && <col className="asset-col-price" />}
          {showCurrentValue && <col className="asset-col-value" />}
          <col className="asset-col-actions" />
        </colgroup>
        <thead><tr>
          <th>资产编号</th><th>资产名称</th><th>图片</th><th>设备型号</th><th>CPU</th><th>内存</th><th>硬盘</th><th>显卡</th><th>分类</th><th>状态</th>
          <th>领用人</th><th>位置</th>{showPurchasePrice && <th className="number">采购价格</th>}{showCurrentValue && <th className="number">当前价值</th>}<th className="sticky-action">操作</th>
        </tr></thead>
        <tbody>
          {loading ? <tr><td colSpan={columnCount}><div className="table-empty"><span className="spinner" />正在读取资产…</div></td></tr> :
           assets.length === 0 ? <tr><td colSpan={columnCount}><div className="table-empty"><strong>该分类下暂无资产</strong><span>可以切换上方状态卡片，或新增一项资产。</span></div></td></tr> :
           assets.map((asset) => {
             const scrapped = isScrapped(asset)
             const maintenance = isMaintenance(asset)
             const state = scrapped ? '已报废' : maintenance ? '维护中' : asset.checkedOut ? '已经领出' : '当前可用'
             const stateClass = scrapped ? 'scrapped' : maintenance ? 'maintenance' : asset.checkedOut ? 'checked-out' : 'available'
             const isComputer = asset.category.assetProfile === 'COMPUTER'
             const primaryImage = asset.imageUrls?.[0] || asset.imageUrl
             return <tr key={asset.id} onClick={() => onSelect(asset)}>
               <td><span className="asset-tag">{asset.assetTag}</span></td>
               <td><strong className="asset-name compact-text" title={asset.name}>{asset.name}</strong></td>
               <td>{primaryImage ? <button className="image-preview-trigger" title={`点击查看${asset.imageUrls?.length || 1}张图片`} onClick={(event) => { event.stopPropagation(); setPreviewAsset(asset) }}><img className="table-image" src={primaryImage} alt={asset.name} /></button> : <span className="no-image">{asset.name.slice(0, 1)}</span>}</td>
               <td><span className="configuration-value compact-text" title={asset.model.name}>{asset.model.name}</span></td>
               <td><span className="configuration-value compact-text" title={isComputer ? asset.cpu || '' : ''}>{isComputer ? asset.cpu || '' : ''}</span></td>
               <td><span className="configuration-value compact-text" title={isComputer ? asset.memory || '' : ''}>{isComputer ? asset.memory || '' : ''}</span></td>
               <td><span className="configuration-value compact-text" title={isComputer ? asset.storage || '' : ''}>{isComputer ? asset.storage || '' : ''}</span></td>
               <td><span className="configuration-value compact-text" title={isComputer ? asset.graphicsCard || '' : ''}>{isComputer ? asset.graphicsCard || '' : ''}</span></td>
               <td><span className="compact-text" title={asset.category.name}>{asset.category.name}</span></td>
               <td><span className={`status-pill ${stateClass}`}>{state}</span></td>
               <td><span className="compact-text" title={asset.assignedTo || '暂未领用'}>{asset.assignedTo || '暂未领用'}</span></td>
               <td><span className="compact-text" title={asset.location.name}>{asset.location.name}</span></td>
               {showPurchasePrice && <td className="number value-cell">{money(asset.purchasePrice)}</td>}
               {showCurrentValue && <td className="number value-cell">{money(asset.currentValue)}</td>}
               <td className="sticky-action"><div className="row-actions">
                 {canEdit && <button className="clone-action" title="克隆资产" onClick={(event) => { event.stopPropagation(); onClone(asset) }}><CloneIcon /></button>}
                 {canEdit && <button className="edit-action" title="编辑资产" onClick={(event) => { event.stopPropagation(); onEdit(asset) }}><EditIcon /></button>}
               </div></td>
             </tr>
           })}
        </tbody>
      </table>
    </div><AssetImageLightbox asset={previewAsset} onClose={() => setPreviewAsset(null)} /></>
  )
}
