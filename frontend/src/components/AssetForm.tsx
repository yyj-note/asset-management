import { useEffect, useRef, useState } from 'react'
import type { Asset, AssetPayload, AssetProfile, LookupType, LookupValue, RelatedDevice } from '../types'
import { lookupLabels } from '../types'
import { PlusIcon, SaveIcon, TrashIcon, UploadIcon } from './Icons'
import { EditableCombobox } from './EditableCombobox'
import type { ComboboxOption } from './EditableCombobox'

interface Props {
  asset: Asset | null
  clone?: boolean
  lookups: LookupValue[]
  bindableAssets: Asset[]
  saving: boolean
  createdLookup: LookupValue | null
  assetNameSuggestions: string[]
  graphicsCardSuggestions: string[]
  departmentSuggestions: string[]
  onCancel: () => void
  onSave: (payload: AssetPayload) => Promise<void>
  onNewLookup: (type: LookupType) => void
  onDeleteLookup: (lookup: LookupValue) => Promise<boolean>
}

const emptyPayload = (): AssetPayload => ({
  assetTag: '', name: '', ownershipDepartment: '', cpu: '', memory: '', storage: '', graphicsCard: '', manufacturerSerialNumber: '',
  screenSize: '', displayResolution: '', displayInterface: '', orderNumber: '',
  companyId: null, modelId: null, modelName: '', categoryId: null, statusId: null, locationId: null,
  purchasePrice: null, currentValue: null, checkedOut: false, assignedTo: '',
  imageUrl: '', notes: '', boundDisplayIds: [], boundComputerId: null, relatedDevices: [], accessories: [],
})

function fromAsset(asset: Asset | null, clone = false): AssetPayload {
  if (!asset) return emptyPayload()
  const statusMeansCheckedOut = asset.status.name.includes('在用') || asset.status.name.includes('领出')
  return {
    assetTag: clone ? '' : asset.assetTag,
    name: asset.name,
    ownershipDepartment: asset.ownershipDepartment || '',
    cpu: asset.cpu || '', memory: asset.memory || '', storage: asset.storage || '', graphicsCard: asset.graphicsCard || '',
    manufacturerSerialNumber: clone ? '' : asset.manufacturerSerialNumber || '',
    screenSize: asset.screenSize || '', displayResolution: asset.displayResolution || '',
    displayInterface: asset.displayInterface || '', orderNumber: asset.orderNumber || '',
    companyId: asset.company.id, modelId: asset.model.id, modelName: asset.model.name, categoryId: asset.category.id, statusId: asset.status.id,
    locationId: asset.location.id, purchasePrice: asset.purchasePrice, currentValue: asset.currentValue,
    checkedOut: clone ? false : asset.checkedOut || statusMeansCheckedOut, assignedTo: clone ? '' : asset.assignedTo || '',
    imageUrl: asset.imageUrl || '', notes: asset.notes || '',
    boundDisplayIds: clone ? [] : (asset.boundDisplays || []).map((item) => item.id),
    boundComputerId: clone ? null : asset.boundComputer?.id ?? null,
    relatedDevices: [
      ...(asset.relatedDevices || []).map((item) => ({ ...item })),
      ...(asset.accessories || []).map((item) => ({ name: item.name, model: '', serialNumber: '', orderNumber: '', specification: item.specification, quantity: item.quantity })),
    ],
    accessories: [],
  }
}

const categoryProfile = (category?: LookupValue): AssetProfile => {
  if (category?.assetProfile) return category.assetProfile
  const name = category?.name || ''
  if (name.includes('显示器') || name.includes('屏幕') || name.includes('大屏')) return 'DISPLAY'
  if (name.includes('电脑') || name.includes('台式') || name.includes('笔记本') || name.toLowerCase().includes('mac')) return 'COMPUTER'
  return 'GENERAL'
}

interface LookupFieldProps {
  type: LookupType
  value: number | null
  values: LookupValue[]
  required?: boolean
  onChange: (value: number | null) => void
  onNew?: () => void
  onDelete?: (lookup: LookupValue) => Promise<boolean>
}

function LookupField({ type, value, values, required, onChange, onNew, onDelete }: LookupFieldProps) {
  const typeValues = values.filter((item) => item.type === type)
  const selected = typeValues.find((item) => item.id === value)
  const displayName = (name: string) => type !== 'STATUS' ? name
    : name.includes('在用') || name.includes('领出') ? '已经领出'
      : name.includes('可领用') || name.includes('当前可用') ? '当前可用'
        : name.includes('维修') || name.includes('维护') ? '维护中'
          : name.includes('报废') ? '已报废' : name
  return <EditableCombobox
    required={required}
    value={selected ? displayName(selected.name) : ''}
    selectedId={value}
    placeholder={`请选择${lookupLabels[type]}`}
    options={typeValues.map((item) => ({ id: item.id, label: displayName(item.name) }))}
    allowCreate={Boolean(onNew)}
    onCreate={onNew}
    onChange={(_, id) => onChange(typeof id === 'number' ? id : null)}
    onDelete={onDelete ? (option) => onDelete(typeValues.find((item) => item.id === option.id)!) : undefined}
  />
}

export function AssetForm({ asset, clone = false, lookups, bindableAssets, saving, createdLookup, assetNameSuggestions, graphicsCardSuggestions, departmentSuggestions, onCancel, onSave, onNewLookup, onDeleteLookup }: Props) {
  const [form, setForm] = useState<AssetPayload>(() => fromAsset(asset, clone))
  const [imageError, setImageError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const set = <K extends keyof AssetPayload>(key: K, value: AssetPayload[K]) => setForm((current) => ({ ...current, [key]: value }))

  useEffect(() => {
    if (!createdLookup) return
    if (createdLookup.type === 'MODEL') {
      setForm((current) => ({ ...current, modelId: createdLookup.id, modelName: createdLookup.name }))
      return
    }
    const fieldByType: Partial<Record<LookupType, keyof AssetPayload>> = {
      COMPANY: 'companyId', MODEL: 'modelId', CATEGORY: 'categoryId', STATUS: 'statusId', LOCATION: 'locationId',
    }
    const field = fieldByType[createdLookup.type]
    if (field) setForm((current) => ({ ...current, [field]: createdLookup.id }))
  }, [createdLookup])

  const handleImage = (file?: File) => {
    setImageError('')
    if (!file) return
    if (!file.type.startsWith('image/')) { setImageError('请选择图片文件'); return }
    if (file.size > 2 * 1024 * 1024) { setImageError('图片不能超过 2 MB'); return }
    const reader = new FileReader()
    reader.onload = () => set('imageUrl', String(reader.result))
    reader.readAsDataURL(file)
  }

  const updateDevice = (index: number, change: Partial<RelatedDevice>) => set('relatedDevices', form.relatedDevices.map((item, itemIndex) => itemIndex === index ? { ...item, ...change } : item))
  const selectedCategory = lookups.find((item) => item.type === 'CATEGORY' && item.id === form.categoryId)
  const profile = categoryProfile(selectedCategory)
  const availableDisplays = bindableAssets.filter((item) => categoryProfile(item.category) === 'DISPLAY' && item.id !== asset?.id
    && (!item.boundComputer || item.boundComputer.id === asset?.id))
  const availableComputers = bindableAssets.filter((item) => categoryProfile(item.category) === 'COMPUTER' && item.id !== asset?.id)
  const modelField = (label: string) => <label><span>{label} *</span><EditableCombobox editable required value={form.modelName} selectedId={form.modelId} placeholder="输入或选择型号" options={lookups.filter((item) => item.type === 'MODEL').map((item) => ({ id: item.id, label: item.name }))} onChange={(value, id) => setForm((current) => ({ ...current, modelName: value, modelId: typeof id === 'number' ? id : null }))} onDelete={async (option: ComboboxOption) => onDeleteLookup(lookups.find((item) => item.id === option.id)!)} /></label>

  return <section className="invoice-form-page">
    <div className="invoice-form-outer"><form className="invoice-form-card symmetric-asset-form" onSubmit={async (event) => { event.preventDefault(); await onSave(form) }}>
      <div className="invoice-form-heading"><div><h2>{clone ? '克隆资产' : asset ? '编辑资产' : '新增资产'}</h2><p>资产编号：{form.assetTag || '保存后按日期与当日流水自动生成'} · {new Date().toLocaleDateString('zh-CN')}</p></div><span className="form-mode">{clone ? 'CLONE' : asset ? 'EDIT' : 'CREATE'}</span></div>

      <section className="form-section">
        <div className="form-section-head"><div><h3>基本信息</h3><p>编号、名称以及资产归属信息</p></div></div>
        <div className="form-row-grid basic-info-grid">
          <label><span>资产编号</span><div className="asset-number-control locked"><input readOnly value={form.assetTag} placeholder="保存时自动生成" /></div></label>
          <label><span>资产名称 *</span><EditableCombobox editable required value={form.name} selectedId={assetNameSuggestions.find((value) => value.localeCompare(form.name, undefined, { sensitivity: 'accent' }) === 0) ?? null} placeholder="输入或选择资产名称" options={assetNameSuggestions.map((value) => ({ id: value, label: value }))} onChange={(value) => set('name', value.slice(0, 160))} /></label>
          <label><span>所属公司 *</span><LookupField type="COMPANY" required value={form.companyId} values={lookups} onChange={(v) => set('companyId', v)} onNew={() => onNewLookup('COMPANY')} onDelete={onDeleteLookup} /></label>
          <label><span>归属部门</span><EditableCombobox editable value={form.ownershipDepartment} selectedId={departmentSuggestions.find((value) => value.localeCompare(form.ownershipDepartment, undefined, { sensitivity: 'accent' }) === 0) ?? null} placeholder="输入或选择资产归属部门" options={departmentSuggestions.map((value) => ({ id: value, label: value }))} onChange={(value) => set('ownershipDepartment', value.slice(0, 120))} /></label>
          <label><span>资产分类 *</span><LookupField type="CATEGORY" required value={form.categoryId} values={lookups} onChange={(v) => {
            const nextProfile = categoryProfile(lookups.find((item) => item.id === v))
            setForm((current) => ({ ...current, categoryId: v, boundDisplayIds: nextProfile === 'COMPUTER' ? current.boundDisplayIds : [], boundComputerId: nextProfile === 'DISPLAY' ? current.boundComputerId : null }))
          }} onNew={() => onNewLookup('CATEGORY')} onDelete={onDeleteLookup} /></label>
          <label><span>存放位置 *</span><LookupField type="LOCATION" required value={form.locationId} values={lookups} onChange={(v) => set('locationId', v)} onNew={() => onNewLookup('LOCATION')} onDelete={onDeleteLookup} /></label>
          <label><span>资产状态 *</span><LookupField type="STATUS" required value={form.statusId} values={lookups} onChange={(v) => {
            const nextStatus = lookups.find((item) => item.id === v)
            const checkedOut = Boolean(nextStatus && (nextStatus.name.includes('在用') || nextStatus.name.includes('领出')))
            setForm((current) => ({ ...current, statusId: v, checkedOut, assignedTo: checkedOut ? current.assignedTo : '' }))
          }} /></label>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-head"><div><h3>{profile === 'DISPLAY' ? '显示器参数' : profile === 'COMPUTER' ? '电脑配置' : '设备参数'}</h3><p>{profile === 'DISPLAY' ? '显示器型号、规格与采购识别信息' : profile === 'COMPUTER' ? '电脑型号与主要硬件参数' : '普通设备的型号与识别信息'}</p></div><span className={`profile-badge ${profile.toLowerCase()}`}>{profile === 'DISPLAY' ? '显示设备' : profile === 'COMPUTER' ? '电脑设备' : '普通设备'}</span></div>
        <div className={`form-row-grid device-config-grid profile-${profile.toLowerCase()}`}>
          {profile === 'COMPUTER' && <>
            {modelField('电脑型号')}
            <label><span>CPU</span><EditableCombobox editable value={form.cpu} selectedId={lookups.find((item) => item.type === 'CPU' && item.name.localeCompare(form.cpu, undefined, { sensitivity: 'accent' }) === 0)?.id ?? null} placeholder="输入或选择 CPU" options={lookups.filter((item) => item.type === 'CPU').map((item) => ({ id: item.id, label: item.name }))} onChange={(value) => set('cpu', value)} onDelete={async (option: ComboboxOption) => onDeleteLookup(lookups.find((item) => item.id === option.id)!)} /></label>
            <label><span>内存</span><EditableCombobox editable value={form.memory} selectedId={form.memory} placeholder="可输入，或选择常用容量" options={['8G', '16G', '32G', '64G'].map((value) => ({ id: value, label: value }))} onChange={(value) => set('memory', value)} /></label>
            <label><span>硬盘</span><EditableCombobox editable value={form.storage} selectedId={form.storage} placeholder="可输入，或选择常用容量" options={['250G', '512G', '1T'].map((value) => ({ id: value, label: value }))} onChange={(value) => set('storage', value)} /></label>
            <label><span>显卡</span><EditableCombobox editable value={form.graphicsCard} selectedId={graphicsCardSuggestions.find((value) => value.localeCompare(form.graphicsCard, undefined, { sensitivity: 'accent' }) === 0) ?? null} placeholder="输入或选择显卡" options={graphicsCardSuggestions.map((value) => ({ id: value, label: value }))} onChange={(value) => set('graphicsCard', value.slice(0, 200))} /></label>
            <label><span>厂家序列号</span><input maxLength={160} value={form.manufacturerSerialNumber} onChange={(event) => set('manufacturerSerialNumber', event.target.value)} placeholder="机身或 BIOS 中的 SN" /></label>
          </>}
          {profile === 'DISPLAY' && <>
            {modelField('显示器型号')}
            <label><span>屏幕尺寸</span><input maxLength={80} value={form.screenSize} onChange={(event) => set('screenSize', event.target.value)} placeholder="例如 27 英寸" /></label>
            <label><span>分辨率</span><input maxLength={120} value={form.displayResolution} onChange={(event) => set('displayResolution', event.target.value)} placeholder="例如 3840 × 2160" /></label>
            <label><span>显示接口</span><input maxLength={160} value={form.displayInterface} onChange={(event) => set('displayInterface', event.target.value)} placeholder="HDMI / DP / Type-C" /></label>
            <label><span>厂家序列号</span><input maxLength={160} value={form.manufacturerSerialNumber} onChange={(event) => set('manufacturerSerialNumber', event.target.value)} placeholder="显示器背面的 SN" /></label>
            <label><span>订单号</span><input maxLength={160} value={form.orderNumber} onChange={(event) => set('orderNumber', event.target.value)} placeholder="采购订单号" /></label>
          </>}
          {profile === 'GENERAL' && <>
            {modelField('设备型号')}
            <label><span>厂家序列号</span><input maxLength={160} value={form.manufacturerSerialNumber} onChange={(event) => set('manufacturerSerialNumber', event.target.value)} placeholder="设备 SN" /></label>
            <label><span>订单号</span><input maxLength={160} value={form.orderNumber} onChange={(event) => set('orderNumber', event.target.value)} placeholder="采购订单号" /></label>
          </>}
        </div>
      </section>

      {profile !== 'GENERAL' && <section className="form-section full-width-section asset-binding-section">
        <div className="form-section-head"><div><h3>设备绑定</h3><p>{profile === 'COMPUTER' ? '从已有显示器资产中选择，可绑定多台显示器' : '选择这台显示器当前所属的电脑，可暂时不绑定'}</p></div></div>
        {profile === 'COMPUTER'
          ? <div className="asset-binding-grid">{availableDisplays.length === 0 ? <div className="dynamic-empty">暂无可绑定的显示器资产；请先新建“显示设备”资产</div> : availableDisplays.map((item) => <label className={`asset-binding-option ${form.boundDisplayIds.includes(item.id) ? 'selected' : ''}`} key={item.id}><input type="checkbox" checked={form.boundDisplayIds.includes(item.id)} onChange={(event) => set('boundDisplayIds', event.target.checked ? [...form.boundDisplayIds, item.id] : form.boundDisplayIds.filter((id) => id !== item.id))} /><span><strong>{item.assetTag}</strong><b>{item.name}</b><small>{item.model.name} · {item.location.name}</small></span></label>)}</div>
          : <label className="bound-computer-field"><span>绑定电脑</span><select value={form.boundComputerId ?? ''} onChange={(event) => set('boundComputerId', event.target.value ? Number(event.target.value) : null)}><option value="">暂不绑定电脑</option>{availableComputers.map((item) => <option key={item.id} value={item.id}>{item.assetTag} · {item.name} · {item.model.name}</option>)}</select></label>}
      </section>}

      <section className="form-section full-width-section">
        <div className="form-section-head"><div><h3>随附配件</h3><p>鼠标、充电器等不单独贴资产标签的配件，记录型号、订单号、规格和数量</p></div><button type="button" className="section-add-button" onClick={() => set('relatedDevices', [...form.relatedDevices, { name: '', model: '', serialNumber: '', orderNumber: '', specification: '', quantity: 1 }])}><PlusIcon />添加随附配件</button></div>
        <div className="dynamic-editor related-editor">
          <div className="dynamic-head"><span>设备名称</span><span>型号</span><span>序列号</span><span>订单号</span><span>规格参数</span><span className="related-quantity-head"><span>数量</span><span>操作</span></span></div>
          {form.relatedDevices.length === 0 ? <div className="dynamic-empty">暂无随附配件，可添加鼠标、充电器或其他不单独建档的配件</div> : form.relatedDevices.map((device, index) => <div className="dynamic-row related-device-row" key={index}>
            <input required maxLength={120} value={device.name} onChange={(e) => updateDevice(index, { name: e.target.value })} placeholder="鼠标 / 充电器 / 其他配件" />
            <input maxLength={160} value={device.model} onChange={(e) => updateDevice(index, { model: e.target.value })} placeholder="Dell U2723QE" />
            <input maxLength={160} value={device.serialNumber} onChange={(e) => updateDevice(index, { serialNumber: e.target.value })} placeholder="厂家 SN" />
            <input maxLength={160} value={device.orderNumber || ''} onChange={(e) => updateDevice(index, { orderNumber: e.target.value })} placeholder="采购订单号" />
            <input maxLength={300} value={device.specification} onChange={(e) => updateDevice(index, { specification: e.target.value })} placeholder="27英寸 / 4K / HDMI" />
            <div className="related-quantity-actions"><input min="1" max="9999" type="number" value={device.quantity} onChange={(e) => updateDevice(index, { quantity: Math.max(1, Number(e.target.value) || 1) })} />
              <button type="button" className="remove-row-button" title="删除随附配件" onClick={() => set('relatedDevices', form.relatedDevices.filter((_, itemIndex) => itemIndex !== index))}><TrashIcon /></button>
            </div>
          </div>)}
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-head"><div><h3>价值与领用</h3><p>价格和当前使用状态</p></div></div>
        <div className="form-row-grid value-use-grid">
          <label><span>采购价格（元）</span><input min="0" step="0.01" type="number" value={form.purchasePrice ?? ''} onChange={(e) => set('purchasePrice', e.target.value === '' ? null : Number(e.target.value))} placeholder="0.00" /></label>
          <label><span>当前价值（元）</span><input min="0" step="0.01" type="number" value={form.currentValue ?? ''} onChange={(e) => set('currentValue', e.target.value === '' ? null : Number(e.target.value))} placeholder="0.00" /></label>
          <label><span>领用人</span><input disabled={!form.checkedOut} required={form.checkedOut} maxLength={120} value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)} placeholder={form.checkedOut ? '请输入领用人' : '当前未领用'} /></label>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-head"><div><h3>图片与备注</h3><p>左右等宽，集中保存补充资料</p></div></div>
        <div className="symmetric-media-grid">
          <div><span className="field-title">资产图片</span><div className="image-uploader" onClick={() => fileRef.current?.click()}>{form.imageUrl ? <img src={form.imageUrl} alt="资产预览" /> : <><UploadIcon /><strong>上传资产图片</strong><span>JPG、PNG、WebP，最大 2 MB</span></>}<input ref={fileRef} hidden type="file" accept="image/*" onChange={(e) => handleImage(e.target.files?.[0])} /></div>{form.imageUrl && <button type="button" className="text-button" onClick={() => set('imageUrl', '')}>移除当前图片</button>}{imageError && <small className="field-error">{imageError}</small>}</div>
          <label><span>备注</span><textarea maxLength={2000} rows={7} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="记录保修、附件或其他说明…" /></label>
        </div>
      </section>

      <div className="invoice-form-actions"><button type="button" className="button ghost" onClick={onCancel}>取消</button><button className="button primary" disabled={saving}><SaveIcon />{saving ? '保存中…' : clone ? '创建克隆资产' : asset ? '保存修改' : '创建资产'}</button></div>
    </form></div>
  </section>
}
