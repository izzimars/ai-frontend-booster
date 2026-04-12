import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { Button } from '../Button';
import { Card } from '../Card';

interface MedicalAllergy {
  allergen: string;
  severity: 'Severe' | 'Moderate' | 'Mild';
}

interface ChronicConditionRecord {
  condition: string;
  managementNote: string;
}

interface MedicationScheduleRow {
  id: string;
  medication: string;
  dosage: string;
  scheduledTime: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  specialInstructions?: string;
}

interface MedicalHistoryEntry {
  id: string;
  timestamp: string;
  medication: string;
  dosage: string;
  administeredBy: string;
  administrationNote?: string;
}

interface YesterdayMedicationRecord {
  id: string;
  medication: string;
  dosage: string;
  scheduledTime: string;
  wasGiven: boolean;
}

interface MedicalPortalData {
  bloodType: string;
  genotype: string;
  allergies: MedicalAllergy[];
  chronicConditions: ChronicConditionRecord[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  parentCanEditProfile: boolean;
  todaySchedule: MedicationScheduleRow[];
  history: MedicalHistoryEntry[];
  yesterdaySchedule: YesterdayMedicationRecord[];
  teacherMedicalLogSyncAt: string;
}

interface PendingMedicalUpdate {
  bloodType: string;
  genotype: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  allergiesText: string;
  chronicConditionsText: string;
  managementInstructions: string;
  medications: MedicationScheduleRow[];
}

interface MedicalProfileEditorProps {
  studentId: string;
  studentName: string;
  initialProfile: MedicalPortalData;
  onBack: () => void;
  onSaved: (updatedProfile: MedicalPortalData) => void;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENOTYPES = ['AA', 'AS', 'AC', 'SS', 'SC'];

function readJsonFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJsonToStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function pendingMedicalUpdateKey() {
  return 'pendingMedicalUpdate';
}

function studentMedicalProfileKey() {
  return 'studentMedicalProfile';
}

function schoolAuditLogKey() {
  return 'school_audit_log';
}

function teacherCareSyncKey(studentId: string) {
  return `teacherCareView:${studentId}`;
}

export function MedicalProfileEditor({
  studentId,
  studentName,
  initialProfile,
  onBack,
  onSaved,
}: MedicalProfileEditorProps) {
  const pendingAll = readJsonFromStorage<Record<string, PendingMedicalUpdate>>(pendingMedicalUpdateKey(), {});
  const pending = pendingAll[studentId];

  const [bloodType, setBloodType] = useState(pending?.bloodType ?? initialProfile.bloodType);
  const [genotype, setGenotype] = useState(pending?.genotype ?? initialProfile.genotype);
  const [emergencyContactName, setEmergencyContactName] = useState(
    pending?.emergencyContactName ?? initialProfile.emergencyContact.name,
  );
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState(
    pending?.emergencyContactRelationship ?? initialProfile.emergencyContact.relationship,
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    pending?.emergencyContactPhone ?? initialProfile.emergencyContact.phone.replace(/\D/g, ''),
  );

  const [allergiesText, setAllergiesText] = useState(
    pending?.allergiesText ?? initialProfile.allergies.map((item) => item.allergen).join(', '),
  );
  const [chronicConditionsText, setChronicConditionsText] = useState(
    pending?.chronicConditionsText ?? initialProfile.chronicConditions.map((item) => item.condition).join(', '),
  );
  const [managementInstructions, setManagementInstructions] = useState(
    pending?.managementInstructions ?? initialProfile.chronicConditions.map((item) => item.managementNote).join(' | '),
  );

  const [medications, setMedications] = useState<MedicationScheduleRow[]>(
    pending?.medications ??
      initialProfile.todaySchedule.map((item) => ({
        ...item,
        frequency: item.frequency ?? item.scheduledTime,
        startDate: item.startDate ?? new Date().toISOString().slice(0, 10),
        endDate: item.endDate ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        specialInstructions: item.specialInstructions ?? '',
      })),
  );

  const [errorMessage, setErrorMessage] = useState('');

  const draftPayload = useMemo<PendingMedicalUpdate>(() => {
    return {
      bloodType,
      genotype,
      emergencyContactName,
      emergencyContactRelationship,
      emergencyContactPhone,
      allergiesText,
      chronicConditionsText,
      managementInstructions,
      medications,
    };
  }, [
    bloodType,
    genotype,
    emergencyContactName,
    emergencyContactRelationship,
    emergencyContactPhone,
    allergiesText,
    chronicConditionsText,
    managementInstructions,
    medications,
  ]);

  useEffect(() => {
    const allPending = readJsonFromStorage<Record<string, PendingMedicalUpdate>>(pendingMedicalUpdateKey(), {});
    writeJsonToStorage(pendingMedicalUpdateKey(), {
      ...allPending,
      [studentId]: draftPayload,
    });
  }, [draftPayload, studentId]);

  const addMedication = () => {
    setMedications((prev) => [
      ...prev,
      {
        id: `med-${Date.now()}`,
        medication: '',
        dosage: '',
        scheduledTime: '10:00',
        frequency: 'Once daily',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        specialInstructions: '',
      },
    ]);
  };

  const updateMedication = (id: string, field: keyof MedicationScheduleRow, value: string) => {
    setMedications((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const removeMedication = (id: string) => {
    setMedications((prev) => prev.filter((item) => item.id !== id));
  };

  const validate = () => {
    if (!/^\d+$/.test(emergencyContactPhone)) {
      setErrorMessage('Emergency phone number must contain digits only.');
      return false;
    }

    const today = new Date().toISOString().slice(0, 10);
    for (const med of medications) {
      if (med.endDate && med.endDate < today) {
        setErrorMessage(`Medication end date cannot be in the past for ${med.medication || 'a medication row'}.`);
        return false;
      }
    }

    setErrorMessage('');
    return true;
  };

  const saveAndUpdateSchool = () => {
    if (!validate()) {
      return;
    }

    const allergyTags = allergiesText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((allergen) => ({ allergen, severity: 'Moderate' as const }));

    const chronicTags = chronicConditionsText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((condition) => ({
        condition,
        managementNote: managementInstructions || 'No management instructions provided.',
      }));

    const updatedProfile: MedicalPortalData = {
      ...initialProfile,
      bloodType,
      genotype,
      allergies: allergyTags,
      chronicConditions: chronicTags,
      emergencyContact: {
        name: emergencyContactName,
        relationship: emergencyContactRelationship,
        phone: emergencyContactPhone,
      },
      parentCanEditProfile: true,
      todaySchedule: medications,
      teacherMedicalLogSyncAt: new Date().toISOString(),
    };

    const medicalStore = readJsonFromStorage<Record<string, MedicalPortalData>>(studentMedicalProfileKey(), {});
    writeJsonToStorage(studentMedicalProfileKey(), {
      ...medicalStore,
      [studentId]: updatedProfile,
    });

    writeJsonToStorage(teacherCareSyncKey(studentId), {
      studentId,
      allergies: updatedProfile.allergies,
      medicationTimes: updatedProfile.todaySchedule.map((item) => ({
        medication: item.medication,
        scheduledTime: item.scheduledTime,
        dosage: item.dosage,
      })),
      updatedAt: new Date().toISOString(),
    });

    const existingAudit = readJsonFromStorage<Array<{ id: string; message: string; timestamp: string }>>(schoolAuditLogKey(), []);
    writeJsonToStorage(schoolAuditLogKey(), [
      {
        id: `audit-${Date.now()}`,
        message: `Parent updated Medical Profile for ${studentName}.`,
        timestamp: new Date().toISOString(),
      },
      ...existingAudit,
    ]);

    const allPending = readJsonFromStorage<Record<string, PendingMedicalUpdate>>(pendingMedicalUpdateKey(), {});
    delete allPending[studentId];
    writeJsonToStorage(pendingMedicalUpdateKey(), allPending);

    onSaved(updatedProfile);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
      <Card className="border-amber-300 bg-amber-50">
        <div className="flex items-start gap-2 text-amber-900 text-sm">
          <AlertTriangle size={16} className="mt-0.5" />
          <p>
            Please ensure all information is accurate. This data is used by teachers to administer care during school hours.
          </p>
        </div>
      </Card>

      <Card title="Section A: Basic Vitals">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Blood Group</label>
            <select
              value={bloodType}
              onChange={(event) => setBloodType(event.target.value)}
              className="mt-1 w-full p-2 border border-border rounded-lg bg-input-background"
            >
              {BLOOD_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Genotype</label>
            <select
              value={genotype}
              onChange={(event) => setGenotype(event.target.value)}
              className="mt-1 w-full p-2 border border-border rounded-lg bg-input-background"
            >
              {GENOTYPES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Emergency Contact Name</label>
            <input
              value={emergencyContactName}
              onChange={(event) => setEmergencyContactName(event.target.value)}
              className="mt-1 w-full p-2 border border-border rounded-lg bg-input-background"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Relationship</label>
            <input
              value={emergencyContactRelationship}
              onChange={(event) => setEmergencyContactRelationship(event.target.value)}
              className="mt-1 w-full p-2 border border-border rounded-lg bg-input-background"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Phone Number (digits only)</label>
            <input
              value={emergencyContactPhone}
              onChange={(event) => setEmergencyContactPhone(event.target.value.replace(/\D/g, ''))}
              className="mt-1 w-full p-2 border border-border rounded-lg bg-input-background"
              inputMode="numeric"
            />
          </div>
        </div>
      </Card>

      <Card title="Section B: Conditions & Risks">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-sm font-medium">Allergies</label>
            <textarea
              value={allergiesText}
              onChange={(event) => setAllergiesText(event.target.value)}
              rows={3}
              placeholder="e.g. Peanuts, Penicillin"
              className="mt-1 w-full p-2 border border-border rounded-lg bg-input-background"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Chronic Conditions</label>
            <textarea
              value={chronicConditionsText}
              onChange={(event) => setChronicConditionsText(event.target.value)}
              rows={3}
              placeholder="e.g. Asthma, Diabetes"
              className="mt-1 w-full p-2 border border-border rounded-lg bg-input-background"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Management Instructions</label>
            <textarea
              value={managementInstructions}
              onChange={(event) => setManagementInstructions(event.target.value)}
              rows={3}
              placeholder="e.g. Use inhaler only when wheezing"
              className="mt-1 w-full p-2 border border-border rounded-lg bg-input-background"
            />
          </div>
        </div>
      </Card>

      <Card
        title="Section C: Active Medication Builder"
        action={
          <Button size="sm" variant="outline" onClick={addMedication}>
            <Plus size={14} /> Add New Medication
          </Button>
        }
      >
        <div className="space-y-3">
          {medications.map((medication) => (
            <div key={medication.id} className="p-3 border rounded-lg grid grid-cols-1 md:grid-cols-6 gap-2">
              <input
                value={medication.medication}
                onChange={(event) => updateMedication(medication.id, 'medication', event.target.value)}
                placeholder="Name of Drug"
                className="p-2 border border-border rounded bg-input-background"
              />
              <input
                value={medication.dosage}
                onChange={(event) => updateMedication(medication.id, 'dosage', event.target.value)}
                placeholder="Dosage"
                className="p-2 border border-border rounded bg-input-background"
              />
              <input
                value={medication.scheduledTime}
                onChange={(event) => updateMedication(medication.id, 'scheduledTime', event.target.value)}
                placeholder="10:00"
                className="p-2 border border-border rounded bg-input-background"
              />
              <input
                value={medication.frequency ?? ''}
                onChange={(event) => updateMedication(medication.id, 'frequency', event.target.value)}
                placeholder="Frequency"
                className="p-2 border border-border rounded bg-input-background"
              />
              <input
                type="date"
                value={medication.startDate ?? ''}
                onChange={(event) => updateMedication(medication.id, 'startDate', event.target.value)}
                className="p-2 border border-border rounded bg-input-background"
              />
              <input
                type="date"
                value={medication.endDate ?? ''}
                onChange={(event) => updateMedication(medication.id, 'endDate', event.target.value)}
                className="p-2 border border-border rounded bg-input-background"
              />
              <textarea
                value={medication.specialInstructions ?? ''}
                onChange={(event) => updateMedication(medication.id, 'specialInstructions', event.target.value)}
                placeholder="Special Instructions"
                rows={2}
                className="md:col-span-5 p-2 border border-border rounded bg-input-background"
              />
              <Button size="sm" variant="outline" onClick={() => removeMedication(medication.id)}>
                <Trash2 size={14} /> Remove
              </Button>
            </div>
          ))}
          {medications.length === 0 && <p className="text-sm text-muted-foreground">No active medications yet.</p>}
        </div>
      </Card>

      {errorMessage && (
        <Card className="border-red-300 bg-red-50">
          <p className="text-sm text-red-800">{errorMessage}</p>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <Button onClick={saveAndUpdateSchool}>Save & Update School</Button>
      </div>
    </div>
  );
}
