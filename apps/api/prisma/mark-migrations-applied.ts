import { execSync } from 'node:child_process';

const cwd = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

const pending = [
  '20260703150000_supplier_portal',
  '20260703160000_materia_medica',
  '20260703160000_supplier_portal',
  '20260703170000_homeopathic_doctor_types',
  '20260703170000_warehouse_inventory',
  '20260703180000_delivery_executive',
  '20260703190000_diagnostic_portal',
  '20260703200000_admin_notifications',
  '20260703200000_clinical_media',
  '20260703210000_in_app_notifications',
  '20260703220000_ecosystem_roles',
  '20260706120000_optional_case_analysis_consultation',
  '20260706130000_staff_profiles',
  '20260706140000_employee_salary',
  '20260706150000_doctor_compensation',
  '20260706160000_doctor_default_approach',
  '20260706160000_stock_movement_prescription',
  '20260706170000_disease_location_fees',
  '20260707120000_clinical_media',
  '20260707120000_patient_profile_fields',
  '20260707130000_homeopathic_patient_profile',
  '20260707140000_patient_addresses',
  '20260707150000_rewards_referrals',
  '20260707160000_profile_images',
  '20260707170000_patient_clinical_media',
  '20260708140000_blog_enhancements',
  '20260708150000_online_doctor',
  '20260708160000_case_analysis_method_rationale',
  '20260708170000_case_analysis_remedy_suggestion_audit',
  '20260708180000_imaging_interpretation',
  '20260708190000_patient_imaging_preview'
];

for (const name of pending) {
  console.log(`Marking applied: ${name}`);
  execSync(`npx prisma migrate resolve --applied ${name}`, { stdio: 'inherit', cwd });
}

console.log('Done.');
