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

export class ReproductionPlanner {
  private paperInfo: PaperAnalysis;
  private userProfile: UserProfile;

  constructor(paperInfo: PaperAnalysis, userProfile: UserProfile) {
    this.paperInfo = paperInfo;
    this.userProfile = userProfile;
  }

  generatePlan(): ReproductionPlan {
    const overview = this.generateOverview();
    const milestones = this.generateMilestones();
    const envSetup = this.generateEnvSetup();
    const estimatedTimeline = this.estimateTimeline();
    const difficulty = this.assessDifficulty();

    return {
      overview,
      milestones,
      env_setup: envSetup,
      estimated_timeline: estimatedTimeline,
      difficulty,
    };
  }

  private generateOverview(): string {
    const framework = this.userProfile.preferred_framework;
    const experience = this.userProfile.experience_level;
    
    return `本项目将复现论文"${this.paperInfo.title}"，使用${framework}框架。根据您的${experience}水平，我们将分步骤完成复现工作。`;
  }

  private generateMilestones(): Milestone[] {
    const baseMilestones = [
      {
        id: 'env_setup',
        title: '环境配置',
        description: '设置开发环境和安装必要的依赖包',
        estimated_time: '1-2天',
        steps: [
          {
            id: 'install_python',
            title: '安装Python环境',
            description: '安装指定版本的Python和pip',
            estimated_time: '30分钟',
            difficulty: '简单'
          },
          {
            id: 'install_dependencies',
            title: '安装依赖包',
            description: '安装项目所需的核心依赖包',
            estimated_time: '1小时',
            difficulty: '简单'
          },
          {
            id: 'verify_installation',
            title: '验证安装',
            description: '运行测试脚本验证环境配置正确',
            estimated_time: '30分钟',
            difficulty: '简单'
          }
        ]
      },
      {
        id: 'data_preparation',
        title: '数据准备',
        description: '下载、预处理和准备实验数据',
        estimated_time: '2-3天',
        steps: [
          {
            id: 'download_data',
            title: '下载数据集',
            description: '从指定源下载实验所需的数据集',
            estimated_time: '2小时',
            difficulty: '简单'
          },
          {
            id: 'preprocess_data',
            title: '数据预处理',
            description: '对原始数据进行清洗、转换和标准化',
            estimated_time: '4小时',
            difficulty: '中等'
          },
          {
            id: 'split_data',
            title: '数据分割',
            description: '将数据集分割为训练、验证和测试集',
            estimated_time: '1小时',
            difficulty: '简单'
          }
        ]
      },
      {
        id: 'model_implementation',
        title: '模型实现',
        description: '根据论文描述实现核心模型架构',
        estimated_time: '3-5天',
        steps: [
          {
            id: 'architecture_design',
            title: '架构设计',
            description: '设计模型架构和组件结构',
            estimated_time: '4小时',
            difficulty: '中等'
          },
          {
            id: 'core_implementation',
            title: '核心实现',
            description: '实现模型的核心组件和算法',
            estimated_time: '8小时',
            difficulty: '困难'
          },
          {
            id: 'model_testing',
            title: '模型测试',
            description: '编写单元测试验证模型功能',
            estimated_time: '2小时',
            difficulty: '中等'
          }
        ]
      },
      {
        id: 'training_experiments',
        title: '训练实验',
        description: '执行模型训练和超参数调优',
        estimated_time: '5-7天',
        steps: [
          {
            id: 'baseline_training',
            title: '基线训练',
            description: '使用默认参数进行基线模型训练',
            estimated_time: '6小时',
            difficulty: '中等'
          },
          {
            id: 'hyperparameter_tuning',
            title: '超参数调优',
            description: '使用网格搜索或贝叶斯优化调优超参数',
            estimated_time: '12小时',
            difficulty: '困难'
          },
          {
            id: 'model_evaluation',
            title: '模型评估',
            description: '在测试集上评估模型性能',
            estimated_time: '2小时',
            difficulty: '中等'
          }
        ]
      },
      {
        id: 'results_analysis',
        title: '结果分析',
        description: '分析实验结果和生成可视化图表',
        estimated_time: '2-3天',
        steps: [
          {
            id: 'performance_analysis',
            title: '性能分析',
            description: '分析模型性能指标和对比结果',
            estimated_time: '4小时',
            difficulty: '中等'
          },
          {
            id: 'visualization',
            title: '结果可视化',
            description: '生成图表和可视化结果',
            estimated_time: '3小时',
            difficulty: '中等'
          },
          {
            id: 'documentation',
            title: '文档编写',
            description: '编写实验报告和复现说明',
            estimated_time: '2小时',
            difficulty: '简单'
          }
        ]
      }
    ];

    // 根据用户经验水平调整里程碑
    return this.adjustMilestonesForUser(baseMilestones);
  }

  private adjustMilestonesForUser(milestones: Milestone[]): Milestone[] {
    const experienceLevel = this.userProfile.experience_level;
    
    if (experienceLevel === '初学者') {
      // 为初学者添加更多详细步骤
      return milestones.map(milestone => ({
        ...milestone,
        steps: milestone.steps.map(step => ({
          ...step,
          description: step.description + ' (详细指导将提供)',
          estimated_time: this.adjustTimeForBeginner(step.estimated_time)
        }))
      }));
    } else if (experienceLevel === '专家') {
      // 为专家简化一些步骤
      return milestones.map(milestone => ({
        ...milestone,
        steps: milestone.steps.filter(step => step.difficulty !== '简单')
      }));
    }
    
    return milestones;
  }

  private adjustTimeForBeginner(time: string): string {
    const timeMap: Record<string, string> = {
      '30分钟': '1小时',
      '1小时': '2小时',
      '2小时': '4小时',
      '4小时': '6小时',
      '6小时': '8小时',
      '8小时': '12小时',
      '12小时': '16小时'
    };
    
    return timeMap[time] || time;
  }

  private generateEnvSetup(): { python_version: string; core_packages: string[] } {
    const framework = this.userProfile.preferred_framework;
    const corePackages = this.getCorePackages(framework);
    
    return {
      python_version: '3.8+',
      core_packages: corePackages
    };
  }

  private getCorePackages(framework: string): string[] {
    const basePackages = ['numpy', 'pandas', 'matplotlib', 'seaborn', 'scikit-learn'];
    
    const frameworkPackages: Record<string, string[]> = {
      'PyTorch': ['torch', 'torchvision', 'torchaudio'],
      'TensorFlow': ['tensorflow', 'keras'],
      'JAX': ['jax', 'jaxlib', 'flax'],
      'Keras': ['keras', 'tensorflow'],
      'scikit-learn': ['scikit-learn']
    };
    
    return [...basePackages, ...(frameworkPackages[framework] || [])];
  }

  private estimateTimeline(): string {
    const experienceLevel = this.userProfile.experience_level;
    const paperDifficulty = this.paperInfo.difficulty;
    
    let baseWeeks = 2;
    
    if (paperDifficulty === '高级') baseWeeks += 2;
    if (experienceLevel === '初学者') baseWeeks += 1;
    if (experienceLevel === '专家') baseWeeks -= 0.5;
    
    return `${baseWeeks}-${baseWeeks + 2}周`;
  }

  private assessDifficulty(): string {
    const experienceLevel = this.userProfile.experience_level;
    const paperDifficulty = this.paperInfo.difficulty;
    
    if (experienceLevel === '初学者' && paperDifficulty === '高级') return '困难';
    if (experienceLevel === '专家' && paperDifficulty === '初级') return '简单';
    
    return '中等';
  }
} 