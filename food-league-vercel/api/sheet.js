const SHEET_ID = '1MFgr9UzqoybNH3jybqb-piY63DEf1t0lub46B0czmwg';
const GID = '1221285139';
const DEFAULT_MONTH = 5;
function csvUrlForMonth(month) {
  const sheetName = `Bill Hải tháng ${month}`;
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
}
function fallbackCsvUrl() {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
}

function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (quoted) {
      if (c === '"' && n === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else {
      if (c === '"') quoted = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else if (c !== '\r') cell += c;
    }
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function num(v) {
  v = String(v || '').trim();
  if (!v) return 0;
  return Number(v) || 0;
}

function normDish(s) {
  const k = String(s || '').toLowerCase().trim();
  const map = {
    'bun ca': 'Bún cá',
    'bún cá rô': 'Bún cá',
    'bún cá rô ': 'Bún cá',
    'sinh to': 'Sinh tố',
    'chuoi chien': 'Chuối chiên',
    'goi cuon': 'Gỏi cuốn',
    'banh can': 'Bánh căn',
    'bánh căn': 'Bánh căn',
    'com luon': 'Cơm lươn',
    'com lươn/bò': 'Cơm lươn/bò',
    'bếp nhà ni': 'Bếp Nhà Ni',
    'banh mi': 'Bánh mì',
    'che': 'Chè',
    'nuoc ep': 'Nước ép'
  };
  return map[k] || String(s || '').trim().replace(/\b\w/g, m => m.toUpperCase());
}

function analyse(csv) {
  const rows = parseCSV(csv);
  const peopleNames = ['Khánh', 'Hải', 'Tin', 'Duy', 'Tâm', 'Việt', 'Nhung', 'Đạt', 'Công ty'];
  const people = Object.fromEntries(peopleNames.map(p => [p, { name: p, total: 0, orders: 0 }]));
  const dishes = {};
  let total = 0;

  let currentMonth = null;
  let totalRow = null;

  for (const r of rows.slice(1)) {
    const date = String(r[0] || '').trim();
    const dishRaw = String(r[1] || '').trim();

    if (date === 'Tổng' || (!date && !dishRaw && num(r[13]) > 0 && peopleNames.some((p, i) => num(r[2 + i]) > 0))) {
      totalRow = r;
      continue;
    }

    if (date) currentMonth = date.startsWith('5/') ? '5' : 'other';
    if (currentMonth !== '5') continue;
    if (!dishRaw) continue;

    // Column layout: Ngày,Nội dung,9 people,Giảm Giá/người,Số người ăn,Tổng,...
    // So "Tổng" is index 13, not 12.
    const rowTotal = num(r[13]);
    if (rowTotal <= 0) continue;
    total += rowTotal;

    let eater = 0;
    peopleNames.forEach((p, i) => {
      const v = num(r[2 + i]);
      if (v > 0) {
        people[p].orders += 1;
        eater += 1;
      }
    });

    const d = normDish(dishRaw);
    dishes[d] ||= { name: d, count: 0, people: 0, total: 0 };
    dishes[d].count += 1;
    dishes[d].people += eater;
    dishes[d].total += rowTotal;
  }

  // Prefer the sheet's own "Tổng" row for person totals, because it is the source of truth users see.
  if (totalRow) {
    peopleNames.forEach((p, i) => {
      people[p].total = num(totalRow[2 + i]);
    });
    total = num(totalRow[13]) || total;
  }

  const peopleList = Object.values(people).sort((a, b) => b.total - a.total);
  const dishList = Object.values(dishes).sort((a, b) => b.count - a.count || b.people - a.people || b.total - a.total);
  const crowdDish = [...dishList].sort((a, b) => b.people - a.people || b.count - a.count)[0] || null;

  return {
    updatedAt: new Date().toISOString(),
    source: { sheetId: SHEET_ID, gid: GID },
    total,
    people: peopleList,
    dishes: dishList,
    champion: peopleList[0] || null,
    runnerUp: peopleList[1] || null,
    topDish: dishList[0] || null,
    crowdDish
  };
}

module.exports = async function handler(req, res) {
  try {
    const month = Math.max(1, Math.min(12, Number(req.query?.month || DEFAULT_MONTH) || DEFAULT_MONTH));
    const bust = req.query?.refresh ? `&cacheBust=${Date.now()}` : '';
    let response = await fetch(csvUrlForMonth(month) + bust, { cache: 'no-store' });
    if (!response.ok && month === DEFAULT_MONTH) response = await fetch(fallbackCsvUrl() + bust, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Google Sheet HTTP ${response.status}`);
    const csv = await response.text();
    const data = analyse(csv);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', req.query?.refresh ? 'no-store' : 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
};
