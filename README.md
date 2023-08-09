<h1 align="center">wonderdep</h1>

## Features

- Found the nearest package version of a specify dep version

## Install

```bash
npm install -g wonderdep
```

## Usage

### CLI
```bash
wonder <somePackage> --deps <foo@x.x.x>, <bar@x.x.x>
```

> For example: we are in a vite + vue project with vite@2.9.5, if we want to install vite plugin(vite-plugin-xxx) which depend on vite as its devDependency, then maybe we want a proper version of vite-plugin-xxx to suit for the vite version for our project, this time `wonder vite-plugin-xxx --deps vite@2.9.5` helps 
 
## LICENSE
MIT