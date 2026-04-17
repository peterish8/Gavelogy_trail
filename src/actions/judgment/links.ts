import { supabase } from '@/lib/supabase-client';
import { createClient } from '@supabase/supabase-js';
import type { NotePdfLink } from '@/types';

// Admin client using service role (for insert/delete)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Fetch all note-PDF links for a given structure_item
export async function fetchLinksForItem(itemId: string): Promise<NotePdfLink[]> {
  const { data, error } = await supabase
    .from('note_pdf_links')
    .select('*')
    .eq('item_id', itemId)
    .order('pdf_page');

  if (error) {
    console.error('Error fetching note_pdf_links:', error);
    return [];
  }
  return (data as NotePdfLink[]) || [];
}

// Check if a structure_item has a PDF — returns pdf_url or null
export async function checkItemHasPdf(itemId: string): Promise<string | null> {
  if (!itemId) return null;
  const { data, error } = await supabase
    .from('structure_items')
    .select('pdf_url')
    .eq('id', itemId)
    .single();

  if (error || !data) return null;
  return (data as { pdf_url: string | null }).pdf_url || null;
}

// Insert a new link (admin only — uses service role key)
export async function insertLink(
  payload: Omit<NotePdfLink, 'id' | 'created_at'>
): Promise<{ success: boolean; error?: string }> {
  const admin = getAdminClient();
  const { error } = await admin.from('note_pdf_links').insert(payload);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// Delete a link by id (admin only)
export async function deleteLink(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const admin = getAdminClient();
  const { error } = await admin.from('note_pdf_links').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// Update pdf_url on a structure_item (admin only)
export async function updateItemPdfUrl(
  itemId: string,
  pdfUrl: string
): Promise<{ success: boolean; error?: string }> {
  const admin = getAdminClient();
  const { error } = await admin
    .from('structure_items')
    .update({ pdf_url: pdfUrl })
    .eq('id', itemId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// Update note_contents content for a structure_item (admin only)
export async function updateNoteContent(
  itemId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const admin = getAdminClient();
  const { error } = await admin
    .from('note_contents')
    .update({ content_html: content })
    .eq('item_id', itemId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// Fetch all structure_items that are case notes (for admin list)
export async function fetchAllCaseItems(): Promise<{
  id: string;
  title: string;
  pdf_url: string | null;
}[]> {
  // Cases are structure_items under the "Contemporary Cases" course
  // Filter by title pattern matching case number formats
  const { data, error } = await supabase
    .from('structure_items')
    .select('id, title, pdf_url')
    .or('title.ilike.CS-%,title.ilike.CQ-%,title.ilike.CR-%')
    .order('title');

  if (error) {
    console.error('Error fetching case items:', error);
    return [];
  }
  return (data as { id: string; title: string; pdf_url: string | null }[]) || [];
}
