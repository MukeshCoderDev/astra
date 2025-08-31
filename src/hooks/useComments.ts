import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { Comment, CommentRequest, ApiResponse } from '../types';

// Mock comment data for development
const mockComments: Comment[] = [
  {
    id: '1',
    content: 'Great video! Really helpful tutorial.',
    authorId: 'user1',
    author: {
      id: 'user1',
      handle: 'techfan',
      displayName: 'Tech Fan',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      verified: false
    },
    videoId: '1',
    likes: 12,
    isLiked: false,
    replies: [
      {
        id: '2',
        content: 'I agree! The explanation was very clear.',
        authorId: 'user2',
        author: {
          id: 'user2',
          handle: 'coder123',
          displayName: 'Coder123',
          verified: true
        },
        videoId: '1',
        parentId: '1',
        likes: 3,
        isLiked: true,
        replies: [],
        createdAt: '2024-01-15T11:00:00Z',
        updatedAt: '2024-01-15T11:00:00Z'
      }
    ],
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '3',
    content: 'Could you make a follow-up video about advanced patterns?',
    authorId: 'user3',
    author: {
      id: 'user3',
      handle: 'learner',
      displayName: 'Always Learning',
      verified: false
    },
    videoId: '1',
    likes: 8,
    isLiked: false,
    replies: [],
    createdAt: '2024-01-15T12:15:00Z',
    updatedAt: '2024-01-15T12:15:00Z'
  }
];

export function useComments(videoId: string) {
  const queryClient = useQueryClient();

  const commentsQuery = useQuery({
    queryKey: ['comments', videoId],
    queryFn: async (): Promise<Comment[]> => {
      // For development, return mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockComments.filter(comment => comment.videoId === videoId && !comment.parentId);
      
      // In production, use this:
      // const response = await apiClient.get<ApiResponse<Comment[]>>(`/videos/${videoId}/comments`);
      // return response.data;
    },
    enabled: !!videoId,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (request: CommentRequest) => {
      // For development, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newComment: Comment = {
        id: Date.now().toString(),
        content: request.content,
        authorId: 'current-user',
        author: {
          id: 'current-user',
          handle: 'you',
          displayName: 'You',
          verified: false
        },
        videoId: request.videoId,
        parentId: request.parentId,
        likes: 0,
        isLiked: false,
        replies: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return newComment;
      
      // In production, use this:
      // const response = await apiClient.post<ApiResponse<Comment>>(`/videos/${videoId}/comments`, request);
      // return response.data;
    },
    onSuccess: (newComment) => {
      queryClient.setQueryData(['comments', videoId], (oldComments: Comment[] = []) => {
        if (newComment.parentId) {
          // Handle reply - add to parent comment's replies
          return oldComments.map(comment => {
            if (comment.id === newComment.parentId) {
              return {
                ...comment,
                replies: [...comment.replies, newComment]
              };
            }
            return comment;
          });
        } else {
          // Handle top-level comment
          return [newComment, ...oldComments];
        }
      });
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      // For development, simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      return { commentId, liked: true };
      
      // In production, use this:
      // const response = await apiClient.post<ApiResponse<{ liked: boolean }>>(`/comments/${commentId}/like`);
      // return response.data;
    },
    onSuccess: ({ commentId }) => {
      queryClient.setQueryData(['comments', videoId], (oldComments: Comment[] = []) => {
        const updateComment = (comment: Comment): Comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
              isLiked: !comment.isLiked
            };
          }
          return {
            ...comment,
            replies: comment.replies.map(updateComment)
          };
        };
        
        return oldComments.map(updateComment);
      });
    },
  });

  const reportCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      // For development, simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In production, use this:
      // const response = await apiClient.post<ApiResponse<void>>(`/comments/${commentId}/report`);
      // return response.data;
    },
    onSuccess: () => {
      // Show success message
      console.log('Comment reported successfully');
    },
  });

  return {
    comments: commentsQuery.data || [],
    isLoading: commentsQuery.isLoading,
    error: commentsQuery.error,
    addComment: (content: string, parentId?: string) => 
      addCommentMutation.mutate({ content, videoId, parentId }),
    likeComment: likeCommentMutation.mutate,
    reportComment: reportCommentMutation.mutate,
    isAddingComment: addCommentMutation.isPending,
    isLikingComment: likeCommentMutation.isPending,
  };
}