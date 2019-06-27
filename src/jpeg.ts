// Ported from NanoJPEG version 1.3.5 (2016-11-14)
//
// Copyright (c) 2009-2016 Martin J. Fiedler <martin.fiedler@gmx.net>
// published under the terms of the MIT license
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.
//

export interface JpegInfo {
  isGreyscale :bool
  width       :int
  height      :int
}

function readUint16BE(buf :ArrayLike<byte>, index :int) :int {
    return (buf[index] << 8) | buf[index + 1];
}

export function jpegInfoBuf(buf :ArrayLike<byte>) :JpegInfo {
  let i = 0, end = buf.length - 1
  if ((buf[i] ^ 0xFF) | (buf[i + 1] ^ 0xD8)) {
    throw new Error("invalid jpeg data")
  }
  i += 2

  function njDecodeLength() :int {
    let bytesRemaining = buf.length - i
    if (bytesRemaining < 2) {
      throw new Error("jpeg data truncated")
    }
    let length = readUint16BE(buf, i)
    if (length > bytesRemaining) {
      print({ length, bytesRemaining })
      throw new Error("jpeg data truncated")
    }
    i += 2
    return length
  }

  function njDecodeSOF() :JpegInfo {
    let length = njDecodeLength()
    if (length < 9) {
      throw new Error("jpeg syntax error")
    }

    // if (buf[i] != 8) {
    //   throw new Error("unsupported JPEG format")
    // }
    // try anyways...

    let ncomp = buf[i + 5]

    return {
      height: readUint16BE(buf, i + 1),
      width:  readUint16BE(buf, i + 3),
      isGreyscale: ncomp == 1,
    }
  }

  while (true) {
    if (i >= end || (buf[i] != 0xFF)) {
      break
    }
    i += 2
    switch (buf[i-1]) {
      case 0xC0: return njDecodeSOF()
      // case 0xC4: njDecodeDHT
      // case 0xDB: njDecodeDQT
      // case 0xDD: njDecodeDRI
      // case 0xDA: njDecodeScan
      default:
        // print(`skip section 0x${buf[i-1].toString(16)}`)
        i += njDecodeLength()
    }
  }

  throw new Error("invalid jpeg (missing SOF section)")
}
