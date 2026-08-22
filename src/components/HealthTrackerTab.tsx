import React, { useState } from 'react';
import { 
  Activity, 
  Plus, 
  HeartPulse, 
  Scale, 
  Droplet, 
  FileText, 
  AlertTriangle,
  Info,
  Calendar,
  X,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { 
  HealthTrackerData, 
  BloodPressureRecord, 
  GlucoseRecord, 
  WeightRecord, 
  LabRecord, 
  SymptomRecord, 
  UserProfile 
} from '../types';
import { getTranslations } from '../utils/i18n';

interface HealthTrackerTabProps {
  user: UserProfile;
  healthData: HealthTrackerData;
  onAddBloodPressure: (rec: Omit<BloodPressureRecord, 'id'>) => void;
  onAddGlucose: (rec: Omit<GlucoseRecord, 'id'>) => void;
  onAddWeight: (rec: Omit<WeightRecord, 'id'>) => void;
  onAddLab: (rec: Omit<LabRecord, 'id'>) => void;
  onAddSymptom: (rec: Omit<SymptomRecord, 'id'>) => void;
}

export const HealthTrackerTab: React.FC<HealthTrackerTabProps> = ({
  user,
  healthData,
  onAddBloodPressure,
  onAddGlucose,
  onAddWeight,
  onAddLab,
  onAddSymptom,
}) => {
  const t = getTranslations(user.language);
  const [activeSubTab, setActiveSubTab] = useState<'bp' | 'glucose' | 'weight' | 'labs' | 'symptoms'>('bp');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // BP Form
  const [systolic, setSystolic] = useState<number>(115);
  const [diastolic, setDiastolic] = useState<number>(75);
  const [pulse, setPulse] = useState<number>(78);
  const [bpNote, setBpNote] = useState('');

  // Glucose Form
  const [glucoseVal, setGlucoseVal] = useState<number>(95);
  const [glucoseContext, setGlucoseContext] = useState<GlucoseRecord['context']>('fasting');
  const [glucoseNote, setGlucoseNote] = useState('');

  // Weight Form
  const [weightKg, setWeightKg] = useState<number>(66.5);
  const [weightNote, setWeightNote] = useState('');

  // Lab Form
  const [testName, setTestName] = useState('');
  const [resultValue, setResultValue] = useState('');
  const [unit, setUnit] = useState('');
  const [refRange, setRefRange] = useState('');

  // Symptom Form
  const [symptomName, setSymptomName] = useState('');
  const [severity, setSeverity] = useState<number>(2);
  const [symptomNote, setSymptomNote] = useState('');

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = new Date().toISOString().split('T')[0];

    if (activeSubTab === 'bp') {
      onAddBloodPressure({
        systolic,
        diastolic,
        pulse,
        recordedAt: todayStr,
        note: bpNote.trim() || undefined,
        symptoms: [],
      });
    } else if (activeSubTab === 'glucose') {
      onAddGlucose({
        valueMgDl: glucoseVal,
        context: glucoseContext,
        recordedAt: todayStr,
        note: glucoseNote.trim() || undefined,
      });
    } else if (activeSubTab === 'weight') {
      onAddWeight({
        weightKg,
        recordedAt: todayStr,
        note: weightNote.trim() || undefined,
      });
    } else if (activeSubTab === 'labs') {
      if (!testName.trim() || !resultValue.trim()) return;
      onAddLab({
        testName: testName.trim(),
        resultValue: resultValue.trim(),
        unit: unit.trim() || undefined,
        referenceRange: refRange.trim() || undefined,
        testedOn: todayStr,
      });
      setTestName('');
      setResultValue('');
    } else if (activeSubTab === 'symptoms') {
      if (!symptomName.trim()) return;
      onAddSymptom({
        symptom: symptomName.trim(),
        severity,
        contactedCare: false,
        startedAt: todayStr,
        note: symptomNote.trim() || undefined,
      });
      setSymptomName('');
    }

    setIsModalOpen(false);
  };

  const getBpStatus = (sys: number, dia: number) => {
    if (sys < 120 && dia < 80) return { label: 'Optimal / Normal', color: 'text-[#2D7344] bg-[#EDF7F1]' };
    if (sys <= 129 && dia < 80) return { label: 'Elevated (Rest & Retest)', color: 'text-[#966B24] bg-[#FEF8EC]' };
    if (sys >= 140 || dia >= 90) return { label: 'High (Alert Obstetrician)', color: 'text-[#B83E48] bg-[#FCECEC]' };
    return { label: 'Mild Range (Monitor)', color: 'text-[#8A5A2B] bg-[#FAF1E6]' };
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      
      {/* Header Overview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAD7D2] shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#9F4F52] tracking-wider uppercase">
            <Activity className="w-4 h-4" />
            <span>Clinical Vitals & Records</span>
          </div>
          <h1 className="font-serif text-3xl text-[#2E2020] font-bold mt-1">
            {t.healthTracker}
          </h1>
          <p className="text-sm text-[#735E61] mt-1">
            Monitor maternal blood pressure, blood glucose, weight trends, and lab reports.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#9F4F52] hover:bg-[#85383B] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log New Reading</span>
        </button>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'bp', label: 'Blood Pressure', icon: HeartPulse },
          { id: 'glucose', label: 'Blood Glucose', icon: Droplet },
          { id: 'weight', label: 'Weight Trend', icon: Scale },
          { id: 'labs', label: 'Lab Reports', icon: FileText },
          { id: 'symptoms', label: 'Symptoms Log', icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#9F4F52] text-white shadow-2xs'
                  : 'bg-white text-[#685255] border border-[#E8D6D1] hover:bg-[#FAF4F0]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panel 1: Blood Pressure */}
      {activeSubTab === 'bp' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#FAF6F3] border border-[#EADBCE] flex items-center gap-3 text-xs text-[#635052]">
            <Info className="w-5 h-5 text-[#9F4F52] flex-shrink-0" />
            <div>
              <strong className="text-[#2E2020]">Clinical Guidance:</strong> Rest for 5 minutes in a seated position with feet flat before taking a reading. Readings ≥ 140/90 mmHg with headache or visual aura require prompt obstetric evaluation to rule out preeclampsia.
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#EAD7D2] p-6 shadow-2xs divide-y divide-[#F2E5E1]">
            {healthData.bloodPressures.map((rec) => {
              const status = getBpStatus(rec.systolic, rec.diastolic);
              return (
                <div key={rec.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-2xl font-bold text-[#2E2020]">
                        {rec.systolic} / {rec.diastolic} <span className="text-xs font-normal text-[#8A7174]">mmHg</span>
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    {rec.pulse && (
                      <div className="text-xs text-[#7A6466]">
                        Pulse: <strong className="text-[#453436]">{rec.pulse} bpm</strong>
                      </div>
                    )}
                    {rec.note && (
                      <p className="text-xs text-[#705B5E] italic">"{rec.note}"</p>
                    )}
                  </div>

                  <div className="text-xs text-[#8F797C] sm:text-right">
                    <span>Recorded on {rec.recordedAt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Panel 2: Blood Glucose */}
      {activeSubTab === 'glucose' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#FAF6F3] border border-[#EADBCE] flex items-center gap-3 text-xs text-[#635052]">
            <Info className="w-5 h-5 text-[#9F4F52] flex-shrink-0" />
            <div>
              <strong className="text-[#2E2020]">Gestational Targets:</strong> Fasting blood glucose is ideally &lt; 95 mg/dL; 2-hour postprandial &lt; 120 mg/dL.
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#EAD7D2] p-6 shadow-2xs divide-y divide-[#F2E5E1]">
            {healthData.glucoses.map((rec) => {
              const isFasting = rec.context === 'fasting';
              const isTargetMet = isFasting ? rec.valueMgDl < 95 : rec.valueMgDl < 120;

              return (
                <div key={rec.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-2xl font-bold text-[#2E2020]">
                        {rec.valueMgDl} <span className="text-xs font-normal text-[#8A7174]">mg/dL</span>
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${isTargetMet ? 'text-[#2D7344] bg-[#EDF7F1]' : 'text-[#A64E24] bg-[#FEF4EC]'}`}>
                        {isTargetMet ? 'Within Target' : 'Above Target'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-[#F4ECE8] text-[#594346] uppercase font-bold text-[10px]">
                        {rec.context.replace('_', ' ')}
                      </span>
                    </div>
                    {rec.note && <p className="text-xs text-[#705B5E] italic">"{rec.note}"</p>}
                  </div>

                  <div className="text-xs text-[#8F797C] sm:text-right">
                    <span>{rec.recordedAt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Panel 3: Weight Trend */}
      {activeSubTab === 'weight' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#EAD7D2] shadow-2xs">
              <div className="text-xs text-[#8A7174]">Pre-pregnancy Baseline</div>
              <div className="font-serif text-2xl font-bold text-[#2E2020] mt-1">
                {healthData.weights[0]?.weightKg || '--'} kg
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#EAD7D2] shadow-2xs">
              <div className="text-xs text-[#8A7174]">Current Weight</div>
              <div className="font-serif text-2xl font-bold text-[#9F4F52] mt-1">
                {healthData.weights[healthData.weights.length - 1]?.weightKg || '--'} kg
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#EAD7D2] shadow-2xs">
              <div className="text-xs text-[#8A7174]">Total Healthy Gain</div>
              <div className="font-serif text-2xl font-bold text-[#3E8E5A] mt-1">
                +{(healthData.weights[healthData.weights.length - 1]?.weightKg - healthData.weights[0]?.weightKg).toFixed(1)} kg
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#EAD7D2] p-6 shadow-2xs space-y-3">
            <h3 className="font-serif text-lg font-bold text-[#2E2020]">Weight Log History</h3>
            <div className="divide-y divide-[#F2E5E1]">
              {healthData.weights.map((w) => (
                <div key={w.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#2E2020] text-base">{w.weightKg} kg</span>
                    {w.note && <span className="text-xs text-[#7A6466] ml-3">({w.note})</span>}
                  </div>
                  <div className="text-xs text-[#8F797C]">{w.recordedAt}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Panel 4: Lab Reports */}
      {activeSubTab === 'labs' && (
        <div className="bg-white rounded-3xl border border-[#EAD7D2] p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-[#2E2020]">Antenatal Lab Records</h3>
            <span className="text-xs text-[#8A7174]">{healthData.labs.length} verified tests</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {healthData.labs.map((lab) => (
              <div key={lab.id} className="p-4 rounded-2xl bg-[#FAF6F3] border border-[#EADBCE] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#2E2020]">{lab.testName}</span>
                  <span className="text-[11px] text-[#8F797C]">{lab.testedOn}</span>
                </div>
                <div className="text-base font-bold text-[#9F4F52]">
                  {lab.resultValue} {lab.unit || ''}
                </div>
                {lab.referenceRange && (
                  <div className="text-[11px] text-[#7A6466]">
                    Ref Range: {lab.referenceRange}
                  </div>
                )}
                {lab.note && (
                  <div className="text-[11px] text-[#3E8E5A] font-semibold">
                    ✓ {lab.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Panel 5: Symptoms Log */}
      {activeSubTab === 'symptoms' && (
        <div className="bg-white rounded-3xl border border-[#EAD7D2] p-6 shadow-2xs space-y-4">
          <h3 className="font-serif text-lg font-bold text-[#2E2020]">Symptoms Log</h3>
          <div className="space-y-3">
            {healthData.symptoms.map((s) => (
              <div key={s.id} className="p-4 rounded-2xl bg-[#FAF6F3] border border-[#EADBCE] flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#2E2020]">{s.symptom}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF0EB] text-[#7A4448] font-semibold">
                      Severity: {s.severity}/5
                    </span>
                  </div>
                  {s.note && <p className="text-xs text-[#6B5558]">{s.note}</p>}
                </div>
                <div className="text-xs text-[#8F797C]">{s.startedAt}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EAD7D2] max-w-md w-full p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-[#2E2020]">
                {activeSubTab === 'bp' && 'Log Blood Pressure'}
                {activeSubTab === 'glucose' && 'Log Blood Glucose'}
                {activeSubTab === 'weight' && 'Log Weight'}
                {activeSubTab === 'labs' && 'Log Lab Result'}
                {activeSubTab === 'symptoms' && 'Log Symptom'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#F5ECE8] text-[#7A6466] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {activeSubTab === 'bp' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#4B393C] uppercase mb-1">Systolic (mmHg)</label>
                      <input
                        type="number"
                        required
                        value={systolic}
                        onChange={(e) => setSystolic(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-[#DDC6C0] bg-[#FFFDFC]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#4B393C] uppercase mb-1">Diastolic (mmHg)</label>
                      <input
                        type="number"
                        required
                        value={diastolic}
                        onChange={(e) => setDiastolic(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-[#DDC6C0] bg-[#FFFDFC]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4B393C] uppercase mb-1">Pulse (bpm)</label>
                    <input
                      type="number"
                      value={pulse}
                      onChange={(e) => setPulse(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-[#DDC6C0] bg-[#FFFDFC]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4B393C] uppercase mb-1">Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Taken after 10 mins rest"
                      value={bpNote}
                      onChange={(e) => setBpNote(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-[#DDC6C0] bg-[#FFFDFC]"
                    />
                  </div>
                </>
              )}

              {activeSubTab === 'glucose' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#4B393C] uppercase mb-1">Value (mg/dL)</label>
                    <input
                      type="number"
                      required
                      value={glucoseVal}
                      onChange={(e) => setGlucoseVal(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-[#DDC6C0] bg-[#FFFDFC]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4B393C] uppercase mb-1">Timing Context</label>
                    <select
                      value={glucoseContext}
                      onChange={(e) => setGlucoseContext(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-[#DDC6C0] bg-[#FFFDFC]"
                    >
                      <option value="fasting">Fasting (Morning)</option>
                      <option value="before_meal">Before Meal</option>
                      <option value="after_meal">2h Post-Meal</option>
                      <option value="random">Random</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4B393C] uppercase mb-1">Meal Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Oatmeal with chia seeds"
                      value={glucoseNote}
                      onChange={(e) => setGlucoseNote(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-[#DDC6C0] bg-[#FFFDFC]"
                    />
                  </div>
                </>
              )}

              {activeSubTab === 'weight' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#4B393C] uppercase mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-[#DDC6C0] bg-[#FFFDFC]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4B393C] uppercase mb-1">Note</label>
                    <input
                      type="text"
                      placeholder="e.g. Morning weighing after bathroom"
                      value={weightNote}
                      onChange={(e) => setWeightNote(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-[#DDC6C0] bg-[#FFFDFC]"
                    />
                  </div>
                </>
              )}

              {activeSubTab === 'labs' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#4B393C] uppercase mb-1">Test Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hemoglobin, Thyroid TSH, Urine Protein"
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-[#DDC6C0] bg-[#FFFDFC]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#4B393C] uppercase mb-1">Result *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 12.4"
                        value={resultValue}
                        onChange={(e) => setResultValue(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-[#DDC6C0] bg-[#FFFDFC]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#4B393C] uppercase mb-1">Unit</label>
                      <input
                        type="text"
                        placeholder="e.g. g/dL, mg/dL"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-[#DDC6C0] bg-[#FFFDFC]"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeSubTab === 'symptoms' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#4B393C] uppercase mb-1">Symptom Description *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Swelling in ankles, Heartburn"
                      value={symptomName}
                      onChange={(e) => setSymptomName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-[#DDC6C0] bg-[#FFFDFC]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4B393C] uppercase mb-1">Severity (1 to 5)</label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={severity}
                      onChange={(e) => setSeverity(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-[#7A6466]">
                      <span>1 (Mild)</span>
                      <span>3 (Moderate)</span>
                      <span>5 (Severe)</span>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-[#6B5558] hover:bg-[#F7EEEA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#9F4F52] hover:bg-[#85383B] text-white shadow-xs cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
