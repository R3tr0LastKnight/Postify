"use client";

import React, { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { toast } from "react-toastify";
import { createPost } from "@/app/actions";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
};

const readUserFromStorage = (): User | null => {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const PostCreator = () => {
  const Router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [user, setUser] = useState<User | null>(() => readUserFromStorage());
  const authorId = user?.id ?? null;

  useEffect(() => {
    const onLogin = (e: Event) => {
      const ce = e as CustomEvent;
      const newUser = ce?.detail ?? readUserFromStorage();
      setUser(newUser);
    };

    window.addEventListener("user:login", onLogin);

    return () => {
      window.removeEventListener("user:login", onLogin);
    };
  }, []); // no initial setState inside effect -> no cascading renders

  const handlePostCreation = async () => {
    if (!authorId) {
      toast.error("Login is required");
      return;
    }
    if (!title) {
      toast.error("Title is required");
      return;
    }
    setLoading(true);
    try {
      await createPost({ title, content, authorId });

      setTitle("");
      setContent("");

      toast.success("Post created successfully");
      Router.refresh();
    } catch (error) {
      console.log("error creating post:", error);
      toast.error("Error creating post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>Add post</Button>
      </DrawerTrigger>
      <DrawerContent className="flex flex-col items-center justify-center">
        <DrawerHeader className="lg:w-1/2">
          <DrawerTitle>Forge thy post</DrawerTitle>
          <DrawerDescription>Share thy gospel</DrawerDescription>
          <div className="flex flex-col gap-4 dark:text-white rounded-lg p-4 justify-center w-full dark:bg-[#18181c] mx-auto">
            <div className="flex flex-col gap-2">
              <Input
                className=""
                type="text"
                placeholder="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                placeholder="post ur thoughts here..."
                className="h-36"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          </div>
        </DrawerHeader>
        <DrawerFooter className="w-1/2">
          <DrawerClose asChild className="flex gap-2 flex-col">
            <Button onClick={handlePostCreation}>
              {loading ? "posting..." : "Submit"}
            </Button>
          </DrawerClose>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default PostCreator;
