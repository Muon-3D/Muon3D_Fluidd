export const defaultState = () => {
  return {
    moves: [],
    layers: [],
    parts: [],
    file: void 0,
    maxFlow: null,
    parserProgress: 0,
    parserWorker: null,
    viewer: {
      showCurrentLayer: true,
      showNextLayer: false,
      showPreviousLayer: false,
      showMoves: true,
      showExtrusions: true,
      showRetractions: true,
      showParts: true,
      followProgress: false
    }
  };
};
export const state = defaultState();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0YXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgR2NvZGVQcmV2aWV3U3RhdGUgfSBmcm9tICcuL3R5cGVzJ1xuXG5leHBvcnQgY29uc3QgZGVmYXVsdFN0YXRlID0gKCk6IEdjb2RlUHJldmlld1N0YXRlID0+IHtcbiAgcmV0dXJuIHtcbiAgICBtb3ZlczogW10sXG4gICAgbGF5ZXJzOiBbXSxcbiAgICBwYXJ0czogW10sXG4gICAgZmlsZTogdW5kZWZpbmVkLFxuICAgIG1heEZsb3c6IG51bGwsXG4gICAgcGFyc2VyUHJvZ3Jlc3M6IDAsXG4gICAgcGFyc2VyV29ya2VyOiBudWxsLFxuXG4gICAgdmlld2VyOiB7XG4gICAgICBzaG93Q3VycmVudExheWVyOiB0cnVlLFxuICAgICAgc2hvd05leHRMYXllcjogZmFsc2UsXG4gICAgICBzaG93UHJldmlvdXNMYXllcjogZmFsc2UsXG4gICAgICBzaG93TW92ZXM6IHRydWUsXG4gICAgICBzaG93RXh0cnVzaW9uczogdHJ1ZSxcbiAgICAgIHNob3dSZXRyYWN0aW9uczogdHJ1ZSxcbiAgICAgIHNob3dQYXJ0czogdHJ1ZSxcbiAgICAgIGZvbGxvd1Byb2dyZXNzOiBmYWxzZVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY29uc3Qgc3RhdGUgPSBkZWZhdWx0U3RhdGUoKVxuIl0sIm1hcHBpbmdzIjoiQUFFTyxhQUFNLGVBQWUsTUFBeUI7QUFDbkQsU0FBTztBQUFBLElBQ0wsT0FBTyxDQUFDO0FBQUEsSUFDUixRQUFRLENBQUM7QUFBQSxJQUNULE9BQU8sQ0FBQztBQUFBLElBQ1IsTUFBTTtBQUFBLElBQ04sU0FBUztBQUFBLElBQ1QsZ0JBQWdCO0FBQUEsSUFDaEIsY0FBYztBQUFBLElBRWQsUUFBUTtBQUFBLE1BQ04sa0JBQWtCO0FBQUEsTUFDbEIsZUFBZTtBQUFBLE1BQ2YsbUJBQW1CO0FBQUEsTUFDbkIsV0FBVztBQUFBLE1BQ1gsZ0JBQWdCO0FBQUEsTUFDaEIsaUJBQWlCO0FBQUEsTUFDakIsV0FBVztBQUFBLE1BQ1gsZ0JBQWdCO0FBQUEsSUFDbEI7QUFBQSxFQUNGO0FBQ0Y7QUFFTyxhQUFNLFFBQVEsYUFBYTsiLCJuYW1lcyI6W119