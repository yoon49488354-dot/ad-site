$(function () {
  const $baseForm = $("#salary-form");
  const $areaForm = $("#area-form");
  const $baseAmount = $("#salary-amount");
  const $baseError = $("#form-error");
  const $baseResultSummary = $("#result-summary");
  const salaryCalculationModes = {
    "gross-annual": {
      label: "세전 연봉",
      outputLabel: "환산 세전 월급",
      placeholder: "세전 연봉 입력",
      hint: "세전 연봉을 월 기준으로 환산합니다."
    },
    "gross-monthly": {
      label: "세전 월급",
      outputLabel: "환산 세전 연봉",
      placeholder: "세전 월급 입력",
      hint: "세전 월급에 12를 곱해 연봉으로 환산합니다."
    }
  };
  const $albaForm = $("#alba-form");
  const weekdayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  const weekdays = [
    { id: "sun", label: "일", day: 0 },
    { id: "mon", label: "월", day: 1 },
    { id: "tue", label: "화", day: 2 },
    { id: "wed", label: "수", day: 3 },
    { id: "thu", label: "목", day: 4 },
    { id: "fri", label: "금", day: 5 },
    { id: "sat", label: "토", day: 6 }
  ];
  let hasAlbaResult = false;

  const squareMetersPerPyeong = 400 / 121;
  const areaCalculationModes = {
    "pyeong-to-square-meter": {
      label: "평수",
      unit: "평",
      outputLabel: "환산 제곱미터",
      placeholder: "평수 입력",
      hint: "입력한 평수를 제곱미터로 환산합니다."
    },
    "square-meter-to-pyeong": {
      label: "제곱미터",
      unit: "㎡",
      outputLabel: "환산 평수",
      placeholder: "제곱미터 입력",
      hint: "입력한 제곱미터를 평수로 환산합니다."
    }
  };

  function formatWon(amount) {
    return `${Math.round(amount).toLocaleString("ko-KR")}원`;
  }

  function formatHours(minutes) {
    const hours = minutes / 60;
    return `${Number(hours.toFixed(2)).toLocaleString("ko-KR")}시간`;
  }

  function formatNumericInput(input) {
    const rawValue = input.value.replace(/,/g, "");
    if (/^\d+$/.test(rawValue)) {
      input.value = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
  }

  function setSalaryCalculationMode(mode) {
    const settings = salaryCalculationModes[mode];
    if (!settings) {
      return;
    }
    $("#salary-amount-label").text(settings.label);
    $baseAmount.attr("placeholder", settings.placeholder);
    $("#amount-hint").text(settings.hint);
    $("#salary-result-label").text(settings.outputLabel);
    $("#salary-result-secondary").text(
      mode === "gross-annual"
        ? "세전 연봉 ÷ 12 (원 단위 반올림)"
        : "세전 월급 × 12"
    );
    $baseError.text("");
    $baseAmount.removeAttr("aria-invalid");
    markSalaryResultsStale();
  }

  function markSalaryResultsStale() {
    if ($("#salary-result-card").hasClass("is-calculated")) {
      $baseResultSummary.text("입력값이 변경되었습니다. 다시 계산해주세요.");
      $("#salary-result-card").addClass("is-stale");
    }
  }

  function showSalaryInputError(message, $field) {
    $baseError.text(message);
    $field.attr("aria-invalid", "true").trigger("focus");
    $baseResultSummary.text("입력 내용을 확인한 뒤 다시 계산해주세요.");
  }

  function getSalaryInputValue() {
    const amountText = $baseAmount.val().replace(/,/g, "").trim();
    const amount = Number(amountText);
    if (!amountText || !/^\d+$/.test(amountText) || !Number.isSafeInteger(amount) || amount <= 0) {
      return { error: "급여 금액은 0보다 큰 정수 원 단위로 입력해주세요.", field: $baseAmount };
    }
    return { amount };
  }

  function calculateGrossSalary() {
    $baseError.text("");
    $baseAmount.removeAttr("aria-invalid");
    const input = getSalaryInputValue();
    if (input.error) {
      showSalaryInputError(input.error, input.field);
      return;
    }

    const mode = $('input[name="salary-calc-mode"]:checked').val();
    let result;
    if (mode === "gross-annual") {
      result = Math.round(input.amount / 12);
    } else if (mode === "gross-monthly") {
      result = input.amount * 12;
    } else {
      showSalaryInputError("계산 방식을 선택해주세요.", $baseAmount);
      return;
    }
    if (!Number.isSafeInteger(result)) {
      showSalaryInputError("환산 금액이 안전한 정수 범위를 초과합니다. 입력 금액을 확인해주세요.", $baseAmount);
      return;
    }

    $("#salary-result-value").text(formatWon(result));
    $baseResultSummary.text(`${salaryCalculationModes[mode].label} 기준 세전 환산 결과입니다.`);
    $("#salary-result-card").addClass("is-calculated").removeClass("is-stale");
  }

  function setAreaCalculationMode(mode) {
    const settings = areaCalculationModes[mode];
    if (!settings) {
      return;
    }
    $("#area-amount-label").text(settings.label);
    $("#area-input-unit").text(settings.unit);
    $("#area-amount").attr("placeholder", settings.placeholder);
    $("#area-amount-hint").text(settings.hint);
    $("#area-result-label").text(settings.outputLabel);
    $("#area-result-secondary").text(
      mode === "pyeong-to-square-meter"
        ? "1평 = 약 3.305785㎡"
        : "1㎡ = 약 0.3025평"
    );
    $("#area-form-error").text("");
    $("#area-amount").removeAttr("aria-invalid");
    if ($("#area-result-card").hasClass("is-calculated")) {
      $("#area-result-summary").text("계산 방식이 변경되었습니다. 다시 계산해주세요.");
      $("#area-result-card").addClass("is-stale");
    }
  }

  function calculateArea() {
    const $amount = $("#area-amount");
    const $error = $("#area-form-error");
    const amountText = $amount.val().trim().replace(/,/g, "");
    const amount = Number(amountText);
    const mode = $('input[name="area-calc-mode"]:checked').val();
    $error.text("");
    $amount.removeAttr("aria-invalid");

    if (!amountText || !/^(?:\d+\.?\d*|\.\d+)$/.test(amountText) || !Number.isFinite(amount) || amount <= 0) {
      $error.text("면적은 0보다 큰 숫자로 입력해주세요.");
      $amount.attr("aria-invalid", "true").trigger("focus");
      $("#area-result-summary").text("입력 내용을 확인한 뒤 다시 계산해주세요.");
      return;
    }

    if (!areaCalculationModes[mode]) {
      $error.text("계산 방식을 선택해주세요.");
      $amount.attr("aria-invalid", "true").trigger("focus");
      $("#area-result-summary").text("입력 내용을 확인한 뒤 다시 계산해주세요.");
      return;
    }

    const result = mode === "pyeong-to-square-meter"
      ? amount * squareMetersPerPyeong
      : amount / squareMetersPerPyeong;
    if (!Number.isFinite(result)) {
      $error.text("환산 결과가 표시 가능한 범위를 초과합니다. 입력 면적을 확인해주세요.");
      $amount.attr("aria-invalid", "true").trigger("focus");
      $("#area-result-summary").text("입력 내용을 확인한 뒤 다시 계산해주세요.");
      return;
    }

    const inputUnit = areaCalculationModes[mode].unit;
    const outputUnit = mode === "pyeong-to-square-meter" ? "㎡" : "평";
    $("#area-result-value").text(`${result.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}${outputUnit}`);
    $("#area-result-summary").text(`${amount.toLocaleString("ko-KR")} ${inputUnit} 기준 환산 결과입니다.`);
    $("#area-result-card").addClass("is-calculated").removeClass("is-stale");
  }

  function parseClock(value) {
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) {
      return null;
    }
    const parts = value.split(":").map(Number);
    return parts[0] * 60 + parts[1];
  }

  function parseDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return null;
    }
    const parts = value.split("-").map(Number);
    const timestamp = Date.UTC(parts[0], parts[1] - 1, parts[2]);
    const date = new Date(timestamp);
    if (
      date.getUTCFullYear() !== parts[0] ||
      date.getUTCMonth() !== parts[1] - 1 ||
      date.getUTCDate() !== parts[2]
    ) {
      return null;
    }
    return timestamp;
  }

  function getShiftTimes(startValue, endValue, breakEnabled, breakStartValue, breakEndValue) {
    const start = parseClock(startValue);
    const endClock = parseClock(endValue);
    if (start === null || endClock === null || start === endClock) {
      return { error: "출근·퇴근 시간을 확인해주세요. 같은 시간은 입력할 수 없습니다." };
    }

    const end = endClock < start ? endClock + 1440 : endClock;
    const duration = end - start;
    if (duration <= 0 || duration > 1440) {
      return { error: "근무 시간은 0시간 초과, 24시간 이하로 입력해주세요." };
    }

    let breakStart = null;
    let breakEnd = null;
    if (breakEnabled) {
      const breakStartClock = parseClock(breakStartValue);
      const breakEndClock = parseClock(breakEndValue);
      if (breakStartClock === null || breakEndClock === null || breakStartClock === breakEndClock) {
        return { error: "휴게 시작·종료 시간을 확인해주세요." };
      }
      breakStart = breakStartClock < start ? breakStartClock + 1440 : breakStartClock;
      breakEnd = breakEndClock < start ? breakEndClock + 1440 : breakEndClock;
      while (breakEnd <= breakStart) {
        breakEnd += 1440;
      }
      if (breakStart < start || breakEnd > end || breakEnd <= breakStart) {
        return { error: "휴게 시간은 출근과 퇴근 사이에 설정해주세요." };
      }
    }

    let nightMinutes = 0;
    for (let day = Math.floor(start / 1440) - 1; day <= Math.floor((end - 1) / 1440); day += 1) {
      const nightStart = day * 1440 + 22 * 60;
      const nightEnd = day * 1440 + 30 * 60;
      const overlapStart = Math.max(start, nightStart);
      const overlapEnd = Math.min(end, nightEnd);
      if (overlapEnd > overlapStart) {
        nightMinutes += overlapEnd - overlapStart;
      }
    }

    const breakMinutes = breakEnabled ? breakEnd - breakStart : 0;
    if (breakMinutes >= duration) {
      return { error: "휴게 시간은 실제 근무시간보다 짧아야 합니다." };
    }
    const breakNightMinutes = breakEnabled
      ? getOverlapWithNight(breakStart, breakEnd)
      : 0;

    return {
      durationMinutes: duration - breakMinutes,
      nightMinutes: Math.max(0, nightMinutes - breakNightMinutes),
      breakMinutes
    };
  }

  function getOverlapWithNight(start, end) {
    let overlap = 0;
    for (let day = Math.floor(start / 1440) - 1; day <= Math.floor((end - 1) / 1440); day += 1) {
      const nightStart = day * 1440 + 22 * 60;
      const nightEnd = day * 1440 + 30 * 60;
      overlap += Math.max(0, Math.min(end, nightEnd) - Math.max(start, nightStart));
    }
    return overlap;
  }

  function readSelectedSchedule() {
    const schedule = {};
    for (const weekday of weekdays) {
      const $checkbox = $(`#day-${weekday.id}`);
      if (!$checkbox.prop("checked")) {
        continue;
      }
      const $row = $(`#schedule-${weekday.id}`);
      const result = getShiftTimes(
        $row.find(".shift-start").val(),
        $row.find(".shift-end").val(),
        !$row.find(".break-none").prop("checked"),
        $row.find(".break-start").val(),
        $row.find(".break-end").val()
      );
      if (result.error) {
        return { error: result.error, row: $row };
      }
      schedule[weekday.day] = {
        weekday: weekdayNames[weekday.day],
        durationMinutes: result.durationMinutes,
        nightMinutes: result.nightMinutes,
        breakMinutes: result.breakMinutes
      };
    }
    return { schedule };
  }

  function getPeriodDates(schedule) {
    const start = parseDate($("#period-start").val());
    if (start === null) {
      return { error: "올바른 시작일을 선택해주세요.", field: $("#period-start") };
    }

    const shiftCountValue = $("#shift-count").val();
    const shiftCount = Number(shiftCountValue);
    if (!/^\d+$/.test(shiftCountValue) || !Number.isInteger(shiftCount) || shiftCount < 1 || shiftCount > 90) {
      return {
        error: "근무 횟수는 1회 이상 90회 이하의 정수로 입력해주세요.",
        field: $("#shift-count"),
        errorId: "#period-error"
      };
    }

    let foundShifts = 0;
    let end = start;
    const maximumDays = shiftCount * 7 + 6;
    for (let offset = 0; offset < maximumDays && foundShifts < shiftCount; offset += 1) {
      const timestamp = start + offset * 86400000;
      const date = new Date(timestamp);
      if (schedule[date.getUTCDay()]) {
        foundShifts += 1;
        end = timestamp;
      }
    }
    return {
      start,
      end,
      days: Math.floor((end - start) / 86400000) + 1,
      shiftCount
    };
  }

  function buildDailyRows(period, schedule) {
    const rows = [];
    let totalMinutes = 0;
    let totalNightMinutes = 0;
    let workdays = 0;
    for (let offset = 0; offset < period.days; offset += 1) {
      const timestamp = period.start + offset * 86400000;
      const date = new Date(timestamp);
      const daySchedule = schedule[date.getUTCDay()];
      if (!daySchedule) {
        continue;
      }
      totalMinutes += daySchedule.durationMinutes;
      totalNightMinutes += daySchedule.nightMinutes;
      workdays += 1;
      rows.push({
        date: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`,
        weekday: daySchedule.weekday,
        durationMinutes: daySchedule.durationMinutes,
        nightMinutes: daySchedule.nightMinutes
      });
    }
    return { rows, totalMinutes, totalNightMinutes, workdays };
  }

  function validateAndCalculate() {
    clearAlbaErrors();
    const wageText = $("#hourly-wage").val().replace(/,/g, "").trim();
    const wage = Number(wageText);
    if (!wageText || !/^\d+$/.test(wageText) || !Number.isSafeInteger(wage) || wage <= 0) {
      return { error: "시급은 0보다 큰 정수 금액으로 입력해주세요.", field: $("#hourly-wage"), errorId: "#wage-error" };
    }

    const selected = readSelectedSchedule();
    if (selected.error) {
      return { error: selected.error, field: selected.row.find(".shift-start"), errorId: selected.row.find(".schedule-error") };
    }
    const schedule = selected.schedule;
    if (Object.keys(schedule).length === 0) {
      return { error: "근무할 요일을 한 개 이상 선택해주세요.", errorId: "#weekday-error" };
    }

    const period = getPeriodDates(schedule);
    if (period.error) {
      return { error: period.error, field: period.field, errorId: period.errorId || "#period-error" };
    }

    const daily = buildDailyRows(period, schedule);
    const weeklyScheduleMinutes = Object.values(schedule).reduce((sum, item) => sum + item.durationMinutes, 0);
    const scheduleMatchValue = $('input[name="schedule-contract-match"]:checked').val();
    const scheduleMatches = scheduleMatchValue === "yes";
    let contractMinutes = weeklyScheduleMinutes;
    if (scheduleMatchValue !== "yes") {
      const contractHoursValue = $("#contract-hours").val();
      const contractHours = Number(contractHoursValue);
      if (
        !contractHoursValue ||
        !Number.isFinite(contractHours) ||
        contractHours <= 0 ||
        contractHours > 168
      ) {
        return {
          error: "계약상 소정근로시간을 0시간 초과, 주 168시간 이하로 입력해주세요.",
          field: $("#contract-hours"),
          errorId: "#contract-hours-error"
        };
      }
      contractMinutes = Math.round(contractHours * 60);
    }

    const attendanceValue = $('input[name="attendance"]:checked').val();
    const relationshipValue = $('input[name="employment-maintained"]:checked').val();
    const holidayIncludedValue = $('input[name="holiday-included"]:checked').val();
    const attendance = attendanceValue === "yes";
    const relationshipMaintained = relationshipValue === "yes";
    const holidayIncluded = holidayIncludedValue === "yes";
    const workplace = $('input[name="workplace-size"]:checked').val();
    const agreedNightPay = $("#agreed-night-pay").prop("checked");
    const deductionType = $('input[name="deduction-type"]:checked').val();

    const basePay = Math.round(wage * daily.totalMinutes / 60);
    const nightPremiumAtFullRate = Math.round(wage * daily.totalNightMinutes / 2 / 60);
    let nightPay = 0;
    if (workplace === "large" || (workplace === "small" && agreedNightPay)) {
      nightPay = nightPremiumAtFullRate;
    }

    const meetsWeeklyHours = contractMinutes >= 15 * 60;
    const holidayEligible = meetsWeeklyHours && attendance && relationshipMaintained && !holidayIncluded;
    const estimatedWeeks = Math.ceil(period.shiftCount / Object.keys(schedule).length);
    // Round each weekly holiday allowance to a whole won before summing complete estimated workweeks.
    const weeklyHolidayPay = Math.round(wage * contractMinutes * 8 / 40 / 60);
    const holidayPay = holidayEligible
      ? weeklyHolidayPay * estimatedWeeks
      : 0;
    const gross = basePay + nightPay + holidayPay;
    const deduction = deductionType === "3.3" ? Math.round(gross * 0.033) : 0;
    if (
      ![
        basePay,
        nightPremiumAtFullRate,
        nightPay,
        weeklyHolidayPay,
        estimatedWeeks,
        holidayPay,
        gross,
        deduction,
        gross - deduction
      ].every(Number.isSafeInteger)
    ) {
      return { error: "입력 금액이 계산 가능한 범위를 초과했습니다. 시급을 확인해주세요.", field: $("#hourly-wage"), errorId: "#wage-error" };
    }

    return {
      wage,
      period,
      daily,
      schedule,
      workplace,
      agreedNightPay,
      nightPremiumAtFullRate,
      basePay,
      nightPay,
      holidayPay,
      weeklyHolidayPay,
      holidayEligible,
      meetsWeeklyHours,
      holidayIncluded,
      holidayIncludedValue,
      scheduleMatches,
      scheduleMatchValue,
      contractMinutes,
      attendance,
      attendanceValue,
      relationshipMaintained,
      relationshipValue,
      deductionType,
      deduction,
      gross,
      takeHome: gross - deduction
    };
  }

  function addNotice(message, className) {
    $("<p>").addClass(className || "result-notice").text(message).appendTo("#result-notices");
  }

  function renderDailyBreakdown(rows, wage, workplace, agreedNightPay) {
    const $container = $("#daily-breakdown-content").empty();
    if (!rows.length) {
      $("<p>").text("선택한 기간에 근무 일정이 없습니다. 기간과 요일을 확인해주세요.").appendTo($container);
      return;
    }
    rows.forEach((row) => {
      const dailyBase = Math.round(wage * row.durationMinutes / 60);
      const nightPremium = Math.round(wage * row.nightMinutes / 2 / 60);
      const dailyNight = workplace === "large" || (workplace === "small" && agreedNightPay)
        ? nightPremium
        : 0;
      const $item = $("<article>").addClass("daily-item");
      $("<h4>").text(`${row.date} · ${row.weekday}`).appendTo($item);
      const $list = $("<dl>");
      [
        ["실제 근무시간", formatHours(row.durationMinutes)],
        ["야간근로", formatHours(row.nightMinutes)],
        ["기본 급여", formatWon(dailyBase)],
        ["야간 가산수당", formatWon(dailyNight)]
      ].forEach(([label, value]) => {
        $("<dt>").text(label).appendTo($list);
        $("<dd>").text(value).appendTo($list);
      });
      $item.append($list).appendTo($container);
    });
  }

  function renderAlbaResult(result) {
    const startDate = new Date(result.period.start);
    const endDate = new Date(result.period.end);
    const dateLabel = (date) =>
      `${date.getUTCFullYear()}.${String(date.getUTCMonth() + 1).padStart(2, "0")}.${String(date.getUTCDate()).padStart(2, "0")}`;

    $("#out-wage").text(formatWon(result.wage));
    $("#out-period").text(`${result.period.shiftCount}회 · ${dateLabel(startDate)} ~ ${dateLabel(endDate)}`);
    $("#out-days").text(`${result.daily.workdays}회`);
    $("#out-hours").text(formatHours(result.daily.totalMinutes));
    $("#out-night-hours").text(formatHours(result.daily.totalNightMinutes));
    $("#out-base-pay").text(formatWon(result.basePay));
    $("#out-night-pay").text(formatWon(result.nightPay));
    $("#out-holiday-pay").text(formatWon(result.holidayPay));
    $("#out-gross").text(formatWon(result.gross));
    $("#out-deduction-type").text(result.deductionType === "3.3" ? "3.3% 단순 공제" : "공제 없음");
    $("#out-deduction").text(result.deduction ? `− ${formatWon(result.deduction)}` : formatWon(0));
    $("#out-net").text(formatWon(result.takeHome));
    $("#alba-result-summary").text("입력하신 근무 조건에 따른 예상 금액입니다.");
    $("#alba-results-card").addClass("is-calculated");
    $("#alba-empty").hide();
    $("#stale-message").prop("hidden", true);
    $("#result-notices").empty();

    if (result.workplace === "small" && !result.agreedNightPay) {
      addNotice("5인 미만 사업장은 법정 야간 가산수당을 기본 계산에 포함하지 않았습니다. 별도 약정이 있는 경우 옵션을 선택해주세요.");
    } else if (result.workplace === "small") {
      addNotice("5인 미만 사업장으로 선택되어 약정에 따른 야간 가산수당을 별도 적용했습니다. 법정 의무 수당을 의미하지 않습니다.");
    } else if (result.workplace === "unknown") {
      addNotice(`사업장 규모를 모르는 상태라 기본 합계에는 법정 야간 가산수당을 포함하지 않았습니다. 5인 이상 기준 야간 가산 예상액은 ${formatWon(result.nightPremiumAtFullRate)}이며, 적용 여부를 확인해주세요.`, "result-notice result-notice--warning");
    }

    if (!result.meetsWeeklyHours) {
      addNotice("계약상 주 소정근로시간이 15시간 미만이므로 주휴수당은 0원으로 계산했습니다.");
    } else if (result.holidayIncluded) {
      addNotice("시급에 주휴수당이 포함된 것으로 선택하여 중복 계산을 방지했습니다. 포함된 금액의 구성은 별도로 확인해주세요.");
    } else if (result.holidayEligible) {
      addNotice(`주휴수당 예상 대상입니다. 주 40시간·주 5일 통상근로자 기준식으로 주 ${formatWon(result.weeklyHolidayPay)}를 근무 횟수에 해당하는 약 ${result.estimatedWeeks}주 기준으로 추정했습니다. 지급 요건과 계약 조건을 추가 확인해주세요.`, "result-notice result-notice--warning");
    } else {
      const uncertain = result.attendanceValue === "unknown" ||
        result.relationshipValue === "unknown" ||
        result.holidayIncludedValue === "unknown";
      addNotice(
        uncertain
          ? "개근 여부·근로관계 유지·시급의 주휴수당 포함 여부 중 확인되지 않은 항목이 있어 주휴수당을 합계에 추가하지 않았습니다. 조건을 확인한 뒤 다시 계산해주세요."
          : "입력한 개근 또는 근로관계 유지 조건이 충족되지 않아 주휴수당을 0원으로 계산했습니다. 실제 지급 요건은 근로계약을 확인해주세요."
      );
    }

    if (result.scheduleMatchValue === "unknown") {
      addNotice("일정이 계약상 소정근로 일정과 같은지 확인되지 않아, 입력하신 별도의 계약상 주 소정근로시간을 사용했습니다.");
    } else if (!result.scheduleMatches) {
      addNotice("입력한 근무 일정과 계약 일정이 달라 계약상 주 소정근로시간을 기준으로 주휴수당을 추정했습니다.");
    }
    if (result.daily.workdays === 0) {
      addNotice("선택한 기간에는 입력한 근무 요일이 포함되지 않아 해당 기간의 기본 급여와 야간수당은 0원입니다.");
    }
    addNotice("실제 휴게시간의 법정 기준 충족 여부는 별도로 확인이 필요합니다.");
    renderDailyBreakdown(result.daily.rows, result.wage, result.workplace, result.agreedNightPay);
    hasAlbaResult = true;
  }

  function clearAlbaErrors() {
    $("#alba-form .form-error").text("");
    $("#alba-form [aria-invalid='true']").removeAttr("aria-invalid");
  }

  function showAlbaError(error, field, errorId) {
    if (errorId && errorId.jquery) {
      errorId.text(error);
    } else if (errorId) {
      $(errorId).text(error);
    } else {
      $("#alba-form-error").text(error);
    }
    if (field && field.length) {
      field.attr("aria-invalid", "true").trigger("focus");
    }
  }

  function markAlbaStale() {
    if (hasAlbaResult) {
      $("#stale-message").prop("hidden", false);
      $("#alba-results-card").addClass("is-stale");
      $("#alba-result-summary").text("입력값이 변경되어 결과를 다시 계산해야 합니다.");
    }
  }

  function renderWeekdayControls() {
    const $options = $("#weekday-options");
    const $schedules = $("#weekday-schedules");
    weekdays.forEach((weekday) => {
      const inputId = `day-${weekday.id}`;
      const scheduleId = `schedule-${weekday.id}`;
      $("<label>")
        .addClass("weekday-choice")
        .attr("for", inputId)
        .append(
          $("<input>").attr({ type: "checkbox", id: inputId, value: weekday.day }),
          $("<span>").text(weekday.label)
        )
        .appendTo($options);

      const $row = $("<div>").addClass("schedule-row").attr({ id: scheduleId, hidden: true });
      $("<h3>").text(`${weekdayNames[weekday.day]} 근무시간`).appendTo($row);
      const $times = $("<div>").addClass("schedule-time-grid");
      [
        ["출근", "shift-start", "16:30"],
        ["퇴근", "shift-end", "23:00"]
      ].forEach(([label, className, value]) => {
        const $field = $("<label>").addClass("time-field").text(label);
        $("<input>").attr({ type: "time", step: 60, value }).addClass(className).appendTo($field);
        $field.appendTo($times);
      });
      const $break = $("<div>").addClass("break-controls");
      const $noneLabel = $("<label>").addClass("inline-check");
      $("<input>").attr({ type: "checkbox", checked: true }).addClass("break-none").appendTo($noneLabel);
      $("<span>").text("휴게 없음").appendTo($noneLabel);
      $noneLabel.appendTo($break);
      const $breakTimes = $("<div>").addClass("break-time-grid").prop("hidden", true);
      [
        ["휴게 시작", "break-start", "20:00"],
        ["휴게 종료", "break-end", "20:30"]
      ].forEach(([label, className, value]) => {
        const $field = $("<label>").addClass("time-field").text(label);
        $("<input>").attr({ type: "time", step: 60, value }).addClass(className).appendTo($field);
        $field.appendTo($breakTimes);
      });
      $break.append($breakTimes);
      $("<p>").addClass("form-error schedule-error").attr("role", "alert").appendTo($row);
      $row.append($times, $break).appendTo($schedules);
    });
  }

  function setLocalDateDefaults() {
    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    $("#period-start").val(localDate);
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp);
    return `${date.getUTCFullYear()}.${String(date.getUTCMonth() + 1).padStart(2, "0")}.${String(date.getUTCDate()).padStart(2, "0")}`;
  }

  function addCalendarMonths(timestamp, monthOffset) {
    const date = new Date(timestamp);
    const originalDay = date.getUTCDate();
    const targetMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + monthOffset, 1));
    const lastDay = new Date(Date.UTC(targetMonth.getUTCFullYear(), targetMonth.getUTCMonth() + 1, 0)).getUTCDate();
    targetMonth.setUTCDate(Math.min(originalDay, lastDay));
    return targetMonth.getTime();
  }

  function getRetirementPeriods(endTimestamp) {
    const finalDayExclusive = endTimestamp + 86400000;
    const boundaries = [
      addCalendarMonths(finalDayExclusive, -3),
      addCalendarMonths(finalDayExclusive, -2),
      addCalendarMonths(finalDayExclusive, -1),
      finalDayExclusive
    ];
    return boundaries.slice(0, 3).map((start, index) => ({
      start,
      end: boundaries[index + 1] - 86400000
    }));
  }

  function updateRetirementPeriodLabels() {
    const end = parseDate($("#employment-end").val());
    if (end === null) {
      return;
    }
    getRetirementPeriods(end).forEach((period, index) => {
      $(`#wage-period-${index + 1}-label`).text(`${formatDate(period.start)} ~ ${formatDate(period.end)}`);
    });
  }

  function retirementAmountValue(selector, label) {
    const raw = $(selector).val().replace(/,/g, "").trim();
    const amount = Number(raw);
    if (!raw || !/^\d+$/.test(raw) || !Number.isSafeInteger(amount) || amount < 0) {
      return { error: `${label}은(는) 0원 이상의 정수로 입력해주세요.`, field: $(selector) };
    }
    return { amount };
  }

  function showRetirementError(error, field) {
    field.attr("aria-invalid", "true").trigger("focus");
    const errorId = field.attr("id");
    const errorMap = {
      "employment-start": "#employment-start-error",
      "employment-end": "#employment-end-error",
      "weekly-hours": "#weekly-hours-error",
      "three-month-wage-1": "#three-month-wage-error",
      "three-month-wage-2": "#three-month-wage-error",
      "three-month-wage-3": "#three-month-wage-error",
      "annual-bonus": "#annual-bonus-error",
      "annual-leave-pay": "#annual-leave-error"
    };
    $(errorMap[errorId]).text(error);
    $("#retirement-result-summary").text("입력 내용을 확인한 뒤 다시 계산해주세요.");
  }

  function calculateRetirementPay() {
    $("#retirement-form .form-error").text("");
    $("#retirement-form [aria-invalid='true']").removeAttr("aria-invalid");
    const employmentStart = parseDate($("#employment-start").val());
    const employmentEnd = parseDate($("#employment-end").val());
    if (employmentStart === null) {
      showRetirementError("올바른 입사일을 입력해주세요.", $("#employment-start"));
      return;
    }
    if (employmentEnd === null) {
      showRetirementError("올바른 퇴사일을 입력해주세요.", $("#employment-end"));
      return;
    }
    if (employmentEnd < employmentStart) {
      showRetirementError("퇴사일은 입사일과 같거나 이후여야 합니다.", $("#employment-end"));
      return;
    }

    const weeklyHoursText = $("#weekly-hours").val();
    const weeklyHours = Number(weeklyHoursText);
    if (!weeklyHoursText || !Number.isFinite(weeklyHours) || weeklyHours < 0 || weeklyHours > 168) {
      showRetirementError("주 소정근로시간은 0~168시간 사이로 입력해주세요.", $("#weekly-hours"));
      return;
    }

    const wageValues = [];
    for (let index = 1; index <= 3; index += 1) {
      const wage = retirementAmountValue(`#three-month-wage-${index}`, "해당 기간 임금");
      if (wage.error) {
        showRetirementError(wage.error, wage.field);
        return;
      }
      wageValues.push(wage.amount);
    }
    const bonus = retirementAmountValue("#annual-bonus", "상여금");
    if (bonus.error) {
      showRetirementError(bonus.error, bonus.field);
      return;
    }
    const leavePay = retirementAmountValue("#annual-leave-pay", "연차수당");
    if (leavePay.error) {
      showRetirementError(leavePay.error, leavePay.field);
      return;
    }

    const periods = getRetirementPeriods(employmentEnd);
    const averagePeriodDays = Math.round((periods[2].end + 86400000 - periods[0].start) / 86400000);
    const threeMonthWages = wageValues.reduce((sum, amount) => sum + amount, 0);
    const includedBonus = bonus.amount * 3 / 12;
    const includedLeavePay = leavePay.amount * 3 / 12;
    const eligibleWages = threeMonthWages + includedBonus + includedLeavePay;
    const serviceDays = Math.floor((employmentEnd - employmentStart) / 86400000) + 1;
    const eligible = serviceDays >= 365 && weeklyHours >= 15;
    if (
      !Number.isSafeInteger(threeMonthWages) ||
      !Number.isFinite(eligibleWages) ||
      eligibleWages > Number.MAX_SAFE_INTEGER ||
      !Number.isSafeInteger(serviceDays) ||
      !Number.isSafeInteger(averagePeriodDays)
    ) {
      showRetirementError("입력 금액이 계산 가능한 범위를 초과했습니다.", $("#three-month-wage-1"));
      return;
    }

    const averageDailyWage = eligibleWages / averagePeriodDays;
    const amount = eligible
      ? Math.round(averageDailyWage * 30 * serviceDays / 365)
      : 0;

    $("#retirement-amount").text(formatWon(amount));
    $("#retirement-service").text(`${serviceDays.toLocaleString("ko-KR")}일 (${(serviceDays / 365).toFixed(2)}년)`);
    $("#retirement-average-period").text(`${formatDate(periods[0].start)} ~ ${formatDate(periods[2].end)} (${averagePeriodDays}일)`);
    $("#retirement-wage-total").text(formatWon(eligibleWages));
    $("#retirement-daily-average").text(`${averageDailyWage.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}원`);
    $("#retirement-eligibility").text(eligible ? "요건 충족 가능성 있음" : "대상 요건 미충족");
    $("#retirement-result-summary").text(eligible
      ? "입력하신 정보에 따른 세전 퇴직금 예상액입니다."
      : "입력하신 조건으로는 법정 퇴직급여 요건에 해당하지 않을 수 있습니다.");
    $("#retirement-result-card").addClass("is-calculated").removeClass("is-stale");
    $("#retirement-notices").empty();
    if (serviceDays < 365) {
      addRetirementNotice("계속근로기간이 1년 미만으로 입력되어 퇴직급여 대상 요건에 미달할 수 있습니다. 실제 근속기간 산정은 개별 사정을 확인해주세요.");
    }
    if (weeklyHours < 15) {
      addRetirementNotice("주 소정근로시간이 15시간 미만으로 입력되어 퇴직급여 대상 요건에 미달할 수 있습니다.");
    }
    addRetirementNotice("상여금과 연차수당은 입력한 최근 1년 지급 합계의 3/12를 평균임금에 반영한 추정치입니다. 평균임금·통상임금 비교, 세금 및 개별 제외 기간은 별도로 확인해야 합니다.");
  }

  function addRetirementNotice(message) {
    $("<p>").addClass("result-notice").text(message).appendTo("#retirement-notices");
  }

  renderWeekdayControls();
  setLocalDateDefaults();

  $baseAmount.on("input", function () {
    formatNumericInput(this);
    $baseError.text("");
    $(this).removeAttr("aria-invalid");
    markSalaryResultsStale();
  });

  $('input[name="salary-calc-mode"]').on("change", function () {
    setSalaryCalculationMode(this.value);
  });
  setSalaryCalculationMode($('input[name="salary-calc-mode"]:checked').val());

  $baseForm.on("submit", function (event) {
    event.preventDefault();
    calculateGrossSalary();
  });

  $('input[name="area-calc-mode"]').on("change", function () {
    setAreaCalculationMode(this.value);
  });

  $areaForm.on("input", "#area-amount", function () {
    $("#area-form-error").text("");
    $(this).removeAttr("aria-invalid");
    if ($("#area-result-card").hasClass("is-calculated")) {
      $("#area-result-card").addClass("is-stale");
      $("#area-result-summary").text("입력값이 변경되었습니다. 다시 계산해주세요.");
    }
  });

  $areaForm.on("submit", function (event) {
    event.preventDefault();
    calculateArea();
  });

  $(".mode-tab").on("click", function () {
    const isAlba = this.id === "alba-tab";
    $(".mode-tab").removeClass("is-active").attr({ "aria-selected": "false", tabindex: "-1" });
    $(this).addClass("is-active").attr({ "aria-selected": "true", tabindex: "0" });
    $("#base-panel").prop("hidden", isAlba);
    $("#alba-panel").prop("hidden", !isAlba);
  });

  $("#weekday-options").on("change", "input[type='checkbox']", function () {
    $(`#schedule-${weekdays.find((day) => `day-${day.id}` === this.id).id}`).prop("hidden", !this.checked);
    $("#weekday-error").text("");
  });

  $("#weekday-schedules").on("change", ".break-none", function () {
    $(this).closest(".break-controls").find(".break-time-grid").prop("hidden", this.checked);
  });

  $('input[name="workplace-size"]').on("change", function () {
    const selected = $('input[name="workplace-size"]:checked').val();
    $("#small-business-option").prop("hidden", selected !== "small");
    $("#workplace-hint").text(
      selected === "large"
        ? "5인 이상 사업장은 야간근로에 대해 시급의 50% 가산을 추정 적용합니다."
        : selected === "small"
          ? "5인 미만 선택 시 법정 야간 가산수당은 기본 합계에 포함하지 않습니다."
          : "규모를 모르면 기본 합계는 가산 제외로 계산하며, 5인 이상 기준 예상액을 별도로 안내합니다."
    );
  }).trigger("change");

  $('input[name="schedule-contract-match"]').on("change", function () {
    const matched = $('input[name="schedule-contract-match"]:checked').val() === "yes";
    $("#contract-hours-wrap").prop("hidden", matched);
    $("#contract-hours").prop("required", !matched);
  }).trigger("change");

  $("#hourly-wage").on("input", function () {
    const rawValue = this.value.replace(/,/g, "");
    if (/^\d+$/.test(rawValue)) {
      this.value = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    $("#wage-error").text("");
    $(this).removeAttr("aria-invalid");
  });

  $("#retirement-form .three-month-wage, #annual-bonus, #annual-leave-pay").on("input", function () {
    formatNumericInput(this);
  });

  $albaForm.on("input change", "input, select", function () {
    clearAlbaErrors();
    markAlbaStale();
  });

  $albaForm.on("submit", function (event) {
    event.preventDefault();
    clearAlbaErrors();
    $("#alba-form-error").text("");
    const result = validateAndCalculate();
    if (result.error) {
      showAlbaError(result.error, result.field, result.errorId);
      return;
    }
    renderAlbaResult(result);
    $("#alba-results-card").removeClass("is-stale");
  });

  if ($("#retirement-form").length) {
    const today = new Date();
    const currentDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    $("#employment-end").val(currentDate);
    const oneYearPrior = new Date(today);
    oneYearPrior.setFullYear(oneYearPrior.getFullYear() - 1);
    $("#employment-start").val(`${oneYearPrior.getFullYear()}-${String(oneYearPrior.getMonth() + 1).padStart(2, "0")}-${String(oneYearPrior.getDate()).padStart(2, "0")}`);
    updateRetirementPeriodLabels();

    $("#employment-end").on("change", updateRetirementPeriodLabels);
    $("#retirement-form").on("input change", "input", function () {
      $("#retirement-form .form-error").text("");
      $("#retirement-form [aria-invalid='true']").removeAttr("aria-invalid");
      if ($("#retirement-result-card").hasClass("is-calculated")) {
        $("#retirement-result-card").addClass("is-stale");
        $("#retirement-result-summary").text("입력값이 변경되었습니다. 다시 계산해주세요.");
      }
    });
    $("#retirement-form").on("submit", function (event) {
      event.preventDefault();
      calculateRetirementPay();
    });
  }
});
