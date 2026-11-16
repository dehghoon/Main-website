import { additionalWorkbooks } from './additional-workbooks.ts';

export const workbookCategories = {
  loads: 'Wind, Snow & Building Loads',
  analysis: 'Structural Analysis',
  steel: 'Steel & Connections',
  concrete: 'Concrete & Masonry',
  foundations: 'Foundations & Retaining Walls',
  references: 'References & Templates',
} as const;

export type Workbook = {
  id: string;
  category: keyof typeof workbookCategories;
  title: string;
  summary: string;
  keywords: readonly string[];
  inputs?: string;
  outputs?: string;
  guides: readonly string[];
  note?: string;
};

export const workbooks: readonly Workbook[] = [
  {
    id: 'wind-asce-7-10', category: 'loads', title: 'ASCE 7-10 Wind Loads',
    summary: 'A historical workbook with separate main wind-force resisting system and gust-effect sheets.',
    keywords: ['wind pressure', 'MWFRS', 'gust effect', 'wind speed', 'exposure', 'ASCE 7-10'],
    inputs: 'The Basic Parameters block lists risk category, basic wind speed, exposure, topography and enclosure. The separate Gust Effect tab lists geometry, frequency and damping.',
    outputs: 'See the MWFRS tabs for the building and trussed tower calculations and the Gust Effect tab for the dynamic calculation.',
    guides: ['wind-load-path'], note: 'The source contains VBA and project-specific fields. The example predates current editions of ASCE 7.',
  },
  {
    id: 'roof-snow-distributions', category: 'loads', title: 'Roof Snow and Drift Worksheets',
    summary: 'Compare the uniform, parapet and lower-roof snow load worksheet layouts.',
    keywords: ['snow drift', 'roof snow', 'rain load', 'parapet', 'lower roof'],
    inputs: 'Choose the tab for the roof condition. Locate ground snow, associated rain, roof factors and the dimensions of height changes or obstructions.',
    outputs: 'Read the uniform roof load on the uniform tab and the distribution results on the geometry-specific tabs.',
    guides: ['roof-snow-loads', 'solar-mounting-and-structural-loads'],
  },
  {
    id: 'multi-span-beam-analysis', category: 'analysis', title: 'Multi-Span Beam Analysis',
    summary: 'A workbook with built-in instructions for entering spans and load patterns before running analysis in Excel.',
    keywords: ['moment distribution', 'beam deflection', 'continuous beam', 'shear force'],
    inputs: 'The first tab explains the span input block and the point, uniform line and linearly varying load patterns.',
    outputs: 'The workbook instructions identify an Analyse command that generates shear, moment and deflection results. That command was not executed in this review.',
    guides: [],
  },
  {
    id: 'single-plate-shear-connection', category: 'steel', title: 'Single-Plate Shear Connection',
    summary: 'An AISC 360-16 LRFD check sheet for a bolted single-plate connection.',
    keywords: ['shear tab', 'bolts', 'bolt bearing', 'tearout', 'weld', 'AISC 360-16'],
    inputs: 'Start with connection geometry, bolt and plate information, bearing type and applied beam shear on Bolt Check.',
    outputs: 'Read the bolt shear, slip, plate bearing and tearout sections, then the plate and weld checks and the limit-state summary.',
    guides: ['steel-shear-plate-connections'], note: 'The workbook is tied to the AISC 360-16 edition.',
  },
  {
    id: 'fillet-weld-strength', category: 'steel', title: 'Fillet Weld Strength',
    summary: 'A compact worksheet for reviewing how a fillet weld strength calculation is organized.',
    keywords: ['weld length', 'weld group', 'steel connections', 'weld orientation'],
    inputs: 'Start on the single calculation tab and identify the weld inputs and the factor noted for welds with multiple orientations.',
    outputs: 'Read the result block on the same tab. Verify the units and applicable weld configuration in the original file.',
    guides: ['structural-welding-references'],
  },
  {
    id: 'concrete-beam-reinforcement', category: 'concrete', title: 'Concrete Beam Reinforcement',
    summary: 'Separate sheets for metric, bundled and US bar layouts, with companion skin and hanger reinforcement tabs.',
    keywords: ['RC beam', 'metric reinforcing bars', 'bundled bars', 'tension steel', 'compression steel'],
    inputs: 'Select the tab for the bar system and locate the tension and compression reinforcement blocks before comparing layouts.',
    outputs: 'Review the outputs on the chosen bar tab. Skin Reinforcing and Hanger Steel are separate tabs.',
    guides: ['reinforcement-detailing'],
  },
  {
    id: 'rc-flexure-shear-capacity', category: 'concrete', title: 'RC Flexure and Shear Capacity',
    summary: 'A macro-enabled workbook with concrete section inputs and separate bending and shear blocks.',
    keywords: ['concrete beam', 'CSA A23.3', 'ACI', 'section properties', 'shear capacity', 'bending'],
    inputs: 'Start with Inputs and Section Properties on the main tab. Check the rebar layout and the demand used in each calculation block.',
    outputs: 'Review the bending force block and the separate CSA simplified, CSA general and ACI shear sections.',
    guides: ['reinforcement-detailing'], note: 'Contains VBA. Results and macro-dependent controls were not verified.',
  },
  {
    id: 'concrete-interface-shear', category: 'concrete', title: 'Concrete Interface Shear',
    summary: 'Two worksheet layouts for concrete interface shear, including a beam-specific tab.',
    keywords: ['shear friction', 'concrete interface', 'anchored to steel', 'construction joint'],
    inputs: 'Choose Interface Shear or Interface Shear (Beam). Check that the interface condition in the sheet matches the case being reviewed.',
    outputs: 'The selected tab contains the calculation and its output. Check the stated interface assumptions before comparing cases.',
    guides: ['structural-and-concrete-joints'],
  },
  {
    id: 'masonry-pier-checks', category: 'concrete', title: 'Masonry Pier Checks',
    summary: 'A pier design worksheet with distinct masonry shear and sliding resistance sections.',
    keywords: ['masonry wall', 'pier', 'sliding', 'masonry shear'],
    inputs: 'Open Pier Design and review the pier data and assumptions shown beside each check.',
    outputs: 'Read Shear Sliding Resistance and Masonry Shear Strength separately. The sheet explicitly notes an omission of dead-load effects in one block.',
    guides: ['masonry-structural-design'],
  },
  {
    id: 'slab-punching-shear', category: 'concrete', title: 'Slab Punching Shear and Reinforcement',
    summary: 'A worksheet for recording slab punching stress and reviewing reinforcement options.',
    keywords: ['punching shear', 'shear studs', 'shear reinforcement', 'RAM Concept', 'ACI 318M-11'],
    inputs: 'Start with General Input and locate the slab geometry, cover and the applied punching stress used in the workbook.',
    outputs: 'Read the concrete-only and combined resistance sections, then the required reinforcement blocks for reinforcing bars and headed studs.',
    guides: ['floor-slabs'], note: 'The source is based on ACI 318M-11.',
  },
  {
    id: 'beam-ledge', category: 'concrete', title: 'Reinforced Concrete Beam Ledge',
    summary: 'An SI workbook example that organizes ledge reinforcement, punching shear and bearing checks.',
    keywords: ['beam ledge', 'bearing pad', 'hanger reinforcement', 'corbel', 'ACI 318M-11'],
    inputs: 'Use the Input block on Beam Ledge Design. It shows ledge geometry, concrete and steel strengths, load locations, bearing-pad dimensions and vertical loads in SI units.',
    outputs: 'Follow the primary and horizontal reinforcement sections, then the punching shear, hanger reinforcement and bearing sections.',
    guides: ['precast-concrete'], note: 'The source is based on ACI 318M-11.',
  },
  {
    id: 'bracket-corbel', category: 'concrete', title: 'Reinforced Concrete Bracket and Corbel',
    summary: 'An SI workbook example covering reinforcement and bearing for a concrete bracket or corbel.',
    keywords: ['corbel', 'concrete bracket', 'bearing', 'shear friction', 'ACI 318M-11'],
    inputs: 'Review geometry, cover, material strengths, vertical load and horizontal tension under Input. The friction-surface selector is in the shear-friction section.',
    outputs: 'Follow the shear, moment and tension reinforcement sections, then primary reinforcement, horizontal ties, bearing and detailing.',
    guides: ['precast-concrete'], note: 'The source is based on ACI 318M-11.',
  },
  {
    id: 'footing-with-pier', category: 'foundations', title: 'Footing with Pier',
    summary: 'A macro-enabled footing workbook with distinct geotechnical, geometry and load inputs.',
    keywords: ['pier footing', 'soil bearing', 'two-way shear', 'SAP loads', 'foundation'],
    inputs: 'Start on Calculator under Geotechnical Inputs, Dimensional Inputs and Load Inputs. The workbook also has separate SAP LOADS and Pier Footing Sizes tabs.',
    outputs: 'Locate the soil bearing and two-way shear sections. The worksheet labels distinguish service and ultimate soil bearing.',
    guides: [], note: 'Contains VBA. Load import and other macro-dependent behavior were not exercised.',
  },
  {
    id: 'retaining-wall-checks', category: 'foundations', title: 'Retaining Wall Stability Checks',
    summary: 'Two populated worksheets that organize soil pressures and wall stability checks.',
    keywords: ['retaining wall', 'active pressure', 'passive pressure', 'overturning', 'bearing'],
    inputs: 'Locate wall height, allowable bearing pressure and active and passive soil pressure coefficients on the calculation tabs.',
    outputs: 'Read the bearing and overturning sections. Review the assumed soil case and dimensions before comparing outputs.',
    guides: ['retaining-wall'],
  },
  ...additionalWorkbooks,
];

export function workbookPath(id: string) {
  return `/learning/workbooks/${id}`;
}

export function getWorkbook(id: string) {
  return workbooks.find((workbook) => workbook.id === id);
}

export function filterWorkbooks(query: string, category: string) {
  const terms = query.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return workbooks.filter((workbook) => {
    if (category && workbook.category !== category) return false;
    const searchable = [workbook.title, workbook.summary, workbookCategories[workbook.category],
      workbook.inputs, workbook.outputs, ...workbook.keywords].join(' ').toLowerCase();
    return terms.every((term) => searchable.includes(term));
  });
}
