import * as http from "http"
import * as https from "https"
import { AppendBuffer } from "./util"

export interface HttpResponse extends http.IncomingMessage {
  statusCode :number
  body       :Uint8Array
  decodeTextBody(encoding? :string) :string
}

export function GET(url :string, options? :http.RequestOptions) :Promise<HttpResponse> {
  return new Promise<HttpResponse>((resolve, reject) => {
    let httpmod = url.startsWith("https:") ? https : http
    let req = httpmod.get(url, options||{}, res_ => {
      let res = res_ as HttpResponse

      // parse content length, if available
      let contentLength = -1
      let contentLengthStr = res.headers["content-length"]
      if (contentLengthStr) {
        contentLength = parseInt(contentLengthStr)
        if (isNaN(contentLength)) {
          contentLength = -1
        }
      }

      let buf = new AppendBuffer(contentLength != -1 ? contentLength : 512)

      res.on('data', chunk => {
        buf.write(chunk)
      })

      res.on('end', () => {
        res.body = buf.bytes()
        res.decodeTextBody = (enc :string = "utf8") => Buffer.from(res.body).toString(enc)
        resolve(res)
      })

    })
    req.on('error', reject)
  })
}
