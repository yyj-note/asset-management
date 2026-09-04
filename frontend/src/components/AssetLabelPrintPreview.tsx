import { useEffect, useMemo, useState } from 'react'

export function AssetLabelPrintPreview() {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageUnavailable, setImageUnavailable] = useState(false)
  const request = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    const assetId = Number(params.get('assetId'))
    const assetTag = params.get('assetTag')?.trim() || ''
    return {
      assetId,
      assetTag,
      valid: Number.isSafeInteger(assetId) && assetId > 0,
    }
  }, [])

  useEffect(() => {
    document.title = request.assetTag ? `${request.assetTag} - 标签打印预览` : '标签打印预览'
  }, [request.assetTag])

  if (!request.valid) {
    return <main className="label-print-page"><div className="label-print-error">打印预览地址无效，请返回资产详情页重新打开。</div></main>
  }

  const imageUrl = `/api/assets/${request.assetId}/qr`
  const filename = `asset-${request.assetTag || request.assetId}-label.png`

  return <main className="label-print-page">
    <header className="label-print-toolbar">
      <div><span>标签打印预览</span><strong>{request.assetTag || `资产 ${request.assetId}`}</strong></div>
      <div>
        <a className="button ghost" href={imageUrl} download={filename}>下载 PNG</a>
        <button className="button primary" type="button" disabled={!imageLoaded || imageUnavailable} onClick={() => window.print()}>{imageLoaded ? '打印标签' : '标签加载中…'}</button>
      </div>
    </header>
    <section className="label-print-canvas" aria-label="60×50毫米资产标签打印预览">
      <div className="label-print-sheet">
        {imageUnavailable
          ? <div className="label-print-error">资产标签加载失败，请确认登录状态后重试。</div>
          : <img
              src={imageUrl}
              alt={`${request.assetTag || request.assetId} 资产标签打印预览`}
              onLoad={() => setImageLoaded(true)}
              onError={() => { setImageLoaded(false); setImageUnavailable(true) }}
            />}
      </div>
    </section>
  </main>
}
