'use strict'

const fs = require('fs')
const path = require('path')
const {
  ensureFileHasContents
} = require('./utils')
const http = require('https')

const managedRepos = 'https://raw.githubusercontent.com/protocol/.github/master/configs/js.json'
const ciFileUrl = 'https://raw.githubusercontent.com/protocol/.github/master/templates/.github/workflows/js-test-and-release.yml'

async function download (url) {
  return new Promise((resolve, reject) => {
    http.get(url, function (response) {
      let contents = ''

      response.on('data', (chunk) => {
        contents += chunk.toString()
      })
      response.on('end', () => {
        resolve(contents)
      })
      response.on('error', (err) => {
        reject(err)
      })
    })
  })
}

async function isManagedRepo (repoName) {
  const repos = JSON.parse(await download(managedRepos)).repositories

  for (const { target } of repos) {
    console.info(target, repoName)
    if (target === repoName) {
      return true
    }
  }

  return false
}

async function checkBuildFiles (projectDir, branchName, repoUrl) {
  await ensureFileHasContents(projectDir, '.github/dependabot.yml')

  // if this repo is managed by https://github.com/protocol/.github don't try to update the ci files
  const isManaged = await isManagedRepo(repoUrl.replace('https://github.com/', ''))

  if (isManaged) {
    return
  }

  let defaultCiContent = await download(ciFileUrl)
  defaultCiContent = defaultCiContent.replace(/\$default-branch/g, branchName)

  await ensureFileHasContents(projectDir, '.github/workflows/js-test-and-release.yml', defaultCiContent)
}

module.exports = {
  checkBuildFiles
}
