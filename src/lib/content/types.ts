export type Link = { label: string; href: string };
export type Plan = { id: string; name: string; summary: string; price: string; features: string[] };
export type PageBlock =
	| { type: 'hero'; id: string; title: string; summary: string; eyebrow?: string; actions?: Link[] }
	| { type: 'plans'; id: string; title: string; description?: string; items: Plan[] }
	| { type: 'faq'; id: string; title: string; items: { question: string; answer: string }[] };
export type PageDefinition = {
	slug: string;
	title: string;
	description: string;
	blocks: PageBlock[];
};
