(function () {
  const categories = {
    length: {
      name: "길이",
      units: [
        { id: "mm", label: "밀리미터 (mm)", short: "mm", name: "밀리미터", objectParticle: "을", base: 0.001 },
        { id: "cm", label: "센티미터 (cm)", short: "cm", name: "센티미터", objectParticle: "를", base: 0.01 },
        { id: "m", label: "미터 (m)", short: "m", name: "미터", objectParticle: "를", base: 1 },
        { id: "km", label: "킬로미터 (km)", short: "km", name: "킬로미터", objectParticle: "를", base: 1000 },
        { id: "inch", label: "인치 (inch)", short: "inch", name: "인치", objectParticle: "를", base: 0.0254 },
        { id: "ft", label: "피트 (ft)", short: "ft", name: "피트", objectParticle: "를", base: 0.3048 },
        { id: "yard", label: "야드 (yard)", short: "yard", name: "야드", objectParticle: "를", base: 0.9144 },
        { id: "mile", label: "마일 (mile)", short: "mile", name: "마일", objectParticle: "을", base: 1609.344 }
      ]
    },
    weight: {
      name: "무게",
      units: [
        { id: "mg", label: "밀리그램 (mg)", short: "mg", name: "밀리그램", objectParticle: "을", base: 0.001 },
        { id: "g", label: "그램 (g)", short: "g", name: "그램", objectParticle: "을", base: 1 },
        { id: "kg", label: "킬로그램 (kg)", short: "kg", name: "킬로그램", objectParticle: "을", base: 1000 },
        { id: "ton", label: "톤 (ton)", short: "ton", name: "톤", objectParticle: "을", base: 1000000 },
        { id: "oz", label: "온스 (oz)", short: "oz", name: "온스", objectParticle: "를", base: 28.3495231 },
        { id: "lb", label: "파운드 (lb)", short: "lb", name: "파운드", objectParticle: "를", base: 453.59237 },
        { id: "gr", label: "그레인 (gr)", short: "gr", name: "그레인", objectParticle: "을", base: 0.06479891 },
        { id: "geun", label: "근 (근)", short: "근", name: "근", objectParticle: "을", base: 600 }
      ]
    },
    temperature: {
      name: "온도",
      units: [
        { id: "celsius", label: "섭씨 (°C)", short: "°C", name: "섭씨" },
        { id: "fahrenheit", label: "화씨 (°F)", short: "°F", name: "화씨" },
        { id: "kelvin", label: "켈빈 (K)", short: "K", name: "켈빈" }
      ]
    }
  };

  const requestedCategory = new URLSearchParams(window.location.search).get("category");
  const category = categories[requestedCategory] ? requestedCategory : "weight";
  const units = categories[category].units;
  const input = document.querySelector("#unit-value");
  const fromSelect = document.querySelector("#unit-from");
  const toSelect = document.querySelector("#unit-to");
  const inputError = document.querySelector("#unit-input-error");
  const resultValue = document.querySelector("#unit-result");
  const equation = document.querySelector("#unit-equation");
  const copyButton = document.querySelector("#copy-conversion");
  const copyError = document.querySelector("#copy-error");
  const table = document.querySelector("#unit-reference-table");
  const tableHead = document.querySelector("#unit-table-head");
  const tableBody = document.querySelector("#unit-table-body");
  const matrixScroll = document.querySelector("#unit-matrix-scroll");
  const temperatureTableScroll = document.querySelector("#temperature-table-scroll");
  const temperatureTableBody = document.querySelector("#temperature-table-body");
  const tableHeading = document.querySelector("#unit-table-heading");
  const tableSummary = document.querySelector("#unit-table-summary");
  const formulaDescription = document.querySelector("#unit-formula-description");
  const formula = document.querySelector("#unit-formula");
  const pageDescription = document.querySelector("#unit-page-description");

  function unitById(id) {
    return units.find((unit) => unit.id === id);
  }

  function formatSignificant(value) {
    if (value === 0) {
      return "0";
    }

    const negative = value < 0;
    const source = Math.abs(value).toString();
    const sourceParts = source.split("e");
    const sourceExponent = sourceParts.length === 2 ? Number(sourceParts[1]) : 0;
    const mantissaText = sourceParts[0];
    const dotPosition = mantissaText.indexOf(".");
    const integerLength = dotPosition === -1 ? mantissaText.length : dotPosition;
    const digits = mantissaText.replace(".", "");
    const firstNonZero = digits.search(/[1-9]/);
    const significantDigits = digits.slice(firstNonZero);
    const valueExponent = sourceExponent + integerLength - firstNonZero - 1;
    const normalized = Number(`${significantDigits[0]}.${significantDigits.slice(1) || "0"}`);
    const parts = normalized.toExponential(11).split("e");
    let resultMantissa = String(Number(parts[0]));
    const resultExponent = valueExponent + Number(parts[1]);

    if (resultExponent >= -6 && resultExponent < 15) {
      const result = Number(`${resultMantissa}e${resultExponent}`);
      return `${negative ? "-" : ""}${result.toLocaleString("en-US", {
        useGrouping: false,
        maximumSignificantDigits: 12
      })}`;
    }

    resultMantissa = resultMantissa.replace(/\.?0+$/, "");
    return `${negative ? "-" : ""}${resultMantissa}e${resultExponent}`;
  }

  function convert(value, fromUnit, toUnit) {
    if (value === 0) {
      return "0";
    }

    const negative = value < 0;
    const sourceParts = Math.abs(value).toString().split("e");
    const sourceExponent = sourceParts.length === 2 ? Number(sourceParts[1]) : 0;
    const sourceMantissa = Number(sourceParts[0]);
    const convertedMantissa = sourceMantissa * fromUnit.base / toUnit.base;
    const convertedParts = convertedMantissa.toExponential(11).split("e");
    const mantissa = Number(convertedParts[0]);
    const exponent = sourceExponent + Number(convertedParts[1]);

    if (exponent >= -6 && exponent < 15) {
      const converted = Number(`${mantissa}e${exponent}`);
      return `${negative ? "-" : ""}${converted.toLocaleString("en-US", {
        useGrouping: false,
        maximumSignificantDigits: 12
      })}`;
    }
    return `${negative ? "-" : ""}${mantissa}e${exponent}`;
  }

  function convertTemperature(value, fromId, toId) {
    let celsius;
    if (fromId === "celsius") {
      celsius = value;
    } else if (fromId === "fahrenheit") {
      celsius = (value - 32) * 5 / 9;
    } else {
      celsius = value - 273.15;
    }

    if (toId === "celsius") {
      return celsius;
    }
    if (toId === "fahrenheit") {
      return celsius * 9 / 5 + 32;
    }
    return celsius + 273.15;
  }

  function formatTemperature(value) {
    return Number(value.toPrecision(12)).toString();
  }

  function readInputValue() {
    const text = input.value.trim();
    if (!/^[+-]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:e[+-]?\d+)?$/i.test(text)) {
      return null;
    }
    const value = Number(text);
    if (!Number.isFinite(value)
      || (category === "weight" && value < 0)
      || (category === "temperature" && fromSelect.value === "kelvin" && value < 0)) {
      return null;
    }
    return value;
  }

  function updateConversion() {
    const fromUnit = unitById(fromSelect.value);
    const toUnit = unitById(toSelect.value);
    const value = readInputValue();
    inputError.textContent = "";
    copyError.textContent = "";
    input.removeAttribute("aria-invalid");

    if (value === null) {
      input.setAttribute("aria-invalid", "true");
      inputError.textContent = category === "temperature"
        ? fromUnit.id === "kelvin"
          ? "0 이상의 유효한 켈빈값을 입력해주세요."
          : "유효한 온도값을 입력해주세요."
        : category === "weight"
          ? "0 이상의 무게를 입력해주세요."
          : "숫자 또는 지수 형식의 값을 입력해주세요.";
      resultValue.textContent = "입력값을 확인해주세요.";
      resultValue.classList.add("is-message");
      equation.textContent = "";
      copyButton.disabled = true;
      return;
    }

    const converted = category === "temperature"
      ? formatTemperature(convertTemperature(value, fromUnit.id, toUnit.id))
      : convert(value, fromUnit, toUnit);
    resultValue.textContent = `${converted} ${toUnit.short}`;
    resultValue.classList.remove("is-message");
    equation.textContent = `${formatSignificant(value)} ${fromUnit.short} = ${converted} ${toUnit.short}`;
    copyButton.disabled = false;
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
        cell.textContent = convert(1, rowUnit, columnUnit);
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
    table.setAttribute("aria-label", `${categories[category].name} 단위 변환표`);
  }

  function updateTemperatureReference(fromUnit, toUnit) {
    matrixScroll.hidden = true;
    temperatureTableScroll.hidden = false;
    tableHeading.textContent = "주요 온도 기준 비교";
    tableSummary.textContent = "절대영도, 물의 어는점·끓는점, 사람 체온을 섭씨·화씨·켈빈으로 비교합니다.";
    table.setAttribute("aria-label", "온도 변환표");
    tableBody.replaceChildren();
    tableHead.replaceChildren();
    temperatureTableBody.replaceChildren();

    [
      { label: "절대영도", celsius: -273.15 },
      { label: "물 어는점", celsius: 0 },
      { label: "사람 체온", celsius: 36.5 },
      { label: "물 끓는점", celsius: 100 }
    ].forEach((reference) => {
      const row = document.createElement("tr");
      const label = document.createElement("th");
      label.scope = "row";
      label.textContent = reference.label;
      row.append(label);

      [
        { id: "celsius", value: reference.celsius },
        { id: "fahrenheit", value: convertTemperature(reference.celsius, "celsius", "fahrenheit") },
        { id: "kelvin", value: convertTemperature(reference.celsius, "celsius", "kelvin") }
      ].forEach((temperature) => {
        const cell = document.createElement("td");
        cell.textContent = `${formatTemperature(temperature.value)} ${unitById(temperature.id).short}`;
        if (temperature.id === fromUnit.id || temperature.id === toUnit.id) {
          cell.classList.add("is-selected");
        }
        row.append(cell);
      });
      temperatureTableBody.append(row);
    });
  }

  function updateFormula(fromUnit, toUnit) {
    if (category === "temperature") {
      const formulas = {
        "celsius-fahrenheit": "°F = (°C × 9/5) + 32",
        "fahrenheit-celsius": "°C = (°F − 32) × 5/9",
        "celsius-kelvin": "K = °C + 273.15",
        "kelvin-celsius": "°C = K − 273.15",
        "fahrenheit-kelvin": "K = (°F − 32) × 5/9 + 273.15",
        "kelvin-fahrenheit": "°F = (K − 273.15) × 9/5 + 32"
      };
      const formulaText = fromUnit.id === toUnit.id
        ? `${fromUnit.short} = ${toUnit.short}`
        : formulas[`${fromUnit.id}-${toUnit.id}`];
      formulaDescription.textContent = fromUnit.id === toUnit.id
        ? "같은 단위이므로 입력값을 그대로 표시합니다."
        : `${fromUnit.name}에서 ${toUnit.name}(으)로 변환하는 공식입니다.`;
      formula.textContent = `공식: ${formulaText}`;
      return;
    }

    const multiplier = fromUnit.base / toUnit.base;
    const operation = multiplier >= 1
      ? { symbol: "×", value: multiplier }
      : { symbol: "÷", value: 1 / multiplier };
    const factor = formatSignificant(operation.value);
    const verb = operation.symbol === "×" ? "곱하면" : "나누면";
    formulaDescription.textContent = `${fromUnit.name}${fromUnit.objectParticle} ${toUnit.name}로 변환하려면 ${fromUnit.name} 값에 ${factor}를 ${verb} 됩니다.`;
    formula.textContent = `공식: ${fromUnit.short} ${operation.symbol} ${factor} = ${toUnit.short}`;
  }

  function updateReference(fromUnit, toUnit) {
    if (category === "temperature") {
      updateTemperatureReference(fromUnit, toUnit);
      updateFormula(fromUnit, toUnit);
      return;
    }
    matrixScroll.hidden = false;
    temperatureTableScroll.hidden = true;
    tableSummary.textContent = `행은 변환 전, 열은 변환 후 단위입니다. 선택한 ${fromUnit.short} → ${toUnit.short} 변환은 강조 표시됩니다.`;
    updateMatrix(fromUnit, toUnit);
    updateFormula(fromUnit, toUnit);
  }

  function populateUnitSelect(select, selectedId) {
    units.forEach((unit) => {
      const option = document.createElement("option");
      option.value = unit.id;
      option.textContent = unit.label;
      option.selected = unit.id === selectedId;
      select.append(option);
    });
  }

  async function copyResult() {
    const text = equation.textContent;
    copyError.textContent = "";

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const temporaryInput = document.createElement("textarea");
        temporaryInput.value = text;
        temporaryInput.setAttribute("readonly", "");
        temporaryInput.style.position = "fixed";
        temporaryInput.style.opacity = "0";
        document.body.append(temporaryInput);
        temporaryInput.select();
        const copied = document.execCommand("copy");
        temporaryInput.remove();
        if (!copied) {
          throw new Error("Copy command was rejected");
        }
      }
      copyButton.textContent = "복사 완료";
      window.setTimeout(() => {
        copyButton.textContent = "결과 복사";
      }, 1200);
    } catch (error) {
      copyError.textContent = "복사할 수 없습니다. 결과 문구를 직접 선택해 복사해주세요.";
    }
  }

  fromSelect.setAttribute("aria-label", `변환 전 ${categories[category].name} 단위`);
  toSelect.setAttribute("aria-label", `변환 후 ${categories[category].name} 단위`);
  tableHeading.textContent = `${categories[category].name} 변환표`;
  pageDescription.textContent = `${categories[category].name} 단위를 선택하고 값을 입력하면 결과가 바로 계산됩니다.`;

  const initialFrom = category === "weight" ? "kg" : category === "length" ? "inch" : "celsius";
  const initialTo = category === "weight" ? "lb" : category === "length" ? "cm" : "fahrenheit";
  populateUnitSelect(fromSelect, initialFrom);
  populateUnitSelect(toSelect, initialTo);
  input.addEventListener("input", updateConversion);
  fromSelect.addEventListener("change", () => {
    updateConversion();
    updateReference(unitById(fromSelect.value), unitById(toSelect.value));
  });
  toSelect.addEventListener("change", () => {
    updateConversion();
    updateReference(unitById(fromSelect.value), unitById(toSelect.value));
  });
  document.querySelector("#swap-units").addEventListener("click", () => {
    const previousFrom = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = previousFrom;
    updateConversion();
    updateReference(unitById(fromSelect.value), unitById(toSelect.value));
  });
  copyButton.addEventListener("click", copyResult);
  updateConversion();
  updateReference(unitById(initialFrom), unitById(initialTo));
})();
