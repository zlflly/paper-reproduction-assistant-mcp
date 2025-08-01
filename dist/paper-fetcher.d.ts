export interface Paper {
    title: string;
    authors: string[];
    summary: string;
    url: string;
    published_date?: string;
    keywords?: string[];
}
export interface PaperAnalysis {
    title: string;
    authors: string[];
    summary: string;
    keywords: string[];
    difficulty: string;
    estimated_time: string;
    analyzed_at: string;
    methodology: string[];
    datasets: string[];
    frameworks: string[];
}
export declare class PaperFetcher {
    static searchPapers(query: string, source?: string): Promise<Paper[]>;
    private static searchArxiv;
    private static searchBingAcademic;
    static analyzePaper(input: string, inputType: string): Promise<PaperAnalysis>;
    private static extractFromUrl;
    private static extractFromPdf;
    private static searchByTitle;
    private static analyzeContent;
    private static extractKeywords;
    private static assessDifficulty;
    private static estimateTime;
}
//# sourceMappingURL=paper-fetcher.d.ts.map