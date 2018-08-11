const fs = require('fs')
const path = require('path')

const readDirDeep = require('read-dir-deep')

function massFileRenamer ({dir = '.', ignore = [], renamer = (_, oldName) => oldName} = {}) {
  const dirName = path.join(process.cwd(), dir)
  return readDirDeep(dirName).then((files) => {
    const filteredFiles = files.filter(file => !ignore.includes(file))
    return filteredFiles.forEach(file => {
      const oldName = path.basename(file)
      const dir = path.dirname(file)
      const newName = renamer(dir, oldName)
      const oldPath = path.join(dirName, file)
      const newPath = path.join(dirName, dir, newName)
      fs.renameSync(oldPath, newPath)
    })
  })
}

module.exports = massFileRenamer
