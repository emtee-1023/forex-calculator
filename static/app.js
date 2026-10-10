const POINT_PER_PIP = 10;

const PIP_SIZE = {
  forex: 0.0001,
  jpy: 0.01,
  gold: 0.10,
};

const ASSET_NAMES = {
  forex: "Forex Pair",
  jpy: "JPY Pair",
  gold: "Gold (XAU/USD)",
};

const state = {
  account: "standard",
  asset: "forex",
  direction: "buy",
  entry: 1.085,
  sl: 1.0835,
  spread: 0,
  numTp: 3,
  tps: [1.0875, 1.0895, 1.0920],
  balance: 100,
  risk: 1,
};

function num(id) {
  const v = parseFloat(document.getElementById(id).value);
  return Number.isFinite(v) ? v : 0;
}

function readState() {
  state.entry = num("entry");
  state.sl = num("sl");
  state.spread = num("spread");
  state.balance = num("balance");
  state.risk = num("risk");
  state.numTp = parseInt(document.getElementById("numTp").value, 10);
  state.tps = [];
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById("tp" + i);
    if (el) state.tps.push(num("tp" + i));
  }
}

function fmt(n, digits = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

function compute() {
  readState();

  const pipSize = PIP_SIZE[state.asset];
  const pipValue = state.account === "cent" ? 0.10 : 10.0;
  const pointSize = pipSize / POINT_PER_PIP;
  const spreadPrice = state.spread * pointSize;
  const spreadPips = state.spread / POINT_PER_PIP;
  const riskAmount = state.balance * (state.risk / 100);

  const summary = [];
  const warnings = [];
  const tpResults = [];

  summary.push({ label: "Account", value: state.account === "cent" ? "Cent" : "Standard" });
  summary.push({ label: "Asset", value: ASSET_NAMES[state.asset] });
  summary.push({ label: "Direction", value: state.direction.toUpperCase() });
  summary.push({ label: "Entry", value: fmt(state.entry, 5) });
  summary.push({ label: "Stop Loss", value: fmt(state.sl, 5) });
  summary.push({ label: "Balance", value: "$" + fmt(state.balance) });
  summary.push({ label: "Risk", value: "$" + fmt(riskAmount) + " (" + fmt(state.risk) + "%)" });
  summary.push({
    label: "Spread",
    value: fmt(state.spread) + " points (" + fmt(spreadPips) + " pips = " + fmt(spreadPrice) + ")",
  });

  if (Math.abs(state.entry - state.sl) < 1e-12) {
    warnings.push({ text: "Entry and Stop Loss cannot be the same price.", error: true });
  } else {
    if (state.direction === "buy" && state.sl >= state.entry) {
      warnings.push({ text: "BUY signal should have SL below entry." });
    }
    if (state.direction === "sell" && state.sl <= state.entry) {
      warnings.push({ text: "SELL signal should have SL above entry." });
    }
  }

  const slPips = Math.abs(state.entry - state.sl) / pipSize + spreadPips;
  const lots = slPips > 0 ? riskAmount / (slPips * pipValue) : 0;
  const spreadCost = spreadPips * pipValue * lots;
  const breakEven =
    state.direction === "buy" ? state.entry + spreadPrice : state.entry - spreadPrice;

  summary.push({ label: "Spread cost", value: "$" + fmt(spreadCost) + " at " + fmt(lots) + " lots" });
  summary.push({ label: "Break-even", value: fmt(breakEven, 5) });
  summary.push({ label: "Lots", value: fmt(lots) });

  state.tps.forEach((tp, idx) => {
    const n = idx + 1;
    const tpPips = Math.abs(tp - state.entry) / pipSize - spreadPips;
    if (tpPips <= 0) {
      tpResults.push({ name: "TP" + n, price: tp, unreachable: true, text: "UNREACHABLE (spread exceeds target)" });
      return;
    }
    const profit = tpPips * pipValue * lots;
    const rr = riskAmount > 0 ? profit / riskAmount : 0;
    const returnPct = state.balance > 0 ? (profit / state.balance) * 100 : 0;
    tpResults.push({
      name: "TP" + n,
      price: tp,
      unreachable: false,
      profit: "$" + fmt(profit),
      returnPct: "+" + fmt(returnPct) + "%",
      rr: "RR 1:" + fmt(rr),
    });
  });

  const footer = [];
  footer.push("Enter volume <strong>" + fmt(lots) + "</strong> in MT5.");
  if (lots < 0.01) {
    footer.push("WARNING: Calculated size is below broker minimum volume (0.01).");
  }

  return { summary, warnings, tpResults, footer };
}

function render() {
  const { summary, warnings, tpResults, footer } = compute();

  const summaryEl = document.getElementById("summary");
  summaryEl.innerHTML = summary
    .map((r) => `<div class="row"><span class="label">${r.label}</span><span class="value">${r.value}</span></div>`)
    .join("");

  const warningsEl = document.getElementById("warnings");
  warningsEl.innerHTML = warnings
    .map((w) => `<div class="warning${w.error ? " error" : ""}">${w.text}</div>`)
    .join("");

  const tpEl = document.getElementById("tpResults");
  tpEl.innerHTML = tpResults
    .map((t) => {
      if (t.unreachable) {
        return `<div class="tp-row unreachable"><span class="tp-name">${t.name} @ ${t.price}</span><span class="tp-profit">${t.text}</span></div>`;
      }
      return `<div class="tp-row"><span class="tp-name">${t.name} @ ${t.price}</span><span class="tp-profit">${t.profit} (${t.returnPct}) <span class="rr">${t.rr}</span></span></div>`;
    })
    .join("");

  const footerEl = document.getElementById("footer");
  footerEl.innerHTML = `<div class="hint">${footer.join("<br />")}</div>`;
}

function renderTpInputs() {
  const container = document.getElementById("tpInputs");
  const n = state.numTp;
  let html = "";
  for (let i = 1; i <= n; i++) {
    const val = state.tps[i - 1] ?? (state.entry * (1 + i * 0.002)).toFixed(5);
    html += `<div class="field"><label for="tp${i}">TP${i} price</label><input id="tp${i}" type="number" step="any" value="${val}" /></div>`;
  }
  container.innerHTML = html;
}

function setupSegmented() {
  document.querySelectorAll(".segmented").forEach((group) => {
    group.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        group.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state[btn.dataset.name] = btn.dataset.value;
        render();
      });
    });
  });
}

function setupInputs() {
  ["entry", "sl", "spread", "balance", "risk"].forEach((id) => {
    document.getElementById(id).addEventListener("input", render);
  });
  document.getElementById("numTp").addEventListener("change", () => {
    state.numTp = parseInt(document.getElementById("numTp").value, 10);
    renderTpInputs();
    setupTpInputs();
    render();
  });
}

function setupTpInputs() {
  for (let i = 1; i <= state.numTp; i++) {
    const el = document.getElementById("tp" + i);
    if (el) el.addEventListener("input", render);
  }
}

function init() {
  setupSegmented();
  setupInputs();
  renderTpInputs();
  setupTpInputs();
  render();
}

document.addEventListener("DOMContentLoaded", init);
