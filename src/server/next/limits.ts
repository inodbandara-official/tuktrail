import { env } from "../env";
import type { UploadLimits } from "../services/uploads";

export function uploadLimits(): UploadLimits {
  const e = env();
  return {
    maxFiles: e.UPLOAD_MAX_FILES,
    maxBytes: e.UPLOAD_MAX_BYTES,
    submissionsPerDay: e.UPLOAD_SUBMISSIONS_PER_DAY,
  };
}
