export declare class GitManager {
    private projectDir;
    constructor(projectDir: string);
    initRepo(): Promise<void>;
    private createGitignore;
    private createReadme;
    autoCommit(message: string, stage?: string): Promise<void>;
    createBranch(branchName: string): Promise<void>;
    getStatus(): Promise<string>;
    getLastCommit(): Promise<string>;
}
//# sourceMappingURL=git-manager.d.ts.map