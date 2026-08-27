import { PresetScenario } from "../types";

// Import the generated images
import constructionHazardImg from "../assets/images/construction_hazard_1783029238525.jpg";
import warehouseSpillImg from "../assets/images/warehouse_spill_1783029251772.jpg";
import officeHazardImg from "../assets/images/office_hazard_1783029265563.jpg";
import industrialLiftingImg from "../assets/images/industrial_lifting_1783029278299.jpg";

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: "construction",
    title: "Heavy Construction Site Safety Test",
    category: "Construction & PPE",
    description: "Active high-elevation construction scaffolding site with crane lifting and high foot traffic. Test for mandatory head protection, high-visibility clothing, and pathway clutter.",
    imageSrc: constructionHazardImg,
    mockId: "construction_hazard"
  },
  {
    id: "warehouse",
    title: "Logistics Warehouse spill & Stacking",
    category: "Warehousing & Forklift",
    description: "Forklift logistics aisle with heavy racks. Test for wet floors, liquid chemical spill hazards, unstable material stacking, and vehicle separation protocols.",
    imageSrc: warehouseSpillImg,
    mockId: "warehouse_spill"
  },
  {
    id: "office",
    title: "Corporate Office Egress & Power Load",
    category: "Office & Fire Safety",
    description: "Corporate workspace and administrative files area. Test for electrical overloading, power strip daisy-chaining, and emergency egress blockages.",
    imageSrc: officeHazardImg,
    mockId: "office_hazard"
  },
  {
    id: "industrial",
    title: "Heavy Manufacturing Assembly Shop",
    category: "Industrial & Ergonomics",
    description: "Machinery fabrication shop floor. Test for heavy manual lifting techniques, ergonomics safety, and mechanical hazard safeguarding (missing shields).",
    imageSrc: industrialLiftingImg,
    mockId: "industrial_lifting"
  }
];
