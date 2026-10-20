// Workshop registry: every taller the platform builds and publishes.
// Pure data (no Node APIs) so build scripts and pages can both import it.
//
// marca  accent mark and colour used on the /talleres/ index
// deck   Reveal deck built by the shared engine in src/ (one single-file HTML)
//          slides  folder of *.html blocks, inlined in name order
//          config  JSON with texts, QR targets, blocks, brand, theme
//          qr      where scripts/build-qr.js writes the generated SVGs
//          js      optional folder of slide controllers (data-ctrl) for this deck
//          css     optional stylesheet loaded after the shared styles
//          public  static files copied next to the deck (media/)
//          out     output folder inside dist/
// web    Vite multi-page root with the workshop's pages (landing, playbook, …)
//          root    folder; every index.html below it becomes a page
//          base    public URL prefix
//          out     output folder inside dist/
//          offline optional pages also built as one self-contained file in <out>/offline/
export const TALLERES = [
  {
    slug: 'x10',
    nombre: 'x10 · Multiplica tus talentos con inteligencia artificial',
    resumen: 'Taller de IA para la Convención de Hombres MCI 2026: entender, desmitificar, discernir, aplicar y crear.',
    fecha: '1 al 3 de octubre de 2026',
    marca: { acento: '×', color: '#E8B53A' },
    enlaces: { landing: '/x10/', presentacion: '/presentacion/', playbook: '/playbook/', test: '/test/' },
    deck: {
      slides: 'src/slides',
      config: 'config.json',
      qr: 'src/assets/qr',
      public: 'public',
      out: 'dist/presentacion',
    },
    web: { root: 'apps', base: '/', out: 'dist' },
  },
  {
    slug: 'vibecoding',
    nombre: 'Vibe Coding · Clase 1',
    resumen: 'De idea a app publicada: la spec de una página, caja cerrada y caja abierta, y la primera versión en una URL con su repositorio.',
    fecha: '20 de octubre de 2026 · Virtual',
    marca: { acento: '›', color: '#3AC7E8' },
    enlaces: {
      landing: '/vibecoding/',
      presentacion: '/vibecoding/presentacion/',
      playbook: '/vibecoding/playbook/',
    },
    deck: {
      slides: 'talleres/vibecoding/presentacion/slides',
      config: 'talleres/vibecoding/presentacion/config.json',
      qr: 'talleres/vibecoding/presentacion/qr',
      js: 'talleres/vibecoding/presentacion/js',
      css: 'talleres/vibecoding/presentacion/deck.css',
      public: 'talleres/vibecoding/presentacion/public',
      out: 'dist/vibecoding/presentacion',
    },
    web: { root: 'talleres/vibecoding/web', base: '/vibecoding/', out: 'dist/vibecoding' },
  },
  {
    slug: 'cerebro',
    nombre: 'Cerebro Jurídico',
    resumen: 'Arquitectura, IA y automatización para servicios jurídicos: cinco archivos que le dicen a cualquier IA quién eres, cómo trabajas, qué nunca hace y cómo se verifica.',
    fecha: '21 de octubre de 2026 · Pontificia Universidad Javeriana, Bogotá',
    marca: { acento: '§', color: '#9D86FF' },
    enlaces: {
      landing: '/cerebro/',
      presentacion: '/cerebro/presentacion/',
      playbook: '/cerebro/playbook/',
    },
    deck: {
      slides: 'talleres/cerebro/presentacion/slides',
      config: 'talleres/cerebro/presentacion/config.json',
      qr: 'talleres/cerebro/presentacion/qr',
      js: 'talleres/cerebro/presentacion/js',
      css: 'talleres/cerebro/presentacion/deck.css',
      public: 'talleres/cerebro/presentacion/public',
      out: 'dist/cerebro/presentacion',
    },
    // The landing also ships as one offline file: plan B if the venue Wi-Fi fails.
    web: { root: 'talleres/cerebro/web', base: '/cerebro/', out: 'dist/cerebro', offline: ['index.html'] },
  },
];

export const tallerBySlug = (slug) => TALLERES.find((t) => t.slug === slug);
