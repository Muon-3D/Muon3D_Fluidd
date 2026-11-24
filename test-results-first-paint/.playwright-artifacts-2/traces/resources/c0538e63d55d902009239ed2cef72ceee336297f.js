import.meta.env = {"BASE_URL": "/", "BUILD_COMMIT": "d1270d4565e29ad81538c770c7dd4b9bf74ff076", "DEV": true, "HASH": "d1270d4\n", "MODE": "development", "PROD": false, "SSR": false, "VERSION": "1.31.0-rc.7", "VITE_CONTROL_FIRST_PAINT": "true", "VUE_APP_I18N_FALLBACK_LOCALE": "en", "VUE_APP_I18N_LOCALE": "en", "VUE_MUON_SLICER_URL": "/slicer/embed.html"};export const isFluiddContent = (type, content) => {
  return content != null && typeof content === "object" && "meta" in content && content.meta != null && typeof content.meta === "object" && "app" in content.meta && typeof content.meta.app === "string" && content.meta.app === "Fluidd" && "type" in content.meta && typeof content.meta.type === "string" && content.meta.type === type && "data" in content;
};
export const toFluiddContent = (type, data) => {
  return {
    meta: {
      app: "Fluidd",
      version: import.meta.env.VERSION,
      type
    },
    data
  };
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZsdWlkZC1jb250ZW50LnRzIl0sInNvdXJjZXNDb250ZW50IjpbInR5cGUgRmx1aWRkQ29udGVudDxUPiA9IHtcbiAgbWV0YToge1xuICAgIGFwcDogJ0ZsdWlkZCcsXG4gICAgdmVyc2lvbjogc3RyaW5nLFxuICAgIHR5cGU6IHN0cmluZ1xuICB9LFxuICBkYXRhOiBUXG59XG5cbmV4cG9ydCBjb25zdCBpc0ZsdWlkZENvbnRlbnQgPSA8VD4odHlwZTogc3RyaW5nLCBjb250ZW50OiB1bmtub3duKTogY29udGVudCBpcyBGbHVpZGRDb250ZW50PFQ+ID0+IHtcbiAgcmV0dXJuIChcbiAgICBjb250ZW50ICE9IG51bGwgJiZcbiAgICB0eXBlb2YgKGNvbnRlbnQpID09PSAnb2JqZWN0JyAmJlxuICAgICdtZXRhJyBpbiBjb250ZW50ICYmXG4gICAgY29udGVudC5tZXRhICE9IG51bGwgJiZcbiAgICB0eXBlb2YgKGNvbnRlbnQubWV0YSkgPT09ICdvYmplY3QnICYmXG4gICAgJ2FwcCcgaW4gY29udGVudC5tZXRhICYmXG4gICAgdHlwZW9mIChjb250ZW50Lm1ldGEuYXBwKSA9PT0gJ3N0cmluZycgJiZcbiAgICBjb250ZW50Lm1ldGEuYXBwID09PSAnRmx1aWRkJyAmJlxuICAgICd0eXBlJyBpbiBjb250ZW50Lm1ldGEgJiZcbiAgICB0eXBlb2YgKGNvbnRlbnQubWV0YS50eXBlKSA9PT0gJ3N0cmluZycgJiZcbiAgICBjb250ZW50Lm1ldGEudHlwZSA9PT0gdHlwZSAmJlxuICAgICdkYXRhJyBpbiBjb250ZW50XG4gIClcbn1cblxuZXhwb3J0IGNvbnN0IHRvRmx1aWRkQ29udGVudCA9IDxUPih0eXBlOiBzdHJpbmcsIGRhdGE6IFQpOiBGbHVpZGRDb250ZW50PFQ+ID0+IHtcbiAgcmV0dXJuIHtcbiAgICBtZXRhOiB7XG4gICAgICBhcHA6ICdGbHVpZGQnLFxuICAgICAgdmVyc2lvbjogaW1wb3J0Lm1ldGEuZW52LlZFUlNJT04sXG4gICAgICB0eXBlXG4gICAgfSxcbiAgICBkYXRhXG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6IkFBU08sYUFBTSxrQkFBa0IsQ0FBSSxNQUFjLFlBQWtEO0FBQ2pHLFNBQ0UsV0FBVyxRQUNYLE9BQVEsWUFBYSxZQUNyQixVQUFVLFdBQ1YsUUFBUSxRQUFRLFFBQ2hCLE9BQVEsUUFBUSxTQUFVLFlBQzFCLFNBQVMsUUFBUSxRQUNqQixPQUFRLFFBQVEsS0FBSyxRQUFTLFlBQzlCLFFBQVEsS0FBSyxRQUFRLFlBQ3JCLFVBQVUsUUFBUSxRQUNsQixPQUFRLFFBQVEsS0FBSyxTQUFVLFlBQy9CLFFBQVEsS0FBSyxTQUFTLFFBQ3RCLFVBQVU7QUFFZDtBQUVPLGFBQU0sa0JBQWtCLENBQUksTUFBYyxTQUE4QjtBQUM3RSxTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsTUFDSixLQUFLO0FBQUEsTUFDTCxTQUFTLFlBQVksSUFBSTtBQUFBLE1BQ3pCO0FBQUEsSUFDRjtBQUFBLElBQ0E7QUFBQSxFQUNGO0FBQ0Y7IiwibmFtZXMiOltdfQ==