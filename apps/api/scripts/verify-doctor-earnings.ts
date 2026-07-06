import assert from 'node:assert/strict';
import {
  computeDoctorShareAmount,
  parsePaymentFeeBreakdown
} from '../src/services/doctor-earnings.js';

function testParsePaymentFeeBreakdown() {
  const legacy = parsePaymentFeeBreakdown(
    { diseaseFeeInPaise: 49900, diseaseName: 'Hair fall' },
    49900
  );
  assert.equal(legacy.consultationFeeInPaise, 49900);
  assert.equal(legacy.medicineFeeInPaise, 0);

  const split = parsePaymentFeeBreakdown(
    { consultationFeeInPaise: 30000, medicineFeeInPaise: 15000 },
    45000
  );
  assert.equal(split.consultationFeeInPaise, 30000);
  assert.equal(split.medicineFeeInPaise, 15000);

  const inferredMedicine = parsePaymentFeeBreakdown(
    { consultationFeeInPaise: 40000 },
    55000
  );
  assert.equal(inferredMedicine.consultationFeeInPaise, 40000);
  assert.equal(inferredMedicine.medicineFeeInPaise, 15000);

  const planOnly = parsePaymentFeeBreakdown(
    { selectedPlanPriceInPaise: 350000, purchaseType: 'PLAN' },
    350000
  );
  assert.equal(planOnly.consultationFeeInPaise, 350000);
  assert.equal(planOnly.medicineFeeInPaise, 0);

  const empty = parsePaymentFeeBreakdown(null, 12000);
  assert.equal(empty.consultationFeeInPaise, 12000);
  assert.equal(empty.medicineFeeInPaise, 0);
}

function testShareMath() {
  assert.equal(computeDoctorShareAmount(100000, 60), 60000);
  assert.equal(computeDoctorShareAmount(0, 60), 0);
  assert.equal(computeDoctorShareAmount(333, 60), 200);
}

testParsePaymentFeeBreakdown();
testShareMath();

console.log('doctor-earnings verification passed');
