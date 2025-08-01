import { PaperAnalysis } from './paper-fetcher.js';
import { UserProfile } from './user-profiler.js';
export interface Milestone {
    id: string;
    title: string;
    description: string;
    estimated_time: string;
    steps: Step[];
}
export interface Step {
    id: string;
    title: string;
    description: string;
    estimated_time: string;
    difficulty: string;
}
export interface ReproductionPlan {
    overview: string;
    milestones: Milestone[];
    env_setup: {
        python_version: string;
        core_packages: string[];
    };
    estimated_timeline: string;
    difficulty: string;
}
export declare class ReproductionPlanner {
    private paperInfo;
    private userProfile;
    constructor(paperInfo: PaperAnalysis, userProfile: UserProfile);
    generatePlan(): ReproductionPlan;
    private generateOverview;
    private generateMilestones;
    private adjustMilestonesForUser;
    private adjustTimeForBeginner;
    private generateEnvSetup;
    private getCorePackages;
    private estimateTimeline;
    private assessDifficulty;
}
//# sourceMappingURL=reproduction-planner.d.ts.map