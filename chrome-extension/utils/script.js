let isDragModeActive = false;
let startX = 0;
let startY = 0;
let selectionBox = null;
let overlay = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received a message', message);
  if (message.action === 'startDragQR') {
    startDragMode();
    sendResponse({ started: true });
  }
  return true;
});

function startDragMode() {
  if (isDragModeActive) return;

  isDragModeActive = true;

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
    overlay.style.zIndex = '2147483647';
    document.body.appendChild(overlay);
  }

  document.addEventListener('mousedown', onMouseDown);
}

function stopDragMode() {
  isDragModeActive = false;
  document.removeEventListener('mousedown', onMouseDown);
  if (overlay) {
    document.body.removeChild(overlay);
    overlay = null;
  }
}

function onMouseDown(e) {
  if (selectionBox) {
    selectionBox.remove();
    selectionBox = null;
  }

  selectionBox = document.createElement('div');
  selectionBox.style.position = 'absolute';
  selectionBox.style.border = '2px dashed red';
  selectionBox.style.backgroundColor = 'transparent';
  selectionBox.style.pointerEvents = 'none';
  selectionBox.style.zIndex = '2147483648';
  document.body.appendChild(selectionBox);

  startX = e.pageX;
  startY = e.pageY;
  selectionBox.style.left = `${startX}px`;
  selectionBox.style.top = `${startY}px`;
  selectionBox.style.width = '0px';
  selectionBox.style.height = '0px';

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

function onMouseMove(e) {
  if (!selectionBox) return;
  const currentX = e.pageX;
  const currentY = e.pageY;
  const width = currentX - startX;
  const height = currentY - startY;
  selectionBox.style.left = `${Math.min(startX, currentX)}px`;
  selectionBox.style.top = `${Math.min(startY, currentY)}px`;
  selectionBox.style.width = `${Math.abs(width)}px`;
  selectionBox.style.height = `${Math.abs(height)}px`;
}

async function onMouseUp(e) {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  if (!selectionBox) return;
  const rect = selectionBox.getBoundingClientRect();
  const boundingBox = {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  };

  stopDragMode();
  selectionBox.remove();
  selectionBox = null;

  chrome.runtime.sendMessage({ action: 'captureScreenshot', boundingBox }, async response => {
    if (!response || !response.success) {
      alert('Capture failed: ' + (response && response.error));
      return;
    }
    const { dataUrl } = response;
    const croppedDataUrl = await cropScreenshot(dataUrl, boundingBox);
    if (croppedDataUrl) {
      const codeData = await decodeQRCode(croppedDataUrl);
      if (codeData) {
        alert('QR Code detected:\n' + codeData);
        chrome.runtime.sendMessage({ action: 'qrCodeResult', qrData: codeData });
      } else {
        alert('No QR code found or failed to decode.');
      }
    }
  });
}

async function cropScreenshot(dataUrl, boundingBox) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      canvas.width = boundingBox.width;
      canvas.height = boundingBox.height;
      ctx.drawImage(
        img,
        boundingBox.x,
        boundingBox.y,
        boundingBox.width,
        boundingBox.height,
        0,
        0,
        boundingBox.width,
        boundingBox.height,
      );
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(null);
    img.src = dataUrl;
  });
}

async function decodeQRCode(dataUrl) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = window.jsQR(imageData.data, canvas.width, canvas.height);
      resolve(code ? code.data : null);
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}
