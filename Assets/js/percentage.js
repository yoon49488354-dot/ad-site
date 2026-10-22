(function () {
  const form = document.querySelector("#percentage-form");
  if (!form) {
    return;
  }

  const numberFormatter = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 11 });

  function formatNumberInput(input) {
    const value = input.value;
    const rawValue = value.replace(/,/g, "");
    if (!/^-?\d*(?:\.\d*)?$/.test(rawValue)) {
      return;
    }

    const selection = input.selectionStart;
    const digitsBeforeCaret = value.slice(0, selection).replace(/,/g, "").length;
    const isNegative = rawValue.startsWith("-");
    const unsignedValue = isNegative ? rawValue.slice(1) : rawValue;
    const parts = unsignedValue.split(".");
    const integer = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const formatted = `${isNegative ? "-" : ""}${integer}${parts.length === 2 ? `.${parts[1]}` : ""}`;
    input.value = formatted;

    let caret = 0;
    let counted = 0;
    while (caret < formatted.length && counted < digitsBeforeCaret) {
      if (formatted[caret] !== ",") {
        counted += 1;
      }
      caret += 1;
    }
    input.setSelectionRange(caret, caret);
  }

  function readValue(input) {
    const text = input.value;
    const validFormat = /^-?(?:(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?|\.\d+)$/.test(text);
    const value = Number(text.replace(/,/g, ""));
    if (!validFormat || !Number.isFinite(value)) {
      return null;
    }
    return value;
  }

  function clearRow(row) {
    const result = row.querySelector(".percentage-row__result");
    result.textContent = "";
    result.classList.remove("is-error");
    row.querySelectorAll("input").forEach((input) => input.removeAttribute("aria-invalid"));
  }

  function showRowError(row, message, input) {
    const result = row.querySelector(".percentage-row__result");
    result.textContent = message;
    result.classList.add("is-error");
    input.setAttribute("aria-invalid", "true");
  }

  function getRowValues(row) {
    const inputs = Array.from(row.querySelectorAll("input"));
    const values = inputs.map((input) => input.value.trim());
    if (values.every((value) => value === "")) {
      return { skipped: true };
    }
    if (values.some((value) => value === "")) {
      return { error: "두 값을 모두 입력해주세요.", input: inputs[values.findIndex((value) => value === "")] };
    }

    const numbers = inputs.map(readValue);
    const invalidIndex = numbers.findIndex((value) => value === null);
    if (invalidIndex !== -1) {
      return { error: "쉼표 위치와 숫자 형식을 확인해주세요.", input: inputs[invalidIndex] };
    }
    return { inputs, numbers };
  }

  function calculateRow(row, validateIncomplete) {
    clearRow(row);
    const values = getRowValues(row);
    if (values.skipped) {
      return false;
    }
    if (values.error) {
      if (!validateIncomplete && values.error === "두 값을 모두 입력해주세요.") {
        return false;
      }
      showRowError(row, values.error, values.input);
      return true;
    }

    const [whole, otherValue] = values.numbers;
    const type = row.dataset.calculation;
    let result;
    let message;

    if (type === "ratio") {
      result = whole * otherValue / 100;
      message = `${numberFormatter.format(result)}`;
    } else if (type === "part") {
      if (whole === 0) {
        showRowError(row, "전체값은 0이 될 수 없습니다.", values.inputs[0]);
        return true;
      }
      result = otherValue / whole * 100;
      message = `${numberFormatter.format(result)}%`;
    } else if (type === "change") {
      if (whole === 0) {
        showRowError(row, "변경 전 전체값은 0이 될 수 없습니다.", values.inputs[0]);
        return true;
      }
      result = (otherValue - whole) / whole * 100;
      const direction = result > 0 ? "증가" : result < 0 ? "감소" : "변화 없음";
      message = result === 0
        ? "0% 변화 없음"
        : `${numberFormatter.format(Math.abs(result))}% ${direction}`;
    } else if (type === "change-rate") {
      result = whole * (1 + otherValue / 100);
      message = `변경 후 ${numberFormatter.format(result)}`;
    }

    if (!Number.isFinite(result)) {
      showRowError(row, "계산 가능한 범위를 벗어났습니다.", values.inputs[0]);
      return true;
    }

    row.querySelector(".percentage-row__result").textContent = message;
    return true;
  }

  form.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      formatNumberInput(input);
      calculateRow(input.closest(".percentage-row"), false);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const rows = Array.from(form.querySelectorAll(".percentage-row"));
    const hasInput = rows.reduce((found, row) => calculateRow(row, true) || found, false);
    if (!hasInput) {
      const firstInput = rows[0].querySelector("input");
      showRowError(rows[0], "계산할 값을 입력해주세요.", firstInput);
    }
  });

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      form.querySelectorAll(".percentage-row").forEach(clearRow);
    }, 0);
  });
})();
