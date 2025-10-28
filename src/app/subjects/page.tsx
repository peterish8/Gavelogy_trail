"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { useMistakeStore } from "@/lib/stores/mistakes";
import { usePaymentStore, COURSES } from "@/lib/payment";
import { supabase } from "@/lib/supabase";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Lock, Clock, Check } from "lucide-react";
import { DottedBackground } from "@/components/DottedBackground";
import { useCopyProtection } from "@/hooks/useCopyProtection";

function SubjectsContent() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Enable copy protection
  useCopyProtection();
  const mistakeStore = useMistakeStore();
  const { checkUserCourseAccess, isContentFree } = usePaymentStore();
  const [activeTab, setActiveTab] = useState("static-subjects");
  const [courseAccess, setCourseAccess] = useState<Record<string, boolean>>({});

  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(
    new Set(["jurisprudence"])
  );
  const [expanded2025Subjects, setExpanded2025Subjects] = useState<Set<string>>(
    new Set()
  );
  const [contemporaryCases, setContemporaryCases] = useState<
    Record<string, any>
  >({
    "2023": {
      year: "2023",
      totalCases: 0,
      progress: 0,
      cases: [],
    },
    "2024": {
      year: "2024",
      totalCases: 0,
      progress: 0,
      cases: [],
    },
    "2025": {
      year: "2025",
      totalCases: 0,
      progress: 0,
      cases: [],
    },
  });
  const [contemporaryCases2025, setContemporaryCases2025] = useState<
    Record<string, any[]>
  >({});
  const [completedCases, setCompletedCases] = useState<Set<string>>(new Set());

  // Handle URL parameters for expanding specific subjects and setting active tab
  useEffect(() => {
    if (searchParams) {
      const tabParam = searchParams?.get("tab");
      const yearParam = searchParams?.get("year");

      // Set active tab if specified in URL
      if (tabParam) {
        setActiveTab(tabParam);
      }

      // Expand specific year if specified
      if (yearParam) {
        setExpandedSubjects((prev) => {
          const newSet = new Set(prev);
          newSet.add(`year-${yearParam}`);
          return newSet;
        });
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const { checkAuth } = useAuthStore.getState();
    checkAuth();
  }, []);

  // Only redirect to login if explicitly not authenticated after loading is complete
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Load course access once when component mounts
  useEffect(() => {
    const loadCourseAccess = async () => {
      const access = await checkUserCourseAccess(COURSES.CONTEMPORARY_CASES.id);
      setCourseAccess(prev => ({
        ...prev,
        [COURSES.CONTEMPORARY_CASES.id]: access
      }));
    };
    loadCourseAccess();
  }, [checkUserCourseAccess]);

  // Fetch contemporary cases when Contemporary Cases tab is active
  useEffect(() => {
    if (activeTab === "contemporary-cases") {
      loadContemporaryCases();
      loadCompletedCases();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Update progress bars when completed cases change
  useEffect(() => {
    const updateProgress = () => {
      console.log("Updating progress, completedCases:", Array.from(completedCases));
      setContemporaryCases((prev) => {
        const updated = { ...prev };
        Object.keys(prev).forEach((year) => {
          const yearData = updated[year];
          if (yearData && yearData.cases !== undefined) {
            let completedInYear = 0;
            let totalCases = yearData.cases.length;

            // For 2025, we need to calculate from contemporaryCases2025
            if (year === "2025") {
              // Get all cases from all subjects in 2025
              const all2025Cases: any[] = [];
              Object.values(contemporaryCases2025).forEach((subjectCases) => {
                all2025Cases.push(...subjectCases);
              });
              totalCases = all2025Cases.length;
              completedInYear = all2025Cases.filter((caseItem) =>
                completedCases.has(caseItem.caseNumber)
              ).length;
              console.log(`2025 progress: ${completedInYear}/${totalCases} = ${Math.round((completedInYear / totalCases) * 100)}%`);
      } else {
              completedInYear = yearData.cases.filter(
                (caseItem: { caseNumber: string }) =>
                  completedCases.has(caseItem.caseNumber)
              ).length;
              console.log(`${year} progress: ${completedInYear}/${totalCases} = ${Math.round((completedInYear / totalCases) * 100)}%`);
            }

            const progress =
              totalCases > 0
                ? Math.round((completedInYear / totalCases) * 100)
                : 0;
            updated[year] = {
              ...yearData,
              progress: progress,
            };
          }
        });
        return updated;
    });
  };

    updateProgress();
  }, [completedCases, contemporaryCases2025]);

  const loadCompletedCases = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_case_completion")
        .select("case_number")
        .eq("user_id", user.id)
        .eq("is_completed", true);

      if (error) {
        console.error("Error loading completed cases:", error);
        return;
      }

      const completedSet = new Set(data?.map((c) => c.case_number) || []);
      setCompletedCases(completedSet);
      console.log("Loaded completed cases:", Array.from(completedSet));
    } catch (error) {
      console.error("Error loading completed cases:", error);
    }
  };

  const toggleCaseCompletion = async (caseNumber: string) => {
    // Optimistically update UI instantly
    const isCompleted = completedCases.has(caseNumber);

    if (isCompleted) {
      // Instant UI update - remove from completed set
      setCompletedCases((prev) => {
        const newSet = new Set(prev);
        newSet.delete(caseNumber);
        return newSet;
      });
    } else {
      // Instant UI update - add to completed set
      setCompletedCases((prev) => {
        const newSet = new Set(prev);
        newSet.add(caseNumber);
        return newSet;
      });
    }

    // Save to Supabase immediately in background
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        if (isCompleted) {
          // Unmark as completed in database
          const { error } = await supabase
            .from("user_case_completion")
            .delete()
            .eq("user_id", user.id)
            .eq("case_number", caseNumber);

          if (error) {
            console.error("Error deleting case completion:", error);
            // Revert optimistic update on error
            setCompletedCases((prev) => {
              const newSet = new Set(prev);
              newSet.add(caseNumber);
              return newSet;
            });
          }
        } else {
          // Mark as completed in database
          const { data: upsertData, error } = await supabase
            .from("user_case_completion")
            .upsert(
              {
                user_id: user.id,
                case_number: caseNumber,
                is_completed: true,
                completed_at: new Date().toISOString(),
              },
              {
                onConflict: "user_id,case_number",
              }
            )
            .select();

          if (error) {
            console.error("Error saving case completion:", error);
            // Revert optimistic update on error
            setCompletedCases((prev) => {
              const newSet = new Set(prev);
              newSet.delete(caseNumber);
              return newSet;
            });
          }
        }
    } catch (error) {
        console.error("Error toggling case completion:", error);
      }
    })();
  };

  const loadContemporaryCases = async () => {
    try {
      console.log("Starting to load contemporary cases...");

      // Fetch 2024 cases from Supabase (CQ-24-XX format)
      const { data: notesData, error: notesError } = await supabase
        .from("contemprory_case_notes")
        .select("case_number, overall_content")
        .like("case_number", "CQ-24-%")
        .order("case_number");

      console.log("Notes query result:", { notesData, notesError });

      if (notesError) {
        console.error("Error fetching case notes:", notesError);
      }

      // Fetch quiz data to check which 2024 cases have quizzes
      const { data: quizData, error: quizError } = await supabase
        .from("contemporary_case_quizzes")
        .select("case_number")
        .like("case_number", "CQ-24-%")
        .order("case_number");

      console.log("Quiz query result:", { quizData, quizError });

      if (quizError) {
        console.error("Error fetching quiz data:", quizError);
      }

      // Create a set of case numbers that have quizzes
      const casesWithQuizzes = new Set(
        quizData?.map((q) => q.case_number) || []
      );

      // Transform notes data into cases array
      const cases2024 =
        notesData?.map((note, index) => ({
          caseNumber: note.case_number,
          title: extractTitleFromContent(note.overall_content),
          isLocked: false,
          hasQuiz: casesWithQuizzes.has(note.case_number),
        })) || [];

      console.log(
        "Cases with quizzes:",
        casesWithQuizzes.size,
        Array.from(casesWithQuizzes)
      );

      console.log("Loaded 2024 cases:", cases2024.length, cases2024);
      console.log(
        "First few cases with hasQuiz:",
        cases2024
          .slice(0, 5)
          .map((c) => ({ caseNumber: c.caseNumber, hasQuiz: c.hasQuiz }))
      );

      setContemporaryCases({
        "2025": {
          year: "2025",
          totalCases: 48,
      timeSpent: "0h 00m",
      progress: 0,
          cases: [],
        },
        "2023": {
          year: "2023",
          totalCases: 0,
      timeSpent: "0h 00m",
      progress: 0,
          cases: [],
        },
        "2024": {
          year: "2024",
          totalCases: cases2024.length || 39,
      timeSpent: "0h 00m",
      progress: 0,
          cases:
            cases2024.length > 0
              ? cases2024
              : [
                  // Fallback data if Supabase fails - using CQ-24-XX format (39 cases)
                  {
                    caseNumber: "CQ-24-01",
                    title:
                      "Abhimeet Sinha & Ors. v. High Court of Judicature at Patna & Ors. (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-02",
                    title:
                      "Abhishek Banerjee & Anr. v. Directorate of Enforcement (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-03",
                    title: "Achin Gupta v. State of Haryana & Ors. (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-04",
                    title:
                      "Association for Democratic Reforms & Anr. v. Union of India & Ors. (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-05",
                    title: "Aligarh Muslim University v. Naresh Agarwal (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-06",
                    title: "Amutha v. A.R. Subramanian (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-07",
                    title: "Anees v. The State Govt. of NCT (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-08",
                    title: "Anjum Kadari v. Union of India (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-09",
                    title:
                      "Association for Democratic Reforms v. Election Commission of India (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-10",
                    title:
                      "Babu Sahebagouda Rudragoudar & Ors. v. State of Karnataka (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-11",
                    title: "Bar of Indian Lawyers v. D.K. Gandhi (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-12",
                    title: "Bilkis Yakub Rasool v. Union of India (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-13",
                    title: "CORE v. ECI-SPIC-SMO-MCML (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-14",
                    title:
                      "Child in Conflict with Law v. The State of Karnataka (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-15",
                    title: "Cox and Kings Ltd. v. SAP India Pvt. Ltd. (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-16",
                    title: "Dablu Kujur v. State of Jharkhand (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-17",
                    title: "Devu G. Nair v. State of Kerala (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-18",
                    title: "Dolly Rani v. Manish Kumar Chanchal (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-19",
                    title:
                      "Dr. Bhim Rao Ambedkar Vichar Manch Bihar v. State of Bihar & Ors. (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-20",
                    title:
                      "Dr. Brajendra Singh Chauhan & Ors. v. Central Administrative Tribunal & Ors. (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-21",
                    title: "Frank Vitus v. Narcotics Control Bureau (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-22",
                    title:
                      "Manish Sisodia v. Directorate of Enforcement (2024 INSC 595)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-23",
                    title: "Gaurav Mani v. State of Haryana (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-24",
                    title: "Gene Campaign v. Union of India (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-25",
                    title: "Goa Foundation v. State of Goa & Ors. (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-26",
                    title:
                      "Government of NCT of Delhi v. Office of Lieutenant Governor of Delhi (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-27",
                    title:
                      "High Court Bar Association, Allahabad v. State of Uttar Pradesh (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-28",
                    title:
                      "In Re: Alleged Rape and Murder of Trainee Doctor in RG Kar Medical College Hospital, Kolkata and Related Issues (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-29",
                    title:
                      "In Re: Directions in the Matter of Demolition of Structures (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-30",
                    title:
                      "In Re: Patanjali Ayurved Limited through its Managing Director Acharya Balkrishna and Baba Ramdev (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-31",
                    title: "In Re: Right to Privacy of Adolescents (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-32",
                    title: "In Re: Section 6A of the Citizenship Act (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-33",
                    title:
                      "Indian Medical Association v. Union of India (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-34",
                    title:
                      "Javed Ahmad Hajam v. State of Maharashtra (2024 INSC 187)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-35",
                    title:
                      "Just Rights for Children Alliance v. S. Harish (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-36",
                    title: "Jyoti Devi v. Suket Hospital & Ors. (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-37",
                    title:
                      "Kolkata Municipal Corporation & Anr. v. Bimal Kumar Shah & Ors. (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-38",
                    title: "Lalu Yadav v. State of Uttar Pradesh & Ors. (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                  {
                    caseNumber: "CQ-24-39",
                    title:
                      "Legal Consequences Arising from the Policies and Practices of Israel in the Occupied Palestinian Territory (2024)",
                    isLocked: false,
                    hasQuiz: true,
                  },
                ],
        },
      });

      // Set 2025 cases with subject-wise categorization
      setContemporaryCases2025({
        "Constitutional & Administrative Law": [
          {
            caseNumber: "CS-25-A-01",
            title: "All India Judges Association v. Union of India (2025)",
            isLocked: false,
          },
          {
            caseNumber: "CS-25-A-02",
            title: "Amit Kumar v. Union of India (2025 INSC 414)",
            isLocked: false,
          },
          {
            caseNumber: "CS-25-A-03",
            title: "Bharat Bhushan v. Union of India (2025 INSC 834)",
            isLocked: false,
          },
          {
            caseNumber: "CS-25-A-04",
            title: "Imran Pratapgadhi v. State of Gujarat (2025)",
            isLocked: false,
          },
          {
            caseNumber: "CS-25-A-05",
            title:
              "In Re: Rights of Students with Disabilities (2025 INSC 991)",
            isLocked: false,
          },
          {
            caseNumber: "CS-25-A-06",
            title: "In Re: Right to Privacy of Adolescents (2025 INSC 778)",
            isLocked: false,
          },
          {
            caseNumber: "CS-25-A-07",
            title: "Poulomi Pavini Shukla v. Union of India (2025)",
            isLocked: false,
          },
          {
            caseNumber: "CS-25-A-08",
            title: "Radhika Agarwal v. Union of India (2025)",
            isLocked: false,
          },
          {
            caseNumber: "CS-25-A-09",
            title: "State of Tamil Nadu v. Governor of Tamil Nadu (2025)",
            isLocked: false,
          },
          {
            caseNumber: "CS-25-A-10",
            title: "Sunil Kumar Singh v. Bihar Legislative Assembly (2025)",
            isLocked: false,
          },
          {
            caseNumber: "CS-25-A-11",
            title:
              "Union of India v. National Human Rights Commission (2025 INSC 345)",
            isLocked: false,
          },
          {
            caseNumber: "CS-25-A-12",
            title: "Union of India v. Rajasthan High Court (2025 INSC 102)",
            isLocked: false,
          },
        ],
      });
    } catch (error) {
      console.error("Error loading contemporary cases:", error);

      // Set fallback data when there's an error
      setContemporaryCases({
        "2025": {
          year: "2025",
          totalCases: 48,
      timeSpent: "0h 00m",
          progress: 0,
        },
        "2024": {
          year: "2024",
          totalCases: 39,
          timeSpent: "2h 30m",
          progress: 25,
          cases: [
            // Fallback data with all 39 cases using CQ-24-XX format
            {
              caseNumber: "CQ-24-01",
              title:
                "Abhimeet Sinha & Ors. v. High Court of Judicature at Patna & Ors. (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-02",
              title:
                "Abhishek Banerjee & Anr. v. Directorate of Enforcement (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-03",
              title: "Achin Gupta v. State of Haryana & Ors. (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-04",
              title:
                "Association for Democratic Reforms & Anr. v. Union of India & Ors. (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-05",
              title: "Aligarh Muslim University v. Naresh Agarwal (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-06",
              title: "Amutha v. A.R. Subramanian (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-07",
              title: "Anees v. The State Govt. of NCT (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-08",
              title: "Anjum Kadari v. Union of India (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-09",
              title:
                "Association for Democratic Reforms v. Election Commission of India (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-10",
              title:
                "Babu Sahebagouda Rudragoudar & Ors. v. State of Karnataka (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-11",
              title: "Bar of Indian Lawyers v. D.K. Gandhi (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-12",
              title: "Bilkis Yakub Rasool v. Union of India (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-13",
              title: "CORE v. ECI-SPIC-SMO-MCML (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-14",
              title:
                "Child in Conflict with Law v. The State of Karnataka (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-15",
              title: "Cox and Kings Ltd. v. SAP India Pvt. Ltd. (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-16",
              title: "Dablu Kujur v. State of Jharkhand (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-17",
              title: "Devu G. Nair v. State of Kerala (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-18",
              title: "Dolly Rani v. Manish Kumar Chanchal (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-19",
              title:
                "Dr. Bhim Rao Ambedkar Vichar Manch Bihar v. State of Bihar & Ors. (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-20",
              title:
                "Dr. Brajendra Singh Chauhan & Ors. v. Central Administrative Tribunal & Ors. (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-21",
              title: "Frank Vitus v. Narcotics Control Bureau (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-22",
              title:
                "Manish Sisodia v. Directorate of Enforcement (2024 INSC 595)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-23",
              title: "Gaurav Mani v. State of Haryana (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-24",
              title: "Gene Campaign v. Union of India (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-25",
              title: "Goa Foundation v. State of Goa & Ors. (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-26",
              title:
                "Government of NCT of Delhi v. Office of Lieutenant Governor of Delhi (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-27",
              title:
                "High Court Bar Association, Allahabad v. State of Uttar Pradesh (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-28",
              title:
                "In Re: Alleged Rape and Murder of Trainee Doctor in RG Kar Medical College Hospital, Kolkata and Related Issues (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-29",
              title:
                "In Re: Directions in the Matter of Demolition of Structures (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-30",
              title:
                "In Re: Patanjali Ayurved Limited through its Managing Director Acharya Balkrishna and Baba Ramdev (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-31",
              title: "In Re: Right to Privacy of Adolescents (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-32",
              title: "In Re: Section 6A of the Citizenship Act (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-33",
              title: "Indian Medical Association v. Union of India (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-34",
              title:
                "Javed Ahmad Hajam v. State of Maharashtra (2024 INSC 187)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-35",
              title: "Just Rights for Children Alliance v. S. Harish (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-36",
              title: "Jyoti Devi v. Suket Hospital & Ors. (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-37",
              title:
                "Kolkata Municipal Corporation & Anr. v. Bimal Kumar Shah & Ors. (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-38",
              title: "Lalu Yadav v. State of Uttar Pradesh & Ors. (2024)",
              isLocked: false,
              hasQuiz: true,
            },
            {
              caseNumber: "CQ-24-39",
              title:
                "Legal Consequences Arising from the Policies and Practices of Israel in the Occupied Palestinian Territory (2024)",
              isLocked: false,
              hasQuiz: true,
            },
          ],
        },
        "2023": {
          year: "2023",
          totalCases: 0,
      timeSpent: "0h 00m",
          progress: 0,
          cases: [],
        },
      });
    }
  };

  const jurisprudenceTopics = [
    {
      id: "intro",
      name: "Introduction to Jurisprudence",
      description: "Basic concepts and definitions",
    },
    {
      id: "sources",
      name: "Sources of Law",
      description: "Custom, precedent, and legislation",
    },
    {
      id: "schools",
      name: "Schools of Jurisprudence",
      description: "Natural law, positivism, and realism",
    },
  ];

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subjectId)) {
        newSet.delete(subjectId);
      } else {
        newSet.add(subjectId);
      }
      return newSet;
    });
  };

  const toggle2025Subject = (subjectId: string) => {
    setExpanded2025Subjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subjectId)) {
        newSet.delete(subjectId);
      } else {
        newSet.add(subjectId);
      }
      return newSet;
    });
  };

  const topicToQuizId: Record<string, string> = {
    "Introduction to Jurisprudence": "550e8400-e29b-41d4-a716-446655440206",
    "Sources of Law": "550e8400-e29b-41d4-a716-446655440207",
    "Schools of Jurisprudence": "550e8400-e29b-41d4-a716-446655440209",
  };

  // Helper function to extract case title from content
  const extractTitleFromContent = (content: string): string => {
    if (!content) return "Case Title Not Available";

    // Try to extract the first line or first meaningful text as title
    const lines = content.split("\n").filter((line) => line.trim());
    if (lines.length > 0) {
      // Remove any markdown formatting and get the first substantial line
      const firstLine = lines[0].replace(/[#*_`]/g, "").trim();
      if (firstLine.length > 10) {
        return firstLine;
      }
    }

    // Fallback: try to find a pattern like "Case Name v. Another Name"
    const titleMatch = content.match(
      /([A-Z][a-zA-Z\s&.]+v\.\s+[A-Z][a-zA-Z\s&.()]+)/
    );
    if (titleMatch) {
      return titleMatch[1].trim();
    }

    // Final fallback
    return content.substring(0, 100).trim() + "...";
  };

  const startQuiz = (topicName: string) => {
    const quizId = topicToQuizId[topicName];
    if (quizId) {
      router.push(`/quiz/${quizId}`);
    } else {
      console.log("Quiz not found for topic:", topicName);
    }
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <DottedBackground />
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 no-copy">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">CLAT PG Subjects</h1>
        <p className="text-muted-foreground">
          Master all 13 law subjects with our hierarchical quiz system.
          Complete quizzes to unlock progress tracking and intelligent mistake
          analysis.
        </p>
      </div>

        {/* Course Tabs - Responsive scrollable pills */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
          }}
          className="mb-12"
        >
          {/* 2x2 Grid Layout for Subject Pills */}
          <div className="grid grid-cols-2 gap-4 mb-12 max-w-2xl mx-auto">
            {/* First Row */}
            <button
              onClick={() => setActiveTab("static-subjects")}
              className={`relative overflow-hidden rounded-full transition-all duration-300 px-4 py-3 text-xs font-medium hover:scale-105 active:scale-95 flex items-center justify-center whitespace-nowrap ${
                activeTab === "static-subjects"
                  ? "bg-gradient-to-r from-pink-200 to-purple-200 text-purple-800 shadow-lg border border-pink-300"
                  : "bg-white/60 text-gray-600 hover:bg-white/80 border border-gray-200"
              }`}
            >
              <span className="relative z-10">Static Subjects</span>
            </button>

            <button
              onClick={() => setActiveTab("contemporary-cases")}
              className={`relative overflow-hidden rounded-full transition-all duration-300 px-4 py-3 text-xs font-medium hover:scale-105 active:scale-95 flex items-center justify-center whitespace-nowrap ${
                activeTab === "contemporary-cases"
                  ? "bg-gradient-to-r from-emerald-200 to-teal-200 text-emerald-800 shadow-lg border border-emerald-300"
                  : "bg-white/60 text-gray-600 hover:bg-white/80 border border-gray-200"
              }`}
            >
              <span className="relative z-10">Contemporary Cases</span>
            </button>

            {/* Second Row */}
            <button
              onClick={() => setActiveTab("pyqs")}
              className={`relative overflow-hidden rounded-full transition-all duration-300 px-4 py-3 text-xs font-medium hover:scale-105 active:scale-95 flex items-center justify-center whitespace-nowrap ${
                activeTab === "pyqs"
                  ? "bg-gradient-to-r from-purple-200 to-pink-200 text-purple-800 shadow-lg border border-purple-300"
                  : "bg-white/60 text-gray-600 hover:bg-white/80 border border-gray-200"
              }`}
            >
              <span className="relative z-10">PYQ's</span>
            </button>

            <button
              onClick={() => setActiveTab("mock")}
              className={`relative overflow-hidden rounded-full transition-all duration-300 px-4 py-3 text-xs font-medium hover:scale-105 active:scale-95 flex items-center justify-center whitespace-nowrap ${
                activeTab === "mock"
                  ? "bg-gradient-to-r from-orange-200 to-red-200 text-orange-800 shadow-lg border border-orange-300"
                  : "bg-white/60 text-gray-600 hover:bg-white/80 border border-gray-200"
              }`}
            >
              <span className="relative z-10">Mock</span>
            </button>
                    </div>

          <TabsContent value="static-subjects" className="mt-0">
            <div className="space-y-6">
              {/* Jurisprudence Section */}
              <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-white/90 to-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div
                    className="flex items-center justify-between cursor-pointer mb-4"
                    onClick={() => toggleSubject("jurisprudence")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 text-blue-600">⚖️</div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Jurisprudence
                      </h2>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                        {jurisprudenceTopics.length} Topics
                </span>
                </div>
                    {expandedSubjects.has("jurisprudence") ? (
                      <div className="h-5 w-5 text-gray-600">▼</div>
                    ) : (
                      <div className="h-5 w-5 text-gray-600">▶</div>
                    )}
            </div>

                  {expandedSubjects.has("jurisprudence") && (
                    <div className="space-y-3 animate-fadeIn">
                      {jurisprudenceTopics.map((topic, index) => (
                        <Card
                          key={topic.id}
                          className="border-l-4 border-l-blue-300 bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300"
                        >
                          <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                  {index + 1}. {topic.name}
                      </h3>
                                <p className="text-sm text-gray-600">
                                  {topic.description}
                                </p>
                        </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startQuiz(topic.name)}
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                >
                                  Start Quiz
                        </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Coming Soon Message */}
              <Card className="border-l-4 border-l-gray-400 bg-gradient-to-r from-gray-50 to-gray-100 backdrop-blur-sm shadow-lg">
                <CardContent className="p-8 text-center">
                  <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-600 mb-2">
                    More Subjects Coming Soon
                  </h2>
                  <p className="text-gray-500">
                    We're working on adding more law subjects to help you master
                    CLAT PG preparation.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="contemporary-cases" className="mt-0">
            <div className="space-y-6">
              {/* Year Cards */}
              {Object.entries(contemporaryCases).map(([year, yearData]) => {
                const isExpanded = expandedSubjects.has(`year-${year}`);
                const progressDashArray =
                  yearData.progress > 0
                    ? `${yearData.progress}, 100`
                    : "0, 100";

                return (
                  <Card
                    key={yearData.year}
                    className={`overflow-hidden relative border-0 shadow-lg rounded-2xl bg-gradient-to-br ${
                      yearData.year === "2023"
                        ? "from-blue-100 to-blue-200"
                        : yearData.year === "2024"
                        ? "from-emerald-100 to-emerald-200"
                        : "from-purple-100 to-purple-200"
                    } hover:shadow-xl transition-all duration-300 group backdrop-blur-sm`}
                  >
                    <CardContent className="p-6">
                      {/* Year Header */}
                      <div
                        className="flex items-center justify-between cursor-pointer mb-4"
                        onClick={() => toggleSubject(`year-${year}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-3xl font-bold text-gray-900">
                            {yearData.year}
                          </div>

                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              yearData.year === "2023"
                                ? "bg-blue-100 text-blue-800"
                                : yearData.year === "2024"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {yearData.totalCases} Cases
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Progress Circle */}
                          <div className="relative w-12 h-12">
                            <svg
                              className="w-12 h-12 transform -rotate-90"
                            viewBox="0 0 36 36"
                          >
                            <path
                                className="text-gray-200"
                              stroke="currentColor"
                              strokeWidth="3"
                                strokeLinecap="round"
                              fill="none"
                              d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                                className={`${
                                  yearData.year === "2023"
                                    ? "text-blue-500"
                                    : yearData.year === "2024"
                                    ? "text-emerald-500"
                                    : "text-purple-500"
                                }`}
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              fill="none"
                              strokeDasharray={progressDashArray}
                              d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-semibold text-gray-600">
                                {yearData.progress}%
                            </span>
                            </div>
                          </div>
                          {isExpanded ? (
                            <div className="h-5 w-5 text-gray-600">▼</div>
                          ) : (
                            <div className="h-5 w-5 text-gray-600">▶</div>
                          )}
                          </div>
                        </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="space-y-4 animate-fadeIn">
                          {/* Handle 2024 and 2023 - show all cases directly */}
                          {(yearData.year === "2024" ||
                            yearData.year === "2023") &&
                          yearData.cases ? (
                            <div className="space-y-3">
                              {yearData.cases.map(
                                (
                                  caseItem: {
                                    caseNumber: string;
                                    title: string;
                                    hasQuiz: boolean;
                                    isLocked: boolean;
                                  },
                                  index: number
                                ) => {
                                  // For 2024, make cases with quizzes accessible (first 100 cases)
                                  const isFree = caseItem.hasQuiz || index < 5;
                                  const hasAccess = courseAccess[COURSES.CONTEMPORARY_CASES.id] || false;
                                  const isAccessible = isFree || hasAccess;

                                  return (
                                    <Card
                                      key={caseItem.caseNumber}
                                      className="border-l-4 border-l-emerald-300 bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                                    >
                                      <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                              <h4 className="text-lg font-semibold text-gray-900">
                                                {index + 1}. {caseItem.title}
                                              </h4>
                                              {!isAccessible && (
                                                <Lock className="h-4 w-4 text-gray-400" />
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            {/* Completion Checkbox */}
                                            <button
                                              onClick={() =>
                                                toggleCaseCompletion(
                                                  caseItem.caseNumber
                                                )
                                              }
                                              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                                                completedCases.has(
                                                  caseItem.caseNumber
                                                )
                                                  ? "bg-green-500 border-green-500"
                                                  : "bg-white border-gray-300 hover:border-green-400"
                                              }`}
                                            >
                                              {completedCases.has(
                                                caseItem.caseNumber
                                              ) && (
                                                <Check className="w-5 h-5 text-white" />
                                              )}
                          </button>

                                            {/* Notes Button */}
                        <Button
                                              size="default"
                                              variant="outline"
                                              disabled={!isAccessible}
                                              onClick={() =>
                                                isAccessible &&
                                                router.push(
                                                  `/contemporary-cases/${yearData.year}/${caseItem.caseNumber}/notes`
                                                )
                                              }
                                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 rounded-full px-6"
                                            >
                                              📖 Notes
                        </Button>

                                            {/* Circular Golden Quiz Button */}
                                            {caseItem.hasQuiz ? (
                                              <button
                                                disabled={false}
                                                onClick={() =>
                                                  router.push(
                                                    `/contemporary-cases/${yearData.year}/${caseItem.caseNumber}/quiz`
                                                  )
                                                }
                                                className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                                              >
                                                <span className="text-white font-bold text-lg">
                                                  Q
                                                </span>
                                              </button>
                                            ) : (
                                              <button
                                                disabled
                                                className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center shadow-lg opacity-50 cursor-not-allowed"
                                              >
                                                <span className="text-gray-500 font-bold text-lg">
                                                  Q
                                                </span>
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                }
                              )}
                            </div>
                          ) : yearData.year === "2025" ? (
                            /* Handle 2025 with subject organization */
                            Object.entries(contemporaryCases2025).map(
                              ([subject, cases]) => {
                                const isSubjectExpanded =
                                  expanded2025Subjects.has(subject);

                            return (
                                  <Card
                                    key={subject}
                                    className="border-l-4 border-l-purple-300 bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
                                  >
                                    <CardContent className="p-4">
                                      <div
                                        className="flex items-center justify-between cursor-pointer mb-3"
                                        onClick={() =>
                                          toggle2025Subject(subject)
                                        }
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="h-5 w-5 text-purple-600">
                                            ⚖️
                                </div>
                                          <h3 className="text-lg font-semibold text-gray-900">
                                            {subject}
                                          </h3>
                                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm font-medium">
                                            {cases.length} cases
                                  </span>
                                        </div>
                                        {isSubjectExpanded ? (
                                          <div className="h-4 w-4 text-gray-600">
                                            ▼
                                          </div>
                                        ) : (
                                          <div className="h-4 w-4 text-gray-600">
                                            ▶
                                          </div>
                                        )}
                                      </div>

                                      {/* Cases List */}
                                      {isSubjectExpanded && (
                                        <div className="space-y-2 animate-fadeIn">
                                          {cases.map((caseItem, index) => {
                                            const isFree = index < 5;
                                            const hasAccess = courseAccess[COURSES.CONTEMPORARY_CASES.id] || false;
                                            const isAccessible = isFree || hasAccess;

                                            return (
                                              <Card
                                                key={caseItem.caseNumber}
                                                className={`border-l-4 border-l-purple-300 bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 ${
                                                  !isAccessible
                                                    ? "opacity-60"
                                                    : ""
                                                }`}
                                              >
                                                <CardContent className="p-4">
                                                  <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                      <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="text-lg font-semibold text-gray-900">
                                                          {parseInt(caseItem.caseNumber.split('-')[2])}.{" "}
                                                          {caseItem.title}
                                                        </h4>
                                                        {!isAccessible && (
                                                          <Lock className="h-4 w-4 text-gray-400" />
                                                        )}
                                    </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                      {/* Completion Checkbox */}
                                                      <button
                                                        onClick={() =>
                                                          toggleCaseCompletion(
                                                            caseItem.caseNumber
                                                          )
                                                        }
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                                                          completedCases.has(
                                                            caseItem.caseNumber
                                                          )
                                                            ? "bg-green-500 border-green-500"
                                                            : "bg-white border-gray-300 hover:border-green-400"
                                                        }`}
                                                      >
                                                        {completedCases.has(
                                                          caseItem.caseNumber
                                                        ) && (
                                                          <Check className="w-5 h-5 text-white" />
                                                        )}
                                                      </button>

                                                      {/* Notes Button */}
                                    <Button
                                                        size="default"
                                      variant="outline"
                                                        disabled={!isAccessible}
                                                        onClick={() =>
                                                          isAccessible &&
                                                          router.push(
                                                            `/contemporary-cases/${yearData.year}/${caseItem.caseNumber}/notes`
                                                          )
                                                        }
                                                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 rounded-full px-6"
                                                      >
                                                        📖 Notes
                                    </Button>

                                                      {/* Circular Golden Quiz Button */}
                                                      {(() => {
                                                        const caseNum =
                                                          parseInt(
                                                            caseItem.caseNumber.split(
                                                              "-"
                                                            )[2]
                                                          );
                                                        const hasQuizData =
                                                          caseNum >= 1 &&
                                                          caseNum <= 10;

                                                        return hasQuizData ? (
                                                          <button
                                                            disabled={
                                                              !isAccessible
                                                            }
                                                            onClick={() =>
                                                              isAccessible &&
                                                              router.push(
                                                                `/contemporary-cases/${yearData.year}/${caseItem.caseNumber}/quiz`
                                                              )
                                                            }
                                                            className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                                                          >
                                                            <span className="text-white font-bold text-lg">
                                                              Q
                                                            </span>
                                                          </button>
                                                        ) : (
                                                          <button
                                                            disabled
                                                            className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center shadow-lg opacity-50 cursor-not-allowed"
                                                          >
                                                            <span className="text-gray-500 font-bold text-lg">
                                                              Q
                                                            </span>
                                                          </button>
                                                        );
                                                      })()}
                                                    </div>
                                                  </div>
                                                </CardContent>
                                              </Card>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                );
                              }
                            )
                          ) : (
                            /* Handle other years (2023, etc.) - no cases to show yet */
                            <div className="text-center py-8 text-gray-500">
                              <p>
                                Cases for {yearData.year} will be available
                                soon.
                              </p>
                                </div>
                          )}
                              </div>
                      )}
                    </CardContent>
                  </Card>
                            );
                          })}
            </div>
          </TabsContent>

          <TabsContent value="pyqs" className="mt-0">
            <div className="space-y-6">
              {/* PYQ 2020 Card Only */}
              <Card className="overflow-hidden relative border-0 shadow-lg rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">20</span>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-800">
                          2020 PYQ
                        </div>
                        <div className="text-sm text-gray-600">
                          Previous Year Questions
                        </div>
                      </div>
                    </div>
                            <Button
                              variant="outline"
                      onClick={() => router.push(`/pyq/2020/mock`)}
                      className="bg-white/60 hover:bg-white/80 text-purple-700 border-purple-200 rounded-full px-6 py-2"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Mock Test
                            </Button>
                          </div>
                    </CardContent>
                  </Card>
            </div>
          </TabsContent>

          <TabsContent value="mock" className="mt-0">
            <div className="space-y-6">
              {/* Mock Test Cards */}
              <Card className="overflow-hidden relative border-0 shadow-lg rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-300 to-red-300 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">M</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Full Length Mock Test
                        </h3>
                        <p className="text-sm text-gray-600">
                          Complete CLAT PG simulation
                </p>
              </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Duration</div>
                        <div className="font-semibold">2 Hours</div>
                      </div>
                      <Button
                        className="bg-gradient-to-r from-orange-400 to-red-400 hover:from-orange-500 hover:to-red-500 text-white px-6 py-2 rounded-full"
                        onClick={() => router.push("/pyq/2020/mock")}
                      >
                        Start Mock
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden relative border-0 shadow-lg rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">Q</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Quick Practice Test
                        </h3>
                        <p className="text-sm text-gray-600">
                          20 questions • 30 minutes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Questions</div>
                        <div className="font-semibold">20</div>
                      </div>
                      <Button
                        className="bg-gradient-to-r from-blue-400 to-indigo-400 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-2 rounded-full"
                        onClick={() => router.push("/quiz")}
                      >
                        Start Quick Test
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
    </div>
  );
}

export default function SubjectsPage() {
  return (
    <div className="min-h-screen relative">
      <DottedBackground />
      <Header />
      <Suspense fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading subjects...</div>
        </div>
      }>
        <SubjectsContent />
      </Suspense>
    </div>
  );
}
