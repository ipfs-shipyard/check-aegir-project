#! /usr/bin/env node
/* eslint-disable no-console */

'use strict'

const fs = require('fs')
const path = require('path')
const execa = require('execa')
const prompt = require('prompt')
const glob = require('it-glob')
const { monorepoManifest } = require('./manifests/monorepo')
const { typedESMManifest } = require('./manifests/typed-esm')
const { typescriptManifest } = require('./manifests/typescript')
const { untypedCJSManifest } = require('./manifests/untyped-cjs')
const { typedCJSManifest } = require('./manifests/typed-cjs')
const { checkLicenseFiles } = require('./check-licence-files')
const { checkBuildFiles } = require('./check-build-files')
const { checkMonorepoFiles } = require('./check-monorepo-files')
const {
  sortManifest,
  ensureFileHasContents
} = require('./utils')

async function getConfig (projectDir) {
  if (process.env.CI) {
    const branchName = await execa('git', ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'], {
      cwd: projectDir,
      path: process.env.PATH
    })
      .then(res => execa('basename', [res.stdout]))
      .then(res => res.stdout)
      .catch(() => {
        return 'master'
      })
    const repoUrl = await execa('git', ['remote', 'get-url', 'origin'], {
      cwd: projectDir,
      path: process.env.PATH
    })
      .then(res => res.stdout.split(':')[1].split('.git')[0])
      .then(res => `https://github.com/${res}`)
      .catch(() => {
        return ''
      })

    return {
      projectDir,
      branchName,
      repoUrl
    }
  }

  prompt.start()

  return await prompt.get({
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
      },
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
}

async function processMonorepo (projectDir, manifest, branchName, repoUrl) {
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

  let proposedManifest = await monorepoManifest(manifest, repoUrl)
  proposedManifest = sortManifest(proposedManifest)

  await ensureFileHasContents(projectDir, 'package.json', JSON.stringify(proposedManifest, null, 2))
  await checkLicenseFiles(projectDir)
  await checkBuildFiles(projectDir, branchName, repoUrl)
  await checkMonorepoFiles(projectDir)
}

async function processProject (projectDir, manifest, branchName, repoUrl) {
  await processModule(projectDir, manifest, branchName, repoUrl)
  await checkBuildFiles(projectDir, branchName, repoUrl)
}

function isAegirProject (manifest) {
  return Boolean(manifest.devDependencies && manifest.devDependencies.aegir) || Boolean(manifest.dependencies && manifest.dependencies.aegir)
}

async function processModule (projectDir, manifest, branchName, repoUrl, homePage = repoUrl) {
  if (!isAegirProject(manifest)) {
    throw new Error(`"${projectDir}" is not an aegir project`)
  }

  const esm = manifest.type === 'module'
  const cjs = manifest.type !== 'module'
  const types = Boolean(manifest.types)
  const hasMain = Boolean(manifest.main)

  // our project types:

  // 1. typescript - ESM only, no main, only exports
  let typescript = esm && !hasMain

  // 2. typedESM - ESM/CJS dual publish
  let typedESM = esm && hasMain && types

  // 3. CJS, no types
  let typedCJS = cjs && hasMain && types

  // 3. CJS, no types
  let untypedCJS = cjs && hasMain

  let proposedManifest = {}

  if (!typescript && !typedESM && !typedCJS && !untypedCJS) {
    console.info('Cannot detect project type')
    const { projectType } = await prompt.get({
      properties: {
        projectType: {
          description: 'Project type: typescript | typedESM | typedCJS | untypedCJS',
          required: true,
          conform: (value) => {
            return ['typescript', 'typedESM', 'typedCJS', 'untypedCJS'].includes(value)
          },
          default: 'typescript'
        }
      }
    })

    if (projectType === 'typescript') {
      typescript = true
    } else if (projectType === 'typedESM') {
      typedESM = true
    } else if (projectType === 'typedCJS') {
      typedCJS = true
    } else if (projectType === 'untypedCJS') {
      untypedCJS = true
    } else {
      throw new Error('Could not determine project type')
    }
  }

  if (typescript) {
    console.info('TypeScript project detected')
    proposedManifest = await typescriptManifest(manifest, branchName, repoUrl, homePage)
  } else if (typedESM) {
    console.info('Typed ESM project detected')
    proposedManifest = await typedESMManifest(manifest, branchName, repoUrl, homePage)
  } else if (typedCJS) {
    console.info('Typed CJS project detected')
    proposedManifest = await typedCJSManifest(manifest, branchName, repoUrl, homePage)
  } else if (untypedCJS) {
    console.info('Untyped CJS project detected')
    proposedManifest = await untypedCJSManifest(manifest, branchName, repoUrl, homePage)
  } else {
    throw new Error('Cannot determine project type')
  }

  proposedManifest = sortManifest(proposedManifest)

  await ensureFileHasContents(projectDir, 'package.json', JSON.stringify(proposedManifest, null, 2))
  await checkLicenseFiles(projectDir)
}

async function main () {
  const projectDir = process.argv[2] || process.cwd()
  const { branchName, repoUrl } = await getConfig(projectDir)

  const manifest = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), {
    encoding: 'utf-8'
  }))

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
