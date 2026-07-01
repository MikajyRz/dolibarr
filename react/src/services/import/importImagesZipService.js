import JSZip from 'jszip'

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp'])

function getFileName(path) {
  return path.split('/').pop()
}

function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase()
}

function getRefFromFilename(filename) {
  const nameWithoutExtension = filename.replace(/\.[^/.]+$/, '').trim()
  const numberMatch = nameWithoutExtension.match(/\d+/)

  return numberMatch ? numberMatch[0] : nameWithoutExtension
}

async function createBitmap(blob) {
  if (window.createImageBitmap) {
    return window.createImageBitmap(blob)
  }

  return new Promise((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(blob)

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Impossible de lire l'image."))
    }

    image.src = url
  })
}

function drawCover(context, image, width, height) {
  const sourceWidth = image.width
  const sourceHeight = image.height
  const sourceRatio = sourceWidth / sourceHeight
  const targetRatio = width / height
  let cropWidth = sourceWidth
  let cropHeight = sourceHeight
  let cropX = 0
  let cropY = 0

  if (sourceRatio > targetRatio) {
    cropWidth = sourceHeight * targetRatio
    cropX = (sourceWidth - cropWidth) / 2
  } else {
    cropHeight = sourceWidth / targetRatio
    cropY = (sourceHeight - cropHeight) / 2
  }

  context.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, width, height)
}

async function toJpegBase64(blob, width, height) {
  const image = await createBitmap(blob)
  const canvas = document.createElement('canvas')
  const targetWidth = width || image.width
  const targetHeight = height || image.height
  const context = canvas.getContext('2d')

  canvas.width = targetWidth
  canvas.height = targetHeight
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, targetWidth, targetHeight)
  drawCover(context, image, targetWidth, targetHeight)

  if (image.close) {
    image.close()
  }

  return canvas.toDataURL('image/jpeg', 0.9).replace(/^data:image\/jpeg;base64,/, '')
}

async function buildDolibarrPhotoFiles(blob) {
  const [photo, small, mini] = await Promise.all([
    toJpegBase64(blob),
    toJpegBase64(blob, 480, 270),
    toJpegBase64(blob, 128, 72),
  ])

  return [
    {
      filename: 'photo.jpg',
      subdir: 'photos',
      base64: photo,
    },
    {
      filename: 'photo_small.jpg',
      subdir: 'photos/thumbs',
      base64: small,
    },
    {
      filename: 'photo_mini.jpg',
      subdir: 'photos/thumbs',
      base64: mini,
    },
  ]
}

export const ImportImagesZipService = {
  read: async (file) => {
    if (!file) {
      return []
    }

    const zip = await JSZip.loadAsync(file)
    const images = []

    for (const entry of Object.values(zip.files)) {
      if (entry.dir) {
        continue
      }

      const originalFilename = getFileName(entry.name)
      const extension = getFileExtension(originalFilename)

      if (!IMAGE_EXTENSIONS.has(extension)) {
        continue
      }

      const blob = await entry.async('blob')
      const refEmploye = getRefFromFilename(originalFilename)

      images.push({
        filename: 'photo.jpg',
        originalFilename,
        ref_employe: refEmploye,
        previewUrl: URL.createObjectURL(blob),
        files: await buildDolibarrPhotoFiles(blob),
      })
    }

    return images.sort((a, b) => {
      return a.ref_employe.localeCompare(b.ref_employe, undefined, { numeric: true })
    })
  },
}
