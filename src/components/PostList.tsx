"use client";

import { createComment } from "@/app/actions";
import { Comment, Post, User } from "@prisma/client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "react-toastify";
import dynamic from "next/dynamic";
const MasonryPosts = dynamic(() => import("./ui/MasonryPosts"), {
  ssr: false,
});

type PostWithRelations = Post & {
  author: User;
  comments: (Comment & {
    author: User;
  })[];
  _count: {
    comments: number;
  };
};

interface PostListProps {
  initialPosts: PostWithRelations[];
}

const PostList = ({ initialPosts }: PostListProps) => {
  const [commentContents, SetCommentContents] = useState<{
    [key: string]: string;
  }>({});
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const router = useRouter();

  const handleCommentChange = (postId: string, content: string) => {
    SetCommentContents((prev) => ({
      ...prev,
      [postId]: content,
    }));
  };

  const handleSubmitComment = async (postId: string, authorId: string) => {
    const content = commentContents[postId];
    if (!content) {
      toast.error("Comment cannot be empty");
      return;
    }

    setSubmitting(postId);
    try {
      await createComment({
        content,
        postId,
        authorId,
      });

      // Clear the input
      SetCommentContents((prev) => ({
        ...prev,
        [postId]: "",
      }));

      toast.success("Comment added successfully");
      router.refresh();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error adding comment:", error);
      toast.error(error.message || "Failed to add comment");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="flex flex-col my-4">
      <div className="flex text-center text-3xl font-semibold pb-4 w-full justify-center">
        Recent Gospels
      </div>
      {initialPosts.length === 0 ? (
        <>
          <h1>no post found</h1>
        </>
      ) : (
        <>
          <MasonryPosts
            items={initialPosts}
            ease="power3.out"
            duration={0.6}
            stagger={0.05}
            animateFrom="bottom"
            scaleOnHover={true}
            hoverScale={0.95}
            blurToFocus={true}
            colorShiftOnHover={false}
          />
          {/* <div className="flex flex-col gap-2">
            {initialPosts.map((post) => (
              <div
                // href={`'users/${post.author.id}`}
                key={post.id}
                className="grid grid-cols-4 gap-2"
              >
                <div>{post.author.name || "no name"} </div>
                <div>{post.author.email} </div>
                <div>{post.title}</div>
                <div>{post.content} </div>
              </div>
            ))}
          </div> */}
        </>
      )}
    </div>
  );
};

export default PostList;
