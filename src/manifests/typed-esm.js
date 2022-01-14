'use strict'

const { semanticReleaseConfig } = require('../semantic-release-config')
const merge = require('merge-options').bind({ ignoreUndefined: true })
const {
  sortFields,
  constructManifest
} = require('../utils')

async function typedESMManifest (projectDir, manifest, branchName, repoUrl, homePage = repoUrl) {
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
    exports: {
      '.': {
        import: './src/index.js'
      }
    },
    eslintConfig: {
      extends: 'ipfs',
      parserOptions: {
        sourceType: 'module'
      }
    },
    release: semanticReleaseConfig(branchName, 'dist')
  }, repoUrl, homePage)

  proposedManifest.exports = merge(manifest.exports, proposedManifest.exports)
  proposedManifest.eslintConfig = merge(proposedManifest.eslintConfig, manifest.eslintConfig)

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
