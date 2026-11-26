export default (name) => {
  const fans = [
    "temperature_fan",
    "controller_fan",
    "heater_fan",
    "power_fan",
    "fan_generic",
    "fan"
  ];
  const sensors = [
    "temperature_sensor",
    "temperature_probe",
    "tmc2240",
    "z_thermal_adjust"
  ];
  const heaters = [
    "heater_generic",
    "extruder"
  ];
  const beds = [
    "heater_bed"
  ];
  if (fans.some((s) => name.startsWith(s))) return "fan";
  if (sensors.some((s) => name.startsWith(s))) return "sensor";
  if (heaters.some((s) => name.startsWith(s))) return "heater";
  if (beds.some((s) => name.startsWith(s))) return "bed";
  return "";
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdldC1rbGlwcGVyLXR5cGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBNYXAgb2JqZWN0IHByZWZpeGVzIGFuZCBuYW1lcyB0byB0aGVpciBnZW5lcmljIHR5cGVzLlxuICogSS5lLiwgdGVtcGVyYXR1cmVfZmFucyBhbmQgaGVhdGVyX2ZhbnMgYXJlIGJvdGggZmFucy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgKG5hbWU6IHN0cmluZykgPT4ge1xuICBjb25zdCBmYW5zID0gW1xuICAgICd0ZW1wZXJhdHVyZV9mYW4nLFxuICAgICdjb250cm9sbGVyX2ZhbicsXG4gICAgJ2hlYXRlcl9mYW4nLFxuICAgICdwb3dlcl9mYW4nLFxuICAgICdmYW5fZ2VuZXJpYycsXG4gICAgJ2ZhbidcbiAgXVxuXG4gIGNvbnN0IHNlbnNvcnMgPSBbXG4gICAgJ3RlbXBlcmF0dXJlX3NlbnNvcicsXG4gICAgJ3RlbXBlcmF0dXJlX3Byb2JlJyxcbiAgICAndG1jMjI0MCcsXG4gICAgJ3pfdGhlcm1hbF9hZGp1c3QnXG4gIF1cblxuICBjb25zdCBoZWF0ZXJzID0gW1xuICAgICdoZWF0ZXJfZ2VuZXJpYycsXG4gICAgJ2V4dHJ1ZGVyJ1xuICBdXG5cbiAgY29uc3QgYmVkcyA9IFtcbiAgICAnaGVhdGVyX2JlZCdcbiAgXVxuXG4gIGlmIChmYW5zLnNvbWUocyA9PiBuYW1lLnN0YXJ0c1dpdGgocykpKSByZXR1cm4gJ2ZhbidcbiAgaWYgKHNlbnNvcnMuc29tZShzID0+IG5hbWUuc3RhcnRzV2l0aChzKSkpIHJldHVybiAnc2Vuc29yJ1xuICBpZiAoaGVhdGVycy5zb21lKHMgPT4gbmFtZS5zdGFydHNXaXRoKHMpKSkgcmV0dXJuICdoZWF0ZXInXG4gIGlmIChiZWRzLnNvbWUocyA9PiBuYW1lLnN0YXJ0c1dpdGgocykpKSByZXR1cm4gJ2JlZCdcbiAgcmV0dXJuICcnXG59XG4iXSwibWFwcGluZ3MiOiJBQUlBLGVBQWUsQ0FBQyxTQUFpQjtBQUMvQixRQUFNLE9BQU87QUFBQSxJQUNYO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGO0FBRUEsUUFBTSxVQUFVO0FBQUEsSUFDZDtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0Y7QUFFQSxRQUFNLFVBQVU7QUFBQSxJQUNkO0FBQUEsSUFDQTtBQUFBLEVBQ0Y7QUFFQSxRQUFNLE9BQU87QUFBQSxJQUNYO0FBQUEsRUFDRjtBQUVBLE1BQUksS0FBSyxLQUFLLE9BQUssS0FBSyxXQUFXLENBQUMsQ0FBQyxFQUFHLFFBQU87QUFDL0MsTUFBSSxRQUFRLEtBQUssT0FBSyxLQUFLLFdBQVcsQ0FBQyxDQUFDLEVBQUcsUUFBTztBQUNsRCxNQUFJLFFBQVEsS0FBSyxPQUFLLEtBQUssV0FBVyxDQUFDLENBQUMsRUFBRyxRQUFPO0FBQ2xELE1BQUksS0FBSyxLQUFLLE9BQUssS0FBSyxXQUFXLENBQUMsQ0FBQyxFQUFHLFFBQU87QUFDL0MsU0FBTztBQUNUOyIsIm5hbWVzIjpbXX0=