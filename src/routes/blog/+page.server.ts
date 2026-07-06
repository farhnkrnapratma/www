import { supabase } from '$lib/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { data: posts, error } = await supabase
		.from('posts')
		.select('*')
		.eq('published', true)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error loading posts:', error);
		return { posts: [] };
	}

	return { posts: posts || [] };
};
