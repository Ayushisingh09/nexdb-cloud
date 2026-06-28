const dbMetrics = new Map();
const hourlyBuckets = new Map();

function ensureMetrics(dbId) {
  if (!dbMetrics.has(dbId)) {
    dbMetrics.set(dbId, { reads: 0, writes: 0, startTime: Date.now() });
  }
  return dbMetrics.get(dbId);
}

function recordBucket(dbId, type) {
  const hour = Math.floor(Date.now() / 3600000);
  const key = `${dbId}:${hour}`;
  if (!hourlyBuckets.has(key)) hourlyBuckets.set(key, { reads: 0, writes: 0 });
  hourlyBuckets.get(key)[type === 'read' ? 'reads' : 'writes']++;
}

export function recordRead(dbId) {
  ensureMetrics(dbId).reads++;
  recordBucket(dbId, 'read');
}

export function recordWrite(dbId) {
  ensureMetrics(dbId).writes++;
  recordBucket(dbId, 'write');
}

export function getMetrics(dbId) {
  const m = ensureMetrics(dbId);
  return { reads: m.reads, writes: m.writes };
}

export function getAllMetrics() {
  const result = {};
  for (const [dbId, m] of dbMetrics) {
    result[dbId] = { reads: m.reads, writes: m.writes };
  }
  return result;
}

const MS_PER_DAY = 86400000;

export function getDailyHistory(dbId, days = 14) {
  const now = Date.now();
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(now - i * MS_PER_DAY);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + MS_PER_DAY);

    let total = 0;
    for (const [key, val] of hourlyBuckets) {
      const [id, hourTs] = key.split(':');
      if (id !== dbId) continue;
      const hourMs = parseInt(hourTs) * 3600000;
      if (hourMs >= dayStart.getTime() && hourMs < dayEnd.getTime()) {
        total += val.reads + val.writes;
      }
    }

    data.push({
      date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: total,
    });
  }
  return data;
}

export function getAggregatedDailyHistory(userDbIds, days = 14) {
  const now = Date.now();
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(now - i * MS_PER_DAY);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + MS_PER_DAY);

    let total = 0;
    for (const [key, val] of hourlyBuckets) {
      const [id, hourTs] = key.split(':');
      if (!userDbIds.includes(id)) continue;
      const hourMs = parseInt(hourTs) * 3600000;
      if (hourMs >= dayStart.getTime() && hourMs < dayEnd.getTime()) {
        total += val.reads + val.writes;
      }
    }

    data.push({
      date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: total,
    });
  }
  return data;
}
