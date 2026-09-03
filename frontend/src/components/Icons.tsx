import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: Props) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{children}</svg>
}

export const BoxesIcon = (props: Props) => <Icon {...props}><path d="m12 2 8 4.5v9L12 20l-8-4.5v-9L12 2Z"/><path d="m4.3 6.6 7.7 4.5 7.7-4.5M12 11.1V20"/></Icon>
export const PlusIcon = (props: Props) => <Icon {...props}><path d="M12 5v14M5 12h14"/></Icon>
export const SearchIcon = (props: Props) => <Icon {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></Icon>
export const RefreshIcon = (props: Props) => <Icon {...props}><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 9a7 7 0 0 1 11.5-2L20 9M4 15l2.4 2A7 7 0 0 0 18 15"/></Icon>
export const EditIcon = (props: Props) => <Icon {...props}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></Icon>
export const TrashIcon = (props: Props) => <Icon {...props}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/></Icon>
export const CloseIcon = (props: Props) => <Icon {...props}><path d="M18 6 6 18M6 6l12 12"/></Icon>
export const SaveIcon = (props: Props) => <Icon {...props}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></Icon>
export const ChevronIcon = (props: Props) => <Icon {...props}><path d="m9 18 6-6-6-6"/></Icon>
export const UploadIcon = (props: Props) => <Icon {...props}><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></Icon>
export const DownloadIcon = (props: Props) => <Icon {...props}><path d="M12 4v12M7 11l5 5 5-5M5 20h14"/></Icon>
export const MenuIcon = (props: Props) => <Icon {...props}><path d="M4 6h16M4 12h16M4 18h16"/></Icon>
export const DashboardIcon = (props: Props) => <Icon {...props}><path d="M4 13a8 8 0 1 1 8 8v-8Z"/><path d="M12 3v10h10"/></Icon>
export const ReturnIcon = (props: Props) => <Icon {...props}><path d="m9 14-4-4 4-4"/><path d="M5 10h9a5 5 0 0 1 5 5v2"/></Icon>
export const FolderIcon = (props: Props) => <Icon {...props}><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></Icon>
export const LocationIcon = (props: Props) => <Icon {...props}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></Icon>
export const BellIcon = (props: Props) => <Icon {...props}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></Icon>
export const MessageIcon = (props: Props) => <Icon {...props}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/></Icon>
export const CheckIcon = (props: Props) => <Icon {...props}><path d="m5 12 4 4L19 6"/></Icon>
export const UserIcon = (props: Props) => <Icon {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></Icon>
export const UsersIcon = (props: Props) => <Icon {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></Icon>
export const LogoutIcon = (props: Props) => <Icon {...props}><path d="M10 17l5-5-5-5M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></Icon>
export const WrenchIcon = (props: Props) => <Icon {...props}><path d="M14.7 6.3a4 4 0 0 0-5-5L12 3.6 9.6 6 7.3 3.7a4 4 0 0 0 5 5L5 16l3 3 7.3-7.3a4 4 0 0 0 5-5L18 9l-2.4-2.4L18 4.2a4 4 0 0 0-3.3 2.1Z"/></Icon>
export const ArchiveIcon = (props: Props) => <Icon {...props}><path d="M4 7h16v13H4Z"/><path d="M3 3h18v4H3ZM9 11h6"/></Icon>
export const ClipboardIcon = (props: Props) => <Icon {...props}><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 10h6M9 14h6"/></Icon>
export const EyeIcon = (props: Props) => <Icon {...props}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></Icon>
export const FilterIcon = (props: Props) => <Icon {...props}><path d="M4 5h16l-6 7v5l-4 2v-7Z"/></Icon>
export const CloneIcon = (props: Props) => <Icon {...props}><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></Icon>
export const SettingsIcon = (props: Props) => <Icon {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.16.38.38.72.66 1 .3.28.68.42 1.1.42H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z"/></Icon>
