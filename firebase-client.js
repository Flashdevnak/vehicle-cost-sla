import { firebaseConfig } from "./firebase-config.js";

const status = (message) => {
  if (window.VehicleSLA?.setFirebaseStatus) window.VehicleSLA.setFirebaseStatus(message);
  else {
    const el = document.getElementById("firebaseStatus");
    if (el) el.textContent = message;
  }
};

const hasConfig = Object.values(firebaseConfig).every((value) => String(value || "").trim());

function applyData(payload) {
  if (!payload || !Array.isArray(payload.routeCapacityData) || !Array.isArray(payload.vehicleCapacityData)) {
    throw new Error("Invalid Firebase data payload");
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
  if (!hasConfig) {
    status("ใช้ข้อมูล fallback จาก data.js");
    return;
  }

  try {
    const [{ initializeApp }, { getStorage, ref, getDownloadURL }] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js")
    ]);
    const app = initializeApp(firebaseConfig);
    const storage = getStorage(app);
    const url = await getDownloadURL(ref(storage, "public/data.json"));
    const payload = await fetch(url, { cache: "no-store" }).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
    applyData(payload);
    const date = payload.updatedAt ? new Date(payload.updatedAt).toLocaleString("th-TH") : new Date().toLocaleString("th-TH");
    const email = payload.uploadedByEmail || "unknown";
    status(`โหลดข้อมูลล่าสุดจาก Firebase แล้ว: ${date} โดย ${email}`);
    window.VehicleSLA?.refreshAll?.();
  } catch (error) {
    console.warn("Firebase data unavailable, using fallback data.js", error);
    status("ใช้ข้อมูล fallback จาก data.js");
    window.VehicleSLA?.refreshAll?.();
  }
}

loadFirebaseData();
