export type SearxngWebResult = {
	title?: string;
	url?: string;
	content?: string;
	engine?: string;
	publishedDate?: string | null;
};

export type SearxngInfobox = {
	infobox?: string;
	title?: string;
	content?: string;
	url?: string;
	id?: string;
};

export type SearxngSearchJson = {
	query?: string;
	answers?: string[];
	suggestions?: string[];
	infoboxes?: SearxngInfobox[];
	results?: SearxngWebResult[];
};
