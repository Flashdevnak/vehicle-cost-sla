(function () {
  const ROUTE_PAGE_SIZE = 250;
  const MOBILE_ROUTE_PAGE_SIZE = 80;
  const SHOW_ALL_LIMIT = 1000;
  const state = {
    routeLimit: ROUTE_PAGE_SIZE,
    routeSearchScope: "origin",
    routeTruck: "",
    loadMode: "route"
  };

  const $ = (id) => document.getElementById(id);
  const data = () => ({
    routes: window.routeCapacityData || [],
    vehicle: window.vehicleCapacityData || [],
    trucks: window.vehicleCapacityTrucks || [],
    hubs: window.hubMasterData || []
  });
  const fmt = (value, digits = 0) => {
    if (value === null || value === undefined || value === "") return "-";
    const n = Number(value);
    if (!Number.isFinite(n)) return "-";
    return new Intl.NumberFormat("th-TH", { maximumFractionDigits: digits }).format(n);
  };
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
  const norm = (value) => String(value ?? "").toLowerCase().replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();
  const uniq = (items) => [...new Set(items.filter((item) => item !== null && item !== undefined && item !== ""))];
  const optionHtml = (value, label = value) => `<option value="${esc(value)}">${esc(label)}</option>`;
  const isMobile = () => window.matchMedia && window.matchMedia("(max-width: 899px)").matches;
  const pageSize = () => isMobile() ? MOBILE_ROUTE_PAGE_SIZE : ROUTE_PAGE_SIZE;

  function statusLabel(row) {
    return row.status || row.source || "-";
  }

  function statusClass(row) {
    const label = String(statusLabel(row));
    if (row.detailOnly || label.includes("Detail เท่านั้น")) return "detail";
    if (label.includes("มีทั้ง")) return "both";
    return "master";
  }

  function badge(row) {
    return `<span class="route-source-badge ${statusClass(row)}">${esc(statusLabel(row))}</span>`;
  }

  function threshold(cap) {
    const n = Number(cap);
    if (!Number.isFinite(n) || n <= 0) return { v80: 0, v90: 0, v120: 0 };
    return { v80: Math.ceil(n * 0.8), v90: Math.ceil(n * 0.9), v120: Math.ceil(n * 1.2) };
  }

  function thresholdLine(label, values, className) {
    if (!values) return "";
    return `<div class="threshold-line ${className}"><em>${esc(label)}</em><span><b>80%</b>${fmt(values.v80)}</span><span><b>90%</b>${fmt(values.v90)}</span><span><b>120%</b>${fmt(values.v120)}</span></div>`;
  }

  function thresholdCell(row) {
    const main = {
      v80: Number(row.load80) || threshold(row.cap).v80,
      v90: Number(row.load90) || threshold(row.cap).v90,
      v120: Number(row.load120) || threshold(row.cap).v120
    };
    const detail = row.capDetail ? threshold(row.capDetail) : null;
    return `<div class="thresholds-dual">${thresholdLine("กลาง/ใช้", main, "main-threshold")}${thresholdLine("Detail", detail, "detail-threshold")}</div>`;
  }

  function detailThresholdText(row) {
    if (!row.capDetail) return "";
    const t = threshold(row.capDetail);
    return `<div class="route-card-group route-card-group-detail"><div class="route-card-group-title">Detail</div><div class="route-cap-tags route-cap-tags-detail"><span>Detail: ${fmt(row.capDetail)}</span><span>80%: ${fmt(t.v80)}</span><span>90%: ${fmt(t.v90)}</span><span>120%: ${fmt(t.v120)}</span></div></div>`;
  }

  function ensureRoutePager() {
    const filter = document.querySelector("#route-capacity .capacity-filter");
    if (!filter || $("routePager")) return;
    const note = document.createElement("div");
    note.className = "route-search-rule";
    note.textContent = "ค้นหาแล้วเจอไม่เกิน 1,000 รายการจะแสดงครบ ถ้ามากกว่านั้นจะแบ่งแสดงเพิ่มเพื่อป้องกันเว็บค้าง";
    filter.appendChild(note);
    const pager = document.createElement("div");
    pager.className = "route-pager";
    pager.id = "routePager";
    pager.innerHTML = '<div class="route-pager-info" id="routePagerInfo">พร้อมแสดงข้อมูล</div><button type="button" class="route-load-more" id="routeLoadMoreBtn">แสดงเพิ่ม</button>';
    filter.insertAdjacentElement("afterend", pager);
    $("routeLoadMoreBtn")?.addEventListener("click", () => {
      state.routeLimit += pageSize();
      renderRoutes(false);
    });
  }

  function filteredRoutes() {
    const { routes } = data();
    const query = norm($("routeSearchInput")?.value || "");
    return routes.filter((row) => {
      const truckOk = !state.routeTruck || row.truck === state.routeTruck;
      if (!truckOk) return false;
      if (!query) return true;
      if (state.routeSearchScope === "origin") return norm(row.origin).includes(query);
      if (state.routeSearchScope === "destination") return norm(row.destination).includes(query);
      if (state.routeSearchScope === "truck") return norm(row.truck).includes(query);
      return [row.origin, row.destination, row.truck, row.originBranchType, row.originHubType, row.destType, row.destHubType, row.status, row.source].some((value) => norm(value).includes(query));
    });
  }

  function renderRoutes(reset = true) {
    ensureRoutePager();
    const routes = filteredRoutes();
    if (reset) state.routeLimit = pageSize();
    const hasFilter = Boolean(($("routeSearchInput")?.value || "").trim()) || Boolean(state.routeTruck);
    const limit = hasFilter && routes.length <= SHOW_ALL_LIMIT ? routes.length : state.routeLimit;
    const rowsToShow = routes.slice(0, limit);
    const rows = $("routeCapacityRows");
    const cards = $("routeCapacityCards");
    if (rows) {
      rows.innerHTML = rowsToShow.length ? rowsToShow.map((row) => `<tr><td class="col-origin">${esc(row.origin)}</td><td class="col-destination">${esc(row.destination)}</td><td class="col-status">${badge(row)}</td><td class="col-truck">${esc(row.truck)}</td><td class="col-capcombo"><div class="cap-combo"><strong>${fmt(row.cap)}</strong><small>กลาง: ${fmt(row.capMaster)} / Detail: ${fmt(row.capDetail)}</small></div></td><td class="col-thresholds">${thresholdCell(row)}</td></tr>`).join("") : '<tr><td colspan="6" class="route-empty">ไม่พบข้อมูลตามคำค้นหา</td></tr>';
    }
    if (cards) {
      cards.innerHTML = rowsToShow.length ? rowsToShow.map((row) => `<article class="route-card-mini"><div class="route-card-top"><span>${esc(row.truck)}</span><strong>Cap ${fmt(row.cap)} ชิ้น</strong></div><h3>${esc(row.origin)} → ${esc(row.destination)}</h3><div class="route-card-group route-card-group-main"><div class="route-card-group-title">ค่ากลาง</div><div class="route-cap-tags route-cap-tags-main"><span>กลาง: ${fmt(row.capMaster)}</span><span>80%: ${fmt(row.load80)}</span><span>90%: ${fmt(row.load90)}</span><span>120%: ${fmt(row.load120)}</span></div></div>${detailThresholdText(row)}<div class="route-card-status"><b>สถานะ:</b> ${esc(statusLabel(row))} / <b>ประเภทปลายทาง:</b> ${esc(row.destType || "-")}</div></article>`).join("") : '<div class="route-empty">ไม่พบข้อมูลตามคำค้นหา</div>';
    }
    const scopeText = state.routeSearchScope === "origin" ? "จุดเริ่มต้น" : state.routeSearchScope === "destination" ? "จุดสิ้นสุด" : state.routeSearchScope === "truck" ? "ประเภทรถ" : "ทั้งหมด";
    if ($("routeResultText")) $("routeResultText").innerHTML = `ค้นจาก <strong>${scopeText}</strong> / แสดง <strong>${fmt(rowsToShow.length)}</strong> จาก ${fmt(routes.length)} รายการ`;
    if ($("routePagerInfo")) $("routePagerInfo").textContent = `แสดงแล้ว ${fmt(rowsToShow.length)} จาก ${fmt(routes.length)} รายการที่ค้นพบ`;
    if ($("routeLoadMoreBtn")) {
      $("routeLoadMoreBtn").disabled = rowsToShow.length >= routes.length;
      $("routeLoadMoreBtn").textContent = rowsToShow.length >= routes.length ? "แสดงครบแล้ว" : `แสดงเพิ่มอีก ${fmt(Math.min(pageSize(), routes.length - rowsToShow.length))} รายการ`;
    }
  }

  function renderVehicleCapacity() {
    const { vehicle, trucks } = data();
    const query = norm($("vcSearchInput")?.value || "");
    const list = vehicle.filter((row) => {
      if (!query) return true;
      return [row.originType, row.destType, row.condition, ...trucks, ...trucks.map((truck) => row.caps?.[truck])].some((value) => norm(value).includes(query));
    });
    if ($("vcCapacityRows")) {
      $("vcCapacityRows").innerHTML = list.length ? list.map((row) => `<tr><td>${esc(row.originType)}</td><td>${esc(row.destType)}</td><td>${esc(row.condition)}</td>${trucks.map((truck) => `<td class="num">${fmt(row.caps?.[truck] ?? 0)}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${trucks.length + 3}" class="vc-empty">ไม่พบข้อมูลตามคำค้นหา</td></tr>`;
    }
    if ($("vcCapacityCards")) {
      $("vcCapacityCards").innerHTML = list.length ? list.map((row) => `<article class="route-card-mini"><div class="route-card-top"><span>${esc(row.destType)}</span><strong>${esc(row.originType)}</strong></div><h3>${esc(row.condition)}</h3><div class="capacity-mini-table"><div class="capacity-mini-head"><div>รถ</div><div>Capacity</div></div>${trucks.map((truck) => `<div class="capacity-mini-row"><div class="truck-name">${esc(truck)}</div><div><span class="cap-value">${fmt(row.caps?.[truck] ?? 0)}</span><span class="cap-unit">ชิ้น</span></div></div>`).join("")}</div></article>`).join("") : '<div class="vc-empty">ไม่พบข้อมูลตามคำค้นหา</div>';
    }
    if ($("vcResultText")) $("vcResultText").innerHTML = `แสดง <strong>${fmt(list.length)}</strong> จาก ${fmt(vehicle.length)} เงื่อนไข`;
  }

  function setOptions(select, values, placeholder) {
    if (!select) return;
    select.innerHTML = (placeholder ? optionHtml("", placeholder) : "") + values.map((value) => optionHtml(value)).join("");
  }

  function selectedRouteRows() {
    const { routes } = data();
    const origin = $("calcOriginSelect")?.value || "";
    const destination = $("calcDestinationSelect")?.value || "";
    return routes.filter((row) => row.origin === origin && row.destination === destination);
  }

  function selectedRoute() {
    const truck = $("calcTruckSelect")?.value || "";
    return selectedRouteRows().find((row) => row.truck === truck) || null;
  }

  function selectedMaster() {
    const origin = $("masterOriginHubSelect")?.value || "";
    const destType = $("masterDestTypeSelect")?.value || "";
    const truck = $("masterTruckSelect")?.value || "";
    const row = data().vehicle.find((item) => item.originType === origin && item.destType === destType);
    if (!row || !truck) return null;
    return { row, truck, cap: Number(row.caps?.[truck] || 0) };
  }

  function ensureDetailPanel() {
    if ($("loadDetailPanel")) return;
    const wrapper = document.querySelector("#load-tool .section-body");
    if (!wrapper) return;
    const panel = document.createElement("div");
    panel.id = "loadDetailPanel";
    panel.className = "calc-detail-panel";
    panel.innerHTML = '<h3>รายละเอียดการคำนวณ</h3><div class="calc-detail-grid" id="loadDetailGrid"></div><div class="note" id="loadDetailNote">เลือกข้อมูลเพื่อดูรายละเอียด</div>';
    wrapper.appendChild(panel);
  }

  function renderLoadDetail(info) {
    ensureDetailPanel();
    const grid = $("loadDetailGrid");
    if (!grid) return;
    const items = [
      ["ต้นทางที่เลือก", info.origin || "-"],
      ["ปลายทางที่เลือก", info.destination || "-"],
      ["เงื่อนไข/ประเภทปลายทาง", info.condition || info.destType || "-"],
      ["ประเภทรถ", info.truck || "-"],
      ["แหล่ง Capacity", info.source || "-"],
      ["Capacity 100%", `${fmt(info.cap)} ชิ้น`],
      ["จำนวนโหลดจริง", `${fmt(info.actual)} ชิ้น`],
      ["อัตราบรรทุก", info.cap ? `${fmt(info.rate, 1)}%` : "-"],
      ["เกณฑ์ 80%", `${fmt(info.t.v80)} ชิ้น`],
      ["เกณฑ์ 90%", `${fmt(info.t.v90)} ชิ้น`],
      ["เกณฑ์ 120%", `${fmt(info.t.v120)} ชิ้น`],
      ["คำแนะนำ", info.remark || "-"],
      ["Cap กลาง", `${fmt(info.capMaster)} ชิ้น`],
      ["Cap Detail", `${fmt(info.capDetail)} ชิ้น`],
      ["สถานะเส้นทาง", info.status || "-"],
      ["ประเภทปลายทาง", info.destType || "-"]
    ];
    grid.innerHTML = items.map(([label, value]) => `<div class="calc-detail-item"><small>${esc(label)}</small><strong>${esc(value)}</strong></div>`).join("");
    if ($("loadDetailNote")) $("loadDetailNote").textContent = "Cap ที่ใช้ยึดตามค่า Capacity 100% ของรายการที่เลือก หากมี Cap Detail จะแสดงประกอบเพื่อให้ตรวจสอบกับข้อมูลเส้นทางจริง";
  }

  function updateLoadCalculator() {
    const mode = state.loadMode;
    let info = {
      origin: "",
      destination: "",
      condition: "",
      destType: "",
      truck: "",
      source: "",
      cap: 0,
      capMaster: null,
      capDetail: null,
      status: "",
      actual: Number($("actualInput")?.value || 0),
      t: threshold(0),
      rate: 0,
      remark: "เลือกข้อมูลเพื่อเริ่มคำนวณ"
    };
    if (mode === "route") {
      const row = selectedRoute();
      if (row) {
        info = {
          ...info,
          origin: row.origin,
          destination: row.destination,
          condition: `${row.origin} → ${row.destination}`,
          destType: row.destType,
          truck: row.truck,
          source: row.source || "routeCapacityData",
          cap: Number(row.cap || 0),
          capMaster: row.capMaster,
          capDetail: row.capDetail,
          status: row.status || "",
          t: { v80: Number(row.load80) || threshold(row.cap).v80, v90: Number(row.load90) || threshold(row.cap).v90, v120: Number(row.load120) || threshold(row.cap).v120 }
        };
      }
    } else {
      const selected = selectedMaster();
      if (selected) {
        info = {
          ...info,
          origin: selected.row.originType,
          destination: selected.row.destType,
          condition: selected.row.condition,
          destType: selected.row.destType,
          truck: selected.truck,
          source: "vehicleCapacityData",
          cap: selected.cap,
          capMaster: selected.cap,
          status: "ค่ากลาง",
          t: threshold(selected.cap)
        };
      }
    }
    info.rate = info.cap > 0 ? (info.actual / info.cap) * 100 : 0;
    info.remark = info.cap <= 0 ? "เลือกข้อมูลเพื่อเริ่มคำนวณ" : info.rate < 80 ? "ต่ำกว่า 80% ควรพิจารณารวมโหลดหรือปรับขนาดรถ" : info.rate < 90 ? "ผ่านขั้นต่ำ 80% แต่ยังต่ำกว่าเป้าหมาย 90%" : info.rate <= 120 ? "อยู่ในช่วงเหมาะสม" : "เกิน 120% โปรดตรวจสอบความปลอดภัยและเงื่อนไขรางวัล";
    if ($("capInput")) $("capInput").value = info.cap || 0;
    if ($("min80")) $("min80").textContent = `${fmt(info.t.v80)} ชิ้น`;
    if ($("min90")) $("min90").textContent = `${fmt(info.t.v90)} ชิ้น`;
    if ($("min120")) $("min120").textContent = `${fmt(info.t.v120)} ชิ้น`;
    if ($("loadRate")) $("loadRate").textContent = `${fmt(info.rate, 1)}%`;
    if ($("loadRemark")) $("loadRemark").textContent = info.remark;
    if ($("selectedRouteText")) $("selectedRouteText").textContent = info.cap ? `${info.condition} / ${info.truck} / Cap ${fmt(info.cap)} ชิ้น` : "ยังไม่ได้เลือกข้อมูล";
    renderLoadDetail(info);
  }

  function populateRouteCalculator(changed) {
    const { routes, trucks } = data();
    const originSelect = $("calcOriginSelect");
    const destinationSelect = $("calcDestinationSelect");
    const truckSelect = $("calcTruckSelect");
    const previousOrigin = originSelect?.value;
    const previousDestination = destinationSelect?.value;
    const previousTruck = truckSelect?.value;
    if (!changed || changed === "all") {
      setOptions(originSelect, uniq(routes.map((row) => row.origin)).sort(), "เลือกต้นทาง");
      if (previousOrigin) originSelect.value = previousOrigin;
    }
    const origin = originSelect?.value || routes[0]?.origin || "";
    if (originSelect && !originSelect.value) originSelect.value = origin;
    const destinationRows = routes.filter((row) => row.origin === origin);
    setOptions(destinationSelect, uniq(destinationRows.map((row) => row.destination)).sort(), "เลือกปลายทาง");
    if (previousDestination && [...destinationSelect.options].some((opt) => opt.value === previousDestination)) destinationSelect.value = previousDestination;
    if (!destinationSelect.value && destinationSelect.options.length > 1) destinationSelect.selectedIndex = 1;
    const routeRows = selectedRouteRows();
    setOptions(truckSelect, uniq(routeRows.map((row) => row.truck)).filter((truck) => trucks.includes(truck) || truck).sort((a, b) => trucks.indexOf(a) - trucks.indexOf(b)), "เลือกรถ");
    if (previousTruck && [...truckSelect.options].some((opt) => opt.value === previousTruck)) truckSelect.value = previousTruck;
    if (!truckSelect.value && truckSelect.options.length > 1) truckSelect.selectedIndex = 1;
  }

  function populateMasterCalculator(changed) {
    const { vehicle, trucks } = data();
    const originSelect = $("masterOriginHubSelect");
    const destSelect = $("masterDestTypeSelect");
    const truckSelect = $("masterTruckSelect");
    const previousOrigin = originSelect?.value;
    const previousDest = destSelect?.value;
    const previousTruck = truckSelect?.value;
    if (!changed || changed === "all") {
      setOptions(originSelect, uniq(vehicle.map((row) => row.originType)).sort(), "เลือกต้นทาง HUB");
      if (previousOrigin) originSelect.value = previousOrigin;
      if (!originSelect.value && originSelect.options.length > 1) originSelect.selectedIndex = 1;
    }
    const origin = originSelect?.value || "";
    setOptions(destSelect, uniq(vehicle.filter((row) => row.originType === origin).map((row) => row.destType)).sort(), "เลือกประเภทปลายทาง");
    if (previousDest && [...destSelect.options].some((opt) => opt.value === previousDest)) destSelect.value = previousDest;
    if (!destSelect.value && destSelect.options.length > 1) destSelect.selectedIndex = 1;
    setOptions(truckSelect, trucks, "เลือกรถ");
    if (previousTruck && [...truckSelect.options].some((opt) => opt.value === previousTruck)) truckSelect.value = previousTruck;
    if (!truckSelect.value && truckSelect.options.length > 1) truckSelect.selectedIndex = 1;
  }

  function renderOverviewCounts() {
    const { routes, vehicle, trucks, hubs } = data();
    const routeMetrics = document.querySelectorAll("#route-capacity .capacity-metrics .metric strong");
    if (routeMetrics.length >= 4) {
      routeMetrics[0].textContent = fmt(routes.length);
      routeMetrics[1].textContent = fmt(routes.filter((row) => statusClass(row) === "master").length);
      routeMetrics[2].textContent = fmt(routes.filter((row) => statusClass(row) === "both").length);
      routeMetrics[3].textContent = fmt(routes.filter((row) => statusClass(row) === "detail").length);
    }
    const vcMetrics = document.querySelectorAll("#vehicle-capacity .capacity-metrics .metric strong");
    if (vcMetrics.length >= 4) {
      vcMetrics[0].textContent = fmt(vehicle.length);
      vcMetrics[1].textContent = fmt(trucks.length);
      vcMetrics[2].textContent = fmt(uniq(vehicle.map((row) => row.originType)).length);
      vcMetrics[3].textContent = fmt(uniq(vehicle.map((row) => row.destType)).length);
    }
    window.VEHICLE_SLA_DATA = { routeCapacityData: routes, vehicleCapacityData: vehicle, vehicleCapacityTrucks: trucks, hubMasterData: hubs };
  }

  function calculatePenaltyReward() {
    let penalty = 0;
    let reward = 0;
    document.querySelectorAll("#calculator input[data-kind][data-rate]").forEach((input) => {
      const amount = Number(input.value || 0) * Number(input.dataset.rate || 0);
      if (input.dataset.kind === "reward") reward += amount;
      else penalty += amount;
    });
    const net = Math.max(0, penalty - reward);
    if ($("penaltyTotal")) $("penaltyTotal").textContent = `${fmt(penalty)} บาท`;
    if ($("rewardTotal")) $("rewardTotal").textContent = `${fmt(reward)} บาท`;
    if ($("netTotal")) $("netTotal").textContent = `${fmt(net)} บาท`;
    if ($("amShare")) $("amShare").textContent = `${fmt(net * 0.5)} บาท`;
    if ($("mgShare")) $("mgShare").textContent = `${fmt(net * 0.3)} บาท`;
    if ($("dmShare")) $("dmShare").textContent = `${fmt(net * 0.2)} บาท`;
  }

  function bindEvents() {
    $("routeSearchBtn")?.addEventListener("click", () => renderRoutes(true));
    $("routeSearchInput")?.addEventListener("input", () => renderRoutes(true));
    $("routeClearBtn")?.addEventListener("click", () => {
      if ($("routeSearchInput")) $("routeSearchInput").value = "";
      state.routeTruck = "";
      document.querySelectorAll("#route-capacity .truck-chip").forEach((btn) => btn.classList.toggle("active", !btn.dataset.truck));
      renderRoutes(true);
    });
    document.querySelectorAll("#route-capacity .scope-btn").forEach((btn) => btn.addEventListener("click", () => {
      state.routeSearchScope = btn.dataset.scope || "origin";
      document.querySelectorAll("#route-capacity .scope-btn").forEach((item) => item.classList.toggle("active", item === btn));
      renderRoutes(true);
    }));
    document.querySelectorAll("#route-capacity .truck-chip").forEach((btn) => btn.addEventListener("click", () => {
      state.routeTruck = btn.dataset.truck || "";
      document.querySelectorAll("#route-capacity .truck-chip").forEach((item) => item.classList.toggle("active", item === btn));
      renderRoutes(true);
    }));
    $("vcSearchBtn")?.addEventListener("click", renderVehicleCapacity);
    $("vcSearchInput")?.addEventListener("input", renderVehicleCapacity);
    $("vcClearBtn")?.addEventListener("click", () => {
      if ($("vcSearchInput")) $("vcSearchInput").value = "";
      renderVehicleCapacity();
    });
    document.querySelectorAll(".calc-mode").forEach((btn) => btn.addEventListener("click", () => {
      state.loadMode = btn.dataset.mode || "route";
      document.querySelectorAll(".calc-mode").forEach((item) => item.classList.toggle("active", item === btn));
      $("routeCalcPanel")?.classList.toggle("active", state.loadMode === "route");
      $("masterCalcPanel")?.classList.toggle("active", state.loadMode === "master");
      updateLoadCalculator();
    }));
    $("calcOriginSelect")?.addEventListener("change", () => { populateRouteCalculator("origin"); updateLoadCalculator(); });
    $("calcDestinationSelect")?.addEventListener("change", () => { populateRouteCalculator("destination"); updateLoadCalculator(); });
    $("calcTruckSelect")?.addEventListener("change", updateLoadCalculator);
    $("masterOriginHubSelect")?.addEventListener("change", () => { populateMasterCalculator("origin"); updateLoadCalculator(); });
    $("masterDestTypeSelect")?.addEventListener("change", updateLoadCalculator);
    $("masterTruckSelect")?.addEventListener("change", updateLoadCalculator);
    $("actualInput")?.addEventListener("input", updateLoadCalculator);
    document.querySelectorAll("#calculator input[data-kind][data-rate]").forEach((input) => {
      input.addEventListener("input", calculatePenaltyReward);
      input.addEventListener("change", calculatePenaltyReward);
    });
    $("printBtn")?.addEventListener("click", () => window.print());
    $("shareBtn")?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(location.href.split("#")[0]);
        if ($("shareStatus")) $("shareStatus").textContent = "คัดลอกลิงก์แล้ว";
      } catch (error) {
        if ($("shareStatus")) $("shareStatus").textContent = "คัดลอกลิงก์ไม่สำเร็จ";
      }
    });
    $("fullBtn")?.addEventListener("click", () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen?.();
    });
  }

  function refreshAll() {
    renderOverviewCounts();
    renderRoutes(true);
    renderVehicleCapacity();
    populateRouteCalculator("all");
    populateMasterCalculator("all");
    updateLoadCalculator();
    calculatePenaltyReward();
  }

  function init() {
    ensureDetailPanel();
    bindEvents();
    refreshAll();
  }

  window.VehicleSLA = {
    refreshAll,
    setFirebaseStatus(message) {
      if ($("firebaseStatus")) $("firebaseStatus").textContent = message;
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
