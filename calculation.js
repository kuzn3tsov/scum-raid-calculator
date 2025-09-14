let elementHealth = {};

async function loadData() {
  try {
    const res = await fetch("elementHealth.json");
    elementHealth = await res.json();
    initCustomDropdown();
    attachExplosiveListeners();
  } catch (err) {
    console.error("Failed loading elementHealth.json:", err);
  }
}

function initCustomDropdown() {
  const selectedDiv = document.querySelector(".select-selected");
  const itemsDiv = document.querySelector(".select-items");

  if (!selectedDiv || !itemsDiv) {
    console.error("Custom dropdown HTML structure missing.");
    return;
  }

  itemsDiv.innerHTML = "";

  const categories = {
    "Outer Walls": [
      "Outer wall 1/4 m","Outer wall 1/2 m","Outer wall 1 m",
      "Outer wall 2 m","Outer wall 3 m","Outer wall 4 m","Outer wall 5 m"
    ],
    "Base Elements": ["Base element"],
    "Doors": ["Outer wall door (any)", "Base element door (single/double)"],
    "Hatches": ["Base element hatch door"],
    "Others": ["Standalone BarbedWire"]
  };

  Object.entries(categories).forEach(([groupName, keys]) => {
    const header = document.createElement("div");
    header.classList.add("dropdown-group");
    header.textContent = groupName;
    itemsDiv.appendChild(header);

    keys.forEach(elementKey => {
      if (elementHealth[elementKey]) {
        Object.keys(elementHealth[elementKey]).forEach(materialKey => {
          const option = document.createElement("div");
          option.textContent = `${elementKey} (${materialKey})`;
          option.addEventListener("click", () => {
            selectedDiv.textContent = option.textContent;
            selectedDiv.dataset.value = `${elementKey}|${materialKey}`;
            itemsDiv.classList.add("select-hide");
            updateResult(true);
          });
          itemsDiv.appendChild(option);
        });
      }
    });
  });

  selectedDiv.addEventListener("click", () => {
    itemsDiv.classList.toggle("select-hide");
  });
}

function attachExplosiveListeners() {
  document.querySelectorAll("#explosive-list input").forEach(cb =>
    cb.addEventListener("change", () => updateResult(false))
  );
  document.getElementById("copy-btn").addEventListener("click", copyPlan);
}

function updateResult(preselectBest = false) {
  const selected = document.querySelector(".select-selected").dataset.value;
  const resultEl = document.getElementById("result");
  const totalEl = document.getElementById("total-explosives");

  if (!selected) return;

  const [elementName, material] = selected.split("|");
  const data = elementHealth[elementName][material];
  const { health, damage } = data;

  const checkboxes = document.querySelectorAll("#explosive-list input");
  document.getElementById("explosive-list").classList.remove("select-hide");

  let bestExplosive = null;
  let maxDamage = 0;
  checkboxes.forEach(cb => {
    const dmg = damage[cb.value] || 0;
    if (dmg > maxDamage) {
      maxDamage = dmg;
      bestExplosive = cb.value;
    }
  });

  if (preselectBest) {
    checkboxes.forEach(cb => cb.checked = (cb.value === bestExplosive));
  }

  let total = 0;
  let html = "";

  checkboxes.forEach(cb => {
    const dmg = damage[cb.value] || 0;
    if (!dmg) {
      html += `<div>${label(cb.value)}: Not effective</div>`;
    } else {
      const needed = Math.ceil(health / dmg);
      if (cb.checked) total += needed;
      html += `<div class="${cb.value === bestExplosive ? "best" : ""}">
        ${label(cb.value)}: ${needed} needed
      </div>`;
    }
  });

  totalEl.textContent = `Total Explosives Needed: ${total}`;
  resultEl.classList.remove("select-hide");
  resultEl.innerHTML = totalEl.outerHTML + html;
}

function copyPlan() {
  const text = document.getElementById("result").innerText;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById("copy-btn");
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = "Copy Plan"), 1500);
  });
}

function label(key) {
  const map = {
    VHS_BG: "VHS BG",
    M82: "M82",
    PipeBomb: "Pipe Bomb",
    AT4_HEAT: "AT4 HEAT",
    Frag: "Frag Grenade",
    TNT: "TNT",
    RPG7: "RPG7",
    C4: "C4"
  };
  return map[key] || key;
}

document.addEventListener("DOMContentLoaded", loadData);
