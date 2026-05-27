export type BraveWebHit = {
	title?: string;
	url?: string;
	description?: string;
	age?: string;
	page_age?: string;
	extra_snippets?: string[];
};

export type BraveNewsHit = {
	title?: string;
	url?: string;
	description?: string;
	age?: string;
	page_age?: string;
};

export type BraveFaqHit = {
	question?: string;
	answer?: string;
};

export type BraveInfoboxResult = {
	title?: string;
	url?: string;
	description?: string;
	long_desc?: string;
};

export type BraveWebSearchJson = {
	query?: {
		original?: string;
		altered?: string;
	};
	faq?: { results?: BraveFaqHit[] };
	infobox?: { results?: BraveInfoboxResult[] };
	news?: { results?: BraveNewsHit[] };
	web?: { results?: BraveWebHit[] };
};

export type BraveImageHit = {
	title?: string;
	url?: string;
	properties?: { url?: string; width?: number; height?: number };
	thumbnail?: { src?: string };
};

export type BraveImageSearchJson = {
	query?: { original?: string; altered?: string };
	results?: BraveImageHit[];
};
