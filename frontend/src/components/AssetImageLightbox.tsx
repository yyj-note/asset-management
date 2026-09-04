import { useEffect, useState } from 'react'
import type { Asset } from '../types'
import { ChevronIcon, CloseIcon } from './Icons'

interface Props {
  asset: Asset | null
  initialIndex?: number
  onClose: () => void
}

export function AssetImageLightbox({ asset, initialIndex = 0, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex)
  const images = asset?.imageUrls?.length ? asset.imageUrls : asset?.imageUrl ? [asset.imageUrl] : []

  useEffect(() => { setIndex(initialIndex) }, [asset?.id, initialIndex])
  useEffect(() => {
    if (!asset) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') setIndex((current) => (current - 1 + images.length) % images.length)
      if (event.key === 'ArrowRight') setIndex((current) => (current + 1) % images.length)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [asset, images.length, onClose])

  if (!asset || images.length === 0) return null
  return <div className="image-lightbox" role="dialog" aria-modal="true" aria-label={`${asset.name} 图片预览`} onMouseDown={onClose}>
    <div className="image-lightbox-card" onMouseDown={(event) => event.stopPropagation()}>
      <button className="image-lightbox-close" aria-label="关闭图片预览" onClick={onClose}><CloseIcon /></button>
      {images.length > 1 && <button className="image-lightbox-nav previous" aria-label="上一张" onClick={() => setIndex((current) => (current - 1 + images.length) % images.length)}><ChevronIcon /></button>}
      <img src={images[index] || images[0]} alt={`${asset.name}图片${index + 1}`} />
      {images.length > 1 && <button className="image-lightbox-nav next" aria-label="下一张" onClick={() => setIndex((current) => (current + 1) % images.length)}><ChevronIcon /></button>}
      <div className="image-lightbox-meta"><strong>{asset.name}</strong><span>{asset.assetTag} · {index + 1} / {images.length}</span></div>
      {images.length > 1 && <div className="image-lightbox-thumbs">{images.map((source, imageIndex) => <button className={imageIndex === index ? 'active' : ''} onClick={() => setIndex(imageIndex)} key={`${source.slice(-24)}-${imageIndex}`}><img src={source} alt={`切换到第${imageIndex + 1}张图片`} /></button>)}</div>}
    </div>
  </div>
}
