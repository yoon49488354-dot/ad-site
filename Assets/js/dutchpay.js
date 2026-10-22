(function () {
  const equalForm = document.querySelector("#equal-split-form");
  const individualForm = document.querySelector("#individual-form");
  if (!equalForm || !individualForm) {
    return;
  }

  const totalInput = document.querySelector("#split-total");
  const countInput = document.querySelector("#split-count");
  const totalError = document.querySelector("#split-total-error");
  const countError = document.querySelector("#split-count-error");
  const splitResult = document.querySelector("#split-result");
  const individualTotalInput = document.querySelector("#individual-total");
  const individualTotalError = document.querySelector("#individual-total-error");
  const individualRemaining = document.querySelector("#individual-remaining");
  const participantChart = document.querySelector("#participant-chart");
  const participantList = document.querySelector("#participant-list");
  const individualError = document.querySelector("#individual-error");
  const tabs = Array.from(document.querySelectorAll(".dutchpay-tab"));
  const panels = Array.from(document.querySelectorAll(".dutchpay-panel"));
  const currencyFormatter = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
  const percentFormatter = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 });
  const chartColors = ["#315cf5", "#22a699", "#f29f43", "#8b67d5", "#e26679", "#3d8db8"];
  let participantId = 0;

  function formatMoney(value) {
    return `${currencyFormatter.format(value)}원`;
  }

  function formatAmountInput(input) {
    const raw = input.value.replace(/,/g, "");
    if (!/^\d*$/.test(raw)) {
      return;
    }
    input.value = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function parseAmount(input) {
    const value = input.value.trim();
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(value)) {
      return null;
    }
    const amount = Number(value.replace(/,/g, ""));
    return Number.isSafeInteger(amount) ? amount : null;
  }

  function clearFieldError(input, error) {
    input.removeAttribute("aria-invalid");
    error.textContent = "";
  }

  function showFieldError(input, error, message) {
    input.setAttribute("aria-invalid", "true");
    error.textContent = message;
    input.focus();
  }

  function clearResult(result) {
    result.replaceChildren();
    const placeholder = document.createElement("p");
    placeholder.className = "dutchpay-result__placeholder";
    placeholder.textContent = "총액과 인원수를 입력하면 결과가 여기에 표시됩니다.";
    result.append(placeholder);
    result.hidden = false;
  }

  function addResultLine(container, label, value, isTotal) {
    const line = document.createElement("div");
    line.className = isTotal ? "dutchpay-result__total" : "dutchpay-result__line";
    const labelElement = document.createElement("span");
    labelElement.textContent = label;
    const valueElement = document.createElement("strong");
    valueElement.textContent = value;
    line.append(labelElement, valueElement);
    container.append(line);
  }

  function calculateEqualSplit(event, showErrors) {
    if (event) {
      event.preventDefault();
    }
    clearFieldError(totalInput, totalError);
    clearFieldError(countInput, countError);

    const total = parseAmount(totalInput);
    if (total === null || total <= 0) {
      if (!showErrors) {
        clearResult(splitResult);
        return;
      }
      showFieldError(totalInput, totalError, "총액은 0보다 큰 원 단위 숫자로 입력해주세요.");
      return;
    }

    const count = Number(countInput.value);
    if (!Number.isInteger(count) || count < 1 || count > 100) {
      if (!showErrors) {
        clearResult(splitResult);
        return;
      }
      showFieldError(countInput, countError, "인원수는 1~100명 사이의 정수로 입력해주세요.");
      return;
    }

    splitResult.replaceChildren();
    const baseShare = Math.floor(total / count);
    const remainder = total % count;
    const summary = document.createElement("p");
    summary.className = "dutchpay-result__summary";
    summary.textContent = "소수점은 버리고 정수 원 단위로 나눕니다.";
    splitResult.append(summary);

    const share = document.createElement("div");
    share.className = "dutchpay-result__share";
    const shareLabel = document.createElement("span");
    shareLabel.textContent = "1인당 기본 분담액";
    const shareValue = document.createElement("strong");
    shareValue.textContent = formatMoney(baseShare);
    share.append(shareLabel, shareValue);
    splitResult.append(share);

    const remainderNote = document.createElement("p");
    remainderNote.className = "dutchpay-result__remainder";
    remainderNote.textContent = remainder === 0
      ? "추가 부담 없이 모두 같은 금액을 냅니다."
      : `${remainder}명은 ${formatMoney(1)} 더 내어 ${formatMoney(baseShare + 1)}씩, 나머지 ${count - remainder}명은 ${formatMoney(baseShare)}씩 부담합니다.`;
    splitResult.append(remainderNote);
  }

  function createParticipantRow(name, amount) {
    participantId += 1;
    const row = document.createElement("div");
    row.className = "participant-row";
    row.dataset.participantId = String(participantId);

    const nameInput = document.createElement("input");
    nameInput.className = "participant-row__name";
    nameInput.type = "text";
    nameInput.maxLength = 30;
    nameInput.value = name || `참여자 ${participantId}`;
    nameInput.setAttribute("aria-label", `참여자 ${participantId} 이름`);
    nameInput.placeholder = "이름";

    const amountControl = document.createElement("div");
    amountControl.className = "amount-field__control participant-row__amount-control";
    const amountInput = document.createElement("input");
    amountInput.className = "participant-row__amount";
    amountInput.type = "text";
    amountInput.inputMode = "numeric";
    amountInput.autocomplete = "off";
    amountInput.value = amount || "";
    amountInput.placeholder = "부담 금액";
    amountInput.setAttribute("aria-label", `참여자 ${participantId} 부담 금액`);
    const unit = document.createElement("span");
    unit.setAttribute("aria-hidden", "true");
    unit.textContent = "원";
    amountControl.append(amountInput, unit);

    const removeButton = document.createElement("button");
    removeButton.className = "participant-row__remove";
    removeButton.type = "button";
    removeButton.textContent = "삭제";
    removeButton.setAttribute("aria-label", `참여자 ${participantId} 삭제`);

    row.append(nameInput, amountControl, removeButton);
    return row;
  }

  function addParticipant() {
    participantList.append(createParticipantRow());
    individualError.textContent = "";
    updateParticipantSummary();
  }

  function updateParticipantSummary() {
    const budgetText = individualTotalInput.value.trim();
    const budget = budgetText ? parseAmount(individualTotalInput) : null;
    let allocated = 0;
    const participants = [];
    let invalidAmountInput = null;

    participantList.querySelectorAll(".participant-row").forEach((row, index) => {
      const nameInput = row.querySelector(".participant-row__name");
      const amountInput = row.querySelector(".participant-row__amount");
      formatAmountInput(amountInput);
      amountInput.removeAttribute("aria-invalid");
      const amountText = amountInput.value.trim();
      const amount = amountText ? parseAmount(amountInput) : 0;
      if (amount === null || !Number.isSafeInteger(allocated + amount)) {
        invalidAmountInput = amountInput;
        amountInput.setAttribute("aria-invalid", "true");
        return;
      }
      allocated += amount;
      participants.push({
        name: nameInput.value.trim() || `참여자 ${index + 1}`,
        amount,
        index
      });
    });

    individualTotalError.textContent = "";
    individualTotalInput.removeAttribute("aria-invalid");
    individualError.textContent = "";

    if (budgetText && budget === null) {
      individualTotalInput.setAttribute("aria-invalid", "true");
      individualTotalError.textContent = "총 금액은 0 이상의 원 단위 숫자로 입력해주세요.";
    } else if (invalidAmountInput) {
      individualError.textContent = "참여자별 금액은 0 이상의 원 단위 숫자로 입력해주세요.";
    } else if (budget === null) {
      individualRemaining.textContent = "총 금액을 입력해주세요.";
    } else {
      const remaining = budget - allocated;
      individualRemaining.textContent = remaining < 0
        ? `${formatMoney(Math.abs(remaining))} 초과`
        : formatMoney(remaining);
    }

    participantChart.replaceChildren();
    participants.forEach((participant) => {
      const percentage = budget > 0 ? participant.amount / budget * 100 : 0;
      const item = document.createElement("div");
      item.className = "dutchpay-chart__item";

      const heading = document.createElement("div");
      heading.className = "dutchpay-chart__heading";
      const name = document.createElement("span");
      name.textContent = participant.name;
      const amount = document.createElement("strong");
      amount.textContent = `${formatMoney(participant.amount)} · ${budget > 0 ? `${percentFormatter.format(percentage)}%` : "—"}`;
      heading.append(name, amount);

      const track = document.createElement("div");
      track.className = "dutchpay-chart__track";
      track.setAttribute("role", "img");
      track.setAttribute("aria-label", `${participant.name}: ${formatMoney(participant.amount)}, ${budget > 0 ? `${percentFormatter.format(percentage)}%` : "비율 계산 대기"}`);
      const bar = document.createElement("span");
      bar.className = "dutchpay-chart__bar";
      bar.style.width = `${Math.max(0, Math.min(percentage, 100))}%`;
      bar.style.backgroundColor = chartColors[participant.index % chartColors.length];
      track.append(bar);

      item.append(heading, track);
      participantChart.append(item);
    });
  }

  function setActiveTab(tab, focusTab) {
    tabs.forEach((item) => {
      const isActive = item === tab;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-selected", String(isActive));
      item.tabIndex = isActive ? 0 : -1;
    });
    panels.forEach((panel) => {
      panel.hidden = panel.id !== tab.getAttribute("aria-controls");
    });
    if (focusTab) {
      tab.focus();
    }
  }

  totalInput.addEventListener("input", () => {
    formatAmountInput(totalInput);
    clearFieldError(totalInput, totalError);
    calculateEqualSplit(null, false);
  });

  countInput.addEventListener("input", () => {
    clearFieldError(countInput, countError);
    calculateEqualSplit(null, false);
  });

  equalForm.querySelectorAll("[data-count-step]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextCount = Number(countInput.value) + Number(button.dataset.countStep);
      countInput.value = String(Math.max(1, Math.min(100, Number.isFinite(nextCount) ? nextCount : 1)));
      clearFieldError(countInput, countError);
      calculateEqualSplit(null, false);
    });
  });

  equalForm.addEventListener("submit", (event) => calculateEqualSplit(event, true));
  document.querySelector("#add-participant").addEventListener("click", addParticipant);
  individualTotalInput.addEventListener("input", () => {
    formatAmountInput(individualTotalInput);
    updateParticipantSummary();
  });

  participantList.addEventListener("input", (event) => {
    if (event.target.classList.contains("participant-row__amount")) {
      formatAmountInput(event.target);
      event.target.removeAttribute("aria-invalid");
      updateParticipantSummary();
    } else if (event.target.classList.contains("participant-row__name")) {
      updateParticipantSummary();
    }
  });

  participantList.addEventListener("click", (event) => {
    const removeButton = event.target.closest(".participant-row__remove");
    if (!removeButton) {
      return;
    }
    const rows = participantList.querySelectorAll(".participant-row");
    if (rows.length <= 1) {
      individualError.textContent = "참여자는 최소 1명 이상이어야 합니다.";
      return;
    }
    removeButton.closest(".participant-row").remove();
    individualError.textContent = "";
    updateParticipantSummary();
  });

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => setActiveTab(tab, false));
    tab.addEventListener("keydown", (event) => {
      let nextIndex;
      if (event.key === "ArrowRight") {
        nextIndex = (index + 1) % tabs.length;
      } else if (event.key === "ArrowLeft") {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = tabs.length - 1;
      } else {
        return;
      }
      event.preventDefault();
      setActiveTab(tabs[nextIndex], true);
    });
  });

  participantList.append(createParticipantRow("참여자 1"), createParticipantRow("참여자 2"));
  updateParticipantSummary();
})();
