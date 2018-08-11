
# mass-file-renamer
[![package version](https://img.shields.io/npm/v/mass-file-renamer.svg?style=flat-square)](https://npmjs.org/package/mass-file-renamer)
[![package downloads](https://img.shields.io/npm/dm/mass-file-renamer.svg?style=flat-square)](https://npmjs.org/package/mass-file-renamer)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![package license](https://img.shields.io/npm/l/mass-file-renamer.svg?style=flat-square)](https://npmjs.org/package/mass-file-renamer)
[![make a pull request](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

> Rename files in directory recursively

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Contribute](#contribute)
- [License](#License)

## Install

This project uses [node](https://nodejs.org) and [npm](https://www.npmjs.com). 

```sh
$ npm install mass-file-renamer
$ # OR
$ yarn add mass-file-renamer
```

## Usage

```js
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

```

## Contribute

1. Fork it and create your feature branch: git checkout -b my-new-feature
2. Commit your changes: git commit -am 'Add some feature'
3. Push to the branch: git push origin my-new-feature 
4. Submit a pull request

## License

MIT
    