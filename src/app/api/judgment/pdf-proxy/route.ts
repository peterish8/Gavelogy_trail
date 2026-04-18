import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'

// Proxies a Convex-stored PDF through the app origin to avoid CORS.
// Accepts ?itemId=<structure_items id> and streams the PDF back.
export async function GET(req: NextRequest) {
  const itemId = req.nextUrl.searchParams.get('itemId')
  if (!itemId) return new NextResponse('Missing itemId', { status: 400 })

  try {
    const item = await fetchQuery(api.content.getStructureItem, {
      itemId: itemId as Id<'structure_items'>,
    })
    if (!item?.pdf_url) return new NextResponse('No PDF found', { status: 404 })

    let urlToFetch = item.pdf_url;
    
    // Fallback: If it is a legacy Convex storageId (does not start with http), resolve it via Convex
    if (!item.pdf_url.startsWith('http')) {
      const storageUrl = await fetchQuery(api.storage.getUrl, { storageId: item.pdf_url });
      if (!storageUrl) return new NextResponse('Storage URL not found', { status: 404 });
      urlToFetch = storageUrl;
    }

    const pdfRes = await fetch(urlToFetch)
    if (!pdfRes.ok) {
      return new NextResponse('Failed to fetch PDF from storage', { status: 502 })
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'public, s-maxage=2592000, stale-while-revalidate=86400',
      'Content-Disposition': 'inline',
    }
    const cl = pdfRes.headers.get('Content-Length')
    if (cl) headers['Content-Length'] = cl

    return new NextResponse(pdfRes.body, { headers })
  } catch (err: any) {
    console.error('PDF proxy error:', err)
    return new NextResponse('Error: ' + err.message, { status: 500 })
  }
}
