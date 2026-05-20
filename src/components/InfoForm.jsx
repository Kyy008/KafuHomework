// ==========================================================
// 添加/编辑 表单组件
// 功能：
//   - 添加模式：填写信息后点击"添加"按钮
//   - 编辑模式：显示待编辑信息，修改后点击"保存"按钮
// props: onAdd, editingItem, onSave, onCancelEdit
// ==========================================================
function InfoForm({ onAdd, editingItem, onSave, onCancelEdit }) {
  // TODO: 使用 useState 管理表单各字段的值
  // 提示：编辑模式时，表单初始值应为 editingItem 的字段

  // TODO: 处理表单提交
  // 提示：区分是"添加"还是"保存编辑"两种情况

  return (
    <div className="info-form">
      <h2>{editingItem ? '编辑信息' : '添加信息'}</h2>
      {/* TODO: 在此编写表单 JSX */}
      {/* 包含：姓名输入框、年龄输入框、邮箱输入框、提交按钮 */}
      {/* 编辑模式下额外显示"取消"按钮 */}
    </div>
  )
}

export default InfoForm
