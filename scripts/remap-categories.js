#!/usr/bin/env node
/**
 * remap-categories.js
 *
 * Remaps all product categories to match the Dahl.no hierarchy.
 * Each product gets:
 *   - dahl_main_category   (Level 1: e.g. "Teknisk VVS", "Synlig VVS")
 *   - dahl_sub_category    (Level 2: e.g. "Pressystemer", "Armatur")
 *   - dahl_sub_sub_category (Level 3: e.g. "Kobber", "Blandebatterier")
 *   - category             (Updated to a clean display name based on Dahl hierarchy)
 *
 * Original fields (area_name, area_code, group_name, group_code) are preserved.
 *
 * Usage: node scripts/remap-categories.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'Data');

const PRODUCT_FILES = [
  'products-vvs.json',
  'products-industri.json',
  'products-vann-og-milj-teknikk.json',
  'products-verkt-y.json',
];

// ---------------------------------------------------------------------------
// Complete mapping: group_name -> [dahl_main, dahl_sub, dahl_sub_sub]
// Based on verified lookups on Dahl.no
// ---------------------------------------------------------------------------

const GROUP_TO_DAHL = {
  // ===== VVS =====

  // Sanitærarmatur -> Synlig VVS > Armatur
  'SANITÆRARMATUR ORAS':                        ['Synlig VVS', 'Armatur', 'Blandebatterier'],
  'SANITÆRARMATUR ALTERNA':                     ['Synlig VVS', 'Armatur', 'Blandebatterier'],
  'SANITÆRARMATUR HANS GROHE':                  ['Synlig VVS', 'Armatur', 'Blandebatterier'],
  'SANITÆRARMATUR GUSTAVSBERG':                 ['Synlig VVS', 'Armatur', 'Blandebatterier'],
  'SANITÆRARMATUR FMM':                         ['Synlig VVS', 'Armatur', 'Blandebatterier'],
  'SANITÆRARMATUR FIMA':                        ['Synlig VVS', 'Armatur', 'Blandebatterier'],
  'SANITÆRARMATUR DLINE':                       ['Synlig VVS', 'Armatur', 'Blandebatterier'],
  'SANITÆRARMATUR DIV.':                        ['Synlig VVS', 'Armatur', 'Blandebatterier'],
  'DELER SANITÆRARMATUR':                       ['Synlig VVS', 'Deler', 'Deler armatur'],
  'BD BLISTER':                                 ['Synlig VVS', 'Deler', 'Deler armatur'],

  // Servanter og klosetter -> Synlig VVS
  'SERVANTER OG KLOSETTER PB':                  ['Synlig VVS', 'Vasker & servanter', 'Servanter'],
  'SERVANTER OG TOALETTER ROCA':                ['Synlig VVS', 'Vasker & servanter', 'Servanter'],
  'SERVANTER OG KLOSETTER ALTERNA':             ['Synlig VVS', 'Vasker & servanter', 'Servanter'],
  'SERVANTER OG KLOSETTER GB':                  ['Synlig VVS', 'Vasker & servanter', 'Servanter'],
  'SERVANTER OG KLOSETTER V&B':                 ['Synlig VVS', 'Vasker & servanter', 'Servanter'],
  'SERVANTER OG KLOSETTER DURAVIT':             ['Synlig VVS', 'Vasker & servanter', 'Servanter'],
  'SERVANTER OG KLOSETTER DIV.LEVERANDØRER':    ['Synlig VVS', 'Vasker & servanter', 'Servanter'],
  'KLOSETTSETER PORSELENSLEVERANDØRER':         ['Synlig VVS', 'Deler', 'Deler toalett'],
  'DELER SERVANTER/KLOSETTER':                  ['Synlig VVS', 'Deler', 'Deler toalett'],
  'INNBYGNINGSSISTERNER':                       ['Synlig VVS', 'Sisterner', 'Innbygningssisterner'],

  // Baderom -> Synlig VVS
  'BADE-/VASKEROMSMØBLER ALTERNA':              ['Synlig VVS', 'Baderomsmøbler', 'Møbler og møbelservanter'],
  'BADE-/VASKEROMSMØBLER ROCA':                 ['Synlig VVS', 'Baderomsmøbler', 'Møbler og møbelservanter'],
  'BADE-/VASKEROMSMØBLER DIV.':                 ['Synlig VVS', 'Baderomsmøbler', 'Møbler og møbelservanter'],
  'BADEROMSUTSTYR ALTERNA':                     ['Synlig VVS', 'Baderomstilbehør', 'Baderomsutstyr'],
  'BADEROMSUTSTYR':                             ['Synlig VVS', 'Baderomstilbehør', 'Baderomsutstyr'],
  'FUNKSJONSUTSTYR':                            ['Synlig VVS', 'Baderomstilbehør', 'Funksjonsutstyr'],
  'RUSTFRITT SANITÆRUTSTYR':                    ['Synlig VVS', 'Vaskerom', 'Rustfritt sanitærutstyr'],
  'RUSTFRITT SANITÆRUTSTYR ALTERNA':            ['Synlig VVS', 'Vaskerom', 'Rustfritt sanitærutstyr'],

  // Dusj og badekar -> Synlig VVS
  'DUSJ ALTERNA':                               ['Synlig VVS', 'Dusj', 'Dusjkabinetter'],
  'DUSJ MACRO':                                 ['Synlig VVS', 'Dusj', 'Dusjvegger'],
  'DUSJ PALME/HUPPE':                           ['Synlig VVS', 'Dusj', 'Dusjkabinetter'],
  'DUSJ DELER':                                 ['Synlig VVS', 'Deler', 'Deler dusj'],
  'BADEKAR ALTERNA':                            ['Synlig VVS', 'Badekar', 'For innbygging'],
  'BADEKAR OG TILBEHØR':                        ['Synlig VVS', 'Badekar', 'Badekar og tilbehør'],

  // Hvitevarer -> Synlig VVS
  'MINIKJØKKEN':                                ['Synlig VVS', 'Hvitevarer & elektronikk', 'Minikjøkken'],
  'EL.PRODUKTER/HVITEVARER':                    ['Synlig VVS', 'Hvitevarer & elektronikk', 'Hvitevarer'],
  'SMARTHUS':                                   ['Synlig VVS', 'Hvitevarer & elektronikk', 'Smarthus'],

  // Avløp innomhus -> Teknisk VVS
  'VANNLÅS OG DIVERSE AVLØPSDELER':             ['Teknisk VVS', 'Innomhus avløp', 'Vannlås og avløpsdeler'],
  'AVLØPSRØR / DELER MA':                       ['Teknisk VVS', 'Innomhus avløp', 'Avløpsrør og deler MA'],
  'AVLØPSRØR / DELER PP INNOMHUS':              ['Teknisk VVS', 'Innomhus avløp', 'Avløpsrør og deler plast'],
  'AVLØPSRØR / DELER DIV. PLAST':               ['Teknisk VVS', 'Innomhus avløp', 'Avløpsrør og deler plast'],
  'AVLØPSRØR / DELER DIV. STÅL':                ['Teknisk VVS', 'Innomhus avløp', 'Avløpsrør og deler stål'],
  'SLUK, INSPEKSJONSLUKER OG JORDINGSRØR':      ['Teknisk VVS', 'Innomhus avløp', 'Sluk'],

  // Rør og fittings -> Teknisk VVS
  'MESSINGDELER':                               ['Teknisk VVS', 'Rørdeler kompresjon, push og kapillar', 'Messingdeler'],
  'PRESSFITTINGS KOBBER':                       ['Teknisk VVS', 'Pressystemer', 'Kobber'],
  'PRESSFITTINGS GALVANISERT':                  ['Teknisk VVS', 'Pressystemer', 'Galvanisert'],
  'PRESSFITTINGS SYREFAST':                     ['Teknisk VVS', 'Pressystemer', 'Syrefast'],
  'ADUSERTE RØRDELER SORT OG GALVANISERT':      ['Teknisk VVS', 'Rørdeler gjengede', 'Gjengefittings'],
  'KLEMRINGSDELER OG DIV. KOBLINGER':           ['Teknisk VVS', 'Rørdeler kompresjon, push og kapillar', 'Klemringsdeler'],
  'KOBBERRØR':                                  ['Teknisk VVS', 'Kobberrør', 'Kobberrør'],
  'KAPILLARDELER':                              ['Teknisk VVS', 'Rørdeler kompresjon, push og kapillar', 'Kapillardeler'],

  // Rør-i-rør -> Teknisk VVS
  'RØR-I-RØR/MULTILAYER ROTH':                  ['Teknisk VVS', 'Rør-i-rør-systemer', 'Rør og deler'],
  'RØR-I-RØR/MULTILAYER UPONOR':                ['Teknisk VVS', 'Rør-i-rør-systemer', 'Rør og deler'],
  'RØR-I-RØR/MULTILAYER ALTECH':                ['Teknisk VVS', 'Rør-i-rør-systemer', 'Rør og deler'],
  'RØR-I-RØR/ MULTILAYER ARMATURJONSSON':        ['Teknisk VVS', 'Rør-i-rør-systemer', 'Rør og deler'],
  'RØR-I-RØR/MULTILAYER DIVERSE':               ['Teknisk VVS', 'Rør-i-rør-systemer', 'Rør og deler'],
  'RØR-I-RØR/MULTILAYER LK':                    ['Teknisk VVS', 'Rør-i-rør-systemer', 'Rør og deler'],
  'ALTECH OB':                                  ['Teknisk VVS', 'Rør-i-rør-systemer', 'Rør og deler'],

  // Isolasjon -> Teknisk VVS
  'ISOLASJON AV MINERALULL':                    ['Teknisk VVS', 'Rørisolasjon', 'Mineralull'],
  'ISOLASJON AV CELLEGUMMI':                    ['Teknisk VVS', 'Rørisolasjon', 'Cellegummi'],
  'ISOLASJONSTILBEHØR, BRANNTETTING ETC.':      ['Teknisk VVS', 'Rørisolasjon', 'Isolasjonstilbehør'],

  // Ventiler VVS -> Teknisk VVS
  'STENGEVENTILER,TAPPEKRANER OG MAGNETVENT':   ['Teknisk VVS', 'Ventiler og armaturer VVS', 'Stengeventiler'],
  'STRUPE- OG INNREGULERINGSVENTILER':          ['Teknisk VVS', 'Ventiler og armaturer VVS', 'Innreguleringsventiler'],
  'BLANDE-, SIKKERHETS.-OG TILB.SL.VENTILER':   ['Teknisk VVS', 'Ventiler og armaturer VVS', 'Blandeventiler'],
  'SILER, FILTERE OG REDUKSJONSVENTILER':       ['Teknisk VVS', 'Ventiler og armaturer VVS', 'Siler og filtere'],
  'VANNMÅLERE, LEKKASJESIKRING OG NØDDUSJ':    ['Teknisk VVS', 'Ventiler og armaturer VVS', 'Vannmålere og lekkasjesikring'],
  'SHUNTVENTILER, AUTOMATIKK OG MÅLERE':        ['Teknisk VVS', 'Ventiler og armaturer VVS', 'Shuntventiler og automatikk'],
  'EKSP.KAR/SIKKERHETSVENT,LUFTUTSKILLERE':    ['Teknisk VVS', 'Ventiler og armaturer VVS', 'Sikkerhetsventiler og ekspansjonskar'],
  'OLJETANKER, MÅLERE OG FITTINGS':             ['Teknisk VVS', 'Tanker og oljeprodukter', 'Oljetanker og målere'],

  // Varme -> Varmeløsninger & energi
  'VARMEPUMPER':                                ['Varmeløsninger & energi', 'Varmekilder', 'Varmepumper'],
  'KJELER OG BRENNERE':                         ['Varmeløsninger & energi', 'Varmekilder', 'Kjeler og brennere'],
  'BOLIGBEREDERE':                              ['Varmeløsninger & energi', 'Beredere', 'Boligberedere'],
  'STORBEREDERE OG VILLAVARMERE':               ['Varmeløsninger & energi', 'Beredere', 'Storberedere og villavarmere'],
  'BEREDERTILBEHØR OG DELER':                   ['Varmeløsninger & energi', 'Beredere', 'Beredertilbehør'],
  'GULVVARME, SNØSMELTE OG KULVERTER':          ['Varmeløsninger & energi', 'Varmegivere', 'Gulvvarme'],
  'RADIATORER OG KONVEKTORER':                  ['Varmeløsninger & energi', 'Varmegivere', 'Radiatorer og konvektorer'],
  'RADIATORVENTILER':                           ['Varmeløsninger & energi', 'Varmegivere', 'Radiatorventiler'],
  'VARMEVEKSLERE':                              ['Varmeløsninger & energi', 'Varmegivere', 'Varmevekslere'],

  // Pumper
  'SIRKULASJONSPUMPER OG TILBEHØR':             ['Pumper', 'Sirkulasjonspumper', 'Sirkulasjonspumper og tilbehør'],
  'VANNFORS.-,AVLØP-,HÅNDPUMPER OG TILBEHØR':  ['Pumper', 'Diverse pumper', 'Vannforsyning og avløpspumper'],

  // Brann -> Brannsikkerhet og rillede systemer
  'BRANNSIKKERHET':                             ['Brannsikkerhet', 'Rillede systemer', 'Brannsikkerhetsutstyr'],
  'RILLEKUPLINGER':                             ['Brannsikkerhet', 'Rillede systemer', 'Rillekuplinger'],
  'BRANNSLUKKEMATERIELL':                       ['Brannsikkerhet', 'Brannslukkemateriell', 'Brannposter og slanger'],
  'VANNTÅKE':                                   ['Brannsikkerhet', 'Brannslukkemateriell', 'Vanntåkesystemer'],

  // ===== INDUSTRI =====
  'SVEISTE RØR KARBON INDUSTRI':                ['Industri', 'Karbonstål rør og deler', 'Karbonrør'],
  'SVEISTE TYNNVEGGEDE RØR MED RILLE':          ['Industri', 'Karbonstål rør og deler', 'Karbonrør'],
  'SØMLØSE RØR KARBON INDUSTRI':                ['Industri', 'Karbonstål rør og deler', 'Karbonrør'],
  'SVEISE-/GJ.DELER KARBON INDUSTRI':           ['Industri', 'Karbonstål rør og deler', 'Karbondeler'],
  'HYDRAULIKK RØR OG DELER':                    ['Industri', 'Karbonstål rør og deler', 'Hydraulikk rør og deler'],
  'RUSTFRIE/SYREF. RØR INDUSTRI':               ['Industri', 'Rustfritt/Syrefast rør og deler', 'Rustfrie rør'],
  'RUSTFRIE/SYREF. DELER INDUSTRI':             ['Industri', 'Rustfritt/Syrefast rør og deler', 'Rustfrie/Syrefaste deler'],
  'RØR DUPLEX/STAINLESS STEEL/TITAN':           ['Industri', 'Rustfritt/Syrefast rør og deler', 'Duplex/Titan rør'],
  'DELER DUPLEX/STAINLESS/TITAN':               ['Industri', 'Rustfritt/Syrefast rør og deler', 'Duplex/Titan deler'],
  'SPJELDVENTILER INDUSTRI':                    ['Industri', 'Industriarmaturer', 'Spjeldventiler'],
  'VENTILER INDUSTRI':                          ['Industri', 'Industriarmaturer', 'Ventiler'],
  'FILTER - KUPLINGER INDUSTRI':                ['Industri', 'Industriarmaturer', 'Filtere og kuplinger'],
  'LUFT- PEILERØRSARMATUR INDUSTRI':            ['Industri', 'Industriarmaturer', 'Luft- og peilerørsarmatur'],
  'RØR OG DELER AV PLAST INDUSTRI':             ['Industri', 'PVC-U', 'PVC-U rør og deler'],
  'ALUMESS/CUNI INDUSTRI':                      ['Industri', 'CuNi rør og deler', 'CuNi rør og deler'],
  'KULDEMEDIER/-BÆRERE/OLJER':                  ['Industri', 'Kjøling', 'Kuldemedier og oljer'],
  'DEPOSITUM, PANT UTEN RABATT':                ['Industri', 'Kjøling', 'Depositum'],
  'SERVICEUTSTYR':                              ['Industri', 'Industriarmaturer', 'Serviceutstyr'],
  'KULDEAUTOMATIKK/-VENTILER/KOMPONENTER':      ['Industri', 'Kjøling', 'Kuldeautomatikk'],
  'KJØLERØR OG DELER':                          ['Industri', 'Kjøling', 'Kjølerør og deler'],

  // ===== VANN- OG MILJØTEKNIKK =====

  // PE-rør og deler
  'PE-RØR KVEIL':                               ['VMT', 'Rør og deler', 'PE rør og deler'],
  'PE-RØR RETTE':                               ['VMT', 'Rør og deler', 'PE rør og deler'],
  'EL.SVEISEMUFFER FOR PE RØR/PE-DELER':        ['VMT', 'Rør og deler', 'PE rør og deler'],
  'RØRDELER FOR PE-RØR':                        ['VMT', 'Rør og deler', 'PE rør og deler'],
  'PE-RØR HAVBRUK':                             ['VMT', 'Rør og deler', 'PE rør og deler'],
  'PE-RØRDELER HAVBRUK':                        ['VMT', 'Rør og deler', 'PE rør og deler'],

  // Støpejern
  'STØPEJERNSRØR VMT':                          ['VMT', 'Rør og deler', 'Støpejernsrør og deler'],
  'DELER FOR STØPEJERNSRØR VMT':                ['VMT', 'Rør og deler', 'Støpejernsrør og deler'],

  // PVC
  'GRUNNAVLØPSRØR PLAST VMT':                   ['VMT', 'Rør og deler', 'PVC rør og deler'],
  'DELER GRUNNAVLØPSRØR PLAST VMT':             ['VMT', 'Rør og deler', 'PVC rør og deler'],
  'TRYKKRØR PVC':                               ['VMT', 'Rør og deler', 'PVC rør og deler'],
  'DELER FOR TRYKKRØR PVC':                     ['VMT', 'Rør og deler', 'PVC rør og deler'],

  // Drensrør
  'DRENS-/ANLEGGS-/OVERVANNSRØR':               ['VMT', 'Rør og deler', 'Drensrør og deler'],
  'DELER FOR DRENS-/ANLEGGS-/OVERVANNSRØR':     ['VMT', 'Rør og deler', 'Drensrør og deler'],

  // Kabelvern
  'KABELVERN':                                  ['VMT', 'Rør og deler', 'Kabelvern'],
  'DELER FOR KABELVERN':                        ['VMT', 'Rør og deler', 'Kabelvern'],

  // Diverse rør
  'ISOLERTE- OG HURTIGKOBLINGSRØR OG DELER':    ['VMT', 'Rør og deler', 'Frostsikre rørsystemer'],
  'REP.MUFFER/KUPLINGER/ANBORINGSKLAMMER':      ['VMT', 'Rør og deler', 'Reparasjonsmuffer og koblinger'],
  'DIVERSE VMT':                                ['VMT', 'Rør og deler', 'Diverse'],

  // Armaturer VMT
  'VENTILER VMT/VANNMÅLERE/BAKKEKRANER':        ['VMT', 'Armaturer VMT', 'Ventiler og bakkekraner'],
  'PLASTVENTILER HAVBRUK':                      ['VMT', 'Armaturer VMT', 'Plastventiler'],

  // Kummer og gategods
  'PLASTKUMMER OG FORDRØYNINGSSYSTEMER':        ['VMT', 'Kummer og gategods', 'Kummer'],
  'GATEGODS':                                   ['VMT', 'Kummer og gategods', 'Gategods'],
  'BETONGVARER':                                ['VMT', 'Kummer og gategods', 'Betongvarer'],

  // Bygg og anlegg
  'ISOLASJON':                                  ['VMT', 'Bygg- og anleggsteknikk', 'Isolasjon'],
  'SLAMAVSKILLERE/TANKER/PUMPER':               ['VMT', 'Renseløsninger', 'Slamavskillere og tanker'],
  'SYNLIG GEOTEKNIKK':                          ['VMT', 'Bygg- og anleggsteknikk', 'Geoteknikk'],
  'VOTEC NGS FIBERDUK':                         ['VMT', 'Bygg- og anleggsteknikk', 'Fiberduk'],
  'ØVRIG FIBERDUK':                             ['VMT', 'Bygg- og anleggsteknikk', 'Fiberduk'],
  'GEONETT':                                    ['VMT', 'Bygg- og anleggsteknikk', 'Geonett'],
  'GEOMEMBRAN':                                 ['VMT', 'Bygg- og anleggsteknikk', 'Geomembran'],

  // Samferdsel (currently under VMT area)
  'TRAFIKKSKILT':                               ['Samferdsel', 'Skilt', 'Trafikkskilt'],
  'OPPSETTINGSUTSTYR':                          ['Samferdsel', 'Oppsettingsutstyr', 'Master og stolper'],
  'VARSLINGS- OG SIKRINGSUTSTYR':               ['Samferdsel', 'Arbeidsvarsling', 'Varsling og sikring'],
  'UTEMILJØ':                                   ['Samferdsel', 'Utemiljø', 'Utemiljøprodukter'],
  'VEGSIKRING':                                 ['Samferdsel', 'Vegsikring', 'Autovern og rekkverk'],
  'ELEKTRO SAMFERDSEL':                         ['Samferdsel', 'Elektro', 'LED-skilt og belysning'],
  'DIVERSE TRAFIKKSIKRING':                     ['Samferdsel', 'Vei- og trafikkprodukter', 'Diverse trafikksikring'],

  // ===== VERKTØY =====
  'HÅNDVERKTØY OG TILBEHØR':                    ['Verktøy og Maskiner', 'Håndverktøy', 'Håndverktøy og tilbehør'],
  'RØRVERKTØY':                                 ['Verktøy og Maskiner', 'Rørverktøy', 'Rørverktøy'],
  'ELEKTROVERKTØY':                             ['Verktøy og Maskiner', 'Elektroverktøy', 'Elektroverktøy'],
  'VERKTØY NETTOPRIS':                          ['Verktøy og Maskiner', 'Håndverktøy', 'Diverse verktøy'],
  'ARBEIDSUTSTYR':                              ['Verktøy og Maskiner', 'Stiger, trapper og oppbevaring', 'Arbeidsutstyr'],
  'KJEMI':                                      ['Verktøy og Maskiner', 'Merke- og måleverktøy', 'Kjemikalier'],
  'MONTASJEMATERIELL':                          ['Verktøy og Maskiner', 'Arbeidsbelysning og elektromateriell', 'Montasjemateriell'],
  'SKRUER, BOLTER O.L.':                        ['Verktøy og Maskiner', 'Håndverktøy', 'Skruer, bolter og feste'],

  // Arbeidsklær -> Arbeidsklær & verneutstyr
  'ARBEIDSKLÆR':                                ['Arbeidsklær & verneutstyr', 'Arbeidsklær', 'Arbeidsklær'],
  'ARBEIDSKLÆR OG TILBEHØR':                    ['Arbeidsklær & verneutstyr', 'Arbeidsklær', 'Tilbehør'],
  'PERSONLIG VERNEUTSTYR':                      ['Arbeidsklær & verneutstyr', 'Personlig verneutstyr', 'Verneutstyr'],

  // Røroppheng
  'RØROPPHENG':                                 ['Røroppheng', 'Røroppheng', 'Klammer og oppheng'],

  // Short code groups (fallbacks)
  '9A':                                         ['Verktøy og Maskiner', 'Håndverktøy', 'Diverse'],
  '9E':                                         ['Verktøy og Maskiner', 'Elektroverktøy', 'Diverse'],
  '9I':                                         ['Verktøy og Maskiner', 'Stiger, trapper og oppbevaring', 'Diverse'],
  '9K':                                         ['Arbeidsklær & verneutstyr', 'Arbeidsklær', 'Diverse'],
  '9M':                                         ['Arbeidsklær & verneutstyr', 'Personlig verneutstyr', 'Diverse'],
  'YC':                                         ['Røroppheng', 'Røroppheng', 'Diverse'],
  'YE':                                         ['Verktøy og Maskiner', 'Håndverktøy', 'Diverse'],
};

// ---------------------------------------------------------------------------
// Process products
// ---------------------------------------------------------------------------

function processFile(filename) {
  const filepath = path.join(DATA_DIR, filename);
  console.log('\nProcessing ' + filename + '...');

  const raw = fs.readFileSync(filepath, 'utf8');
  const products = JSON.parse(raw);

  let mapped = 0;
  let unmapped = 0;
  const unmappedGroups = new Set();

  for (const product of products) {
    const gn = product.group_name || '';
    const dahl = GROUP_TO_DAHL[gn];

    if (dahl) {
      product.dahl_main_category = dahl[0];
      product.dahl_sub_category = dahl[1];
      product.dahl_sub_sub_category = dahl[2];
      product.category = dahl[2]; // Use most specific Dahl category as display category
      mapped++;
    } else {
      // Fallback: try to infer from area
      const area = product.area_name || '';
      let main = area;
      if (area === 'VVS') main = 'Teknisk VVS';
      if (area === 'Vann- og miljøteknikk') main = 'VMT';

      product.dahl_main_category = main;
      product.dahl_sub_category = gn ? cleanCategoryName(gn) : 'Diverse';
      product.dahl_sub_sub_category = gn ? cleanCategoryName(gn) : 'Diverse';
      product.category = product.dahl_sub_sub_category;
      unmapped++;
      unmappedGroups.add(gn);
    }
  }

  // Write back
  fs.writeFileSync(filepath, JSON.stringify(products, null, 2), 'utf8');

  console.log('  Total products: ' + products.length);
  console.log('  Mapped to Dahl categories: ' + mapped + ' (' + (mapped / products.length * 100).toFixed(1) + '%)');
  console.log('  Unmapped (fallback): ' + unmapped);
  if (unmappedGroups.size > 0) {
    console.log('  Unmapped groups: ' + [...unmappedGroups].join(', '));
  }

  return products;
}

function cleanCategoryName(name) {
  if (!name) return '';
  return name.split(/\s+/).map((w, i) => {
    const lower = w.toLowerCase();
    if (i > 0 && ['og', 'i', 'for', 'av', 'med', 'til', 'fra', 'div.'].includes(lower)) return lower;
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join(' ');
}

// ---------------------------------------------------------------------------
// Rebuild catalog.json with Dahl categories
// ---------------------------------------------------------------------------

function rebuildCatalog(allResults) {
  const catalog = allResults.map(({ filename, products }) => {
    // Collect unique Dahl main categories + sub categories
    const mainCats = [...new Set(products.map(p => p.dahl_main_category))].filter(Boolean).sort();
    const subCats = [...new Set(products.map(p => p.dahl_sub_category))].filter(Boolean).sort();
    const groups = [...new Set(products.map(p => p.group_name))].filter(Boolean).sort();

    return {
      file: filename,
      area_name: mainCats.length === 1 ? mainCats[0] : mainCats.join(', '),
      count: products.length,
      groups: groups,
      dahl_main_categories: mainCats,
      dahl_sub_categories: subCats,
    };
  });

  const catalogPath = path.join(DATA_DIR, 'catalog.json');
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log('\ncatalog.json updated.');
}

function rebuildSkuIndex(allResults) {
  const skuIndex = {};
  for (const { filename, products } of allResults) {
    for (const p of products) {
      skuIndex[p.sku] = filename;
    }
  }
  const indexPath = path.join(DATA_DIR, 'sku-index.json');
  fs.writeFileSync(indexPath, JSON.stringify(skuIndex), 'utf8');
  console.log('sku-index.json updated with ' + Object.keys(skuIndex).length + ' entries.');
}

// ---------------------------------------------------------------------------
// Summary statistics
// ---------------------------------------------------------------------------

function printSummary(allResults) {
  console.log('\n=== Dahl.no Category Distribution ===\n');

  const mainCats = {};
  const subCats = {};
  let total = 0;

  for (const { products } of allResults) {
    for (const p of products) {
      const main = p.dahl_main_category || 'Ukjent';
      const sub = main + ' > ' + (p.dahl_sub_category || 'Ukjent');
      mainCats[main] = (mainCats[main] || 0) + 1;
      subCats[sub] = (subCats[sub] || 0) + 1;
      total++;
    }
  }

  console.log('Top-level categories:');
  const sortedMain = Object.entries(mainCats).sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sortedMain) {
    console.log('  ' + cat + ': ' + count + ' products (' + (count / total * 100).toFixed(1) + '%)');
  }

  console.log('\nSub-categories:');
  const sortedSub = Object.entries(subCats).sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sortedSub) {
    console.log('  ' + cat + ': ' + count);
  }

  console.log('\nTotal: ' + total + ' products across ' + sortedMain.length + ' main categories and ' + sortedSub.length + ' sub-categories.');
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

console.log('=== Dahl.no Category Remapping ===');
console.log('Data directory: ' + DATA_DIR);

const allResults = [];

for (const filename of PRODUCT_FILES) {
  const products = processFile(filename);
  allResults.push({ filename, products });
}

rebuildCatalog(allResults);
rebuildSkuIndex(allResults);
printSummary(allResults);

console.log('\nDone.');
