import type {
  PartnerApplication,
  RecruitmentInterest,
  JobIssue,
  JobSafetyTest,
  SafetyAttempt,
  SafetyStateItem,
  StateInspectionGuidance,
  SiteCheckIn,
  ActivityEvent,
  Alert,
  AutomationRule,
  BotConfig,
  CallLogEntry,
  CommChannel,
  CommMessage,
  CommSequence,
  CommTemplate,
  CommissionEntry,
  Competitor,
  Contract,
  ContractSignature,
  Conversation,
  CounterOffer,
  Deal,
  DealCelebration,
  DealClosure,
  DealTerms,
  DiscountRequest,
  DuplicatePair,
  FollowUpTask,
  GeoZone,
  Job,
  Language,
  Lead,
  LeadImportBatch,
  LeadSource,
  FinancingPartnerRate,
  LeadTimelineEvent,
  LoanApplication,
  Negotiation,
  NegotiationBotConfig,
  ObjectionScript,
  ObjectionScriptUsage,
  OptOutEvent,
  Payment,
  PaymentReminderConfig,
  PaymentReminderPause,
  PaymentSchedule,
  PricingConfig,
  Quotation,
  QuotationTemplate,
  RoutePlan,
  ScoreWeightingProfile,
  SeriesPoint,
  SiteVisitVerification,
  SmsBroadcast,
  Supplier,
  SupplierCatalogItem,
  PoFulfilmentStage,
  DefectAttribution,
  SupplierOrderRating,
  SupplierScoreContextNote,
  SupplierAgreementTerms,
  SupplierAgreementVersion,
  SupplierMessage,
  SupplierThread,
  DeliveryDelayCase,
  DeliverySopStep,
  DeliverySopTemplate,
  ShipmentLeg,
  DeliveryPartner,
  PartnerTripRecord,
  DeliveryDisruption,
  DeliveryDiscrepancyReport,
  SupplierInvoice,
  SupplierPaymentAdjustment,
  SupplierGstCheck,
  BankTransaction,
  InstallSopSlot,
  InstallSopVersion,
  SupplierDispute,
  SupplierPayment,
  SupplierPaymentPart,
  SupplierPaymentTrigger,
  ShipmentMilestone,
  ShipmentMilestoneEvent,
  DeliverySchedule,
  DeliveryWindow,
  SiteReadiness,
  SupplierDispatchAvailability,
  SupplierTermsChange,
  SupplierRetention,
  ProductionEvent,
  ProductionRecord,
  ProductionStage,
  PoStatusEvent,
  PurchaseOrderLineItem,
  CatalogPriceChange,
  SupplierPurchaseOrder,
  TriggerRule,
  User,
} from './types';
import { addDaysKey, dateKey } from '../features/logistics/deliverySlots';
import { defaultTermsOf as seedDefaultTerms } from '../features/recruitment/agreement';
import { DEFAULT_WEIGHTS as SCREEN_WEIGHTS, FACTORS as SCREEN_FACTORS } from '../features/recruitment/screening';

/**
 * The seeded AIEC demo dataset.
 *
 * Every record carries `isDemo: true`. This is the entire dataset Demo Mode
 * reads; there is no production data in this build, and the repository refuses
 * writes that would mix the two (see repository.ts).
 *
 * Grounded in the real Pune / Pimpri-Chinchwad market the brief describes:
 * genuine locality names and coordinates, and lift prices in the range Indian
 * passenger-lift quotes actually land in (roughly ₹8L for a small 4-stop MRL
 * up to ₹40L+ for a high-rise commercial bank of lifts).
 */

/* --------------------------------------------------------------- Time base */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Anchored at load so the demo always reads as "live" rather than stale. */
const NOW = Date.now();

const at = (offsetMs: number) => new Date(NOW + offsetMs).toISOString();
export const minutesAgo = (n: number) => at(-n * MINUTE);
export const hoursAgo = (n: number) => at(-n * HOUR);
export const daysAgo = (n: number) => at(-n * DAY);
export const daysAhead = (n: number) => at(n * DAY);
export const hoursAhead = (n: number) => at(n * HOUR);

/** Deterministic PRNG so charts look identical on every reload. */
function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0xffffffff;
  };
}

/* ------------------------------------------------------------------- Users */

export const seedUsers: User[] = [
  {
    id: 'u-admin-1',
    role: 'admin',
    name: 'Prashant Vasant Wable',
    phone: '9822011001',
    email: 'owner@aiec.example',
    status: 'active',
    preferredLanguage: 'en',
    themePreference: 'light',
    isDemo: true,
    city: 'Pune',
    joinedAt: daysAgo(720),
    rating: 5,
  },
  {
    id: 'u-srv-1',
    role: 'surveyor',
    reportsTo: 'u-admin-1',
    name: 'Ganesh Pawar',
    phone: '9822022001',
    status: 'active',
    preferredLanguage: 'mr',
    themePreference: 'light',
    isDemo: true,
    city: 'Pune',
    territory: 'z-hinjawadi',
    joinedAt: daysAgo(310),
    rating: 4.8,
    onDuty: true,
    location: { lat: 18.5913, lng: 73.7389 },
    lastSeenAt: minutesAgo(3),
    documents: [
      { id: 'd1', kind: 'aadhaar', label: 'Aadhaar', status: 'verified', uploadedAt: daysAgo(310) },
      { id: 'd2', kind: 'pan', label: 'PAN', status: 'verified', uploadedAt: daysAgo(310) },
      { id: 'd3', kind: 'bank', label: 'Bank passbook', status: 'verified', uploadedAt: daysAgo(309) },
    ],
  },
  {
    id: 'u-srv-2',
    role: 'surveyor',
    reportsTo: 'u-admin-1',
    name: 'Sunita Deshmukh',
    phone: '9822022002',
    status: 'active',
    preferredLanguage: 'hi',
    themePreference: 'snow',
    isDemo: true,
    city: 'Pune',
    territory: 'z-kharadi',
    joinedAt: daysAgo(210),
    rating: 4.9,
    onDuty: true,
    location: { lat: 18.5515, lng: 73.947 },
    lastSeenAt: minutesAgo(11),
  },
  {
    id: 'u-srv-3',
    role: 'surveyor',
    reportsTo: 'u-admin-1',
    name: 'Imran Shaikh',
    phone: '9822022003',
    status: 'active',
    preferredLanguage: 'en',
    themePreference: 'dark',
    isDemo: true,
    city: 'Pimpri-Chinchwad',
    territory: 'z-pimpri',
    joinedAt: daysAgo(160),
    rating: 4.4,
    onDuty: true,
    location: { lat: 18.6298, lng: 73.7997 },
    lastSeenAt: minutesAgo(1),
  },
  {
    id: 'u-srv-4',
    role: 'surveyor',
    reportsTo: 'u-admin-1',
    name: 'Rohit Jadhav',
    phone: '9822022004',
    status: 'active',
    preferredLanguage: 'mr',
    themePreference: 'light',
    isDemo: true,
    city: 'Pune',
    territory: 'z-kothrud',
    joinedAt: daysAgo(95),
    rating: 4.1,
    onDuty: false,
    location: { lat: 18.5074, lng: 73.8077 },
    lastSeenAt: hoursAgo(14),
  },
  {
    id: 'u-srv-5',
    role: 'surveyor',
    reportsTo: 'u-admin-1',
    name: 'Kavita Bhosale',
    phone: '9822022005',
    status: 'pending_approval',
    preferredLanguage: 'mr',
    themePreference: 'light',
    isDemo: true,
    city: 'Pune',
    joinedAt: daysAgo(2),
    documents: [
      { id: 'd4', kind: 'aadhaar', label: 'Aadhaar', status: 'uploaded', uploadedAt: daysAgo(2) },
      { id: 'd5', kind: 'pan', label: 'PAN', status: 'uploaded', uploadedAt: daysAgo(2) },
      { id: 'd6', kind: 'bank', label: 'Bank passbook', status: 'missing' },
    ],
  },
  {
    id: 'u-tech-1',
    role: 'technician',
    reportsTo: 'u-admin-1',
    name: 'Santosh Kale',
    phone: '9822033001',
    status: 'active',
    preferredLanguage: 'mr',
    themePreference: 'dark',
    isDemo: true,
    city: 'Pune',
    joinedAt: daysAgo(430),
    rating: 4.9,
    onDuty: true,
    location: { lat: 18.515, lng: 73.928 },
    lastSeenAt: minutesAgo(6),
    skills: ['mrl_install', 'traction', 'door_operator', 'wiring'],
    documents: [
      {
        id: 'd7',
        kind: 'certificate',
        label: 'ITI Electrician',
        status: 'verified',
        uploadedAt: daysAgo(430),
      },
      {
        id: 'd8',
        kind: 'licence',
        label: 'Lift mechanic licence',
        status: 'verified',
        uploadedAt: daysAgo(430),
      },
      { id: 'd9', kind: 'insurance', label: 'Accident cover', status: 'verified', uploadedAt: daysAgo(120) },
    ],
  },
  {
    id: 'u-tech-2',
    role: 'technician',
    reportsTo: 'u-admin-1',
    name: 'Vishal More',
    phone: '9822033002',
    status: 'active',
    preferredLanguage: 'hi',
    themePreference: 'light',
    isDemo: true,
    city: 'Pune',
    joinedAt: daysAgo(280),
    rating: 4.6,
    onDuty: true,
    location: { lat: 18.559, lng: 73.7868 },
    lastSeenAt: minutesAgo(22),
    skills: ['traction', 'hydraulic', 'controller', 'safety_rescue', 'mrl_gearless'],
  },
  {
    id: 'u-tech-3',
    role: 'technician',
    reportsTo: 'u-admin-1',
    name: 'Ajay Nikam',
    phone: '9822033003',
    status: 'active',
    preferredLanguage: 'mr',
    themePreference: 'light',
    isDemo: true,
    city: 'Pimpri-Chinchwad',
    joinedAt: daysAgo(150),
    rating: 4.2,
    onDuty: false,
    location: { lat: 18.642, lng: 73.7997 },
    lastSeenAt: hoursAgo(9),
    skills: ['mrl_install', 'wiring'],
  },
  {
    // A dedicated quality-check inspector (131): holds the mechanical, electrical and rescue tags, and is on no installation crew.
    id: 'u-tech-5',
    role: 'technician',
    reportsTo: 'u-admin-1',
    name: 'Anand Deshpande',
    phone: '9822033005',
    status: 'active',
    preferredLanguage: 'en',
    themePreference: 'light',
    isDemo: true,
    city: 'Pune',
    joinedAt: daysAgo(400),
    rating: 4.7,
    onDuty: true,
    location: { lat: 18.5204, lng: 73.8567 },
    lastSeenAt: minutesAgo(40),
    skills: ['mechanical', 'electrical', 'safety_rescue', 'mrl_gearless'],
    documents: [
      { id: 'd20', kind: 'certificate', label: 'Lift inspector course', status: 'verified', uploadedAt: daysAgo(380) },
      { id: 'd21', kind: 'licence', label: 'Electrical supervisor licence', status: 'verified', uploadedAt: daysAgo(380) },
    ],
  },
  {
    id: 'u-tech-4',
    role: 'technician',
    reportsTo: 'u-admin-1',
    name: 'Prakash Salunke',
    phone: '9822033004',
    status: 'pending_approval',
    preferredLanguage: 'mr',
    themePreference: 'light',
    isDemo: true,
    city: 'Pune',
    joinedAt: daysAgo(1),
    skills: ['wiring'],
    documents: [
      { id: 'd10', kind: 'certificate', label: 'ITI Electrician', status: 'uploaded', uploadedAt: daysAgo(1) },
      { id: 'd11', kind: 'licence', label: 'Lift mechanic licence', status: 'missing' },
    ],
  },
  {
    id: 'u-cust-1',
    role: 'customer',
    name: 'Rajesh Agarwal',
    phone: '9822044001',
    email: 'rajesh@shreeramdev.example',
    status: 'active',
    preferredLanguage: 'en',
    themePreference: 'light',
    isDemo: true,
    city: 'Pune',
    companyName: 'Shree Ram Developers',
    joinedAt: daysAgo(88),
  },
  {
    id: 'u-cust-2',
    role: 'customer',
    name: 'Meera Kulkarni',
    phone: '9822044002',
    status: 'active',
    preferredLanguage: 'mr',
    themePreference: 'light',
    isDemo: true,
    city: 'Pune',
    companyName: 'Kulkarni Constructions',
    joinedAt: daysAgo(46),
  },
  {
    id: 'u-cust-3',
    role: 'customer',
    name: 'Farhan Qureshi',
    phone: '9822044003',
    status: 'active',
    preferredLanguage: 'hi',
    themePreference: 'light',
    isDemo: true,
    city: 'Pimpri-Chinchwad',
    companyName: 'Skyline Realty',
    joinedAt: daysAgo(20),
  },
  {
    id: 'u-sup-1',
    role: 'supplier',
    name: 'Anil Mehta',
    phone: '9822055001',
    status: 'active',
    preferredLanguage: 'en',
    themePreference: 'light',
    isDemo: true,
    city: 'Mumbai',
    companyName: 'Vertex Elevator Components Pvt Ltd',
    gstin: '27AABCV1234A1Z5',
    joinedAt: daysAgo(500),
    rating: 4.7,
  },
  {
    id: 'u-sup-2',
    role: 'supplier',
    name: 'Deepak Rathi',
    phone: '9822055002',
    status: 'pending_approval',
    preferredLanguage: 'en',
    themePreference: 'light',
    isDemo: true,
    city: 'Ahmedabad',
    companyName: 'Rathi Lift Systems',
    gstin: '24AACFR5678B1Z2',
    joinedAt: daysAgo(4),
    documents: [
      { id: 'd12', kind: 'gst', label: 'GST certificate', status: 'uploaded', uploadedAt: daysAgo(4) },
      { id: 'd13', kind: 'pan', label: 'Company PAN', status: 'uploaded', uploadedAt: daysAgo(4) },
      { id: 'd14', kind: 'bank', label: 'Cancelled cheque', status: 'missing' },
    ],
  },
];

/* ------------------------------------------------------------------- Leads */

interface LeadSeed {
  id: string;
  code: string;
  stage: Lead['stage'];
  surveyorId: string;
  builderName: string;
  contactName: string;
  phone: string;
  siteName: string;
  address: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
  value: number;
  ageDays: number;
  stageDays: number;
  floors: number;
  capacity: number;
  score: number;
  lostReason?: string;
}

const leadSeeds: LeadSeed[] = [
  { id: 'l-1', code: 'AIEC-L-0101', stage: 'won', surveyorId: 'u-srv-1', builderName: 'Shree Ram Developers', contactName: 'Rajesh Agarwal', phone: '9822044001', siteName: 'Shree Ram Heights', address: 'Phase 2, Hinjawadi', city: 'Pune', pincode: '411057', lat: 18.5913, lng: 73.7389, value: 2_640_000, ageDays: 74, stageDays: 12, floors: 12, capacity: 8, score: 92 },
  { id: 'l-2', code: 'AIEC-L-0102', stage: 'won', surveyorId: 'u-srv-2', builderName: 'Kulkarni Constructions', contactName: 'Meera Kulkarni', phone: '9822044002', siteName: 'Kulkarni Signature', address: 'Kharadi Bypass', city: 'Pune', pincode: '411014', lat: 18.5515, lng: 73.947, value: 1_880_000, ageDays: 52, stageDays: 9, floors: 8, capacity: 6, score: 88 },
  { id: 'l-3', code: 'AIEC-L-0103', stage: 'negotiation', surveyorId: 'u-srv-3', builderName: 'Skyline Realty', contactName: 'Farhan Qureshi', phone: '9822044003', siteName: 'Skyline Corporate Park', address: 'Pimpri MIDC Road', city: 'Pimpri-Chinchwad', pincode: '411018', lat: 18.6298, lng: 73.7997, value: 4_120_000, ageDays: 30, stageDays: 6, floors: 14, capacity: 13, score: 85 },
  { id: 'l-4', code: 'AIEC-L-0104', stage: 'quoted', surveyorId: 'u-srv-1', builderName: 'Pinnacle Spaces', contactName: 'Amit Joshi', phone: '9822044004', siteName: 'Pinnacle Aurum', address: 'Balewadi High Street', city: 'Pune', pincode: '411045', lat: 18.575, lng: 73.769, value: 3_050_000, ageDays: 21, stageDays: 4, floors: 11, capacity: 10, score: 78 },
  { id: 'l-5', code: 'AIEC-L-0105', stage: 'quoted', surveyorId: 'u-srv-2', builderName: 'Green Nest Builders', contactName: 'Sneha Patil', phone: '9822044005', siteName: 'Green Nest Residency', address: 'Viman Nagar', city: 'Pune', pincode: '411014', lat: 18.5679, lng: 73.9143, value: 1_450_000, ageDays: 18, stageDays: 7, floors: 6, capacity: 6, score: 71 },
  { id: 'l-6', code: 'AIEC-L-0106', stage: 'site_visit', surveyorId: 'u-srv-1', builderName: 'Trinity Infra', contactName: 'Nilesh Gaikwad', phone: '9822044006', siteName: 'Trinity Business Bay', address: 'Baner Road', city: 'Pune', pincode: '411045', lat: 18.559, lng: 73.7868, value: 5_600_000, ageDays: 14, stageDays: 2, floors: 16, capacity: 13, score: 81 },
  { id: 'l-7', code: 'AIEC-L-0107', stage: 'site_visit', surveyorId: 'u-srv-3', builderName: 'Ravet Realty', contactName: 'Suresh Shinde', phone: '9822044007', siteName: 'Ravet Sky Towers', address: 'Ravet, PCMC', city: 'Pimpri-Chinchwad', pincode: '412101', lat: 18.65, lng: 73.745, value: 2_980_000, ageDays: 11, stageDays: 3, floors: 10, capacity: 8, score: 68 },
  { id: 'l-8', code: 'AIEC-L-0108', stage: 'contacted', surveyorId: 'u-srv-2', builderName: 'Magarpatta Homes', contactName: 'Pooja Rane', phone: '9822044008', siteName: 'Magarpatta Grove', address: 'Magarpatta City', city: 'Pune', pincode: '411028', lat: 18.515, lng: 73.928, value: 2_200_000, ageDays: 8, stageDays: 5, floors: 9, capacity: 8, score: 64 },
  { id: 'l-9', code: 'AIEC-L-0109', stage: 'contacted', surveyorId: 'u-srv-4', builderName: 'Kothrud Nirman', contactName: 'Vikas Thorat', phone: '9822044009', siteName: 'Nirman Elite', address: 'Karve Road, Kothrud', city: 'Pune', pincode: '411038', lat: 18.5074, lng: 73.8077, value: 1_120_000, ageDays: 9, stageDays: 6, floors: 5, capacity: 6, score: 52 },
  { id: 'l-10', code: 'AIEC-L-0110', stage: 'captured', surveyorId: 'u-srv-1', builderName: 'Wakad Vista', contactName: 'Deepa Naik', phone: '9822044010', siteName: 'Vista Enclave', address: 'Wakad Chowk', city: 'Pune', pincode: '411057', lat: 18.5975, lng: 73.762, value: 1_680_000, ageDays: 2, stageDays: 2, floors: 7, capacity: 6, score: 58 },
  { id: 'l-11', code: 'AIEC-L-0111', stage: 'captured', surveyorId: 'u-srv-3', builderName: 'Chinchwad Estates', contactName: 'Manoj Kadam', phone: '9822044011', siteName: 'Estate One', address: 'Chinchwad Station Road', city: 'Pimpri-Chinchwad', pincode: '411019', lat: 18.642, lng: 73.7997, value: 2_340_000, ageDays: 1, stageDays: 1, floors: 9, capacity: 8, score: 61 },
  { id: 'l-12', code: 'AIEC-L-0112', stage: 'captured', surveyorId: 'u-srv-2', builderName: 'Aundh Anand', contactName: 'Shweta Kale', phone: '9822044012', siteName: 'Anand Residency', address: 'ITI Road, Aundh', city: 'Pune', pincode: '411007', lat: 18.559, lng: 73.8077, value: 1_260_000, ageDays: 0, stageDays: 0, floors: 5, capacity: 6, score: 49 },
  { id: 'l-13', code: 'AIEC-L-0113', stage: 'lost', surveyorId: 'u-srv-4', builderName: 'Katraj Constructions', contactName: 'Ramesh Gore', phone: '9822044013', siteName: 'Katraj Crown', address: 'Katraj Kondhwa Road', city: 'Pune', pincode: '411046', lat: 18.4529, lng: 73.8567, value: 1_540_000, ageDays: 40, stageDays: 15, floors: 6, capacity: 6, score: 34, lostReason: 'price' },
  { id: 'l-14', code: 'AIEC-L-0114', stage: 'lost', surveyorId: 'u-srv-2', builderName: 'Hadapsar Heights', contactName: 'Anita Sawant', phone: '9822044014', siteName: 'Hadapsar Orchid', address: 'Solapur Road, Hadapsar', city: 'Pune', pincode: '411028', lat: 18.5089, lng: 73.926, value: 990_000, ageDays: 35, stageDays: 20, floors: 4, capacity: 4, score: 28, lostReason: 'competitor' },
  { id: 'l-15', code: 'AIEC-L-0115', stage: 'won', surveyorId: 'u-srv-1', builderName: 'Hinjawadi Tech Park', contactName: 'Girish Rao', phone: '9822044015', siteName: 'Tech Park Block C', address: 'Phase 3, Hinjawadi', city: 'Pune', pincode: '411057', lat: 18.5945, lng: 73.7315, value: 8_400_000, ageDays: 26, stageDays: 8, floors: 18, capacity: 20, score: 90 },
  { id: 'l-16', code: 'AIEC-L-0116', stage: 'quoted', surveyorId: 'u-srv-3', builderName: 'PCMC Civic Trust', contactName: 'Sanjay Bhoir', phone: '9822044016', siteName: 'Civic Health Centre', address: 'Nigdi, PCMC', city: 'Pimpri-Chinchwad', pincode: '411044', lat: 18.6512, lng: 73.7679, value: 3_700_000, ageDays: 16, stageDays: 5, floors: 7, capacity: 13, score: 74 },
  { id: 'l-17', code: 'AIEC-L-0117', stage: 'site_visit', surveyorId: 'u-srv-2', builderName: 'Koregaon Luxe', contactName: 'Tanvi Mehta', phone: '9822044017', siteName: 'Luxe Boutique Hotel', address: 'Koregaon Park', city: 'Pune', pincode: '411001', lat: 18.5362, lng: 73.8939, value: 6_200_000, ageDays: 12, stageDays: 1, floors: 9, capacity: 10, score: 83 },
  { id: 'l-18', code: 'AIEC-L-0118', stage: 'contacted', surveyorId: 'u-srv-1', builderName: 'Baner Bloom', contactName: 'Kiran Zende', phone: '9822044018', siteName: 'Bloom Apartments', address: 'Pashan Link Road', city: 'Pune', pincode: '411021', lat: 18.5385, lng: 73.7845, value: 1_390_000, ageDays: 6, stageDays: 4, floors: 6, capacity: 6, score: 55 },
  // Inbound enquiries with no field surveyor involved at all — real data for
  // screen 044's assignment queue, which otherwise has nothing to show.
  { id: 'l-19', code: 'AIEC-L-0120', stage: 'captured', surveyorId: '', builderName: 'Riverside Developers', contactName: 'Nikhil Sane', phone: '9822044020', siteName: 'Riverside Enclave', address: 'Sinhagad Road', city: 'Pune', pincode: '411030', lat: 18.4634, lng: 73.8264, value: 1_780_000, ageDays: 0, stageDays: 0, floors: 8, capacity: 8, score: 55 },
  { id: 'l-20', code: 'AIEC-L-0121', stage: 'captured', surveyorId: '', builderName: 'Wagholi Nirman', contactName: 'Priya Bhagat', phone: '9822044021', siteName: 'Wagholi Heights', address: 'Wagholi Bypass', city: 'Pune', pincode: '412207', lat: 18.5793, lng: 73.9868, value: 990_000, ageDays: 0, stageDays: 0, floors: 4, capacity: 4, score: 40 },
];

const SOURCE_OVERRIDE: Partial<Record<string, LeadSource>> = {
  'l-19': 'inbound_website',
  'l-20': 'inbound_whatsapp',
};

/** A realistic spread so the Communication Engine's per-language template
 *  rendering has more than one language to actually demonstrate. */
const PREFERRED_LANGUAGE_OVERRIDE: Partial<Record<string, Language>> = {
  'l-9': 'hi',
  'l-15': 'mr',
  'l-3': 'hi',
};

/** Most leads are field-captured; a realistic minority arrive some other way
 *  — enough spread for the source-attribution screen (048) to be meaningful. */
const LEAD_SOURCE_CYCLE: LeadSource[] = [
  'field_survey',
  'field_survey',
  'field_survey',
  'referral_repeat',
  'field_survey',
  'inbound_website',
  'field_survey',
  'field_survey',
  'inbound_whatsapp',
  'field_survey',
];

/** l-9 was reassigned from Sunita to Rohit after a territory rebalance —
 *  gives screen 044's history and screen 042's timeline real data to show. */
const REASSIGNED_LEAD_IDS: Record<string, string> = { 'l-9': 'u-srv-2' };

/** Most contacts have an email on file, as a real B2B lead would — a small
 *  minority genuinely don't, so screen 068's "no email on file" edge case
 *  has a real record to show it against rather than only a contrived one. */
const NO_EMAIL_LEAD_IDS = new Set(['l-8', 'l-9']);

const STAGE_LADDER: Lead['stage'][] = [
  'captured',
  'contacted',
  'site_visit',
  'quoted',
  'negotiation',
  'won',
];

export const seedLeads: Lead[] = leadSeeds.map((s, index) => {
  const capacityKg = s.capacity * 68;
  return {
    id: s.id,
    code: s.code,
    stage: s.stage,
    surveyorId: s.surveyorId,
    originalSurveyorId: REASSIGNED_LEAD_IDS[s.id] ?? s.surveyorId,
    source: SOURCE_OVERRIDE[s.id] ?? LEAD_SOURCE_CYCLE[index % LEAD_SOURCE_CYCLE.length],
    preferredLanguage: PREFERRED_LANGUAGE_OVERRIDE[s.id],
    builderName: s.builderName,
    contactName: s.contactName,
    contactPhone: s.phone,
    contactEmail: NO_EMAIL_LEAD_IDS.has(s.id)
      ? undefined
      : `${s.contactName.toLowerCase().replace(/[^a-z]+/g, '.')}@${s.builderName.toLowerCase().replace(/[^a-z]+/g, '')}.in`,
    siteName: s.siteName,
    address: s.address,
    city: s.city,
    pincode: s.pincode,
    location: { lat: s.lat, lng: s.lng },
    photos: ['site-front', 'shaft', 'approach-road'],
    spec: {
      buildingType:
        s.floors >= 12 ? 'commercial_office' : s.floors >= 7 ? 'residential_apartment' : 'residential_villa',
      mixedUse: false,
      floors: s.floors,
      basements: s.floors >= 10 ? 2 : 1,
      shaftCount: s.floors >= 14 ? 3 : s.floors >= 8 ? 2 : 1,
      capacityPersons: s.capacity,
      capacityKg,
      speedMps: s.floors >= 12 ? 1.5 : 1,
      shaftWidthMm: 1800,
      shaftDepthMm: 1900,
      pitDepthMm: 1500,
      headroomMm: 4200,
      machineRoom: s.floors >= 12 ? 'with_machine_room' : 'mrl',
      doorType: 'automatic_centre',
      cabinFinish: s.value > 3_000_000 ? 'premium_ss' : 'standard_ss',
      powerBackup: true,
      constructionStage: s.ageDays > 40 ? 'finishing' : s.ageDays > 15 ? 'structure' : 'foundation',
    },
    estimatedValue: s.value,
    // 1.5% of deal value, floored at ₹5,000 — the surveyor incentive rule.
    incentiveAmount: Math.max(5_000, Math.round(s.value * 0.015)),
    incentiveStatus:
      s.stage === 'won' ? 'paid' : s.stage === 'lost' ? 'forfeited' : 'projected',
    createdAt: daysAgo(s.ageDays),
    updatedAt: daysAgo(s.stageDays),
    stageEnteredAt: daysAgo(s.stageDays),
    isDemo: true,
    lostReason: s.lostReason,
    score: s.score,
  };
});

/** A pending duplicate, deliberately near an existing lead, for screen 035. */
export const duplicateCandidate: Lead = {
  ...seedLeads[9],
  id: 'l-dup-1',
  code: 'AIEC-L-0119',
  surveyorId: 'u-srv-4',
  originalSurveyorId: 'u-srv-4',
  location: { lat: 18.5978, lng: 73.7624 },
  createdAt: minutesAgo(4),
  updatedAt: minutesAgo(4),
  stageEnteredAt: minutesAgo(4),
  duplicateOfLeadId: 'l-10',
};

/* ------------------------------------------------------------------- Deals */

export const seedDeals: Deal[] = [
  { id: 'dl-1', code: 'AIEC-D-2101', leadId: 'l-1', customerId: 'u-cust-1', status: 'won', quotedPrice: 2_780_000, agreedPrice: 2_640_000, marginAmount: 528_000, gstPercent: 18, supplierId: 'sp-1', negotiationRounds: 2, createdAt: daysAgo(62), closedAt: daysAgo(48), isDemo: true },
  { id: 'dl-2', code: 'AIEC-D-2102', leadId: 'l-2', customerId: 'u-cust-2', status: 'won', quotedPrice: 1_950_000, agreedPrice: 1_880_000, marginAmount: 357_000, gstPercent: 18, supplierId: 'sp-2', negotiationRounds: 1, createdAt: daysAgo(41), closedAt: daysAgo(33), isDemo: true },
  { id: 'dl-3', code: 'AIEC-D-2103', leadId: 'l-3', customerId: 'u-cust-3', status: 'negotiating', quotedPrice: 4_320_000, agreedPrice: 4_120_000, marginAmount: 741_000, gstPercent: 18, supplierId: 'sp-1', negotiationRounds: 3, createdAt: daysAgo(18), isDemo: true },
  { id: 'dl-4', code: 'AIEC-D-2104', leadId: 'l-4', status: 'quoted', quotedPrice: 3_050_000, agreedPrice: 0, marginAmount: 549_000, gstPercent: 18, supplierId: 'sp-1', negotiationRounds: 0, createdAt: daysAgo(9), isDemo: true },
  { id: 'dl-5', code: 'AIEC-D-2105', leadId: 'l-5', status: 'quoted', quotedPrice: 1_450_000, agreedPrice: 0, marginAmount: 246_500, gstPercent: 18, supplierId: 'sp-3', negotiationRounds: 0, createdAt: daysAgo(7), isDemo: true },
  { id: 'dl-6', code: 'AIEC-D-2106', leadId: 'l-15', status: 'won', quotedPrice: 8_800_000, agreedPrice: 8_400_000, marginAmount: 1_512_000, gstPercent: 18, supplierId: 'sp-5', negotiationRounds: 4, createdAt: daysAgo(15), closedAt: hoursAgo(2), isDemo: true },
  { id: 'dl-7', code: 'AIEC-D-2107', leadId: 'l-16', status: 'quoted', quotedPrice: 3_700_000, agreedPrice: 0, marginAmount: 629_000, gstPercent: 18, supplierId: 'sp-2', negotiationRounds: 0, createdAt: daysAgo(5), isDemo: true },
  { id: 'dl-8', code: 'AIEC-D-2108', leadId: 'l-13', status: 'lost', quotedPrice: 1_620_000, agreedPrice: 0, marginAmount: 0, gstPercent: 18, negotiationRounds: 2, createdAt: daysAgo(32), closedAt: daysAgo(18), isDemo: true },
];

export const seedNegotiationBotConfig: NegotiationBotConfig = {
  // On top of the 15% company margin floor, so the bot never settles below 20%.
  marginBufferPct: 5,
  maxNegotiationRounds: 4,
  toneKey: 'professional',
  autoCloseAuthorityFlag: false,
  objectionScenarios: [
    {
      objectionKey: 'price_too_high',
      responseStrategy: 'Acknowledge the concern, restate the value (installation quality, AMC response time), then offer the smallest available step down within the approved band rather than the maximum immediately.',
    },
    {
      objectionKey: 'competitor_comparison',
      responseStrategy: 'Ask which specific line item the competitor is lower on before responding — never match a competitor price blind. Highlight AIEC-specific guarantees the competitor quote may not include.',
    },
    {
      objectionKey: 'wants_to_delay',
      responseStrategy: "Confirm the validity window on the current quote and offer to lock today's price for a short, named extension rather than an open-ended delay.",
    },
  ],
  updatedAt: daysAgo(20),
};

export const seedNegotiations: Negotiation[] = [
  // dl-3 (Skyline Corporate Park) — still bot-active, comfortably above floor.
  {
    id: 'ng-1',
    dealId: 'dl-3',
    leadId: 'l-3',
    status: 'bot_active',
    roundsUsed: 2,
    currentOfferPrice: 4_180_000,
    floorPrice: 3_950_000,
    maxRoundsAllowed: 4,
    autoCloseAuthorityAllowed: false,
    startedAt: daysAgo(4),
    lastActivityAt: hoursAgo(3),
    isDemo: true,
  },
  // dl-6 (Tech Park Block C) — hit its round limit, forced to human handoff
  // regardless of how close the conversation seemed to a close.
  {
    id: 'ng-2',
    dealId: 'dl-6',
    leadId: 'l-15',
    status: 'escalated',
    roundsUsed: 4,
    currentOfferPrice: 8_450_000,
    floorPrice: 8_100_000,
    maxRoundsAllowed: 4,
    autoCloseAuthorityAllowed: false,
    lastEscalationReason: 'max_rounds_reached',
    startedAt: daysAgo(6),
    lastActivityAt: hoursAgo(9),
    isDemo: true,
  },
  // dl-4 (Pinnacle Aurum) — already sitting at the bot's own floor (20%
  // margin, its buffered limit), so any further ask needs an Admin's
  // judgment call rather than the bot's own authority. Feeds screen 073.
  {
    id: 'ng-3',
    dealId: 'dl-4',
    leadId: 'l-4',
    status: 'bot_active',
    roundsUsed: 1,
    currentOfferPrice: 3_377_777,
    floorPrice: 3_377_777,
    maxRoundsAllowed: 4,
    autoCloseAuthorityAllowed: false,
    startedAt: daysAgo(1),
    lastActivityAt: hoursAgo(2),
    isDemo: true,
  },
];

export const seedCounterOffers: CounterOffer[] = [
  // l-4 (Pinnacle Aurum) — the same customer asked twice within a day; the
  // fresher ask is what the queue shows, consolidating the older one.
  {
    id: 'co-1',
    negotiationId: 'ng-3',
    dealId: 'dl-4',
    leadId: 'l-4',
    customerRequestedPrice: 3_300_000,
    marginImpactPct: 18.3,
    status: 'pending',
    createdAt: hoursAgo(10),
    isDemo: true,
  },
  {
    id: 'co-2',
    negotiationId: 'ng-3',
    dealId: 'dl-4',
    leadId: 'l-4',
    customerRequestedPrice: 3_280_000,
    marginImpactPct: 17.6,
    status: 'pending',
    createdAt: hoursAgo(2),
    isDemo: true,
  },
  // l-3 (Skyline Corporate Park) — no price change asked, but a free AMC
  // year is outside the bot's authority regardless of margin. Waiting long
  // past a reasonable SLA, which is what raises al-9 below.
  {
    id: 'co-3',
    negotiationId: 'ng-1',
    dealId: 'dl-3',
    leadId: 'l-3',
    customerRequestedPrice: 4_180_000,
    marginImpactPct: 19.9,
    bundledConcessionNote: 'Wants a free 1-year AMC added at no extra cost in exchange for closing this week.',
    status: 'pending',
    createdAt: hoursAgo(9),
    isDemo: true,
  },
];

export const seedDealTerms: DealTerms[] = [
  // dl-3 (Skyline Corporate Park) — internally confirmed 5 days ago, still
  // waiting on the customer. Feeds ft-7 below so the wait is never silent.
  {
    id: 'dt-1',
    dealId: 'dl-3',
    finalAgreedPrice: 4_120_000,
    // The standard AIEC split already implicit in every seeded Payment
    // (p-1..p-12): 25/35/30/10, plus a 5% retention on top.
    paymentStagePlan: [
      { stage: 'advance', percentage: 25 },
      { stage: 'material', percentage: 35 },
      { stage: 'installation', percentage: 30 },
      { stage: 'handover', percentage: 10 },
      { stage: 'retention', percentage: 5 },
    ],
    specialTermsNotes: "Installation to be completed within 6 weeks of the booking advance, per the customer's building handover timeline.",
    status: 'awaiting_customer',
    internalConfirmedBy: 'u-admin-1',
    internalConfirmedAt: daysAgo(5),
    bothPartyConfirmedFlag: false,
    amendments: [],
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
    isDemo: true,
  },
  // dl-6 (Tech Park Block C) — both parties confirmed; a GST field mismatch
  // found afterward was corrected as a logged amendment, not a silent edit.
  {
    id: 'dt-2',
    dealId: 'dl-6',
    finalAgreedPrice: 8_400_000,
    paymentStagePlan: [
      { stage: 'advance', percentage: 25 },
      { stage: 'material', percentage: 35 },
      { stage: 'installation', percentage: 30 },
      { stage: 'handover', percentage: 10 },
      { stage: 'retention', percentage: 5 },
    ],
    specialTermsNotes: '2-year comprehensive AMC bundled per the approved counter-offer; installation scheduling to begin within 10 days of the booking advance.',
    status: 'confirmed',
    internalConfirmedBy: 'u-admin-1',
    internalConfirmedAt: daysAgo(10),
    customerConfirmedAt: daysAgo(9),
    bothPartyConfirmedFlag: true,
    amendments: [
      {
        id: 'dta-1',
        note: 'Corrected the GST rate on the confirmed terms from 12% to 18% after a data-entry check — the agreed price is unaffected, only the tax line was updated.',
        amendedBy: 'u-admin-1',
        amendedAt: daysAgo(2),
      },
    ],
    createdAt: daysAgo(10),
    updatedAt: daysAgo(2),
    isDemo: true,
  },
  // dl-1 (Shree Ram Heights) — an old, already-won deal: confirmed long ago,
  // but never had a contract generated in this build's history. Feeds
  // screen 075's "confirmed, ready to generate" starting state.
  {
    id: 'dt-3',
    dealId: 'dl-1',
    finalAgreedPrice: 2_640_000,
    paymentStagePlan: [
      { stage: 'advance', percentage: 25 },
      { stage: 'material', percentage: 35 },
      { stage: 'installation', percentage: 30 },
      { stage: 'handover', percentage: 10 },
      { stage: 'retention', percentage: 5 },
    ],
    specialTermsNotes: 'Standard 1-year manufacturer warranty; no bundled AMC selected at close.',
    status: 'confirmed',
    internalConfirmedBy: 'u-admin-1',
    internalConfirmedAt: daysAgo(47),
    customerConfirmedAt: daysAgo(46),
    bothPartyConfirmedFlag: true,
    amendments: [],
    createdAt: daysAgo(47),
    updatedAt: daysAgo(46),
    isDemo: true,
  },
];

export const seedContracts: Contract[] = [
  // dl-6 (Tech Park Block C) — v1 generated right after confirmation; the
  // GST correction on dt-2's amendment (dta-1) is exactly why v2 exists,
  // superseding v1 rather than editing it in place. Neither version found
  // a linked Quotation record for this lead, so both fall back to the
  // national default compliance language — flagged for Admin either way.
  {
    id: 'ct-1',
    dealId: 'dl-6',
    version: 1,
    status: 'superseded',
    usedStateClauseFallback: true,
    clauses: [
      {
        key: 'scope',
        legalText: 'AIEC shall supply and arrange installation of one (1) elevator at Tech Park Block C, Phase 3, Hinjawadi, Pune, configured per Quotation on file (gearless traction drive), for the price stated below.',
        plainLanguageSummary: 'This contract covers one elevator at Tech Park Block C, built to the specification you already agreed on in your quotation.',
      },
      {
        key: 'price_and_payment',
        legalText: 'The final agreed price is ₹84,00,000, inclusive of applicable GST at 12%, payable in stages: advance 25%, material 35%, installation 30%, handover 10%, retention 5% — exactly as locked in on the confirmed Deal Terms record.',
        plainLanguageSummary: "You'll pay ₹84,00,000 in total, split across the payment stages you already agreed to.",
      },
      {
        key: 'installation_and_liability',
        legalText:
          'Installation shall be carried out by an AIEC-assigned technician in accordance with IS 14665 and applicable safety codes. The assigned technician/installer is responsible for correct on-site installation; the equipment manufacturer/supplier is responsible for equipment defects; AIEC’s role is limited to facilitation, coordination, and quality oversight, and AIEC does not itself assume manufacturer or installer liability.',
        plainLanguageSummary: "Your technician is responsible for a correct, safe installation; the equipment maker is responsible for the equipment itself; AIEC coordinates and oversees rather than carrying that liability directly.",
      },
      {
        key: 'warranty_and_amc',
        legalText:
          "The equipment carries the manufacturer's standard warranty from the date of handover. An Annual Maintenance Contract, if selected, follows the tier and response-time terms published in AIEC's current AMC schedule.",
        plainLanguageSummary: "Your elevator is covered by the manufacturer's warranty from handover; any AMC you've chosen follows its own published response-time promise.",
      },
      {
        key: 'state_compliance',
        legalText:
          'This contract follows the National Building Code of India and applicable BIS standards, including IS 14665. A state-specific Lift Act clause set has not yet been configured for this location and has been flagged for Admin to add.',
        plainLanguageSummary: "We're using our standard national compliance language for your location since a state-specific clause set hasn't been added for it yet — this has been flagged internally.",
      },
    ],
    addenda: [],
    generatedAt: daysAgo(9),
    generatedBy: 'u-admin-1',
    isDemo: true,
  },
  {
    id: 'ct-2',
    dealId: 'dl-6',
    version: 2,
    supersedesContractId: 'ct-1',
    status: 'active',
    usedStateClauseFallback: true,
    clauses: [
      {
        key: 'scope',
        legalText: 'AIEC shall supply and arrange installation of one (1) elevator at Tech Park Block C, Phase 3, Hinjawadi, Pune, configured per Quotation on file (gearless traction drive), for the price stated below.',
        plainLanguageSummary: 'This contract covers one elevator at Tech Park Block C, built to the specification you already agreed on in your quotation.',
      },
      {
        key: 'price_and_payment',
        legalText: 'The final agreed price is ₹84,00,000, inclusive of applicable GST at 18%, payable in stages: advance 25%, material 35%, installation 30%, handover 10%, retention 5% — exactly as locked in on the confirmed Deal Terms record.',
        plainLanguageSummary: "You'll pay ₹84,00,000 in total, split across the payment stages you already agreed to.",
      },
      {
        key: 'installation_and_liability',
        legalText:
          'Installation shall be carried out by an AIEC-assigned technician in accordance with IS 14665 and applicable safety codes. The assigned technician/installer is responsible for correct on-site installation; the equipment manufacturer/supplier is responsible for equipment defects; AIEC’s role is limited to facilitation, coordination, and quality oversight, and AIEC does not itself assume manufacturer or installer liability.',
        plainLanguageSummary: "Your technician is responsible for a correct, safe installation; the equipment maker is responsible for the equipment itself; AIEC coordinates and oversees rather than carrying that liability directly.",
      },
      {
        key: 'warranty_and_amc',
        legalText:
          "The equipment carries the manufacturer's standard warranty from the date of handover. An Annual Maintenance Contract, if selected, follows the tier and response-time terms published in AIEC's current AMC schedule.",
        plainLanguageSummary: "Your elevator is covered by the manufacturer's warranty from handover; any AMC you've chosen follows its own published response-time promise.",
      },
      {
        key: 'state_compliance',
        legalText:
          'This contract follows the National Building Code of India and applicable BIS standards, including IS 14665. A state-specific Lift Act clause set has not yet been configured for this location and has been flagged for Admin to add.',
        plainLanguageSummary: "We're using our standard national compliance language for your location since a state-specific clause set hasn't been added for it yet — this has been flagged internally.",
      },
    ],
    addenda: [],
    generatedAt: daysAgo(1),
    generatedBy: 'u-admin-1',
    isDemo: true,
  },
];

export const seedContractSignatures: ContractSignature[] = [
  // dl-6 (Tech Park Block C) — customer signed a day ago, AIEC countersigned
  // 2 hours ago: fully closed. Feeds screen 077's closure/kickoff demo,
  // including its supplier-PO-failure edge case (see seedSupplierPurchaseOrders).
  {
    id: 'cs-1',
    contractId: 'ct-2',
    dealId: 'dl-6',
    status: 'fully_signed',
    customerSignatureMethod: 'typed',
    customerSignatureData: 'Girish Rao',
    customerConsentGiven: true,
    customerOtpVerified: true,
    customerSignedAt: daysAgo(1),
    aiecCountersignedBy: 'u-admin-1',
    aiecCountersignedAt: hoursAgo(2),
    isDemo: true,
  },
];

export const seedDealClosures: DealClosure[] = [
  // dl-6 — p-10 (advance) already existed before closure; the kickoff
  // created the other four stages and the leadConverted commission was
  // already c-6 from earlier in this deal's life, so it's referenced
  // rather than duplicated. The supplier PO failed (see spo-1) without
  // blocking this record from existing.
  {
    id: 'dc-1',
    dealId: 'dl-6',
    closedAt: hoursAgo(2),
    paymentRecordIds: ['p-10', 'p-13', 'p-14', 'p-15', 'p-16'],
    supplierPoId: 'spo-1',
    supplierPoFailed: true,
    commissionEntryIds: ['c-6'],
    voided: false,
    isDemo: true,
  },
];

export const seedDealCelebrations: DealCelebration[] = [
  // dl-6 — already celebrated and acknowledged by Ganesh, with a feedback
  // note only Admin can see (screen 080's own internal-only edge case).
  {
    id: 'dcel-1',
    dealId: 'dl-6',
    acknowledged: true,
    acknowledgedBy: 'u-srv-1',
    acknowledgedAt: hoursAgo(1),
    feedbackNote: 'Customer nearly walked over the supplier lead-time question — worth adding a line about our multi-supplier sourcing to the initial pitch so it comes up before they ask.',
    createdAt: hoursAgo(2),
    isDemo: true,
  },
];

/* -------------------------------------------------------------------- Jobs */

export const installSteps = (completedCount: number): Job['steps'] => {
  const defs: Array<{ id: string; key: string; evidence: boolean }> = [
    { id: 's1', key: 'job.step.siteReadiness', evidence: true },
    { id: 's2', key: 'job.step.materialsReceived', evidence: true },
    { id: 's3', key: 'job.step.guideRails', evidence: false },
    { id: 's4', key: 'job.step.machineMount', evidence: true },
    { id: 's5', key: 'job.step.carAssembly', evidence: false },
    { id: 's6', key: 'job.step.doorOperator', evidence: true },
    { id: 's7', key: 'job.step.wiringControl', evidence: true },
    { id: 's8', key: 'job.step.safetyGearTest', evidence: true },
    { id: 's9', key: 'job.step.loadTest', evidence: true },
    { id: 's10', key: 'job.step.finishHandover', evidence: true },
  ];
  return defs.map((d, i) => ({
    id: d.id,
    labelKey: d.key,
    status: i < completedCount ? 'complete' : i === completedCount ? 'current' : 'upcoming',
    requiresEvidence: d.evidence,
    evidenceCount: i < completedCount && d.evidence ? 3 : 0,
    completedAt: i < completedCount ? daysAgo(completedCount - i) : undefined,
  }));
};

/* ------------------------------------------ Installation SOP (123) */

const slot = (id: string, labelKey: string, required: boolean, appliesWhen?: InstallSopSlot['appliesWhen'], kind: InstallSopSlot['kind'] = 'photo'): InstallSopSlot => ({ id, labelKey, required, kind, ...(appliesWhen ? { appliesWhen } : {}) });

/** The one installation procedure every technician on every job follows. It says what each step needs; the job records what happened.
 *  Safety devices and the tests that prove them (governor, buffers, rescue device, alarm, door sensors) are hard-gated on photos, in line
 *  with what the BIS / IS lift standards emphasise. Steps that do not depend on each other can be done in whatever order the site allows. */
export const seedInstallSopVersions: InstallSopVersion[] = [
  {
    version: 1,
    effectiveFrom: daysAgo(400),
    changeNote: 'First published procedure.',
    publishedByName: 'Prashant Vasant Wable',
    publishedAt: daysAgo(400),
    steps: [
      { id: 's1', labelKey: 'job.step.siteReadiness', phase: 'preparation', safetyCritical: false, slots: [slot('s1.shaft', 'installSop.slot.shaft', true), slot('s1.pit', 'installSop.slot.pit', true)], dependsOn: [], canBeNotApplicable: false },
      { id: 's2', labelKey: 'job.step.materialsReceived', phase: 'preparation', safetyCritical: false, slots: [], dependsOn: ['s1'], canBeNotApplicable: false, satisfiedByDelivery: true },
      { id: 's3', labelKey: 'job.step.guideRails', phase: 'rails', safetyCritical: false, slots: [slot('s3.alignment', 'installSop.slot.alignment', false)], dependsOn: ['s1', 's2'], canBeNotApplicable: false },
      { id: 's4', labelKey: 'job.step.machineMount', phase: 'machine', safetyCritical: false, slots: [slot('s4.mount', 'installSop.slot.mount', true)], dependsOn: ['s3'], canBeNotApplicable: false },
      { id: 's5', labelKey: 'job.step.carAssembly', phase: 'car', safetyCritical: false, slots: [slot('s5.frame', 'installSop.slot.frame', false)], dependsOn: ['s3'], canBeNotApplicable: false },
      {
        id: 's6',
        labelKey: 'job.step.doorOperator',
        phase: 'car',
        safetyCritical: true,
        slots: [slot('s6.sensors', 'installSop.slot.sensors', true, undefined, 'video')],
        dependsOn: ['s5'],
        appliesWhen: { field: 'doorType', oneOf: ['automatic_centre', 'automatic_side'] },
        canBeNotApplicable: true,
      },
      { id: 's7', labelKey: 'job.step.wiringControl', phase: 'wiring', safetyCritical: false, slots: [slot('s7.panel', 'installSop.slot.panel', true), slot('s7.earthing', 'installSop.slot.earthing', true)], dependsOn: ['s4', 's5'], canBeNotApplicable: false },
      {
        id: 's8',
        labelKey: 'job.step.safetyGearTest',
        phase: 'safety',
        safetyCritical: true,
        slots: [
          slot('s8.governor', 'installSop.slot.governor', true),
          slot('s8.buffers', 'installSop.slot.buffers', true),
          slot('s8.gear', 'installSop.slot.gear', true, undefined, 'video'),
          slot('s8.alarm', 'installSop.slot.alarm', true),
          slot('s8.ard', 'installSop.slot.ard', true, { field: 'powerBackup', equals: true }),
        ],
        dependsOn: ['s6', 's7'],
        canBeNotApplicable: false,
      },
      { id: 's9', labelKey: 'job.step.loadTest', phase: 'safety', safetyCritical: true, slots: [slot('s9.noload', 'installSop.slot.noload', true, undefined, 'video'), slot('s9.overload', 'installSop.slot.overload', true), slot('s9.load', 'installSop.slot.load', true)], dependsOn: ['s8'], canBeNotApplicable: false },
      { id: 's10', labelKey: 'job.step.finishHandover', phase: 'final', safetyCritical: false, slots: [slot('s10.final', 'installSop.slot.final', true)], dependsOn: ['s9'], canBeNotApplicable: false },
    ],
  },
];

export const seedJobs: Job[] = [
  { id: 'j-1', code: 'AIEC-J-3101', dealId: 'dl-1', technicianId: 'u-tech-1', status: 'in_progress', siteName: 'Shree Ram Heights', address: 'Phase 2, Hinjawadi', location: { lat: 18.5913, lng: 73.7389 }, scheduledFor: daysAgo(21), startedAt: daysAgo(21), steps: installSteps(7), crew: [{ userId: 'u-tech-1', role: 'lead', stepIds: [] }, { userId: 'u-tech-2', role: 'assistant', stepIds: ['s6', 's7'] }], isDemo: true },
  { id: 'j-2', code: 'AIEC-J-3102', dealId: 'dl-2', technicianId: 'u-tech-2', status: 'qc_pending', siteName: 'Kulkarni Signature', address: 'Kharadi Bypass', location: { lat: 18.5515, lng: 73.947 }, scheduledFor: daysAgo(28), startedAt: daysAgo(28), steps: installSteps(9), isDemo: true },
  { id: 'j-3', code: 'AIEC-J-3103', dealId: 'dl-1', technicianId: 'u-tech-3', status: 'materials_pending', siteName: 'Shree Ram Heights — Wing B', address: 'Phase 2, Hinjawadi', location: { lat: 18.592, lng: 73.7401 }, scheduledFor: daysAhead(3), steps: installSteps(1), crew: [{ userId: 'u-tech-3', role: 'lead', stepIds: [] }, { userId: 'u-tech-1', role: 'assistant', stepIds: ['s3'] }], isDemo: true },
  { id: 'j-4', code: 'AIEC-J-3104', dealId: 'dl-2', technicianId: 'u-tech-1', status: 'scheduled', siteName: 'Kulkarni Signature — Tower 2', address: 'Kharadi Bypass', location: { lat: 18.5522, lng: 73.9481 }, scheduledFor: daysAhead(8), steps: installSteps(0), isDemo: true },
  { id: 'j-5', code: 'AIEC-J-3105', dealId: 'dl-1', technicianId: 'u-tech-2', status: 'completed', siteName: 'Shree Ram Heights — Service Lift', address: 'Phase 2, Hinjawadi', location: { lat: 18.5908, lng: 73.7378 }, scheduledFor: daysAgo(56), startedAt: daysAgo(56), completedAt: daysAgo(38), steps: installSteps(10), isDemo: true },
  // Older installations whose suppliers' retentions are still held (118). j-7 has cleared QC and been handed over; j-8 failed QC and is in rework.
  { id: 'j-7', code: 'AIEC-J-3107', dealId: 'dl-h2', technicianId: 'u-tech-1', status: 'completed', siteName: 'Balaji Residency', address: 'Baner Road', location: { lat: 18.559, lng: 73.7868 }, scheduledFor: daysAgo(16), startedAt: daysAgo(16), completedAt: daysAgo(5), steps: installSteps(10), isDemo: true },
  {
    id: 'j-8',
    code: 'AIEC-J-3108',
    dealId: 'dl-h3',
    technicianId: 'u-tech-3',
    status: 'on_hold',
    siteName: 'Om Sai Apartments',
    address: 'Karve Nagar',
    location: { lat: 18.4967, lng: 73.8146 },
    scheduledFor: daysAgo(12),
    startedAt: daysAgo(12),
    holdReason: 'QC failed: the safety gear test was out of tolerance. Rework is booked.',
    heldBy: 'Quality lead',
    heldAt: daysAgo(3),
    steps: installSteps(8).map((st, i) => (i === 8 ? { ...st, status: 'blocked' as const } : st)),
    isDemo: true,
  },
  // Booked for the same day as j-4 by the same technician: two sites on one morning is a scheduling conflict 121 shows instead of a dual schedule.
  { id: 'j-9', code: 'AIEC-J-3109', dealId: 'dl-1', technicianId: 'u-tech-1', status: 'scheduled', siteName: 'Shree Ram Heights — Wing C', address: 'Phase 2, Hinjawadi', location: { lat: 18.5925, lng: 73.7412 }, scheduledFor: daysAhead(8), steps: installSteps(0), isDemo: true },
  { id: 'j-6', code: 'AIEC-J-3106', dealId: 'dl-2', technicianId: 'u-tech-3', status: 'on_hold', siteName: 'Kulkarni Signature — Basement', address: 'Kharadi Bypass', location: { lat: 18.5509, lng: 73.9462 }, scheduledFor: daysAgo(4), startedAt: daysAgo(4), steps: installSteps(3), isDemo: true },
];

/* ---------------------------------------------------------------- Payments */

export const seedPayments: Payment[] = [
  { id: 'p-1', code: 'AIEC-P-4101', dealId: 'dl-1', stage: 'advance', amount: 660_000, status: 'paid', dueDate: daysAgo(46), paidAt: daysAgo(45), method: 'neft', isDemo: true },
  { id: 'p-2', code: 'AIEC-P-4102', dealId: 'dl-1', stage: 'material', amount: 924_000, status: 'paid', dueDate: daysAgo(30), paidAt: daysAgo(29), method: 'neft', isDemo: true },
  // A partial bank transfer came in against this already-overdue,
  // already-escalated (see al-2) stage — the remaining ₹3,92,000 is still
  // overdue, screen 082's own partial-payment reconciliation edge case.
  // 10 days overdue (past the reminder cadence's last step, at day 7) —
  // deliberately past cadence-exhaustion so 089's escalation queue has a
  // real, eligible row on a deal (dl-1) that also has active Jobs.
  { id: 'p-3', code: 'AIEC-P-4103', dealId: 'dl-1', stage: 'installation', amount: 792_000, status: 'overdue', dueDate: daysAgo(10), amountReceived: 400_000, method: 'neft', manualReferenceNumber: 'NEFT240811', recordedManuallyBy: 'u-admin-1', lastReceivedAt: daysAgo(4), isDemo: true },
  { id: 'p-4', code: 'AIEC-P-4104', dealId: 'dl-1', stage: 'handover', amount: 264_000, status: 'due', dueDate: daysAhead(20), isDemo: true },
  { id: 'p-5', code: 'AIEC-P-4105', dealId: 'dl-2', stage: 'advance', amount: 470_000, status: 'paid', dueDate: daysAgo(32), paidAt: daysAgo(32), method: 'upi', isDemo: true },
  { id: 'p-6', code: 'AIEC-P-4106', dealId: 'dl-2', stage: 'material', amount: 658_000, status: 'paid', dueDate: daysAgo(20), paidAt: daysAgo(19), method: 'neft', isDemo: true },
  // Disputed rather than merely pending — pauses this one stage's reminders
  // without touching dl-2's other stages (screen 082's own dispute edge case).
  { id: 'p-7', code: 'AIEC-P-4107', dealId: 'dl-2', stage: 'installation', amount: 564_000, status: 'disputed', dueDate: daysAhead(2), disputeReason: 'Customer says the installation-stage invoice includes a change-order item that was never approved.', disputedBy: 'u-admin-1', disputedAt: hoursAgo(8), preDisputeStatus: 'due', isDemo: true },
  { id: 'p-8', code: 'AIEC-P-4108', dealId: 'dl-2', stage: 'handover', amount: 188_000, status: 'paid', dueDate: daysAhead(24), amountReceived: 188_000, method: 'financing', paidAt: daysAgo(15), isDemo: true },
  { id: 'p-9', code: 'AIEC-P-4109', dealId: 'dl-3', stage: 'advance', amount: 1_030_000, status: 'due', dueDate: daysAhead(5), isDemo: true },
  { id: 'p-10', code: 'AIEC-P-4110', dealId: 'dl-6', stage: 'advance', amount: 2_100_000, status: 'due', dueDate: daysAhead(9), isDemo: true },
  { id: 'p-11', code: 'AIEC-P-4111', dealId: 'dl-1', stage: 'retention', amount: 132_000, status: 'due', dueDate: daysAhead(75), isDemo: true },
  // Left at 82,000 of 94,000 — the same loan-seed-2 disbursement that fully
  // covered p-8 above ran out partway through this stage, exercising 086's
  // "disbursed amount doesn't exactly match what's due" reconciliation flag.
  { id: 'p-12', code: 'AIEC-P-4112', dealId: 'dl-2', stage: 'retention', amount: 94_000, status: 'due', dueDate: daysAhead(90), amountReceived: 82_000, method: 'financing', lastReceivedAt: daysAgo(15), isDemo: true },
  // dl-6's material/installation/handover/retention stages, created by
  // screen 077's closure kickoff — p-10 (advance) already existed from
  // before closure, so the kickoff only ever creates the remaining stages.
  { id: 'p-13', code: 'AIEC-P-4113', dealId: 'dl-6', stage: 'material', amount: 2_940_000, status: 'due', dueDate: daysAhead(15), isDemo: true },
  { id: 'p-14', code: 'AIEC-P-4114', dealId: 'dl-6', stage: 'installation', amount: 2_520_000, status: 'due', dueDate: daysAhead(40), isDemo: true },
  { id: 'p-15', code: 'AIEC-P-4115', dealId: 'dl-6', stage: 'handover', amount: 840_000, status: 'due', dueDate: daysAhead(65), isDemo: true },
  { id: 'p-16', code: 'AIEC-P-4116', dealId: 'dl-6', stage: 'retention', amount: 420_000, status: 'due', dueDate: daysAhead(120), isDemo: true },
  // A large overdue receivable sitting alongside many small ones — screen
  // 082's own "don't let a big risk get lost in a sea of small normal
  // items" edge case.
  { id: 'p-17', code: 'AIEC-P-4117', dealId: 'dl-3', stage: 'installation', amount: 1_236_000, status: 'overdue', dueDate: daysAgo(45), isDemo: true },
];

export const seedPaymentSchedules: PaymentSchedule[] = [
  // dl-1 — already activated, standard split, mirroring the real amounts
  // already on its Payment records (p-1/p-2/p-3/p-4/p-11) exactly. Material
  // and handover are milestone-triggered against j-1's own steps: material
  // resolves live (materialsReceived is already complete on j-1) while
  // handover stays pending (finishHandover isn't complete yet) — screen
  // 081's own live due-date resolution, demonstrated with real seed data
  // rather than only through a live test.
  {
    id: 'psch-1',
    dealId: 'dl-1',
    scheduleType: 'standard',
    stages: [
      { id: 'pss-1', stage: 'advance', label: 'Booking Advance', amount: 660_000, sequenceOrder: 1, dueTrigger: 'fixed_date', fixedDueDate: daysAgo(46), isDemo: true },
      { id: 'pss-2', stage: 'material', label: 'Material Order Payment', amount: 924_000, sequenceOrder: 2, dueTrigger: 'milestone', triggerMilestone: 'job.step.materialsReceived', isDemo: true },
      { id: 'pss-3', stage: 'installation', label: 'Pre-Installation Payment', amount: 792_000, sequenceOrder: 3, dueTrigger: 'fixed_date', fixedDueDate: daysAgo(6), isDemo: true },
      { id: 'pss-4', stage: 'handover', label: 'Final Handover Payment', amount: 264_000, sequenceOrder: 4, dueTrigger: 'milestone', triggerMilestone: 'job.step.finishHandover', isDemo: true },
      { id: 'pss-5', stage: 'retention', label: 'Retention', amount: 132_000, sequenceOrder: 5, dueTrigger: 'fixed_date', fixedDueDate: daysAhead(75), isDemo: true },
    ],
    activated: true,
    activatedAt: daysAgo(40),
    activatedBy: 'Prashant Vasant Wable',
    updatedAt: daysAgo(40),
    updatedBy: 'Prashant Vasant Wable',
    isDemo: true,
  },
];

export const seedPaymentReminderConfig: PaymentReminderConfig = {
  id: 'prc-1',
  steps: [
    { id: 'rrs-1', daysOffset: -3, escalationTier: 'friendly', channel: 'sms', templateGroupId: 'tpl-payment-reminder' },
    { id: 'rrs-2', daysOffset: 0, escalationTier: 'friendly', channel: 'whatsapp', templateGroupId: 'tpl-payment-reminder' },
    { id: 'rrs-3', daysOffset: 3, escalationTier: 'firm', channel: 'whatsapp', templateGroupId: 'tpl-payment-reminder-firm' },
    { id: 'rrs-4', daysOffset: 7, escalationTier: 'call_task', channel: 'call' },
  ],
  sendWindowStartHour: 9,
  sendWindowEndHour: 19,
  updatedAt: daysAgo(60),
  updatedBy: 'Prashant Vasant Wable',
  isDemo: true,
};

export const seedPaymentReminderPauses: PaymentReminderPause[] = [
  // Left on 45 days ago — long enough that screen 083's own "review a
  // long-standing pause" nudge should surface it, not let it sit forever.
  {
    id: 'rrp-1',
    dealId: 'dl-3',
    paused: true,
    reason: 'Customer confirmed by phone that both remaining payments will be settled once their own client payment clears — asked us to hold off on automated nudges in the meantime.',
    pausedBy: 'Prashant Vasant Wable',
    pausedAt: daysAgo(45),
    isDemo: true,
  },
];

export const seedLoanApplications: LoanApplication[] = [
  // dl-3 (Skyline Corporate Park) — approved 10 days ago and never
  // disbursed, well past 086's 5-day reasonable window. Demonstrates the
  // "delayed disbursement surfaces as a risk" edge case directly on load,
  // without waiting on the live wizard's own compressed timers.
  {
    id: 'loan-seed-1',
    dealId: 'dl-3',
    customerId: 'u-cust-3',
    partnerName: 'Suvidha Finance Ltd',
    precheck: { incomeRange: '10l_25l', tenurePreferenceMonths: 36, eligible: true },
    requestedAmount: 2_266_000,
    tenureMonths: 36,
    interestRatePercent: 13.5,
    emiAmount: 76_900,
    totalRepayment: 2_768_400,
    status: 'approved',
    approvedAmount: 2_266_000,
    submittedAt: daysAgo(14),
    underReviewAt: daysAgo(13),
    approvedAt: daysAgo(10),
    isDemo: true,
  },
  // dl-2 (Kulkarni Signature) — approved in full, but Suvidha Finance's
  // processing fee left only 270,000 of the 282,000 actually landing in
  // AIEC's account. Settled p-8 in full and part of p-12 (see seedPayments
  // above) — the "disbursed amount doesn't exactly match what's due"
  // reconciliation edge case, already fully consistent in the seed rather
  // than requiring a live disbursement to demonstrate.
  {
    id: 'loan-seed-2',
    dealId: 'dl-2',
    customerId: 'u-cust-2',
    partnerName: 'Suvidha Finance Ltd',
    precheck: { incomeRange: '10l_25l', tenurePreferenceMonths: 24, eligible: true },
    requestedAmount: 282_000,
    tenureMonths: 24,
    interestRatePercent: 12.5,
    emiAmount: 13_340,
    totalRepayment: 320_160,
    status: 'disbursed',
    approvedAmount: 282_000,
    disbursedAmountReceived: 270_000,
    submittedAt: daysAgo(20),
    underReviewAt: daysAgo(19),
    approvedAt: daysAgo(16),
    disbursedAt: daysAgo(15),
    isDemo: true,
  },
];

/** Suvidha Finance Ltd's published EMI rates by tenure — screen 085 always
 *  fetches this "live" rather than assuming it, per the spec's own "never
 *  a stale number" requirement. */
export const financingPartnerRates: FinancingPartnerRate[] = [
  { tenureMonths: 12, annualRatePercent: 11.5 },
  { tenureMonths: 24, annualRatePercent: 12.5 },
  { tenureMonths: 36, annualRatePercent: 13.5 },
  { tenureMonths: 48, annualRatePercent: 14.5 },
  { tenureMonths: 60, annualRatePercent: 15.5 },
];

/* --------------------------------------------------------------- Suppliers */

export const seedSuppliers: Supplier[] = [
  {
    id: 'sp-1', paymentTier: 'trusted', name: 'Vertex Elevator Components Pvt Ltd', status: 'active', kycStatus: 'approved', city: 'Mumbai', gstin: '27AABCV1234A1Z5',
    contactName: 'Vikram Anand', contactPhone: '9821044201',
    categories: ['traction_machine', 'controller', 'cabin', 'door_operator'], driveTypeSpecialties: ['geared_traction', 'gearless_traction'], regionsServed: ['Maharashtra', 'Gujarat'],
    onTimeRate: 0.94, qualityScore: 4.7, avgLeadTimeDays: 18, openOrders: 6, totalOrderValue: 14_800_000, rating: 4.7, isManufacturer: true, isDemo: true,
  },
  {
    id: 'sp-2', paymentTier: 'standard', name: 'Sanghvi Lift Works', status: 'active', kycStatus: 'approved', city: 'Pune', gstin: '27AACFS9012C1Z8',
    contactName: 'Meenal Sanghvi', contactPhone: '9821044202',
    categories: ['cabin', 'guide_rails', 'ropes'], driveTypeSpecialties: ['hydraulic', 'geared_traction'], regionsServed: ['Maharashtra'],
    onTimeRate: 0.81, qualityScore: 4.1, avgLeadTimeDays: 12, openOrders: 4, totalOrderValue: 6_200_000, rating: 4.1, isManufacturer: false, isDemo: true,
  },
  {
    id: 'sp-3', paymentTier: 'standard', name: 'Konark Drives & Controls', status: 'active', kycStatus: 'approved', city: 'Nashik', gstin: '27AAECK3456D1Z1',
    contactName: 'Suresh Konark', contactPhone: '9821044203',
    categories: ['controller', 'vfd', 'wiring'], driveTypeSpecialties: ['geared_traction', 'gearless_traction', 'mrl'], regionsServed: ['Maharashtra'],
    onTimeRate: 0.88, qualityScore: 4.4, avgLeadTimeDays: 21, openOrders: 3, totalOrderValue: 4_950_000, rating: 4.4, isManufacturer: true, isDemo: true,
  },
  {
    id: 'sp-4', paymentTier: 'standard',
    paymentTermsOverride: {
      settings: { termType: 'advance', upfrontPct: 40, retentionPct: 5 },
      reason: 'Deccan buys steel from the mill against each order. 40% up front covers that purchase, agreed with them in March 2026.',
      setBy: 'Prashant Vasant Wable',
      setAt: daysAgo(190),
    },
    name: 'Deccan Structural Steel', status: 'active', kycStatus: 'approved', city: 'Pune',
    contactName: 'Ajay Deshpande', contactPhone: '9821044204',
    categories: ['guide_rails', 'brackets', 'counterweight'], driveTypeSpecialties: ['hydraulic', 'geared_traction', 'gearless_traction'], regionsServed: ['Maharashtra', 'Karnataka'],
    onTimeRate: 0.72, qualityScore: 3.6, avgLeadTimeDays: 9, openOrders: 2, totalOrderValue: 2_100_000, rating: 3.6, isManufacturer: true, isDemo: true,
  },
  // Not yet KYC-approved — 077's own closure kickoff for dl-6 already
  // relies on this exact fact (spo-1 fails against sp-5 for this reason).
  {
    id: 'sp-5', paymentTier: 'new', name: 'Rathi Lift Systems', status: 'pending_approval', kycStatus: 'pending', city: 'Ahmedabad', gstin: '24AACFR5678B1Z2',
    contactName: 'Rathi Patel', contactPhone: '9821044205',
    categories: ['traction_machine', 'controller'], driveTypeSpecialties: ['geared_traction'], regionsServed: ['Gujarat', 'Rajasthan'],
    onTimeRate: 0, qualityScore: 0, avgLeadTimeDays: 0, openOrders: 0, totalOrderValue: 0, rating: 0, isManufacturer: false, isDemo: true,
  },
];

/** Screen 092's own minimal catalog seed — one entry per category each
 *  supplier already lists in `categories`, real enough to price a real PO
 *  line and to demonstrate a since-changed price after a reassignment. */
/** Each supplier's own published parts (093). sp-1 and sp-5 both list a
 *  geared traction machine and sp-2/sp-4 both a guide-rail set at
 *  different prices — kept as-is on purpose: the spread is sourcing
 *  information. sci-1 has a supplier-submitted hike waiting on Admin. */
export const seedSupplierCatalogItems: SupplierCatalogItem[] = [
  { id: 'sci-1', supplierId: 'sp-1', category: 'traction_machine', description: 'Geared/gearless traction machine unit', specification: '1000 kg, 1.5 m/s, 7.5 kW', driveTypes: ['geared_traction', 'gearless_traction'], unitPrice: 210_000, leadTimeDays: 28, status: 'active', pendingPrice: 248_000, pendingPriceChangeId: 'cpc-3', updatedAt: daysAgo(40), isDemo: true },
  { id: 'sci-2', supplierId: 'sp-1', category: 'controller', description: 'Microprocessor lift controller', specification: 'Up to 20 stops, ARD-ready', driveTypes: [], unitPrice: 97_500, leadTimeDays: 21, status: 'active', updatedAt: daysAgo(3), isDemo: true },
  { id: 'sci-3', supplierId: 'sp-1', category: 'cabin', description: 'Passenger cabin, standard finish', specification: '8 persons, SS hairline', driveTypes: [], unitPrice: 165_000, leadTimeDays: 35, status: 'active', updatedAt: daysAgo(90), isDemo: true },
  { id: 'sci-4', supplierId: 'sp-1', category: 'door_operator', description: 'Automatic door operator', specification: 'Centre-opening, 800 mm', driveTypes: [], unitPrice: 52_000, leadTimeDays: 14, status: 'active', updatedAt: daysAgo(90), isDemo: true },
  { id: 'sci-5', supplierId: 'sp-2', category: 'cabin', description: 'Passenger cabin, standard finish', specification: '8 persons, painted MS', driveTypes: [], unitPrice: 158_000, leadTimeDays: 30, status: 'active', updatedAt: daysAgo(55), isDemo: true },
  { id: 'sci-6', supplierId: 'sp-2', category: 'guide_rails', description: 'T-section guide rail set', specification: 'T89/B, per 10-stop shaft', driveTypes: [], unitPrice: 38_000, leadTimeDays: 10, status: 'active', updatedAt: daysAgo(55), isDemo: true },
  { id: 'sci-7', supplierId: 'sp-2', category: 'ropes', description: 'Steel suspension ropes, per set', specification: '8 mm, 5 ropes', driveTypes: ['geared_traction', 'gearless_traction', 'mrl'], unitPrice: 19_000, leadTimeDays: 7, status: 'active', updatedAt: daysAgo(120), isDemo: true },
  { id: 'sci-8', supplierId: 'sp-3', category: 'controller', description: 'Microprocessor lift controller', specification: 'Up to 16 stops', driveTypes: [], unitPrice: 92_000, leadTimeDays: 18, status: 'active', updatedAt: daysAgo(30), isDemo: true },
  { id: 'sci-9', supplierId: 'sp-3', category: 'vfd', description: 'Variable frequency drive', specification: '7.5 kW, closed loop', driveTypes: ['geared_traction', 'gearless_traction', 'mrl'], unitPrice: 41_000, leadTimeDays: 12, status: 'active', updatedAt: daysAgo(30), isDemo: true },
  { id: 'sci-10', supplierId: 'sp-3', category: 'wiring', description: 'Traveling cable and shaft wiring', specification: 'Per 10-stop shaft', driveTypes: [], unitPrice: 16_000, leadTimeDays: 7, status: 'active', updatedAt: daysAgo(75), isDemo: true },
  { id: 'sci-11', supplierId: 'sp-4', category: 'guide_rails', description: 'T-section guide rail set', specification: 'T89/B, per 10-stop shaft', driveTypes: [], unitPrice: 36_000, leadTimeDays: 12, status: 'active', updatedAt: daysAgo(80), isDemo: true },
  { id: 'sci-12', supplierId: 'sp-4', category: 'brackets', description: 'Guide rail mounting brackets', specification: 'Galvanised, set of 40', driveTypes: [], unitPrice: 12_500, leadTimeDays: 9, status: 'active', updatedAt: daysAgo(80), isDemo: true },
  { id: 'sci-13', supplierId: 'sp-4', category: 'counterweight', description: 'Counterweight assembly', specification: 'Cast iron fillers, 1000 kg car', driveTypes: ['geared_traction', 'gearless_traction', 'mrl'], unitPrice: 26_000, leadTimeDays: 15, status: 'active', updatedAt: daysAgo(80), isDemo: true },
  { id: 'sci-14', supplierId: 'sp-5', category: 'traction_machine', description: 'Geared traction machine unit', specification: '1000 kg, 1.0 m/s, 7.5 kW', driveTypes: ['geared_traction'], unitPrice: 205_000, leadTimeDays: 32, status: 'active', updatedAt: daysAgo(20), isDemo: true },
  { id: 'sci-15', supplierId: 'sp-5', category: 'controller', description: 'Microprocessor lift controller', specification: 'Up to 12 stops', driveTypes: [], unitPrice: 89_000, leadTimeDays: 20, status: 'active', updatedAt: daysAgo(20), isDemo: true },
];

/** Price history (093). cpc-3 is Vertex's own 18% hike on its traction
 *  machine — past the 10% review line, so it waits for Admin while the
 *  live price stays ₹2,10,000. */
export const seedCatalogPriceChanges: CatalogPriceChange[] = [
  { id: 'cpc-1', itemId: 'sci-1', supplierId: 'sp-1', fromPrice: 198_000, toPrice: 204_000, source: 'supplier', requestedBy: 'Vikram Anand', requestedAt: daysAgo(150), status: 'applied', isDemo: true },
  { id: 'cpc-2', itemId: 'sci-1', supplierId: 'sp-1', fromPrice: 204_000, toPrice: 210_000, source: 'supplier', requestedBy: 'Vikram Anand', requestedAt: daysAgo(40), status: 'applied', isDemo: true },
  { id: 'cpc-3', itemId: 'sci-1', supplierId: 'sp-1', fromPrice: 210_000, toPrice: 248_000, source: 'supplier', requestedBy: 'Vikram Anand', requestedAt: hoursAgo(5), status: 'pending', reviewReasonKeys: ['over_threshold'], isDemo: true },
  { id: 'cpc-4', itemId: 'sci-8', supplierId: 'sp-3', fromPrice: 88_000, toPrice: 92_000, source: 'supplier', requestedBy: 'Suresh Konark', requestedAt: daysAgo(30), status: 'applied', isDemo: true },
  { id: 'cpc-5', itemId: 'sci-5', supplierId: 'sp-2', fromPrice: 162_000, toPrice: 158_000, source: 'admin', requestedBy: 'Prashant Vasant Wable', requestedAt: daysAgo(55), status: 'applied', isDemo: true },
  // Approved after AIEC-PO-8203 went out at the old price: the basis Vertex's invoice for it cites (113).
  { id: 'cpc-6', itemId: 'sci-2', supplierId: 'sp-1', fromPrice: 95_000, toPrice: 97_500, source: 'supplier', requestedBy: 'Vikram Anand', requestedAt: daysAgo(3), status: 'applied', reviewedBy: 'Prashant Vasant Wable', reviewedAt: daysAgo(3), isDemo: true },
];

/* ------------------------------------------ Supplier order fulfilment (095) */

type SeedLine = [category: string, description: string, price: number];

/** Builds a sent PO whose lines moved through fulfilment on a timetable —
 *  `stageDays` is how long each stage took (sent → acknowledged, acknowledged
 *  → in production, in production → ready, ready → shipped, shipped →
 *  delivered). Stops at however many stages are given, so an in-flight PO is
 *  just a shorter list. What 095 learns each supplier's typical timing from. */
function fulfilledPo(
  id: string,
  code: string,
  dealId: string,
  supplierId: string,
  byName: string,
  sentDaysAgo: number,
  stageDays: number[],
  lines: SeedLine[],
  expectedInDays: number,
): SupplierPurchaseOrder {
  const stages: PoFulfilmentStage[] = ['sent', 'acknowledged', 'in_production', 'ready_to_ship', 'shipped', 'delivered'];
  const lineItems: PurchaseOrderLineItem[] = lines.map(([category, description, price], i) => ({
    id: `${id}-l${i + 1}`,
    category,
    description,
    quantity: 1,
    catalogUnitPriceAtDraft: price,
    agreedUnitPrice: price,
  }));
  const events: PoStatusEvent[] = [];
  let cursor = sentDaysAgo;
  stageDays.forEach((days, i) => {
    cursor -= days;
    events.push({
      id: `${id}-e${i + 1}`,
      lineItemIds: lineItems.map((l) => l.id),
      fromStage: stages[i],
      toStage: stages[i + 1],
      at: daysAgo(cursor),
      byName: i === 4 ? 'Prashant Vasant Wable' : byName,
      byRole: i === 4 ? 'admin' : 'supplier',
      onBehalf: false,
    });
  });
  const reached = stages[stageDays.length];
  const reachedAt = events.length ? events[events.length - 1].at : daysAgo(sentDaysAgo);
  return {
    id,
    code,
    dealId,
    supplierId,
    status: 'sent',
    triggeredAt: daysAgo(sentDaysAgo + 1),
    sentBy: 'Prashant Vasant Wable',
    sentAt: daysAgo(sentDaysAgo),
    acknowledgedAt: stageDays.length >= 1 ? events[0].at : undefined,
    acknowledgedBy: stageDays.length >= 1 ? byName : undefined,
    receivedAt: reached === 'delivered' ? reachedAt : undefined,
    receivedBy: reached === 'delivered' ? 'Prashant Vasant Wable' : undefined,
    expectedDeliveryDate: daysAhead(expectedInDays - sentDaysAgo),
    lineItems: lineItems.map((l) => ({ ...l, fulfilmentStage: reached, stageEnteredAt: reachedAt })),
    statusEvents: events,
    isDemo: true,
  };
}

/** dl-2's live orders: Sanghvi's has sat in production for 10 days against
 *  its usual ~6.5 — trending late for Sanghvi, though it would be quick for
 *  Vertex. Vertex's is on track, with the door operator already ready while
 *  the rest is still being built (a partial). */
const dl2Vertex = fulfilledPo('spo-202', 'AIEC-PO-8202', 'dl-2', 'sp-1', 'Anil Mehta', 6, [1, 1], [
  ['traction_machine', 'Geared/gearless traction machine unit', 210_000],
  ['controller', 'Microprocessor lift controller', 95_000],
  ['door_operator', 'Automatic door operator', 52_000],
], 31);
dl2Vertex.lineItems = dl2Vertex.lineItems!.map((l) => (l.category === 'door_operator' ? { ...l, fulfilmentStage: 'ready_to_ship', stageEnteredAt: daysAgo(1) } : l));
dl2Vertex.statusEvents = [
  ...dl2Vertex.statusEvents!,
  { id: 'spo-202-e3', lineItemIds: ['spo-202-l3'], fromStage: 'in_production', toStage: 'ready_to_ship', at: daysAgo(1), byName: 'Anil Mehta', byRole: 'supplier', onBehalf: false },
];

export const seedHistoricalPurchaseOrders: SupplierPurchaseOrder[] = [
  // Finished orders — the history each supplier's typical timing comes from.
  fulfilledPo('spo-h1', 'AIEC-PO-8101', 'dl-h1', 'sp-1', 'Anil Mehta', 120, [1, 2, 18, 2, 3], [['traction_machine', 'Geared/gearless traction machine unit', 198_000], ['controller', 'Microprocessor lift controller', 90_000]], 28),
  fulfilledPo('spo-h2', 'AIEC-PO-8102', 'dl-h2', 'sp-1', 'Anil Mehta', 80, [1, 3, 20, 1, 2], [['cabin', 'Passenger cabin, standard finish', 160_000]], 30),
  fulfilledPo('spo-h3', 'AIEC-PO-8103', 'dl-h1', 'sp-2', 'Meenal Sanghvi', 90, [0.5, 1, 6, 1, 2], [['guide_rails', 'T-section guide rail set', 37_000], ['ropes', 'Steel suspension ropes, per set', 18_500]], 14),
  fulfilledPo('spo-h4', 'AIEC-PO-8104', 'dl-h2', 'sp-2', 'Meenal Sanghvi', 60, [1, 2, 7, 2, 2], [['cabin', 'Passenger cabin, standard finish', 160_000]], 16),
  fulfilledPo('spo-h5', 'AIEC-PO-8105', 'dl-h3', 'sp-3', 'Suresh Konark', 70, [2, 2, 12, 2, 3], [['vfd', 'Variable frequency drive', 40_000]], 22),
  fulfilledPo('spo-h6', 'AIEC-PO-8106', 'dl-h3', 'sp-3', 'Suresh Konark', 45, [1, 2, 11, 1, 2], [['controller', 'Microprocessor lift controller', 88_000]], 20),
  // Live, on the board.
  fulfilledPo('spo-201', 'AIEC-PO-8201', 'dl-2', 'sp-2', 'Meenal Sanghvi', 12, [1, 1], [
    ['cabin', 'Passenger cabin, standard finish', 158_000],
    ['guide_rails', 'T-section guide rail set', 38_000],
    ['ropes', 'Steel suspension ropes, per set', 19_000],
  ], 15),
  dl2Vertex,
  // Another AIEC order's controller, built in the same Vertex run as dl-2's.
  fulfilledPo('spo-203', 'AIEC-PO-8203', 'dl-h4', 'sp-1', 'Anil Mehta', 7, [0.5, 0.5], [['controller', 'Microprocessor lift controller', 95_000]], 30),
  // Konark's controller for Wing B's service lift, still in production and slipping: the second
  // supplier delayed on controllers this month, which is what 106 reads as a market pattern, not one supplier.
  fulfilledPo('spo-205', 'AIEC-PO-8205', 'dl-1', 'sp-3', 'Suresh Konark', 14, [1, 3], [['controller', 'Microprocessor lift controller (service lift)', 96_000]], 16),
  // Ordered for a deal that was lost while the parts were being made: 106 asks what to do with them.
  fulfilledPo('spo-206', 'AIEC-PO-8206', 'dl-8', 'sp-2', 'Meenal Sanghvi', 22, [1, 2, 10], [['guide_rails', 'T-section guide rail set', 37_500]], 18),
  // Wing B's order for Shree Ram Heights, on the road today in three parts (102).
  fulfilledPo('spo-204', 'AIEC-PO-8204', 'dl-1', 'sp-1', 'Anil Mehta', 13.2, [0.5, 1, 10, 1.5], [
    ['traction_machine', 'Geared/gearless traction machine unit', 210_000],
    ['controller', 'Microprocessor lift controller', 95_000],
    ['door_operator', 'Automatic door operator', 52_000],
  ], 14),
];

/* ------------------------------- Supplier rating & quality scorecard (097) */

const RATING_SITES = ['Shree Ram Heights', 'Skyline Corporate Park', 'Pinnacle Aurum', 'Kulkarni Signature', 'Bloom Apartments', 'Magnolia Residency', 'Civic Health Centre', 'Tech Park Block C'];

type SeedDefect = [note: string, attribution: DefectAttribution, daysAfterDelivery?: number];

function rating(
  id: string,
  supplierId: string,
  orderCode: string,
  deliveredDaysAgo: number,
  timelinessDays: number,
  defects: SeedDefect[] = [],
  extra: Partial<SupplierOrderRating> = {},
): SupplierOrderRating {
  return {
    id,
    supplierId,
    orderCode,
    siteName: RATING_SITES[Number(id.replace(/\D/g, '')) % RATING_SITES.length],
    expectedDeliveryDate: daysAgo(deliveredDaysAgo + timelinessDays),
    deliveredAt: daysAgo(deliveredDaysAgo),
    timelinessDays,
    defects: defects.map(([note, attribution, after = 1], i) => ({
      id: `${id}-d${i + 1}`,
      note,
      loggedBy: 'Prashant Vasant Wable',
      loggedAt: daysAgo(deliveredDaysAgo - after),
      attribution,
    })),
    isDemo: true,
    ...extra,
  };
}

/** Builds `count` older orders for a supplier, one every `everyDays`, with
 *  the given late orders and defects placed by index — each supplier's
 *  record, from which their on-time rate and quality are derived. */
function ratingHistory(
  prefix: string,
  supplierId: string,
  codeBase: number,
  count: number,
  newestDaysAgo: number,
  everyDays: number,
  late: Record<number, number>,
  defects: Record<number, SeedDefect[]>,
): SupplierOrderRating[] {
  return Array.from({ length: count }, (_, i) =>
    rating(`${prefix}-${i + 1}`, supplierId, `AIEC-PO-${codeBase + i}`, newestDaysAgo + (count - 1 - i) * everyDays, late[i] ?? -(i % 3), defects[i] ?? []),
  );
}

const EXPRESSWAY_LATE = new Set(['rt-sg-12', 'rt-sg-13', 'rt-sg-14']);

const seedRatingsRaw: SupplierOrderRating[] = [
  // Vertex — reliable, with one late order and two genuine defects.
  ...ratingHistory('rt-vx', 'sp-1', 7101, 13, 30, 14, { 4: 3 }, {
    2: [['Controller display flickered on first power-up', 'supplier']],
    9: [['Cabin fan noisy out of the box', 'supplier']],
  }),
  rating('rt-vx-h1', 'sp-1', 'AIEC-PO-8101', 99, -1, [], { poId: 'spo-h1' }),
  rating('rt-vx-h2', 'sp-1', 'AIEC-PO-8102', 58, 0, [], { poId: 'spo-h2', adminQuality: 5, adminQualityNote: 'Finish better than spec.', adminQualityBy: 'Prashant Vasant Wable', adminQualityAt: daysAgo(56) }),
  // The dispute: a board "burnt on commissioning" that the site's own
  // wiring log shows was a reversed phase — an installation fault.
  rating('rt-vx-d1', 'sp-1', 'AIEC-PO-8107', 21, 0, [['Controller board burnt out on commissioning', 'supplier', 2]], {
    siteName: 'Magnolia Residency',
    dispute: {
      raisedBy: 'Anil Mehta',
      raisedAt: daysAgo(12),
      reason: 'The site’s wiring log shows the mains phase was reversed during installation. The board failed because of that, not a manufacturing fault. Please reattribute.',
      status: 'open',
    },
  }),
  // Sanghvi — a September run of late deliveries (the expressway closures).
  ...ratingHistory('rt-sg', 'sp-2', 7201, 14, 12, 7, { 11: 4, 12: 5, 13: 3 }, {
    1: [['Rope tension tags missing', 'supplier']],
    5: [['Cabin panel scratched in transit', 'transport']],
    7: [['Guide rail set one bracket short', 'supplier']],
    10: [['Cabin door gap out of tolerance', 'supplier'], ['Car panel dent', 'supplier']],
  }),
  rating('rt-sg-h3', 'sp-2', 'AIEC-PO-8103', 81, 0, [], { poId: 'spo-h3' }),
  rating('rt-sg-h4', 'sp-2', 'AIEC-PO-8104', 44, -1, [], { poId: 'spo-h4' }),
  // Konark — consistent.
  ...ratingHistory('rt-kn', 'sp-3', 7301, 6, 20, 18, { 3: 2 }, { 1: [['VFD parameter set shipped wrong', 'supplier']] }),
  rating('rt-kn-h5', 'sp-3', 'AIEC-PO-8105', 63, 1, [], { poId: 'spo-h5' }),
  rating('rt-kn-h6', 'sp-3', 'AIEC-PO-8106', 28, -2, [['Drive threw an overcurrent fault on commissioning; Konark replaced the board', 'supplier', 27]], { poId: 'spo-h6' }),
  // Deccan — often late, rougher finish.
  ...ratingHistory('rt-dc', 'sp-4', 7401, 11, 10, 14, { 1: 4, 5: 6, 8: 3 }, {
    0: [['Brackets arrived bent', 'supplier']],
    2: [['Bracket welds uneven', 'supplier']],
    4: [['Counterweight fillers short by 2', 'supplier']],
    6: [['Rail joints not deburred', 'supplier'], ['Fishplates missing', 'supplier']],
    7: [['Rails installed misaligned', 'installation']],
    9: [['Bracket holes mis-drilled', 'supplier'], ['Rust on delivery', 'supplier']],
  }),
];

/** Sanghvi's three late September orders were the expressway closures, not their own doing. */
export const seedSupplierOrderRatings: SupplierOrderRating[] = seedRatingsRaw.map((r) => (EXPRESSWAY_LATE.has(r.id) ? { ...r, delayCause: 'external_event' as const } : r));

export const seedScoreContextNotes: SupplierScoreContextNote[] = [
  {
    id: 'scn-1',
    supplierId: 'sp-2',
    note: 'September 2026: the Pune–Mumbai expressway closures held up deliveries from most suppliers for about two weeks. Sanghvi’s three late orders that month were part of that, not a change in how they work.',
    addedBy: 'Prashant Vasant Wable',
    addedAt: daysAgo(6),
    isDemo: true,
  },
];

/* ------------------------------------------ Delivery scheduling (101) */

/** A calendar day offset from today, as the `yyyy-mm-dd` key deliveries use. */
const dayKeyAhead = (n: number) => dateKey(new Date(NOW + n * DAY));
/** The first day on or after `fromOffset` that a supplier works and hasn't blacked out. */
function firstDeliveryDay(fromOffset: number, weekdays: number[], blackouts: string[] = []): string {
  for (let i = fromOffset; i < fromOffset + 21; i += 1) {
    const key = dayKeyAhead(i);
    if (weekdays.includes(new Date(NOW + i * DAY).getDay()) && !blackouts.includes(key)) return key;
  }
  return dayKeyAhead(fromOffset);
}
/** The first working day strictly after a calendar day. */
function firstDeliveryDayAfter(key: string, weekdays: number[], blackouts: string[] = []): string {
  for (let i = 1; i < 21; i += 1) {
    const next = addDaysKey(key, i);
    if (weekdays.includes(new Date(`${next}T12:00:00`).getDay()) && !blackouts.includes(next)) return next;
  }
  return addDaysKey(key, 1);
}

const VERTEX_DAYS = [1, 2, 3, 4, 5, 6];
const SANGHVI_DAYS = [1, 2, 3, 4, 5];
const VERTEX_BLACKOUTS = [dayKeyAhead(3), dayKeyAhead(10)];

/** What each supplier can actually dispatch. Rathi, still pending approval,
 *  hasn't given any — so nothing can be booked against them. */
export const seedDispatchAvailability: SupplierDispatchAvailability[] = [
  {
    supplierId: 'sp-1', weekdays: VERTEX_DAYS, windows: ['morning', 'afternoon'], maxPerDay: 2, leadDays: 2, updatedBy: 'Anil Mehta', updatedAt: daysAgo(30), isDemo: true,
    blackouts: [
      { date: VERTEX_BLACKOUTS[0], reason: 'Plant closed for annual maintenance' },
      { date: VERTEX_BLACKOUTS[1], reason: 'Transporter fleet audit' },
    ],
  },
  { supplierId: 'sp-2', weekdays: SANGHVI_DAYS, windows: ['morning'], maxPerDay: 1, leadDays: 3, blackouts: [], updatedBy: 'Meenal Sanghvi', updatedAt: daysAgo(45), isDemo: true },
  { supplierId: 'sp-3', weekdays: [1, 3, 5], windows: ['morning', 'afternoon'], maxPerDay: 2, leadDays: 3, blackouts: [], updatedBy: 'Suresh Konark', updatedAt: daysAgo(60), isDemo: true },
  { supplierId: 'sp-4', weekdays: [2, 3, 4, 5, 6], windows: ['afternoon'], maxPerDay: 2, leadDays: 4, blackouts: [], updatedBy: 'Prashant Vasant Wable', updatedAt: daysAgo(20), isDemo: true },
];

const readiness = (dealId: string, ready: boolean[], extra: Partial<SiteReadiness> = {}): SiteReadiness => ({
  dealId,
  items: { shaft_civil: ready[0], pit_depth: ready[1], machine_room: ready[2], power_supply: ready[3], access_route: ready[4], storage_space: ready[5] },
  isDemo: true,
  ...extra,
});

/** Kulkarni Signature is ready and confirmed by the site engineer. The
 *  building behind AIEC-PO-8203 is half-done: no delivery can be booked there. */
export const seedSiteReadiness: SiteReadiness[] = [
  readiness('dl-2', [true, true, true, true, true, true], { contactName: 'Mr. Kulkarni, site engineer', confirmedBy: 'Prashant Vasant Wable', confirmedAt: daysAgo(6) }),
  readiness('dl-1', [true, true, true, true, true, true], { contactName: 'Mr. Joshi, society secretary', confirmedBy: 'Prashant Vasant Wable', confirmedAt: daysAgo(4) }),
  readiness('dl-h4', [true, true, false, false, true, false], { contactName: 'Site supervisor' }),
  readiness('dl-h2', [true, true, true, true, true, true], { contactName: 'Mr. Deshmukh', confirmedBy: 'Prashant Vasant Wable', confirmedAt: daysAgo(48) }),
  readiness('dl-h3', [true, true, true, true, true, true], { contactName: 'Ms. Iyer', confirmedBy: 'Prashant Vasant Wable', confirmedAt: daysAgo(66) }),
];

const receivedKey = (poId: string) => dateKey(new Date(seedHistoricalPurchaseOrders.find((p) => p.id === poId)!.receivedAt!));

/** Sanghvi's cabins were booked for the promised day and the supplier moved
 *  them a day (their fault — the promise stays where it was). Vertex's
 *  drive unit must follow them. And once, a truck arrived at a site whose
 *  pit wasn't finished: a failed attempt, not a reschedule. */
const PROMISE_201 = dateKey(new Date(seedHistoricalPurchaseOrders.find((po) => po.id === 'spo-201')?.expectedDeliveryDate ?? at(3 * DAY)));
const SANGHVI_BOOKED = firstDeliveryDayAfter(PROMISE_201, SANGHVI_DAYS);
const VERTEX_BOOKED = firstDeliveryDayAfter(SANGHVI_BOOKED, VERTEX_DAYS, VERTEX_BLACKOUTS);
const H4_DAY = receivedKey('spo-h4');
export const seedDeliverySchedules: DeliverySchedule[] = [
  {
    id: 'dsch-1', poId: 'spo-201', dealId: 'dl-2', supplierId: 'sp-2', status: 'scheduled', date: SANGHVI_BOOKED, window: 'morning', failedAttempts: 0, createdAt: daysAgo(5), isDemo: true,
    events: [
      { id: 'dsch-1-e1', kind: 'scheduled', at: daysAgo(5), byName: 'Prashant Vasant Wable', byRole: 'admin', date: PROMISE_201, window: 'morning' },
      {
        id: 'dsch-1-e2', kind: 'rescheduled', at: daysAgo(1), byName: 'Meenal Sanghvi', byRole: 'supplier', date: SANGHVI_BOOKED, window: 'morning', fromDate: PROMISE_201, fromWindow: 'morning',
        cause: 'supplier', reason: 'The cabin paint needs one more day to cure before it can be loaded.',
      },
    ],
  },
  {
    // Wing B's parts are booked for the day their first vehicle is due.
    id: 'dsch-5', poId: 'spo-204', dealId: 'dl-1', supplierId: 'sp-1', status: 'scheduled', date: dayKeyAhead(0), window: new Date(NOW + 25 * MINUTE).getHours() < 12 ? 'morning' : 'afternoon', failedAttempts: 0, createdAt: daysAgo(3), isDemo: true,
    events: [{ id: 'dsch-5-e1', kind: 'scheduled', at: daysAgo(3), byName: 'Prashant Vasant Wable', byRole: 'admin', date: dayKeyAhead(0), window: new Date(NOW + 25 * MINUTE).getHours() < 12 ? 'morning' : 'afternoon' }],
  },
  {
    id: 'dsch-2', poId: 'spo-202', dealId: 'dl-2', supplierId: 'sp-1', status: 'scheduled', date: VERTEX_BOOKED, window: 'morning', dependsOnPoId: 'spo-201', jobId: 'j-4', failedAttempts: 0, createdAt: daysAgo(4), isDemo: true,
    events: [{ id: 'dsch-2-e1', kind: 'scheduled', at: daysAgo(4), byName: 'Prashant Vasant Wable', byRole: 'admin', date: VERTEX_BOOKED, window: 'morning' }],
  },
  {
    id: 'dsch-3', poId: 'spo-h4', dealId: 'dl-h2', supplierId: 'sp-2', status: 'scheduled', date: H4_DAY, window: 'morning', failedAttempts: 1, createdAt: daysAgo(58), isDemo: true,
    events: [
      { id: 'dsch-3-e1', kind: 'scheduled', at: daysAgo(58), byName: 'Prashant Vasant Wable', byRole: 'admin', date: addDaysKey(H4_DAY, -2), window: 'morning' },
      { id: 'dsch-3-e2', kind: 'attempt_failed', at: daysAgo(49), byName: 'Meenal Sanghvi', byRole: 'supplier', date: addDaysKey(H4_DAY, -2), window: 'morning', reason: 'The lift pit was still being waterproofed, so the cabin could not be unloaded.' },
      { id: 'dsch-3-e3', kind: 'scheduled', at: daysAgo(48), byName: 'Prashant Vasant Wable', byRole: 'admin', date: H4_DAY, window: 'morning' },
    ],
  },
  {
    id: 'dsch-4', poId: 'spo-h5', dealId: 'dl-h3', supplierId: 'sp-3', status: 'scheduled', date: receivedKey('spo-h5'), window: 'afternoon', failedAttempts: 0, createdAt: daysAgo(20), isDemo: true,
    events: [{ id: 'dsch-4-e1', kind: 'scheduled', at: daysAgo(20), byName: 'Prashant Vasant Wable', byRole: 'admin', date: receivedKey('spo-h5'), window: 'afternoon' as DeliveryWindow }],
  },
];

/* ------------------------------------------ Shipment tracking (102) */

const MUMBAI_DOCK = { name: 'Vertex dispatch dock, Mumbai', lat: 19.076, lng: 72.8777 };
const gps = (milestone: ShipmentMilestone, minutesBefore: number): ShipmentMilestoneEvent => ({ milestone, at: minutesAgo(minutesBefore), source: 'gps', customerNotifiedAt: minutesAgo(minutesBefore - 1) });

/** 105: history a demo can read. AIEC-PO-8203's controller was running two
 *  days behind when Vertex's second shift caught it up: recovered, the
 *  customer already told, so the screen shows what good news looks like. */
export const seedDeliveryDelayCases: DeliveryDelayCase[] = [
  {
    id: 'ddc-1',
    poId: 'spo-203',
    dealId: 'dl-h4',
    supplierId: 'sp-1',
    status: 'recovered',
    openedAt: hoursAgo(30),
    worstSeverity: 'late',
    lateSince: hoursAgo(28),
    peakGapHours: 44,
    recoveredAt: hoursAgo(5),
    recoveredEta: new Date(NOW + 11 * DAY).toISOString(),
    rootCause: 'supplier_production',
    rootCauseNote: 'A batch of boards failed Vertex’s own test and was rebuilt.',
    causeTaggedByName: 'Prashant Vasant Wable',
    causeTaggedAt: hoursAgo(26),
    contactedSupplierAt: hoursAgo(27),
    customerNotifiedAt: hoursAgo(25),
    customerNotifiedEta: new Date(NOW + 13 * DAY).toISOString(),
    isDemo: true,
  },
];

/* ------------------------------------------- Delivery SOP (107) */

const sopStep = (id: string, label: string, opts: Partial<DeliverySopStep> = {}): DeliverySopStep => ({ id, label, mandatory: true, needsPhoto: false, ...opts });

/** The procedure every delivery checklist is built from. The master template applies to every part;
 *  a category's own steps are added after it. Door operators have a second version already scheduled,
 *  written after a real incident, to show what a lesson learned looks like as a versioned change. */
export const seedDeliverySops: DeliverySopTemplate[] = [
  {
    id: 'sop-all',
    category: 'all',
    name: 'Every part',
    createdByName: 'Prashant Vasant Wable',
    createdAt: daysAgo(95),
    isDemo: true,
    versions: [
      {
        id: 'sop-all-v1',
        templateId: 'sop-all',
        version: 1,
        effectiveFrom: daysAgo(90),
        createdByName: 'Prashant Vasant Wable',
        createdAt: daysAgo(95),
        changeNote: 'First procedure: what every part gets checked for.',
        steps: [
          sopStep('sop-all-v1-s1', 'Packaging is sealed and undamaged', {
            labelHi: 'पैकिंग सीलबंद और सही-सलामत है',
            labelMr: 'पॅकिंग सीलबंद आणि सुस्थितीत आहे',
            hint: 'Note any tears, dents or water marks.',
            hintHi: 'कोई फटन, दबाव या पानी के निशान हों तो लिखें।',
            hintMr: 'फाटलेलं, दबलेलं किंवा पाण्याचे डाग असतील तर नोंदवा.',
          }),
          sopStep('sop-all-v1-s2', 'Model label is legible', { labelHi: 'मॉडल लेबल पढ़ने लायक है', labelMr: 'मॉडेल लेबल वाचता येतं' }),
        ],
      },
      {
        id: 'sop-all-v2',
        templateId: 'sop-all',
        version: 2,
        effectiveFrom: daysAgo(20),
        createdByName: 'Prashant Vasant Wable',
        createdAt: daysAgo(21),
        changeNote: 'Serial number on the label must match the delivery note: a wrong batch was once accepted.',
        steps: [
          sopStep('sop-all-v1-s1', 'Packaging is sealed and undamaged', {
            labelHi: 'पैकिंग सीलबंद और सही-सलामत है',
            labelMr: 'पॅकिंग सीलबंद आणि सुस्थितीत आहे',
            hint: 'Note any tears, dents or water marks.',
            hintHi: 'कोई फटन, दबाव या पानी के निशान हों तो लिखें।',
            hintMr: 'फाटलेलं, दबलेलं किंवा पाण्याचे डाग असतील तर नोंदवा.',
          }),
          sopStep('sop-all-v1-s2', 'Model label is legible', { labelHi: 'मॉडल लेबल पढ़ने लायक है', labelMr: 'मॉडेल लेबल वाचता येतं' }),
          sopStep('sop-all-v2-s3', 'Serial number matches the delivery note', { labelHi: 'सीरियल नंबर डिलीवरी नोट से मेल खाता है', labelMr: 'सिरीयल नंबर डिलिव्हरी नोटशी जुळतो', needsPhoto: true }),
        ],
      },
    ],
  },
  {
    id: 'sop-cabin',
    category: 'cabin',
    name: 'Cabin',
    createdByName: 'Prashant Vasant Wable',
    createdAt: daysAgo(80),
    isDemo: true,
    versions: [
      {
        id: 'sop-cabin-v1',
        templateId: 'sop-cabin',
        version: 1,
        effectiveFrom: daysAgo(80),
        createdByName: 'Prashant Vasant Wable',
        createdAt: daysAgo(80),
        changeNote: 'Glass and finished panels are fragile: an extra check a steel panel does not need.',
        steps: [
          sopStep('sop-cabin-v1-s1', 'Glass and panel edges have no chips or cracks', { labelHi: 'काँच और पैनल के किनारों पर चिप या दरार नहीं है', labelMr: 'काच आणि पॅनेलच्या कडांवर चिप किंवा तडे नाहीत', needsPhoto: true }),
          sopStep('sop-cabin-v1-s2', 'Protective film is still on every finished surface', { labelHi: 'हर फ़िनिश सतह पर सुरक्षा फ़िल्म लगी है', labelMr: 'प्रत्येक फिनिश पृष्ठभागावर संरक्षक फिल्म आहे', mandatory: false }),
        ],
      },
    ],
  },
  {
    id: 'sop-traction_machine',
    category: 'traction_machine',
    name: 'Traction machine',
    createdByName: 'Prashant Vasant Wable',
    createdAt: daysAgo(80),
    isDemo: true,
    versions: [
      {
        id: 'sop-traction_machine-v1',
        templateId: 'sop-traction_machine',
        version: 1,
        effectiveFrom: daysAgo(80),
        createdByName: 'Prashant Vasant Wable',
        createdAt: daysAgo(80),
        changeNote: 'Rated load and voltage are what the installation is designed around.',
        steps: [
          sopStep('sop-traction_machine-v1-s1', 'Nameplate shows the rated load and voltage in the spec', { labelHi: 'नेमप्लेट पर स्पेसिफ़िकेशन वाला रेटेड लोड और वोल्टेज है', labelMr: 'नेमप्लेटवर स्पेसिफिकेशनमधला रेटेड लोड आणि व्होल्टेज आहे', needsPhoto: true }),
        ],
      },
    ],
  },
  {
    id: 'sop-door_operator',
    category: 'door_operator',
    name: 'Door operator',
    createdByName: 'Prashant Vasant Wable',
    createdAt: daysAgo(70),
    isDemo: true,
    versions: [
      {
        id: 'sop-door_operator-v1',
        templateId: 'sop-door_operator',
        version: 1,
        effectiveFrom: daysAgo(70),
        createdByName: 'Prashant Vasant Wable',
        createdAt: daysAgo(70),
        changeNote: 'First procedure for door operators.',
        steps: [sopStep('sop-door_operator-v1-s1', 'Motor and belt turn freely by hand', { labelHi: 'मोटर और बेल्ट हाथ से आसानी से घूमते हैं', labelMr: 'मोटर आणि बेल्ट हाताने सहज फिरतात' })],
      },
      {
        id: 'sop-door_operator-v2',
        templateId: 'sop-door_operator',
        version: 2,
        effectiveFrom: daysAhead(3),
        createdByName: 'Prashant Vasant Wable',
        createdAt: daysAgo(1),
        changeNote: 'After the Kulkarni Signature incident: a loose mounting bracket was only found at installation. Check the bracket bolts on arrival.',
        steps: [
          sopStep('sop-door_operator-v1-s1', 'Motor and belt turn freely by hand', { labelHi: 'मोटर और बेल्ट हाथ से आसानी से घूमते हैं', labelMr: 'मोटर आणि बेल्ट हाताने सहज फिरतात' }),
          sopStep('sop-door_operator-v2-s2', 'Mounting bracket bolts are all present and tight', { labelHi: 'माउंटिंग ब्रैकेट के सभी बोल्ट मौजूद और कसे हुए हैं', labelMr: 'माउंटिंग ब्रॅकेटचे सर्व बोल्ट आहेत आणि घट्ट आहेत', needsPhoto: true }),
        ],
      },
    ],
  },
];

/** Wing B's order on three vehicles, all Vertex's: the traction machine on a
 *  truck with a live feed, the controller on the supplier's own tempo with
 *  no telematics (manual updates only), and the door operator on a second
 *  live-feed truck whose feed dropped 50 minutes ago. */
export const seedShipmentLegs: ShipmentLeg[] = [
  {
    id: 'shp-1', poId: 'spo-204', dealId: 'dl-1', supplierId: 'sp-1', lineItemIds: ['spo-204-l1'], vehicleLabel: 'MH-04 KL 7712 · 14-ft truck', driverName: 'Ramesh Jadhav', driverPhone: '9822011234',
    source: 'live_gps', origin: MUMBAI_DOCK, dispatchedAt: minutesAgo(155), etaAt: at(25 * MINUTE),
    milestones: [gps('dispatched', 155), gps('in_transit', 145)], isDemo: true,
  },
  {
    id: 'shp-2', poId: 'spo-204', dealId: 'dl-1', supplierId: 'sp-1', lineItemIds: ['spo-204-l2'], vehicleLabel: 'MH-43 AB 2290 · Vertex tempo', driverName: 'Sunil Gaikwad',
    source: 'manual', origin: MUMBAI_DOCK, dispatchedAt: minutesAgo(240), etaAt: at(90 * MINUTE),
    milestones: [
      { milestone: 'dispatched', at: minutesAgo(240), source: 'manual', byName: 'Anil Mehta', note: 'Loaded and out of the gate.', customerNotifiedAt: minutesAgo(239) },
      { milestone: 'in_transit', at: minutesAgo(60), source: 'manual', byName: 'Anil Mehta', note: 'Crossed the Lonavala toll.', customerNotifiedAt: minutesAgo(59) },
    ],
    isDemo: true,
  },
  {
    id: 'shp-3', poId: 'spo-204', dealId: 'dl-1', supplierId: 'sp-1', lineItemIds: ['spo-204-l3'], vehicleLabel: 'MH-12 QR 5508 · 14-ft truck', driverName: 'Dattatray Pawar', driverPhone: '9822015678',
    source: 'live_gps', origin: MUMBAI_DOCK, dispatchedAt: minutesAgo(120), etaAt: at(90 * MINUTE), feedLostAt: minutesAgo(50),
    milestones: [gps('dispatched', 120), gps('in_transit', 110)], isDemo: true,
  },
];


/* ------------------------------------------------ Delivery partners (109) */

const lane = (id: string, originCity: string, destinationCity: string, distanceKm: number, ratePerTrip: number, transitDays: number) => ({ id, originCity, destinationCity, distanceKm, ratePerTrip, transitDays });
const partnerEvent = (id: string, kind: DeliveryPartner['events'][number]['kind'], daysBack: number, note?: string) => ({ id, kind, at: daysAgo(daysBack), byName: 'Prashant Vasant Wable', note });

/** Five carriers: one proven and live, one manual-only and middling, one whose live feed is down right
 *  now, one brand new with no history, and one paused for poor delivery. */
export const seedDeliveryPartners: DeliveryPartner[] = [
  {
    id: 'dp-1', name: 'Swift Freight Lines', contactName: 'Nitin Deshpande', phone: '9822400111', email: 'dispatch@swiftfreight.example',
    serviceAreas: ['Pune', 'Pimpri-Chinchwad', 'Mumbai', 'Thane', 'Nashik'], liveTrackingSupported: true, feedStatus: 'connected',
    rateCardRef: 'SFL-RC-2026-03', rateCardEffectiveFrom: daysAgo(150),
    lanes: [lane('dpl-1', 'Mumbai', 'Pune', 150, 18_500, 1), lane('dpl-2', 'Mumbai', 'Pimpri-Chinchwad', 165, 19_500, 1), lane('dpl-3', 'Nashik', 'Pune', 210, 24_000, 1), lane('dpl-4', 'Pune', 'Pune', 25, 6_500, 1), lane('dpl-5', 'Mumbai', 'Thane', 30, 7_000, 1)],
    status: 'active', events: [partnerEvent('dpe-1', 'onboarded', 420, 'Onboarded on the Pune–Mumbai corridor.')], createdAt: daysAgo(420), isDemo: true,
  },
  {
    id: 'dp-2', name: 'Sahyadri Roadways', contactName: 'Vilas Jagtap', phone: '9890233445',
    serviceAreas: ['Pune', 'Pimpri-Chinchwad', 'Satara', 'Kolhapur'], liveTrackingSupported: false, feedStatus: 'connected',
    rateCardRef: 'SR-2026-Q1', rateCardEffectiveFrom: daysAgo(210),
    lanes: [lane('dpl-6', 'Pune', 'Pune', 25, 5_500, 1), lane('dpl-7', 'Pune', 'Satara', 110, 12_000, 1), lane('dpl-8', 'Mumbai', 'Pune', 150, 15_800, 2)],
    status: 'active', events: [partnerEvent('dpe-2', 'onboarded', 380, 'Cheapest local carrier; phone updates only.')], createdAt: daysAgo(380), isDemo: true,
  },
  {
    id: 'dp-3', name: 'Gujarat Express Cargo', contactName: 'Hiren Patel', phone: '9925011223',
    serviceAreas: ['Ahmedabad', 'Surat', 'Mumbai', 'Pune'], liveTrackingSupported: true, feedStatus: 'outage', feedBrokenSince: hoursAgo(3),
    rateCardRef: 'GEC-RC-24-B', rateCardEffectiveFrom: daysAgo(300),
    lanes: [lane('dpl-9', 'Ahmedabad', 'Pune', 660, 52_000, 2), lane('dpl-10', 'Ahmedabad', 'Mumbai', 530, 44_000, 2), lane('dpl-11', 'Mumbai', 'Surat', 280, 26_000, 1)],
    status: 'active', events: [partnerEvent('dpe-3', 'onboarded', 300), { id: 'dpe-4', kind: 'feed_outage', at: hoursAgo(3), byName: 'Prashant Vasant Wable', note: 'Their tracking API returns errors since morning; carrier has been told.' }], createdAt: daysAgo(300), isDemo: true,
  },
  {
    id: 'dp-4', name: 'Nashik Carriers', contactName: 'Sagar Gaikwad', phone: '9765098877',
    serviceAreas: ['Nashik', 'Pune', 'Pimpri-Chinchwad'], liveTrackingSupported: true, feedStatus: 'connected',
    rateCardRef: 'NC-2026-09', rateCardEffectiveFrom: daysAgo(30),
    lanes: [lane('dpl-12', 'Nashik', 'Pune', 210, 21_500, 1), lane('dpl-13', 'Nashik', 'Pimpri-Chinchwad', 225, 22_500, 1)],
    status: 'active', events: [partnerEvent('dpe-5', 'onboarded', 30, 'New carrier. Starting with a neutral rating until they have delivered a few loads.')], createdAt: daysAgo(30), isDemo: true,
  },
  {
    id: 'dp-5', name: 'Deccan Movers', contactName: 'Prakash Shinde', phone: '9850677788',
    serviceAreas: ['Pune', 'Pimpri-Chinchwad'], liveTrackingSupported: false, feedStatus: 'connected',
    rateCardRef: 'DM-2025-11', rateCardEffectiveFrom: daysAgo(280),
    lanes: [lane('dpl-14', 'Pune', 'Pune', 25, 5_000, 1), lane('dpl-15', 'Pune', 'Pimpri-Chinchwad', 20, 5_000, 1)],
    status: 'paused', events: [partnerEvent('dpe-6', 'onboarded', 340), partnerEvent('dpe-7', 'paused', 40, 'Four late loads in a month. Paused until they can commit to times.')], createdAt: daysAgo(340), isDemo: true,
  },
];

/** `slackH`: how long before the promise the carrier's estimate fell (negative: the estimate already
 *  missed the promise, so the goods left the supplier too late). `lateMin`: minutes after the carrier's own estimate. */
const tripRec = (id: string, partnerId: string, poCode: string, siteName: string, laneLabel: string, daysBack: number, plannedH: number, slackH: number, lateMin: number, externalEvent = false): PartnerTripRecord => {
  const dispatched = NOW - daysBack * DAY;
  const eta = dispatched + plannedH * HOUR;
  return { id, partnerId, poCode, siteName, laneLabel, promisedAt: new Date(eta + slackH * HOUR).toISOString(), dispatchedAt: new Date(dispatched).toISOString(), etaAt: new Date(eta).toISOString(), arrivedAt: new Date(eta + lateMin * MINUTE).toISOString(), ...(externalEvent ? { externalEvent: true } : {}), isDemo: true };
};

export const seedPartnerTrips: PartnerTripRecord[] = [
  // Swift: 14 trips, two slow ones of their own, one that missed the customer's date only because the supplier handed over late.
  tripRec('pt-1', 'dp-1', 'AIEC-PO-7901', 'Shree Ram Heights', 'Mumbai → Pune', 170, 6, 20, 10),
  tripRec('pt-2', 'dp-1', 'AIEC-PO-7905', 'Kulkarni Signature', 'Mumbai → Pune', 160, 6, 18, -15),
  tripRec('pt-3', 'dp-1', 'AIEC-PO-7910', 'Skyline Corporate Park', 'Nashik → Pune', 150, 7, 12, 25),
  tripRec('pt-4', 'dp-1', 'AIEC-PO-7914', 'Pinnacle Aurum', 'Mumbai → Pune', 140, 6, 30, 5),
  tripRec('pt-5', 'dp-1', 'AIEC-PO-7920', 'Shree Ram Heights', 'Mumbai → Pune', 128, 6, 2, 190),
  tripRec('pt-6', 'dp-1', 'AIEC-PO-7924', 'Kulkarni Signature', 'Pune → Pune', 118, 2, 24, 0),
  tripRec('pt-7', 'dp-1', 'AIEC-PO-7931', 'Green Valley Homes', 'Mumbai → Pimpri-Chinchwad', 104, 7, 22, 35),
  tripRec('pt-8', 'dp-1', 'AIEC-PO-7936', 'Skyline Corporate Park', 'Mumbai → Pune', 92, 6, -5, 20),
  tripRec('pt-9', 'dp-1', 'AIEC-PO-7942', 'Pinnacle Aurum', 'Nashik → Pune', 80, 7, 1, 260),
  tripRec('pt-10', 'dp-1', 'AIEC-PO-7950', 'Shree Ram Heights', 'Mumbai → Pune', 66, 6, 26, 12),
  tripRec('pt-11', 'dp-1', 'AIEC-PO-7955', 'Green Valley Homes', 'Mumbai → Pimpri-Chinchwad', 52, 7, 18, -20),
  tripRec('pt-12', 'dp-1', 'AIEC-PO-7961', 'Kulkarni Signature', 'Pune → Pune', 38, 2, 10, 0),
  tripRec('pt-13', 'dp-1', 'AIEC-PO-7967', 'Skyline Corporate Park', 'Mumbai → Pune', 24, 6, 20, 30),
  tripRec('pt-14', 'dp-1', 'AIEC-PO-7973', 'Pinnacle Aurum', 'Mumbai → Pune', 12, 6, 15, 15),
  // Sahyadri: 9 trips, a third of them well over their own estimate.
  tripRec('pt-15', 'dp-2', 'AIEC-PO-7903', 'Green Valley Homes', 'Pune → Pune', 176, 3, 20, 20),
  tripRec('pt-16', 'dp-2', 'AIEC-PO-7908', 'Shree Ram Heights', 'Pune → Satara', 150, 5, 1, 300),
  tripRec('pt-17', 'dp-2', 'AIEC-PO-7916', 'Kulkarni Signature', 'Pune → Pune', 132, 3, 12, 10),
  tripRec('pt-18', 'dp-2', 'AIEC-PO-7927', 'Skyline Corporate Park', 'Mumbai → Pune', 108, 9, 24, 40),
  tripRec('pt-19', 'dp-2', 'AIEC-PO-7938', 'Pinnacle Aurum', 'Pune → Pune', 84, 3, 1, 180),
  tripRec('pt-20', 'dp-2', 'AIEC-PO-7946', 'Green Valley Homes', 'Pune → Pune', 60, 3, 20, 25),
  tripRec('pt-21', 'dp-2', 'AIEC-PO-7957', 'Shree Ram Heights', 'Mumbai → Pune', 42, 9, -3, 50),
  tripRec('pt-22', 'dp-2', 'AIEC-PO-7964', 'Kulkarni Signature', 'Pune → Pune', 26, 3, 2, 420),
  tripRec('pt-23', 'dp-2', 'AIEC-PO-7970', 'Skyline Corporate Park', 'Pune → Pune', 10, 3, 18, 15),
  // Gujarat Express: 8 trips, reliable — but their live feed is down right now.
  tripRec('pt-24', 'dp-3', 'AIEC-PO-7911', 'Rathi Towers', 'Ahmedabad → Pune', 140, 30, 24, 40),
  tripRec('pt-25', 'dp-3', 'AIEC-PO-7919', 'Rathi Towers', 'Ahmedabad → Mumbai', 122, 24, 20, 10),
  tripRec('pt-26', 'dp-3', 'AIEC-PO-7928', 'Pinnacle Aurum', 'Ahmedabad → Pune', 104, 30, 30, 55),
  tripRec('pt-27', 'dp-3', 'AIEC-PO-7935', 'Skyline Corporate Park', 'Ahmedabad → Pune', 86, 30, 18, 20),
  tripRec('pt-28', 'dp-3', 'AIEC-PO-7944', 'Kulkarni Signature', 'Mumbai → Surat', 70, 12, 20, 5),
  tripRec('pt-29', 'dp-3', 'AIEC-PO-7953', 'Pinnacle Aurum', 'Ahmedabad → Pune', 50, 30, 3, 330, true),
  tripRec('pt-30', 'dp-3', 'AIEC-PO-7962', 'Green Valley Homes', 'Ahmedabad → Mumbai', 34, 24, 22, 30),
  tripRec('pt-31', 'dp-3', 'AIEC-PO-7971', 'Skyline Corporate Park', 'Ahmedabad → Pune', 18, 30, 16, 45),
  // Nashik Carriers: two trips only, not enough to rate.
  tripRec('pt-32', 'dp-4', 'AIEC-PO-7966', 'Green Valley Homes', 'Nashik → Pune', 22, 7, 20, 10),
  tripRec('pt-33', 'dp-4', 'AIEC-PO-7972', 'Kulkarni Signature', 'Nashik → Pimpri-Chinchwad', 9, 7, 18, 35),
  // Deccan Movers (paused): 7 trips, over half late.
  tripRec('pt-34', 'dp-5', 'AIEC-PO-7909', 'Shree Ram Heights', 'Pune → Pune', 200, 3, 1, 240),
  tripRec('pt-35', 'dp-5', 'AIEC-PO-7917', 'Pinnacle Aurum', 'Pune → Pune', 176, 3, 20, 30),
  tripRec('pt-36', 'dp-5', 'AIEC-PO-7926', 'Kulkarni Signature', 'Pune → Pimpri-Chinchwad', 150, 3, 2, 360),
  tripRec('pt-37', 'dp-5', 'AIEC-PO-7934', 'Green Valley Homes', 'Pune → Pune', 120, 3, 16, 25),
  tripRec('pt-38', 'dp-5', 'AIEC-PO-7945', 'Skyline Corporate Park', 'Pune → Pune', 92, 3, 20, 200),
  tripRec('pt-39', 'dp-5', 'AIEC-PO-7952', 'Shree Ram Heights', 'Pune → Pune', 70, 3, -2, 280),
  tripRec('pt-40', 'dp-5', 'AIEC-PO-7960', 'Pinnacle Aurum', 'Pune → Pimpri-Chinchwad', 54, 3, 14, 15),
];


/* ------------------------------------------------ Delivery analytics (110) */

type HistReport = [id: string, supplierId: string, poId: string, dealId: string, category: string, description: string, kind: 'damaged' | 'count' | 'wrong_spec', value: number, attribution: 'supplier' | 'transport' | 'installation', daysBack: number, delayDays: number, end: 'resolved' | 'credited' | 'open'];

const histReport = ([id, supplierId, poId, dealId, category, description, kind, value, attribution, daysBack, delayDays, end]: HistReport, index: number): DeliveryDiscrepancyReport => {
  const created = daysAgo(daysBack);
  const closed = end !== 'open';
  return {
    id: `ddr-${id}`,
    code: `AIEC-DR-${4901 + index}`,
    poId,
    dealId,
    supplierId,
    // Before delivery checks were kept in the app: there is no checklist to point at.
    checklistId: '',
    items: [{ lineItemId: `ddr-${id}-i1`, description, kinds: [kind], expectedQty: 1, receivedQty: kind === 'count' ? 0 : 1, note: description, photoCount: 2, category, value }],
    status: closed ? 'resolved' : 'open',
    resolution: end === 'open' ? 'replacement_requested' : end === 'credited' ? 'credited' : 'resolved',
    possibleCauses: [attribution],
    rush: false,
    attribution,
    attributionNote: 'Judged from the photographs at the time.',
    attributedByName: 'Prashant Vasant Wable',
    attributedAt: created,
    replacementEta: end === 'credited' ? undefined : end === 'open' ? daysAhead(5) : daysAgo(Math.max(0, daysBack - 6)),
    creditAmount: end === 'credited' ? value : undefined,
    scheduleDelayDays: delayDays || undefined,
    routedToSupplierAt: created,
    events: [
      { id: `ddr-${id}-e1`, kind: 'raised', at: created, byName: 'Site technician' },
      { id: `ddr-${id}-e2`, kind: 'attributed', at: created, byName: 'Prashant Vasant Wable', note: 'Judged from the photographs at the time.' },
      ...(closed ? [{ id: `ddr-${id}-e3`, kind: 'resolution' as const, at: daysAgo(Math.max(0, daysBack - 8)), byName: 'Prashant Vasant Wable', note: end }] : []),
    ],
    createdAt: created,
    createdByName: 'Site technician',
    isDemo: true,
  };
};

/** Ten past incidents across four suppliers over the last half year: enough for a rising trend to be
 *  real (Deccan's brackets, guide rails), for one supplier's own retention to have been paused over the
 *  same board (Konark), and for a mix of whose fault it was. Each carries its own cost inputs. */
export const seedDiscrepancyReports: DeliveryDiscrepancyReport[] = (
  [
    ['h1', 'sp-4', 'AIEC-PO-7401', 'dl-h1', 'brackets', 'Brackets arrived bent', 'damaged', 32_000, 'supplier', 148, 0, 'resolved'],
    ['h2', 'sp-2', 'AIEC-PO-7206', 'dl-h1', 'cabin', 'Cabin panel scratched in transit', 'damaged', 46_000, 'transport', 60, 1, 'resolved'],
    ['h3', 'sp-1', 'AIEC-PO-8101', 'dl-h1', 'controller', 'Controller model not the one ordered', 'wrong_spec', 90_000, 'supplier', 97, 0, 'credited'],
    ['h4', 'sp-4', 'AIEC-PO-7407', 'dl-h2', 'guide_rails', 'Fishplates missing from the rail set', 'count', 12_000, 'supplier', 64, 0, 'resolved'],
    ['h5', 'sp-3', 'AIEC-PO-8105', 'dl-h3', 'vfd', 'Drive keypad cracked while unloading', 'damaged', 40_000, 'installation', 61, 1, 'open'],
    ['h6', 'sp-2', 'AIEC-PO-7208', 'dl-h2', 'guide_rails', 'Guide rail set one bracket short', 'count', 22_000, 'supplier', 43, 3, 'resolved'],
    ['h7', 'sp-4', 'AIEC-PO-7410', 'dl-h2', 'brackets', 'Bracket holes mis-drilled', 'damaged', 26_000, 'supplier', 22, 2, 'resolved'],
    ['h8', 'sp-3', 'AIEC-PO-8106', 'dl-h3', 'controller', 'Drive board burnt out on commissioning', 'damaged', 40_000, 'supplier', 27, 2, 'resolved'],
    ['h9', 'sp-2', 'AIEC-PO-7211', 'dl-h1', 'cabin', 'Car panel dented', 'damaged', 30_000, 'transport', 20, 1, 'resolved'],
    ['h10', 'sp-4', 'AIEC-PO-7411', 'dl-h1', 'brackets', 'Rust on delivery', 'damaged', 24_000, 'supplier', 8, 0, 'open'],
  ] as HistReport[]
).map(histReport);

/** The one macro disruption already known: the September expressway closures (see the Sanghvi score note). */
export const seedDeliveryDisruptions: DeliveryDisruption[] = [
  {
    id: 'dis-1',
    label: 'Pune–Mumbai expressway closures',
    note: 'The expressway was closed for repairs for about two weeks. Deliveries from most suppliers on that route ran late.',
    startsOn: new Date(NOW - 26 * DAY).toISOString().slice(0, 10),
    endsOn: new Date(NOW - 12 * DAY).toISOString().slice(0, 10),
    createdByName: 'Prashant Vasant Wable',
    createdAt: daysAgo(6),
    isDemo: true,
  },
];


/* ------------------------------------------ Supplier payments (111) */

/** A payment already made, from before approval was kept here. Nothing is pending on these: the queue
 *  holds only what has fallen due since, which the app derives from each order's own terms. */
const paidSupplierPayment = (n: number, poId: string, supplierId: string, dealId: string, part: SupplierPaymentPart, trigger: SupplierPaymentTrigger, amount: number, firedDaysAgo: number, paidDaysAgo: number): SupplierPayment => {
  const code = `AIEC-SP-${3000 + n}`;
  const fired = daysAgo(firedDaysAgo);
  const paid = daysAgo(paidDaysAgo);
  return {
    id: `spay-${n}`,
    code,
    poId,
    supplierId,
    dealId,
    part,
    trigger,
    amount,
    triggeredAt: fired,
    dueAt: fired,
    status: 'executed',
    approvedAt: paid,
    approvedByName: 'Prashant Vasant Wable',
    reversibleUntil: paid,
    executedAt: paid,
    bankReference: `AIEC-TRF-${3000 + n}`,
    events: [
      { id: `spay-${n}-e1`, kind: 'triggered', at: fired, byName: 'AIEC Assistant' },
      { id: `spay-${n}-e2`, kind: 'approved', at: paid, byName: 'Prashant Vasant Wable' },
      { id: `spay-${n}-e3`, kind: 'executed', at: paid, byName: 'AIEC Assistant' },
    ],
    isDemo: true,
  };
};

/** Everything already paid on the six finished orders. Retention on two is still held and on one is paused,
 *  so those are correctly absent. */
export const seedSupplierPayments: SupplierPayment[] = [
  paidSupplierPayment(1, 'spo-h1', 'sp-1', 'dl-h1', 'balance', 'after_delivery', 273_600, 49, 48),
  paidSupplierPayment(2, 'spo-h1', 'sp-1', 'dl-h1', 'retention', 'on_handover', 14_400, 40, 39),
  paidSupplierPayment(3, 'spo-h2', 'sp-1', 'dl-h2', 'balance', 'after_delivery', 152_000, 8, 7),
  paidSupplierPayment(4, 'spo-h3', 'sp-2', 'dl-h1', 'upfront', 'on_acknowledge', 11_100, 89, 88),
  paidSupplierPayment(5, 'spo-h3', 'sp-2', 'dl-h1', 'balance', 'after_delivery', 41_625, 79, 78),
  paidSupplierPayment(6, 'spo-h3', 'sp-2', 'dl-h1', 'retention', 'on_handover', 2_775, 40, 38),
  paidSupplierPayment(7, 'spo-h4', 'sp-2', 'dl-h2', 'upfront', 'on_acknowledge', 32_000, 59, 58),
  paidSupplierPayment(8, 'spo-h4', 'sp-2', 'dl-h2', 'balance', 'after_delivery', 120_000, 46, 45),
  paidSupplierPayment(9, 'spo-h5', 'sp-3', 'dl-h3', 'upfront', 'on_acknowledge', 8_000, 68, 66),
  paidSupplierPayment(10, 'spo-h5', 'sp-3', 'dl-h3', 'balance', 'after_delivery', 30_000, 49, 48),
  paidSupplierPayment(11, 'spo-h6', 'sp-3', 'dl-h3', 'upfront', 'on_acknowledge', 17_600, 44, 43),
  paidSupplierPayment(12, 'spo-h6', 'sp-3', 'dl-h3', 'balance', 'after_delivery', 66_000, 28, 27),
  // Advances already out on orders that have not been delivered (118): Konark's is on track, Sanghvi's is for a deal since lost.
  paidSupplierPayment(13, 'spo-205', 'sp-3', 'dl-1', 'upfront', 'on_acknowledge', 19_200, 13, 12),
  paidSupplierPayment(14, 'spo-206', 'sp-2', 'dl-8', 'upfront', 'on_acknowledge', 7_500, 21, 20),
];

/** A one-off split agreed by phone for Sanghvi's cabin order: 30% up front against a 5% retention, where their
 *  tier would have paid 20%. The reason is kept with the order so it is never mistaken for their standing terms. */
export const seedPaymentDeviations: { poId: string; upfrontPct: number; retentionPct: number; reason: string; byName: string; at: string }[] = [
  { poId: 'spo-201', upfrontPct: 30, retentionPct: 5, reason: 'Sanghvi buys the cabin sheet steel against this order, so we agreed 30% up front on a call on 12 September.', byName: 'Prashant Vasant Wable', at: daysAgo(10) },
];


/* ------------------------------------------ Bank statement (120) */

const bankTxn = (n: number, hoursBack: number, direction: 'debit' | 'credit', amount: number, reference: string | null, narration: string, counterparty: string): BankTransaction => ({
  id: `btx-${n}`,
  postedAt: hoursAgo(hoursBack),
  direction,
  amount,
  reference,
  narration,
  counterparty,
  isDemo: true,
});

/** The last thirty days of the bank's own statement. Most of it matches the app's records line for line. Four things do not: a bank
 *  charge the app has no model for, a loan partner that paid ₹250 short, Sanghvi's ₹7,500 advance debited twice, and ₹50,000 that
 *  arrived from a customer nobody recorded. */
export const seedBankTransactions: BankTransaction[] = [
  bankTxn(12, 32 * 24, 'credit', 470_000, null, 'UPI CR KULKARNI CONSTRUCTIONS', 'Kulkarni Constructions'),
  bankTxn(1, 29 * 24, 'credit', 924_000, null, 'NEFT CR SHREE RAM DEVELOPERS', 'Shree Ram Developers'),
  bankTxn(2, 27 * 24, 'debit', 66_000, 'AIEC-TRF-3012', 'NEFT DR AIEC-TRF-3012 KONARK DRIVES', 'Konark Drives & Controls'),
  bankTxn(3, 20 * 24, 'debit', 7_500, 'AIEC-TRF-3014', 'NEFT DR AIEC-TRF-3014 SANGHVI LIFT WORKS', 'Sanghvi Lift Works'),
  bankTxn(4, 20 * 24 - 3, 'debit', 7_500, 'AIEC-TRF-3014', 'NEFT DR AIEC-TRF-3014 SANGHVI LIFT WORKS', 'Sanghvi Lift Works'),
  bankTxn(5, 19 * 24, 'credit', 658_000, null, 'NEFT CR OM SAI APARTMENTS', 'Om Sai Apartments'),
  bankTxn(6, 15 * 24, 'credit', 269_750, null, 'LOAN DISBURSEMENT FIN PARTNER', 'Financing partner'),
  bankTxn(7, 12 * 24, 'debit', 19_200, 'AIEC-TRF-3013', 'NEFT DR AIEC-TRF-3013 KONARK DRIVES', 'Konark Drives & Controls'),
  bankTxn(8, 12 * 24 - 2, 'debit', 354, null, 'NEFT/RTGS CHARGES + GST', 'Bank'),
  bankTxn(9, 7 * 24, 'debit', 152_000, 'AIEC-TRF-3003', 'NEFT DR AIEC-TRF-3003 VERTEX ELEVATOR', 'Vertex Elevator Components Pvt Ltd'),
  bankTxn(10, 5 * 24, 'credit', 50_000, null, 'UPI CR SUNRISE TOWERS PART PAYMENT', 'Sunrise Towers'),
  bankTxn(11, 4 * 24, 'credit', 400_000, 'NEFT240811', 'NEFT CR NEFT240811 SHREE RAM DEVELOPERS', 'Shree Ram Developers'),
  bankTxn(14, 31 * 24, 'debit', 9_000, 'NEFT2609030409', 'NEFT DR NEFT2609030409 VISHAL MORE', 'Vishal More'),
  bankTxn(13, 26 * 24, 'debit', 28_200, 'IMPS2609260311', 'IMPS DR IMPS2609260311 SUNITA DESHMUKH', 'Sunita Deshmukh'),
];

/* ------------------------------------------ Supplier GST standing (116) */

/** What the GST portal showed when each supplier was last looked up. Konark was fine until three days ago, when its registration
 *  turned out to have been suspended since mid-August: an invoice AIEC already claimed credit on falls inside that. */
export const seedSupplierGstChecks: SupplierGstCheck[] = [
  { id: 'gsc-1', supplierId: 'sp-1', gstin: '27AABCV1234A1Z5', standing: 'active', lastReturnPeriod: '2026-08', checkedAt: daysAgo(6), checkedByName: 'Prashant Vasant Wable', isDemo: true },
  { id: 'gsc-2', supplierId: 'sp-2', gstin: '27AACFS9012C1Z8', standing: 'active', lastReturnPeriod: '2026-08', checkedAt: daysAgo(12), checkedByName: 'Prashant Vasant Wable', isDemo: true },
  { id: 'gsc-3', supplierId: 'sp-3', gstin: '27AAECK3456D1Z1', standing: 'active', lastReturnPeriod: '2026-06', checkedAt: daysAgo(45), checkedByName: 'Prashant Vasant Wable', isDemo: true },
  {
    id: 'gsc-4',
    supplierId: 'sp-3',
    gstin: '27AAECK3456D1Z1',
    standing: 'suspended',
    lastReturnPeriod: '2026-06',
    effectiveFrom: daysAgo(50).slice(0, 10),
    checkedAt: daysAgo(3),
    checkedByName: 'Prashant Vasant Wable',
    note: 'GST portal shows the registration suspended for non-filing of returns.',
    isDemo: true,
  },
];

/* ------------------------------------------ Supplier disputes (117) */

/** Vertex contests the ₹6,000 credit on its cabin balance; Konark, whose retention is paused, says it will stop taking orders;
 *  Sanghvi's freight dispute was settled a month ago in part, and showed the invoice screen did not ask for the freight line. */
export const seedSupplierDisputes: SupplierDispute[] = [
  {
    id: 'sd-1',
    code: 'AIEC-SD-6001',
    supplierId: 'sp-1',
    poId: 'spo-h2',
    kind: 'amount',
    paymentId: 'spay-3',
    position: 'The dent on the cabin panel happened on the transporter’s truck after our dispatch, and we have the loading photos. The ₹6,000 credit should not come off our balance.',
    claimedAmount: 6_000,
    threatensHalt: false,
    raisedByRole: 'supplier',
    raisedByName: 'Anil Mehta',
    raisedAt: daysAgo(2),
    status: 'open',
    round: 1,
    roundStartedAt: daysAgo(2),
    decisions: [],
    events: [{ id: 'sd-1-e1', kind: 'raised', at: daysAgo(2), byName: 'Anil Mehta' }],
    isDemo: true,
  },
  {
    id: 'sd-2',
    code: 'AIEC-SD-6002',
    supplierId: 'sp-3',
    poId: 'spo-h6',
    kind: 'retention_timing',
    retentionId: 'ret-6',
    position: 'The retention on this order has been held for four weeks without an answer. If it is not released we will have to stop taking AIEC orders until it is.',
    claimedAmount: null,
    threatensHalt: true,
    raisedByRole: 'supplier',
    raisedByName: 'Suresh Konark',
    raisedAt: daysAgo(4),
    status: 'open',
    round: 1,
    roundStartedAt: daysAgo(4),
    decisions: [],
    events: [{ id: 'sd-2-e1', kind: 'raised', at: daysAgo(4), byName: 'Suresh Konark' }],
    isDemo: true,
  },
  {
    id: 'sd-3',
    code: 'AIEC-SD-5990',
    supplierId: 'sp-2',
    poId: 'spo-h4',
    kind: 'amount',
    paymentId: 'spay-8',
    position: 'Freight of ₹3,000 for the cabin was on our invoice but not in the amount paid.',
    claimedAmount: 3_000,
    threatensHalt: false,
    raisedByRole: 'supplier',
    raisedByName: 'Sanghvi Lift Works',
    raisedAt: daysAgo(34),
    status: 'resolved',
    round: 1,
    roundStartedAt: daysAgo(34),
    decisions: [{ id: 'sd-3-d1', decision: 'partial', amount: 1_500, note: 'Half the freight was already in the order price. The other half was missed on the invoice screen.', byName: 'Prashant Vasant Wable', at: daysAgo(30), correction: 'payment_adjustment', correctionRef: 'spadj-2' }],
    events: [
      { id: 'sd-3-e1', kind: 'raised', at: daysAgo(34), byName: 'Sanghvi Lift Works' },
      { id: 'sd-3-e2', kind: 'decided', at: daysAgo(30), byName: 'Prashant Vasant Wable', note: 'Half the freight was already in the order price. The other half was missed on the invoice screen.' },
      { id: 'sd-3-e3', kind: 'process_flagged', at: daysAgo(6), byName: 'Prashant Vasant Wable', note: 'The invoice screen never asks whether freight is billed separately.' },
    ],
    processFlag: { area: 'invoice_matching', note: 'The invoice screen never asks whether freight is billed separately.', byName: 'Prashant Vasant Wable', at: daysAgo(6), status: 'open' },
    isDemo: true,
  },
  // Konark's second in three orders, upheld after twelve days: the pattern 119 shows next to the open one that threatens a halt.
  {
    id: 'sd-4',
    code: 'AIEC-SD-5991',
    supplierId: 'sp-3',
    poId: 'spo-h6',
    kind: 'amount',
    paymentId: 'spay-12',
    position: 'Packing charges of ₹4,000 were on our delivery note but not in the amount paid.',
    claimedAmount: 4_000,
    threatensHalt: false,
    raisedByRole: 'supplier',
    raisedByName: 'Suresh Konark',
    raisedAt: daysAgo(27),
    status: 'resolved',
    round: 1,
    roundStartedAt: daysAgo(27),
    decisions: [{ id: 'sd-4-d1', decision: 'uphold', amount: 0, note: 'Packing is included in the agreed unit price on the order, as the agreement says.', byName: 'Prashant Vasant Wable', at: daysAgo(15), correction: 'none', correctionRef: null }],
    events: [
      { id: 'sd-4-e1', kind: 'raised', at: daysAgo(27), byName: 'Suresh Konark' },
      { id: 'sd-4-e2', kind: 'decided', at: daysAgo(15), byName: 'Prashant Vasant Wable', note: 'Packing is included in the agreed unit price on the order, as the agreement says.' },
    ],
    isDemo: true,
  },
];

/** Vertex's cabin balance (AIEC-SP-3003) was later corrected: a damaged panel was credited (108) after it had been paid. */
export const seedSupplierPaymentAdjustments: SupplierPaymentAdjustment[] = [
  { id: 'spadj-2', paymentId: 'spay-8', direction: 'top_up', amount: 1_500, reason: 'Dispute AIEC-SD-5990 settled in part: half the freight was missed on the invoice screen.', byName: 'Prashant Vasant Wable', at: daysAgo(30), isDemo: true },
  { id: 'spadj-1', paymentId: 'spay-3', direction: 'credit', amount: 6_000, reason: 'Credit note VEC/CN/0091 for one dented cabin panel found after the balance was paid.', byName: 'Prashant Vasant Wable', at: daysAgo(4), isDemo: true },
];

/* ------------------------------------------ Supplier invoices (113) */

const histInvoice = (n: number, poId: string, supplierId: string, numberPrefix: string, lines: [lineItemId: string, description: string, price: number][], daysBack: number): SupplierInvoice => ({
  id: `sinv-${n}`,
  code: `AIEC-SI-${2000 + n}`,
  poId,
  supplierId,
  invoiceNumber: `${numberPrefix}/${1000 + n}`,
  invoiceDate: new Date(NOW - daysBack * DAY).toISOString().slice(0, 10),
  gstPercent: 18,
  documentName: `invoice-${numberPrefix.toLowerCase()}-${1000 + n}.pdf`,
  lines: lines.map(([lineItemId, description, unitPrice]) => ({ lineItemId, description, quantity: 1, unitPrice })),
  submittedAt: daysAgo(daysBack),
  submittedByName: 'Supplier',
  submittedByRole: 'supplier',
  status: 'open',
  events: [{ id: `sinv-${n}-e1`, kind: 'submitted', at: daysAgo(daysBack), byName: 'Supplier' }],
  isDemo: true,
});

/** The six finished orders were invoiced and matched long ago. Vertex's invoice for the live controller order
 *  arrived early and at a price ₹2,500 above the order, which an approved price change (cpc-6) explains. */
export const seedSupplierInvoices: SupplierInvoice[] = [
  histInvoice(1, 'spo-h1', 'sp-1', 'VEC', [['spo-h1-l1', 'Geared/gearless traction machine unit', 198_000], ['spo-h1-l2', 'Microprocessor lift controller', 90_000]], 55),
  histInvoice(2, 'spo-h2', 'sp-1', 'VEC', [['spo-h2-l1', 'Passenger cabin, standard finish', 160_000]], 22),
  histInvoice(3, 'spo-h3', 'sp-2', 'SLW', [['spo-h3-l1', 'T-section guide rail set', 37_000], ['spo-h3-l2', 'Steel suspension ropes, per set', 18_500]], 78),
  histInvoice(4, 'spo-h4', 'sp-2', 'SLW', [['spo-h4-l1', 'Passenger cabin, standard finish', 160_000]], 44),
  histInvoice(5, 'spo-h5', 'sp-3', 'KDC', [['spo-h5-l1', 'Variable frequency drive', 40_000]], 47),
  histInvoice(6, 'spo-h6', 'sp-3', 'KDC', [['spo-h6-l1', 'Microprocessor lift controller', 88_000]], 26),
  {
    ...histInvoice(7, 'spo-203', 'sp-1', 'VEC', [['spo-203-l1', 'Microprocessor lift controller', 97_500]], 2),
    invoiceNumber: 'VEC/26-27/0412',
    documentName: 'vec-0412-controller.pdf',
    submittedByName: 'Anil Mehta',
    events: [{ id: 'sinv-7-e1', kind: 'submitted', at: daysAgo(2), byName: 'Anil Mehta' }],
  },
];

/* ------------------------------------------ Supplier payment terms (100) */

/** How each supplier got to the terms they're on — with the score that justified it. */
export const seedSupplierTermsHistory: SupplierTermsChange[] = [
  {
    id: 'stc-1', supplierId: 'sp-2', kind: 'tier', fromTier: 'new', toTier: 'standard', scoreAtChange: 0.78, ratedOrdersAtChange: 6,
    reason: 'Six clean orders; advance no longer needed. Moved to milestone terms.', by: 'Prashant Vasant Wable', at: daysAgo(300), isDemo: true,
  },
  {
    id: 'stc-2', supplierId: 'sp-4', kind: 'override_set', settings: { termType: 'advance', upfrontPct: 40, retentionPct: 5 }, scoreAtChange: 0.71, ratedOrdersAtChange: 4,
    reason: 'Deccan buys steel from the mill against each order. 40% up front covers that purchase, agreed with them in March 2026.', by: 'Prashant Vasant Wable', at: daysAgo(190), isDemo: true,
  },
  {
    id: 'stc-3', supplierId: 'sp-1', kind: 'tier', fromTier: 'standard', toTier: 'trusted', scoreAtChange: 0.86, ratedOrdersAtChange: 11,
    reason: 'Eleven orders at 0.86 with no quality issues. Graduated to net terms.', by: 'Prashant Vasant Wable', at: daysAgo(150), isDemo: true,
  },
];

const retention = (
  id: string, poId: string, supplierId: string, dealId: string, total: number, heldDaysAgo: number, status: SupplierRetention['status'], extra: Partial<SupplierRetention> = {},
): SupplierRetention => ({ id, poId, supplierId, dealId, pct: 5, amount: Math.round(total * 0.05), heldAt: daysAgo(heldDaysAgo), status, isDemo: true, ...extra });

/** Two released at handover, two still waiting for their site's handover,
 *  and Konark's paused: a supplier defect surfaced at commissioning. */
export const seedSupplierRetentions: SupplierRetention[] = [
  retention('ret-1', 'spo-h1', 'sp-1', 'dl-h1', 288_000, 99, 'released', { decidedAt: daysAgo(40), decidedBy: 'system', decisionReason: 'handover' }),
  retention('ret-2', 'spo-h3', 'sp-2', 'dl-h1', 55_500, 81, 'released', { decidedAt: daysAgo(40), decidedBy: 'system', decisionReason: 'handover' }),
  retention('ret-3', 'spo-h2', 'sp-1', 'dl-h2', 160_000, 58, 'held'),
  retention('ret-4', 'spo-h4', 'sp-2', 'dl-h2', 160_000, 44, 'held'),
  retention('ret-5', 'spo-h5', 'sp-3', 'dl-h3', 40_000, 63, 'released', { decidedAt: daysAgo(20), decidedBy: 'system', decisionReason: 'handover' }),
  retention('ret-6', 'spo-h6', 'sp-3', 'dl-h3', 88_000, 28, 'paused', { pausedAt: daysAgo(1) }),
];

/* ------------------------------------ Supplier communication threads (099) */

const hoursAgoIso = (n: number) => new Date(Date.now() - n * 3_600_000).toISOString();

/** One thread per real situation: Vertex hasn't answered a dispatch question
 *  for over a day (flagged), Vertex has asked AIEC something in their general
 *  thread, Sanghvi (no portal login) is handled by logged calls and emails —
 *  including an admission worth putting on their record — and Deccan's
 *  thread is a settled exchange. */
export const seedSupplierThreads: SupplierThread[] = [
  { id: 'sth-1', supplierId: 'sp-1', relatedPoId: 'spo-202', createdAt: hoursAgoIso(98), isDemo: true },
  { id: 'sth-2', supplierId: 'sp-1', createdAt: hoursAgoIso(3), isDemo: true },
  { id: 'sth-3', supplierId: 'sp-2', relatedPoId: 'spo-201', createdAt: hoursAgoIso(50), isDemo: true },
  { id: 'sth-4', supplierId: 'sp-4', createdAt: hoursAgoIso(146), isDemo: true },
];

export const seedSupplierMessages: SupplierMessage[] = [
  {
    id: 'smsg-1', threadId: 'sth-1', author: 'aiec', authorName: 'Prashant Vasant Wable', authorUserId: 'u-admin-1', channel: 'in_app', expectsReply: true,
    at: hoursAgoIso(98), readAt: hoursAgoIso(97), poRef: 'spo-202',
    body: 'This order is now with you. Can the traction machine and the controller travel as one consignment? The site has a single unloading slot.', isDemo: true,
  },
  {
    id: 'smsg-2', threadId: 'sth-1', author: 'supplier', authorName: 'Anil Mehta', authorUserId: 'u-sup-1', channel: 'in_app', expectsReply: false,
    at: hoursAgoIso(95), readAt: hoursAgoIso(94),
    body: 'Yes, one consignment. The controller is ahead of schedule, so it will wait for the machine.', isDemo: true,
  },
  {
    id: 'smsg-3', threadId: 'sth-1', author: 'aiec', authorName: 'Prashant Vasant Wable', authorUserId: 'u-admin-1', channel: 'in_app', expectsReply: true,
    at: hoursAgoIso(30), readAt: hoursAgoIso(21), poRef: 'spo-202',
    body: 'The door operator shows ready to ship but the machine is still in production. What is the dispatch date for the full consignment?', isDemo: true,
  },
  {
    id: 'smsg-4', threadId: 'sth-2', author: 'supplier', authorName: 'Anil Mehta', authorUserId: 'u-sup-1', channel: 'in_app', expectsReply: true,
    at: hoursAgoIso(3),
    body: 'For future Pune deliveries, could we have one site contact per project instead of calling your office each time?', isDemo: true,
  },
  {
    id: 'smsg-5', threadId: 'sth-3', author: 'supplier', authorName: 'Sanghvi Lift Works', channel: 'phone', loggedBy: 'Prashant Vasant Wable', expectsReply: false,
    at: hoursAgoIso(50), readAt: hoursAgoIso(50),
    body: 'Sanghvi called: cabins are painted and the rails dispatch on Monday. They admitted skipping the second primer coat on this batch to hold the date.', isDemo: true,
  },
  {
    id: 'smsg-6', threadId: 'sth-3', author: 'aiec', authorName: 'Prashant Vasant Wable', authorUserId: 'u-admin-1', channel: 'email', loggedBy: 'Prashant Vasant Wable', expectsReply: true,
    at: hoursAgoIso(20), attachmentName: 'primer-spec-request.pdf',
    body: 'Emailed Sanghvi asking for the primer specification and the batch test report before the cabins are dispatched.', isDemo: true,
  },
  {
    id: 'smsg-7', threadId: 'sth-4', author: 'aiec', authorName: 'Prashant Vasant Wable', authorUserId: 'u-admin-1', channel: 'email', loggedBy: 'Prashant Vasant Wable', expectsReply: true,
    at: hoursAgoIso(146), attachmentName: 'skyline-rail-drawings-rev3.pdf',
    body: 'Sent Deccan the revised rail drawings for Skyline Corporate Park.', isDemo: true,
  },
  {
    id: 'smsg-8', threadId: 'sth-4', author: 'supplier', authorName: 'Deccan Structural Steel', channel: 'phone', loggedBy: 'Prashant Vasant Wable', expectsReply: false,
    at: hoursAgoIso(122), readAt: hoursAgoIso(122),
    body: 'Deccan confirmed the revised drawings. No change to price or lead time.', isDemo: true,
  },
];

/* ------------------------------------------ Supplier agreements (098) */

const STANDARD_QUALITY = 'IS 14665 and EN 81-20 compliant components. A type-test certificate and a batch test report ship with every consignment.';

function agreementVersion(
  id: string,
  supplierId: string,
  version: number,
  kind: SupplierAgreementVersion['kind'],
  terms: SupplierAgreementTerms,
  effectiveDaysAgo: number,
  expiresDaysAhead: number,
  extra: Partial<SupplierAgreementVersion> = {},
): SupplierAgreementVersion {
  const recorded = daysAgo(Math.max(effectiveDaysAgo, 0) + 2);
  return {
    id,
    supplierId,
    version,
    kind,
    terms,
    effectiveFrom: effectiveDaysAgo >= 0 ? daysAgo(effectiveDaysAgo) : daysAhead(-effectiveDaysAgo),
    expiresOn: expiresDaysAhead >= 0 ? daysAhead(expiresDaysAhead) : daysAgo(-expiresDaysAhead),
    documentName: `${id}-signed.pdf`,
    warrantyPassThrough: true,
    recordedBy: 'Prashant Vasant Wable',
    recordedAt: recorded,
    acknowledgedBy: 'Supplier',
    acknowledgedAt: recorded,
    isDemo: true,
    ...extra,
  };
}

const VERTEX_V1: SupplierAgreementTerms = { deliverySlaDays: 30, paymentTermsDays: 45, minQualityScore: 4, qualityStandards: STANDARD_QUALITY, warrantyMonths: 18 };
const VERTEX_V2: SupplierAgreementTerms = { ...VERTEX_V1, deliverySlaDays: 28, paymentTermsDays: 30 };

/** One supplier per real situation: Vertex has renegotiated twice (the
 *  latest still awaiting their confirmation), Sanghvi's lapsed with an order
 *  still in flight, Konark's comes up for renewal inside the notice window,
 *  and Deccan — a smaller regional mill — works to a longer SLA and shorter
 *  payment terms than the large suppliers. Rathi, still pending approval,
 *  has none yet. */
export const seedSupplierAgreementVersions: SupplierAgreementVersion[] = [
  agreementVersion('sag-vx-1', 'sp-1', 1, 'initial', VERTEX_V1, 400, 330, { acknowledgedBy: 'Anil Mehta' }),
  agreementVersion('sag-vx-2', 'sp-1', 2, 'amendment', VERTEX_V2, 120, 330, {
    acknowledgedBy: 'Anil Mehta',
    reason: 'Agreed by phone with Anil Mehta: AIEC pays in 30 days instead of 45, and Vertex commits to delivery in 28 days instead of 30.',
  }),
  agreementVersion('sag-vx-3', 'sp-1', 3, 'amendment', { ...VERTEX_V2, warrantyMonths: 24 }, -3, 330, {
    recordedAt: daysAgo(2),
    acknowledgedBy: undefined,
    acknowledgedAt: undefined,
    reason: 'Vertex extended its parts warranty to 24 months for all orders from next week, to match the gearless machines it now supplies.',
  }),
  agreementVersion('sag-sg-1', 'sp-2', 1, 'initial', { deliverySlaDays: 15, paymentTermsDays: 30, minQualityScore: 4, qualityStandards: STANDARD_QUALITY, warrantyMonths: 12 }, 368, -3, { acknowledgedBy: 'Sanghvi Lift Works' }),
  agreementVersion('sag-kd-1', 'sp-3', 1, 'initial', { deliverySlaDays: 21, paymentTermsDays: 30, minQualityScore: 4, qualityStandards: STANDARD_QUALITY, warrantyMonths: 24 }, 345, 20, { acknowledgedBy: 'Konark Drives & Controls' }),
  agreementVersion('sag-dc-1', 'sp-4', 1, 'initial', {
    deliverySlaDays: 35,
    paymentTermsDays: 15,
    minQualityScore: 3.5,
    qualityStandards: 'IS 2062 structural steel with mill test certificates. Rails straight to within 0.5 mm per metre.',
    warrantyMonths: 12,
  }, 200, 165, { acknowledgedBy: 'Deccan Structural Steel' }),
];

/* ------------------------------------------ Manufacturer production (096) */

type SeedStep = [to: ProductionStage, daysAgoAt: number, kind?: ProductionEvent['kind'], reason?: string];

/** A line's production history as (stage reached, when) steps. */
function production(
  lineItemId: string,
  poId: string,
  supplierId: string,
  stages: ProductionStage[],
  startedDaysAgo: number,
  steps: SeedStep[],
  byName: string,
  extra: Partial<ProductionRecord> = {},
): ProductionRecord {
  let current: ProductionStage = stages[0];
  let enteredAt = daysAgo(startedDaysAgo);
  const events: ProductionEvent[] = steps.map(([to, at, kind = 'advanced', reason], i) => {
    const event: ProductionEvent = { id: `pe-${lineItemId}-${i + 1}`, kind, fromStage: current, toStage: to, at: daysAgo(at), byName, byRole: 'supplier', reason };
    current = to;
    enteredAt = daysAgo(at);
    return event;
  });
  return {
    id: `prod-${lineItemId}`,
    poId,
    lineItemId,
    supplierId,
    stages,
    currentStage: current,
    stageEnteredAt: enteredAt,
    startedAt: daysAgo(startedDaysAgo),
    completedAt: current === 'complete' ? enteredAt : undefined,
    evidence: [],
    events,
    isDemo: true,
    ...extra,
  };
}

const FULL: ProductionStage[] = ['raw_material', 'fabrication', 'quality_testing', 'packaging', 'complete'];
const STANDARD: ProductionStage[] = ['raw_material', 'quality_testing', 'packaging', 'complete'];

export const seedProductionRecords: ProductionRecord[] = [
  // History — Vertex usually sources raw material in ~2 days, fabricates in ~9.
  production('spo-h1-l1', 'spo-h1', 'sp-1', FULL, 116, [['fabrication', 114], ['quality_testing', 105], ['packaging', 102], ['complete', 101]], 'Anil Mehta'),
  production('spo-h1-l2', 'spo-h1', 'sp-1', FULL, 116, [['fabrication', 114], ['quality_testing', 106], ['packaging', 103], ['complete', 102]], 'Anil Mehta'),
  production('spo-h2-l1', 'spo-h2', 'sp-1', FULL, 76, [['fabrication', 74], ['quality_testing', 64], ['packaging', 61], ['complete', 60]], 'Anil Mehta'),
  production('spo-h5-l1', 'spo-h5', 'sp-3', STANDARD, 66, [['quality_testing', 64], ['packaging', 63], ['complete', 62]], 'Suresh Konark'),
  production('spo-h6-l1', 'spo-h6', 'sp-3', FULL, 42, [['fabrication', 40], ['quality_testing', 34], ['packaging', 32], ['complete', 31]], 'Suresh Konark'),
  // Live — dl-2's traction machine has sat in raw-material sourcing for 4
  // days against Vertex's usual ~2: a stall the heartbeat raises by itself.
  production('spo-202-l1', 'spo-202', 'sp-1', FULL, 4, [], 'Anil Mehta'),
  // dl-2's controller and AIEC-PO-8203's are one Vertex production batch.
  production('spo-202-l2', 'spo-202', 'sp-1', FULL, 4, [['fabrication', 2]], 'Anil Mehta', { batchId: 'VX-B-0412' }),
  production(
    'spo-203-l1',
    'spo-203',
    'sp-1',
    FULL,
    6,
    [
      ['fabrication', 4],
      ['quality_testing', 3],
      ['fabrication', 2, 'regressed', 'Relay board failed the 48-hour burn-in test — replacing the board and re-testing.'],
    ],
    'Anil Mehta',
    { batchId: 'VX-B-0412' },
  ),
  // Door operator — finished, with its QC evidence on file.
  production('spo-202-l3', 'spo-202', 'sp-1', FULL, 4, [['fabrication', 3.5], ['quality_testing', 2], ['packaging', 1.2], ['complete', 1]], 'Anil Mehta', {
    evidence: [
      { id: 'pev-1', stage: 'quality_testing', fileName: 'door-operator-cycle-test.pdf', kind: 'document', note: '10,000-cycle open/close test passed', uploadedBy: 'Anil Mehta', uploadedAt: daysAgo(1.3) },
      { id: 'pev-2', stage: 'packaging', fileName: 'door-operator-crated.jpg', kind: 'photo', uploadedBy: 'Anil Mehta', uploadedAt: daysAgo(1) },
    ],
  }),
];

export const seedSupplierPurchaseOrders: SupplierPurchaseOrder[] = [
  // dl-6's closure kickoff tried to raise this automatically; sp-5 isn't
  // approved yet, so it failed without blocking the deal's own closure.
  {
    id: 'spo-1',
    code: 'AIEC-PO-9001',
    dealId: 'dl-6',
    supplierId: 'sp-5',
    status: 'failed',
    failureReason: 'Rathi Lift Systems is still pending approval and cannot receive purchase orders yet.',
    triggeredAt: hoursAgo(2),
    isDemo: true,
  },
  ...seedHistoricalPurchaseOrders,
];

/* ------------------------------------------- Objection/concern scripts (M8) */

export const seedObjectionScripts: ObjectionScript[] = [
  // Updated once IS 14665's ARD requirement became standard — version 1 is
  // kept in `versions[]` for screen 078's update-history edge case.
  {
    id: 'objs-1',
    code: 'AIEC-OBJ-001',
    category: 'safety_new_brand',
    responseText:
      "AIEC lifts are manufactured and installed to IS 14665, the same national safety code every established brand in India must follow — being newer to the market doesn't mean a different, lower bar. Every unit ships with the mandatory Automatic Rescue Device and passes third-party safety inspection before handover. Offer to show the inspection certificate and IS 14665 compliance note alongside the quotation.",
    citedStandards: ['IS 14665'],
    status: 'approved',
    versions: [
      {
        version: 1,
        responseText:
          'AIEC lifts are built to the national safety code every established brand must follow — being newer to the market doesn\'t mean a different, lower bar. Offer to show the safety inspection certificate alongside the quotation.',
        editedBy: 'Prashant Vasant Wable',
        editedAt: daysAgo(140),
      },
      {
        version: 2,
        responseText:
          "AIEC lifts are manufactured and installed to IS 14665, the same national safety code every established brand in India must follow — being newer to the market doesn't mean a different, lower bar. Every unit ships with the mandatory Automatic Rescue Device and passes third-party safety inspection before handover. Offer to show the inspection certificate and IS 14665 compliance note alongside the quotation.",
        editedBy: 'Prashant Vasant Wable',
        editedAt: daysAgo(35),
      },
    ],
    updatedAt: daysAgo(35),
    updatedBy: 'Prashant Vasant Wable',
    isDemo: true,
  },
  {
    id: 'objs-2',
    code: 'AIEC-OBJ-002',
    category: 'installation_disruption',
    responseText:
      "Installation is scheduled and sequenced so the lift shaft area is the only zone affected — we don't need to shut down the building or other floors' power. A typical residential installation runs 3-5 working days once the shaft is ready, and our technician shares a day-by-day plan up front so the housing society knows exactly when noise or access will be limited.",
    status: 'approved',
    versions: [
      {
        version: 1,
        responseText:
          "Installation is scheduled and sequenced so the lift shaft area is the only zone affected — we don't need to shut down the building or other floors' power. A typical residential installation runs 3-5 working days once the shaft is ready, and our technician shares a day-by-day plan up front so the housing society knows exactly when noise or access will be limited.",
        editedBy: 'Prashant Vasant Wable',
        editedAt: daysAgo(120),
      },
    ],
    updatedAt: daysAgo(120),
    updatedBy: 'Prashant Vasant Wable',
    isDemo: true,
  },
  {
    id: 'objs-3',
    code: 'AIEC-OBJ-003',
    category: 'timeline_worry',
    responseText:
      "We commit to a written installation timeline before the advance payment is even collected, and the payment schedule itself is staged to match real construction milestones, not one upfront date. If site readiness slips on the builder's side, we flag it immediately rather than letting the customer discover a delay on the day the technician doesn't show up.",
    status: 'approved',
    versions: [
      {
        version: 1,
        responseText:
          "We commit to a written installation timeline before the advance payment is even collected, and the payment schedule itself is staged to match real construction milestones, not one upfront date. If site readiness slips on the builder's side, we flag it immediately rather than letting the customer discover a delay on the day the technician doesn't show up.",
        editedBy: 'Prashant Vasant Wable',
        editedAt: daysAgo(120),
      },
    ],
    updatedAt: daysAgo(120),
    updatedBy: 'Prashant Vasant Wable',
    isDemo: true,
  },
  // Shares its category literal with NegotiationObjectionKey — also drives
  // the bot's Objection Scenario Map (screen 071).
  {
    id: 'objs-4',
    code: 'AIEC-OBJ-004',
    category: 'competitor_comparison',
    responseText:
      "That's a fair question — can you tell me which specific line item their quote is lower on? I don't want to guess-match a number without knowing what's actually being compared. What I can tell you for certain is what AIEC includes that's easy to miss on a lower quote: IS 14665 compliance, a fixed first-year AMC price, and a local Pune-based service team.",
    status: 'approved',
    versions: [
      {
        version: 1,
        responseText:
          "That's a fair question — can you tell me which specific line item their quote is lower on? I don't want to guess-match a number without knowing what's actually being compared. What I can tell you for certain is what AIEC includes that's easy to miss on a lower quote: IS 14665 compliance, a fixed first-year AMC price, and a local Pune-based service team.",
        editedBy: 'Prashant Vasant Wable',
        editedAt: daysAgo(120),
      },
    ],
    updatedAt: daysAgo(120),
    updatedBy: 'Prashant Vasant Wable',
    isDemo: true,
  },
  {
    id: 'objs-5',
    code: 'AIEC-OBJ-005',
    category: 'price_too_high',
    responseText:
      "I hear you — let's look at where the value sits before we talk numbers. Your quote already reflects installation quality and AMC response time that a lower quote often strips out. If budget is genuinely the blocker, I can look at what's possible within our approved range, starting with the smallest adjustment rather than jumping to our lowest number.",
    status: 'approved',
    versions: [
      {
        version: 1,
        responseText:
          "I hear you — let's look at where the value sits before we talk numbers. Your quote already reflects installation quality and AMC response time that a lower quote often strips out. If budget is genuinely the blocker, I can look at what's possible within our approved range, starting with the smallest adjustment rather than jumping to our lowest number.",
        editedBy: 'Prashant Vasant Wable',
        editedAt: daysAgo(120),
      },
    ],
    updatedAt: daysAgo(120),
    updatedBy: 'Prashant Vasant Wable',
    isDemo: true,
  },
  {
    id: 'objs-6',
    code: 'AIEC-OBJ-006',
    category: 'wants_to_delay',
    responseText:
      "Totally understand wanting more time. Your current quote is valid until its expiry date — if you need longer, I can lock today's price for a short, named extension so you're not starting the conversation over from scratch later.",
    status: 'approved',
    versions: [
      {
        version: 1,
        responseText:
          "Totally understand wanting more time. Your current quote is valid until its expiry date — if you need longer, I can lock today's price for a short, named extension so you're not starting the conversation over from scratch later.",
        editedBy: 'Prashant Vasant Wable',
        editedAt: daysAgo(120),
      },
    ],
    updatedAt: daysAgo(120),
    updatedBy: 'Prashant Vasant Wable',
    isDemo: true,
  },
  // A genuinely new pattern a sales user noticed in the Reply Inbox — sits
  // as `suggested` until Admin reviews and approves it, so it isn't lost.
  {
    id: 'objs-7',
    code: 'AIEC-OBJ-007',
    category: 'other',
    responseText:
      'Our AMC does cover monsoon-related water ingress issues in the pit and machine room as standard, provided the building\'s own drainage is functioning — worth confirming that drainage point during the site visit so it is never a surprise later.',
    status: 'suggested',
    sourceNote: 'Seen twice this week in the Customer Reply Inbox — customers asking whether the AMC covers monsoon water ingress in the lift pit.',
    versions: [
      {
        version: 1,
        responseText:
          'Our AMC does cover monsoon-related water ingress issues in the pit and machine room as standard, provided the building\'s own drainage is functioning — worth confirming that drainage point during the site visit so it is never a surprise later.',
        editedBy: 'Meera Kulkarni',
        editedAt: daysAgo(2),
      },
    ],
    updatedAt: daysAgo(2),
    updatedBy: 'Meera Kulkarni',
    isDemo: true,
  },
];

export const seedObjectionScriptUsages: ObjectionScriptUsage[] = [
  // objs-1 (safety_new_brand): 1 of 3 reached "won" — 33%.
  { id: 'oju-1', scriptId: 'objs-1', leadId: 'l-6', usedAt: daysAgo(12), isDemo: true },
  { id: 'oju-2', scriptId: 'objs-1', leadId: 'l-1', usedAt: daysAgo(60), isDemo: true },
  { id: 'oju-3', scriptId: 'objs-1', leadId: 'l-17', usedAt: daysAgo(9), isDemo: true },
  // objs-2 (installation_disruption): early data, 0 of 2 reached "won" yet.
  { id: 'oju-4', scriptId: 'objs-2', leadId: 'l-4', usedAt: daysAgo(15), isDemo: true },
  { id: 'oju-5', scriptId: 'objs-2', leadId: 'l-7', usedAt: daysAgo(8), isDemo: true },
  // objs-3 (timeline_worry): 2 of 3 reached "won" — both in Pune (100%),
  // the one in Pimpri-Chinchwad didn't (0%) — exactly the per-territory
  // variation edge case this screen is meant to surface.
  { id: 'oju-6', scriptId: 'objs-3', leadId: 'l-1', usedAt: daysAgo(58), isDemo: true },
  { id: 'oju-7', scriptId: 'objs-3', leadId: 'l-2', usedAt: daysAgo(40), isDemo: true },
  { id: 'oju-8', scriptId: 'objs-3', leadId: 'l-16', usedAt: daysAgo(10), isDemo: true },
  // objs-4 (competitor_comparison): early data, neither reached "won".
  { id: 'oju-9', scriptId: 'objs-4', leadId: 'l-14', usedAt: daysAgo(30), isDemo: true },
  { id: 'oju-10', scriptId: 'objs-4', leadId: 'l-13', usedAt: daysAgo(35), isDemo: true },
  // objs-5 (price_too_high): early data, 1 of 2 reached "won" — 50%.
  { id: 'oju-11', scriptId: 'objs-5', leadId: 'l-1', usedAt: daysAgo(55), isDemo: true },
  { id: 'oju-12', scriptId: 'objs-5', leadId: 'l-3', usedAt: daysAgo(14), isDemo: true },
  // objs-6 (wants_to_delay) has no usage yet — "not enough data" state.
];

export const seedCompetitors: Competitor[] = [
  {
    id: 'comp-1',
    code: 'AIEC-CMP-001',
    name: 'Meridian Elevators',
    pricePosition: 'premium',
    priceSummary: 'Typically 10-18% above AIEC on a comparable spec, reflecting decades of brand recognition and a large legacy service network.',
    strengths: ['Long operating history and strong name recognition with builders', 'Very wide physical service-centre footprint across the state'],
    differentiationPoints: [
      'AIEC\'s aggregator model keeps overheads — and price — down without cutting installation quality: the same IS 14665 compliance and ARD on every unit.',
      'AIEC\'s automated quotation engine turns a site survey into a firm quote same-day; Meridian\'s branch-approval process typically takes a week.',
      'Every stage of the AIEC installation is visible to the customer in-app, not just on request from a branch office.',
    ],
    internalOnlyFlag: true,
    flaggedForReview: false,
    versions: [
      {
        version: 1,
        priceSummary: 'Typically 12-20% above AIEC on a comparable spec, reflecting decades of brand recognition and a large legacy service network.',
        strengths: ['Long operating history and strong name recognition with builders', 'Very wide physical service-centre footprint across the state'],
        differentiationPoints: [
          'AIEC\'s aggregator model keeps overheads — and price — down without cutting installation quality.',
          'AIEC\'s automated quotation engine turns a site survey into a firm quote same-day.',
        ],
        editedBy: 'Prashant Vasant Wable',
        editedAt: daysAgo(150),
      },
      {
        version: 2,
        priceSummary: 'Typically 10-18% above AIEC on a comparable spec, reflecting decades of brand recognition and a large legacy service network.',
        strengths: ['Long operating history and strong name recognition with builders', 'Very wide physical service-centre footprint across the state'],
        differentiationPoints: [
          'AIEC\'s aggregator model keeps overheads — and price — down without cutting installation quality: the same IS 14665 compliance and ARD on every unit.',
          'AIEC\'s automated quotation engine turns a site survey into a firm quote same-day; Meridian\'s branch-approval process typically takes a week.',
          'Every stage of the AIEC installation is visible to the customer in-app, not just on request from a branch office.',
        ],
        editedBy: 'Prashant Vasant Wable',
        editedAt: daysAgo(20),
      },
    ],
    lastReviewedAt: daysAgo(20),
    lastReviewedBy: 'Prashant Vasant Wable',
    isDemo: true,
  },
  {
    id: 'comp-2',
    code: 'AIEC-CMP-002',
    name: 'Horizon Lift Systems',
    pricePosition: 'comparable',
    priceSummary: 'Pricing lands within a few percent of AIEC on most specs; the real difference shows up in whose projects get priority.',
    strengths: ['Deep, long-standing relationships with a handful of large builders', 'Dedicated account managers for its top-tier developer clients'],
    differentiationPoints: [
      'Horizon\'s sales model prioritises its large-account developers first — mid-size builders and individual housing societies often wait longest in the queue. AIEC treats every lead the same, tracked the same way, regardless of order size.',
      'AIEC sends automated WhatsApp updates at every job stage; Horizon\'s updates are typically a manual call from the project manager, only when there\'s time.',
    ],
    internalOnlyFlag: true,
    flaggedForReview: false,
    versions: [
      {
        version: 1,
        priceSummary: 'Pricing lands within a few percent of AIEC on most specs; the real difference shows up in whose projects get priority.',
        strengths: ['Deep, long-standing relationships with a handful of large builders', 'Dedicated account managers for its top-tier developer clients'],
        differentiationPoints: [
          'Horizon\'s sales model prioritises its large-account developers first — mid-size builders and individual housing societies often wait longest in the queue. AIEC treats every lead the same, tracked the same way, regardless of order size.',
          'AIEC sends automated WhatsApp updates at every job stage; Horizon\'s updates are typically a manual call from the project manager, only when there\'s time.',
        ],
        editedBy: 'Prashant Vasant Wable',
        editedAt: daysAgo(95),
      },
    ],
    lastReviewedAt: daysAgo(95),
    lastReviewedBy: 'Prashant Vasant Wable',
    isDemo: true,
  },
  // Flagged by a surveyor after a recent site visit — the "content might be
  // stale" edge case screen 079 exists to catch without Admin having to
  // notice independently.
  {
    id: 'comp-3',
    code: 'AIEC-CMP-003',
    name: 'Skyline Elevators Co',
    pricePosition: 'budget',
    priceSummary: 'The lowest sticker price in most Pune/PCMC comparisons — often 15-25% under AIEC on the quoted number alone.',
    strengths: ['Lowest headline price in the region', 'Fast initial quote turnaround for a simple residential spec'],
    differentiationPoints: [
      'AIEC\'s quoted price already includes true installation and AMC costs; several customers have reported Skyline addenda appearing after signing for items AIEC includes upfront.',
      'Every AIEC unit ships with the mandatory Automatic Rescue Device and passes third-party safety inspection before handover — worth confirming this is standard, not an add-on, on any budget quote.',
    ],
    internalOnlyFlag: true,
    flaggedForReview: true,
    flagReason: 'Customer at a recent site visit said Skyline has started including the ARD as standard too — worth confirming before we keep using this as a differentiator.',
    flaggedBy: 'Rohit Jadhav',
    flaggedAt: daysAgo(3),
    versions: [
      {
        version: 1,
        priceSummary: 'The lowest sticker price in most Pune/PCMC comparisons — often 15-25% under AIEC on the quoted number alone.',
        strengths: ['Lowest headline price in the region', 'Fast initial quote turnaround for a simple residential spec'],
        differentiationPoints: [
          'AIEC\'s quoted price already includes true installation and AMC costs; several customers have reported Skyline addenda appearing after signing for items AIEC includes upfront.',
          'Every AIEC unit ships with the mandatory Automatic Rescue Device and passes third-party safety inspection before handover — worth confirming this is standard, not an add-on, on any budget quote.',
        ],
        editedBy: 'Prashant Vasant Wable',
        editedAt: daysAgo(60),
      },
    ],
    lastReviewedAt: daysAgo(60),
    lastReviewedBy: 'Prashant Vasant Wable',
    isDemo: true,
  },
  {
    id: 'comp-4',
    code: 'AIEC-CMP-004',
    name: 'Continental Elevator Corp',
    pricePosition: 'premium',
    priceSummary: 'Priced highest in most comparisons, largely on the strength of an imported-components story.',
    strengths: ['Perceived prestige of imported components', 'Strong showroom presence in premium commercial developments'],
    differentiationPoints: [
      'AIEC sources components locally, which typically means a much faster AMC response and spare-parts turnaround than waiting on an imported supply chain.',
      'AIEC\'s components still meet the same IS 14665 code Continental\'s do — the safety bar is the same standard, not a lesser one.',
    ],
    internalOnlyFlag: true,
    flaggedForReview: false,
    versions: [
      {
        version: 1,
        priceSummary: 'Priced highest in most comparisons, largely on the strength of an imported-components story.',
        strengths: ['Perceived prestige of imported components', 'Strong showroom presence in premium commercial developments'],
        differentiationPoints: [
          'AIEC sources components locally, which typically means a much faster AMC response and spare-parts turnaround than waiting on an imported supply chain.',
          'AIEC\'s components still meet the same IS 14665 code Continental\'s do — the safety bar is the same standard, not a lesser one.',
        ],
        editedBy: 'Prashant Vasant Wable',
        editedAt: daysAgo(110),
      },
    ],
    lastReviewedAt: daysAgo(110),
    lastReviewedBy: 'Prashant Vasant Wable',
    isDemo: true,
  },
];

/* ------------------------------------------------------------- Geo-fencing */

export const seedZones: GeoZone[] = [
  { id: 'z-hinjawadi', name: 'Hinjawadi – Wakad', points: [{ lat: 18.615, lng: 73.72 }, { lat: 18.615, lng: 73.78 }, { lat: 18.575, lng: 73.78 }, { lat: 18.575, lng: 73.72 }], assignedUserIds: ['u-srv-1'], leadCount: 6, status: 'active', isDemo: true },
  { id: 'z-kharadi', name: 'Kharadi – Viman Nagar', points: [{ lat: 18.58, lng: 73.9 }, { lat: 18.58, lng: 73.96 }, { lat: 18.54, lng: 73.96 }, { lat: 18.54, lng: 73.9 }], assignedUserIds: ['u-srv-2'], leadCount: 5, status: 'active', isDemo: true },
  { id: 'z-pimpri', name: 'Pimpri – Chinchwad – Ravet', points: [{ lat: 18.67, lng: 73.73 }, { lat: 18.67, lng: 73.82 }, { lat: 18.62, lng: 73.82 }, { lat: 18.62, lng: 73.73 }], assignedUserIds: ['u-srv-3'], leadCount: 4, status: 'active', isDemo: true },
  { id: 'z-kothrud', name: 'Kothrud – Katraj', points: [{ lat: 18.52, lng: 73.79 }, { lat: 18.52, lng: 73.87 }, { lat: 18.45, lng: 73.87 }, { lat: 18.45, lng: 73.79 }], assignedUserIds: ['u-srv-4'], leadCount: 3, status: 'draft', isDemo: true },
];

/* ------------------------------------------------------------- Route plans */

export const seedRoutePlans: RoutePlan[] = [
  {
    id: 'rp-1',
    userId: 'u-srv-1',
    date: new Date(NOW).toISOString().slice(0, 10),
    stops: [
      { id: 'rs-1', leadId: 'l-10', label: 'Vista Enclave', address: 'Wakad Chowk', location: { lat: 18.5975, lng: 73.762 }, windowStart: hoursAhead(1), windowEnd: hoursAhead(2), status: 'done', legKm: 0, legMinutes: 0 },
      { id: 'rs-2', leadId: 'l-6', label: 'Trinity Business Bay', address: 'Baner Road', location: { lat: 18.559, lng: 73.7868 }, windowStart: hoursAhead(3), windowEnd: hoursAhead(4), status: 'arrived', legKm: 5.4, legMinutes: 18 },
      { id: 'rs-3', leadId: 'l-4', label: 'Pinnacle Aurum', address: 'Balewadi High Street', location: { lat: 18.575, lng: 73.769 }, windowStart: hoursAhead(5), windowEnd: hoursAhead(6), status: 'pending', legKm: 3.1, legMinutes: 14 },
      { id: 'rs-4', leadId: 'l-18', label: 'Bloom Apartments', address: 'Pashan Link Road', location: { lat: 18.5385, lng: 73.7845 }, windowStart: hoursAhead(7), windowEnd: hoursAhead(8), status: 'pending', legKm: 6.2, legMinutes: 24 },
      { id: 'rs-5', leadId: 'l-15', label: 'Tech Park Block C', address: 'Phase 3, Hinjawadi', location: { lat: 18.5945, lng: 73.7315 }, windowStart: hoursAhead(9), windowEnd: hoursAhead(10), status: 'pending', legKm: 9.8, legMinutes: 32 },
    ],
    totalKm: 24.5,
    totalMinutes: 88,
    optimizedKm: 18.2,
    optimizedMinutes: 64,
    isDemo: true,
  },
];

/* -------------------------------------------------------------- Commission */

export const seedCommissions: CommissionEntry[] = [
  // A technician's payout for a finished installation (121): Santosh's last job was handed over five days ago and waits for the next run.
  { id: 'c-t1', userId: 'u-tech-1', dealId: 'dl-h2', reasonKey: 'commission.reason.installationCompleted', amount: 14_000, status: 'approved', earnedAt: daysAgo(5), payoutApproval: { status: 'approved', at: daysAgo(3), byName: 'Prashant Vasant Wable', amount: 14_000 }, isDemo: true },
  { id: 'c-t4', userId: 'u-tech-2', dealId: 'dl-h2', reasonKey: 'commission.reason.installationCompleted', amount: 9_500, status: 'approved', earnedAt: daysAgo(9), payoutApproval: { status: 'approved', at: daysAgo(6), byName: 'Prashant Vasant Wable', amount: 9_500 }, disbursement: { id: 'db-1006', status: 'failed', failure: 'account_closed' }, isDemo: true },
  { id: 'c-t2', userId: 'u-tech-1', dealId: 'dl-h1', reasonKey: 'commission.reason.installationCompleted', amount: 11_500, status: 'paid', earnedAt: daysAgo(45), paidAt: daysAgo(38), disbursement: { id: 'db-1003', status: 'completed' }, isDemo: true },
  { id: 'c-t3', userId: 'u-tech-2', dealId: 'dl-1', reasonKey: 'commission.reason.installationCompleted', amount: 9_000, status: 'paid', earnedAt: daysAgo(38), paidAt: daysAgo(31), disbursement: { id: 'db-1004', status: 'completed' }, isDemo: true },
  { id: 'c-1', userId: 'u-srv-1', leadId: 'l-1', dealId: 'dl-1', reasonKey: 'commission.reason.leadConverted', amount: 39_600, status: 'paid', earnedAt: daysAgo(48), paidAt: daysAgo(41), disbursement: { id: 'db-1002', status: 'completed' }, isDemo: true },
  { id: 'c-2', userId: 'u-srv-1', leadId: 'l-1', reasonKey: 'commission.reason.siteVisitVerified', amount: 500, status: 'paid', earnedAt: daysAgo(70), paidAt: daysAgo(63), disbursement: { id: 'db-1001', status: 'completed' }, isDemo: true },
  { id: 'c-3', userId: 'u-srv-2', leadId: 'l-2', dealId: 'dl-2', reasonKey: 'commission.reason.leadConverted', amount: 28_200, status: 'paid', earnedAt: daysAgo(33), paidAt: daysAgo(26), disbursement: { id: 'db-1005', status: 'completed' }, isDemo: true },
  { id: 'c-4', userId: 'u-srv-1', leadId: 'l-15', reasonKey: 'commission.reason.leadQualified', amount: 2_000, status: 'approved', earnedAt: daysAgo(20), payoutApproval: { status: 'held', at: daysAgo(9), byName: 'Prashant Vasant Wable', holdKind: 'information' }, isDemo: true },
  { id: 'c-5', userId: 'u-srv-1', leadId: 'l-4', reasonKey: 'commission.reason.leadQualified', amount: 2_000, status: 'approved', earnedAt: daysAgo(15), isDemo: true },
  { id: 'c-6', userId: 'u-srv-1', leadId: 'l-15', dealId: 'dl-6', reasonKey: 'commission.reason.leadConverted', amount: 126_000, status: 'projected', earnedAt: daysAgo(15), isDemo: true },
  { id: 'c-7', userId: 'u-srv-1', leadId: 'l-6', reasonKey: 'commission.reason.siteVisitVerified', amount: 500, status: 'approved', earnedAt: minutesAgo(41), isDemo: true },
  { id: 'c-8', userId: 'u-srv-1', reasonKey: 'commission.reason.monthlyBonus', amount: 10_000, status: 'approved', earnedAt: daysAgo(12), isDemo: true },
  { id: 'c-9', userId: 'u-srv-2', leadId: 'l-5', reasonKey: 'commission.reason.leadQualified', amount: 2_000, status: 'approved', earnedAt: daysAgo(11), isDemo: true },
  { id: 'c-10', userId: 'u-srv-2', leadId: 'l-17', reasonKey: 'commission.reason.siteVisitVerified', amount: 500, status: 'approved', earnedAt: daysAgo(1), isDemo: true },
  { id: 'c-11', userId: 'u-srv-3', leadId: 'l-3', dealId: 'dl-3', reasonKey: 'commission.reason.leadConverted', amount: 61_800, status: 'projected', earnedAt: daysAgo(18), isDemo: true },
  { id: 'c-12', userId: 'u-srv-3', leadId: 'l-16', reasonKey: 'commission.reason.leadQualified', amount: 2_000, status: 'approved', earnedAt: daysAgo(5), isDemo: true },
  { id: 'c-13', userId: 'u-srv-4', leadId: 'l-13', reasonKey: 'commission.reason.leadConverted', amount: 23_100, status: 'forfeited', earnedAt: daysAgo(32), reversal: { at: daysAgo(18), reason: 'The deal fell through after the stage was recorded, so the amount was taken back.', wasPaid: false }, isDemo: true },
  { id: 'c-14', userId: 'u-srv-4', leadId: 'l-9', reasonKey: 'commission.reason.leadQualified', amount: 2_000, status: 'projected', earnedAt: daysAgo(6), isDemo: true },
];

/* ------------------------------------------------------------- Time series */

function buildSeries(days: number, base: number, variance: number, seed: number): SeriesPoint[] {
  const rand = makeRandom(seed);
  return Array.from({ length: days }, (_, i) => {
    const drift = (i / days) * base * 0.35;
    const noise = (rand() - 0.5) * variance;
    // Sundays run quiet on a construction-site business.
    const date = new Date(NOW - (days - 1 - i) * DAY);
    const weekendDip = date.getDay() === 0 ? 0.45 : 1;
    return {
      t: date.toISOString().slice(0, 10),
      v: Math.max(0, Math.round((base + drift + noise) * weekendDip)),
    };
  });
}

export const seedSeries = {
  leadsPerDay: buildSeries(30, 4, 4, 11),
  revenuePerDay: buildSeries(30, 320_000, 260_000, 23),
  quotesPerDay: buildSeries(30, 3, 3, 31),
  conversionsPerDay: buildSeries(30, 1, 2, 47),
  siteVisitsPerDay: buildSeries(30, 5, 4, 53),
};

/* ------------------------------------------------------------- Automations */

export const seedAutomations: AutomationRule[] = [
  { id: 'a-1', name: 'Welcome WhatsApp on lead capture', triggerKey: 'automation.trigger.leadCaptured', actionKey: 'automation.action.sendWhatsapp', enabled: true, runsToday: 12, failuresToday: 0, lastRunAt: minutesAgo(9), avgLatencyMs: 840, status: 'healthy', isDemo: true },
  { id: 'a-2', name: 'Auto-quote on spec complete', triggerKey: 'automation.trigger.specCompleted', actionKey: 'automation.action.generateQuote', enabled: true, runsToday: 5, failuresToday: 0, lastRunAt: hoursAgo(2), avgLatencyMs: 2_240, status: 'healthy', isDemo: true },
  { id: 'a-3', name: 'Payment reminder at T-3 days', triggerKey: 'automation.trigger.paymentDueSoon', actionKey: 'automation.action.sendSms', enabled: true, runsToday: 8, failuresToday: 2, lastRunAt: hoursAgo(1), avgLatencyMs: 1_120, status: 'degraded', isDemo: true },
  { id: 'a-4', name: 'Assign technician on deal won', triggerKey: 'automation.trigger.dealWon', actionKey: 'automation.action.assignTechnician', enabled: true, runsToday: 1, failuresToday: 0, lastRunAt: hoursAgo(20), avgLatencyMs: 430, status: 'healthy', isDemo: true },
  { id: 'a-5', name: 'Escalate SLA breach to admin', triggerKey: 'automation.trigger.slaBreached', actionKey: 'automation.action.raiseAlert', enabled: true, runsToday: 3, failuresToday: 0, lastRunAt: hoursAgo(4), avgLatencyMs: 310, status: 'healthy', isDemo: true },
  { id: 'a-6', name: 'Supplier PO on material stage', triggerKey: 'automation.trigger.materialStage', actionKey: 'automation.action.raisePurchaseOrder', enabled: false, runsToday: 0, failuresToday: 0, lastRunAt: daysAgo(3), avgLatencyMs: 0, status: 'paused', isDemo: true },
  { id: 'a-7', name: 'Duplicate lead check on capture', triggerKey: 'automation.trigger.leadCaptured', actionKey: 'automation.action.checkDuplicate', enabled: true, runsToday: 12, failuresToday: 0, lastRunAt: minutesAgo(4), avgLatencyMs: 190, status: 'healthy', isDemo: true },
  { id: 'a-8', name: 'Nightly commission accrual', triggerKey: 'automation.trigger.nightly', actionKey: 'automation.action.accrueCommission', enabled: true, runsToday: 1, failuresToday: 1, lastRunAt: hoursAgo(11), avgLatencyMs: 9_600, status: 'failing', isDemo: true },
  { id: 'a-9', name: 'Supplier PO on deal closure', triggerKey: 'automation.trigger.dealWon', actionKey: 'automation.action.raisePurchaseOrder', enabled: true, runsToday: 1, failuresToday: 1, lastRunAt: hoursAgo(2), avgLatencyMs: 640, status: 'degraded', isDemo: true },
];

/* ------------------------------------------------------------------ Alerts */

export const seedAlerts: Alert[] = [
  { id: 'al-1', code: 'ALT-9001', titleKey: 'alerts.type.safetyStepBlocked', context: 'AIEC-J-3106 · Kulkarni Signature — Basement · load test blocked, no evidence attached', severity: 'critical', category: 'safety', status: 'open', raisedAt: hoursAgo(2), relatedId: 'j-6', location: { lat: 18.5509, lng: 73.9462 }, isDemo: true },
  { id: 'al-2', code: 'ALT-9002', titleKey: 'alerts.type.paymentOverdue', context: 'AIEC-P-4103 · ₹7,92,000 · 10 days past due', severity: 'high', category: 'payment', status: 'open', raisedAt: daysAgo(1), relatedId: 'p-3', isDemo: true },
  { id: 'al-3', code: 'ALT-9003', titleKey: 'alerts.type.automationFailing', context: 'Nightly commission accrual failed on last run', severity: 'high', category: 'automation', status: 'acknowledged', raisedAt: hoursAgo(11), acknowledgedBy: 'u-admin-1', relatedId: 'a-8', isDemo: true },
  { id: 'al-4', code: 'ALT-9004', titleKey: 'alerts.type.leadStalled', context: 'AIEC-L-0109 · Nirman Elite · 6 days at Contacted, SLA is 3', severity: 'medium', category: 'sla_breach', status: 'open', raisedAt: hoursAgo(6), relatedId: 'l-9', isDemo: true },
  { id: 'al-5', code: 'ALT-9005', titleKey: 'alerts.type.supplierLate', context: 'Deccan Structural Steel · on-time rate fell to 72%', severity: 'medium', category: 'supplier', status: 'open', raisedAt: daysAgo(2), relatedId: 'sp-4', isDemo: true },
  { id: 'al-6', code: 'ALT-9006', titleKey: 'alerts.type.gpsMismatch', context: 'AIEC-L-0119 · site photo GPS 340 m from recorded site', severity: 'medium', category: 'quality', status: 'open', raisedAt: minutesAgo(4), relatedId: 'l-dup-1', location: { lat: 18.5978, lng: 73.7624 }, isDemo: true },
  { id: 'al-7', code: 'ALT-9007', titleKey: 'alerts.type.technicianIdle', context: 'Ajay Nikam · no check-in for 9 hours during a scheduled job', severity: 'low', category: 'staffing', status: 'open', raisedAt: hoursAgo(9), relatedId: 'u-tech-3', isDemo: true },
  { id: 'al-8', code: 'ALT-9008', titleKey: 'alerts.type.qcFailed', context: 'AIEC-J-3102 · door operator alignment out of tolerance', severity: 'high', category: 'quality', status: 'resolved', raisedAt: daysAgo(3), acknowledgedBy: 'u-admin-1', relatedId: 'j-2', isDemo: true },
  { id: 'al-9', code: 'ALT-9009', titleKey: 'alerts.type.counterOfferAging', context: 'AIEC-D-2103 · Skyline Corporate Park · counter-offer waiting 9h with no Admin decision yet', severity: 'medium', category: 'sla_breach', status: 'open', raisedAt: hoursAgo(9), relatedId: 'co-3', isDemo: true },
  { id: 'al-10', code: 'ALT-9010', titleKey: 'alerts.type.automationFailing', context: 'AIEC-D-2106 · Tech Park Block C · supplier PO failed — Rathi Lift Systems is still pending approval', severity: 'medium', category: 'automation', status: 'open', raisedAt: hoursAgo(2), relatedId: 'a-9', isDemo: true },
];

/* ---------------------------------------------------------- Activity feed */

export const seedActivity: ActivityEvent[] = [
  { id: 'ev-1', kind: 'lead_captured', actorName: 'Sunita Deshmukh', actorRole: 'surveyor', subject: 'Anand Residency', detail: 'ITI Road, Aundh', at: minutesAgo(2), severity: 'info', location: { lat: 18.559, lng: 73.8077 }, isDemo: true },
  { id: 'ev-2', kind: 'alert_raised', actorName: 'Automation', actorRole: 'admin', subject: 'GPS mismatch on AIEC-L-0119', at: minutesAgo(4), severity: 'warning', isDemo: true },
  { id: 'ev-3', kind: 'automation_ran', actorName: 'Automation', actorRole: 'admin', subject: 'Welcome WhatsApp sent', detail: 'AIEC-L-0112', at: minutesAgo(9), severity: 'success', isDemo: true },
  { id: 'ev-4', kind: 'job_step_completed', actorName: 'Santosh Kale', actorRole: 'technician', subject: 'Wiring & control panel', detail: 'AIEC-J-3101', at: minutesAgo(26), severity: 'success', location: { lat: 18.5913, lng: 73.7389 }, isDemo: true },
  { id: 'ev-5', kind: 'surveyor_checked_in', actorName: 'Ganesh Pawar', actorRole: 'surveyor', subject: 'Trinity Business Bay', at: minutesAgo(41), severity: 'info', location: { lat: 18.559, lng: 73.7868 }, isDemo: true },
  { id: 'ev-6', kind: 'quote_sent', actorName: 'Automation', actorRole: 'admin', subject: 'AIEC-D-2107 quoted', amount: 3_700_000, at: hoursAgo(2), severity: 'info', isDemo: true },
  { id: 'ev-7', kind: 'payment_received', actorName: 'Kulkarni Constructions', actorRole: 'customer', subject: 'Material stage payment', amount: 658_000, at: hoursAgo(5), severity: 'success', isDemo: true },
  { id: 'ev-8', kind: 'lead_stage_changed', actorName: 'Imran Shaikh', actorRole: 'surveyor', subject: 'Skyline Corporate Park → Negotiation', at: hoursAgo(7), severity: 'info', isDemo: true },
  { id: 'ev-9', kind: 'technician_checked_in', actorName: 'Vishal More', actorRole: 'technician', subject: 'Kulkarni Signature', at: hoursAgo(8), severity: 'info', location: { lat: 18.5515, lng: 73.947 }, isDemo: true },
  { id: 'ev-10', kind: 'qc_failed', actorName: 'Quality bot', actorRole: 'admin', subject: 'Door operator alignment', detail: 'AIEC-J-3102', at: daysAgo(3), severity: 'error', isDemo: true },
  { id: 'ev-11', kind: 'deal_won', actorName: 'Prashant Vasant Wable', actorRole: 'admin', subject: 'Kulkarni Signature', amount: 1_880_000, at: daysAgo(33), severity: 'success', isDemo: true },
  { id: 'ev-12', kind: 'deal_lost', actorName: 'Rohit Jadhav', actorRole: 'surveyor', subject: 'Katraj Crown', detail: 'Lost on price', at: daysAgo(18), severity: 'warning', isDemo: true },
];

/* ------------------------------------------------------ Site verifications */

export const seedSiteVisits: SiteVisitVerification[] = [
  { id: 'sv-1', leadId: 'l-dup-1', surveyorId: 'u-srv-4', surveyorName: 'Rohit Jadhav', siteName: 'Vista Enclave', checkInAt: minutesAgo(6), gpsDriftMetres: 340, photoCount: 2, photoTimestampsValid: false, dwellMinutes: 4, status: 'flagged', flagReason: 'gps_drift', location: { lat: 18.5978, lng: 73.7624 }, isDemo: true },
  { id: 'sv-2', leadId: 'l-6', surveyorId: 'u-srv-1', surveyorName: 'Ganesh Pawar', siteName: 'Trinity Business Bay', checkInAt: minutesAgo(41), gpsDriftMetres: 12, photoCount: 6, photoTimestampsValid: true, dwellMinutes: 34, status: 'verified', location: { lat: 18.559, lng: 73.7868 }, isDemo: true },
  { id: 'sv-3', leadId: 'l-7', surveyorId: 'u-srv-3', surveyorName: 'Imran Shaikh', siteName: 'Ravet Sky Towers', checkInAt: hoursAgo(20), gpsDriftMetres: 28, photoCount: 5, photoTimestampsValid: true, dwellMinutes: 27, status: 'pending', location: { lat: 18.65, lng: 73.745 }, isDemo: true },
  { id: 'sv-4', leadId: 'l-17', surveyorId: 'u-srv-2', surveyorName: 'Sunita Deshmukh', siteName: 'Luxe Boutique Hotel', checkInAt: daysAgo(1), gpsDriftMetres: 9, photoCount: 8, photoTimestampsValid: true, dwellMinutes: 52, status: 'verified', location: { lat: 18.5362, lng: 73.8939 }, isDemo: true },
  { id: 'sv-5', leadId: 'l-9', surveyorId: 'u-srv-4', surveyorName: 'Rohit Jadhav', siteName: 'Nirman Elite', checkInAt: daysAgo(2), gpsDriftMetres: 780, photoCount: 1, photoTimestampsValid: false, dwellMinutes: 2, status: 'rejected', flagReason: 'insufficient_evidence', location: { lat: 18.5074, lng: 73.8077 }, isDemo: true },
];

/* ---------------------------------------------------- CRM: lead timeline */

function nameOf(userId: string): string {
  return seedUsers.find((u) => u.id === userId)?.name ?? 'AIEC';
}

let timelineCounter = 0;
const nextTimelineId = () => `lt-${(timelineCounter += 1)}`;

/** Reconstructed from each seeded lead's own fields, so it can never drift out
 *  of sync with the lead record it describes — capture, an optional mid-life
 *  reassignment, the move into its current stage, and a loss reason if lost. */
export const seedLeadTimeline: LeadTimelineEvent[] = seedLeads.flatMap((lead) => {
  const events: LeadTimelineEvent[] = [
    {
      id: nextTimelineId(),
      leadId: lead.id,
      kind: 'captured',
      actorName: nameOf(lead.originalSurveyorId),
      at: lead.createdAt,
      detail: lead.siteName,
    },
  ];

  if (lead.originalSurveyorId !== lead.surveyorId) {
    events.push({
      id: nextTimelineId(),
      leadId: lead.id,
      kind: 'reassigned',
      actorName: 'Prashant Vasant Wable',
      at: daysAgo(4),
      detail: 'Territory rebalance',
      fromValue: nameOf(lead.originalSurveyorId),
      toValue: nameOf(lead.surveyorId),
    });
  }

  if (lead.stage !== 'captured') {
    events.push({
      id: nextTimelineId(),
      leadId: lead.id,
      kind: 'stage_changed',
      actorName: nameOf(lead.surveyorId),
      at: lead.stageEnteredAt,
      // Raw stage key, matching how a real runtime stage-change event is
      // logged (memoryRepository.updateLead) — the View translates it via
      // `stage.<value>`, so a display label stored here would fail to resolve.
      toValue: lead.stage,
    });
  }

  if (lead.stage === 'lost' && lead.lostReason) {
    events.push({
      id: nextTimelineId(),
      leadId: lead.id,
      kind: 'marked_lost',
      actorName: 'Prashant Vasant Wable',
      at: lead.updatedAt,
      detail: lead.lostReason,
    });
  }

  return events.sort((a, b) => a.at.localeCompare(b.at));
});

/** What surveyors and sales wrote about the sites of the three won deals, dated, because a note about site access can be true in
 *  March and false by June. The 58-day-old gate note has been overtaken by the 9-day-old one (122 shows both, with their ages). */
const siteNote = (n: number, leadId: string, byUserId: string, daysBack: number, detail: string, topic: NonNullable<LeadTimelineEvent['topic']>): LeadTimelineEvent => ({
  id: `tl-site-${n}`,
  leadId,
  kind: 'note_added',
  actorName: nameOf(byUserId),
  at: daysAgo(daysBack),
  detail,
  topic,
});

export const seedSiteNotes: LeadTimelineEvent[] = [
  siteNote(1, 'l-1', 'u-srv-1', 58, 'Only the rear gate on the Phase 2 lane is open for material vehicles. The front gate is blocked by the boundary wall work.', 'access'),
  siteNote(2, 'l-1', 'u-srv-1', 40, 'Site contact for the lift shaft is Mr. Patil, the supervisor. Rajesh Sir prefers WhatsApp in Marathi.', 'contact'),
  siteNote(3, 'l-1', 'u-srv-1', 30, 'The level 3 shaft has an open edge. Put the barricade back every time before leaving.', 'safety'),
  siteNote(4, 'l-1', 'u-srv-1', 9, 'The boundary wall work is finished and the front gate is open again. Security wants a vehicle pass one day ahead.', 'access'),
  siteNote(5, 'l-2', 'u-srv-2', 33, 'Basement ramp is narrow: parts longer than 2.2 m must come in through the loading bay on the east side.', 'access'),
  siteNote(6, 'l-2', 'u-srv-2', 20, 'Meera Madam is on site only after 11 am. Call before arriving.', 'contact'),
  siteNote(7, 'l-15', 'u-srv-1', 12, 'Tech Park allows heavy deliveries only between 6 am and 9 am. Site pass in the name of the technician.', 'access'),
];

/* ---------------------------------------------------- CRM: follow-up tasks */

export const seedFollowUpTasks: FollowUpTask[] = [
  { id: 'ft-1', leadId: 'l-9', title: 'No contact in 5 days — schedule a follow-up call', dueDate: daysAgo(2), assignedTo: 'u-srv-4', status: 'open', source: 'auto', createdAt: daysAgo(3), isDemo: true },
  { id: 'ft-2', leadId: 'l-8', title: 'Call back after site visit reschedule', dueDate: daysAgo(1), assignedTo: 'u-srv-2', status: 'open', source: 'manual', createdAt: daysAgo(4), isDemo: true },
  { id: 'ft-3', leadId: 'l-5', title: 'Confirm quote received and answer pricing questions', dueDate: hoursAhead(4), assignedTo: 'u-srv-2', status: 'open', source: 'auto', createdAt: daysAgo(1), isDemo: true },
  { id: 'ft-4', leadId: 'l-16', title: 'Follow up on Civic Health Centre quote', dueDate: daysAhead(1), assignedTo: 'u-srv-3', status: 'open', source: 'auto', createdAt: daysAgo(1), isDemo: true },
  { id: 'ft-5', leadId: 'l-18', title: 'Reconfirm site visit window', dueDate: daysAhead(2), assignedTo: 'u-srv-1', status: 'open', source: 'manual', createdAt: hoursAgo(10), isDemo: true },
  { id: 'ft-6', leadId: 'l-3', title: 'Negotiation round 4 — share revised terms', dueDate: daysAhead(1), assignedTo: 'u-srv-3', status: 'open', source: 'manual', createdAt: hoursAgo(20), isDemo: true },
  { id: 'ft-7', leadId: 'l-3', title: 'Nudge customer — deal terms awaiting confirmation for 5 days', dueDate: daysAgo(0), assignedTo: 'u-admin-1', status: 'open', source: 'auto', createdAt: daysAgo(2), isDemo: true },
  { id: 'ft-11', leadId: 'l-1', title: 'Post-handover courtesy check-in', dueDate: daysAgo(20), assignedTo: 'u-srv-1', status: 'done', source: 'manual', createdAt: daysAgo(25), completedAt: daysAgo(19), isDemo: true },
  { id: 'ft-8', leadId: 'l-14', title: 'No contact in 5 days — schedule a follow-up call', dueDate: daysAgo(30), assignedTo: 'u-srv-2', status: 'cancelled', source: 'auto', createdAt: daysAgo(31), rescheduleReasonKey: 'followUp.reason.leadClosed', isDemo: true },
  { id: 'ft-9', leadId: 'l-7', title: 'Share revised timeline after client asked for delay', dueDate: daysAgo(3), assignedTo: 'u-srv-3', status: 'open', source: 'manual', createdAt: daysAgo(6), rescheduleReasonKey: 'followUp.reason.customerNotReachable', isDemo: true },
  { id: 'ft-10', leadId: 'l-15', title: 'Send updated commercial terms for Tech Park Block C', dueDate: hoursAhead(30), assignedTo: 'u-srv-1', status: 'open', source: 'auto', createdAt: daysAgo(2), isDemo: true },
];

/* -------------------------------------------------------- CRM: duplicates */

export const seedDuplicatePairs: DuplicatePair[] = [
  { id: 'dp-1', primaryLeadId: 'l-10', secondaryLeadId: 'l-dup-1', status: 'pending', detectedAt: minutesAgo(4), commissionImpactSummary: 'Ganesh Pawar keeps the capture bonus; Rohit Jadhav’s duplicate entry earns nothing if merged.', isDemo: true },
  { id: 'dp-2', primaryLeadId: 'l-8', secondaryLeadId: 'l-9', status: 'not_duplicate', detectedAt: daysAgo(7), resolvedAt: daysAgo(7), resolvedBy: 'Prashant Vasant Wable', isDemo: true },
];

/* ------------------------------------------------------------ CRM: scoring */

export const seedScoreWeightingProfile: ScoreWeightingProfile = {
  buildingSize: 0.3,
  constructionReadiness: 0.3,
  responsiveness: 0.25,
  territoryHistory: 0.15,
  updatedAt: daysAgo(60),
};

/* ------------------------------------------------------- CRM: bulk import */

export const seedImportBatches: LeadImportBatch[] = [
  {
    id: 'ib-1',
    fileName: 'legacy_leads_2025.xlsx',
    importedBy: 'Prashant Vasant Wable',
    importedAt: daysAgo(180),
    totalRows: 42,
    importedRows: 39,
    rejectedRows: 3,
    isDemo: true,
  },
];

/* ============================================ Communication engine (M6) */

interface TemplateSeed {
  groupId: string;
  name: string;
  channel: CommChannel;
  associatedStage: Lead['stage'] | 'any';
  mergeFields: string[];
  body: Record<Language, string>;
}

const templateSeeds: TemplateSeed[] = [
  {
    groupId: 'tpl-welcome',
    name: 'New Lead Welcome',
    channel: 'whatsapp',
    associatedStage: 'captured',
    mergeFields: ['customerName', 'buildingName'],
    body: {
      en: 'Hi {{customerName}}, thank you for your interest in a lift for {{buildingName}}. AIEC will be in touch shortly.',
      hi: 'नमस्ते {{customerName}}, {{buildingName}} के लिए लिफ्ट में आपकी रुचि के लिए धन्यवाद। AIEC जल्द ही आपसे संपर्क करेगा।',
      mr: 'नमस्कार {{customerName}}, {{buildingName}} साठी लिफ्टमध्ये स्वारस्य दाखवल्याबद्दल धन्यवाद. AIEC लवकरच तुमच्याशी संपर्क साधेल.',
    },
  },
  {
    groupId: 'tpl-quote-followup',
    name: 'Quote Follow-Up',
    channel: 'whatsapp',
    associatedStage: 'quoted',
    mergeFields: ['customerName', 'buildingName', 'quoteAmount'],
    body: {
      en: 'Hi {{customerName}}, following up on the quote of {{quoteAmount}} for {{buildingName}}. Any questions on our end?',
      hi: 'नमस्ते {{customerName}}, {{buildingName}} के लिए {{quoteAmount}} के कोटेशन पर फ़ॉलो-अप कर रहे हैं। कोई सवाल हो तो बताइए।',
      mr: 'नमस्कार {{customerName}}, {{buildingName}} साठी {{quoteAmount}} च्या कोटेशनबाबत फॉलो-अप करत आहोत. काही प्रश्न असल्यास कळवा.',
    },
  },
  {
    groupId: 'tpl-payment-reminder',
    name: 'Payment Reminder',
    channel: 'sms',
    associatedStage: 'won',
    mergeFields: ['customerName', 'buildingName', 'quoteAmount'],
    body: {
      en: 'AIEC: Reminder - payment of {{quoteAmount}} is due for {{buildingName}}. Please complete at your earliest convenience.',
      hi: 'AIEC: याद दिलाना - {{buildingName}} के लिए {{quoteAmount}} का भुगतान बाकी है। कृपया जल्द पूरा करें।',
      mr: 'AIEC: स्मरण - {{buildingName}} साठी {{quoteAmount}} रक्कम देय आहे. कृपया लवकरात लवकर पूर्ण करा.',
    },
  },
  // The escalated-tone follow-up screen 083's reminder cadence steps up to
  // once the friendly first nudge has passed without payment.
  {
    groupId: 'tpl-payment-reminder-firm',
    name: 'Payment Reminder — Firm Follow-Up',
    channel: 'whatsapp',
    associatedStage: 'won',
    mergeFields: ['customerName', 'buildingName', 'quoteAmount'],
    body: {
      en: 'AIEC: Hi {{customerName}}, the payment of {{quoteAmount}} for {{buildingName}} is now overdue. Please arrange payment as soon as possible, or contact us if there is an issue.',
      hi: 'AIEC: नमस्ते {{customerName}}, {{buildingName}} के लिए {{quoteAmount}} का भुगतान अब अतिदेय है। कृपया जल्द से जल्द भुगतान करें, या किसी समस्या के लिए हमसे संपर्क करें।',
      mr: 'AIEC: नमस्कार {{customerName}}, {{buildingName}} साठी {{quoteAmount}} रक्कम आता मुदतबाह्य आहे. कृपया लवकरात लवकर पेमेंट करा, किंवा काही अडचण असल्यास आमच्याशी संपर्क साधा.',
    },
  },
  // Sent only by screen 089, after the automated cadence (through the
  // call_task step) has already run its course with no resolution — a
  // deliberately more formal register than tpl-payment-reminder-firm.
  {
    groupId: 'tpl-payment-formal-notice',
    name: 'Payment — Formal Notice',
    channel: 'whatsapp',
    associatedStage: 'won',
    mergeFields: ['customerName', 'buildingName', 'quoteAmount'],
    body: {
      en: 'AIEC: Dear {{customerName}}, this is a formal notice that the payment of {{quoteAmount}} for {{buildingName}} remains overdue despite earlier reminders. Please settle this at the earliest, or contact us directly to discuss.',
      hi: 'AIEC: प्रिय {{customerName}}, यह एक औपचारिक सूचना है कि {{buildingName}} के लिए {{quoteAmount}} का भुगतान पहले की याद-दिलाने के बावजूद अभी भी बकाया है। कृपया इसे जल्द से जल्द निपटाएं, या चर्चा के लिए सीधे हमसे संपर्क करें।',
      mr: 'AIEC: प्रिय {{customerName}}, ही एक औपचारिक सूचना आहे की {{buildingName}} साठी {{quoteAmount}} चे पेमेंट आधीच्या स्मरणपत्रांनंतरही अजून थकीत आहे. कृपया लवकरात लवकर हे निकाली काढा, किंवा चर्चेसाठी थेट आमच्याशी संपर्क साधा.',
    },
  },
  {
    groupId: 'tpl-install-update',
    name: 'Installation Update',
    channel: 'whatsapp',
    associatedStage: 'won',
    mergeFields: ['customerName', 'buildingName', 'installStep'],
    body: {
      en: 'Update for {{buildingName}}: installation has reached "{{installStep}}". We will keep you posted as it progresses.',
      hi: '{{buildingName}} के लिए अपडेट: इंस्टॉलेशन "{{installStep}}" चरण तक पहुँच गया है। आगे की जानकारी देते रहेंगे।',
      mr: '{{buildingName}} साठी अपडेट: इंस्टॉलेशन "{{installStep}}" टप्प्यापर्यंत पोहोचले आहे. पुढील माहिती कळवत राहू.',
    },
  },
  {
    groupId: 'tpl-ship-dispatched',
    name: 'Shipment Dispatched',
    channel: 'whatsapp',
    associatedStage: 'won',
    mergeFields: ['customerName', 'buildingName', 'shipmentLabel'],
    body: {
      en: 'Hi {{customerName}}, your {{shipmentLabel}} for {{buildingName}} has left the supplier and is on its way. We will keep you posted.',
      hi: 'नमस्ते {{customerName}}, {{buildingName}} के लिए आपका {{shipmentLabel}} सप्लायर से निकल चुका है और रास्ते में है। हम आपको जानकारी देते रहेंगे।',
      mr: 'नमस्कार {{customerName}}, {{buildingName}} साठीचा तुमचा {{shipmentLabel}} पुरवठादाराकडून निघाला आहे आणि वाटेत आहे. आम्ही तुम्हाला कळवत राहू.',
    },
  },
  {
    groupId: 'tpl-ship-transit',
    name: 'Shipment In Transit',
    channel: 'whatsapp',
    associatedStage: 'won',
    mergeFields: ['customerName', 'buildingName', 'shipmentLabel', 'etaTime'],
    body: {
      en: 'Hi {{customerName}}, your {{shipmentLabel}} is on the road and should reach {{buildingName}} around {{etaTime}}.',
      hi: 'नमस्ते {{customerName}}, आपका {{shipmentLabel}} रास्ते में है और {{buildingName}} लगभग {{etaTime}} तक पहुँच जाएगा।',
      mr: 'नमस्कार {{customerName}}, तुमचा {{shipmentLabel}} वाटेत आहे आणि {{buildingName}} येथे साधारण {{etaTime}} पर्यंत पोहोचेल.',
    },
  },
  {
    groupId: 'tpl-ship-nearby',
    name: 'Shipment Nearby',
    channel: 'whatsapp',
    associatedStage: 'won',
    mergeFields: ['customerName', 'buildingName', 'shipmentLabel'],
    body: {
      en: 'Hi {{customerName}}, your {{shipmentLabel}} is nearby and will reach {{buildingName}} within minutes. Please keep the access route clear.',
      hi: 'नमस्ते {{customerName}}, आपका {{shipmentLabel}} पास ही है और कुछ ही मिनटों में {{buildingName}} पहुँच जाएगा। कृपया रास्ता साफ़ रखें।',
      mr: 'नमस्कार {{customerName}}, तुमचा {{shipmentLabel}} जवळच आहे आणि काही मिनिटांत {{buildingName}} येथे पोहोचेल. कृपया रस्ता मोकळा ठेवा.',
    },
  },
  {
    groupId: 'tpl-ship-arrived',
    name: 'Shipment Arrived',
    channel: 'whatsapp',
    associatedStage: 'won',
    mergeFields: ['customerName', 'buildingName', 'shipmentLabel'],
    body: {
      en: 'Hi {{customerName}}, your {{shipmentLabel}} has arrived at {{buildingName}}. Our team will check it with you now.',
      hi: 'नमस्ते {{customerName}}, आपका {{shipmentLabel}} {{buildingName}} पहुँच गया है। हमारी टीम अब आपके साथ इसकी जाँच करेगी।',
      mr: 'नमस्कार {{customerName}}, तुमचा {{shipmentLabel}} {{buildingName}} येथे पोहोचला आहे. आमची टीम आता तुमच्यासोबत त्याची तपासणी करेल.',
    },
  },
  {
    groupId: 'tpl-delay-notice',
    name: 'Delivery Delay Notice',
    channel: 'whatsapp',
    associatedStage: 'won',
    mergeFields: ['customerName', 'buildingName', 'shipmentLabel', 'etaDate', 'originalDate'],
    body: {
      en: 'Hi {{customerName}}, a quick and honest update: your {{shipmentLabel}} for {{buildingName}} is running behind. It was due {{originalDate}} and we now expect it around {{etaDate}}. We are on it and will tell you the moment that changes.',
      hi: 'नमस्ते {{customerName}}, एक सच्ची और सीधी जानकारी: {{buildingName}} के लिए आपका {{shipmentLabel}} देर से चल रहा है। यह {{originalDate}} को आना था और अब हमें इसके लगभग {{etaDate}} तक पहुँचने की उम्मीद है। हम इस पर लगे हैं और जैसे ही कुछ बदलेगा आपको बताएँगे।',
      mr: 'नमस्कार {{customerName}}, एक स्पष्ट आणि खरी माहिती: {{buildingName}} साठीचा तुमचा {{shipmentLabel}} उशिराने चालला आहे. तो {{originalDate}} ला यायचा होता आणि आता तो साधारण {{etaDate}} पर्यंत पोहोचेल अशी आम्हाला अपेक्षा आहे. आम्ही त्यावर काम करत आहोत आणि काही बदललं की लगेच कळवू.',
    },
  },
  {
    groupId: 'tpl-parts-notice',
    name: 'Damaged Parts Notice',
    channel: 'whatsapp',
    associatedStage: 'won',
    mergeFields: ['customerName', 'buildingName', 'partsLabel', 'etaDate'],
    body: {
      en: 'Hi {{customerName}}, a quick and honest update: when your delivery for {{buildingName}} was checked, the {{partsLabel}} arrived damaged or not as ordered. We have asked the supplier to replace it and now expect the new one around {{etaDate}}. We are on it and will tell you the moment that changes.',
      hi: 'नमस्ते {{customerName}}, एक सच्ची और सीधी जानकारी: {{buildingName}} की आपकी डिलीवरी जाँची गई तो {{partsLabel}} टूटा हुआ या ऑर्डर के मुताबिक नहीं निकला। हमने सप्लायर से इसे बदलने को कहा है और अब नया लगभग {{etaDate}} तक पहुँचने की उम्मीद है। हम इस पर लगे हैं और जैसे ही कुछ बदलेगा आपको बताएँगे।',
      mr: 'नमस्कार {{customerName}}, एक स्पष्ट आणि खरी माहिती: {{buildingName}} ची तुमची डिलिव्हरी तपासली तेव्हा {{partsLabel}} तुटलेला किंवा ऑर्डरप्रमाणे नसलेला निघाला. आम्ही पुरवठादाराला तो बदलून द्यायला सांगितलं आहे आणि नवा साधारण {{etaDate}} पर्यंत पोहोचेल अशी अपेक्षा आहे. आम्ही त्यावर काम करत आहोत आणि काही बदललं की लगेच कळवू.',
    },
  },
  {
    groupId: 'tpl-delay-external',
    name: 'Delivery Delay Notice (shared cause)',
    channel: 'whatsapp',
    associatedStage: 'won',
    mergeFields: ['customerName', 'buildingName', 'shipmentLabel', 'etaDate', 'originalDate', 'delayReason'],
    body: {
      en: 'Hi {{customerName}}, a quick and honest update: {{delayReason}} is holding up deliveries, and your {{shipmentLabel}} for {{buildingName}} is affected. It was due {{originalDate}} and we now expect it around {{etaDate}}. This is outside anyone’s control, and we will tell you the moment it moves.',
      hi: 'नमस्ते {{customerName}}, एक सच्ची और सीधी जानकारी: {{delayReason}} के कारण डिलीवरी रुकी हुई हैं, और {{buildingName}} के लिए आपका {{shipmentLabel}} इससे प्रभावित है। यह {{originalDate}} को आना था और अब हमें इसके लगभग {{etaDate}} तक पहुँचने की उम्मीद है। यह किसी के बस में नहीं है, और जैसे ही कुछ बदलेगा हम आपको बताएँगे।',
      mr: 'नमस्कार {{customerName}}, एक स्पष्ट आणि खरी माहिती: {{delayReason}} मुळे डिलिव्हऱ्या थांबल्या आहेत, आणि {{buildingName}} साठीचा तुमचा {{shipmentLabel}} त्यामुळे प्रभावित झाला आहे. तो {{originalDate}} ला यायचा होता आणि आता तो साधारण {{etaDate}} पर्यंत पोहोचेल अशी आम्हाला अपेक्षा आहे. हे कोणाच्याही हातात नाही, आणि काही बदललं की लगेच कळवू.',
    },
  },
  {
    groupId: 'tpl-amc-reconsider',
    name: 'AMC: a gentle second look',
    channel: 'whatsapp',
    associatedStage: 'won',
    mergeFields: ['customerName', 'buildingName'],
    body: {
      en: 'Hi {{customerName}}, we hope the lift at {{buildingName}} is serving you well. When we handed it over you kept the AMC for later. If you would like regular servicing and a quick response when you need us, just reply here and we will set it up. No pressure at all.',
      hi: 'नमस्ते {{customerName}}, हमें उम्मीद है कि {{buildingName}} की लिफ़्ट आपकी अच्छी सेवा कर रही है। हैंडओवर के समय आपने AMC बाद के लिए रखा था। अगर आप नियमित सर्विसिंग और ज़रूरत पर तुरंत जवाब चाहें, तो यहीं जवाब दें और हम इसे शुरू कर देंगे। कोई दबाव नहीं है।',
      mr: 'नमस्कार {{customerName}}, आम्हाला आशा आहे की {{buildingName}} येथील लिफ्ट तुम्हाला चांगली सेवा देत आहे. हस्तांतरणाच्या वेळी तुम्ही AMC नंतरसाठी ठेवले होते. नियमित सर्व्हिसिंग आणि गरजेच्या वेळी जलद प्रतिसाद हवा असेल तर इथेच उत्तर द्या, आम्ही ते सुरू करू. अजिबात दबाव नाही.',
    },
  },
  {
    groupId: 'tpl-warranty-ending',
    name: 'Warranty ending soon',
    channel: 'whatsapp',
    associatedStage: 'won',
    mergeFields: ['customerName', 'buildingName', 'endDate'],
    body: {
      en: 'Hi {{customerName}}, the service warranty on the lift at {{buildingName}} ends on {{endDate}}. An AMC keeps it serviced and covered after that. Reply here and we will show you the options.',
      hi: 'नमस्ते {{customerName}}, {{buildingName}} की लिफ़्ट की सर्विस वारंटी {{endDate}} को ख़त्म हो रही है। उसके बाद AMC उसे सर्विस और कवर में रखता है। यहीं जवाब दें और हम आपको विकल्प दिखाएँगे।',
      mr: 'नमस्कार {{customerName}}, {{buildingName}} येथील लिफ्टची सर्व्हिस वॉरंटी {{endDate}} रोजी संपत आहे. त्यानंतर AMC तिला सर्व्हिस आणि संरक्षणात ठेवते. इथेच उत्तर द्या, आम्ही तुम्हाला पर्याय दाखवू.',
    },
  },
  {
    groupId: 'tpl-amc-renewal',
    name: 'AMC renewal',
    channel: 'whatsapp',
    associatedStage: 'won',
    mergeFields: ['customerName', 'buildingName', 'endDate'],
    body: {
      en: 'Hi {{customerName}}, your AMC for the lift at {{buildingName}} runs until {{endDate}}. Reply here and we will renew it so the servicing carries on without a gap.',
      hi: 'नमस्ते {{customerName}}, {{buildingName}} की लिफ़्ट का आपका AMC {{endDate}} तक चलता है। यहीं जवाब दें और हम इसे नवीनीकृत कर देंगे ताकि सर्विसिंग बिना रुकावट चलती रहे।',
      mr: 'नमस्कार {{customerName}}, {{buildingName}} येथील लिफ्टचे तुमचे AMC {{endDate}} पर्यंत चालते. इथेच उत्तर द्या, आम्ही ते नूतनीकरण करू म्हणजे सर्व्हिसिंग खंडित न होता सुरू राहील.',
    },
  },
  {
    groupId: 'tpl-ticket-received',
    name: 'Service request received',
    channel: 'whatsapp',
    associatedStage: 'won',
    mergeFields: ['customerName', 'buildingName', 'ticketCode'],
    body: {
      en: 'Hi {{customerName}}, we have received your request {{ticketCode}} for {{buildingName}}. You can follow it in your AIEC account, where we also tell you when to expect our answer. If anyone is trapped or it is unsafe right now, please call us straight away.',
      hi: 'नमस्ते {{customerName}}, हमें {{buildingName}} के लिए आपका अनुरोध {{ticketCode}} मिल गया है। आप इसे अपने AIEC खाते में देख सकते हैं, जहाँ हम यह भी बताते हैं कि हमारा जवाब कब तक मिलेगा। यदि कोई फँसा है या अभी असुरक्षित है, तो कृपया तुरंत हमें फ़ोन करें।',
      mr: 'नमस्कार {{customerName}}, आम्हाला {{buildingName}} साठी तुमची विनंती {{ticketCode}} मिळाली आहे. तुम्ही ती तुमच्या AIEC खात्यात पाहू शकता, जिथे आमचे उत्तर कधीपर्यंत मिळेल हेही सांगितले आहे. कोणी अडकले असेल किंवा आत्ता असुरक्षित असेल, तर कृपया लगेच आम्हाला फोन करा.',
    },
  },
  {
    groupId: 'tpl-ticket-visit',
    name: 'Service visit booked',
    channel: 'whatsapp',
    associatedStage: 'won',
    mergeFields: ['customerName', 'buildingName', 'ticketCode', 'technicianName', 'visitWhen'],
    body: {
      en: 'Hi {{customerName}}, a service visit for your request {{ticketCode}} at {{buildingName}} is booked: {{technicianName}} will come on {{visitWhen}}. If that does not suit you, reply here and we will move it.',
      hi: 'नमस्ते {{customerName}}, {{buildingName}} पर आपके अनुरोध {{ticketCode}} के लिए सर्विस विज़िट तय हो गई है: {{technicianName}} {{visitWhen}} को आएँगे। यदि यह आपके लिए ठीक नहीं है, तो यहीं जवाब दें, हम इसे बदल देंगे।',
      mr: 'नमस्कार {{customerName}}, {{buildingName}} येथील तुमच्या विनंतीसाठी {{ticketCode}} सर्व्हिस भेट ठरली आहे: {{technicianName}} {{visitWhen}} रोजी येतील. ते तुम्हाला सोयीचे नसल्यास येथेच उत्तर द्या, आम्ही ते बदलू.',
    },
  },
  {
    groupId: 'tpl-handover-certificate',
    name: 'Handover completion certificate',
    channel: 'whatsapp',
    associatedStage: 'won',
    mergeFields: ['customerName', 'buildingName', 'certificateNo'],
    body: {
      en: 'Hi {{customerName}}, your lift at {{buildingName}} is now fully handed over. Your completion certificate {{certificateNo}} is in your AIEC account. It stays there permanently, with your warranty, service terms and every document from your project, so you can open it whenever you need it.',
      hi: 'नमस्ते {{customerName}}, {{buildingName}} की आपकी लिफ़्ट अब पूरी तरह सौंप दी गई है। आपका पूर्णता प्रमाणपत्र {{certificateNo}} आपके AIEC खाते में है। वह वारंटी, सर्विस शर्तों और आपके प्रोजेक्ट के हर दस्तावेज़ के साथ स्थायी रूप से वहीं रहेगा, जब चाहें खोल सकते हैं।',
      mr: 'नमस्कार {{customerName}}, {{buildingName}} येथील तुमची लिफ्ट आता पूर्णपणे सुपूर्द झाली आहे. तुमचे पूर्णत्व प्रमाणपत्र {{certificateNo}} तुमच्या AIEC खात्यात आहे. ते वॉरंटी, सेवा अटी आणि तुमच्या प्रकल्पातील प्रत्येक कागदपत्रासह कायमस्वरूपी तिथेच राहील, हवे तेव्हा उघडू शकता.',
    },
  },
  {
    groupId: 'tpl-site-visit-confirm',
    name: 'Site Visit Confirmation',
    channel: 'sms',
    associatedStage: 'site_visit',
    mergeFields: ['customerName', 'buildingName', 'visitDate'],
    body: {
      en: 'AIEC: Confirming our site visit at {{buildingName}} on {{visitDate}}. Reply if this time no longer works.',
      hi: 'AIEC: {{buildingName}} पर {{visitDate}} को साइट विज़िट की पुष्टि कर रहे हैं। यह समय ठीक न हो तो जवाब दीजिए।',
      mr: 'AIEC: {{buildingName}} येथे {{visitDate}} रोजी साइट भेटीची पुष्टी करत आहोत. ही वेळ योग्य नसल्यास कळवा.',
    },
  },
];

const LANGUAGES_SEED: Language[] = ['en', 'hi', 'mr'];

export const seedCommTemplates: CommTemplate[] = templateSeeds.flatMap((t) =>
  LANGUAGES_SEED.map((lang) => {
    const body = t.body[lang];
    return {
      id: `ct-${t.groupId}-${lang}`,
      groupId: t.groupId,
      name: t.name,
      channel: t.channel,
      associatedStage: t.associatedStage,
      language: lang,
      body,
      mergeFields: t.mergeFields,
      status: 'active' as const,
      versions: [{ version: 1, body, editedBy: 'Prashant Vasant Wable', editedAt: daysAgo(90) }],
      updatedAt: daysAgo(90),
      updatedBy: 'Prashant Vasant Wable',
      isDemo: true,
    };
  }),
);

export const seedCommSequences: CommSequence[] = [
  {
    id: 'seq-1',
    name: 'New Lead Nurture',
    triggerStage: 'captured',
    steps: [
      { id: 'seq-1-s1', order: 1, waitDays: 0, templateGroupId: 'tpl-welcome', branch: 'always' },
      { id: 'seq-1-s2', order: 2, waitDays: 3, templateGroupId: 'tpl-site-visit-confirm', branch: 'no_response' },
    ],
    maxNudgesPerLead: 3,
    priority: 1,
    isActive: true,
    restartOnReopen: false,
    updatedAt: daysAgo(45),
    isDemo: true,
  },
  {
    id: 'seq-2',
    name: 'Quote Nudge',
    triggerStage: 'quoted',
    steps: [
      { id: 'seq-2-s1', order: 1, waitDays: 2, templateGroupId: 'tpl-quote-followup', branch: 'always' },
      { id: 'seq-2-s2', order: 2, waitDays: 5, templateGroupId: 'tpl-quote-followup', branch: 'no_response' },
    ],
    maxNudgesPerLead: 2,
    priority: 2,
    isActive: true,
    restartOnReopen: true,
    updatedAt: daysAgo(30),
    isDemo: true,
  },
  {
    id: 'seq-3',
    name: 'Post-Win Payment Cadence',
    triggerStage: 'won',
    steps: [{ id: 'seq-3-s1', order: 1, waitDays: 1, templateGroupId: 'tpl-payment-reminder', branch: 'always' }],
    maxNudgesPerLead: 4,
    priority: 1,
    isActive: false,
    restartOnReopen: false,
    updatedAt: daysAgo(10),
    isDemo: true,
  },
];

export const seedConversations: Conversation[] = [
  { id: 'conv-1', leadId: 'l-3', assignedAgentId: 'u-admin-1', lastMessageAt: minutesAgo(40), isDemo: true },
  { id: 'conv-2', leadId: 'l-4', lastMessageAt: hoursAgo(2), isDemo: true },
  { id: 'conv-3', leadId: 'l-9', lastMessageAt: daysAgo(1), isDemo: true },
  { id: 'conv-4', leadId: 'l-15', assignedAgentId: 'u-admin-1', lastMessageAt: minutesAgo(30), sequencePausedUntil: hoursAhead(2), isDemo: true },
  { id: 'conv-5', leadId: 'l-10', lastMessageAt: daysAgo(9), isDemo: true },
  { id: 'conv-6', leadId: 'l-11', lastMessageAt: daysAgo(1), isDemo: true },
  { id: 'conv-7', leadId: 'l-1', lastMessageAt: daysAgo(4), isDemo: true },
  { id: 'conv-8', leadId: 'l-2', lastMessageAt: daysAgo(6), isDemo: true },
];

export const seedCommMessages: CommMessage[] = [
  { id: 'cm-1', conversationId: 'conv-1', channel: 'whatsapp', sender: 'bot', body: 'Hi Farhan Qureshi, following up on the quote of ₹41.20L for Skyline Corporate Park. Any questions on our end?', templateGroupId: 'tpl-quote-followup', status: 'read', at: daysAgo(2) },
  { id: 'cm-2', conversationId: 'conv-1', channel: 'whatsapp', sender: 'customer', body: 'Can we get a better rate on the SS finish?', status: 'read', at: daysAgo(2) },
  { id: 'cm-3', conversationId: 'conv-1', channel: 'whatsapp', sender: 'bot', body: 'Let me connect you with our team on that — one moment.', status: 'delivered', at: hoursAgo(20), requiresHumanReview: true, handled: false },
  { id: 'cm-4', conversationId: 'conv-1', channel: 'whatsapp', sender: 'agent', senderName: 'Prashant Vasant Wable', body: 'Hi Farhan, happy to discuss — could do premium SS at a small step up, or standard SS within the quoted price. Which would you prefer?', status: 'sent', at: hoursAgo(2), handled: true },
  { id: 'cm-4b', conversationId: 'conv-1', channel: 'whatsapp', sender: 'customer', body: 'Here is the lobby finish we have in mind', mediaKind: 'photo', status: 'delivered', at: hoursAgo(1), requiresHumanReview: true, handled: false },
  { id: 'cm-4c', conversationId: 'conv-1', channel: 'whatsapp', sender: 'customer', body: 'We were quoted ₹39L elsewhere for the same spec — can you match that?', status: 'delivered', at: minutesAgo(45) },
  { id: 'cm-4d', conversationId: 'conv-1', channel: 'whatsapp', sender: 'bot', body: "We're not able to go that low on this configuration, but we can hold ₹41.80L with our AMC response-time guarantee included, which most vendors quote separately.", status: 'delivered', at: minutesAgo(40) },

  { id: 'cm-5', conversationId: 'conv-2', channel: 'whatsapp', sender: 'bot', body: 'Hi Amit Joshi, following up on the quote of ₹30.50L for Pinnacle Aurum. Any questions on our end?', templateGroupId: 'tpl-quote-followup', status: 'delivered', at: hoursAgo(20) },
  { id: 'cm-5b', conversationId: 'conv-2', channel: 'whatsapp', sender: 'customer', body: 'Could you do ₹32.80L instead of the quoted price?', status: 'delivered', at: hoursAgo(2) },

  { id: 'cm-6', conversationId: 'conv-3', channel: 'sms', sender: 'bot', body: 'AIEC: Confirming our site visit at Nirman Elite on 18 Aug. Reply if this time no longer works.', templateGroupId: 'tpl-site-visit-confirm', status: 'delivered', at: daysAgo(1) },
  { id: 'cm-7', conversationId: 'conv-3', channel: 'sms', sender: 'customer', body: 'STOP', status: 'delivered', at: daysAgo(1), requiresHumanReview: true, handled: false },

  { id: 'cm-7b', conversationId: 'conv-4', channel: 'whatsapp', sender: 'bot', body: "Here's our best bundled number for 10 units with a 2-year AMC: ₹84.50L all-in — this already reflects our maximum approved step-down for this specification.", status: 'read', at: hoursAgo(11) },
  { id: 'cm-7c', conversationId: 'conv-4', channel: 'whatsapp', sender: 'customer', body: 'Still hoping for something closer to ₹78L with the AMC included.', status: 'read', at: hoursAgo(10) },
  { id: 'cm-7d', conversationId: 'conv-4', channel: 'whatsapp', sender: 'bot', body: "That's beyond what we're able to offer within policy on this configuration. I'm looping in our team to see if anything further is possible.", status: 'delivered', at: hoursAgo(9), requiresHumanReview: true, handled: false },
  { id: 'cm-8', conversationId: 'conv-4', channel: 'whatsapp', sender: 'bot', body: 'Hi Girish Rao, following up on the quote for Tech Park Block C. Any questions on our end?', templateGroupId: 'tpl-quote-followup', status: 'read', at: hoursAgo(3) },
  { id: 'cm-9', conversationId: 'conv-4', channel: 'whatsapp', sender: 'customer', body: 'Can we get 10 units at this price plus a 2-year AMC bundled in?', status: 'read', at: minutesAgo(35) },
  { id: 'cm-10', conversationId: 'conv-4', channel: 'whatsapp', sender: 'agent', senderName: 'Prashant Vasant Wable', body: 'Good question — let me get you a bundled number for that by tomorrow.', status: 'sent', at: minutesAgo(30), handled: true },

  { id: 'cm-11', conversationId: 'conv-5', channel: 'whatsapp', sender: 'bot', body: 'Hi Deepa Naik, thank you for your interest in a lift for Vista Enclave. AIEC will be in touch shortly.', templateGroupId: 'tpl-welcome', status: 'read', at: daysAgo(9) },
  { id: 'cm-12', conversationId: 'conv-6', channel: 'whatsapp', sender: 'bot', body: 'Hi Manoj Kadam, thank you for your interest in a lift for Estate One. AIEC will be in touch shortly.', templateGroupId: 'tpl-welcome', status: 'delivered', at: daysAgo(1) },
  { id: 'cm-13', conversationId: 'conv-7', channel: 'sms', sender: 'bot', body: 'AIEC: Reminder - payment of ₹4.58L is due for Shree Ram Heights. Please complete at your earliest convenience.', templateGroupId: 'tpl-payment-reminder', status: 'delivered', at: daysAgo(5) },
  { id: 'cm-14', conversationId: 'conv-7', channel: 'sms', sender: 'customer', body: 'Will pay by Friday, thanks for the reminder.', status: 'delivered', at: daysAgo(4) },
  { id: 'cm-15', conversationId: 'conv-8', channel: 'sms', sender: 'bot', body: 'AIEC: Reminder - payment of ₹1.88L is due for Kulkarni Signature. Please complete at your earliest convenience.', templateGroupId: 'tpl-payment-reminder', status: 'failed', at: daysAgo(6) },
];

export const seedCallLog: CallLogEntry[] = [
  { id: 'cl-1', leadId: 'l-6', outcome: 'connected_interested', durationSec: 246, at: hoursAgo(5), consentGiven: true, loggedBy: 'auto_dialer', isDemo: true },
  { id: 'cl-2', leadId: 'l-7', outcome: 'no_answer', durationSec: 0, at: hoursAgo(8), consentGiven: false, loggedBy: 'auto_dialer', isDemo: true },
  { id: 'cl-3', leadId: 'l-7', outcome: 'no_answer', durationSec: 0, at: daysAgo(1), consentGiven: false, loggedBy: 'auto_dialer', isDemo: true },
  { id: 'cl-4', leadId: 'l-7', outcome: 'no_answer', durationSec: 0, at: daysAgo(2), consentGiven: false, loggedBy: 'auto_dialer', isDemo: true },
  { id: 'cl-5', leadId: 'l-8', outcome: 'connected_not_interested', durationSec: 88, at: daysAgo(1), consentGiven: true, loggedBy: 'auto_dialer', isDemo: true },
  { id: 'cl-6', leadId: 'l-16', outcome: null, durationSec: 190, at: daysAgo(1), consentGiven: true, loggedBy: 'auto_dialer', isDemo: true },
  { id: 'cl-7', leadId: 'l-18', outcome: 'wrong_number', durationSec: 12, at: daysAgo(3), consentGiven: false, loggedBy: 'manual', isDemo: true },
];

export const seedBroadcasts: SmsBroadcast[] = [
  {
    id: 'bc-1',
    name: 'Diwali greeting',
    segmentDescription: 'All active leads · Pune',
    segmentLeadIds: ['l-6', 'l-8', 'l-9', 'l-10', 'l-11', 'l-12', 'l-15', 'l-18'],
    messageBody: 'AIEC wishes you and your family a very happy Diwali! From all of us on your lift installation team.',
    status: 'sent',
    sentCount: 8,
    deliveredCount: 7,
    failedCount: 1,
    failureBreakdown: { invalid_number: 1 },
    optedOutExcludedCount: 1,
    estimatedCost: 40,
    actualCost: 35,
    createdAt: daysAgo(20),
    isDemo: true,
  },
  {
    id: 'bc-2',
    name: 'Monsoon service reminder',
    segmentDescription: 'Won deals · Pimpri-Chinchwad',
    segmentLeadIds: ['l-3', 'l-16'],
    messageBody: 'AIEC: Monsoon service check available for your installed lift — reply to schedule a free inspection.',
    status: 'scheduled',
    scheduledFor: daysAhead(4),
    sentCount: 0,
    deliveredCount: 0,
    failedCount: 0,
    optedOutExcludedCount: 0,
    estimatedCost: 10,
    createdAt: daysAgo(1),
    isDemo: true,
  },
  {
    id: 'bc-3',
    name: 'New showroom opening — Wakad',
    segmentDescription: 'All active leads · Pune & Pimpri-Chinchwad',
    segmentLeadIds: ['l-1', 'l-2', 'l-4', 'l-5', 'l-7', 'l-8', 'l-9', 'l-10', 'l-13', 'l-14', 'l-17', 'l-18'],
    messageBody: 'AIEC is opening a new showroom in Wakad this month — visit us to see our latest elevator models in person.',
    status: 'sent',
    sentCount: 12,
    deliveredCount: 9,
    failedCount: 3,
    failureBreakdown: { invalid_number: 1, carrier_block: 1, handset_unreachable: 1 },
    optedOutExcludedCount: 2,
    estimatedCost: 60,
    actualCost: 54,
    createdAt: daysAgo(7),
    isDemo: true,
  },
];

export const seedBotConfig: BotConfig = {
  toneKey: 'warm',
  allowedDiscountMinPct: 0,
  allowedDiscountMaxPct: 8,
  escalationConfidenceThreshold: 0.6,
  autoResolvedRatePct: 0.64,
  escalatedRatePct: 0.36,
  updatedAt: daysAgo(15),
};

export const seedOptOutEvents: OptOutEvent[] = [
  { id: 'oo-1', contactPhone: '9822044014', contactName: 'Anita Sawant', channel: 'sms', type: 'opted_out', source: 'stop_keyword', at: daysAgo(35), recordedBy: 'System', isDemo: true },
  { id: 'oo-2', contactPhone: '9822044013', contactName: 'Ramesh Gore', channel: 'all', type: 'opted_out', source: 'customer_request', reason: 'Asked not to be contacted again after losing the deal on price.', at: daysAgo(40), recordedBy: 'Prashant Vasant Wable', isDemo: true },
  { id: 'oo-3', contactPhone: '9822044009', contactName: 'Vikas Thorat', channel: 'whatsapp', type: 'opted_out', source: 'stop_keyword', at: daysAgo(1), recordedBy: 'System', isDemo: true },
  { id: 'oo-4', contactPhone: '9822044006', contactName: 'Nilesh Gaikwad', channel: 'sms', type: 'opted_out', source: 'manual_entry', reason: 'Requested via phone call to office.', at: daysAgo(60), recordedBy: 'Prashant Vasant Wable', isDemo: true },
  { id: 'oo-5', contactPhone: '9822044006', contactName: 'Nilesh Gaikwad', channel: 'sms', type: 'opted_in', source: 'customer_request', reason: 'Called back asking to resume installation updates only.', at: daysAgo(12), recordedBy: 'Prashant Vasant Wable', isDemo: true },
];

export const seedTriggerRules: TriggerRule[] = [
  { id: 'tr-1', name: 'Welcome new captures', triggerStage: 'captured', delayHours: 0, actionSequenceId: 'seq-1', priority: 1, enabled: true, allowStacking: false, createdAt: daysAgo(90), isDemo: true },
  { id: 'tr-2', name: 'Nudge on quote sent', triggerStage: 'quoted', delayHours: 48, actionSequenceId: 'seq-2', priority: 1, enabled: true, allowStacking: false, createdAt: daysAgo(70), isDemo: true },
  { id: 'tr-3', name: 'Payment cadence on win', triggerStage: 'won', delayHours: 24, actionSequenceId: 'seq-3', priority: 1, enabled: false, allowStacking: false, createdAt: daysAgo(50), isDemo: true },
  { id: 'tr-4', name: 'Immediate quote thank-you', triggerStage: 'quoted', delayHours: 0, actionTemplateGroupId: 'tpl-quote-followup', priority: 2, enabled: true, allowStacking: true, createdAt: daysAgo(20), isDemo: true },
];

/* --------------------------------------------------------------- Quotations */

export const seedPricingConfig: PricingConfig = {
  driveTypeBasePrice: {
    hydraulic: 500_000,
    geared_traction: 560_000,
    gearless_traction: 630_000,
    mrl: 540_000,
    vacuum: 1_000_000,
    screw_driven: 1_200_000,
  },
  // Roughly 10-25% per additional stop, varying genuinely by drive type
  // rather than one flat number.
  perFloorIncrementPct: {
    hydraulic: 0.1,
    geared_traction: 0.13,
    gearless_traction: 0.16,
    mrl: 0.14,
    vacuum: 0.2,
    screw_driven: 0.18,
  },
  minimumMarginFloorPct: 15,
  gstRatePct: 18,
  amcTiers: [
    { tier: 'basic', annualPrice: 15_000, responseTimeHours: 48 },
    { tier: 'standard', annualPrice: 25_000, responseTimeHours: 24 },
    { tier: 'comprehensive', annualPrice: 40_000, responseTimeHours: 8 },
  ],
  updatedAt: daysAgo(60),
};

export const seedQuotationTemplates: QuotationTemplate[] = [
  {
    id: 'qt-1',
    name: 'Residential Standard',
    variant: 'residential_standard',
    version: 3,
    legalBoilerplate:
      'This quotation is valid for the period stated above from the date of issue. Prices are exclusive of any state-specific cess unless stated. Installation timelines are estimates and depend on site readiness. AIEC is not liable for delays caused by civil work outside its scope.',
    stateOverrides: {
      Maharashtra: 'This quotation additionally complies with the Maharashtra Lifts, Escalators and Moving Walks Act, 2017 and its inspection requirements.',
    },
    validityPeriodDays: 15,
    footerTagline: 'All India Elevators Company — lifting Maharashtra, floor by floor.',
    updatedAt: daysAgo(12),
    updatedBy: 'Prashant Vasant Wable',
    isDemo: true,
  },
  {
    id: 'qt-2',
    name: 'Premium / Luxury',
    variant: 'premium_luxury',
    version: 1,
    legalBoilerplate:
      'This quotation is valid for the period stated above from the date of issue. A dedicated project manager is assigned for the duration of installation. Prices are exclusive of any state-specific cess unless stated.',
    stateOverrides: {
      Maharashtra: 'This quotation additionally complies with the Maharashtra Lifts, Escalators and Moving Walks Act, 2017 and its inspection requirements.',
    },
    validityPeriodDays: 21,
    footerTagline: 'All India Elevators Company — premium lifts, precisely engineered.',
    updatedAt: daysAgo(45),
    updatedBy: 'Prashant Vasant Wable',
    isDemo: true,
  },
  {
    id: 'qt-3',
    name: 'Commercial Bulk',
    variant: 'commercial_bulk',
    version: 1,
    legalBoilerplate:
      'This quotation is valid for the period stated above from the date of issue. Pricing reflects a multi-unit commercial order and is not valid for a single-unit purchase. Payment and delivery schedule for a multi-lift order is detailed in the accompanying terms sheet.',
    stateOverrides: {
      Maharashtra: 'This quotation additionally complies with the Maharashtra Lifts, Escalators and Moving Walks Act, 2017 and its inspection requirements.',
    },
    validityPeriodDays: 30,
    footerTagline: 'All India Elevators Company — bulk fleets, one accountable partner.',
    updatedAt: daysAgo(30),
    updatedBy: 'Prashant Vasant Wable',
    isDemo: true,
  },
];

type WonSpec = Pick<Quotation, 'driveType' | 'capacityPersons' | 'capacityKg' | 'stopsCount' | 'travelHeightM' | 'finishTier'>;

/** A quotation the customer accepted for a deal that is now won. The breakdown is derived from the deal's own price and margin so it
 *  sums exactly to what was quoted. */
const wonQuotation = (id: string, code: string, leadId: string, finalPrice: number, marginAmount: number, acceptedDaysAgo: number, spec: WonSpec): Quotation => {
  const gstAmount = Math.round(finalPrice - finalPrice / 1.18);
  const body = finalPrice - gstAmount - marginAmount;
  const equipment = Math.round(body * 0.82);
  const civil = Math.round(body * 0.08);
  const labour = Math.round(body * 0.08);
  return {
    id,
    code,
    leadId,
    version: 1,
    status: 'accepted',
    ...spec,
    customConfiguration: false,
    needsSpecializedReview: spec.stopsCount >= 20,
    cost: {
      equipmentCost: equipment,
      civilWorkEstimate: civil,
      installationLaborCost: labour,
      transportCost: body - equipment - civil - labour,
      perFloorCostDelta: spec.stopsCount * 6_000,
      gstPercent: 18,
      gstAmount,
      marginPct: Math.round((marginAmount / (finalPrice - gstAmount)) * 100),
      marginAmount,
      finalPrice,
    },
    validityDate: daysAhead(45),
    viewedAt: daysAgo(acceptedDaysAgo + 3),
    acceptedAt: daysAgo(acceptedDaysAgo),
    deliveryChannels: ['email'],
    sentAt: daysAgo(acceptedDaysAgo + 4),
    deliveryResults: [{ channel: 'email', status: 'delivered', at: daysAgo(acceptedDaysAgo + 4) }],
    createdBy: 'Prashant Vasant Wable',
    createdAt: daysAgo(acceptedDaysAgo + 5),
    isDemo: true,
  };
};


export const seedQuotations: Quotation[] = [
  // l-4 (Pinnacle Aurum) — sent and viewed, awaiting the customer's decision.
  {
    id: 'q-1',
    code: 'AIEC-Q-1001',
    leadId: 'l-4',
    version: 1,
    status: 'viewed',
    driveType: 'gearless_traction',
    capacityPersons: 10,
    capacityKg: 680,
    stopsCount: 14,
    travelHeightM: 33.6,
    finishTier: 'premium',
    customConfiguration: false,
    needsSpecializedReview: false,
    cost: {
      equipmentCost: 1_906_380,
      civilWorkEstimate: 190_638,
      installationLaborCost: 168_000,
      transportCost: 25_000,
      perFloorCostDelta: 100_800,
      gstPercent: 18,
      gstAmount: 515_254,
      marginPct: 20,
      marginAmount: 572_505,
      finalPrice: 3_377_777,
    },
    templateId: 'qt-2',
    templateVersionAtSend: 1,
    validityDate: daysAhead(6),
    deliveryChannels: ['whatsapp', 'email'],
    coverMessage: 'Hi Amit, please find your elevator quotation attached — happy to walk through it on a call.',
    sentAt: daysAgo(9),
    viewedAt: daysAgo(8),
    deliveryResults: [
      { channel: 'whatsapp', status: 'delivered', at: daysAgo(9) },
      { channel: 'email', status: 'delivered', at: daysAgo(9) },
    ],
    createdBy: 'Prashant Vasant Wable',
    createdAt: daysAgo(9),
    isDemo: true,
  },
  // l-16 (Civic Health Centre) — sent, not yet opened.
  {
    id: 'q-2',
    code: 'AIEC-Q-1002',
    leadId: 'l-16',
    version: 1,
    status: 'sent',
    driveType: 'mrl',
    capacityPersons: 13,
    capacityKg: 884,
    stopsCount: 9,
    travelHeightM: 21.6,
    finishTier: 'premium',
    customConfiguration: false,
    needsSpecializedReview: false,
    cost: {
      equipmentCost: 1_259_820,
      civilWorkEstimate: 125_982,
      installationLaborCost: 108_000,
      transportCost: 25_000,
      perFloorCostDelta: 75_600,
      gstPercent: 18,
      gstAmount: 341_731,
      marginPct: 20,
      marginAmount: 379_701,
      finalPrice: 2_240_234,
    },
    templateId: 'qt-1',
    templateVersionAtSend: 3,
    validityDate: daysAhead(10),
    deliveryChannels: ['whatsapp'],
    coverMessage: 'Hi Sanjay, sharing the elevator quotation for Civic Health Centre — a stretcher-capacity cabin as discussed.',
    sentAt: daysAgo(5),
    deliveryResults: [{ channel: 'whatsapp', status: 'delivered', at: daysAgo(5) }],
    createdBy: 'Prashant Vasant Wable',
    createdAt: daysAgo(5),
    isDemo: true,
  },
  // l-3 (Skyline Corporate Park) — v1 superseded by v2 after an approved
  // discount request; v2 is the current sent/viewed version.
  {
    id: 'q-3',
    code: 'AIEC-Q-1003',
    leadId: 'l-3',
    version: 1,
    status: 'superseded',
    driveType: 'gearless_traction',
    capacityPersons: 13,
    capacityKg: 884,
    stopsCount: 17,
    travelHeightM: 40.8,
    finishTier: 'premium',
    customConfiguration: false,
    needsSpecializedReview: false,
    cost: {
      equipmentCost: 2_339_190,
      civilWorkEstimate: 233_919,
      installationLaborCost: 204_000,
      transportCost: 25_000,
      perFloorCostDelta: 100_800,
      gstPercent: 18,
      gstAmount: 630_474,
      marginPct: 20,
      marginAmount: 700_527,
      finalPrice: 4_133_110,
    },
    templateId: 'qt-2',
    templateVersionAtSend: 1,
    validityDate: daysAgo(3),
    deliveryChannels: ['email'],
    coverMessage: 'Hi Farhan, please find the elevator quotation for Skyline Corporate Park attached.',
    sentAt: daysAgo(18),
    viewedAt: daysAgo(17),
    deliveryResults: [{ channel: 'email', status: 'delivered', at: daysAgo(18) }],
    createdBy: 'Prashant Vasant Wable',
    createdAt: daysAgo(18),
    isDemo: true,
  },
  {
    id: 'q-4',
    code: 'AIEC-Q-1004',
    leadId: 'l-3',
    version: 2,
    supersedesQuotationId: 'q-3',
    status: 'viewed',
    driveType: 'gearless_traction',
    capacityPersons: 13,
    capacityKg: 884,
    stopsCount: 17,
    travelHeightM: 40.8,
    finishTier: 'premium',
    customConfiguration: false,
    needsSpecializedReview: false,
    cost: {
      equipmentCost: 2_339_190,
      civilWorkEstimate: 233_919,
      installationLaborCost: 204_000,
      transportCost: 25_000,
      perFloorCostDelta: 100_800,
      gstPercent: 18,
      gstAmount: 615_097,
      marginPct: 18,
      marginAmount: 615_097,
      finalPrice: 4_032_303,
    },
    templateId: 'qt-2',
    templateVersionAtSend: 1,
    validityDate: daysAhead(2),
    deliveryChannels: ['email'],
    coverMessage: 'Hi Farhan, revised quotation reflecting the discount we discussed on the call.',
    sentAt: daysAgo(6),
    viewedAt: daysAgo(5),
    deliveryResults: [{ channel: 'email', status: 'delivered', at: daysAgo(6) }],
    createdBy: 'Prashant Vasant Wable',
    createdAt: daysAgo(6),
    createdReasonKey: 'quotation.reason.discountApproved',
    createdReasonNote: 'Client compared against a competitor quote; 2% margin discount approved to close.',
    isDemo: true,
  },
  // l-13 (Katraj Crown) — sent, customer went with a competitor on price
  // (matches the lead's own lostReason), quote now expired.
  {
    id: 'q-5',
    code: 'AIEC-Q-1005',
    leadId: 'l-13',
    version: 1,
    status: 'expired',
    driveType: 'mrl',
    capacityPersons: 6,
    capacityKg: 408,
    stopsCount: 8,
    travelHeightM: 19.2,
    finishTier: 'standard',
    customConfiguration: false,
    needsSpecializedReview: false,
    cost: {
      equipmentCost: 842_400,
      civilWorkEstimate: 84_240,
      installationLaborCost: 96_000,
      transportCost: 25_000,
      perFloorCostDelta: 75_600,
      gstPercent: 18,
      gstAmount: 235_719,
      marginPct: 20,
      marginAmount: 261_910,
      finalPrice: 1_545_269,
    },
    templateId: 'qt-1',
    templateVersionAtSend: 3,
    validityDate: daysAgo(20),
    deliveryChannels: ['whatsapp'],
    coverMessage: 'Hi Ramesh, sharing the elevator quotation for Katraj Crown.',
    sentAt: daysAgo(38),
    viewedAt: daysAgo(36),
    deliveryResults: [{ channel: 'whatsapp', status: 'delivered', at: daysAgo(38) }],
    createdBy: 'Prashant Vasant Wable',
    createdAt: daysAgo(38),
    isDemo: true,
  },
  // l-8 (Magarpatta Grove) — a live Basic/Premium/Luxury comparison set,
  // still in draft while Sales talks the customer through the options.
  {
    id: 'q-6',
    code: 'AIEC-Q-1006',
    leadId: 'l-8',
    version: 1,
    status: 'draft',
    driveType: 'gearless_traction',
    capacityPersons: 8,
    capacityKg: 544,
    stopsCount: 11,
    travelHeightM: 26.4,
    finishTier: 'standard',
    customConfiguration: false,
    needsSpecializedReview: false,
    cost: {
      equipmentCost: 1_411_200,
      civilWorkEstimate: 141_120,
      installationLaborCost: 132_000,
      transportCost: 25_000,
      perFloorCostDelta: 100_800,
      gstPercent: 18,
      gstAmount: 384_597,
      marginPct: 20,
      marginAmount: 427_330,
      finalPrice: 2_521_247,
    },
    comparisonSetId: 'cmp-1',
    packageTier: 'basic',
    recommended: false,
    deliveryChannels: [],
    deliveryResults: [],
    createdBy: 'Prashant Vasant Wable',
    createdAt: daysAgo(2),
    isDemo: true,
  },
  {
    id: 'q-7',
    code: 'AIEC-Q-1007',
    leadId: 'l-8',
    version: 1,
    status: 'draft',
    driveType: 'gearless_traction',
    capacityPersons: 8,
    capacityKg: 544,
    stopsCount: 11,
    travelHeightM: 26.4,
    finishTier: 'premium',
    customConfiguration: false,
    needsSpecializedReview: false,
    cost: {
      equipmentCost: 1_517_040,
      civilWorkEstimate: 151_704,
      installationLaborCost: 132_000,
      transportCost: 25_000,
      perFloorCostDelta: 100_800,
      gstPercent: 18,
      gstAmount: 410_792,
      marginPct: 20,
      marginAmount: 456_436,
      finalPrice: 2_692_972,
    },
    comparisonSetId: 'cmp-1',
    packageTier: 'premium',
    recommended: true,
    deliveryChannels: [],
    deliveryResults: [],
    createdBy: 'Prashant Vasant Wable',
    createdAt: daysAgo(2),
    isDemo: true,
  },
  {
    id: 'q-8',
    code: 'AIEC-Q-1008',
    leadId: 'l-8',
    version: 1,
    status: 'draft',
    driveType: 'gearless_traction',
    capacityPersons: 8,
    capacityKg: 544,
    stopsCount: 11,
    travelHeightM: 26.4,
    finishTier: 'luxury',
    customConfiguration: false,
    needsSpecializedReview: false,
    cost: {
      equipmentCost: 1_658_160,
      civilWorkEstimate: 165_816,
      installationLaborCost: 132_000,
      transportCost: 25_000,
      perFloorCostDelta: 100_800,
      gstPercent: 18,
      gstAmount: 445_720,
      marginPct: 20,
      marginAmount: 495_244,
      finalPrice: 2_921_940,
    },
    comparisonSetId: 'cmp-1',
    packageTier: 'luxury',
    recommended: false,
    deliveryChannels: [],
    deliveryResults: [],
    createdBy: 'Prashant Vasant Wable',
    createdAt: daysAgo(2),
    isDemo: true,
  },
  // The locked configurations of the three won deals (122): what was sold and contracted, which is all an installation reads.
  wonQuotation('q-9', 'AIEC-Q-1009', 'l-1', 2_780_000, 528_000, 50, { driveType: 'gearless_traction', capacityPersons: 8, capacityKg: 544, stopsCount: 12, travelHeightM: 36.3, finishTier: 'standard' }),
  wonQuotation('q-10', 'AIEC-Q-1010', 'l-2', 1_950_000, 357_000, 38, { driveType: 'mrl', capacityPersons: 6, capacityKg: 408, stopsCount: 8, travelHeightM: 24.5, finishTier: 'standard' }),
  wonQuotation('q-11', 'AIEC-Q-1011', 'l-15', 8_800_000, 1_512_000, 3, { driveType: 'gearless_traction', capacityPersons: 20, capacityKg: 1360, stopsCount: 18, travelHeightM: 55.8, finishTier: 'premium' }),
];

export const seedDiscountRequests: DiscountRequest[] = [
  {
    id: 'dr-1',
    quotationId: 'q-3',
    leadId: 'l-3',
    requestedByUserId: 'u-srv-3',
    requestedDiscountPct: 2,
    reasonNote: 'Client compared against a competitor quote roughly 5% lower; a small margin discount should close this.',
    resultingMarginPct: 18,
    urgent: false,
    status: 'approved',
    approverId: 'u-admin-1',
    decidedAt: daysAgo(6),
    createdAt: daysAgo(7),
    isDemo: true,
  },
  {
    id: 'dr-2',
    quotationId: 'q-1',
    leadId: 'l-4',
    requestedByUserId: 'u-srv-1',
    requestedDiscountPct: 4,
    reasonNote: 'Customer is comparing three vendors and wants a same-day answer before finalizing.',
    resultingMarginPct: 16.5,
    urgent: true,
    status: 'pending',
    createdAt: hoursAgo(3),
    isDemo: true,
  },
];

/* ------------------------------------------ Site check-in / check-out (125) */

/** A local wall-clock time `daysBack` days ago: a technician's day is the phone's own calendar day, so seeds are too. */
const localAt = (daysBack: number, hour: number, minute = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

let sciSeed = 0;
const visit = (
  jobId: string,
  userId: string,
  userName: string,
  site: Job['location'],
  daysBack: number,
  inAt: [number, number],
  outAt: [number, number] | null,
  extra: Partial<SiteCheckIn> = {},
): SiteCheckIn => {
  sciSeed += 1;
  const drift = extra.checkInDriftM ?? 30 + ((sciSeed * 17) % 60);
  return {
    id: `sci-${sciSeed}`,
    jobId,
    userId,
    userName,
    checkInAt: localAt(daysBack, inAt[0], inAt[1]),
    checkInLocation: { lat: site.lat + drift / 111_000, lng: site.lng },
    checkInAccuracyM: 15 + (sciSeed % 12),
    checkInDriftM: drift,
    checkInVerdict: 'clean',
    ...(outAt ? { checkOutAt: localAt(daysBack, outAt[0], outAt[1]), checkOutKind: 'manual' as const } : {}),
    isDemo: true,
    ...extra,
  };
};

const daysOn = (jobId: string, userId: string, userName: string, site: Job['location'], days: number[], inAt: [number, number] = [9, 5], outAt: [number, number] = [17, 40]): SiteCheckIn[] =>
  days.map((d, i) => visit(jobId, userId, userName, site, d, [inAt[0], inAt[1] + (i % 4) * 7], [outAt[0] + (i % 3), outAt[1] - (i % 2) * 20]));

const SITE_J1 = { lat: 18.5913, lng: 73.7389 };
const SITE_J2 = { lat: 18.5515, lng: 73.947 };
const SITE_J5 = { lat: 18.5908, lng: 73.7378 };
const SITE_J6 = { lat: 18.5509, lng: 73.9462 };
const SITE_J7 = { lat: 18.559, lng: 73.7868 };
const SITE_J8 = { lat: 18.4967, lng: 73.8146 };

/** Who was on site and when, for the jobs already under way or done. Nothing for the two booked for later. Santosh (u-tech-1) has no visit
 *  open, so the demo can arrive at Shree Ram Heights; Ajay (u-tech-3) forgot to check out yesterday, so the "still checked in" prompt shows. */
export const seedSiteCheckIns: SiteCheckIn[] = [
  // j-1 Shree Ram Heights: a multi-day job, most days on site, one borderline fix in a canyon of towers, one end of day with steps open.
  ...daysOn('j-1', 'u-tech-1', 'Santosh Kale', SITE_J1, [21, 20, 19, 18, 15, 14, 13, 12, 11, 8, 7, 6, 3]),
  visit('j-1', 'u-tech-1', 'Santosh Kale', SITE_J1, 5, [9, 12], [18, 5], { checkInDriftM: 205, checkInAccuracyM: 90, checkInVerdict: 'borderline', leaveReason: 'end_of_day', openStepIds: ['s8', 's9', 's10'] }),
  visit('j-1', 'u-tech-1', 'Santosh Kale', SITE_J1, 2, [9, 0], [17, 55], { leaveReason: 'end_of_day', openStepIds: ['s8', 's9', 's10'] }),
  // Vishal helped on two days, his own steps, independently.
  visit('j-1', 'u-tech-2', 'Vishal More', SITE_J1, 12, [10, 20], [16, 10]),
  visit('j-1', 'u-tech-2', 'Vishal More', SITE_J1, 11, [10, 0], [15, 45]),
  // j-2 Kulkarni Signature, at QC.
  ...daysOn('j-2', 'u-tech-2', 'Vishal More', SITE_J2, [28, 27, 26, 25, 22, 21, 20, 19, 18, 15, 14, 13]),
  // j-5 Shree Ram service lift, completed: the record a typical install is read from.
  ...daysOn('j-5', 'u-tech-2', 'Vishal More', SITE_J5, [56, 55, 54, 53, 52, 49, 48, 47, 46, 45, 42, 41, 40, 39, 38]),
  // j-7 Balaji Residency, completed.
  ...daysOn('j-7', 'u-tech-1', 'Santosh Kale', SITE_J7, [16, 15, 14, 13, 12, 9, 8, 7, 6, 5]),
  // j-6 Kulkarni basement: one arrival that did not match the site, and the reason given.
  visit('j-6', 'u-tech-3', 'Ajay Nikam', SITE_J6, 4, [9, 30], [17, 30], { checkInDriftM: 780, checkInAccuracyM: 22, checkInVerdict: 'mismatch', checkInReason: 'The basement gate is on the far side of the estate, I parked at the other entrance.' }),
  visit('j-6', 'u-tech-3', 'Ajay Nikam', SITE_J6, 3, [9, 15], [17, 20]),
  // j-8 Om Sai, on hold: days before it stopped, and yesterday's visit never closed.
  ...daysOn('j-8', 'u-tech-3', 'Ajay Nikam', SITE_J8, [12, 11, 10, 9, 8, 5]),
  visit('j-8', 'u-tech-3', 'Ajay Nikam', SITE_J8, 1, [9, 15], null),
];

/* ------------------------------------------ Safety compliance checklist (126) */

/** An example of the state's own requirement Admin adds on top of the standard list. It is a stand-in that shows how it works: AIEC's
 *  qualified engineer replaces it with what the state's Lift Act actually asks for. */
export const seedSafetyStateItems: SafetyStateItem[] = [
  {
    id: 'ssi-1',
    state: 'Maharashtra',
    label: 'Machine room: fire extinguisher fitted and in date',
    method: 'Check that a suitable fire extinguisher is fitted in the machine room, that it is in date, and that the machine room can be locked and is clear of stored items. Example requirement: replace it with the state’s own.',
    requiresReading: true,
    active: true,
    createdByName: 'Prashant Wable',
    createdAt: daysAgo(40),
    isDemo: true,
  },
];

/** EXAMPLE wording only: what a customer in the state does next, after the certificate. Admin replaces it with what the state's Lift Act and
 *  Inspectorate actually ask. It is shown on the certificate's guidance exactly as written here, so it must be checked before it is relied on. */
export const seedStateGuidance: StateInspectionGuidance[] = [
  {
    id: 'sg-1',
    state: 'Maharashtra',
    authority: 'The State Electrical Inspectorate (Lifts) for your district',
    steps: [
      'Apply for the licence to operate the lift to the Inspectorate, with this certificate and the evidence package.',
      'Have the lift ready for the Inspectorate’s own inspection visit and make sure someone who can open the machine room is present.',
      'Ask the Inspectorate what else the state requires (fees, forms and renewal) before you apply.',
    ],
    note: 'Example wording: confirm every step with the Inspectorate and replace it with the state’s own requirements.',
    updatedByName: 'Prashant Wable',
    updatedAt: daysAgo(40),
    isDemo: true,
  },
];

let attemptSeed = 0;
const attempt = (n: number, result: SafetyAttempt['result'], daysBack: number, by: [string, string], extra: Partial<SafetyAttempt> = {}): SafetyAttempt => {
  attemptSeed += 1;
  return { id: `sat-${attemptSeed}`, n, result, at: localAt(daysBack, 11, (attemptSeed * 7) % 50), byUserId: by[0], byName: by[1], ...(result === 'fail' ? { note: extra.note ?? 'Out of tolerance on the first test.' } : { measured: extra.measured ?? 'Within tolerance' }), ...extra };
};
let testSeed = 0;
const test = (jobId: string, itemId: string, attempts: SafetyAttempt[], extra: Partial<JobSafetyTest> = {}): JobSafetyTest => {
  testSeed += 1;
  return { id: `jst-${testSeed}`, jobId, itemId, attempts, holds: [], isDemo: true, ...extra };
};
const STANDARD_IDS = ['wiring', 'sensors', 'governor', 'buffers', 'alarm', 'ard', 'overload', 'noload', 'fullload'];
const allPassed = (jobId: string, by: [string, string], daysBack: number): JobSafetyTest[] => STANDARD_IDS.map((id, i) => test(jobId, id, [attempt(1, 'pass', daysBack - Math.floor(i / 4), by)]));

/** What was tested on the installations already under way or done. j-1 has only the early checks so far; j-8 is on hold over a governor
 *  that failed and needs rework, which Admin has to look at. */
export const seedJobSafetyTests: JobSafetyTest[] = [
  test('j-1', 'wiring', [attempt(1, 'pass', 8, ['u-tech-1', 'Santosh Kale'], { measured: 'Insulation resistance 2.4 MΩ, earth continuity good' })]),
  test('j-1', 'sensors', [attempt(1, 'pass', 12, ['u-tech-2', 'Vishal More'], { measured: 'Door stops and reverses on the beam, 3 of 3 tries' })]),
  ...allPassed('j-5', ['u-tech-2', 'Vishal More'], 40),
  ...allPassed('j-7', ['u-tech-1', 'Santosh Kale'], 8).filter((t) => t.itemId !== 'governor' && t.itemId !== 'alarm'),
  // j-7: the governor failed on the first test, a part was replaced, and it passed on the retest: the cycle, kept for the inspector.
  test('j-7', 'governor', [attempt(1, 'fail', 7, ['u-tech-1', 'Santosh Kale'], { note: 'Overspeed switch tripped late, above the permitted speed.', fix: { kind: 'part_replaced', note: 'Replaced the overspeed switch and reset the tension weight.', at: localAt(7, 14, 20), byName: 'Santosh Kale' } }), attempt(2, 'pass', 7, ['u-tech-1', 'Santosh Kale'], { measured: 'Tripped at the set speed, safety gear caught the car' })]),
  test('j-7', 'alarm', [attempt(1, 'fail', 8, ['u-tech-1', 'Santosh Kale'], { note: 'Alarm bell was faint from inside the car.', fix: { kind: 'minor_adjustment', note: 'Refixed the bell bracket and re-terminated the cable.', at: localAt(8, 12, 40), byName: 'Santosh Kale' } }), attempt(2, 'pass', 8, ['u-tech-1', 'Santosh Kale'], { measured: 'Bell clearly audible at the landing' })]),
  ...allPassed('j-2', ['u-tech-2', 'Vishal More'], 16),
  // j-8 Om Sai (on hold): governor out of tolerance, a fundamental fault, held for Admin.
  test('j-8', 'governor', [attempt(1, 'fail', 3, ['u-tech-3', 'Ajay Nikam'], { note: 'Safety gear test was out of tolerance: the car slid before the gear caught.', fix: { kind: 'needs_rework', note: 'The governor rope groove is worn; it needs replacing, not adjusting.', at: localAt(3, 15, 10), byName: 'Ajay Nikam' } })], { holds: [{ reason: 'needs_rework', at: localAt(3, 15, 10) }] }),
];

/* ------------------------------------------ Issue / blocker reports (127) */

let issueSeed = 0;
const issueEvent = (kind: JobIssue['events'][number]['kind'], at: string, by: [string, string, 'technician' | 'admin' | 'system'], note?: string): JobIssue['events'][number] => ({ id: `ise-${(issueSeed += 1)}`, kind, at, byUserId: by[0], byName: by[1], byRole: by[2], ...(note ? { note } : {}) });
const issue = (jobId: string, by: [string, string], daysBack: number, category: JobIssue['category'], severity: JobIssue['severity'], description: string, extra: Partial<JobIssue> = {}, resolved?: { how: NonNullable<JobIssue['resolution']>['how']; note: string; afterHours: number; byAdmin?: boolean }): JobIssue => {
  const n = issueSeed + 1;
  const createdAt = localAt(daysBack, 11, 20);
  const id = `iss-${n}`;
  const events = [issueEvent('reported', createdAt, [by[0], by[1], 'technician'], description)];
  const resolution = resolved
    ? { how: resolved.how, note: resolved.note, byName: resolved.byAdmin ? 'Prashant Wable' : by[1], byRole: resolved.byAdmin ? ('admin' as const) : ('technician' as const), at: new Date(new Date(createdAt).getTime() + resolved.afterHours * 3_600_000).toISOString() }
    : undefined;
  if (resolution) events.push(issueEvent('resolved', resolution.at, [resolved?.byAdmin ? 'u-admin-1' : by[0], resolution.byName, resolution.byRole], resolved?.note));
  return { id, code: `AIEC-ISS-${1000 + n}`, jobId, category, severity, description, sopGap: false, evidence: [], status: resolved ? 'resolved' : 'open', groupId: id, reportedByUserId: by[0], reportedByName: by[1], createdAt, ...(resolution ? { resolution } : {}), events, isDemo: true, ...extra };
};

/** What has been reported on the jobs so far. The guide-rail step (s3) has been called unclear on three different jobs, which is the
 *  pattern Admin is shown; the rest are the ordinary run of problems, resolved or still open. */
export const seedJobIssues: JobIssue[] = [
  issue('j-5', ['u-tech-2', 'Vishal More'], 50, 'parts', 'blocking', 'The machine bed brackets that arrived are one size too small for the frame.', { stepId: 's4' }, { how: 'admin_resolved', note: 'Correct brackets couriered the same day.', afterHours: 30, byAdmin: true }),
  issue('j-5', ['u-tech-2', 'Vishal More'], 47, 'other', 'minor', 'The guide rail alignment step says to check "tolerance" but not which tolerance; had to phone the supplier.', { stepId: 's3', sopGap: true }, { how: 'fixed_on_site', note: 'Supplier gave the figure.', afterHours: 2 }),
  issue('j-7', ['u-tech-1', 'Santosh Kale'], 14, 'other', 'minor', 'The guide rail step does not say whether the gap gauge goes at the joint or mid-bracket.', { stepId: 's3', sopGap: true }, { how: 'fixed_on_site', note: 'Asked Admin; used the joint.', afterHours: 3 }),
  issue('j-7', ['u-tech-1', 'Santosh Kale'], 12, 'site_condition', 'minor', 'Water seepage in the pit after the rain; pumped it out and carried on.', { stepId: 's1' }, { how: 'self_resolved', note: 'Pumped out, dry again by noon.', afterHours: 5 }),
  issue('j-2', ['u-tech-2', 'Vishal More'], 20, 'other', 'minor', 'Guide rail alignment: it is unclear when to stop adjusting. The step needs a target reading.', { stepId: 's3', sopGap: true }, { how: 'fixed_on_site', note: 'Agreed a target with Admin.', afterHours: 4 }),
  issue('j-2', ['u-tech-2', 'Vishal More'], 6, 'customer_readiness', 'blocking', 'The building has no permanent power in the machine room yet, so the panel cannot be energised.', { stepId: 's7' }, { how: 'admin_resolved', note: 'Customer connected the supply.', afterHours: 40, byAdmin: true }),
  issue('j-6', ['u-tech-3', 'Ajay Nikam'], 3, 'site_condition', 'minor', 'The basement lift pit has an uneven floor near the ladder; noted for the record.', { stepId: 's1' }),
  issue('j-1', ['u-tech-1', 'Santosh Kale'], 9, 'parts', 'minor', 'Two door-operator screws were missing from the pack; used spares from the van.', { stepId: 's6' }, { how: 'fixed_on_site', note: 'Used spares.', afterHours: 1 }),
];

/* ------------------------------------ Recruitment interests (141) */

const rec = (id: number, name: string, phone: string, role: RecruitmentInterest['role'], channel: RecruitmentInterest['source']['channel'], hours: number, extra: Partial<RecruitmentInterest> = {}): RecruitmentInterest => ({
  id: `ri-${id}`,
  code: `AIEC-RI-${1000 + id}`,
  name,
  phone,
  role,
  source: { channel, ...(extra.source ?? {}) },
  interestedAt: hoursAgo(hours),
  language: 'hi',
  contactConsent: true,
  status: 'interested',
  touches: [],
  isDemo: true,
  ...Object.fromEntries(Object.entries(extra).filter(([k]) => k !== 'source')),
});

export const seedRecruitmentInterests: RecruitmentInterest[] = [
  rec(1, 'Rahul Jadhav', '9890011101', 'technician', 'qr', 140, { source: { channel: 'qr', campaign: 'flyer-pune-1' }, status: 'started', startedAt: hoursAgo(139) }),
  rec(2, 'Sneha Kulkarni', '9890011102', 'surveyor', 'qr', 130, { source: { channel: 'qr', campaign: 'flyer-pune-1' } }),
  rec(3, 'Mahesh Pawar', '9890011103', 'technician', 'referral', 96, { source: { channel: 'referral', referrerCode: 'REF-U-TECH-2' }, language: 'mr' }),
  rec(4, 'Mahesh Pawar', '9890011103', 'surveyor', 'referral', 90, { source: { channel: 'referral', referrerCode: 'REF-U-TECH-2' }, language: 'mr' }),
  rec(5, 'Imran Shaikh', '9890011105', 'supplier', 'website', 70, { language: 'en' }),
  rec(6, 'Deepa Nair', '9890011106', 'undecided', 'social', 50, { source: { channel: 'social', campaign: 'insta-oct' }, language: 'en', guided: { answers: { enjoy: 'people', business: 'no', experience: 'none', travel: 'yes' }, suggested: 'surveyor' } }),
  rec(7, 'Vikas More', '9890011107', 'technician', 'walk_in', 30),
  rec(8, 'Anita Gaikwad', '9890011108', 'surveyor', 'whatsapp', 12, { language: 'mr' }),
  rec(9, 'Sagar Bhosale', '9890011109', 'technician', 'qr', 3, { source: { channel: 'qr', campaign: 'flyer-pune-1' } }),
];

/* ------------------------------------ Partner applications (142) */

const apForm = (over: Partial<PartnerApplication['form']>): PartnerApplication['form'] => ({
  personal: { fullName: '', phone: '', city: 'Pune', address: '', dob: '', languages: [] },
  experience: { years: '', skills: [], sectors: [], summary: '' },
  territory: { zoneIds: [], travelKm: '', ownTransport: false },
  availability: { days: [], timeOfDay: '', hoursPerWeek: '', earliestStart: '' },
  identity: { aadhaarNumber: '', aadhaarLast4: '', aadhaarChecked: false, aadhaarDoc: null, panNumber: '', panDoc: null, gstin: '', gstDoc: null },
  references: [],
  noReferences: false,
  ...over,
});
const apDoc = (name: string) => ({ fileName: name, capturedAt: hoursAgo(130), previewUrl: '' });

/** People screened before this app kept the work: decided on the default weighting, with what became of those taken on. Frozen like any decision. */
function screenedHistory(): PartnerApplication[] {
  type V = [number, number, number, number, number];
  const mk = (n: number, name: string, role: PartnerApplication['role'], daysAgoN: number, v: V, outcome?: { rating: 'strong' | 'steady' | 'weak'; note?: string }, reject?: string, extra: Partial<PartnerApplication> = {}): PartnerApplication => {
    const values = Object.fromEntries(SCREEN_FACTORS.map((k, i) => [k, v[i]])) as Record<(typeof SCREEN_FACTORS)[number], number>;
    const rows = SCREEN_FACTORS.map((key) => ({ key, weight: SCREEN_WEIGHTS[key], value: values[key], contribution: (SCREEN_WEIGHTS[key] * values[key]) / 100 }));
    const score = Math.round(rows.reduce((t, r) => t + r.contribution, 0));
    const at = daysAgo(daysAgoN);
    const status = reject ? ('rejected' as const) : ('approved' as const);
    return {
      id: `ap-h${n}`,
      code: `AIEC-AP-${1900 + n}`,
      interestId: '',
      accessKey: `demo-key-h${n}`,
      role,
      status,
      startedAt: daysAgo(daysAgoN + 4),
      updatedAt: at,
      submittedAt: daysAgo(daysAgoN + 2),
      form: apForm({
        personal: { fullName: name, phone: `98900111${20 + n}`, city: 'Pune', address: 'Pune', dob: '', languages: ['mr'] },
        experience: { years: v[1] >= 70 ? '3_5' : v[1] >= 50 ? '1_3' : 'under_1', skills: role === 'surveyor' ? [] : ['mechanical'], sectors: role === 'surveyor' ? ['real_estate'] : [], summary: 'Experience summary as given in the original application.' },
        territory: { zoneIds: ['z-hinjawadi'], travelKm: '20', ownTransport: true },
        availability: { days: [1, 2, 3, 4, 5, 6], timeOfDay: 'full_day', hoursPerWeek: '40', earliestStart: addDaysKey(dateKey(new Date()), 1) },
        identity: { aadhaarNumber: '', aadhaarLast4: '', aadhaarChecked: false, aadhaarDoc: null, panNumber: `ABCP${(name.split(' ').pop() ?? 'X')[0].toUpperCase()}1234Z`, panDoc: apDoc('pan-on-file.jpg'), gstin: '', gstDoc: null },
        noReferences: true,
      }),
      events: [],
      messages: [],
      screening: {
        decision: { status, at, byName: 'Prashant Vasant Wable', score, effective: score, rows, ...(reject ? { reasonKey: `screening.decline.${reject}` } : {}) },
        ...(outcome ? { outcome: { rating: outcome.rating, at: daysAgo(Math.max(1, daysAgoN - 40)), byName: 'Prashant Vasant Wable', ...(outcome.note ? { note: outcome.note } : {}) } } : {}),
      },
      isDemo: true,
      ...extra,
    };
  };
  /** A time on an ordinary working day (never a Sunday), `offset` days from today. */
  const slot = (offset: number, hh: number, mm = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    while (d.getDay() === 0) d.setDate(d.getDate() + (offset >= 0 ? 1 : -1));
    d.setHours(hh, mm, 0, 0);
    return { start: d.toISOString(), end: new Date(d.getTime() + 20 * 60_000).toISOString() };
  };
  const ev = (n: number, kind: PartnerApplication['interview'] extends infer I ? (I extends { events: (infer E)[] } ? E extends { kind: infer K } ? K : never : never) : never, at: string, byName = 'Prashant Vasant Wable', note?: string) => ({ id: `ivev-seed-${n}`, at, kind, byName, ...(note ? { note } : {}) });
  const rec = (status: 'passed' | 'failed' | 'conditional', hoursBack: number, over: Record<string, unknown> = {}) => ({ status, method: 'manual' as const, at: hoursAgo(hoursBack), byName: 'Prashant Vasant Wable', history: [], ...over });
  const base = (invitedHoursAgo: number, modes: ('phone' | 'video' | 'in_person')[] = ['phone', 'video']) => ({ modes, details: modes.includes('video') ? { videoLink: 'https://meet.example.com/aiec-interview' } : {}, invitedAt: hoursAgo(invitedHoursAgo), invitedByName: 'Prashant Vasant Wable', misses: 0, reschedules: 0, addenda: [], remindersSent: [] as string[] });
  return [
    mk(1, 'Sunil Kamble', 'technician', 150, [100, 85, 80, 90, 100], { rating: 'strong', note: 'Leads installs unaided; no rework in six jobs.' }),
    mk(2, 'Ajay Shinde', 'technician', 140, [100, 80, 60, 70, 100], { rating: 'strong' }),
    mk(3, 'Neha Patil', 'surveyor', 130, [100, 70, 90, 80, 85], { rating: 'strong', note: 'Converting well in Kharadi.' }),
    mk(4, 'Dinesh Rane', 'technician', 120, [100, 55, 70, 60, 50], { rating: 'steady' }),
    mk(5, 'Pravin Chavan', 'technician', 110, [85, 30, 80, 70, 50], { rating: 'weak', note: 'Struggled with electrical checks; moved to helper work.' }),
    mk(6, 'Rekha Mane', 'surveyor', 100, [100, 35, 50, 40, 20], { rating: 'weak', note: 'Few surveys completed in her first months.' }),
    mk(7, 'Santosh Jagtap', 'technician', 50, [100, 60, 70, 80, 100]),
    mk(8, 'Vijay Salunke', 'technician', 90, [70, 20, 40, 30, 0], undefined, 'incomplete_details'),
    mk(9, 'Manoj Thakur', 'surveyor', 80, [100, 50, 20, 70, 50], undefined, 'area_covered'),
    mk(10, 'Girish Apte', 'technician', 70, [100, 30, 80, 60, 50], undefined, 'more_experience'),
    // Approved and on to the interview step (144): one of each kind of state, relative to now.
    mk(11, 'Sachin Bhosale', 'technician', 1, [100, 65, 83, 80, 100], undefined, undefined, {}),
    mk(12, 'Meghna Kulkarni', 'surveyor', 2, [100, 72, 100, 70, 85], undefined, undefined, { interview: { status: 'invited', ...base(30), events: [ev(1, 'invited', hoursAgo(30))] } }),
    (() => {
      const sl = slot(1, 11);
      return mk(13, 'Tushar Pawar', 'technician', 3, [100, 60, 67, 80, 100], undefined, undefined, { interview: { status: 'scheduled', ...base(50, ['phone']), slot: { ...sl, mode: 'phone', chosenAt: hoursAgo(20), chosenBy: 'applicant' }, events: [ev(2, 'invited', hoursAgo(50)), ev(3, 'slot_chosen', hoursAgo(20), 'Tushar Pawar')] }, verification: { autoSent: ['identity'], events: [], records: { identity: rec('passed', 40, { method: 'third_party', byName: 'AIEC', reference: 'IDV-1913-1234', note: 'verified' }), 'skill:mechanical': rec('passed', 30, { how: 'practical_test', note: 'Did a short practical on a door operator and explained the safety circuit correctly.' }), insurance: rec('conditional', 28, { note: 'The insurer is still processing his policy after a change of employer; he has the receipt.', conditional: { dueAt: new Date(Date.now() + 9 * 86_400_000).toISOString(), reason: 'The insurer is still processing his policy after a change of employer; he has the receipt.', grantedBy: 'Prashant Vasant Wable', at: hoursAgo(28) } }) } } });
    })(),
    (() => {
      const start = new Date(Date.now() - 3 * 3_600_000);
      return mk(14, 'Omkar Jadhav', 'technician', 3, [100, 55, 100, 90, 50], undefined, undefined, { interview: { status: 'scheduled', ...base(80, ['phone']), slot: { start: start.toISOString(), end: new Date(start.getTime() + 20 * 60_000).toISOString(), mode: 'phone', chosenAt: hoursAgo(40), chosenBy: 'applicant' }, events: [ev(4, 'invited', hoursAgo(80)), ev(5, 'slot_chosen', hoursAgo(40), 'Omkar Jadhav')] }, verification: { autoSent: ['identity'], events: [], records: { identity: rec('passed', 36, { how: 'online_registry', serviceDown: true, note: 'The ID service was down; checked the PAN on the income tax portal myself and the name matches the surname.' }) } } });
    })(),
    (() => {
      const sl = slot(-4, 11);
      return mk(15, 'Anjali Rao', 'surveyor', 6, [100, 80, 83, 90, 100], undefined, undefined, { interview: { status: 'completed', ...base(140), slot: { ...sl, mode: 'video', chosenAt: hoursAgo(120), chosenBy: 'applicant' }, completed: { at: sl.end, byName: 'Prashant Vasant Wable', ratings: { communication: 'clear', reliability: 'clear', experience: 'confirmed' }, note: 'Clear, organised and knows the housing societies in Kharadi well. Already has two committees waiting for a lift quote.', outcome: 'recommend' }, events: [ev(6, 'invited', hoursAgo(140)), ev(7, 'slot_chosen', hoursAgo(120), 'Anjali Rao'), ev(8, 'completed', sl.end)] }, verification: { autoSent: ['identity'], events: [], records: { identity: rec('passed', 100, { method: 'third_party', byName: 'AIEC', reference: 'IDV-1915-2201', note: 'verified' }), licence: rec('passed', 90, { how: 'saw_original', note: 'Saw the original licence at the interview; valid for two-wheelers.' }), reference: rec('passed', 80, { how: 'called_issuer', note: 'Called her former sales head, who confirmed her record and that she left on good terms.' }) } }, offer: { status: 'sent', documentNo: 'AIEC-PA-1001', role: 'surveyor', templateId: 'pat-surveyor-1', templateVersion: 1, wording: 'v1', terms: { conversionPct: 1.5, closePct: 0.5, territoryZoneIds: ['z-kharadi'] }, requests: [{ id: 'ofreq-seed-1', at: hoursAgo(30), text: 'I already have two housing societies in Kharadi waiting for a lift quote, so I would like to talk about a higher conversion share on those.' }], gateAtPrepare: 'clear', preparedAt: hoursAgo(100), preparedByName: 'Prashant Vasant Wable', sentAt: hoursAgo(96), events: [{ id: 'ofev-seed-1', at: hoursAgo(100), kind: 'prepared', byName: 'Prashant Vasant Wable', note: 'v1' }, { id: 'ofev-seed-2', at: hoursAgo(96), kind: 'sent', byName: 'Prashant Vasant Wable' }, { id: 'ofev-seed-3', at: hoursAgo(30), kind: 'request', byName: 'Anjali Rao' }] } });
    })(),
    (() => {
      const sl = slot(-5, 10, 30);
      return mk(16, 'Farhan Sheikh', 'technician', 7, [100, 70, 83, 60, 50], undefined, undefined, { interview: { status: 'completed', ...base(170, ['phone']), slot: { ...sl, mode: 'phone', chosenAt: hoursAgo(150), chosenBy: 'applicant' }, completed: { at: sl.end, byName: 'Prashant Vasant Wable', ratings: { communication: 'concern', reliability: 'ok', experience: 'confirmed' }, note: 'Strong on the mechanical side and answered the technical questions well, but was hard to follow on the phone and kept dropping the line.', concern: { category: 'communication', text: 'Hard to understand on a call; may struggle reporting problems clearly from site. Worth a second short call before an offer.' }, outcome: 'hold', outcomeReason: 'Technically good. Wants a second call to check how clearly he can report a problem before we decide.' }, addenda: [{ id: 'ivad-seed-1', at: hoursAgo(60), byName: 'Prashant Vasant Wable', text: 'His reference said he left the previous job at short notice without handing over.', concern: { category: 'reliability', text: 'His former supervisor said he left his last job at short notice without a handover. Ask him about it.' } }], events: [ev(9, 'invited', hoursAgo(170)), ev(10, 'slot_chosen', hoursAgo(150), 'Farhan Sheikh'), ev(11, 'completed', sl.end), ev(12, 'addendum', hoursAgo(60), 'Prashant Vasant Wable', 'reliability')] }, verification: { autoSent: ['identity'], events: [], records: { identity: rec('passed', 120, { method: 'third_party', byName: 'AIEC', reference: 'IDV-1916-3302', note: 'verified' }), reference: rec('failed', 55, { how: 'called_issuer', redFlag: true, note: 'His former supervisor said he left the last job at short notice without a handover and had been warned twice about turning up late to site.' }) } } });
    })(),
    mk(17, 'Rajesh Kamat', 'technician', 4, [100, 50, 67, 70, 50], undefined, undefined, { interview: { status: 'missed', ...base(100, ['phone']), misses: 1, events: [ev(13, 'invited', hoursAgo(100)), ev(14, 'slot_chosen', hoursAgo(80), 'Rajesh Kamat'), ev(15, 'missed', hoursAgo(26))] } }),
    mk(19, 'Pooja Nair', 'surveyor', 3, [100, 78, 83, 85, 100], undefined, undefined, { interview: { status: 'skipped', ...base(60), skipped: { at: hoursAgo(58), byName: 'Prashant Vasant Wable', reason: 'Referred and already known to our surveyors.' }, events: [ev(17, 'skipped', hoursAgo(58), 'Prashant Vasant Wable', 'Referred and already known to our surveyors.')] }, verification: { autoSent: ['identity'], events: [], records: { identity: rec('passed', 50, { method: 'third_party', byName: 'AIEC', reference: 'IDV-1919-5521', note: 'verified' }), licence: rec('passed', 48, { how: 'saw_original', note: 'Saw the original licence when she came to the office.' }), reference: rec('passed', 40, { how: 'called_issuer', note: 'Her previous manager confirmed three years in field sales with good results.' }) } } }),
    mk(20, 'Kiran Joshi', 'surveyor', 4, [100, 70, 67, 80, 100], undefined, undefined, { interview: { status: 'skipped', ...base(90), skipped: { at: hoursAgo(88), byName: 'Prashant Vasant Wable', reason: 'Referred and already known to our surveyors.' }, events: [ev(18, 'skipped', hoursAgo(88), 'Prashant Vasant Wable', 'Referred and already known to our surveyors.')] }, verification: { autoSent: ['identity'], events: [], records: { identity: rec('passed', 80, { method: 'third_party', byName: 'AIEC', reference: 'IDV-1920-1100', note: 'verified' }), licence: rec('passed', 78, { how: 'saw_original', note: 'Saw the original licence at the office.' }), reference: rec('passed', 76, { how: 'called_issuer', note: 'His previous manager confirmed two years of steady field sales.' }) } } }),
    mk(21, 'Smita Bhide', 'surveyor', 12, [100, 66, 67, 75, 100], undefined, undefined, { interview: { status: 'skipped', ...base(250), skipped: { at: hoursAgo(246), byName: 'Prashant Vasant Wable', reason: 'Referred and already known to our surveyors.' }, events: [ev(19, 'skipped', hoursAgo(246), 'Prashant Vasant Wable', 'Referred and already known to our surveyors.')] }, verification: { autoSent: ['identity'], events: [], records: { identity: rec('passed', 230, { method: 'third_party', byName: 'AIEC', reference: 'IDV-1921-1200', note: 'verified' }), licence: rec('passed', 228, { how: 'saw_original', note: 'Saw the original licence.' }), reference: rec('passed', 226, { how: 'called_issuer', note: 'Her former employer confirmed her record.' }) } }, waitlist: { at: daysAgo(10), byName: 'Prashant Vasant Wable', reason: 'Qualified, but her chosen area already has all the surveyors its leads can keep busy.' } }),
    mk(18, 'Nikhil Sawant', 'surveyor', 2, [100, 75, 83, 80, 100], undefined, undefined, { interview: { status: 'skipped', ...base(20), skipped: { at: hoursAgo(20), byName: 'Prashant Vasant Wable', reason: 'Referred by a current surveyor who has worked with him for years.' }, events: [ev(16, 'skipped', hoursAgo(20), 'Prashant Vasant Wable', 'Referred by a current surveyor who has worked with him for years.')] } }),
  ].map((a) => {
    // Nikhil gave no identity number, which the ID service cannot decide on: his is left for Admin to check by hand. Rajesh's PAN does not match his name, so the service fails it.
    if (a.id === 'ap-h18') return { ...a, form: { ...a.form, identity: { ...a.form.identity, panNumber: '', panDoc: null } } };
    if (a.id === 'ap-h17') return { ...a, form: { ...a.form, identity: { ...a.form.identity, panNumber: 'ABCPM1234Z' } } };
    if (a.id === 'ap-h20' || a.id === 'ap-h21') return { ...a, form: { ...a.form, territory: { ...a.form.territory, zoneIds: ['z-pimpri'] } } };
    // The first people screened (h1–h7) became partners before accounts were created through this app: their checks and signed agreements are kept
    // as history, without an account record here.
    const n = Number(a.id.replace('ap-h', ''));
    if (n >= 1 && n <= 7) {
      const decided = new Date((a.screening as NonNullable<typeof a.screening>).decision!.at).getTime();
      const at = (days: number) => new Date(decided + days * 86_400_000).toISOString();
      const keys = a.role === 'technician' ? ['identity', 'skill:mechanical', 'insurance', 'reference'] : ['identity', 'licence', 'reference'];
      const records = Object.fromEntries(keys.map((k, i) => [k, { status: 'passed' as const, method: 'manual' as const, at: at(1 + i * 0.2), byName: 'Prashant Vasant Wable', note: 'Checked at the time of joining.', history: [] }]));
      const name = a.form.personal.fullName;
      const steps = { bank: { done: true, at: at(8), byName: 'Prashant Vasant Wable' }, photo: n === 6 ? { done: false } : { done: true, at: at(8), byName: 'Prashant Vasant Wable' } };
      return {
        ...a,
        verification: { records, autoSent: ['identity'], events: [] },
        offer: { status: 'signed' as const, documentNo: `AIEC-PA-09${n}`, role: a.role, templateId: `pat-${a.role}-1`, templateVersion: 1, wording: 'v1' as const, terms: { ...seedDefaultTerms(a.role), territoryZoneIds: ['z-hinjawadi'] }, requests: [], gateAtPrepare: 'clear' as const, preparedAt: at(2), preparedByName: 'Prashant Vasant Wable', sentAt: at(3), signature: { at: at(6), method: 'typed' as const, data: name, signerName: name, language: 'en' as const, otpVerified: true, viaFallback: false, consentGiven: true }, activation: { at: at(6), userId: `u-hist-${n}`, steps }, events: [] },
      };
    }
    return a;
  });
}

export const seedPartnerApplications: PartnerApplication[] = [
  {
    id: 'ap-1',
    code: 'AIEC-AP-2001',
    interestId: 'ri-1',
    accessKey: 'demo-key-1',
    role: 'technician',
    status: 'submitted',
    startedAt: hoursAgo(139),
    updatedAt: hoursAgo(100),
    submittedAt: hoursAgo(100),
    form: apForm({
      personal: { fullName: 'Rahul Jadhav', phone: '9890011101', city: 'Pune', address: 'Wakad, Pune', dob: '1994-03-12', languages: ['mr', 'hi'] },
      experience: { years: '3_5', skills: ['mechanical', 'electrical'], sectors: [], summary: 'Four years fitting door operators and wiring controls for a local lift installer.' },
      territory: { zoneIds: ['z-hinjawadi'], travelKm: '20', ownTransport: true },
      availability: { days: [1, 2, 3, 4, 5, 6], timeOfDay: 'full_day', hoursPerWeek: '40', earliestStart: '2026-10-05' },
      identity: { aadhaarNumber: '', aadhaarLast4: '', aadhaarChecked: false, aadhaarDoc: null, panNumber: 'ABCPJ1234K', panDoc: apDoc('pan-rahul.jpg'), gstin: '', gstDoc: null },
      references: [
        { id: 'rf-1', name: 'Suresh Kale', phone: '9890022201', relationship: 'Former supervisor', organisation: 'Kale Lift Services', outcome: { status: 'verified', at: hoursAgo(60), byName: 'Prashant Vasant Wable', note: 'Confirmed four years and good timekeeping.' } },
        { id: 'rf-2', name: 'Anil Deshmukh', phone: '9890022202', relationship: 'Site engineer', organisation: 'Shree Builders', },
      ],
    }),
    events: [],
    messages: [],
    isDemo: true,
  },
  {
    id: 'ap-2',
    code: 'AIEC-AP-2002',
    interestId: 'ri-2',
    accessKey: 'demo-key-2',
    role: 'surveyor',
    status: 'draft',
    startedAt: hoursAgo(120),
    updatedAt: hoursAgo(118),
    form: apForm({ personal: { fullName: 'Sneha Kulkarni', phone: '9890011102', city: 'Pune', address: '', dob: '', languages: ['mr'] } }),
    events: [],
    messages: [],
    isDemo: true,
  },
  {
    id: 'ap-3',
    code: 'AIEC-AP-2003',
    interestId: 'ri-3',
    accessKey: 'demo-key-3',
    role: 'technician',
    status: 'submitted',
    startedAt: hoursAgo(90),
    updatedAt: hoursAgo(80),
    submittedAt: hoursAgo(80),
    form: apForm({
      personal: { fullName: 'Mahesh Pawar', phone: '9890011103', city: 'Pimpri-Chinchwad', address: '', dob: '', languages: ['mr'] },
      experience: { years: '1_3', skills: [], sectors: [], summary: 'I have helped on lift installations for two years without a certificate, mostly guide rails and cabin fitting.' },
      territory: { zoneIds: ['z-pimpri'], travelKm: '10', ownTransport: false },
      availability: { days: [1, 2, 3, 4, 5], timeOfDay: 'mornings', hoursPerWeek: '20', earliestStart: '2026-10-12' },
      identity: { aadhaarNumber: '', aadhaarLast4: '', aadhaarChecked: false, aadhaarDoc: null, panNumber: 'AAAPM2345L', panDoc: apDoc('pan-mahesh.jpg'), gstin: '', gstDoc: null },
      references: [{ id: 'rf-3', name: 'Ramesh Pawar', phone: '9890022203', relationship: 'Previous employer', organisation: '', outcome: { status: 'unreachable', at: hoursAgo(40), byName: 'Prashant Vasant Wable', note: 'Phone off on two attempts.' } }],
    }),
    events: [],
    messages: [],
    isDemo: true,
  },
  // Further applications waiting for a first look (143), a spread so the ranking has something to say.
  {
    id: 'ap-4',
    code: 'AIEC-AP-2004',
    interestId: '',
    accessKey: 'demo-key-4',
    role: 'surveyor',
    status: 'submitted',
    startedAt: hoursAgo(60),
    updatedAt: hoursAgo(30),
    submittedAt: hoursAgo(30),
    form: apForm({
      personal: { fullName: 'Priya Deshpande', phone: '9890011110', city: 'Pune', address: 'Viman Nagar, Pune', dob: '1992-07-21', languages: ['en', 'mr', 'hi'] },
      experience: { years: 'over_5', skills: [], sectors: ['real_estate', 'elevators'], summary: 'Seven years selling flats and, for the last two, lift packages to housing societies, with a steady monthly close rate and my own list of society committees across Kharadi and Viman Nagar.' },
      territory: { zoneIds: ['z-kharadi'], travelKm: '20', ownTransport: true },
      availability: { days: [1, 2, 3, 4, 5, 6], timeOfDay: 'full_day', hoursPerWeek: '40', earliestStart: addDaysKey(dateKey(new Date()), 7) },
      identity: { aadhaarNumber: '', aadhaarLast4: '', aadhaarChecked: false, aadhaarDoc: null, panNumber: 'BCDPD4567E', panDoc: apDoc('pan-priya.jpg'), gstin: '', gstDoc: null },
      references: [
        { id: 'rf-4', name: 'Nitin Phadke', phone: '9890022204', relationship: 'Former sales head', organisation: 'Horizon Realty', outcome: { status: 'verified', at: hoursAgo(12), byName: 'Prashant Vasant Wable', note: 'Strong closer, left on good terms.' } },
        { id: 'rf-5', name: 'Smita Kulkarni', phone: '9890022205', relationship: 'Society secretary', organisation: 'Orchid Heights CHS', outcome: { status: 'verified', at: hoursAgo(10), byName: 'Prashant Vasant Wable' } },
      ],
    }),
    events: [],
    messages: [],
    isDemo: true,
  },
  {
    id: 'ap-5',
    code: 'AIEC-AP-2005',
    interestId: 'ri-5',
    accessKey: 'demo-key-5',
    role: 'supplier',
    status: 'submitted',
    startedAt: hoursAgo(70),
    updatedAt: hoursAgo(50),
    submittedAt: hoursAgo(50),
    form: apForm({
      personal: { fullName: 'Imran Shaikh', phone: '9890011105', city: 'Pune', address: 'Bhosari MIDC, Pune', dob: '', languages: ['en', 'hi'] },
      experience: { years: '3_5', skills: ['door_operator', 'vfd'], sectors: [], summary: 'We assemble and supply door operators and VFD drives for lift installers across Pune and Nashik, with a small test bench of our own.' },
      territory: { zoneIds: ['z-pimpri'], travelKm: '40', ownTransport: true },
      availability: { days: [1, 2, 3, 4, 5, 6], timeOfDay: 'full_day', hoursPerWeek: '40', earliestStart: addDaysKey(dateKey(new Date()), 10) },
      identity: { aadhaarNumber: '', aadhaarLast4: '', aadhaarChecked: false, aadhaarDoc: null, panNumber: '', panDoc: null, gstin: '27AAACS7788K1Z4', gstDoc: apDoc('gst-shaikh.pdf') },
      references: [{ id: 'rf-6', name: 'Dilip Kamble', phone: '9890022206', relationship: 'Customer', organisation: 'Kamble Lifts', }],
    }),
    events: [],
    messages: [],
    isDemo: true,
  },
  {
    id: 'ap-6',
    code: 'AIEC-AP-2006',
    interestId: '',
    accessKey: 'demo-key-6',
    role: 'technician',
    status: 'submitted',
    startedAt: hoursAgo(140),
    updatedAt: hoursAgo(120),
    submittedAt: hoursAgo(120),
    form: apForm({
      personal: { fullName: 'Rohan Gaikwad', phone: '9890011111', city: 'Pune', address: '', dob: '2003-01-15', languages: ['mr'] },
      experience: { years: 'none', skills: ['mechanical'], sectors: [], summary: 'Just finished my ITI in fitter trade and would like to learn lift installation.' },
      territory: { zoneIds: ['z-hinjawadi'], travelKm: '10', ownTransport: false },
      availability: { days: [1, 2, 3, 4, 5, 6], timeOfDay: 'full_day', hoursPerWeek: '40', earliestStart: addDaysKey(dateKey(new Date()), 5) },
      identity: { aadhaarNumber: '', aadhaarLast4: '', aadhaarChecked: false, aadhaarDoc: null, panNumber: 'CDEPG5678F', panDoc: apDoc('pan-rohan.jpg'), gstin: '', gstDoc: null },
      noReferences: true,
    }),
    events: [],
    messages: [],
    isDemo: true,
  },
  {
    id: 'ap-7',
    code: 'AIEC-AP-2007',
    interestId: '',
    accessKey: 'demo-key-7',
    role: 'surveyor',
    status: 'info_requested',
    startedAt: hoursAgo(100),
    updatedAt: hoursAgo(20),
    submittedAt: hoursAgo(90),
    form: apForm({
      personal: { fullName: 'Kavita Joshi', phone: '9890011112', city: 'Pune', address: 'Kothrud, Pune', dob: '1996-11-02', languages: ['mr', 'hi'] },
      experience: { years: '1_3', skills: [], sectors: ['other_sales'], summary: 'Sold insurance and home loans for two years.' },
      territory: { zoneIds: ['z-hinjawadi'], travelKm: '10', ownTransport: true },
      availability: { days: [1, 2, 3, 4, 5], timeOfDay: 'afternoons', hoursPerWeek: '20', earliestStart: addDaysKey(dateKey(new Date()), 14) },
      identity: { aadhaarNumber: '', aadhaarLast4: '', aadhaarChecked: false, aadhaarDoc: null, panNumber: 'DEFPJ6789G', panDoc: apDoc('pan-kavita.jpg'), gstin: '', gstDoc: null },
      noReferences: true,
    }),
    events: [],
    messages: [{ id: 'apm-seed-1', at: hoursAgo(20), kind: 'info_request', templateKey: 'screening.message.infoRequest', params: { name: 'Kavita' }, note: 'Please tell us a little more about the kind of customers you sold to and how many you closed in a typical month.', byName: 'Prashant Vasant Wable' }],
    screening: { infoRequest: { sections: ['experience'], note: 'Please tell us a little more about the kind of customers you sold to and how many you closed in a typical month.', at: hoursAgo(20), byName: 'Prashant Vasant Wable' } },
    isDemo: true,
  },
  ...screenedHistory(),
];
