(function () {
  const form = document.querySelector("#discount-form");
  if (!form) {
    return;
  }

  const inputs = Array.from(form.querySelectorAll('input[type="text"]'));
  const error = document.querySelector("#discount-form-error");
  const summary = document.querySelector("#discount-result-summary");
  const resultCard = document.querySelector("#discount-result-card");
  const emptyResult = document.querySelector("#discount-result-empty");
  const resultDetails = document.querySelector("#discount-result-details");
  const modeInputs = Array.from(form.querySelectorAll('input[name="discount-calc-mode"]'));
  const resultPrompt = "계산 방식을 선택하고 상품 가격을 입력해주세요.";
  const currencyFormatter = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
  const numberFormatter = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 });

  function formatNumberInput(input) {
    const value = input.value;
    const rawValue = value.replace(/,/g, "");
    if (!/^\d*(?:\.\d*)?$/.test(rawValue)) {
      return;
    }

    const selection = input.selectionStart;
    const digitsBeforeCaret = value.slice(0, selection).replace(/,/g, "").length;
    const parts = rawValue.split(".");
    const integer = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const formatted = parts.length === 2 ? `${integer}.${parts[1]}` : integer;
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

  function readNumber(input, label) {
    const text = input.value;
    if (!text) {
      return { error: `${label}을 입력해주세요.`, input };
    }
    if (/\s/.test(text)) {
      return { error: `${label}은 공백 없이 숫자로 입력해주세요.`, input };
    }
    if (text.includes("-")) {
      return { error: `${label}은 음수로 입력할 수 없습니다.`, input };
    }

    const validFormat = /^(?:(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?|\.\d+)$/.test(text);
    const value = Number(text.replace(/,/g, ""));
    if (!validFormat || !Number.isFinite(value) || value > Number.MAX_SAFE_INTEGER) {
      return { error: `${label}을 올바른 숫자로 입력해주세요.`, input };
    }
    return { value, input };
  }

  function formatWon(value) {
    return `${currencyFormatter.format(Math.round(value))}원`;
  }

  function clearResults() {
    error.textContent = "";
    inputs.forEach((input) => input.removeAttribute("aria-invalid"));
    resultDetails.replaceChildren();
    resultDetails.hidden = true;
    emptyResult.hidden = false;
    resultCard.classList.remove("is-calculated");
    summary.textContent = resultPrompt;
  }

  function showError(message, input) {
    error.textContent = message;
    input.setAttribute("aria-invalid", "true");
    input.focus();
    summary.textContent = "입력 내용을 확인한 뒤 다시 계산해주세요.";
  }

  function appendResultRow(label, value) {
    const row = document.createElement("div");
    row.className = "result-row";

    const labelElement = document.createElement("span");
    labelElement.textContent = label;
    const valueElement = document.createElement("strong");
    valueElement.textContent = value;

    row.append(labelElement, valueElement);
    resultDetails.append(row);
  }

  function appendResultTotal(label, value, isRate) {
    const divider = document.createElement("div");
    divider.className = "result-divider";
    const total = document.createElement("div");
    total.className = "discount-result-total";

    const labelElement = document.createElement("span");
    labelElement.textContent = label;
    const valueElement = document.createElement("strong");
    valueElement.textContent = value;
    if (isRate) {
      valueElement.classList.add("discount-result-total--rate");
    }

    total.append(labelElement, valueElement);
    resultDetails.append(divider, total);
  }

  function showResults(rows, totalLabel, totalValue, isRate, message) {
    rows.forEach((row) => appendResultRow(row.label, row.value));
    appendResultTotal(totalLabel, totalValue, isRate);
    emptyResult.hidden = true;
    resultDetails.hidden = false;
    resultCard.classList.add("is-calculated");
    summary.textContent = message;
  }

  function calculateDiscountPrice() {
    const original = readNumber(document.querySelector("#discount-original-price"), "상품 원래 가격");
    if (original.error) {
      showError(original.error, original.input);
      return;
    }
    const rate = readNumber(document.querySelector("#discount-rate"), "할인율");
    if (rate.error) {
      showError(rate.error, rate.input);
      return;
    }
    if (rate.value < 0 || rate.value > 100) {
      showError("할인율은 0~100% 범위로 입력해주세요.", rate.input);
      return;
    }

    const discount = original.value * rate.value / 100;
    const finalPrice = original.value - discount;
    if (!Number.isSafeInteger(Math.round(discount)) || !Number.isSafeInteger(Math.round(finalPrice))) {
      showError("계산 결과가 표시 가능한 범위를 초과합니다. 입력값을 확인해주세요.", original.input);
      return;
    }

    showResults([
      { label: "원래 가격", value: formatWon(original.value) },
      { label: "할인율", value: `${numberFormatter.format(rate.value)}%` },
      { label: "할인 금액", value: formatWon(discount) }
    ], "최종 할인 가격", formatWon(finalPrice), false, `${formatWon(original.value)} 상품의 할인 가격입니다.`);
  }

  function calculateDiscountRate() {
    const original = readNumber(document.querySelector("#reverse-original-price"), "상품 원래 가격");
    if (original.error) {
      showError(original.error, original.input);
      return;
    }
    const sale = readNumber(document.querySelector("#discounted-price"), "할인된 판매 가격");
    if (sale.error) {
      showError(sale.error, sale.input);
      return;
    }
    if (original.value <= 0) {
      showError("역산을 위해 상품 원래 가격은 0원보다 커야 합니다.", original.input);
      return;
    }
    if (sale.value > original.value) {
      showError("할인된 판매 가격은 원래 가격보다 클 수 없습니다.", sale.input);
      return;
    }

    const discount = original.value - sale.value;
    const rate = discount / original.value * 100;
    if (!Number.isSafeInteger(Math.round(discount)) || !Number.isFinite(rate)) {
      showError("계산 결과가 표시 가능한 범위를 초과합니다. 입력값을 확인해주세요.", original.input);
      return;
    }

    showResults([
      { label: "원래 가격", value: formatWon(original.value) },
      { label: "할인된 판매 가격", value: formatWon(sale.value) },
      { label: "할인 금액", value: formatWon(discount) }
    ], "실제 할인율", `${numberFormatter.format(rate)}%`, true, `${formatWon(original.value)}에서 ${formatWon(sale.value)}로 할인된 결과입니다.`);
  }

  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      formatNumberInput(input);
      clearResults();
    });
  });

  modeInputs.forEach((modeInput) => {
    modeInput.addEventListener("change", () => {
      document.querySelectorAll(".discount-input-group").forEach((group) => {
        group.hidden = group.dataset.discountMode !== modeInput.value;
      });
      clearResults();
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearResults();
    const selectedMode = modeInputs.find((input) => input.checked);
    if (selectedMode && selectedMode.value === "discount-price") {
      calculateDiscountPrice();
    } else if (selectedMode && selectedMode.value === "discount-rate") {
      calculateDiscountRate();
    } else {
      showError("계산 방식을 선택해주세요.", inputs[0]);
    }
  });
})();
