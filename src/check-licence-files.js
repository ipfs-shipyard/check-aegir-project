'use strict'

/* eslint-disable no-console */

const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const {
  ensureFileHasContents
} = require('./utils')

async function checkLicenseFiles (projectDir) {
  const pkg = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), {
    encoding: 'utf-8'
  }))

  if (pkg.license !== 'Apache-2.0 OR MIT') {
    throw new Error(`Incorrect license field - found '${pkg.license}', expected 'Apache-2.0 OR MIT'`)
  }

  console.info(chalk.green('Manifest license field ok'))
  await ensureFileHasContents(projectDir, 'LICENSE')
  await ensureFileHasContents(projectDir, 'LICENSE-APACHE')
  await ensureFileHasContents(projectDir, 'LICENSE-MIT')
}

module.exports = {
  checkLicenseFiles
}
