import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StoryWizard } from "@/components/story-wizard";

export default async function CreateStoryPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-romantic-gradient">
      <div className="container mx-auto px-4 py-8">
        <StoryWizard />
      </div>
    </div>
  );
}