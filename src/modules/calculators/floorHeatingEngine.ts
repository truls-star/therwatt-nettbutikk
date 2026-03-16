export type ConstructionSystem = 'concrete' | 'wood';

export type RoomInput = {
  name: string;
  areaM2: number;
};

export type FloorHeatingInput =
  | {
      mode: 'total';
      totalAreaM2: number;
      roomCount: number;
      construction: ConstructionSystem;
    }
  | {
      mode: 'room';
      rooms: RoomInput[];
      construction: ConstructionSystem;
    };

export type FloorHeatingResult = {
  totalAreaM2: number;
  roomCount: number;
  totalPipeLengthM: number;
  circuits: number;
  manifolds: number;
  actuators: number;
  thermostats: number;
  controlUnits: number;
  bendGuides: number;
  materials: Record<string, number>;
};

const PIPE_PER_M2 = 5.5;
const MAX_PIPE_PER_CIRCUIT = 100;

const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const baseCircuitsForRoom = (area: number) => {
  if (area <= 16.5) return 1;
  if (area <= 33) return 2;
  return 3;
};

const toRooms = (input: FloorHeatingInput): RoomInput[] => {
  if (input.mode === 'room') return input.rooms.filter((room) => room.areaM2 > 0);

  const roomCount = Math.max(1, Math.floor(input.roomCount));
  const roomArea = input.totalAreaM2 / roomCount;
  return Array.from({ length: roomCount }, (_, index) => ({
    name: `Sone ${index + 1}`,
    areaM2: roomArea
  }));
};

export const calculateFloorHeating = (input: FloorHeatingInput): FloorHeatingResult => {
  const rooms = toRooms(input);
  const totalAreaM2 = round(rooms.reduce((sum, room) => sum + room.areaM2, 0));
  const totalPipeLengthM = round(totalAreaM2 * PIPE_PER_M2);

  let circuits = rooms.reduce((sum, room) => sum + baseCircuitsForRoom(room.areaM2), 0);

  while (totalPipeLengthM / circuits > MAX_PIPE_PER_CIRCUIT) {
    circuits += 1;
  }

  const roomCount = rooms.length;
  const materials: Record<string, number> = {};

  if (input.construction === 'concrete') {
    materials['Klips'] = Math.ceil(totalAreaM2 * 12);
    materials['Nub board'] = Math.ceil(totalAreaM2 / 1.2);
  }

  if (input.construction === 'wood') {
    materials['Aluminiumsplater'] = Math.ceil(totalAreaM2 * 5);
    materials['EPS-plater'] = Math.ceil(totalAreaM2 / 0.7);
  }

  return {
    totalAreaM2,
    roomCount,
    totalPipeLengthM,
    circuits,
    manifolds: Math.ceil(circuits / 12),
    actuators: circuits,
    thermostats: roomCount,
    controlUnits: Math.ceil(roomCount / 8),
    bendGuides: circuits * 2,
    materials
  };
};
