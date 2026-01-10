"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { SupportTicket, TicketStatus, TicketPriority } from "@/lib/types";
import Link from "next/link";

export default function AdminSupportPage() {
  const { user, userProfile } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filter, setFilter] = useState<TicketStatus | "all">("all");
  const [processing, setProcessing] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [statusUpdate, setStatusUpdate] = useState<TicketStatus | "">("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const ticketsRef = collection(db, "support_tickets");
      const ticketsQuery = query(ticketsRef, orderBy("updatedAt", "desc"));
      const querySnapshot = await getDocs(ticketsQuery);
      
      const ticketsData: SupportTicket[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        ticketsData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          resolvedAt: data.resolvedAt?.toDate(),
          closedAt: data.closedAt?.toDate(),
          messages: (data.messages || []).map((msg: any) => ({
            ...msg,
            createdAt: msg.createdAt?.toDate(),
          })),
        } as SupportTicket);
      });

      setTickets(ticketsData);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setError("Failed to fetch support tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (ticketId: string, newStatus: TicketStatus) => {
    if (!user) return;

    setProcessing(ticketId);
    setError(null);

    try {
      const ticketRef = doc(db, "support_tickets", ticketId);
      const updateData: any = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };

      if (newStatus === "resolved") {
        updateData.resolvedAt = serverTimestamp();
        updateData.resolvedBy = user.uid;
      } else if (newStatus === "closed") {
        updateData.closedAt = serverTimestamp();
      }

      await updateDoc(ticketRef, updateData);
      await fetchTickets();
      
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
      setError("Failed to update ticket status");
    } finally {
      setProcessing(null);
    }
  };

  const handleAddReply = async (ticketId: string) => {
    if (!user || !userProfile || !replyContent.trim()) return;

    setProcessing(ticketId);
    setError(null);

    try {
      const ticketRef = doc(db, "support_tickets", ticketId);
      const ticket = tickets.find((t) => t.id === ticketId);
      if (!ticket) return;

      // Use Date objects for messages array (serverTimestamp() not supported in arrays)
      const newMessage = {
        id: Date.now().toString(),
        authorId: user.uid,
        authorName: userProfile.displayName,
        authorRole: userProfile.role,
        content: replyContent,
        createdAt: new Date(),
        isInternal: false,
      };

      const updatedMessages = [...ticket.messages, newMessage];

      await updateDoc(ticketRef, {
        messages: updatedMessages,
        status: ticket.status === "closed" ? "open" : ticket.status,
        updatedAt: serverTimestamp(),
      });

      setReplyContent("");
      await fetchTickets();
      
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, messages: updatedMessages });
      }
    } catch (error) {
      console.error("Error adding reply:", error);
      setError("Failed to add reply");
    } finally {
      setProcessing(null);
    }
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

  const getStatusCounts = () => {
    return {
      all: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      in_progress: tickets.filter((t) => t.status === "in_progress").length,
      resolved: tickets.filter((t) => t.status === "resolved").length,
      closed: tickets.filter((t) => t.status === "closed").length,
    };
  };

  const statusCounts = getStatusCounts();
  const filteredTickets = filter === "all" 
    ? tickets 
    : tickets.filter((t) => t.status === filter);

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link
              href="/admin"
              className="text-zinc-400 hover:text-white transition-colors text-sm mb-2 inline-block"
            >
              ← Back to Admin Dashboard
            </Link>
            <h1 className="text-4xl font-bold">Support Tickets</h1>
            <p className="text-zinc-400 mt-2">Manage and respond to user support requests</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-8 text-center">
              <p className="text-zinc-400">Loading support tickets...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Tickets List */}
              <div className="lg:col-span-2 space-y-6">
                {/* Status Filter */}
                <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
                  <div className="flex flex-wrap gap-2">
                    {(["all", "open", "in_progress", "resolved", "closed"] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filter === status
                            ? "bg-white text-black"
                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                        }`}
                      >
                        {status.replace("_", " ").toUpperCase()} ({statusCounts[status]})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tickets List */}
                <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                  {filteredTickets.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-zinc-400">No tickets found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-800">
                      {filteredTickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          onClick={() => setSelectedTicket(ticket)}
                          className={`p-6 cursor-pointer transition-colors ${
                            selectedTicket?.id === ticket.id
                              ? "bg-zinc-800"
                              : "hover:bg-zinc-800/50"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white mb-1">{ticket.subject}</h3>
                              <p className="text-sm text-zinc-400 line-clamp-1">{ticket.description}</p>
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
                            <span>{ticket.userName}</span>
                            <span>•</span>
                            <span>{ticket.category}</span>
                            <span>•</span>
                            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{ticket.messages.length} message{ticket.messages.length !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Ticket Detail Sidebar */}
              <div className="space-y-6">
                {selectedTicket ? (
                  <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-6 sticky top-8">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-semibold">{selectedTicket.subject}</h2>
                        <button
                          onClick={() => setSelectedTicket(null)}
                          className="text-zinc-400 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div className="flex gap-2 mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                          {selectedTicket.status.replace("_", " ")}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)} bg-zinc-800`}>
                          {selectedTicket.priority}
                        </span>
                      </div>

                      <div className="text-sm text-zinc-400 space-y-1 mb-6">
                        <p><strong className="text-white">User:</strong> {selectedTicket.userName} ({selectedTicket.userRole})</p>
                        <p><strong className="text-white">Email:</strong> {selectedTicket.userEmail}</p>
                        <p><strong className="text-white">Category:</strong> {selectedTicket.category}</p>
                        <p><strong className="text-white">Created:</strong> {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {selectedTicket.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-4 rounded-lg ${
                            message.authorRole === "admin"
                              ? "bg-blue-900/20 border border-blue-800"
                              : "bg-zinc-800"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-white">{message.authorName}</p>
                              <p className="text-xs text-zinc-400">{message.authorRole}</p>
                            </div>
                            <p className="text-xs text-zinc-500">
                              {new Date(message.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-zinc-300 whitespace-pre-wrap">{message.content}</p>
                        </div>
                      ))}
                    </div>

                    {/* Reply Form */}
                    <div className="space-y-4 pt-4 border-t border-zinc-800">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Type your reply..."
                        rows={4}
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                      />
                      <button
                        onClick={() => handleAddReply(selectedTicket.id!)}
                        disabled={!replyContent.trim() || processing === selectedTicket.id}
                        className="w-full px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processing === selectedTicket.id ? "Sending..." : "Send Reply"}
                      </button>
                    </div>

                    {/* Status Update */}
                    <div className="pt-4 border-t border-zinc-800 space-y-4">
                      <select
                        value={statusUpdate}
                        onChange={(e) => setStatusUpdate(e.target.value as TicketStatus)}
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      >
                        <option value="">Update Status</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      {statusUpdate && (
                        <button
                          onClick={() => {
                            handleStatusUpdate(selectedTicket.id!, statusUpdate);
                            setStatusUpdate("");
                          }}
                          disabled={processing === selectedTicket.id}
                          className="w-full px-4 py-2 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
                        >
                          Update Status
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6 text-center">
                    <p className="text-zinc-400">Select a ticket to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
