import { supabase } from '$lib/supabase';
import { error } from '@sveltejs/kit';
import { marked } from 'marked';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const { slug } = params;

	// 1. Fetch post metadata from Supabase
	const { data: post, error: postError } = await supabase
		.from('posts')
		.select('*')
		.eq('slug', slug)
		.single();

	if (postError || !post) {
		console.error(`Post not found: ${slug}`, postError);
		throw error(404, 'Blog post not found');
	}

	// 2. Fetch the markdown file from Supabase Storage using public URL
	let html = '';
	try {
		const { data } = supabase.storage.from('blog-posts').getPublicUrl(post.storage_path);
		const fileRes = await fetch(data.publicUrl);
		if (!fileRes.ok) {
			throw new Error(`Failed to fetch markdown file: ${fileRes.statusText}`);
		}
		const markdown = await fileRes.text();

		// Parse markdown to HTML
		html = await marked.parse(markdown);
	} catch (err) {
		console.error('Error fetching/rendering markdown file:', err);
		html = '<p class="text-red-500">Error: Could not render post content.</p>';
	}

	// 3. Fetch comments for this post
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
		comments: comments || []
	};
};
