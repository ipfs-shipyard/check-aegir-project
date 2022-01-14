'use strict'

const merge = require('merge-options').bind({ ignoreUndefined: true })
const { sortFields } = require('../utils')

const manifestFields = {
  private: true,
  scripts: {
    reset: 'lerna run clean && rimraf ./node_modules ./package-lock.json packages/*/node_modules packages/*/package-lock.json packages/*/dist',
    test: 'lerna run --concurrency 1 test -- --',
    'test:node': 'lerna run --concurrency 1 test:node -- --',
    'test:chrome': 'lerna run --concurrency 1 test:chrome -- --',
    'test:chrome-webworker': 'lerna --concurrency 1 run test:chrome-webworker -- --',
    'test:firefox': 'lerna run --concurrency 1 test:firefox -- --',
    'test:firefox-webworker': 'lerna run --concurrency 1 test:firefox-webworker -- --',
    'test:electron-main': 'lerna run --concurrency 1 test:electron-main -- --',
    'test:electron-renderer': 'lerna run --concurrency 1 test:electron-renderer -- --',
    build: 'lerna run build',
    lint: 'lerna run lint',
    'dep-check': 'lerna run dep-check',
    release: 'lerna exec --concurrency 1 -- semantic-release -e semantic-release-monorepo'
  }
}

async function monorepoManifest (projectDir, manifest, branchName, repoUrl, homePage = repoUrl) {
  let proposedManifest = {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    homepage: `${repoUrl}#readme`,
    license: 'Apache-2.0 OR MIT',
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

  proposedManifest.scripts = merge(manifest.scripts, proposedManifest.scripts)

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
  monorepoManifest
}
