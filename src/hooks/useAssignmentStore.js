import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'ddl-reminder-assignments'

const createDateByOffset = (dayOffset, hour = 20, minute = 0) => {
  const date = new Date()
  date.setDate(date.getDate() + dayOffset)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
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
