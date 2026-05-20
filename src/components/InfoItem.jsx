// ==========================================================
// 单条信息组件
// 功能：展示一条信息的内容，提供"编辑"和"删除"按钮
// props: item, onEdit, onDelete
// ==========================================================
function InfoItem({ item, onEdit, onDelete }) {
  return (
    <tr>
      <td>{item.name}</td>
      <td>{item.age}</td>
      <td>{item.email}</td>
      <td className="actions">
        <button type="button" onClick={() => onEdit(item)}>
          编辑
        </button>
        <button type="button" onClick={() => onDelete(item.id)}>
          删除
        </button>
      </td>
    </tr>
  )
}

export default InfoItem
