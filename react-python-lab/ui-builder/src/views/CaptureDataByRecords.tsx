import { useAppContext } from "../hooks/common";

export function CaptureDataByRecords() {
  const ctx = useAppContext();
  const url = new URL(
    ctx?.settings?.originalUserDiff || import.meta.env.VITE_ORIGINAL_USER_DIFF,
    ctx?.settings?.originalDatabaseDiffUrl
  );
  return (
    <>
      <iframe src={url.toString()} className="w-full h-full"></iframe>
    </>
  );
}
