import { EXERCISES } from '@/programs'

/** Human labels for the free-form equipment keys authored in `src/programs/*`. */
const LABELS: Record<string, string> = {
  'ankle-weight': 'Ankle weights',
  ball: 'Exercise ball',
  band: 'Resistance band',
  barbell: 'Barbell',
  basketball: 'Basketball',
  bench: 'Bench',
  box: 'Plyo box',
  cones: 'Cones',
  court: 'Court access',
  dumbbell: 'Dumbbells',
  elliptical: 'Elliptical',
  flexbar: 'FlexBar',
  'foam-pad': 'Foam pad',
  'foam-roller': 'Foam roller',
  gripper: 'Hand gripper',
  hammer: 'Hammer',
  hangboard: 'Hangboard',
  'hr-monitor': 'Heart-rate monitor',
  'ice-pack': 'Ice pack',
  'jump-rope': 'Jump rope',
  kettlebell: 'Kettlebell',
  landmine: 'Landmine',
  'massage-ball': 'Massage ball',
  mat: 'Mat',
  'med-ball': 'Medicine ball',
  'mini-band': 'Mini band',
  'nordic-anchor': 'Nordic anchor',
  paddle: 'Pickleball paddle',
  parallettes: 'Parallettes',
  'pinch-block': 'Pinch block',
  peloton: 'Peloton',
  'pull-up-bar': 'Pull-up bar',
  putty: 'Therapy putty',
  'rice-bucket': 'Rice bucket',
  sled: 'Sled',
  step: 'Step / stairs',
  'stress-ball': 'Stress ball',
  tape: 'Athletic tape',
  towel: 'Towel',
  treadmill: 'Treadmill',
  trx: 'TRX / suspension trainer',
  'weight-vest': 'Weight vest',
  'wrist-roller': 'Wrist roller',
}

export function equipmentLabel(key: string): string {
  return LABELS[key] ?? key.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase())
}

/** Every equipment key any authored exercise asks for, sorted by label. */
export function allEquipmentKeys(): string[] {
  const keys = new Set<string>()
  for (const ex of Object.values(EXERCISES)) for (const e of ex.equipment ?? []) keys.add(e)
  return [...keys].sort((a, b) => equipmentLabel(a).localeCompare(equipmentLabel(b)))
}
