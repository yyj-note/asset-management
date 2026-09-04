import type { Asset, AssetFilter } from '../types'
import { ArchiveIcon, BoxesIcon, CheckIcon, DashboardIcon, PlusIcon, RefreshIcon, UserIcon, WrenchIcon } from './Icons'

interface Props {
  assets: Asset[]
  loading: boolean
  canCreate: boolean
  onRefresh: () => void
  onCreate: () => void
  onViewAssets: (filter: AssetFilter) => void
  onSelect: (asset: Asset) => void
}

type RankedItem = { label: string; count: number; percent: number }

const isComputer = (asset: Asset) => asset.category.assetProfile === 'COMPUTER'
  || /电脑|台式|笔记本|mac/i.test(asset.category.name)
const isDisplay = (asset: Asset) => asset.category.assetProfile === 'DISPLAY'
  || /显示器|屏幕|大屏/i.test(asset.category.name)
const isMaintenance = (asset: Asset) => /维修|维护/.test(asset.status.name)
const isScrapped = (asset: Asset) => asset.status.name.includes('报废')
const percent = (value: number, total: number) => total ? Math.round(value / total * 100) : 0
const text = (value: string | null | undefined) => value?.trim() || '未填写'

function rank(values: Array<string | null | undefined>, limit = 5): RankedItem[] {
  const counts = new Map<string, number>()
  values.map(text).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1))
  const total = values.length
  return Array.from(counts, ([label, count]) => ({ label, count, percent: percent(count, total) }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, 'zh-CN'))
    .slice(0, limit)
}

function Ranking({ title, items, tone }: { title: string; items: RankedItem[]; tone: string }) {
  return <div className={`cockpit-ranking ${tone}`}>
    <h3>{title}</h3>
    <div>{items.length === 0 ? <span className="cockpit-empty-copy">暂无数据</span> : items.map((item) => <div className="cockpit-rank-row" key={item.label}>
      <div><strong title={item.label}>{item.label}</strong><span>{item.count} 台</span></div>
      <div className="cockpit-progress"><i style={{ width: `${item.percent}%` }} /></div>
    </div>)}</div>
  </div>
}

const formatDate = (value: string) => new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
}).format(new Date(value))

export function ComputerDashboard({ assets, loading, canCreate, onRefresh, onCreate, onViewAssets, onSelect }: Props) {
  const computers = assets.filter(isComputer)
  const displays = assets.filter(isDisplay)
  const available = computers.filter((asset) => !asset.checkedOut && !isMaintenance(asset) && !isScrapped(asset)).length
  const checkedOut = computers.filter((asset) => asset.checkedOut && !isScrapped(asset)).length
  const maintenance = computers.filter(isMaintenance).length
  const scrapped = computers.filter(isScrapped).length
  const activeTotal = Math.max(1, computers.length)
  const configurationFields = computers.flatMap((asset) => [asset.cpu, asset.memory, asset.storage])
  const completedFields = configurationFields.filter((value) => Boolean(value?.trim())).length
  const configurationRate = percent(completedFields, computers.length * 3)
  const completeComputers = computers.filter((asset) => asset.cpu && asset.memory && asset.storage).length
  const missingImages = computers.filter((asset) => !asset.imageUrl && !asset.imageUrls?.length).length
  const missingDepartments = computers.filter((asset) => !asset.ownershipDepartment?.trim()).length
  const unboundDisplays = displays.filter((asset) => !asset.boundComputer).length
  const boundDisplays = displays.length - unboundDisplays
  const recent = [...computers].sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt)).slice(0, 6)
  const today = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(new Date())
  const availableEnd = percent(available, activeTotal)
  const checkedOutEnd = availableEnd + percent(checkedOut, activeTotal)
  const maintenanceEnd = checkedOutEnd + percent(maintenance, activeTotal)
  const ring = `conic-gradient(#15b795 0 ${availableEnd}%, #f2a228 ${availableEnd}% ${checkedOutEnd}%, #7b61e8 ${checkedOutEnd}% ${maintenanceEnd}%, #d8dee8 ${maintenanceEnd}% 100%)`

  const metrics: Array<{ label: string; value: number; detail: string; filter: AssetFilter; tone: string; icon: typeof BoxesIcon }> = [
    { label: '电脑资产', value: computers.length, detail: `全部资产 ${assets.length} 项`, filter: 'all', tone: 'blue', icon: BoxesIcon },
    { label: '当前可用', value: available, detail: `可用率 ${percent(available, computers.length)}%`, filter: 'available', tone: 'green', icon: CheckIcon },
    { label: '已经领出', value: checkedOut, detail: `领用率 ${percent(checkedOut, computers.length)}%`, filter: 'checkedOut', tone: 'orange', icon: UserIcon },
    { label: '维护中', value: maintenance, detail: maintenance ? '需要跟进处理' : '当前无维护设备', filter: 'maintenance', tone: 'violet', icon: WrenchIcon },
    { label: '已报废', value: scrapped, detail: scrapped ? '保留历史档案' : '当前无报废设备', filter: 'scrapped', tone: 'slate', icon: ArchiveIcon },
  ]

  return <section className={`computer-cockpit ${loading ? 'loading' : ''}`}>
    <header className="cockpit-heading">
      <div><span>COMPUTER ASSET COCKPIT</span><h1>驾驶舱</h1><p>{today} · 聚焦电脑配置、使用状态与配套设备</p></div>
      <div className="cockpit-heading-actions">
        <button className="cockpit-secondary-action" type="button" onClick={onRefresh}><RefreshIcon />刷新数据</button>
        {canCreate && <button className="cockpit-primary-action" type="button" onClick={onCreate}><PlusIcon /><span>登记电脑</span></button>}
      </div>
    </header>

    <div className="cockpit-metrics">{metrics.map((metric) => {
      const MetricIcon = metric.icon
      return <button className={`cockpit-metric ${metric.tone}`} type="button" key={metric.label} onClick={() => onViewAssets(metric.filter)}>
        <span className="cockpit-metric-icon"><MetricIcon /></span><span><b>{metric.label}</b><strong>{metric.value}</strong><small>{metric.detail}</small></span>
      </button>
    })}</div>

    <div className="cockpit-layout">
      <section className="cockpit-card cockpit-status-card">
        <div className="cockpit-card-head"><div><span>电脑状态</span><h2>使用情况</h2></div><button onClick={() => onViewAssets('all')}>查看资产</button></div>
        <div className="cockpit-status-body">
          <div className="cockpit-ring" style={{ background: ring }}><div><strong>{computers.length}</strong><span>电脑总量</span></div></div>
          <div className="cockpit-status-list">
            <div><i className="available" /><span>当前可用</span><b>{available}</b><small>{percent(available, computers.length)}%</small></div>
            <div><i className="checked" /><span>已经领出</span><b>{checkedOut}</b><small>{percent(checkedOut, computers.length)}%</small></div>
            <div><i className="maintenance" /><span>维护中</span><b>{maintenance}</b><small>{percent(maintenance, computers.length)}%</small></div>
            <div><i className="scrapped" /><span>已报废</span><b>{scrapped}</b><small>{percent(scrapped, computers.length)}%</small></div>
          </div>
        </div>
      </section>

      <section className="cockpit-card cockpit-health-card">
        <div className="cockpit-card-head"><div><span>档案质量</span><h2>配置完整度</h2></div><b className="cockpit-health-score">{configurationRate}%</b></div>
        <div className="cockpit-health-progress"><i style={{ width: `${configurationRate}%` }} /></div>
        <p>按 CPU、内存和硬盘三项关键配置计算</p>
        <div className="cockpit-health-grid">
          <div><span>配置完整</span><strong>{completeComputers}</strong><small>台电脑</small></div>
          <div><span>缺少配置</span><strong>{computers.length - completeComputers}</strong><small>台电脑</small></div>
          <div><span>缺少图片</span><strong>{missingImages}</strong><small>台电脑</small></div>
          <div><span>缺少部门</span><strong>{missingDepartments}</strong><small>台电脑</small></div>
        </div>
      </section>

      <section className="cockpit-card cockpit-config-card">
        <div className="cockpit-card-head"><div><span>硬件画像</span><h2>主流电脑配置</h2></div><span className="cockpit-card-note">按电脑数量排序</span></div>
        <div className="cockpit-config-columns">
          <Ranking title="CPU" items={rank(computers.map((asset) => asset.cpu))} tone="cpu" />
          <Ranking title="内存" items={rank(computers.map((asset) => asset.memory))} tone="memory" />
          <Ranking title="硬盘" items={rank(computers.map((asset) => asset.storage))} tone="storage" />
        </div>
      </section>

      <section className="cockpit-card cockpit-support-card">
        <div className="cockpit-card-head"><div><span>配套设备</span><h2>显示器绑定</h2></div><DashboardIcon /></div>
        <div className="cockpit-support-total"><strong>{displays.length}</strong><span>台显示器资产</span></div>
        <div className="cockpit-support-line"><span><i className="bound" />已绑定电脑</span><strong>{boundDisplays}</strong></div>
        <div className="cockpit-support-line"><span><i className="unbound" />暂未绑定</span><strong>{unboundDisplays}</strong></div>
        <div className="cockpit-support-progress"><i style={{ width: `${percent(boundDisplays, displays.length)}%` }} /></div>
        <small>绑定率 {percent(boundDisplays, displays.length)}%</small>
      </section>

      <section className="cockpit-card cockpit-location-card">
        <div className="cockpit-card-head"><div><span>资产分布</span><h2>部门与位置</h2></div></div>
        <div className="cockpit-location-columns">
          <Ranking title="归属部门" items={rank(computers.map((asset) => asset.ownershipDepartment), 4)} tone="department" />
          <Ranking title="存放位置" items={rank(computers.map((asset) => asset.location.name), 4)} tone="location" />
        </div>
      </section>

      <section className="cockpit-card cockpit-recent-card">
        <div className="cockpit-card-head"><div><span>动态</span><h2>最近更新的电脑</h2></div><button onClick={() => onViewAssets('all')}>全部电脑</button></div>
        <div className="cockpit-recent-list">{recent.length === 0 ? <div className="cockpit-empty-copy">暂无电脑资产</div> : recent.map((asset) => <button type="button" key={asset.id} onClick={() => onSelect(asset)}>
          <span className="cockpit-device-mark">{asset.name.slice(0, 1).toUpperCase()}</span>
          <span><strong>{asset.name}</strong><small>{asset.assetTag} · {text(asset.model.name)}</small></span>
          <span className="cockpit-device-config">{[asset.cpu, asset.memory, asset.storage].filter(Boolean).join(' · ') || '配置未填写'}</span>
          <time>{formatDate(asset.updatedAt)}</time>
        </button>)}</div>
      </section>
    </div>
    {loading && <div className="cockpit-loading"><span className="spinner" />正在汇总电脑资产…</div>}
  </section>
}
