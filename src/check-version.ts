import * as http from "./http"
import { getTermStyle } from "./termstyle"


export enum VersionCheckResult {
  UsingLatest = 0, // using the current version
  UsingFuture = 1, // using a future, unreleased version
  UsingOld = 2,    // new version available

  Error = 100,
}


export async function checkForNewVersion() :Promise<VersionCheckResult> {
  try {
    let res = await http.GET("https://registry.npmjs.org/figplug/latest", {
      timeout: 10000
    })

    if (res.statusCode < 200 || res.statusCode > 299) {
      throw new Error(`http error ${res.statusCode}`)
    }

    let contentType = res.headers["content-type"]
    if (!contentType || !contentType.match(/\/json/i)) {
      throw new Error(`non-json response from https://registry.npmjs.org/figplug/latest`)
    }

    let info = JSON.parse(res.decodeTextBody())

    if (info.version && typeof info.version == "string") {
      let newVersionLabel = compareVersions(VERSION, info.version)
      if (newVersionLabel != "") {
        printNewVersionBanner(info.version, newVersionLabel)
        return VersionCheckResult.UsingOld
      } else {
        let label2 = compareVersions(newVersionLabel, info.version)
        if (label2 != "") {
          return VersionCheckResult.UsingFuture
        }
      }
    }
    return VersionCheckResult.UsingLatest
  } catch (e) {
    dlog(`checkForNewVersion failed ${e.stack||e}`)
    return VersionCheckResult.Error
  }
}


function compareVersions(local :string, remote :string) :string {
  let L = local.split(".").map(Number)
  let R = remote.split(".").map(Number)
  if (L[0] < R[0]) {
    return "major version"
  } else if (L[1] < R[1]) {
    return "version"
  } else if (L[2] < R[2]) {
    return "minor version"
  }
  return ""
}


function printNewVersionBanner(version :string, newVersionLabel :string) {
  let style = getTermStyle(process.stdout)
  process.stdout.write(
    "\n" +
    style.bold(`  New ${newVersionLabel} of figplug is available.\n`) +
    "  Run " + style.green("npm install -g figplug") + " to update " +
      `${style.pink(VERSION)} → ${style.cyan(version)}\n` +
    "\n"
  )
}
