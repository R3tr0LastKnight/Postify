"use client";

import Image from "next/image";
import Link from "next/link";
import { Marquee } from "./ui/marquee";
import { useMemo } from "react";

type PostJSON = {
  id: string;
  title: string;
  content: string | null;
  authorId: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

type UserWithCounts = {
  id: string;
  email: string;
  name: string | null;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
  posts: PostJSON[];
  count: { comments: number; posts: number };
};

interface UserListProps {
  initialUsers: UserWithCounts[];
}

const UserList = ({ initialUsers }: UserListProps) => {
  const shuffledUsers = initialUsers;
  // Render each user card taking the real user shape
  // NOTE: make the root element inline-block so marquee can scroll them horizontally
  const ReviewCard = ({ user }: { user: UserWithCounts }) => {
    const imgSrc = user.image || "/placeholder-avatar.png"; // replace with your default
    const displayName = user.name || user.email;
    const username = user.email;
    // prefer post content, fallback to post title, else a short placeholder
    const firstPost = user.posts?.[0];
    const body =
      (firstPost?.content && firstPost.content.slice(0, 140)) ||
      firstPost?.title ||
      `No posts yet — ${user.count?.posts ?? 0} posts`;

    return (
      // inline-block + margin-right so Marquee can layout the items horizontally
      <figure
        suppressHydrationWarning
        className="inline-block mr- relative h-full w-64 cursor-pointer overflow-hidden rounded-xl border p-4 border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05] dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]"
      >
        <div className="flex flex-row items-center gap-2">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || user.email}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-semibold">
              {(user.name || user.email)[0].toUpperCase()}
            </div>
          )}
          <div className="flex flex-col">
            <figcaption className="text-sm font-medium dark:text-white">
              {displayName}
            </figcaption>
            <p className="text-xs font-medium dark:text-white/40">{username}</p>
          </div>
        </div>

        <blockquote className="mt-2 text-sm">{body}</blockquote>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>Posts: {user.count?.posts ?? user.posts.length}</span>
          {/* <span>Comments: {user.count?.comments ?? 0}</span> */}
        </div>
      </figure>
    );
  };

  return (
    <div className="flex flex-col">
      <div className="flex text-center text-3xl font-semibold pb-4 w-full justify-center">
        Hear others gospels
      </div>

      {initialUsers.length === 0 ? (
        <h1>no users found</h1>
      ) : (
        <>
          <div className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-lg">
            {/* Duplicate the row so marquee has enough content to loop */}
            <Marquee pauseOnHover className="[--duration:30s]">
              {[...shuffledUsers, ...shuffledUsers].map((user, idx) => (
                <ReviewCard key={`first-${user.id}-${idx}`} user={user} />
              ))}
            </Marquee>

            <Marquee pauseOnHover reverse className="[--duration:30s]">
              {[...shuffledUsers, ...shuffledUsers].map((user, idx) => (
                <ReviewCard key={`second-${user.id}-${idx}`} user={user} />
              ))}
            </Marquee>

            <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-linear-to-r" />
            <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-linear-to-l" />
          </div>

          {/* optional grid / link view (kept for reference) */}
          {/* <div>
            {initialUsers.map((user) => (
              <Link
                href={`/users/${user.id}`}
                key={user.id}
                className="grid grid-cols-2 gap-2"
              >
                <div>{user.name || "no name"} </div>
                <div>{user.email} </div>
                <div>Posts: {user.count?.posts}</div>
                <div>Comments: {user.count?.comments}</div>
              </Link>
            ))}
          </div> */}
        </>
      )}
    </div>
  );
};

export default UserList;
