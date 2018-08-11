const massFileRenamer = require('mass-file-renamer')

massFileRenamer({
  dir: 'test-files',
  ignore: ['.DS_Store'],
  renamer: (dirname = '', oldName = '') => {
    const newName = `foo-${oldName.toUpperCase()}`
    console.log(dirname, oldName, newName)
    return newName // Return new name for file
  }
})
  .then(() => {
    console.log('Done')
  })
  .catch(console.error)
