export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  mobile: true,
  role: true
} as const;

export const doctorProfileApiDbSelect = {
  specialty: true,
  registrationNo: true,
  isAvailable: true,
  bio: true,
  qualifications: true,
  homoeopathyMethods: true,
  clinicalFocus: true,
  languagesSpoken: true,
  yearsExperience: true,
  stateCouncilName: true,
  stateCouncilRegNo: true,
  degreeCertificatePath: true,
  councilRegCertificatePath: true,
  otherCredentialPath: true
} as const;

export function includeConsultationRelations() {
  return {
    patient: { select: publicUserSelect },
    assignedDoctor: { select: publicUserSelect },
    disease: true,
    payment: true,
    prescriptions: {
      include: {
        items: { orderBy: { sortOrder: 'asc' as const } },
        methodOption: true,
        diagnosedDiseaseOption: true
      },
      orderBy: { version: 'desc' as const }
    },
    messages: {
      include: { sender: { select: publicUserSelect } },
      orderBy: { createdAt: 'asc' as const }
    },
    attachments: {
      include: { uploadedBy: { select: publicUserSelect } },
      orderBy: { createdAt: 'desc' as const }
    }
  };
}

export function includePrescriptionRelations() {
  return {
    consultation: {
      select: {
        id: true,
        patientId: true,
        assignedDoctorId: true,
        disease: { select: { id: true, name: true } }
      }
    },
    uploadedBy: { select: publicUserSelect },
    patient: { select: publicUserSelect },
    methodOption: true,
    diagnosedDiseaseOption: true,
    items: { orderBy: { sortOrder: 'asc' as const } }
  };
}
