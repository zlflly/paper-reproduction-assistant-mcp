#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const project_state_js_1 = require("./project-state.js");
const paper_fetcher_js_1 = require("./paper-fetcher.js");
const user_profiler_js_1 = require("./user-profiler.js");
const reproduction_planner_js_1 = require("./reproduction-planner.js");
const git_manager_js_1 = require("./git-manager.js");
// 全局状态
let currentProject = null;
let currentGitManager = null;
const server = new index_js_1.Server({
    name: 'paper-reproduction-assistant',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'initialize_project',
                description: 'Initialize a new paper reproduction project',
                inputSchema: {
                    type: 'object',
                    properties: {
                        project_name: {
                            type: 'string',
                            description: 'Name of the reproduction project',
                        },
                        project_dir: {
                            type: 'string',
                            description: 'Directory path for the project',
                        },
                    },
                    required: ['project_name', 'project_dir'],
                },
            },
            {
                name: 'search_paper',
                description: 'Search for papers by title or keywords',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'Paper title or search keywords',
                        },
                        source: {
                            type: 'string',
                            enum: ['arxiv', 'bing_academic', 'both'],
                            description: 'Search source',
                            default: 'both',
                        },
                    },
                    required: ['query'],
                },
            },
            {
                name: 'analyze_paper',
                description: 'Analyze paper content from URL or PDF',
                inputSchema: {
                    type: 'object',
                    properties: {
                        input: {
                            type: 'string',
                            description: 'Paper URL, PDF path, or title',
                        },
                        input_type: {
                            type: 'string',
                            enum: ['url', 'pdf', 'title'],
                            description: 'Type of input',
                        },
                    },
                    required: ['input', 'input_type'],
                },
            },
            {
                name: 'assess_user_background',
                description: 'Conduct interactive user background assessment',
                inputSchema: {
                    type: 'object',
                    properties: {
                        responses: {
                            type: 'object',
                            description: 'User responses to assessment questions',
                        },
                    },
                },
            },
            {
                name: 'generate_reproduction_plan',
                description: 'Generate detailed reproduction plan based on paper and user profile',
                inputSchema: {
                    type: 'object',
                    properties: {},
                    additionalProperties: false,
                },
            },
            {
                name: 'start_milestone',
                description: 'Start working on a specific milestone',
                inputSchema: {
                    type: 'object',
                    properties: {
                        milestone_id: {
                            type: 'string',
                            description: 'ID of the milestone to start',
                        },
                    },
                    required: ['milestone_id'],
                },
            },
            {
                name: 'confirm_step',
                description: 'Confirm completion of a step within a milestone',
                inputSchema: {
                    type: 'object',
                    properties: {
                        step_id: {
                            type: 'string',
                            description: 'ID of the step to confirm',
                        },
                        notes: {
                            type: 'string',
                            description: 'Optional notes about the step completion',
                        },
                    },
                    required: ['step_id'],
                },
            },
            {
                name: 'get_project_status',
                description: 'Get current project status and progress',
                inputSchema: {
                    type: 'object',
                    properties: {},
                    additionalProperties: false,
                },
            },
        ],
    };
});
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    switch (name) {
        case 'initialize_project': {
            const { project_name, project_dir } = args;
            currentProject = new project_state_js_1.ProjectState(project_dir);
            currentProject.updateState('project_name', project_name);
            currentProject.updateState('current_stage', 'initialization');
            currentGitManager = new git_manager_js_1.GitManager(project_dir);
            currentGitManager.initRepo();
            return {
                content: [
                    {
                        type: 'text',
                        text: `✅ 项目 "${project_name}" 已成功初始化！

📁 项目目录: ${project_dir}
🔧 已创建必要的目录结构
📝 已初始化Git仓库

下一步建议:
1. 使用 search_paper 搜索论文
2. 使用 analyze_paper 分析论文内容
3. 使用 assess_user_background 评估技术背景`,
                    },
                ],
            };
        }
        case 'search_paper': {
            const { query, source = 'both' } = args;
            const papers = await paper_fetcher_js_1.PaperFetcher.searchPapers(query, source);
            if (papers.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `❌ 未找到与 "${query}" 相关的论文。

建议:
- 尝试使用更具体的关键词
- 检查拼写是否正确
- 尝试使用英文关键词`,
                        },
                    ],
                };
            }
            let result = `📚 找到 ${papers.length} 篇相关论文:\n\n`;
            papers.forEach((paper, index) => {
                result += `${index + 1}. **${paper.title}**\n`;
                result += `   作者: ${paper.authors.join(', ')}\n`;
                result += `   摘要: ${paper.summary.substring(0, 200)}...\n`;
                result += `   链接: ${paper.url}\n\n`;
            });
            result += `💡 使用 analyze_paper 工具来分析感兴趣的论文`;
            return {
                content: [
                    {
                        type: 'text',
                        text: result,
                    },
                ],
            };
        }
        case 'analyze_paper': {
            const { input, input_type } = args;
            if (!currentProject) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: '❌ 请先初始化项目',
                        },
                    ],
                };
            }
            const analysis = await paper_fetcher_js_1.PaperFetcher.analyzePaper(input, input_type);
            currentProject.updateState('paper_info', analysis);
            currentProject.updateState('current_stage', 'paper_analyzed');
            return {
                content: [
                    {
                        type: 'text',
                        text: `📄 论文分析完成！

**标题**: ${analysis.title}
**作者**: ${analysis.authors.join(', ')}
**摘要**: ${analysis.summary}
**关键词**: ${analysis.keywords.join(', ')}
**难度评估**: ${analysis.difficulty}
**预计复现时间**: ${analysis.estimated_time}

下一步建议:
1. 使用 assess_user_background 评估技术背景
2. 使用 generate_reproduction_plan 生成复现计划`,
                    },
                ],
            };
        }
        case 'assess_user_background': {
            const { responses } = args;
            if (!currentProject) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: '❌ 请先初始化项目',
                        },
                    ],
                };
            }
            const profile = user_profiler_js_1.UserProfiler.createProfile(responses);
            currentProject.updateState('user_profile', profile);
            currentProject.updateState('current_stage', 'user_assessed');
            return {
                content: [
                    {
                        type: 'text',
                        text: `👤 用户背景评估完成！

**经验水平**: ${profile.experience_level}
**首选框架**: ${profile.preferred_framework}
**熟悉的可解释AI工具**: ${profile.xai_tools.join(', ')}
**学习目标**: ${profile.learning_goals}

下一步建议:
使用 generate_reproduction_plan 生成个性化的复现计划`,
                    },
                ],
            };
        }
        case 'generate_reproduction_plan': {
            if (!currentProject) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: '❌ 请先初始化项目',
                        },
                    ],
                };
            }
            const paperInfo = currentProject.state.paper_info;
            const userProfile = currentProject.state.user_profile;
            if (!paperInfo || !userProfile) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: '❌ 请先分析论文和评估用户背景',
                        },
                    ],
                };
            }
            const planner = new reproduction_planner_js_1.ReproductionPlanner(paperInfo, userProfile);
            const plan = planner.generatePlan();
            currentProject.updateState('reproduction_plan', plan);
            currentProject.updateState('current_stage', 'plan_generated');
            let result = `📋 复现计划已生成！

**项目概述**: ${plan.overview}

**里程碑** (共 ${plan.milestones.length} 个):
`;
            plan.milestones.forEach((milestone, index) => {
                result += `${index + 1}. ${milestone.title} (${milestone.estimated_time})\n`;
                result += `   描述: ${milestone.description}\n`;
                result += `   步骤数: ${milestone.steps.length}\n\n`;
            });
            result += `**环境配置**:
- Python版本: ${plan.env_setup.python_version}
- 核心依赖: ${plan.env_setup.core_packages.join(', ')}

**预计总时间**: ${plan.estimated_timeline}

下一步建议:
使用 start_milestone 开始第一个里程碑`;
            return {
                content: [
                    {
                        type: 'text',
                        text: result,
                    },
                ],
            };
        }
        case 'start_milestone': {
            const { milestone_id } = args;
            if (!currentProject) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: '❌ 请先初始化项目',
                        },
                    ],
                };
            }
            const plan = currentProject.state.reproduction_plan;
            if (!plan) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: '❌ 请先生成复现计划',
                        },
                    ],
                };
            }
            const milestone = plan.milestones.find((m) => m.id === milestone_id);
            if (!milestone) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `❌ 未找到里程碑 ID: ${milestone_id}`,
                        },
                    ],
                };
            }
            currentProject.updateState('current_milestone', milestone_id);
            currentProject.updateState('current_stage', 'milestone_in_progress');
            let result = `🚀 开始里程碑: ${milestone.title}

**描述**: ${milestone.description}
**预计时间**: ${milestone.estimated_time}

**步骤**:
`;
            milestone.steps.forEach((step, index) => {
                result += `${index + 1}. ${step.title}\n`;
                result += `   描述: ${step.description}\n`;
                result += `   预计时间: ${step.estimated_time}\n\n`;
            });
            result += `💡 使用 confirm_step 来确认步骤完成`;
            return {
                content: [
                    {
                        type: 'text',
                        text: result,
                    },
                ],
            };
        }
        case 'confirm_step': {
            const { step_id, notes = '' } = args;
            if (!currentProject) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: '❌ 请先初始化项目',
                        },
                    ],
                };
            }
            const currentMilestoneId = currentProject.state.current_milestone;
            if (!currentMilestoneId) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: '❌ 请先开始一个里程碑',
                        },
                    ],
                };
            }
            // 更新步骤状态
            currentProject.updateState(`step_${step_id}_completed`, true);
            if (notes) {
                currentProject.updateState(`step_${step_id}_notes`, notes);
            }
            // 检查里程碑是否完成
            const plan = currentProject.state.reproduction_plan;
            const milestone = plan?.milestones.find((m) => m.id === currentMilestoneId);
            if (milestone) {
                const allStepsCompleted = milestone.steps.every((step) => currentProject.state[`step_${step.id}_completed`]);
                if (allStepsCompleted) {
                    currentProject.updateState(`milestone_${currentMilestoneId}_completed`, true);
                    currentProject.updateState('current_milestone', null);
                    currentProject.updateState('current_stage', 'milestone_completed');
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `🎉 里程碑 "${milestone.title}" 已完成！

${notes ? `**笔记**: ${notes}\n\n` : ''}✅ 所有步骤已完成
📝 里程碑状态已更新

下一步建议:
1. 使用 start_milestone 开始下一个里程碑
2. 使用 get_project_status 查看整体进度`,
                            },
                        ],
                    };
                }
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: `✅ 步骤已确认完成！

${notes ? `**笔记**: ${notes}\n\n` : ''}继续完成里程碑中的其他步骤，或使用 get_project_status 查看进度`,
                    },
                ],
            };
        }
        case 'get_project_status': {
            if (!currentProject) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: '❌ 请先初始化项目',
                        },
                    ],
                };
            }
            const state = currentProject.state;
            const plan = state.reproduction_plan;
            let status = `# 项目状态报告

## 基本信息
- 项目名称: ${state.project_name || '未命名'}
- 当前阶段: ${state.current_stage || '未知'}
- 创建日期: ${state.created_at || '未知'}
- 最后更新: ${state.last_updated || '未知'}

## 论文信息
`;
            if (state.paper_info) {
                status += `- 标题: ${state.paper_info.title || '未设置'}\n`;
                status += `- 分析时间: ${state.paper_info.analyzed_at || '未知'}\n`;
            }
            else {
                status += '- 尚未分析论文\n';
            }
            status += '\n## 用户背景\n';
            if (state.user_profile) {
                status += `- 首选框架: ${state.user_profile.preferred_framework || '未设置'}\n`;
                status += `- 经验水平: ${state.user_profile.experience_level || '未设置'}\n`;
            }
            else {
                status += '- 尚未评估用户背景\n';
            }
            status += '\n## 复现计划\n';
            if (plan) {
                const milestones = plan.milestones || [];
                status += `- 总里程碑数: ${milestones.length}\n`;
                status += `- 预计时间: ${plan.estimated_timeline || '未知'}\n\n`;
                let completedCount = 0;
                milestones.forEach((milestone) => {
                    const isCompleted = state[`milestone_${milestone.id}_completed`] || false;
                    if (isCompleted)
                        completedCount++;
                    status += `  - ${milestone.title}: ${isCompleted ? '✅' : '🔄'}\n`;
                });
                status += `- 整体进度: ${completedCount}/${milestones.length} 里程碑完成\n`;
            }
            else {
                status += '- 尚未生成复现计划\n';
            }
            if (state.current_milestone) {
                status += `\n## 当前任务\n`;
                status += `- 正在进行: 里程碑 ${state.current_milestone}\n`;
                status += '- 使用 confirm_step 来确认步骤完成\n';
            }
            else {
                status += `\n## 建议的下一步\n`;
                if (!state.paper_info) {
                    status += '1. 搜索并分析论文: search_paper 和 analyze_paper\n';
                }
                else if (!state.user_profile) {
                    status += '1. 评估技术背景: assess_user_background\n';
                }
                else if (!plan) {
                    status += '1. 生成复现计划: generate_reproduction_plan\n';
                }
                else {
                    const milestones = plan.milestones || [];
                    const nextMilestone = milestones.find((m) => !state[`milestone_${m.id}_completed`]);
                    if (nextMilestone) {
                        status += `1. 开始下一个里程碑: start_milestone (ID: ${nextMilestone.id})\n`;
                    }
                    else {
                        status += '🎉 所有里程碑已完成！项目复现成功！\n';
                    }
                }
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: status,
                    },
                ],
            };
        }
        default:
            return {
                content: [
                    {
                        type: 'text',
                        text: `❌ 未知工具: ${name}`,
                    },
                ],
            };
    }
});
//# sourceMappingURL=server.js.map