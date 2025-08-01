import { promises as fs } from 'fs';
import { join } from 'path';

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

export class ProjectState {
  private projectDir: string;
  private stateFile: string;
  private notesDir: string;
  private codeDir: string;
  private dataDir: string;
  private resultsDir: string;
  public state: ProjectStateData;

  constructor(projectDir: string) {
    this.projectDir = projectDir;
    this.stateFile = join(projectDir, 'reproduction_state.json');
    this.notesDir = join(projectDir, 'notes');
    this.codeDir = join(projectDir, 'src');
    this.dataDir = join(projectDir, 'data');
    this.resultsDir = join(projectDir, 'results');
    
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

  private async ensureDirectories(): Promise<void> {
    const dirs = [this.notesDir, this.codeDir, this.dataDir, this.resultsDir];
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.warn(`Failed to create directory ${dir}:`, error);
      }
    }
  }

  private async loadState(): Promise<void> {
    try {
      const data = await fs.readFile(this.stateFile, 'utf-8');
      this.state = JSON.parse(data);
    } catch (error) {
      // ignore, 用默认state
    }
  }

  public async saveState(): Promise<void> {
    this.state.last_updated = new Date().toISOString();
    await fs.writeFile(this.stateFile, JSON.stringify(this.state, null, 2), 'utf-8');
  }

  public async updateState(key: string, value: any): Promise<void> {
    this.state[key] = value;
    await this.saveState();
  }

  public getState(): ProjectStateData {
    return this.state;
  }
} 