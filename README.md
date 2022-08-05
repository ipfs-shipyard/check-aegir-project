# ⛔️ ARCHIVED: this has been added to aegir itself

# check-aegir-project

A CLI tool to ensure conformity between the different types of [aegir](https://www.npmjs.com/package/aegir) js projects.

## Install

```console
$ npm i check-aegir-project
```

## Usage

```console
$ check-aegir-project (in project dir)
$ check-aegir-project /path/to/project/dir
```

Follow the prompts.  Alternatively can be run in CI without prompts.

## Supported project types

### 0. Common

* Unified CI
* Dual MIT/Apache 2 license
* No travis config
* Dependabot
* Package JSON organised as:
  * Project metadata
  * Build info
  * Scripts
  * Dependencies
  * Everything else alphabetically

### 1. TypeScript

* ESM only
* Source in `/src`
* Tests in `/test`

### 2. Typed ESM

* ESM only
* Source in `/src`
* Tests in `/test`

### 3. Typed CJS

* Source in `/src`
* Tests in `/test`

### 4. Untyped CJS

* Source in `/src`
* Tests in `/test`
