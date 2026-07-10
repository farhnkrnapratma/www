import { supabase } from '$lib/supabase';
import { error } from '@sveltejs/kit';
import { marked } from 'marked';
import type { PageServerLoad } from './$types';

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
    html = await marked.parse(markdown);

    const words = markdown.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    post.read_time = `${minutes} min${minutes > 1 ? 's' : ''} read`;
  } catch (err) {
    console.error('Error fetching/rendering markdown file:', err);
    html = '<p class="text-red-500">Error: Could not render post content.</p>';
    post.read_time = '1 min read';
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
    comments: comments || [],
  };
};
