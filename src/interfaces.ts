interface HighlightData {
	body: Array<string>;
	title: Array<string>;
}

export interface SearchDocumentData {
	mdn_url: string;
	score: number;
	title: string;
	locale: string;
	slug: string;
	popularity: number;
	summary: string;
	highlight: HighlightData;
}

interface MetadataTotal {
	value: number;
	relation: string;
}

export interface SearchMetadata {
	took_ms: number;
	size: number;
	page: number;
	total: MetadataTotal;
}

export interface SearchData {
	documents: Array<SearchDocumentData>;
	metadata: SearchMetadata;
	suggestions: Array<string>;
}
