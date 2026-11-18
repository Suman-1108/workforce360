export interface SizeChartRow {
  size: string
  chest: string
  chestCm: string
  waist: string
  waistCm: string
  hip: string
  hipCm: string
  inseam: string
  inseamCm: string
}

export interface HowToMeasureItem {
  key: string
  label: string
  instruction: string
}

export interface ProductFeature {
  id: string
  title: string
  shortDesc: string
  icon: 'shield' | 'eye' | 'layers' | 'wind' | 'cloud-rain'
}

export interface ModelDetails {
  name: string
  gender: string
  height: string
  weight: string
  bodyType: string
  shirtSize: string
  trouserSize: string
  fitNotes: string[]
}

export interface FactoryUniformPreset {
  id: string
  name: string
  code: string
  category: string
  gender_group: string
  model_image_url: string
  description: string
  colors: string
  sizes_available: string
  total_stock: number
  available_stock: number
  distributed_stock: number
  is_active: boolean
  features: string[]
  components: Array<{
    type: 'top' | 'bottom' | 'outerwear' | 'shoes' | 'accessory'
    label: string
    color: string
    sizes: string
    image_url: string
  }>
}

export const WORKER_SIZE_CHART: SizeChartRow[] = [
  { size: 'S', chest: '38-40', chestCm: '96-101', waist: '28-30', waistCm: '71-76', hip: '40-42', hipCm: '101-106', inseam: '29.5', inseamCm: '75' },
  { size: 'M', chest: '40-42', chestCm: '101-106', waist: '30-32', waistCm: '76-81', hip: '42-44', hipCm: '106-111', inseam: '30.0', inseamCm: '76' },
  { size: 'L', chest: '42-44', chestCm: '106-111', waist: '32-34', waistCm: '81-86', hip: '44-46', hipCm: '111-116', inseam: '30.5', inseamCm: '77' },
  { size: 'XL', chest: '44-46', chestCm: '111-116', waist: '34-36', waistCm: '86-91', hip: '46-48', hipCm: '116-121', inseam: '31.0', inseamCm: '78' },
  { size: 'XXL', chest: '46-48', chestCm: '116-121', waist: '36-38', waistCm: '91-96', hip: '48-50', hipCm: '121-127', inseam: '31.5', inseamCm: '80' },
  { size: '3XL', chest: '48-50', chestCm: '121-127', waist: '38-40', waistCm: '96-101', hip: '50-52', hipCm: '127-132', inseam: '32.0', inseamCm: '81' },
]

export const HOW_TO_MEASURE_GUIDE: HowToMeasureItem[] = [
  { key: 'A', label: 'Chest', instruction: 'Measure around the fullest part of your chest, keeping tape horizontal under arms.' },
  { key: 'B', label: 'Waist', instruction: 'Measure around your natural waistline, where your trousers comfortably sit.' },
  { key: 'C', label: 'Hip', instruction: 'Measure around the fullest part of your hips and seat.' },
  { key: 'D', label: 'Inseam', instruction: 'Measure from the top of your inner thigh down to the bottom edge of the ankle.' },
]

export const PRODUCT_FEATURES: ProductFeature[] = [
  { id: 'durable', title: 'Durable Fabric', shortDesc: 'Tear-resistant heavy-duty poly-cotton twill', icon: 'shield' },
  { id: 'highvis', title: 'High Visibility', shortDesc: 'EN ISO 20471 Class 2 3M reflective tape bands', icon: 'eye' },
  { id: 'pockets', title: 'Multiple Pockets', shortDesc: 'Deep tool pockets, cargo bellows & chest flaps', icon: 'layers' },
  { id: 'breathable', title: 'Breathable Material', shortDesc: 'Underarm eyelet vents & moisture-wicking weave', icon: 'wind' },
  { id: 'weather', title: 'Weather Resistant', shortDesc: 'Industrial dust, water & grease repellent finish', icon: 'cloud-rain' },
]

export const MODEL_FIT_REFERENCE: ModelDetails = {
  name: 'MISBAH',
  gender: 'Female (Unisex Standard Fit)',
  height: "5 Feet 9 Inch (175 cm)",
  weight: '62 kg',
  bodyType: 'Athletic',
  shirtSize: 'M',
  trouserSize: 'M',
  fitNotes: [
    'Model is wearing size M in the reference photography.',
    'Shirt & trouser engineered for maximum mobility, climbing, and squatting comfort.',
    'Ideal for factory assembly, industrial warehousing, and all-day outdoor shifts.',
    'High visibility dual-band reflectors guarantee compliance in low light zones.',
    'Durable tear-resistant fabric tailored with a relaxed, non-restrictive work fit.',
    'Note: If your measurements fall between sizes, we recommend sizing up for a relaxed fit over base layers.'
  ],
}

export const FACTORY_UNIFORM_PRESETS: FactoryUniformPreset[] = [
  {
    id: 'preset-elite-worker',
    name: 'Elite Worker High-Vis Shirt & Trouser Set',
    code: 'UNIF-IND-01',
    category: 'Operations & Warehouse',
    gender_group: 'Unisex (Athletic / Standard Fit)',
    model_image_url: '/uniforms/worker-fit-guide.jpg',
    description: 'Standard-issue industrial worker two-piece uniform. Features high-visibility 3M reflective tape, durable ripstop fabric, multiple tool pockets, ventilated mesh underarms, and weather-resistant finish. Paired with heavy-duty cargo trousers.',
    colors: 'Fluorescent Lime Yellow & Charcoal Black',
    sizes_available: 'S, M, L, XL, XXL, 3XL',
    total_stock: 250,
    available_stock: 238,
    distributed_stock: 12,
    is_active: true,
    features: [
      'EN ISO 20471 Class 2 High-Vis Compliance',
      'Dual 3M Scotchlite Reflective Safety Stripes',
      'Triple-Stitched Heavy Duty Cargo Trousers',
      'Reinforced Knee Pad Pockets & Tool Loops',
      'Soil & Grease Release Fabric Finish'
    ],
    components: [
      {
        type: 'top',
        label: 'High-Vis Two-Tone Worker Shirt',
        color: 'Fluorescent Lime & Silver Tape',
        sizes: 'S, M, L, XL, XXL, 3XL',
        image_url: '/uniforms/worker-fit-guide.jpg'
      },
      {
        type: 'bottom',
        label: 'Heavy-Duty Cargo Work Trousers',
        color: 'Charcoal Black with Knee Reflective Band',
        sizes: '28, 30, 32, 34, 36, 38, 40',
        image_url: '/uniforms/worker-fit-guide.jpg'
      },
      {
        type: 'shoes',
        label: 'Steel-Toe Factory Safety Boots',
        color: 'Industrial Matte Black',
        sizes: '7, 8, 9, 10, 11, 12',
        image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80'
      },
      {
        type: 'accessory',
        label: 'Industrial Safety Helmet & High-Dexterity Work Gloves',
        color: 'Hi-Vis Safety Yellow / Black',
        sizes: 'Universal Adjustable',
        image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'preset-boiler-suit',
    name: 'Factory Heavy-Duty Boiler Suit & Coverall',
    code: 'UNIF-IND-02',
    category: 'Industrial & Mechanical Floor',
    gender_group: 'Unisex Standard Fit',
    model_image_url: '/uniforms/worker-fit-guide.jpg',
    description: 'Full-body protective action-back coverall engineered for heavy factory manufacturing, machine assembly, and plant operations. Flame-retardant treated poly-cotton with reinforced knee patches.',
    colors: 'Navy Blue & Safety Orange',
    sizes_available: 'S, M, L, XL, XXL, 3XL',
    total_stock: 180,
    available_stock: 172,
    distributed_stock: 8,
    is_active: true,
    features: [
      'Two-Way Heavy-Duty Brass Zipper with Storm Flap',
      'Action Back Pleats for Overhead Reach Flexibility',
      'Rule & Spanner Utility Tool Pockets',
      'Flame & Heat Retardant Treated 300 GSM Twill',
      'High-Impact Visibility Contrast Piping'
    ],
    components: [
      {
        type: 'outerwear',
        label: 'Action-Back Industrial Boiler Suit',
        color: 'Navy Blue & Orange Accents',
        sizes: 'S, M, L, XL, XXL, 3XL',
        image_url: '/uniforms/worker-fit-guide.jpg'
      },
      {
        type: 'shoes',
        label: 'Chemical & Oil Resistant Safety Boots',
        color: 'Dark Brown Leather',
        sizes: '7, 8, 9, 10, 11, 12',
        image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80'
      },
      {
        type: 'accessory',
        label: 'Anti-Fog Impact Polycarbonate Goggles',
        color: 'Clear Anti-Scratch',
        sizes: 'Universal Strap',
        image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'preset-logistics-vest',
    name: 'Warehouse Rapid Logistics High-Vis Vest & Cargo Set',
    code: 'UNIF-IND-03',
    category: 'Logistics & Warehouse Operations',
    gender_group: 'Unisex Standard Fit',
    model_image_url: '/uniforms/worker-fit-guide.jpg',
    description: 'Logistics dispatch uniform kit featuring lightweight zip-front Class 2 high-vis vest with transparent badge sleeve, tactical pen holders, breathable operations polo, and tear-resistant cargo work trousers.',
    colors: 'Neon Safety Orange & Black',
    sizes_available: 'S, M, L, XL, XXL',
    total_stock: 200,
    available_stock: 185,
    distributed_stock: 15,
    is_active: true,
    features: [
      'Breathable Micro-Mesh Cooling Fabric for Active Pickers',
      'Transparent Plastic ID Badge Pocket & Mic Clip Loops',
      'Dual Front Flap Pockets Fits Handheld Barcode Scanners',
      'Heavy-Duty Double-Stitched Pockets for Heavy Scanners',
      'Quick-Drying Poly Fabric with Anti-Static Treatment'
    ],
    components: [
      {
        type: 'outerwear',
        label: 'Zip-Front Class 2 Logistics Vest',
        color: 'Fluorescent Safety Orange',
        sizes: 'S, M, L, XL, XXL',
        image_url: '/uniforms/worker-fit-guide.jpg'
      },
      {
        type: 'top',
        label: 'Breathable Logistics Operations Polo',
        color: 'Graphite Black',
        sizes: 'S, M, L, XL, XXL',
        image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80'
      },
      {
        type: 'bottom',
        label: 'Multi-Pocket Cargo Logistics Trousers',
        color: 'Charcoal Black',
        sizes: '30, 32, 34, 36, 38',
        image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&auto=format&fit=crop&q=80'
      }
    ]
  }
]
