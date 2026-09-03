import type { AssetFilter } from '../types'
import { ClipboardIcon, DashboardIcon, SettingsIcon, UsersIcon } from './Icons'

export type AppSection = 'assets' | 'users' | 'logs' | 'settings'

interface Props {
  section: AppSection
  canManageUsers: boolean
  onFilter: (filter: AssetFilter) => void
  onSection: (section: AppSection) => void
}

export function Sidebar({ section, canManageUsers, onFilter, onSection }: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <strong>资产中心</strong>
      </div>
      <nav>
        <button aria-label="资产" className={`nav-item ${section === 'assets' ? 'active' : ''}`} onClick={() => { onSection('assets'); onFilter('all') }}>
          <DashboardIcon /><span>资产</span>
        </button>
        {canManageUsers && <button aria-label="用户" className={`nav-item ${section === 'users' ? 'active' : ''}`} onClick={() => onSection('users')}>
          <UsersIcon /><span>用户</span>
        </button>}
        {canManageUsers && <button aria-label="日志" className={`nav-item ${section === 'logs' ? 'active' : ''}`} onClick={() => onSection('logs')}>
          <ClipboardIcon /><span>日志</span>
        </button>}
        {canManageUsers && <button aria-label="设置" className={`nav-item ${section === 'settings' ? 'active' : ''}`} onClick={() => onSection('settings')}>
          <SettingsIcon /><span>设置</span>
        </button>}
      </nav>
    </aside>
  )
}
