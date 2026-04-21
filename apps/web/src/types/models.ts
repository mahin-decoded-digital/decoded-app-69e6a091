export type UserRole = 'guest' | 'owner' | 'trainer' | 'stablehand' | 'staff';
export type StaffRole = 'manager' | 'gate' | 'secretary' | 'vendor';
export type RegistrationType = 'named' | 'anonymous';
export type UserStatus = 'active' | 'checked-in' | 'checked-out';
export type QRType =
  | 'entry-new'
  | 'entry-returning'
  | 'exit'
  | 'stables'
  | 'secretary-office'
  | 'owner-lounge'
  | 'vendor-drinks'
  | 'vendor-snacks'
  | 'survey';
export type EventActionType =
  | 'registration'
  | 'check-in'
  | 'check-out'
  | 'qr-scan'
  | 'token-allocation'
  | 'token-redemption'
  | 'swinger-issued'
  | 'swinger-redeemed'
  | 'access-granted'
  | 'access-denied';
export type TransactionType = 'credit' | 'debit' | 'conversion';
export type RewardType = 'drink' | 'snack' | 'tokens';

export interface Attendee {
  id: string;
  walletId: string;
  registrationType: RegistrationType;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
  lastCheckInAt: string | null;
  status: UserStatus;
  tags: string[];
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  attendeeId: string;
  type: TransactionType;
  amount: number;
  tokenValue: number;
  source: string;
  note: string;
  createdAt: string;
  createdBy: string;
}

export interface Wallet {
  id: string;
  attendeeId: string;
  balance: number;
  tokenValue: number;
  history: WalletTransaction[];
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: StaffRole;
  permissions: string[];
}

export interface VenueQR {
  id: string;
  label: string;
  type: QRType;
  location: string;
  description: string;
  tokenReward: number;
  accessRoles: UserRole[];
}

export interface BehaviorEvent {
  id: string;
  attendeeId: string;
  attendeeName: string;
  qrId: string;
  qrLabel: string;
  actionType: EventActionType;
  timestamp: string;
  tokenDelta: number;
  notes: string;
  handledByStaffId?: string;
}

export interface SwingerRecord {
  id: string;
  attendeeId: string;
  attendeeName: string;
  issuedByStaffId: string;
  issuedAt: string;
  rewardType: RewardType;
  tokenValue: number;
  redeemedAt: string | null;
  redeemedByStaffId: string | null;
  status: 'issued' | 'redeemed';
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: StaffRole;
  action: string;
  targetType: 'wallet' | 'attendee' | 'swinger' | 'access' | 'auth';
  targetId: string;
  details: string;
  createdAt: string;
}

export interface DashboardMetric {
  label: string;
  value: number;
  helper: string;
}
