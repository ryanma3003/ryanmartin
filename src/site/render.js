// Build-time renderer: content.js → static HTML (runs inside Vite's transformIndexHtml, never in the browser).
// Milestones carry data-enemy/data-xp/data-label; the game discovers enemies from these attributes.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
const TIERS = { slime: 1, mushroom: 1, bat: 1, golem: 2, dragon: 3, knight: 2, darkknight: 3, spikes: 1, boss: 5 };

/** Attributes that turn an element into an in-game enemy. */
const foe = (enemy, cls = '') => {
  const classes = `${cls} ${enemy ? 'milestone' : ''}`.trim();
  const c = classes ? ` class="${classes}"` : '';
  if (!enemy) return c;
  return `${c} data-enemy="${esc(enemy.kind)}" data-xp="${Number(enemy.xp) || 0}" data-label="${esc(enemy.label)}"`;
};
const xpTag = (enemy) =>
  enemy ? ` <span class="xp-tag" aria-hidden="true">${'*'.repeat(TIERS[enemy.kind] ?? 1)} +${Number(enemy.xp) || 0}XP</span>` : '';
const link = (href, label, { external, download, cls } = {}) =>
  `<a href="${esc(href)}"${cls ? ` class="${cls}"` : ''}${external ? ' target="_blank" rel="noopener"' : ''}${download ? ' download' : ''}>${label}</a>`;

export function renderHead({ PROFILE, SITE }) {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: PROFILE.name,
    jobTitle: PROFILE.role,
    email: `mailto:${PROFILE.email}`,
    url: SITE.url,
    address: { '@type': 'PostalAddress', addressLocality: 'Jakarta', addressCountry: 'ID' },
    sameAs: [PROFILE.linkedin, PROFILE.github],
    knowsAbout: SITE.knowsAbout,
  };
  return `<title>${esc(SITE.title)}</title>
    <meta name="description" content="${esc(SITE.description)}" />
    <meta name="author" content="${esc(PROFILE.name)}" />
    <link rel="canonical" href="${esc(SITE.url)}" />
    <meta property="og:type" content="profile" />
    <meta property="og:url" content="${esc(SITE.url)}" />
    <meta property="og:title" content="${esc(PROFILE.name)} — ${esc(PROFILE.role)}" />
    <meta property="og:description" content="${esc(SITE.description)}" />
    <meta name="twitter:card" content="summary" />
    <script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;
}

export function renderBody({ PROFILE, TITLE, ABOUT, SKILLS, EXPERIENCE, PROJECTS, CONTACT }) {
  const pdf = encodeURI(PROFILE.resumePdf);
  const [first, ...rest] = PROFILE.name.split(' ');
  const last = rest.pop() ?? '';

  const title = `
  <section id="top" class="zone zone-title" data-biome="title" data-zone="TITLE SCREEN" aria-labelledby="h-title">
    <div class="title-screen">
      <p class="kicker">${esc(TITLE.kicker)}</p>
      <h1 id="h-title" class="logo"><span>${esc([first, ...rest].join(' '))}</span> <span class="logo-accent">${esc(last)}</span></h1>
      <p class="role">${esc(PROFILE.role)}</p>
      <p class="tagline">${esc(TITLE.tagline)}</p>
      ${link('#about', `<span class="blink" aria-hidden="true">▶</span> ${esc(TITLE.start)}`, { cls: 'press-start' })}
      <ul class="title-menu">
        <li>${link(pdf, 'Résumé PDF', { download: true })}</li>
        <li>${link(PROFILE.github, 'GitHub', { external: true })}</li>
        <li>${link(PROFILE.linkedin, 'LinkedIn', { external: true })}</li>
        <li>${link(`mailto:${PROFILE.email}`, esc(PROFILE.email))}</li>
      </ul>
      <p class="hint">${esc(TITLE.hint)}</p>
    </div>
  </section>`;

  const about = `
  <section id="about" class="zone" data-biome="forest" data-zone="${esc(ABOUT.zone)}" aria-labelledby="h-about">
    <div class="dialog">
      <p class="world-tag" aria-hidden="true">WORLD ${esc(ABOUT.zone)}</p>
      <h2 id="h-about">${esc(ABOUT.heading)}</h2>
      ${ABOUT.summary.map((p) => `<p>${esc(p)}</p>`).join('\n      ')}
    </div>
    <div class="dialog">
      <h3>Character Stats</h3>
      <dl class="stats">
        ${ABOUT.stats.map((s) => `<div${foe(s.enemy, 'stat')}><dt>${esc(s.label)}</dt><dd>${esc(s.value)}${xpTag(s.enemy)}</dd></div>`).join('\n        ')}
      </dl>
    </div>
    <div class="dialog">
      <h3>Education</h3>
      <p${foe(ABOUT.education.enemy)}><strong>${esc(ABOUT.education.degree)}</strong> · ${esc(ABOUT.education.period)}<br />${esc(ABOUT.education.school)}${xpTag(ABOUT.education.enemy)}</p>
      <h3>Certifications</h3>
      <ul class="px-list">
        ${ABOUT.certifications.map((c) => `<li${foe(c.enemy)}>${esc(c.name)} — ${esc(c.issuer)}${xpTag(c.enemy)}</li>`).join('\n        ')}
      </ul>
    </div>
  </section>`;

  const skills = `
  <section id="skills" class="zone" data-biome="mountain" data-zone="${esc(SKILLS.zone)}" aria-labelledby="h-skills">
    <div class="dialog">
      <p class="world-tag" aria-hidden="true">WORLD ${esc(SKILLS.zone)}</p>
      <h2 id="h-skills">${esc(SKILLS.heading)}</h2>
      <p>${esc(SKILLS.intro)}</p>
    </div>
    ${SKILLS.groups
      .map(
        (g) => `<div${foe(g.enemy, 'dialog skill')}>
      <h3>${esc(g.name)}${xpTag(g.enemy)}</h3>
      <ul class="tags">${g.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
    </div>`,
      )
      .join('\n    ')}
    <div class="dialog">
      <h3>Core Competencies</h3>
      <ul class="tags">${SKILLS.competencies.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
    </div>
  </section>`;

  const experience = `
  <section id="experience" class="zone" data-biome="castle" data-zone="${esc(EXPERIENCE.zone)}" aria-labelledby="h-experience">
    <div class="dialog">
      <p class="world-tag" aria-hidden="true">WORLD ${esc(EXPERIENCE.zone)}</p>
      <h2 id="h-experience">${esc(EXPERIENCE.heading)}</h2>
    </div>
    ${EXPERIENCE.jobs
      .map(
        (j) => `<article class="dialog job">
      <h3>${esc(j.role)}${j.current ? ' <span class="badge">NOW</span>' : ''}</h3>
      <p class="meta">${esc(j.company)} · ${esc(j.location)} · <time>${esc(j.period)}</time></p>
      <ul class="px-list">
        ${j.bullets.map((b) => `<li${foe(b.enemy)}>${esc(b.text)}${xpTag(b.enemy)}</li>`).join('\n        ')}
      </ul>
    </article>`,
      )
      .join('\n    ')}
  </section>`;

  const projects = `
  <section id="projects" class="zone" data-biome="castle" data-zone="${esc(PROJECTS.zone)}" aria-labelledby="h-projects">
    <div class="dialog">
      <p class="world-tag" aria-hidden="true">WORLD ${esc(PROJECTS.zone)}</p>
      <h2 id="h-projects">${esc(PROJECTS.heading)}</h2>
    </div>
    ${PROJECTS.items
      .map(
        (p) => `<article${foe(p.enemy, 'dialog project')}>
      <h3>${esc(p.name)} <span class="meta">· ${esc(p.year)}</span>${xpTag(p.enemy)}</h3>
      ${p.points.map((t) => `<p>${esc(t)}</p>`).join('\n      ')}
      <ul class="tags" aria-label="Tech stack">${p.tech.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    </article>`,
      )
      .join('\n    ')}
  </section>`;

  const contact = `
  <footer id="contact" class="zone zone-boss" data-biome="boss" data-zone="${esc(CONTACT.zone)}" aria-labelledby="h-contact">
    <div${foe(CONTACT.boss.enemy, 'dialog boss-panel')}>
      <p class="world-tag">BOSS: ${esc(CONTACT.boss.name)}</p>
      <div class="boss-hp" aria-hidden="true"><span class="boss-hp-fill"></span></div>
      <h2 id="h-contact">${esc(CONTACT.heading)}</h2>
      <p>${esc(CONTACT.pitch)}</p>
      <p class="victory" aria-hidden="true">${esc(CONTACT.victory)}</p>
      <ul class="cta">
        ${CONTACT.ctas
          .map((c) => `<li>${link(c.href, `${c.primary ? '▶ ' : ''}${esc(c.label)}`, { external: c.external, download: c.download, cls: `px-btn${c.primary ? ' px-btn-primary' : ''}` })}</li>`)
          .join('\n        ')}
      </ul>
      <address>
        ${link(`mailto:${PROFILE.email}`, esc(PROFILE.email))} · ${esc(PROFILE.location)}
      </address>
    </div>
    <p class="credits">${esc(CONTACT.footer)}</p>
  </footer>`;

  return `<main id="main">${title}${about}${skills}${experience}${projects}
  </main>${contact}`;
}
