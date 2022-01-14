'use strict'

/* eslint-disable no-console */

const { semanticReleaseConfig } = require('../semantic-release-config')
const merge = require('merge-options').bind({ ignoreUndefined: true })
const {
  sortFields,
  constructManifest
} = require('../utils')

async function typescriptManifest (projectDir, manifest, branchName, repoUrl, homePage = repoUrl) {
  let proposedManifest = constructManifest(manifest, {
    type: 'module',
    types: './dist/src/index.d.ts',
    typesVersions: undefined,
    files: [
      'src',
      'dist/src',
      '!dist/test',
      '!**/*.tsbuildinfo'
    ],
    exports: merge({
      '.': {
        import: './dist/src/index.js'
      }
    }, proposedManifest.exports),
    eslintConfig: merge({
      extends: 'ipfs',
      parserOptions: {
        sourceType: 'module'
      }
    }, manifest.eslintConfig),
    release: semanticReleaseConfig(branchName)
  }, repoUrl, homePage)

  if (Object.keys(proposedManifest.exports).length > 1) {
    console.info('Multiple exports detected')

    proposedManifest.typesVersions = {
      '*': {
        '*': [
          '*',
          '*/index',
          'dist/*',
          'dist/*/index',
          'dist/src/*',
          'dist/src/*/index'
        ]
      }
    }
  }

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
  typescriptManifest
}
