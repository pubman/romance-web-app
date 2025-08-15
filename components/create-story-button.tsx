"use client";

import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import Link from "next/link";

export function CreateStoryButton() {
  return (
    <Link href="/create-story">
      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
        <Plus className="mr-2 h-4 w-4" />
        Create New Paper 
        <Sparkles className="ml-2 h-4 w-4" />
      </Button>
    </Link>
  );
}
