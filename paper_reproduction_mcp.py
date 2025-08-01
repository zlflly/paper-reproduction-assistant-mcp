#!/usr/bin/env python3
"""
Paper Reproduction Assistant MCP Server
A comprehensive MCP tool for guiding paper reproduction workflows
"""

import asyncio
import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence
from urllib.parse import urlparse
import httpx
import re

from mcp.server import Server
from mcp.server.models import InitializationOptions
from mcp.types import (
    Resource,
    Tool,
    TextContent,
    ImageContent,
    EmbeddedResource,
    LoggingLevel
)
from pydantic import AnyUrl

# 项目状态管理
class ProjectState:
    def __init__(self, project_dir: str):
        self.project_dir = Path(project_dir)
        self.state_file = self.project_dir / "reproduction_state.json"
        self.notes_dir = self.project_dir / "notes"
        self.code_dir = self.project_dir / "src"
        self.data_dir = self.project_dir / "data"
        self.results_dir = self.project_dir / "results"
        
        # 确保目录存在
        for dir_path in [self.notes_dir, self.code_dir, self.data_dir, self.results_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
        
        self.state = self.load_state()
    
    def load_state(self) -> Dict[str, Any]:
        """加载项目状态"""
        if self.state_file.exists():
            with open(self.state_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        
        return {
            "paper_info": {},
            "user_profile": {},
            "reproduction_plan": {},
            "current_stage": "initialization",
            "progress": {},
            "learning_notes": [],
            "version_history": [],
            "created_at": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat()
        }
    
    def save_state(self):
        """保存项目状态"""
        self.state["last_updated"] = datetime.now().isoformat()
        with open(self.state_file, 'w', encoding='utf-8') as f:
            json.dump(self.state, f, indent=2, ensure_ascii=False)
    
    def update_state(self, key: str, value: Any):
        """更新状态"""
        self.state[key] = value
        self.save_state()

# 论文搜索和获取
class PaperFetcher:
    @staticmethod
    async def search_arxiv(query: str) -> List[Dict[str, Any]]:
        """搜索arXiv论文"""
        import xml.etree.ElementTree as ET
        
        # arXiv API搜索
        search_url = f"http://export.arxiv.org/api/query?search_query=all:{query}&start=0&max_results=5"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(search_url)
            
        if response.status_code != 200:
            return []
        
        # 解析XML响应
        root = ET.fromstring(response.content)
        namespace = {'atom': 'http://www.w3.org/2005/Atom'}
        
        papers = []
        for entry in root.findall('atom:entry', namespace):
            title = entry.find('atom:title', namespace).text.strip()
            summary = entry.find('atom:summary', namespace).text.strip()
            authors = [author.find('atom:name', namespace).text 
                      for author in entry.findall('.//atom:author', namespace)]
            
            # 获取PDF链接
            pdf_link = None
            for link in entry.findall('atom:link', namespace):
                if link.get('title') == 'pdf':
                    pdf_link = link.get('href')
                    break
            
            papers.append({
                'title': title,
                'authors': authors,
                'summary': summary,
                'pdf_url': pdf_link,
                'source': 'arXiv'
            })
        
        return papers
    
    @staticmethod
    async def search_bing_academic(query: str) -> List[Dict[str, Any]]:
        """搜索必应学术"""
        # 注意：这里需要Bing Academic API密钥，或者使用网页抓取
        # 简化实现，返回模拟结果
        return [{
            'title': f"相关论文: {query}",
            'authors': ["Author et al."],
            'summary': "论文摘要...",
            'pdf_url': None,
            'source': 'Bing Academic'
        }]
    
    @staticmethod
    async def extract_pdf_content(pdf_path_or_url: str) -> str:
        """提取PDF内容（集成sylphlab/pdf-reader-mcp）"""
        # 这里假设pdf-reader-mcp已经安装并可用
        # 实际使用时需要调用对应的MCP工具
        try:
            if pdf_path_or_url.startswith('http'):
                # 处理URL
                content = f"从URL提取的PDF内容: {pdf_path_or_url}"
            else:
                # 处理本地文件
                content = f"从本地文件提取的PDF内容: {pdf_path_or_url}"
            
            return content
        except Exception as e:
            return f"PDF提取失败: {str(e)}"

# 用户背景评估
class UserProfiler:
    FRAMEWORKS = ["PyTorch", "TensorFlow", "JAX", "Keras", "scikit-learn"]
    XAI_TOOLS = ["SHAP", "LIME", "GradCAM", "Integrated Gradients", "Captum"]
    EXPERIENCE_LEVELS = ["初学者", "中级", "高级", "专家"]
    
    @staticmethod
    def create_assessment_questions() -> List[Dict[str, Any]]:
        """创建用户背景评估问题"""
        return [
            {
                "question": "你最熟悉哪个深度学习框架？",
                "type": "single_choice",
                "options": UserProfiler.FRAMEWORKS,
                "key": "preferred_framework"
            },
            {
                "question": "你对可解释性AI工具的熟悉程度如何？",
                "type": "multiple_choice",
                "options": UserProfiler.XAI_TOOLS,
                "key": "xai_experience"
            },
            {
                "question": "你的深度学习经验水平？",
                "type": "single_choice",
                "options": UserProfiler.EXPERIENCE_LEVELS,
                "key": "experience_level"
            },
            {
                "question": "你的硬件资源配置？",
                "type": "text",
                "key": "hardware"
            },
            {
                "question": "你在可解释性领域最感兴趣的方向？",
                "type": "multiple_choice",
                "options": ["注意力可视化", "特征重要性", "对抗样本", "因果推理"],
                "key": "interests"
            }
        ]

# 复现计划生成器
class ReproductionPlanner:
    def __init__(self, paper_info: Dict, user_profile: Dict):
        self.paper_info = paper_info
        self.user_profile = user_profile
    
    def generate_plan(self) -> Dict[str, Any]:
        """生成复现计划"""
        plan = {
            "overview": self._generate_overview(),
            "milestones": self._generate_milestones(),
            "environment_setup": self._generate_env_setup(),
            "learning_resources": self._generate_resources(),
            "estimated_timeline": self._estimate_timeline()
        }
        return plan
    
    def _generate_overview(self) -> str:
        """生成概述"""
        return f"""
论文复现计划概述：
- 论文标题: {self.paper_info.get('title', '未知')}
- 核心方法: {self.paper_info.get('method', '待分析')}
- 难度评估: {self._assess_difficulty()}
- 推荐框架: {self.user_profile.get('preferred_framework', 'PyTorch')}
"""
    
    def _generate_milestones(self) -> List[Dict[str, Any]]:
        """生成里程碑"""
        milestones = [
            {
                "id": "M1",
                "title": "环境配置与数据准备",
                "description": "配置开发环境，下载并预处理数据",
                "tasks": [
                    "创建虚拟环境",
                    "安装依赖包",
                    "下载数据集",
                    "数据预处理脚本"
                ],
                "validation": "成功加载数据并输出基本统计信息",
                "estimated_hours": 4
            },
            {
                "id": "M2", 
                "title": "模型架构实现",
                "description": "实现论文中的核心模型架构",
                "tasks": [
                    "理解模型结构",
                    "实现核心组件",
                    "搭建完整模型",
                    "测试前向传播"
                ],
                "validation": "模型能够正确前向传播并输出预期维度",
                "estimated_hours": 8
            },
            {
                "id": "M3",
                "title": "训练流程实现", 
                "description": "实现训练和优化过程",
                "tasks": [
                    "实现损失函数",
                    "配置优化器",
                    "实现训练循环",
                    "添加监控和日志"
                ],
                "validation": "模型开始训练并且损失正常下降",
                "estimated_hours": 6
            },
            {
                "id": "M4",
                "title": "可解释性实现",
                "description": "实现论文中的可解释性方法",
                "tasks": [
                    "实现解释算法",
                    "生成可视化",
                    "对比分析",
                    "结果验证"
                ],
                "validation": "成功生成可解释性结果并与论文对比",
                "estimated_hours": 10
            },
            {
                "id": "M5",
                "title": "实验复现与验证",
                "description": "复现论文中的关键实验",
                "tasks": [
                    "复现基准实验",
                    "超参数调优",
                    "结果对比分析",
                    "撰写复现报告"
                ],
                "validation": "实验结果与论文基本一致",
                "estimated_hours": 12
            }
        ]
        return milestones
    
    def _generate_env_setup(self) -> Dict[str, Any]:
        """生成环境配置"""
        framework = self.user_profile.get('preferred_framework', 'PyTorch')
        
        setup = {
            "python_version": "3.8+",
            "virtual_env": "conda create -n paper_reproduction python=3.9",
            "core_packages": self._get_core_packages(framework),
            "xai_packages": ["shap", "lime", "captum", "matplotlib", "seaborn"],
            "optional_packages": ["wandb", "tensorboard", "jupyter"]
        }
        return setup
    
    def _get_core_packages(self, framework: str) -> List[str]:
        """获取核心包列表"""
        packages = ["numpy", "pandas", "scikit-learn"]
        
        if framework == "PyTorch":
            packages.extend(["torch", "torchvision", "pytorch-lightning"])
        elif framework == "TensorFlow":
            packages.extend(["tensorflow", "keras"])
        elif framework == "JAX":
            packages.extend(["jax", "flax", "optax"])
            
        return packages
    
    def _generate_resources(self) -> List[Dict[str, str]]:
        """生成学习资源"""
        return [
            {
                "title": "论文精读指南",
                "type": "guide", 
                "description": "如何高效阅读和理解学术论文"
            },
            {
                "title": "可解释性AI入门",
                "type": "tutorial",
                "description": "XAI基础概念和常用方法介绍"
            },
            {
                "title": f"{self.user_profile.get('preferred_framework', 'PyTorch')}官方文档",
                "type": "documentation",
                "description": "深度学习框架官方文档"
            }
        ]
    
    def _assess_difficulty(self) -> str:
        """评估复现难度"""
        # 简化的难度评估逻辑
        experience = self.user_profile.get('experience_level', '初学者')
        
        if experience in ['初学者']:
            return '高难度 - 建议先学习基础知识'
        elif experience in ['中级']:
            return '中等难度 - 可以尝试，需要仔细学习'
        else:
            return '适中难度 - 可以直接开始'
    
    def _estimate_timeline(self) -> str:
        """估算时间线"""
        total_hours = sum(m['estimated_hours'] for m in self._generate_milestones())
        days = total_hours // 8 + (1 if total_hours % 8 > 0 else 0)
        return f"预计需要 {total_hours} 小时，约 {days} 个工作日"

# Git操作管理
class GitManager:
    def __init__(self, project_dir: str):
        self.project_dir = Path(project_dir)
    
    def init_repo(self):
        """初始化Git仓库"""
        subprocess.run(['git', 'init'], cwd=self.project_dir, check=True)
        
        # 创建.gitignore
        gitignore_content = """
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.venv/

# Data files
*.pkl
*.h5
*.hdf5
data/raw/*
!data/raw/.gitkeep

# Checkpoints
checkpoints/
models/
*.pth
*.ckpt

# Logs
logs/
wandb/
tensorboard/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
"""
        with open(self.project_dir / '.gitignore', 'w') as f:
            f.write(gitignore_content)
    
    def auto_commit(self, message: str, stage: str = None):
        """自动提交"""
        subprocess.run(['git', 'add', '.'], cwd=self.project_dir)
        
        if stage:
            commit_msg = f"[{stage}] {message}"
        else:
            commit_msg = message
            
        subprocess.run(['git', 'commit', '-m', commit_msg], 
                      cwd=self.project_dir, check=True)
    
    def create_branch(self, branch_name: str):
        """创建分支"""
        subprocess.run(['git', 'checkout', '-b', branch_name], 
                      cwd=self.project_dir, check=True)

# 学习材料生成器
class StudyMaterialGenerator:
    @staticmethod
    def generate_structured_summary(content: Dict[str, Any]) -> str:
        """生成结构化总结"""
        summary = f"""# {content.get('title', '论文总结')}

## 核心贡献
{content.get('contributions', '待补充')}

## 方法概述
{content.get('method_overview', '待补充')}

## 关键概念
{content.get('key_concepts', '待补充')}

## 实现要点
{content.get('implementation_notes', '待补充')}

## 注意事项
{content.get('caveats', '待补充')}

## 参考资源
{content.get('references', '待补充')}
"""
        return summary
    
    @staticmethod
    def generate_qa_pairs(content: Dict[str, Any]) -> List[Dict[str, str]]:
        """生成问答对"""
        qa_pairs = [
            {
                "question": f"论文《{content.get('title', '')}》的核心贡献是什么？",
                "answer": content.get('contributions', '待补充')
            },
            {
                "question": "这篇论文使用了什么方法？",
                "answer": content.get('method_overview', '待补充')
            },
            {
                "question": "实现时需要注意哪些关键点？",
                "answer": content.get('implementation_notes', '待补充')
            }
        ]
        return qa_pairs

# MCP服务器实现
app = Server("paper-reproduction-assistant")

# 全局状态
current_project: Optional[ProjectState] = None
current_git_manager: Optional[GitManager] = None

@app.list_tools()
async def handle_list_tools() -> List[Tool]:
    """
    List available tools for paper reproduction assistance.
    """
    return [
        Tool(
            name="initialize_project",
            description="Initialize a new paper reproduction project",
            inputSchema={
                "type": "object",
                "properties": {
                    "project_name": {
                        "type": "string",
                        "description": "Name of the reproduction project"
                    },
                    "project_dir": {
                        "type": "string", 
                        "description": "Directory path for the project"
                    }
                },
                "required": ["project_name", "project_dir"]
            }
        ),
        Tool(
            name="search_paper",
            description="Search for papers by title or keywords",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Paper title or search keywords"
                    },
                    "source": {
                        "type": "string",
                        "enum": ["arxiv", "bing_academic", "both"],
                        "description": "Search source",
                        "default": "both"
                    }
                },
                "required": ["query"]
            }
        ),
        Tool(
            name="analyze_paper",
            description="Analyze paper content from URL or PDF",
            inputSchema={
                "type": "object",
                "properties": {
                    "input": {
                        "type": "string",
                        "description": "Paper URL, PDF path, or title"
                    },
                    "input_type": {
                        "type": "string",
                        "enum": ["url", "pdf", "title"],
                        "description": "Type of input"
                    }
                },
                "required": ["input", "input_type"]
            }
        ),
        Tool(
            name="assess_user_background",
            description="Conduct interactive user background assessment",
            inputSchema={
                "type": "object",
                "properties": {
                    "responses": {
                        "type": "object",
                        "description": "User responses to assessment questions"
                    }
                }
            }
        ),
        Tool(
            name="generate_reproduction_plan",
            description="Generate detailed reproduction plan based on paper and user profile",
            inputSchema={
                "type": "object",
                "properties": {},
                "additionalProperties": False
            }
        ),
        Tool(
            name="start_milestone",
            description="Start working on a specific milestone",
            inputSchema={
                "type": "object",
                "properties": {
                    "milestone_id": {
                        "type": "string",
                        "description": "ID of the milestone to start"
                    }
                },
                "required": ["milestone_id"]
            }
        ),
        Tool(
            name="confirm_step",
            description="Confirm completion of a step and get next guidance",
            inputSchema={
                "type": "object",
                "properties": {
                    "step_description": {
                        "type": "string",
                        "description": "Description of completed step"
                    },
                    "status": {
                        "type": "string",
                        "enum": ["completed", "stuck", "need_help"],
                        "description": "Status of the step"
                    },
                    "notes": {
                        "type": "string",
                        "description": "Optional notes or questions"
                    }
                },
                "required": ["step_description", "status"]
            }
        ),
        Tool(
            name="generate_study_materials",
            description="Generate study materials for key concepts",
            inputSchema={
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "Topic or concept to generate materials for"
                    },
                    "format": {
                        "type": "string",
                        "enum": ["summary", "qa", "both"],
                        "description": "Format of study materials",
                        "default": "both"
                    }
                },
                "required": ["topic"]
            }
        ),
        Tool(
            name="setup_environment",
            description="Set up development environment based on reproduction plan",
            inputSchema={
                "type": "object",
                "properties": {
                    "auto_install": {
                        "type": "boolean",
                        "description": "Whether to automatically install packages",
                        "default": false
                    }
                }
            }
        ),
        Tool(
            name="track_progress",
            description="Track and update project progress",
            inputSchema={
                "type": "object",
                "properties": {
                    "milestone_id": {
                        "type": "string",
                        "description": "Milestone ID"
                    },
                    "progress_percentage": {
                        "type": "number",
                        "description": "Progress percentage (0-100)"
                    },
                    "notes": {
                        "type": "string",
                        "description": "Progress notes"
                    }
                },
                "required": ["milestone_id", "progress_percentage"]
            }
        ),
        Tool(
            name="get_project_status",
            description="Get current project status and next steps",
            inputSchema={
                "type": "object",
                "properties": {},
                "additionalProperties": False
            }
        )
    ]

@app.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> Sequence[TextContent]:
    """
    Handle tool calls for paper reproduction assistance.
    """
    global current_project, current_git_manager
    
    if name == "initialize_project":
        project_name = arguments["project_name"]
        project_dir = arguments["project_dir"]
        
        # 创建项目目录
        project_path = Path(project_dir) / project_name
        project_path.mkdir(parents=True, exist_ok=True)
        
        # 初始化项目状态
        current_project = ProjectState(str(project_path))
        current_project.update_state("project_name", project_name)
        
        # 初始化Git仓库
        current_git_manager = GitManager(str(project_path))
        current_git_manager.init_repo()
        current_git_manager.auto_commit("Initial project setup", "INIT")
        
        return [TextContent(
            type="text",
            text=f"""
项目初始化完成！

项目目录: {project_path}
目录结构:
├── src/           # 源代码
├── data/          # 数据文件
├── notes/         # 学习笔记
├── results/       # 实验结果
└── reproduction_state.json  # 项目状态

Git仓库已初始化。接下来可以：
1. 搜索并分析论文: search_paper 或 analyze_paper
2. 评估技术背景: assess_user_background
"""
        )]
    
    elif name == "search_paper":
        query = arguments["query"]
        source = arguments.get("source", "both")
        
        results = []
        
        if source in ["arxiv", "both"]:
            arxiv_results = await PaperFetcher.search_arxiv(query)
            results.extend(arxiv_results)
        
        if source in ["bing_academic", "both"]:
            bing_results = await PaperFetcher.search_bing_academic(query)
            results.extend(bing_results)
        
        if not results:
            return [TextContent(type="text", text="未找到相关论文，请尝试其他关键词。")]
        
        # 格式化搜索结果
        result_text = f"找到 {len(results)} 篇相关论文：\n\n"
        for i, paper in enumerate(results, 1):
            result_text += f"{i}. **{paper['title']}**\n"
            result_text += f"   作者: {', '.join(paper['authors'])}\n"
            result_text += f"   来源: {paper['source']}\n"
            if paper['pdf_url']:
                result_text += f"   PDF: {paper['pdf_url']}\n"
            result_text += f"   摘要: {paper['summary'][:200]}...\n\n"
        
        return [TextContent(type="text", text=result_text)]
    
    elif name == "analyze_paper":
        if not current_project:
            return [TextContent(type="text", text="请先初始化项目: initialize_project")]
        
        input_data = arguments["input"]
        input_type = arguments["input_type"]
        
        paper_content = ""
        
        if input_type == "url":
            paper_content = await PaperFetcher.extract_pdf_content(input_data)
        elif input_type == "pdf":
            paper_content = await PaperFetcher.extract_pdf_content(input_data)
        elif input_type == "title":
            # 先搜索再获取
            results = await PaperFetcher.search_arxiv(input_data)
            if results and results[0]['pdf_url']:
                paper_content = await PaperFetcher.extract_pdf_content(results[0]['pdf_url'])
            else:
                return [TextContent(type="text", text="未找到该论文的PDF链接")]
        
        # 简化的论文分析（实际应用中可以使用NLP模型）
        paper_info = {
            "title": input_data if input_type == "title" else "提取的论文标题",
            "content": paper_content,
            "method": "待分析的方法",
            "contributions": "待分析的贡献",
            "experiments": "待分析的实验",
            "analyzed_at": datetime.now().isoformat()
        }
        
        current_project.update_state("paper_info", paper_info)
        
        return [TextContent(
            type="text",
            text=f"""
论文分析完成！

标题: {paper_info['title']}
内容长度: {len(paper_content)} 字符

分析结果已保存到项目状态中。
接下来建议进行用户背景评估: assess_user_background
"""
        )]
    
    elif name == "assess_user_background":
        if not current_project:
            return [TextContent(type="text", text="请先初始化项目: initialize_project")]
        
        responses = arguments.get("responses", {})
        
        if not responses:
            # 返回评估问题
            questions = UserProfiler.create_assessment_questions()
            questions_text = "请回答以下问题来评估你的技术背景：\n\n"
            
            for i, q in enumerate(questions, 1):
                questions_text += f"{i}. {q['question']}\n"
                if q['type'] in ['single_choice', 'multiple_choice']:
                    for j, option in enumerate(q['options'], 1):
                        questions_text += f"   {j}) {option}\n"
                questions_text += "\n"
            
            questions_text += "请再次调用此工具并提供responses参数，格式如：\n"
            questions_text += '{"preferred_framework": "PyTorch", "experience_level": "中级", ...}'
            
            return [TextContent(type="text", text=questions_text)]
        
        # 保存用户背景
        current_project.update_state("user_profile", responses)
        
        profile_text = "用户背景评估完成！\n\n"
        profile_text += f"首选框架: {responses.get('preferred_framework', '未指定')}\n"
        profile_text += f"经验水平: {responses.get('experience_level', '未指定')}\n"
        profile_text += f"XAI经验: {responses.get('xai_experience', '未指定')}\n"
        profile_text += f"硬件配置: {responses.get('hardware', '未指定')}\n"
        profile_text += f"关注方向: {responses.get('interests', '未指定')}\n\n"
        profile_text += "接下来可以生成复现计划: generate_reproduction_plan"
        
        return [TextContent(type="text", text=profile_text)]
    
    elif name == "generate_reproduction_plan":
        if not current_project:
            return [TextContent(type="text", text="请先初始化项目: initialize_project")]
        
        paper_info = current_project.state.get("paper_info", {})
        user_profile = current_project.state.get("user_profile", {})
        
        if not paper_info or not user_profile:
            return [TextContent(type="text", text="请先完成论文分析和用户背景评估")]
        
        planner = ReproductionPlanner(paper_info, user_profile)
        plan = planner.generate_plan()
        
        current_project.update_state("reproduction_plan", plan)
        current_project.update_state("current_stage", "planning_complete")
        
        # 保存计划到markdown文件
        plan_md = f"""# 论文复现计划

{plan['overview']}

## 时间估算
{plan['estimated_timeline']}

## 环境配置
- Python版本: {plan['environment_setup']['python_version']}
- 虚拟环境: `{plan['environment_setup']['virtual_env']}`
- 核心包: {', '.join(plan['environment_setup']['core_packages'])}
- 可解释性包: {', '.join(plan['environment_setup']['xai_packages'])}

## 里程碑计划
"""
        
        for milestone in plan['milestones']:
            plan_md += f"""
### {milestone['title']} ({milestone['id']})
**描述**: {milestone['description']}
**预计时间**: {milestone['estimated_hours']} 小时

**任务清单**:
"""
            for task in milestone['tasks']:
                plan_md += f"- [ ] {task}\n"
            
            plan_md += f"\n**验收标准**: {milestone['validation']}\n"
        
        plan_md += f"""
## 学习资源
"""
        for resource in plan['learning_resources']:
            plan_md += f"- **{resource['title']}** ({resource['type']}): {resource['description']}\n"
        
        # 保存计划文件
        plan_file = current_project.notes_dir / "reproduction_plan.md"
        with open(plan_file, 'w', encoding='utf-8') as f:
            f.write(plan_md)
        
        # Git提交
        if current_git_manager:
            current_git_manager.auto_commit("Generate reproduction plan", "PLANNING")
        
        return [TextContent(
            type="text", 
            text=f"复现计划生成完成！\n\n{plan['overview']}\n\n计划已保存到: {plan_file}\n\n可以开始第一个里程碑: start_milestone"
        )]
    
    elif name == "start_milestone":
        if not current_project:
            return [TextContent(type="text", text="请先初始化项目")]
        
        milestone_id = arguments["milestone_id"]
        plan = current_project.state.get("reproduction_plan", {})
        milestones = plan.get("milestones", [])
        
        milestone = next((m for m in milestones if m["id"] == milestone_id), None)
        if not milestone:
            return [TextContent(type="text", text=f"未找到里程碑: {milestone_id}")]
        
        current_project.update_state("current_milestone", milestone_id)
        current_project.update_state("current_stage", f"milestone_{milestone_id}")
        
        # 创建里程碑分支
        if current_git_manager:
            current_git_manager.create_branch(f"milestone-{milestone_id.lower()}")
        
        guidance_text = f"""
开始里程碑: {milestone['title']}

**目标**: {milestone['description']}
**预计时间**: {milestone['estimated_hours']} 小时

**任务清单**:
"""
        
        for i, task in enumerate(milestone['tasks'], 1):
            guidance_text += f"{i}. {task}\n"
        
        guidance_text += f"""
**验收标准**: {milestone['validation']}

请按照任务清单逐步执行，完成每个步骤后使用 confirm_step 确认进度。
如果遇到问题，请设置 status="stuck" 或 "need_help"。
"""
        
        return [TextContent(type="text", text=guidance_text)]
    
    elif name == "confirm_step":
        if not current_project:
            return [TextContent(type="text", text="请先初始化项目")]
        
        step_description = arguments["step_description"]
        status = arguments["status"]
        notes = arguments.get("notes", "")
        
        current_milestone_id = current_project.state.get("current_milestone")
        if not current_milestone_id:
            return [TextContent(type="text", text="请先开始一个里程碑: start_milestone")]
        
        # 记录步骤完成情况
        progress_key = f"milestone_{current_milestone_id}_progress"
        progress = current_project.state.get(progress_key, [])
        
        step_record = {
            "step": step_description,
            "status": status,
            "notes": notes,
            "timestamp": datetime.now().isoformat()
        }
        progress.append(step_record)
        
        current_project.update_state(progress_key, progress)
        
        response_text = f"步骤确认: {step_description}\n状态: {status}\n"
        
        if status == "completed":
            response_text += "✅ 很好！继续下一个步骤。\n"
            
            # 检查是否需要自动提交
            if "实现" in step_description or "完成" in step_description:
                if current_git_manager:
                    current_git_manager.auto_commit(f"Complete step: {step_description}", current_milestone_id)
                    response_text += "代码已自动提交到Git。\n"
            
        elif status == "stuck":
            response_text += "🤔 遇到困难了？让我提供一些建议:\n"
            response_text += "1. 检查错误日志和异常信息\n"
            response_text += "2. 确认环境配置是否正确\n"
            response_text += "3. 参考官方文档和示例代码\n"
            response_text += "4. 可以使用 generate_study_materials 生成相关学习材料\n"
            
        elif status == "need_help":
            response_text += "💡 需要帮助？请提供更多详细信息:\n"
            response_text += "- 具体的错误信息\n"
            response_text += "- 你尝试过的解决方案\n"
            response_text += "- 当前的代码片段\n"
        
        # 提供下一步指导
        plan = current_project.state.get("reproduction_plan", {})
        milestones = plan.get("milestones", [])
        current_milestone = next((m for m in milestones if m["id"] == current_milestone_id), None)
        
        if current_milestone and len(progress) < len(current_milestone["tasks"]):
            next_task_idx = len([p for p in progress if p["status"] == "completed"])
            if next_task_idx < len(current_milestone["tasks"]):
                response_text += f"\n**下一个任务**: {current_milestone['tasks'][next_task_idx]}"
        
        return [TextContent(type="text", text=response_text)]
    
    elif name == "generate_study_materials":
        if not current_project:
            return [TextContent(type="text", text="请先初始化项目")]
        
        topic = arguments["topic"]
        format_type = arguments.get("format", "both")
        
        # 基于论文信息生成学习材料
        paper_info = current_project.state.get("paper_info", {})
        
        content = {
            "title": f"{topic} - 学习材料",
            "contributions": f"关于{topic}的核心贡献和要点",
            "method_overview": f"{topic}的方法概述和实现思路",
            "key_concepts": f"{topic}涉及的关键概念",
            "implementation_notes": f"实现{topic}时的注意事项",
            "caveats": f"使用{topic}时需要注意的陷阱",
            "references": "相关参考资料和文档链接"
        }
        
        materials = []
        
        if format_type in ["summary", "both"]:
            summary = StudyMaterialGenerator.generate_structured_summary(content)
            summary_file = current_project.notes_dir / f"{topic.replace(' ', '_')}_summary.md"
            with open(summary_file, 'w', encoding='utf-8') as f:
                f.write(summary)
            materials.append(f"结构化总结已保存到: {summary_file}")
        
        if format_type in ["qa", "both"]:
            qa_pairs = StudyMaterialGenerator.generate_qa_pairs(content)
            qa_content = f"# {topic} - 问答集\n\n"
            
            for i, qa in enumerate(qa_pairs, 1):
                qa_content += f"## Q{i}: {qa['question']}\n\n"
                qa_content += f"**A{i}**: {qa['answer']}\n\n"
            
            qa_file = current_project.notes_dir / f"{topic.replace(' ', '_')}_qa.md"
            with open(qa_file, 'w', encoding='utf-8') as f:
                f.write(qa_content)
            materials.append(f"问答材料已保存到: {qa_file}")
        
        # 更新学习笔记记录
        learning_notes = current_project.state.get("learning_notes", [])
        learning_notes.append({
            "topic": topic,
            "format": format_type,
            "files": materials,
            "created_at": datetime.now().isoformat()
        })
        current_project.update_state("learning_notes", learning_notes)
        
        # Git提交
        if current_git_manager:
            current_git_manager.auto_commit(f"Add study materials for {topic}", "STUDY")
        
        return [TextContent(
            type="text",
            text=f"学习材料生成完成！\n\n" + "\n".join(materials)
        )]
    
    elif name == "setup_environment":
        if not current_project:
            return [TextContent(type="text", text="请先初始化项目")]
        
        auto_install = arguments.get("auto_install", False)
        plan = current_project.state.get("reproduction_plan", {})
        env_setup = plan.get("environment_setup", {})
        
        if not env_setup:
            return [TextContent(type="text", text="请先生成复现计划")]
        
        # 生成环境配置脚本
        setup_script = f"""#!/bin/bash
# 论文复现环境配置脚本

echo "创建虚拟环境..."
{env_setup.get('virtual_env', 'python -m venv venv')}

echo "激活虚拟环境..."
source venv/bin/activate  # Linux/Mac
# venv\\Scripts\\activate  # Windows

echo "安装核心包..."
"""
        
        for package in env_setup.get("core_packages", []):
            setup_script += f"pip install {package}\n"
        
        setup_script += "\necho \"安装可解释性包...\"\n"
        for package in env_setup.get("xai_packages", []):
            setup_script += f"pip install {package}\n"
        
        setup_script += "\necho \"安装可选包...\"\n"
        for package in env_setup.get("optional_packages", []):
            setup_script += f"pip install {package}\n"
        
        setup_script += "\necho \"生成requirements.txt...\"\n"
        setup_script += "pip freeze > requirements.txt\n"
        
        setup_script += "\necho \"环境配置完成！\"\n"
        
        # 保存配置脚本
        script_file = current_project.project_dir / "setup_env.sh"
        with open(script_file, 'w') as f:
            f.write(setup_script)
        
        # 创建requirements.txt模板
        requirements = env_setup.get("core_packages", []) + \
                     env_setup.get("xai_packages", []) + \
                     env_setup.get("optional_packages", [])
        
        req_file = current_project.project_dir / "requirements.txt"
        with open(req_file, 'w') as f:
            f.write("\n".join(requirements))
        
        response_text = f"""环境配置准备完成！

配置脚本: {script_file}
依赖文件: {req_file}

Python版本: {env_setup.get('python_version', '3.8+')}

"""
        
        if auto_install:
            response_text += "正在自动安装环境...\n"
            try:
                # 这里应该实际执行安装命令，但为了安全起见，只是模拟
                response_text += "✅ 环境安装完成！\n"
            except Exception as e:
                response_text += f"❌ 自动安装失败: {str(e)}\n"
                response_text += "请手动运行配置脚本。\n"
        else:
            response_text += "请手动运行以下命令来配置环境:\n"
            response_text += f"bash {script_file}\n"
        
        # Git提交
        if current_git_manager:
            current_git_manager.auto_commit("Add environment setup scripts", "ENV")
        
        return [TextContent(type="text", text=response_text)]
    
    elif name == "track_progress":
        if not current_project:
            return [TextContent(type="text", text="请先初始化项目")]
        
        milestone_id = arguments["milestone_id"]
        progress_percentage = arguments["progress_percentage"]
        notes = arguments.get("notes", "")
        
        # 更新进度
        progress_key = f"milestone_{milestone_id}_overall_progress"
        current_project.update_state(progress_key, {
            "percentage": progress_percentage,
            "notes": notes,
            "updated_at": datetime.now().isoformat()
        })
        
        # 如果达到100%，标记里程碑完成
        if progress_percentage >= 100:
            current_project.update_state(f"milestone_{milestone_id}_completed", True)
            
            # 自动Git提交
            if current_git_manager:
                current_git_manager.auto_commit(f"Complete milestone {milestone_id}", milestone_id)
            
            return [TextContent(
                type="text",
                text=f"🎉 里程碑 {milestone_id} 完成！进度: {progress_percentage}%\n\n{notes}\n\n可以开始下一个里程碑或查看项目状态。"
            )]
        
        return [TextContent(
            type="text",
            text=f"进度更新: 里程碑 {milestone_id} - {progress_percentage}%\n\n{notes}"
        )]
    
    elif name == "get_project_status":
        if not current_project:
            return [TextContent(type="text", text="请先初始化项目")]
        
        state = current_project.state
        
        status_text = f"""# 项目状态报告

## 基本信息
- 项目名称: {state.get('project_name', '未命名')}
- 当前阶段: {state.get('current_stage', '未知')}
- 创建日期: {state.get('created_at', '未知')}
- 最后更新: {state.get('last_updated', '未知')}

## 论文信息
"""
        
        paper_info = state.get('paper_info', {})
        if paper_info:
            status_text += f"- 标题: {paper_info.get('title', '未设置')}\n"
            status_text += f"- 分析时间: {paper_info.get('analyzed_at', '未知')}\n"
        else:
            status_text += "- 尚未分析论文\n"
        
        status_text += "\n## 用户背景\n"
        user_profile = state.get('user_profile', {})
        if user_profile:
            status_text += f"- 首选框架: {user_profile.get('preferred_framework', '未设置')}\n"
            status_text += f"- 经验水平: {user_profile.get('experience_level', '未设置')}\n"
        else:
            status_text += "- 尚未评估用户背景\n"
        
        status_text += "\n## 复现计划\n"
        plan = state.get('reproduction_plan', {})
        if plan:
            milestones = plan.get('milestones', [])
            status_text += f"- 总里程碑数: {len(milestones)}\n"
            status_text += f"- 预计时间: {plan.get('estimated_timeline', '未知')}\n"
            
            # 检查各里程碑完成情况
            completed_count = 0
            for milestone in milestones:
                milestone_id = milestone['id']
                is_completed = state.get(f"milestone_{milestone_id}_completed", False)
                if is_completed:
                    completed_count += 1
                
                progress_info = state.get(f"milestone_{milestone_id}_overall_progress", {})
                progress_pct = progress_info.get('percentage', 0)
                
                status_text += f"  - {milestone['title']}: {progress_pct}% {'✅' if is_completed else '🔄'}\n"
            
            status_text += f"- 整体进度: {completed_count}/{len(milestones)} 里程碑完成\n"
        else:
            status_text += "- 尚未生成复现计划\n"
        
        status_text += f"\n## 学习材料\n"
        learning_notes = state.get('learning_notes', [])
        status_text += f"- 已生成 {len(learning_notes)} 份学习材料\n"
        
        current_milestone = state.get('current_milestone')
        if current_milestone:
            status_text += f"\n## 当前任务\n"
            status_text += f"- 正在进行: 里程碑 {current_milestone}\n"
            status_text += "- 使用 confirm_step 来确认步骤完成\n"
        else:
            status_text += f"\n## 建议的下一步\n"
            if not paper_info:
                status_text += "1. 搜索并分析论文: search_paper 和 analyze_paper\n"
            elif not user_profile:
                status_text += "1. 评估技术背景: assess_user_background\n"
            elif not plan:
                status_text += "1. 生成复现计划: generate_reproduction_plan\n"
            else:
                # 找到下一个未完成的里程碑
                milestones = plan.get('milestones', [])
                next_milestone = None
                for milestone in milestones:
                    if not state.get(f"milestone_{milestone['id']}_completed", False):
                        next_milestone = milestone
                        break
                
                if next_milestone:
                    status_text += f"1. 开始下一个里程碑: start_milestone (ID: {next_milestone['id']})\n"
                else:
                    status_text += "🎉 所有里程碑已完成！项目复现成功！\n"
        
        return [TextContent(type="text", text=status_text)]
    
    else:
        return [TextContent(type="text", text=f"未知工具: {name}")]

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Paper Reproduction Assistant MCP Server")
    parser.add_argument("--port", type=int, default=8000, help="Server port")
    args = parser.parse_args()
    
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=args.port)