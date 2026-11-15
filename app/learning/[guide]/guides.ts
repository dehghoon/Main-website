type Guide = {
  title: string;
  inputs?: string;
  tool?: string;
  description: string;
  level: string;
  keywords: readonly string[];
  intro: string;
  principleTitle: string;
  steps: readonly string[];
  exampleTitle: string;
  example: string;
  check: string;
  references: readonly (readonly [title: string, url: string, readingNote: string])[];
  diagram: readonly string[];
};

export const guides: Readonly<Record<string, Guide>> = {
  "load-combinations": {
    "title": "Canadian Structural Design Loads and Load Combinations",
    "description": "Learn to define structural load cases, convert an area load to a beam line load, and document the adopted Canadian code basis for design combinations.",
    "level": "Beginner",
    "keywords": [
      "Canadian structural design loads",
      "load cases and combinations",
      "tributary width",
      "beam reactions"
    ],
    "intro": "Build a load register before entering combinations in an analysis program. Write down what each load represents, its units, its direction and which parts of the structure receive it.",
    "principleTitle": "Structural Load Cases and Load Paths",
    "steps": [
      "Separate loads by action so that permanent loads, occupancies and environmental loads can be combined with their own factors and accompanying terms.",
      "Trace each area load through the slab or deck to its supporting member. Confirm tributary width before converting kPa to kN/m.",
      "Record the adopted code edition, local amendments, limit state and combination assumptions beside the model cases."
    ],
    "exampleTitle": "Worked Example for a Simply Supported Beam",
    "example": "Use a hypothetical permanent area load of 1.5 kPa and a separate imposed area load of 2.0 kPa. A 3 m tributary width gives independent line loads of 4.5 kN/m and 6.0 kN/m. For a 6 m simply supported beam under uniform load, each end receives 13.5 kN from the permanent case and 18.0 kN from the imposed case. Add any separate beam self-weight to the permanent case. Select combination factors from the adopted provisions for the project and the limit state being checked.",
    "check": "Compare each pair of model reactions with the total load from its own case before checking combined results. Confirm the code edition and jurisdiction when adapting an archived classroom example.",
    "references": [
      [
        "National Building Code of Canada 2020, Division B Part 4",
        "https://publications.gc.ca/collections/collection_2022/cnrc-nrc/NR24-28-2020-eng.pdf",
        "Use the structural design provisions to locate the load and load-combination sections."
      ],
      [
        "NRC National Building Code of Canada 2025 publication record",
        "https://nrc-publications.canada.ca/eng/view/object/?id=adf1ad94-7ea8-4b08-a19f-653ebb7f45f6",
        "Compare editions and confirm which one applies in the project jurisdiction."
      ]
    ],
    "diagram": [
      "Area load",
      "Tributary strip",
      "Beam",
      "Support reactions"
    ]
  },
  "steel-deck-span": {
    "title": "Steel Deck Span, Deflection and Diaphragm Design",
    "description": "Follow a worked steel deck load example and distinguish gravity span and deflection checks from diaphragm shear transfer through deck and fasteners.",
    "level": "Intermediate",
    "keywords": [
      "steel deck span",
      "steel deck load tables",
      "deck deflection",
      "composite diaphragm"
    ],
    "intro": "A steel deck profile can serve different structural functions at different stages. Record the span and loading condition for each gravity check and draw the in-plane load path separately.",
    "principleTitle": "Reading Steel Deck Span and Load Information",
    "steps": [
      "Match the actual deck profile, thickness, span configuration and support conditions to the manufacturer’s data.",
      "Identify whether the check is for construction-stage deck or the completed assembly. Record temporary loads and shoring assumptions separately.",
      "For diaphragm action, trace force from the deck and attachments into collectors and vertical resisting elements."
    ],
    "exampleTitle": "Worked Example for a One-Metre Deck Strip",
    "example": "For a hypothetical 1 m strip over a 3 m simple span with a uniform vertical load of 2.4 kPa, the line load is 2.4 kN/m. Each support receives 3.6 kN per metre of deck width, and the idealized maximum bending moment is 2.7 kN·m per metre. Use these values to check the model inputs and reactions. The relevant product table depends on the stage, spans, connection condition and stated rating basis.",
    "check": "Review gravity deflection for the appropriate stage. Check diaphragm shear transfer and attachments using the separate lateral load path and the provisions applicable to the project.",
    "references": [
      [
        "Canam steel deck product and design resources",
        "https://www.canam.com/en/product/steel-deck/",
        "Locate the relevant deck profile and its technical documents."
      ],
      [
        "NIST guide to composite steel deck and concrete-filled diaphragms",
        "https://nvlpubs.nist.gov/nistpubs/gcr/2010/NIST.GCR.10-917-4.pdf",
        "Review how an example traces in-plane forces through the diaphragm and its connections."
      ]
    ],
    "diagram": [
      "Gravity load",
      "Deck strip",
      "Supporting members",
      "Vertical reactions"
    ]
  },
  "reinforcement-detailing": {
    "title": "Concrete Reinforcement Detailing and Crack Control",
    "description": "Learn to review concrete reinforcement spacing, placement and continuity with a worked drawing check and a reference to Canadian structural provisions.",
    "level": "Intermediate",
    "keywords": [
      "concrete reinforcement detailing",
      "rebar spacing",
      "crack control",
      "reinforcement drawing review"
    ],
    "intro": "Review a reinforcement drawing alongside the structural model. Bar position, direction and continuity help an engineer determine whether the detail matches the behavior assumed in design.",
    "principleTitle": "Reading Concrete Reinforcement Details",
    "steps": [
      "Identify the member, support and section before interpreting the bar callouts.",
      "Follow each bar set across plans and sections and identify where cover, development and anchorage need engineering checks.",
      "Record which bar sets are associated with flexure, distributing reinforcement or serviceability checks in the design."
    ],
    "exampleTitle": "Worked Drawing Review for Bar Spacing",
    "example": "A hypothetical detail shows seven equally spaced bar centerlines at 150 mm. There are six intervals, so the distance from the first to the last centerline is 900 mm. Compare that dimension with the section and check how the end centerlines relate to faces, cover and the bar diameter. Treat spacing, clearance and crack control as separate checks with their own design inputs.",
    "check": "On a marked-up drawing, identify the bar set, direction, start and end location, and any unresolved continuity question. Confirm the required design standard and edition before judging capacity or crack control.",
    "references": [
      [
        "National Building Code of Canada 2020, Division B Part 4",
        "https://publications.gc.ca/collections/collection_2022/cnrc-nrc/NR24-28-2020-eng.pdf",
        "Locate the structural concrete provisions and the referenced design standard for that model-code edition."
      ]
    ],
    "diagram": [
      "Bar callout",
      "Plan centerlines",
      "Section and cover",
      "Drawing check"
    ]
  },
  "revit-robot-exchange": {
    "title": "Revit to Robot Structural Analysis Model Exchange",
    "description": "Verify Revit-to-Robot analytical model exchange with a simple beam example covering geometry, supports, releases, load assignments and reactions.",
    "level": "Intermediate",
    "keywords": [
      "Revit Robot model exchange",
      "analytical model verification",
      "structural BIM interoperability",
      "support reactions"
    ],
    "intro": "Use a baseline model before transferring a production structure. Give the receiving model its own verification record, including the software release and the link used.",
    "principleTitle": "Analytical Model Transfer Checks",
    "steps": [
      "Record member axes, node connectivity, units and support restraints in the baseline.",
      "Compare geometry, local axes, releases and load-case assignments after transfer.",
      "Check the deformed shape and reactions, then record any changes made by the receiving application."
    ],
    "exampleTitle": "Worked Verification for a Single Beam",
    "example": "Create a 4 m beam with simple supports and an 8 kN downward point load at midspan. With self-weight excluded for this check, each support should carry 4 kN vertically. Compare this manual result with the receiving model. If the load relocates or support restraints change, investigate the transfer before comparing stress or deflection.",
    "check": "Save the baseline and receiving model separately. Record the software versions and retain one small reproducible check for testing the workflow after updates.",
    "references": [
      [
        "Autodesk Revit and Robot model exchange paper",
        "https://damassets.autodesk.net/content/dam/autodesk/www/pdfs/linking-autodesk-revit-and-robot-structural-analysis-professional.pdf",
        "Review the analytical-model exchange concepts and identify version-specific steps."
      ],
      [
        "Autodesk structural modeling and analysis learning collection",
        "https://www.autodesk.com/learn/ondemand/collection/building-structural-engineering",
        "Find the current publisher workflow for preparing and verifying a structural analytical model."
      ]
    ],
    "diagram": [
      "Revit baseline",
      "Model transfer",
      "Robot model",
      "Reaction comparison"
    ]
  },
  "anchor-selection": {
    "title": "Post-Installed Concrete Anchor Selection and Review",
    "description": "Review post-installed concrete anchor layouts, manufacturer data and installation conditions with a worked anchor-reaction example.",
    "level": "Intermediate",
    "keywords": [
      "concrete anchor design",
      "post-installed anchors",
      "anchor group reactions",
      "Hilti"
    ],
    "intro": "Review post-installed concrete anchor layouts, manufacturer data and installation conditions with a worked anchor-reaction example.",
    "principleTitle": "Design and Review Workflow",
    "diagram": [
      "Connection actions",
      "Anchor group",
      "Concrete substrate",
      "Installation checks"
    ],
    "steps": [
      "Record the actions at the attachment and any load eccentricity.",
      "Verify concrete condition, edge distance, anchor spacing and embedment against the applicable design basis and product scope.",
      "Review installation requirements and identify field checks that affect acceptance."
    ],
    "exampleTitle": "Worked Example for a Centered Anchor Group",
    "example": "A hypothetical centered 12 kN service tension acts through a rigid plate with four identical anchors. With equal stiffness, uniform engagement and no applied moment, the initial equilibrium check gives 3 kN per anchor. Eccentricity or plate deformation can change the distribution.",
    "check": "Check all relevant failure modes using the governing design basis and verified product data. Record the substrate, installation method and inspection criteria.",
    "references": [
      [
        "Hilti specifications and CAD details",
        "https://www.hilti.ca/content/hilti/W1/CA/en/business/business/engineering/specifications-and-cad-details.html",
        "Open the anchor and rebar section to locate installation details for the selected system."
      ]
    ]
  },
  "structural-corrosion-and-durability": {
    "title": "Structural Corrosion Inspection and Durability Review",
    "description": "Build a corrosion inspection record and use a worked thickness comparison to plan structural follow-up.",
    "level": "Intermediate",
    "keywords": [
      "structural corrosion inspection",
      "steel section loss",
      "concrete repair",
      "condition assessment"
    ],
    "intro": "Build a corrosion inspection record and use a worked thickness comparison to plan structural follow-up.",
    "principleTitle": "Design and Review Workflow",
    "diagram": [
      "Exposure",
      "Observations",
      "Thickness measurements",
      "Structural follow-up"
    ],
    "steps": [
      "Identify the member, exposure and coating condition. Mark observations on a sketch.",
      "Distinguish coating breakdown, general loss and localized pitting. Record measurement locations and the thickness used for comparison.",
      "Use the location and distribution of deterioration to scope assessment and decide where more measurements are needed."
    ],
    "exampleTitle": "Worked Example for a Thickness Comparison",
    "example": "A hypothetical steel plate has a documented reference thickness of 10.0 mm. One location reads 8.6 mm. The local difference is 1.4 mm, or 14% of the reference thickness. Record the location, instrument and repeat readings before treating the measurement as representative.",
    "check": "Evaluate structural resistance using the actual geometry, loading and deterioration pattern. In reinforced concrete, document cracking, delamination and evidence of exposure before choosing an investigation or repair method.",
    "references": [
      [
        "ACI concrete repair resources",
        "https://www.concrete.org/topicsinconcrete/topicdetail/repair",
        "Use the publisher’s repair resources for the reinforced-concrete assessment branch."
      ]
    ]
  },
  "masonry-structural-design": {
    "title": "Structural Masonry Wall Design and Detailing",
    "description": "Trace a masonry wall load path, calculate an idealized support reaction and review how reinforcement continuity is documented.",
    "level": "Intermediate",
    "keywords": [
      "masonry structural design",
      "reinforced masonry",
      "masonry detailing",
      "wall load path"
    ],
    "intro": "Trace a masonry wall load path, calculate an idealized support reaction and review how reinforcement continuity is documented.",
    "principleTitle": "Design and Review Workflow",
    "diagram": [
      "Lateral load",
      "Wall strip",
      "Top and bottom restraints",
      "Supporting structure"
    ],
    "steps": [
      "Identify the assumed spanning direction and verify the restraints shown on the drawings.",
      "Read reinforcement, grout and connection details together. Follow continuity around openings and at supports.",
      "Record the applicable masonry standard, edition and design assumptions."
    ],
    "exampleTitle": "Worked Example for a Vertically Spanning Masonry Strip",
    "example": "A hypothetical one-metre-wide wall strip is simply supported at the top and bottom. A uniform pressure of 1.2 kPa over the 3 m height gives 3.6 kN of lateral load. Each support receives 1.8 kN in this idealized example.",
    "check": "Compare the reactions with the attachment details. Review strength, serviceability and load transfer around openings using the adopted design basis.",
    "references": [
      [
        "National Building Code of Canada 2020, Division B Part 4",
        "https://publications.gc.ca/collections/collection_2022/cnrc-nrc/NR24-28-2020-eng.pdf",
        "Locate the masonry structural design provisions and the referenced standard for that edition."
      ]
    ]
  },
  "roof-snow-loads": {
    "title": "Roof Snow Loads and Snow Drift",
    "description": "Build a roof load map with climate data, roof geometry and the adopted code basis.",
    "level": "Intermediate",
    "keywords": [
      "roof snow loads",
      "snow drift",
      "snow load calculator",
      "NBC",
      "NBCC"
    ],
    "intro": "Build a roof load map with climate data, roof geometry and the adopted code basis.",
    "principleTitle": "Work Steps",
    "diagram": [
      "Inputs",
      "Model or detail",
      "Independent check",
      "Review record"
    ],
    "steps": [
      "Identify upper and lower roofs, steps and obstructions.",
      "Record each climate input and coefficient’s source.",
      "Separate uniform roof load from localized drift cases and assign the correct loaded area."
    ],
    "exampleTitle": "Worked Example or Review Exercise",
    "example": "The Linkoteq NBCC 2020 uniform benchmark uses 2.40 kPa ground snow, 0.40 kPa associated rain and a 0.80 basic roof factor, with the remaining stated factors at 1.00. The example gives 2.32 kPa. Draw a separate load diagram for any drift case required by the project.",
    "check": "Compare total loads and reactions to a hand estimate for the uniform case. Check whether roof steps or obstructions also require a drift case.",
    "inputs": "Roof plan and elevations; adopted code edition; location-specific snow and associated rain inputs.",
    "tool": "/tools/snow-load",
    "references": [
      [
        "NRC National Building Code of Canada 2020",
        "https://publications.gc.ca/collections/collection_2022/cnrc-nrc/NR24-28-2020-eng.pdf",
        "Use the publisher’s source to verify the scope, assumptions and applicable edition."
      ]
    ]
  },
  "wind-load-path": {
    "title": "Wind Loads and Lateral Load Paths",
    "description": "Trace wind pressures from the envelope through the lateral system.",
    "level": "Intermediate",
    "keywords": [
      "wind loads",
      "lateral loads",
      "ASCE 7",
      "NBC"
    ],
    "intro": "Trace wind pressures from the envelope through the lateral system.",
    "principleTitle": "Work Steps",
    "diagram": [
      "Inputs",
      "Model or detail",
      "Independent check",
      "Review record"
    ],
    "steps": [
      "Define the pressure cases and sign convention.",
      "Separate envelope component pressures from the main structural system loading.",
      "Transfer pressures to the model using the appropriate tributary geometry."
    ],
    "exampleTitle": "Worked Example or Review Exercise",
    "example": "For a hypothetical 12 m² wall panel with a uniform net pressure of 0.8 kPa, the resultant is 9.6 kN. Place it at the centroid for a simple check, then account for real pressure zones separately.",
    "check": "Compare total lateral force and overturning effects with the model reactions. Verify signs and tributary areas.",
    "inputs": "Building geometry and exposure; pressure zones and directions; adopted code and drawings.",
    "references": [
      [
        "ASCE 7 design loads",
        "https://www.asce.org/publications-and-news/asce-7",
        "Use the publisher’s source to verify the scope, assumptions and applicable edition."
      ]
    ]
  },
  "floor-vibration": {
    "title": "Floor Vibration and Serviceability",
    "description": "Review whether a floor model represents the participating mass, stiffness and excitation relevant to serviceability.",
    "level": "Advanced",
    "keywords": [
      "floor vibration",
      "walking vibration",
      "frequency",
      "acceleration",
      "serviceability"
    ],
    "intro": "Review whether a floor model represents the participating mass, stiffness and excitation relevant to serviceability.",
    "principleTitle": "Work Steps",
    "diagram": [
      "Inputs",
      "Model or detail",
      "Independent check",
      "Review record"
    ],
    "steps": [
      "Identify the bay or mode most likely to participate.",
      "Document the mass, stiffness, supports and damping used.",
      "Select a response measure and acceptance criterion appropriate to the occupancy."
    ],
    "exampleTitle": "Worked Example or Review Exercise",
    "example": "Compare two conceptual floors with identical mass and different stiffness. A fourfold rise in stiffness doubles the natural frequency of a single-degree-of-freedom idealization. Use a full response check for the actual floor.",
    "check": "Check mode shapes and compare model and hand-estimated frequency ranges. Avoid inferring acceptance from frequency alone.",
    "inputs": "Framing and slab geometry; mass sources; occupancy and excitation; boundary and damping assumptions.",
    "references": [
      [
        "AISC Engineering Journal: walking-induced floor vibration",
        "https://ej.aisc.org/index.php/engj/article/view/1151",
        "Use the publisher’s source to verify the scope, assumptions and applicable edition."
      ]
    ]
  },
  "modal-response": {
    "title": "Modal Response and Structural Model Verification",
    "description": "Check the mass source, restraining conditions and mode shapes before interpreting modal results.",
    "level": "Advanced",
    "keywords": [
      "response spectrum",
      "modal analysis",
      "S-FRAME",
      "structural dynamics"
    ],
    "intro": "Check the mass source, restraining conditions and mode shapes before interpreting modal results.",
    "principleTitle": "Work Steps",
    "diagram": [
      "Inputs",
      "Model or detail",
      "Independent check",
      "Review record"
    ],
    "steps": [
      "Review mass units and where mass is assigned.",
      "Run a small baseline case before the full model.",
      "Inspect modes, participation and any unexpected rigid-body movement."
    ],
    "exampleTitle": "Worked Example or Review Exercise",
    "example": "A spring-mass baseline with four times the mass and unchanged stiffness has half the natural frequency. Compare that direction of change with a controlled software test.",
    "check": "Compare mass totals with the load takeoff. A very low mode may indicate a modeling mechanism or missing restraint.",
    "inputs": "Analytical model; mass assignments; support restraints; applicable analysis settings.",
    "references": [
      [
        "CSI analysis reference documentation",
        "https://web.wiki.csiamerica.com/wiki/spaces/doc/pages/1245505",
        "Use the publisher’s source to verify the scope, assumptions and applicable edition."
      ]
    ]
  },
  "steel-member-checks": {
    "title": "W-Shape Properties and Steel Member Checks",
    "description": "Check that the selected steel section, local axes and restraint assumptions match the design model.",
    "level": "Intermediate",
    "keywords": [
      "W-Shape Properties",
      "W-Section",
      "wide flange",
      "member stability",
      "CISC"
    ],
    "intro": "Check that the selected steel section, local axes and restraint assumptions match the design model.",
    "principleTitle": "Work Steps",
    "diagram": [
      "Inputs",
      "Model or detail",
      "Independent check",
      "Review record"
    ],
    "steps": [
      "Verify units and look up the selected W-shape properties.",
      "Confirm major and minor axes in the model and drawings.",
      "Enter the verified loads and identify the governing member check."
    ],
    "exampleTitle": "Worked Example or Review Exercise",
    "example": "Use the Linkoteq W-Section benchmark to compare units and interpretation of biaxial utilization. Its published preview identifies the governing case and the limitation regarding lateral-torsional buckling.",
    "check": "Review which checks the tool covers and whether the force effects act together. Confirm separate checks for any omitted stability mode.",
    "inputs": "Section designation and properties; member length, end restraint and unbraced length; coincident load effects.",
    "tool": "/tools/w-section",
    "references": [
      [
        "CISC steel construction technical resources",
        "https://www.cisc-icca.ca/technical-resources/",
        "Use the publisher’s source to verify the scope, assumptions and applicable edition."
      ]
    ]
  },
  "structural-welding-references": {
    "title": "Welding and Welded Connections",
    "description": "Trace force through a welded detail and record the information needed for weld design and inspection.",
    "level": "Intermediate",
    "keywords": [
      "welding",
      "welded connections",
      "fillet weld",
      "fabrication inspection"
    ],
    "intro": "Trace force through a welded detail and record the information needed for weld design and inspection.",
    "principleTitle": "Work Steps",
    "diagram": [
      "Inputs",
      "Model or detail",
      "Independent check",
      "Review record"
    ],
    "steps": [
      "Identify the connected parts and the force path.",
      "Read the weld symbols and identify the effective weld layout.",
      "Check access and sequence with the fabrication and inspection team."
    ],
    "exampleTitle": "Worked Example or Review Exercise",
    "example": "A centered 20 kN force shared equally by two identical 100 mm weld lines gives 0.10 kN/mm on each line in a simplified equilibrium check. Eccentricity or unequal stiffness changes the demand.",
    "check": "Confirm that shop and design drawings agree on weld size, length and extent. Distinguish a demand calculation from a capacity check.",
    "inputs": "Connection sketch, applied forces, weld process and material information, governing fabrication and inspection requirements.",
    "references": [
      [
        "CISC steel construction technical resources",
        "https://www.cisc-icca.ca/technical-resources/",
        "Use the publisher’s source to verify the scope, assumptions and applicable edition."
      ]
    ]
  },
  "industrial-grating-and-walkways": {
    "title": "Steel Bar Grating and Walkway Supports",
    "description": "Use the bearing-bar direction, panel span and load type to identify an appropriate grating table.",
    "level": "Intermediate",
    "keywords": [
      "steel grating",
      "bar grating",
      "walkway",
      "bearing bars"
    ],
    "intro": "Use the bearing-bar direction, panel span and load type to identify an appropriate grating table.",
    "principleTitle": "Work Steps",
    "diagram": [
      "Inputs",
      "Model or detail",
      "Independent check",
      "Review record"
    ],
    "steps": [
      "Identify bearing-bar orientation on the layout.",
      "Match material, span and bar spacing to the product data.",
      "Review concentrated loads and openings separately from the uniform-load case."
    ],
    "exampleTitle": "Worked Example or Review Exercise",
    "example": "On a layout with supports 1.0 m apart, draw the bearing bars spanning between those supports. A panel rotated by 90 degrees requires a fresh span and support check.",
    "check": "Compare actual clear span and bearing with the table assumptions. Confirm attachment and access around cutouts.",
    "inputs": "Panel geometry; supports, bearing and fastening; specified uniform and concentrated loads.",
    "references": [
      [
        "NAAMM Metal Bar Grating Manual",
        "https://naamm.org/publications/metal-bar-grating-manual/",
        "Use the publisher’s source to verify the scope, assumptions and applicable edition."
      ]
    ]
  },
  "steel-sheet": {
    "title": "Cold-Formed Steel Studs and Track",
    "description": "Review a metal stud designation and compare span and restraint assumptions with a manufacturer table.",
    "level": "Intermediate",
    "keywords": [
      "Steel Sheet",
      "metal studs",
      "cold-formed steel",
      "studs and track"
    ],
    "intro": "Review a metal stud designation and compare span and restraint assumptions with a manufacturer table.",
    "principleTitle": "Work Steps",
    "diagram": [
      "Inputs",
      "Model or detail",
      "Independent check",
      "Review record"
    ],
    "steps": [
      "Distinguish stud designation and base metal thickness.",
      "Confirm the selected table matches orientation, supports and bridging.",
      "Identify whether the wall is part of a structural or non-load-bearing system."
    ],
    "exampleTitle": "Worked Example or Review Exercise",
    "example": "Mark up a typical partition elevation with stud spacing, height, bridging, head track and lateral pressure. Record what remains unknown before selecting the member.",
    "check": "Do not infer structural role from the gauge alone. Compare table notes with the intended end connection and movement requirements.",
    "inputs": "Stud and track designation; material thickness; wall height and support details; applied pressure and deflection criteria.",
    "references": [
      [
        "CISC steel construction technical resources",
        "https://www.cisc-icca.ca/technical-resources/",
        "Use the publisher’s source to verify the scope, assumptions and applicable edition."
      ]
    ]
  },
  "reinforcement-couplers": {
    "title": "Rebar Couplers and Mechanical Splices",
    "description": "Read a mechanical splice detail and prepare a submittal and inspection checklist.",
    "level": "Intermediate",
    "keywords": [
      "rebar coupler",
      "rebar couplers",
      "Coupler",
      "mechanical splice",
      "reinforcement detailing"
    ],
    "intro": "Read a mechanical splice detail and prepare a submittal and inspection checklist.",
    "principleTitle": "Work Steps",
    "diagram": [
      "Inputs",
      "Model or detail",
      "Independent check",
      "Review record"
    ],
    "steps": [
      "Match the product to both bar ends and the intended splice conditions.",
      "Check clearances, bar alignment and any required preparation.",
      "Record the installation and inspection steps required by the selected system."
    ],
    "exampleTitle": "Worked Example or Review Exercise",
    "example": "Mark a splice location near a congested reinforcement intersection. List bar sizes, coupler outside diameter, working clearance and the evidence needed to approve the location.",
    "check": "Compare the shop detail, selected coupler and project acceptance criteria. Keep splice capacity and constructability checks separate.",
    "inputs": "Bar size and grade; splice demand and location; coupler type and approved installation procedure.",
    "references": [
      [
        "NRC National Building Code of Canada 2020",
        "https://publications.gc.ca/collections/collection_2022/cnrc-nrc/NR24-28-2020-eng.pdf",
        "Use the publisher’s source to verify the scope, assumptions and applicable edition."
      ]
    ]
  },
  "precast-concrete": {
    "title": "Precast Concrete Connections and Erection",
    "description": "Trace the transfer of loads during handling, erection and the final condition.",
    "level": "Advanced",
    "keywords": [
      "Precast Concrete",
      "precast connections",
      "erection",
      "bearing"
    ],
    "intro": "Trace the transfer of loads during handling, erection and the final condition.",
    "principleTitle": "Work Steps",
    "diagram": [
      "Inputs",
      "Model or detail",
      "Independent check",
      "Review record"
    ],
    "steps": [
      "List the support and restraint conditions at each stage.",
      "Trace reactions into the bearing and connection details.",
      "Check temporary stability separately from the completed load path."
    ],
    "exampleTitle": "Worked Example or Review Exercise",
    "example": "For a centered hypothetical 24 kN panel seated on two equally stiff bearings, 12 kN per bearing is a first equilibrium check. Verify the real support geometry and staged restraints.",
    "check": "Compare erection and design drawings for changes in restraint or bearing. Escalate changes to lifting points or temporary bracing.",
    "inputs": "Element and connection drawings; lifting, bearing and bracing information; erection sequence.",
    "references": [
      [
        "PCI design guides and manuals",
        "https://www.pci.org/PCI/PCI/Design_Resources/Guides_and_Manuals/Guides_and_Manuals.aspx",
        "Use the publisher’s source to verify the scope, assumptions and applicable edition."
      ]
    ]
  },
  "prestressed-concrete": {
    "title": "Prestressed Concrete Load Stages and Service Checks",
    "description": "Organize transfer and service checks for a prestressed member.",
    "level": "Advanced",
    "keywords": [
      "prestressed concrete",
      "pre-stressed concrete",
      "prestress losses",
      "camber"
    ],
    "intro": "Organize transfer and service checks for a prestressed member.",
    "principleTitle": "Work Steps",
    "diagram": [
      "Inputs",
      "Model or detail",
      "Independent check",
      "Review record"
    ],
    "steps": [
      "List the transfer, handling and service conditions.",
      "Record the force and eccentricity at each section and state.",
      "Compare the effects of prestress and gravity loading for the applicable stage."
    ],
    "exampleTitle": "Worked Example or Review Exercise",
    "example": "A 200 kN axial force acting 50 mm from the centroid gives a 10 kN·m moment component. Establish its sign and stage before combining effects.",
    "check": "Confirm use of the correct section and force after losses. Distinguish camber and service deflection from strength verification.",
    "inputs": "Member geometry and section properties; prestress force and profile; concrete strength, loads and loss assumptions by stage.",
    "references": [
      [
        "PCI design guides and manuals",
        "https://www.pci.org/PCI/PCI/Design_Resources/Guides_and_Manuals/Guides_and_Manuals.aspx",
        "Use the publisher’s source to verify the scope, assumptions and applicable edition."
      ]
    ]
  },
  "slabs-on-ground": {
    "title": "Slabs on Ground and Joint Layout",
    "description": "Build a review record for a ground-supported slab and its joints.",
    "level": "Intermediate",
    "keywords": [
      "slab-on-ground",
      "floor slabs",
      "joint layout",
      "ACI 360"
    ],
    "intro": "Build a review record for a ground-supported slab and its joints.",
    "principleTitle": "Work Steps",
    "diagram": [
      "Inputs",
      "Model or detail",
      "Independent check",
      "Review record"
    ],
    "steps": [
      "List uniform and local loads and where they occur.",
      "Map joints and supports alongside concentrations and transitions.",
      "Document reinforcement and intended load transfer across joints."
    ],
    "exampleTitle": "Worked Example or Review Exercise",
    "example": "Draw a plan with a point load near a joint. Identify whether the working model assumes transfer across that joint and the evidence needed to support that assumption.",
    "check": "Check whether the analysis assumptions match the support and joint layout. Evaluate flatness separately from structural response.",
    "inputs": "Slab geometry, support and subgrade information, applied load footprints and joint layout.",
    "references": [
      [
        "ACI Committee 360 — slabs on ground",
        "https://www.concrete.org/getinvolved/committees/directoryofcommittees/acommitteehome.aspx?committee_code=C0036000",
        "Use the publisher’s source to verify the scope, assumptions and applicable edition."
      ]
    ]
  },
  "retaining-wall": {
    "title": "Retaining Wall Load Path and Foundation Checks",
    "description": "Connect earth and water assumptions to wall and foundation checks.",
    "level": "Advanced",
    "keywords": [
      "retaining wall",
      "earth pressure",
      "drainage",
      "bearing"
    ],
    "intro": "Connect earth and water assumptions to wall and foundation checks.",
    "principleTitle": "Work Steps",
    "diagram": [
      "Inputs",
      "Model or detail",
      "Independent check",
      "Review record"
    ],
    "steps": [
      "Record soil, water and surcharge conditions with their sources.",
      "Resolve the loads and their application levels.",
      "Review the wall section, base and supporting soil as one load path."
    ],
    "exampleTitle": "Worked Example or Review Exercise",
    "example": "For an assumed triangular lateral pressure diagram, the resultant acts one-third of the loaded height above its base. Verify the chosen pressure diagram against the applicable geotechnical basis.",
    "check": "Confirm drainage assumptions and check forces at the base before evaluating stability or resistance.",
    "inputs": "Wall geometry; geotechnical recommendations; backfill, groundwater and surcharge assumptions.",
    "references": [
      [
        "NRC National Building Code of Canada 2020",
        "https://publications.gc.ca/collections/collection_2022/cnrc-nrc/NR24-28-2020-eng.pdf",
        "Use the publisher’s source to verify the scope, assumptions and applicable edition."
      ]
    ]
  },
  "pipe-support-engineering": {
    "title": "Pipe Supports and Hangers",
    "description": "Read a piping support schedule and pass the right reactions and restraint information to structural review.",
    "level": "Intermediate",
    "keywords": [
      "Pipe Support",
      "pipe hangers",
      "thermal movement",
      "pipe reactions"
    ],
    "intro": "Read a piping support schedule and pass the right reactions and restraint information to structural review.",
    "principleTitle": "Work Steps",
    "diagram": [
      "Inputs",
      "Model or detail",
      "Independent check",
      "Review record"
    ],
    "steps": [
      "Identify which directions the support restrains or allows to move.",
      "Separate operating, testing and other provided reaction cases.",
      "Trace each force through the hanger, bracket or rail to the supporting structure."
    ],
    "exampleTitle": "Worked Example or Review Exercise",
    "example": "Given a hypothetical vertical reaction of 5 kN and a separate longitudinal reaction of 2 kN, keep their directions and case provenance with the coordinate sketch before combining effects.",
    "check": "Compare support tags, axis conventions and load case names with the piping model. Check clearances through the stated movement range.",
    "inputs": "Piping layout and reactions; operating and installation states; restraint, travel and attachment details.",
    "references": [
      [
        "Atkore Unistrut support systems",
        "https://www.atkore.com/about-us/brands/unistrut",
        "Use the publisher’s source to verify the scope, assumptions and applicable edition."
      ]
    ]
  },
  "pipe-rack": {
    "title": "Pipe Rack Structural Coordination",
    "description": "Create a transferable load and restraint schedule for a pipe rack.",
    "level": "Intermediate",
    "keywords": [
      "pipe rack",
      "Rack",
      "rack framing",
      "piping reactions"
    ],
    "intro": "Create a transferable load and restraint schedule for a pipe rack.",
    "principleTitle": "Work Steps",
    "diagram": [
      "Inputs",
      "Model or detail",
      "Independent check",
      "Review record"
    ],
    "steps": [
      "Identify each pipe line and rack bay receiving load.",
      "Map reactions to the actual member locations and directions.",
      "Coordinate connection and movement assumptions with piping and mechanical reviewers."
    ],
    "exampleTitle": "Worked Example or Review Exercise",
    "example": "Sketch a two-bay rack and place each supplied reaction at its structural point of application. Verify the vertical reaction sum for one isolated load case.",
    "check": "Check totals and reconcile model releases with the support schedule. The available local drawings support a coordination guide, while detailed project capacities require source review.",
    "inputs": "Rack framing sketch; pipe reactions, attachment locations, anchor and guide functions; movement envelopes.",
    "references": [
      [
        "CSI analysis reference documentation",
        "https://web.wiki.csiamerica.com/wiki/spaces/doc/pages/1245505",
        "Use the publisher’s source to verify the scope, assumptions and applicable edition."
      ]
    ]
  },
  "crane-and-lifting-support-structures": {
    "title": "Crane Support Structures",
    "description": "Turn crane supplier reactions and positioning data into a reviewable runway load model.",
    "level": "Advanced",
    "keywords": [
      "crane support",
      "runway",
      "crane reactions",
      "lifting loads"
    ],
    "intro": "Turn crane supplier reactions and positioning data into a reviewable runway load model.",
    "principleTitle": "Work Steps",
    "diagram": [
      "Inputs",
      "Model or detail",
      "Independent check",
      "Review record"
    ],
    "steps": [
      "Identify load cases and the loaded rail or support locations.",
      "Track longitudinal, transverse and vertical reactions with a consistent convention.",
      "Review serviceability, fatigue and attachment details against the required design basis."
    ],
    "exampleTitle": "Worked Example or Review Exercise",
    "example": "Place two supplier wheel reactions on a simple beam sketch and move them as a pair. Compare a hand reaction at one position with the model.",
    "check": "Check envelope positions and whether load effects reported together are coincident. Verify handoff assumptions with the crane supplier.",
    "inputs": "Crane configuration; wheel or support reactions; positions and lateral effects; operating and duty information.",
    "references": [
      [
        "CISC steel construction technical resources",
        "https://www.cisc-icca.ca/technical-resources/",
        "Use the publisher’s source to verify the scope, assumptions and applicable edition."
      ]
    ]
  },
  "pump-support-and-equipment-loads": {
    "title": "Pump and Equipment Supports",
    "description": "Bring mechanical equipment operating inputs into the support and anchorage review.",
    "level": "Intermediate",
    "keywords": [
      "pump support",
      "equipment supports",
      "vibration",
      "operating weight"
    ],
    "intro": "Bring mechanical equipment operating inputs into the support and anchorage review.",
    "principleTitle": "Work Steps",
    "diagram": [
      "Inputs",
      "Model or detail",
      "Independent check",
      "Review record"
    ],
    "steps": [
      "Identify operating and test conditions with their equipment masses.",
      "Map the loads to actual support points and identify vibration isolation where applicable.",
      "Coordinate piping reactions, access and attachment before releasing the support detail."
    ],
    "exampleTitle": "Worked Example or Review Exercise",
    "example": "A hypothetical 400 kg operating mass corresponds to roughly 3.92 kN under standard gravity. Use the center of gravity and supports to distribute it; track piping and dynamic effects separately.",
    "check": "Compare the sum of reactions with the operating gravity load and verify the orientation of equipment axes and added reactions.",
    "inputs": "Dry and operating masses, support footprint, center of gravity, vibration and piping interface information.",
    "references": [
      [
        "Hilti technical details for fastening and supports",
        "https://www.hilti.ca/content/hilti/W1/CA/en/business/business/engineering/specifications-and-cad-details.html",
        "Use the publisher’s source to verify the scope, assumptions and applicable edition."
      ]
    ]
  },
  "ceiling-support-systems": {
    "title": "Ceiling Support and Seismic Bracing",
    "description": "Coordinate ceiling grid, hangers, seismic restraint and independent service supports.",
    "level": "Intermediate",
    "keywords": [
      "ceiling support",
      "ceiling bracing",
      "suspended ceiling",
      "seismic ceiling grid"
    ],
    "intro": "Coordinate ceiling grid, hangers, seismic restraint and independent service supports.",
    "principleTitle": "Work Steps",
    "diagram": [
      "Inputs",
      "Model or detail",
      "Independent check",
      "Review record"
    ],
    "steps": [
      "Identify the suspension system and support locations.",
      "Map perimeter conditions, movement clearances and service interfaces.",
      "Locate the manufacturer details that correspond to the system and applicable seismic requirements."
    ],
    "exampleTitle": "Worked Example or Review Exercise",
    "example": "Mark a ceiling reflected plan with perimeter conditions, a change of level and a fixture. Record the detail required for each interface before installation review.",
    "check": "Check whether fixtures and services require their own support and confirm that attachment locations match the building structure.",
    "inputs": "Ceiling system and layout; building attachment points; jurisdiction and component coordination drawings.",
    "references": [
      [
        "USG ceiling seismic FAQs",
        "https://www.usg.com/en-US/learning-reference/performance/seismic/faqs",
        "Use the publisher’s source to verify the scope, assumptions and applicable edition."
      ]
    ]
  },
  "floor-loading-assessment": {
    "title": "Existing Floor Loading and Capacity Assessment",
    "description": "Build an evidence record for evaluating an existing floor under proposed equipment or use.",
    "level": "Advanced",
    "keywords": [
      "floor loading assessment",
      "floor loading",
      "floor capacity",
      "existing structure assessment"
    ],
    "intro": "Build an evidence record for evaluating an existing floor under proposed equipment or use.",
    "principleTitle": "Work Steps",
    "diagram": [
      "Inputs",
      "Model or detail",
      "Independent check",
      "Review record"
    ],
    "steps": [
      "Record the floor system, supports and confidence in each source.",
      "Map permanent, concentrated and moving loads to their footprints.",
      "Identify the distinct global and local checks and the missing information needed to assess them."
    ],
    "exampleTitle": "Worked Example or Review Exercise",
    "example": "A hypothetical 12 kN load over 0.6 m² averages 20 kPa over that footprint. Keep the contact geometry for local checks; averaging over the full room would lose the localized demand.",
    "check": "Separate a screening calculation from a verified capacity assessment. Check construction deviations and local effects near supports and openings.",
    "inputs": "Existing drawings and site observations; proposed load footprint and movement paths; materials and applicable design basis.",
    "references": [
      [
        "NRC National Building Code of Canada 2020",
        "https://publications.gc.ca/collections/collection_2022/cnrc-nrc/NR24-28-2020-eng.pdf",
        "Use the publisher’s source to verify the scope, assumptions and applicable edition."
      ]
    ]
  },
  "storm-drainage": {
    "title": "Storm Drainage Flow and Inlet Capacity",
    "description": "Read a drainage worksheet and check the flow balance through a simple inlet network.",
    "level": "Intermediate",
    "keywords": [
      "storm drainage",
      "inlet capacity",
      "runoff",
      "site drainage",
      "HEC-22"
    ],
    "intro": "Read a drainage worksheet and check the flow balance through a simple inlet network.",
    "principleTitle": "Work Steps",
    "diagram": [
      "Inputs",
      "Model or detail",
      "Independent check",
      "Review record"
    ],
    "steps": [
      "Identify each source area and route runoff using the site grading.",
      "Document the flow estimate and compare it with inlet capture or conveyance assumptions.",
      "Track bypass flow to the downstream route and identify overflow conditions."
    ],
    "exampleTitle": "Worked Example or Review Exercise",
    "example": "A hypothetical inlet receives 18 L/s and captures 12 L/s in a specified scenario. Carry the 6 L/s bypass downstream and verify that the worksheet preserves the balance.",
    "check": "Check units and confirm whether the model accounts for bypass. Review current local design rainfall and acceptance criteria.",
    "inputs": "Catchment boundaries, design storm basis, grading, flow paths and inlet or pipe information.",
    "references": [
      [
        "FHWA Hydraulics publications and HEC-22",
        "https://www.fhwa.dot.gov/engineering/hydraulics/library_arc.cfm?id=189&pub_number=22",
        "Use the publisher’s source to verify the scope, assumptions and applicable edition."
      ]
    ]
  },
  "fall-protection": {
    "title": "Fall Protection and Structural Anchorage Coordination",
    "description": "Coordinate structural and safety responsibilities for proposed fall protection systems.",
    "level": "Advanced",
    "keywords": [
      "fall protection",
      "guardrail",
      "fall arrest",
      "safety anchorage"
    ],
    "intro": "Coordinate structural and safety responsibilities for proposed fall protection systems.",
    "principleTitle": "Work Steps",
    "diagram": [
      "Inputs",
      "Model or detail",
      "Independent check",
      "Review record"
    ],
    "steps": [
      "Identify the system and the responsible competent parties.",
      "Obtain loading and installation requirements from the applicable authority and system documentation.",
      "Trace the demands into the receiving structure and record required inspection and rescue coordination."
    ],
    "exampleTitle": "Worked Example or Review Exercise",
    "example": "Use a checklist to compare a proposed attachment location with its structural substrate, approved system details, inspection access and safety plan before sign-off.",
    "check": "Verify site conditions, attachments and clearance with the qualified project team. The OSHA reference is specific to the United States.",
    "inputs": "Applicable jurisdiction; safety system documentation; work locations and structural substrate details.",
    "references": [
      [
        "OSHA fall protection system criteria",
        "https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.502",
        "Use the publisher’s source to verify the scope, assumptions and applicable edition."
      ]
    ]
  },
  "sap2000-and-revit-model-exchange": {
    "title": "SAP2000 Model Verification and Revit Coordination",
    "description": "Verify a small SAP2000 model and coordinate the analytical data used at the model boundary.",
    "level": "Intermediate",
    "keywords": [
      "SAP2000",
      "Revit",
      "model exchange",
      "structural analysis"
    ],
    "intro": "Verify a small SAP2000 model and coordinate the analytical data used at the model boundary.",
    "principleTitle": "Work Steps",
    "diagram": [
      "Inputs",
      "Model or detail",
      "Independent check",
      "Review record"
    ],
    "steps": [
      "Build and document a small verification model in SAP2000.",
      "Review assignments and analytical results before sending data to another tool.",
      "Compare what is available in the receiving model and reconcile geometry, axes, restraints and loads."
    ],
    "exampleTitle": "Worked Example or Review Exercise",
    "example": "Apply a centered 6 kN vertical point load to a simply supported baseline beam, with self-weight excluded. Each support should give a 3 kN vertical reaction in the same units.",
    "check": "Release-specific interoperability must be verified for the chosen exchange method. Confirm units, reaction totals and unexpected releases.",
    "inputs": "SAP2000 release information, units, geometry, connections, assigned load cases and approved exchange method.",
    "references": [
      [
        "CSI SAP2000 capabilities",
        "https://www.csiamerica.com/products/sap2000",
        "Use the publisher’s source to verify the scope, assumptions and applicable edition."
      ]
    ]
  },
  "wood-structural-design-and-detailing": {
    "title": "Wood Framing Load Paths and Support Detailing",
    "description": "Trace gravity forces through an illustrative wood frame and identify member and connection checks.",
    "level": "Intermediate",
    "keywords": [
      "wood design",
      "timber",
      "glulam",
      "wood framing",
      "CSA O86"
    ],
    "intro": "Trace gravity forces through an illustrative wood frame and identify member and connection checks.",
    "principleTitle": "Work Steps",
    "diagram": [
      "Inputs",
      "Model or detail",
      "Independent check",
      "Review record"
    ],
    "steps": [
      "Trace tributary loads through joists, beams and posts.",
      "Verify framing orientation, bearing and restraint.",
      "Review connection and durability requirements using the governing design basis."
    ],
    "exampleTitle": "Worked Example or Review Exercise",
    "example": "Identify the tributary width carried by a simple beam in a framing sketch. Convert the area load to line load and compare the support reactions with the post loads.",
    "check": "Check that reactions shown on the plan can transfer through each intervening connection and bearing surface.",
    "inputs": "Framing plans, spans, support details, load inputs, material and exposure data.",
    "references": [
      [
        "Canadian Wood Council Wood Design Manual",
        "https://cwc.ca/publication/wood-design-manual/",
        "Use the publisher’s source to verify the scope, assumptions and applicable edition."
      ]
    ]
  }
};
