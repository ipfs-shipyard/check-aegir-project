'use strict'

const { semanticReleaseConfig } = require('../semantic-release-config')
const merge = require('merge-options').bind({ ignoreUndefined: true })
const {
  sortFields,
  constructManifest
} = require('../utils')

async function untypedCJSManifest (manifest, branchName, repoUrl, homePage = repoUrl) {
  let proposedManifest = constructManifest(manifest, {
    main: 'src/index.js',
    files: [
      'src',
      'dist'
    ],
    eslintConfig: merge({
      extends: 'ipfs'
    }, manifest.eslintConfig),
    release: semanticReleaseConfig(branchName)
  }, repoUrl, homePage)

  const rest = {
    ...sortFields(manifest)
  }

  for (const key of Object.keys(proposedManifest)) {
    delete rest[key]
  }

  proposedManifest = {
    ...proposedManifest,
    ...rest,
    contributors: undefined,
    leadMaintainer: undefined
  }

  return proposedManifest
}

module.exports = {
  untypedCJSManifest
}
