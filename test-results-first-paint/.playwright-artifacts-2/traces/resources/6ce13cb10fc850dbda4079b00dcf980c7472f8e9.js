import { sensorCommand } from "/src/services/control/model.ts";
function commandOf(line) {
  const parts = line.split(";", 1)[0].toUpperCase().split(/([A-Z_]+|[A-Z*])/);
  return (parts.slice(0, 2).join("") === "N" ? parts.slice(3, 5) : parts.slice(0, 3)).join("").trim();
}
function parameters(raw) {
  const tokens = [];
  let token = "";
  let quote = "";
  for (const char of raw) {
    if (char === "\\") return null;
    if (quote) {
      if (char === quote) quote = "";
      else token += char;
    } else if (char === '"' || char === "'") quote = char;
    else if (char === "#" || char === ";") break;
    else if (/\s/.test(char)) {
      if (token) tokens.push(token);
      token = "";
    } else token += char;
  }
  if (quote) return null;
  if (token) tokens.push(token);
  const result = {};
  for (const token2 of tokens) {
    const equal = token2.indexOf("=");
    if (equal < 1) return null;
    result[token2.slice(0, equal).toUpperCase()] = token2.slice(equal + 1);
  }
  return result;
}
export function inspectTypedGcode(script, configfile) {
  let restarts = false;
  let onlyRestarts = true;
  let savesConfig = false;
  for (const original of script.split("\n")) {
    const line = original.trim();
    const command = commandOf(line);
    if (!command) continue;
    if (["RESTART", "FIRMWARE_RESTART"].includes(command)) {
      restarts = true;
      continue;
    }
    if (command === "SAVE_CONFIG") {
      restarts = true;
      savesConfig = true;
      onlyRestarts = false;
      continue;
    }
    onlyRestarts = false;
    if (command !== "SET_FILAMENT_SENSOR") continue;
    let start = command.length;
    let end = line.length;
    if (!line.toUpperCase().startsWith(command)) {
      start += line.toUpperCase().indexOf(command);
      const checksum = line.lastIndexOf("*");
      if (checksum >= 0 && /^\d+$/.test(line.slice(checksum + 1))) end = checksum;
    }
    const args = parameters(line.slice(start, end));
    if (!args?.SENSOR || !/^[+-]?\d+$/.test(args.ENABLE ?? "")) {
      return { refusal: "Not sent. Check the sensor name and ENABLE value. Control cannot safely check this sensor command.", restarts, onlyRestarts, savesConfig };
    }
    if (!sensorCommand(args.SENSOR, Number(args.ENABLE) !== 0, configfile)) {
      return { refusal: "Not sent. This sensor starts the automatic filament load, or its settings have not loaded yet. Control keeps it on.", restarts, onlyRestarts, savesConfig };
    }
  }
  return { refusal: null, restarts, onlyRestarts, savesConfig };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInR5cGVkLWdjb2RlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHNlbnNvckNvbW1hbmQsIHR5cGUgU2Vuc29yQ29uZmlnRmlsZSB9IGZyb20gJ0Avc2VydmljZXMvY29udHJvbC9tb2RlbCdcblxuZXhwb3J0IGludGVyZmFjZSBUeXBlZEJhdGNoIHtcbiAgcmVmdXNhbDogc3RyaW5nIHwgbnVsbDtcbiAgcmVzdGFydHM6IGJvb2xlYW47XG4gIG9ubHlSZXN0YXJ0czogYm9vbGVhbjtcbiAgc2F2ZXNDb25maWc6IGJvb2xlYW47XG59XG5cbi8qKiBLbGlwcGVyIGdjb2RlLnB5IGNvbW1hbmQgZGV0ZWN0aW9uLCBpbmNsdWRpbmcgbnVtYmVyZWQgbGluZXMuIE5vdCBtYWNybyBleHBhbnNpb24uICovXG5mdW5jdGlvbiBjb21tYW5kT2YgKGxpbmU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHBhcnRzID0gbGluZS5zcGxpdCgnOycsIDEpWzBdLnRvVXBwZXJDYXNlKCkuc3BsaXQoLyhbQS1aX10rfFtBLVoqXSkvKVxuICByZXR1cm4gKHBhcnRzLnNsaWNlKDAsIDIpLmpvaW4oJycpID09PSAnTicgPyBwYXJ0cy5zbGljZSgzLCA1KSA6IHBhcnRzLnNsaWNlKDAsIDMpKS5qb2luKCcnKS50cmltKClcbn1cblxuLyoqIFBPU0lYLXN0eWxlIHF1b3Rlcy9jb21tZW50cyBmb3Igc2Vuc29yIGFyZ3VtZW50cy4gRXNjYXBlcyBhcmUgcmVmdXNlZCBjb25zZXJ2YXRpdmVseS4gKi9cbmZ1bmN0aW9uIHBhcmFtZXRlcnMgKHJhdzogc3RyaW5nKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB8IG51bGwge1xuICBjb25zdCB0b2tlbnM6IHN0cmluZ1tdID0gW11cbiAgbGV0IHRva2VuID0gJydcbiAgbGV0IHF1b3RlID0gJydcbiAgZm9yIChjb25zdCBjaGFyIG9mIHJhdykge1xuICAgIGlmIChjaGFyID09PSAnXFxcXCcpIHJldHVybiBudWxsXG4gICAgaWYgKHF1b3RlKSB7XG4gICAgICBpZiAoY2hhciA9PT0gcXVvdGUpIHF1b3RlID0gJydcbiAgICAgIGVsc2UgdG9rZW4gKz0gY2hhclxuICAgIH0gZWxzZSBpZiAoY2hhciA9PT0gJ1wiJyB8fCBjaGFyID09PSBcIidcIikgcXVvdGUgPSBjaGFyXG4gICAgZWxzZSBpZiAoY2hhciA9PT0gJyMnIHx8IGNoYXIgPT09ICc7JykgYnJlYWtcbiAgICBlbHNlIGlmICgvXFxzLy50ZXN0KGNoYXIpKSB7XG4gICAgICBpZiAodG9rZW4pIHRva2Vucy5wdXNoKHRva2VuKVxuICAgICAgdG9rZW4gPSAnJ1xuICAgIH0gZWxzZSB0b2tlbiArPSBjaGFyXG4gIH1cbiAgaWYgKHF1b3RlKSByZXR1cm4gbnVsbFxuICBpZiAodG9rZW4pIHRva2Vucy5wdXNoKHRva2VuKVxuICBjb25zdCByZXN1bHQ6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fVxuICBmb3IgKGNvbnN0IHRva2VuIG9mIHRva2Vucykge1xuICAgIGNvbnN0IGVxdWFsID0gdG9rZW4uaW5kZXhPZignPScpXG4gICAgaWYgKGVxdWFsIDwgMSkgcmV0dXJuIG51bGxcbiAgICAvLyBLbGlwcGVyIHVzZXMgdGhlIGxhc3QgZHVwbGljYXRlIGtleSwgd2l0aCBjYXNlLWluc2Vuc2l0aXZlIHBhcmFtZXRlciBuYW1lcy5cbiAgICByZXN1bHRbdG9rZW4uc2xpY2UoMCwgZXF1YWwpLnRvVXBwZXJDYXNlKCldID0gdG9rZW4uc2xpY2UoZXF1YWwgKyAxKVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuLyoqIFByZWZsaWdodCB0aGUgZW50aXJlIHN1Ym1pc3Npb24gYmVmb3JlIHNlbmRpbmcgYSBzaW5nbGUgbGluZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNwZWN0VHlwZWRHY29kZSAoc2NyaXB0OiBzdHJpbmcsIGNvbmZpZ2ZpbGU/OiBTZW5zb3JDb25maWdGaWxlKTogVHlwZWRCYXRjaCB7XG4gIGxldCByZXN0YXJ0cyA9IGZhbHNlXG4gIGxldCBvbmx5UmVzdGFydHMgPSB0cnVlXG4gIGxldCBzYXZlc0NvbmZpZyA9IGZhbHNlXG4gIGZvciAoY29uc3Qgb3JpZ2luYWwgb2Ygc2NyaXB0LnNwbGl0KCdcXG4nKSkge1xuICAgIGNvbnN0IGxpbmUgPSBvcmlnaW5hbC50cmltKClcbiAgICBjb25zdCBjb21tYW5kID0gY29tbWFuZE9mKGxpbmUpXG4gICAgaWYgKCFjb21tYW5kKSBjb250aW51ZVxuICAgIGlmIChbJ1JFU1RBUlQnLCAnRklSTVdBUkVfUkVTVEFSVCddLmluY2x1ZGVzKGNvbW1hbmQpKSB7XG4gICAgICByZXN0YXJ0cyA9IHRydWVcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuICAgIGlmIChjb21tYW5kID09PSAnU0FWRV9DT05GSUcnKSB7XG4gICAgICByZXN0YXJ0cyA9IHRydWVcbiAgICAgIHNhdmVzQ29uZmlnID0gdHJ1ZVxuICAgICAgb25seVJlc3RhcnRzID0gZmFsc2VcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuICAgIG9ubHlSZXN0YXJ0cyA9IGZhbHNlXG4gICAgaWYgKGNvbW1hbmQgIT09ICdTRVRfRklMQU1FTlRfU0VOU09SJykgY29udGludWVcbiAgICBsZXQgc3RhcnQgPSBjb21tYW5kLmxlbmd0aFxuICAgIGxldCBlbmQgPSBsaW5lLmxlbmd0aFxuICAgIGlmICghbGluZS50b1VwcGVyQ2FzZSgpLnN0YXJ0c1dpdGgoY29tbWFuZCkpIHtcbiAgICAgIHN0YXJ0ICs9IGxpbmUudG9VcHBlckNhc2UoKS5pbmRleE9mKGNvbW1hbmQpXG4gICAgICBjb25zdCBjaGVja3N1bSA9IGxpbmUubGFzdEluZGV4T2YoJyonKVxuICAgICAgaWYgKGNoZWNrc3VtID49IDAgJiYgL15cXGQrJC8udGVzdChsaW5lLnNsaWNlKGNoZWNrc3VtICsgMSkpKSBlbmQgPSBjaGVja3N1bVxuICAgIH1cbiAgICBjb25zdCBhcmdzID0gcGFyYW1ldGVycyhsaW5lLnNsaWNlKHN0YXJ0LCBlbmQpKVxuICAgIGlmICghYXJncz8uU0VOU09SIHx8ICEvXlsrLV0/XFxkKyQvLnRlc3QoYXJncy5FTkFCTEUgPz8gJycpKSB7XG4gICAgICByZXR1cm4geyByZWZ1c2FsOiAnTm90IHNlbnQuIENoZWNrIHRoZSBzZW5zb3IgbmFtZSBhbmQgRU5BQkxFIHZhbHVlLiBDb250cm9sIGNhbm5vdCBzYWZlbHkgY2hlY2sgdGhpcyBzZW5zb3IgY29tbWFuZC4nLCByZXN0YXJ0cywgb25seVJlc3RhcnRzLCBzYXZlc0NvbmZpZyB9XG4gICAgfVxuICAgIGlmICghc2Vuc29yQ29tbWFuZChhcmdzLlNFTlNPUiwgTnVtYmVyKGFyZ3MuRU5BQkxFKSAhPT0gMCwgY29uZmlnZmlsZSkpIHtcbiAgICAgIHJldHVybiB7IHJlZnVzYWw6ICdOb3Qgc2VudC4gVGhpcyBzZW5zb3Igc3RhcnRzIHRoZSBhdXRvbWF0aWMgZmlsYW1lbnQgbG9hZCwgb3IgaXRzIHNldHRpbmdzIGhhdmUgbm90IGxvYWRlZCB5ZXQuIENvbnRyb2wga2VlcHMgaXQgb24uJywgcmVzdGFydHMsIG9ubHlSZXN0YXJ0cywgc2F2ZXNDb25maWcgfVxuICAgIH1cbiAgfVxuICByZXR1cm4geyByZWZ1c2FsOiBudWxsLCByZXN0YXJ0cywgb25seVJlc3RhcnRzLCBzYXZlc0NvbmZpZyB9XG59XG4iXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMscUJBQTRDO0FBVXJELFNBQVMsVUFBVyxNQUFzQjtBQUN4QyxRQUFNLFFBQVEsS0FBSyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFBRSxZQUFZLEVBQUUsTUFBTSxrQkFBa0I7QUFDMUUsVUFBUSxNQUFNLE1BQU0sR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLE1BQU0sTUFBTSxNQUFNLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxNQUFNLEdBQUcsQ0FBQyxHQUFHLEtBQUssRUFBRSxFQUFFLEtBQUs7QUFDcEc7QUFHQSxTQUFTLFdBQVksS0FBNEM7QUFDL0QsUUFBTSxTQUFtQixDQUFDO0FBQzFCLE1BQUksUUFBUTtBQUNaLE1BQUksUUFBUTtBQUNaLGFBQVcsUUFBUSxLQUFLO0FBQ3RCLFFBQUksU0FBUyxLQUFNLFFBQU87QUFDMUIsUUFBSSxPQUFPO0FBQ1QsVUFBSSxTQUFTLE1BQU8sU0FBUTtBQUFBLFVBQ3ZCLFVBQVM7QUFBQSxJQUNoQixXQUFXLFNBQVMsT0FBTyxTQUFTLElBQUssU0FBUTtBQUFBLGFBQ3hDLFNBQVMsT0FBTyxTQUFTLElBQUs7QUFBQSxhQUM5QixLQUFLLEtBQUssSUFBSSxHQUFHO0FBQ3hCLFVBQUksTUFBTyxRQUFPLEtBQUssS0FBSztBQUM1QixjQUFRO0FBQUEsSUFDVixNQUFPLFVBQVM7QUFBQSxFQUNsQjtBQUNBLE1BQUksTUFBTyxRQUFPO0FBQ2xCLE1BQUksTUFBTyxRQUFPLEtBQUssS0FBSztBQUM1QixRQUFNLFNBQWlDLENBQUM7QUFDeEMsYUFBV0EsVUFBUyxRQUFRO0FBQzFCLFVBQU0sUUFBUUEsT0FBTSxRQUFRLEdBQUc7QUFDL0IsUUFBSSxRQUFRLEVBQUcsUUFBTztBQUV0QixXQUFPQSxPQUFNLE1BQU0sR0FBRyxLQUFLLEVBQUUsWUFBWSxDQUFDLElBQUlBLE9BQU0sTUFBTSxRQUFRLENBQUM7QUFBQSxFQUNyRTtBQUNBLFNBQU87QUFDVDtBQUdPLGdCQUFTLGtCQUFtQixRQUFnQixZQUEyQztBQUM1RixNQUFJLFdBQVc7QUFDZixNQUFJLGVBQWU7QUFDbkIsTUFBSSxjQUFjO0FBQ2xCLGFBQVcsWUFBWSxPQUFPLE1BQU0sSUFBSSxHQUFHO0FBQ3pDLFVBQU0sT0FBTyxTQUFTLEtBQUs7QUFDM0IsVUFBTSxVQUFVLFVBQVUsSUFBSTtBQUM5QixRQUFJLENBQUMsUUFBUztBQUNkLFFBQUksQ0FBQyxXQUFXLGtCQUFrQixFQUFFLFNBQVMsT0FBTyxHQUFHO0FBQ3JELGlCQUFXO0FBQ1g7QUFBQSxJQUNGO0FBQ0EsUUFBSSxZQUFZLGVBQWU7QUFDN0IsaUJBQVc7QUFDWCxvQkFBYztBQUNkLHFCQUFlO0FBQ2Y7QUFBQSxJQUNGO0FBQ0EsbUJBQWU7QUFDZixRQUFJLFlBQVksc0JBQXVCO0FBQ3ZDLFFBQUksUUFBUSxRQUFRO0FBQ3BCLFFBQUksTUFBTSxLQUFLO0FBQ2YsUUFBSSxDQUFDLEtBQUssWUFBWSxFQUFFLFdBQVcsT0FBTyxHQUFHO0FBQzNDLGVBQVMsS0FBSyxZQUFZLEVBQUUsUUFBUSxPQUFPO0FBQzNDLFlBQU0sV0FBVyxLQUFLLFlBQVksR0FBRztBQUNyQyxVQUFJLFlBQVksS0FBSyxRQUFRLEtBQUssS0FBSyxNQUFNLFdBQVcsQ0FBQyxDQUFDLEVBQUcsT0FBTTtBQUFBLElBQ3JFO0FBQ0EsVUFBTSxPQUFPLFdBQVcsS0FBSyxNQUFNLE9BQU8sR0FBRyxDQUFDO0FBQzlDLFFBQUksQ0FBQyxNQUFNLFVBQVUsQ0FBQyxhQUFhLEtBQUssS0FBSyxVQUFVLEVBQUUsR0FBRztBQUMxRCxhQUFPLEVBQUUsU0FBUyxzR0FBc0csVUFBVSxjQUFjLFlBQVk7QUFBQSxJQUM5SjtBQUNBLFFBQUksQ0FBQyxjQUFjLEtBQUssUUFBUSxPQUFPLEtBQUssTUFBTSxNQUFNLEdBQUcsVUFBVSxHQUFHO0FBQ3RFLGFBQU8sRUFBRSxTQUFTLHVIQUF1SCxVQUFVLGNBQWMsWUFBWTtBQUFBLElBQy9LO0FBQUEsRUFDRjtBQUNBLFNBQU8sRUFBRSxTQUFTLE1BQU0sVUFBVSxjQUFjLFlBQVk7QUFDOUQ7IiwibmFtZXMiOlsidG9rZW4iXX0=