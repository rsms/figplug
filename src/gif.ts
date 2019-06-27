
export interface GifInfo {
  version :string
  width   :int
  height  :int
}

export function gifInfoBuf(buf :ArrayLike<byte>) :GifInfo {
  // header is 6 bytes and should be either "GIF87a" or "GIF89a"
  if (buf.length < 10 ||
      buf[0] != 71 || buf[1] != 73 || buf[2] != 70 || buf[3] != 56 ||
      (buf[5] != 97 && buf[5] != 98)) { // GIF8_[a|b]
    throw new Error("not a gif")
  }

  let v = buf[4] - 48  // e.g. 7 or 9
  let version = `8${v}${String.fromCharCode(buf[5])}`
  if (v != 7 && v != 9) {
    throw new Error(`unsupported gif version GIF${version}`)
  }

  // header is followed by width and height as uint16
  return {
    version,
    width:   (buf[7] << 8) + buf[6],
    height:  (buf[9] << 8) + buf[8],
  }
}


// export function gifInfoFile(path) {
//   return new Promise((resolve, reject) => {
//     fs.open(path, "r", (err, fd) => {
//       let buf = Buffer.allocUnsafe(10)
//       let nread = fs.readSync(fd, buf, 0, 10, 0)
//       fs.close(fd, ()=>{})
//       if (nread < 10) {
//         reject("not a gif")
//       }
//       resolve(gifInfoBuf(buf))
//     })
//   })
// }
