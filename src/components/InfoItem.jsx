// ==========================================================
// 单条信息组件
// 功能：展示一条信息的内容，提供"编辑"和"删除"按钮
// props: item, onEdit, onDelete
// ==========================================================
function InfoItem({ item, onEdit, onDelete }) {
  return (
    <tr>
      {/* TODO: 展示 item 的各字段 */}
      <td>{item.name}</td>
      <td>{item.age}</td>
      <td>{item.email}</td>
      <td className="actions">
        {/* TODO: 编辑按钮，调用 onEdit(item) */}
        {/* TODO: 删除按钮，调用 onDelete(item.id) */}
      </td>
    </tr>
  )
}

export default InfoItem
