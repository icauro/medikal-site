"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { supabase, convertDatabaseRow } from "@/lib/supabase";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { SupportTicket, TicketCategory, TicketPriority, TicketStatus } from "@/lib/types";
import Link from "next/link";
import { theme } from "@/lib/theme";

export default function SupportPage() {
  const { user, userProfile } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    subject: "",
    category: "general" as TicketCategory,
    description: "",
    priority: "medium" as TicketPriority,
  });

  useEffect(() => {
    if (user) {
      fetchTickets();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchTickets = async () => {
    if (!user) return;

    try {
      // Fetch tickets from support_tickets table
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error("🚫 [SUPPORT] Error fetching tickets:", error);
        return;
      }

      const ticketsData = (data || []).map(row => convertDatabaseRow(row)) as SupportTicket[];
      setTickets(ticketsData);
      console.log("✅ [SUPPORT] Loaded tickets:", ticketsData.length);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !userProfile) return;

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Check for unresolved tickets (open or in_progress) - limit to 3
      const { data: unresolvedData, error: countError } = await supabase
        .from('support_tickets')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .in('status', ['open', 'in_progress']);

      if (countError) throw countError;

      const unresolvedCount = unresolvedData?.length || 0;
      
      if (unresolvedCount >= 3) {
        setError("You can have a maximum of 3 unresolved tickets at a time. Please wait for your existing tickets to be resolved or closed before creating a new one.");
        setSubmitting(false);
        return;
      }

      // Create new ticket
      const ticketData = {
        user_id: user.id,
        subject: formData.subject,
        category: formData.category,
        description: formData.description,
        priority: formData.priority,
        status: 'open' as TicketStatus,
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: createError } = await supabase
        .from('support_tickets')
        .insert([ticketData]);

      if (createError) throw createError;

      console.log('✅ [SUPPORT] Ticket created');
      setSuccess(true);
      setFormData({
        subject: "",
        category: "general",
        description: "",
        priority: "medium",
      });
      setShowForm(false);
      await fetchTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit support ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case "open": return "text-blue-400 bg-blue-900/20";
      case "in_progress": return "text-yellow-400 bg-yellow-900/20";
      case "resolved": return "text-green-400 bg-green-900/20";
      case "closed": return "text-zinc-400 bg-zinc-800";
      default: return "text-zinc-400 bg-zinc-800";
    }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case "urgent": return "text-red-400";
      case "high": return "text-orange-400";
      case "medium": return "text-yellow-400";
      case "low": return "text-green-400";
      default: return "text-zinc-400";
    }
  };

  return (
    <ProtectedRoute>
      <div className={`min-h-screen ${theme.gradients.pageBgClasses} text-white p-8`}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Support Center</h1>
            <p className="text-zinc-400">Get help with your account or report issues</p>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-800 rounded-lg text-green-400">
              Support ticket created successfully! We'll get back to you soon.
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Create Ticket Button */}
              {!showForm && (
                <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
                  >
                    + Create Support Ticket
                  </button>
                </div>
              )}

              {/* Create Ticket Form */}
              {showForm && (
                <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold">Create Support Ticket</h2>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setError(null);
                      }}
                      className="text-zinc-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-zinc-300 mb-2">
                        Subject <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                        placeholder="Brief description of your issue"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-zinc-300 mb-2">
                          Category <span className="text-red-400">*</span>
                        </label>
                        <select
                          id="category"
                          name="category"
                          required
                          value={formData.category}
                          onChange={handleChange}
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                        >
                          <option value="general">General</option>
                          <option value="account">Account</option>
                          <option value="technical">Technical</option>
                          <option value="doctor_verification">Doctor Verification</option>
                          <option value="billing">Billing</option>
                          <option value="medical_question">Medical Question</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-zinc-300 mb-2">
                          Priority <span className="text-red-400">*</span>
                        </label>
                        <select
                          id="priority"
                          name="priority"
                          required
                          value={formData.priority}
                          onChange={handleChange}
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-2">
                        Description <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        required
                        rows={6}
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                        placeholder="Please provide detailed information about your issue..."
                      />
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? "Submitting..." : "Submit Ticket"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setError(null);
                        }}
                        className="px-6 py-3 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tickets List */}
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                <div className="p-6 border-b border-zinc-800">
                  <h2 className="text-2xl font-semibold">Your Support Tickets</h2>
                </div>

                {loading ? (
                  <div className="p-8 text-center">
                    <p className="text-zinc-400">Loading tickets...</p>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-zinc-400">No support tickets yet. Create one to get started!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800">
                    {tickets.map((ticket) => (
                      <Link
                        key={ticket.id}
                        href={`/support/tickets/${ticket.id}`}
                        className="block p-6 hover:bg-zinc-800/50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-1">{ticket.subject}</h3>
                            <p className="text-sm text-zinc-400 line-clamp-2">{ticket.description}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2 ml-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                              {ticket.status.replace("_", " ")}
                            </span>
                            <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-zinc-500 mt-3">
                          <span>{ticket.category}</span>
                          <span>•</span>
                          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{ticket.messages.length} message{ticket.messages.length !== 1 ? "s" : ""}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
                <h3 className="text-lg font-semibold mb-4">Help Resources</h3>
                <div className="space-y-3 text-sm text-zinc-400">
                  <p>• Check our FAQ for common questions</p>
                  <p>• For urgent medical issues, contact emergency services</p>
                  <p>• Response time: 24-48 hours</p>
                </div>
              </div>

              {userProfile?.role === "healthcare_personnel" && (
                <div className="bg-blue-900/20 rounded-lg border border-blue-800 p-6">
                  <h3 className="text-lg font-semibold mb-2 text-blue-400">Professional Verification</h3>
                  <p className="text-sm text-zinc-400 mb-4">
                    Need help with verification? Use the "Verification" category.
                  </p>
                  <Link
                    href="/profile"
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    View Profile Page →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
