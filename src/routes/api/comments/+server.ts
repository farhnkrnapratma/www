import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';

const FORBIDDEN_WORDS = [
	/anj\w+/i,
	/baf\w+/i,
	/baj\w+/i,
	/ngg\w+t/i,
	/nged\w+t/i,
	/kontol/i,
	/memek/i,
	/peler/i,
	/jembut/i,
	/fuck/i,
	/shit/i,
	/asshole/i,
	/bitch/i,
	/bastard/i,
	/spammer/i,
	/slot online/i,
	/judi/i,
	/gacor/i,
	/porn/i
];

function localModerate(content: string): boolean {
	for (const pattern of FORBIDDEN_WORDS) {
		if (pattern.test(content)) {
			return false;
		}
	}
	return true;
}

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const { postId, authorName, content } = await request.json();

		if (!postId || !authorName || !content) {
			return json({ message: 'Missing required fields' }, { status: 400 });
		}

		let isApproved = true;
		let moderationSource = 'local_fallback';

		if (platform?.env?.AI) {
			try {
				const ai = platform.env.AI;
				const systemPrompt = `You are a content moderation AI. Analyze the following comment for hate speech, severe insults, harassment, threats, explicit content, or obvious spam.
Respond with exactly one word: "SAFE" if the comment is clean and allowed, or "BLOCKED" if it contains forbidden content. Do not include any other words, punctuation, or explanations.`;

				const response = await ai.run('@cf/meta/llama-3-8b-instruct', {
					messages: [
						{ role: 'system', content: systemPrompt },
						{ role: 'user', content: `Comment: "${content}"` }
					]
				});

				const aiText = (response.response || '').trim().toUpperCase();
				if (aiText.includes('BLOCKED')) {
					isApproved = false;
				} else if (aiText.includes('SAFE')) {
					isApproved = true;
				} else {
					isApproved = localModerate(content);
				}
				moderationSource = 'cloudflare_workers_ai';
			} catch (aiErr) {
				console.error('Cloudflare Workers AI failed, falling back to local filter:', aiErr);
				isApproved = localModerate(content);
			}
		} else {
			isApproved = localModerate(content);
		}

		if (!isApproved) {
			return json(
				{
					is_approved: false,
					message: 'Comment was blocked by AI content moderation.'
				},
				{ status: 400 }
			);
		}

		const { data: comment, error } = await supabase
			.from('comments')
			.insert({
				post_id: postId,
				author_name: authorName,
				content: content,
				is_approved: true
			})
			.select()
			.single();

		if (error) {
			console.error('Database error saving comment:', error);
			return json({ message: 'Failed to save comment to database' }, { status: 500 });
		}

		return json({
			is_approved: true,
			comment,
			moderation_source: moderationSource
		});
	} catch (err: any) {
		console.error('Comment API error:', err);
		return json({ message: err.message || 'Internal server error' }, { status: 500 });
	}
};
