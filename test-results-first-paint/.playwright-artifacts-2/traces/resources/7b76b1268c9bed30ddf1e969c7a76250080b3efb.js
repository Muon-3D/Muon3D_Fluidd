import Vue from "/.vite-e2e/4291/deps/vue.js?v=9b9fafc7";
import { Globals, Waits } from "/src/globals.ts";
import { consola } from "/.vite-e2e/4291/deps/consola.js?v=9b9fafc7";
import { trackScript } from "/src/services/control/safe-move.ts";
const baseEmit = (method, options) => {
  if (!Vue.$socket) {
    consola.warn("Socket emit denied, socket not ready.", method, options);
    return;
  }
  return Vue.$socket.emit(method, options);
};
export const SocketActions = {
  async machineServicesRestart(service) {
    const wait = Waits.onServiceRestart;
    baseEmit(
      "machine.services.restart",
      {
        dispatch: "void",
        params: { service },
        wait
      }
    );
  },
  async machineServicesStart(service) {
    const wait = Waits.onServiceStart;
    baseEmit(
      "machine.services.start",
      {
        dispatch: "void",
        params: { service },
        wait
      }
    );
  },
  async machineServicesStop(service) {
    const wait = Waits.onServiceStop;
    baseEmit(
      "machine.services.stop",
      {
        dispatch: "void",
        params: { service },
        wait
      }
    );
  },
  async machineReboot() {
    baseEmit(
      "machine.reboot",
      {
        dispatch: "void"
      }
    );
  },
  async machineShutdown() {
    baseEmit(
      "machine.shutdown",
      {
        dispatch: "void"
      }
    );
  },
  async serverMuonGetProtection() {
    baseEmit(
      "server.muon.get_protection",
      {
        dispatch: "protection/onStatus"
      }
    );
  },
  async machineUpdateStatus(refresh = false) {
    baseEmit(
      "machine.update.status",
      {
        dispatch: "version/onUpdateStatus",
        params: { refresh },
        wait: Waits.onVersionRefresh
      }
    );
  },
  async machineUpdateRefresh(name) {
    baseEmit(
      "machine.update.refresh",
      {
        dispatch: "version/onUpdateStatus",
        params: { name },
        wait: Waits.onVersionRefresh
      }
    );
  },
  async machineUpdateRecover(name, hard = false) {
    const dispatch = name === "moonraker" ? "version/onUpdatedMoonraker" : name === "klipper" ? "version/onUpdatedKlipper" : "version/onUpdatedClient";
    baseEmit(
      "machine.update.recover",
      {
        dispatch,
        params: { name, hard }
      }
    );
  },
  async machineUpdateMoonraker() {
    baseEmit(
      "machine.update.moonraker",
      {
        dispatch: "version/onUpdatedMoonraker"
      }
    );
  },
  async machineUpdateKlipper() {
    baseEmit(
      "machine.update.klipper",
      {
        dispatch: "version/onUpdatedKlipper",
        params: {
          include_deps: true
        }
      }
    );
  },
  async machineUpdateClient(name) {
    const dispatch = name === "fluidd" ? "version/onUpdatedFluidd" : "version/onUpdatedClient";
    baseEmit(
      "machine.update.client",
      {
        dispatch,
        params: { name }
      }
    );
  },
  async machineUpdateSystem() {
    baseEmit(
      "machine.update.system",
      {
        dispatch: "version/onUpdatedSystem"
      }
    );
  },
  async machineUpdateAll() {
    baseEmit(
      "machine.update.full",
      {
        dispatch: "version/onUpdatedAll"
      }
    );
  },
  async machineProcStats() {
    baseEmit(
      "machine.proc_stats",
      {
        dispatch: "server/onMachineProcStats"
      }
    );
  },
  async machineSystemInfo() {
    baseEmit(
      "machine.system_info",
      {
        dispatch: "server/onMachineSystemInfo"
      }
    );
  },
  async machineDevicePowerDevices() {
    baseEmit(
      "machine.device_power.devices",
      {
        dispatch: "power/onInit"
      }
    );
  },
  async machineDevicePowerStatus(device) {
    baseEmit(
      "machine.device_power.status",
      {
        dispatch: "power/onStatus",
        params: { [device]: null }
      }
    );
  },
  async machineDevicePowerToggle(device, state, wait) {
    const emit = state === "on" ? "machine.device_power.on" : "machine.device_power.off";
    baseEmit(
      emit,
      {
        dispatch: "power/onToggle",
        params: { [device]: null },
        wait
      }
    );
  },
  async machinePeripheralsUsb() {
    baseEmit(
      "machine.peripherals.usb",
      {
        dispatch: "server/onMachinePeripherals",
        wait: Waits.onMachinePeripheralsUsb
      }
    );
  },
  async machinePeripheralsSerial() {
    baseEmit(
      "machine.peripherals.serial",
      {
        dispatch: "server/onMachinePeripherals",
        wait: Waits.onMachinePeripheralsSerial
      }
    );
  },
  async machinePeripheralsVideo() {
    baseEmit(
      "machine.peripherals.video",
      {
        dispatch: "server/onMachinePeripherals",
        wait: Waits.onMachinePeripheralsVideo
      }
    );
  },
  async machinePeripheralsCanbus(canbusInterface) {
    const wait = `${Waits.onMachinePeripheralsCanbus}/${canbusInterface}`;
    baseEmit(
      "machine.peripherals.canbus",
      {
        dispatch: "server/onMachinePeripheralsCanbus",
        params: {
          interface: canbusInterface
        },
        wait
      }
    );
  },
  async machineTimelapseSetSettings(settings, wait) {
    baseEmit(
      "machine.timelapse.post_settings",
      {
        dispatch: "timelapse/onSettings",
        params: settings,
        wait
      }
    );
  },
  async machineTimelapseSaveFrames(wait) {
    baseEmit(
      "machine.timelapse.saveframes",
      {
        wait
      }
    );
  },
  async machineTimelapseRender() {
    baseEmit("machine.timelapse.render", {});
  },
  async printerInfo() {
    baseEmit(
      "printer.info",
      {
        dispatch: "printer/onPrinterInfo"
      }
    );
  },
  async printerRestart() {
    baseEmit(
      "printer.restart",
      {
        dispatch: "void",
        wait: Waits.onKlipperRestart
      }
    );
  },
  async printerFirmwareRestart() {
    baseEmit(
      "printer.firmware_restart",
      {
        dispatch: "void",
        wait: Waits.onKlipperFirmwareRestart
      }
    );
  },
  async printerQueryEndstops() {
    return baseEmit(
      "printer.query_endstops.status",
      {
        dispatch: "printer/onQueryEndstops",
        wait: Waits.onQueryEndstops
      }
    );
  },
  async printerObjectsList() {
    baseEmit(
      "printer.objects.list",
      {
        dispatch: "printer/onPrinterObjectsList"
      }
    );
  },
  async printerObjectsSubscribe(objects) {
    baseEmit(
      "printer.objects.subscribe",
      {
        dispatch: "printer/onPrinterObjectsSubscribe",
        params: {
          objects
        }
      }
    );
  },
  async printerPrintStart(path) {
    baseEmit(
      "printer.print.start",
      {
        dispatch: "void",
        params: {
          filename: path
        }
      }
    );
  },
  async printerPrintCancel() {
    baseEmit(
      "printer.print.cancel",
      {
        dispatch: "printer/onPrintCancel",
        wait: Waits.onPrintCancel
      }
    );
  },
  async printerPrintPause() {
    baseEmit(
      "printer.print.pause",
      {
        dispatch: "printer/onPrintPause",
        wait: Waits.onPrintPause
      }
    );
  },
  async printerPrintResume() {
    baseEmit(
      "printer.print.resume",
      {
        dispatch: "printer/onPrintResume",
        wait: Waits.onPrintResume
      }
    );
  },
  async printerGcodeScript(gcode, wait) {
    return trackScript(baseEmit(
      "printer.gcode.script",
      {
        dispatch: "console/onGcodeScript",
        params: {
          script: gcode
        },
        wait
      }
    ));
  },
  async printerGcodeHelp() {
    baseEmit(
      "printer.gcode.help",
      {
        dispatch: "console/onGcodeHelp"
      }
    );
  },
  async printerEmergencyStop() {
    baseEmit(
      "printer.emergency_stop",
      {
        dispatch: "void"
      }
    );
  },
  async serverInfo() {
    baseEmit(
      "server.info",
      {
        dispatch: "server/onServerInfo"
      }
    );
  },
  async identify(params) {
    baseEmit("server.connection.identify", {
      dispatch: "socket/onConnectionId",
      params
    });
  },
  async timelapseState() {
    baseEmit(
      "machine.timelapse.get_settings",
      {
        dispatch: "timelapse/onSettings"
      }
    );
    baseEmit(
      "machine.timelapse.lastframeinfo",
      {
        dispatch: "timelapse/onLastFrame"
      }
    );
  },
  async serverConfig() {
    baseEmit(
      "server.config",
      {
        dispatch: "server/onServerConfig"
      }
    );
  },
  /**
   * Writes data to moonraker's DB.
   */
  async serverWrite(key, value, namespace = Globals.MOONRAKER_DB.fluidd.NAMESPACE) {
    baseEmit(
      "server.database.post_item",
      {
        params: {
          namespace,
          key,
          value
        }
      }
    );
  },
  async serverDelete(key, namespace = Globals.MOONRAKER_DB.fluidd.NAMESPACE) {
    baseEmit(
      "server.database.delete_item",
      {
        params: {
          namespace,
          key
        }
      }
    );
  },
  async serverRead(key, namespace = Globals.MOONRAKER_DB.fluidd.NAMESPACE) {
    baseEmit(
      "server.database.get_item",
      {
        dispatch: "socket/onServerRead",
        params: {
          namespace,
          key
        }
      }
    );
  },
  async serverRestart() {
    baseEmit(
      "server.restart",
      {
        dispatch: "void"
      }
    );
  },
  async serverTemperatureStore() {
    baseEmit(
      "server.temperature_store",
      {
        dispatch: "charts/initTempStore",
        captureContext: true,
        params: {
          include_monitors: true
        }
      }
    );
  },
  async serverGcodeStore() {
    baseEmit(
      "server.gcode_store",
      {
        dispatch: "console/onGcodeStore"
      }
    );
  },
  async serverHistoryList(params) {
    baseEmit(
      "server.history.list",
      {
        dispatch: "history/onHistoryList",
        params
      }
    );
  },
  /** The jobs started since a unix time, into history/yearJobs (not the list History shows). */
  async serverHistoryYear(since, limit) {
    baseEmit(
      "server.history.list",
      {
        dispatch: "history/onYearList",
        params: { since, limit, order: "desc" }
      }
    );
  },
  async serverHistoryTotals() {
    baseEmit(
      "server.history.totals",
      {
        dispatch: "history/onHistoryTotals"
      }
    );
  },
  async serverHistoryDeleteJob(uid) {
    const params = uid === "all" ? {
      all: true
    } : { uid };
    baseEmit(
      "server.history.delete_job",
      {
        dispatch: "history/onDelete",
        params
      }
    );
  },
  async serverHistoryResetTotals() {
    baseEmit(
      "server.history.reset_totals",
      {
        dispatch: "history/onHistoryChange"
      }
    );
  },
  async serverJobQueueStatus() {
    baseEmit(
      "server.job_queue.status",
      {
        dispatch: "jobQueue/onJobQueueStatus",
        wait: Waits.onJobQueue
      }
    );
  },
  async serverJobQueuePostJob(filenames, reset) {
    baseEmit(
      "server.job_queue.post_job",
      {
        dispatch: "jobQueue/onJobQueueStatus",
        params: {
          filenames,
          reset
        },
        wait: Waits.onJobQueue
      }
    );
  },
  async serverJobQueueDeleteJobs(jobIds) {
    const params = jobIds.length > 0 && jobIds[0] === "all" ? { all: true } : { job_ids: jobIds };
    baseEmit(
      "server.job_queue.delete_job",
      {
        dispatch: "jobQueue/onJobQueueStatus",
        params,
        wait: Waits.onJobQueue
      }
    );
  },
  async serverJobQueuePause() {
    baseEmit(
      "server.job_queue.pause",
      {
        dispatch: "jobQueue/onJobQueueStatus",
        wait: Waits.onJobQueue
      }
    );
  },
  async serverJobQueueStart() {
    baseEmit(
      "server.job_queue.start",
      {
        dispatch: "jobQueue/onJobQueueStatus",
        wait: Waits.onJobQueue
      }
    );
  },
  /**
   * Loads the metadata for a given filepath.
   * Expects the full path including root.
   * Optionally pass the just the filename and path.
   */
  async serverFilesMetadata(filepath) {
    baseEmit(
      "server.files.metadata",
      {
        dispatch: "files/onFileMetaData",
        params: { filename: filepath }
      }
    );
  },
  async serverFilesMetascan(filepath) {
    baseEmit(
      "server.files.metascan",
      {
        dispatch: "files/onFileMetaData",
        params: { filename: filepath }
      }
    );
  },
  /**
   * This only requires path, but we pass root along too
   * for brevity.
   */
  async serverFilesGetDirectory(root, path) {
    const wait = `${Waits.onFileSystem}/${root}/${path}/`;
    return baseEmit(
      "server.files.get_directory",
      {
        dispatch: "files/onServerFilesGetDirectory",
        wait,
        params: { root, path, extended: true }
      }
    );
  },
  async serverFilesListRoot(root) {
    const wait = `${Waits.onFileSystem}/${root}/`;
    baseEmit(
      "server.files.list",
      {
        dispatch: "files/onServerFilesListRoot",
        wait,
        params: { root }
      }
    );
  },
  /** Moves or renames a file; answers Moonraker's result, or nothing when it refused or the socket is not up. */
  async serverFilesMove(source, dest) {
    const wait = `${Waits.onFileSystem}/${source}/`;
    return baseEmit(
      "server.files.move",
      {
        dispatch: "void",
        wait,
        params: {
          source,
          dest
        }
      }
    );
  },
  async serverFilesCopy(source, dest) {
    const wait = `${Waits.onFileSystem}/${source}/`;
    baseEmit(
      "server.files.copy",
      {
        dispatch: "void",
        wait,
        params: {
          source,
          dest
        }
      }
    );
  },
  async serverFilesZip(dest, items, store_only) {
    const wait = `${Waits.onFileSystem}/${dest}/`;
    baseEmit(
      "server.files.zip",
      {
        dispatch: "void",
        wait,
        params: {
          dest,
          items,
          store_only
        }
      }
    );
  },
  /**
   * Create a directory.
   * Root should be included in the path.
   */
  async serverFilesPostDirectory(path) {
    const wait = `${Waits.onFileSystem}/${path}/`;
    baseEmit(
      "server.files.post_directory",
      {
        dispatch: "void",
        wait,
        params: {
          path
        }
      }
    );
  },
  async serverFilesDeleteFile(path) {
    const wait = `${Waits.onFileSystem}/${path}/`;
    baseEmit(
      "server.files.delete_file",
      {
        dispatch: "void",
        wait,
        params: {
          path
        }
      }
    );
  },
  async serverFilesDeleteDirectory(path, force = false) {
    const wait = `${Waits.onFileSystem}/${path}/`;
    baseEmit(
      "server.files.delete_directory",
      {
        dispatch: "void",
        wait,
        params: {
          path,
          force
        }
      }
    );
  },
  async serverAnnouncementsList() {
    baseEmit(
      "server.announcements.list",
      {
        dispatch: "announcements/onAnnouncementsList"
      }
    );
  },
  async serverAnnouncementsDismiss(entry_id, wake_time) {
    baseEmit(
      "server.announcements.dismiss",
      {
        dispatch: "void",
        params: {
          entry_id,
          wake_time
        }
      }
    );
  },
  async serverLogsRollover(application) {
    baseEmit(
      "server.logs.rollover",
      {
        dispatch: "server/onLogsRollOver",
        params: {
          application
        }
      }
    );
  },
  async serverWebcamsList() {
    baseEmit(
      "server.webcams.list",
      {
        dispatch: "webcams/onWebcamsList"
      }
    );
  },
  async serverWebcamsWrite(webcam) {
    baseEmit(
      "server.webcams.post_item",
      {
        params: webcam
      }
    );
  },
  async serverWebcamsDelete(uid) {
    baseEmit(
      "server.webcams.delete_item",
      {
        params: {
          uid
        }
      }
    );
  },
  async serverSensorsList() {
    baseEmit(
      "server.sensors.list",
      {
        dispatch: "sensors/onSensorsList"
      }
    );
  },
  async serverSpoolmanGetSpoolId() {
    baseEmit(
      "server.spoolman.get_spool_id",
      {
        dispatch: "spoolman/onActiveSpool"
      }
    );
  },
  async serverSpoolmanPostSpoolId(spoolId) {
    baseEmit(
      "server.spoolman.post_spool_id",
      {
        params: { spool_id: spoolId },
        dispatch: "spoolman/onActiveSpool"
      }
    );
  },
  async serverSpoolmanProxyGetAvailableSpools() {
    baseEmit(
      "server.spoolman.proxy",
      {
        params: {
          request_method: "GET",
          path: "/v1/spool",
          use_v2_response: true
        },
        dispatch: "spoolman/onAvailableSpools"
      }
    );
  }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNvY2tldEFjdGlvbnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFZ1ZSBmcm9tICd2dWUnXG5pbXBvcnQgeyBHbG9iYWxzLCBXYWl0cyB9IGZyb20gJ0AvZ2xvYmFscydcbmltcG9ydCB0eXBlIHsgTm90aWZ5T3B0aW9ucyB9IGZyb20gJ0AvcGx1Z2lucy9zb2NrZXRDbGllbnQnXG5pbXBvcnQgeyBjb25zb2xhIH0gZnJvbSAnY29uc29sYSdcbmltcG9ydCB7IHRyYWNrU2NyaXB0IH0gZnJvbSAnQC9zZXJ2aWNlcy9jb250cm9sL3NhZmUtbW92ZSdcbmltcG9ydCB0eXBlIHsgVGltZWxhcHNlV3JpdGFibGVTZXR0aW5ncyB9IGZyb20gJ0Avc3RvcmUvdGltZWxhcHNlL3R5cGVzJ1xuaW1wb3J0IHR5cGUgeyBXZWJjYW1Db25maWcgfSBmcm9tICdAL3N0b3JlL3dlYmNhbXMvdHlwZXMnXG5cbmNvbnN0IGJhc2VFbWl0ID0gKG1ldGhvZDogc3RyaW5nLCBvcHRpb25zOiBOb3RpZnlPcHRpb25zKSA9PiB7XG4gIGlmICghVnVlLiRzb2NrZXQpIHtcbiAgICBjb25zb2xhLndhcm4oJ1NvY2tldCBlbWl0IGRlbmllZCwgc29ja2V0IG5vdCByZWFkeS4nLCBtZXRob2QsIG9wdGlvbnMpXG4gICAgcmV0dXJuXG4gIH1cbiAgcmV0dXJuIFZ1ZS4kc29ja2V0LmVtaXQobWV0aG9kLCBvcHRpb25zKVxufVxuXG5leHBvcnQgY29uc3QgU29ja2V0QWN0aW9ucyA9IHtcbiAgYXN5bmMgbWFjaGluZVNlcnZpY2VzUmVzdGFydCAoc2VydmljZTogc3RyaW5nKSB7XG4gICAgY29uc3Qgd2FpdCA9IFdhaXRzLm9uU2VydmljZVJlc3RhcnRcbiAgICBiYXNlRW1pdChcbiAgICAgICdtYWNoaW5lLnNlcnZpY2VzLnJlc3RhcnQnLCB7XG4gICAgICAgIGRpc3BhdGNoOiAndm9pZCcsXG4gICAgICAgIHBhcmFtczogeyBzZXJ2aWNlIH0sXG4gICAgICAgIHdhaXRcbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgbWFjaGluZVNlcnZpY2VzU3RhcnQgKHNlcnZpY2U6IHN0cmluZykge1xuICAgIGNvbnN0IHdhaXQgPSBXYWl0cy5vblNlcnZpY2VTdGFydFxuICAgIGJhc2VFbWl0KFxuICAgICAgJ21hY2hpbmUuc2VydmljZXMuc3RhcnQnLCB7XG4gICAgICAgIGRpc3BhdGNoOiAndm9pZCcsXG4gICAgICAgIHBhcmFtczogeyBzZXJ2aWNlIH0sXG4gICAgICAgIHdhaXRcbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgbWFjaGluZVNlcnZpY2VzU3RvcCAoc2VydmljZTogc3RyaW5nKSB7XG4gICAgY29uc3Qgd2FpdCA9IFdhaXRzLm9uU2VydmljZVN0b3BcbiAgICBiYXNlRW1pdChcbiAgICAgICdtYWNoaW5lLnNlcnZpY2VzLnN0b3AnLCB7XG4gICAgICAgIGRpc3BhdGNoOiAndm9pZCcsXG4gICAgICAgIHBhcmFtczogeyBzZXJ2aWNlIH0sXG4gICAgICAgIHdhaXRcbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgbWFjaGluZVJlYm9vdCAoKSB7XG4gICAgYmFzZUVtaXQoXG4gICAgICAnbWFjaGluZS5yZWJvb3QnLCB7XG4gICAgICAgIGRpc3BhdGNoOiAndm9pZCdcbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgbWFjaGluZVNodXRkb3duICgpIHtcbiAgICBiYXNlRW1pdChcbiAgICAgICdtYWNoaW5lLnNodXRkb3duJywge1xuICAgICAgICBkaXNwYXRjaDogJ3ZvaWQnXG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGFzeW5jIHNlcnZlck11b25HZXRQcm90ZWN0aW9uICgpIHtcbiAgICBiYXNlRW1pdChcbiAgICAgICdzZXJ2ZXIubXVvbi5nZXRfcHJvdGVjdGlvbicsIHtcbiAgICAgICAgZGlzcGF0Y2g6ICdwcm90ZWN0aW9uL29uU3RhdHVzJ1xuICAgICAgfVxuICAgIClcbiAgfSxcblxuICBhc3luYyBtYWNoaW5lVXBkYXRlU3RhdHVzIChyZWZyZXNoID0gZmFsc2UpIHtcbiAgICBiYXNlRW1pdChcbiAgICAgICdtYWNoaW5lLnVwZGF0ZS5zdGF0dXMnLCB7XG4gICAgICAgIGRpc3BhdGNoOiAndmVyc2lvbi9vblVwZGF0ZVN0YXR1cycsXG4gICAgICAgIHBhcmFtczogeyByZWZyZXNoIH0sXG4gICAgICAgIHdhaXQ6IFdhaXRzLm9uVmVyc2lvblJlZnJlc2hcbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgbWFjaGluZVVwZGF0ZVJlZnJlc2ggKG5hbWU/OiBzdHJpbmcpIHtcbiAgICBiYXNlRW1pdChcbiAgICAgICdtYWNoaW5lLnVwZGF0ZS5yZWZyZXNoJywge1xuICAgICAgICBkaXNwYXRjaDogJ3ZlcnNpb24vb25VcGRhdGVTdGF0dXMnLFxuICAgICAgICBwYXJhbXM6IHsgbmFtZSB9LFxuICAgICAgICB3YWl0OiBXYWl0cy5vblZlcnNpb25SZWZyZXNoXG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGFzeW5jIG1hY2hpbmVVcGRhdGVSZWNvdmVyIChuYW1lOiBzdHJpbmcsIGhhcmQgPSBmYWxzZSkge1xuICAgIGNvbnN0IGRpc3BhdGNoID0gbmFtZSA9PT0gJ21vb25yYWtlcidcbiAgICAgID8gJ3ZlcnNpb24vb25VcGRhdGVkTW9vbnJha2VyJ1xuICAgICAgOiBuYW1lID09PSAna2xpcHBlcidcbiAgICAgICAgPyAndmVyc2lvbi9vblVwZGF0ZWRLbGlwcGVyJ1xuICAgICAgICA6ICd2ZXJzaW9uL29uVXBkYXRlZENsaWVudCdcbiAgICBiYXNlRW1pdChcbiAgICAgICdtYWNoaW5lLnVwZGF0ZS5yZWNvdmVyJywge1xuICAgICAgICBkaXNwYXRjaCxcbiAgICAgICAgcGFyYW1zOiB7IG5hbWUsIGhhcmQgfVxuICAgICAgfVxuICAgIClcbiAgfSxcblxuICBhc3luYyBtYWNoaW5lVXBkYXRlTW9vbnJha2VyICgpIHtcbiAgICBiYXNlRW1pdChcbiAgICAgICdtYWNoaW5lLnVwZGF0ZS5tb29ucmFrZXInLCB7XG4gICAgICAgIGRpc3BhdGNoOiAndmVyc2lvbi9vblVwZGF0ZWRNb29ucmFrZXInXG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGFzeW5jIG1hY2hpbmVVcGRhdGVLbGlwcGVyICgpIHtcbiAgICBiYXNlRW1pdChcbiAgICAgICdtYWNoaW5lLnVwZGF0ZS5rbGlwcGVyJywge1xuICAgICAgICBkaXNwYXRjaDogJ3ZlcnNpb24vb25VcGRhdGVkS2xpcHBlcicsXG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIGluY2x1ZGVfZGVwczogdHJ1ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGFzeW5jIG1hY2hpbmVVcGRhdGVDbGllbnQgKG5hbWU6IHN0cmluZykge1xuICAgIGNvbnN0IGRpc3BhdGNoID0gbmFtZSA9PT0gJ2ZsdWlkZCdcbiAgICAgID8gJ3ZlcnNpb24vb25VcGRhdGVkRmx1aWRkJ1xuICAgICAgOiAndmVyc2lvbi9vblVwZGF0ZWRDbGllbnQnXG4gICAgYmFzZUVtaXQoXG4gICAgICAnbWFjaGluZS51cGRhdGUuY2xpZW50Jywge1xuICAgICAgICBkaXNwYXRjaCxcbiAgICAgICAgcGFyYW1zOiB7IG5hbWUgfVxuICAgICAgfVxuICAgIClcbiAgfSxcblxuICBhc3luYyBtYWNoaW5lVXBkYXRlU3lzdGVtICgpIHtcbiAgICBiYXNlRW1pdChcbiAgICAgICdtYWNoaW5lLnVwZGF0ZS5zeXN0ZW0nLCB7XG4gICAgICAgIGRpc3BhdGNoOiAndmVyc2lvbi9vblVwZGF0ZWRTeXN0ZW0nXG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGFzeW5jIG1hY2hpbmVVcGRhdGVBbGwgKCkge1xuICAgIGJhc2VFbWl0KFxuICAgICAgJ21hY2hpbmUudXBkYXRlLmZ1bGwnLCB7XG4gICAgICAgIGRpc3BhdGNoOiAndmVyc2lvbi9vblVwZGF0ZWRBbGwnXG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGFzeW5jIG1hY2hpbmVQcm9jU3RhdHMgKCkge1xuICAgIGJhc2VFbWl0KFxuICAgICAgJ21hY2hpbmUucHJvY19zdGF0cycsIHtcbiAgICAgICAgZGlzcGF0Y2g6ICdzZXJ2ZXIvb25NYWNoaW5lUHJvY1N0YXRzJ1xuICAgICAgfVxuICAgIClcbiAgfSxcblxuICBhc3luYyBtYWNoaW5lU3lzdGVtSW5mbyAoKSB7XG4gICAgYmFzZUVtaXQoXG4gICAgICAnbWFjaGluZS5zeXN0ZW1faW5mbycsIHtcbiAgICAgICAgZGlzcGF0Y2g6ICdzZXJ2ZXIvb25NYWNoaW5lU3lzdGVtSW5mbydcbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgbWFjaGluZURldmljZVBvd2VyRGV2aWNlcyAoKSB7XG4gICAgYmFzZUVtaXQoXG4gICAgICAnbWFjaGluZS5kZXZpY2VfcG93ZXIuZGV2aWNlcycsIHtcbiAgICAgICAgZGlzcGF0Y2g6ICdwb3dlci9vbkluaXQnXG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGFzeW5jIG1hY2hpbmVEZXZpY2VQb3dlclN0YXR1cyAoZGV2aWNlOiBzdHJpbmcpIHtcbiAgICBiYXNlRW1pdChcbiAgICAgICdtYWNoaW5lLmRldmljZV9wb3dlci5zdGF0dXMnLCB7XG4gICAgICAgIGRpc3BhdGNoOiAncG93ZXIvb25TdGF0dXMnLFxuICAgICAgICBwYXJhbXM6IHsgW2RldmljZV06IG51bGwgfVxuICAgICAgfVxuICAgIClcbiAgfSxcblxuICBhc3luYyBtYWNoaW5lRGV2aWNlUG93ZXJUb2dnbGUgKGRldmljZTogc3RyaW5nLCBzdGF0ZTogc3RyaW5nLCB3YWl0Pzogc3RyaW5nKSB7XG4gICAgY29uc3QgZW1pdCA9IChzdGF0ZSA9PT0gJ29uJylcbiAgICAgID8gJ21hY2hpbmUuZGV2aWNlX3Bvd2VyLm9uJ1xuICAgICAgOiAnbWFjaGluZS5kZXZpY2VfcG93ZXIub2ZmJ1xuICAgIGJhc2VFbWl0KFxuICAgICAgZW1pdCwge1xuICAgICAgICBkaXNwYXRjaDogJ3Bvd2VyL29uVG9nZ2xlJyxcbiAgICAgICAgcGFyYW1zOiB7IFtkZXZpY2VdOiBudWxsIH0sXG4gICAgICAgIHdhaXRcbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgbWFjaGluZVBlcmlwaGVyYWxzVXNiICgpIHtcbiAgICBiYXNlRW1pdChcbiAgICAgICdtYWNoaW5lLnBlcmlwaGVyYWxzLnVzYicsIHtcbiAgICAgICAgZGlzcGF0Y2g6ICdzZXJ2ZXIvb25NYWNoaW5lUGVyaXBoZXJhbHMnLFxuICAgICAgICB3YWl0OiBXYWl0cy5vbk1hY2hpbmVQZXJpcGhlcmFsc1VzYlxuICAgICAgfVxuICAgIClcbiAgfSxcblxuICBhc3luYyBtYWNoaW5lUGVyaXBoZXJhbHNTZXJpYWwgKCkge1xuICAgIGJhc2VFbWl0KFxuICAgICAgJ21hY2hpbmUucGVyaXBoZXJhbHMuc2VyaWFsJywge1xuICAgICAgICBkaXNwYXRjaDogJ3NlcnZlci9vbk1hY2hpbmVQZXJpcGhlcmFscycsXG4gICAgICAgIHdhaXQ6IFdhaXRzLm9uTWFjaGluZVBlcmlwaGVyYWxzU2VyaWFsXG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGFzeW5jIG1hY2hpbmVQZXJpcGhlcmFsc1ZpZGVvICgpIHtcbiAgICBiYXNlRW1pdChcbiAgICAgICdtYWNoaW5lLnBlcmlwaGVyYWxzLnZpZGVvJywge1xuICAgICAgICBkaXNwYXRjaDogJ3NlcnZlci9vbk1hY2hpbmVQZXJpcGhlcmFscycsXG4gICAgICAgIHdhaXQ6IFdhaXRzLm9uTWFjaGluZVBlcmlwaGVyYWxzVmlkZW9cbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgbWFjaGluZVBlcmlwaGVyYWxzQ2FuYnVzIChjYW5idXNJbnRlcmZhY2U6IHN0cmluZykge1xuICAgIGNvbnN0IHdhaXQgPSBgJHtXYWl0cy5vbk1hY2hpbmVQZXJpcGhlcmFsc0NhbmJ1c30vJHtjYW5idXNJbnRlcmZhY2V9YFxuICAgIGJhc2VFbWl0KFxuICAgICAgJ21hY2hpbmUucGVyaXBoZXJhbHMuY2FuYnVzJywge1xuICAgICAgICBkaXNwYXRjaDogJ3NlcnZlci9vbk1hY2hpbmVQZXJpcGhlcmFsc0NhbmJ1cycsXG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIGludGVyZmFjZTogY2FuYnVzSW50ZXJmYWNlXG4gICAgICAgIH0sXG4gICAgICAgIHdhaXRcbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgbWFjaGluZVRpbWVsYXBzZVNldFNldHRpbmdzIChzZXR0aW5nczogUGFydGlhbDxUaW1lbGFwc2VXcml0YWJsZVNldHRpbmdzPiwgd2FpdD86IHN0cmluZykge1xuICAgIGJhc2VFbWl0KFxuICAgICAgJ21hY2hpbmUudGltZWxhcHNlLnBvc3Rfc2V0dGluZ3MnLCB7XG4gICAgICAgIGRpc3BhdGNoOiAndGltZWxhcHNlL29uU2V0dGluZ3MnLFxuICAgICAgICBwYXJhbXM6IHNldHRpbmdzLFxuICAgICAgICB3YWl0XG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGFzeW5jIG1hY2hpbmVUaW1lbGFwc2VTYXZlRnJhbWVzICh3YWl0Pzogc3RyaW5nKSB7XG4gICAgYmFzZUVtaXQoXG4gICAgICAnbWFjaGluZS50aW1lbGFwc2Uuc2F2ZWZyYW1lcycsIHtcbiAgICAgICAgd2FpdFxuICAgICAgfVxuICAgIClcbiAgfSxcblxuICBhc3luYyBtYWNoaW5lVGltZWxhcHNlUmVuZGVyICgpIHtcbiAgICBiYXNlRW1pdCgnbWFjaGluZS50aW1lbGFwc2UucmVuZGVyJywge30pXG4gIH0sXG5cbiAgYXN5bmMgcHJpbnRlckluZm8gKCkge1xuICAgIGJhc2VFbWl0KFxuICAgICAgJ3ByaW50ZXIuaW5mbycsIHtcbiAgICAgICAgZGlzcGF0Y2g6ICdwcmludGVyL29uUHJpbnRlckluZm8nXG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGFzeW5jIHByaW50ZXJSZXN0YXJ0ICgpIHtcbiAgICBiYXNlRW1pdChcbiAgICAgICdwcmludGVyLnJlc3RhcnQnLCB7XG4gICAgICAgIGRpc3BhdGNoOiAndm9pZCcsXG4gICAgICAgIHdhaXQ6IFdhaXRzLm9uS2xpcHBlclJlc3RhcnRcbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgcHJpbnRlckZpcm13YXJlUmVzdGFydCAoKSB7XG4gICAgYmFzZUVtaXQoXG4gICAgICAncHJpbnRlci5maXJtd2FyZV9yZXN0YXJ0Jywge1xuICAgICAgICBkaXNwYXRjaDogJ3ZvaWQnLFxuICAgICAgICB3YWl0OiBXYWl0cy5vbktsaXBwZXJGaXJtd2FyZVJlc3RhcnRcbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgcHJpbnRlclF1ZXJ5RW5kc3RvcHMgKCkge1xuICAgIHJldHVybiBiYXNlRW1pdChcbiAgICAgICdwcmludGVyLnF1ZXJ5X2VuZHN0b3BzLnN0YXR1cycsIHtcbiAgICAgICAgZGlzcGF0Y2g6ICdwcmludGVyL29uUXVlcnlFbmRzdG9wcycsXG4gICAgICAgIHdhaXQ6IFdhaXRzLm9uUXVlcnlFbmRzdG9wc1xuICAgICAgfVxuICAgIClcbiAgfSxcblxuICBhc3luYyBwcmludGVyT2JqZWN0c0xpc3QgKCkge1xuICAgIGJhc2VFbWl0KFxuICAgICAgJ3ByaW50ZXIub2JqZWN0cy5saXN0Jywge1xuICAgICAgICBkaXNwYXRjaDogJ3ByaW50ZXIvb25QcmludGVyT2JqZWN0c0xpc3QnXG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGFzeW5jIHByaW50ZXJPYmplY3RzU3Vic2NyaWJlIChvYmplY3RzOiB7W2tleTogc3RyaW5nXTogbnVsbH0pIHtcbiAgICBiYXNlRW1pdChcbiAgICAgICdwcmludGVyLm9iamVjdHMuc3Vic2NyaWJlJywge1xuICAgICAgICBkaXNwYXRjaDogJ3ByaW50ZXIvb25QcmludGVyT2JqZWN0c1N1YnNjcmliZScsXG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIG9iamVjdHNcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcbiAgfSxcblxuICBhc3luYyBwcmludGVyUHJpbnRTdGFydCAocGF0aDogc3RyaW5nKSB7XG4gICAgYmFzZUVtaXQoXG4gICAgICAncHJpbnRlci5wcmludC5zdGFydCcsIHtcbiAgICAgICAgZGlzcGF0Y2g6ICd2b2lkJyxcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgZmlsZW5hbWU6IHBhdGhcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcbiAgfSxcblxuICBhc3luYyBwcmludGVyUHJpbnRDYW5jZWwgKCkge1xuICAgIGJhc2VFbWl0KFxuICAgICAgJ3ByaW50ZXIucHJpbnQuY2FuY2VsJywge1xuICAgICAgICBkaXNwYXRjaDogJ3ByaW50ZXIvb25QcmludENhbmNlbCcsXG4gICAgICAgIHdhaXQ6IFdhaXRzLm9uUHJpbnRDYW5jZWxcbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgcHJpbnRlclByaW50UGF1c2UgKCkge1xuICAgIGJhc2VFbWl0KFxuICAgICAgJ3ByaW50ZXIucHJpbnQucGF1c2UnLCB7XG4gICAgICAgIGRpc3BhdGNoOiAncHJpbnRlci9vblByaW50UGF1c2UnLFxuICAgICAgICB3YWl0OiBXYWl0cy5vblByaW50UGF1c2VcbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgcHJpbnRlclByaW50UmVzdW1lICgpIHtcbiAgICBiYXNlRW1pdChcbiAgICAgICdwcmludGVyLnByaW50LnJlc3VtZScsIHtcbiAgICAgICAgZGlzcGF0Y2g6ICdwcmludGVyL29uUHJpbnRSZXN1bWUnLFxuICAgICAgICB3YWl0OiBXYWl0cy5vblByaW50UmVzdW1lXG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGFzeW5jIHByaW50ZXJHY29kZVNjcmlwdCAoZ2NvZGU6IHN0cmluZywgd2FpdD86IHN0cmluZykge1xuICAgIC8vIEV2ZXJ5IHNjcmlwdCBjb3VudHMgdW50aWwgYW5zd2VyZWQ6IGhhbmQgbW92ZXMgd2FpdCBiZWhpbmQgaXQgKHNhZmUtbW92ZS50cykuXG4gICAgcmV0dXJuIHRyYWNrU2NyaXB0KGJhc2VFbWl0KFxuICAgICAgJ3ByaW50ZXIuZ2NvZGUuc2NyaXB0Jywge1xuICAgICAgICBkaXNwYXRjaDogJ2NvbnNvbGUvb25HY29kZVNjcmlwdCcsXG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIHNjcmlwdDogZ2NvZGVcbiAgICAgICAgfSxcbiAgICAgICAgd2FpdFxuICAgICAgfVxuICAgICkgYXMgUHJvbWlzZTx1bmtub3duPiB8IHVuZGVmaW5lZClcbiAgfSxcblxuICBhc3luYyBwcmludGVyR2NvZGVIZWxwICgpIHtcbiAgICBiYXNlRW1pdChcbiAgICAgICdwcmludGVyLmdjb2RlLmhlbHAnLCB7XG4gICAgICAgIGRpc3BhdGNoOiAnY29uc29sZS9vbkdjb2RlSGVscCdcbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgcHJpbnRlckVtZXJnZW5jeVN0b3AgKCkge1xuICAgIGJhc2VFbWl0KFxuICAgICAgJ3ByaW50ZXIuZW1lcmdlbmN5X3N0b3AnLCB7XG4gICAgICAgIGRpc3BhdGNoOiAndm9pZCdcbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgc2VydmVySW5mbyAoKSB7XG4gICAgYmFzZUVtaXQoXG4gICAgICAnc2VydmVyLmluZm8nLCB7XG4gICAgICAgIGRpc3BhdGNoOiAnc2VydmVyL29uU2VydmVySW5mbydcbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgaWRlbnRpZnkgKHBhcmFtcz86IHsgY2xpZW50X25hbWU6IHN0cmluZywgdmVyc2lvbjogc3RyaW5nLCB0eXBlOiBzdHJpbmcsIHVybDogc3RyaW5nIH0pIHtcbiAgICBiYXNlRW1pdCgnc2VydmVyLmNvbm5lY3Rpb24uaWRlbnRpZnknLCB7XG4gICAgICBkaXNwYXRjaDogJ3NvY2tldC9vbkNvbm5lY3Rpb25JZCcsXG4gICAgICBwYXJhbXNcbiAgICB9KVxuICB9LFxuXG4gIGFzeW5jIHRpbWVsYXBzZVN0YXRlICgpIHtcbiAgICBiYXNlRW1pdChcbiAgICAgICdtYWNoaW5lLnRpbWVsYXBzZS5nZXRfc2V0dGluZ3MnLCB7XG4gICAgICAgIGRpc3BhdGNoOiAndGltZWxhcHNlL29uU2V0dGluZ3MnXG4gICAgICB9XG4gICAgKVxuXG4gICAgYmFzZUVtaXQoXG4gICAgICAnbWFjaGluZS50aW1lbGFwc2UubGFzdGZyYW1laW5mbycsIHtcbiAgICAgICAgZGlzcGF0Y2g6ICd0aW1lbGFwc2Uvb25MYXN0RnJhbWUnXG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGFzeW5jIHNlcnZlckNvbmZpZyAoKSB7XG4gICAgYmFzZUVtaXQoXG4gICAgICAnc2VydmVyLmNvbmZpZycsIHtcbiAgICAgICAgZGlzcGF0Y2g6ICdzZXJ2ZXIvb25TZXJ2ZXJDb25maWcnXG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIC8qKlxuICAgKiBXcml0ZXMgZGF0YSB0byBtb29ucmFrZXIncyBEQi5cbiAgICovXG4gIGFzeW5jIHNlcnZlcldyaXRlIChrZXk6IHN0cmluZywgdmFsdWU6IHVua25vd24sIG5hbWVzcGFjZTogc3RyaW5nID0gR2xvYmFscy5NT09OUkFLRVJfREIuZmx1aWRkLk5BTUVTUEFDRSkge1xuICAgIGJhc2VFbWl0KFxuICAgICAgJ3NlcnZlci5kYXRhYmFzZS5wb3N0X2l0ZW0nLCB7XG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICBrZXksXG4gICAgICAgICAgdmFsdWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcbiAgfSxcblxuICBhc3luYyBzZXJ2ZXJEZWxldGUgKGtleTogc3RyaW5nLCBuYW1lc3BhY2U6IHN0cmluZyA9IEdsb2JhbHMuTU9PTlJBS0VSX0RCLmZsdWlkZC5OQU1FU1BBQ0UpIHtcbiAgICBiYXNlRW1pdChcbiAgICAgICdzZXJ2ZXIuZGF0YWJhc2UuZGVsZXRlX2l0ZW0nLCB7XG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICBrZXlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcbiAgfSxcblxuICBhc3luYyBzZXJ2ZXJSZWFkIChrZXk/OiBzdHJpbmcsIG5hbWVzcGFjZTogc3RyaW5nID0gR2xvYmFscy5NT09OUkFLRVJfREIuZmx1aWRkLk5BTUVTUEFDRSkge1xuICAgIGJhc2VFbWl0KFxuICAgICAgJ3NlcnZlci5kYXRhYmFzZS5nZXRfaXRlbScsIHtcbiAgICAgICAgZGlzcGF0Y2g6ICdzb2NrZXQvb25TZXJ2ZXJSZWFkJyxcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgIGtleVxuICAgICAgICB9XG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGFzeW5jIHNlcnZlclJlc3RhcnQgKCkge1xuICAgIGJhc2VFbWl0KFxuICAgICAgJ3NlcnZlci5yZXN0YXJ0Jywge1xuICAgICAgICBkaXNwYXRjaDogJ3ZvaWQnXG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGFzeW5jIHNlcnZlclRlbXBlcmF0dXJlU3RvcmUgKCkge1xuICAgIGJhc2VFbWl0KFxuICAgICAgJ3NlcnZlci50ZW1wZXJhdHVyZV9zdG9yZScsIHtcbiAgICAgICAgZGlzcGF0Y2g6ICdjaGFydHMvaW5pdFRlbXBTdG9yZScsXG4gICAgICAgIGNhcHR1cmVDb250ZXh0OiB0cnVlLFxuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBpbmNsdWRlX21vbml0b3JzOiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgc2VydmVyR2NvZGVTdG9yZSAoKSB7XG4gICAgYmFzZUVtaXQoXG4gICAgICAnc2VydmVyLmdjb2RlX3N0b3JlJywge1xuICAgICAgICBkaXNwYXRjaDogJ2NvbnNvbGUvb25HY29kZVN0b3JlJ1xuICAgICAgfVxuICAgIClcbiAgfSxcblxuICBhc3luYyBzZXJ2ZXJIaXN0b3J5TGlzdCAocGFyYW1zPzogeyBzdGFydD86IG51bWJlcjsgbGltaXQ/OiBudW1iZXI7IGJlZm9yZT86IG51bWJlcjsgc2luY2U/OiBudW1iZXI7IG9yZGVyPzogc3RyaW5nIH0pIHtcbiAgICBiYXNlRW1pdChcbiAgICAgICdzZXJ2ZXIuaGlzdG9yeS5saXN0Jywge1xuICAgICAgICBkaXNwYXRjaDogJ2hpc3Rvcnkvb25IaXN0b3J5TGlzdCcsXG4gICAgICAgIHBhcmFtc1xuICAgICAgfVxuICAgIClcbiAgfSxcblxuICAvKiogVGhlIGpvYnMgc3RhcnRlZCBzaW5jZSBhIHVuaXggdGltZSwgaW50byBoaXN0b3J5L3llYXJKb2JzIChub3QgdGhlIGxpc3QgSGlzdG9yeSBzaG93cykuICovXG4gIGFzeW5jIHNlcnZlckhpc3RvcnlZZWFyIChzaW5jZTogbnVtYmVyLCBsaW1pdDogbnVtYmVyKSB7XG4gICAgYmFzZUVtaXQoXG4gICAgICAnc2VydmVyLmhpc3RvcnkubGlzdCcsIHtcbiAgICAgICAgZGlzcGF0Y2g6ICdoaXN0b3J5L29uWWVhckxpc3QnLFxuICAgICAgICBwYXJhbXM6IHsgc2luY2UsIGxpbWl0LCBvcmRlcjogJ2Rlc2MnIH1cbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgc2VydmVySGlzdG9yeVRvdGFscyAoKSB7XG4gICAgYmFzZUVtaXQoXG4gICAgICAnc2VydmVyLmhpc3RvcnkudG90YWxzJywge1xuICAgICAgICBkaXNwYXRjaDogJ2hpc3Rvcnkvb25IaXN0b3J5VG90YWxzJ1xuICAgICAgfVxuICAgIClcbiAgfSxcblxuICBhc3luYyBzZXJ2ZXJIaXN0b3J5RGVsZXRlSm9iICh1aWQ6IHN0cmluZykge1xuICAgIGNvbnN0IHBhcmFtcyA9IHVpZCA9PT0gJ2FsbCdcbiAgICAgID8ge1xuICAgICAgICAgIGFsbDogdHJ1ZVxuICAgICAgICB9XG4gICAgICA6IHsgdWlkIH1cblxuICAgIGJhc2VFbWl0KFxuICAgICAgJ3NlcnZlci5oaXN0b3J5LmRlbGV0ZV9qb2InLCB7XG4gICAgICAgIGRpc3BhdGNoOiAnaGlzdG9yeS9vbkRlbGV0ZScsXG4gICAgICAgIHBhcmFtc1xuICAgICAgfVxuICAgIClcbiAgfSxcblxuICBhc3luYyBzZXJ2ZXJIaXN0b3J5UmVzZXRUb3RhbHMgKCkge1xuICAgIGJhc2VFbWl0KFxuICAgICAgJ3NlcnZlci5oaXN0b3J5LnJlc2V0X3RvdGFscycsIHtcbiAgICAgICAgZGlzcGF0Y2g6ICdoaXN0b3J5L29uSGlzdG9yeUNoYW5nZSdcbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgc2VydmVySm9iUXVldWVTdGF0dXMgKCkge1xuICAgIGJhc2VFbWl0KFxuICAgICAgJ3NlcnZlci5qb2JfcXVldWUuc3RhdHVzJywge1xuICAgICAgICBkaXNwYXRjaDogJ2pvYlF1ZXVlL29uSm9iUXVldWVTdGF0dXMnLFxuICAgICAgICB3YWl0OiBXYWl0cy5vbkpvYlF1ZXVlXG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGFzeW5jIHNlcnZlckpvYlF1ZXVlUG9zdEpvYiAoZmlsZW5hbWVzOiBzdHJpbmdbXSwgcmVzZXQ/OiBib29sZWFuKSB7XG4gICAgYmFzZUVtaXQoXG4gICAgICAnc2VydmVyLmpvYl9xdWV1ZS5wb3N0X2pvYicsIHtcbiAgICAgICAgZGlzcGF0Y2g6ICdqb2JRdWV1ZS9vbkpvYlF1ZXVlU3RhdHVzJyxcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgZmlsZW5hbWVzLFxuICAgICAgICAgIHJlc2V0XG4gICAgICAgIH0sXG4gICAgICAgIHdhaXQ6IFdhaXRzLm9uSm9iUXVldWVcbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgc2VydmVySm9iUXVldWVEZWxldGVKb2JzIChqb2JJZHM6IHN0cmluZ1tdKSB7XG4gICAgY29uc3QgcGFyYW1zID0gam9iSWRzLmxlbmd0aCA+IDAgJiYgam9iSWRzWzBdID09PSAnYWxsJ1xuICAgICAgPyB7IGFsbDogdHJ1ZSB9XG4gICAgICA6IHsgam9iX2lkczogam9iSWRzIH1cblxuICAgIGJhc2VFbWl0KFxuICAgICAgJ3NlcnZlci5qb2JfcXVldWUuZGVsZXRlX2pvYicsIHtcbiAgICAgICAgZGlzcGF0Y2g6ICdqb2JRdWV1ZS9vbkpvYlF1ZXVlU3RhdHVzJyxcbiAgICAgICAgcGFyYW1zLFxuICAgICAgICB3YWl0OiBXYWl0cy5vbkpvYlF1ZXVlXG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGFzeW5jIHNlcnZlckpvYlF1ZXVlUGF1c2UgKCkge1xuICAgIGJhc2VFbWl0KFxuICAgICAgJ3NlcnZlci5qb2JfcXVldWUucGF1c2UnLCB7XG4gICAgICAgIGRpc3BhdGNoOiAnam9iUXVldWUvb25Kb2JRdWV1ZVN0YXR1cycsXG4gICAgICAgIHdhaXQ6IFdhaXRzLm9uSm9iUXVldWVcbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgc2VydmVySm9iUXVldWVTdGFydCAoKSB7XG4gICAgYmFzZUVtaXQoXG4gICAgICAnc2VydmVyLmpvYl9xdWV1ZS5zdGFydCcsIHtcbiAgICAgICAgZGlzcGF0Y2g6ICdqb2JRdWV1ZS9vbkpvYlF1ZXVlU3RhdHVzJyxcbiAgICAgICAgd2FpdDogV2FpdHMub25Kb2JRdWV1ZVxuICAgICAgfVxuICAgIClcbiAgfSxcblxuICAvKipcbiAgICogTG9hZHMgdGhlIG1ldGFkYXRhIGZvciBhIGdpdmVuIGZpbGVwYXRoLlxuICAgKiBFeHBlY3RzIHRoZSBmdWxsIHBhdGggaW5jbHVkaW5nIHJvb3QuXG4gICAqIE9wdGlvbmFsbHkgcGFzcyB0aGUganVzdCB0aGUgZmlsZW5hbWUgYW5kIHBhdGguXG4gICAqL1xuICBhc3luYyBzZXJ2ZXJGaWxlc01ldGFkYXRhIChmaWxlcGF0aDogc3RyaW5nKSB7XG4gICAgYmFzZUVtaXQoXG4gICAgICAnc2VydmVyLmZpbGVzLm1ldGFkYXRhJywge1xuICAgICAgICBkaXNwYXRjaDogJ2ZpbGVzL29uRmlsZU1ldGFEYXRhJyxcbiAgICAgICAgcGFyYW1zOiB7IGZpbGVuYW1lOiBmaWxlcGF0aCB9XG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGFzeW5jIHNlcnZlckZpbGVzTWV0YXNjYW4gKGZpbGVwYXRoOiBzdHJpbmcpIHtcbiAgICBiYXNlRW1pdChcbiAgICAgICdzZXJ2ZXIuZmlsZXMubWV0YXNjYW4nLCB7XG4gICAgICAgIGRpc3BhdGNoOiAnZmlsZXMvb25GaWxlTWV0YURhdGEnLFxuICAgICAgICBwYXJhbXM6IHsgZmlsZW5hbWU6IGZpbGVwYXRoIH1cbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgLyoqXG4gICAqIFRoaXMgb25seSByZXF1aXJlcyBwYXRoLCBidXQgd2UgcGFzcyByb290IGFsb25nIHRvb1xuICAgKiBmb3IgYnJldml0eS5cbiAgICovXG4gIGFzeW5jIHNlcnZlckZpbGVzR2V0RGlyZWN0b3J5IChyb290OiBzdHJpbmcsIHBhdGg6IHN0cmluZykge1xuICAgIGNvbnN0IHdhaXQgPSBgJHtXYWl0cy5vbkZpbGVTeXN0ZW19LyR7cm9vdH0vJHtwYXRofS9gXG4gICAgcmV0dXJuIGJhc2VFbWl0KFxuICAgICAgJ3NlcnZlci5maWxlcy5nZXRfZGlyZWN0b3J5JyxcbiAgICAgIHtcbiAgICAgICAgZGlzcGF0Y2g6ICdmaWxlcy9vblNlcnZlckZpbGVzR2V0RGlyZWN0b3J5JyxcbiAgICAgICAgd2FpdCxcbiAgICAgICAgcGFyYW1zOiB7IHJvb3QsIHBhdGgsIGV4dGVuZGVkOiB0cnVlIH1cbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgc2VydmVyRmlsZXNMaXN0Um9vdCAocm9vdDogc3RyaW5nKSB7XG4gICAgY29uc3Qgd2FpdCA9IGAke1dhaXRzLm9uRmlsZVN5c3RlbX0vJHtyb290fS9gXG4gICAgYmFzZUVtaXQoXG4gICAgICAnc2VydmVyLmZpbGVzLmxpc3QnLFxuICAgICAge1xuICAgICAgICBkaXNwYXRjaDogJ2ZpbGVzL29uU2VydmVyRmlsZXNMaXN0Um9vdCcsXG4gICAgICAgIHdhaXQsXG4gICAgICAgIHBhcmFtczogeyByb290IH1cbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgLyoqIE1vdmVzIG9yIHJlbmFtZXMgYSBmaWxlOyBhbnN3ZXJzIE1vb25yYWtlcidzIHJlc3VsdCwgb3Igbm90aGluZyB3aGVuIGl0IHJlZnVzZWQgb3IgdGhlIHNvY2tldCBpcyBub3QgdXAuICovXG4gIGFzeW5jIHNlcnZlckZpbGVzTW92ZSAoc291cmNlOiBzdHJpbmcsIGRlc3Q6IHN0cmluZykge1xuICAgIGNvbnN0IHdhaXQgPSBgJHtXYWl0cy5vbkZpbGVTeXN0ZW19LyR7c291cmNlfS9gXG4gICAgcmV0dXJuIGJhc2VFbWl0KFxuICAgICAgJ3NlcnZlci5maWxlcy5tb3ZlJywge1xuICAgICAgICBkaXNwYXRjaDogJ3ZvaWQnLFxuICAgICAgICB3YWl0LFxuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBzb3VyY2UsXG4gICAgICAgICAgZGVzdFxuICAgICAgICB9XG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGFzeW5jIHNlcnZlckZpbGVzQ29weSAoc291cmNlOiBzdHJpbmcsIGRlc3Q6IHN0cmluZykge1xuICAgIGNvbnN0IHdhaXQgPSBgJHtXYWl0cy5vbkZpbGVTeXN0ZW19LyR7c291cmNlfS9gXG4gICAgYmFzZUVtaXQoXG4gICAgICAnc2VydmVyLmZpbGVzLmNvcHknLCB7XG4gICAgICAgIGRpc3BhdGNoOiAndm9pZCcsXG4gICAgICAgIHdhaXQsXG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIHNvdXJjZSxcbiAgICAgICAgICBkZXN0XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgc2VydmVyRmlsZXNaaXAgKGRlc3Q6IHN0cmluZywgaXRlbXM6IHN0cmluZ1tdLCBzdG9yZV9vbmx5PzogYm9vbGVhbikge1xuICAgIGNvbnN0IHdhaXQgPSBgJHtXYWl0cy5vbkZpbGVTeXN0ZW19LyR7ZGVzdH0vYFxuICAgIGJhc2VFbWl0KFxuICAgICAgJ3NlcnZlci5maWxlcy56aXAnLCB7XG4gICAgICAgIGRpc3BhdGNoOiAndm9pZCcsXG4gICAgICAgIHdhaXQsXG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIGRlc3QsXG4gICAgICAgICAgaXRlbXMsXG4gICAgICAgICAgc3RvcmVfb25seVxuICAgICAgICB9XG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBkaXJlY3RvcnkuXG4gICAqIFJvb3Qgc2hvdWxkIGJlIGluY2x1ZGVkIGluIHRoZSBwYXRoLlxuICAgKi9cbiAgYXN5bmMgc2VydmVyRmlsZXNQb3N0RGlyZWN0b3J5IChwYXRoOiBzdHJpbmcpIHtcbiAgICBjb25zdCB3YWl0ID0gYCR7V2FpdHMub25GaWxlU3lzdGVtfS8ke3BhdGh9L2BcbiAgICBiYXNlRW1pdChcbiAgICAgICdzZXJ2ZXIuZmlsZXMucG9zdF9kaXJlY3RvcnknLCB7XG4gICAgICAgIGRpc3BhdGNoOiAndm9pZCcsXG4gICAgICAgIHdhaXQsXG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIHBhdGhcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcbiAgfSxcblxuICBhc3luYyBzZXJ2ZXJGaWxlc0RlbGV0ZUZpbGUgKHBhdGg6IHN0cmluZykge1xuICAgIGNvbnN0IHdhaXQgPSBgJHtXYWl0cy5vbkZpbGVTeXN0ZW19LyR7cGF0aH0vYFxuICAgIGJhc2VFbWl0KFxuICAgICAgJ3NlcnZlci5maWxlcy5kZWxldGVfZmlsZScsIHtcbiAgICAgICAgZGlzcGF0Y2g6ICd2b2lkJyxcbiAgICAgICAgd2FpdCxcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgcGF0aFxuICAgICAgICB9XG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGFzeW5jIHNlcnZlckZpbGVzRGVsZXRlRGlyZWN0b3J5IChwYXRoOiBzdHJpbmcsIGZvcmNlID0gZmFsc2UpIHtcbiAgICBjb25zdCB3YWl0ID0gYCR7V2FpdHMub25GaWxlU3lzdGVtfS8ke3BhdGh9L2BcbiAgICBiYXNlRW1pdChcbiAgICAgICdzZXJ2ZXIuZmlsZXMuZGVsZXRlX2RpcmVjdG9yeScsIHtcbiAgICAgICAgZGlzcGF0Y2g6ICd2b2lkJyxcbiAgICAgICAgd2FpdCxcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgcGF0aCxcbiAgICAgICAgICBmb3JjZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGFzeW5jIHNlcnZlckFubm91bmNlbWVudHNMaXN0ICgpIHtcbiAgICBiYXNlRW1pdChcbiAgICAgICdzZXJ2ZXIuYW5ub3VuY2VtZW50cy5saXN0Jywge1xuICAgICAgICBkaXNwYXRjaDogJ2Fubm91bmNlbWVudHMvb25Bbm5vdW5jZW1lbnRzTGlzdCdcbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgc2VydmVyQW5ub3VuY2VtZW50c0Rpc21pc3MgKGVudHJ5X2lkOiBzdHJpbmcsIHdha2VfdGltZT86IG51bWJlcikge1xuICAgIGJhc2VFbWl0KFxuICAgICAgJ3NlcnZlci5hbm5vdW5jZW1lbnRzLmRpc21pc3MnLCB7XG4gICAgICAgIGRpc3BhdGNoOiAndm9pZCcsXG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIGVudHJ5X2lkLFxuICAgICAgICAgIHdha2VfdGltZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGFzeW5jIHNlcnZlckxvZ3NSb2xsb3ZlciAoYXBwbGljYXRpb24/OiBzdHJpbmcpIHtcbiAgICBiYXNlRW1pdChcbiAgICAgICdzZXJ2ZXIubG9ncy5yb2xsb3ZlcicsIHtcbiAgICAgICAgZGlzcGF0Y2g6ICdzZXJ2ZXIvb25Mb2dzUm9sbE92ZXInLFxuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBhcHBsaWNhdGlvblxuICAgICAgICB9XG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGFzeW5jIHNlcnZlcldlYmNhbXNMaXN0ICgpIHtcbiAgICBiYXNlRW1pdChcbiAgICAgICdzZXJ2ZXIud2ViY2Ftcy5saXN0Jywge1xuICAgICAgICBkaXNwYXRjaDogJ3dlYmNhbXMvb25XZWJjYW1zTGlzdCdcbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgc2VydmVyV2ViY2Ftc1dyaXRlICh3ZWJjYW06IFdlYmNhbUNvbmZpZykge1xuICAgIGJhc2VFbWl0KFxuICAgICAgJ3NlcnZlci53ZWJjYW1zLnBvc3RfaXRlbScsIHtcbiAgICAgICAgcGFyYW1zOiB3ZWJjYW1cbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgc2VydmVyV2ViY2Ftc0RlbGV0ZSAodWlkOiBzdHJpbmcpIHtcbiAgICBiYXNlRW1pdChcbiAgICAgICdzZXJ2ZXIud2ViY2Ftcy5kZWxldGVfaXRlbScsIHtcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgdWlkXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgc2VydmVyU2Vuc29yc0xpc3QgKCkge1xuICAgIGJhc2VFbWl0KFxuICAgICAgJ3NlcnZlci5zZW5zb3JzLmxpc3QnLCB7XG4gICAgICAgIGRpc3BhdGNoOiAnc2Vuc29ycy9vblNlbnNvcnNMaXN0J1xuICAgICAgfVxuICAgIClcbiAgfSxcblxuICBhc3luYyBzZXJ2ZXJTcG9vbG1hbkdldFNwb29sSWQgKCkge1xuICAgIGJhc2VFbWl0KFxuICAgICAgJ3NlcnZlci5zcG9vbG1hbi5nZXRfc3Bvb2xfaWQnLCB7XG4gICAgICAgIGRpc3BhdGNoOiAnc3Bvb2xtYW4vb25BY3RpdmVTcG9vbCdcbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgYXN5bmMgc2VydmVyU3Bvb2xtYW5Qb3N0U3Bvb2xJZCAoc3Bvb2xJZDogbnVtYmVyIHwgdW5kZWZpbmVkKSB7XG4gICAgYmFzZUVtaXQoXG4gICAgICAnc2VydmVyLnNwb29sbWFuLnBvc3Rfc3Bvb2xfaWQnLCB7XG4gICAgICAgIHBhcmFtczogeyBzcG9vbF9pZDogc3Bvb2xJZCB9LFxuICAgICAgICBkaXNwYXRjaDogJ3Nwb29sbWFuL29uQWN0aXZlU3Bvb2wnXG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGFzeW5jIHNlcnZlclNwb29sbWFuUHJveHlHZXRBdmFpbGFibGVTcG9vbHMgKCkge1xuICAgIGJhc2VFbWl0KFxuICAgICAgJ3NlcnZlci5zcG9vbG1hbi5wcm94eScsIHtcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgcmVxdWVzdF9tZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIHBhdGg6ICcvdjEvc3Bvb2wnLFxuICAgICAgICAgIHVzZV92Ml9yZXNwb25zZTogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBkaXNwYXRjaDogJ3Nwb29sbWFuL29uQXZhaWxhYmxlU3Bvb2xzJ1xuICAgICAgfVxuICAgIClcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFNBQVM7QUFDaEIsU0FBUyxTQUFTLGFBQWE7QUFFL0IsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsbUJBQW1CO0FBSTVCLE1BQU0sV0FBVyxDQUFDLFFBQWdCLFlBQTJCO0FBQzNELE1BQUksQ0FBQyxJQUFJLFNBQVM7QUFDaEIsWUFBUSxLQUFLLHlDQUF5QyxRQUFRLE9BQU87QUFDckU7QUFBQSxFQUNGO0FBQ0EsU0FBTyxJQUFJLFFBQVEsS0FBSyxRQUFRLE9BQU87QUFDekM7QUFFTyxhQUFNLGdCQUFnQjtBQUFBLEVBQzNCLE1BQU0sdUJBQXdCLFNBQWlCO0FBQzdDLFVBQU0sT0FBTyxNQUFNO0FBQ25CO0FBQUEsTUFDRTtBQUFBLE1BQTRCO0FBQUEsUUFDMUIsVUFBVTtBQUFBLFFBQ1YsUUFBUSxFQUFFLFFBQVE7QUFBQSxRQUNsQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBTSxxQkFBc0IsU0FBaUI7QUFDM0MsVUFBTSxPQUFPLE1BQU07QUFDbkI7QUFBQSxNQUNFO0FBQUEsTUFBMEI7QUFBQSxRQUN4QixVQUFVO0FBQUEsUUFDVixRQUFRLEVBQUUsUUFBUTtBQUFBLFFBQ2xCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFNLG9CQUFxQixTQUFpQjtBQUMxQyxVQUFNLE9BQU8sTUFBTTtBQUNuQjtBQUFBLE1BQ0U7QUFBQSxNQUF5QjtBQUFBLFFBQ3ZCLFVBQVU7QUFBQSxRQUNWLFFBQVEsRUFBRSxRQUFRO0FBQUEsUUFD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