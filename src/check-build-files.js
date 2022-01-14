const fs = require('fs')
const path = require('path')
const {
  ensureFileHasContents
} = require('./utils')

async function checkBuildFiles (projectDir, branchName) {
  await ensureFileHasContents(projectDir, '.github/dependabot.yml')

  let defaultCiContent = fs.readFileSync(path.join(__dirname, 'files/.github/workflows/js-test-and-release.yml'), {
    encoding: 'utf-8'
  })
  defaultCiContent = defaultCiContent.replace(/\$default-branch/g, branchName)

  await ensureFileHasContents(projectDir, '.github/workflows/js-test-and-release.yml', defaultCiContent)
}

module.exports = {
  checkBuildFiles
}
