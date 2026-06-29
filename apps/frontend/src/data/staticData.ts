// ─────────────────────────────────────────────────────────────
//  STATIC DATA — matches DB schema exactly
//  Used in place of API calls for the static frontend demo
// ─────────────────────────────────────────────────────────────

// ── DB SCHEMA TYPES ──────────────────────────────────────────

export type Account = {
  id: number;
  accountNumber: string;
  accountName: string;
  accountType: string;
  branch: string;
  riskScore: number;
  riskLevel: string;
  status: string;
  balance: number;
  openedAt: string;
  lastActivity: string | null;
  createdAt: string;
};

export type Kyc = {
  id: number;
  accountId: number;
  customerId: string;
  idType: string;
  idNumber: string;
  nationality: string;
  occupation: string;
  pepStatus: boolean;
  sanctionStatus: boolean;
  lastKycDate: string;
  kycLevel: string;
  createdAt: string;
};

export type InvestigationNote = {
  id: number;
  accountId: number;
  content: string;
  author: string;
  createdAt: string;
};

export type Alert = {
  id: number;
  alertId: string;
  accountId: number | string;
  severity: string;
  status: string;
  pattern: string;
  amount: number;
  assignee: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  accountName: string;
  accountNumber: string;
  rawAccountId?: string;
};

export type AlertTimeline = {
  id: number;
  alertId: number;
  eventType: string;
  description: string;
  actor: string;
  metadata: string | null;
  createdAt: string;
  timestamp: string;
};

export type Transaction = {
  id: number;
  txnId: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  currency: string;
  txnType: string;
  timestamp: string;
  status: string;
  channel: string;
  flagged: boolean;
  flagReason: string | null;
  alertId: number | null;
  createdAt: string;
};

export type EvidenceCase = {
  id: number;
  caseId: string;
  title: string;
  investigator: string;
  alertId: string;
  status: string;
  description: string | null;
  suspiciousAccounts: string[];
  totalAmount: number;
  packageGenerated: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CaseFinding = {
  id: number;
  caseId: number;
  category: string;
  finding: string;
  severity: string;
  evidence: string;
  createdAt: string;
};

// ── ACCOUNTS ─────────────────────────────────────────────────

export const staticAccounts: Account[] = [
  {
    id: 1, accountNumber: "ACC-00234", accountName: "Meridian Trade Corp",
    accountType: "Business", branch: "Downtown Financial District",
    riskScore: 96, riskLevel: "CRITICAL", status: "UNDER_REVIEW",
    balance: 2840000, openedAt: "2019-03-15T00:00:00Z",
    lastActivity: "2025-06-20T14:30:00Z", createdAt: "2019-03-15T00:00:00Z",
  },
  {
    id: 2, accountNumber: "ACC-00891", accountName: "Phantom Holdings LLC",
    accountType: "Corporate", branch: "Midtown Branch",
    riskScore: 88, riskLevel: "HIGH", status: "UNDER_REVIEW",
    balance: 1590000, openedAt: "2021-07-22T00:00:00Z",
    lastActivity: "2025-06-19T09:15:00Z", createdAt: "2021-07-22T00:00:00Z",
  },
  {
    id: 3, accountNumber: "ACC-01102", accountName: "James Okafor",
    accountType: "Personal", branch: "Westside Branch",
    riskScore: 74, riskLevel: "HIGH", status: "ACTIVE",
    balance: 487000, openedAt: "2020-11-08T00:00:00Z",
    lastActivity: "2025-06-21T11:00:00Z", createdAt: "2020-11-08T00:00:00Z",
  },
  {
    id: 4, accountNumber: "ACC-00567", accountName: "Sunrise Imports Ltd",
    accountType: "Business", branch: "Harbor Trade Hub",
    riskScore: 61, riskLevel: "MEDIUM", status: "ACTIVE",
    balance: 920000, openedAt: "2018-05-30T00:00:00Z",
    lastActivity: "2025-06-18T16:45:00Z", createdAt: "2018-05-30T00:00:00Z",
  },
  {
    id: 5, accountNumber: "ACC-00312", accountName: "Elena Vasquez",
    accountType: "Personal", branch: "Northgate Branch",
    riskScore: 45, riskLevel: "MEDIUM", status: "ACTIVE",
    balance: 126500, openedAt: "2022-02-14T00:00:00Z",
    lastActivity: "2025-06-22T08:20:00Z", createdAt: "2022-02-14T00:00:00Z",
  },
  {
    id: 6, accountNumber: "ACC-00445", accountName: "Golden Gate Ventures",
    accountType: "Business", branch: "Financial Harbor",
    riskScore: 82, riskLevel: "HIGH", status: "UNDER_REVIEW",
    balance: 3400000, openedAt: "2017-09-01T00:00:00Z",
    lastActivity: "2025-06-17T13:00:00Z", createdAt: "2017-09-01T00:00:00Z",
  },
  {
    id: 7, accountNumber: "ACC-00778", accountName: "Chen Wei Trading",
    accountType: "Corporate", branch: "East Commerce District",
    riskScore: 55, riskLevel: "MEDIUM", status: "ACTIVE",
    balance: 641000, openedAt: "2023-01-10T00:00:00Z",
    lastActivity: "2025-06-21T17:30:00Z", createdAt: "2023-01-10T00:00:00Z",
  },
  {
    id: 8, accountNumber: "ACC-00923", accountName: "Dormant Shell Entity",
    accountType: "Dormant Account", branch: "Central Processing",
    riskScore: 91, riskLevel: "CRITICAL", status: "UNDER_REVIEW",
    balance: 0, openedAt: "2015-06-15T00:00:00Z",
    lastActivity: "2025-06-15T00:01:00Z", createdAt: "2015-06-15T00:00:00Z",
  },
  {
    id: 9, accountNumber: "ACC-00655", accountName: "Ana Lima",
    accountType: "Personal", branch: "South Bay Branch",
    riskScore: 18, riskLevel: "LOW", status: "ACTIVE",
    balance: 34200, openedAt: "2024-03-05T00:00:00Z",
    lastActivity: "2025-06-22T10:00:00Z", createdAt: "2024-03-05T00:00:00Z",
  },
  {
    id: 10, accountNumber: "ACC-00188", accountName: "Nexus Capital Partners",
    accountType: "Business", branch: "Corporate Tower",
    riskScore: 79, riskLevel: "HIGH", status: "ACTIVE",
    balance: 5120000, openedAt: "2016-12-20T00:00:00Z",
    lastActivity: "2025-06-20T09:00:00Z", createdAt: "2016-12-20T00:00:00Z",
  },
];

// ── KYC ──────────────────────────────────────────────────────

export const staticKyc: Kyc[] = [
  {
    id: 1, accountId: 1, customerId: "CID-8821", idType: "Company Registration",
    idNumber: "BN-4421-02", nationality: "Cayman Islands", occupation: "International Trade",
    pepStatus: false, sanctionStatus: true, lastKycDate: "2023-11-01", kycLevel: "ENHANCED",
    createdAt: "2019-03-15T00:00:00Z",
  },
  {
    id: 2, accountId: 2, customerId: "CID-5534", idType: "Corporate Charter",
    idNumber: "CH-9922-LL", nationality: "British Virgin Islands", occupation: "Holding Company",
    pepStatus: false, sanctionStatus: false, lastKycDate: "2024-02-14", kycLevel: "ENHANCED",
    createdAt: "2021-07-22T00:00:00Z",
  },
  {
    id: 3, accountId: 3, customerId: "CID-2291", idType: "National ID",
    idNumber: "NG-4872-55", nationality: "Nigeria", occupation: "Consultant",
    pepStatus: true, sanctionStatus: false, lastKycDate: "2024-06-10", kycLevel: "STANDARD",
    createdAt: "2020-11-08T00:00:00Z",
  },
  {
    id: 4, accountId: 4, customerId: "CID-3312", idType: "Business License",
    idNumber: "BL-7741-88", nationality: "United Arab Emirates", occupation: "Import/Export",
    pepStatus: false, sanctionStatus: false, lastKycDate: "2024-04-20", kycLevel: "STANDARD",
    createdAt: "2018-05-30T00:00:00Z",
  },
  {
    id: 5, accountId: 5, customerId: "CID-1178", idType: "Passport",
    idNumber: "ES-3312-94", nationality: "Spain", occupation: "Software Engineer",
    pepStatus: false, sanctionStatus: false, lastKycDate: "2025-01-15", kycLevel: "BASIC",
    createdAt: "2022-02-14T00:00:00Z",
  },
  {
    id: 6, accountId: 6, customerId: "CID-6654", idType: "Company Registration",
    idNumber: "BN-0091-GG", nationality: "Panama", occupation: "Investment Firm",
    pepStatus: true, sanctionStatus: true, lastKycDate: "2022-08-30", kycLevel: "ENHANCED",
    createdAt: "2017-09-01T00:00:00Z",
  },
  {
    id: 7, accountId: 7, customerId: "CID-9901", idType: "Business License",
    idNumber: "BL-5512-CT", nationality: "China", occupation: "Trading Company",
    pepStatus: false, sanctionStatus: false, lastKycDate: "2025-02-01", kycLevel: "STANDARD",
    createdAt: "2023-01-10T00:00:00Z",
  },
  {
    id: 8, accountId: 8, customerId: "CID-4478", idType: "Corporate Charter",
    idNumber: "CH-0031-SH", nationality: "Seychelles", occupation: "Shell Entity",
    pepStatus: false, sanctionStatus: true, lastKycDate: "2021-01-01", kycLevel: "ENHANCED",
    createdAt: "2015-06-15T00:00:00Z",
  },
  {
    id: 9, accountId: 9, customerId: "CID-7723", idType: "Passport",
    idNumber: "BR-8821-LL", nationality: "Brazil", occupation: "Teacher",
    pepStatus: false, sanctionStatus: false, lastKycDate: "2025-03-10", kycLevel: "BASIC",
    createdAt: "2024-03-05T00:00:00Z",
  },
  {
    id: 10, accountId: 10, customerId: "CID-2200", idType: "Company Registration",
    idNumber: "BN-3344-NX", nationality: "United States", occupation: "Private Equity",
    pepStatus: false, sanctionStatus: false, lastKycDate: "2024-09-15", kycLevel: "ENHANCED",
    createdAt: "2016-12-20T00:00:00Z",
  },
];

// ── INVESTIGATION NOTES ───────────────────────────────────────

export const staticNotes: InvestigationNote[] = [
  {
    id: 1, accountId: 1,
    content: "Confirmed sanctioned entity link via OFAC database cross-reference. Escalating to compliance officer.",
    author: "Agent Chen", createdAt: "2025-06-20T10:30:00Z",
  },
  {
    id: 2, accountId: 1,
    content: "Transaction pattern shows classic layering through offshore intermediaries. Three shell accounts identified.",
    author: "Agent Rivera", createdAt: "2025-06-21T14:15:00Z",
  },
  {
    id: 3, accountId: 2,
    content: "Holding structure maps to known money mule network. Preparing STR draft.",
    author: "Agent Okafor", createdAt: "2025-06-19T09:00:00Z",
  },
  {
    id: 4, accountId: 6,
    content: "PEP link confirmed. Subject is politically exposed via government contracting in Panama. Enhanced due diligence required.",
    author: "Agent Chen", createdAt: "2025-06-17T16:00:00Z",
  },
];

// ── ALERTS ───────────────────────────────────────────────────

export const staticAlerts: Alert[] = [
  {
    id: 1, alertId: "ALT-2025-001", accountId: 1,
    severity: "CRITICAL", status: "OPEN", pattern: "Layering",
    amount: 2840000, assignee: "Agent Chen",
    description: "Detected complex multi-layer fund movement through three offshore entities within 48 hours. Consistent with known AML layering typology.",
    createdAt: "2025-06-20T08:00:00Z", updatedAt: "2025-06-20T08:00:00Z",
    accountName: "Meridian Trade Corp", accountNumber: "ACC-00234",
  },
  {
    id: 2, alertId: "ALT-2025-002", accountId: 2,
    severity: "CRITICAL", status: "UNDER_INVESTIGATION", pattern: "Money Mule Network",
    amount: 1590000, assignee: "Agent Rivera",
    description: "Account exhibits money mule behavior — receives large sums then immediately redistributes to 12 sub-accounts.",
    createdAt: "2025-06-19T06:30:00Z", updatedAt: "2025-06-20T11:00:00Z",
    accountName: "Phantom Holdings LLC", accountNumber: "ACC-00891",
  },
  {
    id: 3, alertId: "ALT-2025-003", accountId: 6,
    severity: "HIGH", status: "OPEN", pattern: "Round-Tripping",
    amount: 980000, assignee: null,
    description: "Funds cycled through three entities and returned to originating account within 72 hours — classic round-tripping signature.",
    createdAt: "2025-06-18T14:00:00Z", updatedAt: "2025-06-18T14:00:00Z",
    accountName: "Golden Gate Ventures", accountNumber: "ACC-00445",
  },
  {
    id: 4, alertId: "ALT-2025-004", accountId: 3,
    severity: "HIGH", status: "OPEN", pattern: "Structuring",
    amount: 487000, assignee: "Agent Okafor",
    description: "18 transactions all just below $30,000 threshold over 10 days. Probable structuring to avoid CTR filing.",
    createdAt: "2025-06-17T10:20:00Z", updatedAt: "2025-06-17T10:20:00Z",
    accountName: "James Okafor", accountNumber: "ACC-01102",
  },
  {
    id: 5, alertId: "ALT-2025-005", accountId: 8,
    severity: "CRITICAL", status: "OPEN", pattern: "Dormant Account Activation",
    amount: 750000, assignee: null,
    description: "Dormant account reactivated after 4 years with immediate large incoming transfer. High probability of synthetic identity fraud.",
    createdAt: "2025-06-15T00:01:00Z", updatedAt: "2025-06-15T00:01:00Z",
    accountName: "Dormant Shell Entity", accountNumber: "ACC-00923",
  },
  {
    id: 6, alertId: "ALT-2025-006", accountId: 4,
    severity: "MEDIUM", status: "CLOSED", pattern: "Unusual Cash Patterns",
    amount: 320000, assignee: "Agent Chen",
    description: "Cash deposits in irregular amounts across 5 branches in same week. No clear business justification.",
    createdAt: "2025-06-14T09:00:00Z", updatedAt: "2025-06-22T15:00:00Z",
    accountName: "Sunrise Imports Ltd", accountNumber: "ACC-00567",
  },
  {
    id: 7, alertId: "ALT-2025-007", accountId: 10,
    severity: "HIGH", status: "UNDER_INVESTIGATION", pattern: "Layering",
    amount: 1200000, assignee: "Agent Rivera",
    description: "Suspicious inbound wires from high-risk jurisdictions matched to sanction-adjacent counterparties.",
    createdAt: "2025-06-13T12:00:00Z", updatedAt: "2025-06-20T08:00:00Z",
    accountName: "Nexus Capital Partners", accountNumber: "ACC-00188",
  },
  {
    id: 8, alertId: "ALT-2025-008", accountId: 7,
    severity: "MEDIUM", status: "OPEN", pattern: "Unusual Wire Pattern",
    amount: 210000, assignee: null,
    description: "Multiple rapid outbound international wires to previously unseen counterparties.",
    createdAt: "2025-06-12T16:30:00Z", updatedAt: "2025-06-12T16:30:00Z",
    accountName: "Chen Wei Trading", accountNumber: "ACC-00778",
  },
  {
    id: 9, alertId: "ALT-2025-009", accountId: 5,
    severity: "LOW", status: "CLOSED", pattern: "Unusual Cash Patterns",
    amount: 45000, assignee: "Agent Okafor",
    description: "Small but unusual ATM withdrawal pattern. Cleared after customer explanation.",
    createdAt: "2025-06-10T11:00:00Z", updatedAt: "2025-06-11T09:00:00Z",
    accountName: "Elena Vasquez", accountNumber: "ACC-00312",
  },
  {
    id: 10, alertId: "ALT-2025-010", accountId: 2,
    severity: "HIGH", status: "OPEN", pattern: "Structuring",
    amount: 680000, assignee: null,
    description: "Secondary structuring alert — new pattern emerged after status change on ALT-2025-002.",
    createdAt: "2025-06-22T07:00:00Z", updatedAt: "2025-06-22T07:00:00Z",
    accountName: "Phantom Holdings LLC", accountNumber: "ACC-00891",
  },
];

// ── ALERT TIMELINE ────────────────────────────────────────────

export const staticAlertTimeline: AlertTimeline[] = [
  {
    id: 1, alertId: 1, eventType: "ALERT_CREATED",
    description: "Alert created by automated transaction monitoring system.",
    actor: "System", metadata: null,
    createdAt: "2025-06-20T08:00:00Z", timestamp: "2025-06-20T08:00:00Z",
  },
  {
    id: 2, alertId: 1, eventType: "ASSIGNED",
    description: "Alert assigned to Agent Chen for investigation.",
    actor: "Supervisor Martinez", metadata: null,
    createdAt: "2025-06-20T09:15:00Z", timestamp: "2025-06-20T09:15:00Z",
  },
  {
    id: 3, alertId: 1, eventType: "NOTE_ADDED",
    description: "Investigator confirmed offshore entity linkage via OFAC cross-reference.",
    actor: "Agent Chen", metadata: null,
    createdAt: "2025-06-20T10:30:00Z", timestamp: "2025-06-20T10:30:00Z",
  },
  {
    id: 4, alertId: 2, eventType: "ALERT_CREATED",
    description: "Alert auto-generated by behavioural analytics engine.",
    actor: "System", metadata: null,
    createdAt: "2025-06-19T06:30:00Z", timestamp: "2025-06-19T06:30:00Z",
  },
  {
    id: 5, alertId: 2, eventType: "STATUS_CHANGED",
    description: "Alert status escalated from OPEN to UNDER_INVESTIGATION.",
    actor: "Agent Rivera", metadata: "{\"from\":\"OPEN\",\"to\":\"UNDER_INVESTIGATION\"}",
    createdAt: "2025-06-20T11:00:00Z", timestamp: "2025-06-20T11:00:00Z",
  },
  {
    id: 6, alertId: 2, eventType: "DOCUMENT_ADDED",
    description: "SAR draft attached to case file.",
    actor: "Agent Rivera", metadata: null,
    createdAt: "2025-06-21T13:45:00Z", timestamp: "2025-06-21T13:45:00Z",
  },
];

// ── TRANSACTIONS ──────────────────────────────────────────────

export const staticTransactions: Transaction[] = [
  {
    id: 1, txnId: "TXN-20250620-001", fromAccount: "ACC-00234", toAccount: "ACC-EXT-KY-001",
    amount: 950000, currency: "USD", txnType: "Wire Transfer",
    timestamp: "2025-06-20T07:30:00Z", status: "COMPLETED", channel: "SWIFT",
    flagged: true, flagReason: "Offshore layering", alertId: 1, createdAt: "2025-06-20T07:30:00Z",
  },
  {
    id: 2, txnId: "TXN-20250620-002", fromAccount: "ACC-EXT-KY-001", toAccount: "ACC-00891",
    amount: 870000, currency: "USD", txnType: "Wire Transfer",
    timestamp: "2025-06-20T09:15:00Z", status: "COMPLETED", channel: "SWIFT",
    flagged: true, flagReason: "Layering leg 2", alertId: 1, createdAt: "2025-06-20T09:15:00Z",
  },
  {
    id: 3, txnId: "TXN-20250619-001", fromAccount: "ACC-EXT-UAE-002", toAccount: "ACC-00891",
    amount: 1590000, currency: "USD", txnType: "Wire Transfer",
    timestamp: "2025-06-19T06:00:00Z", status: "COMPLETED", channel: "SWIFT",
    flagged: true, flagReason: "Money mule inbound", alertId: 2, createdAt: "2025-06-19T06:00:00Z",
  },
  {
    id: 4, txnId: "TXN-20250619-002", fromAccount: "ACC-00891", toAccount: "ACC-01102",
    amount: 245000, currency: "USD", txnType: "Transfer",
    timestamp: "2025-06-19T10:30:00Z", status: "COMPLETED", channel: "Online Banking",
    flagged: true, flagReason: "Mule distribution", alertId: 2, createdAt: "2025-06-19T10:30:00Z",
  },
  {
    id: 5, txnId: "TXN-20250618-001", fromAccount: "ACC-00445", toAccount: "ACC-EXT-PA-001",
    amount: 490000, currency: "USD", txnType: "Wire Transfer",
    timestamp: "2025-06-18T12:00:00Z", status: "COMPLETED", channel: "SWIFT",
    flagged: true, flagReason: "Round-trip leg 1", alertId: 3, createdAt: "2025-06-18T12:00:00Z",
  },
  {
    id: 6, txnId: "TXN-20250617-001", fromAccount: "ACC-01102", toAccount: "ACC-EXT-EU-003",
    amount: 29800, currency: "USD", txnType: "Cash Deposit",
    timestamp: "2025-06-17T08:00:00Z", status: "COMPLETED", channel: "Branch",
    flagged: true, flagReason: "Structuring", alertId: 4, createdAt: "2025-06-17T08:00:00Z",
  },
  {
    id: 7, txnId: "TXN-20250617-002", fromAccount: "ACC-01102", toAccount: "ACC-EXT-EU-003",
    amount: 29500, currency: "USD", txnType: "Cash Deposit",
    timestamp: "2025-06-17T14:20:00Z", status: "COMPLETED", channel: "Branch",
    flagged: true, flagReason: "Structuring", alertId: 4, createdAt: "2025-06-17T14:20:00Z",
  },
  {
    id: 8, txnId: "TXN-20250620-003", fromAccount: "ACC-00188", toAccount: "ACC-EXT-KY-001",
    amount: 600000, currency: "USD", txnType: "Wire Transfer",
    timestamp: "2025-06-20T08:00:00Z", status: "COMPLETED", channel: "SWIFT",
    flagged: true, flagReason: "High-risk jurisdiction", alertId: 7, createdAt: "2025-06-20T08:00:00Z",
  },
  {
    id: 9, txnId: "TXN-20250616-001", fromAccount: "ACC-00778", toAccount: "ACC-EXT-CN-001",
    amount: 105000, currency: "USD", txnType: "Wire Transfer",
    timestamp: "2025-06-16T10:00:00Z", status: "COMPLETED", channel: "SWIFT",
    flagged: false, flagReason: null, alertId: null, createdAt: "2025-06-16T10:00:00Z",
  },
  {
    id: 10, txnId: "TXN-20250615-001", fromAccount: "ACC-EXT-RU-001", toAccount: "ACC-00923",
    amount: 750000, currency: "USD", txnType: "Wire Transfer",
    timestamp: "2025-06-15T00:01:00Z", status: "COMPLETED", channel: "SWIFT",
    flagged: true, flagReason: "Dormant reactivation", alertId: 5, createdAt: "2025-06-15T00:01:00Z",
  },
  {
    id: 11, txnId: "TXN-20250622-001", fromAccount: "ACC-00655", toAccount: "ACC-00234",
    amount: 12000, currency: "USD", txnType: "Transfer",
    timestamp: "2025-06-22T09:00:00Z", status: "COMPLETED", channel: "Mobile App",
    flagged: false, flagReason: null, alertId: null, createdAt: "2025-06-22T09:00:00Z",
  },
  {
    id: 12, txnId: "TXN-20250614-001", fromAccount: "ACC-00567", toAccount: "ACC-EXT-UAE-002",
    amount: 320000, currency: "USD", txnType: "Cash Deposit",
    timestamp: "2025-06-14T08:30:00Z", status: "COMPLETED", channel: "Branch",
    flagged: true, flagReason: "Unusual cash patterns", alertId: 6, createdAt: "2025-06-14T08:30:00Z",
  },
];

// ── EVIDENCE CASES ────────────────────────────────────────────

export const staticEvidenceCases: EvidenceCase[] = [
  {
    id: 1, caseId: "CASE-2025-001",
    title: "Meridian Trade Corp AML Investigation",
    investigator: "Agent Sarah Chen",
    alertId: "ALT-2025-001",
    status: "ACTIVE",
    description: "Comprehensive investigation into offshore layering scheme involving three shell entities in the Cayman Islands.",
    suspiciousAccounts: ["ACC-00234", "ACC-00891", "ACC-EXT-KY-001"],
    totalAmount: 4430000,
    packageGenerated: true,
    createdAt: "2025-06-20T10:00:00Z",
    updatedAt: "2025-06-22T08:00:00Z",
  },
  {
    id: 2, caseId: "CASE-2025-002",
    title: "Phantom Holdings Money Mule Network",
    investigator: "Agent Marcus Rivera",
    alertId: "ALT-2025-002",
    status: "OPEN",
    description: "Multi-account money mule network distributing proceeds from offshore fraud across 12 sub-accounts.",
    suspiciousAccounts: ["ACC-00891", "ACC-01102", "ACC-EXT-UAE-002"],
    totalAmount: 2270000,
    packageGenerated: false,
    createdAt: "2025-06-19T12:00:00Z",
    updatedAt: "2025-06-21T14:00:00Z",
  },
  {
    id: 3, caseId: "CASE-2025-003",
    title: "Golden Gate Ventures Round-Trip Analysis",
    investigator: "Agent Kwame Okafor",
    alertId: "ALT-2025-003",
    status: "FIU_SUBMITTED",
    description: "Confirmed round-tripping scheme. STR filed with FIU on 2025-06-21.",
    suspiciousAccounts: ["ACC-00445", "ACC-EXT-PA-001"],
    totalAmount: 980000,
    packageGenerated: true,
    createdAt: "2025-06-18T15:00:00Z",
    updatedAt: "2025-06-21T16:00:00Z",
  },
];

// ── CASE FINDINGS ─────────────────────────────────────────────

export const staticCaseFindings: CaseFinding[] = [
  {
    id: 1, caseId: 1, category: "Transaction Analysis",
    finding: "Complex layering through Cayman shell entities",
    severity: "CRITICAL",
    evidence: "Three-stage wire transfers totaling $2.84M within 48 hours, routed through KY-registered entities with no identifiable business purpose.",
    createdAt: "2025-06-20T11:00:00Z",
  },
  {
    id: 2, caseId: 1, category: "Sanctions Screening",
    finding: "OFAC SDN match on Meridian Trade Corp",
    severity: "CRITICAL",
    evidence: "Entity name and registration number match blocked entity on OFAC SDN list — March 2024 designation.",
    createdAt: "2025-06-20T12:00:00Z",
  },
  {
    id: 3, caseId: 1, category: "KYC Review",
    finding: "KYC documentation outdated and incomplete",
    severity: "HIGH",
    evidence: "Last KYC update was November 2023. Beneficial ownership documents missing for two subsidiary entities.",
    createdAt: "2025-06-21T09:00:00Z",
  },
  {
    id: 4, caseId: 2, category: "Network Analysis",
    finding: "Confirmed money mule network — 12 sub-accounts",
    severity: "CRITICAL",
    evidence: "Graph analysis reveals hub-and-spoke distribution pattern. Phantom Holdings receives large inflows then redistributes in smaller amounts within 6 hours.",
    createdAt: "2025-06-19T13:00:00Z",
  },
  {
    id: 5, caseId: 2, category: "Behavioral Analysis",
    finding: "Rapid velocity transactions inconsistent with stated business",
    severity: "HIGH",
    evidence: "200+ transactions in 30 days versus stated 10-15 per month for holding company operations.",
    createdAt: "2025-06-20T14:00:00Z",
  },
  {
    id: 6, caseId: 3, category: "Fund Flow",
    finding: "Round-trip confirmed — funds returned to originator",
    severity: "HIGH",
    evidence: "Full cycle traced: ACC-00445 → Panama intermediary → Cayman entity → ACC-00445 within 72 hours. Net economic effect zero.",
    createdAt: "2025-06-18T16:00:00Z",
  },
];

// ── DASHBOARD KPIs ────────────────────────────────────────────

export const staticDashboardKpis = {
  totalTransactions: 48291,
  transactionChange: 12,
  activeAlerts: staticAlerts.filter(a => a.status !== "CLOSED").length,
  alertChange: 8,
  highRiskAccounts: staticAccounts.filter(a => a.riskLevel === "HIGH" || a.riskLevel === "CRITICAL").length,
  riskChange: -3,
  dormantActivated: 4,
  dormantChange: 2,
};

// ── TRANSACTION TREND (14 days) ───────────────────────────────

export const staticTransactionTrend = [
  { date: "2025-06-09", volume: 3100, flagged: 42 },
  { date: "2025-06-10", volume: 3580, flagged: 61 },
  { date: "2025-06-11", volume: 2940, flagged: 38 },
  { date: "2025-06-12", volume: 4120, flagged: 75 },
  { date: "2025-06-13", volume: 3890, flagged: 89 },
  { date: "2025-06-14", volume: 4440, flagged: 102 },
  { date: "2025-06-15", volume: 2810, flagged: 55 },
  { date: "2025-06-16", volume: 3660, flagged: 68 },
  { date: "2025-06-17", volume: 5120, flagged: 130 },
  { date: "2025-06-18", volume: 4780, flagged: 118 },
  { date: "2025-06-19", volume: 3240, flagged: 80 },
  { date: "2025-06-20", volume: 6010, flagged: 155 },
  { date: "2025-06-21", volume: 4390, flagged: 92 },
  { date: "2025-06-22", volume: 5540, flagged: 141 },
];

// ── RISK DISTRIBUTION ─────────────────────────────────────────

export const staticRiskDistribution = [
  { level: "CRITICAL", count: 2, percentage: 20 },
  { level: "HIGH",     count: 4, percentage: 40 },
  { level: "MEDIUM",   count: 3, percentage: 30 },
  { level: "LOW",      count: 1, percentage: 10 },
];

// ── FRAUD PATTERNS ────────────────────────────────────────────

export const staticFraudPatterns = [
  { pattern: "Layering",     count: 18 },
  { pattern: "Structuring",  count: 14 },
  { pattern: "Round-Trip",   count: 9  },
  { pattern: "Mule Network", count: 7  },
  { pattern: "Dormant Act.", count: 4  },
];

// ── TOP SUSPICIOUS ACCOUNTS (dashboard) ──────────────────────

export const staticTopSuspiciousAccounts = [
  { id: 1, accountName: "Meridian Trade Corp",  accountNumber: "ACC-00234", riskScore: 96, alertCount: 2, totalSuspiciousAmount: 4430000 },
  { id: 8, accountName: "Dormant Shell Entity", accountNumber: "ACC-00923", riskScore: 91, alertCount: 1, totalSuspiciousAmount: 750000  },
  { id: 2, accountName: "Phantom Holdings LLC", accountNumber: "ACC-00891", riskScore: 88, alertCount: 2, totalSuspiciousAmount: 2270000 },
  { id: 6, accountName: "Golden Gate Ventures", accountNumber: "ACC-00445", riskScore: 82, alertCount: 1, totalSuspiciousAmount: 980000  },
  { id: 3, accountName: "James Okafor",         accountNumber: "ACC-01102", riskScore: 74, alertCount: 1, totalSuspiciousAmount: 487000  },
];

// ── GRAPH NETWORK ─────────────────────────────────────────────

export type GraphNode = {
  id: string; label: string; accountNumber: string;
  riskLevel: string; accountType: string; balance: number;
  flagged: boolean; pattern: string | null; x: null; y: null;
};

export type GraphEdge = {
  id: string; source: string; target: string;
  amount: number; flagged: boolean; pattern: string | null;
  txnId: string; txnType: string; timestamp: string;
};

export const staticGraphNodes: GraphNode[] = [
  { id: "1",  label: "Meridian Trade Corp",  accountNumber: "ACC-00234",   riskLevel: "CRITICAL", accountType: "Business",      balance: 2840000, flagged: true,  pattern: "Layering",           x: null, y: null },
  { id: "2",  label: "Phantom Holdings LLC", accountNumber: "ACC-00891",   riskLevel: "CRITICAL", accountType: "Corporate",     balance: 1590000, flagged: true,  pattern: "Money Mule Network", x: null, y: null },
  { id: "3",  label: "James Okafor",         accountNumber: "ACC-01102",   riskLevel: "HIGH",     accountType: "Personal",      balance: 487000,  flagged: true,  pattern: "Structuring",        x: null, y: null },
  { id: "4",  label: "Sunrise Imports Ltd",  accountNumber: "ACC-00567",   riskLevel: "MEDIUM",   accountType: "Business",      balance: 920000,  flagged: false, pattern: null,                 x: null, y: null },
  { id: "5",  label: "Elena Vasquez",        accountNumber: "ACC-00312",   riskLevel: "MEDIUM",   accountType: "Personal",      balance: 126500,  flagged: false, pattern: null,                 x: null, y: null },
  { id: "6",  label: "Golden Gate Ventures", accountNumber: "ACC-00445",   riskLevel: "HIGH",     accountType: "Business",      balance: 3400000, flagged: true,  pattern: "Round-Tripping",     x: null, y: null },
  { id: "7",  label: "Dormant Shell Entity", accountNumber: "ACC-00923",   riskLevel: "CRITICAL", accountType: "Dormant Account", balance: 0,    flagged: true,  pattern: "Layering",           x: null, y: null },
  { id: "8",  label: "Nexus Capital Partners", accountNumber: "ACC-00188", riskLevel: "HIGH",     accountType: "Business",      balance: 5120000, flagged: true,  pattern: "Layering",           x: null, y: null },
  { id: "9",  label: "Cayman Offshore 1",    accountNumber: "ACC-EXT-KY-001", riskLevel: "CRITICAL", accountType: "Corporate", balance: 0,       flagged: true,  pattern: "Layering",           x: null, y: null },
  { id: "10", label: "UAE Intermediary",     accountNumber: "ACC-EXT-UAE-002", riskLevel: "HIGH", accountType: "Business",    balance: 0,       flagged: true,  pattern: "Money Mule Network", x: null, y: null },
  { id: "11", label: "Panama Entity",        accountNumber: "ACC-EXT-PA-001", riskLevel: "HIGH",  accountType: "Corporate",   balance: 0,       flagged: true,  pattern: "Round-Tripping",     x: null, y: null },
  { id: "12", label: "Chen Wei Trading",     accountNumber: "ACC-00778",   riskLevel: "MEDIUM",   accountType: "Corporate",     balance: 641000,  flagged: false, pattern: null,                 x: null, y: null },
];

export const staticGraphEdges: GraphEdge[] = [
  { id: "e-1",  source: "1",  target: "9",  amount: 950000,  flagged: true,  pattern: "Layering",           txnId: "TXN-20250620-001", txnType: "Wire Transfer", timestamp: "2025-06-20T07:30:00Z" },
  { id: "e-2",  source: "9",  target: "2",  amount: 870000,  flagged: true,  pattern: "Layering",           txnId: "TXN-20250620-002", txnType: "Wire Transfer", timestamp: "2025-06-20T09:15:00Z" },
  { id: "e-3",  source: "10", target: "2",  amount: 1590000, flagged: true,  pattern: "Money Mule Network", txnId: "TXN-20250619-001", txnType: "Wire Transfer", timestamp: "2025-06-19T06:00:00Z" },
  { id: "e-4",  source: "2",  target: "3",  amount: 245000,  flagged: true,  pattern: "Money Mule Network", txnId: "TXN-20250619-002", txnType: "Transfer",      timestamp: "2025-06-19T10:30:00Z" },
  { id: "e-5",  source: "6",  target: "11", amount: 490000,  flagged: true,  pattern: "Round-Tripping",     txnId: "TXN-20250618-001", txnType: "Wire Transfer", timestamp: "2025-06-18T12:00:00Z" },
  { id: "e-6",  source: "11", target: "6",  amount: 485000,  flagged: true,  pattern: "Round-Tripping",     txnId: "TXN-20250621-001", txnType: "Wire Transfer", timestamp: "2025-06-21T10:00:00Z" },
  { id: "e-7",  source: "3",  target: "10", amount: 29800,   flagged: true,  pattern: "Structuring",        txnId: "TXN-20250617-001", txnType: "Cash Deposit",  timestamp: "2025-06-17T08:00:00Z" },
  { id: "e-8",  source: "3",  target: "10", amount: 29500,   flagged: true,  pattern: "Structuring",        txnId: "TXN-20250617-002", txnType: "Cash Deposit",  timestamp: "2025-06-17T14:20:00Z" },
  { id: "e-9",  source: "8",  target: "9",  amount: 600000,  flagged: true,  pattern: "Layering",           txnId: "TXN-20250620-003", txnType: "Wire Transfer", timestamp: "2025-06-20T08:00:00Z" },
  { id: "e-10", source: "4",  target: "12", amount: 130000,  flagged: false, pattern: null,                 txnId: "TXN-20250615-002", txnType: "Transfer",      timestamp: "2025-06-15T11:00:00Z" },
  { id: "e-11", source: "5",  target: "1",  amount: 12000,   flagged: false, pattern: null,                 txnId: "TXN-20250622-001", txnType: "Transfer",      timestamp: "2025-06-22T09:00:00Z" },
  { id: "e-12", source: "7",  target: "1",  amount: 750000,  flagged: true,  pattern: "Layering",           txnId: "TXN-20250615-001", txnType: "Wire Transfer", timestamp: "2025-06-15T00:01:00Z" },
];

export const staticGraphNetwork = {
  nodes: staticGraphNodes,
  edges: staticGraphEdges,
  stats: {
    totalNodes: staticGraphNodes.length,
    totalEdges: staticGraphEdges.length,
    flaggedNodes: staticGraphNodes.filter(n => n.flagged).length,
    flaggedEdges: staticGraphEdges.filter(e => e.flagged).length,
    detectedClusters: 4,
  },
};

// ── GRAPH PATTERNS ────────────────────────────────────────────

export const staticGraphPatterns = [
  {
    id: "p1", patternType: "Layering",
    affectedAccounts: ["ACC-00234", "ACC-00891", "ACC-EXT-KY-001", "ACC-00188", "ACC-00923"],
    totalAmount: 3170000, confidence: 94,
    description: "Multi-hop fund movement through offshore entities to obscure origin.",
  },
  {
    id: "p2", patternType: "Money Mule Network",
    affectedAccounts: ["ACC-00891", "ACC-01102", "ACC-EXT-UAE-002"],
    totalAmount: 1864800, confidence: 88,
    description: "Hub-and-spoke distribution of proceeds through coordinated mule accounts.",
  },
  {
    id: "p3", patternType: "Round-Tripping",
    affectedAccounts: ["ACC-00445", "ACC-EXT-PA-001"],
    totalAmount: 975000, confidence: 91,
    description: "Funds looped back to originating account to create illusion of legitimate revenue.",
  },
  {
    id: "p4", patternType: "Structuring",
    affectedAccounts: ["ACC-01102", "ACC-EXT-UAE-002"],
    totalAmount: 59300, confidence: 82,
    description: "Multiple transactions deliberately kept below CTR threshold.",
  },
];

// ── HELPER: get data by account ID ───────────────────────────

export function getKycByAccountId(accountId: number): Kyc | undefined {
  return staticKyc.find(k => k.accountId === accountId);
}

export function getNotesByAccountId(accountId: number): InvestigationNote[] {
  return staticNotes.filter(n => n.accountId === accountId);
}

export function getTransactionsByAccountId(accountId: number): Transaction[] {
  const acc = staticAccounts.find(a => a.id === accountId);
  if (!acc) return [];
  return staticTransactions.filter(
    t => t.fromAccount === acc.accountNumber || t.toAccount === acc.accountNumber
  );
}

export function getAlertsByAccountId(accountId: number): Alert[] {
  return staticAlerts.filter(a => a.accountId === accountId);
}

export function getTimelineByAlertId(alertId: number): AlertTimeline[] {
  return staticAlertTimeline.filter(t => t.alertId === alertId);
}

export function getFindingsByCaseId(caseId: number): CaseFinding[] {
  return staticCaseFindings.filter(f => f.caseId === caseId);
}

// ── ACCOUNT RISK FACTORS (computed per-account) ───────────────

export function getRiskFactors(account: Account) {
  const kyc = getKycByAccountId(account.id);
  const alerts = getAlertsByAccountId(account.id);
  return [
    {
      factor: "Transaction Velocity",
      score: Math.min(100, alerts.length * 30 + 10),
      description: `${alerts.length} alert(s) detected on this account.`,
    },
    {
      factor: "Sanctions Exposure",
      score: kyc?.sanctionStatus ? 95 : 5,
      description: kyc?.sanctionStatus ? "Entity appears on OFAC SDN list." : "No sanctions matches found.",
    },
    {
      factor: "PEP Association",
      score: kyc?.pepStatus ? 80 : 10,
      description: kyc?.pepStatus ? "Politically exposed person — enhanced due diligence required." : "No PEP linkage identified.",
    },
    {
      factor: "KYC Completeness",
      score: kyc?.kycLevel === "ENHANCED" ? 70 : kyc?.kycLevel === "STANDARD" ? 40 : 20,
      description: `KYC level: ${kyc?.kycLevel ?? "UNKNOWN"}. Last review: ${kyc?.lastKycDate ?? "N/A"}.`,
    },
  ];
}

export function getSuspiciousBehaviors(account: Account) {
  const alerts = getAlertsByAccountId(account.id);
  return alerts.map(a => ({
    behavior: a.pattern,
    severity: a.severity,
    details: a.description ?? "Suspicious behavior detected by automated monitoring.",
    detectedAt: a.createdAt,
  }));
}

// ── EVIDENCE CASE DETAIL ──────────────────────────────────────

export function getCaseDetail(caseId: number) {
  const c = staticEvidenceCases.find(ec => ec.id === caseId);
  if (!c) return null;
  const findings = getFindingsByCaseId(caseId);
  const linkedAlert = staticAlerts.find(a => a.alertId === c.alertId);
  const relatedTxns = linkedAlert
    ? staticTransactions.filter(t => t.alertId === linkedAlert.id)
    : staticTransactions.filter(t => t.flagged).slice(0, 4);

  const fundFlowSummary = relatedTxns.slice(0, 4).map((t, i) => ({
    step: i + 1,
    fromAccount: t.fromAccount,
    toAccount: t.toAccount,
    amount: t.amount,
    method: t.txnType,
    timestamp: t.timestamp,
  }));

  return {
    case: c,
    findings,
    fundFlowSummary,
    fiuReportData: {
      reportId: `FIU-RPT-${c.caseId}`,
      reportingEntity: "G-TEN Financial Intelligence Platform",
      reportDate: new Date(c.updatedAt).toLocaleDateString(),
      suspiciousActivityType: linkedAlert?.pattern ?? "Complex Financial Crime",
      narrativeSummary: `This Suspicious Activity Report (SAR) documents financial activity identified through automated behavioural analysis and investigator review. The subject entity — ${c.suspiciousAccounts[0] ?? "Unknown"} — engaged in transaction patterns consistent with ${linkedAlert?.pattern ?? "money laundering"}, with a total exposure of ₹${(c.totalAmount / 1_000_000).toFixed(2)}M across the reporting period.`,
      actionRequired: "File with the Financial Intelligence Unit within 30 days. Preserve all transaction records and account documentation for regulatory review. Do not tip off the subject.",
    },
  };
}
