/*
 CHAIXI PHASE 4.8.2
 Independent Pickup QR Link Hotfix

 Purpose:
 - Does NOT depend on the old renderPickupQr() implementation.
 - Watches the visible pickup proof card.
 - Rebuilds the QR from the visible 4-digit pickup code.
 - QR is always a real HTTPS URL to pickup.html?code=XXXX
*/
(() => {
  const $ = id => document.getElementById(id)

  function buildPickupUrl(code) {
    const clean = String(code || '').trim()
    if (!/^\d{4}$/.test(clean)) return null

    const path = window.location.pathname
      .replace(/\/self-order\.html.*$/i, '')
      .replace(/\/$/, '')

    return `${window.location.origin}${path}/pickup.html?code=${encodeURIComponent(clean)}`
  }

  function rebuild() {
    const codeEl = $('pickupCodeText')
    const qrEl = $('pickupQrCode')
    if (!codeEl || !qrEl || !window.QRCode) return

    const code = codeEl.textContent?.trim()
    const url = buildPickupUrl(code)
    if (!url) return

    if (qrEl.dataset.chaixiPickupUrl === url) return

    qrEl.innerHTML = ''
    new window.QRCode(qrEl, {
      text: url,
      width: 155,
      height: 155,
      correctLevel: window.QRCode.CorrectLevel.M
    })

    qrEl.dataset.chaixiPickupUrl = url
    qrEl.dataset.pickupQrType = 'https-link'
    console.log('[CHAIXI] Pickup QR rebuilt as URL:', url)
  }

  const observer = new MutationObserver(() => rebuild())
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true
  })

  document.addEventListener('DOMContentLoaded', rebuild)
  setInterval(rebuild, 1500)
})()
