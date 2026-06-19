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

function rebuildPayloadFromChunks(chunkDocs) {
  const chunks = chunkDocs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  const meta = chunks.find((chunk) => chunk.type === "meta");
  const routeChunks = chunks
    .filter((chunk) => chunk.type === "routes")
    .sort((a, b) => Number(a.index || 0) - Number(b.index || 0));
  if (!meta || !routeChunks.length) throw new Error("Published data chunks are incomplete");
  return {
    routeCapacityData: routeChunks.flatMap((chunk) => Array.isArray(chunk.rows) ? chunk.rows : []),
    vehicleCapacityData: Array.isArray(meta.vehicleCapacityData) ? meta.vehicleCapacityData : [],
    vehicleCapacityTrucks: Array.isArray(meta.vehicleCapacityTrucks) ? meta.vehicleCapacityTrucks : [],
    hubMasterData: Array.isArray(meta.hubMasterData) ? meta.hubMasterData : []
  };
}

async function loadFirebaseData() {
  if (!hasConfig) return;

  try {
    const [{ initializeApp }, fireMod] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js")
    ]);
    const app = initializeApp(firebaseConfig);
    const db = fireMod.getFirestore(app);
    const currentSnap = await fireMod.getDoc(fireMod.doc(db, "site_current", "current"));
    if (!currentSnap.exists()) {
      window.VehicleSLA?.refreshAll?.();
      return;
    }
    const current = currentSnap.data();
    const versionId = current.versionId;
    if (!versionId) throw new Error("Current version has no versionId");
    const chunkSnap = await fireMod.getDocs(fireMod.collection(db, "site_data", versionId, "chunks"));
    const payload = rebuildPayloadFromChunks(chunkSnap.docs);
    applyData(payload);
    const updatedAt = current.updatedAt?.toDate?.() || current.publishedAt?.toDate?.();
    if (updatedAt) showPublicStatus(`อัปเดตข้อมูลล่าสุด: ${new Date(updatedAt).toLocaleString("th-TH")}`);
    window.VehicleSLA?.refreshAll?.();
  } catch (error) {
    console.warn("Published data is unavailable; using bundled data.", error);
    window.VehicleSLA?.refreshAll?.();
  }
}

loadFirebaseData();
