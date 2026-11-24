import { transformMesh } from "/src/util/transform-mesh.ts";
export const getters = {
  /**
   * Has this printer been configured for bed meshes?
   */
  getSupportsBedMesh: (state, getters2, rootState, rootGetters) => {
    return rootGetters["printer/getPrinterSettings"]("bed_mesh") !== void 0;
  },
  getLegacyBedMeshProfiles: (state, getters2, rootState, rootGetters) => {
    const klipperProfiles = {};
    const config = rootGetters["printer/getPrinterConfig"]();
    const meshProfileKeys = Object.keys(config).filter((key) => key.startsWith("bed_mesh "));
    for (const key of meshProfileKeys) {
      const name = key.split(" ").splice(1).join(" ");
      const legacyKlipperProfile = config[key];
      const profile = {
        points: legacyKlipperProfile.points.split("\n").filter((x) => x.length).map((x) => x.split(",").map(Number)),
        mesh_params: {
          algo: legacyKlipperProfile.algo,
          max_x: +legacyKlipperProfile.max_x,
          max_y: +legacyKlipperProfile.max_y,
          mesh_x_pps: +legacyKlipperProfile.mesh_x_pps,
          mesh_y_pps: +legacyKlipperProfile.mesh_y_pps,
          min_x: +legacyKlipperProfile.min_x,
          min_y: +legacyKlipperProfile.min_y,
          tension: +legacyKlipperProfile.tension,
          x_count: +legacyKlipperProfile.x_count,
          y_count: +legacyKlipperProfile.y_count
        }
      };
      klipperProfiles[name] = profile;
    }
    return klipperProfiles;
  },
  getBedMeshProfiles: (state, getters2, rootState) => {
    const profiles = [];
    const bedMesh = rootState.printer.printer.bed_mesh;
    const klipperProfiles = bedMesh.profiles ?? getters2.getLegacyBedMeshProfiles;
    for (const [name, profile] of Object.entries(klipperProfiles)) {
      const points = profile.points.flatMap((x) => x);
      const min = Math.min(...points);
      const max = Math.max(...points);
      profiles.push({
        name,
        active: name === bedMesh.profile_name,
        adaptive: false,
        range: Math.abs(min - max)
      });
    }
    if (bedMesh.profile_name && !(bedMesh.profile_name in klipperProfiles)) {
      const min = Math.min(...bedMesh.mesh_matrix?.flat() ?? [0]);
      const max = Math.max(...bedMesh.mesh_matrix?.flat() ?? [0]);
      profiles.push({
        name: bedMesh.profile_name,
        active: true,
        adaptive: true,
        range: max - min
      });
    }
    return profiles.sort(
      (a, b) => a.name === "default" ? -1 : b.name === "default" ? 1 : a.name.localeCompare(b.name)
    );
  },
  /**
   * Returns the current mesh, in a usable format for echarts.
   */
  getCurrentMeshData: (state, getters2, rootState) => {
    const bedMesh = rootState.printer.printer.bed_mesh;
    return {
      mesh_matrix: transformMesh(bedMesh, "mesh_matrix"),
      probed_matrix: transformMesh(bedMesh, "probed_matrix"),
      mesh_matrix_flat: transformMesh(bedMesh, "mesh_matrix", true),
      probed_matrix_flat: transformMesh(bedMesh, "probed_matrix", true)
    };
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdldHRlcnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBHZXR0ZXJUcmVlIH0gZnJvbSAndnVleCdcbmltcG9ydCB0eXBlIHtcbiAgTWVzaFN0YXRlLFxuICBBcHBNZXNoZXMsXG4gIEtsaXBwZXJCZWRNZXNoLFxuICBLbGlwcGVyQmVkTWVzaFByb2ZpbGUsXG4gIExlZ2FjeUtsaXBwZXJCZWRNZXNoUHJvZmlsZSxcbiAgQmVkTWVzaFByb2ZpbGVMaXN0RW50cnlcbn0gZnJvbSAnLi90eXBlcydcbmltcG9ydCB0eXBlIHsgUm9vdFN0YXRlIH0gZnJvbSAnLi4vdHlwZXMnXG5pbXBvcnQgeyB0cmFuc2Zvcm1NZXNoIH0gZnJvbSAnQC91dGlsL3RyYW5zZm9ybS1tZXNoJ1xuXG5leHBvcnQgY29uc3QgZ2V0dGVyczogR2V0dGVyVHJlZTxNZXNoU3RhdGUsIFJvb3RTdGF0ZT4gPSB7XG5cbiAgLyoqXG4gICAqIEhhcyB0aGlzIHByaW50ZXIgYmVlbiBjb25maWd1cmVkIGZvciBiZWQgbWVzaGVzP1xuICAgKi9cbiAgZ2V0U3VwcG9ydHNCZWRNZXNoOiAoc3RhdGUsIGdldHRlcnMsIHJvb3RTdGF0ZSwgcm9vdEdldHRlcnMpID0+IHtcbiAgICByZXR1cm4gcm9vdEdldHRlcnNbJ3ByaW50ZXIvZ2V0UHJpbnRlclNldHRpbmdzJ10oJ2JlZF9tZXNoJykgIT09IHVuZGVmaW5lZFxuICB9LFxuXG4gIGdldExlZ2FjeUJlZE1lc2hQcm9maWxlczogKHN0YXRlLCBnZXR0ZXJzLCByb290U3RhdGUsIHJvb3RHZXR0ZXJzKSA9PiB7XG4gICAgY29uc3Qga2xpcHBlclByb2ZpbGVzID0ge30gYXMgUmVjb3JkPHN0cmluZywgS2xpcHBlckJlZE1lc2hQcm9maWxlPlxuXG4gICAgY29uc3QgY29uZmlnID0gcm9vdEdldHRlcnNbJ3ByaW50ZXIvZ2V0UHJpbnRlckNvbmZpZyddKClcbiAgICBjb25zdCBtZXNoUHJvZmlsZUtleXMgPSBPYmplY3Qua2V5cyhjb25maWcpXG4gICAgICAuZmlsdGVyKGtleSA9PiBrZXkuc3RhcnRzV2l0aCgnYmVkX21lc2ggJykpXG5cbiAgICBmb3IgKGNvbnN0IGtleSBvZiBtZXNoUHJvZmlsZUtleXMpIHtcbiAgICAgIGNvbnN0IG5hbWUgPSBrZXkuc3BsaXQoJyAnKS5zcGxpY2UoMSkuam9pbignICcpXG4gICAgICBjb25zdCBsZWdhY3lLbGlwcGVyUHJvZmlsZSA9IGNvbmZpZ1trZXldIGFzIExlZ2FjeUtsaXBwZXJCZWRNZXNoUHJvZmlsZVxuXG4gICAgICBjb25zdCBwcm9maWxlOiBLbGlwcGVyQmVkTWVzaFByb2ZpbGUgPSB7XG4gICAgICAgIHBvaW50czogbGVnYWN5S2xpcHBlclByb2ZpbGUucG9pbnRzLnNwbGl0KCdcXG4nKVxuICAgICAgICAgIC5maWx0ZXIoeCA9PiB4Lmxlbmd0aClcbiAgICAgICAgICAubWFwKHggPT4geC5zcGxpdCgnLCcpLm1hcChOdW1iZXIpKSxcbiAgICAgICAgbWVzaF9wYXJhbXM6IHtcbiAgICAgICAgICBhbGdvOiBsZWdhY3lLbGlwcGVyUHJvZmlsZS5hbGdvLFxuICAgICAgICAgIG1heF94OiArbGVnYWN5S2xpcHBlclByb2ZpbGUubWF4X3gsXG4gICAgICAgICAgbWF4X3k6ICtsZWdhY3lLbGlwcGVyUHJvZmlsZS5tYXhfeSxcbiAgICAgICAgICBtZXNoX3hfcHBzOiArbGVnYWN5S2xpcHBlclByb2ZpbGUubWVzaF94X3BwcyxcbiAgICAgICAgICBtZXNoX3lfcHBzOiArbGVnYWN5S2xpcHBlclByb2ZpbGUubWVzaF95X3BwcyxcbiAgICAgICAgICBtaW5feDogK2xlZ2FjeUtsaXBwZXJQcm9maWxlLm1pbl94LFxuICAgICAgICAgIG1pbl95OiArbGVnYWN5S2xpcHBlclByb2ZpbGUubWluX3ksXG4gICAgICAgICAgdGVuc2lvbjogK2xlZ2FjeUtsaXBwZXJQcm9maWxlLnRlbnNpb24sXG4gICAgICAgICAgeF9jb3VudDogK2xlZ2FjeUtsaXBwZXJQcm9maWxlLnhfY291bnQsXG4gICAgICAgICAgeV9jb3VudDogK2xlZ2FjeUtsaXBwZXJQcm9maWxlLnlfY291bnRcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBrbGlwcGVyUHJvZmlsZXNbbmFtZV0gPSBwcm9maWxlXG4gICAgfVxuXG4gICAgcmV0dXJuIGtsaXBwZXJQcm9maWxlc1xuICB9LFxuXG4gIGdldEJlZE1lc2hQcm9maWxlczogKHN0YXRlLCBnZXR0ZXJzLCByb290U3RhdGUpOiBCZWRNZXNoUHJvZmlsZUxpc3RFbnRyeVtdID0+IHtcbiAgICBjb25zdCBwcm9maWxlczogQmVkTWVzaFByb2ZpbGVMaXN0RW50cnlbXSA9IFtdXG4gICAgY29uc3QgYmVkTWVzaCA9IHJvb3RTdGF0ZS5wcmludGVyLnByaW50ZXIuYmVkX21lc2ggYXMgS2xpcHBlckJlZE1lc2hcblxuICAgIGNvbnN0IGtsaXBwZXJQcm9maWxlcyA9IGJlZE1lc2gucHJvZmlsZXMgPz8gZ2V0dGVycy5nZXRMZWdhY3lCZWRNZXNoUHJvZmlsZXMgYXMgUmVjb3JkPHN0cmluZywgS2xpcHBlckJlZE1lc2hQcm9maWxlPlxuXG4gICAgZm9yIChjb25zdCBbbmFtZSwgcHJvZmlsZV0gb2YgT2JqZWN0LmVudHJpZXMoa2xpcHBlclByb2ZpbGVzKSkge1xuICAgICAgY29uc3QgcG9pbnRzID0gcHJvZmlsZS5wb2ludHMuZmxhdE1hcCh4ID0+IHgpXG4gICAgICBjb25zdCBtaW4gPSBNYXRoLm1pbiguLi5wb2ludHMpXG4gICAgICBjb25zdCBtYXggPSBNYXRoLm1heCguLi5wb2ludHMpXG5cbiAgICAgIHByb2ZpbGVzLnB1c2goe1xuICAgICAgICBuYW1lLFxuICAgICAgICBhY3RpdmU6IG5hbWUgPT09IGJlZE1lc2gucHJvZmlsZV9uYW1lLFxuICAgICAgICBhZGFwdGl2ZTogZmFsc2UsXG4gICAgICAgIHJhbmdlOiBNYXRoLmFicyhtaW4gLSBtYXgpXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmIChiZWRNZXNoLnByb2ZpbGVfbmFtZSAmJiAhKGJlZE1lc2gucHJvZmlsZV9uYW1lIGluIGtsaXBwZXJQcm9maWxlcykpIHtcbiAgICAgIGNvbnN0IG1pbiA9IE1hdGgubWluKC4uLihiZWRNZXNoLm1lc2hfbWF0cml4Py5mbGF0KCkgPz8gWzBdKSlcbiAgICAgIGNvbnN0IG1heCA9IE1hdGgubWF4KC4uLihiZWRNZXNoLm1lc2hfbWF0cml4Py5mbGF0KCkgPz8gWzBdKSlcblxuICAgICAgcHJvZmlsZXMucHVzaCh7XG4gICAgICAgIG5hbWU6IGJlZE1lc2gucHJvZmlsZV9uYW1lLFxuICAgICAgICBhY3RpdmU6IHRydWUsXG4gICAgICAgIGFkYXB0aXZlOiB0cnVlLFxuICAgICAgICByYW5nZTogbWF4IC0gbWluXG4gICAgICB9KVxuICAgIH1cblxuICAgIHJldHVybiBwcm9maWxlcy5zb3J0KChhLCBiKSA9PlxuICAgICAgYS5uYW1lID09PSAnZGVmYXVsdCdcbiAgICAgICAgPyAtMVxuICAgICAgICA6IChcbiAgICAgICAgICAgIGIubmFtZSA9PT0gJ2RlZmF1bHQnXG4gICAgICAgICAgICAgID8gMVxuICAgICAgICAgICAgICA6IGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSlcbiAgICAgICAgICApXG4gICAgKVxuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IG1lc2gsIGluIGEgdXNhYmxlIGZvcm1hdCBmb3IgZWNoYXJ0cy5cbiAgICovXG4gIGdldEN1cnJlbnRNZXNoRGF0YTogKHN0YXRlLCBnZXR0ZXJzLCByb290U3RhdGUpOiBBcHBNZXNoZXMgPT4ge1xuICAgIGNvbnN0IGJlZE1lc2ggPSByb290U3RhdGUucHJpbnRlci5wcmludGVyLmJlZF9tZXNoIGFzIEtsaXBwZXJCZWRNZXNoXG5cbiAgICByZXR1cm4ge1xuICAgICAgbWVzaF9tYXRyaXg6IHRyYW5zZm9ybU1lc2goYmVkTWVzaCwgJ21lc2hfbWF0cml4JyksXG4gICAgICBwcm9iZWRfbWF0cml4OiB0cmFuc2Zvcm1NZXNoKGJlZE1lc2gsICdwcm9iZWRfbWF0cml4JyksXG4gICAgICBtZXNoX21hdHJpeF9mbGF0OiB0cmFuc2Zvcm1NZXNoKGJlZE1lc2gsICdtZXNoX21hdHJpeCcsIHRydWUpLFxuICAgICAgcHJvYmVkX21hdHJpeF9mbGF0OiB0cmFuc2Zvcm1NZXNoKGJlZE1lc2gsICdwcm9iZWRfbWF0cml4JywgdHJ1ZSlcbiAgICB9XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6IkFBVUEsU0FBUyxxQkFBcUI7QUFFdkIsYUFBTSxVQUE0QztBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS3ZELG9CQUFvQixDQUFDLE9BQU9BLFVBQVMsV0FBVyxnQkFBZ0I7QUFDOUQsV0FBTyxZQUFZLDRCQUE0QixFQUFFLFVBQVUsTUFBTTtBQUFBLEVBQ25FO0FBQUEsRUFFQSwwQkFBMEIsQ0FBQyxPQUFPQSxVQUFTLFdBQVcsZ0JBQWdCO0FBQ3BFLFVBQU0sa0JBQWtCLENBQUM7QUFFekIsVUFBTSxTQUFTLFlBQVksMEJBQTBCLEVBQUU7QUFDdkQsVUFBTSxrQkFBa0IsT0FBTyxLQUFLLE1BQU0sRUFDdkMsT0FBTyxTQUFPLElBQUksV0FBVyxXQUFXLENBQUM7QUFFNUMsZUFBVyxPQUFPLGlCQUFpQjtBQUNqQyxZQUFNLE9BQU8sSUFBSSxNQUFNLEdBQUcsRUFBRSxPQUFPLENBQUMsRUFBRSxLQUFLLEdBQUc7QUFDOUMsWUFBTSx1QkFBdUIsT0FBTyxHQUFHO0FBRXZDLFlBQU0sVUFBaUM7QUFBQSxRQUNyQyxRQUFRLHFCQUFxQixPQUFPLE1BQU0sSUFBSSxFQUMzQyxPQUFPLE9BQUssRUFBRSxNQUFNLEVBQ3BCLElBQUksT0FBSyxFQUFFLE1BQU0sR0FBRyxFQUFFLElBQUksTUFBTSxDQUFDO0FBQUEsUUFDcEMsYUFBYTtBQUFBLFVBQ1gsTUFBTSxxQkFBcUI7QUFBQSxVQUMzQixPQUFPLENBQUMscUJBQXFCO0FBQUEsVUFDN0IsT0FBTyxDQUFDLHFCQUFxQjtBQUFBLFVBQzdCLFlBQVksQ0FBQyxxQkFBcUI7QUFBQSxVQUNsQyxZQUFZLENBQUMscUJBQXFCO0FBQUEsVUFDbEMsT0FBTyxDQUFDLHFCQUFxQjtBQUFBLFVBQzdCLE9BQU8sQ0FBQyxxQkFBcUI7QUFBQSxVQUM3QixTQUFTLENBQUMscUJBQXFCO0FBQUEsVUFDL0IsU0FBUyxDQUFDLHFCQUFxQjtBQUFBLFVBQy9CLFNBQVMsQ0FBQyxxQkFBcUI7QUFBQSxRQUNqQztBQUFBLE1BQ0Y7QUFFQSxzQkFBZ0IsSUFBSSxJQUFJO0FBQUEsSUFDMUI7QUFFQSxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsb0JBQW9CLENBQUMsT0FBT0EsVUFBUyxjQUF5QztBQUM1RSxVQUFNLFdBQXNDLENBQUM7QUFDN0MsVUFBTSxVQUFVLFVBQVUsUUFBUSxRQUFRO0FBRTFDLFVBQU0sa0JBQWtCLFFBQVEsWUFBWUEsU0FBUTtBQUVwRCxlQUFXLENBQUMsTUFBTSxPQUFPLEtBQUssT0FBTyxRQUFRLGVBQWUsR0FBRztBQUM3RCxZQUFNLFNBQVMsUUFBUSxPQUFPLFFBQVEsT0FBSyxDQUFDO0FBQzVDLFlBQU0sTUFBTSxLQUFLLElBQUksR0FBRyxNQUFNO0FBQzlCLFlBQU0sTUFBTSxLQUFLLElBQUksR0FBRyxNQUFNO0FBRTlCLGVBQVMsS0FBSztBQUFBLFFBQ1o7QUFBQSxRQUNBLFFBQVEsU0FBUyxRQUFRO0FBQUEsUUFDekIsVUFBVTtBQUFBLFFBQ1YsT0FBTyxLQUFLLElBQUksTUFBTSxHQUFHO0FBQUEsTUFDM0IsQ0FBQztBQUFBLElBQ0g7QUFFQSxRQUFJLFFBQVEsZ0JBQWdCLEVBQUUsUUFBUSxnQkFBZ0Isa0JBQWtCO0FBQ3RFLFlBQU0sTUFBTSxLQUFLLElBQUksR0FBSSxRQUFRLGFBQWEsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFFO0FBQzVELFlBQU0sTUFBTSxLQUFLLElBQUksR0FBSSxRQUFRLGFBQWEsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFFO0FBRTVELGVBQVMsS0FBSztBQUFBLFFBQ1osTUFBTSxRQUFRO0FBQUEsUUFDZCxRQUFRO0FBQUEsUUFDUixVQUFVO0FBQUEsUUFDVixPQUFPLE1BQU07QUFBQSxNQUNmLENBQUM7QUFBQSxJQUNIO0FBRUEsV0FBTyxTQUFTO0FBQUEsTUFBSyxDQUFDLEdBQUcsTUFDdkIsRUFBRSxTQUFTLFlBQ1AsS0FFRSxFQUFFLFNBQVMsWUFDUCxJQUNBLEVBQUUsS0FBSyxjQUFjLEVBQUUsSUFBSTtBQUFBLElBRXZDO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0Esb0JBQW9CLENBQUMsT0FBT0EsVUFBUyxjQUF5QjtBQUM1RCxVQUFNLFVBQVUsVUFBVSxRQUFRLFFBQVE7QUFFMUMsV0FBTztBQUFBLE1BQ0wsYUFBYSxjQUFjLFNBQVMsYUFBYTtBQUFBLE1BQ2pELGVBQWUsY0FBYyxTQUFTLGVBQWU7QUFBQSxNQUNyRCxrQkFBa0IsY0FBYyxTQUFTLGVBQWUsSUFBSTtBQUFBLE1BQzVELG9CQUFvQixjQUFjLFNBQVMsaUJBQWlCLElBQUk7QUFBQSxJQUNsRTtBQUFBLEVBQ0Y7QUFDRjsiLCJuYW1lcyI6WyJnZXR0ZXJzIl19