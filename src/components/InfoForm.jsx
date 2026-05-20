// ==========================================================
// 添加/编辑 表单组件
// 功能：
//   - 添加模式：填写信息后点击"添加"按钮
//   - 编辑模式：显示待编辑信息，修改后点击"保存"按钮
// props: onAdd, editingItem, onSave, onCancelEdit
// ==========================================================
function InfoForm({ onAdd, editingItem, onSave, onCancelEdit }) {
  const handleSubmit = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const nextItem = {
      name: formData.get('name'),
      age: formData.get('age'),
      email: formData.get('email'),
    }

    if (editingItem) {
      onSave({ ...editingItem, ...nextItem })
    } else {
      onAdd(nextItem)
    }

    event.currentTarget.reset()
  }

  return (
    <div className="info-form">
      <h2>{editingItem ? '编辑信息' : '添加信息'}</h2>
      <form key={editingItem?.id ?? 'new'} onSubmit={handleSubmit}>
        <input
          name="name"
          type="text"
          placeholder="姓名"
          defaultValue={editingItem?.name ?? ''}
        />
        <input
          name="age"
          type="number"
          placeholder="年龄"
          defaultValue={editingItem?.age ?? ''}
        />
        <input
          name="email"
          type="email"
          placeholder="邮箱"
          defaultValue={editingItem?.email ?? ''}
        />
        <button type="submit">{editingItem ? '保存' : '添加'}</button>
        {editingItem && (
          <button type="button" onClick={onCancelEdit}>
            取消
          </button>
        )}
      </form>
    </div>
  )
}

export default InfoForm
