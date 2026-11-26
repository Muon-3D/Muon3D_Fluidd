const paramRegExp = /params\.(\w+)(.*)/gi;
const defaultValueRegExp = /\|\s*default\s*\(\s*((["'])(?:\\\2|.)*?\2|-?\d[^,)]*)/i;
export const gcodeMacroParamDefault = (param) => {
  const valueMatch = defaultValueRegExp.exec(param);
  if (!valueMatch) {
    return "";
  }
  const value = (valueMatch[1] || "").trim();
  return valueMatch[2] ? value.substring(1, value.length - 1) : value;
};
const gcodeMacroParams = (gcode) => {
  return [...gcode.matchAll(paramRegExp)].map(([, name, rest]) => ({
    name,
    value: gcodeMacroParamDefault(rest)
  }));
};
export default gcodeMacroParams;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdjb2RlLW1hY3JvLXBhcmFtcy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBwYXJhbVJlZ0V4cCA9IC9wYXJhbXNcXC4oXFx3KykoLiopL2dpXG5jb25zdCBkZWZhdWx0VmFsdWVSZWdFeHAgPSAvXFx8XFxzKmRlZmF1bHRcXHMqXFwoXFxzKigoW1wiJ10pKD86XFxcXFxcMnwuKSo/XFwyfC0/XFxkW14sKV0qKS9pXG5cbmV4cG9ydCBjb25zdCBnY29kZU1hY3JvUGFyYW1EZWZhdWx0ID0gKHBhcmFtOiBzdHJpbmcpID0+IHtcbiAgY29uc3QgdmFsdWVNYXRjaCA9IGRlZmF1bHRWYWx1ZVJlZ0V4cC5leGVjKHBhcmFtKVxuXG4gIGlmICghdmFsdWVNYXRjaCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgY29uc3QgdmFsdWUgPSAodmFsdWVNYXRjaFsxXSB8fCAnJykudHJpbSgpXG5cbiAgcmV0dXJuIHZhbHVlTWF0Y2hbMl1cbiAgICA/IHZhbHVlLnN1YnN0cmluZygxLCB2YWx1ZS5sZW5ndGggLSAxKVxuICAgIDogdmFsdWVcbn1cblxuY29uc3QgZ2NvZGVNYWNyb1BhcmFtcyA9IChnY29kZTogc3RyaW5nKSA9PiB7XG4gIHJldHVybiBbLi4uZ2NvZGUubWF0Y2hBbGwocGFyYW1SZWdFeHApXS5tYXAoKFssIG5hbWUsIHJlc3RdKSA9PiAoe1xuICAgIG5hbWUsXG4gICAgdmFsdWU6IGdjb2RlTWFjcm9QYXJhbURlZmF1bHQocmVzdClcbiAgfSkpXG59XG5cbmV4cG9ydCBkZWZhdWx0IGdjb2RlTWFjcm9QYXJhbXNcbiJdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxjQUFjO0FBQ3BCLE1BQU0scUJBQXFCO0FBRXBCLGFBQU0seUJBQXlCLENBQUMsVUFBa0I7QUFDdkQsUUFBTSxhQUFhLG1CQUFtQixLQUFLLEtBQUs7QUFFaEQsTUFBSSxDQUFDLFlBQVk7QUFDZixXQUFPO0FBQUEsRUFDVDtBQUVBLFFBQU0sU0FBUyxXQUFXLENBQUMsS0FBSyxJQUFJLEtBQUs7QUFFekMsU0FBTyxXQUFXLENBQUMsSUFDZixNQUFNLFVBQVUsR0FBRyxNQUFNLFNBQVMsQ0FBQyxJQUNuQztBQUNOO0FBRUEsTUFBTSxtQkFBbUIsQ0FBQyxVQUFrQjtBQUMxQyxTQUFPLENBQUMsR0FBRyxNQUFNLFNBQVMsV0FBVyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxNQUFNLElBQUksT0FBTztBQUFBLElBQy9EO0FBQUEsSUFDQSxPQUFPLHVCQUF1QixJQUFJO0FBQUEsRUFDcEMsRUFBRTtBQUNKO0FBRUEsZUFBZTsiLCJuYW1lcyI6W119