export interface ProjectStateData {
    project_name?: string;
    paper_info?: any;
    user_profile?: any;
    reproduction_plan?: any;
    current_stage?: string;
    current_milestone?: string;
    progress?: Record<string, any>;
    learning_notes?: any[];
    version_history?: any[];
    created_at?: string;
    last_updated?: string;
    [key: string]: any;
}
export declare class ProjectState {
    private projectDir;
    private stateFile;
    private notesDir;
    private codeDir;
    private dataDir;
    private resultsDir;
    state: ProjectStateData;
    constructor(projectDir: string);
    private ensureDirectories;
    private loadState;
    saveState(): Promise<void>;
    updateState(key: string, value: any): Promise<void>;
    getState(): ProjectStateData;
}
//# sourceMappingURL=project-state.d.ts.map