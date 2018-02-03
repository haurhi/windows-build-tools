'use strict'

const path = require('path')
const fs = require('fs-extra')
const { tmpdir } = require('os')
const debug = require('debug')('windows-build-tools')

const tmp = tmpdir()

/**
 * Looks for a dd_client_ file and returns the path if found.\
 * Returns null if not found.
 *
 * @returns {string|null}
 */
function findVCCLogFile () {
  return new Promise((resolve) => {
    fs.readdir(tmp)
      .then((contents) => {
        // Files that begin with dd_client_
        const matchingFiles = contents.filter((f) => f.startsWith('dd_client_'))
        let matchingFile = null

        if (matchingFiles && matchingFiles.length === 1) {
          // Is it just one? Cool, let's use that one
          matchingFile = path.join(tmp, matchingFiles[0])
          debug(`Find LogFile: Just one file found, resolving with ${matchingFile}`)
        } else if (!matchingFiles || matchingFiles.length === 0) {
          // No files? Return null
          debug(`Find LogFile: No files found, resolving with null`)
          matchingFile = null
        } else {
          // Multiple files! Oh boy, let's find the last one
          debug(`Find LogFile: Multiple files found, determining last modified one`)
          const lastModified = matchingFiles.reduce((previous, current) => {
            const file = path.join(tmp, current)
            const stats = fs.statSync(file)

            let modifiedTime

            if (stats && stats.mtimeMs) {
              // This value is only available in Node 8+
              modifiedTime = stats.mtimeMs
            } else if (stats && stats.mtime) {
              // Fallback for the other versions
              modifiedTime = new Date(stats.mtime).getTime()
            }

            debug(`Find LogFile: Comparing ${modifiedTime} to ${previous.timestap}`)

            if (modifiedTime && modifiedTime > previous.timestap) {
              return { file: current, timestap: modifiedTime }
            } else {
              return previous
            }
          }, { file: null, timestap: 0 })

          debug(`Find LogFile: Returning ${lastModified.file}`)
          matchingFile = lastModified.file
        }

        resolve(path.join(tmp, matchingFile))
      })
  })
}

module.exports = { findVCCLogFile }
