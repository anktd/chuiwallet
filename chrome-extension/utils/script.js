import jsQR from 'jsqr';

let isDragModeActive = false;
let startX = 0;
let startY = 0;
let selectionBox = null;

function startDragMode() {
  if (isDragModeActive) return;
  isDragModeActive = true;
  document.addEventListener('mousedown', onMouseDown);
}

function stopDragMode() {
  isDragModeActive = false;
  document.removeEventListener('mousedown', onMouseDown);
}

chrome.tabs.onMessage.addListener((message, sender, sendResponse) => {
  console.log('script runtime is being executed');
  if (message.action === 'startDragQR') {
    startDragMode();
    sendResponse({ started: true });
  }
  return true;
});

function onMouseDown(e) {
  if (!selectionBox) {
    selectionBox = document.createElement('div');
    selectionBox.style.position = 'absolute';
    selectionBox.style.border = '2px dashed red';
    selectionBox.style.background = 'rgba(255,0,0,0.2)';
    selectionBox.style.pointerEvents = 'none';
    document.body.appendChild(selectionBox);
  }
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onMouseUp(e) {
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

  chrome.runtime.sendMessage({ action: 'captureScreenshot', boundingBox }, async response => {
    if (!response || !response.success) {
      console.error('Capture failed:', response?.error);
      return;
    }
    const { dataUrl } = response;
    const croppedDataUrl = await cropScreenshot(dataUrl, boundingBox);
    if (croppedDataUrl) {
      const codeData = await decodeQRCode(croppedDataUrl);
      if (codeData) {
        chrome.runtime.sendMessage({ action: 'qrCodeResult', qrData: codeData });
      } else {
        console.error('No QR code found in selection');
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
        return resolve(null);
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
      const code = jsQR(imageData.data, canvas.width, canvas.height);
      if (code) {
        resolve(code.data);
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}
