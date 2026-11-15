import type { Guide } from './guides.ts';

export const additionalGuides = {
  "solar-mounting-and-structural-loads": {
    "title": "Mapping Loads from Rooftop Solar Racks",
    "description": "Map rack reactions onto the existing roof framing. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "Solar Mounting and Structural Loads",
      "drift",
      "snow loads"
    ],
    "intro": "Map rack reactions onto the existing roof framing. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Roof plan, fixed ballast schedule and separate code-derived action cases.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Map rack reactions onto the existing roof framing.",
      "Identify patch loads and retain their footprint.",
      "Track rain, snow and wind cases separately in the load register."
    ],
    "exampleTitle": "Worked Example",
    "example": "Four assumed 0.6 kN ballast reactions bear on two parallel beams. If each beam receives two pads, each receives 1.2 kN before adding panels or roof self-weight. Swapping one pad to the other beam changes the split to 0.6 and 1.8 kN.",
    "check": "Reconcile roof and rack reactions. Obtain project-specific snow drift, uplift and drainage criteria from the governing basis.",
    "references": [
      [
        "ASCE 7 design loads",
        "https://www.asce.org/publications-and-news/asce-7",
        "Locate the load and edition provisions applicable to the roof and rack."
      ]
    ],
    "diagram": [
      "Pad map",
      "Load cases",
      "Roof framing",
      "Reaction sum"
    ],
    "photo": {
      "src": "/learning/photos/rooftop-solar.jpg",
      "alt": "Workers installing tilted photovoltaic panels on a roof",
      "width": 960,
      "height": 720,
      "credit": "Rooftop Photovoltaic Array by Lucas Braun (resized)",
      "source": "https://commons.wikimedia.org/wiki/File:Rooftop_Photovoltaic_Array.jpg",
      "license": [
        "CC BY-SA 3.0",
        "https://creativecommons.org/licenses/by-sa/3.0/"
      ]
    }
  },
  "underground-piping-and-civil-coordination": {
    "title": "Coordinating Buried Utilities at Crossings",
    "description": "Convert invert levels to outer pipe envelopes using verified wall and diameter data. Follow a worked example and check the result.",
    "level": "Beginner",
    "keywords": [
      "Underground Piping and Civil Coordination",
      "buckling",
      "corrosion"
    ],
    "intro": "Convert invert levels to outer pipe envelopes using verified wall and diameter data. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Survey datum, pipe outside diameters, two invert elevations and location confidence.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Convert invert levels to outer pipe envelopes using verified wall and diameter data.",
      "Compute the clear gap at the actual crossing.",
      "Record survey uncertainty and assign verification responsibility."
    ],
    "exampleTitle": "Worked Example",
    "example": "The surveyed outside top of the lower line is 102.14 m. The proposed outside bottom of the upper line is 102.42 m, giving 280 mm of vertical clearance. If the lower survey elevation can be 60 mm higher, 220 mm remains under that assumption.",
    "check": "Compare elevations in one datum. Record required clearance and field verification as separate items.",
    "references": [
      [
        "FHWA Subsurface Utility Engineering",
        "https://www.fhwa.dot.gov/innovation/everydaycounts/edc_8/subsurface_utility_engineering.cfm",
        "Review how utilities are located and documented for coordination."
      ]
    ],
    "diagram": [
      "Datum",
      "Two envelopes",
      "Clear gap",
      "Verify crossing"
    ],
    "video": [
      "FHWA: Subsurface Utility Engineering",
      "https://www.youtube.com/watch?v=uInuBty_y9k"
    ]
  },
  "composite-diaphragm": {
    "title": "Tracing Shear Through Composite Deck Diaphragms",
    "description": "Draw separate paths for deck shear, chord force and collectors. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "Composite Deck Diaphragms and Fasteners",
      "buckling",
      "steel deck"
    ],
    "intro": "Draw separate paths for deck shear, chord force and collectors. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "A diaphragm plan, support lines, idealized tributary forces and connection layout.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Draw separate paths for deck shear, chord force and collectors.",
      "Mark discontinuities at openings and transfer lines.",
      "Sum reactions before checking individual fasteners."
    ],
    "exampleTitle": "Worked Example",
    "example": "An idealized diaphragm delivers 80 kN to two reaction lines assumed equal for this exercise. Each takes 40 kN. If one line spreads its reaction uniformly over 8 m, the average is 5 kN/m. Local connections around an opening may have a different demand.",
    "check": "Verify equilibrium and record the assumptions behind the load split. Use the actual assembly and applicable provisions for capacity.",
    "references": [
      [
        "NIST technical brief on composite steel deck diaphragms",
        "https://www.nist.gov/publications/nehrp-seismic-design-technical-brief-no-5-seismic-design-composite-steel-deck-and",
        "Find the design brief for diaphragm forces, load transfer and detailing."
      ]
    ],
    "diagram": [
      "Deck field",
      "Collector",
      "Reaction line",
      "Vertical system"
    ],
    "video": [
      "Design of Steel Deck Diaphragms",
      "https://www.youtube.com/watch?v=f48wvyA7KAo"
    ]
  },
  "steel-deck-and-diaphragms": {
    "title": "Reviewing a Steel Deck Diaphragm Submittal",
    "description": "Tag deck profile, support attachment and sidelap attachment on the plan. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "Steel Deck and Diaphragms",
      "steel deck",
      "welding"
    ],
    "intro": "Tag deck profile, support attachment and sidelap attachment on the plan. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Deck plan, connection schedule, submitted assembly details and the design load path.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Tag deck profile, support attachment and sidelap attachment on the plan.",
      "Find their counterparts in the assembly documentation.",
      "Log mismatches without substituting attachment types."
    ],
    "exampleTitle": "Worked Example",
    "example": "A submitted assembly shows support attachment A and sidelap attachment B. The framing plan uses A at the supports and C at sidelaps. Mark the assembly as an open review item, even though deck profile and support attachment match.",
    "check": "Review end laps, perimeter transfer, collectors and openings separately from field fastening.",
    "references": [
      [
        "Steel Deck Institute design manuals",
        "https://sdi.org/design-manuals/",
        "Find the manual for the specified deck application. Use the matching manufacturer tables for product-specific ratings."
      ]
    ],
    "diagram": [
      "Deck profile",
      "Fastener schedule",
      "Assembly match",
      "Issue log"
    ],
    "video": [
      "Design of Steel Deck Diaphragms",
      "https://www.youtube.com/watch?v=f48wvyA7KAo"
    ]
  },
  "cold-formed-steel-design": {
    "title": "Checking Cold-Formed Stud Model Inputs",
    "description": "Identify which direction the section resists the modeled action. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "Cold-Formed Steel Design",
      "deflection",
      "steel framing"
    ],
    "intro": "Identify which direction the section resists the modeled action. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Stud layout, unbraced lengths, loading direction and supplier section data.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Identify which direction the section resists the modeled action.",
      "Record restraint, bridging and whether sheathing is assumed effective.",
      "Transfer tributary loading using consistent length units."
    ],
    "exampleTitle": "Worked Example",
    "example": "A nominal lateral pressure of 0.6 kPa on studs at 400 mm gives 0.24 kN/m per stud for an interior strip. In a 3 m simple-span check the two ideal reactions are 0.36 kN each.",
    "check": "Confirm effective section properties and governing buckling checks independently of the tributary-load calculation.",
    "references": [
      [
        "AISI cold-formed steel standards committees",
        "https://www.buildusingsteel.org/about-our-program/standards-committees/",
        "Locate AISI S240 for structural framing and check the edition and related member design standard."
      ]
    ],
    "diagram": [
      "Pressure",
      "Stud spacing",
      "Line load",
      "Reactions"
    ]
  },
  "steel-shear-plate-connections": {
    "title": "Reading Shear Plate Connection Load Paths",
    "description": "Draw a free-body diagram from beam web through bolts and plate to the support. Follow a worked example and check the result.",
    "level": "Advanced",
    "keywords": [
      "Steel Shear Plate Connections",
      "shear walls",
      "finite element"
    ],
    "intro": "Draw a free-body diagram from beam web through bolts and plate to the support. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "A beam-end reaction, connection sketch, bolt locations and weld layout.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Draw a free-body diagram from beam web through bolts and plate to the support.",
      "Locate the idealized reaction line relative to the weld group.",
      "List member, bolt, plate and weld checks separately."
    ],
    "exampleTitle": "Worked Example",
    "example": "A 48 kN vertical reaction applied 60 mm from a chosen reference line adds a 2.88 kN·m moment about that line. Show both actions on the sketch before selecting the connection analysis method.",
    "check": "Keep bolt count, load distribution, eccentricity and design basis explicit. A simple equal-share calculation alone does not establish capacity.",
    "references": [
      [
        "Canadian Institute of Steel Construction technical resources",
        "https://www.cisc-icca.ca/technical-resources/",
        "Find steel design, fabrication and connection resources for the application."
      ]
    ],
    "diagram": [
      "Beam web",
      "Bolts",
      "Plate and weld",
      "Support"
    ]
  },
  "load-tables-lrfd": {
    "title": "Reading a Steel Deck Load Table in LRFD",
    "description": "Read the table heading for resistance or load basis. Follow a worked example and check the result.",
    "level": "Advanced",
    "keywords": [
      "Load Tables LRFD",
      "deflection",
      "cold-formed steel"
    ],
    "intro": "Read the table heading for resistance or load basis. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Exact profile, support condition, span, load case and the table notes.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Read the table heading for resistance or load basis.",
      "Match span type and whether the load includes dead load.",
      "Compare values only after harmonizing demand and table basis."
    ],
    "exampleTitle": "Worked Example",
    "example": "A fictional table gives 4.2 kPa for a correctly matched factored total demand basis. A factored 3.4 kPa demand gives a ratio of 0.81. An adjacent 5.0 kPa serviceability value belongs to a separate comparison.",
    "check": "Record the applicable limit state and units with each ratio. Check every footnote that changes the scope.",
    "references": [
      [
        "Steel Deck Institute design manuals",
        "https://sdi.org/design-manuals/",
        "Find the manual for the specified deck application. Use the matching manufacturer tables for product-specific ratings."
      ]
    ],
    "diagram": [
      "Table heading",
      "Matching row",
      "Comparable demand",
      "Check ratio"
    ]
  },
  "floor-deck": {
    "title": "Separating Construction and Final Floor Deck Loads",
    "description": "Calculate nominal wet concrete weight for the represented geometry. Follow a worked example and check the result.",
    "level": "Advanced",
    "keywords": [
      "Floor Deck",
      "deflection",
      "cold-formed steel"
    ],
    "intro": "Calculate nominal wet concrete weight for the represented geometry. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Deck layout, pour thickness, concrete density, span and shoring assumptions.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Calculate nominal wet concrete weight for the represented geometry.",
      "Record temporary construction actions and shoring separately.",
      "Build an independent final-stage load case for the completed assembly."
    ],
    "exampleTitle": "Worked Example",
    "example": "For an extra 35 mm of normal-weight fresh concrete at an assumed 24 kN/m³, the increase is 0.84 kPa. A 2 m by 3 m tributary patch therefore adds 5.04 kN before other actions. Corrugation volume and construction loading require their own entries.",
    "check": "Check the deck stage and whether table loads include deck and concrete self-weight.",
    "references": [
      [
        "Steel Deck Institute design manuals",
        "https://sdi.org/design-manuals/",
        "Find the manual for the specified deck application. Use the matching manufacturer tables for product-specific ratings."
      ]
    ],
    "diagram": [
      "Pour geometry",
      "Wet weight",
      "Construction stage",
      "Final stage"
    ]
  },
  "roof-deck": {
    "title": "Checking Deck Continuity at Roof Openings",
    "description": "Mark which ribs are interrupted by the opening. Follow a worked example and check the result.",
    "level": "Beginner",
    "keywords": [
      "Roof Deck",
      "deflection",
      "load combinations"
    ],
    "intro": "Mark which ribs are interrupted by the opening. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Roof deck framing plan, sheet direction, proposed opening and support details.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Mark which ribs are interrupted by the opening.",
      "Identify the detail that transfers cut-rib reactions into supporting framing.",
      "Compare revised support conditions against the applicable roof-deck data."
    ],
    "exampleTitle": "Worked Example",
    "example": "An assumed opening interrupts two ribs, each modeled as delivering a 0.9 kN service reaction to a header. The header receives 1.8 kN from those reactions. Add its self-weight and track where the header reactions go.",
    "check": "Confirm that the assumed header exists and that deck shear transfer around the opening is addressed separately.",
    "references": [
      [
        "Steel Deck Institute design manuals",
        "https://sdi.org/design-manuals/",
        "Find the manual for the specified deck application. Use the matching manufacturer tables for product-specific ratings."
      ]
    ],
    "diagram": [
      "Rib direction",
      "Cut ribs",
      "Header",
      "Supporting frame"
    ]
  },
  "deep-dek-floor-deck-load-tables": {
    "title": "Comparing Deep Floor Deck Span Options",
    "description": "Record the intended stage and shoring for each span. Follow a worked example and check the result.",
    "level": "Advanced",
    "keywords": [
      "Deep Dek Floor Deck Load Tables",
      "reinforcement",
      "vibration"
    ],
    "intro": "Record the intended stage and shoring for each span. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Exact deck designation, number of spans, proposed clear spans and current manufacturer tables.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Record the intended stage and shoring for each span.",
      "Read the exact series and gauge row.",
      "Recheck an end bay if the interior bay assumes continuity."
    ],
    "exampleTitle": "Worked Example",
    "example": "A schematic layout has two interior spans of 4.5 m and a single end span of 3.7 m with a break in continuity. Enter the 3.7 m bay on the single-span sheet and the 4.5 m bays on the applicable continuity sheet instead of screening by longest span alone.",
    "check": "Reject a row if profile, gauge or shoring assumptions differ. Exercise spans imply no product rating.",
    "references": [
      [
        "Steel Deck Institute design manuals",
        "https://sdi.org/design-manuals/",
        "Find the manual for the specified deck application. Use the matching manufacturer tables for product-specific ratings."
      ]
    ],
    "diagram": [
      "Deck series",
      "Bay continuity",
      "Table row",
      "Exceptions"
    ]
  },
  "versa-dek-floor-deck-load-tables": {
    "title": "Comparing Floor Deck Slab Thicknesses",
    "description": "Map topping thickness and rib geometry to each option. Follow a worked example and check the result.",
    "level": "Beginner",
    "keywords": [
      "Versa Dek Floor Deck Load Tables",
      "deflection",
      "structural design"
    ],
    "intro": "Map topping thickness and rib geometry to each option. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Proposed deck series, slab sections and scope of the load table.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Map topping thickness and rib geometry to each option.",
      "Separate the material quantity comparison from deck capacity.",
      "Confirm the table is for the same load stage and composite action assumptions."
    ],
    "exampleTitle": "Worked Example",
    "example": "Two uniform topping options differ by 25 mm above the ribs. At 24 kN/m³ that difference adds 0.60 kPa, or 9 kN over 15 m². The rib volume is unchanged for this comparison.",
    "check": "Keep total depth and topping depth in separate columns. Obtain profile-specific tables for capacity.",
    "references": [
      [
        "Steel Deck Institute design manuals",
        "https://sdi.org/design-manuals/",
        "Find the manual for the specified deck application. Use the matching manufacturer tables for product-specific ratings."
      ]
    ],
    "diagram": [
      "Slab section",
      "Thickness delta",
      "Weight delta",
      "Table boundary"
    ]
  },
  "deep-dek-roof-deck-load-tables": {
    "title": "Reviewing Long-Span Roof Deck Zones",
    "description": "Map localized loading independently of the balanced case. Follow a worked example and check the result.",
    "level": "Beginner",
    "keywords": [
      "Deep Dek Roof Deck Load Tables",
      "deflection",
      "load combinations"
    ],
    "intro": "Map localized loading independently of the balanced case. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Roof plan, drift-zone extents, support layout and a current deck table.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Map localized loading independently of the balanced case.",
      "Identify which deck spans cross into each zone.",
      "Record where a uniform full-span table is inadequate for the modeled load pattern."
    ],
    "exampleTitle": "Worked Example",
    "example": "A 6 m span has an assumed 1.5 kPa surcharge on only the first 2 m. Over a 1 m strip, the added force is 3 kN at 1 m from the near support. For a simple span the added reactions are 2.5 and 0.5 kN.",
    "check": "Check the action basis and whether the published table covers partial-span loading. The example does not establish a code drift load.",
    "references": [
      [
        "Steel Deck Institute design manuals",
        "https://sdi.org/design-manuals/",
        "Find the manual for the specified deck application. Use the matching manufacturer tables for product-specific ratings."
      ]
    ],
    "diagram": [
      "Zone map",
      "Loaded strip",
      "Load centroid",
      "Reactions"
    ]
  },
  "concrete-abrasion-resistance": {
    "title": "Reviewing Concrete Slab Surface Wear",
    "description": "Distinguish abrasion-like wear from scaling, impact damage and settlement. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "Concrete Abrasion Resistance",
      "abrasion resistance",
      "LEED"
    ],
    "intro": "Distinguish abrasion-like wear from scaling, impact damage and settlement. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Usage map, photographs with scale, exposure history and baseline elevations.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Distinguish abrasion-like wear from scaling, impact damage and settlement.",
      "Measure condition at comparable marked stations.",
      "Record traffic pattern and schedule a repeat inspection."
    ],
    "exampleTitle": "Worked Example",
    "example": "A 2 m straightedge and gauge show a 3 mm depression at an assumed wheel path and 0.5 mm at an adjacent reference station. The difference is 2.5 mm, a screening observation to compare with the baseline rather than a cause diagnosis.",
    "check": "Repeat at marked points with consistent tools. Limit claims to measured condition until the cause is established.",
    "references": [
      [
        "ACI Committee 360 on slabs on ground",
        "https://www.concrete.org/getinvolved/committees/directoryofcommittees/acommitteehome.aspx?committee_code=C0036000",
        "Locate references for slab-on-ground design and distinguish these from suspended slab requirements."
      ]
    ],
    "diagram": [
      "Traffic path",
      "Measure wear",
      "Reference station",
      "Trend"
    ]
  },
  "structural-and-concrete-joints": {
    "title": "Mapping Concrete Joint Intent and Continuity",
    "description": "Classify each joint by intended function. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "Structural and Concrete Joints",
      "expansion joints",
      "masonry"
    ],
    "intro": "Classify each joint by intended function. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Slab plan, joint legend, joint section details and a finish coordination plan.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Classify each joint by intended function.",
      "Trace load transfer and restraint across the joint detail.",
      "Flag finish details that bridge an intended movement joint."
    ],
    "exampleTitle": "Worked Example",
    "example": "A 12 m by 8 m teaching plan has full-width joints at 4 m and 8 m along the long axis and one full-length joint down the middle. It contains six 4 m by 4 m panels. Tag the perimeter isolation details separately.",
    "check": "Compare the layout with sequence, openings and re-entrant corners. The illustrative layout is not a specification.",
    "references": [
      [
        "ACI guidance on joints in concrete flatwork",
        "https://www.concrete.org/frequentlyaskedquestions.aspx?faqid=663",
        "Find the referenced ACI guides for joint functions and detailing."
      ]
    ],
    "diagram": [
      "Joint legend",
      "Panel layout",
      "Transfer detail",
      "Finish interface"
    ]
  },
  "floor-slabs": {
    "title": "Reviewing Concentrated Loads on Concrete Floor Slabs",
    "description": "Identify whether the slab is suspended or supported by ground. Follow a worked example and check the result.",
    "level": "Beginner",
    "keywords": [
      "Floor Slabs",
      "reinforcement",
      "reinforced concrete"
    ],
    "intro": "Identify whether the slab is suspended or supported by ground. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Slab system identification, point loads, loaded areas and equipment layout.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Identify whether the slab is suspended or supported by ground.",
      "Map equipment feet relative to joints and edges.",
      "Document contact pressure separately from slab response."
    ],
    "exampleTitle": "Worked Example",
    "example": "A 12 kN assumed foot on a 150 mm square plate gives 12 divided by 0.0225, about 533 kPa average contact pressure assuming full contact. That pressure does not give slab punching or flexural resistance.",
    "check": "Verify slab type, real bearing footprint and the location of each foot relative to joints or reinforcement.",
    "references": [
      [
        "ACI Committee 360 on slabs on ground",
        "https://www.concrete.org/getinvolved/committees/directoryofcommittees/acommitteehome.aspx?committee_code=C0036000",
        "Locate references for slab-on-ground design and distinguish these from suspended slab requirements."
      ]
    ],
    "diagram": [
      "Equipment feet",
      "Contact area",
      "Slab system",
      "Local check"
    ]
  },
  "prefabricated-laminates": {
    "title": "Reviewing FRP Laminate Layouts for Concrete Repair",
    "description": "Map laminate strips against reinforcement and intended force direction. Follow a worked example and check the result.",
    "level": "Beginner",
    "keywords": [
      "Prefabricated Laminates",
      "safety factors",
      "material properties"
    ],
    "intro": "Map laminate strips against reinforcement and intended force direction. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Assessment sketch, proposed fiber direction and supplier system documentation.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Map laminate strips against reinforcement and intended force direction.",
      "Record terminations and substrate conditions.",
      "Distinguish installed coverage from effective resistance."
    ],
    "exampleTitle": "Worked Example",
    "example": "Four proposed strips each 100 mm wide by 2.4 m long cover 0.96 m² of nominal face area. If a 200 mm obstruction shortens one strip, coverage becomes 0.94 m². Log the affected termination separately.",
    "check": "Verify development, substrate condition and the complete qualified system with the responsible engineer.",
    "references": [
      [
        "ACI Committee 440 resources on external FRP strengthening",
        "https://www.concrete.org/getinvolved/committees/directoryofcommittees/acommitteehome.aspx?committee_code=C0440S00",
        "Find the external FRP strengthening documents for the proposed system."
      ]
    ],
    "diagram": [
      "Existing member",
      "Fiber layout",
      "Termination",
      "Review record"
    ],
    "video": [
      "Strengthening Concrete Structures with FRP Systems",
      "https://www.youtube.com/watch?v=VxjfIoStuKM"
    ]
  },
  "lighting-pole": {
    "title": "Checking Lighting Pole Base Actions",
    "description": "Sketch force elevations and directions. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "Lighting Pole",
      "wind loads",
      "concrete breakout"
    ],
    "intro": "Sketch force elevations and directions. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Pole geometry, fixture elevations and separately established horizontal actions.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Sketch force elevations and directions.",
      "Sum horizontal forces and base moments for the idealized case.",
      "Pass reactions to the base and foundation review with their sign convention."
    ],
    "exampleTitle": "Worked Example",
    "example": "A fixture applies an assumed 0.45 kN horizontal force at 8 m and the pole applies an assumed 0.65 kN at 4 m. If directions agree, base shear is 1.10 kN and overturning moment is 6.2 kN·m.",
    "check": "Track fixtures, mast arms, dynamics and load direction separately. Obtain applicable environmental and fatigue criteria for the actual pole.",
    "references": [
      [
        "NRC National Building Code of Canada publication record",
        "https://nrc-publications.canada.ca/eng/view/object/?id=adf1ad94-7ea8-4b08-a19f-653ebb7f45f6",
        "Locate the structural design provisions and confirm the edition adopted for the project."
      ]
    ],
    "diagram": [
      "Fixture and shaft",
      "Base shear",
      "Base moment",
      "Foundation"
    ],
    "photo": {
      "src": "/learning/photos/parking-lot-light.jpg",
      "alt": "Parking lot lighting pole seen from below",
      "width": 960,
      "height": 720,
      "credit": "Parking lot light by Logan M Diel",
      "source": "https://commons.wikimedia.org/wiki/File:Parking_lot_light,_sep_6_2026.jpg",
      "license": [
        "CC0 1.0",
        "https://creativecommons.org/publicdomain/zero/1.0/"
      ]
    }
  },
  "pipe-support-arrangement-review": {
    "title": "Reviewing Pipe Guides, Stops and Supports",
    "description": "Create a movement schedule for each support. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "Pipe Support Arrangement Review",
      "welding",
      "fabrication"
    ],
    "intro": "Create a movement schedule for each support. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Piping isometric, support tags, axis convention and a movement range from the piping team.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Create a movement schedule for each support.",
      "Assign slide, guide and stop directions by local axis.",
      "Compare cold and operating positions with physical clearances."
    ],
    "exampleTitle": "Worked Example",
    "example": "A pipe centerline is expected to move 18 mm in the positive longitudinal direction. A stop gap of 25 mm leaves 7 mm in the nominal sketch. If the as-installed gap can be 8 mm smaller, contact is possible in that tolerance case.",
    "check": "Ask the piping team to confirm sign, reference temperature and load cases before passing actions to structural supports.",
    "references": [
      [
        "Hilti specifications and CAD details",
        "https://www.hilti.ca/content/hilti/W1/CA/en/business/business/engineering/specifications-and-cad-details.html",
        "Compare the arrangement with current details for the actual support or fastening system."
      ]
    ],
    "diagram": [
      "Pipe axes",
      "Support function",
      "Travel check",
      "Reaction handoff"
    ]
  },
  "unistrut-channel-support-systems": {
    "title": "Checking Strut Channel Support Reactions",
    "description": "Separate the channel check from fittings, rods and anchors. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "Unistrut Channel Support Systems",
      "bolts",
      "grating"
    ],
    "intro": "Separate the channel check from fittings, rods and anchors. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Channel series, hanger spacing, threaded rod layout and accessory load documentation.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Separate the channel check from fittings, rods and anchors.",
      "Locate points of load application and potential torsion.",
      "Check simple equilibrium before comparing ratings."
    ],
    "exampleTitle": "Worked Example",
    "example": "A centered assumed load of 1.2 kN on a 1.5 m simply supported channel gives 0.6 kN at each hanger. If the bracket applies the same load 100 mm away from the channel axis it introduces another 0.12 kN·m about that axis.",
    "check": "Check table orientation, deflection basis, fitting configuration and substrate separately.",
    "references": [
      [
        "Atkore Unistrut support systems",
        "https://www.atkore.com/about-us/brands/unistrut",
        "Identify the relevant product family and current system documentation."
      ]
    ],
    "diagram": [
      "Attached load",
      "Channel",
      "Hangers",
      "Substrate"
    ]
  },
  "headed-studs-and-shear-connectors": {
    "title": "Reading Shear Stud Layouts on Composite Beams",
    "description": "Classify rib orientation and support geometry along each beam. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "Headed Studs and Shear Connectors",
      "welding",
      "shear strength"
    ],
    "intro": "Classify rib orientation and support geometry along each beam. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Beam plan, deck direction, connector callouts and a stud schedule.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Classify rib orientation and support geometry along each beam.",
      "Reconcile count and zones from drawing to schedule.",
      "Flag discontinuities where holes or framing conflict with studs."
    ],
    "exampleTitle": "Worked Example",
    "example": "A beam schedule calls for 14 studs in a 2.8 m zone. A modeled obstruction occupies three of the scheduled locations. Mark 11 proposed locations as drawable and three unresolved. Do not move them to adjacent zones automatically.",
    "check": "Compare as-detailed count and location with the design intent. Capacity depends on more than total count.",
    "references": [
      [
        "Canadian Institute of Steel Construction technical resources",
        "https://www.cisc-icca.ca/technical-resources/",
        "Find steel design, fabrication and connection resources for the application."
      ]
    ],
    "diagram": [
      "Stud schedule",
      "Rib map",
      "Conflict count",
      "Resolve locations"
    ]
  },
  "anchor-bolts-and-structural-screws": {
    "title": "Checking Anchor and Structural Screw Submittals",
    "description": "Identify substrate and action for the specific installation. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "Anchor Bolts and Structural Screws",
      "inspection",
      "masonry"
    ],
    "intro": "Identify substrate and action for the specific installation. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Specified fastener, submitted model and current evaluation document.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Identify substrate and action for the specific installation.",
      "Compare model, diameter and embedment against the governing document.",
      "Record actual edge distance and installation assumptions separately."
    ],
    "exampleTitle": "Worked Example",
    "example": "For a hypothetical package the drawing shows 85 mm edge distance and the submitted configuration lists a 100 mm condition for the selected table row. Record a 15 mm mismatch and request the correct design comparison.",
    "check": "Match the product and approval scope exactly before reading resistance values.",
    "references": [
      [
        "Simpson Strong-Tie concrete anchor design guidance",
        "https://seblog.strongtie.com/2015/11/concrete-anchor-design-for-the-international-building-code-part-3/",
        "Review how installation conditions and evaluation reports enter the design process."
      ]
    ],
    "diagram": [
      "Product ID",
      "Substrate",
      "Geometry match",
      "Submittal decision"
    ],
    "video": [
      "Simpson Strong-Tie: Basic Anchor Installation Training",
      "https://www.youtube.com/watch?v=qSqwB27yrRE"
    ]
  },
  "simpson-anchor-code-reports": {
    "title": "Finding the Governing Anchor Evaluation Report",
    "description": "Locate the current evaluation record by model or report number. Follow a worked example and check the result.",
    "level": "Beginner",
    "keywords": [
      "Simpson Anchor Code Reports",
      "bolts",
      "masonry"
    ],
    "intro": "Locate the current evaluation record by model or report number. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Exact anchor marking, supplier product code, base material and jurisdiction.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Locate the current evaluation record by model or report number.",
      "Check covered substrates and installation limits.",
      "Attach the relevant revision and record any mismatches."
    ],
    "exampleTitle": "Worked Example",
    "example": "A hypothetical fastener submittal relies on a report covering solid concrete while the opening detail places it into hollow masonry. Log the mismatch and keep the design check open until the application is supported.",
    "check": "Check edition, jurisdiction and product variant. A US evaluation report may require separate acceptance in a Canadian project.",
    "references": [
      [
        "ICC-ES report directory",
        "https://icc-es.org/reports-directory/",
        "Find the current report for the exact product and configuration."
      ]
    ],
    "diagram": [
      "Model marking",
      "Evaluation record",
      "Substrate scope",
      "Decision log"
    ]
  },
  "firestopping-and-structural-penetrations": {
    "title": "Matching Through-Penetrations to Firestop Listings",
    "description": "Record substrate, penetrant, dimensions and required rating. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "Firestopping and Structural Penetrations",
      "bolts",
      "repair"
    ],
    "intro": "Record substrate, penetrant, dimensions and required rating. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Rated assembly detail, penetrating service data and a current listing.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Record substrate, penetrant, dimensions and required rating.",
      "Compute the nominal annular space and check whether centering is assumed.",
      "Compare the complete field configuration with the listed arrangement."
    ],
    "exampleTitle": "Worked Example",
    "example": "A centered 70 mm pipe through a 110 mm hole leaves 20 mm nominal annular space. A 7 mm center offset makes the clear space about 13 mm on one side and 27 mm on the other. Compare both extremes with the actual listing.",
    "check": "Verify the full listing, including packing and spacing, and coordinate the structural opening separately.",
    "references": [
      [
        "UL Solutions Product iQ and certified fire-rated designs",
        "https://www.ul.com/thecodeauthority/knowledge/ul-listed-certified-database-product-iq",
        "Search for and read the specific system listing for the assembly."
      ]
    ],
    "diagram": [
      "Rated assembly",
      "Penetrant",
      "Measured clearance",
      "System listing"
    ],
    "video": [
      "How To Read UL Listings for Penetration Firestop Systems",
      "https://www.youtube.com/watch?v=dRTwrzXNEtU"
    ],
    "photo": {
      "src": "/learning/photos/standpipe-penetration.jpg",
      "alt": "Standpipe passing through a concrete floor with firestop around the opening",
      "width": 960,
      "height": 733,
      "credit": "Standpipe Penetration by Achim Hering (public domain)",
      "source": "https://commons.wikimedia.org/wiki/File:Standpipe_penetration.jpg"
    }
  },
  "supplementary-penetration-coordination": {
    "title": "Screening New Penetrations Against Structural Drawings",
    "description": "Locate the opening using project grids and elevations. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "Supplementary Penetration Coordination",
      "firestop",
      "fire resistance"
    ],
    "intro": "Locate the opening using project grids and elevations. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Latest structural drawings, opening request, sleeve dimensions and services layout.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Locate the opening using project grids and elevations.",
      "Check nearby reinforcement, tendons and structural details.",
      "Log structural disposition and firestop review as separate actions."
    ],
    "exampleTitle": "Worked Example",
    "example": "A 120 mm sleeve center is 180 mm from the face of a beam shown on plan. The near sleeve edge is 120 mm from that face in projection. Mark the opening in a section too, since the plan tells nothing about elevation or hidden reinforcement.",
    "check": "Use verified as-built information before construction. Treat plan clearance as a coordination measurement.",
    "references": [
      [
        "UL Solutions Product iQ and certified fire-rated designs",
        "https://www.ul.com/thecodeauthority/knowledge/ul-listed-certified-database-product-iq",
        "Search for and read the specific system listing for the assembly."
      ]
    ],
    "diagram": [
      "Grid location",
      "Plan projection",
      "Section check",
      "Disposition"
    ]
  },
  "structural-inspection-and-condition-assessment": {
    "title": "Building a Repeatable Structural Condition Survey",
    "description": "Write observations with location, dimension and date. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "Structural Inspection and Condition Assessment",
      "repair",
      "inspection"
    ],
    "intro": "Write observations with location, dimension and date. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Member identifiers, access plan, marked survey points and a repeatable measurement method.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Write observations with location, dimension and date.",
      "Separate observations from diagnosis.",
      "Assign follow-up based on uncertainty and potential consequence."
    ],
    "exampleTitle": "Worked Example",
    "example": "An assumed survey finds 5 observations across 18 inspected bays; 2 are at the same recurring detail. Record both the 5 observations and the recurring cluster, plus which bays were inaccessible. A future revisit uses the original identifiers.",
    "check": "Use consistent coverage and evidence quality before drawing trend conclusions.",
    "references": [
      [
        "ACI concrete repair resources",
        "https://www.concrete.org/topicsinconcrete/topicdetail/repair",
        "Identify applicable resources for investigation and repair of existing concrete."
      ]
    ],
    "diagram": [
      "Member ID",
      "Observation",
      "Repeat location",
      "Follow-up"
    ],
    "video": [
      "Structural Concrete Repair Webinar for Building Officials",
      "https://www.youtube.com/watch?v=VtgTU2vlgn4"
    ]
  },
  "concrete-defect": {
    "title": "Documenting Concrete Crack and Defect Patterns",
    "description": "Map crack orientation and relation to supports or joints. Follow a worked example and check the result.",
    "level": "Advanced",
    "keywords": [
      "Concrete Defect",
      "repair",
      "corrosion"
    ],
    "intro": "Map crack orientation and relation to supports or joints. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Scaled photographs, fixed stations, dated survey and an exposure record.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Map crack orientation and relation to supports or joints.",
      "Record width using a consistent measurement technique.",
      "Compare repeated measurements under similar conditions."
    ],
    "exampleTitle": "Worked Example",
    "example": "At one marked station an illustrative width changes from 0.20 mm to 0.30 mm. The observed change is 0.10 mm. If the instrument is repeatable only to about 0.10 mm, repeat before concluding that the crack is widening.",
    "check": "Record instrument resolution, temperature and surface condition with every reading.",
    "references": [
      [
        "ACI concrete repair resources",
        "https://www.concrete.org/topicsinconcrete/topicdetail/repair",
        "Identify applicable resources for investigation and repair of existing concrete."
      ]
    ],
    "diagram": [
      "Crack map",
      "Measure width",
      "Repeat visit",
      "Interpret"
    ],
    "photo": {
      "src": "/learning/photos/concrete-crack.jpg",
      "alt": "A crack crossing an exposed concrete surface",
      "width": 960,
      "height": 720,
      "credit": "Concrete Cracked by John Harvey (public domain)",
      "source": "https://commons.wikimedia.org/wiki/File:Concrete_cracked.jpg"
    }
  },
  "protective-paint-and-coatings": {
    "title": "Reviewing a Steel Coating Inspection Record",
    "description": "Confirm preparation and coat sequence before reviewing thickness readings. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "Protective Paint and Coatings",
      "coatings",
      "masonry"
    ],
    "intro": "Confirm preparation and coat sequence before reviewing thickness readings. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Coating system, specification, calibrated thickness gauge and station map.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Confirm preparation and coat sequence before reviewing thickness readings.",
      "Compare both individual entries and the prescribed grouping method.",
      "Record any recheck or repair locations on the drawing."
    ],
    "exampleTitle": "Worked Example",
    "example": "Five illustrative dry-film readings are 82, 95, 101, 106 and 116 µm. Their mean is 100 µm. The 82 µm reading stays visible in the record because acceptance may include local limits as well as averages.",
    "check": "Do not infer acceptance from the mean alone. Apply the project method, product requirements and gauge corrections.",
    "references": [
      [
        "SSPC-PA 2 dry coating thickness requirements",
        "https://store.accuristech.com/tia/products/preview/2253595",
        "Locate the relevant edition and review how conformance is determined using measurements."
      ]
    ],
    "diagram": [
      "Surface condition",
      "Coat sequence",
      "Readings",
      "Acceptance record"
    ]
  },
  "composite-strengthening-reference-review": {
    "title": "Reading FRP Strengthening Design Assumptions",
    "description": "Identify the assumed remaining member properties and existing loads at installation. Follow a worked example and check the result.",
    "level": "Beginner",
    "keywords": [
      "Composite Strengthening Reference Review",
      "reinforcement",
      "repair"
    ],
    "intro": "Identify the assumed remaining member properties and existing loads at installation. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Existing member data, strengthening purpose and reference design assumptions.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Identify the assumed remaining member properties and existing loads at installation.",
      "Separate material description from system-level checks.",
      "Write a matrix of conditions covered by the reference and those open for design."
    ],
    "exampleTitle": "Worked Example",
    "example": "An example assumes positive-moment strengthening on the accessible beam soffit. On a second beam the critical region is over a support and the top face is inaccessible. Record the changed moment sign and access condition as two separate differences.",
    "check": "Have the design basis reviewed for substrate, bond, fire exposure and long-term effects whenever applicable.",
    "references": [
      [
        "ACI Committee 440 resources on external FRP strengthening",
        "https://www.concrete.org/getinvolved/committees/directoryofcommittees/acommitteehome.aspx?committee_code=C0440S00",
        "Find the external FRP strengthening documents for the proposed system."
      ]
    ],
    "diagram": [
      "Existing state",
      "Design assumptions",
      "Site differences",
      "Verification matrix"
    ],
    "video": [
      "Strengthening Concrete Structures with FRP Systems",
      "https://www.youtube.com/watch?v=VxjfIoStuKM"
    ]
  },
  "msds-epoxies-mortars-chemicals": {
    "title": "Checking Safety Data Sheets for Repair Materials",
    "description": "Match the formulation and language to the delivered package. Follow a worked example and check the result.",
    "level": "Beginner",
    "keywords": [
      "MSDS - Epoxies, Mortars & Chemicals",
      "stability",
      "lifting"
    ],
    "intro": "Match the formulation and language to the delivered package. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Current product label, matching supplier safety data sheet and site handling plan.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Match the formulation and language to the delivered package.",
      "Locate hazard, handling, protection and spill sections.",
      "Record which components have separate safety data sheets."
    ],
    "exampleTitle": "Worked Example",
    "example": "A two-part repair resin arrives with labels for Part A and Part B, while the site packet contains only the Part A sheet. Record one missing document and request the matching Part B sheet before relying on the packet.",
    "check": "Use the supplier's current SDS and the workplace hazard procedure for the actual material. Do not infer controls from another formulation.",
    "references": [
      [
        "OSHA guide to safety data sheet sections",
        "https://www.osha.gov/sites/default/files/publications/OSHA3493QUICKCARDSAFETYDATASHEET.pdf",
        "Identify standard sections and verify labeling and handling requirements in the applicable jurisdiction."
      ]
    ],
    "diagram": [
      "Label",
      "Exact SDS",
      "Handling sections",
      "Document gaps"
    ]
  },
  "structural-calculation-notes": {
    "title": "Writing Traceable Structural Calculation Notes",
    "description": "Assign a source and units to every input. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "Structural Calculation Notes",
      "reinforcement",
      "structural steel"
    ],
    "intro": "Assign a source and units to every input. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "A drawing excerpt, design assumptions, source references and a calculation revision log.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Assign a source and units to every input.",
      "Keep demand, assumptions and verification results on separate lines.",
      "Record changes against prior revisions and carry them into affected sheets."
    ],
    "exampleTitle": "Worked Example",
    "example": "A 6 m simple-span worksheet changes a uniform action from 2 to 3 kN/m. Reactions change from 6 to 9 kN at each end. Flag the 3 kN increase per support in the handoff instead of silently replacing the result.",
    "check": "Check equilibrium after each revision and trace every affected drawing or calculation page.",
    "references": [
      [
        "NRC National Building Code of Canada publication record",
        "https://nrc-publications.canada.ca/eng/view/object/?id=adf1ad94-7ea8-4b08-a19f-653ebb7f45f6",
        "Locate the structural design provisions and confirm the edition adopted for the project."
      ]
    ],
    "diagram": [
      "Input register",
      "Calculation",
      "Independent check",
      "Revision handoff"
    ]
  },
  "mathcad-engineering-worksheets": {
    "title": "Checking Units in Mathcad Engineering Worksheets",
    "description": "Enter dimensions and loads with units. Follow a worked example and check the result.",
    "level": "Advanced",
    "keywords": [
      "Mathcad Engineering Worksheets",
      "bolts",
      "engineering calculations"
    ],
    "intro": "Enter dimensions and loads with units. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Mathcad Prime, a reference hand calculation and clearly identified unit-bearing variables.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Enter dimensions and loads with units.",
      "Report output in the drawing or design unit system.",
      "Change only the display units and confirm the same physical result."
    ],
    "exampleTitle": "Worked Example",
    "example": "Enter 5 kN and an eccentricity of 80 mm. Their product is 400 kN·mm, which displays as 0.40 kN·m. Typing an unqualified 80 instead would lose a length unit.",
    "check": "Use a worksheet label for the physical basis of each number, including any assumed action or sign.",
    "references": [
      [
        "PTC Mathcad Prime worksheet guidance",
        "https://support.ptc.com/help/mathcad/r12.0/en/PTC_Mathcad_Help/about_using_mathcad.html",
        "Review how Mathcad handles worksheet quantities and unit conversions."
      ]
    ],
    "diagram": [
      "Quantity inputs",
      "Unit algebra",
      "Display units",
      "Hand check"
    ],
    "video": [
      "PTC Mathcad Prime: How to Use Units in Engineering Calculations",
      "https://www.youtube.com/watch?v=8Ks4fwTnuvc"
    ]
  },
  "engineering-spreadsheets": {
    "title": "Testing Engineering Spreadsheet Formula Ranges",
    "description": "Label cells by role and units. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "Engineering Spreadsheets",
      "bolts",
      "reinforcement"
    ],
    "intro": "Label cells by role and units. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "A copy of the calculation workbook, a known baseline and a list of expected inputs.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Label cells by role and units.",
      "Trace totals back to the range and look for hard-coded values.",
      "Insert a test row and check that totals and dependent calculations update."
    ],
    "exampleTitle": "Worked Example",
    "example": "A support schedule lists 2.5, 1.5 and 4.0 kN for 8.0 kN total. Add a 0.75 kN test row. A correct total becomes 8.75 kN. If a linked reaction table still shows 8.0 kN, inspect the source range.",
    "check": "Use a clean copy and verify zero, blank and inserted inputs before relying on a revised workbook.",
    "references": [
      [
        "Microsoft Excel structured references",
        "https://support.microsoft.com/en-us/office/using-structured-references-with-excel-tables-f5ed2452-2337-4f71-bed3-c8ae6d2b276e",
        "Review how formulas reference table data and adjust to changes in the table."
      ]
    ],
    "diagram": [
      "Input rows",
      "Formula range",
      "Inserted case",
      "Linked results"
    ]
  },
  "idea-statica-connection-design": {
    "title": "Reviewing Model Actions in IDEA StatiCa",
    "description": "Trace member-end actions from the analysis report into the connection model. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "IDEA StatiCa Connection Design",
      "BIM",
      "Revit"
    ],
    "intro": "Trace member-end actions from the analysis report into the connection model. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Connection sketch, analysis results, load combinations and a declared local-axis convention.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Trace member-end actions from the analysis report into the connection model.",
      "Document member orientation and the location where actions act.",
      "Check reactions and compare a simple limiting case before accepting detailed outputs."
    ],
    "exampleTitle": "Worked Example",
    "example": "An assumed 40 kN beam shear acts at a reference location 75 mm from the support face. Moving the action to that face requires tracking a 3.0 kN·m moment about the relevant axis. Confirm the model convention before entering an equivalent load.",
    "check": "Avoid counting the transfer eccentricity twice. Check that all modeled members have the intended restraints and load combinations.",
    "references": [
      [
        "IDEA StatiCa support and learning",
        "https://www.ideastatica.com/support-center/support-center-knowledge-base",
        "Find guidance on load effects, force positions and equilibrium checks."
      ]
    ],
    "diagram": [
      "Analysis forces",
      "Local axes",
      "Connection input",
      "Equilibrium"
    ],
    "video": [
      "IDEA StatiCa: Design and Code Check of a Seismic Connection",
      "https://www.youtube.com/watch?v=63uj5p0doA8"
    ]
  },
  "advance-steel-detailing": {
    "title": "Verifying a Revit and Advance Steel Detailing Exchange",
    "description": "Select a stable test assembly with known marks. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "Advance Steel Detailing",
      "shop drawings",
      "bolts"
    ],
    "intro": "Select a stable test assembly with known marks. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "A small Revit model, software versions, mapped steel sections and a change register.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Select a stable test assembly with known marks.",
      "Export and compare section, grade and end position.",
      "Review synchronization differences before applying changes to the baseline."
    ],
    "exampleTitle": "Worked Example",
    "example": "An exchange transmits six steel members. Five match section and grade, and one maps to another section family. Reconcile that one by element mark and verify its end geometry before preparing fabrication drawings.",
    "check": "Keep reference files, mapping settings and accepted changes with the detailing issue.",
    "references": [
      [
        "Autodesk Advance Steel Extension for Revit",
        "https://help.autodesk.com/cloudhelp/2025/ENU/Revit-StructEng/files/GUID-C86164A0-C1B3-4F09-8C38-84C0B4A860FF.htm",
        "Review transfer, synchronization, warnings and mapping for the installed releases."
      ]
    ],
    "diagram": [
      "Design model",
      "Mapping",
      "Transferred steel",
      "Change approval"
    ],
    "video": [
      "Changes Synchronization between Revit and Advance Steel",
      "https://www.youtube.com/watch?v=QQc8FPUsc5M"
    ]
  },
  "engineering-software-apis": {
    "title": "Reconciling Engineering Model API Exports",
    "description": "Specify which object types and states the extraction includes. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "Engineering Software APIs",
      "Python",
      "Dynamo"
    ],
    "intro": "Specify which object types and states the extraction includes. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Read access to a test model, a known export manifest and vendor schema documentation.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Specify which object types and states the extraction includes.",
      "Retain stable identifiers and canonical units in the output.",
      "Check row counts and totals against the native application."
    ],
    "exampleTitle": "Worked Example",
    "example": "A beam export expects 12 member IDs. The output has 12 rows but only 11 unique IDs. One identifier is duplicated, so reconcile missing and duplicate identifiers before comparing member forces.",
    "check": "Test a stable sample model with known units, duplicate handling and deliberately omitted objects.",
    "references": [
      [
        "CSI developer documentation",
        "https://www.csiamerica.com/developer",
        "Read the API documentation for the application, version and object type."
      ]
    ],
    "diagram": [
      "Test model",
      "API fields",
      "Stable identifiers",
      "Reconciliation"
    ]
  },
  "bluebeam-drawing-review": {
    "title": "Reviewing Drawing Revisions in Bluebeam Revu",
    "description": "Align drawings with unchanged reference geometry. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "Bluebeam Drawing Review",
      "automation",
      "fabrication"
    ],
    "intro": "Align drawings with unchanged reference geometry. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Prior and revised drawing PDFs, common reference points and a markup register.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Align drawings with unchanged reference geometry.",
      "Compare after verifying scale and view crop.",
      "Mark genuine geometry changes and assign unresolved items to an owner."
    ],
    "exampleTitle": "Worked Example",
    "example": "Two revisions show the same grid intersection but are displaced 6 mm on the printed sheet. Align the grid first. If a sleeve still shifts 3 mm on a 1:50 view, the modeled difference is 150 mm. Record the revision and dimensions.",
    "check": "Separate sheet shifts from model changes. Compare against explicit drawing dimensions where available.",
    "references": [
      [
        "Bluebeam Revu support",
        "https://support.bluebeam.com/revu/features/compare-documents-vs-overlay-pages.html",
        "Locate the Compare Documents and Overlay Pages workflows for the installed Revu version."
      ]
    ],
    "diagram": [
      "Revision pair",
      "Shared alignment",
      "Change measurement",
      "Markup log"
    ],
    "video": [
      "How to Overlay and Compare Drawings in Bluebeam Revu",
      "https://www.youtube.com/watch?v=cogyiPv4pmE"
    ]
  },
  "dynamo-analysis": {
    "title": "Checking Dynamo List Alignment in Structural BIM",
    "description": "Retain each identifier alongside its data through graph transformations. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "Dynamo for Structural BIM",
      "structural analysis",
      "load cases"
    ],
    "intro": "Retain each identifier alongside its data through graph transformations. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "A sample Revit model, stable element IDs and an exportable Dynamo result.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Retain each identifier alongside its data through graph transformations.",
      "Record the intended list structure and treatment of nulls.",
      "Compare a few rows against the source before writing parameters."
    ],
    "exampleTitle": "Worked Example",
    "example": "Three element IDs have lengths 2.0 m, blank and 4.0 m. Removing only the blank from the length list would shift the 4.0 m value onto the wrong element. Keep the ID-length pair together, and flag the blank row for review.",
    "check": "Test small nested lists and unmatched entries before enabling any batch write to the model.",
    "references": [
      [
        "Dynamo Primer",
        "https://primer2.dynamobim.org/",
        "Review list structure and graph inputs before updating the model."
      ]
    ],
    "diagram": [
      "Element IDs",
      "Paired rows",
      "Null handling",
      "Spot check"
    ],
    "video": [
      "Learn Dynamo: List Management",
      "https://www.youtube.com/watch?v=vHRAND4BjUY"
    ]
  },
  "python-for-engineering-automation": {
    "title": "Validating Engineering Data Imported with Python",
    "description": "Validate required columns and normalize units explicitly. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "Python for Engineering Automation",
      "deflection",
      "structural analysis"
    ],
    "intro": "Validate required columns and normalize units explicitly. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "A small CSV fixture, expected headers and rules for identifiers, units and missing fields.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Validate required columns and normalize units explicitly.",
      "Reject duplicates or missing identifiers before computing totals.",
      "Keep invalid rows and their reasons in the batch result."
    ],
    "exampleTitle": "Worked Example",
    "example": "Three data rows record 1.2 kN, 300 N and a blank under a known unit field. The first two give 1.50 kN after conversion. Report two usable rows and one blank instead of treating the blank as zero.",
    "check": "Verify row counts, field mapping and round-trip results with a tiny fixture before processing real exports.",
    "references": [
      [
        "Python CSV documentation",
        "https://docs.python.org/3/library/csv.html",
        "Review how rows and fields are parsed before applying engineering validation."
      ]
    ],
    "diagram": [
      "CSV fields",
      "Validation",
      "Unit conversion",
      "Batch totals"
    ]
  },
  "python-automation-practice-example": {
    "title": "Testing a Beam Reaction Script with Python",
    "description": "Define positions from the same support on every input row. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "Python Automation Practice Example",
      "deflection",
      "structural analysis"
    ],
    "intro": "Define positions from the same support on every input row. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "A simply supported teaching model, point-load positions and expected manual outputs.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Define positions from the same support on every input row.",
      "Compute reactions from force and moment equilibrium.",
      "Test a centered load, an eccentric load and an out-of-range position."
    ],
    "exampleTitle": "Worked Example",
    "example": "For a 6 m simply supported span and a 12 kN downward point load 2 m from the left, right reaction is 4 kN and left reaction is 8 kN. Moving the same load to midspan should yield 6 kN each.",
    "check": "Reject impossible positions and unit mismatches. Check both the sum of forces and the moment about a support.",
    "references": [
      [
        "Python CSV documentation",
        "https://docs.python.org/3/library/csv.html",
        "Review how rows and fields are parsed before applying engineering validation."
      ]
    ],
    "diagram": [
      "Span and point load",
      "Moment balance",
      "Support reactions",
      "Test fixtures"
    ]
  },
  "revit-structural-modeling": {
    "title": "Checking Connectivity in a Revit Analytical Model",
    "description": "Compare analytical endpoints at intended joints. Follow a worked example and check the result.",
    "level": "Advanced",
    "keywords": [
      "Revit Structural Modeling",
      "concrete design",
      "material properties"
    ],
    "intro": "Compare analytical endpoints at intended joints. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "A small physical model, analytical elements and published model tolerance assumptions.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Compare analytical endpoints at intended joints.",
      "Check position and role of columns, beams and restraints.",
      "Record intentional offsets separately from unintended disconnected nodes."
    ],
    "exampleTitle": "Worked Example",
    "example": "An assumed beam endpoint is at elevation 3.000 m, and the target analytical node is at 3.020 m. The 20 mm mismatch must be resolved or modeled as an intentional offset. A physical solid overlap does not prove analytical connectivity.",
    "check": "Confirm identical coordinates or an explicit modeled link before checking load transfer.",
    "references": [
      [
        "Autodesk structural engineering learning collection",
        "https://www.autodesk.com/learn/ondemand/collection/building-structural-engineering",
        "Find publisher exercises on analytical model setup and connectivity."
      ]
    ],
    "diagram": [
      "Physical framing",
      "Analytical endpoints",
      "Connectivity check",
      "Model handoff"
    ]
  },
  "bim-coordination-in-revit": {
    "title": "Triaging Structural Coordination Clashes in Revit",
    "description": "Run checks on relevant model categories and versions. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "BIM Coordination in Revit",
      "BIM",
      "fabrication"
    ],
    "intro": "Run checks on relevant model categories and versions. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "A federated coordination view, agreed tolerances and the current linked models.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Run checks on relevant model categories and versions.",
      "Group recurring results by physical cause or shared geometry.",
      "Record a responsible discipline and due status for each actionable issue."
    ],
    "exampleTitle": "Worked Example",
    "example": "A test report has 12 intersection rows. Six describe the same duct crossing repeated across derivative elements. If the other six are independent, the actionable list contains seven items. Keep the raw IDs linked to the consolidated issue.",
    "check": "Examine clearance and access requirements explicitly, alongside geometric intersection results.",
    "references": [
      [
        "Autodesk Support guide to interference checking in Revit",
        "https://www.autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/How-to-run-an-interference-check-between-elements-in-Revit.html",
        "Check which model elements and links are included in interference checks."
      ]
    ],
    "diagram": [
      "Linked files",
      "Interference run",
      "Issue grouping",
      "Coordination owner"
    ],
    "video": [
      "Checking for Interferences in Revit",
      "https://www.youtube.com/watch?v=bIxbXaBM7E8"
    ]
  },
  "revit-level-of-development": {
    "title": "Checking BIM Information Against a Model Exchange Need",
    "description": "List geometric and nongeometric information required for each purpose. Follow a worked example and check the result.",
    "level": "Advanced",
    "keywords": [
      "Revit Level of Development",
      "fabrication",
      "BIM"
    ],
    "intro": "List geometric and nongeometric information required for each purpose. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Project modeling requirements, intended use and an element-level deliverable matrix.",
    "principleTitle": "Review Workflow",
    "steps": [
      "List geometric and nongeometric information required for each purpose.",
      "Check sample elements against the agreed deliverable.",
      "Record unresolved information separately from model appearance."
    ],
    "exampleTitle": "Worked Example",
    "example": "A coordination package has 24 steel beams with location and section, but only 20 have verified connection geometry. If the receiving task requires connections on all 24, mark four information gaps even though every beam is visible.",
    "check": "Use the project agreement and named intended uses to assess completeness.",
    "references": [
      [
        "BIMForum Level of Development Specification",
        "https://bimforum.org/resource/lod-level-of-development-lod-specification/",
        "Use the specification and project exchange requirements together to identify expected information."
      ]
    ],
    "diagram": [
      "Project use",
      "Element requirements",
      "Sample audit",
      "Gap list"
    ],
    "video": [
      "BIMForum Global LOD Specification: How to Use It",
      "https://www.youtube.com/watch?v=th2ORsP543o"
    ]
  },
  "parametric-design": {
    "title": "Verifying a Parametric Structural Layout",
    "description": "Define inputs and derived dimensions explicitly. Follow a worked example and check the result.",
    "level": "Advanced",
    "keywords": [
      "Parametric Design",
      "repair",
      "structural analysis"
    ],
    "intro": "Define inputs and derived dimensions explicitly. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "A baseline grid, supported input ranges and a saved expected layout.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Define inputs and derived dimensions explicitly.",
      "Test a parameter change that should affect only one direction.",
      "Regenerate member IDs or preserve them according to the stated rule."
    ],
    "exampleTitle": "Worked Example",
    "example": "A four-bay grid has 5.0 m equal bays, so the first-to-last-axis length is 20.0 m. Changing bay spacing to 4.5 m gives 18.0 m. Check all five axes and the count of four bays before accepting the change.",
    "check": "Check a minimum-input case and recurrence of identifiers across regeneration.",
    "references": [
      [
        "Dynamo Primer",
        "https://primer2.dynamobim.org/",
        "Review list structure and graph inputs before updating the model."
      ]
    ],
    "diagram": [
      "Grid parameters",
      "Generated axes",
      "Dimension check",
      "Stable IDs"
    ]
  },
  "sap2000-and-etabs-model-comparison": {
    "title": "Benchmarking the Same Frame in SAP2000 and ETABS",
    "description": "Use the same mass, material, section and restraint inputs. Follow a worked example and check the result.",
    "level": "Advanced",
    "keywords": [
      "SAP2000 and ETABS Model Comparison",
      "material properties",
      "deflection"
    ],
    "intro": "Use the same mass, material, section and restraint inputs. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Two isolated test models, matched support and loading assumptions, and documented program defaults.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Use the same mass, material, section and restraint inputs.",
      "Disable or document automated self-weight and analysis options.",
      "Compare reactions and a selected response before adding complexity."
    ],
    "exampleTitle": "Worked Example",
    "example": "An idealized single-span beam takes a 10 kN midspan load. Its reference reactions are 5 kN each. A model returning 6 kN at both supports has 2 kN additional net vertical action. Check self-weight and loading before comparing stiffness.",
    "check": "Compare local axes, offsets and released degrees of freedom after force equilibrium closes.",
    "references": [
      [
        "CSI Analysis Reference Manual",
        "https://web.wiki.csiamerica.com/wiki/spaces/doc/pages/1245505",
        "Check how the software represents supports, distributed loads and analysis conventions."
      ]
    ],
    "diagram": [
      "Common benchmark",
      "Program settings",
      "Reaction comparison",
      "Difference log"
    ],
    "video": [
      "SAP2000: Simple Supported Beam with a Point Load",
      "https://www.youtube.com/watch?v=aaeD7c-w90U"
    ]
  },
  "revit-to-sap2000": {
    "title": "Checking an Analytical Model Transferred from Revit to SAP2000",
    "description": "Record source coordinates and orientations for a small sample. Follow a worked example and check the result.",
    "level": "Advanced",
    "keywords": [
      "Revit to SAP2000",
      "material properties",
      "concrete design"
    ],
    "intro": "Record source coordinates and orientations for a small sample. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Compatible model releases, a transfer method supported by the installed versions and a simple verification model.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Record source coordinates and orientations for a small sample.",
      "Compare mapped sections, restraints and separately recorded load cases.",
      "Inspect element connectivity and report outputs after import."
    ],
    "exampleTitle": "Worked Example",
    "example": "An illustrative baseline has five analytical nodes and four members. A receiving model with six distinct nodes and four members can indicate that a shared joint was split during transfer. Compare coordinates and end-node identifiers before running the design cases.",
    "check": "Confirm version support and reproducibility. Verify a reaction baseline after every mapping or geometry correction.",
    "references": [
      [
        "CSI CSiXRevit model exchange",
        "https://www.csiamerica.com/products/csixrevit",
        "Check supported applications and versions before selecting an exchange method."
      ]
    ],
    "diagram": [
      "Source nodes",
      "Exchange mapping",
      "Receiving nodes",
      "Reaction baseline"
    ]
  },
  "comparing-sap2000-and-robot-models": {
    "title": "Comparing SAP2000 and Robot Load Definitions",
    "description": "Compare direction and coordinate systems before plotting outputs. Follow a worked example and check the result.",
    "level": "Advanced",
    "keywords": [
      "Comparing SAP2000 and Robot Models",
      "deflection",
      "material properties"
    ],
    "intro": "Compare direction and coordinate systems before plotting outputs. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Matched teaching models, program version notes and two independently defined load cases.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Compare direction and coordinate systems before plotting outputs.",
      "Confirm that distributed loads act on the same length and projection.",
      "Run each case individually and reconcile total force."
    ],
    "exampleTitle": "Worked Example",
    "example": "A 5 m inclined member carries an assumed 2 kN/m vertical load along its actual length. It produces 10 kN total. If the same numeric intensity is applied over a 4 m horizontal projection instead, the resultant is 8 kN. Track which basis each model uses.",
    "check": "Keep actual and projected lengths in the comparison sheet. Reconcile each separate case before combining them.",
    "references": [
      [
        "CSI Analysis Reference Manual",
        "https://web.wiki.csiamerica.com/wiki/spaces/doc/pages/1245505",
        "Check how the software represents supports, distributed loads and analysis conventions."
      ]
    ],
    "diagram": [
      "Model axes",
      "Loaded length",
      "Case reactions",
      "Comparison record"
    ]
  },
  "structural-shop-drawing-review": {
    "title": "Reviewing Structural Shop Drawings Against Design Intent",
    "description": "Compare grid, elevation, section and material designations by member mark. Follow a worked example and check the result.",
    "level": "Intermediate",
    "keywords": [
      "Structural Shop Drawing Review",
      "shop drawings",
      "inspection"
    ],
    "intro": "Compare grid, elevation, section and material designations by member mark. Use the example below to practice the review and record an output that another reviewer can reproduce.",
    "inputs": "Current structural drawings, shop submission, member marks and review scope.",
    "principleTitle": "Review Workflow",
    "steps": [
      "Compare grid, elevation, section and material designations by member mark.",
      "Check interfaces such as bolts, embeds and openings against referenced details.",
      "Write numbered review items linked to the affected drawing revision."
    ],
    "exampleTitle": "Worked Example",
    "example": "A beam called B12 is shown in two views. Plan locates its end at Grid C, while a detail dimensions it 35 mm away from the face assumed at Grid C. Mark the dimensional basis as an open issue and request one reconciled view.",
    "check": "Track disposition by revision and retain the designer's stated review scope and responsibilities.",
    "references": [
      [
        "Canadian Institute of Steel Construction technical resources",
        "https://www.cisc-icca.ca/technical-resources/",
        "Find steel design, fabrication and connection resources for the application."
      ]
    ],
    "diagram": [
      "Member mark",
      "Plan and detail",
      "Discrepancy",
      "Revision closure"
    ]
  }
} satisfies Readonly<Record<string, Guide>>;
