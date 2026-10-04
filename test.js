const fs = require('fs')
const os = require('os')
const path = require('path')
const massFileRenamer = require('./')

let originalCwd
let sandbox
let cwd

function mkdir (dir) {
  if (!fs.existsSync(dir)) {
    mkdir(path.dirname(dir))
    fs.mkdirSync(dir)
  }
}

function write (root, file, content = file) {
  const filename = path.join(root, file)
  mkdir(path.dirname(filename))
  fs.writeFileSync(filename, content)
}

function read (root, file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

function remove (dir) {
  fs.readdirSync(dir).forEach(name => {
    const filename = path.join(dir, name)
    if (fs.lstatSync(filename).isDirectory()) {
      remove(filename)
    } else {
      fs.unlinkSync(filename)
    }
  })
  fs.rmdirSync(dir)
}

function rename (_, name) {
  return 'renamed-' + name
}

beforeEach(() => {
  originalCwd = process.cwd()
  sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'mass-file-renamer-'))
  cwd = path.join(sandbox, 'work')
  fs.mkdirSync(cwd)
  process.chdir(cwd)
})

afterEach(() => {
  process.chdir(originalCwd)
  remove(sandbox)
})

test('should export function', () => {
  expect(typeof massFileRenamer).toBe('function')
})

test('renames files recursively relative to the working directory', () => {
  const root = path.join(cwd, 'input')
  write(root, 'top.txt')
  write(root, path.join('nested', 'child.txt'))
  return massFileRenamer({dir: 'input', renamer: rename}).then(result => {
    expect(result).toBeUndefined()
    expect(read(root, 'renamed-top.txt')).toBe('top.txt')
    expect(read(root, path.join('nested', 'renamed-child.txt'))).toBe(path.join('nested', 'child.txt'))
    expect(fs.existsSync(path.join(root, 'top.txt'))).toBe(false)
    expect(fs.existsSync(path.join(root, 'nested', 'child.txt'))).toBe(false)
  })
})

test('uses an absolute root outside the working directory', () => {
  const root = path.join(sandbox, 'input')
  write(root, 'top.txt')
  write(root, path.join('nested', 'child.txt'))
  return massFileRenamer({dir: root, renamer: rename}).then(() => {
    expect(read(root, 'renamed-top.txt')).toBe('top.txt')
    expect(read(root, path.join('nested', 'renamed-child.txt'))).toBe(path.join('nested', 'child.txt'))
    expect(fs.readdirSync(cwd)).toEqual([])
  })
})

test('does not rename a mirrored absolute path under the working directory', () => {
  // On Windows a second drive letter is not a valid directory component.
  if (path.sep !== '/') return
  const root = path.join(sandbox, 'input')
  const mirror = path.join(cwd, root)
  write(root, 'top.txt', 'selected')
  write(root, path.join('nested', 'child.txt'), 'selected child')
  write(mirror, 'top.txt', 'unrelated')
  write(mirror, path.join('nested', 'child.txt'), 'unrelated child')
  return massFileRenamer({dir: root, renamer: rename}).then(() => {
    expect(read(root, 'renamed-top.txt')).toBe('selected')
    expect(read(root, path.join('nested', 'renamed-child.txt'))).toBe('selected child')
    expect(read(mirror, 'top.txt')).toBe('unrelated')
    expect(read(mirror, path.join('nested', 'child.txt'))).toBe('unrelated child')
    expect(fs.readdirSync(mirror).sort()).toEqual(['nested', 'top.txt'])
    expect(fs.readdirSync(path.join(mirror, 'nested'))).toEqual(['child.txt'])
  })
})

test('uses an absolute root inside the working directory', () => {
  const root = path.join(cwd, 'input')
  write(root, 'file.txt')
  return massFileRenamer({dir: root, renamer: rename}).then(() => {
    expect(read(root, 'renamed-file.txt')).toBe('file.txt')
  })
})

test('resolves parent directory references and dot segments', () => {
  const root = path.join(sandbox, 'input')
  write(root, 'file.txt')
  return massFileRenamer({dir: path.join('..', 'unused', '..', 'input', '.'), renamer: rename}).then(() => {
    expect(read(root, 'renamed-file.txt')).toBe('file.txt')
  })
})

test('supports spaces and Unicode in absolute directory names', () => {
  const root = path.join(sandbox, 'my files é')
  write(root, 'file é.txt')
  return massFileRenamer({dir: root, renamer: rename}).then(() => {
    expect(read(root, 'renamed-file é.txt')).toBe('file é.txt')
  })
})

test('defaults to the working directory when dir is omitted', () => {
  write(cwd, 'file.txt')
  return massFileRenamer({renamer: rename}).then(() => {
    expect(read(cwd, 'renamed-file.txt')).toBe('file.txt')
  })
})

test('preserves files when all options are omitted', () => {
  write(cwd, 'file.txt')
  write(cwd, path.join('nested', 'child.txt'))
  return massFileRenamer().then(result => {
    expect(result).toBeUndefined()
    expect(read(cwd, 'file.txt')).toBe('file.txt')
    expect(read(cwd, path.join('nested', 'child.txt'))).toBe(path.join('nested', 'child.txt'))
  })
})

test('preserves exact root-relative ignores and callback arguments', () => {
  const root = path.join(sandbox, 'input')
  const ignored = path.join('nested', 'skip.txt')
  write(root, '.hidden')
  write(root, 'skip.txt')
  write(root, path.join('nested', 'child.txt'))
  write(root, ignored)
  const calls = []
  return massFileRenamer({
    dir: root,
    ignore: [ignored],
    renamer: (dir, name) => {
      calls.push([dir, name])
      return rename(dir, name)
    }
  }).then(() => {
    expect(calls).toEqual([['.', '.hidden'], ['nested', 'child.txt'], ['.', 'skip.txt']])
    expect(read(root, 'renamed-.hidden')).toBe('.hidden')
    expect(read(root, 'renamed-skip.txt')).toBe('skip.txt')
    expect(read(root, path.join('nested', 'renamed-child.txt'))).toBe(path.join('nested', 'child.txt'))
    expect(read(root, ignored)).toBe(ignored)
  })
})

test('resolves successfully for an empty absolute directory', () => {
  const root = path.join(sandbox, 'empty')
  fs.mkdirSync(root)
  return massFileRenamer({dir: root, renamer: () => { throw new Error('no files') }}).then(result => {
    expect(result).toBeUndefined()
    expect(fs.readdirSync(root)).toEqual([])
  })
})

test('rejects a missing absolute root without touching a mirrored directory', () => {
  const root = path.join(sandbox, 'missing')
  const mirror = path.sep === '/' ? path.join(cwd, root) : path.join(cwd, 'unrelated')
  write(mirror, 'file.txt')
  return expect(massFileRenamer({dir: root, renamer: rename})).rejects.toMatchObject({code: 'ENOENT'}).then(() => {
    expect(read(mirror, 'file.txt')).toBe('file.txt')
    expect(fs.readdirSync(mirror)).toEqual(['file.txt'])
    expect(fs.existsSync(root)).toBe(false)
  })
})

test('rejects a missing relative directory', () => {
  return expect(massFileRenamer({dir: 'missing'})).rejects.toMatchObject({code: 'ENOENT'})
})

test('rejects a file used as the root', () => {
  write(cwd, 'file.txt')
  return expect(massFileRenamer({dir: path.join(cwd, 'file.txt')})).rejects.toMatchObject({code: 'ENOTDIR'}).then(() => {
    expect(read(cwd, 'file.txt')).toBe('file.txt')
  })
})

test('propagates a renamer error without renaming the failing file', () => {
  write(cwd, 'file.txt')
  const error = new Error('renamer failed')
  return expect(massFileRenamer({renamer: () => { throw error }})).rejects.toBe(error).then(() => {
    expect(read(cwd, 'file.txt')).toBe('file.txt')
  })
})

test('propagates a filesystem rename error', () => {
  write(cwd, 'file.txt')
  return expect(massFileRenamer({renamer: () => path.join('missing', 'file.txt')})).rejects.toMatchObject({code: 'ENOENT'}).then(() => {
    expect(read(cwd, 'file.txt')).toBe('file.txt')
  })
})

test('supports repeated invocations on the selected root', () => {
  const root = path.join(sandbox, 'input')
  write(root, 'file.txt')
  return massFileRenamer({dir: root, renamer: rename})
    .then(() => massFileRenamer({dir: root, renamer: (_, name) => name.replace('renamed-', '')}))
    .then(() => {
      expect(read(root, 'file.txt')).toBe('file.txt')
      expect(fs.readdirSync(root)).toEqual(['file.txt'])
    })
})

test('captures the working directory before asynchronous traversal begins', () => {
  write(cwd, 'file.txt')
  const other = path.join(sandbox, 'other')
  write(other, 'file.txt', 'unrelated')
  const pending = massFileRenamer({renamer: rename})
  process.chdir(other)
  return pending.then(() => {
    expect(read(cwd, 'renamed-file.txt')).toBe('file.txt')
    expect(read(other, 'file.txt')).toBe('unrelated')
  })
})
