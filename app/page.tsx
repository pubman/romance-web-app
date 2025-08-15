import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, FileText, BarChart3, Clock, ImageIcon, Users, Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default async function Home() {
  const supabase = await createClient();
  
  const { data, error } = await supabase.auth.getClaims();
  if (!error && data?.claims) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">PaperAI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
              Reviews
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <Link href="/auth/login">
              <Button variant="ghost" className="font-manrope bg-transparent">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 text-center bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto max-w-4xl">
          <Badge variant="secondary" className="mb-6">
            Trusted by 50,000+ students
          </Badge>
          <h1 className="font-bold text-4xl md:text-6xl mb-6">
            Rewrite Your
            <span className="text-primary block">Academic Success</span>
          </h1>
          <p className="font-manrope text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Generate research papers with images, charts, and diagrams from a single prompt.
            <strong> Stop stressing, start creating.</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/auth/sign-up">
              <Button size="lg" className="font-manrope text-lg px-8">
                <ArrowRight className="ml-2 w-5 h-5" />
                Generate Your First Paper
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="font-manrope text-lg px-8">
              Watch Demo
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            ✅ Free trial • 🚀 Generate in 30 seconds • 📚 Works for any subject
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose PaperAI</h2>
            <p className="font-manrope text-xl text-muted-foreground">
              Everything you need to ace your papers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="font-geist">Perfect Structure</CardTitle>
                <CardDescription className="font-manrope">
                  Professional academic structure, and formatting
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="font-geist">Charts & Diagrams</CardTitle>
                <CardDescription className="font-manrope">
                  Auto-generated visualizations that support your arguments
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <ImageIcon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="font-geist">Smart Images</CardTitle>
                <CardDescription className="font-manrope">
                  Relevant images and infographics inserted automatically
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="font-geist">30-Second Generation</CardTitle>
                <CardDescription className="font-manrope">
                  From prompt to complete paper in under 30 seconds
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="font-geist">Any Subject</CardTitle>
                <CardDescription className="font-manrope">
                  Works for STEM, humanities, business, and more
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="font-geist">Quality Citations</CardTitle>
                <CardDescription className="font-manrope">
                  Research-backed references in any citation style
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>


      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-secondary/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What Students Are Saying</h2>
            <p className="font-manrope text-xl text-muted-foreground">
              Real results from real students
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="font-manrope text-muted-foreground mb-4">
                  "Saved me hours on my final research paper. The charts it generated were actually better than what I could make myself."
                </p>
                <div className="font-manrope font-medium">Sarah M.</div>
                <div className="text-sm text-muted-foreground">Psychology Major, UCLA</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="font-manrope text-muted-foreground mb-4">
                  "I was skeptical at first, but the quality is much better. The structure and citations are spot-on."
                </p>
                <div className="font-manrope font-medium">Marcus T.</div>
                <div className="text-sm text-muted-foreground">Business Student, NYU</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="font-manrope text-muted-foreground mb-4">
                  "The AI-generated diagrams and data visualizations are incredible. Professors love them."
                </p>
                <div className="font-manrope font-medium">Alex K.</div>
                <div className="text-sm text-muted-foreground">Engineering Student, MIT</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Transform Your Writing?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of students who've revolutionized their academic success
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" variant="secondary" className="font-manrope text-lg px-8">
              <ArrowRight className="ml-2 w-5 h-5" />
              Start Your Free Trial
            </Button>
          </Link>
          <div className="text-sm mt-4 opacity-75">
            Free trial • No commitment • Cancel anytime
          </div>
        </div>
      </section>

      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">PaperAI</span>
          </div>
          <nav>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Support
              </a>
            </div>
          </nav>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground font-manrope">
          © 2025 PaperAI. Empowering students worldwide.
        </div>
      </footer>
    </div>
  );
}
