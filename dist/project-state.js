"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectState = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
class ProjectState {
    projectDir;
    stateFile;
    notesDir;
    codeDir;
    dataDir;
    resultsDir;
    state;
    constructor(projectDir) {
        this.projectDir = projectDir;
        this.stateFile = (0, path_1.join)(projectDir, 'reproduction_state.json');
        this.notesDir = (0, path_1.join)(projectDir, 'notes');
        this.codeDir = (0, path_1.join)(projectDir, 'src');
        this.dataDir = (0, path_1.join)(projectDir, 'data');
        this.resultsDir = (0, path_1.join)(projectDir, 'results');
        // 初始化时异步加载state
        this.state = {
            current_stage: 'initialization',
            progress: {},
            learning_notes: [],
            version_history: [],
            created_at: new Date().toISOString(),
            last_updated: new Date().toISOString(),
        };
        this.ensureDirectories();
        this.loadState();
    }
    async ensureDirectories() {
        const dirs = [this.notesDir, this.codeDir, this.dataDir, this.resultsDir];
        for (const dir of dirs) {
            try {
                await fs_1.promises.mkdir(dir, { recursive: true });
            }
            catch (error) {
                console.warn(`Failed to create directory ${dir}:`, error);
            }
        }
    }
    async loadState() {
        try {
            const data = await fs_1.promises.readFile(this.stateFile, 'utf-8');
            this.state = JSON.parse(data);
        }
        catch (error) {
            // ignore, 用默认state
        }
    }
    async saveState() {
        this.state.last_updated = new Date().toISOString();
        await fs_1.promises.writeFile(this.stateFile, JSON.stringify(this.state, null, 2), 'utf-8');
    }
    async updateState(key, value) {
        this.state[key] = value;
        await this.saveState();
    }
    getState() {
        return this.state;
    }
}
exports.ProjectState = ProjectState;
//# sourceMappingURL=project-state.js.map