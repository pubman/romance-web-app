import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, BookOpen, Users } from "lucide-react";
import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default async function Home() {
  const supabase = await createClient();
  
  const { data, error } = await supabase.auth.getClaims();
  if (!error && data?.claims) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-romantic-gradient">
      <div className="flex flex-col items-center">
        {/* Header */}
        <nav className="w-full border-b border-b-foreground/10 bg-card/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Heart className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-heading text-primary">RomanceByMe</h1>
              </div>
              <div className="flex items-center gap-4">
                <ThemeSwitcher />
                <Link href="/auth/login">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button>Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="flex-1 w-full flex flex-col items-center">
          <div className="container mx-auto px-4 py-20 text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-7xl font-heading text-foreground mb-6">
                Create Your Perfect
                <span className="text-primary block">Love Story</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Craft personalized romance novels with AI. Choose your characters, setting, and plot elements to generate beautiful, unique love stories tailored just for you.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Link href="/auth/sign-up">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Start Writing for Free
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="lg" variant="outline">
                    <Heart className="mr-2 h-5 w-5" />
                    Sign In
                  </Button>
                </Link>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
                <div className="bg-card/60 backdrop-blur-sm rounded-lg p-6 border">
                  <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-heading mb-2">Personalized Stories</h3>
                  <p className="text-muted-foreground">
                    Create unique romance tales with your chosen characters, settings, and favorite tropes.
                  </p>
                </div>

                <div className="bg-card/60 backdrop-blur-sm rounded-lg p-6 border">
                  <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-heading mb-2">AI-Powered Writing</h3>
                  <p className="text-muted-foreground">
                    Advanced AI crafts compelling narratives based on your preferences and style choices.
                  </p>
                </div>

                <div className="bg-card/60 backdrop-blur-sm rounded-lg p-6 border">
                  <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-heading mb-2">Share & Connect</h3>
                  <p className="text-muted-foreground">
                    Share your stories with friends or the community, and discover other romantic tales.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <footer className="w-full border-t bg-card/80 backdrop-blur-sm mt-20">
            <div className="container mx-auto px-4 py-8">
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <p>© 2024 RomanceByMe. Create your perfect love story.</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
