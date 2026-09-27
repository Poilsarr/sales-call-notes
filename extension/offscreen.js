/* Gauge - Offscreen audio capture (Part 3B).
 *
 * Owns the meeting-audio MediaRecorder at 32kbps Opus. Created lazily by the
 * service worker on the user's Record click and torn down on Stop, because
 * MV3 service workers are killed after ~30s and cannot hold a MediaStream.
 *
 * Flow: OFFSCREEN_START_AUDIO { streamId?, meetingTitle } -> getUserMedia on
 * the tab stream (getDisplayMedia fallback) -> MediaRecorder timeslices
 * (CHUNK_TIMESLICE_MS) buffered in memory -> on stop: single Blob ->
 * POST /api/upload-url (Bearer) -> PUT presignedUrl with backoff ->
 * POST /api/analyze { blobUrl } (Bearer) -> OFFSCREEN_DONE { id, callUrl }.
 * Vercel Blob presigned PUTs are atomic, so "chunked" here means timesliced
 * capture + chunk-plan progress + per-attempt backoff (see shared.js).
 * If the Bearer backend is not reachable, emits OFFSCREEN_ERROR with
 * manual-upload instructions instead of failing silently.
 */
import {
  AUDIO_BITRATE_BPS,
  AUDIO_CONTENT_TYPE,
  AUDIO_MIME_TYPE,
  CHUNK_TIMESLICE_MS,
  MESSAGE_TYPES,
  buildAnalyzeEndpoint,
  buildBearerHeaders,
  buildCallDetailUrl,
  buildManualUploadInstructions,
  buildUploadUrlEndpoint,
  fetchWithBackoff,
  getApiKeyFromSession,
  getChunkPlan,
} from "./shared.js";

let recorder = null;
let mediaStream = null;
let slices = [];
let recording = false;
let meetingTitle = "";
let startedAt = 0;

function hasChrome() {
  return typeof chrome !== "undefined" && !!chrome.runtime;
}

function send(message) {
  if (!hasChrome() || !chrome.runtime?.sendMessage) return;
  try {
    chrome.runtime.sendMessage(message);
  } catch (error) {
    console.warn("[Gauge:offscreen] send failed", error);
  }
}

function reportProgress(loadedBytes, totalBytes, chunkCount) {
  send({
    type: MESSAGE_TYPES.OFFSCREEN_CHUNK,
    loadedBytes,
    totalBytes,
    chunkCount,
    meetingTitle,
  });
}

function pickMimeType() {
  try {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(AUDIO_MIME_TYPE)) {
      return AUDIO_MIME_TYPE;
    }
  } catch {
    // fall through to the default
  }
  return "";
}

async function acquireStream(streamId) {
  if (!navigator?.mediaDevices) throw new Error("media devices unavailable");
  if (streamId) {
    // Tab-audio path: the service worker mints streamId via
    // chrome.tabCapture.getMediaStreamId for the meeting tab.
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: "tab",
            chromeMediaSourceId: streamId,
          },
        },
        video: false,
      });
    } catch (error) {
      console.warn("[Gauge:offscreen] tab stream failed, falling back", error);
    }
  }
  // Fallback: user picks the meeting tab with audio sharing enabled.
  return await navigator.mediaDevices.getDisplayMedia({ audio: true, video: false });
}

async function startCapture({ streamId, meetingTitle: title }) {
  if (recording) return { ok: true, already: true };
  const apiKey = await getApiKeyFromSession();
  if (!apiKey) {
    const error = "No API key in session storage. Paste your Bearer key in the side panel first.";
    send({ type: MESSAGE_TYPES.OFFSCREEN_ERROR, message: error, manual: buildManualUploadInstructions() });
    return { ok: false, error };
  }
  mediaStream = await acquireStream(streamId);
  meetingTitle = typeof title === "string" ? title.slice(0, 200) : "";
  slices = [];
  startedAt = Date.now();

  const mimeType = pickMimeType();
  recorder = new MediaRecorder(
    mediaStream,
    {
      ...(mimeType ? { mimeType } : {}),
      audioBitsPerSecond: AUDIO_BITRATE_BPS,
    },
  );
  recorder.ondataavailable = (event) => {
    if (event?.data && event.data.size > 0) {
      slices.push(event.data);
      const loaded = slices.reduce((sum, part) => sum + part.size, 0);
      reportProgress(loaded, loaded, slices.length);
    }
  };
  recorder.onstop = () => {
    finalizeUpload().catch((error) => {
      console.warn("[Gauge:offscreen] finalize failed", error);
      send({
        type: MESSAGE_TYPES.OFFSCREEN_ERROR,
        message: error?.message || "Upload failed",
        manual: buildManualUploadInstructions(),
      });
    });
  };
  recorder.start(CHUNK_TIMESLICE_MS);
  recording = true;
  send({ type: MESSAGE_TYPES.RECORDING_STATUS, recording: true, meetingTitle });
  return { ok: true };
}

async function stopCapture() {
  if (!recording) {
    teardown();
    return { ok: true, empty: true };
  }
  recording = false;
  await new Promise((resolve) => {
    try {
      if (recorder && recorder.state !== "inactive") {
        // Wrap (do not clobber) the onstop hook installed at start, which
        // runs finalizeUpload fire-and-forget; completion is reported via
        // OFFSCREEN_DONE / OFFSCREEN_ERROR messages.
        const previousOnStop = recorder.onstop;
        recorder.onstop = (event) => {
          try {
            previousOnStop?.call(recorder, event);
          } catch {
            // finalize hook already guards its own errors
          }
          resolve();
        };
        recorder.stop();
      } else {
        resolve();
      }
    } catch {
      resolve();
    }
  });
  return { ok: true };
}

function teardown() {
  try {
    if (mediaStream) {
      for (const track of mediaStream.getTracks()) track.stop();
    }
  } catch {
    // best effort
  }
  mediaStream = null;
  recorder = null;
  recording = false;
}

async function finalizeUpload() {
  const apiKey = await getApiKeyFromSession();
  const blob = new Blob(slices, { type: AUDIO_CONTENT_TYPE });
  slices = [];
  teardown();
  if (!apiKey) {
    send({ type: MESSAGE_TYPES.OFFSCREEN_ERROR, message: "API key missing at finalize", manual: buildManualUploadInstructions() });
    return;
  }
  if (blob.size === 0) {
    send({ type: MESSAGE_TYPES.OFFSCREEN_DONE, empty: true, meetingTitle });
    return;
  }

  // Chunk plan drives progress reporting; the presigned PUT itself is atomic.
  const plan = getChunkPlan(blob.size);
  reportProgress(0, blob.size, plan.length);

  const filename = `meeting-${new Date(startedAt || Date.now()).toISOString().replace(/[:.]/g, "-")}.webm`;
  const uploadRes = await fetchWithBackoff(
    buildUploadUrlEndpoint(),
    {
      method: "POST",
      headers: buildBearerHeaders(apiKey),
      body: JSON.stringify({ filename, fileSize: blob.size, contentType: AUDIO_CONTENT_TYPE }),
    },
  );
  if (!uploadRes.ok) {
    throw new Error(
      uploadRes.status === 401 || uploadRes.status === 403
        ? "API key rejected (401/403). Re-paste a fresh key from POST /api/v1/keys/exchange."
        : `upload-url failed (${uploadRes.status}). ${buildManualUploadInstructions()}`,
    );
  }
  const { presignedUrl, blobUrl } = await uploadRes.json();
  if (!presignedUrl || !blobUrl) throw new Error("upload-url returned no presignedUrl/blobUrl");

  reportProgress(blob.size, blob.size, plan.length);
  const putRes = await fetchWithBackoff(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": AUDIO_CONTENT_TYPE },
    body: blob,
  });
  if (!putRes.ok) throw new Error(`audio PUT failed (${putRes.status})`);

  const analyzeRes = await fetchWithBackoff(buildAnalyzeEndpoint(), {
    method: "POST",
    headers: buildBearerHeaders(apiKey),
    body: JSON.stringify({ blobUrl, filename, meetingTitle }),
  });
  if (!analyzeRes.ok) {
    throw new Error(
      analyzeRes.status === 401 || analyzeRes.status === 403
        ? "API key rejected by /api/analyze. Re-paste a fresh key."
        : `analyze failed (${analyzeRes.status}). Audio is stored; retry Send from the side panel.`,
    );
  }
  const result = await analyzeRes.json();
  // Response shape incl. id (see src/app/api/analyze/route.ts).
  send({
    type: MESSAGE_TYPES.OFFSCREEN_DONE,
    id: result?.id || null,
    callUrl: result?.id ? buildCallDetailUrl(result.id) : "",
    meetingTitle,
  });
}

if (hasChrome() && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message.type !== "string") return false;
    if (message.type === MESSAGE_TYPES.OFFSCREEN_START_AUDIO) {
      startCapture(message)
        .then((result) => sendResponse?.(result))
        .catch((error) =>
          sendResponse?.({ ok: false, error: error?.message || "capture failed" }),
        );
      return true;
    }
    if (message.type === MESSAGE_TYPES.OFFSCREEN_STOP_AUDIO) {
      stopCapture()
        .then((result) => {
          // finalizeUpload runs from the recorder onstop hook; for the
          // empty case there is nothing to finalize.
          if (result?.empty) finalizeUpload().catch(() => {});
          sendResponse?.(result);
        })
        .catch((error) =>
          sendResponse?.({ ok: false, error: error?.message || "stop failed" }),
        );
      return true;
    }
    return false;
  });
}

export const __offscreenInternals = { pickMimeType };
