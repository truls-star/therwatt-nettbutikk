(function() {
  'use strict';

  function fmt(value) {
    return Number(value || 0).toLocaleString('nb-NO');
  }

  function esc(value) {
    var div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  function row(label, value) {
    return '<div class="kv"><div class="muted">' + esc(label) + '</div><div>' + esc(value) + '</div></div>';
  }

  function renderNoData() {
    var root = document.getElementById('calcResultRoot');
    root.innerHTML =
      '<div class="resultat-card full">' +
      '<h3>Ingen kalkulatorresultat funnet</h3>' +
      '<p class="muted">Kjør kalkulatoren først, så vises teknisk anbefaling her.</p>' +
      '<div class="actions" style="margin-top:12px"><a class="btn" href="kalkulator.html">Gå til kalkulator</a></div>' +
      '</div>';
  }

  function renderResult(data) {
    var root = document.getElementById('calcResultRoot');
    var energy = data.energy;
    var contact = data.contact || {};
    var building = data.building || {};
    var floor = data.floorHeating;

    var html = '';

    html += '<div class="resultat-card">';
    html += '<h3>Leadoversikt</h3>';
    html += row('Navn', contact.name || '-');
    html += row('Telefon', contact.phone || '-');
    html += row('E-post', contact.email || '-');
    html += row('Adresse', ((contact.address || '') + ' ' + (contact.postal_code || '') + ' ' + (contact.city || '')).trim() || '-');
    html += row('Følge opp', data.followUpPriority || 'Normal');
    html += row('Vannbåren varme i dag', building.waterborne_heating === 'ja' ? 'Ja' : (building.waterborne_heating === 'nei' ? 'Nei' : '-'));
    html += '</div>';

    html += '<div class="resultat-card">';
    html += '<h3>Status innsending</h3>';
    html += '<div class="notice ' + (data.submitted ? 'success' : '') + '">';
    html += data.submitted
      ? 'Skjema er sendt og lagret i Netlify Forms.'
      : 'Innsending ble ikke bekreftet. Bruk kontaktknappen under for manuell oppfølging.';
    html += '</div>';
    html += row('Valgte tjenester', (data.selectedServices || []).join(', ') || '-');
    html += row('Eksisterende varmesystem', building.existing_heating_system || '-');
    html += row('Ønsket løsning', building.desired_solution || '-');
    html += '</div>';

    if (energy) {
      html += '<div class="resultat-card full">';
      html += '<h3>Teknisk energiresultat</h3>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:14px">';
      html += '<div class="besparelse-boks"><h4>Estimert årlig varmebehov</h4><div class="spar-tall">' + fmt(energy.annualHeatingDemandKwh) + ' kWh</div></div>';
      html += '<div class="besparelse-boks"><h4>Estimert strømforbruk varmepumpe</h4><div class="spar-tall">' + fmt(energy.heatPumpConsumptionKwh) + ' kWh</div></div>';
      html += '<div class="besparelse-boks"><h4>Estimert årlig spart energi</h4><div class="spar-tall">' + fmt(energy.savedKwh) + ' kWh</div></div>';
      html += '</div>';
      html += row('Anbefalt system', energy.systemType);
      html += row('Anbefalt effektområde', energy.recommendedRange);
      html += row('NIBE-anbefaling', energy.nibeOption);
      html += row('IGLU-anbefaling', energy.igluOption);
      html += '<div class="oppbygning-info" style="margin-top:14px"><h4>Hvorfor disse modellene passer</h4>';
      html += '<p><strong>NIBE:</strong> ' + esc(energy.reasonNibe) + '</p>';
      html += '<p style="margin-top:8px"><strong>IGLU:</strong> ' + esc(energy.reasonIglu) + '</p>';
      html += '<p style="margin-top:8px"><strong>Anbefalt neste steg:</strong> ' + esc(data.nextStep || 'Bestill befaring.') + '</p>';
      html += '</div>';
      html += '</div>';
    }

    if (floor) {
      html += '<div class="resultat-card full">';
      html += '<h3>Gulvvarmeoversikt</h3>';
      html += row('Totalt gulvareal', fmt(floor.totalKvm) + ' m²');
      html += row('Totalt rørbehov', fmt(floor.totalRoer) + ' m');
      html += row('Totalt antall kurser', fmt(floor.totalKurser));
      html += '</div>';
    }

    root.innerHTML = html;
  }

  var raw = sessionStorage.getItem('therwattCalcResult');
  if (!raw) {
    renderNoData();
    return;
  }

  try {
    var parsed = JSON.parse(raw);
    renderResult(parsed);
    var nextStepText = document.getElementById('nextStepText');
    if (nextStepText && parsed.nextStep) nextStepText.textContent = parsed.nextStep;
  } catch (error) {
    renderNoData();
  }
})();
