"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitManager = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs_1 = require("fs");
const path_1 = require("path");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class GitManager {
    projectDir;
    constructor(projectDir) {
        this.projectDir = projectDir;
    }
    async initRepo() {
        try {
            // 检查是否已经是Git仓库
            const gitDir = (0, path_1.join)(this.projectDir, '.git');
            const gitExists = await fs_1.promises.access(gitDir).then(() => true).catch(() => false);
            if (!gitExists) {
                await execAsync('git init', { cwd: this.projectDir });
                console.log('✅ Git仓库已初始化');
            }
            // 创建.gitignore文件
            await this.createGitignore();
            // 创建README.md
            await this.createReadme();
            // 初始提交
            await this.autoCommit('Initial project setup');
        }
        catch (error) {
            console.warn('Git初始化失败:', error);
        }
    }
    async createGitignore() {
        const gitignoreContent = `# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual Environment
venv/
env/
ENV/

# IDE
.vscode/
.idea/
*.swp
*.swo

# Jupyter Notebook
.ipynb_checkpoints

# Data files
*.csv
*.json
*.pkl
*.h5
*.hdf5
*.npy
*.npz

# Model files
*.pth
*.pt
*.ckpt
*.model

# Logs
logs/
*.log

# Results
results/
outputs/

# OS
.DS_Store
Thumbs.db

# Project specific
reproduction_state.json
`;
        const gitignorePath = (0, path_1.join)(this.projectDir, '.gitignore');
        await fs_1.promises.writeFile(gitignorePath, gitignoreContent, 'utf-8');
    }
    async createReadme() {
        const readmeContent = `# 论文复现项目

这是一个使用论文复现助手MCP工具创建的项目。

## 项目结构

- \`src/\` - 源代码目录
- \`data/\` - 数据文件目录
- \`results/\` - 实验结果目录
- \`notes/\` - 学习笔记目录
- \`reproduction_state.json\` - 项目状态文件

## 使用方法

1. 使用论文复现助手MCP工具来管理项目
2. 按照生成的复现计划逐步执行
3. 使用 \`get_project_status\` 查看项目进度

## 环境要求

- Python 3.8+
- 相关依赖包（见requirements.txt）

## 许可证

MIT License
`;
        const readmePath = (0, path_1.join)(this.projectDir, 'README.md');
        await fs_1.promises.writeFile(readmePath, readmeContent, 'utf-8');
    }
    async autoCommit(message, stage = '.') {
        try {
            // 添加文件到暂存区
            await execAsync(`git add ${stage}`, { cwd: this.projectDir });
            // 提交更改
            await execAsync(`git commit -m "${message}"`, { cwd: this.projectDir });
            console.log(`✅ 已提交: ${message}`);
        }
        catch (error) {
            console.warn('Git提交失败:', error);
        }
    }
    async createBranch(branchName) {
        try {
            await execAsync(`git checkout -b ${branchName}`, { cwd: this.projectDir });
            console.log(`✅ 已创建并切换到分支: ${branchName}`);
        }
        catch (error) {
            console.warn('创建分支失败:', error);
        }
    }
    async getStatus() {
        try {
            const { stdout } = await execAsync('git status --porcelain', { cwd: this.projectDir });
            return stdout;
        }
        catch (error) {
            return '';
        }
    }
    async getLastCommit() {
        try {
            const { stdout } = await execAsync('git log -1 --oneline', { cwd: this.projectDir });
            return stdout.trim();
        }
        catch (error) {
            return 'No commits yet';
        }
    }
}
exports.GitManager = GitManager;
//# sourceMappingURL=git-manager.js.map