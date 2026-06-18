import { firebaseConfig } from "./firebase-config.js";

function setStatus(text, type = "note") {
  const el = document.getElementById("firebaseStatus");
  if (!el) return;
  el.textContent = text;
  el.className = type === "ok" ? "admin-ok" : type === "error" ? "admin-error" : "note";
}

async function loadFirebaseData() {
  if (!firebaseConfig || !firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.storageBucket) {
    setStatus("ใช้ข้อมูล fallback จาก data.js: ยังไม่ได้ตั้งค่า firebase-config.js");
    return;
  }

  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
    const { getStorage, ref, getDownloadURL } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js");

    const app = initializeApp(firebaseConfig);
    const storage = getStorage(app);
    const url = await getDownloadURL(ref(storage, "public/data.json"));
    const res = await fetch(url + (url.includes("?") ? "&" : "?") + "ts=" + Date.now(), { cache: "no-store" });

    if (!res.ok) throw new Error("โหลด public/data.json ไม่สำเร็จ");
    const data = await res.json();

    window.VEHICLE_SLA_DATA = {
      routeCapacityData: Array.isArray(data.routeCapacityData) ? data.routeCapacityData : [],
      vehicleCapacityData: Array.isArray(data.vehicleCapacityData) ? data.vehicleCapacityData : [],
      vehicleCapacityTrucks: Array.isArray(data.vehicleCapacityTrucks) ? data.vehicleCapacityTrucks : [],
      hubMasterData: Array.isArray(data.hubMasterData) ? data.hubMasterData : []
    };

    window.VEHICLE_SLA_FIREBASE_META = {
      updatedAt: data.updatedAt || "",
      uploadedByEmail: data.uploadedByEmail || ""
    };

    if (window.vehicleSlaReloadData) window.vehicleSlaReloadData(window.VEHICLE_SLA_DATA);

    const updated = data.updatedAt ? new Date(data.updatedAt).toLocaleString("th-TH") : "ไม่ระบุเวลา";
    const by = data.uploadedByEmail ? " โดย " + data.uploadedByEmail : "";
    setStatus("โหลดข้อมูลล่าสุดจาก Firebase แล้ว: " + updated + by, "ok");
  } catch (err) {
    console.warn("Firebase data fallback:", err);
    setStatus("ใช้ข้อมูล fallback จาก data.js: ยังไม่พบ public/data.json หรือ Storage Rules ยังไม่พร้อม", "note");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadFirebaseData);
} else {
  loadFirebaseData();
}
