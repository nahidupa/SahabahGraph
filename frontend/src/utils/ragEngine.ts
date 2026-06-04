import type { GraphData, PoliticalData } from '../types';

class RAGEngine {
  private graphData: GraphData | null = null;
  private politicalData: PoliticalData | null = null;
  private isLoaded = false;

  async loadData() {
    if (this.isLoaded) return;

    try {
      const [graphRes, politicalRes] = await Promise.all([
        fetch('/data/sahabah_data.json'),
        fetch('/data/political_terms.json')
      ]);

      if (!graphRes.ok || !politicalRes.ok) {
        throw new Error('Failed to fetch data files');
      }

      this.graphData = await graphRes.json();
      this.politicalData = await politicalRes.json();
      this.isLoaded = true;
    } catch (error) {
      console.error('Failed to load RAG data:', error);
    }
  }

  async getContext(query: string): Promise<string> {
    if (!this.isLoaded) {
      await this.loadData();
    }

    if (!this.graphData || !this.politicalData) {
      return '';
    }

    const lowerQuery = query.toLowerCase();

    const relevantSahabah = this.graphData.nodes.filter(node => {
      const nameMatch = node.name_en.toLowerCase().includes(lowerQuery) ||
                       (node.name_ar && node.name_ar.includes(query)) ||
                       (node.name_bn && node.name_bn.includes(query));

      const bioMatch = node.biography_short?.toLowerCase().includes(lowerQuery);

      return nameMatch || bioMatch;
    }).slice(0, 5);

    const relevantTerms = this.politicalData.terms.filter(term => {
      return term.governor_name?.toLowerCase().includes(lowerQuery) ||
             term.caliph_name.toLowerCase().includes(lowerQuery) ||
             term.notes?.toLowerCase().includes(lowerQuery);
    }).slice(0, 3);

    let context = "Relevant Information from SahabahGraph Database:\n\n";

    if (relevantSahabah.length > 0) {
      context += "Sahabah:\n";
      relevantSahabah.forEach(s => {
        context += `- ${s.name_en}: ${s.biography_short}\n`;
        if (s.tribe) context += `  Tribe: ${s.tribe}\n`;
        if (s.clan) context += `  Clan: ${s.clan}\n`;
      });
      context += "\n";
    }

    if (relevantTerms.length > 0) {
      context += "Political Terms/Governance:\n";
      relevantTerms.forEach(t => {
        context += `- ${t.governor_name} served as governor under Caliph ${t.caliph_name} (${t.start_year_hijri} - ${t.end_year_hijri} AH). Notes: ${t.notes || 'N/A'}\n`;
      });
      context += "\n";
    }

    if (relevantSahabah.length === 0 && relevantTerms.length === 0) {
        return "";
    }

    return context;
  }
}

export const ragEngine = new RAGEngine();
