export const DEMO_ASSIGNMENT_VERSION = '2026-07-demo-shift'

// 月份参数从 0 开始，5 表示六月、6 表示七月。
const createJuneDemoDate = (day, hour = 20, minute = 0) =>
  new Date(2026, 5, day, hour, minute, 0, 0).toISOString()

const createJulyDemoDate = (day, hour = 20, minute = 0) =>
  new Date(2026, 6, day, hour, minute, 0, 0).toISOString()

// GitHub Pages 只能展示静态页面，因此这里准备一组可直接体验的演示作业。
export const createGitHubPagesDemoAssignments = () => {
  const assignments = [
    {
      title: '操作系统进程调度实验',
      detail: '整理实验步骤，补充进程调度算法对比和运行截图。',
      course: '操作系统',
      deadline: createJulyDemoDate(1, 21, 0),
    },
    {
      title: '软件工程实训需求说明',
      detail: '完善需求分析、用例图和功能优先级说明。',
      course: '软件工程实训',
      deadline: createJulyDemoDate(2, 20, 30),
    },
    {
      title: '企业面试自我介绍准备',
      detail: '准备一分钟中文介绍、项目经历复盘和常见问题回答。',
      course: '企业面试',
      deadline: createJulyDemoDate(3, 19, 0),
    },
    {
      title: '大创答辩 PPT 初稿',
      detail: '完成研究背景、创新点、阶段成果和经费使用说明。',
      course: '大创答辩',
      deadline: createJulyDemoDate(4, 22, 0),
    },
    {
      title: '党课考试复习提纲',
      detail: '整理课堂重点、选择题易错点和简答题模板。',
      course: '党课考试',
      deadline: createJulyDemoDate(5, 21, 30),
    },
    {
      title: '体测项目打卡记录',
      detail: '记录跑步、跳远、仰卧起坐训练数据并完成提交。',
      course: '体测',
      deadline: createJulyDemoDate(6, 18, 0),
    },
    {
      title: 'API 设计接口文档',
      detail: '补全用户、作业、统计模块接口路径、参数和响应示例。',
      course: 'API 设计',
      deadline: createJulyDemoDate(7, 20, 0),
    },
    {
      title: '大型平台报告资料汇总',
      detail: '整理平台架构、核心模块、部署方案和性能指标。',
      course: '大型平台报告',
      deadline: createJulyDemoDate(8, 21, 0),
    },
    {
      title: '物联网大作业传感器方案',
      detail: '完成设备选型、数据采集流程和系统拓扑图。',
      course: '物联网大作业',
      deadline: createJulyDemoDate(9, 20, 30),
    },
    {
      title: '轻量化项目部署总结',
      detail: '记录 GitHub Pages 部署过程、静态限制和演示方案。',
      course: '轻量化软件开发',
      deadline: createJulyDemoDate(10, 22, 0),
    },
    {
      title: '数据库课程 ER 图修改',
      detail: '根据反馈调整实体关系、主外键和字段约束。',
      course: '数据库原理',
      deadline: createJuneDemoDate(15, 19, 30),
    },
    {
      title: '计算机网络抓包实验',
      detail: '分析 HTTP 请求、DNS 查询和 TCP 三次握手截图。',
      course: '计算机网络',
      deadline: createJuneDemoDate(16, 21, 0),
    },
    {
      title: '前端组件交互优化',
      detail: '检查表单校验、移动端布局和作业列表交互细节。',
      course: 'Web 前端开发',
      deadline: createJuneDemoDate(17, 20, 0),
    },
    {
      title: '英语展示讲稿终稿',
      detail: '压缩展示时长，修正语法并准备问答环节。',
      course: '外教课',
      deadline: createJuneDemoDate(18, 18, 30),
    },
    {
      title: '创新创业计划书',
      detail: '补充市场分析、竞品比较、商业模式和风险控制。',
      course: '创新创业',
      deadline: createJuneDemoDate(19, 21, 30),
    },
    {
      title: '期末复盘与待办清理',
      detail: '整理所有课程剩余任务，标记高优先级事项。',
      course: '综合事务',
      deadline: createJuneDemoDate(20, 20, 0),
    },
    {
      title: '机器学习实验报告',
      detail: '整理模型训练过程、参数设置、准确率曲线和实验结论。',
      course: '机器学习',
      deadline: createJuneDemoDate(21, 21, 0),
    },
    {
      title: '移动应用原型评审',
      detail: '完善首页、任务页和个人中心原型，准备评审说明。',
      course: '移动应用开发',
      deadline: createJuneDemoDate(22, 20, 30),
    },
    {
      title: '信息安全案例分析',
      detail: '选择一个真实安全事件，分析攻击路径、防护措施和启示。',
      course: '信息安全',
      deadline: createJuneDemoDate(23, 19, 30),
    },
    {
      title: '算法设计期末练习',
      detail: '完成动态规划、贪心和图算法专题练习并整理错题。',
      course: '算法设计',
      deadline: createJuneDemoDate(24, 22, 0),
    },
    {
      title: '云计算部署实验',
      detail: '记录服务部署流程、环境变量配置和访问测试结果。',
      course: '云计算',
      deadline: createJuneDemoDate(25, 21, 30),
    },
    {
      title: '人机交互可用性测试',
      detail: '设计测试任务，记录用户反馈并提出界面优化建议。',
      course: '人机交互',
      deadline: createJuneDemoDate(26, 20, 0),
    },
    {
      title: '数据可视化图表优化',
      detail: '调整图表配色、标签层级和关键指标说明。',
      course: '数据可视化',
      deadline: createJuneDemoDate(27, 19, 0),
    },
    {
      title: '嵌入式系统实验总结',
      detail: '补充实验接线图、程序流程和调试问题记录。',
      course: '嵌入式系统',
      deadline: createJuneDemoDate(28, 21, 0),
    },
    {
      title: '项目路演讲稿排练',
      detail: '压缩路演讲稿，准备产品亮点、商业价值和答辩问题。',
      course: '项目路演',
      deadline: createJuneDemoDate(29, 20, 30),
    },
    {
      title: '六月学习总结归档',
      detail: '整理本月作业、实验、答辩材料和复习计划。',
      course: '学习总结',
      deadline: createJuneDemoDate(30, 22, 0),
    },
  ]

  const createdAt = new Date(2026, 4, 21, 9, 0, 0, 0).toISOString()

  // 统一补齐持久化所需字段，让 demo 数据和用户新增的数据结构保持一致。
  return assignments.map((assignment, index) => ({
    ...assignment,
    id: `github-pages-demo-${index + 1}`,
    order: index,
    createdAt,
    completed: false,
  }))
}
