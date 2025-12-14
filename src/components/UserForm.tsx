"use client";

import { createuser } from "@/app/actions";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "react-toastify";

const UserForm = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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

      toast.success("User created successfully");
      router.refresh();
    } catch (error) {
      console.log("error creating users:", error);
      toast.error("Error creating user");
    }
  };

  return (
    <div>
      <form>
        <div className="flex gap-2">
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            placeholder="Enter ur email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <label htmlFor="name">name:</label>
          <input
            id="name"
            type="text"
            placeholder="Enter ur name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <button onClick={handleUserCreation} disabled={loading}>
          {loading ? "loading..." : "Create user"}
        </button>
      </form>
    </div>
  );
};

export default UserForm;
