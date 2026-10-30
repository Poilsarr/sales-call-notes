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
let micStream = null;
let audioContext = null;
let slices = [];
let recording = false;
let meetingTitle = "";
let startedAt = 0;
let lastRecordedBlob = null;
let lastDownloadUrl = null;
let analyserInterval = null;
let micAnalyser = null;
let silentSince = null;

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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: "tab",
            chromeMediaSourceId: streamId,
          },
        },
        video: false,
      });
      if (stream && stream.getAudioTracks().length > 0) {
        return { stream, source: "tab" };
      }
    } catch (error) {
      console.debug("[Gauge:offscreen] tab stream unavailable, falling back to mic", error);
    }
  }

  // Fallback to microphone directly (never getDisplayMedia in offscreen document)
  try {
    const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
    return { stream: mic, source: "mic" };
  } catch (micErr) {
    console.debug("[Gauge:offscreen] mic fallback notice:", micErr);
    const err = new Error("Unable to capture audio. Please ensure microphone permissions are granted.");
    err.needsMicPermission = true;
    throw err;
  }
}

async function startCapture({ streamId, meetingTitle: title }) {
  if (recording) return { ok: true, already: true };
  const apiKey = await getApiKeyFromSession();
  if (!apiKey) {
    console.debug("[Gauge:offscreen] Starting capture without API key; will record locally");
  }
  let streamInfo;
  try {
    streamInfo = await acquireStream(streamId);
  } catch (err) {
    return {
      ok: false,
      error: err.message || "Failed to acquire audio stream",
      needsMicPermission: Boolean(err.needsMicPermission),
    };
  }
  const rawStream = streamInfo.stream;
  const streamSource = streamInfo.source;

  meetingTitle = typeof title === "string" ? title.slice(0, 200) : "";
  slices = [];
  startedAt = Date.now();
  lastRecordedBlob = null;
  if (lastDownloadUrl) {
    try { URL.revokeObjectURL(lastDownloadUrl); } catch {}
    lastDownloadUrl = null;
  }

  let recordStream = rawStream;

  if (streamSource === "tab") {
    // 1. Loopback rawStream to speakers so user can hear call participants.
    // 2. Mix user's microphone with tab audio so both sides of the call are recorded.
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioContext = new AudioCtx();
        const tabSource = audioContext.createMediaStreamSource(rawStream);
        tabSource.connect(audioContext.destination);

        try {
          if (navigator.mediaDevices?.getUserMedia) {
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const micSource = audioContext.createMediaStreamSource(micStream);
            micAnalyser = audioContext.createAnalyser();
            micAnalyser.fftSize = 64;
            micSource.connect(micAnalyser);
            const mixedDestination = audioContext.createMediaStreamDestination();
            tabSource.connect(mixedDestination);
            micSource.connect(mixedDestination);
            recordStream = mixedDestination.stream;
          }
        } catch (micErr) {
          console.debug("[Gauge:offscreen] Mic capture unavailable, recording tab audio only", micErr);
        }
      }
    } catch (audioCtxErr) {
      console.debug("[Gauge:offscreen] Web Audio setup failed, using raw stream", audioCtxErr);
    }
  } else {
    // Mic-only stream (e.g. testing in lobby or single speaker)
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioContext = new AudioCtx();
        const micSource = audioContext.createMediaStreamSource(rawStream);
        micAnalyser = audioContext.createAnalyser();
        micAnalyser.fftSize = 64;
        micSource.connect(micAnalyser);
      }
    } catch (audioCtxErr) {
      console.debug("[Gauge:offscreen] Mic analyzer setup notice", audioCtxErr);
    }
  }

  mediaStream = recordStream;

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
      console.debug("[Gauge:offscreen] finalize failed", error);
      send({
        type: MESSAGE_TYPES.OFFSCREEN_ERROR,
        message: error?.message || "Upload failed",
        manual: buildManualUploadInstructions(),
        downloadUrl: lastDownloadUrl,
      });
    });
  };
  recorder.start(CHUNK_TIMESLICE_MS);
  recording = true;
  startAudioHealthMonitor();
  send({ type: MESSAGE_TYPES.RECORDING_STATUS, recording: true, meetingTitle });
  return { ok: true };
}

function startAudioHealthMonitor() {
  if (analyserInterval) clearInterval(analyserInterval);
  silentSince = null;
  analyserInterval = setInterval(() => {
    if (!recording) return;
    let micLevel = 0;
    let frequencyData = [0, 0, 0, 0, 0, 0];
    let isMicSilent = false;

    if (micAnalyser) {
      const dataArray = new Uint8Array(micAnalyser.frequencyBinCount);
      micAnalyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = dataArray.length ? sum / dataArray.length : 0;
      micLevel = Math.min(100, Math.round((avg / 255) * 100));

      const binStep = Math.max(1, Math.floor(dataArray.length / 6));
      frequencyData = [0, 1, 2, 3, 4, 5].map((idx) => {
        const val = dataArray[idx * binStep] || 0;
        return Math.min(100, Math.round((val / 255) * 100));
      });

      if (micLevel < 3) {
        if (!silentSince) silentSince = Date.now();
        else if (Date.now() - silentSince > 10000) {
          isMicSilent = true;
        }
      } else {
        silentSince = null;
      }
    }

    send({
      type: MESSAGE_TYPES.AUDIO_HEALTH_UPDATE,
      micLevel,
      frequencyData,
      isMicSilent,
      elapsedSeconds: Math.floor((Date.now() - startedAt) / 1000),
    });
  }, 100);
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
        try {
          if (recorder.state === "recording") {
            recorder.requestData();
          }
        } catch (e) {
          console.debug("[Gauge:offscreen] requestData notice", e);
        }
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
  if (analyserInterval) {
    clearInterval(analyserInterval);
    analyserInterval = null;
  }
  micAnalyser = null;
  silentSince = null;

  try {
    if (micStream) {
      for (const track of micStream.getTracks()) track.stop();
    }
  } catch {}
  micStream = null;

  try {
    if (mediaStream) {
      for (const track of mediaStream.getTracks()) track.stop();
    }
  } catch {}
  mediaStream = null;

  try {
    if (audioContext && audioContext.state !== "closed") {
      audioContext.close();
    }
  } catch {}
  audioContext = null;

  recorder = null;
  recording = false;
}

async function finalizeUpload() {
  let apiKey = await getApiKeyFromSession();
  const blob = new Blob(slices, { type: AUDIO_CONTENT_TYPE });
  lastRecordedBlob = blob;
  teardown();

  if (blob.size === 0) {
    slices = [];
    send({ type: MESSAGE_TYPES.OFFSCREEN_DONE, empty: true, meetingTitle });
    return;
  }

  try {
    lastDownloadUrl = URL.createObjectURL(blob);
  } catch {}

  const filename = `meeting-${new Date(startedAt || Date.now()).toISOString().replace(/[:.]/g, "-")}.webm`;

  // If apiKey is null, proactively request background to auto-exchange from Clerk session
  if (!apiKey) {
    try {
      const authRes = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "ENSURE_API_KEY" }, resolve);
      });
      if (authRes?.apiKey) {
        apiKey = authRes.apiKey;
        await setApiKeyInSession(apiKey);
      }
    } catch (e) {
      console.warn("[Gauge:offscreen] ENSURE_API_KEY failed", e);
    }
  }

  if (!apiKey) {
    send({
      type: MESSAGE_TYPES.OFFSCREEN_ERROR,
      message: "Audio recording saved locally. Connect your Gauge account to generate AI notes.",
      manual: "Click 'Connect Gauge Account' in the side panel or download the recording.",
      downloadUrl: lastDownloadUrl,
      filename,
    });
    return;
  }

  // Chunk plan drives progress reporting; the presigned PUT itself is atomic.
  const plan = getChunkPlan(blob.size);
  reportProgress(0, blob.size, plan.length);

  let transcript = "";
  try {
    const stored = await new Promise((resolve) => {
      chrome.storage.local.get({ lastMeetingCaptions: [] }, resolve);
    });
    if (stored?.lastMeetingCaptions && Array.isArray(stored.lastMeetingCaptions) && stored.lastMeetingCaptions.length > 0) {
      transcript = stored.lastMeetingCaptions
        .map((c) => (c.speaker ? `${c.speaker}: ${c.text}` : c.text))
        .join("\n");
    }
  } catch {}

  try {
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
      body: JSON.stringify({ blobUrl, filename, meetingTitle, transcript }),
    });
    if (!analyzeRes.ok) {
      console.warn(`[Gauge:offscreen] /api/analyze failed (${analyzeRes.status}), attempting direct call persistence fallback`);
      try {
        const fallbackRes = await fetch(`${APP_ORIGIN}/api/calls`, {
          method: "POST",
          headers: buildBearerHeaders(apiKey),
          body: JSON.stringify({
            filename,
            transcript: transcript || `Call recorded (${filename}). Audio URL: ${blobUrl}`,
            duration: Math.floor((Date.now() - (startedAt || Date.now())) / 1000),
            source: "extension",
          }),
        });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          slices = [];
          send({
            type: MESSAGE_TYPES.OFFSCREEN_DONE,
            id: fallbackData?.id || null,
            callUrl: fallbackData?.id ? buildCallDetailUrl(fallbackData.id) : "",
            meetingTitle,
            summary: transcript ? transcript.slice(0, 300) : "Meeting audio and transcript recorded.",
            actionItems: [],
            healthScore: null,
          });
          return;
        }
      } catch (fallbackErr) {
        console.warn("[Gauge:offscreen] Fallback call persistence failed", fallbackErr);
      }
      throw new Error(
        analyzeRes.status === 401 || analyzeRes.status === 403
          ? "API key rejected by /api/analyze. Re-paste a fresh key."
          : `analyze failed (${analyzeRes.status}). Audio is stored; retry Send from the side panel.`,
      );
    }
    const result = await analyzeRes.json();
    // On success: clear slices
    slices = [];
    send({
      type: MESSAGE_TYPES.OFFSCREEN_DONE,
      id: result?.id || null,
      callUrl: result?.id ? buildCallDetailUrl(result.id) : "",
      meetingTitle,
      summary: result?.summary || "",
      actionItems: result?.actionItems || [],
      healthScore: result?.healthScore ?? null,
    });
  } catch (error) {
    console.warn("[Gauge:offscreen] Upload error; retaining audio for download fallback", error);
    send({
      type: MESSAGE_TYPES.OFFSCREEN_ERROR,
      message: error?.message || "Upload failed",
      manual: buildManualUploadInstructions(),
      downloadUrl: lastDownloadUrl,
      filename,
    });
  }
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
    if (message.type === "OFFSCREEN_FORCE_FINALIZE") {
      if (recording) {
        stopCapture()
          .then(() => sendResponse?.({ ok: true }))
          .catch((e) => sendResponse?.({ ok: false, error: e?.message }));
      } else {
        finalizeUpload()
          .then(() => sendResponse?.({ ok: true }))
          .catch((e) => sendResponse?.({ ok: false, error: e?.message }));
      }
      return true;
    }
    return false;
  });
}

export const __offscreenInternals = { pickMimeType };
