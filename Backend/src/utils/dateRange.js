// utils/dateRange.js
function parseDate(s) {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildRangeByPeriod(period = "month") {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (period === "day") {
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);
    end.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    const d = (start.getDay() + 6) % 7; // Mon=0
    start.setDate(start.getDate() - d);
    start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 7);
    end.setHours(0, 0, 0, 0);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(start.getMonth() + 1);
    end.setDate(1);
    end.setHours(0, 0, 0, 0);
  }

  return { from: start.toISOString(), to: end.toISOString() };
}

/**
 * ưu tiên from/to nếu có, nếu không dùng period
 */
function resolveRange({ period, from, to }) {
  let fromISO = from;
  let toISO = to;

  if (!fromISO || !toISO) {
    const r = buildRangeByPeriod(period || "month");
    fromISO = r.from;
    toISO = r.to;
  }

  const fromDate = parseDate(fromISO);
  const toDate = parseDate(toISO);

  if (!fromDate || !toDate) return null;

  return {
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
  };
}

module.exports = {
  parseDate,
  buildRangeByPeriod,
  resolveRange,
};
