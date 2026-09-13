"use client";

import { useEffect, useState } from "react";

interface UserGreetingProps {
  name: string;
}

export function UserGreeting({ name }: UserGreetingProps) {
  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => {
    const hour = new Date().getHours();
    let text = "Good morning";
    if (hour >= 12 && hour < 17) text = "Good afternoon";
    else if (hour >= 17 && hour < 22) text = "Good evening";
    else if (hour < 5 || hour >= 22) text = "Good night";

    const timer = setTimeout(() => {
      setGreeting(text);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
      <span suppressHydrationWarning>{greeting}</span>, {name} <span className="inline-block animate-bounce">👋</span>
    </h1>
  );
}
