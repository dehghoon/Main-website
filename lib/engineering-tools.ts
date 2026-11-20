export const engineeringTools = [
  { id: "model", name: "3D Structural Model", href: "https://3dmodel.linkoteq.com/", status: "Beta", description: "Explore structural modeling workflows in active development." },
  { id: "wsection", name: "W-Section", href: "https://wsection.linkoteq.com/", status: "Trial", description: "Explore steel W-section calculations and reporting." },
  { id: "snow", name: "Snow Load", href: "https://snow.linkoteq.com/", status: "Trial", description: "Explore roof snow load calculations and reports." },
  { id: "wind", name: "Wind Load", href: "/tools/wind-load", status: "Beta", description: "Review wind loads and request approved Beta access." },
  { id: "concrete", name: "Concrete Beam", href: "/tools/concrete-beam", status: "In development", description: "Reinforced concrete beam design in development." },
  { id: "wood", name: "Wood Design", href: "/tools/wood-design", status: "In development", description: "Structural timber design in development." },
  { id: "seismic", name: "Seismic Load", href: "/tools/seismic", status: "Beta", description: "Review the NBCC seismic load calculator and request Beta access." },
] as const;
