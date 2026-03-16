export type BuildingYearCategory = 'before1950' | '1950_1970' | '1970_1990' | '1990_2010' | '2010_2017' | '2017_plus';
export type HousingType = 'apartment' | 'semi_detached' | 'detached';
export type RegionKey =
  | 'sorlandet_vestland_kyst'
  | 'ostlandet_lavland'
  | 'innlandet'
  | 'trondelag'
  | 'nord_norge_kyst'
  | 'nord_norge_innland'
  | 'fjellomrader';

const wattByYear: Record<BuildingYearCategory, number> = {
  before1950: 100,
  '1950_1970': 70,
  '1970_1990': 55,
  '1990_2010': 45,
  '2010_2017': 35,
  '2017_plus': 27
};

const yearOrder: BuildingYearCategory[] = [
  'before1950',
  '1950_1970',
  '1970_1990',
  '1990_2010',
  '2010_2017',
  '2017_plus'
];

const housingAdjustment: Record<HousingType, number> = {
  apartment: 0.8,
  semi_detached: 0.9,
  detached: 1
};

export const regionMeta: Record<RegionKey, { name: string; climateFactor: number; runtimeHours: number }> = {
  sorlandet_vestland_kyst: { name: 'Sorlandet / Vestland kyst', climateFactor: 0.9, runtimeHours: 1800 },
  ostlandet_lavland: { name: 'Ostlandet lavland', climateFactor: 1, runtimeHours: 2200 },
  innlandet: { name: 'Innlandet', climateFactor: 1.1, runtimeHours: 2500 },
  trondelag: { name: 'Trondelag', climateFactor: 1.05, runtimeHours: 2300 },
  nord_norge_kyst: { name: 'Nord-Norge kyst', climateFactor: 1.1, runtimeHours: 2500 },
  nord_norge_innland: { name: 'Nord-Norge innland', climateFactor: 1.2, runtimeHours: 2700 },
  fjellomrader: { name: 'Fjellomrader', climateFactor: 1.25, runtimeHours: 2800 }
};

type EnergyInput = {
  areaM2: number;
  yearCategory: BuildingYearCategory;
  insulationCm: 0 | 5 | 10 | 15 | 20;
  housingType: HousingType;
  region: RegionKey;
};

export type EnergyResult = {
  baseWattPerM2: number;
  adjustedYearCategory: BuildingYearCategory;
  adjustedWattPerM2: number;
  heatingDemandWatt: number;
  heatingDemandKw: number;
  annualHeatDemandKwh: number;
  recommendedGroundSourceKw: [number, number];
  recommendedAirWaterKw: [number, number];
  savings: {
    airWater: { electricityUse: number; savedEnergy: number; savingsPercentage: number };
    groundSource: { electricityUse: number; savedEnergy: number; savingsPercentage: number };
  };
};

const round = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

const advanceYearCategory = (category: BuildingYearCategory, insulationCm: EnergyInput['insulationCm']) => {
  const jumps = insulationCm / 5;
  const idx = yearOrder.indexOf(category);
  return yearOrder[Math.min(yearOrder.length - 1, idx + jumps)];
};

const calculateSavings = (annualHeatDemandKwh: number, spf: number) => {
  const electricityUse = round(annualHeatDemandKwh / spf);
  const savedEnergy = Math.min(round(annualHeatDemandKwh - electricityUse), annualHeatDemandKwh);
  const savingsPercentage = round(savedEnergy / annualHeatDemandKwh);
  return { electricityUse, savedEnergy, savingsPercentage };
};

export const calculateEnergy = (input: EnergyInput): EnergyResult => {
  const baseWattPerM2 = wattByYear[input.yearCategory];
  const adjustedYearCategory = advanceYearCategory(input.yearCategory, input.insulationCm);
  const adjustedWattPerM2 = wattByYear[adjustedYearCategory] * housingAdjustment[input.housingType] * regionMeta[input.region].climateFactor;
  const heatingDemandWatt = round(input.areaM2 * adjustedWattPerM2);
  const heatingDemandKw = round(heatingDemandWatt / 1000);
  const annualHeatDemandKwh = round(heatingDemandKw * regionMeta[input.region].runtimeHours);

  return {
    baseWattPerM2,
    adjustedYearCategory,
    adjustedWattPerM2: round(adjustedWattPerM2),
    heatingDemandWatt,
    heatingDemandKw,
    annualHeatDemandKwh,
    recommendedGroundSourceKw: [round(heatingDemandKw * 0.75), round(heatingDemandKw * 0.85)],
    recommendedAirWaterKw: [round(heatingDemandKw * 0.95), round(heatingDemandKw * 1.05)],
    savings: {
      airWater: calculateSavings(annualHeatDemandKwh, 2.8),
      groundSource: calculateSavings(annualHeatDemandKwh, 3.5)
    }
  };
};
