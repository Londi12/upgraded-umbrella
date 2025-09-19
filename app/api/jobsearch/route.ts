export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;
  if (!q) {
    return new Response(JSON.stringify({ error: 'Missing search query' }), { status: 400 });
  }
  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
    return new Response(JSON.stringify({ error: 'Google API key or CSE ID not set' }), { status: 500 });
  }
  const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(q)}`;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch from Google Search API');
    }
    const text = await response.text();
    if (!text) {
      return new Response(JSON.stringify({ results: [] }), { status: 200 });
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return new Response(JSON.stringify({ results: [] }), { status: 200 });
    }
    const results = (data.items || []).map((item: any) => ({
      title: item.title,
      snippet: item.snippet,
      link: item.link,
      displayLink: item.displayLink,
    }));
    return new Response(JSON.stringify({ results }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 });
  }
}
