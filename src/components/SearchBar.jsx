// ==========================================================
// 搜索栏组件
// 功能：接收用户输入的关键字，通知父组件进行过滤
// props: keyword, onKeywordChange
// ==========================================================
function SearchBar({ keyword, onKeywordChange }) {
  return (
    <div className="search-bar">
      <input
        type="text"
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
      />
    </div>
  )
}

export default SearchBar
