/**
 * Therwatt Kalkulator – Netlify Forms lead workflow
 */
(function() {
  'use strict';

  var ERROR_MESSAGE = 'Det oppstod en feil ved sending. Prøv igjen, eller kontakt oss på post@therwatt.no.';
  var CFG = window.KALKULATOR_CONFIG;

  var state = {
    tjenester: [],
    showEnergi: false,
    showGulvvarme: false,
    rom: [],
    romIdCounter: 0
  };

  function init() {
    populateSelects();
    bindStepNavigation();
    bindEnergiToggle();
    bindGulvvarmeToggle();
    bindContactForm();
  }

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

  function bindStepNavigation() {
    var checkboxes = document.querySelectorAll('input[name="tjeneste"]');
    var step1Next = document.getElementById('step1Next');

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
      if (!validateStep3()) return;
      submitCalculatorLead();
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
      var stepN = parseInt(s.getAttribute('data-step'), 10);
      s.classList.remove('active', 'done');
      if (stepN < n) s.classList.add('done');
      else if (stepN === n) s.classList.add('active');
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function bindEnergiToggle() {
    var radios = document.querySelectorAll('input[name="etterisolert"]');
    radios.forEach(function(r) {
      r.addEventListener('change', function() {
        document.getElementById('etterisoleringGruppe').style.display = this.value === 'ja' ? '' : 'none';
      });
    });
  }

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

    var konstrSel = document.getElementById('gvTotalKonstruksjon');
    konstrSel.addEventListener('change', function() {
      updateUndertypeSelect('gvTotalUndertypeGruppe', 'gvTotalUndertype', this.value);
    });

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
    state.rom.push({ id: state.romIdCounter });
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

      var removeBtn = div.querySelector('.rom-remove');
      if (removeBtn) {
        removeBtn.addEventListener('click', function() {
          removeRom(parseInt(this.getAttribute('data-remove'), 10));
        });
      }
    });
  }

  function bindContactForm() {
    var samtykke = document.getElementById('samtykke');
    var nextBtn = document.getElementById('step3Next');

    samtykke.addEventListener('change', function() {
      nextBtn.disabled = !this.checked;
    });
  }

  function validateStep2() {
    clearErrors();
    var valid = true;

    if (state.showEnergi) {
      var requiredIds = ['byggeaar', 'boligtype', 'areal', 'antallEtasjer', 'eksisterendeVarme', 'vannbarenVarme', 'onsketLosning'];
      requiredIds.forEach(function(id) {
        var el = document.getElementById(id);
        if (!el || !String(el.value || '').trim()) {
          markError(id);
          valid = false;
        }
      });

      var areal = document.getElementById('areal');
      if (areal && (!areal.value || parseFloat(areal.value) <= 0)) {
        markError('areal');
        valid = false;
      }

      var etterisolertJa = document.querySelector('input[name="etterisolert"][value="ja"]').checked;
      if (etterisolertJa && !document.getElementById('etterisoleringCm').value) {
        markError('etterisoleringCm');
        valid = false;
      }
    }

    if (state.showGulvvarme) {
      var metode = document.querySelector('input[name="gvMetode"]:checked').value;
      if (metode === 'total') {
        if (!document.getElementById('gvTotalKvm').value || parseFloat(document.getElementById('gvTotalKvm').value) <= 0) {
          markError('gvTotalKvm');
          valid = false;
        }
        if (!document.getElementById('gvTotalKonstruksjon').value) {
          markError('gvTotalKonstruksjon');
          valid = false;
        }
      } else {
        var romEntries = document.querySelectorAll('.rom-entry');
        if (romEntries.length === 0) valid = false;

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

    var requiredFields = ['kontaktNavn', 'kontaktTelefon', 'kontaktEpost'];
    var valid = true;

    requiredFields.forEach(function(id) {
      var el = document.getElementById(id);
      if (!el.value.trim()) {
        markError(id);
        valid = false;
      }
    });

    var epost = document.getElementById('kontaktEpost');
    if (epost.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(epost.value)) {
      markError('kontaktEpost');
      valid = false;
    }

    if (!document.getElementById('samtykke').checked) {
      valid = false;
      setStatus('Du må samtykke før innsending.', false);
    } else {
      setStatus('', true);
    }

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

  function setStatus(message, ok) {
    var el = document.getElementById('kalkulatorStatus');
    if (!el) return;
    if (!message) {
      el.style.display = 'none';
      el.textContent = '';
      return;
    }
    el.style.display = '';
    el.className = ok ? 'notice success' : 'notice';
    el.textContent = message;
  }

  function collectKontakt() {
    return {
      name: document.getElementById('kontaktNavn').value.trim(),
      phone: document.getElementById('kontaktTelefon').value.trim(),
      email: document.getElementById('kontaktEpost').value.trim(),
      address: document.getElementById('kontaktAdresse').value.trim(),
      postal_code: document.getElementById('kontaktPostnummer').value.trim(),
      city: document.getElementById('kontaktBy').value.trim(),
      message: document.getElementById('kontaktMelding').value.trim(),
      botField: (document.getElementById('kontaktBotField').value || '').trim()
    };
  }

  function collectBuilding() {
    return {
      construction_year: document.getElementById('byggeaar').value,
      property_size_m2: document.getElementById('areal').value,
      number_of_floors: document.getElementById('antallEtasjer').value,
      existing_heating_system: document.getElementById('eksisterendeVarme').value,
      waterborne_heating: document.getElementById('vannbarenVarme').value,
      wants_floor_heating: state.showGulvvarme ? 'ja' : 'nei',
      desired_solution: document.getElementById('onsketLosning').value
    };
  }

  function beregnEnergi() {
    var byggeaarVal = document.getElementById('byggeaar').value;
    var boligtypeVal = document.getElementById('boligtype').value;
    var arealVal = parseFloat(document.getElementById('areal').value);
    var etterisolertJa = document.querySelector('input[name="etterisolert"][value="ja"]').checked;
    var etterisoleringCm = etterisolertJa ? parseInt(document.getElementById('etterisoleringCm').value, 10) || 0 : 0;

    var byggeaarCfg = CFG.byggeaar.find(function(b) { return b.value === byggeaarVal; });
    var boligtypeCfg = CFG.boligtyper.find(function(b) { return b.value === boligtypeVal; });
    if (!byggeaarCfg || !boligtypeCfg) return null;

    var steg = Math.floor(etterisoleringCm / 5) * CFG.etterisoleringStegPer5cm;
    var effektivIndex = Math.min(byggeaarCfg.index + steg, CFG.byggeaar.length - 1);
    var effektivByggeaar = CFG.byggeaar[effektivIndex];

    var wattPerKvm = effektivByggeaar.watt;
    var effektbehovKw = (arealVal * wattPerKvm * boligtypeCfg.faktor) / 1000;
    var annualHeatingDemandKwh = effektbehovKw * CFG.driftstimerPerAar;

    return {
      byggeaarLabel: byggeaarCfg.label,
      boligtypeLabel: boligtypeCfg.label,
      areal: arealVal,
      effektivByggeaarLabel: effektivByggeaar.label,
      effektbehovKw: effektbehovKw,
      annualHeatingDemandKwh: annualHeatingDemandKwh,
      etterisolert: etterisolertJa,
      etterisoleringCm: etterisoleringCm
    };
  }

  function beregnGulvvarme() {
    var metode = document.querySelector('input[name="gvMetode"]:checked').value;
    var romData = [];

    if (metode === 'total') {
      var kvm = parseFloat(document.getElementById('gvTotalKvm').value) || 0;
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
    var totalRomCount = 0;
    var materialSummary = {};

    romData.forEach(function(rom) {
      totalKvm += rom.kvm;
      var roer = rom.kvm * CFG.gulvvarme.roerPerKvm;
      totalRoer += roer;
      var kurser = beregnKurser(rom.kvm);
      totalKurser += kurser;
      totalRomCount += 1;

      if (rom.konstruksjon && rom.undertype) {
        var konstrCfg = CFG.gulvvarme.konstruksjon[rom.konstruksjon];
        if (konstrCfg && konstrCfg.undertyper[rom.undertype]) {
          var materialer = konstrCfg.undertyper[rom.undertype].materialer;
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

    var estRomCount = metode === 'total' ? Math.max(1, Math.ceil(totalKvm / 15)) : totalRomCount;

    return {
      totalKvm: Math.round(totalKvm),
      totalRoer: Math.ceil(totalRoer),
      totalKurser: totalKurser,
      totalThermostats: estRomCount * CFG.gulvvarme.termostatPerRom,
      totalActuators: totalKurser * CFG.gulvvarme.aktuatorPerKurs,
      totalBendGuides: totalKurser * CFG.gulvvarme.boeyefikturerPerKurs,
      totalControlUnits: Math.ceil(estRomCount / CFG.gulvvarme.romPerStyringsenhet),
      materialSummary: materialSummary
    };
  }

  function beregnKurser(kvm) {
    return Math.ceil(kvm / 16.5);
  }

  function velgSystemAnbefaling(energi, building) {
    var waterborne = building.waterborne_heating === 'ja';
    var ønsket = building.desired_solution;
    var area = parseFloat(building.property_size_m2) || 0;
    var floors = building.number_of_floors;

    var systemType = 'Luft-vann varmepumpe';
    var spf = 2.8;
    var recFactor = 1.0;

    if (ønsket === 'bergvarme' || (energi.annualHeatingDemandKwh > 30000 && waterborne)) {
      systemType = 'Bergvarme (væske-vann)';
      spf = 3.5;
      recFactor = 0.8;
    } else if (ønsket === 'avtrekk' || (!waterborne && area <= 220 && (floors === '1' || floors === '2') && energi.annualHeatingDemandKwh < 20000)) {
      systemType = 'Avtrekksvarmepumpe';
      spf = 2.8;
      recFactor = 1.0;
    }

    var recKw = energi.effektbehovKw * recFactor;
    var minKw = Math.max(4, Math.floor(recKw / 2) * 2);
    var maxKw = Math.max(minKw + 2, Math.ceil(recKw / 2) * 2);
    var range = minKw + '–' + maxKw + ' kW';

    var nibeOption = '';
    var igluOption = '';
    var reasonNibe = '';
    var reasonIglu = '';

    if (systemType === 'Bergvarme (væske-vann)') {
      nibeOption = energi.effektbehovKw <= 8
        ? 'NIBE S1255-6 (bergvarme, inverter)'
        : 'NIBE S1255-12 eller NIBE S1156 i korrekt borehullsdesign';
      igluOption = 'IGLU væske-vann serie i ' + range + ' med hydronisk innedel';
      reasonNibe = 'Passer retrofit-prosjekter med middels til høyt varmebehov, stabil drift og høy årsvirkningsgrad.';
      reasonIglu = 'Passer boliger med vannbåren distribusjon hvor det ønskes robust bergvarmeløsning i riktig effektklasse.';
    } else if (systemType === 'Avtrekksvarmepumpe') {
      nibeOption = 'NIBE S735 (avtrekksvarmepumpe)';
      igluOption = 'IGLU kompakt hydronisk avtrekks-/luft-vann løsning i ' + range;
      reasonNibe = 'Passer boliger uten eksisterende vannbåren varme der ventilasjon og oppvarming kan løses i samme system.';
      reasonIglu = 'Passer moderniseringsprosjekter med moderat varmebehov og ønske om kompakt hydronisk løsning.';
    } else {
      nibeOption = energi.effektbehovKw <= 9
        ? 'NIBE S2125-8 med VVM S320 innemodul'
        : energi.effektbehovKw <= 13
          ? 'NIBE S2125-12 med SMO S40 styring'
          : 'NIBE S2125-16 med tilpasset innedel/akkumulering';
      igluOption = 'IGLU luft-vann modellserie i ' + range + ' med hydronisk innedel';
      reasonNibe = 'Passer boliger med medium til høyt varmebehov og planlagt eller eksisterende vannbåren distribusjon.';
      reasonIglu = 'Passer der kunden ønsker moderne luft-vann løsning med riktig kapasitet for helårsdrift i norsk klima.';
    }

    var annualHeatingDemandKwh = energi.annualHeatingDemandKwh;
    var heatPumpConsumptionKwh = annualHeatingDemandKwh / spf;
    var savedKwh = Math.max(0, annualHeatingDemandKwh - heatPumpConsumptionKwh);

    return {
      systemType: systemType,
      recommendedRange: range,
      nibeOption: nibeOption,
      igluOption: igluOption,
      reasonNibe: reasonNibe,
      reasonIglu: reasonIglu,
      annualHeatingDemandKwh: Math.round(annualHeatingDemandKwh),
      heatPumpConsumptionKwh: Math.round(heatPumpConsumptionKwh),
      savedKwh: Math.round(savedKwh)
    };
  }

  function followUpPriority(reco, building) {
    if (!reco) return 'Normal';
    if (reco.annualHeatingDemandKwh >= 30000 || (building.waterborne_heating === 'nei' && building.wants_floor_heating === 'ja')) {
      return 'Høy';
    }
    if (reco.annualHeatingDemandKwh >= 18000) return 'Middels';
    return 'Normal';
  }

  async function submitCalculatorLead() {
    var button = document.getElementById('step3Next');
    var originalText = button.getAttribute('data-submit-label') || button.textContent;
    button.disabled = true;
    button.textContent = 'Sender...';
    setStatus('Sender forespørsel til Therwatt ...', true);

    try {
      var kontakt = collectKontakt();
      var building = collectBuilding();
      var energi = state.showEnergi ? beregnEnergi() : null;
      var gulvvarme = state.showGulvvarme ? beregnGulvvarme() : null;
      var recommendation = energi ? velgSystemAnbefaling(energi, building) : null;

      var priority = followUpPriority(recommendation, building);
      var submissions = [];
      
      var emailData = {
        'Valgte tjenester': state.tjenester.join(', '),
        'Prioritet': priority,
        'Byggeår': building.construction_year,
        'Areal (m2)': building.property_size_m2,
        'Antall etasjer': building.number_of_floors,
        'Eksisterende varme': building.existing_heating_system,
        'Vannbåren varme i dag': building.waterborne_heating,
        'Ønsket løsning': building.desired_solution
      };

      if (energi && recommendation) {
        submissions.push(sendNetlifyForm('energy-calculation', {
          'form-name': 'energy-calculation',
          'bot-field': kontakt.botField,
          lead_type: 'energy-calculation',
          name: kontakt.name,
          phone: kontakt.phone,
          email: kontakt.email,
          address: kontakt.address,
          postal_code: kontakt.postal_code,
          city: kontakt.city,
          selected_service: 'Varmepumpe og energiberegning',
          property_size_m2: building.property_size_m2,
          construction_year: energi.byggeaarLabel,
          number_of_floors: building.number_of_floors,
          existing_heating_system: building.existing_heating_system,
          waterborne_heating: building.waterborne_heating,
          wants_floor_heating: building.wants_floor_heating,
          desired_solution: building.desired_solution,
          recommended_system: recommendation.systemType,
          recommended_output_range_kw: recommendation.recommendedRange,
          estimated_annual_heating_demand_kwh: recommendation.annualHeatingDemandKwh,
          estimated_heatpump_consumption_kwh: recommendation.heatPumpConsumptionKwh,
          estimated_annual_saved_kwh: recommendation.savedKwh,
          recommended_nibe_model: recommendation.nibeOption,
          recommended_iglu_model: recommendation.igluOption,
          recommendation_reason_nibe: recommendation.reasonNibe,
          recommendation_reason_iglu: recommendation.reasonIglu,
          follow_up_priority: priority,
          message: kontakt.message
        }));
        
        emailData['Anbefalt system'] = recommendation.systemType;
        emailData['Effektbehov (kW)'] = recommendation.recommendedRange;
        emailData['Årlig varmebehov (kWh)'] = recommendation.annualHeatingDemandKwh;
        emailData['Estimert strømforbruk (kWh)'] = recommendation.heatPumpConsumptionKwh;
        emailData['Estimert spart (kWh)'] = recommendation.savedKwh;
        emailData['NIBE anbefaling'] = recommendation.nibeOption;
        emailData['IGLU anbefaling'] = recommendation.igluOption;
      }

      if (gulvvarme) {
        submissions.push(sendNetlifyForm('floor-heating-calculator', {
          'form-name': 'floor-heating-calculator',
          'bot-field': kontakt.botField,
          lead_type: 'floor-heating-calculator',
          name: kontakt.name,
          phone: kontakt.phone,
          email: kontakt.email,
          address: kontakt.address,
          postal_code: kontakt.postal_code,
          city: kontakt.city,
          selected_service: 'Gulvvarmekalkulator',
          property_size_m2: building.property_size_m2,
          construction_year: building.construction_year,
          number_of_floors: building.number_of_floors,
          existing_heating_system: building.existing_heating_system,
          waterborne_heating: building.waterborne_heating,
          wants_floor_heating: 'ja',
          desired_solution: building.desired_solution,
          floor_area_m2: gulvvarme.totalKvm,
          floor_total_circuits: gulvvarme.totalKurser,
          floor_total_pipe_m: gulvvarme.totalRoer,
          floor_material_summary: JSON.stringify(gulvvarme.materialSummary),
          follow_up_priority: priority,
          message: kontakt.message
        }));
        
        emailData['Gulvareal (m2)'] = gulvvarme.totalKvm;
        emailData['Totalt rørbehov (m)'] = gulvvarme.totalRoer;
        emailData['Totalt antall kurser'] = gulvvarme.totalKurser;
        emailData['Romtermostater (stk)'] = gulvvarme.totalThermostats;
        emailData['Aktuatorer (stk)'] = gulvvarme.totalActuators;
        emailData['Styringsenheter (stk)'] = gulvvarme.totalControlUnits;
      }

      var formsResult = await Promise.allSettled(submissions);
      
      var formName = state.showEnergi && state.showGulvvarme ? 'Energi og Gulvvarme' : (state.showEnergi ? 'Energiberegning' : 'Gulvvarme');
      var emailPayload = {
        formName: formName,
        contact: kontakt,
        data: emailData
      };
      
      var emailSent = false;
      try {
        var emailRes = await fetch('/.netlify/functions/send-email', {
          method: 'POST',
          body: JSON.stringify(emailPayload),
          headers: { 'Content-Type': 'application/json' }
        });
        if (emailRes.ok) {
          emailSent = true;
        } else {
          console.error('Email API failed with status:', emailRes.status);
        }
      } catch (err) {
        console.error('Email sending error:', err);
      }

      var payload = {
        generatedAt: new Date().toISOString(),
        submitted: emailSent,
        selectedServices: state.tjenester.slice(),
        contact: kontakt,
        building: building,
        energy: recommendation,
        floorHeating: gulvvarme,
        followUpPriority: priority,
        nextStep: 'Bestill befaring og detaljert dimensjonering fra Therwatt.'
      };

      sessionStorage.setItem('therwattCalcResult', JSON.stringify(payload));
      window.location.href = '/kalkulator-resultat';
    } catch (error) {
      setStatus(ERROR_MESSAGE, false);
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  function sendNetlifyForm(formName, data) {
    var params = new URLSearchParams();
    Object.keys(data).forEach(function(key) {
      params.append(key, data[key] == null ? '' : String(data[key]));
    });

    return fetch('/__forms.html', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    }).then(function(response) {
      if (!response.ok) {
        throw new Error('Innsending feilet for ' + formName);
      }
      return true;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
