import { useEffect } from 'react'
import type { Asset } from '../types'
import { CloseIcon } from './Icons'

interface Props {
  asset: Asset | null
  onClose: () => void
}

export function AssetImageLightbox({ asset, onClose }: Props) {
  useEffect(() => {
    if (!asset) return
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [asset, onClose])

  if (!asset?.imageUrl) return null
  return <div className="image-lightbox" role="dialog" aria-modal="true" aria-label={`${asset.name} 图片预览`} onMouseDown={onClose}>
    <div className="image-lightbox-card" onMouseDown={(event) => event.stopPropagation()}>
      <button className="image-lightbox-close" aria-label="关闭图片预览" onClick={onClose}><CloseIcon /></button>
      <img src={asset.imageUrl} alt={asset.name} />
      <div><strong>{asset.name}</strong><span>{asset.assetTag}</span></div>
    </div>
  </div>
}
