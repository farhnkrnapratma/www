import { supabase } from '$lib/supabase';
import { error } from '@sveltejs/kit';
import { marked } from 'marked';
import type { PageServerLoad } from './$types';

function injectHeadingIds(html: string): string {
  let index = 0;
  const usedIds = new Set<string>();
  
  return html.replace(/<h([23])([^>]*)>(.*?)<\/h\1>/gi, (match, level, attrs, content) => {
    if (attrs.includes('id=')) {
      const idMatch = attrs.match(/id="([^"]*)"/);
      if (idMatch) {
        usedIds.add(idMatch[1]);
      }
      return match;
    }
    
    const text = content.replace(/<[^>]*>/g, '');
    const baseId = text
      ? text
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
      : `heading-${index++}`;
      
    let id = baseId;
    let counter = 1;
    while (usedIds.has(id)) {
      id = `${baseId}-${counter++}`;
    }
    usedIds.add(id);
    
    return `<h${level}${attrs} id="${id}">${content}</h${level}>`;
  });
}

export const load: PageServerLoad = async ({ params, fetch }) => {
  const { slug } = params;

  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (postError || !post) {
    console.error(`Post not found: ${slug}`, postError);
    throw error(404, 'Blog post not found');
  }

  let html: string;
  try {
    const { data } = supabase.storage.from('blog-posts').getPublicUrl(post.storage_path);
    const fileRes = await fetch(data.publicUrl);
    if (!fileRes.ok) {
      throw new Error(`Failed to fetch markdown file: ${fileRes.statusText}`);
    }
    const markdown = await fileRes.text();
    const rawHtml = await marked.parse(markdown);
    html = injectHeadingIds(rawHtml);
  } catch (err) {
    console.error('Error fetching/rendering markdown file:', err);
    html = '<p class="text-red-500">Error: Could not render post content.</p>';
    post.read_time = '1 min read';
  }

  function decodeHtmlEntities(str: string): string {
    return str
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  }

  // Extract headings for Table of Contents
  interface HeadingItem {
    id: string;
    text: string;
    level: number;
  }
  const headings: HeadingItem[] = [];
  const headingRegex = /<h([23])\s+[^>]*id="([^"]*)"[^>]*>(.*?)<\/h\1>/gi;
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1], 10);
    const id = match[2];
    const text = decodeHtmlEntities(match[3].replace(/<[^>]*>/g, '').trim()); // strip HTML tags & decode
    headings.push({ id, text, level });
  }

  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', post.id)
    .eq('is_approved', true)
    .order('created_at', { ascending: true });

  if (commentsError) {
    console.error('Error fetching comments:', commentsError);
  }

  return {
    post,
    html,
    headings,
    comments: comments || [],
  };
};
