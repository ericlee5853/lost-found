import WebKit
import AppKit

// 사용법: swift shot.swift <html경로> <png경로> <가로> <세로> <읽기허용폴더>
let a = CommandLine.arguments
let htmlURL = URL(fileURLWithPath: a[1])
let outURL = URL(fileURLWithPath: a[2])
let size = NSSize(width: Double(a[3])!, height: Double(a[4])!)
let rootURL = URL(fileURLWithPath: a[5])

let app = NSApplication.shared
app.setActivationPolicy(.accessory)

let config = WKWebViewConfiguration()
let web = WKWebView(frame: NSRect(origin: .zero, size: size), configuration: config)
let window = NSWindow(contentRect: NSRect(origin: .zero, size: size),
                      styleMask: [.borderless], backing: .buffered, defer: false)
window.contentView = web
window.orderBack(nil)

final class Nav: NSObject, WKNavigationDelegate {
    var finished = false
    func webView(_ w: WKWebView, didFinish n: WKNavigation!) { finished = true }
    func webView(_ w: WKWebView, didFail n: WKNavigation!, withError e: Error) {
        FileHandle.standardError.write("로드 실패: \(e)\n".data(using: .utf8)!); exit(1)
    }
}
let nav = Nav()
web.navigationDelegate = nav
web.loadFileURL(htmlURL, allowingReadAccessTo: rootURL)

let deadline = Date().addingTimeInterval(25)
while !nav.finished && Date() < deadline {
    RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.05))
}
// 글꼴·레이아웃이 자리잡도록 잠시 더 돌린다
let settle = Date().addingTimeInterval(1.8)
while Date() < settle {
    RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.05))
}

var saved = false
let shotConfig = WKSnapshotConfiguration()
shotConfig.rect = CGRect(origin: .zero, size: size)
if #available(macOS 10.15, *) { shotConfig.afterScreenUpdates = true }
web.takeSnapshot(with: shotConfig) { image, error in
    defer { saved = true }
    guard let image = image, let tiff = image.tiffRepresentation,
          let rep = NSBitmapImageRep(data: tiff),
          let png = rep.representation(using: .png, properties: [:]) else {
        FileHandle.standardError.write("캡처 실패: \(String(describing: error))\n".data(using: .utf8)!)
        return
    }
    try? png.write(to: outURL)
}
let shotDeadline = Date().addingTimeInterval(20)
while !saved && Date() < shotDeadline {
    RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.05))
}
print(FileManager.default.fileExists(atPath: outURL.path) ? "저장 완료" : "저장 실패")
