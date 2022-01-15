'use strict'

const { semanticReleaseConfig } = require('../semantic-release-config')
const merge = require('merge-options').bind({ ignoreUndefined: true })
const {
  sortFields,
  constructManifest
} = require('../utils')

async function typedESMManifest (manifest, branchName, repoUrl, homePage = repoUrl) {
  let proposedManifest = constructManifest(manifest, {
    main: 'src/index.js',
    type: 'module',
    types: 'types/src/index.d.ts',
    typesVersions: {
      '*': {
        '*': [
          'types/*',
          'types/src/*'
        ],
        'types/*': [
          'types/*',
          'types/src/*'
        ]
      }
    },
    files: [
      '*',
      '!**/*.tsbuildinfo'
    ],
    exports: merge({
      '.': {
        import: './src/index.js'
      }
    }, manifest.exports),
    eslintConfig: merge({
      extends: 'ipfs',
      parserOptions: {
        sourceType: 'module'
      }
    }, manifest.eslintConfig),
    release: semanticReleaseConfig(branchName, 'dist')
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
  typedESMManifest
}
