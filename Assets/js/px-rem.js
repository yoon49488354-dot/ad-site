(function () {
  const rootFontSize = 16;
  const precision = 6;
  const fields = {
    px: {
      input: document.querySelector("#px-value"),
      error: document.querySelector("#px-error")
    },
    rem: {
      input: document.querySelector("#rem-value"),
      error: document.querySelector("#rem-error")
    }
  };

  function formatValue(value) {
    if (!Number.isFinite(value)) {
      return "";
    }
    return String(Number(value.toFixed(precision)));
  }

  function convert(source, target) {
    const value = fields[source].input.value.trim();
    fields[source].error.textContent = "";
    fields[target].error.textContent = "";
    fields[source].input.removeAttribute("aria-invalid");
    fields[target].input.removeAttribute("aria-invalid");

    if (value === "") {
      fields[target].input.value = "";
      return;
    }

    if (value === ".") {
      fields[target].input.value = "";
      return;
    }

    if (!/^(?:\d+\.?\d*|\.\d+)$/.test(value)) {
      fields[source].input.setAttribute("aria-invalid", "true");
      fields[source].error.textContent = "0 이상의 숫자를 입력해주세요.";
      fields[target].input.value = "";
      return;
    }

    const parsedValue = Number(value);
    const converted = source === "px"
      ? parsedValue / rootFontSize
      : parsedValue * rootFontSize;

    if (!Number.isFinite(converted)) {
      fields[source].input.setAttribute("aria-invalid", "true");
      fields[source].error.textContent = "계산 가능한 범위를 벗어났습니다.";
      fields[target].input.value = "";
      return;
    }

    fields[target].input.value = formatValue(converted);
  }

  fields.px.input.addEventListener("input", () => convert("px", "rem"));
  fields.rem.input.addEventListener("input", () => convert("rem", "px"));

  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", async () => {
      const input = document.getElementById(button.dataset.copyTarget);
      const value = input.value;
      if (!value) {
        input.focus();
        return;
      }

      try {
        await navigator.clipboard.writeText(value);
        button.setAttribute("aria-label", "복사 완료");
        window.setTimeout(() => {
          button.setAttribute("aria-label", button.dataset.copyTarget === "px-value" ? "픽셀 값 복사" : "REM 값 복사");
        }, 1200);
      } catch (error) {
        input.focus();
        input.select();
        fields[button.dataset.copyTarget === "px-value" ? "px" : "rem"].error.textContent = "자동 복사에 실패했습니다. 선택된 값을 직접 복사해주세요.";
      }
    });
  });
})();
