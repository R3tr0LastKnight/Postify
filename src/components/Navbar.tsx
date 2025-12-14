"use client";

import React, { useEffect, useState } from "react";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import Link from "next/link";
import Image from "next/image";
import { IoLogOut } from "react-icons/io5";
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

const Navbar = () => {
  // 1️⃣ Start as null so server + first client render match
  const [user, setUser] = useState<User | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("user");

    // fire logout event so Navbar updates everywhere
    window.dispatchEvent(new Event("user:logout"));

    // optional redirect
    window.location.href = "/login";
  };

  useEffect(() => {
    // 2️⃣ Read storage after mount
    const initial = readUserFromStorage();
    if (initial) {
      // 3️⃣ Defer setState out of the effect tick to avoid the React warning
      queueMicrotask(() => {
        setUser(initial);
      });
    }

    // login event (fired by your login code)
    const onLogin = (e: Event) => {
      const ce = e as CustomEvent;
      const newUser = ce?.detail ?? readUserFromStorage();
      setUser(newUser);
    };

    // logout event if you implement it
    const onLogout = () => {
      setUser(null);
    };

    window.addEventListener("user:login", onLogin);
    window.addEventListener("user:logout", onLogout);

    return () => {
      window.removeEventListener("user:login", onLogin);
      window.removeEventListener("user:logout", onLogout);
    };
  }, []);

  return (
    <div className="absolute top-0  min-w-full">
      <div className="flex  justify-between items-center px-6 dark:bg-[#18181c]  py-4 shadow-[0_3px_10px_rgb(0,0,0,0.2)] dark:shadow-[0_3px_10px__rgb(0,0,0,0.9)]  ">
        <Link href={"/"}>
          <h1 className="text-2xl font-semibold text-foreground">Postify</h1>
        </Link>
        <div className="flex gap-2">
          <ModeToggle />

          {user ? (
            <div className="flex items-center gap-2">
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
              <div className="text-sm font-medium">
                {user.name || user.email}
              </div>
              <IoLogOut className="cursor-pointer" onClick={handleLogout} />
            </div>
          ) : (
            <>
              <Link href={"/login"}>
                <Button>Login</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
