export default function WorkerWrapper(options) {
            return new Worker(
              "/src/workers/parseGcode.worker.ts?worker_file&type=module",
              {
          type: "module",
          name: options?.name
        }
            );
          }