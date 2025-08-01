# Paper Reproduction Assistant MCP

一个专门用于指导学术论文复现的MCP (Model Context Protocol) 工具，特别针对可解释性AI领域的论文复现工作流进行了优化。

## 🚀 特性

- **多源论文获取**: 支持arXiv和必应学术搜索，支持URL/PDF/标题输入
- **个性化评估**: 根据用户技术背景定制复现计划
- **交互式指导**: 逐步确认每个关键步骤，提供实时帮助
- **自动化管理**: 自动Git版本控制和项目结构创建
- **学习材料生成**: 自动生成结构化总结和问答材料
- **可解释性专精**: 针对XAI领域优化的工作流

## 📦 安装

1. 克隆仓库:
```bash
git clone https://github.com/zlflly/paper-reproduction-assistant-mcp.git
cd paper-reproduction-assistant-mcp
```

2. 安装依赖:
```bash
pip install -r requirements.txt
```

3. 在Cursor中配置MCP:
```json
{
  "mcpServers": {
    "paper-reproduction-assistant": {
      "command": "python",
      "args": ["/path/to/paper-reproduction-assistant-mcp/src/server.py"],
      "env": {}
    }
  }
}
```

## 🔧 使用方法

### 1. 初始化项目
```python
# 在Cursor中调用MCP工具
initialize_project(
    project_name="paper_reproduction_project", 
    project_dir="/path/to/your/projects"
)
```

### 2. 搜索和分析论文
```python
# 搜索论文
search_paper(query="attention visualization explainability", source="both")

# 分析论文
analyze_paper(
    input="https://arxiv.org/abs/2106.15928", 
    input_type="url"
)
```

### 3. 评估技术背景
```python
# 获取评估问题
assess_user_background()

# 提供答案
assess_user_background(responses={
    "preferred_framework": "PyTorch",
    "experience_level": "中级",
    "xai_experience": ["SHAP", "GradCAM"],
    "hardware": "RTX 4090 32GB",
    "interests": ["注意力可视化", "特征重要性"]
})
```

### 4. 生成复现计划并执行
```python
# 生成计划
generate_reproduction_plan()

# 开始第一个里程碑
start_milestone(milestone_id="M1")

# 确认步骤完成
confirm_step(
    step_description="创建虚拟环境", 
    status="completed",
    notes="使用conda创建Python 3.9环境"
)
```

### 5. 生成学习材料
```python
# 生成学习材料
generate_study_materials(
    topic="Attention Visualization",
    format="both"  # 生成总结和问答
)
```

## 🏗️ 工作流程

### 阶段1: 项目初始化
- [x] 创建项目目录结构
- [x] 初始化Git仓库
- [x] 设置基础配置

### 阶段2: 论文分析
- [x] 多源论文搜索 (arXiv, 必应学术)
- [x] PDF内容提取和分析
- [x] 技术栈和难度识别

### 阶段3: 用户画像
- [x] 交互式背景评估
- [x] 技能水平测评
- [x] 个性化建议生成

### 阶段4: 计划制定
- [x] 基于论文和用户背景生成计划
- [x] 里程碑和任务分解
- [x] 时间估算和资源规划

### 阶段5: 执行指导
- [x] 逐步交互式指导
- [x] 实时问题解答
- [x] 自动版本控制

### 阶段6: 学习强化
- [x] 自动生成学习笔记
- [x] 问答材料创建
- [x] 知识点强化

## 📁 生成的项目结构

```
your_project/
├── src/                    # 源代码目录
│   ├── models/            # 模型实现
│   ├── data/              # 数据处理
│   ├── experiments/       # 实验脚本
│   └── utils/             # 工具函数
├── data/                   # 数据文件
│   ├── raw/               # 原始数据
│   └── processed/         # 处理后数据
├── notes/                  # 学习笔记
│   ├── reproduction_plan.md
│   ├── concept_summaries/
│   └── qa_materials/
├── results/                # 实验结果
│   ├── figures/           # 图表
│   └── logs/              # 日志
├── requirements.txt        # 依赖列表
├── setup_env.sh           # 环境配置脚本
├── reproduction_state.json # 项目状态
└── .gitignore             # Git忽略文件
```

## 🎯 可解释性领域专项支持

本工具针对以下XAI子领域提供专门支持:

- **注意力可视化**: Attention maps, head view, 层级分析
- **特征重要性**: SHAP, LIME, 积分梯度
- **对抗样本**: FGSM, PGD, 对抗训练
- **因果推理**: 因果图, do-calculus, 反事实推理

## 🔍 示例工作流

以复现 "Attention Is All You Need" 为例:

1. **初始化**: `initialize_project("transformer_reproduction", "./projects")`
2. **论文分析**: `analyze_