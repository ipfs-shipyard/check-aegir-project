'use strict'

/* eslint-disable no-console */

const { semanticReleaseConfig } = require('../semantic-release-config')
const merge = require('merge-options').bind({ ignoreUndefined: true })
const { sortFields } = require('../utils')

const manifestFields = {
  type: 'module',
  types: './dist/src/index.d.ts',
  typesVersions: undefined,
  files: [
    'src',
    'dist/src',
    '!dist/test',
    '!**/*.tsbuildinfo'
  ],
  exports: {
    '.': {
      import: './dist/src/index.js'
    }
  },
  eslintConfig: {
    extends: 'ipfs',
    parserOptions: {
      sourceType: 'module'
    }
  },
  release: {},
  scripts: {
    lint: 'aegir lint',
    'dep-check': 'aegir dep-check dist/src/**/*.js dist/test/**/*.js',
    build: 'tsc',
    pretest: 'npm run build',
    test: 'aegir test -f ./dist/test',
    'test:chrome': 'npm run test -- -t browser --cov',
    'test:chrome-webworker': 'npm run test -- -t webworker',
    'test:firefox': 'npm run test -- -t browser -- --browser firefox',
    'test:firefox-webworker': 'npm run test -- -t webworker -- --browser firefox',
    'test:node': 'npm run test -- -t node --cov',
    'test:electron-main': 'npm run test -- -t electron-main',
    release: 'semantic-release'
  }
}

async function typescriptManifest (projectDir, manifest, branchName, repoUrl, homePage = repoUrl) {
  let proposedManifest = {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    license: 'Apache-2.0 OR MIT',
    author: manifest.author,
    homepage: `${homePage}#readme`,
    repository: {
      type: 'git',
      url: `git+${repoUrl}.git`
    },
    bugs: {
      url: `${repoUrl}/issues`
    },
    ...manifestFields,
    dependencies: manifest.dependencies,
    devDependencies: manifest.devDependencies,
    peerDependencies: manifest.peerDependencies,
    peerDependenciesMeta: manifest.peerDependenciesMeta,
    optionalDependencies: manifest.optionalDependencies,
    bundledDependencies: manifest.bundledDependencies
  }

  proposedManifest.release = semanticReleaseConfig(branchName)
  proposedManifest.exports = merge(manifest.exports, proposedManifest.exports)
  proposedManifest.eslintConfig = merge(proposedManifest.eslintConfig, manifest.eslintConfig)
  proposedManifest.scripts = merge(proposedManifest.scripts, manifest.scripts)

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
