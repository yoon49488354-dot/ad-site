(function () {
  const units = [
    { id: "m2", label: "제곱미터 (m²)", short: "m²", name: "제곱미터", objectParticle: "를", directionParticle: "로", base: 1 },
    { id: "km2", label: "제곱킬로미터 (km²)", short: "km²", name: "제곱킬로미터", objectParticle: "를", directionParticle: "로", base: 1000000 },
    { id: "ac", label: "에이커 (ac)", short: "ac", name: "에이커", objectParticle: "를", directionParticle: "로", base: 4046.8564224 },
    { id: "a", label: "아르 (a)", short: "a", name: "아르", objectParticle: "를", directionParticle: "로", base: 100 },
    { id: "ft2", label: "제곱피트 (ft²)", short: "ft²", name: "제곱피트", objectParticle: "를", directionParticle: "로", base: 0.09290304 },
    { id: "ha", label: "헥타르 (ha)", short: "ha", name: "헥타르", objectParticle: "를", directionParticle: "로", base: 10000 },
    { id: "yd2", label: "제곱야드 (yd²)", short: "yd²", name: "제곱야드", objectParticle: "를", directionParticle: "로", base: 0.83612736 },
    { id: "pyeong", label: "평", short: "평", name: "평", objectParticle: "을", directionParticle: "으로", base: 400 / 121 }
  ];
  const input = document.querySelector("#area-value");
  const fromSelect = document.querySelector("#area-from");
  const toSelect = document.querySelector("#area-to");
  const inputError = document.querySelector("#area-input-error");
  const result = document.querySelector("#area-result");
  const equation = document.querySelector("#area-equation");
  const table = document.querySelector("#area-reference-table");
  const tableHead = document.querySelector("#area-table-head");
  const tableBody = document.querySelector("#area-table-body");
  const tableSummary = document.querySelector("#area-table-summary");
  const formulaDescription = document.querySelector("#area-formula-description");
  const formula = document.querySelector("#area-formula");

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
    if (!/^[+]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:e[+-]?\d+)?$/i.test(text)) {
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
    table.setAttribute("aria-label", "면적 단위 변환표");
  }

  function updateFormula(fromUnit, toUnit) {
    const factor = fromUnit.base / toUnit.base;
    const operator = factor >= 1
      ? { sign: "×", value: factor }
      : { sign: "÷", value: 1 / factor };
    const factorText = formatNumber(operator.value);
    const verb = operator.sign === "×" ? "곱하면" : "나누면";
    formulaDescription.textContent = `${fromUnit.name}${fromUnit.objectParticle} ${toUnit.name}${toUnit.directionParticle} 변환하려면 ${fromUnit.name} 값에 ${factorText}를 ${verb} 됩니다.`;
    formula.textContent = `공식: ${fromUnit.short} ${operator.sign} ${factorText} = ${toUnit.short}`;
  }

  function updateConversion() {
    const value = readInput();
    const fromUnit = unitById(fromSelect.value);
    const toUnit = unitById(toSelect.value);
    inputError.textContent = "";
    input.removeAttribute("aria-invalid");

    if (value === null) {
      inputError.textContent = "0 이상의 면적을 숫자로 입력해주세요.";
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

  populateSelect(fromSelect, "m2");
  populateSelect(toSelect, "pyeong");
  input.addEventListener("input", updateConversion);
  fromSelect.addEventListener("change", updateReference);
  toSelect.addEventListener("change", updateReference);
  document.querySelector("#area-swap").addEventListener("click", () => {
    const previousFrom = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = previousFrom;
    updateReference();
  });
  updateReference();
})();
