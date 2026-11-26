export const defaultState = () => {
  return {
    consoleCommand: "",
    consoleEntryCount: 0,
    console: [],
    gcodeHelp: {},
    commandHistory: [],
    autoScroll: true,
    lastCleared: 0,
    promptDialog: {
      open: false,
      items: [],
      footerButtons: []
    },
    consoleFilters: [],
    consoleFiltersRegexp: []
  };
};
export const state = defaultState();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0YXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgQ29uc29sZVN0YXRlIH0gZnJvbSAnLi90eXBlcydcblxuZXhwb3J0IGNvbnN0IGRlZmF1bHRTdGF0ZSA9ICgpOiBDb25zb2xlU3RhdGUgPT4ge1xuICByZXR1cm4ge1xuICAgIGNvbnNvbGVDb21tYW5kOiAnJyxcbiAgICBjb25zb2xlRW50cnlDb3VudDogMCxcbiAgICBjb25zb2xlOiBbXSxcbiAgICBnY29kZUhlbHA6IHt9LFxuICAgIGNvbW1hbmRIaXN0b3J5OiBbXSxcbiAgICBhdXRvU2Nyb2xsOiB0cnVlLFxuICAgIGxhc3RDbGVhcmVkOiAwLFxuICAgIHByb21wdERpYWxvZzoge1xuICAgICAgb3BlbjogZmFsc2UsXG4gICAgICBpdGVtczogW10sXG4gICAgICBmb290ZXJCdXR0b25zOiBbXVxuICAgIH0sXG4gICAgY29uc29sZUZpbHRlcnM6IFtdLFxuICAgIGNvbnNvbGVGaWx0ZXJzUmVnZXhwOiBbXVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBzdGF0ZSA9IGRlZmF1bHRTdGF0ZSgpXG4iXSwibWFwcGluZ3MiOiJBQUVPLGFBQU0sZUFBZSxNQUFvQjtBQUM5QyxTQUFPO0FBQUEsSUFDTCxnQkFBZ0I7QUFBQSxJQUNoQixtQkFBbUI7QUFBQSxJQUNuQixTQUFTLENBQUM7QUFBQSxJQUNWLFdBQVcsQ0FBQztBQUFBLElBQ1osZ0JBQWdCLENBQUM7QUFBQSxJQUNqQixZQUFZO0FBQUEsSUFDWixhQUFhO0FBQUEsSUFDYixjQUFjO0FBQUEsTUFDWixNQUFNO0FBQUEsTUFDTixPQUFPLENBQUM7QUFBQSxNQUNSLGVBQWUsQ0FBQztBQUFBLElBQ2xCO0FBQUEsSUFDQSxnQkFBZ0IsQ0FBQztBQUFBLElBQ2pCLHNCQUFzQixDQUFDO0FBQUEsRUFDekI7QUFDRjtBQUVPLGFBQU0sUUFBUSxhQUFhOyIsIm5hbWVzIjpbXX0=