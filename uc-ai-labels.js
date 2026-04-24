// @module uc-ai-labels.js
// [UC:smart-labels] Classification sémantique locale + renforcement par corrections utilisateur.
// Dépend de : UCStorage, UCLabels, UCCartManager, UC_KEYS

const UCAutoLabels = (() => {
  const LOG = '[UC:smart-labels]';
  const WEIGHTS_KEY = 'uc_label_weights';

  // ── Stop words ──────────────────────────────────────────────────────────────
  const STOP = new Set([
    'le','la','les','un','une','des','du','de','d','et','ou','avec','pour',
    'sans','en','au','aux','par','sur','sous','dans','hors','vers','chez',
    'noir','noire','blanc','blanche','rouge','bleu','bleue','vert','verte',
    'gris','grise','beige','rose','jaune','violet','violette','orange','marron',
    'grand','grande','petit','petite','long','longue','court','courte','haut','haute',
    'nouveau','nouvelle','neuf','neuve','ancien','ancienne','vieux','vieille',
    'homme','femme','fille','garçon','enfant','adulte','mixte','unisexe',
    'taille','xl','xxl','xxxl','xs','xss','sm','ml',
    'pack','lot','set','kit','bundle','boite','coffret','sachet',
    'edition','version','modele','serie','type','ref','reference',
    'pro','max','ultra','plus','lite','mini','super','turbo','hyper','mega',
    'high','low','mid','standard','basic','classic','essential','select',
    'new','premium','original','official','genuine','authentic',
    'founders','fe','oc','gaming','non','dual','triple','quad',
    'cm','mm','gb','tb','mb','mhz','ghz','kg','gr','ml','hz','ghz','mhz',
    'inch','pouces','watts','volts','amperes',
    'compatible','pour','with','without','avec','sans',
  ]);

  // ── Taxonomie : catégorie → mots déclencheurs ───────────────────────────────
  // id correspond à la clé stockée dans label_defs
  const TAXONOMY = [
    { id:'tech',         name:'Technologie',      color:'#3b82f6', w:['pc','ordinateur','laptop','informatique','électronique','digital','numérique','composant'] },
    { id:'gpu',          name:'GPU',               color:'#6366f1', w:['gpu','rtx','gtx','rx','radeon','geforce','arc','carte graphique','vga','gddr'] },
    { id:'cpu',          name:'CPU',               color:'#7c3aed', w:['cpu','processeur','ryzen','threadripper','xeon','i3','i5','i7','i9','core ultra'] },
    { id:'ram',          name:'RAM',               color:'#4f46e5', w:['ram','ddr4','ddr5','dimm','sodimm','mémoire vive','cl','latence'] },
    { id:'stockage',     name:'Stockage',          color:'#2563eb', w:['ssd','hdd','nvme','disque dur','disque ssd','flash','nand'] },
    { id:'ecran',        name:'Écran',             color:'#0ea5e9', w:['moniteur','écran','monitor','oled','ips','va','qled','amoled','144hz','240hz','4k','1440p','165hz','360hz','qd-oled'] },
    { id:'reseau',       name:'Réseau',            color:'#0284c7', w:['routeur','wifi','ethernet','nas','mesh','switch réseau','rj45','fibre','modem'] },
    { id:'clavier',      name:'Clavier',           color:'#06b6d4', w:['clavier','keyboard','mécanique','switches','keycap','tkl','60%','75%'] },
    { id:'souris',       name:'Souris',            color:'#0891b2', w:['souris','mouse','trackball','dpi','polling'] },
    { id:'gaming',       name:'Gaming',            color:'#9333ea', w:['gaming','gamer','esport','playstation','xbox','nintendo','ps5','ps4','jeu video','steam','rgb'] },
    { id:'manette',      name:'Manette',           color:'#7e22ce', w:['manette','controller','joystick','arcade','dualsense','dualshock'] },
    { id:'audio',        name:'Audio',             color:'#06b6d4', w:['casque','écouteur','enceinte','speaker','microphone','micro','dac','ampli','hifi','audiophile','in-ear','iem','planar','dynamique'] },
    { id:'photo',        name:'Photo/Vidéo',       color:'#f59e0b', w:['appareil photo','objectif','reflex','mirrorless','gopro','drone','trépied','stabilisateur','optique','focale','ouverture'] },
    { id:'vetements',    name:'Vêtements',         color:'#ec4899', w:['robe','pantalon','jean','veste','manteau','pull','t-shirt','chemise','short','jupe','legging','hoodie','sweat','parka','blouson','tshirt','haut','maillot','combinaison','combishort','débardeur'] },
    { id:'chaussures',   name:'Chaussures',        color:'#db2777', w:['chaussure','sneaker','basket','botte','sandale','talon','mocassin','escarpin','tennis','running shoe','trail shoe'] },
    { id:'accessoires',  name:'Accessoires',       color:'#be185d', w:['sac','ceinture','chapeau','écharpe','gant','lunette','bijou','bracelet','collier','bague','montre','portefeuille','bonnet'] },
    { id:'goth',         name:'Gothique',          color:'#3730a3', w:['gothique','goth','dark','alternatif','punk','metal','emo','victorien','occult','grunge','darkwave','witchy','occultiste','wicca'] },
    { id:'streetwear',   name:'Streetwear',        color:'#7c3aed', w:['streetwear','urban','skate','hypebeast','oversize','baggy','cargo','boxy'] },
    { id:'vintage_style',name:'Vintage',           color:'#92400e', w:['vintage','rétro','retro','80s','90s','70s','années 80','années 90','pin-up','rockabilly'] },
    { id:'luxe',         name:'Luxe',              color:'#d97706', w:['luxe','luxury','prestige','haut de gamme','collector','édition limitée','couture','haute couture'] },
    { id:'sport',        name:'Sport',             color:'#f97316', w:['vélo','raquette','balle','ballon','musculation','haltère','tapis de course','yoga','natation','ski','surf','trail','football','tennis','basket','rugby','cyclisme','triathlon'] },
    { id:'fitness',      name:'Fitness',           color:'#ea580c', w:['fitness','gym','crossfit','protéine','whey','shaker','élastique','kettlebell','corde à sauter'] },
    { id:'electromenager',name:'Électroménager',   color:'#10b981', w:['aspirateur','lave-linge','réfrigérateur','frigo','four','micro-onde','cafetière','robot','mixeur','lave-vaisselle','sèche-linge','hotte'] },
    { id:'deco',         name:'Déco',              color:'#059669', w:['lampe','luminaire','tableau','coussin','rideau','vase','miroir','étagère','canapé','fauteuil','bibliothèque','tapis'] },
    { id:'jardin',       name:'Jardin',            color:'#16a34a', w:['tondeuse','arrosoir','pot','plante','terreau','jardinage','serre','compost','débroussailleuse'] },
    { id:'livre',        name:'Livres',            color:'#84cc16', w:['livre','roman','manga','bd','bande dessinée','comic','encyclopédie','dictionnaire','hors-série'] },
    { id:'beaute',       name:'Beauté',            color:'#e879f9', w:['parfum','crème','sérum','mascara','rouge à lèvres','fond de teint','shampoing','soin','gloss','blush','correcteur'] },
    { id:'sante',        name:'Santé',             color:'#f472b6', w:['médicament','complément','vitamine','omega','probiotique','thermomètre','tensiomètre','glucomètre'] },
  ];

  // Index rapide token → category IDs
  const TOKEN_INDEX = (() => {
    const idx = {};
    for (const cat of TAXONOMY) {
      for (const w of cat.w) {
        if (!idx[w]) idx[w] = [];
        idx[w].push(cat.id);
      }
    }
    return idx;
  })();

  // ── Marques et alias ─────────────────────────────────────────────────────────
  // Chaque entrée : [token dans le texte] → { brand: nom affiché, cats: [ids] }
  const BRAND_MAP = [
    { match:'nvidia',          brand:'NVIDIA',        cats:['tech','gpu'] },
    { match:'geforce',         brand:'NVIDIA',        cats:['tech','gpu'] },
    { match:'rtx',             brand:'NVIDIA',        cats:['tech','gpu'] },
    { match:'gtx',             brand:'NVIDIA',        cats:['tech','gpu'] },
    { match:'amd',             brand:'AMD',           cats:['tech','cpu','gpu'] },
    { match:'radeon',          brand:'AMD',           cats:['tech','gpu'] },
    { match:'ryzen',           brand:'AMD',           cats:['tech','cpu'] },
    { match:'intel',           brand:'Intel',         cats:['tech','cpu'] },
    { match:'core i',          brand:'Intel',         cats:['tech','cpu'] },
    { match:'xeon',            brand:'Intel',         cats:['tech','cpu'] },
    { match:'apple',           brand:'Apple',         cats:['tech'] },
    { match:'iphone',          brand:'Apple',         cats:['tech'] },
    { match:'macbook',         brand:'Apple',         cats:['tech'] },
    { match:'samsung',         brand:'Samsung',       cats:['tech'] },
    { match:'lg',              brand:'LG',            cats:['tech','ecran'] },
    { match:'sony',            brand:'Sony',          cats:['tech','audio','gaming'] },
    { match:'playstation',     brand:'Sony',          cats:['gaming'] },
    { match:'microsoft',       brand:'Microsoft',     cats:['tech','gaming'] },
    { match:'logitech',        brand:'Logitech',      cats:['tech','souris','clavier'] },
    { match:'corsair',         brand:'Corsair',       cats:['tech','gaming'] },
    { match:'asus',            brand:'ASUS',          cats:['tech'] },
    { match:'msi',             brand:'MSI',           cats:['tech','gaming'] },
    { match:'gigabyte',        brand:'Gigabyte',      cats:['tech'] },
    { match:'razer',           brand:'Razer',         cats:['gaming','tech'] },
    { match:'steelseries',     brand:'SteelSeries',   cats:['gaming'] },
    { match:'hyperx',          brand:'HyperX',        cats:['gaming','audio'] },
    { match:'bose',            brand:'Bose',          cats:['audio'] },
    { match:'sennheiser',      brand:'Sennheiser',    cats:['audio'] },
    { match:'audio-technica',  brand:'Audio-Technica',cats:['audio'] },
    { match:'beyerdynamic',    brand:'Beyerdynamic',  cats:['audio'] },
    { match:'jbl',             brand:'JBL',           cats:['audio'] },
    { match:'marshall',        brand:'Marshall',      cats:['audio'] },
    { match:'jabra',           brand:'Jabra',         cats:['audio'] },
    { match:'nike',            brand:'Nike',          cats:['vetements','chaussures','sport'] },
    { match:'adidas',          brand:'Adidas',        cats:['vetements','chaussures','sport'] },
    { match:'puma',            brand:'Puma',          cats:['vetements','chaussures','sport'] },
    { match:'new balance',     brand:'New Balance',   cats:['chaussures','sport'] },
    { match:'vans',            brand:'Vans',          cats:['chaussures','streetwear'] },
    { match:'converse',        brand:'Converse',      cats:['chaussures'] },
    { match:'supreme',         brand:'Supreme',       cats:['streetwear'] },
    { match:'levis',           brand:'Levi\'s',       cats:['vetements'] },
    { match:'canon',           brand:'Canon',         cats:['photo'] },
    { match:'nikon',           brand:'Nikon',         cats:['photo'] },
    { match:'fujifilm',        brand:'Fujifilm',      cats:['photo'] },
    { match:'gopro',           brand:'GoPro',         cats:['photo'] },
    { match:'dji',             brand:'DJI',           cats:['photo'] },
    { match:'dyson',           brand:'Dyson',         cats:['electromenager'] },
    { match:'nespresso',       brand:'Nespresso',     cats:['electromenager'] },
  ];

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const _tokenize = (text) =>
    text.toLowerCase()
        .replace(/[''`«»"]/g, '')
        .split(/[\s\-\/,;:.!?()[\]{}|+]+/)
        .filter(t => t.length > 1 && !STOP.has(t) && !/^\d+$/.test(t));

  const _colorForToken = (tok) => {
    const p = ['#89b4fa','#a6e3a1','#f9e2af','#f38ba8','#cba6f7','#89dceb','#fab387','#a6adc8','#94e2d5','#eba0ac'];
    let h = 0;
    for (const c of tok) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
    return p[Math.abs(h) % p.length];
  };

  const _domainBoosts = (domain) => {
    const d = (domain ?? '').toLowerCase();
    const b = {};
    if (/ldlc|cdiscount|fnac|darty|boulanger|materiel\.net|top-achat/.test(d)) b.tech = 1;
    if (/zalando|asos|shein|kiabi|zara|hm\.com|veepee|vente-privee/.test(d)) { b.vetements = 2; b.chaussures = 1; }
    if (/decathlon/.test(d)) { b.sport = 3; b.fitness = 1; }
    if (/sephora|nocibe|marionnaud/.test(d)) b.beaute = 3;
    if (/fnac|cultura/.test(d)) { b.livre = 2; b.audio = 1; }
    if (/leroy|castorama|bricoman|mr-bricolage/.test(d)) { b.deco = 2; b.jardin = 1; }
    if (/amazon/.test(d)) { /* amazon → neutre, pas de boost */ }
    return b;
  };

  // Garantit que les labels de taxonomie existent dans le storage avec leurs IDs fixes
  const _ensureTaxonomyInStorage = async () => {
    const defs = (await UCStorage.get(UC_KEYS.LABEL_DEFS)) ?? {};
    let changed = false;
    for (const cat of TAXONOMY) {
      if (!defs[cat.id]) {
        defs[cat.id] = { name: cat.name, color: cat.color, system: true, createdAt: Date.now() };
        changed = true;
      }
    }
    if (changed) await UCStorage.set(UC_KEYS.LABEL_DEFS, defs);
  };

  const _getLearnedWeights = async () => (await UCStorage.get(WEIGHTS_KEY)) ?? {};
  const _saveLearnedWeights = async (w) => UCStorage.set(WEIGHTS_KEY, w);

  // ── Scoring ──────────────────────────────────────────────────────────────────
  const _scoreItem = async (item, domain) => {
    const text = (item.name ?? '').toLowerCase();
    const tokens = _tokenize(text);
    const scores = {};

    // 1. Détection de marques
    const foundBrands = new Set();
    for (const entry of BRAND_MAP) {
      if (text.includes(entry.match)) {
        foundBrands.add(entry.brand);
        for (const cid of entry.cats) scores[cid] = (scores[cid] ?? 0) + 3;
      }
    }

    // 2. Matching taxonomy (recherche sur le texte complet pour les bigrammes)
    for (const [trigger, catIds] of Object.entries(TOKEN_INDEX)) {
      if (text.includes(trigger)) {
        for (const cid of catIds) scores[cid] = (scores[cid] ?? 0) + 2;
      }
    }

    // 3. Boost domaine
    for (const [cid, boost] of Object.entries(_domainBoosts(domain))) {
      scores[cid] = (scores[cid] ?? 0) + boost;
    }

    // 4. Renforcement appris
    const learned = await _getLearnedWeights();
    for (const tok of tokens) {
      if (learned[tok]) {
        for (const [lid, w] of Object.entries(learned[tok])) {
          scores[lid] = (scores[lid] ?? 0) + w;
        }
      }
    }

    // 5. Catégories retenues (score ≥ 2)
    const categoryIds = TAXONOMY.filter(c => (scores[c.id] ?? 0) >= 2).map(c => c.id);

    // 6. Tokens dynamiques : mots significatifs non déjà capturés comme catégorie
    const taxonomyWords = new Set(TAXONOMY.flatMap(c => c.w));
    const stopAndTaxo = new Set([...STOP, ...taxonomyWords]);
    const dynamicTokens = [
      ...[...foundBrands],                                               // marques détectées
      ...tokens.filter(t => !stopAndTaxo.has(t) && t.length > 2),       // tokens résiduels significatifs
    ].slice(0, 5);                                                        // cap à 5 labels dynamiques

    return { categoryIds, dynamicTokens };
  };

  // Résout les labels finaux (catégories fixes + tokens dynamiques créés à la volée)
  const _resolveLabels = async (categoryIds, dynamicTokens) => {
    await _ensureTaxonomyInStorage();
    const defs = await UCLabels.getAllDefs();
    const result = new Set(categoryIds);

    for (const tok of dynamicTokens) {
      const found = Object.entries(defs).find(([, d]) => d.name.toLowerCase() === tok.toLowerCase());
      if (found) {
        result.add(found[0]);
      } else {
        const newId = await UCLabels.createLabel(tok, _colorForToken(tok));
        if (newId) {
          result.add(newId);
          defs[newId] = { name: tok, color: _colorForToken(tok) };
        }
      }
    }

    return [...result];
  };

  // ── API publique ─────────────────────────────────────────────────────────────

  const labelItem = async (domain, item) => {
    if (item.aiLabeled) return false;
    const { categoryIds, dynamicTokens } = await _scoreItem(item, domain);
    if (!categoryIds.length && !dynamicTokens.length) return false;

    const newIds = await _resolveLabels(categoryIds, dynamicTokens);
    const merged = [...new Set([...(item.labels ?? []), ...newIds])];
    await UCCartManager.updateItemLabels(domain, item.id, merged, true);
    console.log(LOG, `"${item.name}" → cats:[${categoryIds}] + dyn:[${dynamicTokens}]`);
    return true;
  };

  const labelDomain = async (domain) => {
    const carts = await UCCartManager.getAllCarts();
    const items = (carts[domain]?.items ?? []).filter(i => !i.aiLabeled);
    let count = 0;
    for (const item of items) {
      if (await labelItem(domain, item)) count++;
    }
    return count;
  };

  const labelAll = async (onProgress) => {
    const carts = await UCCartManager.getAllCarts();
    const pending = [];
    for (const [domain, cart] of Object.entries(carts)) {
      for (const item of cart.items ?? []) {
        if (!item.aiLabeled) pending.push({ domain, item });
      }
    }
    let done = 0;
    for (const { domain, item } of pending) {
      if (await labelItem(domain, item)) done++;
      onProgress?.(done, pending.length);
    }
    return done;
  };

  // Renforcement : appelé quand l'utilisateur corrige manuellement les labels.
  // addedIds / removedIds = IDs de labels ajoutés / retirés.
  const reinforce = async (item, addedIds, removedIds) => {
    const tokens = _tokenize((item.name ?? '').toLowerCase());
    if (!tokens.length) return;
    const w = await _getLearnedWeights();
    for (const tok of tokens) {
      w[tok] = w[tok] ?? {};
      for (const id of addedIds)   w[tok][id] = (w[tok][id] ?? 0) + 1;
      for (const id of removedIds) w[tok][id] = (w[tok][id] ?? 0) - 1;
    }
    await _saveLearnedWeights(w);
    console.log(LOG, `Renforcement pour "${item.name}" : +[${addedIds}] -[${removedIds}]`);
  };

  return { labelItem, labelDomain, labelAll, reinforce };
})();
