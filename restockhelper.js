// ====================== ITEM LISTS ======================
window.valuableitems = [];
window.ignoreItems = [];
window.itemnameswildcards = [];
window.soldItemsMap = new Map();

// ====================== SETTINGS ======================
const CLICK_DELAY_MIN = 250;
const CLICK_DELAY_MAX = 600;
const FILL_DELAY_MIN = 200;
const FILL_DELAY_MAX = 500;

const ITEMGITURL =
  "https://raw.githubusercontent.com/skaep/RestockHelper/main/items.json";
const SOLDITEMS_URL =
  "https://raw.githubusercontent.com/skaep/RestockHelper/refs/heads/main/solditems.json";

let automationEnabled = localStorage.getItem("npAutomation") === "true";

// ====================== DEFAULT SETTINGS ======================
const defaultSettings = {
  wildcardTextColor: "#800080",
  greyedOpacity: 0.5,
  autoClickValueItems: true,
  valueItemColor: "#800080",
  tenThousandColor: "#FF8C00",
  otherPrices: [5000, 2500],
  otherPricesColor: "#008000",
  profitThreshold: 10000,
  highProfitOutline: "#FFD700",
};

const settings = JSON.parse(localStorage.getItem("npAutoSettings") || "{}");
for (const key in defaultSettings) {
  if (settings[key] === undefined) settings[key] = defaultSettings[key];
}

function saveSettings() {
  localStorage.setItem("npAutoSettings", JSON.stringify(settings));
}

// ====================== UTIL ======================
function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ====================== SOLD ITEMS ======================
async function loadSoldItems(forceRefresh = false) {
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  const now = Date.now();

  const cached = localStorage.getItem("npSoldCache");
  const cachedTime = localStorage.getItem("npSoldCacheTime");

  if (cached && !forceRefresh) {
    try {
      const data = JSON.parse(cached);
      window.soldItemsMap = new Map(
        data.items.map((item) => [item.name, item.lastSoldFor]),
      );
    } catch {}
  }

  if (
    forceRefresh ||
    !cachedTime ||
    now - parseInt(cachedTime) > CACHE_DURATION
  ) {
    try {
      forceRefresh ? console.log("Items reloaded") : "";
      const res = await fetch(SOLDITEMS_URL);
      const data = await res.json();

      window.soldItemsMap = new Map(
        data.items.map((item) => [item.name, item.lastSoldFor]),
      );

      localStorage.setItem("npSoldCache", JSON.stringify(data));
      localStorage.setItem("npSoldCacheTime", now.toString());

      applyShopStyling();
    } catch {}
  }
}

// ====================== LOAD ITEM LISTS ======================
async function loadItemLists() {
  const cached = localStorage.getItem("npItemCache");

  if (cached) {
    try {
      const data = JSON.parse(cached);
      window.valuableitems = data.valuableitems || [];
      window.ignoreItems = data.ignoreItems || [];
      window.itemnameswildcards = data.itemnameswildcards || [];
    } catch {}
  }

  applyShopStyling();

  try {
    const res = await fetch(ITEMGITURL);
    const data = await res.json();

    window.valuableitems = data.valuableitems || [];
    window.ignoreItems = data.ignoreItems || [];
    window.itemnameswildcards = data.itemnameswildcards || [];

    localStorage.setItem("npItemCache", JSON.stringify(data));
    localStorage.setItem("npItemCacheTime", Date.now().toString());

    applyShopStyling();
  } catch {}
}

// ====================== STATUS INDICATOR ======================
function createStatusIndicator() {
  if (document.getElementById("np-auto-indicator")) return;

  const indicator = document.createElement("div");
  indicator.id = "np-auto-indicator";
  indicator.style.cssText = `
    position:fixed;bottom:15px;right:15px;padding:8px 14px;
    border-radius:8px;font-size:14px;font-weight:bold;
    z-index:99999;cursor:pointer;
  `;

  indicator.onclick = () => {
    automationEnabled = !automationEnabled;
    localStorage.setItem("npAutomation", automationEnabled);
    updateIndicator();
  };

  document.body.appendChild(indicator);
  updateIndicator();
}

function updateIndicator() {
  const el = document.getElementById("np-auto-indicator");
  if (!el) return;
  el.textContent = automationEnabled ? "NP Auto: ON" : "NP Auto: OFF";
  el.style.backgroundColor = automationEnabled ? "purple" : "#444";
  el.style.color = automationEnabled ? "white" : "#ccc";
}

// ====================== SETTINGS PANEL ======================
function createSettingsPanel() {
  if (document.getElementById("np-auto-settings")) return;

  const panel = document.createElement("div");
  panel.id = "np-auto-settings";
  panel.style.cssText = `
    position:fixed;bottom:15px;left:15px;padding:10px;
    border:1px solid #ccc;border-radius:8px;background:white;
    z-index:99999;font-size:14px;
    box-shadow:0 0 10px rgba(0,0,0,0.3);
    display:flex;flex-direction:column;gap:6px;
  `;

  panel.innerHTML = `
    <div><b>Settings</b></div>
    <label>Wildcard <input type="color" id="wildcardColor" value="${settings.wildcardTextColor}"></label>
    <label>Value Item <input type="color" id="valueColor" value="${settings.valueItemColor}"></label>
    <label>10k Price <input type="color" id="tenKColor" value="${settings.tenThousandColor}"></label>
    <label>Other Prices <input type="color" id="otherPriceColor" value="${settings.otherPricesColor}"></label>
    <label>Grey Opacity <input type="range" id="greyOpacity" min="0" max="1" step="0.01" value="${settings.greyedOpacity}"></label>
    <label>Auto-click <input type="checkbox" id="autoClickVal" ${settings.autoClickValueItems ? "checked" : ""}></label>
    <label>Profit Threshold <input type="number" id="profitThreshold" value="${settings.profitThreshold}"></label>
    <button id="reloadItemBtn">Reload Item Lists</button>
  `;

  document.body.appendChild(panel);

  panel.querySelector("#wildcardColor").oninput = (e) => {
    settings.wildcardTextColor = e.target.value;
    saveSettings();
    applyShopStyling();
  };
  panel.querySelector("#valueColor").oninput = (e) => {
    settings.valueItemColor = e.target.value;
    saveSettings();
    applyShopStyling();
  };
  panel.querySelector("#tenKColor").oninput = (e) => {
    settings.tenThousandColor = e.target.value;
    saveSettings();
    applyShopStyling();
  };
  panel.querySelector("#otherPriceColor").oninput = (e) => {
    settings.otherPricesColor = e.target.value;
    saveSettings();
    applyShopStyling();
  };
  panel.querySelector("#greyOpacity").oninput = (e) => {
    settings.greyedOpacity = parseFloat(e.target.value);
    saveSettings();
    applyShopStyling();
  };
  panel.querySelector("#autoClickVal").onchange = (e) => {
    settings.autoClickValueItems = e.target.checked;
    saveSettings();
  };
  panel.querySelector("#profitThreshold").oninput = (e) => {
    settings.profitThreshold = parseInt(e.target.value, 10) || 0;
    saveSettings();
    applyShopStyling();
  };
  panel.querySelector("#reloadItemBtn").onclick = () => {
    localStorage.removeItem("npItemCache");
    localStorage.removeItem("npSoldCache");
    loadItemLists();
    loadSoldItems(true);
  };
}

// ====================== HAGGLE AUTO-FILL ======================
function initHaggleAutofill() {
  const tryFill = () => {
    if (!automationEnabled) return;
    const input = document.querySelector('input[name="current_offer"]');
    if (!input) {
      setTimeout(tryFill, 150);
      return;
    }
    const price = sessionStorage.getItem("autoOfferPrice");
    if (!price) return;
    setTimeout(
      () => {
        input.focus();
        input.value = price;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.select();
      },
      randomDelay(FILL_DELAY_MIN, FILL_DELAY_MAX),
    );
  };
  tryFill();
}

// ====================== SHOP STYLING ======================
let stylingScheduled = false;

function applyShopStyling() {
  if (stylingScheduled) return;
  stylingScheduled = true;

  requestAnimationFrame(() => {
    const boxes = document.getElementsByClassName("shop-item");
    if (!boxes.length) {
      stylingScheduled = false;
      return;
    }

    const valuableSet = new Set(window.valuableitems);
    const ignoreSet = new Set(window.ignoreItems);

    for (const box of boxes) {
      const nameElem = box.querySelector(".item-name b");
      const itemname = nameElem ? nameElem.innerText.trim() : "";
      if (!itemname) continue;

      const priceText = box.querySelectorAll(".item-stock")[1]?.innerText || "";
      const StockAmountText =
        box.querySelectorAll(".item-stock")[0]?.innerText || "";
      const StockAmountString = StockAmountText.match(/\d+/);
      const StockAmount = StockAmountString
        ? parseInt(StockAmountString[0], 10)
        : null;
      const priceMatch = priceText.match(/Cost:\s*([\d,]+)/i);
      const price = priceMatch
        ? parseInt(priceMatch[1].replace(/,/g, ""), 10)
        : 0;

      // Reset styles safely
      box.style.opacity = "";
      box.style.filter = "";
      box.style.backgroundColor = "";
      box.style.color = "";
      box.style.outline = "";

      const soldPrice = window.soldItemsMap.get(itemname);
      const profit = soldPrice ? soldPrice - price : 0;
      const isBigProfit = soldPrice && profit > settings.profitThreshold;

      // ================= SOLD PRICE DISPLAY =================
      let soldDiv = box.querySelector(".np-sold-info");

      if (soldPrice) {
        if (!soldDiv) {
          soldDiv = document.createElement("div");
          soldDiv.className = "np-sold-info";
          soldDiv.style.fontSize = "12px";
          soldDiv.style.marginTop = "4px";
          soldDiv.style.fontWeight = "bold";
          box.appendChild(soldDiv);
        }

        soldDiv.textContent =
          `Sell: ${soldPrice.toLocaleString()} NP` +
          (profit > 0 ? `  (+${profit.toLocaleString()})` : "");

        soldDiv.style.color = profit > 0 ? "green" : "#0066cc";
      } else if (soldDiv) {
        soldDiv.remove();
      }
      // ======================================================

      const isIgnored = ignoreSet.has(itemname);
      const isExactValuable = valuableSet.has(itemname);
      const isWildcardMatch = window.itemnameswildcards.some((w) =>
        itemname.toLowerCase().includes(w.toLowerCase()),
      );
      const isTenK = price === 10000;
      const isOtherPrice = settings.otherPrices.includes(price);

      if (isIgnored) {
        box.style.opacity = settings.greyedOpacity;
        box.style.filter = "grayscale(70%)";
      } else if (isBigProfit) {
        box.style.outline = `2px solid ${settings.highProfitOutline}`;
      } else if (isExactValuable) {
        box.style.backgroundColor = settings.valueItemColor;
        box.style.color = "white";
      } else if (isTenK) {
        box.style.color = settings.tenThousandColor;
      } else if (isOtherPrice) {
        box.style.color = settings.otherPricesColor;
      } else if (isWildcardMatch) {
        box.style.color = settings.wildcardTextColor;
      } else {
        box.style.opacity = settings.greyedOpacity;
        box.style.filter = "grayscale(70%)";
      }

      const clickable = box.querySelector(".item-img");
      if (clickable && !clickable.dataset.listenerAdded) {
        clickable.dataset.listenerAdded = "true";
        clickable.addEventListener("click", () => {
          sessionStorage.setItem("autoOfferPrice", price.toString());
        });

        if (
          automationEnabled &&
          settings.autoClickValueItems &&
          isExactValuable
        ) {
          setTimeout(
            () => clickable.click(),
            randomDelay(CLICK_DELAY_MIN, CLICK_DELAY_MAX),
          );
        }
      }
    }

    stylingScheduled = false;
  });
}

// ====================== INIT ======================
function init() {
  createStatusIndicator();
  createSettingsPanel();
  initHaggleAutofill();
  loadItemLists();
  loadSoldItems();
}

if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  init();
} else {
  document.addEventListener("DOMContentLoaded", init);
}

new MutationObserver(applyShopStyling).observe(document.body, {
  childList: true,
  subtree: true,
});
