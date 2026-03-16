import { useMemo, useState } from 'react';
import { calculateEnergy, regionMeta, type BuildingYearCategory, type HousingType, type RegionKey } from '../modules/calculators/energyEngine';
import { calculateFloorHeating, type ConstructionSystem, type RoomInput } from '../modules/calculators/floorHeatingEngine';
import { LeadForm } from '../components/LeadForm';

const yearOptions: Array<{ value: BuildingYearCategory; label: string }> = [
  { value: 'before1950', label: 'For 1950' },
  { value: '1950_1970', label: '1950-1970' },
  { value: '1970_1990', label: '1970-1990' },
  { value: '1990_2010', label: '1990-2010' },
  { value: '2010_2017', label: '2010-2017' },
  { value: '2017_plus', label: '2017+' }
];

const housingOptions: Array<{ value: HousingType; label: string }> = [
  { value: 'apartment', label: 'Leilighet (-20%)' },
  { value: 'semi_detached', label: 'Tomannsbolig (-10%)' },
  { value: 'detached', label: 'Enebolig' }
];

const insulationOptions = [0, 5, 10, 15, 20] as const;

export const EnergyCalculatorPage = () => {
  const [areaM2, setAreaM2] = useState(200);
  const [yearCategory, setYearCategory] = useState<BuildingYearCategory>('1990_2010');
  const [insulationCm, setInsulationCm] = useState<(typeof insulationOptions)[number]>(10);
  const [housingType, setHousingType] = useState<HousingType>('detached');
  const [region, setRegion] = useState<RegionKey>('ostlandet_lavland');

  const [construction, setConstruction] = useState<ConstructionSystem>('concrete');
  const [floorMode, setFloorMode] = useState<'total' | 'room'>('total');
  const [totalFloorArea, setTotalFloorArea] = useState(120);
  const [totalRoomCount, setTotalRoomCount] = useState(6);
  const [rooms, setRooms] = useState<RoomInput[]>([
    { name: 'Stue', areaM2: 35 },
    { name: 'Kjokken', areaM2: 18 },
    { name: 'Bad', areaM2: 8 }
  ]);

  const energyResult = useMemo(
    () => calculateEnergy({ areaM2, yearCategory, insulationCm, housingType, region }),
    [areaM2, yearCategory, insulationCm, housingType, region]
  );

  const floorResult = useMemo(
    () =>
      floorMode === 'total'
        ? calculateFloorHeating({ mode: 'total', totalAreaM2: totalFloorArea, roomCount: totalRoomCount, construction })
        : calculateFloorHeating({ mode: 'room', rooms, construction }),
    [construction, floorMode, totalFloorArea, totalRoomCount, rooms]
  );

  const resultText = [
    `Effektbehov: ${energyResult.heatingDemandKw} kW`,
    `Arlig varmebehov: ${energyResult.annualHeatDemandKwh} kWh`,
    `Bergvarme anbefalt: ${energyResult.recommendedGroundSourceKw[0]}-${energyResult.recommendedGroundSourceKw[1]} kW`,
    `Luft-vann anbefalt: ${energyResult.recommendedAirWaterKw[0]}-${energyResult.recommendedAirWaterKw[1]} kW`,
    `Rorlengde gulvvarme: ${floorResult.totalPipeLengthM} m`,
    `Kurser: ${floorResult.circuits}`
  ].join('\n');

  const addRoom = () => setRooms((prev) => [...prev, { name: `Rom ${prev.length + 1}`, areaM2: 12 }]);

  return (
    <section className="section">
      <div className="container">
        <h1>Energy Calculator</h1>
        <p>Teknisk riktig energiberegning med norsk klimamodell, SPF-beregning og gulvvarme-materialliste.</p>

        <div className="split">
          <form className="panel">
            <h2>Energiberegning</h2>
            <label>
              Areal (m2)
              <input type="number" min={10} value={areaM2} onChange={(event) => setAreaM2(Number(event.target.value) || 0)} />
            </label>
            <label>
              Byggearskategori
              <select value={yearCategory} onChange={(event) => setYearCategory(event.target.value as BuildingYearCategory)}>
                {yearOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Etterisolering
              <select value={insulationCm} onChange={(event) => setInsulationCm(Number(event.target.value) as (typeof insulationOptions)[number])}>
                {insulationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option} cm
                  </option>
                ))}
              </select>
            </label>
            <label>
              Boligtype
              <select value={housingType} onChange={(event) => setHousingType(event.target.value as HousingType)}>
                {housingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Region
              <select value={region} onChange={(event) => setRegion(event.target.value as RegionKey)}>
                {Object.entries(regionMeta).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.name}
                  </option>
                ))}
              </select>
            </label>
          </form>

          <form className="panel">
            <h2>Gulvvarme kalkulator</h2>
            <label>
              Byggesystem
              <select value={construction} onChange={(event) => setConstruction(event.target.value as ConstructionSystem)}>
                <option value="concrete">Betong</option>
                <option value="wood">Tre</option>
              </select>
            </label>
            <label>
              Beregningsmodus
              <select value={floorMode} onChange={(event) => setFloorMode(event.target.value as 'total' | 'room')}>
                <option value="total">Totalareal</option>
                <option value="room">Rom for rom</option>
              </select>
            </label>

            {floorMode === 'total' ? (
              <>
                <label>
                  Totalareal (m2)
                  <input type="number" min={1} value={totalFloorArea} onChange={(event) => setTotalFloorArea(Number(event.target.value) || 0)} />
                </label>
                <label>
                  Antall rom
                  <input type="number" min={1} value={totalRoomCount} onChange={(event) => setTotalRoomCount(Number(event.target.value) || 1)} />
                </label>
              </>
            ) : (
              <div className="room-list">
                {rooms.map((room, index) => (
                  <div className="room-row" key={`${room.name}-${index}`}>
                    <input
                      value={room.name}
                      onChange={(event) =>
                        setRooms((prev) => prev.map((item, i) => (i === index ? { ...item, name: event.target.value } : item)))
                      }
                    />
                    <input
                      type="number"
                      min={1}
                      value={room.areaM2}
                      onChange={(event) =>
                        setRooms((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, areaM2: Number(event.target.value) || 0 } : item))
                        )
                      }
                    />
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => setRooms((prev) => prev.filter((_, i) => i !== index))}
                    >
                      Fjern
                    </button>
                  </div>
                ))}
                <button className="btn btn-secondary" type="button" onClick={addRoom}>
                  Legg til rom
                </button>
              </div>
            )}
          </form>
        </div>

        <section className="section panel print-area">
          <h2>Resultatoversikt</h2>
          <div className="result-grid">
            <div>
              <h3>Energi</h3>
              <p>Valgt region: {regionMeta[region].name}</p>
              <p>Byggearskategori: {yearOptions.find((item) => item.value === yearCategory)?.label}</p>
              <p>Etterisolering: {insulationCm} cm</p>
              <p>Boligtypejustering: {housingOptions.find((item) => item.value === housingType)?.label}</p>
              <p>Spisslast: {energyResult.heatingDemandKw} kW</p>
              <p>Arlig varmebehov: {energyResult.annualHeatDemandKwh} kWh</p>
              <p>Estimert strombruk luft-vann: {energyResult.savings.airWater.electricityUse} kWh</p>
              <p>Energibesparelse luft-vann: {energyResult.savings.airWater.savedEnergy} kWh ({Math.round(energyResult.savings.airWater.savingsPercentage * 100)}%)</p>
              <p>Estimert strombruk bergvarme: {energyResult.savings.groundSource.electricityUse} kWh</p>
              <p>Energibesparelse bergvarme: {energyResult.savings.groundSource.savedEnergy} kWh ({Math.round(energyResult.savings.groundSource.savingsPercentage * 100)}%)</p>
              <p>Anbefalt bergvarmepumpe: {energyResult.recommendedGroundSourceKw[0]}-{energyResult.recommendedGroundSourceKw[1]} kW</p>
              <p>Anbefalt luft-vann varmepumpe: {energyResult.recommendedAirWaterKw[0]}-{energyResult.recommendedAirWaterKw[1]} kW</p>
            </div>
            <div>
              <h3>Gulvvarme</h3>
              <p>Rorlengde: {floorResult.totalPipeLengthM} m</p>
              <p>Kurser: {floorResult.circuits}</p>
              <p>Fordelere: {floorResult.manifolds}</p>
              <p>Aktuatorer: {floorResult.actuators}</p>
              <p>Termostater: {floorResult.thermostats}</p>
              <p>Styreenheter: {floorResult.controlUnits}</p>
              <p>Boyeledere: {floorResult.bendGuides}</p>
              <h4>Materialer ({construction === 'concrete' ? 'Betong' : 'Tre'})</h4>
              {Object.entries(floorResult.materials).map(([name, quantity]) => (
                <p key={name}>
                  {name}: {quantity}
                </p>
              ))}
            </div>
          </div>
          <div className="cta-row">
            <a className="btn btn-primary" href="/contact">
              Kontakt Therwatt
            </a>
            <button className="btn btn-secondary" onClick={() => window.print()}>
              Skriv ut resultat
            </button>
          </div>
        </section>

        <section className="section panel">
          <h2>Send resultat som lead</h2>
          <LeadForm
            selectedRegion={regionMeta[region].name}
            calculationResults={resultText}
            recommendedSystem={`Bergvarme ${energyResult.recommendedGroundSourceKw[0]}-${energyResult.recommendedGroundSourceKw[1]} kW, Luft-vann ${energyResult.recommendedAirWaterKw[0]}-${energyResult.recommendedAirWaterKw[1]} kW`}
          />
        </section>
      </div>
    </section>
  );
};
