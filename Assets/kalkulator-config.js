/**
 * Therwatt Kalkulator – Konfigurasjon
 * Alle beregningsverdier og produktmapping samlet her for enkel vedlikehold.
 * Varenummer kan legges til under productMapping når de er klare.
 */
window.KALKULATOR_CONFIG = {

  // --- Energiberegning ---
  byggeaar: [
    { label: 'Før 1950',   value: 'pre1950',  watt: 100, index: 0 },
    { label: '1950–1970',  value: '1950-70',  watt: 70,  index: 1 },
    { label: '1970–1990',  value: '1970-90',  watt: 55,  index: 2 },
    { label: '1990–2010',  value: '1990-10',  watt: 45,  index: 3 },
    { label: '2010–2017',  value: '2010-17',  watt: 35,  index: 4 },
    { label: '2017–',      value: '2017plus', watt: 27,  index: 5 }
  ],

  etterisoleringCm: [5, 10, 15, 20],

  // Hver 5 cm etterisolering flytter bygget opp 1 kategori
  etterisoleringStegPer5cm: 1,

  boligtyper: [
    { label: 'Enebolig',      value: 'enebolig',      faktor: 1.00 },
    { label: 'Tomannsbolig',  value: 'tomannsbolig',  faktor: 0.90 },
    { label: 'Leilighet',     value: 'leilighet',     faktor: 0.80 }
  ],

  varmepumpe: {
    bergvarme: {
      label: 'Bergvarmepumpe',
      dimensjoneringsFaktor: 0.80,
      aarsVarmefaktor: 3.5
    },
    luftVann: {
      label: 'Luft-vann varmepumpe',
      dimensjoneringsFaktor: 1.00,
      aarsVarmefaktor: 2.8
    }
  },

  // Antatt driftstimer per år for energibesparelse-estimat
  driftstimerPerAar: 2200,
  stromPrisKrPerKwh: 2.00,

  // --- Gulvvarmekalkulator ---
  gulvvarme: {
    roerPerKvm: 5.5,
    termostatPerRom: 1,
    aktuatorPerKurs: 1,
    boeyefikturerPerKurs: 2,
    romPerStyringsenhet: 8,

    // Kursregler
    kursGrenser: [
      { maxKvm: 15,   kurser: 1 },
      { maxKvm: 33,   kurser: 2 },
      { maxKvm: Infinity, kurser: 3 }
    ],

    // Konstruksjonstyper
    konstruksjon: {
      stoop: {
        label: 'Støp',
        undertyper: {
          armering: {
            label: 'Festes på armering',
            materialer: [
              { id: 'stips', label: 'Stips (festeklemmer)', perKvm: 12, enhet: 'stk' }
            ]
          },
          knasteplater: {
            label: 'Knasteplater med isolasjon',
            materialer: [
              { id: 'knasteplate', label: 'Knasteplate', perKvm: 1/1.2, enhet: 'stk' }
            ]
          }
        }
      },
      treverk: {
        label: 'Treverk',
        undertyper: {
          aluplater: {
            label: 'Aluplater',
            materialer: [
              { id: 'aluplate', label: 'Aluplate', perKvm: 5, enhet: 'stk' }
            ]
          },
          epsPlater: {
            label: 'EPS-plater',
            materialer: [
              { id: 'eps_plate', label: 'EPS-plate', perKvm: 1/0.7, enhet: 'stk' }
            ]
          }
        }
      }
    },

    romtyper: [
      { label: 'Stue',     value: 'stue' },
      { label: 'Kjøkken',  value: 'kjokken' },
      { label: 'Gang',     value: 'gang' },
      { label: 'Soverom',  value: 'soverom' },
      { label: 'Kontor',   value: 'kontor' },
      { label: 'Bad',      value: 'bad' },
      { label: 'Vaskerom', value: 'vaskerom' },
      { label: 'Annet',    value: 'annet' }
    ]
  },

  // Produktmapping – kan utvides med varenummer senere
  productMapping: {
    roer:            { navn: 'Gulvvarmerør', varenummer: null, enhet: 'm' },
    termostat:       { navn: 'Romtermostat', varenummer: null, enhet: 'stk' },
    aktuator:        { navn: 'Aktuator', varenummer: null, enhet: 'stk' },
    boeyefiktur:     { navn: 'Bøyefiksturer', varenummer: null, enhet: 'stk' },
    styringsenhet:   { navn: 'Styringsenhet', varenummer: null, enhet: 'stk' },
    stips:           { navn: 'Stips (festeklemmer)', varenummer: null, enhet: 'stk' },
    knasteplate:     { navn: 'Knasteplate med isolasjon', varenummer: null, enhet: 'stk' },
    aluplate:        { navn: 'Aluplate for treverk', varenummer: null, enhet: 'stk' },
    eps_plate:       { navn: 'EPS-plate for treverk', varenummer: null, enhet: 'stk' },
    fordelerskap:    { navn: 'Fordelerskap', varenummer: null, enhet: 'stk' }
  }
};
