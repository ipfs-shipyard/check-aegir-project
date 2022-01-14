# check-pl-js-project

A CLI tool to ensure conformity between the different types of [PL](https://protocol.ai/) js projects.

## Install

```console
$ npm i check-pl-js-project
```

## Usage

```console
$ check-project (in project dir)
$ check-project /path/to/project/dir
```

Follow the prompts

## Supported project types

### 0. Common

* Unified CI
* Dual MIT/Apache 2 license

### 1. TypeScript

* ESM only
* Source in `/src`
* Tests in `/test`

### 2. Typed ESM

* ESM only
* Source in `/src`
* Tests in `/test`

### 3. Typed CJS

TODO

### 4. Untyped CJS

TODO
