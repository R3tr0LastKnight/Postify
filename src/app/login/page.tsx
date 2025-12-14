/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import React, { useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { createuser } from "../actions";
import { toast } from "react-toastify";

const page = () => {
  const [login, setLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleUserCreation = async () => {
    if (!email) {
      toast.error("Email is required");
      return;
    }
    setLoading(true);
    try {
      await createuser({ email, name, password });

      setEmail("");
      setName("");
      setPassword("");

      toast.success("User created successfully");
      router.refresh();
    } catch (error) {
      console.log("error creating users:", error);
      toast.error("Error creating user");
    }
  };

  async function handleUserLogin() {
    const emailVal = email?.trim() ?? "";
    const passwordVal = password ?? "";

    const emailInput = document.getElementById(
      "email"
    ) as HTMLInputElement | null;
    const passwordInput = document.getElementById(
      "password"
    ) as HTMLInputElement | null;

    const finalEmail = emailVal || emailInput?.value?.trim() || "";
    const finalPassword = passwordVal || passwordInput?.value || "";

    if (!finalEmail) {
      toast.error("Email is required");
      return;
    }
    if (!finalPassword) {
      toast.error("Password is required");
      return;
    }

    setLoading(true);
    try {
      // dynamic import so you don't need to change top-level imports
      const actions = await import("../actions");
      if (!actions?.loginuser || typeof actions.loginuser !== "function") {
        throw new Error("Login function not available");
      }

      // call server action (expects safe user { id, email, name, image? })
      const user = await actions.loginuser({
        email: finalEmail,
        password: finalPassword,
      });

      // persist user locally for client components
      try {
        localStorage.setItem("user", JSON.stringify(user));
        // notify other components
        window.dispatchEvent(new CustomEvent("user:login", { detail: user }));
      } catch (e) {
        // ignore storage errors
        console.warn("could not persist user:", e);
      }

      toast.success("Logged in successfully");
      router.refresh();
    } catch (err) {
      console.error("error logging in:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center h-full pt-20 px-6 ">
      <Card className="w-full max-w-sm dark:bg-[#18181c] mt-4 lg:mt-16 ">
        <CardHeader>
          <CardTitle>{login ? "login to" : "signup"} up your account</CardTitle>
          <CardDescription>
            Enter details below to {login ? "login to" : "signup"} your account
          </CardDescription>
          <CardAction>
            <Button
              onClick={() => {
                setLogin(!login);
              }}
              variant="link"
            >
              {!login ? "Login" : "Signup"}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="retro@last.knight"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div
                className={`grid gap-2 transition-all duration-300 overflow-hidden 
                            ${
                              login
                                ? "opacity-0 max-h-0"
                                : "opacity-100 max-h-40"
                            }`}
              >
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Retro Last Knight"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  required
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button
            type="submit"
            onClick={() => (login ? handleUserLogin() : handleUserCreation())}
            className="w-full"
          >
            {login ? "Login" : "Signup"}
          </Button>
          {/* <Button variant="outline" className="w-full">
            Login with Google
          </Button> */}
        </CardFooter>
      </Card>
      {/* <Card className="w-full max-w-sm dark:bg-[#18181c] mt-4 lg:mt-16 ">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
          <CardAction>
            <Button variant="link">Sign Up</Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="retro@last.knight"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input id="password" type="password" required />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button type="submit" className="w-full">
            Login
          </Button>
          <Button variant="outline" className="w-full">
            Login with Google
          </Button>
        </CardFooter>
      </Card> */}
    </div>
  );
};

export default page;
