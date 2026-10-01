// Camada de dados: Supabase (producao) ou localStorage (modo demo, sem configuracao)
(function () {
  const cfg = window.LINA_CONFIG || {};
  const demo = !cfg.SUPABASE_URL;
  const listeners = [];
  const emit = () => listeners.forEach(f => f());
  let api;

  if (demo) {
    const K = 'lina_demo_pessoas', F = 'lina_demo_fase';
    const read = () => JSON.parse(localStorage.getItem(K) || '[]');
    const write = v => { localStorage.setItem(K, JSON.stringify(v)); emit(); };
    window.addEventListener('storage', e => { if (e.key === K || e.key === F) emit(); });
    api = {
      demo: true,
      async listPessoas() { return read(); },
      async getFase() { return +(localStorage.getItem(F) || 1); },
      async setFase(n) { localStorage.setItem(F, n); emit(); },
      async savePessoa(p) {
        const v = read();
        if (p.id) {
          const i = v.findIndex(x => x.id === p.id);
          if (i >= 0) v[i] = { ...v[i], ...p }; else v.push(p);
        } else {
          p = { ...p, id: crypto.randomUUID(), criado_em: new Date().toISOString() };
          v.push(p);
        }
        write(v);
        return p;
      },
      async deletePessoa(id) { write(read().filter(x => x.id !== id)); },
      async replaceAll(list) { write(list); },
      async login() {}, async logout() {}, async isAdmin() { return true; }
    };
  } else {
    const sb = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    api = {
      demo: false,
      async listPessoas(opts) {
        try {
          const query = sb.from('pessoas').select('*').order('criado_em').then(r => { if (r.error) throw r.error; return r.data; });
          // No grafo, não deixa a pessoa esperando: após 3 s sem resposta, usa a cópia salva
          const data = (opts && opts.fallback)
            ? await Promise.race([query, new Promise((_, rej) => setTimeout(() => rej(new Error('tempo esgotado')), 3000))])
            : await query;
          api.offline = false;
          return data;
        } catch (e) {
          // Só o grafo (somente leitura) usa a cópia salva quando o banco está indisponível
          if (!(opts && opts.fallback)) throw e;
          const r = await fetch('data/pessoas.json', { cache: 'no-cache' });
          if (!r.ok) throw e;
          api.offline = true;
          return r.json();
        }
      },
      async getFase() {
        const { data } = await sb.from('config').select('fase').eq('id', 1).single();
        return (data && data.fase) || 1;
      },
      async setFase(n) {
        const { error } = await sb.from('config').update({ fase: n }).eq('id', 1);
        if (error) throw error;
      },
      async savePessoa(p) {
        let q;
        if (p.id) { const { id, ...rest } = p; q = sb.from('pessoas').update(rest).eq('id', id); }
        else q = sb.from('pessoas').insert(p);
        const { data, error } = await q.select().single();
        if (error) throw error;
        return data;
      },
      async deletePessoa(id) {
        const { error } = await sb.from('pessoas').delete().eq('id', id);
        if (error) throw error;
      },
      async login(email, password) {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async logout() { await sb.auth.signOut(); },
      async isAdmin() { const { data } = await sb.auth.getSession(); return !!data.session; }
    };
    sb.channel('lina')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pessoas' }, emit)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'config' }, emit)
      .subscribe();
  }

  api.onChange = f => {
    let t;
    listeners.push(() => { clearTimeout(t); t = setTimeout(f, 150); });
  };
  window.DB = api;
})();
