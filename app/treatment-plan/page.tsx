"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  Timestamp
} from "firebase/firestore";
import { TreatmentPlan, TreatmentPlanPriority, DoctorResponse, MEDICAL_PROCEDURES, MedicalProcedureType } from "@/lib/types";

export default function TreatmentPlanPage() {
  const { user, userProfile } = useAuth();
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [respondingToPlan, setRespondingToPlan] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [selectedProcedures, setSelectedProcedures] = useState<MedicalProcedureType[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    medicalCondition: "",
    currentSymptoms: "",
    desiredOutcome: "",
    budget: "",
    priority: "medium" as TreatmentPlanPriority,
  });

  useEffect(() => {
    if (user) {
      fetchPlans();
    }
  }, [user, userProfile]);

  const fetchPlans = async () => {
    if (!user) return;

    try {
      let plansQuery;
      let plansData: TreatmentPlan[] = [];
      
      if (userProfile?.role === 'admin') {
        // Admins see all plans
        plansQuery = query(
          collection(db, "treatment_plans"),
          orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(plansQuery);
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          plansData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            completedAt: data.completedAt?.toDate(),
            preferredDate: data.preferredDate?.toDate(),
            responses: (data.responses || []).map((resp: any) => ({
              ...resp,
              createdAt: resp.createdAt?.toDate(),
            })),
          } as TreatmentPlan);
        });
      } else if (userProfile?.role === 'healthcare_personnel') {
        // Healthcare Personnel see plans matching their procedure tags
        plansQuery = query(
          collection(db, "treatment_plans"),
          orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(plansQuery);
        const personnelTags = userProfile.personalHealthcarePersonnelData?.procedureTags || [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const planTags = data.procedureTags || [];
          
          // Check if any personnel tag matches any plan tag
          const hasMatch = personnelTags.some(tag => planTags.includes(tag));
          
          if (hasMatch) {
            plansData.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate(),
              updatedAt: data.updatedAt?.toDate(),
              completedAt: data.completedAt?.toDate(),
              preferredDate: data.preferredDate?.toDate(),
              responses: (data.responses || []).map((resp: any) => ({
                ...resp,
                createdAt: resp.createdAt?.toDate(),
              })),
            } as TreatmentPlan);
          }
        });
      } else {
        // Patients see only their own plans
        plansQuery = query(
          collection(db, "treatment_plans"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(plansQuery);
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          plansData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            completedAt: data.completedAt?.toDate(),
            preferredDate: data.preferredDate?.toDate(),
            responses: (data.responses || []).map((resp: any) => ({
              ...resp,
              createdAt: resp.createdAt?.toDate(),
            })),
          } as TreatmentPlan);
        });
      }

      setPlans(plansData);
      if (plansData.length > 0 && !selectedPlan) {
        setSelectedPlan(plansData[0]);
      }
    } catch (error) {
      console.error("Error fetching treatment plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) return;

    if (selectedProcedures.length === 0) {
      alert('Please select at least one medical procedure');
      return;
    }

    setSubmitting(true);

    try {
      const newPlan = {
        userId: user.uid,
        userEmail: userProfile.email,
        userName: userProfile.displayName,
        title: formData.title,
        description: formData.description,
        medicalCondition: formData.medicalCondition,
        currentSymptoms: formData.currentSymptoms,
        desiredOutcome: formData.desiredOutcome,
        procedureTags: selectedProcedures,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        priority: formData.priority,
        status: 'pending',
        responses: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "treatment_plans"), newPlan);
      
      setShowCreateForm(false);
      setFormData({
        title: "",
        description: "",
        medicalCondition: "",
        currentSymptoms: "",
        desiredOutcome: "",
        budget: "",
        priority: "medium",
      });
      setSelectedProcedures([]);
      
      await fetchPlans();
    } catch (error) {
      console.error("Error creating treatment plan:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDoctorResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile || !selectedPlan || !selectedPlan.id) return;

    setSubmitting(true);

    try {
      const response: DoctorResponse = {
        id: `${Date.now()}`,
        doctorId: user.uid,
        doctorName: userProfile.displayName,
        doctorEmail: userProfile.email,
        doctorSpecialization: userProfile.personalHealthcarePersonnelData?.specialization,
        response: responseText,
        createdAt: new Date(),
      };

      const planRef = doc(db, "treatment_plans", selectedPlan.id);
      await updateDoc(planRef, {
        responses: arrayUnion(response),
        status: 'reviewed',
        updatedAt: serverTimestamp(),
      });

      setResponseText("");
      setRespondingToPlan(null);
      await fetchPlans();
    } catch (error) {
      console.error("Error adding doctor response:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'reviewed': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'approved': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'completed': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-zinc-400';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white">
        <div className="flex h-screen">
          {/* Sidebar - Treatment Plans List */}
          <div className="w-80 border-r border-zinc-800 overflow-y-auto">
            <div className="p-4 border-b border-zinc-800">
              <h2 className="text-xl font-bold mb-3">Treatment Plans</h2>
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full px-4 py-2 bg-white text-black hover:bg-zinc-200 transition-colors rounded-lg font-medium text-sm flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Treatment Plan
              </button>
            </div>

            <div className="p-2">
              {plans.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">
                  <p>No treatment plans yet</p>
                  <p className="text-sm mt-2">Create your first plan to get started</p>
                </div>
              ) : (
                plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                      selectedPlan?.id === plan.id
                        ? 'bg-zinc-800 border border-zinc-700'
                        : 'hover:bg-zinc-900 border border-transparent'
                    }`}
                  >
                    <div className="font-medium mb-1 truncate">{plan.title}</div>
                    <div className="text-xs text-zinc-400 mb-2 truncate">{plan.medicalCondition}</div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(plan.status)}`}>
                        {plan.status}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {plan.responses.length} responses
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {showCreateForm ? (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Create Treatment Plan Request</h2>
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="text-zinc-400 hover:text-white"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <form onSubmit={handleCreatePlan} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Title</label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-600"
                        placeholder="Brief title for your treatment request"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Medical Condition</label>
                      <input
                        type="text"
                        required
                        value={formData.medicalCondition}
                        onChange={(e) => setFormData({ ...formData, medicalCondition: e.target.value })}
                        className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-600"
                        placeholder="What condition do you want to address?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Current Symptoms</label>
                      <textarea
                        required
                        rows={3}
                        value={formData.currentSymptoms}
                        onChange={(e) => setFormData({ ...formData, currentSymptoms: e.target.value })}
                        className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-600"
                        placeholder="Describe your current symptoms"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Detailed Description</label>
                      <textarea
                        required
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-600"
                        placeholder="Provide detailed information about your condition and history"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Medical Procedures <span className="text-red-400">*</span></label>
                      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 max-h-60 overflow-y-auto">
                        {MEDICAL_PROCEDURES.map((procedure) => (
                          <label key={procedure} className="flex items-center gap-2 py-2 hover:bg-zinc-800 px-2 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedProcedures.includes(procedure)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProcedures([...selectedProcedures, procedure]);
                                } else {
                                  setSelectedProcedures(selectedProcedures.filter(p => p !== procedure));
                                }
                              }}
                              className="w-4 h-4 accent-white"
                            />
                            <span className="text-sm">{procedure}</span>
                          </label>
                        ))}
                      </div>
                      {selectedProcedures.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedProcedures.map(proc => (
                            <span key={proc} className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                              {proc}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Desired Outcome</label>
                      <textarea
                        required
                        rows={3}
                        value={formData.desiredOutcome}
                        onChange={(e) => setFormData({ ...formData, desiredOutcome: e.target.value })}
                        className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-600"
                        placeholder="What are your goals for this treatment?"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Budget (Optional)</label>
                        <input
                          type="number"
                          value={formData.budget}
                          onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                          className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-600"
                          placeholder="Your budget in USD"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Priority</label>
                        <select
                          value={formData.priority}
                          onChange={(e) => setFormData({ ...formData, priority: e.target.value as TreatmentPlanPriority })}
                          className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-600"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2 bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-700 disabled:text-zinc-400 transition-colors rounded-lg font-medium"
                      >
                        {submitting ? 'Submitting...' : 'Submit Treatment Plan'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-lg font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : selectedPlan ? (
              <div className="flex-1 overflow-y-auto">
                {/* Treatment Plan Details - Top Section */}
                <div className="border-b border-zinc-800 p-6 bg-zinc-900/50">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-3xl font-bold mb-2">{selectedPlan.title}</h1>
                        <p className="text-zinc-400">{selectedPlan.medicalCondition}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedPlan.status)}`}>
                          {selectedPlan.status}
                        </span>
                        <span className={`px-3 py-1 text-sm font-medium ${getPriorityColor(selectedPlan.priority)}`}>
                          {selectedPlan.priority} priority
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mt-6">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-400 mb-2">Current Symptoms</h3>
                        <p className="text-white">{selectedPlan.currentSymptoms}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-400 mb-2">Desired Outcome</h3>
                        <p className="text-white">{selectedPlan.desiredOutcome}</p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-zinc-400 mb-2">Description</h3>
                      <p className="text-white">{selectedPlan.description}</p>
                    </div>

                    {selectedPlan.budget && (
                      <div className="mt-4">
                        <h3 className="text-sm font-semibold text-zinc-400 mb-2">Budget</h3>
                        <p className="text-white">${selectedPlan.budget.toLocaleString()}</p>
                      </div>
                    )}

                    <div className="mt-4 text-sm text-zinc-500">
                      Created {selectedPlan.createdAt?.toLocaleDateString()} by {selectedPlan.userName}
                    </div>
                  </div>
                </div>

                {/* Doctor Responses - Bottom Section */}
                <div className="p-6">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold">
                        Professional Responses ({selectedPlan.responses.length})
                      </h2>
                      {userProfile?.role === 'healthcare_personnel' && (
                        <button
                          onClick={() => setRespondingToPlan(selectedPlan.id || null)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm"
                        >
                          Add Response
                        </button>
                      )}
                    </div>

                    {respondingToPlan === selectedPlan.id && (
                      <form onSubmit={handleDoctorResponse} className="mb-6 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                        <h3 className="font-semibold mb-3">Your Response</h3>
                        <textarea
                          required
                          rows={6}
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          className="w-full px-4 py-2 bg-black border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-600 mb-3"
                          placeholder="Provide your professional opinion and treatment recommendations..."
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white rounded-lg font-medium text-sm"
                          >
                            {submitting ? 'Submitting...' : 'Submit Response'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRespondingToPlan(null);
                              setResponseText("");
                            }}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="space-y-4">
                      {selectedPlan.responses.length === 0 ? (
                        <div className="text-center py-12 text-zinc-400">
                          <svg className="w-16 h-16 mx-auto mb-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          <p className="text-lg">No responses yet</p>
                          <p className="text-sm mt-2">Doctors will review and respond to your treatment plan</p>
                        </div>
                      ) : (
                        selectedPlan.responses.map((response) => (
                          <div key={response.id} className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                            <div className="flex items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                    {response.doctorName.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-semibold">{response.doctorName}</div>
                                    <div className="text-sm text-zinc-400">
                                      {response.doctorSpecialization || 'Personnel'} • {response.createdAt?.toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                                <p className="text-white mt-3 whitespace-pre-wrap">{response.response}</p>
                                {response.recommendedTreatment && (
                                  <div className="mt-3 p-3 bg-zinc-800 rounded">
                                    <div className="text-sm font-semibold text-zinc-400 mb-1">Recommended Treatment</div>
                                    <p className="text-white">{response.recommendedTreatment}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-400">
                <div className="text-center">
                  <svg className="w-24 h-24 mx-auto mb-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-xl">Select a treatment plan to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
