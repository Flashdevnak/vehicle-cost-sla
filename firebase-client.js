import { firebaseConfig } from "./firebase-config.js";

const hasConfig = Object.values(firebaseConfig).every((value) => String(value || "").trim());

function showPublicStatus(message) {
  if (!message) return;
  let wrap = document.getElementById("publicDataStatus");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "publicDataStatus";
    wrap.className = "public-data-status";
    const main = document.querySelector("main");
    if (main) main.insertAdjacentElement("beforebegin", wrap);
  }
  wrap.textContent = message;
}

function applyData(payload) {
  if (!payload || !Array.isArray(payload.routeCapacityData) || !Array.isArray(payload.vehicleCapacityData)) {
    throw new Error("Invalid published data payload");
  }
  window.routeCapacityData = payload.routeCapacityData;
  window.vehicleCapacityData = payload.vehicleCapacityData;
  window.vehicleCapacityTrucks = payload.vehicleCapacityTrucks || window.vehicleCapacityTrucks || [];
  window.hubMasterData = payload.hubMasterData || window.hubMasterData || [];
  window.VEHICLE_SLA_DATA = {
    routeCapacityData: window.routeCapacityData,
    vehicleCapacityData: window.vehicleCapacityData,
    vehicleCapacityTrucks: window.vehicleCapacityTrucks,
    hubMasterData: window.hubMasterData
  };
}

async function loadFirebaseData() {
  if (!hasConfig) return;

  try {
    const [{ initializeApp }, fireMod, storageMod] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js")
    ]);
    const app = initializeApp(firebaseConfig);
    const db = fireMod.getFirestore(app);
    const storage = storageMod.getStorage(app);
    const currentSnap = await fireMod.getDoc(fireMod.doc(db, "site_current", "current"));
    if (!currentSnap.exists()) {
      window.VehicleSLA?.refreshAll?.();
      return;
    }
    const current = currentSnap.data();
    const dataPath = current.dataPath || current.normalizedDataPath || current.storagePath;
    if (!dataPath) throw new Error("Current version has no data path");
    const url = await storageMod.getDownloadURL(storageMod.ref(storage, dataPath));
    const payload = await fetch(url, { cache: "no-store" }).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
    applyData(payload);
    const updatedAt = current.updatedAt?.toDate?.() || payload.updatedAt || current.publishedAt?.toDate?.();
    if (updatedAt) showPublicStatus(`อัปเดตข้อมูลล่าสุด: ${new Date(updatedAt).toLocaleString("th-TH")}`);
    window.VehicleSLA?.refreshAll?.();
  } catch (error) {
    console.warn("Published data is unavailable; using bundled data.", error);
    window.VehicleSLA?.refreshAll?.();
  }
}

loadFirebaseData();
