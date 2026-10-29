/**
 * 上传前把图片缩小：最长边不超过 maxSize 像素，转成 JPG。
 *
 * 只在 H5 处理：手机拍的照片动辄 3~5MB，后端限制头像不超过 2MB，头像也用不着那么大。
 * 小程序里 chooseAvatar / chooseImage 拿到的图已经压缩过，原样返回。
 * 压缩失败也原样返回，交给后端去判断大小和格式。
 */
export function shrinkImage(path: string, maxSize = 640): Promise<string> {
  let result = Promise.resolve(path)
  // #ifdef H5
  result = shrinkInBrowser(path, maxSize).catch(() => path)
  // #endif
  return result
}

// #ifdef H5
function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function shrinkInBrowser(path: string, maxSize: number) {
  const img = await loadImage(path)
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight))
  const width = Math.round(img.naturalWidth * scale)
  const height = Math.round(img.naturalHeight * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return path
  // PNG 透明的地方转成 JPG 会变黑，先铺一层白底
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
  // uni.uploadFile 在 H5 上支持 blob: 地址（uni.chooseImage 返回的也是这种地址）
  return blob ? URL.createObjectURL(blob) : path
}
// #endif
