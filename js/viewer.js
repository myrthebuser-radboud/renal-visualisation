const viewer = document.querySelector("#viewer");
const controls = document.querySelector("#controls");
const status = document.querySelector("#status");
const panel = document.querySelector("#panel");
const orientationViewer = document.querySelector("#orientation-viewer");

let orientationReady = false;
let syncingCamera = false;
let mainCameraReady = false;

const COLORS = {
  Kidney: "#be6955",
  Cystic: "#50a0f0",
  Solid: "#f0b446",
  Artery: "#dc3c3c",
  Veins: "#4664dc",
};

const LABELS = {
  Kidney: "Kidney",
  Cystic: "Simple cyst",
  Solid: "Suspicious mass",
  Artery: "Feeding blood vessels",
  Veins: "Draining blood vessels",
};


function syncOrientationView() {
  if (!mainCameraReady || !orientationReady || syncingCamera) return;

  syncingCamera = true;

  try {
    const mainOrbit = viewer.getCameraOrbit();
    const guideOrbit = orientationViewer.getCameraOrbit();

    orientationViewer.cameraOrbit =
      `${mainOrbit.theta}rad ${mainOrbit.phi - 0.2}rad ${guideOrbit.radius}m`;
  } finally {
    syncingCamera = false;
  }
}


orientationViewer.addEventListener("load", () => {
  orientationReady = true;
  syncOrientationView();
});

viewer.addEventListener("camera-change", () => {
  console.log("Main camera moved");
  syncOrientationView();
});

function setMaterialOpacity(material, opacity) {
  const pbr = material.pbrMetallicRoughness;
  const color = Array.from(pbr.baseColorFactor);

  pbr.setBaseColorFactor([
    color[0],
    color[1],
    color[2],
    opacity,
  ]);
}

function createSegmentControl(material) {
  const name = material.name || "Unnamed segmentation";
  const displayName = LABELS[name] || name;
  const initialColor = COLORS[name] || "#888888";

  const initialFactor = Array.from(
    material.pbrMetallicRoughness.baseColorFactor
  );

  const initialOpacity =
    name === "Kidney" ? 0.2 : (initialFactor[3] ?? 1);

  material.setAlphaMode("BLEND");

  const row = document.createElement("section");
  row.className = "segment-row";

  const heading = document.createElement("div");
  heading.className = "segment-heading";

  const label = document.createElement("label");
  label.className = "segment-name";

  const swatch = document.createElement("span");
  swatch.className = "swatch";
  swatch.style.backgroundColor = initialColor;

  const nameText = document.createElement("span");
  nameText.textContent = displayName;

  label.append(swatch, nameText);

  const value = document.createElement("span");
  value.className = "opacity-value";
  value.textContent = `${Math.round(initialOpacity * 100)}%`;

  heading.append(label, value);

  const controlsRow = document.createElement("div");
  controlsRow.className = "segment-controls";

  const slider = document.createElement("input");
  slider.className = "opacity-slider";
  slider.type = "range";
  slider.min = "0";
  slider.max = "100";
  slider.step = "1";
  slider.value = String(Math.round(initialOpacity * 100));
  slider.setAttribute("aria-label", `${name} opacity`);

  const visibilityLabel = document.createElement("label");
  visibilityLabel.className = "visibility-toggle";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = true;
  checkbox.setAttribute("aria-label", `Show ${name}`);

  visibilityLabel.append(checkbox, " Show");

  let visible = true;

  function updateOpacity() {
    const opacity = Number(slider.value) / 100;
    setMaterialOpacity(material, visible ? opacity : 0);
    value.textContent = `${slider.value}%`;
  }

  slider.addEventListener("input", updateOpacity);

  checkbox.addEventListener("change", () => {
    visible = checkbox.checked;
    updateOpacity();
  });

  controlsRow.append(slider, visibilityLabel);
  row.append(heading, controlsRow);

  updateOpacity();

  return row;
}

viewer.addEventListener("load", () => {
  controls.replaceChildren();

  const materials = viewer.model?.materials ?? [];

  if (materials.length === 0) {
    status.textContent =
      "The model loaded, but no materials were found.";
    return;
  }

  for (const material of materials) {
    controls.append(createSegmentControl(material));
  }

  status.textContent = "";

  viewer.cameraTarget = "191.11328125m 215.234375m 133.5m";
  viewer.cameraOrbit =
    "0.029856741164000212rad 2.662640764083959rad 496.52395340944577m";
  viewer.fieldOfView = "30deg";

  requestAnimationFrame(() => {
    mainCameraReady = true;
    syncOrientationView();
  });
});

viewer.addEventListener("error", (event) => {
  console.error("Model loading error:", event);
  status.textContent =
    "Could not load the 3D model. Check the model file path and browser console.";
});
