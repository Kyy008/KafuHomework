import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'ddl-reminder-assignments'
const DEMO_STORAGE_VERSION_KEY = 'ddl-reminder-demo-version'
const DEMO_ASSIGNMENT_VERSION = '2026-06-homework-demo'

const isGitHubPagesRuntime = () =>
  typeof window !== 'undefined' &&
  window.location.hostname.toLowerCase().endsWith('github.io')

const createDateByOffset = (dayOffset, hour = 20, minute = 0) => {
  const date = new Date()
  date.setDate(date.getDate() + dayOffset)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

const createDemoDate = (day, hour = 20, minute = 0) =>
  new Date(2026, 5, day, hour, minute, 0, 0).toISOString()

const createGitHubPagesDemoAssignments = () => {
  const assignments = [
    {
      title: '操作系统进程调度实验',
      detail: '整理实验步骤，补充进程调度算法对比和运行截图。',
      course: '操作系统',
      deadline: createDemoDate(5, 21, 0),
    },
    {
      title: '软件工程实训需求说明',
      detail: '完善需求分析、用例图和功能优先级说明。',
      course: '软件工程实训',
      deadline: createDemoDate(6, 20, 30),
    },
    {
      title: '企业面试自我介绍准备',
      detail: '准备一分钟中文介绍、项目经历复盘和常见问题回答。',
      course: '企业面试',
      deadline: createDemoDate(7, 19, 0),
    },
    {
      title: '大创答辩 PPT 初稿',
      detail: '完成研究背景、创新点、阶段成果和经费使用说明。',
      course: '大创答辩',
      deadline: createDemoDate(8, 22, 0),
    },
    {
      title: '党课考试复习提纲',
      detail: '整理课堂重点、选择题易错点和简答题模板。',
      course: '党课考试',
      deadline: createDemoDate(9, 21, 30),
    },
    {
      title: '体测项目打卡记录',
      detail: '记录跑步、跳远、仰卧起坐训练数据并完成提交。',
      course: '体测',
      deadline: createDemoDate(10, 18, 0),
    },
    {
      title: 'API 设计接口文档',
      detail: '补全用户、作业、统计模块接口路径、参数和响应示例。',
      course: 'API 设计',
      deadline: createDemoDate(11, 20, 0),
    },
    {
      title: '大型平台报告资料汇总',
      detail: '整理平台架构、核心模块、部署方案和性能指标。',
      course: '大型平台报告',
      deadline: createDemoDate(12, 21, 0),
    },
    {
      title: '物联网大作业传感器方案',
      detail: '完成设备选型、数据采集流程和系统拓扑图。',
      course: '物联网大作业',
      deadline: createDemoDate(13, 20, 30),
    },
    {
      title: '轻量化项目部署总结',
      detail: '记录 GitHub Pages 部署过程、静态限制和演示方案。',
      course: '轻量化软件开发',
      deadline: createDemoDate(14, 22, 0),
    },
    {
      title: '数据库课程 ER 图修改',
      detail: '根据反馈调整实体关系、主外键和字段约束。',
      course: '数据库原理',
      deadline: createDemoDate(15, 19, 30),
    },
    {
      title: '计算机网络抓包实验',
      detail: '分析 HTTP 请求、DNS 查询和 TCP 三次握手截图。',
      course: '计算机网络',
      deadline: createDemoDate(16, 21, 0),
    },
    {
      title: '前端组件交互优化',
      detail: '检查表单校验、移动端布局和作业列表交互细节。',
      course: 'Web 前端开发',
      deadline: createDemoDate(17, 20, 0),
    },
    {
      title: '英语展示讲稿终稿',
      detail: '压缩展示时长，修正语法并准备问答环节。',
      course: '外教课',
      deadline: createDemoDate(18, 18, 30),
    },
    {
      title: '创新创业计划书',
      detail: '补充市场分析、竞品比较、商业模式和风险控制。',
      course: '创新创业',
      deadline: createDemoDate(19, 21, 30),
    },
    {
      title: '期末复盘与待办清理',
      detail: '整理所有课程剩余任务，标记高优先级事项。',
      course: '综合事务',
      deadline: createDemoDate(20, 20, 0),
    },
  ]

  const createdAt = new Date(2026, 4, 21, 9, 0, 0, 0).toISOString()

  return assignments.map((assignment, index) => ({
    ...assignment,
    id: `github-pages-demo-${index + 1}`,
    order: index,
    createdAt,
    completed: false,
  }))
}

const createInitialAssignments = () => [
  {
    id: 1,
    order: 0,
    title: '轻量化第三次作业',
    detail: '完成 React 作业管理系统核心功能开发，并补充作业报告。',
    course: '轻量化软件开发',
    deadline: createDateByOffset(3, 22, 0),
    createdAt: new Date().toISOString(),
    completed: false,
  },
  {
    id: 2,
    order: 1,
    title: '行教课课程反思',
    detail: '整理课堂笔记，提交课程学习反思。',
    course: '行教课',
    deadline: createDateByOffset(1, 19, 0),
    createdAt: new Date().toISOString(),
    completed: false,
  },
  {
    id: 3,
    order: 2,
    title: '外教课展示准备',
    detail: '准备小组展示材料，检查演讲稿和 PPT。',
    course: '外教课',
    deadline: createDateByOffset(7, 14, 0),
    createdAt: new Date().toISOString(),
    completed: true,
  },
]

const isValidAssignment = (assignment) =>
  assignment &&
  typeof assignment.id !== 'undefined' &&
  typeof assignment.title === 'string' &&
  typeof assignment.detail === 'string' &&
  typeof assignment.course === 'string' &&
  typeof assignment.deadline === 'string' &&
  typeof assignment.createdAt === 'string' &&
  typeof assignment.completed === 'boolean' &&
  (typeof assignment.order === 'undefined' ||
    typeof assignment.order === 'number')

const normalizeAssignmentOrder = (assignments) =>
  assignments.map((assignment, index) => ({
    ...assignment,
    order: Number.isFinite(assignment.order) ? assignment.order : index,
  }))

const getNextCustomOrder = (assignments) => {
  if (assignments.length === 0) {
    return 0
  }

  const minimumOrder = Math.min(
    ...assignments.map((assignment) =>
      Number.isFinite(assignment.order) ? assignment.order : 0,
    ),
  )

  return minimumOrder - 1
}

const getReorderedAssignments = (assignments, orderedIds) => {
  const normalizedOrderedIds = orderedIds.map(String)
  const orderedIdSet = new Set(normalizedOrderedIds)
  const assignmentById = new Map(
    assignments.map((assignment) => [String(assignment.id), assignment]),
  )
  const reusableOrderValues = normalizedOrderedIds
    .map((id) => assignmentById.get(id))
    .filter(Boolean)
    .map((assignment) => assignment.order)
    .sort((leftOrder, rightOrder) => leftOrder - rightOrder)
  const nextOrderById = new Map(
    normalizedOrderedIds.map((id, index) => [id, reusableOrderValues[index]]),
  )

  return assignments.map((assignment) => {
    const nextOrder = nextOrderById.get(String(assignment.id))

    if (!orderedIdSet.has(String(assignment.id)) || nextOrder === undefined) {
      return assignment
    }

    return {
      ...assignment,
      order: nextOrder,
    }
  })
}

const loadAssignments = () => {
  try {
    if (
      isGitHubPagesRuntime() &&
      localStorage.getItem(DEMO_STORAGE_VERSION_KEY) !== DEMO_ASSIGNMENT_VERSION
    ) {
      const demoAssignments = createGitHubPagesDemoAssignments()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demoAssignments))
      localStorage.setItem(DEMO_STORAGE_VERSION_KEY, DEMO_ASSIGNMENT_VERSION)
      return demoAssignments
    }

    const storedAssignments = localStorage.getItem(STORAGE_KEY)

    if (!storedAssignments) {
      return createInitialAssignments()
    }

    const parsedAssignments = JSON.parse(storedAssignments)

    if (
      !Array.isArray(parsedAssignments) ||
      parsedAssignments.length === 0 ||
      !parsedAssignments.every(isValidAssignment)
    ) {
      return createInitialAssignments()
    }

    return normalizeAssignmentOrder(parsedAssignments)
  } catch {
    return createInitialAssignments()
  }
}

export const useAssignmentStore = () => {
  const [assignments, setAssignments] = useState(loadAssignments)
  const [keyword, setKeyword] = useState('')
  const [selectedAssignment, setSelectedAssignment] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments))
  }, [assignments])

  const filteredAssignments = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()

    if (!normalizedKeyword) {
      return assignments
    }

    return assignments.filter((assignment) => {
      const searchableText = [
        assignment.title,
        assignment.course,
        assignment.detail,
      ]
        .join(' ')
        .toLowerCase()

      return searchableText.includes(normalizedKeyword)
    })
  }, [assignments, keyword])

  const addAssignment = (formData) => {
    const newAssignment = {
      id: Date.now(),
      order: getNextCustomOrder(assignments),
      title: formData.title,
      detail: formData.detail,
      course: formData.course,
      deadline: formData.deadline,
      createdAt: new Date().toISOString(),
      completed: false,
    }

    setAssignments((currentAssignments) => [
      newAssignment,
      ...currentAssignments,
    ])

    return newAssignment
  }

  const deleteAssignment = (id) => {
    setAssignments((currentAssignments) =>
      currentAssignments.filter((assignment) => assignment.id !== id),
    )
    setSelectedAssignment((currentAssignment) =>
      currentAssignment?.id === id ? null : currentAssignment,
    )
  }

  const saveAssignment = (updatedAssignment) => {
    setAssignments((currentAssignments) =>
      currentAssignments.map((assignment) =>
        assignment.id === updatedAssignment.id
          ? { ...assignment, ...updatedAssignment }
          : assignment,
      ),
    )
  }

  const reorderAssignments = (orderedIds) => {
    setAssignments((currentAssignments) =>
      getReorderedAssignments(currentAssignments, orderedIds),
    )
  }

  const toggleComplete = (id) => {
    setAssignments((currentAssignments) =>
      currentAssignments.map((assignment) =>
        assignment.id === id
          ? { ...assignment, completed: !assignment.completed }
          : assignment,
      ),
    )
  }

  return {
    assignments,
    keyword,
    filteredAssignments,
    selectedAssignment,
    setKeyword,
    setSelectedAssignment,
    addAssignment,
    deleteAssignment,
    reorderAssignments,
    saveAssignment,
    toggleComplete,
  }
}
