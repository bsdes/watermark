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
const downloadAllBtn = document.getElementById("downloadAllBtn");

const angleInput = document.getElementById("angle");
const colsInput = document.getElementById("cols");
const rowsInput = document.getElementById("rows");
const gapXInput = document.getElementById("gapX");
const gapYInput = document.getElementById("gapY");

const useLogoSwitch = document.getElementById("useLogoSwitch");
const logoUpload = document.getElementById("logoUpload");
const textInputGroup = document.getElementById("textInputGroup");
const logoInputGroup = document.getElementById("logoInputGroup");

const clearBtn = document.getElementById("clearImagesBtn");
const resetBtn = document.getElementById("resetSettingsBtn");

let useLogo = false;
let logoImage = null;
let selectedImage = null;
let selectedImages = [];
let currentImage = null;
let offsetX = 0;
let offsetY = 0;
let dragging = false;
let dragStartX = 0;
let dragStartY = 0;

function setPreviewEmptyState(isEmpty) {
  const preview = document.querySelector(".preview");
  if (isEmpty) {
    preview.classList.add("empty");
  } else {
    preview.classList.remove("empty");
  }
}

imageInput.addEventListener("change", (e) => {
  const files = Array.from(e.target.files);
  selectedImages = files;
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

function loadImageToCanvas(file) {
  const img = new Image();
  img.onload = () => {
    currentImage = img;
    const containerWidth = previewCanvas.parentElement.clientWidth;
    const scale = containerWidth / img.naturalWidth;
    const width = containerWidth;
    const height = img.naturalHeight * scale;

    previewCanvas.width = width;
    previewCanvas.height = height;
    previewCanvas.style.width = '100%';
    previewCanvas.style.height = 'auto';

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    offsetX = width / 2;
    offsetY = height / 2;

    setPreviewEmptyState(false);
    drawWatermark();
  };
  img.src = URL.createObjectURL(file);
}

function loadImageToCanvasAsync(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      const containerWidth = previewCanvas.parentElement.clientWidth;
      const scale = containerWidth / img.naturalWidth;
      const width = containerWidth;
      const height = img.naturalHeight * scale;

      previewCanvas.width = width;
      previewCanvas.height = height;
      previewCanvas.style.width = '100%';
      previewCanvas.style.height = 'auto';

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      offsetX = width / 2;
      offsetY = height / 2;

      resolve();
    };
    img.src = URL.createObjectURL(file);
  });
}
function drawWatermark() {
  if (!currentImage) return;

  const text = watermarkTextInput.value;
  const font = fontSelect.value;
  const opacity = parseFloat(opacityInput.value);
  const fontSize = parseInt(fontSizeInput.value);
  const angle = parseFloat(angleInput.value) * Math.PI / 180;
  const cols = parseInt(colsInput.value);
  const rows = parseInt(rowsInput.value);
  const gapX = parseInt(gapXInput.value);
  const gapY = parseInt(gapYInput.value);

  ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  ctx.drawImage(currentImage, 0, 0, previewCanvas.width, previewCanvas.height);

  ctx.globalAlpha = opacity;
  ctx.font = `${fontSize}px ${font}`;
  ctx.textAlign = "center";

  // ==== АВТОКОНТРАСТ ====
  let avgBrightness = 127;
  try {
    const imageData = ctx.getImageData(0, 0, previewCanvas.width, previewCanvas.height);
    const data = imageData.data;
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      totalBrightness += brightness;
    }
    avgBrightness = totalBrightness / (data.length / 4);
  } catch (e) {}

  ctx.fillStyle = avgBrightness < 128 ? "white" : "black";

  function renderMark(x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    if (useLogo && logoImage) {
      const scale = fontSize / logoImage.height;
      const w = logoImage.width * scale;
      const h = logoImage.height * scale;
      ctx.drawImage(logoImage, -w / 2, -h / 2, w, h);
    } else {
      ctx.fillText(text, 0, 0);
    }
    ctx.restore();
  }

  if (cols === 1 && rows === 1) {
    const centerX = previewCanvas.width / 2;
    const centerY = previewCanvas.height / 2;
    const snapThreshold = 20;

    let snappedX = offsetX;
    let snappedY = offsetY;

    if (Math.abs(offsetX - centerX) < snapThreshold) snappedX = centerX;
    if (Math.abs(offsetY - centerY) < snapThreshold) snappedY = centerY;

    renderMark(snappedX, snappedY);

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
  } else {
    const startX = (previewCanvas.width - (cols - 1) * gapX) / 2;
    const startY = (previewCanvas.height - (rows - 1) * gapY) / 2;

    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const x = startX + col * gapX;
        const y = startY + row * gapY;
        renderMark(x, y);
      }
    }
  }

  ctx.globalAlpha = 1.0;
}
// Drag-to-move
previewCanvas.addEventListener("mousedown", (e) => {
  if (colsInput.value !== "1" || rowsInput.value !== "1") return;
  dragStartX = e.offsetX - offsetX;
  dragStartY = e.offsetY - offsetY;
  dragging = true;
});

previewCanvas.addEventListener("mousemove", (e) => {
  if (!dragging || colsInput.value !== "1" || rowsInput.value !== "1") return;
  offsetX = e.offsetX - dragStartX;
  offsetY = e.offsetY - dragStartY;
  drawWatermark();
});

previewCanvas.addEventListener("mouseup", () => {
  dragging = false;
});

// Синхронізація слайдерів та input[type=number]
const syncPairs = [
  ["angleRange", "angle"],
  ["colsRange", "cols"],
  ["rowsRange", "rows"],
  ["gapXRange", "gapX"],
  ["gapYRange", "gapY"]
];

syncPairs.forEach(([rangeId, numberId]) => {
  const range = document.getElementById(rangeId);
  const number = document.getElementById(numberId);
  range.addEventListener("input", () => {
    number.value = range.value;
    drawWatermark();
  });
  number.addEventListener("input", () => {
    range.value = number.value;
    drawWatermark();
  });
});

// Текстові інпути що перерисовують
[
  watermarkTextInput,
  fontSelect,
  opacityInput,
  fontSizeInput
].forEach(el => el.addEventListener("input", drawWatermark));

// Перемикач логотипу
useLogoSwitch.addEventListener("change", () => {
  useLogo = useLogoSwitch.checked;
  textInputGroup.style.display = useLogo ? "none" : "block";
  logoInputGroup.style.display = useLogo ? "block" : "none";
  drawWatermark();
});

// Завантаження PNG логотипу
logoUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file && file.type === "image/png") {
    const img = new Image();
    img.onload = () => {
      logoImage = img;
      drawWatermark();
    };
    img.src = URL.createObjectURL(file);
  }
});

// Кнопка завантажити одне зображення
downloadBtn.addEventListener("click", () => {
  if (!selectedImage) return;
  const a = document.createElement("a");
  a.href = previewCanvas.toDataURL("image/png");
  a.download = "watermarked.png";
  a.click();
});

// Кнопка завантажити всі (з архівом + попапом)
downloadAllBtn.addEventListener("click", async () => {
  if (selectedImages.length === 0) return;

  const modal = document.getElementById("progressModal");
  const fill = document.getElementById("progressFill");
  const text = document.getElementById("progressText");

  modal.style.display = "flex";
  fill.style.width = "0%";
  text.textContent = "Preparing files...";

  const zip = new JSZip();

  for (let i = 0; i < selectedImages.length; i++) {
    text.textContent = `Processing ${i + 1} of ${selectedImages.length}...`;
    fill.style.width = `${Math.round(((i + 1) / selectedImages.length) * 100)}%`;

    await loadImageToCanvasAsync(selectedImages[i]);
    drawWatermark();

    const dataUrl = previewCanvas.toDataURL("image/png");
    const base64Data = dataUrl.replace(/^data:image\/(png|jpg);base64,/, "");
    zip.file(`image_${i + 1}.png`, base64Data, { base64: true });
  }

  text.textContent = "Generating archive...";
  const content = await zip.generateAsync({ type: "blob" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(content);
  a.download = "easywater.zip";
  a.click();

  setTimeout(() => {
    modal.style.display = "none";
  }, 800);
});

// Clear
clearBtn.addEventListener("click", () => {
  selectedImages = [];
  selectedImage = null;
  thumbnails.innerHTML = "";
  ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  setPreviewEmptyState(true);
});

// Reset
resetBtn.addEventListener("click", () => {
  watermarkTextInput.value = "Watermark";
  fontSelect.value = "Arial";
  opacityInput.value = "0.5";
  fontSizeInput.value = "48";

  angleInput.value = 0;
  angleRange.value = 0;

  colsInput.value = 1;
  colsRange.value = 1;

  rowsInput.value = 1;
  rowsRange.value = 1;

  gapXInput.value = 200;
  gapXRange.value = 200;

  gapYInput.value = 200;
  gapYRange.value = 200;

  useLogoSwitch.checked = false;
  useLogo = false;
  logoImage = null;

  textInputGroup.style.display = "block";
  logoInputGroup.style.display = "none";

  drawWatermark();
});
