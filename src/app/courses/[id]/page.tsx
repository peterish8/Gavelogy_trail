"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DataLoader } from "@/lib/data-loader";
import { usePaymentStore } from "@/lib/payment";
import { useAuthStore } from "@/lib/stores/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  FileText,
  Folder,
  FolderOpen,
  Lock,
  RefreshCw,
  ShieldCheck,
  Unlock,
  Users,
  Zap,
} from "lucide-react";

interface StructureItem {
  _id: string;
  id?: string;
  title: string;
  item_type: "folder" | "file";
  children?: StructureItem[];
  is_active: boolean;
  order_index: number;
}

interface CourseDetail {
  _id: string;
  name: string;
  description?: string;
  price: number;
  is_free?: boolean;
  is_active?: boolean;
}

function countFlat(items: StructureItem[]): { chapters: number; topics: number } {
  let chapters = 0;
  let topics = 0;
  for (const item of items) {
    if (item.item_type === "folder") {
      chapters++;
      if (item.children) {
        const c = countFlat(item.children);
        chapters += c.chapters;
        topics += c.topics;
      }
    } else {
      topics++;
    }
  }
  return { chapters, topics };
}

function FolderItem({
  item,
  isFree,
  hasAccess,
  depth,
}: {
  item: StructureItem;
  isFree: boolean;
  hasAccess: boolean;
  depth: number;
}) {
  const [open, setOpen] = useState(isFree && depth === 0);
  const isUnlocked = hasAccess || isFree;

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-3 w-full text-left py-3 px-4 transition-colors duration-150",
          depth === 0
            ? "border-b border-[#E2DEEC] dark:border-slate-800 hover:bg-[#F7F6FB] dark:hover:bg-slate-800/40"
            : "hover:bg-[#F7F6FB] dark:hover:bg-slate-800/30 rounded-lg",
        )}
      >
        {open
          ? <FolderOpen className="w-4 h-4 text-[#4B2AD6] shrink-0" />
          : <Folder className="w-4 h-4 text-[#4B2AD6] shrink-0" />}

        <span className={cn(
          "flex-1 text-sm",
          depth === 0 ? "font-semibold text-[#130F2A] dark:text-slate-100" : "font-medium text-[#434056] dark:text-slate-200",
        )}>
          {item.title}
        </span>

        {isFree && depth === 0 && (
          <span className="text-[11px] font-medium text-[#1F7A52] dark:text-emerald-400 shrink-0">
            Free preview
          </span>
        )}

        {!isUnlocked && depth === 0 && (
          <Lock className="w-3.5 h-3.5 text-[#CDC6DC] dark:text-slate-600 shrink-0" />
        )}

        <ChevronDown
          className={cn(
            "w-4 h-4 text-[#857FA0] shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && item.children && item.children.length > 0 && (
          <motion.div
            key="children"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className={cn(
              "space-y-0.5 py-1",
              depth === 0 ? "pl-10" : "pl-7",
            )}>
              {item.children.map((child) =>
                child.item_type === "folder" ? (
                  <FolderItem
                    key={child._id}
                    item={child}
                    isFree={false}
                    hasAccess={hasAccess}
                    depth={depth + 1}
                  />
                ) : (
                  <FileRow key={child._id} item={child} isUnlocked={isUnlocked} />
                ),
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FileRow({ item, isUnlocked }: { item: StructureItem; isUnlocked: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-3 py-2 px-4 rounded-lg text-sm",
      isUnlocked ? "text-[#434056] dark:text-slate-300" : "text-[#857FA0] dark:text-slate-500",
    )}>
      <FileText className="w-3.5 h-3.5 shrink-0 text-[#857FA0]" />
      <span className="flex-1">{item.title}</span>
      {isUnlocked
        ? <Unlock className="w-3.5 h-3.5 text-[#1F7A52] shrink-0" />
        : <Lock className="w-3.5 h-3.5 text-[#CDC6DC] dark:text-slate-600 shrink-0" />}
    </div>
  );
}

const INCLUDED = [
  "All chapters and topics",
  "Spaced repetition quizzes",
  "Personal notes & highlights",
  "Case judgment annotations",
  "Previous year question sets",
  "Performance analytics",
];

const TRUST = [
  { icon: Zap, text: "Instant access after payment" },
  { icon: RefreshCw, text: "All future updates included" },
  { icon: Download, text: "Download notes as PDF" },
  { icon: ShieldCheck, text: "Secure encrypted checkout" },
];

function EnrollBar({
  price,
  purchasing,
  hasAccess,
  onBuy,
  onOpen,
  msg,
}: {
  price: number;
  purchasing: boolean;
  hasAccess: boolean;
  onBuy: () => void;
  onOpen: () => void;
  msg?: string;
}) {
  if (hasAccess) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-[#1F7A52] dark:text-emerald-400 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          You&apos;re enrolled — full access active
        </div>
        <Button size="sm" className="bg-[#1F7A52] hover:bg-[#186640] text-white" onClick={onOpen}>
          Go to Course →
        </Button>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-[#130F2A] dark:text-white">₹{price}</span>
        <span className="text-sm text-[#CDC6DC] line-through">₹{(price * 1.5).toFixed(0)}</span>
        <span className="text-xs text-[#1F7A52] dark:text-emerald-400 font-medium">33% off</span>
      </div>
      <div className="flex items-center gap-3">
        {msg && <span className="text-xs text-red-500">{msg}</span>}
        <Button
          onClick={onBuy}
          disabled={purchasing}
          className="bg-[#4B2AD6] hover:bg-[#3A1EB0] dark:bg-white dark:text-[#130F2A] dark:hover:bg-slate-100 text-white font-semibold px-6"
        >
          {purchasing ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full" />
              Processing…
            </span>
          ) : "Enroll Now"}
        </Button>
      </div>
    </div>
  );
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { purchaseCourse, checkUserCourseAccess, loadAvailableCourses, availableCourses } =
    usePaymentStore();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [structure, setStructure] = useState<StructureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseMsg, setPurchaseMsg] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [courseData, structureData] = await Promise.all([
        DataLoader.getCourseById(id),
        DataLoader.getCourseStructure(id),
      ]);
      setCourse(courseData as CourseDetail | null);
      setStructure(structureData as StructureItem[]);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated || !id) return;
    checkUserCourseAccess(id).then(setHasAccess);
  }, [isAuthenticated, id, checkUserCourseAccess]);

  useEffect(() => {
    if (availableCourses.length === 0) loadAvailableCourses();
  }, [availableCourses.length, loadAvailableCourses]);

  const handleBuy = async () => {
    if (!id) return;
    setPurchasing(true);
    setPurchaseMsg("");
    const result = await purchaseCourse(id);
    setPurchasing(false);
    if (result.success) {
      setHasAccess(true);
      router.push(`/purchase-success?orderId=${result.orderId ?? "demo"}`);
    } else {
      setPurchaseMsg(result.error || "Purchase failed. Please try again.");
    }
  };

  const openCourse = () => router.push(`/course-viewer?courseId=${id}`);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4B2AD6]" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Course not found.</p>
        <Button variant="ghost" onClick={() => router.push("/courses")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  const { chapters, topics } = countFlat(structure);
  const firstFolderIndex = structure.findIndex((i) => i.item_type === "folder");

  return (
    <div className="min-h-screen bg-[#F7F6FB] dark:bg-[#111] text-[#130F2A] dark:text-slate-100">

      {/* ── STICKY TOP ENROLL BAR ───────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-white dark:bg-[#111] border-b border-[#CDC6DC] dark:border-slate-800 shadow-sm">
        <div className="container max-w-4xl mx-auto px-4 py-3">
          <EnrollBar
            price={course.price}
            purchasing={purchasing}
            hasAccess={hasAccess}
            onBuy={handleBuy}
            onOpen={openCourse}
            msg={purchaseMsg}
          />
        </div>
      </div>

      {/* ── COURSE HEADER ───────────────────────────────────────────── */}
      <div className="border-b border-[#E2DEEC] dark:border-slate-800 bg-white dark:bg-[#161616]">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => router.push("/courses")}
            className="flex items-center gap-1.5 text-sm text-[#857FA0] hover:text-[#130F2A] dark:hover:text-white mb-5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> All Courses
          </button>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#EBE6FD] dark:bg-slate-800 border border-[#D7CEFA] dark:border-slate-700 shadow-sm shrink-0">
              <BookOpen className="w-6 h-6 text-[#4B2AD6] dark:text-slate-300" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs text-[#4B2AD6] border-[#D7CEFA] bg-[#EBE6FD]">CLAT PG</Badge>
                {hasAccess && (
                  <Badge className="text-xs bg-[#E6F2EC] text-[#1F7A52] border border-[#1F7A52]/20 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Enrolled
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold leading-snug mb-2">{course.name}</h1>
              {course.description && (
                <p className="text-[#857FA0] dark:text-slate-400 text-sm leading-relaxed max-w-2xl">
                  {course.description}
                </p>
              )}
              <div className="flex flex-wrap gap-5 mt-4 text-sm text-[#857FA0] dark:text-slate-400">
                {chapters > 0 && (
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />{chapters} chapters
                  </span>
                )}
                {topics > 0 && (
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />{topics} topics
                  </span>
                )}
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Self-paced</span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> Lifetime access</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT (full width) ───────────────────────────────── */}
      <div className="container max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* What's included */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <h2 className="text-base font-semibold text-[#130F2A] dark:text-white mb-4">What you get</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {INCLUDED.map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-[#434056] dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-[#1F7A52] shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </motion.section>

        {/* Course Contents — full width */}
        {structure.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut", delay: 0.06 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-[#130F2A] dark:text-white">Course contents</h2>
              <span className="text-xs text-[#857FA0]">{chapters} chapters · {topics} topics</span>
            </div>

            <div className="border border-[#CDC6DC] dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-[#E2DEEC] dark:divide-slate-800 bg-white">
              {structure.map((item, idx) => {
                const isFreeFolder = idx === firstFolderIndex && item.item_type === "folder";
                if (item.item_type === "folder") {
                  return (
                    <FolderItem
                      key={item._id}
                      item={item}
                      isFree={isFreeFolder}
                      hasAccess={hasAccess}
                      depth={0}
                    />
                  );
                }
                return <FileRow key={item._id} item={item} isUnlocked={hasAccess} />;
              })}
            </div>

            {!hasAccess && (
              <p className="mt-3 text-xs text-[#857FA0] dark:text-slate-500 flex items-center gap-1.5">
                <Unlock className="w-3.5 h-3.5" />
                First chapter is free to explore — no payment needed.
              </p>
            )}
          </motion.section>
        )}

        {/* Trust row — inline, no boxes */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut", delay: 0.1 }}
          className="border-t border-[#E2DEEC] dark:border-slate-800 pt-8"
        >
          <h2 className="text-base font-semibold text-[#130F2A] dark:text-white mb-5">Why trust us</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRUST.map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col items-start gap-2">
                <Icon className="w-5 h-5 text-[#4B2AD6] dark:text-slate-400" />
                <span className="text-sm text-[#434056] dark:text-slate-300 leading-snug">{text}</span>
              </div>
            ))}
          </div>
        </motion.section>
      </div>

      {/* ── FOOTER ENROLL BAR ───────────────────────────────────────── */}
      <div className="border-t border-[#CDC6DC] dark:border-slate-800 bg-white dark:bg-[#161616] mt-6">
        <div className="container max-w-4xl mx-auto px-4 py-5">
          <EnrollBar
            price={course.price}
            purchasing={purchasing}
            hasAccess={hasAccess}
            onBuy={handleBuy}
            onOpen={openCourse}
            msg={purchaseMsg}
          />
        </div>
      </div>
    </div>
  );
}
