'use strict'

const { semanticReleaseConfig } = require('../semantic-release-config')
const merge = require('merge-options').bind({ ignoreUndefined: true })

const manifestFields = {
  main: 'src/index.js',
  files: [
    'src',
    'dist'
  ],
  eslintConfig: {
    extends: 'ipfs'
  },
  release: {},
  scripts: {
    lint: 'aegir lint',
    'dep-check': 'aegir dep-check',
    build: 'aegir build',
    test: 'aegir test',
    'test:chrome': 'npm run test -- -t browser --cov',
    'test:chrome-webworker': 'npm run test -- -t webworker',
    'test:firefox': 'npm run test -- -t browser -- --browser firefox',
    'test:firefox-webworker': 'npm run test -- -t webworker -- --browser firefox',
    'test:node': 'npm run test -- -t node --cov',
    'test:electron-main': 'npm run test -- -t electron-main',
    release: 'semantic-release'
  }
}

async function untypedCJSManifest (projectDir, manifest, branchName, repoUrl, homePage = repoUrl) {
  let proposedManifest = {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    homepage: `${homePage}#readme`,
    license: 'Apache-2.0 OR MIT',
    repository: {
      type: 'git',
      url: `git+${repoUrl}.git`
    },
    bugs: {
      url: `${repoUrl}/issues`
    },
    ...manifestFields
  }

  proposedManifest.release = semanticReleaseConfig(branchName, 'dist')
  proposedManifest.eslintConfig = merge(manifest.eslintConfig, proposedManifest.eslintConfig)
  proposedManifest.scripts = merge(manifest.scripts, proposedManifest.scripts)

  const rest = {
    ...manifest
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
