import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { Shield, CheckCircle } from 'lucide-react';
import { useState } from 'react';

const recentDepartures = [
  { id: 1, child: 'Sarah Johnson', class: 'Math 10A', authorizedBy: 'Jane Johnson (Mother)', time: '14:30', verifiedBy: 'Gate Staff 1' },
  { id: 2, child: 'Michael Brown', class: 'Science 9B', authorizedBy: 'Self Pickup', time: '14:25', verifiedBy: 'Gate Staff 1' },
  { id: 3, child: 'Emily Davis', class: 'English 11A', authorizedBy: 'John Davis (Father)', time: '14:20', verifiedBy: 'Gate Staff 1' },
];

export function GateDashboard() {
  const [pickupCode, setPickupCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const handleVerify = () => {
    // Mock verification
    if (pickupCode === '123456') {
      setVerificationResult({
        valid: true,
        child: 'Sarah Johnson',
        class: 'Math 10A',
        authorizedBy: 'Jane Johnson (Mother)',
        photo: 'https://via.placeholder.com/150',
        expiresAt: '15:00',
      });
    } else if (pickupCode.length === 6) {
      setVerificationResult({
        valid: false,
        message: 'Invalid or expired code',
      });
    }
  };

  const handleConfirmDeparture = () => {
    alert(`Departure logged for ${verificationResult.child}`);
    setVerificationResult(null);
    setPickupCode('');
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Pickup Code Verification */}
      <Card title="Verify Pickup Code">
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Enter Pickup Code</label>
            <input
              type="text"
              value={pickupCode}
              onChange={(e) => setPickupCode(e.target.value)}
              className="w-full p-4 border border-border rounded-lg bg-input-background"
              placeholder="Enter 6-digit code"
              maxLength={6}
            />
          </div>
          <Button
            variant="primary"
            className="w-full"
            onClick={handleVerify}
            disabled={pickupCode.length !== 6}
          >
            <Shield size={20} className="mr-2" />
            Verify Code
          </Button>
        </div>

        {verificationResult && (
          <div className={`mt-6 p-6 rounded-lg ${verificationResult.valid ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
            {verificationResult.valid ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-600 dark:text-green-300" size={24} />
                  <p className="text-green-800 dark:text-green-200">Valid Pickup Code</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-green-700 dark:text-green-300">Child</p>
                    <p className="text-green-900 dark:text-green-100">{verificationResult.child}</p>
                  </div>
                  <div>
                    <p className="text-green-700 dark:text-green-300">Class</p>
                    <p className="text-green-900 dark:text-green-100">{verificationResult.class}</p>
                  </div>
                  <div>
                    <p className="text-green-700 dark:text-green-300">Authorized By</p>
                    <p className="text-green-900 dark:text-green-100">{verificationResult.authorizedBy}</p>
                  </div>
                  <div>
                    <p className="text-green-700 dark:text-green-300">Expires At</p>
                    <p className="text-green-900 dark:text-green-100">{verificationResult.expiresAt}</p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleConfirmDeparture}
                >
                  Confirm Departure
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-red-800 dark:text-red-200">{verificationResult.message}</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Today's Departure Log */}
      <Card title="Today's Departures">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3">Child</th>
                <th className="text-left py-3">Class</th>
                <th className="text-left py-3">Authorized By</th>
                <th className="text-left py-3">Time</th>
                <th className="text-left py-3">Verified By</th>
              </tr>
            </thead>
            <tbody>
              {recentDepartures.map((departure) => (
                <tr key={departure.id} className="border-b border-border">
                  <td className="py-3">{departure.child}</td>
                  <td className="py-3">{departure.class}</td>
                  <td className="py-3">{departure.authorizedBy}</td>
                  <td className="py-3">{departure.time}</td>
                  <td className="py-3">{departure.verifiedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Instructions */}
      <Card title="Instructions">
        <div className="space-y-3 text-muted-foreground">
          <p>1. Ask the authorized person for the 6-digit pickup code</p>
          <p>2. Enter the code in the field above and click Verify</p>
          <p>3. Verify the child's identity matches the information displayed</p>
          <p>4. Click Confirm Departure to log the pickup</p>
          <p>5. The code will be invalidated immediately after confirmation</p>
        </div>
      </Card>
    </div>
  );
}
