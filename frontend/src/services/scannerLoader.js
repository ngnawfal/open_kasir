let zxingModulePromise = null
let html5QrCodePromise = null

export async function loadZxingReader() {
    if (!zxingModulePromise) {
        zxingModulePromise = import('@zxing/library')
    }
    const module = await zxingModulePromise
    return module.BrowserMultiFormatReader
}

export async function loadHtml5QrCode() {
    if (!html5QrCodePromise) {
        html5QrCodePromise = import('html5-qrcode')
    }
    const module = await html5QrCodePromise
    return module.Html5Qrcode
}
