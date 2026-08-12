export type UserRole = "employee" | "client";
export type ClientPlan = "starter" | "pro" | "company";

export type Entitlements = {
  viewCalculators: boolean;
  viewSmartDrawings: boolean;
  calculationPdfExport: boolean;
  calculationWordExport: boolean;
  smartDrawingDxfExport: boolean;
  smartDrawingIfcExport: boolean;
  calculationExportsPerCalculatorPerMonth: number | "unlimited";
  smartDrawingExportsPerMonth: number | "unlimited";
  companyUsers: number | "unlimited";
};

export const CLIENT_PLAN_ENTITLEMENTS: Record<ClientPlan, Entitlements> = {
  starter: {
    viewCalculators: true,
    viewSmartDrawings: true,
    calculationPdfExport: false,
    calculationWordExport: false,
    smartDrawingDxfExport: false,
    smartDrawingIfcExport: false,
    calculationExportsPerCalculatorPerMonth: 0,
    smartDrawingExportsPerMonth: 0,
    companyUsers: 1,
  },
  pro: {
    viewCalculators: true,
    viewSmartDrawings: true,
    calculationPdfExport: true,
    calculationWordExport: true,
    smartDrawingDxfExport: true,
    smartDrawingIfcExport: true,
    calculationExportsPerCalculatorPerMonth: 100,
    smartDrawingExportsPerMonth: 100,
    companyUsers: 1,
  },
  company: {
    viewCalculators: true,
    viewSmartDrawings: true,
    calculationPdfExport: true,
    calculationWordExport: true,
    smartDrawingDxfExport: true,
    smartDrawingIfcExport: true,
    calculationExportsPerCalculatorPerMonth: "unlimited",
    smartDrawingExportsPerMonth: "unlimited",
    companyUsers: "unlimited",
  },
};

export const EMPLOYEE_ENTITLEMENTS: Entitlements = {
  ...CLIENT_PLAN_ENTITLEMENTS.company,
  companyUsers: "unlimited",
};

export const PRICING = {
  starter: { monthly: 0, yearly: 0 },
  pro: { monthly: 15, yearly: 100 },
  company: { monthly: 100, yearly: 700 },
} as const;
