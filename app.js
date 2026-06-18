const DATA = window.VEHICLE_SLA_DATA || {};
let routeData = DATA.routeCapacityData || [];
let vcData = DATA.vehicleCapacityData || [];
let trucks = DATA.vehicleCapacityTrucks || ["4W","4WJ","6W5.5","6W6.5","6W7.2","6W8.8","10W","14W","18W","22W"];
let hubs = DATA.hubMasterData || [];

const $ = id => document.getElementById(id);
const fmt = n => {
  if(n===null || n===undefined || n==="") return "-";
  const num = Number(n);
  if(!Number.isFinite(num)) return String(n);
  return new Intl.NumberFormat("th-TH",{maximumFractionDigits:num%1===0?0:2}).format(num);
};
const baht = n => fmt(n) + " บาท";
const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
const norm = s => String(s ?? "").toLowerCase().replace(/[_-]/g," ").replace(/\s+/g," ").trim();
const threshold = cap => {
  const n = Number(cap || 0);
  return {v80:Math.ceil(n*.8), v90:Math.ceil(n*.9), v120:Math.ceil(n*1.2)};
};

function initStats(){
  $("statRoutes").textContent = fmt(routeData.length);
  $("statVC").textContent = fmt(vcData.length);
  $("statTruck").textContent = fmt(trucks.length);
  $("statHub").textContent = fmt(new Set(routeData.flatMap(r => [r.origin,r.destination]).filter(Boolean)).size || hubs.length);
}

let routeScope = "origin", activeTruck = "", routeLimit = 250;
function statusClass(r){
  const s = String(r.status || r.source || "");
  if(r.detailOnly || s.includes("Detail เท่านั้น")) return "detail";
  if(s.includes("มีทั้ง")) return "both";
  return "master";
}
function statusBadge(r){ return `<span class="badge ${statusClass(r)}">${esc(r.status || r.source || "-")}</span>`; }
function capBlock(r){ return `<div class="cap-combo"><strong>${fmt(r.cap)}</strong><small>กลาง: ${fmt(r.capMaster)} / Detail: ${fmt(r.capDetail)}</small></div>`; }
function thresholdLine(label, cap, cls=""){
  if(cap===null || cap===undefined || cap==="") return "";
  const t = threshold(cap);
  return `<div class="threshold-line ${cls}"><em>${label}</em><span><b>80%</b>${fmt(t.v80)}</span><span><b>90%</b>${fmt(t.v90)}</span><span><b>120%</b>${fmt(t.v120)}</span></div>`;
}
function thresholdBlock(r){
  let html = `<div class="thresholds">${thresholdLine(r.capMaster ? "กลาง/ใช้" : "ใช้", r.cap)}`;
  if(r.capDetail) html += thresholdLine("Detail", r.capDetail, "detail");
  return html + `</div>`;
}
function routeScopeText(r){
  if(routeScope==="origin") return r.origin;
  if(routeScope==="destination") return r.destination;
  if(routeScope==="truck") return r.truck;
  return [r.origin,r.destination,r.truck,r.cap,r.capMaster,r.capDetail,r.status,r.source,r.destType].join(" ");
}
function filteredRoutes(){
  const q = norm($("routeSearchInput").value);
  return routeData.filter(r => {
    if(activeTruck && r.truck !== activeTruck) return false;
    if(!q) return true;
    return norm(routeScopeText(r)).includes(q);
  });
}
function renderRoutes(reset=false){
  if(reset) routeLimit = 250;
  const all = filteredRoutes();
  const isFiltered = !!($("routeSearchInput").value.trim() || activeTruck);
  const limit = (isFiltered && all.length <= 1000) ? all.length : routeLimit;
  const show = all.slice(0, limit);
  $("routeRows").innerHTML = show.length ? show.map(r => `<tr>
    <td>${esc(r.origin)}</td><td>${esc(r.destination)}</td><td>${statusBadge(r)}</td><td class="num">${esc(r.truck)}</td><td>${capBlock(r)}</td><td>${thresholdBlock(r)}</td>
  </tr>`).join("") : `<tr><td colspan="6">ไม่พบข้อมูล</td></tr>`;
  $("routeCards").innerHTML = show.length ? show.map(r => {
    const mainT = threshold(r.cap);
    const detailT = r.capDetail ? threshold(r.capDetail) : null;
    return `<article class="route-card">
      <div class="route-top"><span class="truck-tag">${esc(r.truck)}</span><strong>Cap ${fmt(r.cap)} ชิ้น</strong></div>
      <h3>${esc(r.origin)} → ${esc(r.destination)}</h3>
      <div class="group-title">ค่ากลาง/ใช้</div>
      <div class="cap-tags"><span>กลาง: ${fmt(r.capMaster)}</span><span>80%: ${fmt(mainT.v80)}</span><span>90%: ${fmt(mainT.v90)}</span><span>120%: ${fmt(mainT.v120)}</span></div>
      ${detailT ? `<div class="group-title detail">Detail</div><div class="cap-tags detail"><span>Detail: ${fmt(r.capDetail)}</span><span>80%: ${fmt(detailT.v80)}</span><span>90%: ${fmt(detailT.v90)}</span><span>120%: ${fmt(detailT.v120)}</span></div>` : ""}
      <div class="status-line"><b>สถานะ:</b> ${esc(r.status || "-")} / <b>ประเภทปลายทาง:</b> ${esc(r.destType || "-")}</div>
    </article>`;
  }).join("") : `<div class="route-card">ไม่พบข้อมูล</div>`;
  $("routeResultText").innerHTML = `แสดง <strong>${fmt(show.length)}</strong> จาก ${fmt(all.length)} รายการ`;
  $("routePagerText").textContent = `แสดงแล้ว ${fmt(show.length)} จาก ${fmt(all.length)} รายการ`;
  $("routeMoreBtn").disabled = show.length >= all.length;
  $("routeMoreBtn").textContent = show.length >= all.length ? "แสดงครบแล้ว" : `แสดงเพิ่มอีก ${fmt(Math.min(250, all.length-show.length))} รายการ`;
}
function initRoutes(){
  const chips = [`<button class="chip active" data-truck="">ทั้งหมด</button>`].concat(trucks.map(t => `<button class="chip" data-truck="${esc(t)}">${esc(t)}</button>`));
  $("truckChips").innerHTML = chips.join("");
  document.querySelectorAll("[data-scope]").forEach(b => b.onclick = () => {
    routeScope = b.dataset.scope;
    document.querySelectorAll("[data-scope]").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    renderRoutes(true);
  });
  document.querySelectorAll("[data-truck]").forEach(b => b.onclick = () => {
    activeTruck = b.dataset.truck || "";
    document.querySelectorAll("[data-truck]").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    renderRoutes(true);
  });
  $("routeSearchInput").oninput = () => renderRoutes(true);
  $("routeSearchBtn").onclick = () => renderRoutes(true);
  $("routeClearBtn").onclick = () => { $("routeSearchInput").value=""; activeTruck=""; document.querySelectorAll("[data-truck]").forEach((x,i)=>x.classList.toggle("active",i===0)); renderRoutes(true); };
  $("routeMoreBtn").onclick = () => { routeLimit += 250; renderRoutes(false); };
  renderRoutes(true);
}

function renderVC(){
  const q = norm($("vcSearchInput").value);
  const filtered = q ? vcData.filter(r => norm([r.originType,r.destType,r.condition,...trucks,Object.values(r.caps||{})].join(" ")).includes(q)) : vcData;
  $("vcHead").innerHTML = `<tr><th>ประเภทต้นทาง</th><th>ประเภทปลายทาง</th><th>เงื่อนไข</th>${trucks.map(t=>`<th>${esc(t)}</th>`).join("")}</tr>`;
  $("vcRows").innerHTML = filtered.length ? filtered.map(r => `<tr><td>${esc(r.originType)}</td><td>${esc(r.destType)}</td><td>${esc(r.condition)}</td>${trucks.map(t=>`<td class="num">${fmt((r.caps||{})[t])}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${3+trucks.length}">ไม่พบข้อมูล</td></tr>`;
  $("vcCards").innerHTML = filtered.length ? filtered.map(r => `<article class="vc-card"><h3>${esc(r.originType)} → ${esc(r.destType)}</h3><p>${esc(r.condition)}</p><div class="vc-tags">${trucks.map(t=>`<span>${esc(t)}: ${fmt((r.caps||{})[t])}</span>`).join("")}</div></article>`).join("") : `<div class="vc-card">ไม่พบข้อมูล</div>`;
  $("vcResultText").innerHTML = q ? `ค้นหา <strong>${esc($("vcSearchInput").value)}</strong> / พบ <strong>${fmt(filtered.length)}</strong> รายการ` : `แสดงข้อมูลตาราง Capacity กลาง <strong>${fmt(filtered.length)}</strong> รายการ`;
}
function initVC(){
  $("vcSearchInput").oninput = renderVC;
  $("vcSearchBtn").onclick = renderVC;
  $("vcClearBtn").onclick = () => { $("vcSearchInput").value=""; renderVC(); };
  renderVC();
}

let loadMode = "route";
function fillSelect(el, values, placeholder="เลือกข้อมูล"){
  el.innerHTML = `<option value="">${placeholder}</option>` + values.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
}
function initLoad(){
  fillSelect($("loadTruck"), trucks, "เลือกขนาดรถ");
  fillSelect($("loadOrigin"), [...new Set(routeData.map(r=>r.origin).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"th")), "เลือกต้นทาง");
  fillSelect($("centralCondition"), vcData.map((r,i)=>`${i}|||${r.condition}`), "เลือกเงื่อนไข");
  document.querySelectorAll(".tab").forEach(t => t.onclick = () => {
    loadMode = t.dataset.mode;
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active")); t.classList.add("active");
    document.querySelectorAll(".route-mode").forEach(x=>x.classList.toggle("hidden", loadMode!=="route"));
    document.querySelectorAll(".central-mode").forEach(x=>x.classList.toggle("hidden", loadMode!=="central"));
    updateLoadOptions();
  });
  ["loadOrigin","loadDestination","loadTruck","loadActual","centralCondition"].forEach(id => $(id).oninput = updateLoadOptions);
  $("loadOrigin").onchange = () => {
    const dests = [...new Set(routeData.filter(r=>r.origin===$("loadOrigin").value).map(r=>r.destination))].sort((a,b)=>a.localeCompare(b,"th"));
    fillSelect($("loadDestination"), dests, "เลือกปลายทาง");
    updateLoadOptions();
  };
  updateLoadOptions();
}
function updateLoadOptions(){
  let cap = 0;
  const truck = $("loadTruck").value;
  if(loadMode==="route"){
    const match = routeData.find(r => r.origin===$("loadOrigin").value && r.destination===$("loadDestination").value && r.truck===truck);
    cap = Number(match?.cap || 0);
  }else{
    const idx = String($("centralCondition").value).split("|||")[0];
    const row = vcData[Number(idx)];
    cap = Number(row?.caps?.[truck] || 0);
  }
  $("loadCapacity").value = cap ? fmt(cap) : "0";
  const t = threshold(cap);
  $("load80").textContent = fmt(t.v80) + " ชิ้น";
  $("load90").textContent = fmt(t.v90) + " ชิ้น";
  $("load120").textContent = fmt(t.v120) + " ชิ้น";
  const actual = Number($("loadActual").value || 0);
  const pct = cap ? (actual/cap*100) : 0;
  $("loadPercent").textContent = pct.toFixed(1) + "%";
  $("loadAdvice").textContent = !cap ? "เลือกข้อมูลเพื่อเริ่มคำนวณ" : pct>=120 ? "ถึงเกณฑ์ 120% สำหรับรางวัล" : pct>=90 ? "ผ่านเกณฑ์ 90%" : pct>=80 ? "ผ่านเกณฑ์ 80%" : "ยังต่ำกว่าเกณฑ์ 80%";
}

function calcPenalty(){
  let p=0, r=0;
  document.querySelectorAll("#calculator input[data-kind][data-rate]").forEach(input => {
    const qty = Math.max(0, Number(input.value||0));
    const amount = qty * Number(input.dataset.rate||0);
    if(input.dataset.kind==="reward") r += amount; else p += amount;
  });
  const net = Math.max(0, p-r);
  $("penaltyTotal").textContent = baht(p);
  $("rewardTotal").textContent = baht(r);
  $("netTotal").textContent = baht(net);
  $("amShare").textContent = baht(net*.5);
  $("mgShare").textContent = baht(net*.3);
  $("dmShare").textContent = baht(net*.2);
}
function initCalc(){
  document.querySelectorAll("#calculator input[data-kind][data-rate]").forEach(i => {
    i.addEventListener("input", calcPenalty);
    i.addEventListener("change", calcPenalty);
  });
  calcPenalty();
}

function initToolbar(){
  $("printBtn").onclick = () => window.print();
  $("fullBtn").onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
  $("shareBtn").onclick = async () => { try { await navigator.clipboard.writeText(location.href.split("#")[0]); alert("คัดลอกลิงก์แล้ว"); } catch(e) {} };
}


window.vehicleSlaReloadData = function(nextData){
  if(!nextData) return;
  routeData = Array.isArray(nextData.routeCapacityData) ? nextData.routeCapacityData : routeData;
  vcData = Array.isArray(nextData.vehicleCapacityData) ? nextData.vehicleCapacityData : vcData;
  trucks = Array.isArray(nextData.vehicleCapacityTrucks) && nextData.vehicleCapacityTrucks.length ? nextData.vehicleCapacityTrucks : trucks;
  hubs = Array.isArray(nextData.hubMasterData) ? nextData.hubMasterData : hubs;
  try{
    initStats();
    initRoutes();
    initLoad();
    initVC();
    initCalc();
  }catch(e){
    console.warn("Reload data failed", e);
  }
};


document.addEventListener("DOMContentLoaded", () => {
  initStats();
  initToolbar();
  initRoutes();
  initLoad();
  initVC();
  initCalc();
});
