import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuditLog, StaffUser } from '@/types/models';
import { defaultStaffUsers } from '@/lib/data';
import { createId } from '@/lib/helpers';

interface AuthState {
  staffUsers: StaffUser[];
  currentStaff: StaffUser | null;
  authError: string | null;
  auditTrail: AuditLog[];
  login: (email: string, password: string) => boolean;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  appendAudit: (log: AuditLog) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      staffUsers: defaultStaffUsers,
      currentStaff: null,
      authError: null,
      auditTrail: [],
      login: (email, password) => {
        const staff = get().staffUsers.find(
          (item) => item.email.toLowerCase() === email.toLowerCase().trim() && item.password === password,
        );

        if (!staff) {
          set({ authError: 'Invalid staff credentials. Try one of the demo accounts.' });
          return false;
        }

        const log: AuditLog = {
          id: createId('audit'),
          actorId: staff.id,
          actorName: staff.name,
          actorRole: staff.role,
          action: 'login',
          targetType: 'auth',
          targetId: staff.id,
          details: `${staff.name} logged into the staff console.`,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          currentStaff: staff,
          authError: null,
          auditTrail: [log, ...state.auditTrail],
        }));
        return true;
      },
      logout: () => {
        const currentStaff = get().currentStaff;
        if (currentStaff) {
          const log: AuditLog = {
            id: createId('audit'),
            actorId: currentStaff.id,
            actorName: currentStaff.name,
            actorRole: currentStaff.role,
            action: 'logout',
            targetType: 'auth',
            targetId: currentStaff.id,
            details: `${currentStaff.name} logged out of the staff console.`,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({ currentStaff: null, auditTrail: [log, ...state.auditTrail] }));
          return;
        }
        set({ currentStaff: null });
      },
      hasPermission: (permission) => {
        const currentStaff = get().currentStaff;
        if (!currentStaff) {
          return false;
        }
        return currentStaff.permissions.includes(permission);
      },
      appendAudit: (log) => {
        set((state) => ({ auditTrail: [log, ...state.auditTrail] }));
      },
    }),
    {
      name: 'raceqr-auth-store',
      partialize: (state) => ({
        currentStaff: state.currentStaff,
        auditTrail: state.auditTrail,
        staffUsers: state.staffUsers,
      }),
    },
  ),
);
