'use strict'

const semanticReleaseConfig = (branchName, alternativePkgRoot) => {
  return {
    branches: [
      branchName
    ],
    plugins: [
      [
        '@semantic-release/commit-analyzer', {
          preset: 'conventionalcommits',
          releaseRules: [{
            breaking: true,
            release: 'major'
          }, {
            revert: true,
            release: 'patch'
          }, {
            type: 'feat',
            release: 'minor'
          }, {
            type: 'fix',
            release: 'patch'
          }, {
            type: 'chore',
            release: 'patch'
          }, {
            type: 'docs',
            release: 'patch'
          }, {
            type: 'test',
            release: 'patch'
          }, {
            scope: 'no-release',
            release: false
          }]
        }
      ],
      [
        '@semantic-release/release-notes-generator', {
          preset: 'conventionalcommits',
          presetConfig: {
            types: [{
              type: 'feat',
              section: 'Features'
            }, {
              type: 'fix',
              section: 'Bug Fixes'
            }, {
              type: 'chore',
              section: 'Trivial Changes'
            }, {
              type: 'docs',
              section: 'Trivial Changes'
            }, {
              type: 'test',
              section: 'Tests'
            }]
          }
        }
      ],
      '@semantic-release/changelog',
      alternativePkgRoot
        ? [
            '@semantic-release/npm', {
              pkgRoot: alternativePkgRoot
            }
          ]
        : '@semantic-release/npm',
      '@semantic-release/github',
      '@semantic-release/git'
    ]
  }
}

module.exports = {
  semanticReleaseConfig
}
