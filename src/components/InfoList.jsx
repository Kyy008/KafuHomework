import InfoItem from './InfoItem'

// ==========================================================
// 信息列表组件
// 功能：遍历数据数组，渲染每条信息
// props: items, onEdit, onDelete
// ==========================================================
function InfoList({ items, onEdit, onDelete }) {
  if (items.length === 0) {
    return <p className="empty-tip">暂无数据</p>
  }
  return (
    <table className="info-table">
      <thead>
        <tr>
          <th>姓名</th>
          <th>年龄</th>
          <th>邮箱</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <InfoItem
            key={item.id}
            item={item}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </tbody>
    </table>
  )
}

export default InfoList
