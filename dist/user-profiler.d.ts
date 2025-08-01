export interface UserProfile {
    experience_level: string;
    preferred_framework: string;
    xai_tools: string[];
    learning_goals: string;
    programming_languages: string[];
    research_areas: string[];
}
export declare class UserProfiler {
    static readonly FRAMEWORKS: string[];
    static readonly XAI_TOOLS: string[];
    static readonly EXPERIENCE_LEVELS: string[];
    static createProfile(responses: Record<string, any>): UserProfile;
    private static assessExperienceLevel;
    private static calculateExperienceScore;
    private static determinePreferredFramework;
    private static identifyXaiTools;
    private static extractLearningGoals;
    private static identifyProgrammingLanguages;
    private static identifyResearchAreas;
}
//# sourceMappingURL=user-profiler.d.ts.map