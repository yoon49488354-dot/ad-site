(function () {
  const units = [
    { id: "ms", label: "미터/초 (m/s)", short: "m/s", name: "미터/초", base: 1 },
    { id: "kmh", label: "킬로미터/시 (km/h)", short: "km/h", name: "킬로미터/시", base: 1 / 3.6 },
    { id: "fts", label: "피트/초 (ft/s)", short: "ft/s", name: "피트/초", base: 0.3048 },
    { id: "mph", label: "마일/시 (mi/h, mph)", short: "mi/h(mph)", name: "마일/시", base: 0.44704 },
    { id: "ins", label: "인치/초 (in/s)", short: "in/s", name: "인치/초", base: 0.0254 },
    { id: "fth", label: "피트/시 (ft/h)", short: "ft/h", name: "피트/시", base: 0.3048 / 3600 },
    { id: "knot", label: "노트 (kn)", short: "노트(kn)", name: "노트", base: 0.514444444 },
    { id: "mach", label: "마하 (mach)", short: "마하(mach)", name: "마하", base: 340 }
  ];
  const input = document.querySelector("#speed-value");
  const fromSelect = document.querySelector("#speed-from");
  const toSelect = document.querySelector("#speed-to");
  const inputError = document.querySelector("#speed-input-error");
  const result = document.querySelector("#speed-result");
  const equation = document.querySelector("#speed-equation");
  const table = document.querySelector("#speed-reference-table");
  const tableHead = document.querySelector("#speed-table-head");
  const tableBody = document.querySelector("#speed-table-body");
  const tableSummary = document.querySelector("#speed-table-summary");
  const formulaDescription = document.querySelector("#speed-formula-description");
  const formula = document.querySelector("#speed-formula");

  function unitById(id) {
    return units.find((unit) => unit.id === id);
  }

  function formatNumber(value) {
    if (value === 0) {
      return "0";
    }
    return Number(value.toPrecision(9)).toString();
  }

  function convert(value, fromUnit, toUnit) {
    return value * fromUnit.base / toUnit.base;
  }

  function readInput() {
    const text = input.value.trim().replace(/,/g, "");
    if (!/^[+-]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:e[+-]?\d+)?$/i.test(text)) {
      return null;
    }
    const value = Number(text);
    return Number.isFinite(value) ? value : null;
  }

  function updateMatrix(fromUnit, toUnit) {
    const headerRow = document.createElement("tr");
    const corner = document.createElement("th");
    corner.scope = "col";
    corner.textContent = "단위";
    headerRow.append(corner);

    units.forEach((unit) => {
      const header = document.createElement("th");
      header.scope = "col";
      header.textContent = unit.short;
      if (unit.id === toUnit.id) {
        header.classList.add("is-selected");
      }
      headerRow.append(header);
    });
    tableHead.replaceChildren(headerRow);
    tableBody.replaceChildren();

    units.forEach((rowUnit) => {
      const row = document.createElement("tr");
      const rowHeader = document.createElement("th");
      rowHeader.scope = "row";
      rowHeader.textContent = rowUnit.short;
      if (rowUnit.id === fromUnit.id) {
        rowHeader.classList.add("is-selected");
      }
      row.append(rowHeader);

      units.forEach((columnUnit) => {
        const cell = document.createElement("td");
        cell.textContent = formatNumber(convert(1, rowUnit, columnUnit));
        if (rowUnit.id === columnUnit.id) {
          cell.classList.add("is-diagonal");
        }
        if (rowUnit.id === fromUnit.id && columnUnit.id === toUnit.id) {
          cell.classList.add("is-selected");
        }
        row.append(cell);
      });
      tableBody.append(row);
    });
    table.setAttribute("aria-label", "속도 단위 변환표");
  }

  function updateFormula(fromUnit, toUnit) {
    const factor = fromUnit.base / toUnit.base;
    const operator = factor >= 1
      ? { sign: "×", value: factor }
      : { sign: "÷", value: 1 / factor };
    const factorText = formatNumber(operator.value);
    const verb = operator.sign === "×" ? "곱하면" : "나누면";
    formulaDescription.textContent = `${fromUnit.name}을(를) ${toUnit.name}(으)로 변환하려면 ${fromUnit.name} 값에 ${factorText}를 ${verb} 됩니다.`;
    formula.textContent = `공식: ${fromUnit.short} ${operator.sign} ${factorText} = ${toUnit.short}`;
  }

  function updateConversion() {
    const value = readInput();
    const fromUnit = unitById(fromSelect.value);
    const toUnit = unitById(toSelect.value);
    inputError.textContent = "";
    input.removeAttribute("aria-invalid");

    if (value === null) {
      inputError.textContent = "속도를 숫자로 입력해주세요.";
      input.setAttribute("aria-invalid", "true");
      result.textContent = "입력값을 확인해주세요.";
      result.classList.add("is-message");
      equation.textContent = "";
      return;
    }

    const converted = convert(value, fromUnit, toUnit);
    if (!Number.isFinite(converted)) {
      inputError.textContent = "환산 결과가 표시 가능한 범위를 초과합니다. 입력값을 확인해주세요.";
      input.setAttribute("aria-invalid", "true");
      result.textContent = "입력값을 확인해주세요.";
      result.classList.add("is-message");
      equation.textContent = "";
      return;
    }

    const formattedValue = formatNumber(converted);
    result.textContent = `${formattedValue} ${toUnit.short}`;
    result.classList.remove("is-message");
    equation.textContent = `${formatNumber(value)} ${fromUnit.short} = ${formattedValue} ${toUnit.short}`;
  }

  function updateReference() {
    const fromUnit = unitById(fromSelect.value);
    const toUnit = unitById(toSelect.value);
    tableSummary.textContent = `행은 변환 전, 열은 변환 후 단위입니다. 선택한 ${fromUnit.short} → ${toUnit.short} 변환은 강조 표시됩니다.`;
    updateMatrix(fromUnit, toUnit);
    updateFormula(fromUnit, toUnit);
    updateConversion();
  }

  function populateSelect(select, selectedId) {
    units.forEach((unit) => {
      const option = document.createElement("option");
      option.value = unit.id;
      option.textContent = unit.label;
      option.selected = unit.id === selectedId;
      select.append(option);
    });
  }

  populateSelect(fromSelect, "ms");
  populateSelect(toSelect, "kmh");
  input.addEventListener("input", updateConversion);
  fromSelect.addEventListener("change", updateReference);
  toSelect.addEventListener("change", updateReference);
  document.querySelector("#speed-swap").addEventListener("click", () => {
    const previousFrom = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = previousFrom;
    updateReference();
  });
  updateReference();
})();
