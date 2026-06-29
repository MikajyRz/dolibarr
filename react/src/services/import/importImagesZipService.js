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

      const filename = getFileName(entry.name)
      const extension = getFileExtension(filename)

      if (!IMAGE_EXTENSIONS.has(extension)) {
        continue
      }

      const blob = await entry.async('blob')
      const base64 = await entry.async('base64')
      const refEmploye = getRefFromFilename(filename)

      images.push({
        filename,
        ref_employe: refEmploye,
        base64,
        previewUrl: URL.createObjectURL(blob),
        dolibarrPath: `import/employees/${refEmploye}/${filename}`,
      })
    }

    return images.sort((a, b) => {
      return a.ref_employe.localeCompare(b.ref_employe, undefined, { numeric: true })
    })
  },
}
