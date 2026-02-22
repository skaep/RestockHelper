// ====================== SETTINGS ======================
const CLICK_DELAY_MIN = 250; // ms
const CLICK_DELAY_MAX = 600; // ms
const FILL_DELAY_MIN = 200; // ms
const FILL_DELAY_MAX = 500; // ms
const HOTKEY = { key: "F8" }; // Press F8 to toggle automation
const ITEMGITURL =
  "https://raw.githubusercontent.com/skaep/RestockHelper/main/items.json";
// ====================== STATE ======================
let automationEnabled = localStorage.getItem("npAutomation") === "true";

// ====================== DEFAULT USER SETTINGS ======================
const defaultSettings = {
  wildcardTextColor: "#800080", // purple
  greyedOpacity: 0.5,
  autoClickValueItems: true,
  valueItemColor: "#800080",
  tenThousandColor: "#FF8C00",
  otherPrices: [5000, 2500],
  otherPricesColor: "#008000",
};

// Load saved settings or defaults
const settings = JSON.parse(localStorage.getItem("npAutoSettings") || "{}");
for (const key in defaultSettings) {
  if (settings[key] === undefined) settings[key] = defaultSettings[key];
}

// ====================== UTIL ======================
function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ====================== STATUS INDICATOR ======================
function createStatusIndicator() {
  if (document.getElementById("np-auto-indicator")) return;

  const indicator = document.createElement("div");
  indicator.id = "np-auto-indicator";
  indicator.style.position = "fixed";
  indicator.style.bottom = "15px";
  indicator.style.right = "15px";
  indicator.style.padding = "8px 14px";
  indicator.style.borderRadius = "8px";
  indicator.style.fontSize = "14px";
  indicator.style.fontWeight = "bold";
  indicator.style.zIndex = "99999";
  indicator.style.boxShadow = "0 0 10px rgba(0,0,0,0.4)";
  indicator.style.transition = "0.2s ease";
  indicator.style.cursor = "pointer";
  indicator.addEventListener("click", () => {
    automationEnabled = !automationEnabled;
    localStorage.setItem("npAutomation", automationEnabled);
    updateIndicator();
  });

  document.body.appendChild(indicator);
  updateIndicator();
}

function updateIndicator() {
  const indicator = document.getElementById("np-auto-indicator");
  if (!indicator) return;

  if (automationEnabled) {
    indicator.textContent = "NP Auto: ON";
    indicator.style.backgroundColor = "purple";
    indicator.style.color = "white";
  } else {
    indicator.textContent = "NP Auto: OFF";
    indicator.style.backgroundColor = "#444";
    indicator.style.color = "#ccc";
  }
}

// ====================== HOTKEY ======================
document.addEventListener("keydown", (e) => {
  if (e.key === HOTKEY.key) {
    automationEnabled = !automationEnabled;
    localStorage.setItem("npAutomation", automationEnabled);
    updateIndicator();
    console.log("Automation toggled:", automationEnabled);
  }
});

// ====================== SETTINGS PANEL ======================
function createSettingsPanel() {
  if (document.getElementById("np-auto-settings")) return;

  const panel = document.createElement("div");
  panel.id = "np-auto-settings";
  panel.style.position = "fixed";
  panel.style.bottom = "15px";
  panel.style.left = "15px";
  panel.style.padding = "10px";
  panel.style.border = "1px solid #ccc";
  panel.style.borderRadius = "8px";
  panel.style.backgroundColor = "white";
  panel.style.zIndex = "99999";
  panel.style.fontSize = "14px";
  panel.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
  panel.style.display = "flex";
  panel.style.flexDirection = "column";
  panel.style.gap = "6px";

  panel.innerHTML = `
    <div style="margin-bottom:5px;"><b>Settings</b></div>
    <div style="display:flex; justify-content: space-between; align-items: center;">
      <label>Wildcard Text Color:</label>
      <input type="color" id="wildcardColor" value="${
        settings.wildcardTextColor
      }">
    </div>
    <div style="display:flex; justify-content: space-between; align-items: center;">
      <label>Value Item Color:</label>
      <input type="color" id="valueColor" value="${settings.valueItemColor}">
    </div>
    <div style="display:flex; justify-content: space-between; align-items: center;">
      <label>10,000 Price Color:</label>
      <input type="color" id="tenKColor" value="${settings.tenThousandColor}">
    </div>
    <div style="display:flex; justify-content: space-between; align-items: center;">
      <label>Other Prices Color:</label>
      <input type="color" id="otherPriceColor" value="${
        settings.otherPricesColor
      }">
    </div>
    <div style="display:flex; justify-content: space-between; align-items: center;">
      <label>Greyed Opacity:</label>
      <input type="range" id="greyOpacity" min="0" max="1" step="0.01" value="${
        settings.greyedOpacity
      }">
    </div>
    <div style="display:flex; justify-content: space-between; align-items: center;">
      <label>Auto-click Value Items:</label>
      <input type="checkbox" id="autoClickVal" ${
        settings.autoClickValueItems ? "checked" : ""
      }>
    </div>
  `;

  document.body.appendChild(panel);

  // Event listeners
  document.getElementById("wildcardColor").addEventListener("input", (e) => {
    settings.wildcardTextColor = e.target.value;
    localStorage.setItem("npAutoSettings", JSON.stringify(settings));
    applyShopStyling();
  });

  document.getElementById("valueColor").addEventListener("input", (e) => {
    settings.valueItemColor = e.target.value;
    localStorage.setItem("npAutoSettings", JSON.stringify(settings));
    applyShopStyling();
  });

  document.getElementById("tenKColor").addEventListener("input", (e) => {
    settings.tenThousandColor = e.target.value;
    localStorage.setItem("npAutoSettings", JSON.stringify(settings));
    applyShopStyling();
  });

  document.getElementById("otherPriceColor").addEventListener("input", (e) => {
    settings.otherPricesColor = e.target.value;
    localStorage.setItem("npAutoSettings", JSON.stringify(settings));
    applyShopStyling();
  });

  document.getElementById("greyOpacity").addEventListener("input", (e) => {
    settings.greyedOpacity = parseFloat(e.target.value);
    localStorage.setItem("npAutoSettings", JSON.stringify(settings));
    applyShopStyling();
  });

  document.getElementById("autoClickVal").addEventListener("change", (e) => {
    settings.autoClickValueItems = e.target.checked;
    localStorage.setItem("npAutoSettings", JSON.stringify(settings));
  });
}

// ====================== HAGGLE PAGE AUTO-FILL ======================
(function autoFillHaggle() {
  const tryFill = () => {
    if (!automationEnabled) return;

    const offerInput = document.querySelector('input[name="current_offer"]');
    if (!offerInput) {
      setTimeout(tryFill, 120);
      return;
    }

    const savedPrice = sessionStorage.getItem("autoOfferPrice");
    if (!savedPrice) return;

    const delay = randomDelay(FILL_DELAY_MIN, FILL_DELAY_MAX);
    setTimeout(() => {
      offerInput.focus();
      offerInput.value = savedPrice;
      offerInput.dispatchEvent(new Event("input", { bubbles: true }));
      offerInput.select();
      console.log("Auto-filled offer:", savedPrice);
    }, delay);
  };

  tryFill();
})();

// ====================== SHOP PAGE AUTOMATION ======================
async function loadItemListsAndRun() {
  const url = ITEMGITURL;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch item list");
    const data = await res.json();
    window.valuableitems = data.valuableitems || [];
    window.ignoreItems = data.ignoreItems || [];
    window.itemnameswildcards = data.itemnameswildcards || [];
    console.log("Item lists loaded from JSON");
    applyShopStyling();
  } catch (err) {
    console.error("Error loading item lists:", err);
  }
}

function applyShopStyling() {
  const boxes = document.getElementsByClassName("shop-item");
  if (!boxes || boxes.length === 0) return;
  const valuableSet = new Set(valuableitems);

  for (const box of boxes) {
    const itemname = box.children[1]?.innerText.trim() || "";
    const priceText = box.children[3]?.innerText.trim() || "";

    let price = 0;
    const priceMatch = priceText.match(/Cost:\s*([\d,]+)/i);
    if (priceMatch) price = parseInt(priceMatch[1].replace(/,/g, ""), 10);

    const isIgnored = ignoreItems.includes(itemname);
    const isExactValuable = valuableSet.has(itemname);
    const isWildcardMatch = itemnameswildcards.some((w) =>
      itemname.toLowerCase().includes(w.toLowerCase())
    );
    const isTenK = price === 10000;
    const isOtherPrice = settings.otherPrices.includes(price);

    // ================= STYLING =================
    if (isIgnored) {
      box.style.opacity = settings.greyedOpacity;
      box.style.filter = "grayscale(70%)";
      box.style.backgroundColor = "";
      box.style.color = "";
    } else if (isExactValuable) {
      box.style.backgroundColor = settings.valueItemColor;
      box.style.color = "white";
      box.style.opacity = "1";
      box.style.filter = "none";
    } else if (isTenK) {
      box.style.color = settings.tenThousandColor;
      box.style.opacity = "1";
      box.style.filter = "none";
    } else if (isOtherPrice) {
      box.style.color = settings.otherPricesColor;
      box.style.opacity = "1";
      box.style.filter = "none";
    } else if (isWildcardMatch) {
      box.style.color = settings.wildcardTextColor;
      box.style.opacity = "1";
      box.style.filter = "none";
    } else {
      box.style.opacity = settings.greyedOpacity;
      box.style.filter = "grayscale(70%)";
    }

    // ================= CLICK HOOK =================
    const clickable = box.querySelector(".item-img");
    if (clickable) {
      clickable.addEventListener("click", () => {
        sessionStorage.setItem("autoOfferPrice", price.toString());
        console.log("Clicked item:", itemname, "Price stored:", price);
      });

      if (
        automationEnabled &&
        settings.autoClickValueItems &&
        isExactValuable
      ) {
        const delay = randomDelay(CLICK_DELAY_MIN, CLICK_DELAY_MAX);
        console.log(
          "Auto-clicking valuable item:",
          itemname,
          "Price:",
          price,
          "in",
          delay,
          "ms"
        );
        setTimeout(() => clickable.click(), delay);
        break;
      }
    }
  }
}

// ====================== DYNAMIC INIT ======================
function initAutomationUI() {
  createStatusIndicator();
  createSettingsPanel();
  applyShopStyling();
}

const observer = new MutationObserver(() => initAutomationUI());
observer.observe(document.body, { childList: true, subtree: true });

window.addEventListener("DOMContentLoaded", () => {
  initAutomationUI();
  loadItemListsAndRun();
});
