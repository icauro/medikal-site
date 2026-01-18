"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { UserComment, CommentSortType } from "@/lib/types";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  CollectionReference,
} from "firebase/firestore";
import Link from "next/link";

type EntityType = "healthcare_personnel" | "medical_facility" | "agency";

interface UserCommentsSectionProps {
  entityId: string;
  entityType: EntityType;
  entityName: string;
}

export default function UserCommentsSection({
  entityId,
  entityType,
  entityName,
}: UserCommentsSectionProps) {
  const { user, userProfile, loading } = useAuth();
  const [comments, setComments] = useState<UserComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<CommentSortType>("top");
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [userVotes, setUserVotes] = useState<Map<string, "upvote" | "downvote">>(new Map());

  // Get subcollection path based on entity type
  const getCollectionPath = () => {
    const listings = {
      healthcare_personnel: "healthcare_personnel_listings",
      medical_facility: "medical_facility_listings",
      agency: "agency_listings",
    };
    return listings[entityType];
  };

  // Load comments
  useEffect(() => {
    loadComments();
  }, [entityId, entityType, sortBy]);

  const loadComments = async () => {
    setCommentsLoading(true);
    try {
      const listingPath = getCollectionPath();
      const commentsRef = collection(
        db,
        listingPath,
        entityId,
        "comments"
      ) as CollectionReference<UserComment>;
      let q;

      switch (sortBy) {
        case "newest":
          q = query(
            commentsRef,
            orderBy("createdAt", "desc")
          );
          break;
        case "oldest":
          q = query(
            commentsRef,
            orderBy("createdAt", "asc")
          );
          break;
        case "top":
        default:
          q = query(
            commentsRef,
            orderBy("score", "desc")
          );
      }

      const snapshot = await getDocs(q);
      const loadedComments = snapshot.docs
        .filter((doc) => !doc.data().isDeleted) // Filter out soft-deleted comments
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        } as UserComment));

      setComments(loadedComments);

      // Expand all comments by default
      const allCommentIds = new Set(loadedComments.map((c) => c.id));
      setExpandedReplies(allCommentIds);

      // Load user's votes
      if (user) {
        const votes = new Map<string, "upvote" | "downvote">();
        loadedComments.forEach((comment) => {
          if (comment.upvotes?.includes(user.uid)) {
            votes.set(comment.id, "upvote");
          } else if (comment.downvotes?.includes(user.uid)) {
            votes.set(comment.id, "downvote");
          }
        });
        setUserVotes(votes);
      }
    } catch (error) {
      console.error("📋 [COMMENTS] Error loading comments:", error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const submitComment = async (parentCommentId?: string) => {
    if (!user || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const listingPath = getCollectionPath();
      await addDoc(
        collection(db, listingPath, entityId, "comments"),
        {
          userId: user.uid,
          userDisplayName: user.displayName || "Anonymous",
          userPhotoUrl: user.photoURL || null,
          content: newComment,
          upvotes: [],
          downvotes: [],
          score: 0,
          replyCount: 0,
          isEdited: false,
          isDeleted: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      setNewComment("");
      setReplyingTo(null);
      setReplyContent("");
      loadComments();
    } catch (error) {
      console.error("📋 [COMMENTS] Error submitting comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (commentId: string, voteType: "upvote" | "downvote") => {
    if (!user) {
      console.log("🔐 [COMMENTS] User not authenticated");
      return;
    }

    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    const currentVote = userVotes.get(commentId);
    const listingPath = getCollectionPath();
    const commentRef = doc(db, listingPath, entityId, "comments", commentId);

    try {
      let newUpvotes = [...(comment.upvotes || [])];
      let newDownvotes = [...(comment.downvotes || [])];

      // Remove existing vote if present
      newUpvotes = newUpvotes.filter((userId) => userId !== user.uid);
      newDownvotes = newDownvotes.filter((userId) => userId !== user.uid);

      // Add new vote if different
      if (currentVote !== voteType) {
        if (voteType === "upvote") {
          newUpvotes.push(user.uid);
        } else {
          newDownvotes.push(user.uid);
        }
      }

      const newScore = newUpvotes.length - newDownvotes.length;

      await updateDoc(commentRef, {
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        score: newScore,
      });

      // Update local state
      const newVotes = new Map(userVotes);
      if (currentVote === voteType) {
        newVotes.delete(commentId);
      } else {
        newVotes.set(commentId, voteType);
      }
      setUserVotes(newVotes);
      loadComments();
    } catch (error) {
      console.error("📋 [COMMENTS] Error voting on comment:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const listingPath = getCollectionPath();
      
      // 1. Soft-delete the comment (mark as deleted)
      await updateDoc(doc(db, listingPath, entityId, "comments", commentId), {
        isDeleted: true,
        updatedAt: serverTimestamp(),
      });
      
      // 2. Cascade delete: Also soft-delete all replies to this comment
      const repliesRef = collection(db, listingPath, entityId, "comments", commentId, "replies");
      const repliesSnapshot = await getDocs(repliesRef);
      
      const deleteRepliesPromises = repliesSnapshot.docs.map((doc) =>
        updateDoc(doc.ref, {
          isDeleted: true,
          updatedAt: serverTimestamp(),
        })
      );
      
      await Promise.all(deleteRepliesPromises);
      
      console.log(`📋 [COMMENTS] Soft-deleted comment ${commentId} and ${repliesSnapshot.docs.length} replies`);
      loadComments();
    } catch (error) {
      console.error("📋 [COMMENTS] Error deleting comment:", error);
    }
  };

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedReplies(newExpanded);
  };

  if (loading || commentsLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-zinc-800/40 border border-zinc-800 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-zinc-700 rounded w-32 mb-2"></div>
            <div className="h-3 bg-zinc-700 rounded w-full mb-2"></div>
            <div className="h-3 bg-zinc-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comments Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">
          Comments ({comments.length})
        </h3>
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-400">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as CommentSortType)}
            className="bg-zinc-800 border border-zinc-700 rounded px-3 py-1 text-sm text-white hover:border-zinc-600 transition-colors"
          >
            <option value="top">Top</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      {/* New Comment Form */}
      {user && (userProfile?.role === 'patient' || userProfile?.role === 'admin') ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {user.displayName?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white mb-1">{user.displayName}</p>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your experience or thoughts..."
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-blue-500 transition-colors text-sm"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setNewComment("")}
              disabled={!newComment.trim()}
              className="px-4 py-2 text-sm rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => submitComment()}
              disabled={!newComment.trim() || submitting}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors"
            >
              {submitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </div>
      ) : user ? (
        <div className="bg-zinc-900/50 border border-dashed border-zinc-700 rounded-xl p-6 text-center">
          <p className="text-zinc-400 mb-3">
            Only patients and admins can comment. Please switch to a patient account to participate.
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-dashed border-zinc-700 rounded-xl p-6 text-center">
          <p className="text-zinc-400 mb-3">
            Sign in to share your experience with {entityName}
          </p>
          <Link
            href="/login"
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Sign In
          </Link>
        </div>
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              user={user}
              userVote={userVotes.get(comment.id)}
              onVote={handleVote}
              onDelete={handleDeleteComment}
              onReply={() => setReplyingTo(comment.id)}
              onCommentUpdated={loadComments}
              entityId={entityId}
              entityType={entityType}
              expanded={expandedReplies.has(comment.id)}
              onToggleReplies={() => toggleReplies(comment.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-zinc-800/40 border border-dashed border-zinc-700 rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">💬</div>
          <p className="text-zinc-300 mb-2">No comments yet</p>
          <p className="text-sm text-zinc-500">
            Be the first to share your experience with {entityName}!
          </p>
        </div>
      )}
    </div>
  );
}

interface CommentThreadProps {
  comment: UserComment;
  user: any;
  userVote?: "upvote" | "downvote";
  onVote: (commentId: string, voteType: "upvote" | "downvote") => void;
  onDelete: (commentId: string) => void;
  onReply: () => void;
  onCommentUpdated?: () => void;
  entityId: string;
  entityType: EntityType;
  expanded: boolean;
  onToggleReplies: () => void;
  pathSegments?: string[]; // Path segments to this comment: ["comments", "123", "replies", "456", "replies"]
}

function CommentThread({
  comment,
  user,
  userVote,
  onVote,
  onDelete,
  onReply,
  onCommentUpdated,
  entityId,
  entityType,
  expanded,
  onToggleReplies,
  pathSegments = ["comments"],
}: CommentThreadProps) {
  const [replies, setReplies] = useState<UserComment[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyingTo, setReplyingTo] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [expandedNestedReplies, setExpandedNestedReplies] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [replyVotes, setReplyVotes] = useState<Map<string, "upvote" | "downvote">>(new Map());

  // Get subcollection path based on entity type
  const getCollectionPath = () => {
    const listings = {
      healthcare_personnel: "healthcare_personnel_listings",
      medical_facility: "medical_facility_listings",
      agency: "agency_listings",
    };
    return listings[entityType];
  };

  const loadReplies = async () => {
    if (expanded) {
      setLoadingReplies(true);
      try {
        const listingPath = getCollectionPath();
        const repliesPaths = [...pathSegments, comment.id, "replies"];
        const pathDisplay = repliesPaths.join("/");
        console.log(`📋 [COMMENTS] Loading replies from: ${listingPath}/${entityId}/${pathDisplay}`);
        
        const q = query(
          collection(db, listingPath, entityId, ...repliesPaths) as CollectionReference<UserComment>,
          orderBy("createdAt", "asc")
        );
        const snapshot = await getDocs(q);
        console.log(`📋 [COMMENTS] Found ${snapshot.docs.length} replies (before filtering)`);
        
        const loadedReplies = snapshot.docs
          .filter((doc) => !doc.data().isDeleted)
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
          } as UserComment));
        
        console.log(`📋 [COMMENTS] Loaded ${loadedReplies.length} replies (after filtering deleted)`);
        setReplies(loadedReplies);

        // Expand all nested replies by default
        const allReplyIds = new Set(loadedReplies.map((r) => r.id));
        setExpandedNestedReplies(allReplyIds);

        // Track user's votes on nested replies
        if (user) {
          const votes = new Map<string, "upvote" | "downvote">();
          loadedReplies.forEach((reply) => {
            if (reply.upvotes?.includes(user.uid)) {
              votes.set(reply.id, "upvote");
            } else if (reply.downvotes?.includes(user.uid)) {
              votes.set(reply.id, "downvote");
            }
          });
          setReplyVotes(votes);
        }
      } catch (error) {
        console.error("📋 [COMMENTS] Error loading replies:", error);
      } finally {
        setLoadingReplies(false);
      }
    }
  };

  useEffect(() => {
    if (expanded) {
      console.log(`📋 [COMMENTS] Expanded reply section for comment ${comment.id}, reply count: ${comment.replyCount}`);
      loadReplies();
    }
  }, [expanded, comment.id]);

  const toggleNestedReplies = (replyId: string) => {
    const newExpanded = new Set(expandedNestedReplies);
    if (expandedNestedReplies.has(replyId)) {
      newExpanded.delete(replyId);
    } else {
      newExpanded.add(replyId);
    }
    setExpandedNestedReplies(newExpanded);
  };

  const handleVoteLocal = async (voteType: "upvote" | "downvote") => {
    if (!user) {
      console.log("🔐 [COMMENTS] User not authenticated");
      return;
    }

    const currentVote = userVote;
    const listingPath = getCollectionPath();
    const commentPaths = [...pathSegments, comment.id];
    const commentRef = doc(db, listingPath, entityId, ...commentPaths);

    try {
      let newUpvotes = [...(comment.upvotes || [])];
      let newDownvotes = [...(comment.downvotes || [])];

      newUpvotes = newUpvotes.filter((userId) => userId !== user.uid);
      newDownvotes = newDownvotes.filter((userId) => userId !== user.uid);

      if (currentVote !== voteType) {
        if (voteType === "upvote") {
          newUpvotes.push(user.uid);
        } else {
          newDownvotes.push(user.uid);
        }
      }

      const newScore = newUpvotes.length - newDownvotes.length;

      await updateDoc(commentRef, {
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        score: newScore,
      });

      console.log(`✅ [COMMENTS] Voted on comment at path: ${[...pathSegments, comment.id].join("/")}`);
      if (onCommentUpdated) {
        onCommentUpdated();
      }
    } catch (error) {
      console.error("📋 [COMMENTS] Error voting on comment:", error);
    }
  };

  const submitEdit = async () => {
    if (!user || !editContent.trim()) return;

    setSubmittingEdit(true);
    try {
      const listingPath = getCollectionPath();
      const commentPaths = [...pathSegments, comment.id];
      const commentRef = doc(db, listingPath, entityId, ...commentPaths);
      
      await updateDoc(commentRef, {
        content: editContent,
        isEdited: true,
        updatedAt: serverTimestamp(),
      });
      
      console.log(`✅ [COMMENTS] Edited comment ${comment.id}`);
      setIsEditing(false);
      
      if (onCommentUpdated) {
        onCommentUpdated();
      } else {
        await loadReplies();
      }
    } catch (error) {
      console.error("📋 [COMMENTS] Error editing comment:", error);
    } finally {
      setSubmittingEdit(false);
    }
  };

  const submitReply = async () => {
    if (!user || !replyContent.trim()) return;

    setSubmittingReply(true);
    try {
      const listingPath = getCollectionPath();
      const repliesPaths = [...pathSegments, comment.id, "replies"];
      const pathDisplay = repliesPaths.join("/");
      console.log(`📋 [COMMENTS] Submitting reply to: ${listingPath}/${entityId}/${pathDisplay}`);
      
      // Add the reply to the replies subcollection
      const docRef = await addDoc(
        collection(db, listingPath, entityId, ...repliesPaths),
        {
          userId: user.uid,
          userDisplayName: user.displayName || "Anonymous",
          userPhotoUrl: user.photoURL || null,
          content: replyContent,
          upvotes: [],
          downvotes: [],
          score: 0,
          replyCount: 0,
          isEdited: false,
          isDeleted: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );
      
      console.log(`✅ [COMMENTS] Reply created with ID: ${docRef.id}`);

      // Increment parent comment's reply count
      const parentPaths = [...pathSegments, comment.id];
      const parentRef = doc(db, listingPath, entityId, ...parentPaths);
      
      await updateDoc(parentRef, {
        replyCount: (comment.replyCount || 0) + 1,
      });
      console.log(`📋 [COMMENTS] Updated parent reply count to ${(comment.replyCount || 0) + 1}`);

      setReplyContent("");
      setReplyingTo(false);
      
      // Reload parent comments to update the UI
      if (onCommentUpdated) {
        console.log(`📋 [COMMENTS] Calling onCommentUpdated callback to reload parent`);
        onCommentUpdated();
      } else {
        await loadReplies();
      }
    } catch (error) {
      console.error("📋 [COMMENTS] Error submitting reply:", error);
    } finally {
      setSubmittingReply(false);
    }
  };

  const formattedDate = new Date(comment.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-3">
      <div className="relative">
        {/* Expand Button - Left Border */}
        {comment.replyCount > 0 && (
          <button
            onClick={onToggleReplies}
            className="absolute -left-6 top-4 text-lg text-zinc-400 hover:text-blue-300 transition-colors flex items-center justify-center w-5 h-5"
            title={`${expanded ? 'Collapse' : 'Expand'} ${comment.replyCount} ${comment.replyCount === 1 ? 'reply' : 'replies'}`}
          >
            {expanded ? '⊖' : '⊕'}
          </button>
        )}

        <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg px-4 pt-2 pb-1 hover:bg-zinc-900/50 transition-colors">
          {/* Comment Header */}
          <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {comment.userDisplayName.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-white text-sm">
                {comment.userDisplayName}
              </span>
              <span className="text-xs text-zinc-500">•</span>
              <span className="text-xs text-zinc-500">{formattedDate}</span>
              {comment.isEdited && (
                <>
                  <span className="text-xs text-zinc-500">•</span>
                  <span className="text-xs text-zinc-400 italic">(edited)</span>
                </>
              )}
            </div>

            {/* Comment Content */}
            <p className="text-zinc-200 text-sm mt-2 leading-relaxed break-words">
              {comment.isDeleted ? (
                <span className="text-zinc-500 italic">[Comment deleted]</span>
              ) : (
                comment.content
              )}
            </p>

            {/* Comment Footer - Actions */}
            <div className="flex items-center gap-4 mt-3">
              {/* Vote Buttons */}
              <div className="flex items-center">
                <button
                  onClick={() => handleVoteLocal("upvote")}
                  className={`-mr-1 hover:text-green-400 transition-colors ${
                    userVote === "upvote" ? "text-green-400" : "text-zinc-500"
                  }`}
                  title="Upvote"
                >
                  ▲
                </button>
                <span className="text-xs font-medium text-zinc-300 min-w-[1.75rem] text-center">
                  {comment.score > 0 ? "+" : ""}{comment.score}
                </span>
                <button
                  onClick={() => handleVoteLocal("downvote")}
                  className={`-ml-1 hover:text-red-400 transition-colors ${
                    userVote === "downvote" ? "text-red-400" : "text-zinc-500"
                  }`}
                  title="Downvote"
                >
                  ▼
                </button>
              </div>

              {/* Reply Button */}
              {user && (
                <button
                  onClick={() => setReplyingTo(!replyingTo)}
                  className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  💬 Reply
                </button>
              )}

              {/* Delete Button */}
              {user && (user.uid === comment.userId || userProfile?.role === 'admin') && (
                <>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-xs text-zinc-400 hover:text-yellow-400 transition-colors"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => onDelete(comment.id)}
                    className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    🗑️ Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && user && user.uid === comment.userId && (
        <div className="bg-zinc-900/20 border border-zinc-800 rounded-lg p-3">
          <div className="flex gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {user.displayName?.charAt(0).toUpperCase() || "U"}
            </div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Edit your comment..."
              className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded p-2 text-white text-sm placeholder-zinc-500 resize-none focus:outline-none focus:border-blue-500 transition-colors"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2 ml-10">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(comment.content);
              }}
              className="px-3 py-1 text-xs border border-zinc-700 text-zinc-400 rounded hover:text-white hover:border-zinc-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submitEdit}
              disabled={!editContent.trim() || submittingEdit}
              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 transition-colors"
            >
              {submittingEdit ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
      </div>

      {/* Reply Form */}
      {replyingTo && user && (
        <div className="ml-6 bg-zinc-900/20 border border-zinc-800 rounded-lg p-3">
          <div className="flex gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {user.displayName?.charAt(0).toUpperCase() || "U"}
            </div>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded p-2 text-white text-sm placeholder-zinc-500 resize-none focus:outline-none focus:border-blue-500 transition-colors"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2 ml-10">
            <button
              onClick={() => {
                setReplyingTo(false);
                setReplyContent("");
              }}
              className="px-3 py-1 text-xs border border-zinc-700 text-zinc-400 rounded hover:text-white hover:border-zinc-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submitReply}
              disabled={!replyContent.trim() || submittingReply}
              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 transition-colors"
            >
              {submittingReply ? "Posting..." : "Reply"}
            </button>
          </div>
        </div>
      )}

      {/* Replies Thread */}
      {comment.replyCount > 0 && expanded && (
        <div className="ml-6 comment-thread-line">
          <div className="mt-1 space-y-2 ml-4">
            {loadingReplies ? (
              <div className="text-xs text-zinc-400">Loading replies...</div>
            ) : (
              replies.map((reply) => (
                <CommentThread
                  key={reply.id}
                  comment={reply}
                  user={user}
                  userVote={replyVotes.get(reply.id)}
                  onVote={onVote}
                  onDelete={onDelete}
                  onReply={() => {}}
                  entityId={entityId}
                  entityType={entityType}
                  expanded={expandedNestedReplies.has(reply.id)}
                  onToggleReplies={() => toggleNestedReplies(reply.id)}
                  pathSegments={[...pathSegments, comment.id, "replies"]}
                  onCommentUpdated={onCommentUpdated}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
