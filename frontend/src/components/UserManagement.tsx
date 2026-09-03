import { useEffect, useState } from 'react'
import { api } from '../api'
import type { CreateUserPayload, ManagedUser, UpdateUserPayload } from '../types'
import { CheckIcon, CloseIcon, PlusIcon, TrashIcon, UserIcon } from './Icons'
import { ConfirmDialog } from './ConfirmDialog'

const permissionLabels = ['查看资产', '新增资产', '编辑资产', '归还资产', '删除资产']

type Draft = { id?: number; username: string; password: string }
const freshDraft = (): Draft => ({ username: '', password: '' })

interface Props { avatarRevision: number; onNotify: (text: string, kind?: 'ok' | 'error') => void }

export function UserManagement({ avatarRevision, onNotify }: Props) {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [passwordEditor, setPasswordEditor] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null)
  const [avatarDeleteTarget, setAvatarDeleteTarget] = useState<ManagedUser | null>(null)
  const [avatarDeletingId, setAvatarDeletingId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try { setUsers(await api.listUsers()) }
    catch (error) { onNotify(error instanceof Error ? error.message : '读取用户失败', 'error') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [avatarRevision])

  const openEdit = (user: ManagedUser) => {
    if (user.role === 'SUPER_ADMIN') return
    setDraft({ id: user.id, username: user.username, password: '' })
  }
  const openPasswordEditor = () => {
    setDraft(null)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordEditor(true)
  }
  const changeMyPassword = async () => {
    if (!currentPassword) { onNotify('请输入当前密码', 'error'); return }
    if (newPassword.length < 8) { onNotify('新密码至少需要8位', 'error'); return }
    if (newPassword !== confirmPassword) { onNotify('两次输入的新密码不一致', 'error'); return }
    setChangingPassword(true)
    try {
      await api.changeMyPassword(currentPassword, newPassword)
      setPasswordEditor(false)
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      onNotify('超级管理员密码已更新，下次登录请使用新密码')
      await load()
    } catch (error) { onNotify(error instanceof Error ? error.message : '修改密码失败', 'error') }
    finally { setChangingPassword(false) }
  }
  const save = async () => {
    if (!draft) return
    if (!draft.username.trim() || draft.password.length < 8) {
      onNotify('请填写登录账号和至少8位密码', 'error'); return
    }
    setSaving(true)
    try {
      if (draft.id) {
        const payload: UpdateUserPayload = { password: draft.password }
        await api.updateUser(draft.id, payload)
        onNotify('普通用户密码已重置')
      } else {
        const payload: CreateUserPayload = { username: draft.username, password: draft.password }
        await api.createUser(payload)
        onNotify('普通用户已创建')
      }
      setDraft(null); await load()
    } catch (error) { onNotify(error instanceof Error ? error.message : '保存用户失败', 'error') }
    finally { setSaving(false) }
  }

  const deleteUser = async (user: ManagedUser) => {
    if (user.role === 'SUPER_ADMIN') return
    setDeletingId(user.id)
    try {
      await api.deleteUser(user.id)
      onNotify(`用户“${user.username}”已删除`)
      setDeleteTarget(null)
      await load()
    } catch (error) { onNotify(error instanceof Error ? error.message : '删除用户失败', 'error') }
    finally { setDeletingId(null) }
  }

  const clearAvatar = async (user: ManagedUser) => {
    if (user.role === 'SUPER_ADMIN') return
    setAvatarDeletingId(user.id)
    try {
      await api.deleteUserAvatar(user.id)
      onNotify(`用户“${user.username}”的头像已清除`)
      setAvatarDeleteTarget(null)
      await load()
    } catch (error) { onNotify(error instanceof Error ? error.message : '清除头像失败', 'error') }
    finally { setAvatarDeletingId(null) }
  }

  return <div className="user-page">
    <section className="user-panel">
      <div className="user-panel-head"><div><h2>账号列表</h2><span>{users.length} 个账号</span></div><button className="button primary user-create" onClick={() => setDraft(freshDraft())}><PlusIcon />创建普通用户</button></div>
      {loading ? <div className="user-loading"><span className="spinner" />正在读取用户…</div> : <div className="user-list">
        {users.map((user) => <article key={user.id} className={`user-row ${!user.enabled ? 'disabled' : ''}`}>
          <div className="user-avatar">{user.hasAvatar ? <img src={`/api/users/${user.id}/avatar?v=${avatarRevision}-${encodeURIComponent(user.updatedAt)}`} alt={`${user.username}的头像`} /> : <UserIcon />}</div><div className="user-identity"><div><strong>{user.username}</strong><span className={user.role === 'SUPER_ADMIN' ? 'role super' : 'role'}>{user.role === 'SUPER_ADMIN' ? '超级管理员' : '普通用户'}</span>{!user.enabled && <span className="role off">已停用</span>}</div></div>
          <div className="user-updated"><span>最近更新</span><strong>{new Date(user.updatedAt).toLocaleString('zh-CN', { hour12: false })}</strong></div>
          <div className="user-actions">{user.role === 'SUPER_ADMIN'
            ? <button className="button ghost self-password-button" onClick={openPasswordEditor}>修改我的密码</button>
            : <>{user.hasAvatar && <button className="button ghost avatar-clear-button" disabled={avatarDeletingId === user.id} onClick={() => setAvatarDeleteTarget(user)}>{avatarDeletingId === user.id ? '清除中…' : '清除头像'}</button>}<button className="button ghost" onClick={() => openEdit(user)}>重置密码</button><button className="button user-delete-button" disabled={deletingId === user.id} onClick={() => setDeleteTarget(user)}><TrashIcon />{deletingId === user.id ? '删除中…' : '删除用户'}</button></>}
          </div>
        </article>)}
      </div>}
    </section>
    {draft && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setDraft(null)}><div className="user-editor">
      <button className="icon-button modal-close" onClick={() => setDraft(null)}><CloseIcon /></button><span className="eyebrow">{draft.id ? 'RESET PASSWORD' : 'NEW USER'}</span><h2>{draft.id ? '重置普通用户密码' : '创建普通用户'}</h2><p>{draft.id ? '超级管理员可以为该普通用户设置一个新的登录密码。' : '填写姓名拼音作为登录账号，再设置登录密码即可。'}</p>
      {draft.id ? <div className="reset-account"><div className="user-avatar"><UserIcon /></div><div><strong>{draft.username}</strong></div></div> : <div className="user-form-grid single-field"><label><span>登录账号（姓名拼音）</span><input autoFocus value={draft.username} onChange={(event) => setDraft({ ...draft, username: event.target.value })} placeholder="例如 zhangsan" /></label></div>}
      <div className="user-form-grid password-grid"><label className="full"><span>{draft.id ? '新登录密码' : '登录密码'}</span><input type="password" value={draft.password} onChange={(event) => setDraft({ ...draft, password: event.target.value })} placeholder="至少8位" /></label></div>
      {!draft.id && <div className="all-permissions"><CheckIcon /><div><strong>全部资产权限已包含</strong><span>{permissionLabels.join(' · ')}</span></div></div>}
      <div className="modal-actions"><button className="button ghost" onClick={() => setDraft(null)}>取消</button><button className="button primary" disabled={saving} onClick={() => void save()}>{saving ? '保存中…' : draft.id ? '确认重置' : '创建用户'}</button></div>
    </div></div>}
    {passwordEditor && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setPasswordEditor(false)}><div className="user-editor password-editor">
      <button className="icon-button modal-close" onClick={() => setPasswordEditor(false)}><CloseIcon /></button><span className="eyebrow">SECURITY</span><h2>修改我的密码</h2><p>修改的是数据库中现有超级管理员的登录密码，不需要重新构建镜像，也不会影响资产数据。</p>
      <div className="user-form-grid password-grid"><label className="full"><span>当前密码</span><input autoFocus autoComplete="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="请输入目前正在使用的密码" /></label><label className="full"><span>新密码</span><input autoComplete="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="8–80位，请勿与当前密码相同" /></label><label className="full"><span>再次输入新密码</span><input autoComplete="new-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="再次输入新密码" /></label></div>
      <div className="password-safety-note"><CheckIcon /><span>密码将使用 BCrypt 加密保存，页面和数据库都不会保存明文。</span></div>
      <div className="modal-actions"><button className="button ghost" onClick={() => setPasswordEditor(false)}>取消</button><button className="button primary" disabled={changingPassword} onClick={() => void changeMyPassword()}>{changingPassword ? '修改中…' : '确认修改'}</button></div>
    </div></div>}
    {deleteTarget && <ConfirmDialog
      title="删除普通用户"
      description={`确认删除“${deleteTarget.username}”吗？删除后该账号将立即无法登录，但不会删除该用户过去操作过的资产资料。`}
      busy={deletingId === deleteTarget.id}
      onCancel={() => deletingId == null && setDeleteTarget(null)}
      onConfirm={() => void deleteUser(deleteTarget)}
    />}
    {avatarDeleteTarget && <ConfirmDialog
      title="清除用户头像"
      description={`确认清除“${avatarDeleteTarget.username}”的头像吗？账号和其他资料不会受影响，该用户之后仍可重新上传头像。`}
      busy={avatarDeletingId === avatarDeleteTarget.id}
      onCancel={() => avatarDeletingId == null && setAvatarDeleteTarget(null)}
      onConfirm={() => void clearAvatar(avatarDeleteTarget)}
    />}
  </div>
}
