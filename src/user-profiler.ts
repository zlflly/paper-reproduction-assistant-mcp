export interface UserProfile {
  experience_level: string;
  preferred_framework: string;
  xai_tools: string[];
  learning_goals: string;
  programming_languages: string[];
  research_areas: string[];
}

export class UserProfiler {
  static readonly FRAMEWORKS = ['PyTorch', 'TensorFlow', 'JAX', 'Keras', 'scikit-learn'];
  static readonly XAI_TOOLS = ['SHAP', 'LIME', 'GradCAM', 'Integrated Gradients', 'Captum'];
  static readonly EXPERIENCE_LEVELS = ['初学者', '中级', '高级', '专家'];

  static createProfile(responses: Record<string, any>): UserProfile {
    const experienceLevel = this.assessExperienceLevel(responses);
    const preferredFramework = this.determinePreferredFramework(responses);
    const xaiTools = this.identifyXaiTools(responses);
    const learningGoals = this.extractLearningGoals(responses);
    const programmingLanguages = this.identifyProgrammingLanguages(responses);
    const researchAreas = this.identifyResearchAreas(responses);

    return {
      experience_level: experienceLevel,
      preferred_framework: preferredFramework,
      xai_tools: xaiTools,
      learning_goals: learningGoals,
      programming_languages: programmingLanguages,
      research_areas: researchAreas,
    };
  }

  private static assessExperienceLevel(responses: Record<string, any>): string {
    const experienceScore = this.calculateExperienceScore(responses);
    
    if (experienceScore >= 8) return '专家';
    if (experienceScore >= 6) return '高级';
    if (experienceScore >= 4) return '中级';
    return '初学者';
  }

  private static calculateExperienceScore(responses: Record<string, any>): number {
    let score = 0;
    
    // 编程经验
    if (responses.programming_experience === '5+ years') score += 3;
    else if (responses.programming_experience === '2-5 years') score += 2;
    else if (responses.programming_experience === '1-2 years') score += 1;

    // ML经验
    if (responses.ml_experience === '5+ years') score += 3;
    else if (responses.ml_experience === '2-5 years') score += 2;
    else if (responses.ml_experience === '1-2 years') score += 1;

    // 论文复现经验
    if (responses.paper_reproduction_experience === '10+ papers') score += 2;
    else if (responses.paper_reproduction_experience === '5-10 papers') score += 1;

    return score;
  }

  private static determinePreferredFramework(responses: Record<string, any>): string {
    const frameworkPreferences = responses.framework_preferences || [];
    
    if (frameworkPreferences.includes('PyTorch')) return 'PyTorch';
    if (frameworkPreferences.includes('TensorFlow')) return 'TensorFlow';
    if (frameworkPreferences.includes('JAX')) return 'JAX';
    if (frameworkPreferences.includes('Keras')) return 'Keras';
    
    return 'PyTorch'; // 默认选择
  }

  private static identifyXaiTools(responses: Record<string, any>): string[] {
    const knownTools = responses.known_xai_tools || [];
    return knownTools.filter((tool: string) => 
      this.XAI_TOOLS.includes(tool)
    );
  }

  private static extractLearningGoals(responses: Record<string, any>): string {
    const goals = responses.learning_goals || [];
    if (goals.length === 0) return '掌握论文复现的基本流程';
    
    return goals.join(', ');
  }

  private static identifyProgrammingLanguages(responses: Record<string, any>): string[] {
    const languages = responses.programming_languages || [];
    const commonLanguages = ['Python', 'JavaScript', 'Java', 'C++', 'R', 'MATLAB'];
    
    return languages.filter((lang: string) => 
      commonLanguages.includes(lang)
    );
  }

  private static identifyResearchAreas(responses: Record<string, any>): string[] {
    const areas = responses.research_areas || [];
    const commonAreas = [
      'Computer Vision', 'Natural Language Processing', 'Reinforcement Learning',
      'Graph Neural Networks', 'Generative Models', 'Explainable AI'
    ];
    
    return areas.filter((area: string) => 
      commonAreas.includes(area)
    );
  }
} 