/** Mirrors apps/api/src/dev/demo-manifest.ts — keep in sync for dev helpers. */
export const DEV_DEMO_ACCOUNTS = {
  password: 'Password@123',
  otp: '123456',
  deliveryOtp: '123456',
  patientMobile: '9876543210',
  hr: { email: 'hr@vitalisclinic.local' },
  receptionist: { email: 'reception@vitalisclinic.local' },
  clinicManager: { email: 'clinic@vitalisclinic.local' },
  accountant: { email: 'accountant@vitalisclinic.local' },
  supplier: { email: 'supplier@vitalisclinic.local' },
  warehouse: { email: 'warehouse@vitalisclinic.local' },
  delivery: { email: 'delivery@vitalisclinic.local' },
  diagnostic: { email: 'lab@vitalisclinic.local' },
  branchOwner: { email: 'owner@vitalisclinic.local' },
  coordinator: { email: 'coordinator@vitalisclinic.local' },
  callCenter: { email: 'callcenter@vitalisclinic.local' },
  marketing: { email: 'marketing@vitalisclinic.local' },
  corporate: { email: 'corporate@vitalisclinic.local' },
  insurance: { email: 'insurance@vitalisclinic.local' },
  storeManager: { email: 'manager@ranchi.vitalis.local' },
  storeStaff: { email: 'staff@ranchi.vitalis.local', staffCode: 'RNC-STF1' }
} as const;
