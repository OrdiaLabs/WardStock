const STORAGE_KEY = "wardstock.prototype.items.v2";
const LOAN_STORAGE_KEY = "wardstock.prototype.loanRecords.v1";
const CATEGORY_STORAGE_KEY = "wardstock.prototype.categories.v1";

const APP_INFO = {
  name: "WardStock",
  tagline: "Visual Equipment Tracking for Hospital Wards",
  version: "1.0.0",
  copyright: "© 2026 Shoma Okano",
  rights: "All Rights Reserved",
  releaseNotes: [],
};

const defaultCategories = [
  { id: "wheelchair", label: "車椅子", prefix: "WC", icon: "車", color: "#14B8A6", system: true },
  { id: "cushion", label: "クッション", prefix: "CU", icon: "ク", color: "#0F766E", system: true },
  { id: "walker", label: "歩行器", prefix: "WK", icon: "歩", color: "#10B981", system: true },
  { id: "bestposi", label: "ベスポジ", prefix: "BP", icon: "BP", color: "#2DD4BF", system: true },
  { id: "pressure", label: "褥瘡物品", prefix: "PR", icon: "褥", color: "#115E59", system: true },
];
const uncategorizedCategory = { id: "uncategorized", label: "未分類", prefix: "UN", icon: "未", color: "#64748B", system: true, internal: true };
let categories = loadCategories();
saveCategories();

const statuses = ["使用中", "未使用", "修理中", "貸出中"];

const rooms = [
  { number: 8, beds: 4, x: 42, y: 142, w: 218, h: 126 },
  { number: 9, beds: 1, x: 270, y: 142, w: 118, h: 126 },
  { number: 10, beds: 1, x: 398, y: 142, w: 118, h: 126 },
  { number: 11, beds: 2, x: 526, y: 142, w: 122, h: 126, split: "horizontal" },
  { number: 12, beds: 2, x: 658, y: 142, w: 122, h: 126, split: "horizontal" },
  { number: 13, beds: 4, x: 790, y: 142, w: 188, h: 126 },
  { number: 14, beds: 4, x: 988, y: 142, w: 188, h: 126 },
  { number: 15, beds: 4, x: 1186, y: 142, w: 188, h: 126 },
  { number: 16, beds: 4, x: 1384, y: 142, w: 188, h: 126 },
  { number: 7, beds: 1, x: 42, y: 420, w: 118, h: 104 },
  { number: 6, beds: 4, x: 170, y: 420, w: 202, h: 126 },
  { number: 5, beds: 4, x: 382, y: 420, w: 202, h: 126 },
  { number: 4, beds: 4, x: 594, y: 420, w: 202, h: 126 },
  { number: 3, beds: 4, x: 878, y: 420, w: 202, h: 126 },
  { number: 2, beds: 4, x: 1090, y: 420, w: 202, h: 126 },
  { number: 1, beds: 4, x: 1302, y: 420, w: 202, h: 126 },
];

const areas = [
  { id: "rehab", label: "", x: 0, y: 130, w: 36, h: 150, className: "blank-area", droppable: false },
  { id: "station", label: "スタッフステーション", x: 610, y: 306, w: 530, h: 86, droppable: true },
  { id: "lounge", label: "", x: 805, y: 448, w: 54, h: 72, className: "blank-area", droppable: false },
  { id: "break", label: "休憩室", x: 1428, y: 318, w: 118, h: 64, droppable: false },
];

const initialItems = [
  item("WC-001", "wheelchair", "標準車椅子", "5病棟", "8-2", "使用中", "病棟共有"),
  item("WC-002", "wheelchair", "標準車椅子", "5病棟", "12-1", "使用中", ""),
  item("WC-003", "wheelchair", "リクライニング車椅子", "5病棟", "2-1", "使用中", "予備"),
  item("WC-004", "wheelchair", "標準車椅子", "5病棟", "3病棟", "貸出中", "他病棟へ貸出中"),
  item("WC-005", "wheelchair", "小型車椅子", "5病棟", "16-2", "使用中", ""),
  item("CU-001", "cushion", "車椅子クッション", "5病棟", "8-2", "使用中", ""),
  item("CU-002", "cushion", "体位保持クッション", "5病棟", "13-4", "使用中", ""),
  item("CU-003", "cushion", "車椅子クッション", "5病棟", "unused", "未使用", ""),
  item("CU-004", "cushion", "円座クッション", "5病棟", "5-3", "使用中", ""),
  item("CU-005", "cushion", "体圧分散クッション", "5病棟", "station", "修理中", "カバー確認"),
  item("WK-001", "walker", "歩行器", "5病棟", "4-2", "使用中", ""),
  item("WK-002", "walker", "歩行器", "5病棟", "unused", "未使用", ""),
  item("WK-003", "walker", "歩行器", "5病棟", "2-1", "使用中", ""),
];

let items = loadItems();
items = normalizeItems(items);
saveItems();
let loanRecords = loadLoanRecords();
loanRecords = normalizeLoanRecords(loanRecords);
saveLoanRecords();
let activeFilter = "all";
let searchText = "";
let unusedOnly = false;
let pointerDrag = null;
let draggedBedLocation = null;
const suppressClickIds = new Set();

const wardMap = document.querySelector("#wardMap");
const itemList = document.querySelector("#itemList");
const paletteTitle = document.querySelector("#paletteTitle");
const categoryRibbon = document.querySelector("#categoryRibbon");
const categoryInput = document.querySelector("#categoryInput");
const locationInput = document.querySelector("#locationInput");
const idInput = document.querySelector("#idInput");
const itemModal = document.querySelector("#itemModal");
const categoryModal = document.querySelector("#categoryModal");
const detailModal = document.querySelector("#detailModal");
const ledgerModal = document.querySelector("#ledgerModal");
const aboutModal = document.querySelector("#aboutModal");

function item(id, category, name, ownerWard, location, status, memo) {
  return {
    id,
    category,
    name,
    ownerWard,
    homeWard: ownerWard,
    currentWard: location && location.includes("病棟") ? location : ownerWard,
    location,
    status,
    memo,
  };
}

function loadItems() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(initialItems);
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : structuredClone(initialItems);
  } catch {
    return structuredClone(initialItems);
  }
}

function loadCategories() {
  const saved = localStorage.getItem(CATEGORY_STORAGE_KEY);
  if (!saved) return categoriesFromList(defaultCategories);
  try {
    const parsed = JSON.parse(saved);
    const savedList = Array.isArray(parsed)
      ? parsed
      : Object.entries(parsed || {}).map(([id, category]) => ({ id, ...category }));
    const savedById = new Map(savedList.map((category) => [normalizeCategoryId(category?.id || category?.key || category?.slug || category?.label), category]));
    const defaultIds = new Set(defaultCategories.map((category) => category.id));
    const mergedDefaults = defaultCategories.map((category) => {
      const savedCategory = savedById.get(category.id);
      return savedCategory ? { ...category, hidden: Boolean(savedCategory.hidden) } : category;
    });
    const userCategories = savedList
      .map((category) => normalizeCategory(category))
      .filter((category) => category && !category.system && !category.internal && !defaultIds.has(category.id) && category.id !== "other");
    return categoriesFromList([...mergedDefaults, ...userCategories]);
  } catch {
    return categoriesFromList(defaultCategories);
  }
}

function normalizeCategory(category) {
  const id = normalizeCategoryId(category?.id || category?.key || category?.slug || category?.label);
  const label = String(category?.label || "").trim();
  if (!id || !label) return null;
  return {
    id,
    label,
    prefix: normalizeCategoryPrefix(category?.prefix || label),
    icon: String(category?.icon || label).trim().slice(0, 2) || "物",
    color: category?.color || nextCategoryColor(id),
    system: Boolean(category?.system),
    internal: Boolean(category?.internal),
    hidden: Boolean(category?.hidden),
  };
}

function categoriesFromList(categoryList) {
  const categoryMap = {};
  [...categoryList, uncategorizedCategory].forEach((category) => {
    categoryMap[category.id] = { ...category };
  });
  return categoryMap;
}

function saveCategories() {
  const categoryList = Object.values(categories)
    .filter((category) => !category.internal)
    .map(({ id, label, prefix, icon, color, system, hidden }) => ({ id, label, prefix, icon, color, system, hidden: Boolean(hidden) }));
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categoryList));
}

function normalizeCategoryId(value) {
  const raw = String(value || "").trim().toLowerCase();
  return raw
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeCategoryPrefix(value) {
  const ascii = String(value || "")
    .normalize("NFKD")
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 2);
  return ascii || "CT";
}

function nextCategoryColor(seed) {
  const colors = ["#14B8A6", "#0F766E", "#10B981", "#2DD4BF", "#115E59", "#0D9488"];
  const score = String(seed || "").split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return colors[score % colors.length];
}

function visibleCategoryEntries() {
  return Object.entries(categories).filter(([, category]) => !category.internal && !category.hidden);
}

function selectableCategoryEntries(currentCategory = "") {
  return visibleCategoryEntries().concat(
    currentCategory && categories[currentCategory]?.internal ? [[currentCategory, categories[currentCategory]]] : [],
  );
}

function categoryMeta(categoryKey) {
  return categories[categoryKey] || categories.uncategorized;
}

function isSelectableCategory(categoryKey) {
  return Boolean(categories[categoryKey] && !categories[categoryKey].internal && !categories[categoryKey].hidden);
}

function dataCategoryId(categoryKey) {
  return isSelectableCategory(categoryKey) || categoryKey === "uncategorized" ? categoryKey : "uncategorized";
}

function normalizeItems(sourceItems) {
  const removedMapLocations = new Set(["storage-left", "storage-center", "storage-right"]);
  const fallbackLocations = new Map([
    ["WC-001", "8-2"],
    ["WC-002", "12-1"],
    ["WC-003", "2-1"],
    ["WC-005", "16-2"],
    ["CU-002", "13-4"],
    ["CU-004", "5-3"],
  ]);
  return sourceItems.map((stockItem) => {
    if (removedMapLocations.has(stockItem.location)) {
      return { ...stockItem, location: "unused", status: "未使用" };
    }
    stockItem.homeWard = stockItem.homeWard || stockItem.ownerWard || "5病棟";
    stockItem.category = dataCategoryId(stockItem.category);
    stockItem.ownerWard = stockItem.ownerWard || stockItem.homeWard;
    stockItem.currentWard = stockItem.currentWard || (stockItem.location && stockItem.location.includes("病棟") ? stockItem.location : stockItem.homeWard);
    let location = stockItem.location || stockItem.assignedTo || stockItem.bedId;
    if (!location && ["使用中", "配置中"].includes(stockItem.status) && fallbackLocations.has(stockItem.id)) {
      location = fallbackLocations.get(stockItem.id);
    }
    if (location && !isSystemLocation(location) && !mapLocationSet().has(location)) {
      console.warn(`Invalid location reset: ${stockItem.id} -> ${location}`);
      return { ...stockItem, location: "", currentWard: stockItem.homeWard, status: "未使用" };
    }
    if (location && location !== stockItem.location) {
      return { ...stockItem, location };
    }
    return stockItem;
  });
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function loadLoanRecords() {
  const saved = localStorage.getItem(LOAN_STORAGE_KEY);
  if (!saved) return seedLoanRecordsFromItems();
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : seedLoanRecordsFromItems();
  } catch {
    return seedLoanRecordsFromItems();
  }
}

function normalizeLoanRecords(sourceRecords) {
  return sourceRecords.map((record, index) => ({
    id: record.id || `LOAN-${String(index + 1).padStart(3, "0")}`,
    itemId: record.itemId,
    itemName: record.itemName || findItem(record.itemId)?.name || "",
    category: dataCategoryId(record.category || findItem(record.itemId)?.category),
    fromWard: record.fromWard || "5病棟",
    toWard: record.toWard || "",
    loanDate: record.loanDate || todayString(),
    dueDate: record.dueDate || "",
    reason: record.reason || "",
    memo: record.memo || "",
    status: record.status || "貸出中",
    returnedDate: record.returnedDate || null,
  }));
}

function seedLoanRecordsFromItems() {
  return initialItems
    .filter((stockItem) => stockItem.status === "貸出中")
    .map((stockItem, index) => ({
      id: `LOAN-${String(index + 1).padStart(3, "0")}`,
      itemId: stockItem.id,
      itemName: stockItem.name,
      category: stockItem.category,
      fromWard: stockItem.homeWard || stockItem.ownerWard || "5病棟",
      toWard: stockItem.location || stockItem.currentWard || "3病棟",
      loanDate: todayString(),
      dueDate: "",
      reason: stockItem.memo || "",
      memo: "",
      status: "貸出中",
      returnedDate: null,
    }));
}

function saveLoanRecords() {
  localStorage.setItem(LOAN_STORAGE_KEY, JSON.stringify(loanRecords));
}

function locationOptions() {
  const bedLocations = rooms.flatMap((roomData) =>
    Array.from({ length: roomData.beds }, (_, index) => ({
      value: `${roomData.number}-${index + 1}`,
      label: `${roomData.number}-${index + 1}`,
    })),
  );
  const areaLocations = areas
    .filter((area) => area.droppable)
    .map((area) => ({ value: area.id, label: area.label }));
  return [...bedLocations, ...areaLocations, { value: "unused", label: "未使用品一覧" }, { value: "3病棟", label: "3病棟（貸出先）" }];
}

function renderMap() {
  wardMap.innerHTML = "";
  const canvas = document.createElement("div");
  canvas.className = "map-canvas";

  canvas.append(label("病棟マップ", 785, 42, 170, 26));
  areas.forEach((area) => canvas.append(renderArea(area)));
  rooms.forEach((roomData) => canvas.append(renderRoom(roomData)));
  wardMap.append(canvas);
  renderItemsInZones();
}

function label(text, x, y, w, h, className = "") {
  const el = document.createElement("div");
  el.className = `map-label ${className}`;
  el.textContent = text;
  Object.assign(el.style, pxBox(x, y, w, h));
  return el;
}

function renderArea(area) {
  const el = document.createElement("div");
  el.className = `area-zone ${area.droppable ? "drop-zone" : "no-drop-zone"} ${area.className || ""}`;
  if (area.droppable) el.dataset.location = area.id;
  Object.assign(el.style, pxBox(area.x, area.y, area.w, area.h));
  if (area.droppable) wireDropZone(el);

  if (area.label) {
    const areaLabel = document.createElement("span");
    areaLabel.className = "area-label";
    areaLabel.textContent = area.label;
    el.append(areaLabel);
  }

  const holder = document.createElement("div");
  holder.className = "zone-items area-items";
  if (area.droppable) holder.dataset.itemsFor = area.id;
  el.append(holder);
  return el;
}

function renderRoom(roomData) {
  const room = document.createElement("div");
  room.className = `room ${roomClass(roomData)}`;
  room.dataset.location = `${roomData.number}号室`;
  Object.assign(room.style, pxBox(roomData.x, roomData.y, roomData.w, roomData.h));
  room.addEventListener("click", () => openLocationItems(room.dataset.location));

  const title = document.createElement("div");
  title.className = "room-title";
  title.textContent = `${roomData.number}`;
  room.append(title);

  const roomHolder = document.createElement("div");
  roomHolder.className = "zone-items room-items";
  room.append(roomHolder);

  const grid = document.createElement("div");
  grid.className = "bed-grid";
  bedOrder(roomData).forEach((bedNumber) => {
    const bed = document.createElement("div");
    bed.className = "bed drop-zone";
    bed.dataset.location = `${roomData.number}-${bedNumber}`;
    bed.draggable = true;
    wireDropZone(bed);
    wireBedSwap(bed);
    bed.addEventListener("click", (event) => {
      event.stopPropagation();
      if (event.target.closest(".map-item-tag") || suppressClickIds.has(bed.dataset.location)) {
        suppressClickIds.delete(bed.dataset.location);
        return;
      }
      openLocationItems(bed.dataset.location);
    });

    const bedLabel = document.createElement("span");
    bedLabel.className = "bed-label";
    bedLabel.textContent = `${roomData.number}-${bedNumber}`;
    bed.append(bedLabel);

    const holder = document.createElement("div");
    holder.className = "bed-items";
    holder.dataset.itemsFor = `${roomData.number}-${bedNumber}`;
    bed.append(holder);
    grid.append(bed);
  });
  room.append(grid);
  return room;
}

function roomClass(roomData) {
  if (roomData.beds === 1) return "single";
  if (roomData.split === "horizontal") return "two horizontal";
  return roomData.beds > 2 ? "four" : "two";
}

function bedOrder(roomData) {
  if (roomData.beds === 1) return [1];
  if ([11, 12].includes(roomData.number)) return [2, 1];
  if (roomData.beds === 2) return [1, 2];
  if (roomData.number >= 1 && roomData.number <= 7) return [4, 1, 3, 2];
  return [2, 3, 1, 4];
}

function pxBox(x, y, w, h) {
  return { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` };
}

function renderItemsInZones() {
  document.querySelectorAll("[data-items-for]").forEach((holder) => {
    holder.innerHTML = "";
  });

  const groups = groupedPlacedItems();
  console.log("placedItems:", placedMapItems().length);
  groups.forEach((locationItems, location) => {
    console.log("bedId:", location, "items:", locationItems.map((stockItem) => stockItem.id));
    const holder = document.querySelector(`[data-items-for="${cssEscape(location)}"]`);
    if (!holder) return;
    renderLocationItemTags(locationItems, holder, location);
  });
}

function groupedPlacedItems() {
  const groups = new Map();
  visibleMapItems().forEach((stockItem) => {
    if (!groups.has(stockItem.location)) groups.set(stockItem.location, []);
    groups.get(stockItem.location).push(stockItem);
  });
  return groups;
}

function visibleMapItems() {
  return placedMapItems().filter((stockItem) => {
    const categoryMatch = activeFilter === "all" || stockItem.category === activeFilter;
    const searchMatch = itemMatchesSearch(stockItem);
    return categoryMatch && searchMatch;
  });
}

function placedMapItems() {
  const validLocations = mapLocationSet();
  return items
    .map((stockItem) => {
      const location = stockItem.location || stockItem.assignedTo || stockItem.bedId;
      return { ...stockItem, location };
    })
    .filter((stockItem) => {
    const location = stockItem.location || stockItem.assignedTo || stockItem.bedId;
    return location && ["使用中", "配置中"].includes(stockItem.status) && validLocations.has(location);
    });
}

function mapLocationSet() {
  const locations = new Set();
  rooms.forEach((roomData) => {
    Array.from({ length: roomData.beds }, (_, index) => {
      locations.add(`${roomData.number}-${index + 1}`);
    });
  });
  areas.forEach((area) => {
    if (area.droppable) locations.add(area.id);
  });
  return locations;
}

function isSystemLocation(location) {
  return !location || location === "unused" || location.includes("病棟");
}

function isValidDropLocation(location) {
  return mapLocationSet().has(location);
}

function renderLocationItemTags(locationItems, holder, location) {
  if (activeFilter === "all" && locationItems.length > 1) {
    renderCategorySummaryTags(locationItems, holder, location);
    return;
  }
  if (locationItems.length >= 3) {
    holder.append(renderItemCountTag(locationItems, location));
    return;
  }
  locationItems.forEach((stockItem) => holder.append(renderMapTag(stockItem)));
}

function renderCategorySummaryTags(locationItems, holder, location) {
  const summaries = Object.entries(categories)
    .map(([categoryKey, category]) => ({
      categoryKey,
      label: category.icon,
      color: category.color,
      count: locationItems.filter((stockItem) => stockItem.category === categoryKey).length,
    }))
    .filter((summary) => summary.count > 0);
  const visibleSummaries = summaries.slice(0, 3);
  visibleSummaries.forEach((summary) => {
    const tag = document.createElement("button");
    tag.type = "button";
    tag.className = "map-item-tag category-summary-tag";
    tag.style.borderLeft = `6px solid ${summary.color}`;
    tag.textContent = `${summary.label}${summary.count}`;
    tag.addEventListener("click", (event) => {
      event.stopPropagation();
      openLocationItems(location);
    });
    holder.append(tag);
  });
  const hiddenCount = summaries.slice(3).reduce((total, summary) => total + summary.count, 0);
  if (hiddenCount > 0) {
    const extraTag = renderItemCountTag(locationItems, location);
    extraTag.textContent = `+${hiddenCount}`;
    holder.append(extraTag);
  }
}

function renderItemCountTag(locationItems, location) {
  const tag = document.createElement("button");
  tag.type = "button";
  tag.className = "map-item-tag item-count-tag";
  tag.textContent = `物品${locationItems.length}件`;
  tag.addEventListener("click", (event) => {
    event.stopPropagation();
    openLocationItems(location);
  });
  return tag;
}

function renderMapTag(stockItem) {
  const category = categoryMeta(stockItem.category);
  const card = document.createElement("button");
  card.type = "button";
  card.className = `map-item-tag status-${stockItem.status}`;
  card.draggable = true;
  card.dataset.itemId = stockItem.id;
  card.style.borderLeft = `6px solid ${category.color}`;
  card.textContent = `${category.icon} ${stockItem.id}`;
  wireItemDrag(card, stockItem);
  card.addEventListener("pointerdown", (event) => startPointerDrag(event, stockItem.id, card));
  card.addEventListener("mousedown", (event) => startMouseDrag(event, stockItem.id, card));
  card.addEventListener("click", (event) => {
    event.stopPropagation();
    if (suppressClickIds.has(stockItem.id)) {
      suppressClickIds.delete(stockItem.id);
      return;
    }
    openDetail(stockItem.id);
  });
  return card;
}

function renderPaletteCard(stockItem) {
  const category = categoryMeta(stockItem.category);
  const card = document.createElement("button");
  card.type = "button";
  card.className = `palette-item status-${stockItem.status}`;
  card.draggable = true;
  card.dataset.itemId = stockItem.id;
  card.style.borderLeft = `6px solid ${category.color}`;
  card.innerHTML = `
    <strong>${escapeHtml(stockItem.id)} ${escapeHtml(stockItem.name)}</strong>
    <span>${escapeHtml(stockItem.status)}</span>
  `;
  wireItemDrag(card, stockItem);
  card.addEventListener("pointerdown", (event) => startPointerDrag(event, stockItem.id, card));
  card.addEventListener("mousedown", (event) => startMouseDrag(event, stockItem.id, card));
  card.addEventListener("click", () => {
    if (suppressClickIds.has(stockItem.id)) {
      suppressClickIds.delete(stockItem.id);
      return;
    }
    openDetail(stockItem.id);
  });
  return card;
}

function wireItemDrag(card, stockItem) {
  const canDrag = canDragItem(stockItem);
  card.draggable = canDrag;
  if (!canDrag) {
    card.classList.add("not-draggable");
    card.title = `${stockItem.status}の物品は配置できません`;
  }
  card.addEventListener("dragstart", (event) => {
    if (!canDragItem(stockItem)) {
      event.preventDefault();
      alert(`${stockItem.id} は${stockItem.status}のため配置できません。`);
      return;
    }
    event.dataTransfer.setData("text/plain", stockItem.id);
    event.dataTransfer.effectAllowed = "move";
  });
}

function wireBedSwap(bed) {
  bed.addEventListener("dragstart", (event) => {
    if (event.target.closest(".map-item-tag")) return;
    draggedBedLocation = bed.dataset.location;
    event.dataTransfer.setData("application/x-wardstock-bed", bed.dataset.location);
    event.dataTransfer.effectAllowed = "move";
    bed.classList.add("bed-dragging");
  });
  bed.addEventListener("dragend", () => {
    draggedBedLocation = null;
    document.querySelectorAll(".bed-dragging, .bed-swap-hover").forEach((el) => {
      el.classList.remove("bed-dragging", "bed-swap-hover");
    });
  });
}

function canDragItem(stockItem) {
  return !["貸出中", "修理中"].includes(stockItem.status);
}

function startPointerDrag(event, itemId, source) {
  if (event.button !== 0) return;
  const stockItem = items.find((candidate) => candidate.id === itemId);
  if (stockItem && !canDragItem(stockItem)) return;
  event.preventDefault();
  const rect = source.getBoundingClientRect();
  pointerDrag = {
    itemId,
    source,
    startX: event.clientX,
    startY: event.clientY,
    moved: false,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    ghost: null,
  };
  source.setPointerCapture(event.pointerId);
  source.addEventListener("pointermove", handlePointerMove);
  source.addEventListener("pointerup", finishPointerDrag);
  source.addEventListener("pointercancel", cancelPointerDrag);
}

function startMouseDrag(event, itemId, source) {
  if (event.button !== 0 || pointerDrag) return;
  const stockItem = items.find((candidate) => candidate.id === itemId);
  if (stockItem && !canDragItem(stockItem)) return;
  event.preventDefault();
  const rect = source.getBoundingClientRect();
  pointerDrag = {
    itemId,
    source,
    startX: event.clientX,
    startY: event.clientY,
    moved: false,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    ghost: null,
    mouse: true,
  };
  document.addEventListener("mousemove", handlePointerMove);
  document.addEventListener("mouseup", finishPointerDrag);
}

function handlePointerMove(event) {
  if (!pointerDrag) return;
  const distance = Math.hypot(event.clientX - pointerDrag.startX, event.clientY - pointerDrag.startY);
  if (distance < 8 && !pointerDrag.moved) return;
  pointerDrag.moved = true;
  if (!pointerDrag.ghost) {
    pointerDrag.ghost = pointerDrag.source.cloneNode(true);
    pointerDrag.ghost.classList.add("drag-ghost");
    document.body.append(pointerDrag.ghost);
  }
  pointerDrag.ghost.style.left = `${event.clientX - pointerDrag.offsetX}px`;
  pointerDrag.ghost.style.top = `${event.clientY - pointerDrag.offsetY}px`;
  document.querySelectorAll(".drop-hover, .drop-invalid").forEach((el) => el.classList.remove("drop-hover", "drop-invalid"));
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".drop-zone");
  if (!target) return;
  target.classList.add(isValidDropLocation(target.dataset.location) ? "drop-hover" : "drop-invalid");
}

function finishPointerDrag(event) {
  if (!pointerDrag) return;
  const drag = pointerDrag;
  cleanupPointerDrag(event);
  if (!drag.moved) return;
  suppressClickIds.add(drag.itemId);
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".drop-zone");
  if (!target) return;
  const targetLocation = target.dataset.location;
  if (!isValidDropLocation(targetLocation)) {
    alert("この場所には配置できません");
    return;
  }
  moveItem(drag.itemId, targetLocation);
}

function cancelPointerDrag(event) {
  cleanupPointerDrag(event);
}

function cleanupPointerDrag(event) {
  if (!pointerDrag) return;
  if (pointerDrag.mouse) {
    document.removeEventListener("mousemove", handlePointerMove);
    document.removeEventListener("mouseup", finishPointerDrag);
  } else {
    pointerDrag.source.releasePointerCapture(event.pointerId);
    pointerDrag.source.removeEventListener("pointermove", handlePointerMove);
    pointerDrag.source.removeEventListener("pointerup", finishPointerDrag);
    pointerDrag.source.removeEventListener("pointercancel", cancelPointerDrag);
  }
  pointerDrag.ghost?.remove();
  document.querySelectorAll(".drop-hover, .drop-invalid").forEach((el) => el.classList.remove("drop-hover", "drop-invalid"));
  pointerDrag = null;
}

function wireDropZone(zone) {
  zone.addEventListener("dragover", (event) => {
    event.preventDefault();
    const types = Array.from(event.dataTransfer.types);
    if (types.includes("application/x-wardstock-bed") && zone.classList.contains("bed")) {
      zone.classList.add("bed-swap-hover");
    } else if (isValidDropLocation(zone.dataset.location)) {
      zone.classList.add("drop-hover");
    } else {
      zone.classList.add("drop-invalid");
    }
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("drop-hover", "bed-swap-hover", "drop-invalid"));
  zone.addEventListener("drop", (event) => {
    event.preventDefault();
    event.stopPropagation();
    document.querySelectorAll(".drop-hover, .bed-swap-hover, .drop-invalid").forEach((el) => el.classList.remove("drop-hover", "bed-swap-hover", "drop-invalid"));
    const sourceBed = event.dataTransfer.getData("application/x-wardstock-bed") || draggedBedLocation;
    if (sourceBed && zone.classList.contains("bed")) {
      swapBedItems(sourceBed, zone.dataset.location);
      return;
    }
    if (!isValidDropLocation(zone.dataset.location)) {
      alert("この場所には配置できません");
      return;
    }
    const itemId = event.dataTransfer.getData("text/plain");
    moveItem(itemId, zone.dataset.location);
  });
}

function moveItem(id, location) {
  const stockItem = items.find((candidate) => candidate.id === id);
  if (!stockItem || !location) return;
  if (!isValidDropLocation(location)) {
    alert("この場所には配置できません");
    return;
  }
  if (!canDragItem(stockItem)) {
    alert(`${stockItem.id} は${stockItem.status}のため配置できません。`);
    return;
  }
  stockItem.location = location;
  if (stockItem.ownerWard !== "5病棟" || location.includes("病棟")) {
    stockItem.status = "貸出中";
    stockItem.currentWard = location;
  } else if (stockItem.status === "未使用" || stockItem.location !== "unused") {
    stockItem.status = "使用中";
    stockItem.currentWard = stockItem.homeWard || stockItem.ownerWard || "5病棟";
  }
  saveItems();
  renderAll();
}

function swapBedItems(sourceLocation, targetLocation) {
  if (!sourceLocation || !targetLocation || sourceLocation === targetLocation) return;
  suppressClickIds.add(sourceLocation);
  suppressClickIds.add(targetLocation);
  const sourceItems = items.filter((stockItem) => stockItem.location === sourceLocation);
  const targetItems = items.filter((stockItem) => stockItem.location === targetLocation);
  sourceItems.forEach((stockItem) => {
    stockItem.location = targetLocation;
  });
  targetItems.forEach((stockItem) => {
    stockItem.location = sourceLocation;
  });
  saveItems();
  renderAll();
  showToast(`${sourceLocation} と ${targetLocation} の配置物品を交換しました`);
}

function renderItemList() {
  itemList.innerHTML = "";
  if (activeFilter !== "all" && !isSelectableCategory(activeFilter)) activeFilter = "all";
  const baseTitle = activeFilter === "all" ? "全体の物品" : `${categoryMeta(activeFilter).label}の物品`;
  paletteTitle.textContent = unusedOnly ? `${baseTitle}（未使用のみ）` : baseTitle;
  document.querySelector("#unusedOnlyButton").classList.toggle("active", unusedOnly);
  document.querySelector("#unusedOnlyButton").setAttribute("aria-pressed", String(unusedOnly));
  const list = filteredItems();
  if (!list.length) {
    itemList.innerHTML = `<div class="empty compact-empty">該当する物品はありません</div>`;
    return;
  }
  list.forEach((stockItem) => {
    itemList.append(renderPaletteCard(stockItem));
  });
}

function filteredItems() {
  return items.filter((stockItem) => {
    const categoryMatch = activeFilter === "all" || stockItem.category === activeFilter;
    const unusedMatch = !unusedOnly || stockItem.status === "未使用";
    return categoryMatch && unusedMatch && itemMatchesSearch(stockItem);
  });
}

function itemMatchesSearch(stockItem) {
  const haystack = [
    stockItem.id,
    stockItem.name,
    categoryLabel(stockItem.category),
    stockItem.ownerWard,
    displayLocation(stockItem.location),
    stockItem.status,
    stockItem.memo,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(searchText.toLowerCase());
}

function displayLocation(value) {
  if (!value) return "未配置";
  const found = locationOptions().find((option) => option.value === value);
  return found ? found.label : value;
}

function findItem(itemId) {
  return items.find((stockItem) => stockItem.id === itemId);
}

function normalizeItemId(value) {
  return String(value || "").trim().toUpperCase();
}

function validateItemId(candidateId, currentId = null) {
  const normalizedId = normalizeItemId(candidateId);
  const normalizedCurrentId = currentId ? normalizeItemId(currentId) : null;
  if (!normalizedId) return { ok: false, message: "ID番号を入力してください。" };
  const duplicate = items.some((stockItem) => normalizeItemId(stockItem.id) === normalizedId && normalizeItemId(stockItem.id) !== normalizedCurrentId);
  if (duplicate) return { ok: false, message: "このIDはすでに登録されています。別のIDを入力してください。" };
  return { ok: true, id: normalizedId };
}

function showIdError(input, message) {
  input.classList.add("input-error");
  alert(message);
  input.focus();
}

function clearIdError(input) {
  input.classList.remove("input-error");
}

function categoryLabel(categoryKey) {
  return categoryMeta(categoryKey)?.label || categoryKey || "";
}

function todayString() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

function nextLoanId() {
  const max = loanRecords
    .map((record) => Number(String(record.id || "").replace("LOAN-", "")))
    .filter(Number.isFinite)
    .reduce((largest, current) => Math.max(largest, current), 0);
  return `LOAN-${String(max + 1).padStart(3, "0")}`;
}

function openDetail(id) {
  const stockItem = items.find((candidate) => candidate.id === id);
  if (!stockItem) return;
  document.querySelector("#detailModal h2").textContent = "物品詳細";
  document.querySelector("#detailBody").innerHTML = `
    <dl class="detail-list">
      <dt>ID</dt><dd>${escapeHtml(stockItem.id)}</dd>
      <dt>カテゴリ</dt><dd>${escapeHtml(categoryLabel(stockItem.category))}</dd>
      <dt>物品名</dt><dd>${escapeHtml(stockItem.name)}</dd>
      <dt>所有病棟</dt><dd>${escapeHtml(stockItem.ownerWard)}</dd>
      <dt>現在位置</dt><dd>${escapeHtml(displayLocation(stockItem.location))}</dd>
      <dt>状態</dt><dd>${escapeHtml(stockItem.status)}</dd>
      <dt>メモ</dt><dd>${escapeHtml(stockItem.memo || "なし")}</dd>
    </dl>
    <div class="modal-actions">
      <button type="button" class="secondary-button" id="editItemButton" data-item-id="${escapeHtml(stockItem.id)}">編集</button>
      <button type="button" class="secondary-button danger-button" id="deleteItemButton" data-item-id="${escapeHtml(stockItem.id)}">削除</button>
    </div>
  `;
  document.querySelector("#editItemButton").addEventListener("click", () => openEditItemForm(stockItem.id));
  document.querySelector("#deleteItemButton").addEventListener("click", () => deleteItemCard(stockItem.id));
  showDetailModal();
}

function openEditItemForm(itemId) {
  const stockItem = findItem(itemId);
  if (!stockItem) return;
  document.querySelector("#detailModal h2").textContent = "物品編集";
  document.querySelector("#detailBody").innerHTML = `
    <form id="editItemForm" data-original-id="${escapeHtml(stockItem.id)}">
      <div class="form-grid">
        <label>
          物品ID
          <input id="editItemId" value="${escapeHtml(stockItem.id)}" required />
        </label>
        <label>
          物品名
          <input id="editItemName" value="${escapeHtml(stockItem.name)}" required />
        </label>
        <label>
          カテゴリ
          <select id="editItemCategory" required>
            ${selectableCategoryEntries(stockItem.category).map(([key, category]) => `<option value="${key}" ${key === stockItem.category ? "selected" : ""}>${category.label}</option>`).join("")}
          </select>
        </label>
        <label>
          所有病棟
          <input id="editOwnerWard" value="${escapeHtml(stockItem.homeWard || stockItem.ownerWard || "5病棟")}" required />
        </label>
        <label>
          ステータス
          <select id="editItemStatus" required>
            ${statuses.map((status) => `<option value="${status}" ${status === stockItem.status ? "selected" : ""}>${status}</option>`).join("")}
          </select>
        </label>
        <label>
          現在位置
          <select id="editItemLocation">
            <option value="">未配置</option>
            ${locationOptions().map((option) => `<option value="${escapeHtml(option.value)}" ${option.value === stockItem.location ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
          </select>
        </label>
        <label class="wide">
          メモ
          <textarea id="editItemMemo" rows="3">${escapeHtml(stockItem.memo || "")}</textarea>
        </label>
      </div>
      <div class="modal-actions">
        <button type="button" class="secondary-button" id="cancelEditItemButton">キャンセル</button>
        <button class="primary-button">保存</button>
      </div>
    </form>
  `;
  document.querySelector("#cancelEditItemButton").addEventListener("click", () => openDetail(stockItem.id));
  document.querySelector("#editItemForm").addEventListener("submit", saveEditedItem);
}

function saveEditedItem(event) {
  event.preventDefault();
  const originalId = event.currentTarget.dataset.originalId;
  const stockItem = findItem(originalId);
  if (!stockItem) return;
  const idField = document.querySelector("#editItemId");
  const idValidation = validateItemId(idField.value, originalId);
  if (!idValidation.ok) {
    showIdError(idField, idValidation.message === "ID番号を入力してください。" ? "物品IDは空欄にできません" : "この物品IDはすでに存在します");
    return;
  }
  clearIdError(idField);
  stockItem.id = idValidation.id;
  stockItem.name = document.querySelector("#editItemName").value.trim();
  stockItem.category = document.querySelector("#editItemCategory").value;
  stockItem.ownerWard = document.querySelector("#editOwnerWard").value.trim();
  stockItem.homeWard = stockItem.ownerWard;
  stockItem.status = document.querySelector("#editItemStatus").value;
  stockItem.location = document.querySelector("#editItemLocation").value;
  stockItem.currentWard = stockItem.location && stockItem.location.includes("病棟") ? stockItem.location : stockItem.homeWard;
  stockItem.memo = document.querySelector("#editItemMemo").value.trim();
  updateLoanRecordsForItem(originalId, stockItem);
  saveItems();
  saveLoanRecords();
  renderAll();
  openDetail(stockItem.id);
  showToast("物品情報を更新しました");
}

function updateLoanRecordsForItem(originalId, stockItem) {
  loanRecords.forEach((record) => {
    if (record.itemId !== originalId) return;
    record.itemId = stockItem.id;
    record.itemName = stockItem.name;
    record.category = stockItem.category;
    record.fromWard = record.fromWard || stockItem.homeWard || stockItem.ownerWard || "5病棟";
  });
}

function deleteItemCard(itemId) {
  const stockItem = findItem(itemId);
  if (!stockItem) return;
  const relatedLoans = loanRecords.filter((record) => record.itemId === itemId);
  const baseMessage = `${stockItem.id} ${stockItem.name} を削除しますか？`;
  const fallbackMessage = "この物品カードを削除しますか？登録ミスや重複登録の修正用です。";
  if (!confirm(baseMessage || fallbackMessage)) return;
  if (relatedLoans.length && confirm("貸出台帳の関連記録も削除しますか？")) {
    loanRecords = loanRecords.filter((record) => record.itemId !== itemId);
  } else if (relatedLoans.length) {
    loanRecords.forEach((record) => {
      if (record.itemId !== itemId) return;
      record.itemId = "";
      record.itemName = `${record.itemName}（削除済み）`;
    });
  }
  items = items.filter((candidate) => candidate.id !== itemId);
  saveItems();
  saveLoanRecords();
  renderAll();
  detailModal.close();
  showToast("物品カードを削除しました");
}

function openLocationItems(location) {
  const locationItems = itemsForLocationDetail(location);
  const title = `${displayLocation(location)} の配置物品`;
  const body = locationItems.length
    ? `
      <table class="ledger-table compact-table">
        <thead>
          <tr>
            <th>場所</th>
            <th>カテゴリ</th>
            <th>ID</th>
            <th>物品名</th>
            <th>ステータス</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${locationItems
            .map(
              (stockItem) => `
                <tr>
                  <td>${escapeHtml(displayLocation(stockItem.location))}</td>
                  <td>${escapeHtml(categoryLabel(stockItem.category))}</td>
                  <td>${escapeHtml(stockItem.id)}</td>
                  <td>${escapeHtml(stockItem.name)}</td>
                  <td>${escapeHtml(stockItem.status)}</td>
                  <td>
                    <div class="item-actions">
                      <button type="button" class="mini-button" data-location-action="edit" data-item-id="${escapeHtml(stockItem.id)}" data-location="${escapeHtml(location)}">編集</button>
                      <button type="button" class="mini-button danger" data-location-action="delete" data-item-id="${escapeHtml(stockItem.id)}" data-location="${escapeHtml(location)}">削除</button>
                      <button type="button" class="mini-button" data-location-action="unused" data-item-id="${escapeHtml(stockItem.id)}" data-location="${escapeHtml(location)}">未使用へ戻す</button>
                      <button type="button" class="mini-button danger" data-location-action="repair" data-item-id="${escapeHtml(stockItem.id)}" data-location="${escapeHtml(location)}">修理へ送る</button>
                    </div>
                  </td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
      <div class="location-actions">
        <button type="button" class="secondary-button" data-location-action="vacate" data-location="${escapeHtml(location)}">ベッド退去処理</button>
      </div>
    `
    : `<div class="empty">配置物品なし</div>`;
  document.querySelector("#detailModal h2").textContent = title;
  document.querySelector("#detailBody").innerHTML = body;
  wireLocationActionButtons(location);
  showDetailModal();
}

function itemsForLocationDetail(location) {
  const locationIds = roomLocationIds(location);
  return placedMapItems().filter((stockItem) => locationIds.includes(stockItem.location));
}

function roomLocationIds(location) {
  const roomNumber = String(location || "").match(/^(\d+)号室$/)?.[1];
  if (!roomNumber) return [location];
  const roomData = rooms.find((candidate) => String(candidate.number) === roomNumber);
  if (!roomData) return [location];
  return Array.from({ length: roomData.beds }, (_, index) => `${roomData.number}-${index + 1}`);
}

function wireLocationActionButtons(location) {
  const detailBody = document.querySelector("#detailBody");
  detailBody.querySelectorAll("[data-location-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.locationAction;
      if (action === "edit") return openEditItemForm(button.dataset.itemId);
      if (action === "delete") return deleteItemCard(button.dataset.itemId);
      if (action === "unused") return markItemUnused(button.dataset.itemId, location);
      if (action === "repair") return sendItemToRepair(button.dataset.itemId, location);
      if (action === "vacate") return vacateLocation(location);
    });
  });
}

function markItemUnused(itemId, location) {
  const stockItem = items.find((candidate) => candidate.id === itemId);
  if (!stockItem || !confirm(`${stockItem.id}を未使用へ戻しますか？`)) return;
  stockItem.status = "未使用";
  clearItemPlacement(stockItem);
  saveItems();
  renderAll();
  openLocationItems(location);
  showToast(`${stockItem.id}を未使用へ戻しました`);
}

function sendItemToRepair(itemId, location) {
  const stockItem = items.find((candidate) => candidate.id === itemId);
  if (!stockItem || !confirm(`${stockItem.id}を修理中に変更しますか？`)) return;
  stockItem.status = "修理中";
  clearItemPlacement(stockItem);
  saveItems();
  renderAll();
  openLocationItems(location);
  showToast(`${stockItem.id}を修理中に変更しました`);
}

function vacateLocation(location) {
  const targetLocations = roomLocationIds(location);
  const locationItems = items.filter((stockItem) => targetLocations.includes(stockItem.location));
  if (!locationItems.length || !confirm(`${location}の配置物品をすべて未使用へ戻しますか？`)) return;
  locationItems.forEach((stockItem) => {
    stockItem.status = "未使用";
    clearItemPlacement(stockItem);
  });
  saveItems();
  renderAll();
  openLocationItems(location);
  showToast(`${location}の配置物品をすべて未使用へ戻しました`);
}

function clearItemPlacement(stockItem) {
  stockItem.location = "";
  stockItem.currentWard = stockItem.homeWard || stockItem.ownerWard || "5病棟";
  delete stockItem.assignedTo;
  delete stockItem.bedId;
}

function showDetailModal() {
  if (!detailModal.open) detailModal.showModal();
}

function showToast(message) {
  const existing = document.querySelector(".toast");
  existing?.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 2600);
}

function renderLedger() {
  document.querySelector("#ledgerBody").innerHTML = `
    <div class="ledger-toolbar">
      <button type="button" class="primary-button" id="showLoanFormButton">貸出登録</button>
    </div>
    <div id="loanFormHost"></div>
    ${loanRecords.length ? loanTableHtml() : `<div class="empty">貸出記録はありません</div>`}
  `;
  wireLedgerActions();
}

function loanTableHtml() {
  return `
    <table class="ledger-table loan-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>物品名</th>
          <th>カテゴリ</th>
          <th>貸出元</th>
          <th>貸出先</th>
          <th>貸出日</th>
          <th>返却予定日</th>
          <th>状態</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${loanRecords
          .map(
            (record) => `
              <tr>
                <td>${escapeHtml(record.itemId)}</td>
                <td>${escapeHtml(record.itemName)}</td>
                <td>${escapeHtml(categoryLabel(record.category))}</td>
                <td>${escapeHtml(record.fromWard)}</td>
                <td>${escapeHtml(record.toWard)}</td>
                <td>${escapeHtml(record.loanDate)}</td>
                <td>${escapeHtml(record.dueDate || "-")}</td>
                <td>${escapeHtml(record.status)}</td>
                <td>
                  <div class="item-actions">
                    <button type="button" class="mini-button" data-loan-action="return" data-loan-id="${escapeHtml(record.id)}">返却処理</button>
                    <button type="button" class="mini-button" data-loan-action="edit" data-loan-id="${escapeHtml(record.id)}">編集</button>
                    <button type="button" class="mini-button danger" data-loan-action="delete" data-loan-id="${escapeHtml(record.id)}">削除</button>
                  </div>
                </td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderLoanForm(record = null) {
  const selectedItem = record ? findItem(record.itemId) : items[0];
  const selectedItemId = record?.itemId || selectedItem?.id || "";
  const category = record?.category || selectedItem?.category || "other";
  document.querySelector("#loanFormHost").innerHTML = `
    <form class="loan-form" id="loanForm" data-edit-id="${escapeHtml(record?.id || "")}">
      <div class="form-grid">
        <label>
          物品ID
          <select id="loanItemId" required>
            ${items.map((stockItem) => `<option value="${escapeHtml(stockItem.id)}" ${stockItem.id === selectedItemId ? "selected" : ""}>${escapeHtml(stockItem.id)}</option>`).join("")}
          </select>
        </label>
        <label>
          物品名
          <input id="loanItemName" value="${escapeHtml(record?.itemName || selectedItem?.name || "")}" readonly />
        </label>
        <label>
          カテゴリ
          <input id="loanCategoryLabel" value="${escapeHtml(categoryLabel(category))}" readonly />
        </label>
        <label>
          貸出元病棟
          <input id="loanFromWard" value="${escapeHtml(record?.fromWard || selectedItem?.homeWard || selectedItem?.ownerWard || "5病棟")}" required />
        </label>
        <label>
          貸出先病棟
          <input id="loanToWard" list="wardOptions" value="${escapeHtml(record?.toWard || "3病棟")}" required />
          <datalist id="wardOptions">
            <option value="3病棟"></option>
            <option value="4病棟"></option>
            <option value="6病棟"></option>
            <option value="外来"></option>
            <option value="その他"></option>
          </datalist>
        </label>
        <label>
          貸出日
          <input id="loanDate" type="date" value="${escapeHtml(record?.loanDate || todayString())}" required />
        </label>
        <label>
          返却予定日
          <input id="loanDueDate" type="date" value="${escapeHtml(record?.dueDate || "")}" />
        </label>
        <label>
          ステータス
          <select id="loanStatus">
            ${["貸出中", "返却済み", "延滞"].map((status) => `<option value="${status}" ${status === (record?.status || "貸出中") ? "selected" : ""}>${status}</option>`).join("")}
          </select>
        </label>
        <label class="wide">
          貸出理由
          <input id="loanReason" value="${escapeHtml(record?.reason || "")}" />
        </label>
        <label class="wide">
          備考
          <textarea id="loanMemo" rows="2">${escapeHtml(record?.memo || "")}</textarea>
        </label>
      </div>
      <div class="modal-actions">
        <button type="button" class="secondary-button" id="cancelLoanFormButton">キャンセル</button>
        <button class="primary-button">保存</button>
      </div>
    </form>
  `;
  wireLoanForm();
}

function wireLedgerActions() {
  document.querySelector("#showLoanFormButton")?.addEventListener("click", () => renderLoanForm());
  document.querySelectorAll("[data-loan-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const record = loanRecords.find((candidate) => candidate.id === button.dataset.loanId);
      if (!record) return;
      if (button.dataset.loanAction === "return") return returnLoan(record.id);
      if (button.dataset.loanAction === "edit") return renderLoanForm(record);
      if (button.dataset.loanAction === "delete") return deleteLoan(record.id);
    });
  });
}

function wireLoanForm() {
  const form = document.querySelector("#loanForm");
  const itemSelect = document.querySelector("#loanItemId");
  itemSelect.addEventListener("change", syncLoanItemFields);
  document.querySelector("#cancelLoanFormButton").addEventListener("click", () => {
    document.querySelector("#loanFormHost").innerHTML = "";
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveLoanForm();
  });
  syncLoanItemFields();
}

function syncLoanItemFields() {
  const stockItem = findItem(document.querySelector("#loanItemId").value);
  if (!stockItem) return;
  document.querySelector("#loanItemName").value = stockItem.name;
  document.querySelector("#loanCategoryLabel").value = categoryLabel(stockItem.category);
  if (!document.querySelector("#loanFromWard").value) {
    document.querySelector("#loanFromWard").value = stockItem.homeWard || stockItem.ownerWard || "5病棟";
  }
}

function saveLoanForm() {
  const itemId = document.querySelector("#loanItemId").value;
  const stockItem = findItem(itemId);
  if (!stockItem) return;
  const editId = document.querySelector("#loanForm").dataset.editId;
  const record = {
    id: editId || nextLoanId(),
    itemId,
    itemName: stockItem.name,
    category: stockItem.category,
    fromWard: document.querySelector("#loanFromWard").value.trim() || "5病棟",
    toWard: document.querySelector("#loanToWard").value.trim(),
    loanDate: document.querySelector("#loanDate").value || todayString(),
    dueDate: document.querySelector("#loanDueDate").value,
    reason: document.querySelector("#loanReason").value.trim(),
    memo: document.querySelector("#loanMemo").value.trim(),
    status: document.querySelector("#loanStatus").value,
    returnedDate: document.querySelector("#loanStatus").value === "返却済み" ? todayString() : null,
  };
  if (editId) {
    loanRecords = loanRecords.map((candidate) => (candidate.id === editId ? record : candidate));
  } else {
    loanRecords.push(record);
  }
  applyLoanRecordToItem(record);
  saveLoanRecords();
  saveItems();
  renderAll();
  renderLedger();
  showToast(`${record.itemId}の貸出記録を保存しました`);
}

function applyLoanRecordToItem(record) {
  const stockItem = findItem(record.itemId);
  if (!stockItem) return;
  if (record.status === "返却済み") {
    stockItem.status = "未使用";
    clearItemPlacement(stockItem);
    stockItem.currentWard = stockItem.homeWard || stockItem.ownerWard || record.fromWard;
    return;
  }
  stockItem.status = "貸出中";
  clearItemPlacement(stockItem);
  stockItem.currentWard = record.toWard;
}

function returnLoan(recordId) {
  const record = loanRecords.find((candidate) => candidate.id === recordId);
  if (!record || !confirm(`${record.itemId}を返却済みにしますか？`)) return;
  record.status = "返却済み";
  record.returnedDate = todayString();
  const stockItem = findItem(record.itemId);
  if (stockItem) {
    stockItem.status = "未使用";
    clearItemPlacement(stockItem);
  }
  saveLoanRecords();
  saveItems();
  renderAll();
  renderLedger();
  showToast(`${record.itemId}を未使用へ戻しました`);
}

function deleteLoan(recordId) {
  const record = loanRecords.find((candidate) => candidate.id === recordId);
  if (!record || !confirm(`${record.id}を削除しますか？`)) return;
  loanRecords = loanRecords.filter((candidate) => candidate.id !== recordId);
  saveLoanRecords();
  renderLedger();
}

function renderAbout() {
  const releaseNotesHtml = APP_INFO.releaseNotes.length
    ? `
      <section class="release-notes" aria-label="Release Notes">
        <h3>Release Notes</h3>
        <ul>
          ${APP_INFO.releaseNotes
            .map(
              (note) => `
                <li>
                  <strong>Version ${escapeHtml(note.version)}</strong>
                  <span>${escapeHtml(note.summary)}</span>
                </li>
              `,
            )
            .join("")}
        </ul>
      </section>
    `
    : "";

  document.querySelector("#aboutBody").innerHTML = `
    <section class="about-product" aria-label="${escapeHtml(APP_INFO.name)}">
      <img class="about-logo" src="./wardstock-logo.svg" alt="${escapeHtml(APP_INFO.name)}" />
      <h3>${escapeHtml(APP_INFO.name)}</h3>
      <p class="about-tagline">${escapeHtml(APP_INFO.tagline)}</p>
      <p class="about-version">Version ${escapeHtml(APP_INFO.version)}</p>
      <div class="about-owner">
        <p>${escapeHtml(APP_INFO.copyright)}</p>
        <p>${escapeHtml(APP_INFO.rights)}</p>
      </div>
    </section>
    ${releaseNotesHtml}
  `;
}

function renderCategoryButtons() {
  categoryRibbon.innerHTML = "";
  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = `ribbon-button ${activeFilter === "all" ? "active" : ""}`;
  allButton.dataset.filter = "all";
  allButton.textContent = "全体";
  categoryRibbon.append(allButton);

  visibleCategoryEntries().forEach(([key, category]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `ribbon-button ${activeFilter === key ? "active" : ""}`;
    button.dataset.filter = key;
    button.textContent = category.label;
    button.title = "右クリックまたは長押しで非表示";
    button.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      hideCategory(key);
    });
    wireLongPressDelete(button, key);
    categoryRibbon.append(button);
  });

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "ribbon-button add-category-button";
  addButton.id = "addCategoryButton";
  addButton.textContent = "＋";
  addButton.setAttribute("aria-label", "カテゴリーを追加");
  categoryRibbon.append(addButton);
}

function wireLongPressDelete(button, categoryId) {
  let timer = null;
  const clearTimer = () => {
    window.clearTimeout(timer);
    timer = null;
  };
  button.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    timer = window.setTimeout(() => hideCategory(categoryId), 720);
  });
  button.addEventListener("pointerup", clearTimer);
  button.addEventListener("pointerleave", clearTimer);
  button.addEventListener("pointercancel", clearTimer);
}

function openCategoryModal() {
  renderCategoryManagement();
  categoryModal.showModal();
}

function renderCategoryManagement() {
  const activeCategories = Object.entries(categories).filter(([, category]) => !category.internal && !category.hidden);
  const hiddenCategories = Object.entries(categories).filter(([, category]) => !category.internal && category.hidden);
  document.querySelector("#categoryManagementBody").innerHTML = `
    <section class="category-manager-section">
      <h3>表示中のカテゴリー</h3>
      <div class="category-manager-list">
        ${activeCategories.map(([key, category]) => categoryManagerRow(key, category, "hide")).join("")}
      </div>
    </section>
    <section class="category-manager-section">
      <h3>非表示カテゴリー</h3>
      ${
        hiddenCategories.length
          ? `<div class="category-manager-list">${hiddenCategories.map(([key, category]) => categoryManagerRow(key, category, "restore")).join("")}</div>`
          : `<div class="empty compact-empty">非表示のカテゴリーはありません</div>`
      }
    </section>
    <section class="category-manager-section">
      <h3>新しいカテゴリーを追加</h3>
      <form class="category-add-form" id="categoryForm">
        <div class="form-grid">
          <label>
            カテゴリー名
            <input id="newCategoryName" required placeholder="例：点滴スタンド" />
          </label>
          <label>
            カテゴリーID / slug
            <input id="newCategoryId" placeholder="未入力なら自動生成" />
            <small class="field-help">半角英数字・ハイフン・アンダーバーが使えます</small>
          </label>
        </div>
        <div class="modal-actions">
          <button class="primary-button">追加</button>
        </div>
      </form>
    </section>
  `;
}

function categoryManagerRow(key, category, action) {
  const actionLabel = action === "restore" ? "復元" : "削除";
  const actionClass = action === "restore" ? "" : "danger";
  return `
    <div class="category-manager-row">
      <div class="category-manager-name">
        <span class="category-color" style="background:${escapeHtml(category.color)}"></span>
        <strong>${escapeHtml(category.label)}</strong>
      </div>
      <button type="button" class="mini-button ${actionClass}" data-category-action="${action}" data-category-id="${escapeHtml(key)}">${actionLabel}</button>
    </div>
  `;
}

function addCategoryFromForm(event) {
  event.preventDefault();
  const nameInput = document.querySelector("#newCategoryName");
  const slugInput = document.querySelector("#newCategoryId");
  const label = nameInput.value.trim();
  const requestedId = slugInput.value.trim();
  const id = requestedId ? normalizeCategoryId(requestedId) : uniqueCategoryId(label);
  if (!label) {
    alert("カテゴリー名を入力してください。");
    nameInput.focus();
    return;
  }
  if (!id) {
    alert("カテゴリーIDは半角英数字・ハイフン・アンダーバーで入力してください。");
    slugInput.focus();
    return;
  }
  if (requestedId && categories[id] && !categories[id].hidden) {
    alert("このカテゴリーIDはすでに使われています。");
    slugInput.focus();
    return;
  }
  if (requestedId && categories[id]?.hidden) {
    categories[id].hidden = false;
    categories[id].label = label;
    saveCategories();
    renderAll();
    renderCategoryManagement();
    showToast(`${label}をカテゴリーに復元しました`);
    return;
  }
  categories[id] = {
    id,
    label,
    prefix: uniqueCategoryPrefix(normalizeCategoryPrefix(requestedId || label)),
    icon: label.slice(0, 2),
    color: nextCategoryColor(id),
    system: false,
    hidden: false,
  };
  saveCategories();
  renderAll();
  renderCategoryManagement();
  showToast(`${label}をカテゴリーに追加しました`);
}

function uniqueCategoryId(value) {
  const base = normalizeCategoryId(value) || nextGeneratedCategoryId();
  if (!categories[base]) return base;
  let index = 2;
  while (categories[`${base}-${index}`]) index += 1;
  return `${base}-${index}`;
}

function nextGeneratedCategoryId() {
  let index = 1;
  let candidate = `category-${String(index).padStart(3, "0")}`;
  while (categories[candidate]) {
    index += 1;
    candidate = `category-${String(index).padStart(3, "0")}`;
  }
  return candidate;
}

function uniqueCategoryPrefix(value) {
  const base = normalizeCategoryPrefix(value);
  const usedPrefixes = new Set(Object.values(categories).map((category) => category.prefix));
  if (!usedPrefixes.has(base)) return base;
  let index = 2;
  while (usedPrefixes.has(`${base}${index}`)) index += 1;
  return `${base}${index}`;
}

function hideCategory(categoryId) {
  const category = categories[categoryId];
  if (!category || category.internal || category.hidden) return;
  if (!confirm(`${category.label}を非表示にしますか？登録済みの物品は削除されません。`)) return;
  items.forEach((stockItem) => {
    if (stockItem.category === categoryId) stockItem.category = "uncategorized";
  });
  loanRecords.forEach((record) => {
    if (record.category === categoryId) record.category = "uncategorized";
  });
  category.hidden = true;
  if (activeFilter === categoryId) activeFilter = "all";
  saveCategories();
  saveItems();
  saveLoanRecords();
  renderAll();
  if (categoryModal.open) renderCategoryManagement();
  showToast(`${category.label}を非表示にしました。物品は未分類として保持されています`);
}

function restoreCategory(categoryId) {
  const category = categories[categoryId];
  if (!category || category.internal || !category.hidden) return;
  category.hidden = false;
  saveCategories();
  renderAll();
  renderCategoryManagement();
  showToast(`${category.label}を復元しました`);
}

function openAbout() {
  renderAbout();
  aboutModal.showModal();
}

function setupForm() {
  renderCategoryOptions();
  locationInput.innerHTML = locationOptions()
    .map((option) => `<option value="${option.value}">${option.label}</option>`)
    .join("");
  categoryInput.addEventListener("change", updateNextId);
  updateNextId();
}

function renderCategoryOptions() {
  const selected = categoryInput.value;
  categoryInput.innerHTML = visibleCategoryEntries()
    .map(([key, category]) => `<option value="${key}">${category.label}</option>`)
    .join("");
  if (isSelectableCategory(selected)) categoryInput.value = selected;
}

function updateNextId() {
  const category = categoryInput.value;
  const prefix = categoryMeta(category).prefix;
  const max = items
    .filter((stockItem) => stockItem.id.startsWith(`${prefix}-`))
    .map((stockItem) => Number(stockItem.id.split("-")[1]))
    .filter(Number.isFinite)
    .reduce((largest, current) => Math.max(largest, current), 0);
  idInput.value = `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

function wireEvents() {
  categoryRibbon.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter], #addCategoryButton");
    if (!button) return;
    if (button.id === "addCategoryButton") {
      openCategoryModal();
      return;
    }
    if (button.dataset.filter) {
      activeFilter = button.dataset.filter;
      unusedOnly = false;
      renderAll();
    }
  });

  document.querySelector("#searchInput").addEventListener("input", (event) => {
    searchText = event.target.value.trim();
    renderAll();
  });

  document.querySelector("#unusedOnlyButton").addEventListener("click", () => {
    unusedOnly = !unusedOnly;
    renderItemList();
  });

  document.querySelector("#newItemButton").addEventListener("click", () => {
    document.querySelector("#itemForm").reset();
    document.querySelector("#ownerInput").value = "5病棟";
    updateNextId();
    itemModal.showModal();
  });

  document.querySelector("#itemForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const idValidation = validateItemId(idInput.value);
    if (!idValidation.ok) {
      showIdError(idInput, idValidation.message);
      return;
    }
    clearIdError(idInput);
    items.push(
      item(
        idValidation.id,
        categoryInput.value,
        document.querySelector("#nameInput").value.trim(),
        document.querySelector("#ownerInput").value.trim(),
        locationInput.value,
        document.querySelector("#statusInput").value,
        document.querySelector("#memoInput").value.trim(),
      ),
    );
    saveItems();
    itemModal.close();
    renderAll();
  });

  categoryModal.addEventListener("submit", (event) => {
    if (event.target.id === "categoryForm") addCategoryFromForm(event);
  });

  categoryModal.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category-action]");
    if (!button) return;
    if (button.dataset.categoryAction === "hide") hideCategory(button.dataset.categoryId);
    if (button.dataset.categoryAction === "restore") restoreCategory(button.dataset.categoryId);
  });

  document.querySelector("#loanLedgerButton").addEventListener("click", () => {
    renderLedger();
    ledgerModal.showModal();
  });

  document.querySelector("#logoAboutButton").addEventListener("click", openAbout);

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog").close());
  });

  document.querySelectorAll("dialog.modal").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
}

function renderAll() {
  if (activeFilter !== "all" && !isSelectableCategory(activeFilter)) activeFilter = "all";
  renderCategoryButtons();
  renderCategoryOptions();
  renderMap();
  renderItemList();
  updateNextId();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cssEscape(value) {
  if (window.CSS && CSS.escape) return CSS.escape(value);
  return String(value).replace(/["\\]/g, "\\$&");
}

setupForm();
wireEvents();
renderAll();
