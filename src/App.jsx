import { useState } from 'react'
import './App.css'
import SearchBar from './components/SearchBar'
import InfoForm from './components/InfoForm'
import InfoList from './components/InfoList'

// ============================================================
// 信息管理系统 —— React 作业模板
// 请在下方注释的引导下完成代码编写
// ============================================================

// ---------- 示例数据结构（可自行修改字段） ----------
// 每条信息包含 id、name、age、email 字段，你可以根据需要增减
const INITIAL_DATA = [
  { id: 1, name: '张三', age: 20, email: 'zhangsan@example.com' },
  { id: 2, name: '李四', age: 22, email: 'lisi@example.com' },
]

// ==========================================================
// 根组件 App
// 负责：管理所有 state，协调子组件
// ==========================================================
function App() {
  // TODO: 使用 useState 管理信息列表
  // const [items, setItems] = useState(INITIAL_DATA)

  // TODO: 使用 useState 管理搜索关键字
  // const [keyword, setKeyword] = useState('')

  // TODO: 使用 useState 管理当前正在编辑的信息（null 表示不在编辑状态）
  // const [editingItem, setEditingItem] = useState(null)

  // ---------- 增加功能 ----------
  // TODO: 实现 handleAdd 函数
  // 提示：生成唯一 id（可用 Date.now()），将新信息追加到 items

  // ---------- 删除功能 ----------
  // TODO: 实现 handleDelete 函数
  // 提示：根据 id 过滤掉对应信息

  // ---------- 修改功能 ----------
  // TODO: 实现 handleEdit 函数（进入编辑模式）
  // TODO: 实现 handleSave 函数（保存编辑后的信息）
  // 提示：用 map 遍历 items，找到匹配 id 的项并替换

  // ---------- 查询功能 ----------
  // TODO: 根据 keyword 过滤 items，得到 filteredItems
  // 提示：可以用 filter + includes 进行模糊匹配

  return (
    <div className="app">
      <h1>信息管理系统</h1>

      {/* TODO: 渲染 SearchBar 组件 */}

      {/* TODO: 渲染 InfoForm 组件 */}

      {/* TODO: 渲染 InfoList 组件，传入过滤后的数据 */}
    </div>
  )
}

export default App
