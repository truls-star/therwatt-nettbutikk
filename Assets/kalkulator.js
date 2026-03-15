/**
 * Therwatt Kalkulator – Hovedlogikk
 * Wizard-flyt, beregninger og resultatgenerering.
 */
(function() {
  'use strict';

  var CFG = window.KALKULATOR_CONFIG;
  var state = {
    tjenester: [],      // 'energi', 'gulvvarme', or 'begge'
    showEnergi: false,
    showGulvvarme: false,
    rom: [],
    romIdCounter: 0
  };

  // ============================================================
  // Initialization
  // ============================================================
  function init() {
    populateSelects();
    bindStepNavigation();
    bindEnergiToggle();
    bindGulvvarmeToggle();
    bindContactForm();
    bindResult();
  }

  // ============================================================
  // Populate select fields from config
  // ============================================================
  function populateSelects() {
    var byggeaarSel = document.getElementById('byggeaar');
    CFG.byggeaar.forEach(function(b) {
      byggeaarSel.appendChild(new Option(b.label, b.value));
    });

    var boligtypeSel = document.getElementById('boligtype');
    CFG.boligtyper.forEach(function(bt) {
      boligtypeSel.appendChild(new Option(bt.label, bt.value));
    });

    var etterisoleringCmSel = document.getElementById('etterisoleringCm');
    CFG.etterisoleringCm.forEach(function(cm) {
      etterisoleringCmSel.appendChild(new Option(cm + ' cm', cm));
    });
  }

  // ============================================================
  // Step Navigation
  // ============================================================
  function bindStepNavigation() {
    var checkboxes = document.querySelectorAll('input[name="tjeneste"]');
    var step1Next = document.getElementById('step1Next');

    // Step 1 checkboxes – mutual exclusion for "begge"
    checkboxes.forEach(function(cb) {
      cb.addEventListener('change', function() {
        if (this.value === 'begge' && this.checked) {
          checkboxes.forEach(function(c) { if (c.value !== 'begge') c.checked = false; });
        } else if (this.value !== 'begge' && this.checked) {
          var begge = document.querySelector('input[value="begge"]');
          if (begge) begge.checked = false;
        }
        updateTjenester();
        step1Next.disabled = state.tjenester.length === 0;
      });
    });

    step1Next.addEventListener('click', function() {
      if (state.tjenester.length === 0) return;
      showStep(2);
    });

    document.getElementById('step2Back').addEventListener('click', function() { showStep(1); });
    document.getElementById('step2Next').addEventListener('click', function() {
      if (validateStep2()) showStep(3);
    });
    document.getElementById('step3Back').addEventListener('click', function() { showStep(2); });
    document.getElementById('step3Next').addEventListener('click', function() {
      if (validateStep3()) generateResult();
    });
  }

  function updateTjenester() {
    var checked = document.querySelectorAll('input[name="tjeneste"]:checked');
    state.tjenester = [];
    checked.forEach(function(cb) { state.tjenester.push(cb.value); });

    state.showEnergi = state.tjenester.indexOf('energi') !== -1 || state.tjenester.indexOf('begge') !== -1;
    state.showGulvvarme = state.tjenester.indexOf('gulvvarme') !== -1 || state.tjenester.indexOf('begge') !== -1;

    document.getElementById('energiSection').style.display = state.showEnergi ? '' : 'none';
    document.getElementById('gulvvarmeSection').style.display = state.showGulvvarme ? '' : 'none';
  }

  function showStep(n) {
    document.querySelectorAll('.calc-panel').forEach(function(p) { p.classList.remove('active'); });
    document.getElementById('step' + n).classList.add('active');

    document.querySelectorAll('.calc-step').forEach(function(s) {
      var stepN = parseInt(s.getAttribute('data-step'));
      s.classList.remove('active', 'done');
      if (stepN < n) s.classList.add('done');
      else if (stepN === n) s.classList.add('active');
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ============================================================
  // Energi section toggle
  // ============================================================
  function bindEnergiToggle() {
    var radios = document.querySelectorAll('input[name="etterisolert"]');
    radios.forEach(function(r) {
      r.addEventListener('change', function() {
        document.getElementById('etterisoleringGruppe').style.display =
          this.value === 'ja' ? '' : 'none';
      });
    });
  }

  // ============================================================
  // Gulvvarme section toggles
  // ============================================================
  function bindGulvvarmeToggle() {
    var metodeRadios = document.querySelectorAll('input[name="gvMetode"]');
    metodeRadios.forEach(function(r) {
      r.addEventListener('change', function() {
        var isTotal = this.value === 'total';
        document.getElementById('gvTotal').style.display = isTotal ? '' : 'none';
        document.getElementById('gvRomForRom').style.display = isTotal ? 'none' : '';
        if (!isTotal && state.rom.length === 0) addRom();
      });
    });

    // Total area construction type
    var konstrSel = document.getElementById('gvTotalKonstruksjon');
    konstrSel.addEventListener('change', function() {
      updateUndertypeSelect('gvTotalUndertypeGruppe', 'gvTotalUndertype', this.value);
    });

    // Rom for rom
    document.getElementById('leggTilRom').addEventListener('click', function() { addRom(); });
  }

  function updateUndertypeSelect(gruppeId, selectId, konstruksjon) {
    var gruppe = document.getElementById(gruppeId);
    var sel = document.getElementById(selectId);

    if (!konstruksjon || !CFG.gulvvarme.konstruksjon[konstruksjon]) {
      gruppe.style.display = 'none';
      return;
    }

    gruppe.style.display = '';
    sel.innerHTML = '';
    var undertyper = CFG.gulvvarme.konstruksjon[konstruksjon].undertyper;
    for (var key in undertyper) {
      sel.appendChild(new Option(undertyper[key].label, key));
    }
  }

  function addRom() {
    state.romIdCounter++;
    var id = state.romIdCounter;
    var rom = { id: id };
    state.rom.push(rom);
    renderRomListe();
  }

  function removeRom(id) {
    state.rom = state.rom.filter(function(r) { return r.id !== id; });
    renderRomListe();
  }

  function renderRomListe() {
    var container = document.getElementById('romListe');
    container.innerHTML = '';

    state.rom.forEach(function(rom, idx) {
      var div = document.createElement('div');
      div.className = 'rom-entry';
      div.setAttribute('data-rom-id', rom.id);

      var romtyperOptions = '<option value="">Velg romtype…</option>';
      CFG.gulvvarme.romtyper.forEach(function(rt) {
        romtyperOptions += '<option value="' + rt.value + '">' + rt.label + '</option>';
      });

      div.innerHTML =
        '<div class="rom-entry-header">' +
          '<h4>Rom ' + (idx + 1) + '</h4>' +
          (state.rom.length > 1 ? '<button class="rom-remove" data-remove="' + rom.id + '" type="button">&times;</button>' : '') +
        '</div>' +
        '<div class="rom-fields">' +
          '<div class="form-group"><label>Romtype</label><select class="input rom-type">' + romtyperOptions + '</select></div>' +
          '<div class="form-group"><label>Konstruksjon</label><select class="input rom-konstruksjon"><option value="">Velg…</option><option value="stoop">Støp</option><option value="treverk">Treverk</option></select></div>' +
          '<div class="form-group"><label>Antall m²</label><input class="input rom-kvm" type="number" min="1" max="200" placeholder="m²"></div>' +
        '</div>' +
        '<div class="rom-undertype-gruppe" style="display:none">' +
          '<div class="form-group"><label>Oppbygning</label><select class="input rom-undertype"></select></div>' +
        '</div>';

      container.appendChild(div);

      // Bind construction change
      var konstrSel = div.querySelector('.rom-konstruksjon');
      var undertypeGruppe = div.querySelector('.rom-undertype-gruppe');
      var undertypeSel = div.querySelector('.rom-undertype');

      konstrSel.addEventListener('change', function() {
        var konstr = this.value;
        if (!konstr || !CFG.gulvvarme.konstruksjon[konstr]) {
          undertypeGruppe.style.display = 'none';
          return;
        }
        undertypeGruppe.style.display = '';
        undertypeSel.innerHTML = '';
        var undertyper = CFG.gulvvarme.konstruksjon[konstr].undertyper;
        for (var key in undertyper) {
          undertypeSel.appendChild(new Option(undertyper[key].label, key));
        }
      });

      // Bind remove
      var removeBtn = div.querySelector('.rom-remove');
      if (removeBtn) {
        removeBtn.addEventListener('click', function() {
          removeRom(parseInt(this.getAttribute('data-remove')));
        });
      }
    });
  }

  // ============================================================
  // Contact form
  // ============================================================
  function bindContactForm() {
    var samtykke = document.getElementById('samtykke');
    var nextBtn = document.getElementById('step3Next');
    var kunEpost = document.getElementById('kunEpost');
    var fullFelter = document.getElementById('fullKontaktFelter');
    var kunFelter = document.getElementById('kunEpostFelter');
    var samtykkeTekst = document.getElementById('samtykkeTekst');
    var step3Beskrivelse = document.getElementById('step3Beskrivelse');
    var fullRequiredFields = fullFelter ? fullFelter.querySelectorAll('[required]') : [];

    samtykke.addEventListener('change', function() {
      nextBtn.disabled = !this.checked;
    });

    kunEpost.addEventListener('change', function() {
      var checked = this.checked;
      if (checked) {
        fullFelter.classList.add('hidden');
        kunFelter.classList.remove('hidden');
        kunFelter.style.display = '';
        fullRequiredFields.forEach(function(f) { f.removeAttribute('required'); });
        var epostKun = document.getElementById('kontaktEpostKun');
        if (epostKun) epostKun.setAttribute('required', '');
        samtykkeTekst.textContent = 'Jeg samtykker til at Therwatt lagrer min e-postadresse og sender meg beregningsresultatet. Opplysningene deles ikke med tredjepart.';
        if (step3Beskrivelse) step3Beskrivelse.textContent = 'Oppgi e-postadressen din, så sender vi beregningen dit.';
      } else {
        fullFelter.classList.remove('hidden');
        kunFelter.classList.add('hidden');
        fullRequiredFields.forEach(function(f) { f.setAttribute('required', ''); });
        var epostKun = document.getElementById('kontaktEpostKun');
        if (epostKun) epostKun.removeAttribute('required');
        samtykkeTekst.textContent = 'Jeg samtykker til at Therwatt lagrer mine opplysninger og kan kontakte meg med resultat og eventuelt tilbud. Opplysningene deles ikke med tredjepart.';
        if (step3Beskrivelse) step3Beskrivelse.textContent = 'Vi trenger noen opplysninger for å sende deg resultatet og eventuelt kontakte deg med et tilbud.';
      }
    });
  }

  // ============================================================
  // Validation
  // ============================================================
  function validateStep2() {
    clearErrors();
    var valid = true;

    if (state.showEnergi) {
      if (!document.getElementById('byggeaar').value) { markError('byggeaar'); valid = false; }
      if (!document.getElementById('boligtype').value) { markError('boligtype'); valid = false; }
      var areal = document.getElementById('areal');
      if (!areal.value || parseFloat(areal.value) <= 0) { markError('areal'); valid = false; }
      var etterisolertJa = document.querySelector('input[name="etterisolert"][value="ja"]').checked;
      if (etterisolertJa && !document.getElementById('etterisoleringCm').value) {
        markError('etterisoleringCm'); valid = false;
      }
    }

    if (state.showGulvvarme) {
      var metode = document.querySelector('input[name="gvMetode"]:checked').value;
      if (metode === 'total') {
        if (!document.getElementById('gvTotalKvm').value || parseFloat(document.getElementById('gvTotalKvm').value) <= 0) {
          markError('gvTotalKvm'); valid = false;
        }
        if (!document.getElementById('gvTotalKonstruksjon').value) {
          markError('gvTotalKonstruksjon'); valid = false;
        }
      } else {
        var romEntries = document.querySelectorAll('.rom-entry');
        if (romEntries.length === 0) { valid = false; }
        romEntries.forEach(function(entry) {
          var kvm = entry.querySelector('.rom-kvm');
          var type = entry.querySelector('.rom-type');
          var konstr = entry.querySelector('.rom-konstruksjon');
          if (!kvm.value || parseFloat(kvm.value) <= 0) { kvm.classList.add('form-error'); valid = false; }
          if (!type.value) { type.classList.add('form-error'); valid = false; }
          if (!konstr.value) { konstr.classList.add('form-error'); valid = false; }
        });
      }
    }

    return valid;
  }

  function validateStep3() {
    clearErrors();
    var valid = true;
    var kunEpost = document.getElementById('kunEpost').checked;

    if (kunEpost) {
      var epostKun = document.getElementById('kontaktEpostKun');
      if (!epostKun.value.trim()) { epostKun.classList.add('form-error'); valid = false; }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(epostKun.value)) { epostKun.classList.add('form-error'); valid = false; }
    } else {
      var fields = ['kontaktNavn', 'kontaktTelefon', 'kontaktEpost'];
      fields.forEach(function(id) {
        var el = document.getElementById(id);
        if (!el.value.trim()) { markError(id); valid = false; }
      });
      var epost = document.getElementById('kontaktEpost');
      if (epost.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(epost.value)) {
        markError('kontaktEpost'); valid = false;
      }
    }

    if (!document.getElementById('samtykke').checked) { valid = false; }
    return valid;
  }

  function markError(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('form-error');
  }

  function clearErrors() {
    document.querySelectorAll('.form-error').forEach(function(el) {
      el.classList.remove('form-error');
    });
  }

  // ============================================================
  // Calculations
  // ============================================================
  function beregnEnergi() {
    var byggeaarVal = document.getElementById('byggeaar').value;
    var boligtypeVal = document.getElementById('boligtype').value;
    var arealVal = parseFloat(document.getElementById('areal').value);
    var etterisolertJa = document.querySelector('input[name="etterisolert"][value="ja"]').checked;
    var etterisoleringCm = etterisolertJa ? parseInt(document.getElementById('etterisoleringCm').value) || 0 : 0;

    // Find byggeår config
    var byggeaarCfg = CFG.byggeaar.find(function(b) { return b.value === byggeaarVal; });
    var boligtypeCfg = CFG.boligtyper.find(function(b) { return b.value === boligtypeVal; });

    if (!byggeaarCfg || !boligtypeCfg) return null;

    // Etterisolering: move up categories
    var steg = Math.floor(etterisoleringCm / 5) * CFG.etterisoleringStegPer5cm;
    var effektivIndex = Math.min(byggeaarCfg.index + steg, CFG.byggeaar.length - 1);
    var effektivByggeaar = CFG.byggeaar[effektivIndex];

    var wattPerKvm = effektivByggeaar.watt;
    var effektbehovWatt = arealVal * wattPerKvm * boligtypeCfg.faktor;
    var effektbehovKw = effektbehovWatt / 1000;

    var bergvarmeKw = effektbehovKw * CFG.varmepumpe.bergvarme.dimensjoneringsFaktor;
    var luftVannKw = effektbehovKw * CFG.varmepumpe.luftVann.dimensjoneringsFaktor;

    // Energibesparelse
    var aarligVarmebehovKwh = effektbehovKw * CFG.driftstimerPerAar;

    var bergBesparelsesgrad = 1 - (1 / CFG.varmepumpe.bergvarme.aarsVarmefaktor);
    var luftBesparelsesgrad = 1 - (1 / CFG.varmepumpe.luftVann.aarsVarmefaktor);

    var bergSpartKwh = aarligVarmebehovKwh * bergBesparelsesgrad;
    var luftSpartKwh = aarligVarmebehovKwh * luftBesparelsesgrad;

    var bergSpartKr = bergSpartKwh * CFG.stromPrisKrPerKwh;
    var luftSpartKr = luftSpartKwh * CFG.stromPrisKrPerKwh;

    return {
      byggeaarLabel: byggeaarCfg.label,
      effektivByggeaarLabel: effektivByggeaar.label,
      boligtypeLabel: boligtypeCfg.label,
      areal: arealVal,
      wattPerKvm: wattPerKvm,
      etterisolert: etterisolertJa,
      etterisoleringCm: etterisoleringCm,
      effektbehovKw: effektbehovKw,
      bergvarmeKw: bergvarmeKw,
      luftVannKw: luftVannKw,
      aarligVarmebehovKwh: aarligVarmebehovKwh,
      bergSpartKwh: bergSpartKwh,
      luftSpartKwh: luftSpartKwh,
      bergSpartKr: bergSpartKr,
      luftSpartKr: luftSpartKr,
      bergAarsVarmefaktor: CFG.varmepumpe.bergvarme.aarsVarmefaktor,
      luftAarsVarmefaktor: CFG.varmepumpe.luftVann.aarsVarmefaktor
    };
  }

  function beregnGulvvarme() {
    var metode = document.querySelector('input[name="gvMetode"]:checked').value;
    var romData = [];

    if (metode === 'total') {
      var kvm = parseFloat(document.getElementById('gvTotalKvm').value);
      var konstr = document.getElementById('gvTotalKonstruksjon').value;
      var undertype = document.getElementById('gvTotalUndertype').value;
      romData.push({ romtype: 'Hele boligen', kvm: kvm, konstruksjon: konstr, undertype: undertype });
    } else {
      document.querySelectorAll('.rom-entry').forEach(function(entry) {
        var kvm = parseFloat(entry.querySelector('.rom-kvm').value) || 0;
        var type = entry.querySelector('.rom-type');
        var konstr = entry.querySelector('.rom-konstruksjon').value;
        var undertype = entry.querySelector('.rom-undertype').value;
        var label = type.options[type.selectedIndex] ? type.options[type.selectedIndex].text : 'Rom';
        romData.push({ romtype: label, kvm: kvm, konstruksjon: konstr, undertype: undertype });
      });
    }

    var totalKvm = 0;
    var totalRoer = 0;
    var totalKurser = 0;
    var antallRom = romData.length;
    var materialSummary = {};

    romData.forEach(function(rom) {
      totalKvm += rom.kvm;
      var roer = rom.kvm * CFG.gulvvarme.roerPerKvm;
      totalRoer += roer;

      // Kurser
      var kurser = beregnKurser(rom.kvm);
      totalKurser += kurser;
      rom.kurser = kurser;
      rom.roer = roer;

      // Material per rom based on construction
      if (rom.konstruksjon && rom.undertype) {
        var konstrCfg = CFG.gulvvarme.konstruksjon[rom.konstruksjon];
        if (konstrCfg && konstrCfg.undertyper[rom.undertype]) {
          var materialer = konstrCfg.undertyper[rom.undertype].materialer;
          rom.undertypeLabel = konstrCfg.undertyper[rom.undertype].label;
          rom.konstruksjonLabel = konstrCfg.label;
          materialer.forEach(function(mat) {
            var antall = Math.ceil(rom.kvm * mat.perKvm);
            if (!materialSummary[mat.id]) {
              materialSummary[mat.id] = { label: mat.label, antall: 0, enhet: mat.enhet };
            }
            materialSummary[mat.id].antall += antall;
          });
        }
      }
    });

    var totalAktuatorer = totalKurser * CFG.gulvvarme.aktuatorPerKurs;
    var totalTermostater = antallRom * CFG.gulvvarme.termostatPerRom;
    var totalBoeyefiksturer = totalKurser * CFG.gulvvarme.boeyefikturerPerKurs;
    var totalStyringsenheter = Math.ceil(antallRom / CFG.gulvvarme.romPerStyringsenhet);
    if (totalStyringsenheter < 1) totalStyringsenheter = 1;

    return {
      rom: romData,
      totalKvm: totalKvm,
      totalRoer: Math.ceil(totalRoer),
      totalKurser: totalKurser,
      antallRom: antallRom,
      aktuatorer: totalAktuatorer,
      termostater: totalTermostater,
      boeyefiksturer: totalBoeyefiksturer,
      styringsenheter: totalStyringsenheter,
      materialSummary: materialSummary,
      metode: metode
    };
  }

  function beregnKurser(kvm) {
    var grenser = CFG.gulvvarme.kursGrenser;
    for (var i = 0; i < grenser.length; i++) {
      if (kvm <= grenser[i].maxKvm) return grenser[i].kurser;
    }
    return grenser[grenser.length - 1].kurser;
  }

  // ============================================================
  // Result Generation
  // ============================================================
  function generateResult() {
    var energi = state.showEnergi ? beregnEnergi() : null;
    var gulvvarme = state.showGulvvarme ? beregnGulvvarme() : null;
    var kunEpost = document.getElementById('kunEpost').checked;

    var kontakt;
    if (kunEpost) {
      kontakt = {
        navn: '',
        telefon: '',
        epost: document.getElementById('kontaktEpostKun').value.trim(),
        adresse: '',
        kunEpost: true
      };
    } else {
      kontakt = {
        navn: document.getElementById('kontaktNavn').value.trim(),
        telefon: document.getElementById('kontaktTelefon').value.trim(),
        epost: document.getElementById('kontaktEpost').value.trim(),
        adresse: document.getElementById('kontaktAdresse').value.trim(),
        kunEpost: false
      };
    }

    // Submit lead and send emails
    submitLead(kontakt, energi, gulvvarme);

    // Build result HTML
    var html = buildResultHTML(energi, gulvvarme, kontakt);
    document.getElementById('resultatInnhold').innerHTML = html;
    showStep(4);
  }

  function buildResultHTML(energi, gulvvarme, kontakt) {
    var h = '';

    // Print header
    h += '<div class="print-header">';
    h += '<h1>Therwatt – Beregningsresultat</h1>';
    h += '<p>Utarbeidet for ' + esc(kontakt.navn || kontakt.epost) + ' &middot; ' + new Date().toLocaleDateString('nb-NO') + '</p>';
    h += '</div>';

    // Success header
    h += '<div class="resultat-header">';
    h += '<div class="success-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg></div>';
    h += '<h2>Takk for din forespørsel</h2>';
    if (kontakt.kunEpost) {
      h += '<p>Vi har mottatt beregningen din og sender resultatet til ' + esc(kontakt.epost) + '.</p>';
    } else {
      h += '<p>Vi har mottatt dine opplysninger og beregninger. En rådgiver fra Therwatt kan kontakte deg for å gå gjennom resultatet og gi et tilpasset tilbud.</p>';
    }
    h += '</div>';

    h += '<div class="resultat-grid">';

    // Contact summary
    h += '<div class="resultat-card">';
    h += '<h3><span class="card-icon blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>Kontaktopplysninger</h3>';
    if (kontakt.navn) h += '<div class="kv"><div class="muted">Navn</div><div>' + esc(kontakt.navn) + '</div></div>';
    if (kontakt.adresse) h += '<div class="kv"><div class="muted">Adresse</div><div>' + esc(kontakt.adresse) + '</div></div>';
    if (kontakt.telefon) h += '<div class="kv"><div class="muted">Telefon</div><div>' + esc(kontakt.telefon) + '</div></div>';
    h += '<div class="kv"><div class="muted">E-post</div><div>' + esc(kontakt.epost) + '</div></div>';
    if (kontakt.kunEpost) {
      h += '<div class="kv-info"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg> Beregningen sendes til din e-postadresse.</div>';
    }
    h += '</div>';

    // Tjeneste summary
    h += '<div class="resultat-card">';
    h += '<h3><span class="card-icon orange"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg></span>Valgt tjeneste</h3>';
    var tjenesteLabels = [];
    if (state.showEnergi) tjenesteLabels.push('Energiberegning varmepumpe');
    if (state.showGulvvarme) tjenesteLabels.push('Materialberegning gulvvarme');
    tjenesteLabels.forEach(function(t) {
      h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="' + 'var(--success)' + '" stroke-width="2.5"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg><span style="font-size:14px;font-weight:600">' + t + '</span></div>';
    });
    h += '</div>';

    // ---- ENERGI RESULTS ----
    if (energi) {
      // Effektbehov
      h += '<div class="resultat-card">';
      h += '<h3><span class="card-icon blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></span>Beregnet effektbehov</h3>';
      h += '<div class="kv"><div class="muted">Byggeår</div><div>' + esc(energi.byggeaarLabel) + '</div></div>';
      h += '<div class="kv"><div class="muted">Boligtype</div><div>' + esc(energi.boligtypeLabel) + '</div></div>';
      h += '<div class="kv"><div class="muted">Oppvarmet areal</div><div>' + formatNum(energi.areal) + ' m²</div></div>';
      if (energi.etterisolert) {
        h += '<div class="kv"><div class="muted">Etterisolering</div><div>' + energi.etterisoleringCm + ' cm (effektiv standard: ' + esc(energi.effektivByggeaarLabel) + ')</div></div>';
      }
      h += '<div class="resultat-big-number">' + formatKw(energi.effektbehovKw) + ' <small>kW</small></div>';
      h += '<p class="muted" style="font-size:13px">Boligens beregnede totale effektbehov for oppvarming</p>';
      h += '</div>';

      // Anbefalinger
      h += '<div class="resultat-card">';
      h += '<h3><span class="card-icon green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>Anbefalte varmepumper</h3>';
      h += '<div class="anbefaling-kort">';
      h += '<h4>Bergvarmepumpe</h4>';
      h += '<div class="anbefaling-verdi">' + formatKw(energi.bergvarmeKw) + ' kW</div>';
      h += '<p>Dimensjonert til 80 % av effektbehovet. Bergvarme dekker grunnlasten effektivt med høy virkningsgrad hele året, supplert av spisslast ved svært lave temperaturer.</p>';
      h += '</div>';
      h += '<div class="anbefaling-kort">';
      h += '<h4>Luft-vann varmepumpe</h4>';
      h += '<div class="anbefaling-verdi">' + formatKw(energi.luftVannKw) + ' kW</div>';
      h += '<p>Dimensjonert til 100 % av effektbehovet. Luft-vann er et rimelig alternativ som henter energi fra uteluften, men har lavere virkningsgrad ved lave utetemperaturer.</p>';
      h += '</div>';
      h += '</div>';

      // Fordeler med varmepumpe
      h += '<div class="resultat-card full">';
      h += '<h3><span class="card-icon green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg></span>Fordeler med varmepumpe</h3>';
      h += '<div class="fordeler-liste">';
      h += fordel('Reduserer energiforbruket med opptil 60–75 % sammenlignet med direkte elektrisk oppvarming');
      h += fordel('Leverer jevn og behagelig varme gjennom vannbårent system med lav turtemperatur');
      h += fordel('Gir bedre inneklima og kan også brukes til kjøling om sommeren (bergvarme)');
      h += fordel('Øker boligens verdi og gjør den mer attraktiv i markedet');
      h += fordel('Bidrar til lavere klimaavtrykk ved å utnytte fornybar energi fra grunnen eller luften');
      h += '</div>';
      h += '</div>';

      // Energibesparelse
      h += '<div class="resultat-card full">';
      h += '<h3><span class="card-icon green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg></span>Mulig energibesparelse med varmepumpe</h3>';
      h += '<p class="muted" style="font-size:14px;margin-bottom:4px">Estimert årlig varmebehov: ' + formatNum(Math.round(energi.aarligVarmebehovKwh)) + ' kWh</p>';
      h += '<div class="besparelse-grid">';
      h += besparelseBoks('Bergvarme', 'Årsvarmefaktor ' + formatNum(energi.bergAarsVarmefaktor, 1), energi.bergSpartKwh, energi.bergSpartKr);
      h += besparelseBoks('Luft-vann', 'Årsvarmefaktor ' + formatNum(energi.luftAarsVarmefaktor, 1), energi.luftSpartKwh, energi.luftSpartKr);
      h += '</div>';
      h += '<div class="estimat-disclaimer">';
      h += '<strong>Merk:</strong> Dette er et forenklet estimat. Faktisk besparelse vil variere med lokalt klima, faktisk strømpris, turtemperatur, boligens reelle standard, styringssystem og bruksmønster. Beregningen forutsetter en strømpris på ' + formatNum(CFG.stromPrisKrPerKwh, 2) + ' kr/kWh og ca. ' + formatNum(CFG.driftstimerPerAar) + ' driftstimer per år.';
      h += '</div>';
      h += '</div>';
    }

    // ---- GULVVARME RESULTS ----
    if (gulvvarme) {
      // Fordeler med gulvvarme
      h += '<div class="resultat-card full">';
      h += '<h3><span class="card-icon orange"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 10h18M3 7l9-4 9 4"/><rect x="7" y="10" width="3" height="11"/><rect x="14" y="10" width="3" height="11"/></svg></span>Fordeler med vannbåren gulvvarme</h3>';
      h += '<div class="fordeler-liste">';
      h += fordel('Jevn og behagelig varmefordeling over hele gulvflaten – ingen kalde soner');
      h += fordel('Lavere energiforbruk enn radiatorer fordi gulvvarme opererer med lavere turtemperatur');
      h += fordel('Frigjør veggplass – ingen synlige radiatorer eller konvektorer');
      h += fordel('Ideelt i kombinasjon med varmepumpe for maksimal energieffektivitet');
      h += fordel('Skaper et bedre inneklima med mindre luftsirkulasjon og støvoppvirvling');
      h += '</div>';
      h += '</div>';

      // Materialoversikt
      h += '<div class="resultat-card full">';
      h += '<h3><span class="card-icon blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg></span>Komplett materialliste – Gulvvarme</h3>';

      // Summary stats
      h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px">';
      h += statBox('Totalt areal', formatNum(gulvvarme.totalKvm) + ' m²');
      h += statBox('Rør totalt', formatNum(gulvvarme.totalRoer) + ' m');
      h += statBox('Kurser', gulvvarme.totalKurser);
      h += statBox('Rom', gulvvarme.antallRom);
      h += '</div>';

      // Material table
      h += '<table class="material-tabell">';
      h += '<thead><tr><th>Produkt</th><th>Antall</th><th>Enhet</th></tr></thead>';
      h += '<tbody>';
      h += matRow(CFG.productMapping.roer.navn, formatNum(gulvvarme.totalRoer), 'm');
      h += matRow(CFG.productMapping.termostat.navn, gulvvarme.termostater, 'stk');
      h += matRow(CFG.productMapping.aktuator.navn, gulvvarme.aktuatorer, 'stk');
      h += matRow(CFG.productMapping.boeyefiktur.navn, gulvvarme.boeyefiksturer, 'stk');
      h += matRow(CFG.productMapping.styringsenhet.navn, gulvvarme.styringsenheter, 'stk');

      // Additional materials based on construction
      for (var matId in gulvvarme.materialSummary) {
        var mat = gulvvarme.materialSummary[matId];
        h += matRow(mat.label, mat.antall, mat.enhet);
      }
      h += '</tbody></table>';

      // Rom breakdown if rom-for-rom
      if (gulvvarme.metode !== 'total' && gulvvarme.rom.length > 0) {
        h += '<h4 style="margin:24px 0 12px;font-size:15px;font-weight:700">Romoversikt</h4>';
        h += '<table class="material-tabell">';
        h += '<thead><tr><th>Rom</th><th>Areal</th><th>Kurser</th><th>Rør</th><th>Oppbygning</th></tr></thead>';
        h += '<tbody>';
        gulvvarme.rom.forEach(function(rom) {
          h += '<tr>';
          h += '<td style="font-weight:600">' + esc(rom.romtype) + '</td>';
          h += '<td>' + formatNum(rom.kvm) + ' m²</td>';
          h += '<td>' + rom.kurser + '</td>';
          h += '<td>' + formatNum(Math.ceil(rom.roer)) + ' m</td>';
          h += '<td>' + esc((rom.konstruksjonLabel || '') + (rom.undertypeLabel ? ' / ' + rom.undertypeLabel : '')) + '</td>';
          h += '</tr>';
        });
        h += '</tbody></table>';
      }

      // Oppbygning info
      h += '<div class="oppbygning-info">';
      h += '<h4>Slik legges gulvvarme normalt opp</h4>';
      h += '<p>Vannbåren gulvvarme monteres som et rørsystem i gulvet, koblet til en fordeler og varmekilde (varmepumpe eller kjel). Her er en forenklet oversikt over fremgangsmåten:</p>';
      h += '<ol>';
      h += '<li>Underlaget klargjøres med isolasjon og eventuell dampsperre</li>';
      h += '<li>Rør legges i slynger med jevn senteravstand (typisk ca. 20 cm), enten i støp med armering/knasteplater eller i treverk med alu-/EPS-plater</li>';
      h += '<li>Hvert rom kobles som egne kurser til en fordeler med aktuatorer</li>';
      h += '<li>Romtermostater installeres for individuell temperaturstyring</li>';
      h += '<li>Systemet trykktestes før gulvbelegg legges</li>';
      h += '<li>Anlegget kobles til varmekilde og styringsenhet, og tempereres gradvis</li>';
      h += '</ol>';
      h += '</div>';

      h += '</div>'; // end material card
    }

    h += '</div>'; // end resultat-grid

    return h;
  }

  // ============================================================
  // Helper functions for result HTML
  // ============================================================
  function fordel(text) {
    return '<div class="fordel-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg><span>' + text + '</span></div>';
  }

  function besparelseBoks(title, subtitle, spartKwh, spartKr) {
    var h = '<div class="besparelse-boks">';
    h += '<h4>' + title + '</h4>';
    h += '<p class="spar-label">' + subtitle + '</p>';
    h += '<div class="spar-tall">' + formatNum(Math.round(spartKwh)) + ' kWh</div>';
    h += '<p class="spar-label">estimert spart per år</p>';
    h += '<div class="spar-tall" style="font-size:22px;color:var(--accent)">' + formatNum(Math.round(spartKr)) + ' kr</div>';
    h += '<p class="spar-label">estimert spart beløp per år</p>';
    h += '</div>';
    return h;
  }

  function statBox(label, value) {
    return '<div style="background:var(--card2);border:1px solid var(--line);border-radius:var(--radius);padding:16px;text-align:center">' +
      '<div style="font-size:22px;font-weight:800;color:var(--accent)">' + value + '</div>' +
      '<div style="font-size:12px;color:var(--muted);margin-top:2px">' + label + '</div></div>';
  }

  function matRow(product, antall, enhet) {
    return '<tr><td>' + esc(product) + '</td><td class="mat-antall">' + antall + '</td><td>' + enhet + '</td></tr>';
  }

  function formatKw(val) {
    return val.toFixed(2).replace('.', ',');
  }

  function formatNum(val, decimals) {
    if (typeof decimals === 'number') {
      return Number(val).toFixed(decimals).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
    return String(val).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  function esc(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ============================================================
  // Lead submission
  // ============================================================
  function submitLead(kontakt, energi, gulvvarme) {
    var payload = {
      timestamp: new Date().toISOString(),
      kontakt: kontakt,
      tjenester: state.tjenester,
      energi: energi ? {
        byggeaar: energi.byggeaarLabel,
        boligtype: energi.boligtypeLabel,
        areal: energi.areal,
        etterisolert: energi.etterisolert,
        etterisoleringCm: energi.etterisoleringCm,
        effektbehovKw: energi.effektbehovKw,
        bergvarmeKw: energi.bergvarmeKw,
        luftVannKw: energi.luftVannKw,
        aarligVarmebehovKwh: energi.aarligVarmebehovKwh,
        bergSpartKwh: energi.bergSpartKwh,
        luftSpartKwh: energi.luftSpartKwh,
        bergSpartKr: energi.bergSpartKr,
        luftSpartKr: energi.luftSpartKr,
        bergAarsVarmefaktor: energi.bergAarsVarmefaktor,
        luftAarsVarmefaktor: energi.luftAarsVarmefaktor
      } : null,
      gulvvarme: gulvvarme ? {
        totalKvm: gulvvarme.totalKvm,
        totalRoer: gulvvarme.totalRoer,
        totalKurser: gulvvarme.totalKurser,
        antallRom: gulvvarme.antallRom,
        aktuatorer: gulvvarme.aktuatorer,
        termostater: gulvvarme.termostater,
        boeyefiksturer: gulvvarme.boeyefiksturer,
        styringsenheter: gulvvarme.styringsenheter,
        materialSummary: gulvvarme.materialSummary,
        rom: gulvvarme.rom ? gulvvarme.rom.map(function(r) {
          return {
            romtype: r.romtype,
            kvm: r.kvm,
            kurser: r.kurser,
            roer: Math.ceil(r.roer),
            konstruksjonLabel: r.konstruksjonLabel || '',
            undertypeLabel: r.undertypeLabel || ''
          };
        }) : []
      } : null
    };

    // Submit to Netlify Function (stores lead + sends emails)
    fetch('/api/kalkulator-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(function() {
      // Silent fail – lead also stored via Netlify Forms fallback
    });

    // Also submit as Netlify Form (hidden form fallback)
    var formData = new FormData();
    formData.append('form-name', 'kalkulator-lead');
    formData.append('navn', kontakt.navn);
    formData.append('epost', kontakt.epost);
    formData.append('telefon', kontakt.telefon);
    formData.append('adresse', kontakt.adresse || '');
    formData.append('tjenester', state.tjenester.join(', '));
    formData.append('data', JSON.stringify(payload));

    fetch('/', {
      method: 'POST',
      body: formData
    }).catch(function() {});
  }

  // ============================================================
  // Result page actions
  // ============================================================
  function bindResult() {
    document.getElementById('skrivUt').addEventListener('click', function() {
      window.print();
    });

    document.getElementById('startPaaNytt').addEventListener('click', function() {
      // Reset
      document.querySelectorAll('input[name="tjeneste"]').forEach(function(cb) { cb.checked = false; });
      document.getElementById('step1Next').disabled = true;
      document.getElementById('samtykke').checked = false;
      document.getElementById('step3Next').disabled = true;
      document.getElementById('kunEpost').checked = false;
      document.getElementById('fullKontaktFelter').style.display = '';
      document.getElementById('kunEpostFelter').style.display = 'none';
      document.getElementById('samtykkeTekst').textContent = 'Jeg samtykker til at Therwatt lagrer mine opplysninger og kan kontakte meg med resultat og eventuelt tilbud. Opplysningene deles ikke med tredjepart.';
      state.tjenester = [];
      state.showEnergi = false;
      state.showGulvvarme = false;
      state.rom = [];
      state.romIdCounter = 0;
      document.getElementById('resultatInnhold').innerHTML = '';
      document.getElementById('energiSection').style.display = 'none';
      document.getElementById('gulvvarmeSection').style.display = 'none';
      showStep(1);
    });
  }

  // ============================================================
  // Boot
  // ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
