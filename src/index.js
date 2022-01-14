#! /usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs')
const path = require('path')
const execa = require('execa')
const prompt = require('prompt')
const glob = require('it-glob')
const { monorepoManifest } = require('./manifests/monorepo')
const { typedESMManifest } = require('./manifests/typed-esm')
const { typescriptManifest } = require('./manifests/typescript')
const { checkLicenseFiles } = require('./check-licence-files')
const { checkBuildFiles } = require('./check-build-files')
const { checkMonorepoFiles } = require('./check-monorepo-files')
const {
  sortManifest,
  ensureFileHasContents
} = require('./utils')

async function processMonorepo (projectDir, manifest, branchName, repoUrl) {
  let proposedManifest = await monorepoManifest(projectDir, manifest, branchName, repoUrl)
  proposedManifest = sortManifest(proposedManifest)

  await ensureFileHasContents(projectDir, 'package.json', JSON.stringify(proposedManifest, null, 2))
  await checkLicenseFiles(projectDir)
  await checkBuildFiles(projectDir, branchName)
  await checkMonorepoFiles(projectDir)

  const workspaces = manifest.workspaces

  if (!workspaces || !Array.isArray(workspaces)) {
    throw new Error('No monorepo workspaces found')
  }

  for (const workspace of workspaces) {
    for await (const subProjectDir of glob('.', workspace, {
      cwd: projectDir,
      absolute: true
    })) {
      const pkg = JSON.parse(fs.readFileSync(path.join(subProjectDir, 'package.json'), {
        encoding: 'utf-8'
      }))

      const homePage = `${repoUrl}/tree/master${subProjectDir.substring(projectDir.length)}`

      console.info('Found monorepo project', pkg.name)

      await processModule(subProjectDir, pkg, branchName, repoUrl, homePage)
    }
  }
}

async function processProject (projectDir, manifest, branchName, repoUrl) {
  await processModule(projectDir, manifest, branchName, repoUrl)
  await checkBuildFiles(projectDir, branchName)
}

async function processModule (projectDir, manifest, branchName, repoUrl, homePage = repoUrl) {
  const esm = manifest.type === 'module'
  const cjs = manifest.type !== 'module'
  const types = Boolean(manifest.types)
  const hasMain = Boolean(manifest.main)

  // our project types:

  // 1. typescript - ESM only, no main, only exports
  const typescript = esm && !hasMain

  // 2. typedESM - ESM/CJS dual publish
  const typedESM = esm && hasMain && types

  // 3. CJS, no types
  const typedCJS = cjs && hasMain && types

  // 3. CJS, no types
  const untypedCJS = cjs && hasMain

  let proposedManifest = {}

  if (typescript) {
    console.info('TypeScript project detected')
    proposedManifest = await typescriptManifest(projectDir, manifest, branchName, repoUrl, homePage)
  } else if (typedESM) {
    console.info('Typed ESM project detected')
    proposedManifest = await typedESMManifest(projectDir, manifest, branchName, repoUrl, homePage)
  } else if (typedCJS) {
    console.info('Typed CJS project detected')
  } else if (untypedCJS) {
    console.info('Untyped CJS project detected')
  }

  proposedManifest = sortManifest(proposedManifest)

  await ensureFileHasContents(projectDir, 'package.json', JSON.stringify(proposedManifest, null, 2))
  await checkLicenseFiles(projectDir)
}

async function main () {
  prompt.start()

  const { projectDir } = await prompt.get({
    properties: {
      projectDir: {
        default: process.argv[2] || process.cwd()
      }
    }
  })

  const { branchName } = await prompt.get({
    properties: {
      branchName: {
        default: await execa('git', ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'], {
          cwd: projectDir,
          path: process.env.PATH
        })
          .then(res => execa('basename', [res.stdout]))
          .then(res => res.stdout)
          .catch(() => {
            return 'master'
          })
      }
    }
  })

  const manifest = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), {
    encoding: 'utf-8'
  }))

  const { repoUrl } = await prompt.get({
    properties: {
      repoUrl: {
        default: await execa('git', ['remote', 'get-url', 'origin'], {
          cwd: projectDir,
          path: process.env.PATH
        })
          .then(res => res.stdout.split(':')[1].split('.git')[0])
          .then(res => `https://github.com/${res}`)
          .catch(() => {
            return ''
          })
      }
    }
  })

  const monorepo = manifest.workspaces != null

  if (monorepo) {
    console.info('monorepo project detected')
    await processMonorepo(projectDir, manifest, branchName, repoUrl)
  } else {
    await processProject(projectDir, manifest, branchName, repoUrl)
  }
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
