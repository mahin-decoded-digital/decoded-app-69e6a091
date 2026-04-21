import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  defaultAttendees,
  defaultAuditLogs,
  defaultBehaviorEvents,
  defaultSwingers,
  defaultVenueQRs,
  defaultWallets,
} from '@/lib/data';
import { createId } from '@/lib/helpers';
import type {
  Attendee,
  AuditLog,
  BehaviorEvent,
  RewardType,
  StaffUser,
  SwingerRecord,
  UserRole,
  VenueQR,
  Wallet,
  WalletTransaction,
} from '@/types/models';

interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  anonymous: boolean;
  role: UserRole;
}

interface TokenAllocationPayload {
  attendeeId: string;
  amount: number;
  note: string;
  staff: StaffUser;
}

interface ScanPayload {
  attendeeId: string;
  qrId: string;
  staff?: StaffUser;
}

interface RedeemPayload {
  attendeeId: string;
  amount: number;
  rewardLabel: string;
  staff: StaffUser;
}

interface SwingerPayload {
  attendeeId: string;
  rewardType: RewardType;
  tokenValue: number;
  staff: StaffUser;
}

interface RaceQRState {
  attendees: Attendee[];
  wallets: Wallet[];
  venueQrs: VenueQR[];
  behaviorEvents: BehaviorEvent[];
  swingers: SwingerRecord[];
  auditLogs: AuditLog[];
  activeAttendeeId: string | null;
  registerAttendee: (payload: RegisterPayload) => Attendee;
  setActiveAttendee: (attendeeId: string | null) => void;
  checkInReturning: (identifier: string) => { success: boolean; message: string; attendeeId?: string };
  allocateTokens: (payload: TokenAllocationPayload) => { success: boolean; message: string };
  scanVenueQr: (payload: ScanPayload) => { success: boolean; message: string };
  issueSwinger: (payload: SwingerPayload) => { success: boolean; message: string };
  redeemSwinger: (swingerId: string, convertToTokens: boolean, staff: StaffUser) => { success: boolean; message: string };
  redeemTokens: (payload: RedeemPayload) => { success: boolean; message: string };
  getAttendeeById: (id: string) => Attendee | undefined;
  getWalletByAttendeeId: (attendeeId: string) => Wallet | undefined;
}

export const useRaceQRStore = create<RaceQRState>()(
  persist(
    (set, get) => ({
      attendees: defaultAttendees,
      wallets: defaultWallets,
      venueQrs: defaultVenueQRs,
      behaviorEvents: defaultBehaviorEvents,
      swingers: defaultSwingers,
      auditLogs: defaultAuditLogs,
      activeAttendeeId: defaultAttendees[0]?.id ?? null,
      registerAttendee: ({ name, email, phone, anonymous, role }) => {
        const attendeeId = createId('att');
        const walletId = createId('wallet');
        const attendeeName = anonymous ? `Anonymous Guest #${Math.floor(Math.random() * 1000)}` : name.trim();
        const attendee: Attendee = {
          id: attendeeId,
          walletId,
          registrationType: anonymous ? 'anonymous' : 'named',
          name: attendeeName,
          email: anonymous ? '' : email.trim(),
          phone: anonymous ? '' : phone.trim(),
          role,
          createdAt: new Date().toISOString(),
          lastCheckInAt: new Date().toISOString(),
          status: 'checked-in',
          tags: anonymous ? ['anonymous'] : ['registered'],
        };
        const welcomeTransaction: WalletTransaction = {
          id: createId('txn'),
          walletId,
          attendeeId,
          type: 'credit',
          amount: 5,
          tokenValue: 1,
          source: 'Welcome bonus',
          note: 'New registration incentive issued at entrance.',
          createdAt: new Date().toISOString(),
          createdBy: 'system',
        };
        const wallet: Wallet = {
          id: walletId,
          attendeeId,
          balance: 5,
          tokenValue: 1,
          history: [welcomeTransaction],
        };
        const event: BehaviorEvent = {
          id: createId('evt'),
          attendeeId,
          attendeeName,
          qrId: 'qr-new-entry',
          qrLabel: 'Entrance QR · New Registration',
          actionType: 'registration',
          timestamp: new Date().toISOString(),
          tokenDelta: 5,
          notes: 'Registered through new user entrance flow.',
        };

        set((state) => ({
          attendees: [attendee, ...state.attendees],
          wallets: [wallet, ...state.wallets],
          behaviorEvents: [event, ...state.behaviorEvents],
          activeAttendeeId: attendeeId,
        }));
        return attendee;
      },
      setActiveAttendee: (attendeeId) => set({ activeAttendeeId: attendeeId }),
      checkInReturning: (identifier) => {
        const normalized = identifier.trim().toLowerCase();
        const attendee = get().attendees.find((item) => {
          const email = item.email ? item.email.toLowerCase() : '';
          const phone = item.phone ? item.phone.toLowerCase() : '';
          const name = item.name ? item.name.toLowerCase() : '';
          return email === normalized || phone === normalized || name === normalized;
        });

        if (!attendee) {
          return { success: false, message: 'No attendee found. Use the new registration QR instead.' };
        }

        const event: BehaviorEvent = {
          id: createId('evt'),
          attendeeId: attendee.id,
          attendeeName: attendee.name,
          qrId: 'qr-returning-entry',
          qrLabel: 'Entrance QR · Returning Check-In',
          actionType: 'check-in',
          timestamp: new Date().toISOString(),
          tokenDelta: 0,
          notes: 'Returning attendee checked in at the entrance.',
        };

        set((state) => ({
          attendees: state.attendees.map((item) =>
            item.id === attendee.id
              ? { ...item, lastCheckInAt: event.timestamp, status: 'checked-in' }
              : item,
          ),
          behaviorEvents: [event, ...state.behaviorEvents],
          activeAttendeeId: attendee.id,
        }));

        return { success: true, message: `${attendee.name} checked in successfully.`, attendeeId: attendee.id };
      },
      allocateTokens: ({ attendeeId, amount, note, staff }) => {
        if (amount <= 0) {
          return { success: false, message: 'Enter a valid token amount.' };
        }

        const attendee = get().attendees.find((item) => item.id === attendeeId);
        const wallet = get().wallets.find((item) => item.attendeeId === attendeeId);
        if (!attendee || !wallet) {
          return { success: false, message: 'Attendee wallet could not be found.' };
        }

        const transaction: WalletTransaction = {
          id: createId('txn'),
          walletId: wallet.id,
          attendeeId,
          type: 'credit',
          amount,
          tokenValue: wallet.tokenValue,
          source: 'Staff allocation',
          note,
          createdAt: new Date().toISOString(),
          createdBy: staff.id,
        };
        const event: BehaviorEvent = {
          id: createId('evt'),
          attendeeId,
          attendeeName: attendee.name,
          qrId: 'manual-allocation',
          qrLabel: 'Manual token allocation',
          actionType: 'token-allocation',
          timestamp: transaction.createdAt,
          tokenDelta: amount,
          notes: note,
          handledByStaffId: staff.id,
        };
        const audit: AuditLog = {
          id: createId('audit'),
          actorId: staff.id,
          actorName: staff.name,
          actorRole: staff.role,
          action: 'allocate_tokens',
          targetType: 'wallet',
          targetId: wallet.id,
          details: `Allocated ${amount} tokens to ${attendee.name}. ${note}`,
          createdAt: transaction.createdAt,
        };

        set((state) => ({
          wallets: state.wallets.map((item) =>
            item.id === wallet.id
              ? { ...item, balance: item.balance + amount, history: [transaction, ...item.history] }
              : item,
          ),
          behaviorEvents: [event, ...state.behaviorEvents],
          auditLogs: [audit, ...state.auditLogs],
        }));

        return { success: true, message: `${amount} tokens allocated to ${attendee.name}.` };
      },
      scanVenueQr: ({ attendeeId, qrId, staff }) => {
        const attendee = get().attendees.find((item) => item.id === attendeeId);
        const qr = get().venueQrs.find((item) => item.id === qrId);
        const wallet = get().wallets.find((item) => item.attendeeId === attendeeId);
        if (!attendee || !qr) {
          return { success: false, message: 'Attendee or QR checkpoint not found.' };
        }

        const isAllowed = qr.accessRoles.includes(attendee.role) || attendee.role === 'staff';
        const timestamp = new Date().toISOString();
        const eventType = isAllowed ? (qr.type === 'exit' ? 'check-out' : 'qr-scan') : 'access-denied';
        const tokenDelta = isAllowed ? qr.tokenReward : 0;
        const event: BehaviorEvent = {
          id: createId('evt'),
          attendeeId,
          attendeeName: attendee.name,
          qrId: qr.id,
          qrLabel: qr.label,
          actionType: eventType,
          timestamp,
          tokenDelta,
          notes: isAllowed
            ? `Scanned ${qr.label} at ${qr.location}.`
            : `${attendee.role} is not permitted to access ${qr.label}.`,
          handledByStaffId: staff?.id,
        };

        const audit: AuditLog | null = staff
          ? {
              id: createId('audit'),
              actorId: staff.id,
              actorName: staff.name,
              actorRole: staff.role,
              action: isAllowed ? 'access_granted' : 'access_denied',
              targetType: 'access',
              targetId: qr.id,
              details: `${attendee.name} scanned ${qr.label}. Result: ${isAllowed ? 'granted' : 'denied'}.`,
              createdAt: timestamp,
            }
          : null;

        set((state) => ({
          attendees: state.attendees.map((item) =>
            item.id === attendeeId
              ? {
                  ...item,
                  status: qr.type === 'exit' && isAllowed ? 'checked-out' : item.status,
                  lastCheckInAt: qr.type !== 'exit' && isAllowed ? timestamp : item.lastCheckInAt,
                }
              : item,
          ),
          wallets:
            tokenDelta > 0 && wallet
              ? state.wallets.map((item) => {
                  if (item.id !== wallet.id) {
                    return item;
                  }
                  const transaction: WalletTransaction = {
                    id: createId('txn'),
                    walletId: wallet.id,
                    attendeeId,
                    type: 'credit',
                    amount: tokenDelta,
                    tokenValue: wallet.tokenValue,
                    source: qr.label,
                    note: `Reward issued after scanning ${qr.label}.`,
                    createdAt: timestamp,
                    createdBy: staff?.id ?? 'system',
                  };
                  return {
                    ...item,
                    balance: item.balance + tokenDelta,
                    history: [transaction, ...item.history],
                  };
                })
              : state.wallets,
          behaviorEvents: [event, ...state.behaviorEvents],
          auditLogs: audit ? [audit, ...state.auditLogs] : state.auditLogs,
        }));

        return {
          success: isAllowed,
          message: isAllowed
            ? `${attendee.name} recorded at ${qr.label}${tokenDelta ? ` and earned ${tokenDelta} tokens.` : '.'}`
            : `${attendee.name} does not have access to ${qr.label}.`,
        };
      },
      issueSwinger: ({ attendeeId, rewardType, tokenValue, staff }) => {
        const attendee = get().attendees.find((item) => item.id === attendeeId);
        if (!attendee) {
          return { success: false, message: 'Attendee not found for swinger issuance.' };
        }
        if (attendee.role !== 'owner') {
          return { success: false, message: 'Only owners can be issued owner swingers in this workflow.' };
        }

        const swinger: SwingerRecord = {
          id: createId('swinger'),
          attendeeId,
          attendeeName: attendee.name,
          issuedByStaffId: staff.id,
          issuedAt: new Date().toISOString(),
          rewardType,
          tokenValue,
          redeemedAt: null,
          redeemedByStaffId: null,
          status: 'issued',
        };
        const audit: AuditLog = {
          id: createId('audit'),
          actorId: staff.id,
          actorName: staff.name,
          actorRole: staff.role,
          action: 'issue_swinger',
          targetType: 'swinger',
          targetId: swinger.id,
          details: `Issued ${rewardType} swinger to ${attendee.name}.`,
          createdAt: swinger.issuedAt,
        };
        const event: BehaviorEvent = {
          id: createId('evt'),
          attendeeId,
          attendeeName: attendee.name,
          qrId: 'qr-secretary',
          qrLabel: 'Secretary Office QR',
          actionType: 'swinger-issued',
          timestamp: swinger.issuedAt,
          tokenDelta: 0,
          notes: `${rewardType} swinger issued by secretary team.`,
          handledByStaffId: staff.id,
        };

        set((state) => ({
          swingers: [swinger, ...state.swingers],
          auditLogs: [audit, ...state.auditLogs],
          behaviorEvents: [event, ...state.behaviorEvents],
        }));

        return { success: true, message: `${attendee.name} received a new swinger.` };
      },
      redeemSwinger: (swingerId, convertToTokens, staff) => {
        const swinger = get().swingers.find((item) => item.id === swingerId);
        if (!swinger || swinger.status === 'redeemed') {
          return { success: false, message: 'Swinger has already been redeemed or does not exist.' };
        }

        const wallet = get().wallets.find((item) => item.attendeeId === swinger.attendeeId);
        const timestamp = new Date().toISOString();
        const audit: AuditLog = {
          id: createId('audit'),
          actorId: staff.id,
          actorName: staff.name,
          actorRole: staff.role,
          action: 'redeem_swinger',
          targetType: 'swinger',
          targetId: swinger.id,
          details: convertToTokens
            ? `Converted swinger ${swinger.id} into ${swinger.tokenValue} tokens.`
            : `Vendor fulfilled ${swinger.rewardType} for swinger ${swinger.id}.`,
          createdAt: timestamp,
        };
        const event: BehaviorEvent = {
          id: createId('evt'),
          attendeeId: swinger.attendeeId,
          attendeeName: swinger.attendeeName,
          qrId: 'qr-vendor-drinks',
          qrLabel: 'Vendor QR · Drinks',
          actionType: 'swinger-redeemed',
          timestamp,
          tokenDelta: convertToTokens ? swinger.tokenValue : 0,
          notes: convertToTokens
            ? 'Swinger stub converted to wallet tokens.'
            : `Swinger fulfilled as ${swinger.rewardType}.`,
          handledByStaffId: staff.id,
        };

        set((state) => ({
          swingers: state.swingers.map((item) =>
            item.id === swingerId
              ? { ...item, status: 'redeemed', redeemedAt: timestamp, redeemedByStaffId: staff.id }
              : item,
          ),
          wallets:
            convertToTokens && wallet
              ? state.wallets.map((item) => {
                  if (item.id !== wallet.id) {
                    return item;
                  }
                  const transaction: WalletTransaction = {
                    id: createId('txn'),
                    walletId: wallet.id,
                    attendeeId: swinger.attendeeId,
                    type: 'conversion',
                    amount: swinger.tokenValue,
                    tokenValue: wallet.tokenValue,
                    source: 'Swinger conversion',
                    note: 'Vendor converted detachable stub into wallet tokens.',
                    createdAt: timestamp,
                    createdBy: staff.id,
                  };
                  return {
                    ...item,
                    balance: item.balance + swinger.tokenValue,
                    history: [transaction, ...item.history],
                  };
                })
              : state.wallets,
          auditLogs: [audit, ...state.auditLogs],
          behaviorEvents: [event, ...state.behaviorEvents],
        }));

        return {
          success: true,
          message: convertToTokens
            ? `Swinger converted into ${swinger.tokenValue} tokens.`
            : 'Swinger reward redeemed successfully.',
        };
      },
      redeemTokens: ({ attendeeId, amount, rewardLabel, staff }) => {
        const attendee = get().attendees.find((item) => item.id === attendeeId);
        const wallet = get().wallets.find((item) => item.attendeeId === attendeeId);
        if (!attendee || !wallet) {
          return { success: false, message: 'Unable to locate wallet for redemption.' };
        }
        if (amount <= 0 || wallet.balance < amount) {
          return { success: false, message: 'Insufficient tokens for this redemption.' };
        }

        const timestamp = new Date().toISOString();
        const transaction: WalletTransaction = {
          id: createId('txn'),
          walletId: wallet.id,
          attendeeId,
          type: 'debit',
          amount,
          tokenValue: wallet.tokenValue,
          source: rewardLabel,
          note: `Redeemed for ${rewardLabel}.`,
          createdAt: timestamp,
          createdBy: staff.id,
        };
        const event: BehaviorEvent = {
          id: createId('evt'),
          attendeeId,
          attendeeName: attendee.name,
          qrId: 'qr-vendor-drinks',
          qrLabel: 'Vendor QR · Drinks',
          actionType: 'token-redemption',
          timestamp,
          tokenDelta: -amount,
          notes: `${rewardLabel} redeemed at vendor point.`,
          handledByStaffId: staff.id,
        };
        const audit: AuditLog = {
          id: createId('audit'),
          actorId: staff.id,
          actorName: staff.name,
          actorRole: staff.role,
          action: 'redeem_tokens',
          targetType: 'wallet',
          targetId: wallet.id,
          details: `${attendee.name} redeemed ${amount} tokens for ${rewardLabel}.`,
          createdAt: timestamp,
        };

        set((state) => ({
          wallets: state.wallets.map((item) =>
            item.id === wallet.id
              ? { ...item, balance: item.balance - amount, history: [transaction, ...item.history] }
              : item,
          ),
          behaviorEvents: [event, ...state.behaviorEvents],
          auditLogs: [audit, ...state.auditLogs],
        }));

        return { success: true, message: `${rewardLabel} redeemed for ${attendee.name}.` };
      },
      getAttendeeById: (id) => get().attendees.find((item) => item.id === id),
      getWalletByAttendeeId: (attendeeId) => get().wallets.find((item) => item.attendeeId === attendeeId),
    }),
    {
      name: 'raceqr-core-store',
      partialize: (state) => ({
        attendees: state.attendees,
        wallets: state.wallets,
        venueQrs: state.venueQrs,
        behaviorEvents: state.behaviorEvents,
        swingers: state.swingers,
        auditLogs: state.auditLogs,
        activeAttendeeId: state.activeAttendeeId,
      }),
    },
  ),
);
