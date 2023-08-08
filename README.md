<h1 align="center">wonderdep</h1>

## Features

- Found the nearest package version of a specify dep version

## Install

```bash
npm install -g wonderdep
```

## Usage

### Programmatic
```js
import { resolvePkg } from 'wonderdep'

const result = await resolvePkg('somePackage', ['foo@x.x.x', 'bar@x.x.x'])
```

### CLI
```bash
wonder <somePackage> --deps <foo@x.x.x>, <bar@x.x.x>
```

> For example: wonder foo --deps bar@1.2.3 would find the available `foo` package which could depend on bar@1.2.3 with a semantic version
 
## LICENSE
MIT