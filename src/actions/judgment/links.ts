import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import type { NotePdfLink } from "@/types";

export async function fetchLinksForItem(itemId: string): Promise<NotePdfLink[]> {
  try {
    const data = await fetchQuery(api.content.getNotePdfLinks, {
      itemId: itemId as Id<"structure_items">,
    });
    return (data ?? []) as unknown as NotePdfLink[];
  } catch (e) {
    console.error("Error fetching note_pdf_links:", e);
    return [];
  }
}

export async function checkItemHasPdf(itemId: string): Promise<string | null> {
  if (!itemId) return null;
  try {
    const item = await fetchQuery(api.content.getStructureItem, {
      itemId: itemId as Id<"structure_items">,
    });
    return item?.pdf_url ?? null;
  } catch {
    return null;
  }
}

export async function insertLink(
  payload: Omit<NotePdfLink, "id" | "created_at">,
  token?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const opts = token ? { token } : {};
    await fetchMutation(
      api.content.createNotePdfLink,
      {
        itemId: (payload as { item_id: string }).item_id as Id<"structure_items">,
        link_id: (payload as { link_id: string }).link_id,
        pdf_page: (payload as { pdf_page: number }).pdf_page,
        x: (payload as { x: number }).x,
        y: (payload as { y: number }).y,
        width: (payload as { width: number }).width,
        height: (payload as { height: number }).height,
        label: (payload as { label?: string }).label,
      },
      opts
    );
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteLink(
  id: string,
  token?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const opts = token ? { token } : {};
    await fetchMutation(
      api.content.deleteNotePdfLink,
      { linkId: id as Id<"note_pdf_links"> },
      opts
    );
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function updateItemPdfUrl(
  itemId: string,
  pdfUrl: string,
  token?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const opts = token ? { token } : {};
    await fetchMutation(
      api.content.updateStructureItemPdf,
      { itemId: itemId as Id<"structure_items">, pdf_url: pdfUrl },
      opts
    );
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function updateNoteContent(
  itemId: string,
  content: string,
  token?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const opts = token ? { token } : {};
    await fetchMutation(
      api.content.updateNoteContent,
      { itemId: itemId as Id<"structure_items">, content_html: content },
      opts
    );
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function fetchAllCaseItems(): Promise<
  { id: string; title: string; pdf_url: string | null }[]
> {
  try {
    const courses = await fetchQuery(api.content.getCourses, { activeOnly: false });
    const contemCourse = courses.find((c) =>
      c.name.toLowerCase().includes("contemporary")
    );
    if (!contemCourse) return [];

    const items = await fetchQuery(api.content.getStructureItemsByCourse, {
      courseId: contemCourse._id,
    });
    return items
      .filter(
        (i) =>
          i.title.match(/^(CS|CQ|CR)-/) ||
          i.title.match(/^\d{4}-\d+/)
      )
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((i) => ({ id: i._id, title: i.title, pdf_url: i.pdf_url ?? null }));
  } catch (e) {
    console.error("Error fetching case items:", e);
    return [];
  }
}
