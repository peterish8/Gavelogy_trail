import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { BookOpen, Target, Trophy, Users, Zap, Brain } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Master <span className="text-primary">CLAT PG</span> with
            <br />
            Intelligent Learning
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The only platform that tracks your mistakes, builds your confidence,
            and helps you achieve 75%+ accuracy through systematic practice.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 py-6">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/subjects">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Try Free Quizzes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose Gavalogy?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our unique approach combines intelligent mistake tracking with
            gamified learning to ensure you never repeat the same errors.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Brain className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Intelligent Mistake Tracking</CardTitle>
              <CardDescription>
                Track confidence levels and eliminate mistakes systematically.
                Questions you guess correctly still get reviewed until you're
                confident.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Gamified Learning</CardTitle>
              <CardDescription>
                Earn coins, maintain streaks, and compete on leaderboards. Turn
                your preparation into an engaging daily habit.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BookOpen className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Contemporary Cases</CardTitle>
              <CardDescription>
                Stay updated with recent legal cases from 2023-2025, organized
                by month for systematic study.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Target className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Subject-wise Analytics</CardTitle>
              <CardDescription>
                Identify your weak areas with detailed analytics. Focus on
                subjects that need improvement.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Trophy className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Mock Tests</CardTitle>
              <CardDescription>
                Practice with full-length mock tests that simulate the actual
                CLAT PG exam experience.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Community</CardTitle>
              <CardDescription>
                Compete with fellow aspirants on leaderboards and stay motivated
                throughout your journey.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Courses Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Choose Your Course</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Two comprehensive courses designed to cover all aspects of CLAT PG
              preparation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-2xl">
                  Static Subjects Course
                </CardTitle>
                <CardDescription className="text-base">
                  13 Law Subjects • 650 Questions • 20 Mock Tests
                </CardDescription>
                <div className="text-3xl font-bold text-primary mt-4">
                  ₹1,999
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Constitutional Law, Criminal Law, Contract Law</li>
                  <li>• Torts, Administrative Law, Jurisprudence</li>
                  <li>• Environmental Law, Property Law, Family Law</li>
                  <li>• Labour Law, Tax Law, Corporate Law, IPR</li>
                  <li>• 20 Full-length Mock Tests</li>
                  <li>• Intelligent Mistake Tracking</li>
                </ul>
                <Link href="/dashboard" className="block mt-6">
                  <Button className="w-full">Buy Now</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-2xl">
                  Contemporary Cases Course
                </CardTitle>
                <CardDescription className="text-base">
                  150 Legal Cases • 2023-2025 • Month Quizzes
                </CardDescription>
                <div className="text-3xl font-bold text-primary mt-4">
                  ₹1,499
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• 50 Landmark Cases from 2023</li>
                  <li>• 50 Landmark Cases from 2024</li>
                  <li>• 50 Recent Cases from 2025</li>
                  <li>• Organized by Month</li>
                  <li>• Month-wise Combined Quizzes</li>
                  <li>• Regular Updates</li>
                </ul>
                <Link href="/dashboard" className="block mt-6">
                  <Button className="w-full">Buy Now</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Card className="inline-block">
              <CardContent className="p-6">
                <div className="text-lg font-semibold mb-2">
                  Bundle Offer (Save ₹500)
                </div>
                <div className="text-2xl font-bold text-primary mb-2">
                  ₹2,999{" "}
                  <span className="text-muted-foreground line-through text-lg">
                    ₹3,498
                  </span>
                </div>
                <Link href="/dashboard">
                  <Button size="lg">Buy Bundle</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Gavalogy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
