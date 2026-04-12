import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { Heart, Search, Clock, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '../Modal';

const medicationsDue = [
  { id: 1, student: 'Sarah Johnson', class: 'Math 10A', medication: 'Ibuprofen 200mg', time: '10:00 AM', status: 'pending' },
  { id: 2, student: 'Michael Brown', class: 'Science 9B', medication: 'Vitamin D', time: '12:00 PM', status: 'pending' },
  { id: 3, student: 'Emily Davis', class: 'English 11A', medication: 'Allergy Medicine', time: '02:00 PM', status: 'pending' },
];

const students = [
  {
    id: 1,
    name: 'Sarah Johnson',
    class: 'Math 10A',
    allergies: 'Peanuts, Penicillin',
    conditions: 'Asthma',
    medications: [
      { name: 'Ibuprofen 200mg', dosage: '2x daily', times: ['10:00 AM', '04:00 PM'], active: true },
      { name: 'Inhaler (Albuterol)', dosage: 'As needed', times: [], active: true },
    ],
  },
  {
    id: 2,
    name: 'Michael Brown',
    class: 'Science 9B',
    allergies: 'None',
    conditions: 'None',
    medications: [
      { name: 'Vitamin D', dosage: '1x daily', times: ['12:00 PM'], active: true },
    ],
  },
];

export function NurseDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedMedication, setSelectedMedication] = useState<any>(null);

  const handleMarkGiven = (med: any) => {
    setSelectedMedication(med);
  };

  const confirmMedication = () => {
    alert(`Medication administered: ${selectedMedication.medication} for ${selectedMedication.student}`);
    setSelectedMedication(null);
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Medications Due Today */}
      <Card
        title="Medications Due Today"
        action={
          <Badge variant="pending">{medicationsDue.length} Pending</Badge>
        }
      >
        <div className="space-y-3">
          {medicationsDue.map((med) => (
            <div key={med.id} className="flex items-center justify-between p-4 bg-accent rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="text-blue-600" size={24} />
                <div>
                  <p>{med.student} ({med.class})</p>
                  <p className="text-muted-foreground">{med.medication} - {med.time}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => alert('Marked as deferred')}
                >
                  Defer
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleMarkGiven(med)}
                >
                  <CheckCircle size={16} className="mr-2" />
                  Mark Given
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Student Search */}
      <Card title="Student Medical Records">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name or class..."
              className="w-full p-3 pl-10 border border-border rounded-lg bg-input-background"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="border border-border rounded-lg p-4 cursor-pointer hover:bg-accent"
              onClick={() => setSelectedStudent(student)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p>{student.name}</p>
                  <p className="text-muted-foreground">{student.class}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge variant="default">{student.medications.length} Medications</Badge>
                    {student.allergies !== 'None' && (
                      <Badge variant="rejected">Allergies</Badge>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Student Details Modal */}
      {selectedStudent && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedStudent(null)}
          title={`${selectedStudent.name} - Medical Record`}
          footer={
            <Button variant="outline" onClick={() => setSelectedStudent(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-6">
            <div>
              <p className="text-muted-foreground">Class</p>
              <p>{selectedStudent.class}</p>
            </div>

            <div>
              <p className="text-muted-foreground mb-2">Allergies</p>
              <div className="p-4 bg-red-100 dark:bg-red-900 rounded-lg">
                <p className="text-red-800 dark:text-red-200">
                  {selectedStudent.allergies}
                </p>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground mb-2">Medical Conditions</p>
              <div className="p-4 bg-accent rounded-lg">
                <p>{selectedStudent.conditions}</p>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground mb-2">Active Medications</p>
              <div className="space-y-3">
                {selectedStudent.medications.map((med: any, index: number) => (
                  <div key={index} className="p-4 border border-border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p>{med.name}</p>
                        <p className="text-muted-foreground">{med.dosage}</p>
                      </div>
                      <Badge variant={med.active ? 'approved' : 'default'}>
                        {med.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {med.times.length > 0 && (
                      <div className="mt-2">
                        <p className="text-muted-foreground">Schedule:</p>
                        <div className="flex gap-2 mt-1">
                          {med.times.map((time: string, idx: number) => (
                            <Badge key={idx} variant="default">{time}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button variant="primary" className="w-full">
              View Fulfillment History
            </Button>
          </div>
        </Modal>
      )}

      {/* Mark Medication Given Modal */}
      {selectedMedication && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedMedication(null)}
          title="Confirm Medication Administration"
          footer={
            <>
              <Button variant="outline" onClick={() => setSelectedMedication(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={confirmMedication}>
                <CheckCircle size={16} className="mr-2" />
                Confirm
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground">Student</p>
              <p>{selectedMedication.student}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Medication</p>
              <p>{selectedMedication.medication}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Scheduled Time</p>
              <p>{selectedMedication.time}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Administration Time</p>
              <p>{new Date().toLocaleTimeString()}</p>
            </div>
            <div>
              <label className="block mb-2">Notes (optional)</label>
              <textarea
                className="w-full p-3 border border-border rounded-lg bg-input-background"
                rows={3}
                placeholder="Add any observations or notes..."
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
