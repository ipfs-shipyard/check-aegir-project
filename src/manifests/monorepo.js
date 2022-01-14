'use strict'

const {
  sortFields,
  constructManifest
} = require('../utils')

async function monorepoManifest (projectDir, manifest, branchName, repoUrl, homePage = repoUrl) {
  let proposedManifest = constructManifest(manifest, {
    private: true
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
  monorepoManifest
}
