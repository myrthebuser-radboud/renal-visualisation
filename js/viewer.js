
const viewer = document.querySelector("#viewer");
const controls = document.querySelector("#controls");
const status = document.querySelector("#status");
const panel = document.querySelector("#panel");
const orientationViewer = document.querySelector("#orientation-viewer");


orientationViewer.addEventListener("load", () => {
  orientationReady = true;
  syncOrientationView();
});



function syncOrientationView() {
  if (!mainCameraReady || !orientationReady || syncingCamera) return;

  syncingCamera = true;

  const mainOrbit = viewer.getCameraOrbit();
  const guideOrbit = orientationViewer.getCameraOrbit();

  const verticalOffset = 0.1;

  orientationViewer.cameraOrbit =
    `${mainOrbit.theta}rad ${mainOrbit.phi - 0.7}rad ${guideOrbit.radius}m`;

  syncingCamera = false;
}
  orientationViewer.cameraOrbit =
  `${mainOrbit.theta}rad ${mainOrbit.phi - 0.7}rad ${guideOrbit.radius}m`;
  console.log("Person camera after:", orientationViewer.getCameraOrbit().theta,
  orientationViewer.getCameraOrbit().phi);
  syncingCamera = false;
}

viewer.addEventListener("camera-change", syncOrientationView);

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
  Solid: "Suspicious  mass",
  Artery: "Feeding blood vessels",
  Veins: "Draining blood vessels",
};

function setMaterialOpacity(material, opacity) {
  const pbr = material.pbrMetallicRoughness;
  const color = Array.from(pbr.baseColorFactor);

  // Preserve the material's RGB color and change only its opacity.
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
  
  // Ensure opacity changes are supported by the material.
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

    // A hidden segmentation has zero opacity.
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

// function addResetButton() {
//   const button = document.createElement("button");
//   button.id = "reset-view";
//   button.type = "button";
//   button.textContent = "Reset camera view";

//   button.addEventListener("click", () => {
//     viewer.cameraTarget = "auto auto auto";
//     viewer.cameraOrbit = "auto auto auto";
//     viewer.fieldOfView = "auto";
//   });

//   panel.append(button);
// }

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


//   addResetButton();
  status.textContent = ` `;
  
viewer.cameraTarget = "191.11328125m 215.234375m 133.5m";
viewer.cameraOrbit = "0.029856741164000212rad 2.662640764083959rad 496.52395340944577m";
viewer.fieldOfView = "30deg";

requestAnimationFrame(() => {
  mainCameraReady = true;
  syncOrientationView();
});



// orientationViewer.addEventListener("load", () => {
//   console.log("Orientation figure loaded.");
//   orientationReady = true;

//   orientationViewer.cameraTarget = "auto auto auto";
//   orientationViewer.cameraOrbit = "-5rad 5rad 3m";
//   orientationViewer.fieldOfView = "35deg";

//   syncOrientationView();
// });

viewer.addEventListener("error", (event) => {
  console.error("Model loading error:", event);
  status.textContent =
    "Could not load the 3D model. Check the model file path and browser console.";
});
