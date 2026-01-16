"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { UserProfile, UserRole, PatientInfo } from "@/lib/types";

interface PatientUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSuccess: () => void;
}

export default function PatientUserModal({ isOpen, onClose, user, onSuccess }: PatientUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [role, setRole] = useState<UserRole>(user.role || 'patient');
  const [status, setStatus] = useState(user.accountStatus);
  const [patientData, setPatientData] = useState<Partial<PatientInfo>>(user.patientInfo || {
    preferredLanguage: 'English',
    emergencyContact: { name: '', phone: '' },
    medicalHistory: []
  });

  useEffect(() => {
    if (user) {
      setRole(user.role || 'patient');
      setStatus(user.accountStatus);
      setPatientData(user.patientInfo || {
        preferredLanguage: 'English',
        emergencyContact: { name: '', phone: '' },
        medicalHistory: []
      });
    }
  }, [user]);

  if (!isOpen) return null;

  const handleUpdate = async () => {
    setLoading(true);
    setError(null);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        role,
        accountStatus: status,
        patientInfo: patientData,
        updatedAt: new Date()
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl flex flex-col">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Edit Patient User</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {error && <div className="p-3 bg-red-500/10 text-red-500 text-sm rounded border border-red-500/20">{error}</div>}
          
          <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase">User UID</p>
              <code className="text-xs text-white font-mono">{user.uid}</code>
            </div>
            <button 
              onClick={() => navigator.clipboard.writeText(user.uid)}
              className="text-[10px] bg-zinc-700 hover:bg-zinc-600 text-zinc-300 px-2 py-1 rounded transition-colors"
            >
              Copy UID
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Account Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none">
                <option value="patient">Patient</option>
                <option value="healthcare_personnel">Healthcare Personnel</option>
                <option value="medical_facility">Medical Facility</option>
                <option value="agency">Agency</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none">
                <option value="active">Active</option>
                <option value="pending_gdpr">Pending GDPR</option>
                <option value="pending_role">Pending Role</option>
                <option value="pending_personal_data">Pending Data</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <h3 className="text-xs font-bold text-zinc-500 uppercase mb-4">Patient Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Preferred Language</label>
                <input type="text" value={patientData.preferredLanguage} onChange={(e) => setPatientData({...patientData, preferredLanguage: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1 underline decoration-blue-500">Medical History (Comma Separated)</label>
                <textarea 
                  value={patientData.medicalHistory?.join(', ') || ""} 
                  onChange={(e) => setPatientData({...patientData, medicalHistory: e.target.value.split(',').map(s => s.trim()).filter(s => s !== "")})} 
                  className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none h-20 text-xs" 
                  placeholder="Diabetes, Hypertension, Allergies..." 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Emergency Name</label>
                  <input type="text" value={patientData.emergencyContact?.name || ""} onChange={(e) => setPatientData({...patientData, emergencyContact: { ...(patientData.emergencyContact || {name:'', phone:''}), name: e.target.value }})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Emergency Phone</label>
                  <input type="text" value={patientData.emergencyContact?.phone || ""} onChange={(e) => setPatientData({...patientData, emergencyContact: { ...(patientData.emergencyContact || {name:'', phone:''}), phone: e.target.value }})} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white outline-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Cancel</button>
          <button onClick={handleUpdate} disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
