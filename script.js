const imageInput = document.getElementById("imageInput");
const thumbnails = document.getElementById("imageThumbnails");
const previewCanvas = document.getElementById("previewCanvas");
const ctx = previewCanvas.getContext("2d");
const uploadBox = document.querySelector(".upload-box");

const watermarkTextInput = document.getElementById("watermarkText");
const fontSelect = document.getElementById("fontSelect");
const opacityInput = document.getElementById("opacity");
const fontSizeInput = document.getElementById("fontSize");
const downloadBtn = document.getElementById("downloadBtn");

let selectedImage = null;
let currentImage = null;
let position = "center";
let offsetX = 0;
let offsetY = 0;

let dragging = false;
let dragStartX = 0;
let dragStartY = 0;

imageInput.addEventListener("change", (e) => {
  const files = Array.from(e.target.files);
  thumbnails.innerHTML = "";
  if (files.length > 0) {
    loadImageToCanvas(files[0]);
    selectedImage = files[0];
  }
  files.forEach((file) => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.addEventListener("click", () => {
      loadImageToCanvas(file);
      selectedImage = file;
    });
    thumbnails.appendChild(img);
  });
});

["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
  uploadBox.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
});

["dragenter", "dragover"].forEach(eventName => {
  uploadBox.addEventListener(eventName, () => {
    uploadBox.classList.add("dragging");
  });
});

["dragleave", "drop"].forEach(eventName => {
  uploadBox.addEventListener(eventName, () => {
    uploadBox.classList.remove("dragging");
  });
});

uploadBox.addEventListener("drop", (e) => {
  const dt = e.dataTransfer;
  const files = dt.files;
  imageInput.files = files;
  const event = new Event("change");
  imageInput.dispatchEvent(event);
});

document.querySelectorAll(".position-options button").forEach((btn) => {
  btn.addEventListener("click", () => {
    position = btn.dataset.pos;
    if (position === "center" && currentImage) {
      offsetX = currentImage.width / 2;
      offsetY = currentImage.height / 2;
    }
    drawWatermark();
  });
});

function loadImageToCanvas(file) {
  const img = new Image();
  img.onload = () => {
    currentImage = img;
    const dpr = window.devicePixelRatio || 1;

    const width = img.naturalWidth;
    const height = img.naturalHeight;

    previewCanvas.width = width * dpr;
    previewCanvas.height = height * dpr;
    previewCanvas.style.width = width + "px";
    previewCanvas.style.height = height + "px";

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    if (position === "center") {
      offsetX = width / 2;
      offsetY = height / 2;
    }
    drawWatermark();
  };
  img.src = URL.createObjectURL(file);
}

function drawWatermark() {
  if (!currentImage) return;

  const text = watermarkTextInput.value;
  const font = fontSelect.value;
  const opacity = parseFloat(opacityInput.value);
  const fontSize = parseInt(fontSizeInput.value);
  const dpr = window.devicePixelRatio || 1;

  ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  ctx.drawImage(currentImage, 0, 0, currentImage.width, currentImage.height);

  ctx.globalAlpha = opacity;
  ctx.font = `${fontSize * dpr}px ${font}`;
  ctx.fillStyle = "white";

  if (position === "diagonal") {
    ctx.save();
    ctx.translate(previewCanvas.width / 2, previewCanvas.height / 2);
    ctx.rotate(-0.5);
    ctx.textAlign = "center";
    ctx.fillText(text, 0, 0);
    ctx.restore();
  } else if (position === "topleft") {
    ctx.textAlign = "left";
    ctx.fillText(text, 20 * dpr, 40 * dpr);
  } else if (position === "center") {
    ctx.textAlign = "center";
    let snappedX = offsetX * dpr;
    let snappedY = offsetY * dpr;

    const snapThreshold = 20 * dpr;
    const centerX = previewCanvas.width / 2;
    const centerY = previewCanvas.height / 2;

    if (Math.abs(snappedX - centerX) < snapThreshold) {
      snappedX = centerX;
    }
    if (Math.abs(snappedY - centerY) < snapThreshold) {
      snappedY = centerY;
    }

    ctx.fillText(text, snappedX, snappedY);

    ctx.strokeStyle = "#007aff";
    ctx.lineWidth = 1;

    if (snappedX === centerX) {
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, previewCanvas.height);
      ctx.stroke();
    }

    if (snappedY === centerY) {
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(previewCanvas.width, centerY);
      ctx.stroke();
    }
  } else if (position === "grid") {
    ctx.textAlign = "left";
    for (let x = 0; x < previewCanvas.width; x += 200 * dpr) {
      for (let y = 0; y < previewCanvas.height; y += 200 * dpr) {
        ctx.fillText(text, x, y);
      }
    }
  }

  ctx.globalAlpha = 1.0;
}

previewCanvas.addEventListener("mousedown", (e) => {
  if (position !== "center") return;
  dragStartX = e.offsetX - offsetX;
  dragStartY = e.offsetY - offsetY;
  dragging = true;
});

previewCanvas.addEventListener("mousemove", (e) => {
  if (!dragging || position !== "center") return;
  offsetX = e.offsetX - dragStartX;
  offsetY = e.offsetY - dragStartY;
  drawWatermark();
});

previewCanvas.addEventListener("mouseup", () => {
  dragging = false;
});

watermarkTextInput.addEventListener("input", drawWatermark);
fontSelect.addEventListener("change", drawWatermark);
opacityInput.addEventListener("input", drawWatermark);
fontSizeInput.addEventListener("input", drawWatermark);

downloadBtn.addEventListener("click", () => {
  if (!selectedImage) return;
  const a = document.createElement("a");
  a.href = previewCanvas.toDataURL("image/png");
  a.download = "watermarked.png";
  a.click();
});