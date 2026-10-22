(function () {
  const units = [
    { id: "B", label: "바이트 (B)", short: "B", name: "바이트", base: 1 },
    { id: "KB", label: "킬로바이트 (KB)", short: "KB", name: "킬로바이트", base: 1024 },
    { id: "MB", label: "메가바이트 (MB)", short: "MB", name: "메가바이트", base: 1024 ** 2 },
    { id: "GB", label: "기가바이트 (GB)", short: "GB", name: "기가바이트", base: 1024 ** 3 },
    { id: "TB", label: "테라바이트 (TB)", short: "TB", name: "테라바이트", base: 1024 ** 4 },
    { id: "PB", label: "페타바이트 (PB)", short: "PB", name: "페타바이트", base: 1024 ** 5 },
    { id: "EB", label: "엑사바이트 (EB)", short: "EB", name: "엑사바이트", base: 1024 ** 6 },
    { id: "ZB", label: "제타바이트 (ZB)", short: "ZB", name: "제타바이트", base: 1024 ** 7 },
    { id: "YB", label: "요타바이트 (YB)", short: "YB", name: "요타바이트", base: 1024 ** 8 }
  ];
  const input = document.querySelector("#data-size-value");
  const fromSelect = document.querySelector("#data-size-from");
  const toSelect = document.querySelector("#data-size-to");
  const inputError = document.querySelector("#data-size-input-error");
  const result = document.querySelector("#data-size-result");
  const equation = document.querySelector("#data-size-equation");
  const formulaDescription = document.querySelector("#data-size-formula-description");
  const formula = document.querySelector("#data-size-formula");

  function unitById(id) {
    return units.find((unit) => unit.id === id);
  }

  function formatNumber(value) {
    if (value === 0) {
      return "0";
    }
    if (Math.abs(value) < 1e-6 || Math.abs(value) >= 1e15) {
      return value.toExponential(11).replace(/\.?0+e/, "e");
    }
    return Number(value.toPrecision(12)).toLocaleString("en-US", {
      maximumSignificantDigits: 12
    });
  }

  function readInput() {
    const text = input.value.trim().replace(/,/g, "");
    if (!/^[+]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:e[+-]?\d+)?$/i.test(text)) {
      return null;
    }
    const value = Number(text);
    return Number.isFinite(value) ? value : null;
  }

  function convert(value, fromUnit, toUnit) {
    return value / toUnit.base * fromUnit.base;
  }

  function updateFormula(fromUnit, toUnit) {
    const factor = fromUnit.base / toUnit.base;
    const operation = factor >= 1
      ? { sign: "×", value: factor }
      : { sign: "÷", value: 1 / factor };
    const factorText = formatNumber(operation.value);
    const verb = operation.sign === "×" ? "곱하면" : "나누면";
    formulaDescription.textContent = `${fromUnit.name}에서 ${toUnit.name}으로 변환하려면 ${fromUnit.name} 값에 ${factorText}를 ${verb} 됩니다.`;
    formula.textContent = `공식: ${fromUnit.short} ${operation.sign} ${factorText} = ${toUnit.short}`;
  }

  function updateConversion() {
    const value = readInput();
    const fromUnit = unitById(fromSelect.value);
    const toUnit = unitById(toSelect.value);
    inputError.textContent = "";
    input.removeAttribute("aria-invalid");

    if (value === null) {
      inputError.textContent = "0 이상의 데이터 용량을 입력해주세요.";
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

  populateSelect(fromSelect, "MB");
  populateSelect(toSelect, "KB");
  input.addEventListener("input", updateConversion);
  fromSelect.addEventListener("change", updateReference);
  toSelect.addEventListener("change", updateReference);
  document.querySelector("#data-size-swap").addEventListener("click", () => {
    const previousFrom = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = previousFrom;
    updateReference();
  });
  updateReference();
})();
