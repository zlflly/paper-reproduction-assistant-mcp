import axios from 'axios';

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

export class PaperFetcher {
  static async searchPapers(query: string, source: string = 'both'): Promise<Paper[]> {
    const papers: Paper[] = [];

    if (source === 'arxiv' || source === 'both') {
      try {
        const arxivPapers = await this.searchArxiv(query);
        papers.push(...arxivPapers);
      } catch (error) {
        console.warn('Failed to search arXiv:', error);
      }
    }

    if (source === 'bing_academic' || source === 'both') {
      try {
        const bingPapers = await this.searchBingAcademic(query);
        papers.push(...bingPapers);
      } catch (error) {
        console.warn('Failed to search Bing Academic:', error);
      }
    }

    return papers.slice(0, 5); // 限制返回数量
  }

  private static async searchArxiv(query: string): Promise<Paper[]> {
    const searchUrl = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=5`;
    
    const response = await axios.get(searchUrl);
    const papers: Paper[] = [];

    // 简单的XML解析（实际项目中应该使用专门的XML解析库）
    const content = response.data;
    const entries = content.match(/<entry>([\s\S]*?)<\/entry>/g) || [];

    for (const entry of entries) {
      const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
      const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
      const idMatch = entry.match(/<id>([\s\S]*?)<\/id>/);
      
      if (titleMatch && summaryMatch && idMatch) {
        papers.push({
          title: titleMatch[1].trim(),
          authors: ['Unknown Author'], // 简化处理
          summary: summaryMatch[1].trim(),
          url: idMatch[1].trim(),
        });
      }
    }

    return papers;
  }

  private static async searchBingAcademic(query: string): Promise<Paper[]> {
    // 模拟Bing Academic搜索（实际需要API密钥）
    return [
      {
        title: `Research on ${query}`,
        authors: ['Academic Researcher'],
        summary: `This paper presents research findings related to ${query}. The study explores various aspects and provides insights into the topic.`,
        url: `https://example.com/paper/${encodeURIComponent(query)}`,
      },
    ];
  }

  static async analyzePaper(input: string, inputType: string): Promise<PaperAnalysis> {
    let content = '';

    switch (inputType) {
      case 'url':
        content = await this.extractFromUrl(input);
        break;
      case 'pdf':
        content = await this.extractFromPdf(input);
        break;
      case 'title':
        content = await this.searchByTitle(input);
        break;
      default:
        throw new Error(`Unsupported input type: ${inputType}`);
    }

    return this.analyzeContent(content, input);
  }

  private static async extractFromUrl(url: string): Promise<string> {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to extract content from URL: ${error}`);
    }
  }

  private static async extractFromPdf(pdfPath: string): Promise<string> {
    // 简化实现，实际项目中应该使用PDF解析库
    return `PDF content from ${pdfPath}`;
  }

  private static async searchByTitle(title: string): Promise<string> {
    const papers = await this.searchPapers(title);
    if (papers.length === 0) {
      throw new Error(`No papers found with title: ${title}`);
    }
    return papers[0].summary;
  }

  private static analyzeContent(content: string, originalInput: string): PaperAnalysis {
    // 简化的内容分析，实际项目中应该使用更复杂的NLP
    const keywords = this.extractKeywords(content);
    const difficulty = this.assessDifficulty(content);
    const estimatedTime = this.estimateTime(content, difficulty);

    return {
      title: originalInput,
      authors: ['Unknown Authors'],
      summary: content.substring(0, 500) + '...',
      keywords,
      difficulty,
      estimated_time: estimatedTime,
      analyzed_at: new Date().toISOString(),
      methodology: ['Machine Learning', 'Deep Learning'],
      datasets: ['Custom Dataset'],
      frameworks: ['PyTorch', 'TensorFlow'],
    };
  }

  private static extractKeywords(content: string): string[] {
    const commonKeywords = [
      'machine learning', 'deep learning', 'neural networks', 'artificial intelligence',
      'computer vision', 'natural language processing', 'reinforcement learning',
      'supervised learning', 'unsupervised learning', 'transfer learning'
    ];

    const foundKeywords = commonKeywords.filter(keyword =>
      content.toLowerCase().includes(keyword)
    );

    return foundKeywords.length > 0 ? foundKeywords : ['research', 'analysis'];
  }

  private static assessDifficulty(content: string): string {
    const complexityIndicators = [
      'complex', 'advanced', 'sophisticated', 'novel', 'state-of-the-art',
      'simple', 'basic', 'elementary', 'fundamental', 'introductory'
    ];

    const complexityScore = complexityIndicators.reduce((score, indicator) => {
      const count = (content.toLowerCase().match(new RegExp(indicator, 'g')) || []).length;
      return score + count;
    }, 0);

    if (complexityScore > 5) return '高级';
    if (complexityScore > 2) return '中级';
    return '初级';
  }

  private static estimateTime(content: string, difficulty: string): string {
    const baseTime = {
      '初级': '1-2周',
      '中级': '2-4周',
      '高级': '4-8周'
    };

    const contentLength = content.length;
    const multiplier = Math.ceil(contentLength / 10000);

    return `${baseTime[difficulty as keyof typeof baseTime]} (${multiplier}x)`;
  }
} 