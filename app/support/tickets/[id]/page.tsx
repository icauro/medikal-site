"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { supabase, convertDatabaseRow } from "@/lib/supabase";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { SupportTicket, TicketStatus, TicketMessage } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTicket() {
      try {
        const resolvedParams = await params;
        const ticketId = resolvedParams.id;

        const { data, error: fetchError } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('id', ticketId)
          .single();

        if (fetchError || !data) {
          console.error("🚫 [TICKET_DETAIL] Error fetching ticket:", fetchError);
          setError("Ticket not found");
          setLoading(false);
          return;
        }

        const ticketData = convertDatabaseRow(data) as SupportTicket;

        // Check if user has access to this ticket - ticketData is guaranteed to be non-null here
        if (user && (ticketData as SupportTicket).userId !== user.id && userProfile?.role !== "admin") {
          setError("Access denied");
          setLoading(false);
          return;
        }

        setTicket(ticketData);
      } catch (err) {
        console.error("Error loading ticket:", err);
        setError("Failed to load ticket");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadTicket();
    }
  }, [params, user, userProfile]);

  const handleAddReply = async () => {
    if (!user || !userProfile || !ticket || !replyContent.trim()) return;

    if (!userProfile.role) {
      setError("Complete your role setup before replying");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Use Date objects for messages array (serverTimestamp() not supported in arrays)
      const newMessage: TicketMessage = {
        id: Date.now().toString(),
        authorId: user.id,
        authorName: userProfile.displayName,
        authorRole: userProfile.role,
        content: replyContent,
        createdAt: new Date(),
      };

      const updatedMessages = [...ticket.messages, newMessage];

      const { error } = await supabase
        .from('support_tickets')
        .update({
          messages: updatedMessages,
          updated_at: new Date().toISOString(),
          status: 'in_progress'
        })
        .eq('id', ticket.id);

      if (error) throw error;

      console.log('✅ [SUPPORT] Message added to ticket');

      setTicket({ ...ticket, messages: updatedMessages });
      setReplyContent("");
    } catch (err) {
      console.error("Error adding reply:", err);
      setError("Failed to add reply");
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-black text-white p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <p className="text-zinc-400 text-lg">Loading ticket...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !ticket) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-black text-white p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <p className="text-red-400 text-lg mb-4">{error || "Ticket not found"}</p>
              <Link
                href="/support"
                className="text-blue-400 hover:text-blue-300"
              >
                ← Back to Support
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link
              href="/support"
              className="text-zinc-400 hover:text-white transition-colors mb-4 inline-block"
            >
              ← Back to Support
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold mb-2">{ticket.subject}</h1>
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {ticket.status.replace("_", " ")}
                  </span>
                  <span>{ticket.category}</span>
                  <span>•</span>
                  <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
              {error}
            </div>
          )}

          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6 mb-6">
            <div className="text-sm text-zinc-400 space-y-2 mb-6">
              <p><strong className="text-white">Category:</strong> {ticket.category}</p>
              <p><strong className="text-white">Priority:</strong> {ticket.priority}</p>
              <p><strong className="text-white">Status:</strong> {ticket.status.replace("_", " ")}</p>
            </div>

            <div className="text-zinc-300 whitespace-pre-wrap">{ticket.description}</div>
          </div>

          {/* Messages */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-6">Conversation</h2>
            
            <div className="space-y-4">
              {ticket.messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg ${
                    message.authorRole === "admin"
                      ? "bg-blue-900/20 border border-blue-800"
                      : message.authorId === user?.id
                      ? "bg-zinc-800 border border-zinc-700"
                      : "bg-zinc-800/50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-white">{message.authorName}</p>
                      <p className="text-xs text-zinc-400 capitalize">{message.authorRole}</p>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-zinc-300 whitespace-pre-wrap">{message.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reply Form */}
          {ticket.status !== "closed" && (
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
              <h2 className="text-xl font-semibold mb-4">Add Reply</h2>
              <div className="space-y-4">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type your message..."
                  rows={6}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                />
                <button
                  onClick={handleAddReply}
                  disabled={!replyContent.trim() || submitting}
                  className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Sending..." : "Send Reply"}
                </button>
              </div>
            </div>
          )}

          {ticket.status === "closed" && (
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6 text-center">
              <p className="text-zinc-400">This ticket has been closed. You can create a new ticket if you need further assistance.</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
