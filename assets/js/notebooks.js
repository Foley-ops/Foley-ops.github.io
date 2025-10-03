(() => {
  const USER = 'Foley-ops';
  const REPO = 'Foley-ops.github.io';
  const BRANCH = 'main';
  const TARGET = document.querySelector('#notebooks .grid');
  if (!TARGET) return;

  async function listNotebooks() {
    const url = `https://api.github.com/repos/${USER}/${REPO}/contents/notebooks`;
    const r = await fetch(url, { headers: { 'Accept': 'application/vnd.github+json' } });
    if (!r.ok) throw new Error('no notebooks');
    const items = await r.json();
    return items.filter(x => x.type === 'file' && /\.ipynb$/i.test(x.name));
  }

  function card(nb) {
    const name = nb.name.replace(/\.ipynb$/i, '');
    const nbv = `https://nbviewer.org/github/${USER}/${REPO}/blob/${BRANCH}/notebooks/${encodeURIComponent(nb.name)}`;
    return `
      <article class="card project">
        <h3><a href="${nbv}" target="_blank" rel="noopener">${name}</a></h3>
        <p>Notebook • Rendered via nbviewer</p>
        <div class="cta-row">
          <a class="btn" href="${nbv}" target="_blank" rel="noopener">Open</a>
          <a class="btn outline" href="${nb.html_url}" target="_blank" rel="noopener">Source</a>
        </div>
      </article>`;
  }

  async function render() {
    try {
      const nbs = await listNotebooks();
      if (nbs.length === 0) throw new Error('none');
      TARGET.innerHTML = nbs.map(card).join('');
    } catch {
      TARGET.innerHTML = `
        <article class="project">
          <p>Drop <code>.ipynb</code> files into <code>/notebooks/</code> and they’ll appear here automatically.</p>
        </article>`;
    }
  }

  render();
})();
