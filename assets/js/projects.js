(() => {
  const USER = 'Foley-ops';
  const TARGET = document.querySelector('#projects .grid');
  if (!TARGET) return;

  const LSKEY = 'gh:repos:v1';
  const TTL = 60 * 60 * 1000; // 1h

  const fromCache = () => {
    try {
      const x = JSON.parse(localStorage.getItem(LSKEY) || '{}');
      return x && Date.now() - x.ts < TTL ? x.data : null;
    } catch { return null; }
  };
  const toCache = (data) => {
    try { localStorage.setItem(LSKEY, JSON.stringify({ ts: Date.now(), data })); } catch {}
  };

  async function getFeaturedList() {
    try {
      const r = await fetch('/featured.json', { cache: 'no-store' });
      return r.ok ? r.json() : null;
    } catch { return null; }
  }

  async function getRepos() {
    const url = `https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`;
    const r = await fetch(url, { headers: { 'Accept': 'application/vnd.github+json' } });
    if (!r.ok) throw new Error(`GitHub API error: ${r.status}`);
    return r.json();
  }

  function pickRepos(all, featured) {
    let repos = all.filter(r => !r.fork && !r.archived);
    if (featured && Array.isArray(featured) && featured.length) {
      const map = new Map(repos.map(r => [r.full_name.toLowerCase(), r]));
      repos = featured.map(name => map.get(name.toLowerCase())).filter(Boolean);
    } else {
      repos = repos
        .sort((a,b) =>
          (b.stargazers_count - a.stargazers_count) ||
          (new Date(b.pushed_at) - new Date(a.pushed_at))
        )
        .slice(0, 6);
    }
    return repos;
  }

  const fmt = new Intl.DateTimeFormat(undefined, { year:'numeric', month:'short', day:'2-digit' });
  const esc = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const card = r => `
    <article class="card project">
      <h3><a href="${r.html_url}" target="_blank" rel="noopener">${r.name}</a></h3>
      <p>${r.description ? esc(r.description) : 'No description yet.'}</p>
      <ul class="tags">
        ${r.language ? `<li>${r.language}</li>` : ''}
        <li title="Stars">★ ${r.stargazers_count}</li>
        <li title="Last push">${fmt.format(new Date(r.pushed_at))}</li>
      </ul>
      <div class="cta-row">
        ${r.homepage && !/^https?:\/\/github\.com/i.test(r.homepage)
          ? `<a class="btn outline" href="${r.homepage}" target="_blank" rel="noopener">Demo</a>` : ''}
        <a class="btn" href="${r.html_url}" target="_blank" rel="noopener">Repo</a>
      </div>
    </article>`;

  async function render() {
    TARGET.innerHTML = '<article class="project"><p>Loading projects…</p></article>';
    let data = fromCache();
    try {
      if (!data) {
        const [featured, repos] = await Promise.all([getFeaturedList(), getRepos()]);
        data = pickRepos(repos, featured);
        toCache(data);
      }
      TARGET.innerHTML = data.map(card).join('');
    } catch (err) {
      console.error(err);
      TARGET.innerHTML = `
        <article class="project">
          <p>Could not load from GitHub (rate limited/offline). Add a <code>featured.json</code> file to control this section locally.</p>
        </article>`;
    }
  }

  render();
})();
