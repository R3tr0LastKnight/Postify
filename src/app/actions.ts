"use server";

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";

// export async function getUsers() {
//   try {
//     const users = await prisma.user.findMany({
//       include: {
//         posts: true,
//         _count: {
//           select: { comments: true, posts: true },
//         },
//       },
//       orderBy: { createdAt: "desc" },
//     });

//     return users;
//   } catch (error) {
//     console.log("error fetching users:", error);
//     throw new Error("Error fetching users");
//   }
// }

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        posts: true,
        _count: {
          select: { comments: true, posts: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Map to a client-friendly shape: convert Date -> string, rename _count -> count
    const mapped = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name ?? null,
      createdAt: u.createdAt?.toISOString?.() ?? null,
      updatedAt: u.updatedAt?.toISOString?.() ?? null,
      posts: (u.posts ?? []).map((p) => ({
        id: p.id,
        title: p.title,
        content: p.content ?? null,
        authorId: p.authorId,
        published: !!p.published,
        createdAt: p.createdAt?.toISOString?.() ?? null,
        updatedAt: p.updatedAt?.toISOString?.() ?? null,
      })),
      count: {
        comments: u._count?.comments ?? 0,
        posts: u._count?.posts ?? 0,
      },
    }));

    return mapped;
  } catch (err) {
    // Better error logging: include the stack if available
    if (err instanceof Error) {
      console.error("getUsers() failed:", err.message);
      console.error(err.stack);
    } else {
      console.error("getUsers() failed (non-error):", err);
    }

    // DON'T throw here so the server render won't 500 — return empty array
    // You can change this to rethrow for development once you've fixed the root cause.
    return [];
  }
}

export async function getPosts(limit = 5) {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: true,
        comments: {
          include: {
            author: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return posts;
  } catch (error) {
    console.log("error fetching posts:", error);
    throw new Error("Error fetching posts");
  }
}

export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        posts: {
          orderBy: { createdAt: "desc" },
        },
        comments: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: { posts: true, comments: true },
        },
      },
    });

    return user;
  } catch (error) {
    console.log("error fetching user:", error);
    throw new Error("Error fetching user");
  }
}

//what if user with email already exists?
export async function createuser({
  email,
  name,
  password,
}: {
  email: string;
  name?: string;
  password: string;
}) {
  if (!email) {
    throw new Error("Email is required");
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashed,
      },
    });

    revalidatePath("/login");
    return user;
  } catch (error) {
    console.log("error creating user:", error);
    throw new Error("Error creating user");
  }
}

export async function loginuser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  if (!email) {
    throw new Error("Email is required");
  }
  if (!password) {
    throw new Error("Password is required");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // verify bcrypt password

    if (!user.password) {
      throw new Error("Invalid credentials");
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      throw new Error("Invalid credentials");
    }

    // optional revalidate
    revalidatePath("/login");

    // return safe user including image if available
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image || null,
    };
  } catch (error) {
    console.log("error logging in:", error);
    throw new Error("Invalid email or password");
  }
}

export async function createPost({
  title,
  content,
  authorId,
  published = false,
}: {
  title: string;
  content?: string;
  authorId: string;
  published?: boolean;
}) {
  if (!title || !authorId) {
    throw new Error("Title and Author ID are required");
  }
  const authorExists = await prisma.user.findUnique({
    where: { id: authorId },
  });

  if (!authorExists) {
    throw new Error("Author does not exist");
  }

  try {
    const post = await prisma.post.create({
      data: {
        title,
        content,
        published,
        author: {
          connect: { id: authorId },
        },
      },
      include: {
        author: true,
      },
    });

    revalidatePath("/");
    return post;
  } catch (error) {
    console.log("error creating post:", error);
    throw new Error("Error creating post");
  }
}

export async function createComment({
  postId,
  authorId,
  content,
}: {
  postId: string;
  authorId: string;
  content: string;
}) {
  if (!content || !postId || !authorId) {
    throw new Error("Content, Post ID and Author ID are required");
  }

  try {
    const postExists = await prisma.post.findUnique({
      where: { id: postId },
    });
    if (!postExists) {
      throw new Error("Post does not exist");
    }
    const authorExists = await prisma.user.findUnique({
      where: { id: authorId },
    });

    if (!authorExists) {
      throw new Error("Author does not exist");
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        post: {
          connect: { id: postId },
        },
        author: {
          connect: { id: authorId },
        },
      },
      include: {
        author: true,
        post: true,
      },
    });

    revalidatePath("/");
    return comment;
  } catch (error) {
    console.log("error creating comment:", error);
    throw new Error("Error creating comment");
  }
}
