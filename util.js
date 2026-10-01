const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Indice de temas: agrupa grafias que diferem so por maiusculas/acentos/espacos
function themeIndex(pessoas) {
  const m = new Map();
  pessoas.forEach(p => (p.temas || []).forEach(t => {
    const k = norm(t);
    if (!m.has(k)) m.set(k, { key: k, label: t, count: 0 });
    m.get(k).count++;
  }));
  return m;
}
