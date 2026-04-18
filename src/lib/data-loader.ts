import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cache, CACHE_KEYS } from "./cache";

const PLACEHOLDER_QUIZ = [
  {
    id: "placeholder",
    case_number: "",
    case_name: "Quiz Coming Soon",
    question:
      "This quiz is being prepared and will be available soon. Please check back later.",
    option_a: "Coming Soon",
    option_b: "Coming Soon",
    option_c: "Coming Soon",
    option_d: "Coming Soon",
    correct_answer: "A",
    explanation: "This quiz content is being prepared and will be available soon.",
  },
];

export class DataLoader {
  private static contemporaryCourseId: string | null = null;

  private static async getContemporaryCourseId() {
    if (this.contemporaryCourseId) return this.contemporaryCourseId;
    try {
      const courses = await fetchQuery(api.content.getCourses, { activeOnly: false });
      const c = courses.find((c) =>
        c.name.toLowerCase().includes("contemporary")
      );
      if (!c) return null;
      this.contemporaryCourseId = c._id;
      return c._id;
    } catch {
      return null;
    }
  }

  static async loadContemporaryCases(year: string) {
    const cacheKey = CACHE_KEYS.CONTEMPORARY_CASES(year);
    const cached = cache.get(cacheKey) as {
      case_number: string;
      overall_content: string;
    }[] | null;
    if (cached) return { data: cached, fromCache: true };

    try {
      const courseId = await this.getContemporaryCourseId();
      if (!courseId) return { data: [], fromCache: false };

      const items = await fetchQuery(api.content.getStructureItemsByCourse, {
        courseId: courseId as Id<"courses">,
      });

      const yearSuffix = year.slice(-2);
      const yearItems = items.filter((i) =>
        i.title.startsWith(`CS-${yearSuffix}-`)
      );

      const mappedData = await Promise.all(
        yearItems.map(async (item) => {
          const note = await fetchQuery(api.content.getNoteContent, {
            itemId: item._id,
          }).catch(() => null);
          return {
            case_number: item.title,
            overall_content: note?.content_html || "",
          };
        })
      );

      cache.set(cacheKey, mappedData, 10 * 60 * 1000);
      return { data: mappedData, fromCache: false };
    } catch {
      return { data: [], fromCache: false };
    }
  }

  static async loadCaseNotes(year: string, caseNumber: string) {
    const cacheKey = CACHE_KEYS.CASE_NOTES(year, caseNumber);
    const cached = cache.get(cacheKey) as {
      case_number: string;
      overall_content: string;
      item_id?: string;
    } | null;
    if (cached) return { data: cached, fromCache: true };

    try {
      let notesCaseNumber = caseNumber;
      if (year === "2025") {
        if (caseNumber.startsWith("CQ-25-")) {
          notesCaseNumber = caseNumber.replace("CQ-25-", "CS-25-");
        }
      } else {
        notesCaseNumber = caseNumber.replace("CQ-", "CS-");
      }

      const courseId = await this.getContemporaryCourseId();
      if (!courseId) return { data: null, fromCache: false };

      const items = await fetchQuery(api.content.getStructureItemsByCourse, {
        courseId: courseId as Id<"courses">,
      });
      const item = items.find((i) => i.title === notesCaseNumber);

      if (!item) {
        return {
          data: {
            case_number: notesCaseNumber,
            overall_content:
              "This case will be available soon. We're working on adding comprehensive notes for this case.\n\nPlease check back later.",
          },
          fromCache: false,
        };
      }

      const note = await fetchQuery(api.content.getNoteContent, {
        itemId: item._id,
      }).catch(() => null);

      const result = {
        case_number: notesCaseNumber,
        overall_content: note?.content_html || "Notes coming soon.",
        item_id: item._id,
      };

      cache.set(cacheKey, result, 15 * 60 * 1000);
      return { data: result, fromCache: false };
    } catch {
      return { data: null, fromCache: false };
    }
  }

  static async loadQuizQuestions(caseNumber: string) {
    const cacheKey = CACHE_KEYS.QUIZ_QUESTIONS(caseNumber);
    const cached = cache.get(cacheKey);
    if (cached) return { data: cached, fromCache: true };

    try {
      let quizCaseNumber = caseNumber;
      if (caseNumber.includes("CS-25-C-")) {
        quizCaseNumber = caseNumber.replace("CS-25-C-", "CQ-25-C-");
      } else {
        quizCaseNumber = caseNumber.replace("CS-", "CQ-");
      }
      let noteCaseNumber = quizCaseNumber.replace("CQ-", "CS-");
      if (quizCaseNumber.includes("CQ-25-C-"))
        noteCaseNumber = quizCaseNumber.replace("CQ-25-C-", "CS-25-C-");

      const courseId = await this.getContemporaryCourseId();
      if (!courseId) return { data: PLACEHOLDER_QUIZ, fromCache: false };

      const items = await fetchQuery(api.content.getStructureItemsByCourse, {
        courseId: courseId as Id<"courses">,
      });
      const item = items.find((i) => i.title === noteCaseNumber);
      if (!item) return { data: PLACEHOLDER_QUIZ, fromCache: false };

      const quizzes = await fetchQuery(api.content.getAttachedQuizzes, {
        noteItemId: item._id,
      });
      if (!quizzes.length) return { data: PLACEHOLDER_QUIZ, fromCache: false };

      const questions = await fetchQuery(api.content.getQuizQuestions, {
        quizId: quizzes[0]._id,
      });
      if (!questions.length) return { data: PLACEHOLDER_QUIZ, fromCache: false };

      cache.set(cacheKey, questions, 10 * 60 * 1000);
      return { data: questions, fromCache: false };
    } catch {
      return { data: PLACEHOLDER_QUIZ, fromCache: false };
    }
  }

  static async preloadCaseData(year: string, caseNumber: string) {
    await Promise.all([
      this.loadCaseNotes(year, caseNumber).catch(() => null),
      this.loadQuizQuestions(caseNumber).catch(() => null),
    ]);
  }

  static async preloadYearCases(year: string) {
    try {
      const { data } = await this.loadContemporaryCases(year);
      if (!data?.length) return;
      await Promise.all(
        data.slice(0, 3).map((c) =>
          this.preloadCaseData(year, c.case_number).catch(() => null)
        )
      );
    } catch {
      // silent
    }
  }

  static async getCourses() {
    try {
      return await fetchQuery(api.content.getCourses, { activeOnly: true });
    } catch {
      return [];
    }
  }

  static async getCourseById(courseId: string) {
    try {
      const courses = await fetchQuery(api.content.getCourses, { activeOnly: false });
      return courses.find((c) => c._id === courseId) ?? null;
    } catch {
      return null;
    }
  }

  static async getCourseStructure(courseId: string) {
    try {
      const items = await fetchQuery(api.content.getStructureItemsByCourse, {
        courseId: courseId as Id<"courses">,
      });

      const active = items.filter((i) => i.is_active !== false);
      type ItemWithChildren = (typeof active)[0] & { children: ItemWithChildren[] };
      const itemMap = new Map<string, ItemWithChildren>();
      const roots: ItemWithChildren[] = [];

      active.forEach((item) => {
        itemMap.set(item._id, { ...item, id: item._id, children: [] });
      });
      active.forEach((item) => {
        const node = itemMap.get(item._id)!;
        if (item.parentId) {
          const parent = itemMap.get(item.parentId);
          if (parent) parent.children.push(node);
          else roots.push(node);
        } else {
          roots.push(node);
        }
      });

      return roots;
    } catch {
      return [];
    }
  }

  static async getNoteContent(itemId: string) {
    try {
      const note = await fetchQuery(api.content.getNoteContent, {
        itemId: itemId as Id<"structure_items">,
      });
      return note?.content_html ?? null;
    } catch {
      return null;
    }
  }

  static async getUserCompletedItems() {
    try {
      const data = await fetchQuery(api.content.getCompletedItems, {});
      return data.map((r) => r.itemId);
    } catch {
      return [];
    }
  }

  static async toggleItemCompletion(itemId: string, isCompleted: boolean) {
    try {
      if (isCompleted) {
        await fetchMutation(api.content.unmarkItemCompleted, {
          itemId: itemId as Id<"structure_items">,
        });
      } else {
        await fetchMutation(api.content.markItemCompleted, {
          itemId: itemId as Id<"structure_items">,
        });
      }
      return true;
    } catch {
      return false;
    }
  }

  static async getContentAvailability(itemIds: string[]) {
    const itemsWithNotes = new Set<string>();
    const itemsWithQuizzes = new Set<string>();
    if (!itemIds.length) return { itemsWithNotes, itemsWithQuizzes };

    try {
      const [notes, quizzes] = await Promise.all([
        Promise.all(
          itemIds.map((id) =>
            fetchQuery(api.content.getNoteContent, {
              itemId: id as Id<"structure_items">,
            })
              .then((n) => (n ? id : null))
              .catch(() => null)
          )
        ),
        Promise.all(
          itemIds.map((id) =>
            fetchQuery(api.content.getAttachedQuizzes, {
              noteItemId: id as Id<"structure_items">,
            })
              .then((qs) => (qs.length > 0 ? id : null))
              .catch(() => null)
          )
        ),
      ]);

      notes.forEach((id) => id && itemsWithNotes.add(id));
      quizzes.forEach((id) => id && itemsWithQuizzes.add(id));
    } catch {
      // silent
    }

    return { itemsWithNotes, itemsWithQuizzes };
  }
}
